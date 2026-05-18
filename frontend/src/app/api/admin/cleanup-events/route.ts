import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { commonCronAuth } from '@/lib/event-upsert';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// DELETE events filtered by external_source or city or null-source.
// Auth: same as cron (Bearer CRON_SECRET o ?key=CRON_DEBUG_KEY)
//
// Query params:
//   sources=tiktok,gemini-cdmx-grounded   sources a borrar (comma-separated)
//   includeNull=1                         tambien borrar external_source IS NULL
//   city=cdmx                             solo eventos de esta ciudad slug
//   onlyFuture=1                          solo borrar futuros (default 0 = todos)
//   dryRun=1                              cuenta sin borrar
//   confirm=YES                           requerido si dryRun no esta presente

export async function POST(req: NextRequest) {
  return handleCleanup(req);
}
export async function GET(req: NextRequest) {
  return handleCleanup(req);
}

async function handleCleanup(req: NextRequest) {
  if (!commonCronAuth(req, req.nextUrl)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const sourcesParam = sp.get('sources') || '';
  const sources = sourcesParam
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const includeNull = sp.get('includeNull') === '1';
  const cityParam = sp.get('city');
  const onlyFuture = sp.get('onlyFuture') === '1';
  const dryRun = sp.get('dryRun') === '1';
  const confirm = sp.get('confirm');

  if (!dryRun && confirm !== 'YES') {
    return NextResponse.json(
      { error: 'Add confirm=YES or dryRun=1' },
      { status: 400 }
    );
  }

  let cityId: number | null = null;
  if (cityParam) {
    const { data: c } = await supabase
      .from('cities')
      .select('id')
      .eq('slug', cityParam)
      .maybeSingle();
    cityId = c?.id ?? null;
    if (!cityId) {
      return NextResponse.json({ error: `city '${cityParam}' not found` }, { status: 404 });
    }
  }

  // 1. Construir el filtro como query
  const buildQuery = (op: 'select' | 'delete') => {
    let q =
      op === 'select'
        ? supabase.from('events').select('id, slug, title, external_source, date', { count: 'exact', head: false })
        : supabase.from('events').delete();
    if (cityId) q = q.eq('city_id', cityId);
    if (onlyFuture) q = q.gte('date', new Date().toISOString().slice(0, 10));

    // Source filter: sources non-empty AND/OR includeNull
    if (sources.length > 0 && includeNull) {
      // (external_source IN sources) OR (external_source IS NULL)
      const list = sources.map((s) => `external_source.eq.${s}`).join(',');
      q = q.or(`${list},external_source.is.null`);
    } else if (sources.length > 0) {
      q = q.in('external_source', sources);
    } else if (includeNull) {
      q = q.is('external_source', null);
    } else {
      throw new Error('Provide at least sources= or includeNull=1');
    }
    return q;
  };

  // 2. Preview / count
  let previewQuery;
  try {
    previewQuery = buildQuery('select');
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
  const { data: previewRows, count, error: previewErr } = await previewQuery.limit(20);
  if (previewErr) {
    // si falla la columna external_source (deploy viejo), reportar
    return NextResponse.json({ error: previewErr.message }, { status: 500 });
  }

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      matched: count ?? 0,
      sample: previewRows || [],
      filter: { sources, includeNull, city: cityParam, onlyFuture },
    });
  }

  // 3. Delete
  let delQuery;
  try {
    delQuery = buildQuery('delete');
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
  const { error: delErr, count: delCount } = await delQuery;
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  // 4. Revalidate
  try {
    await fetch('https://ctxplorer.com/api/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths: ['/sitemap.xml', '/', '/mx', '/cdmx'] }),
    });
  } catch {}

  return NextResponse.json({
    ok: true,
    deleted: delCount ?? (count ?? 0),
    filter: { sources, includeNull, city: cityParam, onlyFuture },
  });
}
