import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { Event } from '@/lib/api';
import EventDetailClient from './EventDetailClient';

// ISR: revalidate every 5 minutes
export const revalidate = 300;

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
    videoUrl: row.video_url as string | undefined,
    gallery: Array.isArray(row.gallery) ? (row.gallery as string[]) : [],
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

  // Use custom SEO fields if available, otherwise auto-generate
  const eventAny = row as Record<string, unknown>;
  const customMetaTitle = eventAny.meta_title as string | undefined;
  const customMetaDesc = eventAny.meta_description as string | undefined;

  const title = customMetaTitle || `${event.title} - ${categoryName} en ${cityName}`;
  const description = customMetaDesc || event.shortDescription
    || `${event.title} en ${cityName}. ${priceText}. ${event.description.slice(0, 140)}...`;

  const eventUrl = `${BASE_URL}/events/${event.slug}`;
  const dateFormatted = new Date(event.date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

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
      `${categoryName} en ${cityName}`,
      `eventos ${cityName}`,
      `${categoryName.toLowerCase()} ${dateFormatted}`,
      'comprar entradas',
      'planes',
    ].filter(Boolean),
    openGraph: {
      title,
      description,
      type: 'article',
      url: eventUrl,
      siteName: 'CTXplorer',
      locale: 'es_ES',
      publishedTime: event.createdAt,
      modifiedTime: event.updatedAt,
      section: categoryName,
      tags: [categoryName, cityName, 'eventos', 'experiencias'],
      images: event.image
        ? [
            {
              url: event.image,
              width: 1200,
              height: 630,
              alt: `${event.title} - ${categoryName} en ${cityName}`,
              type: 'image/jpeg',
            },
          ]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@ctxplorer',
      creator: '@ctxplorer',
      title,
      description,
      images: event.image
        ? [
            {
              url: event.image,
              width: 1200,
              height: 630,
              alt: `${event.title} - ${categoryName} en ${cityName}`,
            },
          ]
        : [],
    },
    alternates: {
      canonical: eventUrl,
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

  // Fetch related events and venue data in parallel
  const venueId = (row as Record<string, unknown>).venue_id as number | null;

  const [relatedResult, venueResult] = await Promise.all([
    event.category
      ? supabase
          .from('events')
          .select('*, cities(*), categories(*)')
          .eq('status', 'PUBLISHED')
          .eq('category_id', Number(event.category.id))
          .neq('id', Number(event.id))
          .order('date', { ascending: true })
          .limit(12)
      : Promise.resolve({ data: null }),
    venueId
      ? supabase
          .from('venues')
          .select('id, slug, name, short_description, logo, verified, follower_count, category')
          .eq('id', venueId)
          .single()
      : Promise.resolve({ data: null }),
  ]);

  const related: Event[] = (relatedResult.data || []).map(transformEvent);

  const venueRow = venueResult.data as Record<string, unknown> | null;
  const venueInfo = venueRow
    ? {
        slug: venueRow.slug as string,
        name: venueRow.name as string,
        shortDescription: venueRow.short_description as string | undefined,
        logo: venueRow.logo as string | undefined,
        verified: venueRow.verified as boolean,
        followerCount: venueRow.follower_count as number,
        category: venueRow.category as string | undefined,
      }
    : null;

  // Determine availability based on capacity and sold count
  const isSoldOut = event.capacity && event.soldCount && event.soldCount >= event.capacity;
  const availabilityUrl = isSoldOut
    ? 'https://schema.org/SoldOut'
    : 'https://schema.org/InStock';

  // Determine if this is a concert/music event for performer schema
  const isConcert = event.category?.slug === 'conciertos' || event.category?.slug === 'musica' || event.category?.slug === 'concerts' || event.category?.slug === 'music';

  // JSON-LD structured data for Event (Schema.org)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': isConcert ? 'MusicEvent' : 'Event',
    name: event.title,
    description: event.shortDescription || event.description.slice(0, 300),
    startDate: event.date,
    endDate: event.endDate || event.date,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    image: event.image ? [event.image] : [],
    url: `${BASE_URL}/events/${event.slug}`,
    ...(event.duration && { duration: event.duration }),
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
      availability: availabilityUrl,
      validFrom: event.createdAt,
      ...(event.capacity && {
        inventoryLevel: {
          '@type': 'QuantitativeValue',
          value: event.capacity - (event.soldCount || 0),
        },
      }),
    },
    ...(event.originalPrice && event.originalPrice > event.price && {
      priceSpecification: {
        '@type': 'PriceSpecification',
        price: event.price,
        priceCurrency: event.currency || 'MXN',
        eligibleTransactionVolume: {
          '@type': 'PriceSpecification',
          price: event.originalPrice,
          priceCurrency: event.currency || 'MXN',
        },
      },
    }),
    ...(event.rating && event.reviewCount && event.reviewCount > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: event.rating,
        reviewCount: event.reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    performer: isConcert
      ? {
          '@type': 'PerformingGroup',
          name: event.title,
        }
      : {
          '@type': 'Organization',
          name: 'CTXplorer',
        },
    organizer: {
      '@type': 'Organization',
      name: 'CTXplorer',
      url: BASE_URL,
      logo: `${BASE_URL}/og-image.png`,
    },
    inLanguage: 'es',
    isAccessibleForFree: event.price === 0,
    ...(event.capacity && {
      maximumAttendeeCapacity: event.capacity,
      remainingAttendeeCapacity: event.capacity - (event.soldCount || 0),
    }),
  };

  // BreadcrumbList structured data (Home > City > Category > Event)
  const breadcrumbItems = [
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
  ];

  let nextPosition = 3;

  if (event.city) {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: nextPosition,
      name: `Eventos en ${event.city.name}`,
      item: `${BASE_URL}/search?city=${event.city.slug}`,
    });
    nextPosition++;
  }

  if (event.category) {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: nextPosition,
      name: event.category.name,
      item: `${BASE_URL}/search?category=${event.category.slug}`,
    });
    nextPosition++;
  }

  breadcrumbItems.push({
    '@type': 'ListItem',
    position: nextPosition,
    name: event.title,
    item: `${BASE_URL}/events/${event.slug}`,
  });

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
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
      <EventDetailClient event={event} related={related} venue={venueInfo} />
    </>
  );
}
