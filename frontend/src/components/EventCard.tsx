'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { Event, addFavorite, removeFavorite } from '@/lib/api';
import StarRating from './StarRating';
import AddToPlanButton from './AddToPlanButton';

interface EventCardProps {
  event: Event;
  isFavorite?: boolean;
  onFavoriteChange?: () => void;
}

export default function EventCard({
  event,
  isFavorite = false,
  onFavoriteChange,
}: EventCardProps) {
  const { user } = useAuth();
  const [fav, setFav] = useState(isFavorite);
  const [favLoading, setFavLoading] = useState(false);

  const discount =
    event.originalPrice && event.originalPrice > event.price
      ? Math.round(
          ((event.originalPrice - event.price) / event.originalPrice) * 100
        )
      : null;

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return d;
    }
  };

  const toggleFav = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      window.location.href = '/auth/login';
      return;
    }
    if (favLoading) return;
    setFavLoading(true);
    try {
      if (fav) {
        await removeFavorite(event.id);
        setFav(false);
      } else {
        await addFavorite(event.id);
        setFav(true);
      }
      onFavoriteChange?.();
    } catch {
      // silent fail
    } finally {
      setFavLoading(false);
    }
  };

  const currencySymbol = event.currency === 'MXN' ? '$' : event.currency === 'USD' ? '$' : event.currency === 'GBP' ? '£' : '€';
  const currencyLabel = event.currency || 'EUR';

  return (
    <Link href={`/events/${event.slug}`} className="group block" aria-label={`${event.title} - ${event.city?.name || ''} - ${event.price === 0 ? 'Gratis' : `${currencySymbol}${event.price}`}`}>
      <article className="event-card-premium rounded-xl overflow-hidden border transition-all duration-300" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        {/* Image / Video */}
        <div className="relative aspect-[3/4] overflow-hidden">
          {event.videoUrl ? (
            <div className="w-full h-full relative">
              <video
                src={event.videoUrl}
                muted
                loop
                playsInline
                preload="none"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play()}
                onMouseLeave={(e) => { const v = e.currentTarget as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
                poster={event.image}
              />
              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-60 group-hover:opacity-0 transition-opacity duration-300">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </div>
              </div>
              {/* Video badge */}
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 z-10">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                Video
              </div>
            </div>
          ) : event.image ? (
            <Image
              src={event.image}
              alt={`${event.title} - ${event.category?.name || 'Evento'} en ${event.city?.name || ''}`}
              fill
              sizes="(max-width: 640px) 160px, (max-width: 768px) 200px, 220px"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, var(--surface-2), var(--card))' }}>
              <svg
                className="w-12 h-12"
                style={{ color: 'var(--text-tertiary)' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}

          {/* Discount badge - more prominent */}
          {discount && (
            <div className="absolute top-3 left-3 text-white text-xs font-bold px-2.5 py-1 rounded-lg z-10" style={{ background: 'linear-gradient(135deg, #e63946, #ff6b6b)' }}>
              &minus;{discount}%
            </div>
          )}

          {/* GRATIS badge - prominent green gradient */}
          {event.price === 0 && !discount && (
            <div className="absolute top-3 left-3 text-white text-xs font-bold px-3 py-1 rounded-lg z-10 uppercase tracking-wide" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
              Gratis
            </div>
          )}

          {/* Category pill */}
          {event.category && (
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
              {event.category.name}
            </div>
          )}

          {/* Add to plan */}
          <div className="absolute top-3 right-12 z-10">
            <AddToPlanButton event={event} variant="icon" />
          </div>

          {/* Favorite heart */}
          <button
            onClick={toggleFav}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center transition hover:bg-black/60"
            aria-label={fav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          >
            <svg
              className={`w-4 h-4 transition ${
                fav ? 'text-[#e63946] fill-[#e63946]' : 'text-white'
              }`}
              fill={fav ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-3">
          <h3 className="text-sm font-semibold line-clamp-2 leading-snug mb-1" style={{ color: 'var(--fg)' }}>
            {event.title}
          </h3>
          <p className="text-xs mb-2 flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
            {/* Location pin icon */}
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{event.city?.name}</span>
            <span>&middot;</span>
            <span>{formatDate(event.date)}</span>
          </p>
          {/* Price display - more prominent */}
          <div className="flex items-center gap-2">
            {event.originalPrice && event.originalPrice > event.price && (
              <span className="text-xs line-through font-medium" style={{ color: 'var(--text-tertiary)' }}>
                {currencySymbol}{event.originalPrice.toFixed(0)}
              </span>
            )}
            <span className="text-sm font-bold" style={{ color: 'var(--fg)' }}>
              {event.price === 0 ? (
                <span className="text-green-600 dark:text-green-400 font-extrabold">Gratis</span>
              ) : (
                <>
                  <span className={discount ? 'text-[#e63946]' : ''}>{currencySymbol}{event.price.toFixed(0)}</span>
                  <span className="text-xs font-normal ml-1" style={{ color: 'var(--text-tertiary)' }}>{currencyLabel}</span>
                </>
              )}
            </span>
            {discount && (
              <span className="text-[10px] font-bold text-[#e63946] bg-[#e63946]/10 px-1.5 py-0.5 rounded">
                -{discount}%
              </span>
            )}
          </div>
          {event.rating !== undefined && event.rating > 0 && (
            <div className="mt-1">
              <StarRating rating={event.rating} count={event.reviewCount} size="sm" />
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}

// Skeleton loader
export function EventCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden border animate-pulse" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
      <div className="aspect-[3/4]" style={{ background: 'var(--surface-2)' }} />
      <div className="p-3 space-y-2">
        <div className="h-4 rounded w-3/4" style={{ background: 'var(--surface-2)' }} />
        <div className="h-3 rounded w-1/2" style={{ background: 'var(--surface-2)' }} />
        <div className="h-4 rounded w-1/4" style={{ background: 'var(--surface-2)' }} />
      </div>
    </div>
  );
}
