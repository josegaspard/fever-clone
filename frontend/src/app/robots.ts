import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
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
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/auth/',
          '/admin/',
          '/super-admin/',
          '/business/',
          '/onboarding/',
        ],
      },
    ],
    sitemap: 'https://fever-clone.vercel.app/sitemap.xml',
    host: 'https://fever-clone.vercel.app',
  };
}
