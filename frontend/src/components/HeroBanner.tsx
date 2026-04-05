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

const DAY_EXAMPLES = [
  {
    label: 'Romántico',
    sub: 'Cena + show + coctelería',
    time: '6:00 PM — 12:00 AM',
    items: ['🍷 Cena en restaurante', '🎵 Concierto jazz', '🍸 Coctelería secreta'],
    img: 'https://images.unsplash.com/photo-1522413452208-996ff3f3e740?w=500&h=600&fit=crop',
    color: '#e63946',
  },
  {
    label: 'Con amigos',
    sub: 'Actividad + tacos + fiesta',
    time: '4:00 PM — 2:00 AM',
    items: ['⚽ Partido en vivo', '🌮 Tacos callejeros', '🎉 Club nocturno'],
    img: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=500&h=600&fit=crop',
    color: '#f59e0b',
  },
  {
    label: 'Cultural',
    sub: 'Museo + comida + teatro',
    time: '10:00 AM — 10:00 PM',
    items: ['🎨 Museo de arte', '🍽️ Almuerzo gourmet', '🎭 Obra de teatro'],
    img: 'https://images.unsplash.com/photo-1531913764164-f85c3e01b1aa?w=500&h=600&fit=crop',
    color: '#8b5cf6',
  },
  {
    label: 'Familiar',
    sub: 'Parque + museo + cena',
    time: '9:00 AM — 8:00 PM',
    items: ['🌳 Chapultepec', '🦕 Museo interactivo', '🍕 Cena familiar'],
    img: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=500&h=600&fit=crop',
    color: '#2a9d8f',
  },
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
        () => setDetecting(false),
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

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* HERO — Split layout: left text + right Day preview               */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ background: 'var(--bg)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-12 sm:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">

            {/* Left: Text + Search + CTA */}
            <div>
              {/* City */}
              {detecting ? (
                <p className="text-sm mb-3" style={{ color: 'var(--text-tertiary)' }}>Detectando ubicación...</p>
              ) : selectedCity ? (
                <p className="text-sm mb-3" style={{ color: 'var(--text-tertiary)' }}>
                  📍 {selectedCity.name}
                </p>
              ) : null}

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.08] tracking-[-0.025em]" style={{ color: 'var(--fg)' }}>
                No compres un ticket.
                <br />
                <span className="text-[#e63946]">Arma tu Day.</span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg mt-4 max-w-md leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Combina cena, concierto, bar y más en un solo plan. Te decimos cómo llegar y te llevamos.
              </p>

              {/* Search */}
              <div className="mt-6 max-w-md">
                <SearchBar
                  onSearch={handleSearch}
                  large
                  placeholder={selectedCity ? `¿Qué quieres hacer en ${selectedCity.short}?` : '¿Qué quieres hacer hoy?'}
                  showSuggestions={false}
                />
              </div>

              {/* CTAs */}
              <div className="flex items-center gap-3 mt-5">
                <button
                  onClick={() => router.push('/build-day')}
                  className="px-6 py-3 bg-[#e63946] text-white text-sm font-bold rounded-xl hover:bg-[#d32836] transition active:scale-[0.97] shadow-lg shadow-[#e63946]/20"
                >
                  Arma tu Day
                </button>
                <button
                  onClick={() => router.push(selectedCity ? `/${selectedCity.slug}` : '/search')}
                  className="px-6 py-3 text-sm font-medium rounded-xl transition"
                  style={{ color: 'var(--text-secondary)', background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  Explorar
                </button>
              </div>

              {/* Trust indicators */}
              <div className="flex items-center gap-4 mt-6">
                {['Ruta completa', 'Transporte incluido', 'Precios desde $0'].map(t => (
                  <span key={t} className="text-[11px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
                    ✓ {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Day preview card — shows what a "Day" looks like */}
            <div className="relative hidden lg:block">
              <div className="relative rounded-3xl overflow-hidden p-6" style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
                {/* Day header */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#e63946]">Ejemplo de Day</p>
                    <p className="text-lg font-bold mt-0.5" style={{ color: 'var(--fg)' }}>Sábado romántico</p>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                    6:00 PM — 12:00 AM
                  </span>
                </div>

                {/* Timeline items */}
                <div className="space-y-0">
                  {[
                    { time: '6:00 PM', title: 'Cena en Pujol', cat: 'Gastronomía', price: '$890', img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=100&h=100&fit=crop' },
                    { time: '8:30 PM', title: 'Jazz en Parker & Lenox', cat: 'Concierto', price: '$350', img: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=100&h=100&fit=crop' },
                    { time: '11:00 PM', title: 'Coctelería Departamento', cat: 'Nightlife', price: 'Gratis', img: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=100&h=100&fit=crop' },
                  ].map((item, i, arr) => (
                    <div key={item.time}>
                      <div className="flex items-center gap-3 py-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden relative shrink-0">
                          <Image src={item.img} alt={item.title} fill sizes="40px" className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: 'var(--fg)' }}>{item.title}</p>
                          <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{item.time} · {item.cat}</p>
                        </div>
                        <span className="text-xs font-bold shrink-0" style={{ color: item.price === 'Gratis' ? '#2a9d8f' : 'var(--fg)' }}>
                          {item.price}
                        </span>
                      </div>
                      {/* Transport between */}
                      {i < arr.length - 1 && (
                        <div className="flex items-center gap-2 py-1.5 pl-12">
                          <div className="w-px h-4" style={{ background: 'var(--border)' }} />
                          <span className="text-[9px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
                            🚗 12 min · $45 MXN
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Total estimado</span>
                  <span className="text-base font-black" style={{ color: 'var(--fg)' }}>$1,285 MXN</span>
                </div>
              </div>

              {/* Decorative badge */}
              <div className="absolute -top-3 -right-3 px-3 py-1.5 bg-[#e63946] text-white text-[10px] font-bold rounded-full shadow-lg">
                3 actividades · 6 hrs
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* CATEGORIES BAR                                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="border-b sticky top-16 z-30" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide py-2.5 -mx-4 px-4 sm:mx-0 sm:px-0">
            {CATEGORIES.map(cat => (
              <button
                key={cat.slug}
                onClick={() => router.push(`/search?category=${cat.slug}`)}
                className="shrink-0 flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl text-xs font-medium transition hover:opacity-80"
                style={{ color: 'var(--text-secondary)' }}
              >
                <span className="text-lg">{cat.icon}</span>
                <span className="whitespace-nowrap text-[10px]">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ARMA TU DAY — The differentiator cards                           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-10 sm:py-14" style={{ background: 'var(--bg)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--fg)' }}>¿Cómo quieres vivir tu día?</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Te armamos el plan completo</p>
            </div>
            <button onClick={() => router.push('/build-day')} className="text-sm font-medium text-[#e63946] hover:opacity-80 transition hidden sm:block">
              Personalizar →
            </button>
          </div>

          {/* Horizontal scroll on mobile, grid on desktop */}
          <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-4 sm:gap-4">
            {DAY_EXAMPLES.map(day => (
              <button
                key={day.label}
                onClick={() => router.push('/build-day')}
                className="shrink-0 w-[70vw] sm:w-auto group relative rounded-2xl overflow-hidden text-left transition-all hover:shadow-xl active:scale-[0.98]"
                style={{ border: '1px solid var(--border)' }}
              >
                {/* Image */}
                <div className="relative aspect-[3/2] overflow-hidden">
                  <Image src={day.img} alt={day.label} fill sizes="(max-width:640px) 70vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white font-bold text-base">{day.label}</p>
                    <p className="text-white/70 text-xs">{day.sub}</p>
                  </div>
                </div>
                {/* Plan preview */}
                <div className="p-3 space-y-1.5" style={{ background: 'var(--card)' }}>
                  {day.items.map(item => (
                    <div key={item} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full" style={{ background: day.color }} />
                      <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{item}</span>
                    </div>
                  ))}
                  <p className="text-[10px] pt-1 font-medium" style={{ color: 'var(--text-tertiary)' }}>{day.time}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Mobile CTA */}
          <button
            onClick={() => router.push('/build-day')}
            className="w-full mt-5 py-3.5 bg-[#e63946] text-white font-bold text-sm rounded-xl hover:bg-[#d32836] transition sm:hidden active:scale-[0.98]"
          >
            Arma tu Day
          </button>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* CITY SELECTOR — only if no city detected                         */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
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
                  <Image src={c.image} alt={c.name} fill sizes="(max-width:640px) 33vw, 16vw" className="object-cover group-hover:scale-110 transition-transform duration-300" />
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
