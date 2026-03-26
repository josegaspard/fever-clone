import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/components/Toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Fever - Descubre los mejores planes y eventos en tu ciudad',
    template: '%s | Fever',
  },
  description:
    'Descubre experiencias únicas, conciertos, gastronomía, arte y más. Crea tu Day perfecto con eventos en Ciudad de México, Madrid, Barcelona, New York, London y Paris.',
  keywords: [
    'eventos', 'experiencias', 'conciertos', 'teatro', 'gastronomía',
    'arte', 'festivales', 'CDMX', 'Madrid', 'Barcelona', 'planes',
    'actividades', 'qué hacer', 'tickets', 'entradas',
  ],
  authors: [{ name: 'Fever' }],
  creator: 'Fever',
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    siteName: 'Fever',
    title: 'Fever - Descubre los mejores planes y eventos en tu ciudad',
    description: 'Experiencias únicas, conciertos, gastronomía y más. Crea tu Day perfecto.',
    images: [{ url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&h=630&fit=crop', width: 1200, height: 630, alt: 'Fever - Eventos y experiencias' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fever - Descubre los mejores planes en tu ciudad',
    description: 'Experiencias únicas, conciertos, gastronomía y más.',
    images: ['https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&h=630&fit=crop'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
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
    description: 'Descubre los mejores planes y eventos en tu ciudad',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://fever-clone.vercel.app/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <head>
        <meta name="theme-color" content="#0a0a0a" />
        <link rel="canonical" href="https://fever-clone.vercel.app" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#0a0a0a] text-white">
        <AuthProvider>
          <ToastProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
