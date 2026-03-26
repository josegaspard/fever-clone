'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  getEvents,
  getCities,
  getCategories,
  Event,
  City,
  Category,
} from '@/lib/api';
import EventCard, { EventCardSkeleton } from '@/components/EventCard';
import SearchBar from '@/components/SearchBar';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [events, setEvents] = useState<Event[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  // Read filters from URL
  const q = searchParams.get('q') || '';
  const city = searchParams.get('city') || '';
  const category = searchParams.get('category') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const date = searchParams.get('date') || '';
  const featured = searchParams.get('featured') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const updateUrl = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v) params.set(k, v);
        else params.delete(k);
      });
      // Reset page when changing filters
      if (!updates.page) params.delete('page');
      router.push(`/search?${params.toString()}`);
    },
    [searchParams, router]
  );

  useEffect(() => {
    Promise.all([getCities(), getCategories()])
      .then(([c, cat]) => {
        setCities(c);
        setCategories(cat);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await getEvents({
          q: q || undefined,
          city: city || undefined,
          category: category || undefined,
          minPrice: minPrice ? Number(minPrice) : undefined,
          maxPrice: maxPrice ? Number(maxPrice) : undefined,
          date: date || undefined,
          featured: featured === 'true' ? true : undefined,
          page,
          limit: 24,
        });
        setEvents(res.data ?? (res as unknown as Event[]));
        setTotalPages(res.totalPages ?? 1);
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [q, city, category, minPrice, maxPrice, date, featured, page]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Search bar */}
      <div className="max-w-2xl mx-auto mb-8">
        <SearchBar
          initialValue={q}
          onSearch={(val) => updateUrl({ q: val })}
          large
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters sidebar */}
        <aside className="lg:w-64 shrink-0 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Ciudad</h3>
            <select
              value={city}
              onChange={(e) => updateUrl({ city: e.target.value })}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white text-sm rounded-lg px-3 py-2"
            >
              <option value="">Todas las ciudades</option>
              {cities.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Categoría</h3>
            <select
              value={category}
              onChange={(e) => updateUrl({ category: e.target.value })}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white text-sm rounded-lg px-3 py-2"
            >
              <option value="">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">
              Rango de precio
            </h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => updateUrl({ minPrice: e.target.value })}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white text-sm rounded-lg px-3 py-2"
              />
              <span className="text-gray-500">-</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => updateUrl({ maxPrice: e.target.value })}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white text-sm rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Fecha</h3>
            <input
              type="date"
              value={date}
              onChange={(e) => updateUrl({ date: e.target.value })}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white text-sm rounded-lg px-3 py-2"
            />
          </div>

          {/* Clear filters */}
          {(q || city || category || minPrice || maxPrice || date || featured) && (
            <button
              onClick={() => router.push('/search')}
              className="text-sm text-[#e63946] hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </aside>

        {/* Results */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <EventCardSkeleton key={i} />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-24">
              <svg
                className="w-16 h-16 mx-auto text-gray-600 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <h2 className="text-xl font-bold mb-2">
                No se encontraron resultados
              </h2>
              <p className="text-gray-400">
                Intenta con otros filtros o términos de búsqueda.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    disabled={page <= 1}
                    onClick={() => updateUrl({ page: String(page - 1) })}
                    className="px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm disabled:opacity-40 hover:bg-[#2a2a2a] transition"
                  >
                    Anterior
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }).map(
                    (_, i) => {
                      const p = i + 1;
                      return (
                        <button
                          key={p}
                          onClick={() => updateUrl({ page: String(p) })}
                          className={`w-10 h-10 rounded-lg text-sm font-medium transition ${
                            p === page
                              ? 'bg-[#e63946] text-white'
                              : 'bg-[#1a1a1a] border border-[#2a2a2a] hover:bg-[#2a2a2a]'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    }
                  )}
                  <button
                    disabled={page >= totalPages}
                    onClick={() => updateUrl({ page: String(page + 1) })}
                    className="px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm disabled:opacity-40 hover:bg-[#2a2a2a] transition"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
