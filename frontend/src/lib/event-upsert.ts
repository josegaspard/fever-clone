import { supabase } from '@/lib/supabase';

export interface EventPayload {
  title: string;
  slug: string;
  description: string;
  short_description: string;
  date: string;
  time?: string | null;
  duration?: string | null;
  price: number;
  currency?: string | null;
  original_price?: number | null;
  image: string | null;
  gallery?: string | null;
  city_id: number;
  category_id: number | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  capacity?: number | null;
  sold_count?: number;
  featured?: boolean;
  status?: string;
  external_url?: string | null;
  external_source?: string | null;
  external_id?: string | null;
  updated_at?: string;
}

export type UpsertAction = 'created' | 'updated' | 'error' | 'skipped';

export interface UpsertOutcome {
  slug: string;
  action: UpsertAction;
  error?: string;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 96);
}

export async function upsertEventBySlug(payload: EventPayload): Promise<UpsertOutcome> {
  const writeOnce = async (data: Record<string, unknown>, op: 'insert' | 'update', id?: number) => {
    if (op === 'insert') return await supabase.from('events').insert(data);
    return await supabase.from('events').update(data).eq('id', id!);
  };

  const tryWrite = async (
    op: 'insert' | 'update',
    existingId?: number
  ): Promise<{ error: string | null }> => {
    const first = await writeOnce(payload as unknown as Record<string, unknown>, op, existingId);
    if (!first.error) return { error: null };
    if (/column.*does not exist|external_/i.test(first.error.message)) {
      const fallback = { ...payload } as Record<string, unknown>;
      delete fallback.external_url;
      delete fallback.external_source;
      delete fallback.external_id;
      const second = await writeOnce(fallback, op, existingId);
      if (second.error) return { error: second.error.message };
      return { error: null };
    }
    return { error: first.error.message };
  };

  const { data: existing } = await supabase
    .from('events')
    .select('id')
    .eq('slug', payload.slug)
    .maybeSingle();

  if (existing?.id) {
    const r = await tryWrite('update', existing.id);
    return { slug: payload.slug, action: r.error ? 'error' : 'updated', error: r.error || undefined };
  }
  const r = await tryWrite('insert');
  return { slug: payload.slug, action: r.error ? 'error' : 'created', error: r.error || undefined };
}

export async function loadCityAndCats(citySlug: string) {
  const { data: city } = await supabase
    .from('cities')
    .select('id, slug, name')
    .eq('slug', citySlug)
    .maybeSingle();
  const { data: cats } = await supabase.from('categories').select('id, slug');
  const categoryIdsBySlug = new Map<string, number>();
  for (const c of cats || []) categoryIdsBySlug.set(c.slug as string, c.id as number);
  return { city, categoryIdsBySlug };
}

export function todayMx(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export async function pingRevalidateAndIndex(paths: string[] = ['/sitemap.xml', '/']) {
  try {
    await fetch('https://ctxplorer.com/api/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths }),
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

export function commonCronAuth(req: Request, url: URL): boolean {
  const auth = req.headers.get('authorization') || '';
  const expected = `Bearer ${process.env.CRON_SECRET || ''}`;
  const debugKey = process.env.CRON_DEBUG_KEY || '';
  const debugQuery = url.searchParams.get('key');
  const isVercelCron = req.headers.get('x-vercel-cron') === '1';
  return (
    isVercelCron ||
    (!!process.env.CRON_SECRET && auth === expected) ||
    (!!debugKey && debugQuery === debugKey)
  );
}
