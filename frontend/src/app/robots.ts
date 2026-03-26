import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/plans/', '/tickets/'],
      },
    ],
    sitemap: 'https://fever-clone.vercel.app/sitemap.xml',
  };
}
