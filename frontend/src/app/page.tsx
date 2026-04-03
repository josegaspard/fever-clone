import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Event } from '@/lib/api';
import HeroBanner from '@/components/HeroBanner';
import EventCarousel from '@/components/EventCarousel';
import FilteredCarousel from '@/components/FilteredCarousel';
import VideoEventCard from '@/components/VideoEventCard';
import EventsMap from '@/components/EventsMap';
import ForYouFeed from '@/components/ForYouFeed';

// ISR: revalidate every 5 minutes instead of force-dynamic
export const revalidate = 300;

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
  title: 'CTXplorer - Descubre los mejores planes y eventos en tu ciudad',
  description: 'Explora conciertos, gastronomia, arte, festivales y mas. Crea tu Day perfecto en Ciudad de Mexico, Madrid, Barcelona, New York, London y Paris. Eventos gratuitos y de pago. Compra entradas online.',
  keywords: [
    'eventos', 'conciertos', 'gastronomia', 'arte', 'festivales',
    'planes', 'experiencias', 'entradas', 'tickets', 'CDMX',
    'Madrid', 'Barcelona', 'New York', 'London', 'Paris',
    'que hacer hoy', 'eventos cerca de mi', 'comprar entradas',
  ],
  alternates: { canonical: BASE_URL },
  openGraph: {
    title: 'CTXplorer - Descubre los mejores planes y eventos en tu ciudad',
    description: 'Explora conciertos, gastronomia, arte, festivales y mas. Crea tu Day perfecto.',
    url: BASE_URL,
    siteName: 'CTXplorer',
    type: 'website',
    locale: 'es_ES',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'CTXplorer - Descubre los mejores eventos y experiencias' }],
  },
  twitter: {
    card: 'summary_large_image' as const,
    site: '@ctxplorer',
    title: 'CTXplorer - Descubre los mejores planes y eventos en tu ciudad',
    description: 'Explora conciertos, gastronomia, arte, festivales y mas.',
    images: ['/og-image.png'],
  },
};

export default async function HomePage() {
  const [featuredRes, cdmxRes, freeRes, popularRes, categoriesRes, citiesRes] = await Promise.all([
    supabase.from('events').select('*, cities(*), categories(*)').eq('status', 'PUBLISHED').eq('featured', true).order('date', { ascending: true }).limit(12),
    supabase.from('events').select('*, cities(*), categories(*)').eq('status', 'PUBLISHED').eq('city_id', 6).order('date', { ascending: true }).limit(12),
    supabase.from('events').select('*, cities(*), categories(*)').eq('status', 'PUBLISHED').eq('price', 0).order('rating', { ascending: false }).limit(8),
    supabase.from('events').select('*, cities(*), categories(*)').eq('status', 'PUBLISHED').order('sold_count', { ascending: false }).limit(12),
    supabase.from('categories').select('id, name, slug, icon, color').order('name'),
    supabase.from('cities').select('id, name, slug, image, country').order('name'),
  ]);

  const featured = (featuredRes.data || []).map(transformEvent) as unknown as Event[];
  const cdmxEvents = (cdmxRes.data || []).map(transformEvent) as unknown as Event[];
  const freeEvents = (freeRes.data || []).map(transformEvent) as unknown as Event[];
  const popularEvents = (popularRes.data || []).map(transformEvent) as unknown as Event[];
  const categories = categoriesRes.data || [];
  const cities = citiesRes.data || [];

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

  // Collect events with video for the "Experiencias en video" section
  const allEvents = [...featured, ...cdmxEvents, ...freeEvents, ...popularEvents];
  const videoEventsMap = new Map<string, Event>();
  for (const ev of allEvents) {
    if (ev.videoUrl && !videoEventsMap.has(ev.id)) {
      videoEventsMap.set(ev.id, ev);
    }
    if (videoEventsMap.size >= 6) break;
  }
  const videoEvents = Array.from(videoEventsMap.values());

  // Events with coordinates for map
  const eventsWithCoords = allEvents.filter(ev => ev.lat && ev.lng);
  const uniqueMapEvents = Array.from(new Map(eventsWithCoords.map(ev => [ev.id, ev])).values()).slice(0, 30);

  // Trending: top 4 by sold_count for hero-style feature
  const trendingEvents = popularEvents.slice(0, 4);

  // Category images map
  const categoryImages: Record<string, string> = {
    conciertos: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop',
    teatro: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=400&fit=crop',
    gastronomia: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=400&fit=crop',
    arte: 'https://images.unsplash.com/photo-1531913764164-f85c3e01b1aa?w=800&h=400&fit=crop',
    festivales: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=400&fit=crop',
    deportes: 'https://images.unsplash.com/photo-1461896836934-bd45ba7e6bd7?w=800&h=400&fit=crop',
    nightlife: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800&h=400&fit=crop',
    museos: 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800&h=400&fit=crop',
    tours: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=400&fit=crop',
    talleres: 'https://images.unsplash.com/photo-1452860606245-08f33eee919d?w=800&h=400&fit=crop',
    'experiencias-inmersivas': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=400&fit=crop',
    musica: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop',
  };

  // SEO descriptions per category (long, 2-3 sentences)
  const categoryDescriptions: Record<string, string> = {
    conciertos: 'Vive la emocion de la musica en vivo con los mejores artistas nacionales e internacionales. Desde intimos shows acusticos hasta grandes festivales al aire libre, encuentra el concierto perfecto para ti.',
    musica: 'Vive la emocion de la musica en vivo con los mejores artistas nacionales e internacionales. Desde intimos shows acusticos hasta grandes festivales al aire libre, encuentra el concierto perfecto.',
    teatro: 'Descubre las mejores obras de teatro, musicales y espectaculos en escena de tu ciudad. Desde clasicos atemporales hasta producciones vanguardistas que desafian los limites del arte escenico.',
    gastronomia: 'Explora experiencias culinarias unicas: cenas secretas, catas de vinos, talleres de cocina y festivales gastronomicos. Descubre sabores que transformaran tu paladar y crea recuerdos inolvidables.',
    arte: 'Sumérgete en el mundo del arte contemporaneo, exposiciones inmersivas y galerias de renombre. Conecta con la creatividad de artistas emergentes y consagrados en espacios unicos.',
    festivales: 'Los festivales mas esperados del ano reunidos en un solo lugar. Musica, cultura, gastronomia y entretenimiento se fusionan en experiencias que no puedes perderte bajo el cielo abierto.',
    deportes: 'Desde competencias de alto nivel hasta carreras populares y eventos deportivos unicos. Vive la adrenalina del deporte en vivo y comparte la pasion con miles de aficionados.',
    nightlife: 'La mejor vida nocturna de tu ciudad: fiestas exclusivas, DJs internacionales, clubs selectos y experiencias que solo suceden despues de la medianoche. Descubre la noche como nunca antes.',
    museos: 'Visitas guiadas, exposiciones temporales y permanentes en los museos mas importantes. Recorre la historia, la ciencia y el arte con experiencias interactivas pensadas para todos.',
    tours: 'Recorre tu ciudad como nunca antes con tours guiados, rutas tematicas y experiencias turisticas unicas. Descubre rincones ocultos y secretos que solo los locales conocen.',
    talleres: 'Aprende algo nuevo con workshops creativos, talleres practicos y experiencias hands-on. Ceramica, cocina, fotografia, arte y mucho mas para despertar tu lado creativo.',
    'experiencias-inmersivas': 'Sumérgete en instalaciones interactivas de arte digital, realidad virtual y experiencias multisensoriales. La tecnologia y la creatividad se unen para transportarte a mundos extraordinarios.',
  };

  // JSON-LD ItemList for featured events
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Eventos destacados en CTXplorer',
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
        organizer: { '@type': 'Organization', name: 'CTXplorer', url: BASE_URL },
      },
    })),
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Como funciona CTXplorer para explorar eventos?',
        acceptedAnswer: { '@type': 'Answer', text: 'Descubre experiencias unicas en tu ciudad: conciertos, gastronomia, arte y mas. Navega por categorias o busca eventos especificos para encontrar lo que te interesa.' },
      },
      {
        '@type': 'Question',
        name: 'Como puedo crear mi Day perfecto en CTXplorer?',
        acceptedAnswer: { '@type': 'Answer', text: 'Agrega actividades a tu plan diario. Te mostramos la ruta y el costo total para que puedas organizar tu dia de la mejor manera.' },
      },
      {
        '@type': 'Question',
        name: 'Como obtengo mis entradas en CTXplorer?',
        acceptedAnswer: { '@type': 'Answer', text: 'Obten tus tickets QR directamente en la app, comparte con amigos y vive un dia inolvidable. Puedes comprar entradas para conciertos, teatro, gastronomia y mas.' },
      },
      {
        '@type': 'Question',
        name: 'En que ciudades esta disponible CTXplorer?',
        acceptedAnswer: { '@type': 'Answer', text: 'CTXplorer esta disponible en Ciudad de Mexico, Madrid, Barcelona, New York, London, Paris y muchas mas ciudades. Explora eventos en tu ciudad favorita.' },
      },
      {
        '@type': 'Question',
        name: 'Hay eventos gratuitos en CTXplorer?',
        acceptedAnswer: { '@type': 'Answer', text: 'Si, CTXplorer ofrece una seleccion de eventos gratuitos en todas las ciudades disponibles. Filtra por precio para encontrar experiencias sin costo.' },
      },
    ],
  };

  // Helper: format price
  const formatPrice = (event: Event) => {
    const sym = event.currency === 'MXN' ? '$' : event.currency === 'USD' ? '$' : event.currency === 'GBP' ? '\u00a3' : '\u20ac';
    if (event.price === 0) return 'Gratis';
    return `${sym}${event.price.toFixed(0)}`;
  };

  // Helper: format date
  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    } catch {
      return d;
    }
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

      {/* ================================================================== */}
      {/* HERO BANNER                                                        */}
      {/* ================================================================== */}
      <HeroBanner />

      {/* ================================================================== */}
      {/* TRENDING NOW - Large editorial cards                               */}
      {/* ================================================================== */}
      {trendingEvents.length > 0 && (
        <section className="relative overflow-hidden" aria-label="Trending ahora">
          {/* Background accent */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-[#e63946]/[0.04] blur-[100px]" />
          </div>

          <div className="max-w-7xl mx-auto px-4 pt-20 pb-4 relative z-10">
            {/* Section header with accent line */}
            <div className="flex items-center gap-4 mb-2">
              <div className="w-1 h-8 rounded-full bg-gradient-to-b from-[#e63946] to-[#ff6b6b]" />
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#e63946] mb-0.5">En tendencia</p>
                <h2 className="text-2xl md:text-3xl font-black" style={{ color: 'var(--fg)' }}>
                  Lo que todos quieren
                </h2>
              </div>
            </div>
            <p className="text-sm ml-5 mb-10" style={{ color: 'var(--text-secondary)' }}>
              Las experiencias mas buscadas de esta semana
            </p>

            {/* Trending grid: 1 large + 3 stacked */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
              {/* Large featured card */}
              {trendingEvents[0] && (
                <Link
                  href={`/events/${trendingEvents[0].slug}`}
                  className="group relative overflow-hidden rounded-3xl h-[420px] lg:h-full lg:min-h-[460px]"
                >
                  {trendingEvents[0].image ? (
                    <Image
                      src={trendingEvents[0].image}
                      alt={trendingEvents[0].title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      priority
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#e63946] to-[#1a1a2e]" />
                  )}
                  {/* Multi-layer gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

                  {/* Trending badge */}
                  <div className="absolute top-5 left-5 z-10">
                    <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest font-bold text-white bg-[#e63946] px-3.5 py-1.5 rounded-full shadow-lg shadow-[#e63946]/30">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                      </svg>
                      #1 Trending
                    </span>
                  </div>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-10">
                    <div className="flex items-center gap-2 mb-3">
                      {trendingEvents[0].category && (
                        <span className="text-xs font-medium text-white/80 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                          {trendingEvents[0].category.icon} {trendingEvents[0].category.name}
                        </span>
                      )}
                      <span className="text-xs font-medium text-white/80 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                        {formatDate(trendingEvents[0].date)}
                      </span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black text-white leading-tight mb-3 drop-shadow-lg">
                      {trendingEvents[0].title}
                    </h3>
                    {trendingEvents[0].shortDescription && (
                      <p className="text-sm text-white/70 line-clamp-2 mb-4 max-w-lg">
                        {trendingEvents[0].shortDescription}
                      </p>
                    )}
                    <div className="flex items-center gap-4">
                      <span className="text-xl font-black text-white">
                        {formatPrice(trendingEvents[0])}
                      </span>
                      {trendingEvents[0].soldCount && trendingEvents[0].soldCount > 0 && (
                        <span className="text-xs text-white/60 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                          {trendingEvents[0].soldCount}+ vendidos
                        </span>
                      )}
                      <span className="ml-auto inline-flex items-center gap-1.5 text-sm font-bold text-white bg-white/15 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 transition-all group-hover:bg-white/25 group-hover:border-white/30">
                        Ver evento
                        <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              )}

              {/* Right column: 3 stacked cards */}
              <div className="flex flex-col gap-4">
                {trendingEvents.slice(1, 4).map((event, i) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.slug}`}
                    className="group relative flex overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-lg h-[140px]"
                    style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
                  >
                    {/* Image side */}
                    <div className="relative w-[180px] md:w-[200px] flex-shrink-0 overflow-hidden">
                      {event.image ? (
                        <Image
                          src={event.image}
                          alt={event.title}
                          fill
                          sizes="200px"
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#e63946]/20 to-[var(--surface-2)]" />
                      )}
                      {/* Rank badge */}
                      <div className="absolute top-3 left-3 w-7 h-7 rounded-full bg-[#e63946] flex items-center justify-center text-white text-xs font-black shadow-lg">
                        {i + 2}
                      </div>
                    </div>

                    {/* Content side */}
                    <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          {event.category && (
                            <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: event.category.color || '#e63946' }}>
                              {event.category.icon} {event.category.name}
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold line-clamp-2 leading-snug" style={{ color: 'var(--fg)' }}>
                          {event.title}
                        </h3>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {event.city?.name}
                          </span>
                          <span>{formatDate(event.date)}</span>
                        </div>
                        <span className="text-sm font-black" style={{ color: event.price === 0 ? '#10b981' : 'var(--fg)' }}>
                          {formatPrice(event)}
                        </span>
                      </div>
                    </div>

                    {/* Hover accent */}
                    <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-[#e63946]/30 transition-all duration-300 pointer-events-none" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ================================================================== */}
      {/* BUILD YOUR DAY - Premium gradient CTA                              */}
      {/* ================================================================== */}
      <section className="max-w-7xl mx-auto px-4 pt-20 pb-8">
        <Link
          href="/build-day"
          className="build-day-cta block w-full rounded-3xl overflow-hidden relative group"
        >
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#e63946] via-[#d32836] to-[#a61e2b] transition-all duration-500 group-hover:from-[#d32836] group-hover:via-[#c22030] group-hover:to-[#8b1620]" />

          {/* Mesh-like decorative pattern */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

          {/* Decorative floating circles */}
          <div className="absolute top-4 right-8 w-32 h-32 rounded-full bg-white/10 build-day-float" />
          <div className="absolute bottom-2 right-36 w-20 h-20 rounded-full bg-white/5 build-day-float-delayed" />
          <div className="absolute top-1/2 right-4 w-12 h-12 rounded-full bg-white/8 build-day-float" />
          <div className="absolute -top-8 -left-8 w-40 h-40 rounded-full bg-white/5 build-day-float-delayed" />

          {/* Content */}
          <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 text-center md:text-left">
              {/* Badge */}
              <span className="inline-block text-[10px] uppercase tracking-[0.25em] font-bold text-white/90 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full mb-5">
                Nuevo
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
                Arma tu Day perfecto
              </h2>
              <p className="text-base md:text-lg text-white/80 max-w-lg leading-relaxed">
                Dinos con quien vas, tu presupuesto y que te gusta, y te creamos rutas personalizadas con los mejores eventos de tu ciudad.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 bg-white text-[#e63946] font-bold text-sm px-7 py-3.5 rounded-xl shadow-lg transition-all group-hover:shadow-xl group-hover:scale-[1.03]">
                  Crear mi Day
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <span className="text-sm text-white/60">
                  Toma menos de 2 minutos
                </span>
              </div>
            </div>

            {/* Right side illustration */}
            <div className="hidden md:flex items-center justify-center w-48 h-48 flex-shrink-0">
              <div className="relative">
                <div className="w-36 h-36 rounded-3xl bg-white/15 backdrop-blur-sm border border-white/20 flex flex-col items-center justify-center shadow-2xl">
                  <div className="w-full h-10 rounded-t-3xl bg-white/20 flex items-center justify-center mb-2">
                    <span className="text-white/90 text-xs font-bold tracking-wider">MI DAY</span>
                  </div>
                  <span className="text-5xl">&#127919;</span>
                </div>
                <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-white/25 flex items-center justify-center text-lg build-day-float">
                  &#127926;
                </div>
                <div className="absolute -bottom-2 -left-3 w-9 h-9 rounded-full bg-white/25 flex items-center justify-center text-sm build-day-float-delayed">
                  &#127860;
                </div>
                <div className="absolute top-1/2 -right-6 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm build-day-float">
                  &#127914;
                </div>
              </div>
            </div>
          </div>
        </Link>
      </section>

      {/* ================================================================== */}
      {/* HOW IT WORKS - Sleek minimal steps                                 */}
      {/* ================================================================== */}
      <section className="max-w-7xl mx-auto px-4 py-20" aria-label="Como funciona">
        <div className="text-center mb-14">
          <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#e63946] mb-2">Asi de facil</p>
          <h2 className="text-2xl md:text-3xl font-black" style={{ color: 'var(--fg)' }}>
            Crea tu <span className="gradient-text">Day perfecto</span> en 3 pasos
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-5 relative">
          {/* Connecting line on desktop */}
          <div className="hidden md:block absolute top-[80px] left-[calc(16.66%+48px)] right-[calc(16.66%+48px)] h-[2px]" style={{ background: 'linear-gradient(90deg, var(--border), #e63946, var(--border))' }} />

          {[
            { icon: '&#128269;', title: 'Explora eventos', desc: 'Descubre experiencias unicas en tu ciudad: conciertos, gastronomia, arte y mas.', color: '#e63946' },
            { icon: '&#128197;', title: 'Crea tu Day', desc: 'Agrega actividades a tu plan diario. Te mostramos la ruta y el costo total.', color: '#f97316' },
            { icon: '&#127881;', title: 'Disfruta', desc: 'Obten tus tickets QR, comparte con amigos y vive un dia inolvidable.', color: '#10b981' },
          ].map((step, i) => (
            <div key={i} className="relative text-center animate-fade-in" style={{ animationDelay: `${i * 150}ms` }}>
              <div
                className="relative rounded-3xl border p-7 pb-9 transition-all hover:shadow-lg group"
                style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
              >
                {/* Background step number */}
                <div
                  className="absolute top-3 right-4 text-7xl font-black pointer-events-none select-none"
                  style={{ color: 'var(--border)', opacity: 0.4 }}
                >
                  0{i + 1}
                </div>

                {/* Icon circle */}
                <div className="relative z-10 mx-auto w-18 h-18 rounded-2xl flex items-center justify-center mb-6 shadow-lg transition-transform group-hover:scale-110" style={{ background: `linear-gradient(135deg, ${step.color}20, ${step.color}10)`, border: `2px solid ${step.color}30`, width: '72px', height: '72px' }}>
                  <span className="text-3xl" dangerouslySetInnerHTML={{ __html: step.icon }} />
                </div>

                <h3 className="text-base font-bold mb-2 relative z-10" style={{ color: 'var(--fg)' }}>{step.title}</h3>
                <p className="text-sm leading-relaxed relative z-10" style={{ color: 'var(--text-secondary)' }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================================================================== */}
      {/* CATEGORIES - Horizontal scroll glass cards                         */}
      {/* ================================================================== */}
      {categories.length > 0 && (
        <section className="relative overflow-hidden py-20" aria-label="Categorias de eventos">
          {/* Subtle gradient background */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, var(--bg), var(--surface-2), var(--bg))' }} />

          <div className="relative z-10 max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#e63946] mb-2">Categorias</p>
              <h2 className="text-2xl md:text-3xl font-black mb-3" style={{ color: 'var(--fg)' }}>
                Explora por categoria
              </h2>
              <p className="text-sm max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
                Encuentra exactamente lo que buscas entre nuestras {categories.length} categorias de experiencias
              </p>
            </div>

            {/* Horizontal scroll row with snap */}
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory -mx-4 px-4">
              {categories.map((cat) => {
                const bgImage = categoryImages[cat.slug] || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop';
                const eventCount = filteredCategoryEvents.find((c) => c.category.slug === cat.slug)?.events.length || 0;

                return (
                  <Link
                    key={cat.id}
                    href={`/search?category=${cat.slug}`}
                    className="group flex-shrink-0 snap-start relative overflow-hidden rounded-2xl w-[260px] h-[320px] transition-all duration-500"
                  >
                    <Image
                      src={bgImage}
                      alt={`${cat.name} - Eventos y experiencias`}
                      fill
                      sizes="260px"
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    {/* Dark overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10 transition-all duration-500 group-hover:from-black/90 group-hover:via-black/50" />

                    {/* Glass bottom bar */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                      <div className="flex items-center gap-2.5 mb-2">
                        <span className="text-3xl drop-shadow-lg">{cat.icon}</span>
                        <div>
                          <h3 className="text-lg font-black text-white leading-tight">
                            {cat.name}
                          </h3>
                          {eventCount > 0 && (
                            <span className="text-[11px] text-white/60">
                              {eventCount} evento{eventCount !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-white/80 transition-all group-hover:text-white group-hover:translate-x-1">
                        Explorar
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                    </div>

                    {/* Hover border glow */}
                    <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-[#e63946]/50 transition-all duration-500 pointer-events-none" />
                  </Link>
                );
              })}
            </div>

            {/* Full category grid below -- large format editorial cards (top 6) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
              {categories.slice(0, 6).map((cat) => {
                const bgImage = categoryImages[cat.slug] || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop';
                const desc = categoryDescriptions[cat.slug] || 'Descubre los mejores eventos y experiencias seleccionadas especialmente para ti.';
                const eventCount = filteredCategoryEvents.find((c) => c.category.slug === cat.slug)?.events.length || 0;

                return (
                  <Link
                    key={`grid-${cat.id}`}
                    href={`/search?category=${cat.slug}`}
                    className="category-card-premium group relative overflow-hidden rounded-2xl border transition-all duration-500 h-[200px]"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <Image
                      src={bgImage}
                      alt={`${cat.name} - Eventos y experiencias`}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-transparent" />
                    <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-[#e63946]/60 transition-all duration-500 z-20 pointer-events-none" />

                    <div className="absolute inset-0 z-10 flex flex-col justify-center p-6 md:p-7">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl md:text-4xl">{cat.icon}</span>
                        <div>
                          <h3 className="text-xl md:text-2xl font-black text-white leading-tight">
                            {cat.name}
                          </h3>
                          {eventCount > 0 && (
                            <span className="text-xs text-white/70 font-medium">
                              {eventCount} evento{eventCount !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-white/80 leading-relaxed max-w-md line-clamp-2 mb-3">
                        {desc}
                      </p>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-white/90 group-hover:text-white transition-colors">
                        Explorar
                        <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ================================================================== */}
      {/* PERSONALIZED FEED — "Para Ti"                                      */}
      {/* ================================================================== */}
      <ForYouFeed />

      {/* ================================================================== */}
      {/* FEATURED EVENTS CAROUSEL                                           */}
      {/* ================================================================== */}
      <div className="max-w-7xl mx-auto px-4 pt-16">
        <FilteredCarousel title="&#128293; Destacados" events={featured} loading={false} viewAllHref="/search?featured=true" />
      </div>

      {/* ================================================================== */}
      {/* VIDEO EXPERIENCES - Immersive vertical-style section               */}
      {/* ================================================================== */}
      {videoEvents.length > 0 && (
        <section className="relative py-20 overflow-hidden" aria-label="Experiencias en video">
          {/* Dark cinematic background */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, var(--bg), #0a0a0a, #0a0a0a, var(--bg))' }} />

          <div className="relative z-10 max-w-7xl mx-auto px-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#e63946]/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#e63946]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm0 2v12h16V6H4zm4.5 2.5l7 3.5-7 3.5v-7z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#e63946] mb-0.5">Exclusivo</p>
                  <h2 className="text-2xl md:text-3xl font-black text-white">
                    Experiencias en video
                  </h2>
                </div>
              </div>
              <Link href="/search" className="hidden md:inline-flex items-center gap-1.5 text-sm font-semibold text-white/60 hover:text-white transition-colors">
                Ver todos
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>

            {/* Video cards grid -- larger, immersive */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {videoEvents.map((event) => (
                <VideoEventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================================================================== */}
      {/* EVENT CAROUSELS - Multiple sections                                */}
      {/* ================================================================== */}
      <div className="max-w-7xl mx-auto px-4 space-y-16 py-16">
        {cdmxEvents.length > 0 && (
          <EventCarousel title="&#127474;&#127485; Lo mejor en Ciudad de Mexico" events={cdmxEvents} loading={false} viewAllHref="/cdmx" />
        )}

        {freeEvents.length > 0 && (
          <FilteredCarousel title="&#127873; Eventos gratuitos" events={freeEvents} loading={false} viewAllHref="/search?maxPrice=0" />
        )}
      </div>

      {/* ================================================================== */}
      {/* MAP TEASER - Discover events near you                              */}
      {/* ================================================================== */}
      {uniqueMapEvents.length > 0 && (
        <section className="relative py-20 overflow-hidden" aria-label="Mapa de eventos">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, var(--bg), var(--surface-2), var(--bg))' }} />

          <div className="relative z-10 max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
              {/* Left text */}
              <div className="lg:col-span-2 lg:sticky lg:top-24">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#e63946]/15 flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#e63946]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#e63946]">Cerca de ti</p>
                </div>
                <h2 className="text-2xl md:text-3xl font-black mb-4" style={{ color: 'var(--fg)' }}>
                  Explora el mapa de eventos
                </h2>
                <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
                  Descubre que esta pasando a tu alrededor. Cada punto es una experiencia esperando ser vivida. Toca un marcador para ver los detalles.
                </p>
                <Link
                  href="/search"
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#e63946] hover:underline"
                >
                  Ver todos los eventos en mapa
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>

                {/* Quick stats */}
                <div className="mt-8 grid grid-cols-3 gap-4">
                  {[
                    { val: `${uniqueMapEvents.length}+`, label: 'Eventos' },
                    { val: `${cities.length}`, label: 'Ciudades' },
                    { val: `${categories.length}`, label: 'Categorias' },
                  ].map((s) => (
                    <div key={s.label} className="text-center rounded-2xl p-3 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                      <p className="text-lg font-black" style={{ color: 'var(--fg)' }}>{s.val}</p>
                      <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Map */}
              <div className="lg:col-span-3 rounded-3xl overflow-hidden shadow-2xl border" style={{ borderColor: 'var(--border)' }}>
                <EventsMap events={uniqueMapEvents} height="480px" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ================================================================== */}
      {/* MORE CAROUSELS                                                     */}
      {/* ================================================================== */}
      <div className="max-w-7xl mx-auto px-4 space-y-16 py-8">
        {popularEvents.length > 0 && (
          <FilteredCarousel title="&#127942; Los mas populares" events={popularEvents} loading={false} viewAllHref="/search?sortBy=popularity" />
        )}

        {filteredCategoryEvents.map(({ category, events }) => (
          <FilteredCarousel
            key={category.id}
            title={`${category.icon || ''} ${category.name}`}
            events={events}
            loading={false}
            viewAllHref={`/search?category=${category.slug}`}
          />
        ))}
      </div>

      {/* ================================================================== */}
      {/* CITIES - Immersive large cards                                     */}
      {/* ================================================================== */}
      {cities.length > 0 && (
        <section className="relative py-20 overflow-hidden" aria-label="Ciudades populares">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, var(--bg), var(--surface-2), var(--bg))' }} />

          <div className="relative z-10 max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#e63946] mb-2">Destinos</p>
              <h2 className="text-2xl md:text-3xl font-black mb-3" style={{ color: 'var(--fg)' }}>
                Ciudades que te esperan
              </h2>
              <p className="text-sm max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
                Experiencias increibles en las ciudades mas vibrantes del mundo
              </p>
            </div>

            {/* Cities: first 2 are large hero cards, rest in a grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              {cities.slice(0, 2).map((city) => (
                <Link
                  key={city.id}
                  href={`/${city.slug}`}
                  className="group relative overflow-hidden rounded-3xl h-[320px] md:h-[380px]"
                >
                  {city.image ? (
                    <Image
                      src={city.image}
                      alt={`Eventos en ${city.name}, ${city.country || ''}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#e63946]/30 to-[#1a1a2e]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Hover border glow */}
                  <div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-[#e63946]/40 transition-all duration-500 pointer-events-none z-20" />

                  <div className="absolute bottom-0 left-0 right-0 p-7 md:p-9 z-10">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/50 font-semibold mb-1">
                      {city.country}
                    </p>
                    <h3 className="text-3xl md:text-4xl font-black text-white leading-tight mb-3">
                      {city.name}
                    </h3>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 bg-white/15 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 transition-all group-hover:bg-white/25 group-hover:border-white/20">
                      Descubrir eventos
                      <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Remaining cities in smaller cards */}
            {cities.length > 2 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {cities.slice(2).map((city) => (
                  <Link
                    key={city.id}
                    href={`/${city.slug}`}
                    className="group relative overflow-hidden rounded-2xl h-[180px] border transition-all duration-300 hover:shadow-lg"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    {city.image ? (
                      <Image
                        src={city.image}
                        alt={`Eventos en ${city.name}, ${city.country || ''}`}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#e63946]/20 to-[var(--surface-2)]" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-[#e63946]/40 transition-all duration-500 pointer-events-none z-20" />

                    <div className="absolute bottom-4 left-4 z-10">
                      <p className="text-lg font-bold text-white">{city.name}</p>
                      {city.country && <p className="text-xs text-white/60">{city.country}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ================================================================== */}
      {/* SOCIAL PROOF / TESTIMONIALS                                        */}
      {/* ================================================================== */}
      <section className="py-20" aria-label="Testimonios de usuarios">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#e63946] mb-2">Testimonios</p>
            <h2 className="text-2xl md:text-3xl font-black mb-3" style={{ color: 'var(--fg)' }}>
              Lo que dicen nuestros usuarios
            </h2>
            <p className="text-sm max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Miles de personas han descubierto experiencias inolvidables con CTXplorer
            </p>
          </div>

          {/* Stats bar */}
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 mb-14">
            {[
              { value: '50K+', label: 'Usuarios activos', icon: '&#128100;' },
              { value: '4.8', label: 'Rating promedio', icon: '&#11088;' },
              { value: '98%', label: 'Satisfaccion', icon: '&#128155;' },
              { value: '6', label: 'Ciudades', icon: '&#127758;' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="text-lg" dangerouslySetInnerHTML={{ __html: stat.icon }} />
                  <p className="text-2xl md:text-3xl font-black" style={{ color: 'var(--fg)' }}>{stat.value}</p>
                </div>
                <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Testimonial cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                name: 'Maria G.',
                city: 'Ciudad de Mexico',
                text: 'Encontre un concierto increible que no sabia que existia. La funcion de armar tu Day es genial, me organizo todo el fin de semana perfecto.',
                rating: 5,
                avatar: 'M',
              },
              {
                name: 'Carlos R.',
                city: 'Madrid',
                text: 'La mejor app para descubrir planes. Los eventos de gastronomia son impresionantes. Ya no me pierdo nada en la ciudad.',
                rating: 5,
                avatar: 'C',
              },
              {
                name: 'Sofia L.',
                city: 'Barcelona',
                text: 'Compre entradas para una experiencia inmersiva de arte que fue INCREIBLE. La calidad de los eventos que recomiendan es de otro nivel.',
                rating: 5,
                avatar: 'S',
              },
            ].map((t, i) => (
              <div
                key={i}
                className="relative rounded-2xl border p-6 transition-all hover:shadow-lg group"
                style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
              >
                {/* Quote mark */}
                <div className="absolute top-4 right-5 text-5xl font-serif pointer-events-none select-none" style={{ color: '#e63946', opacity: 0.1 }}>
                  &ldquo;
                </div>

                {/* Stars */}
                <div className="flex items-center gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <svg key={j} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                </div>

                <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-secondary)' }}>
                  &ldquo;{t.text}&rdquo;
                </p>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#e63946] to-[#ff6b6b] flex items-center justify-center text-white font-bold text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--fg)' }}>{t.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{t.city}</p>
                  </div>
                </div>

                {/* Hover accent */}
                <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-[#e63946]/20 transition-all duration-300 pointer-events-none" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* FINAL CTA - App download / Get started                             */}
      {/* ================================================================== */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="relative overflow-hidden rounded-3xl" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)' }}>
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[#e63946]/10 blur-[120px] -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-purple-600/10 blur-[100px] translate-y-1/2 -translate-x-1/3" />

            <div className="relative z-10 py-16 md:py-20 px-8 md:px-16 text-center">
              <span className="inline-block text-[11px] uppercase tracking-[0.25em] font-bold text-white/60 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full mb-6">
                Empieza ahora
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-white mb-5 leading-tight">
                Tu proximo <span className="gradient-text">momento increible</span><br />esta a un click
              </h2>
              <p className="text-base md:text-lg text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
                Explora miles de eventos en {cities.length} ciudades. Conciertos, arte, gastronomia, festivales y mucho mas. Todo en un solo lugar.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/search"
                  className="inline-flex items-center gap-2 bg-[#e63946] text-white font-bold text-sm px-8 py-4 rounded-xl shadow-lg shadow-[#e63946]/30 transition-all hover:shadow-xl hover:shadow-[#e63946]/40 hover:scale-[1.02]"
                >
                  Explorar eventos
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link
                  href="/build-day"
                  className="inline-flex items-center gap-2 bg-white/10 text-white font-bold text-sm px-8 py-4 rounded-xl border border-white/20 transition-all hover:bg-white/20 hover:border-white/30"
                >
                  Arma tu Day
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
