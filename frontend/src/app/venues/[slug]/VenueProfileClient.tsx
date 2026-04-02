'use client';

import { useState, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Event } from '@/lib/api';
import EventCard from '@/components/EventCard';
import FollowButton from '@/components/FollowButton';
import ShareButton from '@/components/ShareButton';

interface VenueData {
  id: string;
  slug: string;
  name: string;
  description?: string;
  shortDescription?: string;
  logo?: string;
  coverImage?: string;
  category?: string;
  address?: string;
  lat?: number;
  lng?: number;
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  twitter?: string;
  facebook?: string;
  tiktok?: string;
  rating?: number;
  reviewCount?: number;
  followerCount?: number;
  verified?: boolean;
  eventsCount?: number;
  videoUrl?: string;
}

interface Props {
  venue: VenueData;
  events: Event[];
  isFollowing: boolean;
}

type TabId = 'eventos' | 'sobre' | 'resenas' | 'ubicacion';
type EventFilter = 'proximos' | 'pasados' | 'todos';

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

function StarDisplay({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const s = size === 'lg' ? 'w-6 h-6' : size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} className={`${s} ${star <= Math.round(rating) ? 'text-amber-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

export default function VenueProfileClient({ venue, events, isFollowing }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('eventos');
  const [eventFilter, setEventFilter] = useState<EventFilter>('proximos');
  const [logoError, setLogoError] = useState(false);
  const [coverError, setCoverError] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const now = new Date();
  const catInfo = categoryLabels[venue.category || 'general'] || categoryLabels.general;

  const upcomingEvents = useMemo(() => {
    return events.filter((e) => new Date(e.date) >= now).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  const pastEvents = useMemo(() => {
    return events.filter((e) => new Date(e.date) < now).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (eventFilter === 'proximos') return upcomingEvents;
    if (eventFilter === 'pasados') return pastEvents;
    return [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events, eventFilter, upcomingEvents, pastEvents]);

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: 'eventos', label: 'Eventos', count: events.length },
    { id: 'sobre', label: 'Sobre' },
    { id: 'resenas', label: 'Resenas', count: venue.reviewCount || 0 },
    { id: 'ubicacion', label: 'Ubicacion' },
  ];

  const socialLinks = [
    { key: 'instagram', value: venue.instagram, label: 'Instagram', icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>, href: (v: string) => v.startsWith('http') ? v : `https://instagram.com/${v.replace('@', '')}` },
    { key: 'twitter', value: venue.twitter, label: 'X', icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>, href: (v: string) => v.startsWith('http') ? v : `https://x.com/${v.replace('@', '')}` },
    { key: 'facebook', value: venue.facebook, label: 'Facebook', icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>, href: (v: string) => v.startsWith('http') ? v : `https://facebook.com/${v}` },
    { key: 'tiktok', value: venue.tiktok, label: 'TikTok', icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" /></svg>, href: (v: string) => v.startsWith('http') ? v : `https://tiktok.com/@${v.replace('@', '')}` },
  ];
  const activeSocials = socialLinks.filter((s) => s.value);

  // Rating bar distribution (mock for now based on rating)
  const ratingDist = useMemo(() => {
    const r = venue.rating || 0;
    const total = venue.reviewCount || 1;
    // approximate distribution centered on rating
    return [5, 4, 3, 2, 1].map((star) => {
      const dist = Math.max(0, 1 - Math.abs(star - r) * 0.4);
      return { star, count: Math.round(dist * total), pct: dist * 100 };
    });
  }, [venue.rating, venue.reviewCount]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* ═══ HERO - Immersive ═══ */}
      <div ref={heroRef} className="relative w-full h-[420px] sm:h-[480px] md:h-[540px] overflow-hidden">
        {/* Background media with parallax */}
        <motion.div style={{ scale: heroScale }} className="absolute inset-0">
          {venue.videoUrl ? (
            <video
              ref={videoRef}
              src={venue.videoUrl}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
              poster={venue.coverImage}
            />
          ) : venue.coverImage && !coverError ? (
            <Image
              src={venue.coverImage}
              alt={`${venue.name} - portada`}
              fill
              sizes="100vw"
              className="object-cover"
              priority
              onError={() => setCoverError(true)}
            />
          ) : (
            <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }} />
          )}
        </motion.div>

        {/* Cinematic gradient overlays */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 35%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0.3) 100%)' }} />
        {/* Side vignette */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)' }} />
        {/* Accent glow */}
        <motion.div
          animate={{ opacity: [0.08, 0.15, 0.08] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[120px]"
          style={{ background: '#e63946' }}
        />

        {/* Top nav */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex items-center justify-between z-10">
          <Link href="/venues" className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all hover:scale-110 hover:bg-white/25" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }} aria-label="Volver">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <ShareButton url={`/venues/${venue.slug}`} title={venue.name} />
        </motion.div>

        {/* Hero content - centered composition */}
        <motion.div style={{ opacity: heroOpacity }} className="absolute inset-0 flex items-end z-10">
          <div className="w-full p-5 sm:p-8 pb-8 sm:pb-10">
            <div className="max-w-5xl mx-auto">
              {/* Category + verified row */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="flex items-center gap-2 mb-4">
                <span className="text-xs font-bold px-3 py-1 rounded-full tracking-wide uppercase" style={{ background: 'rgba(230,57,70,0.9)', color: '#fff' }}>{catInfo.icon} {catInfo.label}</span>
                {venue.verified && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full" style={{ background: 'rgba(42,157,143,0.9)', color: '#fff' }}>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                    Verificado
                  </span>
                )}
              </motion.div>

              {/* Name + logo row */}
              <div className="flex items-end gap-5 sm:gap-6">
                {/* Logo */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.7, rotate: -5 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                  className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl overflow-hidden flex-shrink-0"
                  style={{ border: '3px solid rgba(255,255,255,0.25)', boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(230,57,70,0.15)' }}
                >
                  {venue.logo && !logoError ? (
                    <Image src={venue.logo} alt={venue.name} fill sizes="112px" className="object-cover" onError={() => setLogoError(true)} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl sm:text-4xl font-black bg-white/10 backdrop-blur-sm text-white">{venue.name.charAt(0)}</div>
                  )}
                </motion.div>

                {/* Title block */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.5 }} className="flex-1 min-w-0 text-white">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.1] mb-2 drop-shadow-lg">{venue.name}</h1>
                  {venue.shortDescription && (
                    <p className="text-sm sm:text-base opacity-85 line-clamp-2 mb-3 max-w-lg leading-relaxed">{venue.shortDescription}</p>
                  )}
                  <div className="flex items-center gap-3 flex-wrap">
                    {venue.address && (
                      <span className="flex items-center gap-1.5 text-xs sm:text-sm opacity-75 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        <span className="truncate max-w-[200px] sm:max-w-none">{venue.address}</span>
                      </span>
                    )}
                    {venue.rating !== undefined && venue.rating > 0 && (
                      <span className="flex items-center gap-1 text-xs sm:text-sm font-bold bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                        <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                        {venue.rating.toFixed(1)}
                        <span className="opacity-60 font-normal">({venue.reviewCount})</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs sm:text-sm bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {formatCount(venue.followerCount || 0)} seguidores
                    </span>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ═══ STATS BAR ═══ */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="max-w-5xl mx-auto px-4 sm:px-6 -mt-6 sm:-mt-8 relative z-20">
        <div className="rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-2 sm:gap-4 flex-wrap shadow-theme-lg" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-4 sm:gap-8">
            {/* Rating */}
            {venue.rating !== undefined && venue.rating > 0 && (
              <div className="flex items-center gap-2.5">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-xl sm:text-2xl font-black" style={{ background: 'rgba(230, 57, 70, 0.1)', color: '#e63946' }}>
                  {venue.rating.toFixed(1)}
                </div>
                <div>
                  <StarDisplay rating={venue.rating} size="sm" />
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{venue.reviewCount || 0} resenas</p>
                </div>
              </div>
            )}

            <div className="hidden sm:flex items-center gap-6">
              <div className="text-center">
                <p className="text-lg font-bold" style={{ color: 'var(--fg)' }}>{venue.eventsCount || events.length}</p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Eventos</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold" style={{ color: 'var(--fg)' }}>{formatCount(venue.followerCount || 0)}</p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Seguidores</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <FollowButton venueSlug={venue.slug} venueName={venue.name} initialFollowing={isFollowing} initialCount={venue.followerCount || 0} />
            {activeSocials.length > 0 && (
              <div className="hidden sm:flex items-center gap-1.5">
                {activeSocials.map((s) => (
                  <a key={s.key} href={s.href(s.value!)} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }} aria-label={s.label}>{s.icon}</a>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Mobile stats (visible on small screens) */}
      <div className="sm:hidden max-w-5xl mx-auto px-4 mt-3">
        <div className="flex items-center justify-around py-3 rounded-xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="text-center">
            <p className="text-base font-bold" style={{ color: 'var(--fg)' }}>{venue.eventsCount || events.length}</p>
            <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Eventos</p>
          </div>
          <div className="w-px h-8" style={{ background: 'var(--border)' }} />
          <div className="text-center">
            <p className="text-base font-bold" style={{ color: 'var(--fg)' }}>{formatCount(venue.followerCount || 0)}</p>
            <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Seguidores</p>
          </div>
          <div className="w-px h-8" style={{ background: 'var(--border)' }} />
          <div className="text-center">
            <p className="text-base font-bold" style={{ color: 'var(--fg)' }}>{upcomingEvents.length}</p>
            <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Proximos</p>
          </div>
        </div>
        {/* Mobile social */}
        {activeSocials.length > 0 && (
          <div className="flex items-center justify-center gap-2 mt-3">
            {activeSocials.map((s) => (
              <a key={s.key} href={s.href(s.value!)} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center transition-all" style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }} aria-label={s.label}>{s.icon}</a>
            ))}
          </div>
        )}
      </div>

      {/* ═══ TABS ═══ */}
      <div className="sticky top-16 z-30 mt-6" style={{ background: 'var(--nav-bg)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex gap-0 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative flex items-center gap-1.5 px-4 sm:px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors shrink-0"
                style={{ color: activeTab === tab.id ? '#e63946' : 'var(--text-tertiary)' }}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full" style={activeTab === tab.id ? { background: 'rgba(230,57,70,0.1)', color: '#e63946' } : { background: 'var(--card)', color: 'var(--text-tertiary)' }}>
                    {tab.count}
                  </span>
                )}
                {activeTab === tab.id && (
                  <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#e63946] rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ TAB CONTENT ═══ */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-6 pb-20">
        <AnimatePresence mode="wait">
          {/* ── EVENTOS ── */}
          {activeTab === 'eventos' && (
            <motion.div key="eventos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
              {/* Quick stats */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  {upcomingEvents.length} proximos
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: 'var(--card)', color: 'var(--text-tertiary)' }}>
                  {pastEvents.length} pasados
                </div>
              </div>

              {/* Filter pills */}
              <div className="flex items-center gap-2 mb-6">
                {(['proximos', 'pasados', 'todos'] as EventFilter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setEventFilter(f)}
                    className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                    style={eventFilter === f ? { background: '#e63946', color: '#fff' } : { background: 'var(--card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                  >
                    {f === 'proximos' ? 'Proximos' : f === 'pasados' ? 'Pasados' : 'Todos'}
                  </button>
                ))}
              </div>

              {filteredEvents.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <span className="text-5xl block mb-4">{eventFilter === 'pasados' ? '📋' : '🎭'}</span>
                  <p className="text-lg font-semibold" style={{ color: 'var(--fg)' }}>
                    {eventFilter === 'proximos' ? 'No hay eventos proximos' : eventFilter === 'pasados' ? 'No hay eventos pasados' : 'No hay eventos'}
                  </p>
                  <p className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>Sigue a {venue.name} para enterarte de nuevos eventos</p>
                </motion.div>
              ) : (
                <motion.div layout className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {filteredEvents.map((event, i) => (
                    <motion.div key={event.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.04 }}>
                      <EventCard event={event} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── SOBRE ── */}
          {activeTab === 'sobre' && (
            <motion.div key="sobre" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }} className="space-y-6">
              {/* Description */}
              <div className="rounded-2xl p-6 sm:p-8" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--fg)' }}>Acerca de {venue.name}</h2>
                {venue.description ? (
                  <div className="text-sm sm:text-base leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-secondary)' }}>{venue.description}</div>
                ) : (
                  <p style={{ color: 'var(--text-tertiary)' }}>Sin descripcion disponible.</p>
                )}
              </div>

              {/* Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Eventos realizados', value: events.length, icon: '🎭' },
                  { label: 'Seguidores', value: formatCount(venue.followerCount || 0), icon: '👥' },
                  { label: 'Rating promedio', value: venue.rating?.toFixed(1) || 'N/A', icon: '⭐' },
                  { label: 'Categoria', value: catInfo.label, icon: catInfo.icon },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl p-4 text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                    <span className="text-2xl block mb-1">{item.icon}</span>
                    <p className="text-lg font-bold" style={{ color: 'var(--fg)' }}>{item.value}</p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{item.label}</p>
                  </div>
                ))}
              </div>

              {/* Contact */}
              {(venue.phone || venue.email || venue.website) && (
                <div className="rounded-2xl p-6 sm:p-8" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--fg)' }}>Contacto</h2>
                  <div className="space-y-3">
                    {venue.phone && (
                      <a href={`tel:${venue.phone}`} className="flex items-center gap-3 text-sm transition-colors hover:text-[#e63946]" style={{ color: 'var(--text-secondary)' }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--card)' }}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        </div>
                        {venue.phone}
                      </a>
                    )}
                    {venue.email && (
                      <a href={`mailto:${venue.email}`} className="flex items-center gap-3 text-sm transition-colors hover:text-[#e63946]" style={{ color: 'var(--text-secondary)' }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--card)' }}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        </div>
                        {venue.email}
                      </a>
                    )}
                    {venue.website && (
                      <a href={venue.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm transition-colors hover:text-[#e63946]" style={{ color: 'var(--text-secondary)' }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--card)' }}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                        </div>
                        {venue.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      </a>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── RESENAS ── */}
          {activeTab === 'resenas' && (
            <motion.div key="resenas" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
              {venue.rating && venue.rating > 0 ? (
                <div className="space-y-6">
                  {/* Rating summary */}
                  <div className="rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 sm:gap-10" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <div className="text-center">
                      <p className="text-5xl sm:text-6xl font-black" style={{ color: 'var(--fg)' }}>{venue.rating.toFixed(1)}</p>
                      <StarDisplay rating={venue.rating} size="lg" />
                      <p className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>{venue.reviewCount || 0} resenas</p>
                    </div>
                    <div className="flex-1 w-full space-y-2">
                      {ratingDist.map((d) => (
                        <div key={d.star} className="flex items-center gap-2">
                          <span className="text-sm font-medium w-6 text-right" style={{ color: 'var(--text-secondary)' }}>{d.star}</span>
                          <svg className="w-4 h-4 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                          <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--card)' }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${d.pct}%` }}
                              transition={{ duration: 0.8, delay: 0.2 }}
                              className="h-full rounded-full"
                              style={{ background: d.star >= 4 ? '#22c55e' : d.star >= 3 ? '#eab308' : '#ef4444' }}
                            />
                          </div>
                          <span className="text-xs w-8 text-right" style={{ color: 'var(--text-tertiary)' }}>{d.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Placeholder reviews */}
                  <div className="space-y-4">
                    {[
                      { name: 'Maria G.', rating: 5, text: 'Increible experiencia. El lugar es hermoso y la atencion excelente.', date: '15 mar 2026' },
                      { name: 'Carlos R.', rating: 4, text: 'Muy buen venue, los eventos siempre son de calidad. Repetiria sin duda.', date: '10 mar 2026' },
                      { name: 'Ana P.', rating: 5, text: 'El mejor lugar para disfrutar eventos en la ciudad. 100% recomendado.', date: '5 mar 2026' },
                    ].map((review, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="rounded-2xl p-5"
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'rgba(230,57,70,0.1)', color: '#e63946' }}>
                              {review.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>{review.name}</p>
                              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{review.date}</p>
                            </div>
                          </div>
                          <StarDisplay rating={review.rating} size="sm" />
                        </div>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{review.text}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <span className="text-5xl block mb-4">💬</span>
                  <p className="text-lg font-semibold" style={{ color: 'var(--fg)' }}>Aun no hay resenas</p>
                  <p className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>Se el primero en dejar tu opinion</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ── UBICACION ── */}
          {activeTab === 'ubicacion' && (
            <motion.div key="ubicacion" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
              <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="p-6 sm:p-8">
                  <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--fg)' }}>Ubicacion</h2>
                  {venue.address && (
                    <p className="text-sm mb-4 flex items-start gap-2" style={{ color: 'var(--text-secondary)' }}>
                      <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {venue.address}
                    </p>
                  )}

                  {venue.lat && venue.lng ? (
                    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                      <iframe
                        src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${venue.lat},${venue.lng}&zoom=16`}
                        width="100%"
                        height="350"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title={`Mapa de ${venue.name}`}
                      />
                    </div>
                  ) : venue.address ? (
                    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                      <iframe
                        src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(venue.address)}`}
                        width="100%"
                        height="350"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title={`Mapa de ${venue.name}`}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[200px] rounded-xl" style={{ background: 'var(--card)' }}>
                      <p style={{ color: 'var(--text-tertiary)' }}>Ubicacion no disponible</p>
                    </div>
                  )}

                  {((venue.lat && venue.lng) || venue.address) && (
                    <a
                      href={venue.lat && venue.lng ? `https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lng}` : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(venue.address!)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                      style={{ background: '#e63946', color: '#fff' }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                      Como llegar
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
