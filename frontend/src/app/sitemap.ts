import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export const revalidate = 3600; // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://ctxplorer.com';
  const now = new Date().toISOString();

  const [eventsRes, citiesRes, categoriesRes, blogRes, venuesRes] = await Promise.all([
    supabase
      .from('events')
      .select('slug, updated_at, date, featured')
      .eq('status', 'PUBLISHED')
      .order('date', { ascending: false }),
    supabase.from('cities').select('slug, updated_at'),
    supabase.from('categories').select('slug, updated_at'),
    supabase
      .from('blog_posts')
      .select('slug, updated_at, featured')
      .eq('status', 'PUBLISHED')
      .order('created_at', { ascending: false }),
    supabase
      .from('venues')
      .select('slug, updated_at, featured')
      .order('follower_count', { ascending: false }),
  ]);

  const events = eventsRes.data || [];
  const cities = citiesRes.data || [];
  const categories = categoriesRes.data || [];
  const blogPosts = blogRes.data || [];
  const venues = venuesRes.data || [];

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
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
      url: `${base}/legal/terms`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${base}/legal/privacy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${base}/legal/cookies`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.2,
    },
  ];

  // Event pages - highest priority for featured
  const eventUrls: MetadataRoute.Sitemap = events.map((e) => ({
    url: `${base}/events/${e.slug}`,
    lastModified: e.updated_at || now,
    changeFrequency: 'weekly' as const,
    priority: e.featured ? 0.9 : 0.8,
  }));

  // City landing pages (/{city-slug})
  const cityUrls: MetadataRoute.Sitemap = cities.map((c) => ({
    url: `${base}/${c.slug}`,
    lastModified: c.updated_at || now,
    changeFrequency: 'daily' as const,
    priority: 0.85,
  }));

  // Category search pages
  const catUrls: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${base}/search?category=${c.slug}`,
    lastModified: c.updated_at || now,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  // Blog listing page
  const blogListingUrl: MetadataRoute.Sitemap = [
    {
      url: `${base}/blog`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
  ];

  // Blog post pages
  const blogUrls: MetadataRoute.Sitemap = blogPosts.map((p: { slug: string; updated_at: string; featured: boolean }) => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: p.updated_at || now,
    changeFrequency: 'weekly' as const,
    priority: p.featured ? 0.8 : 0.7,
  }));

  // Venue profile pages
  const venueUrls: MetadataRoute.Sitemap = venues.map((v: { slug: string; updated_at: string; featured: boolean }) => ({
    url: `${base}/venues/${v.slug}`,
    lastModified: v.updated_at || now,
    changeFrequency: 'weekly' as const,
    priority: v.featured ? 0.85 : 0.8,
  }));

  // City + Category combinations for better coverage
  const combos: MetadataRoute.Sitemap = [];
  for (const city of cities.slice(0, 6)) {
    for (const cat of categories.slice(0, 10)) {
      combos.push({
        url: `${base}/search?city=${city.slug}&category=${cat.slug}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.5,
      });
    }
  }

  return [
    ...staticPages,
    ...eventUrls,
    ...blogListingUrl,
    ...blogUrls,
    ...venueUrls,
    ...cityUrls,
    ...catUrls,
    ...combos,
  ];
}