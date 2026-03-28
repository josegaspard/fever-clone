import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Event } from '@/lib/api';
import HeroBanner from '@/components/HeroBanner';
import EventCarousel from '@/components/EventCarousel';

export const dynamic = 'force-dynamic';

function transformEvent(row: Record<string, unknown>) {
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
    videoUrl: row.video_url as string | undefined,
    status: row.status as string,
    featured: row.featured as boolean,
    capacity: row.capacity as number | undefined,
    soldCount: row.sold_count as number | undefined,
    rating: row.rating as number | undefined,
    reviewCount: row.review_count as number | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    city: city ? { id: String(city.id), name: city.name as string, slug: city.slug as string, image: city.image as string | undefined, country: city.country as string } : null,
    category: category ? { id: String(category.id), name: category.name as string, slug: category.slug as string, icon: category.icon as string | undefined, color: category.color as string | undefined } : null,
  };
}

const BASE_URL = 'https://fever-clone.vercel.app';

export const metadata = {
  title: 'Fever - Descubre los mejores planes y eventos en tu ciudad',
  description: 'Explora conciertos, gastronomía, arte, festivales y más. Crea tu Day perfecto en Ciudad de México, Madrid, Barcelona, New York, London y Paris. Eventos gratuitos y de pago. Compra entradas online.',
  keywords: [
    'eventos', 'conciertos', 'gastronomía', 'arte', 'festivales',
    'planes', 'experiencias', 'entradas', 'tickets', 'CDMX',
    'Madrid', 'Barcelona', 'New York', 'London', 'Paris',
    'qué hacer hoy', 'eventos cerca de mí', 'comprar entradas',
  ],
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    title: 'Fever - Descubre los mejores planes y eventos en tu ciudad',
    description: 'Explora conciertos, gastronomía, arte, festivales y más. Crea tu Day perfecto.',
    url: BASE_URL,
    siteName: 'Fever',
    type: 'website',
    locale: 'es_ES',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Fever - Descubre los mejores eventos y experiencias',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@fever',
    title: 'Fever - Descubre los mejores planes y eventos en tu ciudad',
    description: 'Explora conciertos, gastronomía, arte, festivales y más.',
    images: ['/og-image.png'],
  },
};

export default async function HomePage() {
  // Fetch all data server-side in parallel
  const [featuredRes, cdmxRes, freeRes, popularRes, categoriesRes, citiesRes, totalCount] = await Promise.all([
    supabase.from('events').select('*, cities(*), categories(*)').eq('status', 'PUBLISHED').eq('featured', true).order('date', { ascending: true }).limit(12),
    supabase.from('events').select('*, cities(*), categories(*)').eq('status', 'PUBLISHED').eq('city_id', 6).order('date', { ascending: true }).limit(12),
    supabase.from('events').select('*, cities(*), categories(*)').eq('status', 'PUBLISHED').eq('price', 0).order('rating', { ascending: false }).limit(8),
    supabase.from('events').select('*, cities(*), categories(*)').eq('status', 'PUBLISHED').order('sold_count', { ascending: false }).limit(12),
    supabase.from('categories').select('id, name, slug, icon, color').order('name'),
    supabase.from('cities').select('id, name, slug, image, country').order('name'),
    supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'PUBLISHED'),
  ]);

  const featured = (featuredRes.data || []).map(transformEvent) as unknown as Event[];
  const cdmxEvents = (cdmxRes.data || []).map(transformEvent) as unknown as Event[];
  const freeEvents = (freeRes.data || []).map(transformEvent) as unknown as Event[];
  const popularEvents = (popularRes.data || []).map(transformEvent) as unknown as Event[];
  const categories = categoriesRes.data || [];
  const cities = citiesRes.data || [];
  const eventCount = totalCount.count || 0;

  // Fetch events per category
  const categoryEvents = await Promise.all(
    categories.map(async (cat) => {
      const { data } = await supabase
        .from('events')
        .select('*, cities(*), categories(*)')
        .eq('status', 'PUBLISHED')
        .eq('category_id', cat.id)
        .order('date', { ascending: true })
        .limit(12);
      return {
        category: { id: String(cat.id), name: cat.name, slug: cat.slug, icon: cat.icon, color: cat.color },
        events: (data || []).map(transformEvent) as unknown as Event[],
      };
    })
  );

  const filteredCategoryEvents = categoryEvents.filter((c) => c.events.length > 0);

  // JSON-LD ItemList for featured events (rich results)
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Eventos destacados en Fever',
    description: 'Los mejores eventos y experiencias destacados en tu ciudad.',
    numberOfItems: featured.length,
    itemListElement: featured.map((event, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: event.title,
      url: `${BASE_URL}/events/${event.slug}`,
      image: event.image || '',
      item: {
        '@type': 'Event',
        name: event.title,
        startDate: event.date,
        ...(event.endDate && { endDate: event.endDate }),
        description: event.shortDescription || event.description?.slice(0, 200) || '',
        image: event.image ? [event.image] : [],
        url: `${BASE_URL}/events/${event.slug}`,
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        ...(event.address && {
          location: {
            '@type': 'Place',
            name: event.address,
            address: {
              '@type': 'PostalAddress',
              addressLocality: event.city?.name || '',
              addressCountry: event.city?.country || '',
            },
          },
        }),
        offers: {
          '@type': 'Offer',
          price: event.price,
          priceCurrency: event.currency || 'MXN',
          availability: 'https://schema.org/InStock',
          url: `${BASE_URL}/events/${event.slug}`,
        },
        organizer: {
          '@type': 'Organization',
          name: 'Fever',
          url: BASE_URL,
        },
      },
    })),
  };

  // FAQ Schema for "How it works" section
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Como funciona Fever para explorar eventos?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Descubre experiencias unicas en tu ciudad: conciertos, gastronomia, arte y mas. Navega por categorias o busca eventos especificos para encontrar lo que te interesa.',
        },
      },
      {
        '@type': 'Question',
        name: 'Como puedo crear mi Day perfecto en Fever?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Agrega actividades a tu plan diario. Te mostramos la ruta y el costo total para que puedas organizar tu dia de la mejor manera.',
        },
      },
      {
        '@type': 'Question',
        name: 'Como obtengo mis entradas en Fever?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Obten tus tickets QR directamente en la app, comparte con amigos y vive un dia inolvidable. Puedes comprar entradas para conciertos, teatro, gastronomia y mas.',
        },
      },
      {
        '@type': 'Question',
        name: 'En que ciudades esta disponible Fever?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Fever esta disponible en Ciudad de Mexico, Madrid, Barcelona, New York, London, Paris y muchas mas ciudades. Explora eventos en tu ciudad favorita.',
        },
      },
      {
        '@type': 'Question',
        name: 'Hay eventos gratuitos en Fever?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Si, Fever ofrece una seleccion de eventos gratuitos en todas las ciudades disponibles. Filtra por precio para encontrar experiencias sin costo.',
        },
      },
    ],
  };

  // Homepage breadcrumb
  const homeBreadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Inicio',
        item: BASE_URL,
      },
    ],
  };

  return (
    <div itemScope itemType="https://schema.org/WebPage">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeBreadcrumbJsonLd) }}
      />
      <HeroBanner />

      {/* Build Day CTA */}
      <section className="max-w-5xl mx-auto px-4 pt-16 pb-8">
        <Link
          href="/build-day"
          className="block w-full p-6 md:p-8 rounded-2xl border-2 border-dashed transition-all hover:border-[#e63946] hover:shadow-lg group text-center"
          style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
        >
          <span className="text-4xl block mb-3">🎯</span>
          <h2 className="text-xl md:text-2xl font-black mb-2 group-hover:text-[#e63946] transition">Arma tu Day perfecto</h2>
          <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Dinos con quién vas, tu presupuesto y qué te gusta, y te creamos rutas personalizadas con los mejores eventos.
          </p>
        </Link>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 py-16" aria-label="Cómo funciona">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
          Crea tu <span className="gradient-text">Day perfecto</span> en 3 pasos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: '🔍', title: 'Explora eventos', desc: 'Descubre experiencias únicas en tu ciudad: conciertos, gastronomía, arte y más.' },
            { icon: '📅', title: 'Crea tu Day', desc: 'Agrega actividades a tu plan diario. Te mostramos la ruta y el costo total.' },
            { icon: '🎉', title: 'Disfruta', desc: 'Obtén tus tickets QR, comparte con amigos y vive un día inolvidable.' },
          ].map((step, i) => (
            <div key={i} className="text-center space-y-3 animate-fade-in" style={{ animationDelay: `${i * 150}ms` }}>
              <div className="text-4xl">{step.icon}</div>
              <h3 className="text-lg font-bold" style={{ color: 'var(--fg)' }}>{step.title}</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 space-y-16 py-16">
        {/* Featured */}
        <EventCarousel
          title="🔥 Destacados"
          events={featured}
          loading={false}
          viewAllHref="/search?featured=true"
        />

        {/* CDMX Events */}
        {cdmxEvents.length > 0 && (
          <EventCarousel
            title="🇲🇽 Lo mejor en Ciudad de México"
            events={cdmxEvents}
            loading={false}
            viewAllHref="/search?city=cdmx"
          />
        )}

        {/* Free events */}
        {freeEvents.length > 0 && (
          <EventCarousel
            title="🎁 Eventos gratuitos"
            events={freeEvents}
            loading={false}
            viewAllHref="/search?maxPrice=0"
          />
        )}

        {/* Most popular */}
        {popularEvents.length > 0 && (
          <EventCarousel
            title="🏆 Los más populares"
            events={popularEvents}
            loading={false}
            viewAllHref="/search?sortBy=popularity"
          />
        )}

        {/* Per-category carousels */}
        {filteredCategoryEvents.map(({ category, events }) => (
          <EventCarousel
            key={category.id}
            title={`${category.icon || ''} ${category.name}`}
            events={events}
            loading={false}
            viewAllHref={`/search?category=${category.slug}`}
          />
        ))}

        {/* Popular cities */}
        {cities.length > 0 && (
          <section aria-label="Ciudades populares">
            <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: 'var(--fg)' }}>
              Ciudades populares
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {cities.map((city) => (
                <Link
                  key={city.id}
                  href={`/search?city=${city.slug}`}
                  className="group relative aspect-[4/3] rounded-xl overflow-hidden border"
                  style={{ borderColor: 'var(--border)' }}
                >
                  {city.image ? (
                    <img
                      src={city.image}
                      alt={`Eventos en ${city.name}, ${city.country || ''}`}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#e63946]/20 to-[#1a1a1a]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <p className="text-sm font-semibold text-white">
                      {city.name}
                    </p>
                    {city.country && (
                      <p className="text-xs text-gray-300">{city.country}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
