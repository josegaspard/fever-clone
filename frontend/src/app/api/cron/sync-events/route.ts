import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { downloadAndStoreImage } from '@/lib/event-image';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const TM_BASE = 'https://app.ticketmaster.com/discovery/v2/events.json';
const TM_KEY_FALLBACK = 'gxhdrC7LRp7lLADj4sEL51qeffDfhCG2';
const TM_AFFILIATE_DEFAULT = '29101991';

// ---------------- TM types ----------------

interface TmImage {
  url: string;
  ratio?: string;
  width: number;
  height: number;
}
interface TmVenue {
  name?: string;
  city?: { name?: string };
  country?: { countryCode?: string };
  state?: { name?: string };
  address?: { line1?: string };
  location?: { latitude?: string; longitude?: string };
}
interface TmAttraction {
  name?: string;
  classifications?: Array<{
    segment?: { name?: string };
    genre?: { name?: string };
    subGenre?: { name?: string };
  }>;
}
interface TmEvent {
  id: string;
  name: string;
  url: string;
  info?: string;
  pleaseNote?: string;
  description?: string;
  images?: TmImage[];
  dates?: {
    start?: { localDate?: string; localTime?: string; dateTime?: string };
    status?: { code?: string };
  };
  classifications?: Array<{
    segment?: { name?: string };
    genre?: { name?: string };
  }>;
  priceRanges?: Array<{
    type?: string;
    currency?: string;
    min?: number;
    max?: number;
  }>;
  _embedded?: {
    venues?: TmVenue[];
    attractions?: TmAttraction[];
  };
}

// ---------------- City + category mapping ----------------

// ctxplorer city.slug -> TM filter (countryCode + city name)
const CITY_TM_FILTER: Record<string, { country: string; city: string }> = {
  cdmx: { country: 'MX', city: 'Mexico City' },
  monterrey: { country: 'MX', city: 'Monterrey' },
  madrid: { country: 'ES', city: 'Madrid' },
  barcelona: { country: 'ES', city: 'Barcelona' },
  'new-york': { country: 'US', city: 'New York' },
  london: { country: 'GB', city: 'London' },
  paris: { country: 'FR', city: 'Paris' },
  lima: { country: 'PE', city: 'Lima' },
  'buenos-aires': { country: 'AR', city: 'Buenos Aires' },
  bogota: { country: 'CO', city: 'Bogota' },
};

// TM segment/genre -> ctxplorer categories.slug
const SEGMENT_CATEGORY: Record<string, string> = {
  Music: 'conciertos',
  Sports: 'deportes',
  'Arts & Theatre': 'teatro',
  Family: 'inmersivo',
  Miscellaneous: 'tours',
  Film: 'arte',
};
const GENRE_OVERRIDE: Record<string, string> = {
  Classical: 'teatro',
  Comedy: 'teatro',
  Theatre: 'teatro',
  Opera: 'teatro',
  Ballet: 'teatro',
  'Fine Art': 'arte',
  Museum: 'arte',
};

// ---------------- Helpers ----------------

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

function pickBestImage(images?: TmImage[], preferRatio = '16_9'): string | null {
  if (!images || !images.length) return null;
  const preferred = images.filter((i) => i.ratio === preferRatio);
  const pool = preferred.length ? preferred : images;
  return pool.reduce((a, b) => (a.width * a.height >= b.width * b.height ? a : b)).url || null;
}

function buildGallery(images?: TmImage[]): string[] | null {
  if (!images || !images.length) return null;
  return images
    .filter((i) => i.ratio === '16_9' && i.width >= 640)
    .sort((a, b) => b.width * b.height - a.width * a.height)
    .slice(0, 4)
    .map((i) => i.url);
}

function affiliateUrl(rawUrl: string): string {
  const aff = process.env.TICKETMASTER_AFFILIATE_ID || TM_AFFILIATE_DEFAULT;
  return `https://ticketmaster.evyy.net/c/${aff}/264167/4272?u=${encodeURIComponent(rawUrl)}`;
}

function mapCategory(ev: TmEvent): string {
  const cls = ev.classifications?.[0];
  const genre = cls?.genre?.name;
  if (genre && GENRE_OVERRIDE[genre]) return GENRE_OVERRIDE[genre];
  const segment = cls?.segment?.name;
  if (segment && SEGMENT_CATEGORY[segment]) return SEGMENT_CATEGORY[segment];
  return 'tours';
}

function buildDescription(ev: TmEvent): {
  description: string;
  shortDescription: string;
} {
  const parts: string[] = [];
  if (ev.info) parts.push(ev.info);
  if (ev.description) parts.push(ev.description);
  if (ev.pleaseNote) parts.push(ev.pleaseNote);
  const venue = ev._embedded?.venues?.[0];
  if (venue?.name) parts.push(`Lugar: ${venue.name}.`);
  const attraction = ev._embedded?.attractions?.[0];
  if (attraction?.name) parts.push(`Artista: ${attraction.name}.`);
  const full =
    parts.join(' ').trim() ||
    `Evento ${ev.name} en vivo. Consulta detalles y compra tu boleto en Ticketmaster.`;
  const short = full.replace(/\s+/g, ' ').slice(0, 200);
  return { description: full, shortDescription: short };
}

async function tmSearch(
  countryCode: string,
  cityName: string,
  page: number,
  apiKey: string,
  classification?: string
): Promise<{ events: TmEvent[]; totalPages: number }> {
  const url = new URL(TM_BASE);
  url.searchParams.set('apikey', apiKey);
  url.searchParams.set('countryCode', countryCode);
  url.searchParams.set('city', cityName);
  if (classification) url.searchParams.set('classificationName', classification);
  url.searchParams.set('size', '100');
  url.searchParams.set('page', String(page));
  url.searchParams.set('sort', 'date,asc');
  url.searchParams.set('locale', '*');
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`TM ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const json = (await res.json()) as {
    _embedded?: { events?: TmEvent[] };
    page?: { totalPages?: number };
  };
  return {
    events: json._embedded?.events || [],
    totalPages: json.page?.totalPages || 0,
  };
}

interface SyncCityResult {
  city: string;
  fetched: number;
  upserted: number;
  skipped: number;
  errors: string[];
}

async function syncCity(
  citySlug: string,
  cityRow: { id: number; name: string },
  apiKey: string,
  maxPages: number,
  categoryIdsBySlug: Map<string, number>
): Promise<SyncCityResult> {
  const filter = CITY_TM_FILTER[citySlug];
  const result: SyncCityResult = {
    city: citySlug,
    fetched: 0,
    upserted: 0,
    skipped: 0,
    errors: [],
  };
  if (!filter) {
    result.errors.push(`no TM filter mapping for ${citySlug}`);
    return result;
  }

  for (let page = 0; page < maxPages; page++) {
    let batch;
    try {
      batch = await tmSearch(filter.country, filter.city, page, apiKey);
    } catch (e) {
      result.errors.push(`page ${page}: ${(e as Error).message}`);
      break;
    }
    if (!batch.events.length) break;
    result.fetched += batch.events.length;

    for (const ev of batch.events) {
      const startDate = ev.dates?.start?.localDate;
      if (!startDate) {
        result.skipped++;
        continue;
      }
      const status = ev.dates?.status?.code || 'onsale';
      if (status === 'cancelled') {
        result.skipped++;
        continue;
      }
      // dedupe slug: titulo + ultimos 8 char del TM id
      const baseSlug = slugify(ev.name);
      if (!baseSlug) {
        result.skipped++;
        continue;
      }
      const slug = `${baseSlug}-tm-${ev.id.slice(-8)}`.slice(0, 110);

      const venue = ev._embedded?.venues?.[0];
      const address = [venue?.name, venue?.address?.line1, venue?.city?.name]
        .filter(Boolean)
        .join(', ') || venue?.name || null;
      const lat = venue?.location?.latitude ? Number(venue.location.latitude) : null;
      const lng = venue?.location?.longitude ? Number(venue.location.longitude) : null;
      const priceRange = ev.priceRanges?.[0];
      const price = priceRange?.min ?? 0;
      const originalPrice = priceRange?.max ?? null;
      const currency = priceRange?.currency || (filter.country === 'MX' ? 'MXN' : null);
      const rawImage = pickBestImage(ev.images);
      const image = await downloadAndStoreImage(rawImage, `events/${citySlug}`, `${baseSlug}-tm-${ev.id.slice(-8)}`);
      const gallery = buildGallery(ev.images);
      const { description, shortDescription } = buildDescription(ev);
      const categorySlug = mapCategory(ev);
      const categoryId = categoryIdsBySlug.get(categorySlug) || null;

      const payload = {
        title: ev.name,
        slug,
        description,
        short_description: shortDescription,
        date: startDate,
        time: ev.dates?.start?.localTime || null,
        duration: null,
        price,
        currency,
        original_price: originalPrice,
        image,
        gallery: gallery ? JSON.stringify(gallery) : null,
        city_id: cityRow.id,
        category_id: categoryId,
        address,
        lat,
        lng,
        capacity: null,
        sold_count: 0,
        featured: false,
        status: 'PUBLISHED',
        external_url: affiliateUrl(ev.url),
        external_source: 'ticketmaster',
        external_id: ev.id,
        updated_at: new Date().toISOString(),
      };

      // UPSERT por slug — fallback automatico si columnas externas no existen
      const { data: existing } = await supabase
        .from('events')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      const tryWriteWithFallback = async (
        op: 'insert' | 'update',
        existingId?: number
      ): Promise<{ error: string | null }> => {
        const writeOnce = async (data: Record<string, unknown>) => {
          if (op === 'insert') {
            return await supabase.from('events').insert(data);
          }
          return await supabase.from('events').update(data).eq('id', existingId!);
        };
        const first = await writeOnce(payload as Record<string, unknown>);
        if (!first.error) return { error: null };
        if (/column.*does not exist|external_/i.test(first.error.message)) {
          const fallback = { ...payload } as Record<string, unknown>;
          delete fallback.external_url;
          delete fallback.external_source;
          delete fallback.external_id;
          const second = await writeOnce(fallback);
          if (second.error) return { error: second.error.message };
          return { error: null };
        }
        return { error: first.error.message };
      };

      if (existing?.id) {
        const r = await tryWriteWithFallback('update', existing.id);
        if (r.error) result.errors.push(`update ${slug}: ${r.error}`);
        else result.upserted++;
      } else {
        const r = await tryWriteWithFallback('insert');
        if (r.error) result.errors.push(`insert ${slug}: ${r.error}`);
        else result.upserted++;
      }
    }

    // rate limit cortés
    await new Promise((r) => setTimeout(r, 250));
    if (page + 1 >= batch.totalPages) break;
  }

  return result;
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

  const apiKey = process.env.TICKETMASTER_API_KEY || TM_KEY_FALLBACK;
  if (!apiKey) return NextResponse.json({ error: 'TM key missing' }, { status: 500 });

  const cityFilter = req.nextUrl.searchParams.get('city');
  const maxPages = Math.max(
    1,
    Math.min(8, Number(req.nextUrl.searchParams.get('pages') || '3'))
  );

  // 1. cargar cities + categories una vez
  const { data: cities, error: citiesErr } = await supabase
    .from('cities')
    .select('id, slug, name')
    .order('name');
  if (citiesErr || !cities) {
    return NextResponse.json(
      { error: `cities query: ${citiesErr?.message || 'no data'}` },
      { status: 500 }
    );
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('id, slug');
  const categoryIdsBySlug = new Map<string, number>();
  for (const c of categories || []) {
    categoryIdsBySlug.set(c.slug as string, c.id as number);
  }

  const targets = cityFilter
    ? (cities as Array<{ id: number; slug: string; name: string }>).filter(
        (c) => c.slug === cityFilter
      )
    : (cities as Array<{ id: number; slug: string; name: string }>).filter(
        (c) => CITY_TM_FILTER[c.slug]
      );

  if (targets.length === 0) {
    return NextResponse.json(
      { error: 'no targets — verifica city slug o CITY_TM_FILTER' },
      { status: 404 }
    );
  }

  // 2. sync secuencial (para respetar rate-limit TM)
  const results: SyncCityResult[] = [];
  for (const city of targets) {
    results.push(
      await syncCity(
        city.slug,
        { id: city.id, name: city.name },
        apiKey,
        maxPages,
        categoryIdsBySlug
      )
    );
  }

  const totalUpserted = results.reduce((s, r) => s + r.upserted, 0);

  // 3. revalidate + indexnow si hubo updates
  if (totalUpserted > 0) {
    try {
      await fetch('https://ctxplorer.com/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: ['/sitemap.xml', '/', '/search'] }),
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
    citiesProcessed: targets.length,
    maxPagesPerCity: maxPages,
    totalUpserted,
    results,
  });
}
