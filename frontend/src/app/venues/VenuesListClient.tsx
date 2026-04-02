'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface VenueItem {
  id: string;
  slug: string;
  name: string;
  shortDescription?: string;
  logo?: string;
  coverImage?: string;
  category: string;
  address?: string;
  rating: number;
  reviewCount: number;
  followerCount: number;
  verified: boolean;
  featured: boolean;
  cityName?: string;
  eventsCount: number;
}

const categoryLabels: Record<string, { label: string; icon: string }> = {
  museo: { label: 'Museo', icon: '🏛️' },
  teatro: { label: 'Teatro', icon: '🎭' },
  galeria: { label: 'Galeria', icon: '🎨' },
  bar: { label: 'Bar', icon: '🍸' },
  club: { label: 'Club', icon: '🎵' },
  restaurante: { label: 'Restaurante', icon: '🍽️' },
  auditorio: { label: 'Auditorio', icon: '🎤' },
  centro_cultural: { label: 'Centro Cultural', icon: '📚' },
  general: { label: 'Venue', icon: '📍' },
};

const formatCount = (n: number) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
};

export default function VenuesListClient({ venues }: { venues: VenueItem[] }) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'rating' | 'followers' | 'events'>('rating');

  const categories = useMemo(() => {
    const cats = new Set(venues.map((v) => v.category));
    return Array.from(cats).sort();
  }, [venues]);

  const filtered = useMemo(() => {
    let list = [...venues];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((v) => v.name.toLowerCase().includes(q) || v.cityName?.toLowerCase().includes(q) || v.address?.toLowerCase().includes(q));
    }
    if (categoryFilter) list = list.filter((v) => v.category === categoryFilter);
    list.sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'followers') return b.followerCount - a.followerCount;
      return b.eventsCount - a.eventsCount;
    });
    return list;
  }, [venues, search, categoryFilter, sortBy]);

  const totalEvents = venues.reduce((s, v) => s + v.eventsCount, 0);
  const avgRating = venues.length ? (venues.reduce((s, v) => s + v.rating, 0) / venues.length).toFixed(1) : '0';

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Hero */}
      <section className="relative overflow-hidden py-16 sm:py-24">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-[600px] h-[600px] rounded-full opacity-[0.04]" style={{ background: 'radial-gradient(circle, #e63946 0%, transparent 70%)' }} />
          <div className="absolute -bottom-1/2 -left-1/4 w-[500px] h-[500px] rounded-full opacity-[0.03]" style={{ background: 'radial-gradient(circle, #e63946 0%, transparent 70%)' }} />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-10">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-4">
              Descubre <span className="gradient-text">Venues</span>
            </h1>
            <p className="text-base sm:text-lg max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Los mejores espacios para vivir experiencias inolvidables
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="flex items-center justify-center gap-6 sm:gap-10 mb-10">
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-black" style={{ color: 'var(--fg)' }}>{venues.length}</p>
              <p className="text-xs sm:text-sm" style={{ color: 'var(--text-tertiary)' }}>Venues</p>
            </div>
            <div className="w-px h-10" style={{ background: 'var(--border)' }} />
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-black" style={{ color: 'var(--fg)' }}>{totalEvents}</p>
              <p className="text-xs sm:text-sm" style={{ color: 'var(--text-tertiary)' }}>Eventos</p>
            </div>
            <div className="w-px h-10" style={{ background: 'var(--border)' }} />
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-black flex items-center justify-center gap-1">
                <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                {avgRating}
              </p>
              <p className="text-xs sm:text-sm" style={{ color: 'var(--text-tertiary)' }}>Promedio</p>
            </div>
          </motion.div>

          {/* Search */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="max-w-xl mx-auto mb-8">
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar venue, ciudad..."
                className="w-full input-theme rounded-2xl pl-12 pr-4 py-4 text-sm shadow-theme-lg"
              />
            </div>
          </motion.div>

          {/* Category pills */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.4 }} className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 justify-center flex-wrap">
            <button
              onClick={() => setCategoryFilter(null)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all shrink-0"
              style={!categoryFilter ? { background: '#e63946', color: '#fff' } : { background: 'var(--card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            >
              Todos
            </button>
            {categories.map((cat) => {
              const info = categoryLabels[cat] || { label: cat, icon: '📍' };
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
                  className="px-4 py-2 rounded-full text-sm font-medium transition-all shrink-0"
                  style={categoryFilter === cat ? { background: '#e63946', color: '#fff' } : { background: 'var(--card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                >
                  {info.icon} {info.label}
                </button>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Sort + Results */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {filtered.length} {filtered.length === 1 ? 'venue' : 'venues'}
          </p>
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--card)' }}>
            {([
              { key: 'rating' as const, label: 'Rating' },
              { key: 'followers' as const, label: 'Seguidores' },
              { key: 'events' as const, label: 'Eventos' },
            ]).map((s) => (
              <button
                key={s.key}
                onClick={() => setSortBy(s.key)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={sortBy === s.key ? { background: 'var(--bg)', color: 'var(--fg)', boxShadow: 'var(--shadow)' } : { color: 'var(--text-tertiary)' }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-20">
              <span className="text-6xl block mb-4">🔍</span>
              <p className="text-xl font-bold mb-2">No encontramos venues</p>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Intenta con otra busqueda o filtro</p>
            </motion.div>
          ) : (
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((venue, i) => (
                <motion.div
                  key={venue.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                >
                  <VenueCard venue={venue} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}

function VenueCard({ venue }: { venue: VenueItem }) {
  const [imgError, setImgError] = useState(false);
  const info = categoryLabels[venue.category] || { label: venue.category, icon: '📍' };

  return (
    <Link href={`/venues/${venue.slug}`} className="group block">
      <motion.article
        whileHover={{ y: -6 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
      >
        {/* Cover */}
        <div className="relative aspect-[16/9] overflow-hidden">
          {venue.coverImage && !imgError ? (
            <Image
              src={venue.coverImage}
              alt={venue.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
              <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-20">{info.icon}</div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Category pill */}
          <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
            {info.icon} {info.label}
          </div>

          {/* Verified badge */}
          {venue.verified && (
            <div className="absolute top-3 right-3 bg-[#2a9d8f] text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
              Verificado
            </div>
          )}

          {/* Featured */}
          {venue.featured && (
            <div className="absolute bottom-3 right-3 text-white text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'linear-gradient(135deg, #e63946, #ff6b6b)' }}>
              Destacado
            </div>
          )}

          {/* Logo overlay */}
          <div className="absolute bottom-3 left-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg" style={{ border: '2px solid rgba(255,255,255,0.3)' }}>
              {venue.logo ? (
                <Image src={venue.logo} alt="" width={48} height={48} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg font-bold bg-white/20 backdrop-blur-sm text-white">
                  {venue.name.charAt(0)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-base font-bold mb-1 group-hover:text-[#e63946] transition-colors line-clamp-1" style={{ color: 'var(--fg)' }}>
            {venue.name}
          </h3>

          {venue.shortDescription && (
            <p className="text-xs line-clamp-2 mb-3" style={{ color: 'var(--text-secondary)' }}>{venue.shortDescription}</p>
          )}

          {/* Location */}
          {(venue.cityName || venue.address) && (
            <p className="text-xs flex items-center gap-1 mb-3" style={{ color: 'var(--text-tertiary)' }}>
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate">{venue.cityName || venue.address}</span>
            </p>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            {venue.rating > 0 && (
              <span className="flex items-center gap-1 text-xs font-semibold">
                <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                <span style={{ color: 'var(--fg)' }}>{venue.rating.toFixed(1)}</span>
                <span style={{ color: 'var(--text-tertiary)' }}>({venue.reviewCount})</span>
              </span>
            )}
            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              {formatCount(venue.followerCount)}
            </span>
            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              {venue.eventsCount} eventos
            </span>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
