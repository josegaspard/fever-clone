'use client';

import { useCityFilter } from './CityFilterProvider';
import Link from 'next/link';
import Image from 'next/image';
import { Event } from '@/lib/api';

interface FilteredTrendingProps {
  events: Event[];
}

export default function FilteredTrending({ events }: FilteredTrendingProps) {
  const { filterEvents } = useCityFilter();
  const trendingEvents = filterEvents(events).slice(0, 4);

  if (trendingEvents.length === 0) return null;

  const formatPrice = (event: Event) => {
    const sym = event.currency === 'MXN' ? '$' : event.currency === 'USD' ? '$' : event.currency === 'GBP' ? '\u00a3' : '\u20ac';
    if (event.price === 0) return 'Gratis';
    return `${sym}${event.price.toFixed(0)}`;
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    } catch {
      return d;
    }
  };

  return (
    <section className="relative overflow-hidden" aria-label="Trending ahora">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-[#e63946]/[0.04] blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-20 pb-4 relative z-10">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

              <div className="absolute top-5 left-5 z-10">
                <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest font-bold text-white bg-[#e63946] px-3.5 py-1.5 rounded-full shadow-lg shadow-[#e63946]/30">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                  </svg>
                  #1 Trending
                </span>
              </div>

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

          <div className="flex flex-col gap-4">
            {trendingEvents.slice(1, 4).map((event, i) => (
              <Link
                key={event.id}
                href={`/events/${event.slug}`}
                className="group relative flex overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-lg h-[140px]"
                style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
              >
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
                  <div className="absolute top-3 left-3 w-7 h-7 rounded-full bg-[#e63946] flex items-center justify-center text-white text-xs font-black shadow-lg">
                    {i + 2}
                  </div>
                </div>

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

                <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-[#e63946]/30 transition-all duration-300 pointer-events-none" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
