import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { downloadAndStoreImage } from '@/lib/event-image';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const BASE_URL = 'https://ctxplorer.com';

// ---------------- IA cascade (reusa misma stack que daily-blog) ----------------

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODELS = ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'];

interface GeneratedPost {
  title: string;
  meta_title: string;
  meta_description: string;
  excerpt: string;
  tags: string[];
  content_html: string;
}

function extractJson(text: string): GeneratedPost {
  let cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }
  try {
    return JSON.parse(cleaned) as GeneratedPost;
  } catch (e) {
    const repaired = cleaned.replace(
      /("content_html"\s*:\s*)"((?:[^"\\]|\\.|[\r\n])*)"/g,
      (_m, k, v) => `${k}"${(v as string).replace(/\n/g, '\\n').replace(/\r/g, '')}"`
    );
    return JSON.parse(repaired) as GeneratedPost;
  }
}

async function callGemini(prompt: string): Promise<GeneratedPost & { _model: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');
  let lastErr: Error | null = null;
  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(`${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.65,
            topP: 0.9,
            maxOutputTokens: 32768,
            responseMimeType: 'application/json',
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
        lastErr = new Error(`Gemini ${model} HTTP ${res.status}: ${body.slice(0, 300)}`);
        if (res.status === 429 || res.status === 503) continue;
        throw lastErr;
      }
      const json = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>;
      };
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        lastErr = new Error(`Gemini ${model}: empty (finishReason=${json.candidates?.[0]?.finishReason})`);
        continue;
      }
      try {
        return { ...extractJson(text), _model: `gemini:${model}` };
      } catch (e) {
        lastErr = new Error(`Gemini ${model} JSON parse: ${(e as Error).message}`);
        continue;
      }
    } catch (e) {
      lastErr = e as Error;
      continue;
    }
  }
  throw lastErr || new Error('All Gemini models failed');
}

async function callOpenAICompatible(
  endpoint: string,
  apiKey: string | null,
  model: string,
  prompt: string,
  label: string
): Promise<GeneratedPost & { _model: string }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.65,
      max_tokens: 8000,
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${label} HTTP ${res.status}: ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error(`${label}: empty response`);
  return { ...extractJson(content), _model: `${label}:${model}` };
}

async function generateWithCascade(prompt: string): Promise<GeneratedPost & { _model?: string }> {
  const errors: string[] = [];
  try {
    return await callGemini(prompt);
  } catch (e) {
    errors.push(`gemini: ${(e as Error).message}`);
  }
  if (process.env.GROQ_API_KEY) {
    try {
      return await callOpenAICompatible(
        'https://api.groq.com/openai/v1/chat/completions',
        process.env.GROQ_API_KEY,
        'llama-3.3-70b-versatile',
        prompt,
        'groq'
      );
    } catch (e) {
      errors.push(`groq: ${(e as Error).message}`);
    }
  }
  if (process.env.OPENROUTER_API_KEY) {
    try {
      return await callOpenAICompatible(
        'https://openrouter.ai/api/v1/chat/completions',
        process.env.OPENROUTER_API_KEY,
        'deepseek/deepseek-v4-flash:free',
        prompt,
        'openrouter'
      );
    } catch (e) {
      errors.push(`openrouter: ${(e as Error).message}`);
    }
  }
  try {
    return await callOpenAICompatible(
      'https://text.pollinations.ai/openai',
      null,
      'openai-fast',
      prompt,
      'pollinations'
    );
  } catch (e) {
    errors.push(`pollinations: ${(e as Error).message}`);
  }
  throw new Error(`All providers failed: ${errors.join(' | ')}`);
}

// ---------------- TikTok extractor ----------------

interface TikTokMeta {
  url: string;
  videoId: string | null;
  title: string;
  authorName: string;
  authorUrl: string | null;
  thumbnail: string | null;
  caption: string;
}

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15';

function normalizeTikTokUrl(input: string): string {
  // Acepta vt.tiktok.com/XXX, vm.tiktok.com/XXX, tiktok.com/@user/video/ID
  const trimmed = input.trim().split('?')[0].replace(/\/$/, '');
  return trimmed;
}

function extractVideoId(url: string): string | null {
  const m = url.match(/\/video\/(\d{8,})/);
  return m ? m[1] : null;
}

async function fetchTikTokOEmbed(url: string): Promise<Partial<TikTokMeta>> {
  const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`, {
    headers: { 'User-Agent': UA },
  });
  if (!res.ok) return {};
  const json = (await res.json()) as {
    title?: string;
    author_name?: string;
    author_url?: string;
    thumbnail_url?: string;
  };
  return {
    title: json.title || '',
    authorName: json.author_name || '',
    authorUrl: json.author_url || null,
    thumbnail: json.thumbnail_url || null,
  };
}

async function fetchTikTokCaption(url: string): Promise<string> {
  // Sigue redirects (vm/vt shortlinks) y scrapea description meta
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'es-MX,es;q=0.9,en;q=0.8' },
      redirect: 'follow',
    });
    if (!res.ok) return '';
    const html = await res.text();
    // og:description / meta name=description / __UNIVERSAL_DATA_FOR_REHYDRATION__
    const ogDesc = html.match(/<meta property="og:description" content="([^"]+)"/)?.[1];
    const metaDesc = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
    const universal = html.match(
      /"desc":"((?:[^"\\]|\\.)*)"/
    )?.[1];
    let caption = '';
    if (universal) {
      try {
        caption = JSON.parse(`"${universal}"`);
      } catch {
        caption = universal;
      }
    }
    if (!caption) caption = ogDesc || metaDesc || '';
    return caption.trim();
  } catch {
    return '';
  }
}

async function extractTikTok(inputUrl: string, captionOverride?: string): Promise<TikTokMeta> {
  const url = normalizeTikTokUrl(inputUrl);
  // Resolver shortlinks vm.tiktok.com / vt.tiktok.com
  let finalUrl = url;
  if (/\/(vm|vt)\.tiktok\.com\//.test(url) || /^https?:\/\/(vm|vt)\.tiktok\.com\//.test(url)) {
    try {
      const r = await fetch(url, { method: 'HEAD', redirect: 'follow', headers: { 'User-Agent': UA } });
      finalUrl = r.url || url;
    } catch {
      // best-effort
    }
  }
  const [oembed, scraped] = await Promise.all([
    fetchTikTokOEmbed(finalUrl),
    captionOverride ? Promise.resolve('') : fetchTikTokCaption(finalUrl),
  ]);
  return {
    url: finalUrl,
    videoId: extractVideoId(finalUrl),
    title: oembed.title || '',
    authorName: oembed.authorName || '',
    authorUrl: oembed.authorUrl || null,
    thumbnail: oembed.thumbnail || null,
    caption: captionOverride?.trim() || scraped || oembed.title || '',
  };
}

// ---------------- Date helpers ----------------

const DAYS_ES = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
const MONTHS_ES = [
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
];
const DAY_ACCENT: Record<string, string> = { miercoles: 'miércoles', sabado: 'sábado' };

function parseDate(input?: string | null): {
  date: string;
  dayName: string;
  dayAccent: string;
  monthName: string;
  day: number;
} {
  let d: Date;
  if (input && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    d = new Date(`${input}T12:00:00Z`);
  } else {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Mexico_City',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = fmt.formatToParts(new Date());
    const y = parts.find((p) => p.type === 'year')!.value;
    const m = parts.find((p) => p.type === 'month')!.value;
    const dd = parts.find((p) => p.type === 'day')!.value;
    d = new Date(`${y}-${m}-${dd}T12:00:00Z`);
  }
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const date = `${y}-${m}-${dd}`;
  const dayName = DAYS_ES[d.getUTCDay()];
  return {
    date,
    dayName,
    dayAccent: DAY_ACCENT[dayName] || dayName,
    monthName: MONTHS_ES[d.getUTCMonth()],
    day: d.getUTCDate(),
  };
}

// ---------------- Pipeline ----------------

interface EventLite {
  title: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  time: string | null;
  address: string | null;
  price: number;
  currency: string | null;
  image: string | null;
  category: string | null;
  featured: boolean;
}

interface EventRow {
  title: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  date: string;
  time: string | null;
  address: string | null;
  price: number;
  currency: string | null;
  image: string | null;
  featured: boolean | null;
  categories?: { name: string } | null;
}

function buildEventsBlock(events: EventLite[]): string {
  if (!events.length) return '(Sin eventos registrados para esta fecha. Genera un post enfocado en la vibra que muestra el TikTok y planes generales clasicos de la ciudad para ese dia, SIN inventar eventos especificos con precio/hora/ubicacion.)';
  return events
    .map((e, i) => {
      const priceLbl = e.price === 0 ? 'Gratis' : `${e.price} ${e.currency || ''}`.trim();
      const desc = (e.shortDescription || e.description || '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 240) || 'Sin descripcion';
      return `${i + 1}. [${e.category || 'Evento'}] ${e.title}
   Hora: ${e.time || 'por confirmar'} | Lugar: ${e.address || 'consultar evento'} | Precio: ${priceLbl}
   ${desc}
   URL: ${BASE_URL}/events/${e.slug}`;
    })
    .join('\n\n');
}

function buildPrompt(opts: {
  tiktok: TikTokMeta;
  cityName: string;
  ctx: ReturnType<typeof parseDate>;
  events: EventLite[];
}): string {
  const { tiktok, cityName, ctx, events } = opts;
  const eventsBlock = buildEventsBlock(events);
  const slugBase = `que-hacer-hoy-${ctx.dayName}-${ctx.day}-de-${ctx.monthName}-en-${cityName.toLowerCase().replace(/\s+/g, '-')}`;

  return `Eres editor jefe de CTXplorer (${BASE_URL}), guia de experiencias urbanas. Recibiste un TikTok viral que dispara una nota editorial "Que hacer hoy ${ctx.dayAccent} ${ctx.day} de ${ctx.monthName} en ${cityName}". Tu trabajo: transformar el TikTok en una nota humana y SEO-optimizada que incorpora los eventos reales registrados en la plataforma.

==== INSUMO TIKTOK ====
URL: ${tiktok.url}
Autor: @${tiktok.authorName || 'desconocido'}${tiktok.authorUrl ? ` (${tiktok.authorUrl})` : ''}
Titulo extraido: ${tiktok.title || 'sin titulo'}
Caption / descripcion: ${tiktok.caption || '(no se pudo extraer)'}

==== EVENTOS REALES PUBLICADOS PARA HOY (${ctx.date}) EN ${cityName.toUpperCase()} ====
${eventsBlock}

==== REGLAS ESTRICTAS ====
Devuelve EXCLUSIVAMENTE un objeto JSON valido (sin markdown, sin backticks, sin texto antes/despues):
{
  "title": "Que hacer hoy ${ctx.dayAccent} ${ctx.day} de ${ctx.monthName} en ${cityName} (segun TikTok)",
  "meta_title": "<55-60 chars, gancho SEO, sin clickbait>",
  "meta_description": "<150-160 chars, menciona 2-3 highlights del TikTok+eventos>",
  "excerpt": "<140-180 chars, hook editorial humano>",
  "tags": ["que-hacer-hoy","${cityName.toLowerCase().replace(/\\s+/g, '-')}","${ctx.dayName}","tiktok","agenda-${ctx.monthName}"],
  "content_html": "<HTML completo del articulo>"
}

REGLAS content_html:
- 700-1100 palabras, HTML semantico (<p>, <h2>, <h3>, <ul>, <li>, <a>, <strong>, <blockquote>).
- Apertura: <p> que mencione lo que el TikTok captura sobre la ciudad hoy (vibra, lugar, momento). Cita el autor del TikTok como "via @${tiktok.authorName || 'creador local'}" sin disclaimers.
- Bloque embed: <p><a href="${tiktok.url}" target="_blank" rel="noopener">Ver el TikTok original (@${tiktok.authorName || 'tiktok'})</a></p>
- Seccion <h2>Lo que el TikTok te recuerda hacer hoy</h2>: 2-3 parrafos que extraen ideas/lugares del caption y los ubican en el contexto de ${cityName} este ${ctx.dayAccent}. Sin inventar lugares no mencionados.
- Seccion <h2>Eventos reales para esta noche (o este dia)</h2>: si hay eventos arriba, lista 3-5 destacados con <h3> + parrafo 60-90 palabras + CTA "<a href='${BASE_URL}/events/{slug}'>Ver detalles</a>". Si no hay eventos, OMITE esta seccion completa.
- Seccion <h2>Por categoria</h2>: resto de eventos agrupados (Conciertos / Gastronomia / Arte / Deportes / Teatro / Vida nocturna / Tours / Bienestar / Festivales / Inmersivas). Bullets con link interno. Omite si no hay eventos.
- Cierre <h2>Como combinar TikTok + agenda</h2>: 2 oraciones de planificacion + <a href="${BASE_URL}/perfect-day">Arma tu Perfect Day</a>.
- NUNCA inventes eventos, precios, ubicaciones, horarios. Solo usa eventos de la lista o ideas genericas del caption.
- Sin emojis. Sin "como inteligencia artificial". Sin meta-comentarios sobre el post o sobre TikTok como plataforma.
- Tono: cercano, mexicano-neutro si la ciudad es de habla hispana; castellano internacional para Madrid/Barcelona/BA/Lima/Bogota; espanol para Paris/London/NY respetando nombres propios en idioma original.
- Recuerda que el slug del post sera "${slugBase}-tk-${tiktok.videoId || 'manual'}-${ctx.date}".
`;
}

// ---------------- Events extractor del TikTok ----------------

interface TikTokExtractedEvent {
  title: string;
  date: string;
  time?: string | null;
  address: string;
  description: string;
  short_description?: string;
  category: string;
  source_url?: string | null;
}

async function extractEventsFromTikTok(
  tiktok: TikTokMeta,
  cityName: string,
  defaultDate: string
): Promise<TikTokExtractedEvent[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return [];

  const prompt = `Analiza este TikTok sobre ${cityName} y extrae EVENTOS especificos que se puedan agregar a una agenda cultural.

URL: ${tiktok.url}
Autor: @${tiktok.authorName || 'desconocido'}
Titulo: ${tiktok.title || ''}
Caption: ${tiktok.caption || '(sin caption)'}

Un EVENTO es algo con LUGAR concreto + ACTIVIDAD + fecha/horario implicito o explicito. Ejemplos:
- "El mercado de Coyoacan tiene tacos increibles los sabados" → evento {Mercado de Coyoacan - tacos, fecha sabado, address Centro Coyoacan}
- "Hoy hay concierto en Foro Indie Rocks" → evento {concierto Foro Indie Rocks}
- "El parque la Mexicana esta increible al atardecer" → evento {Parque La Mexicana atardecer}

NO son eventos: opiniones genericas, memes, contenido viral sin lugar fisico.

REGLAS estrictas:
- SOLO eventos con lugar concreto identificable.
- Fecha: si el TikTok no dice fecha exacta, usa ${defaultDate}.
- NO inventes precios, horarios o detalles que no esten en el caption.
- Si no hay ningun evento extraible, devuelve {"events": []}.

Devuelve EXCLUSIVAMENTE JSON valido (sin markdown, sin backticks):
{
  "events": [
    {
      "title": "Nombre del evento o lugar+actividad",
      "date": "YYYY-MM-DD",
      "time": "HH:MM" o null,
      "address": "Direccion o zona en ${cityName}",
      "description": "60-120 palabras explicando que es, basado solo en el TikTok. Cita el TikTok como 'segun @${tiktok.authorName || 'creador local'}'.",
      "short_description": "1 oracion max 200 chars",
      "category": "uno de: conciertos | arte | gastronomia | teatro | festivales | inmersivo | deportes | bienestar | tours | nightlife",
      "source_url": "${tiktok.url}"
    }
  ]
}

Maximo 3 eventos. Si dudas, devuelve menos.`;

  // Solo intenta Gemini para esta extraccion (la siguiente llamada hara cascade completo)
  for (const model of ['gemini-2.5-flash', 'gemini-2.5-flash-lite']) {
    try {
      const res = await fetch(`${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            topP: 0.9,
            maxOutputTokens: 8000,
            responseMimeType: 'application/json',
          },
        }),
      });
      if (!res.ok) continue;
      const json = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) continue;
      let cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      const first = cleaned.indexOf('{');
      const last = cleaned.lastIndexOf('}');
      if (first !== -1 && last !== -1 && last > first) cleaned = cleaned.slice(first, last + 1);
      const parsed = JSON.parse(cleaned) as { events?: TikTokExtractedEvent[] };
      return (parsed.events || []).filter(
        (e) => e && e.title && e.date && /^\d{4}-\d{2}-\d{2}$/.test(e.date) && e.address
      );
    } catch {
      continue;
    }
  }
  return [];
}

async function upsertExtractedEvent(
  ev: TikTokExtractedEvent,
  cityId: number,
  categoryIdsBySlug: Map<string, number>,
  tiktokVideoId: string | null
): Promise<{ slug: string; action: string; error?: string }> {
  const baseSlug = (function slugify(s: string) {
    return s
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-')
      .slice(0, 80);
  })(ev.title);
  if (!baseSlug) return { slug: '', action: 'skipped', error: 'no slug' };
  const suffix = tiktokVideoId ? `tk-${tiktokVideoId.slice(-8)}` : `tk-${ev.date}`;
  const slug = `${baseSlug}-${suffix}`.slice(0, 110);

  const categoryId =
    categoryIdsBySlug.get(ev.category) || categoryIdsBySlug.get('tours') || null;

  const payload = {
    title: ev.title,
    slug,
    description: ev.description,
    short_description: (ev.short_description || ev.description).slice(0, 200),
    date: ev.date,
    time: ev.time || null,
    duration: null,
    price: 0,
    currency: 'MXN',
    original_price: null,
    image: null,
    gallery: null,
    city_id: cityId,
    category_id: categoryId,
    address: ev.address,
    lat: null,
    lng: null,
    capacity: null,
    sold_count: 0,
    featured: false,
    status: 'PUBLISHED',
    external_url: ev.source_url || null,
    external_source: 'tiktok',
    external_id: tiktokVideoId,
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

// ---------------- Handler ----------------

interface SubmitBody {
  tiktokUrl?: string;
  citySlug?: string;
  date?: string;
  captionOverride?: string;
  dryRun?: boolean;
  extractEvents?: boolean; // default true
}

export async function POST(req: NextRequest) {
  // Auth: Bearer CEREBRO_TOKEN, o ?key=CRON_DEBUG_KEY, o CRON_SECRET
  const auth = req.headers.get('authorization') || '';
  const debugQuery = new URL(req.url).searchParams.get('key');
  const cereroToken = process.env.CEREBRO_TOKEN || '';
  const cronSecret = process.env.CRON_SECRET || '';
  const debugKey = process.env.CRON_DEBUG_KEY || '';
  const allowed =
    (cereroToken && auth === `Bearer ${cereroToken}`) ||
    (cronSecret && auth === `Bearer ${cronSecret}`) ||
    (debugKey && debugQuery === debugKey);
  if (!allowed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: SubmitBody;
  try {
    body = (await req.json()) as SubmitBody;
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  if (!body.tiktokUrl || !/tiktok\.com\//i.test(body.tiktokUrl)) {
    return NextResponse.json({ error: 'tiktokUrl invalido o ausente' }, { status: 400 });
  }
  if (!body.citySlug) {
    return NextResponse.json({ error: 'citySlug requerido' }, { status: 400 });
  }

  const ctx = parseDate(body.date);

  // 1. City lookup
  const { data: city, error: cityErr } = await supabase
    .from('cities')
    .select('id, slug, name')
    .eq('slug', body.citySlug)
    .maybeSingle();
  if (cityErr || !city) {
    return NextResponse.json(
      { error: `ciudad no encontrada: ${body.citySlug}` },
      { status: 404 }
    );
  }

  // 2. Extract TikTok
  let tiktok: TikTokMeta;
  try {
    tiktok = await extractTikTok(body.tiktokUrl, body.captionOverride);
  } catch (e) {
    return NextResponse.json(
      { error: `extract tiktok: ${(e as Error).message}` },
      { status: 500 }
    );
  }

  // 3a. NUEVO: extraer eventos del TikTok y upsertearlos en events
  const extractEvents = body.extractEvents !== false;
  let tiktokEvents: TikTokExtractedEvent[] = [];
  const eventOutcomes: Array<{ slug: string; action: string; error?: string }> = [];
  if (extractEvents && !body.dryRun) {
    try {
      tiktokEvents = await extractEventsFromTikTok(tiktok, city.name, ctx.date);
    } catch {
      // no fatal — sigue
    }
    if (tiktokEvents.length) {
      const { data: cats } = await supabase.from('categories').select('id, slug');
      const categoryIdsBySlug = new Map<string, number>();
      for (const c of cats || []) categoryIdsBySlug.set(c.slug as string, c.id as number);
      for (const ev of tiktokEvents) {
        eventOutcomes.push(
          await upsertExtractedEvent(ev, city.id, categoryIdsBySlug, tiktok.videoId)
        );
      }
    }
  } else if (extractEvents && body.dryRun) {
    // En dryRun solo extrae pero no upsertea
    try {
      tiktokEvents = await extractEventsFromTikTok(tiktok, city.name, ctx.date);
    } catch {}
  }

  // 3b. Query eventos reales de esa ciudad+fecha (incluye los recien creados arriba)
  const { data: eventsRaw } = await supabase
    .from('events')
    .select(
      'title, slug, short_description, description, date, time, address, price, currency, image, featured, categories(name)'
    )
    .eq('status', 'PUBLISHED')
    .eq('city_id', city.id)
    .eq('date', ctx.date)
    .order('featured', { ascending: false })
    .order('rating', { ascending: false, nullsFirst: false })
    .limit(20);

  const events: EventLite[] = (eventsRaw as unknown as EventRow[] | null || []).map((e) => ({
    title: e.title,
    slug: e.slug,
    shortDescription: e.short_description,
    description: e.description,
    time: e.time,
    address: e.address,
    price: e.price ?? 0,
    currency: e.currency,
    image: e.image,
    category: e.categories?.name || null,
    featured: !!e.featured,
  }));

  // 4. Generar post con IA cascade
  const prompt = buildPrompt({ tiktok, cityName: city.name, ctx, events });
  let gen: GeneratedPost & { _model?: string };
  try {
    gen = await generateWithCascade(prompt);
  } catch (e) {
    return NextResponse.json(
      { error: `generate: ${(e as Error).message}`, tiktok, eventsCount: events.length },
      { status: 502 }
    );
  }

  // 5. Slug + payload
  const slug = `que-hacer-hoy-${ctx.dayName}-${ctx.day}-de-${ctx.monthName}-en-${city.slug}-tk-${tiktok.videoId || 'manual'}-${ctx.date}`;
  const rawHero = tiktok.thumbnail || events.find((e) => e.image)?.image || null;
  // TikTok thumbnails caducan en horas — guardamos copia en bucket
  const heroImage = await downloadAndStoreImage(rawHero, 'blog/cerebro', `${slug}-hero`);
  const wordCount = gen.content_html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(3, Math.round(wordCount / 220));

  if (body.dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      tiktok,
      city: city.slug,
      date: ctx.date,
      eventsCount: events.length,
      tiktokEvents,
      slug,
      title: gen.title,
      meta_title: gen.meta_title,
      meta_description: gen.meta_description,
      wordCount,
      readingTime,
      _model: gen._model,
    });
  }

  // 6. UPSERT blog_posts
  const payload = {
    title: gen.title,
    slug,
    content: gen.content_html,
    excerpt: gen.excerpt,
    image: heroImage,
    author_name: 'CTXplorer Editorial',
    category: 'ciudades',
    tags: gen.tags,
    meta_title: gen.meta_title,
    meta_description: gen.meta_description,
    status: 'PUBLISHED',
    featured: false,
    reading_time: readingTime,
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase
    .from('blog_posts')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase.from('blog_posts').update(payload).eq('id', existing.id);
    if (error) return NextResponse.json({ error: `update: ${error.message}` }, { status: 500 });
  } else {
    const { error } = await supabase.from('blog_posts').insert(payload);
    if (error) return NextResponse.json({ error: `insert: ${error.message}` }, { status: 500 });
  }

  // 7. Revalidate + IndexNow
  const revalidatePaths = ['/sitemap.xml', '/blog', `/blog/${slug}`];
  try {
    await fetch(`${BASE_URL}/api/revalidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths: revalidatePaths }),
    });
  } catch {}
  try {
    await fetch(`${BASE_URL}/api/indexnow`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${process.env.INDEXNOW_SECRET || 'daa5b4e30e59aa273c9f7ed20f36fc0f'}`,
      },
    });
  } catch {}

  return NextResponse.json({
    ok: true,
    slug,
    url: `${BASE_URL}/blog/${slug}`,
    city: city.slug,
    date: ctx.date,
    eventsCount: events.length,
    tiktok: { url: tiktok.url, author: tiktok.authorName, title: tiktok.title },
    extractedEvents: eventOutcomes,
    wordCount,
    action: existing?.id ? 'updated' : 'created',
    _model: gen._model,
  });
}
