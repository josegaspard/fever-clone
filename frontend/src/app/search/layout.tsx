import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Buscar Eventos y Experiencias | Fever',
  description:
    'Busca y filtra eventos, conciertos, teatro, gastronomía, arte y más en tu ciudad. Encuentra entradas y experiencias únicas cerca de ti.',
  keywords: [
    'buscar eventos', 'conciertos', 'teatro', 'gastronomía', 'arte',
    'experiencias', 'entradas', 'tickets', 'eventos cerca de mí',
  ],
  openGraph: {
    title: 'Buscar Eventos y Experiencias | Fever',
    description: 'Encuentra los mejores eventos, conciertos y experiencias en tu ciudad.',
    url: 'https://fever-clone.vercel.app/search',
    siteName: 'Fever',
    type: 'website',
  },
  alternates: {
    canonical: 'https://fever-clone.vercel.app/search',
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
