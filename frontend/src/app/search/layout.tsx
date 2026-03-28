import { Metadata } from 'next';

const BASE_URL = 'https://fever-clone.vercel.app';

export const metadata: Metadata = {
  title: 'Buscar eventos | Fever',
  description:
    'Busca y filtra eventos, conciertos, teatro, gastronomía, arte y más en tu ciudad. Encuentra entradas y experiencias únicas cerca de ti. Compara precios y compra tickets online.',
  keywords: [
    'buscar eventos', 'conciertos', 'teatro', 'gastronomía', 'arte',
    'experiencias', 'entradas', 'tickets', 'eventos cerca de mí',
    'comprar entradas', 'eventos hoy', 'eventos este fin de semana',
    'planes', 'actividades', 'agenda cultural', 'qué hacer hoy',
    'eventos gratis', 'festivales', 'espectáculos', 'ocio',
    'eventos Ciudad de México', 'eventos Madrid', 'eventos Barcelona',
  ],
  openGraph: {
    title: 'Buscar eventos | Fever',
    description: 'Encuentra los mejores eventos, conciertos y experiencias en tu ciudad. Filtra por categoría, ciudad y precio.',
    url: `${BASE_URL}/search`,
    siteName: 'Fever',
    type: 'website',
    locale: 'es_ES',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Buscar eventos en Fever',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@fever',
    title: 'Buscar eventos | Fever',
    description: 'Encuentra los mejores eventos, conciertos y experiencias en tu ciudad.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: `${BASE_URL}/search`,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  const searchBreadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Inicio',
        item: BASE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Buscar eventos',
        item: `${BASE_URL}/search`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(searchBreadcrumbJsonLd) }}
      />
      {children}
    </>
  );
}
