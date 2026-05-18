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
const BASE = 'https://www.cultura.unam.mx';

// /actividades/{slug} -> ctxplorer category
const ACTIVITY_CATEGORIES: Array<{ path: string; categorySlug: string }> = [
  { path: '/actividades/M%C3%BAsica', categorySlug: 'conciertos' },
  { path: '/actividades/Teatro', categorySlug: 'teatro' },
  { path: '/actividades/Danza', categorySlug: 'teatro' },
  { path: '/actividades/Cine', categorySlug: 'arte' },
  { path: '/actividades/Artes-Visuales', categorySlug: 'arte' },
  { path: '/actividades/Conferencias-y-presentaciones', categorySlug: 'arte' },
  { path: '/actividades/Cursos-y-talleres', categorySlug: 'bienestar' },
  { path: '/actividades/Libros', categorySlug: 'arte' },
];

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'text/html', 'Accept-Language': 'es-MX,es;q=0.9' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function extractEventSlugs(html: string): string[] {
  const set = new Set<string>();
  const re = /href="\/evento\/([a-z0-9\-]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) set.add(m[1]);
  return Array.from(set);
}

function parseDateContent(s: string): { date: string; time: string | null } | null {
  // "08/08/2026 11:00:00 a. m." or "31/05/2026 02:30:00 p. m."
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}):\d{2}\s*([ap])\.\s*m\.)?/i);
  if (!m) return null;
  const dd = m[1], mm = m[2], yyyy = m[3];
  let time: string | null = null;
  if (m[4]) {
    let h = parseInt(m[4], 10);
    const min = m[5];
    const ampm = m[6].toLowerCase();
    if (ampm === 'p' && h < 12) h += 12;
    if (ampm === 'a' && h === 12) h = 0;
    time = `${String(h).padStart(2, '0')}:${min}`;
  }
  return { date: `${yyyy}-${mm}-${dd}`, time };
}

interface UnamEventDetail {
  title: string | null;
  description: string;
  ogImage: string | null;
  ogUrl: string | null;
  venueName: string | null;
  venueAddress: string | null;
  priceText: string | null;
  dates: Array<{ date: string; time: string | null; endTime: string | null }>;
}

function parseDetail(html: string, slug: string): UnamEventDetail {
  const titleMatch = html.match(/<h1[^>]*itemprop="name"[^>]*>([\s\S]*?)<\/h1>/i);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : null;

  const ogImage = (html.match(/<meta property="og:image" content="([^"]+)"/i) || [])[1] || null;
  const ogUrl = (html.match(/<meta property="og:url" content="([^"]+)"/i) || [])[1] || null;

  const desc =
    (html.match(/<meta name="description" content="([^"]+)"/i) || [])[1] ||
    (html.match(/<meta property="og:description" content="([^"]+)"/i) || [])[1] ||
    '';

  // Venue: primer <span itemprop="name"> dentro de un div itemprop="location"
  let venueName: string | null = null;
  const locBlock = html.match(
    /itemprop="location"[\s\S]{0,800}?<(?:span|strong)[^>]*itemprop="name"[^>]*>([\s\S]*?)<\/(?:span|strong)>/i
  );
  if (locBlock) venueName = locBlock[1].replace(/<[^>]+>/g, '').trim() || null;

  let venueAddress: string | null = null;
  const addrBlock = html.match(/itemprop="address"[^>]*>([\s\S]*?)<\/[a-z]+>/i);
  if (addrBlock) venueAddress = addrBlock[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  let priceText: string | null = null;
  const priceMatch = html.match(/itemprop="price"[^>]*>([\s\S]*?)<\/(?:span|div|strong)>/i);
  if (priceMatch) priceText = priceMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  // Buscar TODAS las fechas: itemprop="startDate" content="..."
  const dates: Array<{ date: string; time: string | null; endTime: string | null }> = [];
  const startRe = /itemprop="startDate"[^>]*content="([^"]+)"/g;
  const endRe = /itemprop="endDate"[^>]*content="([^"]+)"/g;
  const starts: Array<{ date: string; time: string | null }> = [];
  let sm: RegExpExecArray | null;
  while ((sm = startRe.exec(html)) !== null) {
    const p = parseDateContent(sm[1]);
    if (p) starts.push(p);
  }
  const ends: Array<{ time: string | null }> = [];
  let em: RegExpExecArray | null;
  while ((em = endRe.exec(html)) !== null) {
    const p = parseDateContent(em[1]);
    if (p) ends.push({ time: p.time });
  }
  for (let i = 0; i < starts.length; i++) {
    dates.push({
      date: starts[i].date,
      time: starts[i].time,
      endTime: ends[i]?.time || null,
    });
  }

  return {
    title: title || slug.replace(/-/g, ' '),
    description:
      (desc || '').replace(/\s+/g, ' ').trim() ||
      `Evento de Cultura UNAM: ${title || slug}.`,
    ogImage,
    ogUrl,
    venueName,
    venueAddress,
    priceText,
    dates,
  };
}

function priceFromText(s: string | null): { isFree: boolean; price: number } {
  if (!s) return { isFree: true, price: 0 };
  const norm = s.toLowerCase();
  if (/entrada libre|gratuit|gratis|sin costo|acceso libre/.test(norm))
    return { isFree: true, price: 0 };
  const m = norm.match(/\$?\s*(\d{1,4}(?:[.,]\d{2})?)/);
  if (m) {
    const n = parseFloat(m[1].replace(',', '.'));
    if (!isNaN(n)) return { isFree: n === 0, price: n };
  }
  return { isFree: true, price: 0 };
}

export async function GET(req: NextRequest) {
  if (!commonCronAuth(req, req.nextUrl)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const maxEvents = Math.max(10, Math.min(200, Number(req.nextUrl.searchParams.get('max') || '80')));
  const onlyFree = req.nextUrl.searchParams.get('onlyFree') !== '0';

  const { data: city } = await supabase
    .from('cities')
    .select('id, slug')
    .eq('slug', 'mx')
    .maybeSingle();
  if (!city) return NextResponse.json({ error: 'CDMX missing' }, { status: 500 });

  const { data: cats } = await supabase.from('categories').select('id, slug');
  const catMap = new Map<string, number>();
  for (const c of cats || []) catMap.set(c.slug as string, c.id as number);

  // Step 1: recolectar slug -> categoria desde activities pages
  const slugToCategory = new Map<string, string>();
  for (const a of ACTIVITY_CATEGORIES) {
    const html = await fetchHtml(`${BASE}${a.path}`);
    if (!html) continue;
    const slugs = extractEventSlugs(html);
    for (const s of slugs) if (!slugToCategory.has(s)) slugToCategory.set(s, a.categorySlug);
    await new Promise((r) => setTimeout(r, 150));
  }

  const slugList = Array.from(slugToCategory.keys());
  // Shuffle
  for (let i = slugList.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [slugList[i], slugList[j]] = [slugList[j], slugList[i]];
  }
  const cap = Math.min(slugList.length, Math.max(40, Math.floor(maxEvents * 1.5)));
  slugList.length = cap;

  const today = todayMx();
  const outcomes: UpsertOutcome[] = [];
  let processed = 0;
  let kept = 0;

  const concurrency = 4;
  let idx = 0;
  while (idx < slugList.length && kept < maxEvents) {
    const batch = slugList.slice(idx, idx + concurrency);
    const detailHtmls = await Promise.all(batch.map((s) => fetchHtml(`${BASE}/evento/${s}`)));
    for (let i = 0; i < batch.length; i++) {
      processed++;
      const s = batch[i];
      const html = detailHtmls[i];
      if (!html) continue;
      const det = parseDetail(html, s);
      if (!det.title) continue;
      const { isFree, price } = priceFromText(det.priceText);
      if (onlyFree && !isFree) continue;
      const categorySlug = slugToCategory.get(s) || 'arte';
      const categoryId = catMap.get(categorySlug) || catMap.get('arte') || null;

      const futureDates = det.dates.filter((d) => d.date >= today).slice(0, 5);
      if (futureDates.length === 0) continue;

      const baseSlug = slugify(det.title);
      if (!baseSlug) continue;
      const storedImage = await downloadAndStoreImage(
        det.ogImage,
        'events/cdmx',
        `${baseSlug}-unam-${s.slice(0, 16)}`
      );
      const shortDesc = det.description.slice(0, 200);
      const address = [det.venueName, det.venueAddress].filter(Boolean).join(' — ') || det.venueName || null;

      let createdOrUpdated = 0;
      for (const dt of futureDates) {
        const slug = `${baseSlug}-unam-${s.slice(0, 16)}-${dt.date}`.slice(0, 110);
        const o = await upsertEventBySlug({
          title: det.title,
          slug,
          description: det.description,
          short_description: shortDesc,
          date: dt.date,
          time: dt.time,
          duration: null,
          price,
          currency: 'MXN',
          original_price: null,
          image: storedImage,
          gallery: null,
          city_id: city.id,
          category_id: categoryId,
          address,
          lat: null,
          lng: null,
          capacity: null,
          sold_count: 0,
          featured: false,
          status: 'PUBLISHED',
          external_url: det.ogUrl || `${BASE}/evento/${s}`,
          external_source: 'unam-cultura',
          external_id: s,
          updated_at: new Date().toISOString(),
        });
        outcomes.push(o);
        if (o.action === 'created' || o.action === 'updated') createdOrUpdated++;
      }
      if (createdOrUpdated > 0) kept++;
      if (kept >= maxEvents) break;
    }
    idx += concurrency;
    await new Promise((r) => setTimeout(r, 100));
  }

  const created = outcomes.filter((o) => o.action === 'created').length;
  const updated = outcomes.filter((o) => o.action === 'updated').length;
  const errors = outcomes.filter((o) => o.action === 'error').length;

  if (created + updated > 0) await pingRevalidateAndIndex(['/sitemap.xml', '/', '/cdmx']);

  return NextResponse.json({
    ok: true,
    onlyFree,
    activitiesScanned: ACTIVITY_CATEGORIES.length,
    eventSlugsFound: slugToCategory.size,
    slugsProcessed: processed,
    eventsKept: kept,
    rowsCreated: created,
    rowsUpdated: updated,
    rowsErrored: errors,
  });
}
