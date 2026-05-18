import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { downloadAndStoreImage } from '@/lib/event-image';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
// Solo modelos con google_search grounding habilitado
const GROUNDED_MODELS = ['gemini-2.5-pro', 'gemini-2.5-flash'];

interface ScrapedEvent {
  title: string;
  date: string; // YYYY-MM-DD
  time?: string | null; // HH:MM
  duration?: string | null;
  address: string;
  description: string;
  short_description?: string;
  category: string; // slug de categories ctxplorer
  image_url?: string | null;
  source_url?: string | null;
  lat?: number | null;
  lng?: number | null;
}

function getTodayInTZ(tz = 'America/Mexico_City'): {
  date: string;
  dayName: string;
  monthName: string;
  day: number;
} {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = fmt.formatToParts(new Date());
  const y = parts.find((p) => p.type === 'year')!.value;
  const m = parts.find((p) => p.type === 'month')!.value;
  const d = parts.find((p) => p.type === 'day')!.value;
  const date = `${y}-${m}-${d}`;
  const dObj = new Date(`${date}T12:00:00Z`);
  const dayName = [
    'domingo',
    'lunes',
    'martes',
    'miercoles',
    'jueves',
    'viernes',
    'sabado',
  ][dObj.getUTCDay()];
  const monthName = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ][dObj.getUTCMonth()];
  return { date, dayName, monthName, day: dObj.getUTCDate() };
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 96);
}

function buildPrompt(daysAhead: number): string {
  const today = getTodayInTZ();
  const start = today.date;
  const endDate = new Date(`${today.date}T12:00:00Z`);
  endDate.setUTCDate(endDate.getUTCDate() + daysAhead);
  const end = endDate.toISOString().slice(0, 10);

  return `Eres un agente curador de eventos GRATUITOS para CTXplorer (plataforma de experiencias urbanas en CDMX). Tu tarea: buscar en internet AHORA MISMO usando Google Search los eventos gratuitos confirmados en Ciudad de Mexico entre ${start} y ${end}.

FUENTES recomendadas (consulta varias):
- cartelera.cdmx.gob.mx (cartelera oficial Secretaria de Cultura CDMX)
- cultura.cdmx.gob.mx
- mexicoescultura.com
- inba.gob.mx / palacio.bellasartes.gob.mx
- Cartelera UNAM / cultura.unam.mx
- chapultepec.org.mx / bosquedechapultepec.cdmx.gob.mx
- museos publicos CDMX (Soumaya, MUAC, Universum, Antropologia, etc.)
- timeoutmexico.mx / chilango.com (secciones "gratis")
- eventbrite.com.mx (filtro precio=0)

REGLAS:
1. SOLO eventos con entrada GRATUITA confirmada (museos con dia gratis, cartelera publica, conciertos al aire libre, talleres, exposiciones, recorridos).
2. SOLO eventos en Ciudad de Mexico (CDMX y zona metropolitana).
3. SOLO eventos con fecha en el rango ${start} a ${end}.
4. NUNCA inventes. Si no encuentras suficiente info verificable, devuelve el array vacio.
5. Para cada evento incluye direccion exacta (calle + colonia + alcaldia) y horario.

Devuelve EXCLUSIVAMENTE un JSON valido (sin markdown, sin backticks) con esta forma exacta:
{
  "events": [
    {
      "title": "Titulo del evento (sin emojis)",
      "date": "YYYY-MM-DD",
      "time": "HH:MM" o null,
      "address": "Direccion completa con alcaldia",
      "description": "Descripcion editorial 80-150 palabras: que es, donde, por que asistir. Sin disclaimers.",
      "short_description": "Resumen 1-2 oraciones, max 200 chars",
      "category": "uno de: conciertos | arte | gastronomia | teatro | festivales | inmersivo | deportes | bienestar | tours | nightlife",
      "image_url": "URL de imagen oficial o null",
      "source_url": "URL de la fuente oficial donde verificaste",
      "lat": null,
      "lng": null
    }
  ]
}

Objetivo: 8-15 eventos. Diversifica categorias.`;
}

async function callGeminiGrounded(
  prompt: string,
  daysAhead: number
): Promise<{ events: ScrapedEvent[]; _model: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');
  let lastErr: Error | null = null;
  for (const model of GROUNDED_MODELS) {
    try {
      const res = await fetch(`${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: {
            temperature: 0.4,
            topP: 0.9,
            maxOutputTokens: 32768,
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
          ],
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        lastErr = new Error(`Gemini ${model} HTTP ${res.status}: ${body.slice(0, 400)}`);
        if (res.status === 429 || res.status === 503) continue;
        throw lastErr;
      }
      const json = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>;
      };
      const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
      if (!text) {
        lastErr = new Error(`Gemini ${model}: empty (finishReason=${json.candidates?.[0]?.finishReason})`);
        continue;
      }
      // grounded responses NO devuelven application/json — hay que extraer JSON del texto
      let cleaned = text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.slice(firstBrace, lastBrace + 1);
      }
      try {
        const parsed = JSON.parse(cleaned) as { events?: ScrapedEvent[] };
        const events = parsed.events || [];
        return { events, _model: `gemini:${model}` };
      } catch (e) {
        lastErr = new Error(`Gemini ${model} JSON parse: ${(e as Error).message} | preview=${cleaned.slice(0, 200)}`);
        continue;
      }
    } catch (e) {
      lastErr = e as Error;
      continue;
    }
  }
  // marca daysAhead para no perder contexto
  void daysAhead;
  throw lastErr || new Error('All Gemini grounded models failed');
}

interface UpsertOutcome {
  slug: string;
  action: 'created' | 'updated' | 'error' | 'skipped';
  error?: string;
}

async function upsertEvent(
  ev: ScrapedEvent,
  cityId: number,
  categoryIdsBySlug: Map<string, number>
): Promise<UpsertOutcome> {
  if (!ev.title || !ev.date || !/^\d{4}-\d{2}-\d{2}$/.test(ev.date)) {
    return { slug: '', action: 'skipped', error: 'invalid title/date' };
  }
  const baseSlug = slugify(ev.title);
  if (!baseSlug) return { slug: '', action: 'skipped', error: 'invalid slug' };
  const slug = `${baseSlug}-free-${ev.date}`.slice(0, 110);

  const categoryId = categoryIdsBySlug.get(ev.category) || categoryIdsBySlug.get('tours') || null;

  // Si hay image_url, intentar descargarla al bucket Supabase
  const storedImage = await downloadAndStoreImage(ev.image_url, 'events/cdmx', `${baseSlug}-free`);

  const payload = {
    title: ev.title,
    slug,
    description: ev.description || `Evento gratuito en CDMX: ${ev.title}.`,
    short_description: (ev.short_description || ev.description || ev.title).slice(0, 200),
    date: ev.date,
    time: ev.time || null,
    duration: ev.duration || null,
    price: 0,
    currency: 'MXN',
    original_price: null,
    image: storedImage,
    gallery: null,
    city_id: cityId,
    category_id: categoryId,
    address: ev.address || null,
    lat: ev.lat ?? null,
    lng: ev.lng ?? null,
    capacity: null,
    sold_count: 0,
    featured: false,
    status: 'PUBLISHED',
    external_url: ev.source_url || null,
    external_source: 'ai-search',
    external_id: null,
    updated_at: new Date().toISOString(),
  };

  const tryWrite = async (
    op: 'insert' | 'update',
    existingId?: number
  ): Promise<{ error: string | null }> => {
    const writeOnce = async (data: Record<string, unknown>) => {
      if (op === 'insert') return await supabase.from('events').insert(data);
      return await supabase.from('events').update(data).eq('id', existingId!);
    };
    const first = await writeOnce(payload as Record<string, unknown>);
    if (!first.error) return { error: null };
    if (/column.*does not exist|external_/i.test(first.error.message)) {
      const fb = { ...payload } as Record<string, unknown>;
      delete fb.external_url;
      delete fb.external_source;
      delete fb.external_id;
      const second = await writeOnce(fb);
      if (second.error) return { error: second.error.message };
      return { error: null };
    }
    return { error: first.error.message };
  };

  const { data: existing } = await supabase
    .from('events')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (existing?.id) {
    const r = await tryWrite('update', existing.id);
    if (r.error) return { slug, action: 'error', error: r.error };
    return { slug, action: 'updated' };
  }
  const r = await tryWrite('insert');
  if (r.error) return { slug, action: 'error', error: r.error };
  return { slug, action: 'created' };
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  const expected = `Bearer ${process.env.CRON_SECRET || ''}`;
  const debugKey = process.env.CRON_DEBUG_KEY || '';
  const debugQuery = req.nextUrl.searchParams.get('key');
  const isVercelCron = req.headers.get('x-vercel-cron') === '1';
  const allowed =
    isVercelCron ||
    (process.env.CRON_SECRET && auth === expected) ||
    (debugKey && debugQuery === debugKey);
  if (!allowed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
  }

  const daysAhead = Math.max(
    1,
    Math.min(14, Number(req.nextUrl.searchParams.get('daysAhead') || '7'))
  );
  const dryRun = req.nextUrl.searchParams.get('dryRun') === '1';

  // CDMX city
  const { data: city } = await supabase
    .from('cities')
    .select('id, slug, name')
    .eq('slug', 'mx')
    .maybeSingle();
  if (!city) return NextResponse.json({ error: 'MX city not found' }, { status: 500 });

  const { data: cats } = await supabase.from('categories').select('id, slug');
  const categoryIdsBySlug = new Map<string, number>();
  for (const c of cats || []) categoryIdsBySlug.set(c.slug as string, c.id as number);

  let scraped;
  try {
    scraped = await callGeminiGrounded(buildPrompt(daysAhead), daysAhead);
  } catch (e) {
    return NextResponse.json(
      { error: `gemini grounded: ${(e as Error).message}` },
      { status: 502 }
    );
  }

  const events = scraped.events.filter(
    (e) =>
      e &&
      typeof e.title === 'string' &&
      typeof e.date === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(e.date)
  );

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      _model: scraped._model,
      eventsFound: events.length,
      events: events.slice(0, 20),
    });
  }

  const outcomes: UpsertOutcome[] = [];
  for (const ev of events) {
    outcomes.push(await upsertEvent(ev, city.id, categoryIdsBySlug));
  }

  const created = outcomes.filter((o) => o.action === 'created').length;
  const updated = outcomes.filter((o) => o.action === 'updated').length;
  const errored = outcomes.filter((o) => o.action === 'error').length;
  const skipped = outcomes.filter((o) => o.action === 'skipped').length;

  // revalidate + indexnow si hubo cambios
  if (created + updated > 0) {
    try {
      await fetch('https://ctxplorer.com/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: ['/sitemap.xml', '/', '/cdmx', '/search'] }),
      });
    } catch {}
    try {
      await fetch('https://ctxplorer.com/api/indexnow', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${process.env.INDEXNOW_SECRET || 'daa5b4e30e59aa273c9f7ed20f36fc0f'}`,
        },
      });
    } catch {}
  }

  return NextResponse.json({
    ok: true,
    _model: scraped._model,
    daysAhead,
    eventsFound: events.length,
    created,
    updated,
    errored,
    skipped,
    outcomes,
  });
}
