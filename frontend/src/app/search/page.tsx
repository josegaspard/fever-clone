'use client';

import { useEffect, useState, useCallback, Suspense, lazy } from 'react';
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

const EventsMap = lazy(() => import('@/components/EventsMap'));

// Note: metadata for this page is set via the parent layout since this is a client component

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [events, setEvents] = useState<Event[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'granted' | 'denied'>('idle');

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
  const radius = searchParams.get('radius') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  function requestLocation() {
    if (!navigator.geolocation) return;
    setGeoStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
        setGeoStatus('granted');
      },
      () => setGeoStatus('denied'),
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }

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
          lat: radius && userLat ? userLat : undefined,
          lng: radius && userLng ? userLng : undefined,
          radius: radius ? Number(radius) : undefined,
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
  }, [q, city, category, minPrice, maxPrice, date, featured, rating, sortBy, radius, userLat, userLng, page]);

  return (
    <div>
      {/* Search hero */}
      <div className="relative py-12 md:py-16 mb-8" style={{ background: 'linear-gradient(135deg, var(--surface-2) 0%, var(--card) 100%)' }}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2" style={{ color: 'var(--fg)' }}>
            {q ? `Resultados para "${q}"` : category ? `Eventos de ${category}` : city ? `Eventos en ${city}` : 'Explorar eventos'}
          </h1>
          <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
            Descubre experiencias unicas en tu ciudad
          </p>
          <div className="max-w-2xl mx-auto">
            <SearchBar
              initialValue={q}
              onSearch={(val) => updateUrl({ q: val })}
              large
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-12">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters sidebar */}
        <aside className="lg:w-64 shrink-0 space-y-6 lg:sticky lg:top-24 lg:self-start">
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

          {/* Distance filter */}
          <div>
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Distancia</h3>
            {geoStatus === 'granted' && userLat ? (
              <>
                <select
                  value={radius}
                  onChange={(e) => updateUrl({ radius: e.target.value })}
                  className="w-full input-theme text-sm px-3 py-2"
                >
                  <option value="">Sin limite</option>
                  <option value="2">2 km</option>
                  <option value="5">5 km</option>
                  <option value="10">10 km</option>
                  <option value="25">25 km</option>
                  <option value="50">50 km</option>
                </select>
                <p className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  Ubicacion activa
                </p>
              </>
            ) : geoStatus === 'loading' ? (
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Obteniendo ubicacion...</p>
            ) : geoStatus === 'denied' ? (
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Ubicacion no disponible. Activa los permisos en tu navegador.</p>
            ) : (
              <button
                onClick={requestLocation}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition hover:opacity-80"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg)' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-secondary)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Usar mi ubicacion
              </button>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Fecha</h3>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(() => {
                const now = new Date();
                const todayStr = now.toISOString().split('T')[0];
                const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
                const tomorrowStr = tomorrow.toISOString().split('T')[0];
                const dayOfWeek = now.getDay();
                const daysUntilSat = (6 - dayOfWeek + 7) % 7 || 7;
                const saturday = new Date(now); saturday.setDate(now.getDate() + daysUntilSat);
                const sunday = new Date(saturday); sunday.setDate(saturday.getDate() + 1);
                const endOfWeek = new Date(now); endOfWeek.setDate(now.getDate() + (7 - dayOfWeek));

                const quickDates = [
                  { label: 'Hoy', value: todayStr },
                  { label: 'Manana', value: tomorrowStr },
                  { label: 'Este finde', value: saturday.toISOString().split('T')[0] },
                  { label: 'Esta semana', value: todayStr },
                ];
                return quickDates.map((qd) => (
                  <button
                    key={qd.label}
                    onClick={() => updateUrl({ date: qd.value })}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${date === qd.value ? 'bg-[#e63946] text-white' : ''}`}
                    style={date !== qd.value ? { background: 'var(--surface-2)', color: 'var(--text-secondary)' } : {}}
                  >
                    {qd.label}
                  </button>
                ));
              })()}
            </div>
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
          {/* View toggle */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {!loading && events.length > 0 && `${events.length} eventos encontrados`}
            </p>
            <div className="flex rounded-lg p-0.5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${viewMode === 'grid' ? 'bg-[#e63946] text-white' : ''}`}
                style={viewMode !== 'grid' ? { color: 'var(--text-secondary)' } : {}}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${viewMode === 'map' ? 'bg-[#e63946] text-white' : ''}`}
                style={viewMode !== 'map' ? { color: 'var(--text-secondary)' } : {}}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
              </button>
            </div>
          </div>

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
              {viewMode === 'map' ? (
                <Suspense fallback={<div className="h-[500px] rounded-2xl shimmer" />}>
                  <EventsMap events={events} height="600px" />
                </Suspense>
              ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
              )}

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
