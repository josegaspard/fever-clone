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

export const metadata = {
  title: 'Fever - Descubre los mejores planes y eventos en tu ciudad',
  description: 'Explora conciertos, gastronomía, arte, festivales y más. Crea tu Day perfecto en Ciudad de México, Madrid, Barcelona, New York, London y Paris. Eventos gratuitos y de pago.',
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

  return (
    <div>
      <HeroBanner />

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 py-16">
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
              <h3 className="text-lg font-bold text-white">{step.title}</h3>
              <p className="text-sm text-gray-400">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-[#2a2a2a] bg-[#111]">
        <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-3xl font-extrabold gradient-text">{eventCount}+</p>
            <p className="text-sm text-gray-400 mt-1">Eventos</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold gradient-text">{cities.length}</p>
            <p className="text-sm text-gray-400 mt-1">Ciudades</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold gradient-text">{categories.length}</p>
            <p className="text-sm text-gray-400 mt-1">Categorías</p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 space-y-14 py-16">
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
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4">
              Ciudades populares
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {cities.map((city) => (
                <Link
                  key={city.id}
                  href={`/search?city=${city.slug}`}
                  className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-[#2a2a2a]"
                >
                  {city.image ? (
                    <img
                      src={city.image}
                      alt={city.name}
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
