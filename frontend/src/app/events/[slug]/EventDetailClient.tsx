'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Event, addFavorite, removeFavorite } from '@/lib/api';
import EventCarousel from '@/components/EventCarousel';
import StarRating from '@/components/StarRating';
import ReviewSection from '@/components/ReviewSection';
import AddToPlanButton from '@/components/AddToPlanButton';

interface Props {
  event: Event;
  related: Event[];
}

export default function EventDetailClient({ event, related }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const [isFav, setIsFav] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return d;
    }
  };

  const toggleFav = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (favLoading) return;
    setFavLoading(true);
    try {
      if (isFav) {
        await removeFavorite(event.id);
        setIsFav(false);
      } else {
        await addFavorite(event.id);
        setIsFav(true);
      }
    } catch {
      // silent
    } finally {
      setFavLoading(false);
    }
  };

  const discount =
    event.originalPrice && event.originalPrice > event.price
      ? Math.round(
          ((event.originalPrice - event.price) / event.originalPrice) * 100
        )
      : null;

  const isFree = event.price === 0;

  return (
    <div>
      {/* Hero image */}
      <div className="relative h-[300px] md:h-[450px] overflow-hidden">
        {event.image ? (
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#e63946]/20 to-[#0a0a0a]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* GRATIS badge overlay */}
        {isFree && (
          <div className="absolute top-4 right-4 bg-green-500 text-white text-sm font-extrabold px-4 py-2 rounded-full shadow-lg">
            GRATIS
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Category */}
            {event.category && (
              <span className="inline-block bg-[#e63946]/10 text-[#e63946] text-xs font-semibold px-3 py-1 rounded-full">
                {event.category.name}
              </span>
            )}

            <h1 className="text-3xl md:text-4xl font-extrabold">
              {event.title}
            </h1>

            {/* Rating */}
            {event.rating !== undefined && event.rating > 0 && (
              <StarRating rating={event.rating} count={event.reviewCount} size="md" />
            )}

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
              {event.city && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {event.city.name}
                </span>
              )}
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(event.date)}
              </span>
              {event.time && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {event.time}
                </span>
              )}
              {event.duration && (
                <span>Duracion: {event.duration}</span>
              )}
            </div>

            {/* Description */}
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>

            {/* Address */}
            {event.address && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Ubicacion</h3>
                <p className="text-gray-400 text-sm">{event.address}</p>
                {event.lat && event.lng && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${event.lat},${event.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-sm text-[#e63946] hover:underline"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    Ver en Google Maps
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 space-y-4">
              {/* Price */}
              <div>
                <div className="flex items-center gap-3 mb-1">
                  {discount && (
                    <span className="bg-[#e63946] text-white text-xs font-bold px-2 py-0.5 rounded">
                      -{discount}%
                    </span>
                  )}
                  {event.originalPrice &&
                    event.originalPrice > event.price && (
                      <span className="text-gray-500 line-through text-sm">
                        ${event.originalPrice.toFixed(2)} MXN
                      </span>
                    )}
                </div>
                {isFree ? (
                  <div>
                    <span className="inline-block text-2xl font-extrabold text-green-400 bg-green-400/10 px-4 py-2 rounded-xl">
                      GRATIS
                    </span>
                  </div>
                ) : (
                  <p className="text-3xl font-extrabold text-white">
                    ${event.price.toFixed(2)} MXN
                  </p>
                )}
              </div>

              {/* Info lines */}
              <div className="space-y-3 text-sm text-gray-400 border-t border-[#2a2a2a] pt-4">
                <div className="flex justify-between">
                  <span>Fecha</span>
                  <span className="text-white">{formatDate(event.date)}</span>
                </div>
                {event.time && (
                  <div className="flex justify-between">
                    <span>Hora</span>
                    <span className="text-white">{event.time}</span>
                  </div>
                )}
                {event.duration && (
                  <div className="flex justify-between">
                    <span>Duracion</span>
                    <span className="text-white">{event.duration}</span>
                  </div>
                )}
                {event.city && (
                  <div className="flex justify-between">
                    <span>Ciudad</span>
                    <span className="text-white">{event.city.name}</span>
                  </div>
                )}
                {event.capacity && (
                  <div className="flex justify-between">
                    <span>Aforo</span>
                    <span className="text-white">{event.capacity}</span>
                  </div>
                )}
              </div>

              {/* Add to Day - PROMINENT */}
              <AddToPlanButton event={event} variant="full" />

              {/* Buy tickets for paid events */}
              {!isFree && (
                <button
                  onClick={() => {
                    if (!user) {
                      router.push('/auth/login');
                      return;
                    }
                    alert('Funcionalidad de compra simulada. El ticket se genera al agregar a tu Day.');
                  }}
                  className="w-full py-3 bg-[#e63946] hover:bg-[#c62d3a] rounded-xl text-white font-bold text-lg transition"
                >
                  Comprar entradas - ${event.price.toFixed(2)} MXN
                </button>
              )}

              {/* Favorite */}
              <button
                onClick={toggleFav}
                disabled={favLoading}
                className={`w-full py-2.5 border rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 ${
                  isFav
                    ? 'border-[#e63946] text-[#e63946]'
                    : 'border-[#2a2a2a] text-gray-400 hover:border-gray-400'
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill={isFav ? 'currentColor' : 'none'}
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
                {isFav ? 'Guardado en favoritos' : 'Agregar a favoritos'}
              </button>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-16">
          <ReviewSection
            eventId={event.id}
            averageRating={event.rating}
            reviewCount={event.reviewCount}
          />
        </div>

        {/* Related events */}
        {related.length > 0 && (
          <div className="mt-16">
            <EventCarousel
              title="Eventos relacionados"
              events={related}
              viewAllHref={`/search?category=${event.category?.slug}`}
            />
          </div>
        )}
      </div>
    </div>
  );
}
