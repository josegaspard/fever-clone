import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = 'https://fever-clone.vercel.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/auth/',
          '/admin/',
          '/super-admin/',
          '/business/',
          '/onboarding/',
          '/plans/',
          '/tickets/',
          '/favorites/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/events/',
          '/search',
          '/build-day',
        ],
        disallow: [
          '/api/',
          '/auth/',
          '/admin/',
          '/super-admin/',
          '/business/',
          '/onboarding/',
          '/plans/',
          '/tickets/',
          '/favorites/',
        ],
      },
      {
        userAgent: 'Googlebot-Image',
        allow: '/',
        disallow: ['/api/'],
      },
      // AI search bots - allow for GEO visibility
      {
        userAgent: 'GPTBot',
        allow: ['/', '/events/', '/search', '/build-day'],
        disallow: ['/api/', '/auth/', '/admin/', '/super-admin/', '/business/'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: ['/', '/events/', '/search'],
        disallow: ['/api/', '/auth/', '/admin/', '/super-admin/', '/business/'],
      },
      {
        userAgent: 'Claude-Web',
        allow: ['/', '/events/', '/search'],
        disallow: ['/api/', '/auth/', '/admin/', '/super-admin/', '/business/'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: ['/', '/events/', '/search'],
        disallow: ['/api/', '/auth/', '/admin/', '/super-admin/', '/business/'],
      },
      {
        userAgent: 'Bingbot',
        allow: ['/', '/events/', '/search', '/build-day'],
        disallow: ['/api/', '/auth/', '/admin/', '/super-admin/', '/business/', '/onboarding/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}