import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/components/Toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CookieBanner from '@/components/CookieBanner';
import Analytics from '@/components/Analytics';
import ScrollToTop from '@/components/ScrollToTop';
import CityFilterProvider from '@/components/CityFilterProvider';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

const BASE_URL = 'https://fever-clone.vercel.app';

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'CTXplorer - Descubre los mejores planes y eventos en tu ciudad',
    template: '%s | CTXplorer',
  },
  description:
    'Descubre experiencias unicas y Arma tu Day perfecto con conciertos, gastronomia, arte y festivales en CDMX, Madrid, Barcelona, New York, London y Paris.',
  keywords: [
    'eventos', 'experiencias', 'conciertos', 'teatro', 'gastronomia',
    'arte', 'festivales', 'CDMX', 'Madrid', 'Barcelona', 'planes',
    'actividades', 'que hacer', 'tickets', 'entradas', 'espectaculos',
    'ocio', 'cultura', 'nightlife', 'vida nocturna', 'museos',
    'exposiciones', 'talleres', 'workshops', 'New York', 'London',
    'Paris', 'eventos cerca de mi', 'comprar entradas online',
    'planes fin de semana', 'cosas que hacer', 'agenda cultural',
    'arma tu day', 'planificador de eventos', 'itinerario de eventos',
    'que hacer hoy', 'eventos gratis', 'ruta de eventos',
  ],
  authors: [{ name: 'CTXplorer', url: BASE_URL }],
  creator: 'CTXplorer',
  publisher: 'CTXplorer',
  formatDetection: { telephone: false },
  alternates: {
    canonical: BASE_URL,
    languages: { 'es': BASE_URL },
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    siteName: 'CTXplorer',
    title: 'CTXplorer - Descubre los mejores planes y eventos en tu ciudad',
    description: 'Descubre experiencias unicas y Arma tu Day perfecto con conciertos, gastronomia, arte y festivales en tu ciudad. Compra entradas online.',
    url: BASE_URL,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CTXplorer - Descubre los mejores eventos y experiencias en tu ciudad',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@ctxplorer',
    creator: '@ctxplorer',
    title: 'CTXplorer - Arma tu Day perfecto con los mejores eventos',
    description: 'Descubre experiencias unicas y Arma tu Day perfecto con conciertos, gastronomia, arte y festivales. Compra entradas online.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CTXplorer - Descubre los mejores eventos y experiencias en tu ciudad',
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
    name: 'CTXplorer',
    url: BASE_URL,
    description: 'Descubre los mejores planes y eventos en tu ciudad. Arma tu Day perfecto con conciertos, gastronomia, arte, festivales y experiencias unicas.',
    inLanguage: 'es',
    publisher: {
      '@type': 'Organization',
      name: 'CTXplorer',
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'CTXplorer',
    url: BASE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${BASE_URL}/og-image.png`,
      width: 1200,
      height: 630,
    },
    description: 'Plataforma de descubrimiento de eventos y experiencias en tu ciudad. Arma tu Day perfecto y compra entradas para conciertos, teatro, gastronomia y mas.',
    foundingDate: '2024',
    sameAs: [
      'https://www.instagram.com/ctxplorer',
      'https://twitter.com/ctxplorer',
      'https://www.facebook.com/ctxplorer',
      'https://www.tiktok.com/@ctxplorer',
      'https://www.youtube.com/@ctxplorer',
      'https://www.linkedin.com/company/ctxplorer',
    ],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        availableLanguage: ['Spanish', 'English'],
        url: BASE_URL,
      },
    ],
    areaServed: [
      { '@type': 'City', name: 'Ciudad de Mexico' },
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

  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <head>
        {/* Preconnect to critical origins */}
        <link rel="preconnect" href="https://sywvdaaldijpzhedbopr.supabase.co" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://videos.pexels.com" />
        <link rel="dns-prefetch" href="https://accounts.google.com" />

        {/* Theme flash prevention */}
        <script dangerouslySetInnerHTML={{ __html: `try{const t=localStorage.getItem('theme')||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');if(t==='dark')document.documentElement.classList.add('dark')}catch(e){}` }} />

        {/* Structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <CityFilterProvider>
                <Navbar />
                <ScrollToTop />
                <main className="flex-1">{children}</main>
                <Footer />
                <CookieBanner />
                <Analytics />
              </CityFilterProvider>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}