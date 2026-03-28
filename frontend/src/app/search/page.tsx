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

// Note: metadata for this page is set via the parent layout since this is a client component

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
  const rating = searchParams.get('rating') || '';
  const sortBy = searchParams.get('sortBy') || '';
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
          rating: rating ? Number(rating) : undefined,
          sortBy: sortBy || undefined,
          status: 'PUBLISHED',
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
  }, [q, city, category, minPrice, maxPrice, date, featured, rating, sortBy, page]);

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
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Ciudad</h3>
            <select
              value={city}
              onChange={(e) => updateUrl({ city: e.target.value })}
              className="w-full input-theme text-sm px-3 py-2"
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
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Categoria</h3>
            <select
              value={category}
              onChange={(e) => updateUrl({ category: e.target.value })}
              className="w-full input-theme text-sm px-3 py-2"
            >
              <option value="">Todas las categorias</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
              Rango de precio
            </h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => updateUrl({ minPrice: e.target.value })}
                className="w-full input-theme text-sm px-3 py-2"
              />
              <span style={{ color: 'var(--text-tertiary)' }}>-</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => updateUrl({ maxPrice: e.target.value })}
                className="w-full input-theme text-sm px-3 py-2"
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Puntuacion minima</h3>
            <select
              value={rating}
              onChange={(e) => updateUrl({ rating: e.target.value })}
              className="w-full input-theme text-sm px-3 py-2"
            >
              <option value="">Cualquier puntuacion</option>
              <option value="4">4+ estrellas</option>
              <option value="3">3+ estrellas</option>
              <option value="2">2+ estrellas</option>
              <option value="1">1+ estrella</option>
            </select>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Ordenar por</h3>
            <select
              value={sortBy}
              onChange={(e) => updateUrl({ sortBy: e.target.value })}
              className="w-full input-theme text-sm px-3 py-2"
            >
              <option value="">Fecha (predeterminado)</option>
              <option value="price_asc">Precio: menor a mayor</option>
              <option value="price_desc">Precio: mayor a menor</option>
              <option value="rating">Mejor puntuacion</option>
              <option value="popularity">Mas popular</option>
              <option value="date">Fecha mas cercana</option>
            </select>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Fecha</h3>
            <input
              type="date"
              value={date}
              onChange={(e) => updateUrl({ date: e.target.value })}
              className="w-full input-theme text-sm px-3 py-2"
            />
          </div>

          {/* Clear filters */}
          {(q || city || category || minPrice || maxPrice || date || featured || rating || sortBy) && (
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
                className="w-16 h-16 mx-auto mb-4"
                style={{ color: 'var(--text-tertiary)' }}
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
              <p style={{ color: 'var(--text-secondary)' }}>
                Intenta con otros filtros o terminos de busqueda.
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
                    className="px-3 py-2 rounded-lg text-sm disabled:opacity-40 hover:opacity-80 transition"
                    style={{ background: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid' }}
                  >
                    Anterior
                  </button>
                  {(() => {
                    const maxVisible = 5;
                    let start = Math.max(1, page - Math.floor(maxVisible / 2));
                    const end = Math.min(totalPages, start + maxVisible - 1);
                    start = Math.max(1, end - maxVisible + 1);
                    return Array.from({ length: end - start + 1 }).map((_, i) => {
                      const p = start + i;
                      return (
                        <button
                          key={p}
                          onClick={() => updateUrl({ page: String(p) })}
                          className={`w-10 h-10 rounded-lg text-sm font-medium transition ${
                            p === page
                              ? 'bg-[#e63946] text-white'
                              : 'hover:opacity-80'
                          }`}
                          style={p === page ? undefined : { background: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid' }}
                        >
                          {p}
                        </button>
                      );
                    });
                  })()}
                  <button
                    disabled={page >= totalPages}
                    onClick={() => updateUrl({ page: String(page + 1) })}
                    className="px-3 py-2 rounded-lg text-sm disabled:opacity-40 hover:opacity-80 transition"
                    style={{ background: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid' }}
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
