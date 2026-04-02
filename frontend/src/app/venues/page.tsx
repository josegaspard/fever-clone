import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import VenuesListClient from './VenuesListClient';

export const revalidate = 300;

const BASE_URL = 'https://fever-clone.vercel.app';

export const metadata: Metadata = {
  title: 'Venues - Descubre los mejores lugares | FEVER',
  description: 'Explora los mejores venues, teatros, museos, bares y centros culturales. Encuentra eventos, reseñas y compra tus entradas.',
  openGraph: {
    title: 'Venues - Descubre los mejores lugares | FEVER',
    description: 'Explora los mejores venues y compra tus entradas.',
    url: `${BASE_URL}/venues`,
    type: 'website',
  },
  alternates: { canonical: `${BASE_URL}/venues` },
};

interface VenueRow {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  short_description: string | null;
  logo: string | null;
  cover_image: string | null;
  category: string | null;
  address: string | null;
  rating: number | null;
  review_count: number | null;
  follower_count: number | null;
  verified: boolean;
  featured: boolean;
  cities: { id: number; name: string; slug: string; country: string } | null;
  events: { id: number }[];
}

async function getVenuesData() {
  const { data, error } = await supabase
    .from('venues')
    .select('*, cities(id, name, slug, country), events(id)')
    .order('featured', { ascending: false })
    .order('rating', { ascending: false });

  if (error || !data) return [];
  return (data as unknown as VenueRow[]).map((v) => ({
    id: String(v.id),
    slug: v.slug,
    name: v.name,
    shortDescription: v.short_description || undefined,
    logo: v.logo || undefined,
    coverImage: v.cover_image || undefined,
    category: v.category || 'general',
    address: v.address || undefined,
    rating: v.rating || 0,
    reviewCount: v.review_count || 0,
    followerCount: v.follower_count || 0,
    verified: v.verified,
    featured: v.featured,
    cityName: v.cities?.name || undefined,
    eventsCount: v.events?.length || 0,
  }));
}

export default async function VenuesPage() {
  const venues = await getVenuesData();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Venues - FEVER',
    description: 'Directorio de los mejores venues y espacios para eventos.',
    url: `${BASE_URL}/venues`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <VenuesListClient venues={venues} />
    </>
  );
}
