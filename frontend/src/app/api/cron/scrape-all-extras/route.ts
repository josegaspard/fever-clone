import { NextRequest, NextResponse } from 'next/server';
import { commonCronAuth } from '@/lib/event-upsert';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

// Llama secuencialmente a todos los scrapers individuales que no entraron al cron limit.
// Se invoca via cron diario, pero cada endpoint sigue siendo callable directamente.
const PIPELINE: Array<{ name: string; path: string; timeoutMs: number }> = [
  { name: 'cartelera-cdmx', path: '/api/cron/scrape-cartelera-cdmx?max=150&onlyFree=1', timeoutMs: 240_000 },
  { name: 'unam', path: '/api/cron/scrape-unam?max=80&onlyFree=1', timeoutMs: 240_000 },
  { name: 'eventbrite', path: '/api/cron/scrape-eventbrite?max=30', timeoutMs: 240_000 },
  { name: 'free-cdmx', path: '/api/cron/scrape-free-cdmx', timeoutMs: 240_000 },
];

async function callInternal(
  base: string,
  pathWithQs: string,
  authHeader: string,
  timeoutMs: number
): Promise<{ ok: boolean; status: number; ms: number; body: unknown }> {
  const t0 = Date.now();
  try {
    const res = await fetch(`${base}${pathWithQs}`, {
      method: 'GET',
      headers: {
        authorization: authHeader,
        'user-agent': 'ctxplorer-orchestrator/1.0',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
    const text = await res.text();
    let body: unknown = text;
    try {
      body = JSON.parse(text);
    } catch {}
    return { ok: res.ok, status: res.status, ms: Date.now() - t0, body };
  } catch (e) {
    return { ok: false, status: 0, ms: Date.now() - t0, body: (e as Error).message };
  }
}

export async function GET(req: NextRequest) {
  if (!commonCronAuth(req, req.nextUrl)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Base URL para llamar a los otros endpoints
  const host = req.headers.get('host') || 'ctxplorer.com';
  const proto = host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https';
  const base = `${proto}://${host}`;

  // Reusar el bearer que recibimos (CRON_SECRET) para llamadas internas.
  // Si nos llamaron via x-vercel-cron, propagamos CRON_SECRET explicitamente.
  const auth = req.headers.get('authorization');
  const authHeader = auth || `Bearer ${process.env.CRON_SECRET || ''}`;
  // Si nos llamaron via ?key=, propagamos ese query param a los hijos
  const debugKey = req.nextUrl.searchParams.get('key');
  const keyQs = debugKey ? `${debugKey}` : '';

  const onlyParam = req.nextUrl.searchParams.get('only'); // p.ej. only=eventbrite,unam
  const onlySet = onlyParam ? new Set(onlyParam.split(',').map((s) => s.trim())) : null;

  // Hobby plan: 300s max por funcion. Cada child es serverless independiente con su propio budget,
  // asi que los disparamos en paralelo. Si el orchestrator muere antes de terminar de esperar,
  // los hijos siguen vivos y persistiendo en DB.
  const steps = PIPELINE.filter((s) => !onlySet || onlySet.has(s.name));
  const promises = steps.map((step) => {
    const pathWithKey = keyQs
      ? step.path + (step.path.includes('?') ? '&' : '?') + `key=${encodeURIComponent(keyQs)}`
      : step.path;
    return callInternal(base, pathWithKey, authHeader, Math.min(step.timeoutMs, 280_000)).then(
      (r) => [step.name, r] as const
    );
  });
  const settled = await Promise.allSettled(promises);
  const results: Record<string, unknown> = {};
  settled.forEach((s, i) => {
    const name = steps[i].name;
    if (s.status === 'fulfilled') results[name] = s.value[1];
    else results[name] = { ok: false, status: 0, ms: 0, body: String(s.reason) };
  });

  return NextResponse.json({
    ok: true,
    base,
    pipeline: Object.keys(results),
    results,
  });
}
