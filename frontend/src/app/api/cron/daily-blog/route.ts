import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODELS = ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'];

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const BASE_URL = 'https://ctxplorer.com';
const ANCHOR_TZ = 'America/Mexico_City';

const DAYS_ES = [
  'domingo',
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
];
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

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function getDateContext(): {
  date: string;
  dayName: string;
  dayNameAccent: string;
  monthName: string;
  day: number;
} {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: ANCHOR_TZ,
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
  const dayName = DAYS_ES[dObj.getUTCDay()];
  const accentMap: Record<string, string> = {
    miercoles: 'miércoles',
    sabado: 'sábado',
  };
  const dayNameAccent = accentMap[dayName] || dayName;
  const monthName = MONTHS_ES[parseInt(m, 10) - 1];
  return { date, dayName, dayNameAccent, monthName, day: parseInt(d, 10) };
}

interface CityRow {
  id: number;
  slug: string;
  name: string;
  country: string | null;
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

interface GeneratedPost {
  title: string;
  meta_title: string;
  meta_description: string;
  excerpt: string;
  tags: string[];
  content_html: string;
}

function buildEventsBlock(events: EventLite[]): string {
  return events
    .map((e, i) => {
      const priceLbl =
        e.price === 0 ? 'Gratis' : `${e.price} ${e.currency || ''}`.trim();
      const desc =
        (e.shortDescription || e.description || '')
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

async function callGemini(prompt: string): Promise<GeneratedPost & { _model?: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');
  let lastErr: Error | null = null;
  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(`${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.6,
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
    // repair unescaped newlines inside content_html
    const repaired = cleaned.replace(
      /("content_html"\s*:\s*)"((?:[^"\\]|\\.|[\r\n])*)"/g,
      (_m, k, v) => `${k}"${(v as string).replace(/\n/g, '\\n').replace(/\r/g, '')}"`
    );
    return JSON.parse(repaired) as GeneratedPost;
  }
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
      temperature: 0.6,
      max_tokens: 8000,
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${label} HTTP ${res.status}: ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error(`${label}: empty response`);
  return { ...extractJson(content), _model: `${label}:${model}` };
}

async function callPollinations(prompt: string): Promise<GeneratedPost & { _model: string }> {
  // text.pollinations.ai is OpenAI-compatible, no key required
  // openai-fast = GPT-OSS 20B reasoning (anonymous tier)
  return await callOpenAICompatible(
    'https://text.pollinations.ai/openai',
    null,
    'openai-fast',
    prompt,
    'pollinations'
  );
}

async function callGroq(prompt: string): Promise<GeneratedPost & { _model: string }> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');
  return await callOpenAICompatible(
    'https://api.groq.com/openai/v1/chat/completions',
    apiKey,
    'llama-3.3-70b-versatile',
    prompt,
    'groq'
  );
}

async function callOpenRouter(prompt: string): Promise<GeneratedPost & { _model: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set');
  return await callOpenAICompatible(
    'https://openrouter.ai/api/v1/chat/completions',
    apiKey,
    'deepseek/deepseek-v4-flash:free',
    prompt,
    'openrouter'
  );
}

async function generateWithCascade(prompt: string): Promise<GeneratedPost & { _model?: string }> {
  const errors: string[] = [];
  // Primary: Gemini cascade (Pro -> Flash -> Flash-Lite)
  try {
    return await callGemini(prompt);
  } catch (e) {
    errors.push(`gemini: ${(e as Error).message}`);
  }
  // Fallbacks in order: Groq (if key) -> OpenRouter (if key) -> Pollinations (no key)
  if (process.env.GROQ_API_KEY) {
    try {
      return await callGroq(prompt);
    } catch (e) {
      errors.push(`groq: ${(e as Error).message}`);
    }
  }
  if (process.env.OPENROUTER_API_KEY) {
    try {
      return await callOpenRouter(prompt);
    } catch (e) {
      errors.push(`openrouter: ${(e as Error).message}`);
    }
  }
  try {
    return await callPollinations(prompt);
  } catch (e) {
    errors.push(`pollinations: ${(e as Error).message}`);
  }
  throw new Error(`All providers failed: ${errors.join(' | ')}`);
}

async function generatePost(
  cityName: string,
  events: EventLite[],
  ctx: ReturnType<typeof getDateContext>
): Promise<GeneratedPost> {
  const eventsBlock = buildEventsBlock(events);
  const citySlug = slugify(cityName);

  const prompt = `Eres editor de CTXplorer (${BASE_URL}), guia de experiencias en ciudades. Escribe el post diario "Que hacer hoy ${ctx.dayNameAccent} ${ctx.day} de ${ctx.monthName} en ${cityName}" usando UNICAMENTE los eventos reales abajo.

EVENTOS PUBLICADOS PARA HOY (${ctx.date}) EN ${cityName.toUpperCase()}:

${eventsBlock}

Devuelve EXCLUSIVAMENTE un objeto JSON valido (sin markdown, sin backticks, sin texto antes o despues) con esta forma exacta:
{
  "title": "Que hacer hoy ${ctx.dayNameAccent} ${ctx.day} de ${ctx.monthName} en ${cityName}",
  "meta_title": "<55-60 caracteres, gancho SEO sin clickbait>",
  "meta_description": "<150-160 caracteres, menciona 2-3 eventos destacados>",
  "excerpt": "<140-180 caracteres, hook editorial humano>",
  "tags": ["que-hacer-hoy","${citySlug}","${ctx.dayName}","agenda-${ctx.monthName}","eventos-${ctx.date.slice(0, 4)}"],
  "content_html": "<HTML completo del articulo>"
}

REGLAS de content_html (estrictas):
- 600-900 palabras, HTML semantico (<p>, <h2>, <h3>, <ul>, <li>, <a>, <strong>).
- Apertura: <p> editorial de 2-3 oraciones que situe el dia (clima emocional, ritmo de la ciudad), tono humano, sin formulas tipo "en este post" ni "como inteligencia artificial".
- Seccion <h2>Lo imperdible de hoy</h2>: elige 3 a 5 eventos top (featured o con mayor relevancia editorial). Cada uno con <h3>Titulo</h3> seguido de <p> de 50-90 palabras que mezcle descripcion, ubicacion, hora y razon para ir. Cierra cada bloque con <p><a href="${BASE_URL}/events/{slug}">Ver detalles y reservar</a></p>.
- Seccion <h2>Por categoria</h2>: agrupa el resto de eventos en <h3> por categoria (Conciertos, Gastronomia, Arte y museos, Deportes, Teatro, Vida nocturna, Tours, Bienestar, Festivales, Inmersivas, Otros). Usa <ul><li><a href="...">Titulo</a> - 1 frase corta</li></ul>. Omite categorias sin eventos.
- Cierre: <h2>Como armar tu plan</h2> con <p> de 2-3 oraciones recomendando combinar 2-3 actividades y un <p> final con <a href="${BASE_URL}/perfect-day">Arma tu Perfect Day</a>.
- NUNCA inventes eventos, precios, ubicaciones, horarios ni links. Usa solo lo de la lista. Si un campo falta, omitelo elegantemente.
- Sin emojis. Sin "click aqui". Sin disclaimers de IA. Sin meta-comentarios sobre el post.
- Tono: cercano, editorial, mexicano-neutro si la ciudad es de habla hispana; en castellano internacional para Madrid/Barcelona/BA/Lima/Bogota. Para Paris/London/NY mantener el post en espanol pero respetar nombres propios en idioma original.
`;

  return await generateWithCascade(prompt);
}

async function processCity(
  city: CityRow,
  ctx: ReturnType<typeof getDateContext>,
  dryRun: boolean
): Promise<Record<string, unknown>> {
  const { data: events, error: evErr } = await supabase
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

  if (evErr) return { city: city.slug, error: `events query: ${evErr.message}` };
  if (!events || events.length === 0) {
    return { city: city.slug, skipped: 'no events for date' };
  }

  const eventsLite: EventLite[] = (events as unknown as EventRow[]).map((e) => ({
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

  let gen: GeneratedPost;
  try {
    gen = await generatePost(city.name, eventsLite, ctx);
  } catch (err) {
    return {
      city: city.slug,
      error: `generate: ${(err as Error).message}`,
      eventsCount: eventsLite.length,
    };
  }

  const slug = `que-hacer-hoy-${ctx.dayName}-${ctx.day}-de-${ctx.monthName}-en-${city.slug}-${ctx.date}`;
  const heroImage = eventsLite.find((e) => e.image)?.image || null;
  const wordCount = gen.content_html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(3, Math.round(wordCount / 220));

  if (dryRun) {
    return {
      city: city.slug,
      slug,
      title: gen.title,
      eventsCount: eventsLite.length,
      wordCount,
      would_publish: true,
    };
  }

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
    if (error) return { city: city.slug, slug, error: `update: ${error.message}` };
    return { city: city.slug, slug, eventsCount: eventsLite.length, action: 'updated' };
  }

  const { error } = await supabase.from('blog_posts').insert(payload);
  if (error) return { city: city.slug, slug, error: `insert: ${error.message}` };
  return { city: city.slug, slug, eventsCount: eventsLite.length, action: 'created' };
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

  if (!allowed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // No hard requirement on GEMINI_API_KEY — Pollinations works without any key.
  // Recommended: at least GEMINI_API_KEY set. Optional: GROQ_API_KEY, OPENROUTER_API_KEY.

  const cityFilter = req.nextUrl.searchParams.get('city');
  const dryRun = req.nextUrl.searchParams.get('dryRun') === '1';
  const ctx = getDateContext();

  const { data: cities, error: citiesErr } = await supabase
    .from('cities')
    .select('id, slug, name, country')
    .order('name', { ascending: true });

  if (citiesErr || !cities) {
    return NextResponse.json(
      { error: `cities query: ${citiesErr?.message || 'no data'}` },
      { status: 500 }
    );
  }

  const targets = cityFilter
    ? (cities as CityRow[]).filter((c) => c.slug === cityFilter)
    : (cities as CityRow[]);

  if (targets.length === 0) {
    return NextResponse.json({ error: 'no matching cities' }, { status: 404 });
  }

  const results = await Promise.all(
    targets.map((city) => processCity(city, ctx, dryRun))
  );

  const published = results.filter(
    (r) => r.action === 'created' || r.action === 'updated'
  ).length;

  // After publishing: revalidate sitemap + blog pages, then ping IndexNow
  if (!dryRun && published > 0) {
    const publishedSlugs = results
      .filter((r) => r.action === 'created' || r.action === 'updated')
      .map((r) => r.slug as string)
      .filter(Boolean);

    const revalidatePaths = [
      '/sitemap.xml',
      '/blog',
      ...publishedSlugs.map((s) => `/blog/${s}`),
    ];

    try {
      await fetch(`${BASE_URL}/api/revalidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: revalidatePaths }),
      });
    } catch {
      // best-effort
    }

    try {
      await fetch(`${BASE_URL}/api/indexnow`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${process.env.INDEXNOW_SECRET || 'daa5b4e30e59aa273c9f7ed20f36fc0f'}`,
        },
      });
    } catch {
      // best-effort
    }
  }

  return NextResponse.json({
    ok: true,
    date: ctx.date,
    dayName: ctx.dayNameAccent,
    dryRun,
    citiesProcessed: targets.length,
    published,
    results,
  });
}
