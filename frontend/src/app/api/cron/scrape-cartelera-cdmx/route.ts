import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { downloadAndStoreImage } from '@/lib/event-image';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const API_BASE = 'https://cartelera.cdmx.gob.mx/api/v1/internal';
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15';

// Mapping tipo_evento.id (Cartelera) -> categoria slug ctxplorer
const CAT_MAP: Record<string, string> = {
  CONCIERTOS: 'conciertos',
  MUSICA: 'conciertos',
  TEATRO: 'teatro',
  DANZA: 'teatro',
  CINE: 'arte',
  EXPOSICIONES: 'arte',
  MUSEOS: 'arte',
  'MUSEOS Y EXPOSICIONES': 'arte',
  LITERATURA: 'arte',
  CONFERENCIAS: 'arte',
  TALLERES: 'arte',
  CURSOS: 'bienestar',
  GASTRONOMIA: 'gastronomia',
  DEPORTES: 'deportes',
  FESTIVALES: 'festivales',
  FAMILIA: 'tours',
  INFANTILES: 'tours',
  TOUR: 'tours',
  TOURS: 'tours',
  RECORRIDOS: 'tours',
};

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

interface VenueRow {
  venue_id: string;
  venue_name: string;
  venue_event_list: string;
}

async function fetchAllVenues(maxPages = 25): Promise<VenueRow[]> {
  const all: VenueRow[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const res = await fetch(`${API_BASE}/events/search_builder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': UA,
        Origin: 'https://www.cartelera.cdmx.gob.mx',
        Referer: 'https://www.cartelera.cdmx.gob.mx/',
      },
      body: JSON.stringify({ page, per_page: 50 }),
    });
    if (!res.ok) {
      if (page === 1) throw new Error(`search_builder HTTP ${res.status}`);
      break;
    }
    const json = (await res.json()) as {
      data?: {
        venue_data?: {
          venue_items_list?: VenueRow[];
          venue_pages_total?: number;
        };
      };
    };
    const items = json.data?.venue_data?.venue_items_list || [];
    if (items.length === 0) break;
    all.push(...items);
    const totalPages = json.data?.venue_data?.venue_pages_total || 0;
    if (totalPages && page >= totalPages) break;
    await new Promise((r) => setTimeout(r, 50));
  }
  return all;
}

interface CarteleraEvent {
  id: number;
  nombre?: string;
  descripcion?: string;
  duracion?: string;
  tipo_evento?: { id: string; nombre: string };
  itinerarios?: Record<string, { fechas?: string[]; horarios?: string[] }>;
  costo?: Record<string, { perfil_nombre?: string; perfil_precio?: string }>;
  foro?: string;
  url_imagen?: string;
  url_imagen_thumb?: string;
  url_evento?: string;
  ubicacion?: { latitud?: string; longitud?: string; direccion?: string };
}

async function fetchEvent(id: string): Promise<CarteleraEvent | null> {
  try {
    const res = await fetch(`${API_BASE}/events/${id}`, {
      headers: {
        'User-Agent': UA,
        Origin: 'https://www.cartelera.cdmx.gob.mx',
        Referer: 'https://www.cartelera.cdmx.gob.mx/',
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: CarteleraEvent[] };
    return json.data?.[0] || null;
  } catch {
    return null;
  }
}

function parseFechaDMY(s: string): string | null {
  // "17/08/2026" -> "2026-08-17"
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

function isFree(ev: CarteleraEvent): boolean {
  if (!ev.costo || typeof ev.costo !== 'object') return true; // sin costo declarado → asumir gratis
  const values = Object.values(ev.costo);
  if (values.length === 0) return true;
  for (const c of values) {
    const p = (c.perfil_precio || '').toLowerCase().replace(/\s+/g, '');
    if (!p) continue;
    if (/(gratis|gratuit|libre|sin\s*costo|entradalibre|\$0|\$\.?0\b)/.test(p)) continue;
    // detectar precio con $
    if (/\$/.test(p)) {
      const num = parseFloat(p.replace(/[^\d.]/g, ''));
      if (!isNaN(num) && num > 0) return false;
    }
  }
  return true;
}

function maxPriceMXN(ev: CarteleraEvent): { min: number; max: number | null } {
  let min = 0;
  let max: number | null = null;
  if (!ev.costo) return { min, max };
  for (const c of Object.values(ev.costo)) {
    const p = (c.perfil_precio || '').replace(/[^\d.]/g, '');
    const n = parseFloat(p);
    if (!isNaN(n)) {
      if (min === 0) min = n;
      else min = Math.min(min, n);
      max = max === null ? n : Math.max(max, n);
    }
  }
  return { min, max };
}

interface UpsertOutcome {
  slug: string;
  action: 'created' | 'updated' | 'error' | 'skipped';
  error?: string;
}

async function upsertEventToCtx(
  ev: CarteleraEvent,
  cityId: number,
  categoryIdsBySlug: Map<string, number>
): Promise<UpsertOutcome[]> {
  const outcomes: UpsertOutcome[] = [];
  if (!ev.nombre || !ev.itinerarios) return outcomes;

  // Cada itinerario tiene fechas[]; expandimos a un row por fecha
  const allDates = new Set<string>();
  for (const it of Object.values(ev.itinerarios)) {
    for (const f of it.fechas || []) {
      const iso = parseFechaDMY(f);
      if (iso) allDates.add(iso);
    }
  }
  if (allDates.size === 0) return outcomes;

  // Solo fechas futuras o hoy (CDMX timezone)
  const todayMx = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date())
    .replace(/-/g, '-');
  const futureDates = Array.from(allDates).filter((d) => d >= todayMx);
  if (futureDates.length === 0) return outcomes;

  // Limitamos a maximo 6 fechas para no inflar la tabla con eventos de larga duracion
  const datesToInsert = futureDates.slice(0, 6);

  const baseTime = (() => {
    for (const it of Object.values(ev.itinerarios)) {
      if (it.horarios && it.horarios.length) return it.horarios[0]; // "21:00"
    }
    return null;
  })();

  const baseSlug = slugify(ev.nombre);
  if (!baseSlug) return outcomes;

  const description =
    (ev.descripcion || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim() || `Evento en CDMX: ${ev.nombre}.`;
  const shortDesc = description.slice(0, 200);
  const address =
    [ev.foro, ev.ubicacion?.direccion].filter(Boolean).join(', ') || ev.foro || null;
  const lat = ev.ubicacion?.latitud ? Number(ev.ubicacion.latitud) : null;
  const lng = ev.ubicacion?.longitud ? Number(ev.ubicacion.longitud) : null;
  const catKey = (ev.tipo_evento?.id || ev.tipo_evento?.nombre || '').toUpperCase();
  const categorySlug = CAT_MAP[catKey] || CAT_MAP[catKey.replace(/ /g, '_')] || 'tours';
  const categoryId =
    categoryIdsBySlug.get(categorySlug) || categoryIdsBySlug.get('tours') || null;

  const free = isFree(ev);
  const { min, max } = maxPriceMXN(ev);
  const price = free ? 0 : min;
  const originalPrice = free ? null : max;

  // Descarga imagen oficial al bucket
  const imageUrl = ev.url_imagen || ev.url_imagen_thumb || null;
  const storedImage = await downloadAndStoreImage(imageUrl, 'events/cdmx', `${baseSlug}-cart-${ev.id}`);

  for (const date of datesToInsert) {
    const slug = `${baseSlug}-cart-${ev.id}-${date}`.slice(0, 110);
    const payload = {
      title: ev.nombre,
      slug,
      description,
      short_description: shortDesc,
      date,
      time: baseTime,
      duration: ev.duracion || null,
      price,
      currency: 'MXN',
      original_price: originalPrice,
      image: storedImage,
      gallery: null,
      city_id: cityId,
      category_id: categoryId,
      address,
      lat,
      lng,
      capacity: null,
      sold_count: 0,
      featured: false,
      status: 'PUBLISHED',
      external_url: ev.url_evento || `https://www.cartelera.cdmx.gob.mx/${ev.id}/${date.replace(/-/g, '-')}`,
      external_source: 'cartelera-cdmx',
      external_id: String(ev.id),
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
      outcomes.push({ slug, action: r.error ? 'error' : 'updated', error: r.error || undefined });
    } else {
      const r = await tryWrite('insert');
      outcomes.push({ slug, action: r.error ? 'error' : 'created', error: r.error || undefined });
    }
  }
  return outcomes;
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

  const onlyFree = req.nextUrl.searchParams.get('onlyFree') !== '0';
  const maxEvents = Math.max(
    10,
    Math.min(500, Number(req.nextUrl.searchParams.get('max') || '120'))
  );
  const concurrency = 6;

  const { data: city } = await supabase
    .from('cities')
    .select('id, slug, name')
    .eq('slug', 'cdmx')
    .maybeSingle();
  if (!city) return NextResponse.json({ error: 'CDMX not found' }, { status: 500 });

  const { data: cats } = await supabase.from('categories').select('id, slug');
  const categoryIdsBySlug = new Map<string, number>();
  for (const c of cats || []) categoryIdsBySlug.set(c.slug as string, c.id as number);

  let venues: VenueRow[];
  try {
    venues = await fetchAllVenues();
  } catch (e) {
    return NextResponse.json(
      { error: `search_builder: ${(e as Error).message}` },
      { status: 502 }
    );
  }

  // Recolectar lista de event_ids unicos (todos los venues)
  const eventIds = new Set<string>();
  for (const v of venues) {
    for (const id of (v.venue_event_list || '').split(',')) {
      const trimmed = id.trim();
      if (trimmed) eventIds.add(trimmed);
    }
  }
  // Shuffle para diversificar (Auditorio Nacional ocupa los primeros IDs siempre)
  const ids = Array.from(eventIds);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  // Cap total a procesar (no eventos kept) — limitar para evitar timeout
  const idsCap = Math.min(ids.length, maxEvents * 6);
  ids.length = idsCap;

  const allOutcomes: UpsertOutcome[] = [];
  let fetched = 0;
  let kept = 0;
  let i = 0;
  while (i < ids.length && kept < maxEvents) {
    const batch = ids.slice(i, i + concurrency);
    const results = await Promise.all(batch.map((id) => fetchEvent(id)));
    fetched += batch.length;
    for (const ev of results) {
      if (!ev) continue;
      if (onlyFree && !isFree(ev)) continue;
      const outcomes = await upsertEventToCtx(ev, city.id, categoryIdsBySlug);
      if (outcomes.length) {
        kept++;
        allOutcomes.push(...outcomes);
      }
      if (kept >= maxEvents) break;
    }
    i += concurrency;
    await new Promise((r) => setTimeout(r, 80));
  }

  const created = allOutcomes.filter((o) => o.action === 'created').length;
  const updated = allOutcomes.filter((o) => o.action === 'updated').length;
  const errored = allOutcomes.filter((o) => o.action === 'error').length;

  if (created + updated > 0) {
    try {
      await fetch('https://ctxplorer.com/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: ['/sitemap.xml', '/', '/cdmx'] }),
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
    onlyFree,
    venuesScanned: venues.length,
    eventIdsCollected: ids.length,
    eventsFetched: fetched,
    eventsKept: kept,
    rowsCreated: created,
    rowsUpdated: updated,
    rowsErrored: errored,
  });
}
