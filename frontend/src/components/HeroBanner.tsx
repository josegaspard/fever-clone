'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import SearchBar from './SearchBar';

const CITIES = [
  { slug: 'cdmx', name: 'CDMX', country: 'Mexico', lat: 19.4326, lng: -99.1332, emoji: '🇲🇽' },
  { slug: 'madrid', name: 'Madrid', country: 'España', lat: 40.4168, lng: -3.7038, emoji: '🇪🇸' },
  { slug: 'barcelona', name: 'Barcelona', country: 'España', lat: 41.3874, lng: 2.1686, emoji: '🇪🇸' },
  { slug: 'new-york', name: 'New York', country: 'USA', lat: 40.7128, lng: -74.006, emoji: '🇺🇸' },
  { slug: 'london', name: 'London', country: 'UK', lat: 51.5074, lng: -0.1278, emoji: '🇬🇧' },
  { slug: 'paris', name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522, emoji: '🇫🇷' },
];

export default function HeroBanner() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [detectedCity, setDetectedCity] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Auto-detect location on mount
    const saved = localStorage.getItem('fever-city');
    if (saved) {
      setDetectedCity(saved);
      return;
    }

    if ('geolocation' in navigator) {
      setDetecting(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          let nearest = CITIES[0].slug;
          let minDist = Infinity;
          for (const c of CITIES) {
            const d = Math.sqrt((latitude - c.lat) ** 2 + (longitude - c.lng) ** 2);
            if (d < minDist) { minDist = d; nearest = c.slug; }
          }
          setDetectedCity(nearest);
          localStorage.setItem('fever-city', nearest);
          setDetecting(false);
        },
        () => {
          setDetecting(false);
          setShowCityPicker(true);
        },
        { timeout: 5000, maximumAge: 60000 }
      );
    }
  }, []);

  const handleCitySelect = (slug: string) => {
    setDetectedCity(slug);
    localStorage.setItem('fever-city', slug);
    setShowCityPicker(false);
    router.push(`/${slug}`);
  };

  const handleSearch = (q: string) => {
    if (q.trim()) {
      const cityParam = detectedCity ? `&city=${detectedCity}` : '';
      router.push(`/search?q=${encodeURIComponent(q.trim())}${cityParam}`);
    }
  };

  const selectedCity = CITIES.find(c => c.slug === detectedCity);

  return (
    <section className="relative overflow-hidden flex flex-col justify-end min-h-[100svh]" role="banner">
      {/* Background image with overlay */}
      <Image
        src="https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1920&q=75"
        alt="Eventos en vivo"
        fill
        priority
        sizes="100vw"
        className="object-cover"
        quality={75}
      />

      {/* Overlays */}
      <div className="absolute inset-0 bg-black/50" />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.8) 100%)' }} />
      <div className="absolute bottom-0 left-0 right-0 h-32" style={{ background: 'linear-gradient(to top, var(--bg), transparent)' }} />

      {/* Main content - pushed to bottom */}
      <div className={`relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 pb-24 pt-32 transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>

        {/* Location bar */}
        <div className={`mb-8 transition-all duration-600 delay-75 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {detecting ? (
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-full px-4 py-2">
              <div className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              <span className="text-xs text-white/70">Detectando tu ubicacion...</span>
            </div>
          ) : selectedCity ? (
            <button
              onClick={() => setShowCityPicker(!showCityPicker)}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 hover:bg-white/20 transition group"
            >
              <svg className="w-4 h-4 text-[#e63946]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <span className="text-sm text-white font-medium">{selectedCity.name}, {selectedCity.country}</span>
              <svg className={`w-3 h-3 text-white/50 transition-transform ${showCityPicker ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
          ) : (
            <button
              onClick={() => setShowCityPicker(true)}
              className="inline-flex items-center gap-2 bg-[#e63946] text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-[#d32836] transition shadow-lg shadow-[#e63946]/30"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Elige tu ciudad
            </button>
          )}

          {/* City picker dropdown */}
          {showCityPicker && (
            <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-2 animate-slide-up">
              {CITIES.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => handleCitySelect(c.slug)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-2xl border backdrop-blur-md transition-all hover:scale-105 ${
                    detectedCity === c.slug
                      ? 'bg-[#e63946]/20 border-[#e63946]/50'
                      : 'bg-white/10 border-white/10 hover:bg-white/20'
                  }`}
                >
                  <span className="text-lg">{c.emoji}</span>
                  <span className="text-xs text-white font-semibold">{c.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Headline */}
        <h1
          className={`text-[clamp(2.2rem,7vw,4.5rem)] font-black leading-[0.95] tracking-tight text-white mb-5 transition-all duration-600 delay-150 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
          {selectedCity
            ? <>Lo mejor de <span className="gradient-text">{selectedCity.name}</span></>
            : <>Descubre algo <span className="gradient-text">increible</span> hoy</>
          }
        </h1>

        {/* Subtitle */}
        <p className={`text-white/60 text-base md:text-lg mb-8 max-w-lg leading-relaxed transition-all duration-600 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          Conciertos, gastronomia, arte, festivales y experiencias unicas.
          Compra tu entrada en segundos.
        </p>

        {/* Search */}
        <div className={`max-w-xl mb-6 transition-all duration-600 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <SearchBar onSearch={handleSearch} large placeholder={selectedCity ? `Buscar en ${selectedCity.name}...` : 'Buscar eventos...'} showSuggestions={false} />
        </div>

        {/* Action buttons */}
        <div className={`flex flex-wrap items-center gap-3 transition-all duration-600 delay-[400ms] ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <button
            onClick={() => router.push(selectedCity ? `/${selectedCity.slug}` : '/search')}
            className="px-7 py-3 bg-[#e63946] hover:bg-[#d32836] text-white font-bold text-sm rounded-full transition-all hover:scale-[1.03] shadow-lg shadow-[#e63946]/25"
          >
            {selectedCity ? `Explorar ${selectedCity.name}` : 'Explorar eventos'}
          </button>
          <button
            onClick={() => router.push('/build-day')}
            className="px-7 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold text-sm rounded-full transition-all hover:bg-white/20 hover:scale-[1.03]"
          >
            Arma tu Day
          </button>
        </div>

        {/* Stats */}
        <div className={`flex items-center gap-6 md:gap-10 mt-10 transition-all duration-600 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          {[
            { value: '50+', label: 'Eventos' },
            { value: '6', label: 'Ciudades' },
            { value: '4.8', label: 'Rating' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-xl md:text-2xl font-black text-white">{s.value}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll hint */}
      <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-10 transition-all duration-600 delay-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        <button
          onClick={() => window.scrollTo({ top: window.innerHeight - 80, behavior: 'smooth' })}
          className="w-8 h-12 border border-white/15 rounded-full flex items-start justify-center pt-2 hover:border-white/30 transition"
          aria-label="Scroll"
        >
          <div className="w-1 h-2.5 bg-white/40 rounded-full animate-bounce" />
        </button>
      </div>
    </section>
  );
}
