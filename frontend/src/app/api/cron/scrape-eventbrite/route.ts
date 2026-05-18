import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { downloadAndStoreImage } from '@/lib/event-image';
import {
  slugify,
  upsertEventBySlug,
  pingRevalidateAndIndex,
  commonCronAuth,
  todayMx,
  type UpsertOutcome,
} from '@/lib/event-upsert';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15';

// Eventbrite search URLs per ctxplorer city. price=free filter aplicado por ciudad.
const EB_URLS: Record<string, { url: string; currency: string }> = {
  cdmx: { url: 'https://www.eventbrite.com.mx/d/mexico--ciudad-de-mexico/free--events/', currency: 'MXN' },
  monterrey: { url: 'https://www.eventbrite.com.mx/d/mexico--monterrey/free--events/', currency: 'MXN' },
  madrid: { url: 'https://www.eventbrite.es/d/spain--madrid/free--events/', currency: 'EUR' },
  barcelona: { url: 'https://www.eventbrite.es/d/spain--barcelona/free--events/', currency: 'EUR' },
  'new-york': { url: 'https://www.eventbrite.com/d/ny--new-york/free--events/', currency: 'USD' },
  london: { url: 'https://www.eventbrite.co.uk/d/united-kingdom--london/free--events/', currency: 'GBP' },
  paris: { url: 'https://www.eventbrite.fr/d/france--paris/free--events/', currency: 'EUR' },
  lima: { url: 'https://www.eventbrite.com/d/peru--lima/free--events/', currency: 'PEN' },
  'buenos-aires': {
    url: 'https://www.eventbrite.com.ar/d/argentina--buenos-aires/free--events/',
    currency: 'ARS',
  },
  bogota: { url: 'https://www.eventbrite.com.co/d/colombia--bogot%C3%A1/free--events/', currency: 'COP' },
};

interface JsonLdEvent {
  '@type'?: string | string[];
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  url?: string;
  image?: string | string[];
  location?:
    | {
        '@type'?: string;
        name?: string;
        address?:
          | string
          | {
              streetAddress?: string;
              addressLocality?: string;
              addressRegion?: string;
            };
        geo?: { latitude?: string | number; longitude?: string | number };
      }
    | Array<unknown>;
  offers?:
    | {
        price?: string | number;
        priceCurrency?: string;
        url?: string;
      }
    | Array<{ price?: string | number; priceCurrency?: string; url?: string }>;
}

function isEventType(t: unknown): boolean {
  if (!t) return false;
  if (Array.isArray(t)) return t.some((x) => /event/i.test(String(x)));
  return /event/i.test(String(t));
}

function collectEvents(node: unknown, out: JsonLdEvent[]): void {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const child of node) collectEvents(child, out);
    return;
  }
  const obj = node as Record<string, unknown>;
  const t = obj['@type'];
  if (isEventType(t) && typeof obj.name === 'string' && typeof obj.startDate === 'string') {
    out.push(obj as JsonLdEvent);
  }
  // ItemList wrappers: recurse into item / itemListElement / @graph / mainEntity
  for (const key of ['item', 'itemListElement', '@graph', 'mainEntity']) {
    if (key in obj) collectEvents(obj[key], out);
  }
}

function extractJsonLdEvents(html: string): JsonLdEvent[] {
  const out: JsonLdEvent[] = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const raw = m[1].trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      collectEvents(parsed, out);
    } catch {}
  }
  return out;
}

function ldFirst<T>(v: T | T[] | undefined): T | undefined {
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

function ldImage(img: string | string[] | undefined): string | null {
  if (!img) return null;
  const v = Array.isArray(img) ? img[0] : img;
  return typeof v === 'string' ? v : null;
}

function parseStart(s: string | undefined): { date: string; time: string | null } | null {
  if (!s) return null;
  const m = s.match(/^(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2}))?/);
  if (!m) return null;
  return { date: m[1], time: m[2] || null };
}

function pickPriceCurrency(
  offers: JsonLdEvent['offers'],
  fallbackCurrency: string
): { price: number; currency: string } {
  const o = ldFirst(Array.isArray(offers) ? offers : offers ? [offers] : undefined);
  if (!o) return { price: 0, currency: fallbackCurrency };
  const raw = typeof o.price === 'number' ? o.price : parseFloat(String(o.price || '0'));
  const price = isNaN(raw) ? 0 : raw;
  return { price, currency: o.priceCurrency || fallbackCurrency };
}

async function scrapeCityEventbrite(
  citySlug: string,
  cityId: number,
  categoryIdsBySlug: Map<string, number>,
  maxItems: number
): Promise<{ kept: number; outcomes: UpsertOutcome[]; rawCount: number; error?: string }> {
  const conf = EB_URLS[citySlug];
  if (!conf) return { kept: 0, outcomes: [], rawCount: 0, error: 'no EB url' };

  let html = '';
  try {
    const res = await fetch(conf.url, {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html',
        'Accept-Language': 'es-MX,es;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return { kept: 0, outcomes: [], rawCount: 0, error: `HTTP ${res.status}` };
    html = await res.text();
  } catch (e) {
    return { kept: 0, outcomes: [], rawCount: 0, error: (e as Error).message };
  }

  const events = extractJsonLdEvents(html);
  const today = todayMx();
  const outcomes: UpsertOutcome[] = [];
  const seen = new Set<string>();
  let kept = 0;

  for (const ev of events) {
    if (kept >= maxItems) break;
    if (!ev.name || !ev.startDate) continue;
    const start = parseStart(ev.startDate);
    if (!start) continue;
    if (start.date < today) continue;

    const baseSlug = slugify(ev.name);
    if (!baseSlug) continue;

    // Eventbrite URL contains numeric id at end /e/title-123456789
    const urlMatch = (ev.url || '').match(/-(\d{8,})(?:\?|$)/);
    const eid = urlMatch ? urlMatch[1] : Math.random().toString(36).slice(2, 10);
    const slug = `${baseSlug}-eb-${eid.slice(-10)}`.slice(0, 110);
    if (seen.has(slug)) continue;
    seen.add(slug);

    const { price, currency } = pickPriceCurrency(ev.offers, conf.currency);
    if (price > 0) continue; // por si EB filtra mal

    const description =
      (ev.description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() ||
      `Evento gratis en ${citySlug.toUpperCase()}: ${ev.name}.`;
    const shortDescription = description.slice(0, 200);

    const loc = ldFirst(
      Array.isArray(ev.location) ? (ev.location as Array<unknown>) : ev.location ? [ev.location] : undefined
    ) as JsonLdEvent['location'];
    let address: string | null = null;
    let lat: number | null = null;
    let lng: number | null = null;
    if (loc && typeof loc === 'object' && !Array.isArray(loc)) {
      const venueName = loc.name;
      const addr = loc.address;
      let addrStr = '';
      if (typeof addr === 'string') addrStr = addr;
      else if (addr && typeof addr === 'object') {
        addrStr = [addr.streetAddress, addr.addressLocality, addr.addressRegion]
          .filter(Boolean)
          .join(', ');
      }
      address = [venueName, addrStr].filter(Boolean).join(' — ') || null;
      if (loc.geo) {
        lat = loc.geo.latitude !== undefined ? Number(loc.geo.latitude) : null;
        lng = loc.geo.longitude !== undefined ? Number(loc.geo.longitude) : null;
        if (lat !== null && isNaN(lat)) lat = null;
        if (lng !== null && isNaN(lng)) lng = null;
      }
    }

    const rawImage = ldImage(ev.image);
    const storedImage = await downloadAndStoreImage(
      rawImage,
      `events/${citySlug}`,
      `${baseSlug}-eb-${eid.slice(-10)}`
    );

    const categoryId = categoryIdsBySlug.get('tours') || null; // EB no expone categoria estructurada en cards

    const outcome = await upsertEventBySlug({
      title: ev.name,
      slug,
      description,
      short_description: shortDescription,
      date: start.date,
      time: start.time,
      duration: null,
      price: 0,
      currency,
      original_price: null,
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
      external_url: ev.url || conf.url,
      external_source: 'eventbrite',
      external_id: eid,
      updated_at: new Date().toISOString(),
    });
    outcomes.push(outcome);
    if (outcome.action === 'created' || outcome.action === 'updated') kept++;
  }

  return { kept, outcomes, rawCount: events.length };
}

export async function GET(req: NextRequest) {
  if (!commonCronAuth(req, req.nextUrl)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const cityFilter = req.nextUrl.searchParams.get('city');
  const maxPerCity = Math.max(5, Math.min(60, Number(req.nextUrl.searchParams.get('max') || '30')));

  const { data: cities } = await supabase.from('cities').select('id, slug, name').order('name');
  if (!cities) return NextResponse.json({ error: 'cities missing' }, { status: 500 });

  const { data: cats } = await supabase.from('categories').select('id, slug');
  const catMap = new Map<string, number>();
  for (const c of cats || []) catMap.set(c.slug as string, c.id as number);

  const targets = cityFilter
    ? (cities as Array<{ id: number; slug: string }>).filter((c) => c.slug === cityFilter)
    : (cities as Array<{ id: number; slug: string }>).filter((c) => EB_URLS[c.slug]);

  const perCity: Record<string, unknown> = {};
  let totalKept = 0;
  for (const city of targets) {
    const r = await scrapeCityEventbrite(city.slug, city.id, catMap, maxPerCity);
    perCity[city.slug] = {
      kept: r.kept,
      raw: r.rawCount,
      created: r.outcomes.filter((o) => o.action === 'created').length,
      updated: r.outcomes.filter((o) => o.action === 'updated').length,
      errors: r.outcomes.filter((o) => o.action === 'error').length,
      error: r.error,
    };
    totalKept += r.kept;
    await new Promise((r) => setTimeout(r, 250));
  }

  if (totalKept > 0) await pingRevalidateAndIndex();

  return NextResponse.json({ ok: true, totalKept, perCity });
}
