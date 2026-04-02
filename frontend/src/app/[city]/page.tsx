import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Event } from '@/lib/api';
import EventCarousel from '@/components/EventCarousel';

export const revalidate = 300;

const BASE_URL = 'https://fever-clone.vercel.app';

const CITY_HERO_IMAGES: Record<string, string> = {
  cdmx: 'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=1920&q=80',
  madrid: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1920&q=80',
  barcelona: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1920&q=80',
  'new-york': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1920&q=80',
  london: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1920&q=80',
  paris: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1920&q=80',
  lima: 'https://images.unsplash.com/photo-1531968455001-5c5272a67c71?w=1920&q=80',
  'buenos-aires': 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=1920&q=80',
  bogota: 'https://images.unsplash.com/photo-1569162942738-e35e8d258932?w=1920&q=80',
  monterrey: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=1920&q=80',
};

const CITY_DESCRIPTIONS: Record<string, string> = {
  cdmx: 'La Ciudad de Mexico es el epicentro cultural de Latinoamerica. Desde conciertos en el Zocalo hasta experiencias gastronomicas en Polanco, pasando por arte contemporaneo en Coyoacan y festivales en Chapultepec. Descubre los mejores eventos y experiencias en CDMX.',
  madrid: 'Madrid vibra con cultura, arte y vida nocturna. Desde musicales en Gran Via hasta exposiciones en el Prado, tapas en La Latina y festivales al aire libre en el Retiro. Vive las mejores experiencias de la capital espanola.',
  barcelona: 'Barcelona fusiona playa, cultura y gastronomia como ninguna otra ciudad. Conciertos junto al mar, arte en el Born, experiencias gastronomicas en el Eixample y festivales que transforman la ciudad. Descubre Barcelona.',
  'new-york': 'New York nunca duerme. Broadway, conciertos en Central Park, experiencias inmersivas en Chelsea, gastronomia de clase mundial y la escena cultural mas diversa del planeta. Descubre lo mejor de NYC.',
  london: 'London es tradicion y vanguardia. West End theatre, conciertos en Brixton, museos de talla mundial, street food en Borough Market y la vida nocturna mas eclectica de Europa. Explora London.',
  paris: 'Paris es la ciudad de las experiencias. Desde cenas con vista a la Torre Eiffel hasta exposiciones en Le Marais, conciertos intimos y festivales que transforman los boulevards. Vive Paris.',
  lima: 'Lima es la capital gastronomica de las Americas. Ceviche de clase mundial, festivales en Barranco, arte en Miraflores y una escena cultural que no para de crecer. Descubre Lima.',
  'buenos-aires': 'Buenos Aires es pasion. Tango en San Telmo, teatro en Corrientes, gastronomia en Palermo y festivales que hacen vibrar toda la ciudad. Vivi Buenos Aires.',
  bogota: 'Bogota es reinvencion constante. Arte en La Candelaria, gastronomia fusion en Chapinero, conciertos en Usaquen y experiencias unicas a 2600 metros de altura. Descubre Bogota.',
  monterrey: 'Monterrey combina modernidad e industria cultural. Conciertos masivos, gastronomia nortena, experiencias al aire libre en la Huasteca y una escena de entretenimiento en constante crecimiento.',
};

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

// Generate static params for known cities
export async function generateStaticParams() {
  const { data: cities } = await supabase.from('cities').select('slug');
  return (cities || []).map((c) => ({ city: c.slug }));
}

// Dynamic metadata per city
export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city: citySlug } = await params;

  const { data: cityData } = await supabase
    .from('cities')
    .select('name, slug, country')
    .eq('slug', citySlug)
    .single();

  if (!cityData) return { title: 'Ciudad no encontrada' };

  const name = cityData.name;
  const country = cityData.country;
  const desc = CITY_DESCRIPTIONS[citySlug] || `Descubre los mejores eventos y experiencias en ${name}. Conciertos, gastronomia, arte, festivales y mas.`;
  const title = `Eventos en ${name} - Conciertos, Gastronomia, Arte y Mas | CTXplorer`;
  const url = `${BASE_URL}/${citySlug}`;

  return {
    title,
    description: desc,
    keywords: [
      `eventos ${name}`, `conciertos ${name}`, `que hacer en ${name}`,
      `planes ${name}`, `experiencias ${name}`, `tickets ${name}`,
      `actividades ${name}`, `gastronomia ${name}`, `arte ${name}`,
      name, country, 'CTXplorer',
    ],
    alternates: { canonical: url },
    openGraph: {
      title,
      description: desc.slice(0, 160),
      url,
      siteName: 'CTXplorer',
      type: 'website',
      locale: 'es_ES',
      images: [{ url: CITY_HERO_IMAGES[citySlug] || '/og-image.png', width: 1200, height: 630, alt: `Eventos en ${name}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Eventos en ${name} | CTXplorer`,
      description: desc.slice(0, 160),
      images: [CITY_HERO_IMAGES[citySlug] || '/og-image.png'],
    },
  };
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city: citySlug } = await params;

  // Fetch city data
  const { data: cityData } = await supabase
    .from('cities')
    .select('id, name, slug, image, country')
    .eq('slug', citySlug)
    .single();

  if (!cityData) notFound();

  const cityId = cityData.id;
  const cityName = cityData.name;
  const cityCountry = cityData.country;

  // Fetch all events + categories for this city in parallel
  const [featuredRes, allRes, freeRes, popularRes, categoriesRes] = await Promise.all([
    supabase.from('events').select('*, cities(*), categories(*)').eq('status', 'PUBLISHED').eq('city_id', cityId).eq('featured', true).order('date', { ascending: true }).limit(12),
    supabase.from('events').select('*, cities(*), categories(*)').eq('status', 'PUBLISHED').eq('city_id', cityId).order('date', { ascending: true }).limit(50),
    supabase.from('events').select('*, cities(*), categories(*)').eq('status', 'PUBLISHED').eq('city_id', cityId).eq('price', 0).order('rating', { ascending: false }).limit(8),
    supabase.from('events').select('*, cities(*), categories(*)').eq('status', 'PUBLISHED').eq('city_id', cityId).order('sold_count', { ascending: false }).limit(12),
    supabase.from('categories').select('id, name, slug, icon, color').order('name'),
  ]);

  const featured = (featuredRes.data || []).map(transformEvent) as unknown as Event[];
  const allEvents = (allRes.data || []).map(transformEvent) as unknown as Event[];
  const freeEvents = (freeRes.data || []).map(transformEvent) as unknown as Event[];
  const popularEvents = (popularRes.data || []).map(transformEvent) as unknown as Event[];
  const categories = categoriesRes.data || [];

  // Group events by category
  const categoryGroups = categories
    .map((cat) => ({
      category: cat,
      events: allEvents.filter((e) => e.category?.slug === cat.slug),
    }))
    .filter((g) => g.events.length > 0);

  const totalEvents = allEvents.length;
  const heroImage = CITY_HERO_IMAGES[citySlug] || cityData.image || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1920&q=80';
  const description = CITY_DESCRIPTIONS[citySlug] || `Descubre los mejores eventos en ${cityName}.`;

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Eventos en ${cityName}`,
    description,
    url: `${BASE_URL}/${citySlug}`,
    about: {
      '@type': 'City',
      name: cityName,
      containedInPlace: { '@type': 'Country', name: cityCountry },
    },
    numberOfItems: totalEvents,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: totalEvents,
      itemListElement: allEvents.slice(0, 10).map((e, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: e.title,
        url: `${BASE_URL}/events/${e.slug}`,
      })),
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: `Eventos en ${cityName}`, item: `${BASE_URL}/${citySlug}` },
    ],
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      {/* City Hero */}
      <section className="relative h-[50vh] min-h-[400px] md:h-[60vh] flex items-end overflow-hidden">
        <Image
          src={heroImage}
          alt={`Eventos en ${cityName}, ${cityCountry}`}
          fill
          priority
          sizes="100vw"
          className="object-cover"
          quality={80}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 pb-10 md:pb-14 w-full">
          {/* Breadcrumb */}
          <nav className="mb-4">
            <ol className="flex items-center gap-1.5 text-xs text-white/60">
              <li><Link href="/" className="hover:text-white transition">Inicio</Link></li>
              <li>/</li>
              <li className="text-white/90">{cityName}</li>
            </ol>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest font-bold text-white bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
                  📍 {cityCountry}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest font-bold text-white bg-[#e63946]/80 px-3.5 py-1.5 rounded-full">
                  {totalEvents} eventos
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[0.95] tracking-tight">
                Eventos en<br />{cityName}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={`/search?city=${citySlug}`}
                className="px-6 py-3 bg-[#e63946] hover:bg-[#d32836] text-white font-bold text-sm rounded-full transition-all hover:scale-[1.03] shadow-lg shadow-[#e63946]/30"
              >
                Buscar eventos
              </Link>
              <Link
                href="/build-day"
                className="px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold text-sm rounded-full transition-all hover:bg-white/20"
              >
                Arma tu Day
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* City description - SEO text */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <p className="text-base leading-relaxed max-w-3xl" style={{ color: 'var(--text-secondary)' }}>
          {description}
        </p>
      </section>

      {/* Category pills */}
      {categoryGroups.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 pb-8">
          <div className="flex flex-wrap gap-2">
            {categoryGroups.map((g) => (
              <Link
                key={g.category.id}
                href={`/search?city=${citySlug}&category=${g.category.slug}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all hover:border-[#e63946]/40 hover:shadow-md"
                style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--fg)' }}
              >
                {g.category.icon && <span>{g.category.icon}</span>}
                {g.category.name}
                <span className="text-xs ml-1 px-1.5 py-0.5 rounded-full" style={{ background: 'var(--surface-2)', color: 'var(--text-tertiary)' }}>
                  {g.events.length}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Event sections */}
      <div className="max-w-7xl mx-auto px-4 space-y-14 pb-16">
        {featured.length > 0 && (
          <EventCarousel title={`🔥 Destacados en ${cityName}`} events={featured} loading={false} viewAllHref={`/search?city=${citySlug}&featured=true`} />
        )}

        {popularEvents.length > 0 && (
          <EventCarousel title={`🏆 Los mas populares`} events={popularEvents} loading={false} viewAllHref={`/search?city=${citySlug}&sortBy=popularity`} />
        )}

        {freeEvents.length > 0 && (
          <EventCarousel title="🎁 Eventos gratuitos" events={freeEvents} loading={false} viewAllHref={`/search?city=${citySlug}&maxPrice=0`} />
        )}

        {/* Per-category sections */}
        {categoryGroups.map((g) => (
          <EventCarousel
            key={g.category.id}
            title={`${g.category.icon || ''} ${g.category.name}`}
            events={g.events.slice(0, 12) as Event[]}
            loading={false}
            viewAllHref={`/search?city=${citySlug}&category=${g.category.slug}`}
          />
        ))}

        {/* All events count = 0 */}
        {totalEvents === 0 && (
          <div className="text-center py-20">
            <span className="text-6xl block mb-4">🏙️</span>
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--fg)' }}>Aun no hay eventos en {cityName}</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Estamos trabajando para traer las mejores experiencias a esta ciudad.</p>
            <Link href="/search" className="btn-primary px-6 py-3 text-sm">Explorar otras ciudades</Link>
          </div>
        )}
      </div>
    </div>
  );
}
