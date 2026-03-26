'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getEvents,
  getCategories,
  getCities,
  Event,
  Category,
  City,
} from '@/lib/api';
import HeroBanner from '@/components/HeroBanner';
import EventCarousel from '@/components/EventCarousel';

export default function HomePage() {
  const [featured, setFeatured] = useState<Event[]>([]);
  const [categoryEvents, setCategoryEvents] = useState<
    { category: Category; events: Event[] }[]
  >([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [featRes, cats, citiesRes] = await Promise.all([
          getEvents({ featured: true, limit: 12 }),
          getCategories(),
          getCities(),
        ]);

        setFeatured(featRes.data ?? (featRes as unknown as Event[]));
        setCities(citiesRes);

        // Fetch events per category
        const catResults = await Promise.all(
          cats.map(async (cat) => {
            const res = await getEvents({ category: cat.slug, limit: 12 });
            return {
              category: cat,
              events: res.data ?? (res as unknown as Event[]),
            };
          })
        );
        setCategoryEvents(catResults.filter((c) => c.events.length > 0));
      } catch {
        // API might not be running; show empty state
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div>
      <HeroBanner />

      <div className="max-w-7xl mx-auto px-4 space-y-12 pb-16">
        {/* Featured */}
        <EventCarousel
          title="Destacados"
          events={featured}
          loading={loading}
          viewAllHref="/search?featured=true"
        />

        {/* Per-category carousels */}
        {categoryEvents.map(({ category, events }) => (
          <EventCarousel
            key={category.id}
            title={category.name}
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
