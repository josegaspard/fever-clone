import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://fever-clone.vercel.app';
  const now = new Date().toISOString();

  const [eventsRes, citiesRes, categoriesRes] = await Promise.all([
    supabase
      .from('events')
      .select('slug, updated_at, date, featured')
      .eq('status', 'PUBLISHED')
      .order('date', { ascending: false }),
    supabase.from('cities').select('slug, updated_at'),
    supabase.from('categories').select('slug, updated_at'),
  ]);

  const events = eventsRes.data || [];
  const cities = citiesRes.data || [];
  const categories = categoriesRes.data || [];

  const eventUrls: MetadataRoute.Sitemap = events.map((e) => ({
    url: `${base}/events/${e.slug}`,
    lastModified: e.updated_at || now,
    changeFrequency: 'weekly' as const,
    priority: e.featured ? 0.9 : 0.8,
  }));

  const cityUrls: MetadataRoute.Sitemap = cities.map((c) => ({
    url: `${base}/search?city=${c.slug}`,
    lastModified: c.updated_at || now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const catUrls: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${base}/search?category=${c.slug}`,
    lastModified: c.updated_at || now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [
    {
      url: base,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${base}/search`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${base}/build-day`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${base}/auth/login`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${base}/auth/register`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    ...eventUrls,
    ...cityUrls,
    ...catUrls,
  ];
}
