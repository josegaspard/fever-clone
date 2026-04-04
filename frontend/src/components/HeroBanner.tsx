'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

const CITIES = [
  { slug: 'cdmx', name: 'CDMX', country: 'Mexico', lat: 19.4326, lng: -99.1332, emoji: '🇲🇽' },
  { slug: 'madrid', name: 'Madrid', country: 'España', lat: 40.4168, lng: -3.7038, emoji: '🇪🇸' },
  { slug: 'barcelona', name: 'Barcelona', country: 'España', lat: 41.3874, lng: 2.1686, emoji: '🇪🇸' },
  { slug: 'new-york', name: 'New York', country: 'USA', lat: 40.7128, lng: -74.006, emoji: '🇺🇸' },
  { slug: 'london', name: 'London', country: 'UK', lat: 51.5074, lng: -0.1278, emoji: '🇬🇧' },
  { slug: 'paris', name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522, emoji: '🇫🇷' },
];

const HERO_VIDEOS = [
  'https://cdn.pixabay.com/video/2024/03/07/203040-921765610_large.mp4',
  'https://cdn.pixabay.com/video/2020/07/30/45839-445788498_large.mp4',
];

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1920&q=80',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1920&q=80',
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1920&q=80',
];

export default function HeroBanner() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mounted, setMounted] = useState(false);
  const [detectedCity, setDetectedCity] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('ctxplorer-city');
    if (saved) { setDetectedCity(saved); return; }
    if ('geolocation' in navigator) {
      setDetecting(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          let nearest = CITIES[0].slug, minDist = Infinity;
          for (const c of CITIES) { const d = Math.sqrt((latitude - c.lat) ** 2 + (longitude - c.lng) ** 2); if (d < minDist) { minDist = d; nearest = c.slug; } }
          setDetectedCity(nearest);
          localStorage.setItem('ctxplorer-city', nearest);
          setDetecting(false);
        },
        () => { setDetecting(false); setShowCityPicker(true); },
        { timeout: 5000, maximumAge: 60000 }
      );
    }
  }, []);

  // Rotate background images
  useEffect(() => {
    const t = setInterval(() => setBgIndex(i => (i + 1) % HERO_IMAGES.length), 6000);
    return () => clearInterval(t);
  }, []);

  const handleCitySelect = (slug: string) => { setDetectedCity(slug); localStorage.setItem('ctxplorer-city', slug); setShowCityPicker(false); router.push(`/${slug}`); };
  const selectedCity = CITIES.find(c => c.slug === detectedCity);

  return (
    <section className="relative overflow-hidden flex flex-col items-center justify-center min-h-[100svh]" role="banner">
      {/* ═══ VIDEO BACKGROUND (primary) ═══ */}
      <video
        ref={videoRef}
        src={HERO_VIDEOS[0]}
        autoPlay
        muted
        loop
        playsInline
        onLoadedData={() => setVideoLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* ═══ IMAGE FALLBACK (shows while video loads + crossfade) ═══ */}
      {HERO_IMAGES.map((img, i) => (
        <div
          key={img}
          className="absolute inset-0 transition-opacity duration-[2000ms]"
          style={{ opacity: !videoLoaded && bgIndex === i ? 1 : 0 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt={`Evento destacado ${i + 1}`} className="w-full h-full object-cover" />
        </div>
      ))}

      {/* ═══ CINEMATIC OVERLAYS ═══ */}
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.5) 70%, rgba(0,0,0,0.85) 100%)' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(230,57,70,0.08) 0%, transparent 60%)' }} />
      <div className="absolute bottom-0 left-0 right-0 h-40" style={{ background: 'linear-gradient(to top, var(--bg), transparent)' }} />

      {/* ═══ FLOATING ACCENT PARTICLES ═══ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-2 h-2 rounded-full bg-[#e63946]/30 animate-pulse" style={{ animationDelay: '0s', animationDuration: '3s' }} />
        <div className="absolute top-[40%] right-[15%] w-1.5 h-1.5 rounded-full bg-[#e63946]/20 animate-pulse" style={{ animationDelay: '1s', animationDuration: '4s' }} />
        <div className="absolute top-[60%] left-[60%] w-1 h-1 rounded-full bg-white/20 animate-pulse" style={{ animationDelay: '2s', animationDuration: '5s' }} />
        <div className="absolute bottom-[30%] left-[25%] w-2.5 h-2.5 rounded-full bg-[#e63946]/15 animate-pulse" style={{ animationDelay: '0.5s', animationDuration: '3.5s' }} />
      </div>

      {/* ═══ MAIN CONTENT — centered vertically and horizontally ═══ */}
      <div className={`relative z-10 w-full max-w-3xl mx-auto px-5 text-center py-20 transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>

        {/* City pill — small, top */}
        <div className={`mb-8 transition-all duration-700 delay-75 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {detecting ? (
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-full px-4 py-2">
              <div className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              <span className="text-xs text-white/70">Detectando ubicacion...</span>
            </div>
          ) : selectedCity ? (
            <button onClick={() => setShowCityPicker(!showCityPicker)} className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 hover:bg-white/20 transition text-sm">
              <span>📍</span>
              <span className="text-white font-medium">{selectedCity.name}</span>
              <svg className={`w-3 h-3 text-white/50 transition-transform ${showCityPicker ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
          ) : (
            <button onClick={() => setShowCityPicker(true)} className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-white/20 transition">
              <span>📍</span>
              Elige tu ciudad
            </button>
          )}
          {showCityPicker && (
            <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-2 animate-slide-up max-w-md mx-auto">
              {CITIES.map(c => (
                <button key={c.slug} onClick={() => handleCitySelect(c.slug)} className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border backdrop-blur-md transition-all hover:scale-105 ${detectedCity === c.slug ? 'bg-[#e63946]/20 border-[#e63946]/50' : 'bg-white/10 border-white/10 hover:bg-white/20'}`}>
                  <span className="text-base">{c.emoji}</span>
                  <span className="text-[10px] text-white font-semibold">{c.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Headline — big, clean, centered */}
        <h1 className={`text-5xl sm:text-6xl md:text-8xl font-black tracking-[-0.03em] text-white leading-[0.95] transition-all duration-700 delay-150 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          Arma tu<br /><span className="gradient-text">Day perfecto</span>
        </h1>

        {/* Subtitle — clear, one idea */}
        <p className={`text-white/50 text-base sm:text-lg mt-5 mb-8 max-w-md mx-auto leading-relaxed transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          Cena, concierto, bar, actividades — todo en un solo plan.
          <span className="text-white/70 font-medium"> Con ruta y transporte incluido.</span>
        </p>

        {/* Day mode pills — 3 on mobile, all on desktop */}
        <div className={`flex flex-wrap justify-center gap-2 mb-8 transition-all duration-700 delay-250 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          {[
            { emoji: '🧑', label: 'Solo' },
            { emoji: '💑', label: 'Pareja' },
            { emoji: '👯', label: 'Amigos' },
            { emoji: '👨‍👩‍👧‍👦', label: 'Familia' },
          ].map(m => (
            <button
              key={m.label}
              onClick={() => router.push('/build-day')}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-sm border border-white/15 text-white hover:bg-white/20 hover:scale-105 transition-all"
            >
              <span>{m.emoji}</span> {m.label}
            </button>
          ))}
        </div>

        {/* CTA — single prominent button */}
        <div className={`flex flex-col items-center gap-3 mb-10 transition-all duration-700 delay-[350ms] ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <button
            onClick={() => router.push('/build-day')}
            className="px-10 py-4 bg-[#e63946] hover:bg-[#d32836] text-white font-bold text-base rounded-full transition-all hover:scale-[1.04] shadow-2xl shadow-[#e63946]/40 active:scale-[0.98]"
          >
            Arma tu Day
          </button>
          <button
            onClick={() => router.push(selectedCity ? `/${selectedCity.slug}` : '/search')}
            className="text-white/40 text-sm font-medium hover:text-white/70 transition"
          >
            o explora eventos →
          </button>
        </div>

        {/* Features — tiny, subtle */}
        <div className={`flex flex-wrap justify-center gap-x-5 gap-y-1 transition-all duration-700 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          {[
            { icon: '🗺️', label: 'Rutas' },
            { icon: '🚇', label: 'Transporte' },
            { icon: '⏱️', label: 'Tiempos' },
            { icon: '🚐', label: 'Te llevamos' },
          ].map(f => (
            <span key={f.label} className="text-[10px] text-white/30 font-medium">
              {f.icon} {f.label}
            </span>
          ))}
        </div>
      </div>

      {/* Scroll hint */}
      <div className={`absolute bottom-5 left-1/2 -translate-x-1/2 z-10 transition-all duration-700 delay-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        <button onClick={() => window.scrollTo({ top: window.innerHeight - 80, behavior: 'smooth' })} className="w-8 h-12 border border-white/15 rounded-full flex items-start justify-center pt-2 hover:border-white/30 transition" aria-label="Scroll">
          <div className="w-1 h-2.5 bg-white/40 rounded-full animate-bounce" />
        </button>
      </div>
    </section>
  );
}
