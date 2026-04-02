import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { Event } from '@/lib/api';
import VenueProfileClient from './VenueProfileClient';

// ISR: revalidate every 5 minutes
export const revalidate = 300;

const BASE_URL = 'https://fever-clone.vercel.app';

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
  lat: number | null;
  lng: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  twitter: string | null;
  facebook: string | null;
  tiktok: string | null;
  rating: number | null;
  review_count: number | null;
  follower_count: number | null;
  verified: boolean;
  featured: boolean;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
  cities: Record<string, unknown> | null;
}

function transformEvent(row: Record<string, unknown>): Event {
  const city = row.cities as Record<string, unknown> | null;
  const category = row.categories as Record<string, unknown> | null;
  return {
    id: String(row.id),
    title: row.title as string,
    slug: row.slug as string,
    description: (row.description as string) || '',
    shortDescription: row.short_description as string | undefined,
    image: row.image as string | undefined,
    price: row.price as number,
    originalPrice: row.original_price as number | undefined,
    date: row.date as string,
    endDate: row.end_date as string | undefined,
    time: row.time as string | undefined,
    duration: row.duration as string | undefined,
    address: row.address as string | undefined,
    lat: row.lat as number | undefined,
    lng: row.lng as number | undefined,
    currency: row.currency as string | undefined,
    status: row.status as string,
    featured: row.featured as boolean,
    capacity: row.capacity as number | undefined,
    soldCount: row.sold_count as number | undefined,
    rating: row.rating as number | undefined,
    reviewCount: row.review_count as number | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    city: city
      ? {
          id: String(city.id),
          name: city.name as string,
          slug: city.slug as string,
          image: city.image as string | undefined,
          country: city.country as string,
        }
      : null,
    category: category
      ? {
          id: String(category.id),
          name: category.name as string,
          slug: category.slug as string,
          icon: category.icon as string | undefined,
          color: category.color as string | undefined,
        }
      : null,
  };
}

async function getVenueData(slug: string) {
  const { data, error } = await supabase
    .from('venues')
    .select('*, cities(id, name, slug, image, country)')
    .eq('slug', slug)
    .single();

  if (error || !data) return null;
  return data as unknown as VenueRow;
}

async function getVenueEvents(venueId: number): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*, cities(id, name, slug, image, country), categories(id, name, slug, icon, color)')
    .eq('venue_id', venueId)
    .eq('status', 'PUBLISHED')
    .order('date', { ascending: true });

  if (error || !data) return [];
  return (data as unknown as Record<string, unknown>[]).map(transformEvent);
}

// ── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const venue = await getVenueData(slug);

  if (!venue) {
    return { title: 'Venue no encontrado' };
  }

  const title = venue.meta_title || `${venue.name} - Eventos y Experiencias`;
  const description =
    venue.meta_description ||
    venue.short_description ||
    `Descubre todos los eventos de ${venue.name}. Compra tus entradas y vive experiencias unicas.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/venues/${venue.slug}`,
      images: venue.cover_image
        ? [{ url: venue.cover_image, width: 1200, height: 630, alt: venue.name }]
        : undefined,
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: venue.cover_image ? [venue.cover_image] : undefined,
    },
    alternates: {
      canonical: `${BASE_URL}/venues/${venue.slug}`,
    },
  };
}

// ── Page ────────────────────────────────────────────────────────────────────

export default async function VenueProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const venue = await getVenueData(slug);

  if (!venue) {
    notFound();
  }

  const events = await getVenueEvents(venue.id);

  const city = venue.cities as Record<string, unknown> | null;

  const venueData = {
    id: String(venue.id),
    slug: venue.slug,
    name: venue.name,
    description: venue.description || undefined,
    shortDescription: venue.short_description || undefined,
    logo: venue.logo || undefined,
    coverImage: venue.cover_image || undefined,
    category: venue.category || undefined,
    address: venue.address || undefined,
    lat: venue.lat || undefined,
    lng: venue.lng || undefined,
    phone: venue.phone || undefined,
    email: venue.email || undefined,
    website: venue.website || undefined,
    instagram: venue.instagram || undefined,
    twitter: venue.twitter || undefined,
    facebook: venue.facebook || undefined,
    tiktok: venue.tiktok || undefined,
    rating: venue.rating || undefined,
    reviewCount: venue.review_count || undefined,
    followerCount: venue.follower_count || 0,
    verified: venue.verified,
    eventsCount: events.length,
  };

  // JSON-LD Organization schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: venue.name,
    url: `${BASE_URL}/venues/${venue.slug}`,
    logo: venue.logo || undefined,
    image: venue.cover_image || undefined,
    description: venue.short_description || venue.description || undefined,
    address: venue.address
      ? {
          '@type': 'PostalAddress',
          streetAddress: venue.address,
          addressLocality: city ? (city.name as string) : undefined,
          addressCountry: city ? (city.country as string) : undefined,
        }
      : undefined,
    geo:
      venue.lat && venue.lng
        ? {
            '@type': 'GeoCoordinates',
            latitude: venue.lat,
            longitude: venue.lng,
          }
        : undefined,
    telephone: venue.phone || undefined,
    email: venue.email || undefined,
    sameAs: [
      venue.instagram
        ? `https://instagram.com/${venue.instagram.replace('@', '')}`
        : null,
      venue.twitter
        ? `https://x.com/${venue.twitter.replace('@', '')}`
        : null,
      venue.facebook
        ? `https://facebook.com/${venue.facebook}`
        : null,
      venue.website || null,
    ].filter(Boolean),
    aggregateRating:
      venue.rating && venue.rating > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: venue.rating,
            reviewCount: venue.review_count || 0,
          }
        : undefined,
  };

  // Breadcrumb JSON-LD
  const breadcrumbJsonLd = {
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
        name: 'Venues',
        item: `${BASE_URL}/venues`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: venue.name,
        item: `${BASE_URL}/venues/${venue.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Breadcrumb nav */}
      <nav
        className="max-w-5xl mx-auto px-4 sm:px-6 py-3 text-sm"
        style={{ color: 'var(--text-tertiary)' }}
        aria-label="Breadcrumb"
      >
        <ol className="flex items-center gap-1.5 flex-wrap">
          <li>
            <a href="/" className="hover:text-[#e63946] transition-colors">
              Inicio
            </a>
          </li>
          <li aria-hidden="true">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </li>
          <li>
            <a href="/venues" className="hover:text-[#e63946] transition-colors">
              Venues
            </a>
          </li>
          <li aria-hidden="true">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </li>
          <li>
            <span style={{ color: 'var(--fg)' }}>{venue.name}</span>
          </li>
        </ol>
      </nav>

      <VenueProfileClient
        venue={venueData}
        events={events}
        isFollowing={false}
      />
    </>
  );
}
