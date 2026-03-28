import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/components/Toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://fever-clone.vercel.app'),
  title: {
    default: 'Fever - Descubre los mejores planes y eventos en tu ciudad',
    template: '%s | Fever',
  },
  description:
    'Descubre experiencias únicas, conciertos, gastronomía, arte y más. Crea tu Day perfecto con eventos en Ciudad de México, Madrid, Barcelona, New York, London y Paris. Compra entradas y tickets online.',
  keywords: [
    'eventos', 'experiencias', 'conciertos', 'teatro', 'gastronomía',
    'arte', 'festivales', 'CDMX', 'Madrid', 'Barcelona', 'planes',
    'actividades', 'qué hacer', 'tickets', 'entradas', 'espectáculos',
    'ocio', 'cultura', 'nightlife', 'vida nocturna', 'museos',
    'exposiciones', 'talleres', 'workshops', 'New York', 'London',
    'Paris', 'eventos cerca de mí', 'comprar entradas online',
    'planes fin de semana', 'cosas que hacer', 'agenda cultural',
  ],
  authors: [{ name: 'Fever' }],
  creator: 'Fever',
  publisher: 'Fever',
  alternates: {
    canonical: 'https://fever-clone.vercel.app',
  },
  manifest: '/manifest.json',
  verification: {
    google: 'GOOGLE_SITE_VERIFICATION_PLACEHOLDER',
    other: {
      'msvalidate.01': 'BING_SITE_VERIFICATION_PLACEHOLDER',
      'yandex-verification': 'YANDEX_VERIFICATION_PLACEHOLDER',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    siteName: 'Fever',
    title: 'Fever - Descubre los mejores planes y eventos en tu ciudad',
    description: 'Experiencias únicas, conciertos, gastronomía y más. Crea tu Day perfecto.',
    url: 'https://fever-clone.vercel.app',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Fever - Descubre los mejores eventos y experiencias en tu ciudad',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@fever',
    creator: '@fever',
    title: 'Fever - Descubre los mejores planes en tu ciudad',
    description: 'Experiencias únicas, conciertos, gastronomía y más.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Fever - Descubre los mejores eventos y experiencias en tu ciudad',
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'entertainment',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Fever',
    url: 'https://fever-clone.vercel.app',
    description: 'Descubre los mejores planes y eventos en tu ciudad. Conciertos, gastronomía, arte, festivales y experiencias únicas.',
    inLanguage: 'es',
    publisher: {
      '@type': 'Organization',
      name: 'Fever',
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://fever-clone.vercel.app/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Fever',
    url: 'https://fever-clone.vercel.app',
    logo: {
      '@type': 'ImageObject',
      url: 'https://fever-clone.vercel.app/og-image.png',
      width: 1200,
      height: 630,
    },
    description: 'Plataforma de descubrimiento de eventos y experiencias en tu ciudad. Compra entradas para conciertos, teatro, gastronomía y más.',
    foundingDate: '2024',
    sameAs: [
      'https://www.instagram.com/fever',
      'https://twitter.com/fever',
      'https://www.facebook.com/fever',
      'https://www.tiktok.com/@fever',
      'https://www.youtube.com/@fever',
      'https://www.linkedin.com/company/fever',
    ],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        availableLanguage: ['Spanish', 'English'],
        url: 'https://fever-clone.vercel.app',
      },
    ],
    areaServed: [
      { '@type': 'City', name: 'Ciudad de México' },
      { '@type': 'City', name: 'Madrid' },
      { '@type': 'City', name: 'Barcelona' },
      { '@type': 'City', name: 'New York' },
      { '@type': 'City', name: 'London' },
      { '@type': 'City', name: 'Paris' },
    ],
    knowsAbout: [
      'Events', 'Concerts', 'Theater', 'Gastronomy', 'Art', 'Festivals',
    ],
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Inicio',
        item: 'https://fever-clone.vercel.app',
      },
    ],
  };

  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <head>
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: dark)" />
        <script dangerouslySetInnerHTML={{ __html: `try{const t=localStorage.getItem('theme')||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');if(t==='dark')document.documentElement.classList.add('dark')}catch(e){}` }} />
        <link rel="canonical" href="https://fever-clone.vercel.app" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
