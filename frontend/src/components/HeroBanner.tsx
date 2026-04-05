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

  useEffect(() => {
    const t = setInterval(() => setBgIndex(i => (i + 1) % HERO_IMAGES.length), 6000);
    return () => clearInterval(t);
  }, []);

  const handleCitySelect = (slug: string) => {
    setDetectedCity(slug);
    localStorage.setItem('ctxplorer-city', slug);
    setShowCityPicker(false);
    router.push(`/${slug}`);
  };

  const selectedCity = CITIES.find(c => c.slug === detectedCity);

  return (
    <section className="relative overflow-hidden min-h-[100svh]" role="banner">
      {/* ── Background video ── */}
      <video
        ref={videoRef}
        src="https://cdn.pixabay.com/video/2024/03/07/203040-921765610_large.mp4"
        autoPlay muted loop playsInline
        onLoadedData={() => setVideoLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* ── Image fallback ── */}
      {HERO_IMAGES.map((img, i) => (
        <div key={img} className="absolute inset-0 transition-opacity duration-[2000ms]" style={{ opacity: !videoLoaded && bgIndex === i ? 1 : 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt={`Experiencia ${i + 1}`} className="w-full h-full object-cover" />
        </div>
      ))}

      {/* ── Overlay — darker, cinematic ── */}
      <div className="absolute inset-0 bg-black/50" />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%)' }} />
      <div className="absolute bottom-0 left-0 right-0 h-32" style={{ background: 'linear-gradient(to top, var(--bg), transparent)' }} />

      {/* ── Content ── */}
      <div className="relative z-10 min-h-[100svh] flex flex-col">

        {/* Top spacer — pushes content to center */}
        <div className="flex-1" />

        {/* Main content block */}
        <div className={`px-6 sm:px-8 max-w-5xl mx-auto w-full transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>

          {/* City indicator */}
          <div className="mb-6">
            {detecting ? (
              <span className="inline-flex items-center gap-2 text-white/50 text-sm">
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Detectando...
              </span>
            ) : selectedCity ? (
              <button onClick={() => setShowCityPicker(!showCityPicker)} className="inline-flex items-center gap-1.5 text-white/60 text-sm hover:text-white/90 transition">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" /></svg>
                {selectedCity.name}, {selectedCity.country}
                <svg className={`w-3 h-3 transition-transform ${showCityPicker ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
            ) : (
              <button onClick={() => setShowCityPicker(true)} className="inline-flex items-center gap-1.5 text-[#e63946] text-sm font-medium hover:opacity-80 transition">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" /></svg>
                Selecciona tu ciudad
              </button>
            )}

            {showCityPicker && (
              <div className="flex flex-wrap gap-2 mt-3 animate-slide-up">
                {CITIES.map(c => (
                  <button
                    key={c.slug}
                    onClick={() => handleCitySelect(c.slug)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      detectedCity === c.slug
                        ? 'bg-[#e63946] text-white'
                        : 'bg-white/10 text-white/80 hover:bg-white/20'
                    }`}
                  >
                    {c.emoji} {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Headline */}
          <h1 className="text-[2.75rem] sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-[0.95] tracking-[-0.02em]">
            Arma tu
            <br />
            <span className="text-[#e63946]">Day perfecto.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-white/50 text-lg sm:text-xl mt-5 max-w-lg leading-snug">
            Combinamos actividades para ti.
            <span className="text-white/80"> Ruta, transporte y todo resuelto.</span>
          </p>

          {/* Mode pills */}
          <div className="flex gap-2 mt-8 overflow-x-auto scrollbar-hide -mx-1 px-1">
            {[
              { emoji: '🧑', label: 'Solo', sub: '1 persona' },
              { emoji: '💑', label: 'Pareja', sub: '2 personas' },
              { emoji: '👯', label: 'Amigos', sub: '3-8 personas' },
              { emoji: '👨‍👩‍👧‍👦', label: 'Familia', sub: 'con ninos' },
            ].map(m => (
              <button
                key={m.label}
                onClick={() => router.push('/build-day')}
                className="shrink-0 flex flex-col items-center gap-1 w-20 sm:w-24 py-3 rounded-2xl bg-white/[0.07] backdrop-blur-sm border border-white/[0.08] text-white hover:bg-white/[0.14] hover:border-white/[0.15] transition-all active:scale-95"
              >
                <span className="text-xl sm:text-2xl">{m.emoji}</span>
                <span className="text-[11px] sm:text-xs font-semibold">{m.label}</span>
              </button>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-4 mt-10">
            <button
              onClick={() => router.push('/build-day')}
              className="group px-8 sm:px-10 py-4 sm:py-[18px] bg-[#e63946] text-white font-bold text-[15px] sm:text-base rounded-2xl transition-all hover:bg-[#d32836] active:scale-[0.97] shadow-lg shadow-[#e63946]/25"
            >
              <span className="flex items-center gap-2">
                Comenzar
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </span>
            </button>
            <button
              onClick={() => router.push(selectedCity ? `/${selectedCity.slug}` : '/search')}
              className="text-white/40 text-sm hover:text-white/70 transition hidden sm:block"
            >
              Explorar eventos
            </button>
          </div>
        </div>

        {/* Bottom spacer + features */}
        <div className="flex-1 flex flex-col justify-end pb-8 sm:pb-10 px-6 sm:px-8 max-w-5xl mx-auto w-full">
          <div className={`flex items-center gap-6 transition-all duration-1000 delay-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
            {[
              { icon: '🗺️', text: 'Rutas completas' },
              { icon: '🚇', text: 'Transporte' },
              { icon: '⏱️', text: 'Tiempos reales' },
              { icon: '🚐', text: 'Te llevamos' },
            ].map(f => (
              <span key={f.text} className="text-[10px] sm:text-[11px] text-white/25 font-medium hidden sm:inline-flex items-center gap-1">
                {f.icon} {f.text}
              </span>
            ))}
            {/* Mobile: just show 2 */}
            <span className="text-[10px] text-white/25 font-medium sm:hidden">🗺️ Rutas · 🚇 Transporte · 🚐 Te llevamos</span>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-10 transition-all duration-1000 delay-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        <button
          onClick={() => window.scrollTo({ top: window.innerHeight - 80, behavior: 'smooth' })}
          className="w-7 h-10 border border-white/10 rounded-full flex items-start justify-center pt-1.5"
          aria-label="Scroll"
        >
          <div className="w-0.5 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDuration: '2s' }} />
        </button>
      </div>
    </section>
  );
}
