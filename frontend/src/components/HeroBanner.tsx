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
  { slug: 'conciertos', label: 'Conciertos', icon: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z' },
  { slug: 'gastronomia', label: 'Gastronomía', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6' },
  { slug: 'arte', label: 'Arte', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { slug: 'deportes', label: 'Deportes', icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z' },
  { slug: 'teatro', label: 'Teatro', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
  { slug: 'nightlife', label: 'Nightlife', icon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z' },
  { slug: 'tours', label: 'Tours', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
  { slug: 'bienestar', label: 'Bienestar', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
];

// Animated Day steps for the preview
const DAY_STEPS = [
  { time: '6:00 PM', title: 'Cena en restaurante', category: 'Gastronomía', price: '$890', img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=100&h=100&fit=crop' },
  { time: '8:30 PM', title: 'Concierto en vivo', category: 'Música', price: '$350', img: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=100&h=100&fit=crop' },
  { time: '11:00 PM', title: 'Coctelería exclusiva', category: 'Nightlife', price: 'Incluido', img: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=100&h=100&fit=crop' },
];

const DAY_MODES = [
  { label: 'Solo', sub: 'A tu ritmo', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=600&fit=crop' },
  { label: 'En pareja', sub: 'Noche perfecta', img: 'https://images.unsplash.com/photo-1522413452208-996ff3f3e740?w=500&h=600&fit=crop' },
  { label: 'Con amigos', sub: 'Plan grupal', img: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=500&h=600&fit=crop' },
  { label: 'En familia', sub: 'Para todos', img: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=500&h=600&fit=crop' },
];

export default function HeroBanner() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [detectedCity, setDetectedCity] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

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

  // Animate the Day steps
  useEffect(() => {
    const t = setInterval(() => setActiveStep(s => (s + 1) % (DAY_STEPS.length + 1)), 2500);
    return () => clearInterval(t);
  }, []);

  const selectedCity = CITIES.find(c => c.slug === detectedCity);
  const handleSearch = (q: string) => {
    if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}${detectedCity ? `&city=${detectedCity}` : ''}`);
  };

  return (
    <div className={`transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden" style={{ background: 'var(--bg)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-14 sm:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">

            {/* LEFT — Text */}
            <div className="lg:col-span-7">
              {detecting ? (
                <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>Detectando ubicación...</p>
              ) : selectedCity ? (
                <p className="text-sm mb-4 flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {selectedCity.name}
                </p>
              ) : null}

              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black leading-[1.1] tracking-[-0.025em]" style={{ color: 'var(--fg)' }}>
                No compres solo
                <br />un ticket.
                <br /><span className="text-[#e63946]">Arma tu Day.</span>
              </h1>

              <p className="text-base sm:text-lg mt-5 max-w-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Combina restaurantes, shows, actividades y más en un solo plan. Con ruta y transporte resuelto.
              </p>

              <div className="mt-7 max-w-md">
                <SearchBar
                  onSearch={handleSearch}
                  large
                  placeholder={selectedCity ? `Buscar en ${selectedCity.short}...` : 'Qué quieres hacer hoy?'}
                  showSuggestions={false}
                />
              </div>

              <div className="flex items-center gap-3 mt-5">
                <button onClick={() => router.push('/build-day')} className="px-6 py-3 bg-[#e63946] text-white text-sm font-bold rounded-xl hover:bg-[#d32836] transition active:scale-[0.97] shadow-lg shadow-[#e63946]/20">
                  Arma tu Day
                </button>
                <button onClick={() => router.push(selectedCity ? `/${selectedCity.slug}` : '/search')} className="px-6 py-3 text-sm font-medium rounded-xl transition" style={{ color: 'var(--text-secondary)', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  Explorar
                </button>
              </div>

              <div className="flex items-center gap-5 mt-6">
                {['Ruta completa', 'Transporte incluido', 'Desde $0'].map(t => (
                  <span key={t} className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
                    <svg className="w-3 h-3 text-[#2a9d8f]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* RIGHT — TWO PHONE MOCKUPS side by side */}
            <div className="lg:col-span-5 hidden lg:flex items-center gap-4 justify-center">

              {/* PHONE 1: "Armando tu Day" — animated step by step */}
              <div className="relative w-[240px] shrink-0">
                <div className="rounded-[2rem] p-2.5 shadow-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  {/* Status bar */}
                  <div className="flex items-center justify-between px-3 py-1.5 mb-1">
                    <span className="text-[9px] font-medium" style={{ color: 'var(--text-tertiary)' }}>9:41</span>
                    <div className="flex gap-0.5">
                      <div className="w-3 h-1.5 rounded-sm" style={{ background: 'var(--text-tertiary)', opacity: 0.5 }} />
                    </div>
                  </div>

                  <div className="px-3 mb-2">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-[#e63946]">Paso 1</p>
                    <p className="text-xs font-bold" style={{ color: 'var(--fg)' }}>Armando tu Day</p>
                  </div>

                  {/* Animated timeline */}
                  <div className="px-2.5 space-y-0.5">
                    {DAY_STEPS.map((step, i) => (
                      <div key={step.time} className={`transition-all duration-500 ${i <= activeStep ? 'opacity-100 translate-y-0' : 'opacity-20 translate-y-2'}`}>
                        <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg" style={{ background: i === activeStep ? 'var(--surface)' : 'transparent', border: i === activeStep ? '1px solid var(--border)' : '1px solid transparent' }}>
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] shrink-0 ${i <= activeStep ? 'bg-[#e63946] text-white' : ''}`} style={i > activeStep ? { background: 'var(--surface)', color: 'var(--text-tertiary)' } : {}}>
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-semibold truncate" style={{ color: 'var(--fg)' }}>{step.title}</p>
                            <p className="text-[8px]" style={{ color: 'var(--text-tertiary)' }}>{step.time}</p>
                          </div>
                          <span className="text-[9px] font-bold shrink-0" style={{ color: 'var(--fg)' }}>{step.price}</span>
                        </div>
                      </div>
                    ))}

                    {/* Add more CTA */}
                    <div className={`transition-all duration-300 ${activeStep >= 2 ? 'opacity-100' : 'opacity-0'}`}>
                      <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg border-dashed" style={{ border: '1px dashed var(--border)' }}>
                        <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{ background: 'var(--surface)' }}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} style={{ color: 'var(--text-tertiary)' }}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                        </div>
                        <p className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>Agregar actividad</p>
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className={`mx-2.5 mt-2 mb-2 transition-all duration-500 ${activeStep >= DAY_STEPS.length ? 'opacity-100' : 'opacity-30'}`}>
                    <div className="w-full py-1.5 bg-[#e63946] text-white text-[10px] font-bold rounded-lg text-center">
                      Confirmar Day
                    </div>
                  </div>
                </div>
                <p className="text-center text-[10px] font-medium mt-3" style={{ color: 'var(--text-tertiary)' }}>Elige actividades</p>
              </div>

              {/* Arrow between phones */}
              <div className="shrink-0 flex flex-col items-center gap-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} style={{ color: 'var(--text-tertiary)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>

              {/* PHONE 2: "Tu Day listo" — routes + transport */}
              <div className="relative w-[240px] shrink-0">
                <div className="rounded-[2rem] p-2.5 shadow-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between px-3 py-1.5 mb-1">
                    <span className="text-[9px] font-medium" style={{ color: 'var(--text-tertiary)' }}>9:41</span>
                    <div className="flex gap-0.5">
                      <div className="w-3 h-1.5 rounded-sm" style={{ background: 'var(--text-tertiary)', opacity: 0.5 }} />
                    </div>
                  </div>

                  <div className="px-3 mb-2">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-[#2a9d8f]">Listo</p>
                    <p className="text-xs font-bold" style={{ color: 'var(--fg)' }}>Tu Day completo</p>
                  </div>

                  {/* Completed timeline with routes */}
                  <div className="px-2.5 space-y-0">
                    {DAY_STEPS.map((step, i) => (
                      <div key={step.time}>
                        <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg">
                          <div className="w-6 h-6 rounded-md overflow-hidden relative shrink-0">
                            <Image src={step.img} alt={step.title} fill sizes="24px" className="object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-semibold truncate" style={{ color: 'var(--fg)' }}>{step.title}</p>
                            <p className="text-[8px]" style={{ color: 'var(--text-tertiary)' }}>{step.time}</p>
                          </div>
                          <svg className="w-3 h-3 text-[#2a9d8f] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        {/* Transport between */}
                        {i < DAY_STEPS.length - 1 && (
                          <div className="ml-4 pl-3 py-1 flex items-center gap-1.5" style={{ borderLeft: '2px dashed var(--border)' }}>
                            <div className="flex gap-1">
                              <span className="text-[8px] px-1.5 py-0.5 rounded font-medium" style={{ background: 'var(--surface)', color: 'var(--text-secondary)' }}>
                                {i === 0 ? 'L3 Metro' : 'Uber'}
                              </span>
                              <span className="text-[8px] px-1.5 py-0.5 rounded font-medium" style={{ background: 'var(--surface)', color: 'var(--text-secondary)' }}>
                                {i === 0 ? '15 min' : '12 min'}
                              </span>
                              <span className="text-[8px] px-1.5 py-0.5 rounded font-medium" style={{ background: 'var(--surface)', color: 'var(--text-secondary)' }}>
                                {i === 0 ? '$5' : '$85'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Total + transport summary */}
                  <div className="mx-2.5 mt-2 mb-1 p-2 rounded-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>Actividades</span>
                      <span className="text-[10px] font-bold" style={{ color: 'var(--fg)' }}>$1,240</span>
                    </div>
                    <div className="flex justify-between items-center mt-0.5">
                      <span className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>Transporte</span>
                      <span className="text-[10px] font-bold" style={{ color: 'var(--fg)' }}>$90</span>
                    </div>
                    <div className="flex justify-between items-center mt-1 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
                      <span className="text-[9px] font-bold" style={{ color: 'var(--fg)' }}>Total Day</span>
                      <span className="text-xs font-black text-[#e63946]">$1,330</span>
                    </div>
                  </div>

                  <div className="mx-2.5 mb-2 mt-1">
                    <div className="w-full py-1.5 bg-[#2a9d8f] text-white text-[10px] font-bold rounded-lg text-center">
                      Reservar todo
                    </div>
                  </div>
                </div>
                <p className="text-center text-[10px] font-medium mt-3" style={{ color: 'var(--text-tertiary)' }}>Ruta y transporte resuelto</p>
              </div>
            </div>

            {/* MOBILE — Day preview (simplified) */}
            <div className="lg:hidden">
              <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#e63946]">Ejemplo de Day</p>
                    <p className="text-sm font-bold" style={{ color: 'var(--fg)' }}>Sábado en pareja</p>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded-full" style={{ background: 'var(--surface)', color: 'var(--text-secondary)' }}>3 actividades</span>
                </div>
                <div className="px-4 py-3 space-y-2">
                  {DAY_STEPS.map((step, i) => (
                    <div key={step.time} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg overflow-hidden relative shrink-0">
                        <Image src={step.img} alt={step.title} fill sizes="32px" className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: 'var(--fg)' }}>{step.title}</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{step.time}</p>
                      </div>
                      <span className="text-[10px] font-bold" style={{ color: step.price === 'Incluido' ? '#2a9d8f' : 'var(--fg)' }}>{step.price}</span>
                      {i < DAY_STEPS.length - 1 && <span className="text-[8px] absolute" style={{ color: 'var(--text-tertiary)' }} />}
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--border)' }}>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Total estimado</span>
                  <span className="text-sm font-black" style={{ color: 'var(--fg)' }}>$1,240 MXN</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CATEGORIES ═══ */}
      <section className="border-b sticky top-16 z-30" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide py-2.5 -mx-4 px-4 sm:mx-0 sm:px-0">
            {CATEGORIES.map(cat => (
              <button
                key={cat.slug}
                onClick={() => router.push(`/search?category=${cat.slug}`)}
                className="shrink-0 flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition hover:opacity-80"
                style={{ color: 'var(--text-secondary)' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={cat.icon} />
                </svg>
                <span className="whitespace-nowrap text-[10px] font-medium">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ DAY MODES ═══ */}
      <section className="py-10 sm:py-14" style={{ background: 'var(--bg)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--fg)' }}>Elige tu plan</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Te armamos el día completo</p>
            </div>
            <button onClick={() => router.push('/build-day')} className="text-sm font-medium text-[#e63946] hover:opacity-80 transition hidden sm:block">
              Personalizar
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-4 sm:gap-4">
            {DAY_MODES.map(day => (
              <button
                key={day.label}
                onClick={() => router.push('/build-day')}
                className="shrink-0 w-[65vw] sm:w-auto group relative rounded-2xl overflow-hidden text-left transition-all active:scale-[0.98]"
                style={{ border: '1px solid var(--border)' }}
              >
                <div className="relative aspect-[3/4] sm:aspect-[3/4] overflow-hidden">
                  <Image src={day.img} alt={day.label} fill sizes="(max-width:640px) 65vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white font-bold text-lg">{day.label}</p>
                    <p className="text-white/60 text-xs mt-0.5">{day.sub}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <button onClick={() => router.push('/build-day')} className="w-full mt-5 py-3.5 bg-[#e63946] text-white font-bold text-sm rounded-xl transition sm:hidden active:scale-[0.98]">
            Arma tu Day
          </button>
        </div>
      </section>

      {/* ═══ CITY SELECTOR ═══ */}
      {!detectedCity && !detecting && (
        <section className="pb-10" style={{ background: 'var(--bg)' }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--fg)' }}>Elige tu ciudad</h2>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {CITIES.map(c => (
                <button key={c.slug} onClick={() => { setDetectedCity(c.slug); localStorage.setItem('ctxplorer-city', c.slug); router.push(`/${c.slug}`); }} className="group relative aspect-[4/3] rounded-xl overflow-hidden">
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
