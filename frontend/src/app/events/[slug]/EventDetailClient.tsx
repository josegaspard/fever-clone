'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Event, addFavorite, removeFavorite } from '@/lib/api';
import EventCarousel from '@/components/EventCarousel';
import StarRating from '@/components/StarRating';
import ReviewSection from '@/components/ReviewSection';
import AddToPlanButton from '@/components/AddToPlanButton';
import ShareButton from '@/components/ShareButton';
import { useToast } from '@/components/Toast';

interface VenueInfo {
  slug: string;
  name: string;
  shortDescription?: string;
  logo?: string;
  verified: boolean;
  followerCount: number;
  category?: string;
}

interface Props {
  event: Event;
  related: Event[];
  venue?: VenueInfo | null;
}

export default function EventDetailClient({ event, related, venue }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isFav, setIsFav] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showFullGallery, setShowFullGallery] = useState(false);
  const [videoPaused, setVideoPaused] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const [mobileBarVisible, setMobileBarVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // ---- Formatters ----
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

  const formatDateShort = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return d;
    }
  };

  // ---- Scroll-triggered animations ----
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => {
              const next = new Set(Array.from(prev));
              next.add(entry.target.id);
              return next;
            });
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Mobile sticky bar delayed entrance
  useEffect(() => {
    const timer = setTimeout(() => setMobileBarVisible(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const setSectionRef = useCallback((id: string) => (el: HTMLElement | null) => {
    sectionRefs.current[id] = el;
  }, []);

  const sectionClass = (id: string) =>
    `transition-all duration-700 ${
      visibleSections.has(id)
        ? 'opacity-100 translate-y-0'
        : 'opacity-0 translate-y-6'
    }`;

  // ---- Favorites ----
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
      /* silent */
    } finally {
      setFavLoading(false);
    }
  };

  // ---- Computed values ----
  const discount =
    event.originalPrice && event.originalPrice > event.price
      ? Math.round(((event.originalPrice - event.price) / event.originalPrice) * 100)
      : null;
  const isFree = event.price === 0;
  const cs = event.currency === 'GBP' ? '\u00A3' : event.currency === 'EUR' ? '\u20AC' : '$';
  const cl = event.currency || 'MXN';
  const hasVideo = !!(event.videoUrl);

  // ---- Gallery (only real images) ----
  const gallery: string[] = [];
  if (event.image) gallery.push(event.image);
  if (Array.isArray(event.gallery)) {
    for (const img of event.gallery) {
      if (img && !gallery.includes(img)) gallery.push(img);
    }
  }

  // ---- Map ----
  const mapUrl =
    event.lat && event.lng
      ? `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${event.lat},${event.lng}&zoom=15&maptype=roadmap`
      : null;
  const mapsLink =
    event.lat && event.lng
      ? `https://www.google.com/maps/dir/?api=1&destination=${event.lat},${event.lng}`
      : null;

  // ---- Capacity ----
  const capacityPercent =
    event.capacity && event.soldCount
      ? Math.min(100, Math.round((event.soldCount / event.capacity) * 100))
      : null;
  const capacityColor =
    capacityPercent !== null
      ? capacityPercent > 80
        ? '#e63946'
        : capacityPercent > 50
        ? '#f4a261'
        : '#2a9d8f'
      : '#2a9d8f';

  // ---- Highlights ----
  const highlights: { icon: string; label: string; color: string }[] = [];
  if (event.featured) highlights.push({ icon: '\u2B50', label: 'Evento destacado', color: '#f4a261' });
  if (discount) highlights.push({ icon: '\uD83D\uDCB0', label: `${discount}% de descuento`, color: '#e63946' });
  if (capacityPercent !== null && capacityPercent > 70)
    highlights.push({
      icon: '\uD83D\uDD25',
      label: `Solo quedan ${100 - capacityPercent}% de lugares`,
      color: '#e76f51',
    });
  if (event.rating && event.rating >= 4.0)
    highlights.push({ icon: '\u2B50', label: `${event.rating.toFixed(1)} de calificacion`, color: '#2a9d8f' });
  if (isFree) highlights.push({ icon: '\uD83C\uDF89', label: 'Entrada gratuita', color: '#2a9d8f' });

  // ---- Description toggle ----
  const descriptionText = event.description || '';
  const needsTruncation = descriptionText.length > 300;
  const displayDescription = needsTruncation && !descExpanded ? descriptionText.slice(0, 300) + '...' : descriptionText;

  // ---- Video toggle ----
  const toggleVideo = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setVideoPaused(false);
    } else {
      videoRef.current.pause();
      setVideoPaused(true);
    }
  };

  // ---- Copy address ----
  const copyAddress = () => {
    if (event.address) {
      navigator.clipboard.writeText(event.address);
      showToast('Direccion copiada');
    }
  };

  return (
    <article className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* ======================================================= */}
      {/* BREADCRUMB                                               */}
      {/* ======================================================= */}
      <nav className="max-w-7xl mx-auto px-4 pt-4 pb-2">
        <ol
          className="flex items-center gap-1.5 text-xs overflow-x-auto"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <li>
            <Link href="/" className="hover:opacity-80 transition">
              Inicio
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/search" className="hover:opacity-80 transition">
              Eventos
            </Link>
          </li>
          {event.category && (
            <>
              <li>/</li>
              <li>
                <Link
                  href={`/search?category=${event.category.slug}`}
                  className="hover:opacity-80 transition"
                >
                  {event.category.name}
                </Link>
              </li>
            </>
          )}
          <li>/</li>
          <li className="truncate max-w-[180px]" style={{ color: 'var(--text-secondary)' }}>
            {event.title}
          </li>
        </ol>
      </nav>

      {/* ======================================================= */}
      {/* HERO - Always image, full width with overlay             */}
      {/* ======================================================= */}
      {gallery.length > 0 ? (
        gallery.length === 1 ? (
          /* ---------- SINGLE IMAGE HERO - Full width ---------- */
          <div className="relative w-full h-[40vh] sm:h-[50vh] md:h-[60vh] overflow-hidden mb-8 cursor-pointer group" onClick={() => setShowFullGallery(true)}>
            <Image src={gallery[0]} alt={event.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" priority sizes="100vw" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.1) 70%, rgba(0,0,0,0.25) 100%)' }} />
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.3) 100%)' }} />

            {/* Top actions */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
              <button onClick={toggleFav} disabled={favLoading} className="w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition hover:scale-110" style={{ background: isFav ? 'rgba(230,57,70,0.9)' : 'rgba(0,0,0,0.4)' }}>
                <svg className="w-5 h-5 text-white" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              </button>
              <ShareButton title={event.title} description={event.shortDescription || event.description.slice(0, 100)} />
            </div>

            {/* Badges */}
            <div className="absolute top-4 left-4 flex gap-2 z-10">
              {discount && <div className="bg-[#e63946] text-white text-sm font-bold px-3 py-1.5 rounded-lg shadow-lg">-{discount}%</div>}
              {isFree && <div className="bg-green-500 text-white text-sm font-extrabold px-4 py-1.5 rounded-lg shadow-lg">GRATIS</div>}
              {hasVideo && <div className="bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>Video</div>}
            </div>

            {/* Bottom info */}
            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 z-10">
              <div className="max-w-7xl mx-auto">
                {event.category && (
                  <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm px-3 py-1 rounded-full mb-3 backdrop-blur-sm" style={{ background: 'rgba(230,57,70,0.85)', color: 'white' }}>
                    {event.category.icon && <span>{event.category.icon}</span>}{event.category.name}
                  </span>
                )}
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white leading-[1.08] tracking-tight max-w-3xl mb-2">{event.title}</h1>
                <div className="flex flex-wrap items-center gap-2.5 text-white/80 text-sm">
                  {event.city && (<span className="flex items-center gap-1.5"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>{event.city.name}</span>)}
                  <span className="w-1 h-1 rounded-full bg-white/40" />
                  <span>{formatDateShort(event.date)}</span>
                  {event.time && (<><span className="w-1 h-1 rounded-full bg-white/40" /><span>{event.time}</span></>)}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ---------- MULTI IMAGE - Bento Grid ---------- */
          <div className="max-w-7xl mx-auto px-4 mb-8">
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl blur-2xl opacity-20" style={{ backgroundImage: `url(${gallery[0]})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
              <div className={`relative gap-2 rounded-2xl overflow-hidden ${gallery.length >= 4 ? 'grid grid-cols-4 grid-rows-2 h-[300px] md:h-[500px]' : 'grid grid-cols-2 h-[250px] md:h-[400px]'}`}>
                <div className={`${gallery.length >= 4 ? 'col-span-4 md:col-span-2 row-span-2' : 'col-span-1'} relative cursor-pointer group`} onClick={() => setShowFullGallery(true)}>
                  <Image src={gallery[0]} alt={event.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" priority sizes="(max-width: 768px) 100vw, 50vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  {discount && <div className="absolute top-4 left-4 bg-[#e63946] text-white text-sm font-bold px-3 py-1.5 rounded-lg shadow-lg">-{discount}%</div>}
                  {isFree && <div className="absolute top-4 left-4 bg-green-500 text-white text-sm font-extrabold px-4 py-1.5 rounded-lg shadow-lg">GRATIS</div>}
                </div>
                {gallery.slice(1, gallery.length >= 4 ? 5 : 2).map((img, i) => (
                  <div key={i} className={`${gallery.length < 4 ? 'col-span-1' : 'hidden md:block'} relative cursor-pointer group overflow-hidden`} onClick={() => { setSelectedImage(i + 1); setShowFullGallery(true); }}>
                    <Image src={img} alt={`${event.title} foto ${i + 2}`} fill className="object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" sizes="25vw" />
                    {i === (gallery.length >= 4 ? 3 : 0) && gallery.length > (gallery.length >= 4 ? 5 : 2) && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><span className="text-white font-bold text-lg">+{gallery.length - (gallery.length >= 4 ? 5 : 2)} fotos</span></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      ) : (
        /* ---------- NO IMAGES - gradient placeholder ---------- */
        <div className="relative w-full h-[30vh] md:h-[40vh] overflow-hidden mb-8" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
          <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-10">{event.category?.icon || '🎭'}</div>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }} />
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 z-10">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white leading-[1.08] tracking-tight max-w-3xl">{event.title}</h1>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* FULLSCREEN GALLERY MODAL                                 */}
      {/* ======================================================= */}
      {showFullGallery && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={() => setShowFullGallery(false)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white z-10 transition"
            onClick={() => setShowFullGallery(false)}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImage(Math.max(0, selectedImage - 1));
            }}
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImage(Math.min(gallery.length - 1, selectedImage + 1));
            }}
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={gallery[selectedImage]}
            alt=""
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {gallery.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(i);
                }}
                className={`w-2.5 h-2.5 rounded-full transition ${
                  i === selectedImage ? 'bg-white scale-125' : 'bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* ACTION BUTTONS                                           */}
      {/* ======================================================= */}
      {gallery.length > 1 && (
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-3 mb-6 -mt-2">
          <button
            onClick={toggleFav}
            disabled={favLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition ${
              isFav ? 'border-[#e63946] text-[#e63946] bg-[#e63946]/5' : ''
            }`}
            style={
              !isFav
                ? { borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--surface)' }
                : {}
            }
          >
            <svg className="w-4 h-4" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {isFav ? 'Guardado' : 'Guardar'}
          </button>
          <ShareButton title={event.title} description={event.shortDescription || event.description.slice(0, 100)} />
        </div>
      )}

      {/* ======================================================= */}
      {/* MAIN CONTENT: 2-column layout                            */}
      {/* ======================================================= */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* ============================================= */}
          {/* LEFT COLUMN - Event info (2/3)                */}
          {/* ============================================= */}
          <div className="lg:col-span-2 space-y-10">
            {/* ---- Title + Rating (shown when hero is bento grid, not single image which has title overlay) ---- */}
            {gallery.length > 1 && (
              <div className="space-y-4">
                {event.category && (
                  <Link
                    href={`/search?category=${event.category.slug}`}
                    className="inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full hover:border-[#e63946]/30 hover:text-[#e63946] transition"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                  >
                    {event.category.icon && <span>{event.category.icon}</span>}
                    {event.category.name}
                  </Link>
                )}
                <h1 className="text-3xl md:text-5xl font-black leading-[1.1] tracking-tight" style={{ color: 'var(--fg)' }}>
                  {event.title}
                </h1>
              </div>
            )}

            {/* Rating always visible */}
            {event.rating !== undefined && event.rating > 0 && (
              <div className="flex items-center gap-3">
                <StarRating rating={event.rating} count={event.reviewCount} size="md" />
                {event.soldCount !== undefined && event.soldCount > 0 && (
                  <span className="text-xs pl-3" style={{ color: 'var(--text-tertiary)', borderLeft: '1px solid var(--border)' }}>
                    {event.soldCount.toLocaleString()}+ asistentes
                  </span>
                )}
              </div>
            )}

            {/* ---- Quick Facts Bar ---- */}
            <div
              id="section-facts"
              ref={setSectionRef('section-facts')}
              className={sectionClass('section-facts')}
            >
              <div className="flex flex-wrap gap-3">
                {event.city && (
                  <Link
                    href={`/search?city=${event.city.slug}`}
                    className="flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-medium transition hover:scale-[1.02]"
                    style={{ background: 'rgba(42,157,143,0.1)', color: '#2a9d8f' }}
                  >
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {event.city.name}
                  </Link>
                )}
                <div
                  className="flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-medium"
                  style={{ background: 'rgba(230,57,70,0.08)', color: '#e63946' }}
                >
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <time dateTime={event.date}>{formatDateShort(event.date)}</time>
                </div>
                {event.time && (
                  <div
                    className="flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-medium"
                    style={{ background: 'rgba(244,162,97,0.12)', color: '#f4a261' }}
                  >
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {event.time}
                  </div>
                )}
                {event.duration && (
                  <div
                    className="flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-medium"
                    style={{ background: 'rgba(108,117,125,0.1)', color: 'var(--text-secondary)' }}
                  >
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {event.duration}
                  </div>
                )}
              </div>
            </div>

            {/* ---- Highlights ---- */}
            {highlights.length > 0 && (
              <div
                id="section-highlights"
                ref={setSectionRef('section-highlights')}
                className={sectionClass('section-highlights')}
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {highlights.map((h, i) => (
                    <div
                      key={i}
                      className="rounded-2xl px-4 py-3.5 text-center transition hover:scale-[1.03]"
                      style={{
                        background: `${h.color}10`,
                        border: `1px solid ${h.color}25`,
                      }}
                    >
                      <span className="text-2xl block mb-1">{h.icon}</span>
                      <span className="text-xs font-semibold" style={{ color: h.color }}>
                        {h.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ---- Sobre este evento ---- */}
            <section
              id="section-about"
              ref={setSectionRef('section-about')}
              className={sectionClass('section-about')}
            >
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--fg)' }}>
                Sobre este evento
              </h2>
              <div
                className="leading-relaxed whitespace-pre-line text-base"
                style={{ color: 'var(--text-secondary)' }}
              >
                {displayDescription}
              </div>
              {needsTruncation && (
                <button
                  onClick={() => setDescExpanded(!descExpanded)}
                  className="mt-3 text-sm font-semibold transition hover:opacity-80"
                  style={{ color: '#e63946' }}
                >
                  {descExpanded ? 'Leer menos' : 'Leer mas'}
                </button>
              )}
            </section>

            {/* ---- Video del evento ---- */}
            {hasVideo && (
              <section className="animate-fade-in">
                <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--fg)' }}>
                  Video del evento
                </h2>
                <div className="relative rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                  <video
                    ref={videoRef}
                    src={event.videoUrl}
                    controls
                    playsInline
                    poster={gallery[0] || undefined}
                    className="w-full aspect-video object-cover"
                    style={{ background: '#000' }}
                  />
                </div>
              </section>
            )}

            {/* ---- Ubicacion ---- */}
            {event.address && (
              <section
                id="section-location"
                ref={setSectionRef('section-location')}
                className={sectionClass('section-location')}
              >
                <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--fg)' }}>
                  Ubicacion
                </h2>
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  {mapUrl ? (
                    <div className="relative">
                      <iframe
                        src={mapUrl}
                        width="100%"
                        height="300"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title={`Mapa de ${event.title}`}
                      />
                    </div>
                  ) : (
                    <div
                      className="h-[200px] flex items-center justify-center"
                      style={{ background: 'var(--surface)' }}
                    >
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
                          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-sm" style={{ color: 'var(--fg)' }}>
                          {event.address}
                        </p>
                        {event.city && (
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                            {event.city.name}, {event.city.country}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={copyAddress}
                        className="shrink-0 p-2 rounded-lg transition hover:opacity-80"
                        style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                        title="Copiar direccion"
                      >
                        <svg
                          className="w-4 h-4"
                          style={{ color: 'var(--text-secondary)' }}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                    </div>
                    {mapsLink && (
                      <a
                        href={mapsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition hover:opacity-90"
                        style={{ background: 'rgba(230,57,70,0.08)', color: '#e63946' }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        Como llegar
                      </a>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* ============================================= */}
          {/* RIGHT COLUMN - Purchase card (1/3)            */}
          {/* ============================================= */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              {/* ---- Purchase Card ---- */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  boxShadow: '0 0 0 1px rgba(230,57,70,0.06), 0 8px 40px rgba(0,0,0,0.08)',
                }}
              >
                {/* Subtle gradient top accent */}
                <div
                  className="h-1"
                  style={{
                    background: 'linear-gradient(90deg, #e63946, #f4a261, #2a9d8f)',
                  }}
                />

                <div className="p-6 space-y-5">
                  {/* Price */}
                  <div>
                    {discount && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-[#e63946] text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                          Ahorra {discount}%
                        </span>
                        {event.originalPrice && event.originalPrice > event.price && (
                          <span className="line-through text-sm" style={{ color: 'var(--text-tertiary)' }}>
                            {cs}
                            {event.originalPrice.toFixed(0)}
                          </span>
                        )}
                      </div>
                    )}
                    {isFree ? (
                      <span className="text-4xl font-black text-green-600 dark:text-green-400">
                        GRATIS
                      </span>
                    ) : (
                      <p style={{ color: 'var(--fg)' }}>
                        <span className="text-4xl font-black">
                          {cs}
                          {event.price.toFixed(0)}
                        </span>
                        <span className="text-base font-medium ml-1" style={{ color: 'var(--text-tertiary)' }}>
                          {cl}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Capacity progress bar */}
                  {capacityPercent !== null && (
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {event.soldCount} vendidos
                        </span>
                        <span className="font-semibold" style={{ color: capacityColor }}>
                          {capacityPercent > 80 ? 'Ultimos lugares!' : `${100 - capacityPercent}% disponible`}
                        </span>
                      </div>
                      <div
                        className="w-full h-2.5 rounded-full overflow-hidden"
                        style={{ background: 'var(--border)' }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{
                            width: `${capacityPercent}%`,
                            background: `linear-gradient(90deg, #2a9d8f, ${capacityColor})`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Event summary rows */}
                  <div
                    className="space-y-3 text-sm pt-4"
                    style={{ borderTop: '1px solid var(--border)' }}
                  >
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2" style={{ color: 'var(--text-tertiary)' }}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        Fecha
                      </span>
                      <span className="font-medium text-right text-xs" style={{ color: 'var(--fg)' }}>
                        {formatDateShort(event.date)}
                      </span>
                    </div>
                    {event.time && (
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2" style={{ color: 'var(--text-tertiary)' }}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Hora
                        </span>
                        <span className="font-medium" style={{ color: 'var(--fg)' }}>
                          {event.time}
                        </span>
                      </div>
                    )}
                    {event.duration && (
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2" style={{ color: 'var(--text-tertiary)' }}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Duracion
                        </span>
                        <span className="font-medium" style={{ color: 'var(--fg)' }}>
                          {event.duration}
                        </span>
                      </div>
                    )}
                    {event.city && (
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2" style={{ color: 'var(--text-tertiary)' }}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          Ciudad
                        </span>
                        <span className="font-medium" style={{ color: 'var(--fg)' }}>
                          {event.city.name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* CTAs */}
                  <div className="space-y-3 pt-2">
                    {!isFree ? (
                      <button
                        onClick={() => {
                          if (!user) {
                            router.push('/auth/login');
                            return;
                          }
                          alert('Compra simulada. Agrega a tu Day para generar ticket.');
                        }}
                        className="w-full py-3.5 text-white font-bold text-lg rounded-xl transition shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]"
                        style={{
                          background: 'linear-gradient(135deg, #e63946, #c62d3a)',
                          boxShadow: '0 4px 20px rgba(230,57,70,0.3)',
                        }}
                      >
                        Comprar entrada
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (!user) {
                            router.push('/auth/login');
                            return;
                          }
                          alert('Reserva simulada. Agrega a tu Day para generar ticket.');
                        }}
                        className="w-full py-3.5 bg-green-500 hover:bg-green-600 text-white font-bold text-lg rounded-xl transition shadow-lg shadow-green-500/20 hover:scale-[1.01] active:scale-[0.99]"
                      >
                        Reservar gratis
                      </button>
                    )}
                    <AddToPlanButton event={event} variant="full" />
                  </div>
                </div>
              </div>

              {/* ---- Organizer Card ---- */}
              {venue ? (
                <Link
                  href={`/venues/${venue.slug}`}
                  className="block rounded-2xl p-5 transition-all duration-200 group/org"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(230, 57, 70, 0.3)';
                    e.currentTarget.style.boxShadow = 'var(--shadow)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 relative" style={{ background: 'var(--card)' }}>
                      {venue.logo ? (
                        <Image src={venue.logo} alt={venue.name} fill sizes="44px" className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#e63946] font-bold text-sm" style={{ background: 'rgba(230, 57, 70, 0.1)' }}>
                          {venue.name.charAt(0)}
                        </div>
                      )}
                      {venue.verified && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 bg-[#2a9d8f] rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate group-hover/org:text-[#e63946] transition-colors" style={{ color: 'var(--fg)' }}>
                        {venue.name}
                      </p>
                      <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                        {venue.verified && (
                          <span style={{ color: '#2a9d8f' }}>Organizador verificado</span>
                        )}
                        {venue.verified && venue.followerCount > 0 && <span>·</span>}
                        {venue.followerCount > 0 && (
                          <span>{venue.followerCount.toLocaleString()} seguidores</span>
                        )}
                      </p>
                    </div>
                    <svg className="w-4 h-4 flex-shrink-0 opacity-0 group-hover/org:opacity-100 transition-opacity" fill="none" stroke="var(--text-tertiary)" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ) : (
                <div
                  className="rounded-2xl p-5"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-[#e63946]/10 rounded-full flex items-center justify-center text-[#e63946] font-bold text-sm relative">
                      F
                      <div className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 bg-[#2a9d8f] rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>
                        Fever
                      </p>
                      <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                        <span style={{ color: '#2a9d8f' }}>Organizador verificado</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================= */}
        {/* REVIEWS SECTION                                          */}
        {/* ======================================================= */}
        <section
          id="section-reviews"
          ref={setSectionRef('section-reviews')}
          className={`mt-16 ${sectionClass('section-reviews')}`}
        >
          <div
            className="rounded-3xl p-6 md:p-10"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            {/* Average rating display */}
            {event.rating !== undefined && event.rating > 0 && (
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-8 pb-8" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center gap-4">
                  <span className="text-5xl font-black" style={{ color: 'var(--fg)' }}>
                    {event.rating.toFixed(1)}
                  </span>
                  <div>
                    <StarRating rating={event.rating} size="lg" />
                    <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
                      {event.reviewCount || 0} opiniones
                    </p>
                  </div>
                </div>
              </div>
            )}
            <ReviewSection
              eventId={event.id}
              averageRating={event.rating}
              reviewCount={event.reviewCount}
            />
          </div>
        </section>

        {/* ======================================================= */}
        {/* RELATED EVENTS                                           */}
        {/* ======================================================= */}
        {related.length > 0 && (
          <section
            id="section-related"
            ref={setSectionRef('section-related')}
            className={`mt-16 ${sectionClass('section-related')}`}
          >
            <EventCarousel
              title="Te puede interesar"
              events={related}
              viewAllHref={`/search?category=${event.category?.slug}`}
            />
            {event.category && (
              <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                Basado en tus intereses en {event.category.name}
              </p>
            )}
          </section>
        )}
      </div>

      {/* ======================================================= */}
      {/* MOBILE STICKY CTA BAR                                    */}
      {/* ======================================================= */}
      <div
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl px-4 py-3 flex items-center gap-3 transition-transform duration-500 ease-out ${
          mobileBarVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          background: 'var(--bg-opacity-95, var(--bg))',
          borderTop: '1px solid var(--border)',
          boxShadow: '0 -4px 30px rgba(0,0,0,0.1)',
        }}
      >
        {/* Event thumbnail */}
        {gallery[0] && (
          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 relative">
            <Image
              src={gallery[0]}
              alt={event.title}
              fill
              className="object-cover"
              sizes="40px"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p
            className="text-xs truncate font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            {event.title}
          </p>
          <p className="text-lg font-black leading-tight" style={{ color: 'var(--fg)' }}>
            {isFree ? 'GRATIS' : `${cs}${event.price.toFixed(0)} ${cl}`}
          </p>
        </div>
        <button
          onClick={() => {
            if (!user) {
              router.push('/auth/login');
              return;
            }
            alert('Agrega a tu Day para continuar.');
          }}
          className="px-6 py-3 text-sm text-white font-bold rounded-xl transition hover:scale-[1.02] active:scale-[0.98] shrink-0"
          style={{
            background: isFree ? '#2a9d8f' : 'linear-gradient(135deg, #e63946, #c62d3a)',
          }}
        >
          {isFree ? 'Reservar' : 'Comprar'}
        </button>
      </div>

      {/* Bottom spacer for mobile sticky bar */}
      <div className="lg:hidden h-20" />
    </article>
  );
}
