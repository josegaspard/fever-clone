import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { Event } from '@/lib/api';
import EventDetailClient from './EventDetailClient';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://fever-clone.vercel.app';

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

// Dynamic SEO metadata for each event
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const { data: row } = await supabase
    .from('events')
    .select('*, cities(*), categories(*)')
    .eq('slug', slug)
    .eq('status', 'PUBLISHED')
    .single();

  if (!row) {
    return {
      title: 'Evento no encontrado',
      description: 'Este evento no existe o ya no está disponible.',
    };
  }

  const event = transformEvent(row);
  const cityName = event.city?.name || '';
  const categoryName = event.category?.name || 'Evento';
  const priceText = event.price === 0 ? 'Gratis' : `Desde $${event.price} ${event.currency || 'MXN'}`;

  const title = `${event.title} - ${categoryName} en ${cityName}`;
  const description = event.shortDescription
    || `${event.title} en ${cityName}. ${priceText}. ${event.description.slice(0, 140)}...`;

  return {
    title,
    description,
    keywords: [
      event.title,
      categoryName,
      cityName,
      'eventos',
      'entradas',
      'tickets',
      event.city?.country || '',
      'experiencias',
    ].filter(Boolean),
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${BASE_URL}/events/${event.slug}`,
      siteName: 'Fever',
      locale: 'es_ES',
      images: event.image
        ? [{ url: event.image, width: 1200, height: 630, alt: event.title }]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: event.image ? [event.image] : [],
    },
    alternates: {
      canonical: `${BASE_URL}/events/${event.slug}`,
    },
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data: row, error } = await supabase
    .from('events')
    .select('*, cities(*), categories(*)')
    .eq('slug', slug)
    .eq('status', 'PUBLISHED')
    .single();

  if (error || !row) {
    notFound();
  }

  const event = transformEvent(row);

  // Fetch related events
  let related: Event[] = [];
  if (event.category) {
    const { data: relatedRows } = await supabase
      .from('events')
      .select('*, cities(*), categories(*)')
      .eq('status', 'PUBLISHED')
      .eq('category_id', Number(event.category.id))
      .neq('id', Number(event.id))
      .order('date', { ascending: true })
      .limit(12);
    related = (relatedRows || []).map(transformEvent);
  }

  // JSON-LD structured data for Event (Schema.org)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.shortDescription || event.description.slice(0, 300),
    startDate: event.date,
    ...(event.endDate && { endDate: event.endDate }),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    image: event.image ? [event.image] : [],
    ...(event.address && {
      location: {
        '@type': 'Place',
        name: event.address,
        address: {
          '@type': 'PostalAddress',
          streetAddress: event.address,
          addressLocality: event.city?.name || '',
          addressCountry: event.city?.country || '',
        },
        ...(event.lat && event.lng && {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: event.lat,
            longitude: event.lng,
          },
        }),
      },
    }),
    offers: {
      '@type': 'Offer',
      url: `${BASE_URL}/events/${event.slug}`,
      price: event.price,
      priceCurrency: event.currency || 'MXN',
      availability: 'https://schema.org/InStock',
      validFrom: event.createdAt,
    },
    ...(event.rating && event.reviewCount && event.reviewCount > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: event.rating,
        reviewCount: event.reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    performer: {
      '@type': 'Organization',
      name: 'Fever',
    },
    organizer: {
      '@type': 'Organization',
      name: 'Fever',
      url: BASE_URL,
    },
  };

  // BreadcrumbList structured data
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
        name: 'Eventos',
        item: `${BASE_URL}/search`,
      },
      ...(event.category ? [{
        '@type': 'ListItem',
        position: 3,
        name: event.category.name,
        item: `${BASE_URL}/search?category=${event.category.slug}`,
      }] : []),
      {
        '@type': 'ListItem',
        position: event.category ? 4 : 3,
        name: event.title,
        item: `${BASE_URL}/events/${event.slug}`,
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
      <EventDetailClient event={event} related={related} />
    </>
  );
}
