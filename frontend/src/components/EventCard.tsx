'use client';

import { useState } from 'react';
import Link from 'next/link';
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
      <article className="card-hover bg-[#1a1a1a] rounded-xl overflow-hidden border border-[#2a2a2a] transition-all duration-300 group-hover:border-[#e63946]/30">
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden">
          {event.image ? (
            <img
              src={event.image}
              alt={`${event.title} - ${event.category?.name || 'Evento'} en ${event.city?.name || ''}`}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] flex items-center justify-center">
              <svg
                className="w-12 h-12 text-gray-600"
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

          {/* Discount badge */}
          {discount && (
            <div className="absolute top-3 left-3 bg-[#e63946] text-white text-xs font-bold px-2 py-1 rounded-lg">
              &minus;{discount}%
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
          <h3 className="text-sm font-semibold text-white line-clamp-2 leading-snug mb-1">
            {event.title}
          </h3>
          <p className="text-xs text-gray-400 mb-2">
            {event.city?.name} &middot; {formatDate(event.date)}
          </p>
          <div className="flex items-center gap-2">
            {event.originalPrice && event.originalPrice > event.price && (
              <span className="text-xs text-gray-500 line-through">
                {currencySymbol}{event.originalPrice.toFixed(0)}
              </span>
            )}
            <span className="text-sm font-bold text-white">
              {event.price === 0 ? (
                <span className="text-green-400">Gratis</span>
              ) : (
                `${currencySymbol}${event.price.toFixed(0)} ${currencyLabel}`
              )}
            </span>
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
    <div className="bg-[#1a1a1a] rounded-xl overflow-hidden border border-[#2a2a2a] animate-pulse">
      <div className="aspect-[3/4] bg-[#2a2a2a]" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-[#2a2a2a] rounded w-3/4" />
        <div className="h-3 bg-[#2a2a2a] rounded w-1/2" />
        <div className="h-4 bg-[#2a2a2a] rounded w-1/4" />
      </div>
    </div>
  );
}
