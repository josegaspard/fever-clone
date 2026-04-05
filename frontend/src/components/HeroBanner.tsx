'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import SearchBar from './SearchBar';

const CITIES = [
  { slug: 'cdmx', name: 'Ciudad de México', short: 'CDMX', country: 'México', lat: 19.4326, lng: -99.1332, image: 'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=400&h=300&fit=crop' },
  { slug: 'madrid', name: 'Madrid', short: 'Madrid', country: 'España', lat: 40.4168, lng: -3.7038, image: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=400&h=300&fit=crop' },
  { slug: 'barcelona', name: 'Barcelona', short: 'Barcelona', country: 'España', lat: 41.3874, lng: 2.1686, image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&h=300&fit=crop' },
  { slug: 'new-york', name: 'New York', short: 'NYC', country: 'USA', lat: 40.7128, lng: -74.006, image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=300&fit=crop' },
  { slug: 'london', name: 'London', short: 'London', country: 'UK', lat: 51.5074, lng: -0.1278, image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=300&fit=crop' },
  { slug: 'paris', name: 'Paris', short: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522, image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=300&fit=crop' },
];

const CATEGORIES = [
  { slug: 'conciertos', label: 'Conciertos', icon: '🎵' },
  { slug: 'gastronomia', label: 'Gastronomía', icon: '🍽️' },
  { slug: 'arte', label: 'Arte y Museos', icon: '🎨' },
  { slug: 'deportes', label: 'Deportes', icon: '⚽' },
  { slug: 'teatro', label: 'Teatro', icon: '🎭' },
  { slug: 'nightlife', label: 'Nightlife', icon: '🌙' },
  { slug: 'tours', label: 'Tours', icon: '🗺️' },
  { slug: 'bienestar', label: 'Bienestar', icon: '🧘' },
];

export default function HeroBanner() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [detectedCity, setDetectedCity] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);

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
          for (const c of CITIES) {
            const d = Math.sqrt((latitude - c.lat) ** 2 + (longitude - c.lng) ** 2);
            if (d < minDist) { minDist = d; nearest = c.slug; }
          }
          setDetectedCity(nearest);
          localStorage.setItem('ctxplorer-city', nearest);
          setDetecting(false);
        },
        () => { setDetecting(false); },
        { timeout: 5000, maximumAge: 60000 }
      );
    }
  }, []);

  const selectedCity = CITIES.find(c => c.slug === detectedCity);
  const handleSearch = (q: string) => {
    if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}${detectedCity ? `&city=${detectedCity}` : ''}`);
  };

  return (
    <div className={`transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      {/* ── Hero section ── */}
      <section className="relative overflow-hidden" role="banner">
        {/* Background gradient — not full screen, just enough */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, #0f0f0f 0%, #1a0a0e 40%, #0f0f0f 100%)',
        }} />
        {/* Subtle glow */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-[0.07]" style={{
          background: 'radial-gradient(circle, #e63946 0%, transparent 70%)',
        }} />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-28 sm:pt-36 pb-16 sm:pb-20">
          {/* City indicator */}
          <div className="mb-4">
            {detecting ? (
              <span className="text-sm text-white/40">Detectando ubicación...</span>
            ) : selectedCity ? (
              <span className="text-sm text-white/50">
                Eventos en <span className="text-white/80 font-medium">{selectedCity.name}</span>
              </span>
            ) : null}
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white leading-[1.05] tracking-[-0.02em] max-w-2xl">
            Arma tu dia perfecto
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-white/40 mt-4 max-w-lg leading-relaxed">
            Combina restaurantes, conciertos, actividades y mas. Te armamos la ruta y te llevamos.
          </p>

          {/* Search bar */}
          <div className="mt-8 max-w-xl">
            <SearchBar
              onSearch={handleSearch}
              large
              placeholder={selectedCity ? `Buscar en ${selectedCity.short}...` : 'Que quieres hacer?'}
              showSuggestions={false}
            />
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2 mt-6">
            <button
              onClick={() => router.push('/build-day')}
              className="px-5 py-2.5 bg-[#e63946] text-white text-sm font-semibold rounded-xl hover:bg-[#d32836] transition active:scale-[0.97]"
            >
              Arma tu Day
            </button>
            <button
              onClick={() => router.push(selectedCity ? `/${selectedCity.slug}` : '/search')}
              className="px-5 py-2.5 bg-white/[0.08] text-white/70 text-sm font-medium rounded-xl hover:bg-white/[0.12] transition border border-white/[0.06]"
            >
              Explorar todo
            </button>
          </div>
        </div>
      </section>

      {/* ── Categories — always visible, scrollable ── */}
      <section className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide py-3 -mx-4 px-4 sm:mx-0 sm:px-0">
            {CATEGORIES.map(cat => (
              <button
                key={cat.slug}
                onClick={() => router.push(`/search?category=${cat.slug}`)}
                className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition hover:opacity-80"
                style={{ color: 'var(--text-secondary)' }}
              >
                <span className="text-base">{cat.icon}</span>
                <span className="whitespace-nowrap">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── "Arma tu Day" cards — the differentiator ── */}
      <section className="py-10 sm:py-14" style={{ background: 'var(--bg)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--fg)' }}>
                Arma tu Day
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                Elige como quieres vivir tu dia
              </p>
            </div>
            <button
              onClick={() => router.push('/build-day')}
              className="text-sm font-medium text-[#e63946] hover:opacity-80 transition hidden sm:block"
            >
              Ver todos →
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: 'Solo', sub: 'Tu tiempo, tus reglas', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop', gradient: 'from-blue-900/80' },
              { label: 'En pareja', sub: 'Cena + show + bar', img: 'https://images.unsplash.com/photo-1522413452208-996ff3f3e740?w=400&h=500&fit=crop', gradient: 'from-rose-900/80' },
              { label: 'Con amigos', sub: 'Actividad + comida + fiesta', img: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=500&fit=crop', gradient: 'from-amber-900/80' },
              { label: 'En familia', sub: 'Museo + parque + cena', img: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&h=500&fit=crop', gradient: 'from-emerald-900/80' },
            ].map(m => (
              <button
                key={m.label}
                onClick={() => router.push('/build-day')}
                className="group relative aspect-[3/4] sm:aspect-[4/5] rounded-2xl overflow-hidden text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Image
                  src={m.img}
                  alt={m.label}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${m.gradient} via-transparent to-black/20`} />
                <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                  <p className="text-white font-bold text-sm sm:text-base">{m.label}</p>
                  <p className="text-white/60 text-[11px] sm:text-xs mt-0.5">{m.sub}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Mobile CTA */}
          <button
            onClick={() => router.push('/build-day')}
            className="w-full mt-4 py-3.5 bg-[#e63946] text-white font-bold text-sm rounded-xl hover:bg-[#d32836] transition sm:hidden active:scale-[0.98]"
          >
            Arma tu Day ahora
          </button>
        </div>
      </section>

      {/* ── City selector — if no city detected ── */}
      {!detectedCity && !detecting && (
        <section className="pb-10" style={{ background: 'var(--bg)' }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--fg)' }}>Elige tu ciudad</h2>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {CITIES.map(c => (
                <button
                  key={c.slug}
                  onClick={() => { setDetectedCity(c.slug); localStorage.setItem('ctxplorer-city', c.slug); router.push(`/${c.slug}`); }}
                  className="group relative aspect-[4/3] rounded-xl overflow-hidden"
                >
                  <Image src={c.image} alt={c.name} fill sizes="(max-width: 640px) 33vw, 16vw" className="object-cover group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition" />
                  <span className="absolute inset-0 flex items-center justify-center text-white text-xs sm:text-sm font-bold">{c.short}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
