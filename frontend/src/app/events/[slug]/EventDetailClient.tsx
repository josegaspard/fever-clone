'use client';

import { useState } from 'react';
import Link from 'next/link';
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
  const [selectedImage, setSelectedImage] = useState(0);

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
  const currencySymbol = event.currency === 'MXN' ? '$' : event.currency === 'USD' ? '$' : event.currency === 'GBP' ? '£' : '€';
  const currencyLabel = event.currency || 'MXN';

  // Gallery images
  const gallery: string[] = [];
  if (event.image) gallery.push(event.image);
  const eventAny = event as unknown as Record<string, unknown>;
  if (Array.isArray(eventAny.gallery)) {
    gallery.push(...(eventAny.gallery as string[]));
  }

  return (
    <article itemScope itemType="https://schema.org/Event">
      {/* Breadcrumb nav */}
      <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto px-4 pt-4 pb-2">
        <ol className="flex items-center gap-2 text-xs text-gray-500" itemScope itemType="https://schema.org/BreadcrumbList">
          <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
            <Link href="/" className="hover:text-white transition" itemProp="item">
              <span itemProp="name">Inicio</span>
            </Link>
            <meta itemProp="position" content="1" />
          </li>
          <li className="text-gray-600">/</li>
          <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
            <Link href="/search" className="hover:text-white transition" itemProp="item">
              <span itemProp="name">Eventos</span>
            </Link>
            <meta itemProp="position" content="2" />
          </li>
          {event.category && (
            <>
              <li className="text-gray-600">/</li>
              <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                <Link href={`/search?category=${event.category.slug}`} className="hover:text-white transition" itemProp="item">
                  <span itemProp="name">{event.category.name}</span>
                </Link>
                <meta itemProp="position" content="3" />
              </li>
            </>
          )}
          <li className="text-gray-600">/</li>
          <li className="text-gray-300 truncate max-w-[200px]">{event.title}</li>
        </ol>
      </nav>

      {/* Hero image with gallery */}
      <div className="relative h-[320px] md:h-[480px] overflow-hidden">
        {gallery.length > 0 ? (
          <img
            src={gallery[selectedImage] || gallery[0]}
            alt={`${event.title} - ${event.category?.name || 'Evento'} en ${event.city?.name || ''}`}
            className="w-full h-full object-cover transition-opacity duration-300"
            itemProp="image"
            loading="eager"
            fetchPriority="high"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#e63946]/20 to-[#0a0a0a]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/30 to-transparent" />

        {/* Back button */}
        <button
          onClick={() => router.back()}
          aria-label="Volver atrás"
          className="absolute top-4 left-4 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Share button */}
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: event.title, url: window.location.href });
            } else {
              navigator.clipboard.writeText(window.location.href);
            }
          }}
          aria-label="Compartir evento"
          className="absolute top-4 right-16 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </button>

        {/* Favorite button */}
        <button
          onClick={toggleFav}
          disabled={favLoading}
          aria-label={isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition"
        >
          <svg className={`w-5 h-5 ${isFav ? 'text-[#e63946] fill-[#e63946]' : ''}`} fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* GRATIS badge overlay */}
        {isFree && (
          <div className="absolute top-4 left-16 bg-green-500 text-white text-sm font-extrabold px-4 py-2 rounded-full shadow-lg">
            GRATIS
          </div>
        )}

        {/* Discount badge */}
        {discount && (
          <div className="absolute top-4 left-16 bg-[#e63946] text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg">
            -{discount}%
          </div>
        )}

        {/* Gallery thumbnails */}
        {gallery.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {gallery.slice(0, 5).map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition ${selectedImage === i ? 'border-[#e63946]' : 'border-white/30 hover:border-white/60'}`}
              >
                <img src={img} alt={`Vista ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Category badge */}
            {event.category && (
              <Link
                href={`/search?category=${event.category.slug}`}
                className="inline-block bg-[#e63946]/10 text-[#e63946] text-xs font-semibold px-3 py-1 rounded-full hover:bg-[#e63946]/20 transition"
              >
                {event.category.icon && <span className="mr-1">{event.category.icon}</span>}
                {event.category.name}
              </Link>
            )}

            <h1 className="text-3xl md:text-4xl font-extrabold leading-tight" itemProp="name">
              {event.title}
            </h1>

            {/* Rating */}
            {event.rating !== undefined && event.rating > 0 && (
              <div itemProp="aggregateRating" itemScope itemType="https://schema.org/AggregateRating">
                <StarRating rating={event.rating} count={event.reviewCount} size="md" />
                <meta itemProp="ratingValue" content={String(event.rating)} />
                <meta itemProp="reviewCount" content={String(event.reviewCount || 0)} />
              </div>
            )}

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
              {event.city && (
                <Link href={`/search?city=${event.city.slug}`} className="flex items-center gap-1.5 hover:text-white transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span itemProp="location">{event.city.name}</span>
                </Link>
              )}
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <time itemProp="startDate" dateTime={event.date}>{formatDate(event.date)}</time>
              </span>
              {event.time && (
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {event.time}
                </span>
              )}
              {event.duration && (
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {event.duration}
                </span>
              )}
              {event.soldCount !== undefined && event.soldCount > 0 && (
                <span className="flex items-center gap-1.5 text-[#e63946]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {event.soldCount}+ asistentes
                </span>
              )}
            </div>

            {/* Description */}
            <section aria-label="Descripción del evento">
              <h2 className="text-lg font-bold mb-3">Sobre este evento</h2>
              <div className="prose prose-invert max-w-none" itemProp="description">
                <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                  {event.description}
                </p>
              </div>
            </section>

            {/* Address & Map */}
            {event.address && (
              <section aria-label="Ubicación del evento">
                <h2 className="text-lg font-bold mb-3">Ubicación</h2>
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
                  <p className="text-gray-300 text-sm mb-2" itemProp="address">{event.address}</p>
                  {event.city && <p className="text-gray-500 text-xs">{event.city.name}, {event.city.country}</p>}
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
              </section>
            )}
          </div>

          {/* Sidebar - Sticky purchase card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 space-y-5 shadow-2xl">
              {/* Price */}
              <div itemProp="offers" itemScope itemType="https://schema.org/Offer">
                <meta itemProp="url" content={`https://fever-clone.vercel.app/events/${event.slug}`} />
                <meta itemProp="priceCurrency" content={currencyLabel} />
                <meta itemProp="price" content={String(event.price)} />
                <meta itemProp="availability" content="https://schema.org/InStock" />
                <div className="flex items-center gap-3 mb-1">
                  {discount && (
                    <span className="bg-[#e63946] text-white text-xs font-bold px-2 py-0.5 rounded">
                      -{discount}%
                    </span>
                  )}
                  {event.originalPrice && event.originalPrice > event.price && (
                    <span className="text-gray-500 line-through text-sm">
                      {currencySymbol}{event.originalPrice.toFixed(0)} {currencyLabel}
                    </span>
                  )}
                </div>
                {isFree ? (
                  <span className="inline-block text-2xl font-extrabold text-green-400 bg-green-400/10 px-4 py-2 rounded-xl">
                    GRATIS
                  </span>
                ) : (
                  <p className="text-3xl font-extrabold text-white">
                    {currencySymbol}{event.price.toFixed(0)} <span className="text-lg font-medium text-gray-400">{currencyLabel}</span>
                  </p>
                )}
              </div>

              {/* Key info */}
              <div className="space-y-3 text-sm text-gray-400 border-t border-[#2a2a2a] pt-4">
                <div className="flex justify-between">
                  <span>Fecha</span>
                  <span className="text-white font-medium">{formatDate(event.date)}</span>
                </div>
                {event.time && (
                  <div className="flex justify-between">
                    <span>Hora</span>
                    <span className="text-white font-medium">{event.time}</span>
                  </div>
                )}
                {event.duration && (
                  <div className="flex justify-between">
                    <span>Duración</span>
                    <span className="text-white font-medium">{event.duration}</span>
                  </div>
                )}
                {event.city && (
                  <div className="flex justify-between">
                    <span>Ciudad</span>
                    <span className="text-white font-medium">{event.city.name}</span>
                  </div>
                )}
                {event.capacity && (
                  <div className="flex justify-between">
                    <span>Aforo</span>
                    <span className="text-white font-medium">{event.capacity} personas</span>
                  </div>
                )}
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3 pt-2">
                <AddToPlanButton event={event} variant="full" />

                {!isFree && (
                  <button
                    onClick={() => {
                      if (!user) {
                        router.push('/auth/login');
                        return;
                      }
                      alert('Funcionalidad de compra simulada. El ticket se genera al agregar a tu Day.');
                    }}
                    className="w-full py-3.5 bg-[#e63946] hover:bg-[#c62d3a] rounded-xl text-white font-bold text-lg transition-all hover:shadow-lg hover:shadow-[#e63946]/20"
                  >
                    Comprar entradas - {currencySymbol}{event.price.toFixed(0)} {currencyLabel}
                  </button>
                )}

                {isFree && (
                  <button
                    onClick={() => {
                      if (!user) {
                        router.push('/auth/login');
                        return;
                      }
                      alert('Reserva simulada. El ticket se genera al agregar a tu Day.');
                    }}
                    className="w-full py-3.5 bg-green-500 hover:bg-green-600 rounded-xl text-white font-bold text-lg transition-all hover:shadow-lg hover:shadow-green-500/20"
                  >
                    Reservar gratis
                  </button>
                )}

                {/* Favorite */}
                <button
                  onClick={toggleFav}
                  disabled={favLoading}
                  className={`w-full py-2.5 border rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 ${
                    isFav
                      ? 'border-[#e63946] text-[#e63946] bg-[#e63946]/5'
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
        </div>

        {/* Reviews */}
        <section className="mt-16" aria-label="Reseñas del evento">
          <ReviewSection
            eventId={event.id}
            averageRating={event.rating}
            reviewCount={event.reviewCount}
          />
        </section>

        {/* Related events */}
        {related.length > 0 && (
          <section className="mt-16" aria-label="Eventos relacionados">
            <EventCarousel
              title="Eventos relacionados"
              events={related}
              viewAllHref={`/search?category=${event.category?.slug}`}
            />
          </section>
        )}
      </div>
    </article>
  );
}
