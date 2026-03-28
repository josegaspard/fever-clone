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
  const [showFullGallery, setShowFullGallery] = useState(false);

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return d; }
  };

  const toggleFav = async () => {
    if (!user) { router.push('/auth/login'); return; }
    if (favLoading) return;
    setFavLoading(true);
    try {
      if (isFav) { await removeFavorite(event.id); setIsFav(false); }
      else { await addFavorite(event.id); setIsFav(true); }
    } catch {} finally { setFavLoading(false); }
  };

  const discount = event.originalPrice && event.originalPrice > event.price
    ? Math.round(((event.originalPrice - event.price) / event.originalPrice) * 100) : null;
  const isFree = event.price === 0;
  const cs = event.currency === 'GBP' ? '£' : event.currency === 'EUR' ? '€' : '$';
  const cl = event.currency || 'MXN';

  // Gallery
  const gallery: string[] = [];
  if (event.image) gallery.push(event.image);
  const eventAny = event as unknown as Record<string, unknown>;
  if (Array.isArray(eventAny.gallery)) gallery.push(...(eventAny.gallery as string[]));
  // Add more variety images for demo
  if (gallery.length < 4 && event.image) {
    const seeds = ['concert', 'festival', 'art', 'night', 'city'];
    while (gallery.length < 5) {
      gallery.push(`https://images.unsplash.com/photo-${1500000000000 + gallery.length * 1000}?w=800&h=500&fit=crop&q=80`);
      if (gallery.length < 5) gallery.push(`https://picsum.photos/seed/${seeds[gallery.length % seeds.length]}/800/500`);
    }
  }

  const mapUrl = event.lat && event.lng
    ? `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${event.lat},${event.lng}&zoom=15&maptype=roadmap`
    : null;
  const mapsLink = event.lat && event.lng
    ? `https://www.google.com/maps/search/?api=1&query=${event.lat},${event.lng}` : null;

  // Capacity bar
  const capacityPercent = event.capacity && event.soldCount
    ? Math.min(100, Math.round((event.soldCount / event.capacity) * 100)) : null;

  return (
    <article>
      {/* Breadcrumb */}
      <nav className="max-w-7xl mx-auto px-4 pt-4 pb-2">
        <ol className="flex items-center gap-1.5 text-xs overflow-x-auto" style={{ color: 'var(--text-tertiary)' }}>
          <li><Link href="/" className="hover:opacity-80 transition">Inicio</Link></li>
          <li>/</li>
          <li><Link href="/search" className="hover:opacity-80 transition">Eventos</Link></li>
          {event.category && (<><li>/</li><li><Link href={`/search?category=${event.category.slug}`} className="hover:opacity-80 transition">{event.category.name}</Link></li></>)}
          <li>/</li>
          <li className="truncate max-w-[180px]" style={{ color: 'var(--text-secondary)' }}>{event.title}</li>
        </ol>
      </nav>

      {/* Gallery Hero - Bento Grid */}
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[300px] md:h-[460px] rounded-2xl overflow-hidden">
          {/* Main image */}
          <div
            className="col-span-4 md:col-span-2 row-span-2 relative cursor-pointer group"
            onClick={() => setShowFullGallery(true)}
          >
            <img
              src={gallery[0]}
              alt={event.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="eager"
              fetchPriority="high"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            {discount && (
              <div className="absolute top-4 left-4 bg-[#e63946] text-white text-sm font-bold px-3 py-1.5 rounded-lg shadow-lg">
                -{discount}%
              </div>
            )}
            {isFree && (
              <div className="absolute top-4 left-4 bg-green-500 text-white text-sm font-extrabold px-4 py-1.5 rounded-lg shadow-lg">
                GRATIS
              </div>
            )}
          </div>
          {/* Secondary images */}
          {gallery.slice(1, 5).map((img, i) => (
            <div
              key={i}
              className={`hidden md:block relative cursor-pointer group overflow-hidden ${i === 3 ? '' : ''}`}
              onClick={() => { setSelectedImage(i + 1); setShowFullGallery(true); }}
            >
              <img src={img} alt={`${event.title} foto ${i + 2}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
              {i === 3 && gallery.length > 5 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">+{gallery.length - 5} fotos</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Fullscreen gallery modal */}
      {showFullGallery && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center" onClick={() => setShowFullGallery(false)}>
          <button className="absolute top-4 right-4 text-white/80 hover:text-white z-10" onClick={() => setShowFullGallery(false)}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white" onClick={(e) => { e.stopPropagation(); setSelectedImage(Math.max(0, selectedImage - 1)); }}>
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white" onClick={(e) => { e.stopPropagation(); setSelectedImage(Math.min(gallery.length - 1, selectedImage + 1)); }}>
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
          <img src={gallery[selectedImage]} alt="" className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {gallery.map((_, i) => (
              <button key={i} onClick={(e) => { e.stopPropagation(); setSelectedImage(i); }} className={`w-2.5 h-2.5 rounded-full transition ${i === selectedImage ? 'bg-white' : 'bg-white/30'}`} />
            ))}
          </div>
        </div>
      )}

      {/* Action buttons - floating on mobile */}
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-3 mb-6 -mt-2">
        <button onClick={toggleFav} disabled={favLoading} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition ${isFav ? 'border-[#e63946] text-[#e63946] bg-[#e63946]/5' : ''}`} style={!isFav ? { borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--surface)' } : {}}>
          <svg className="w-4 h-4" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          {isFav ? 'Guardado' : 'Guardar'}
        </button>
        <button
          onClick={() => { if (navigator.share) navigator.share({ title: event.title, url: window.location.href }); else navigator.clipboard.writeText(window.location.href); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--surface)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
          Compartir
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Category + Title */}
            {event.category && (
              <Link href={`/search?category=${event.category.slug}`} className="inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full hover:border-[#e63946]/30 hover:text-[#e63946] transition" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                {event.category.icon && <span>{event.category.icon}</span>}
                {event.category.name}
              </Link>
            )}

            <h1 className="text-3xl md:text-5xl font-black leading-[1.1] tracking-tight">{event.title}</h1>

            {/* Rating */}
            {event.rating !== undefined && event.rating > 0 && (
              <div className="flex items-center gap-3">
                <StarRating rating={event.rating} count={event.reviewCount} size="md" />
                {event.soldCount !== undefined && event.soldCount > 0 && (
                  <span className="text-xs pl-3" style={{ color: 'var(--text-tertiary)', borderLeft: '1px solid var(--border)' }}>{event.soldCount.toLocaleString()}+ asistentes</span>
                )}
              </div>
            )}

            {/* Info pills */}
            <div className="flex flex-wrap gap-3">
              {event.city && (
                <Link href={`/search?city=${event.city.slug}`} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm transition" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                  <svg className="w-4 h-4 text-[#e63946]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {event.city.name}
                </Link>
              )}
              <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                <svg className="w-4 h-4 text-[#e63946]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <time dateTime={event.date}>{formatDate(event.date)}</time>
              </div>
              {event.time && (
                <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                  <svg className="w-4 h-4 text-[#e63946]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {event.time}
                </div>
              )}
              {event.duration && (
                <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                  <svg className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {event.duration}
                </div>
              )}
            </div>

            {/* Description */}
            <section>
              <h2 className="text-xl font-bold mb-4">Sobre este evento</h2>
              <div className="leading-relaxed whitespace-pre-line text-[15px]" style={{ color: 'var(--text-secondary)' }}>{event.description}</div>
            </section>

            {/* Map & Location */}
            {event.address && (
              <section>
                <h2 className="text-xl font-bold mb-4">Ubicación</h2>
                <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  {/* Embedded Map */}
                  {mapUrl ? (
                    <div className="map-container">
                      <iframe
                        src={mapUrl}
                        width="100%"
                        height="300"
                        style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title={`Mapa de ${event.title}`}
                      />
                    </div>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center" style={{ background: 'var(--surface)' }}>
                      <svg className="w-12 h-12" style={{ color: 'var(--text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                    </div>
                  )}
                  <div className="p-5">
                    <p className="font-medium text-sm mb-1" style={{ color: 'var(--fg)' }}>{event.address}</p>
                    {event.city && <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>{event.city.name}, {event.city.country}</p>}
                    {mapsLink && (
                      <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-[#e63946] hover:text-[#ff6b6b] transition font-medium">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        Abrir en Google Maps
                      </a>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              {/* Price Card */}
              <div className="rounded-2xl p-6 space-y-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                {/* Price */}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    {discount && <span className="bg-[#e63946] text-white text-xs font-bold px-2.5 py-1 rounded-lg">-{discount}%</span>}
                    {event.originalPrice && event.originalPrice > event.price && (
                      <span className="line-through text-sm" style={{ color: 'var(--text-tertiary)' }}>{cs}{event.originalPrice.toFixed(0)}</span>
                    )}
                  </div>
                  {isFree ? (
                    <span className="text-3xl font-black text-green-400">GRATIS</span>
                  ) : (
                    <p className="text-3xl font-black" style={{ color: 'var(--fg)' }}>{cs}{event.price.toFixed(0)} <span className="text-base font-medium" style={{ color: 'var(--text-tertiary)' }}>{cl}</span></p>
                  )}
                </div>

                {/* Capacity indicator */}
                {capacityPercent !== null && (
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span style={{ color: 'var(--text-secondary)' }}>{event.soldCount} vendidos</span>
                      <span className={`font-semibold ${capacityPercent > 80 ? 'text-[#e63946]' : ''}`} style={capacityPercent <= 80 ? { color: 'var(--text-secondary)' } : {}}>
                        {capacityPercent > 80 ? '¡Últimos lugares!' : `${100 - capacityPercent}% disponible`}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${capacityPercent > 80 ? 'bg-[#e63946]' : 'bg-green-500'}`}
                        style={{ width: `${capacityPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Info */}
                <div className="space-y-3 text-sm pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="flex justify-between"><span style={{ color: 'var(--text-tertiary)' }}>Fecha</span><span className="font-medium text-right text-xs" style={{ color: 'var(--fg)' }}>{formatDate(event.date)}</span></div>
                  {event.time && <div className="flex justify-between"><span style={{ color: 'var(--text-tertiary)' }}>Hora</span><span className="font-medium" style={{ color: 'var(--fg)' }}>{event.time}</span></div>}
                  {event.duration && <div className="flex justify-between"><span style={{ color: 'var(--text-tertiary)' }}>Duración</span><span className="font-medium" style={{ color: 'var(--fg)' }}>{event.duration}</span></div>}
                  {event.city && <div className="flex justify-between"><span style={{ color: 'var(--text-tertiary)' }}>Ciudad</span><span className="font-medium" style={{ color: 'var(--fg)' }}>{event.city.name}</span></div>}
                </div>

                {/* CTAs */}
                <div className="space-y-3 pt-2">
                  <AddToPlanButton event={event} variant="full" />
                  {!isFree ? (
                    <button
                      onClick={() => { if (!user) { router.push('/auth/login'); return; } alert('Compra simulada. Agrega a tu Day para generar ticket.'); }}
                      className="w-full py-3.5 btn-primary text-lg"
                    >
                      Comprar - {cs}{event.price.toFixed(0)} {cl}
                    </button>
                  ) : (
                    <button
                      onClick={() => { if (!user) { router.push('/auth/login'); return; } alert('Reserva simulada. Agrega a tu Day para generar ticket.'); }}
                      className="w-full py-3.5 bg-green-500 hover:bg-green-600 text-white font-bold text-lg rounded-xl transition shadow-lg shadow-green-500/20"
                    >
                      Reservar gratis
                    </button>
                  )}
                </div>
              </div>

              {/* Organizer card */}
              <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#e63946]/10 rounded-full flex items-center justify-center text-[#e63946] font-bold text-sm">F</div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>Fever</p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Organizador verificado</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <section className="mt-16">
          <ReviewSection eventId={event.id} averageRating={event.rating} reviewCount={event.reviewCount} />
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-16">
            <EventCarousel title="Te puede interesar" events={related} viewAllHref={`/search?category=${event.category?.slug}`} />
          </section>
        )}
      </div>

      {/* Mobile sticky CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-lg px-4 py-3 flex items-center gap-3" style={{ background: 'var(--bg-opacity-95, var(--bg))', borderTop: '1px solid var(--border)' }}>
        <div className="flex-1">
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{isFree ? 'Evento gratuito' : 'Desde'}</p>
          <p className="text-lg font-black" style={{ color: 'var(--fg)' }}>{isFree ? 'GRATIS' : `${cs}${event.price.toFixed(0)} ${cl}`}</p>
        </div>
        <button
          onClick={() => { if (!user) { router.push('/auth/login'); return; } alert('Agrega a tu Day para continuar.'); }}
          className="btn-primary px-8 py-3 text-sm"
        >
          {isFree ? 'Reservar' : 'Comprar'}
        </button>
      </div>
    </article>
  );
}
