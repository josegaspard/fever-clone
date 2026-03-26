import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://fever-clone.vercel.app';

  const { data: events } = await supabase
    .from('events')
    .select('slug, updated_at')
    .eq('status', 'PUBLISHED');

  const { data: cities } = await supabase.from('cities').select('slug');
  const { data: categories } = await supabase.from('categories').select('slug');

  const eventUrls = (events || []).map((e) => ({
    url: `${base}/events/${e.slug}`,
    lastModified: e.updated_at || new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const cityUrls = (cities || []).map((c) => ({
    url: `${base}/search?city=${c.slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  const catUrls = (categories || []).map((c) => ({
    url: `${base}/search?category=${c.slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [
    { url: base, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/search`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/auth/login`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/auth/register`, changeFrequency: 'monthly', priority: 0.3 },
    ...eventUrls,
    ...cityUrls,
    ...catUrls,
  ];
}
