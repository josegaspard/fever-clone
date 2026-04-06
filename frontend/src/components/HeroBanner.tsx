'use client';

import { useEffect, useState, useRef } from 'react';
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
  { slug: 'gastronomia', label: 'Gastronomia', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6' },
  { slug: 'arte', label: 'Arte', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { slug: 'deportes', label: 'Deportes', icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z' },
  { slug: 'teatro', label: 'Teatro', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
  { slug: 'nightlife', label: 'Nightlife', icon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z' },
  { slug: 'tours', label: 'Tours', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
  { slug: 'bienestar', label: 'Bienestar', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
];

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1920&h=1080&fit=crop&q=80',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1920&h=1080&fit=crop&q=80',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1920&h=1080&fit=crop&q=80',
];

const DAY_STEPS = [
  { time: '6:00 PM', title: 'Cena en restaurante', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6', price: '$890', color: '#f97316' },
  { time: '8:30 PM', title: 'Concierto en vivo', icon: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z', price: '$350', color: '#e63946' },
  { time: '11:00 PM', title: 'Cocteleria exclusiva', icon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z', price: 'Incluido', color: '#8b5cf6' },
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
  const [activeStep, setActiveStep] = useState(-1);
  const [bgIndex, setBgIndex] = useState(0);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

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

  // Animate Day steps progressively
  useEffect(() => {
    const t = setInterval(() => {
      setActiveStep(s => {
        if (s >= DAY_STEPS.length) return -1;
        return s + 1;
      });
    }, 1800);
    return () => clearInterval(t);
  }, []);

  // Rotate background images
  useEffect(() => {
    const t = setInterval(() => setBgIndex(i => (i + 1) % HERO_IMAGES.length), 6000);
    return () => clearInterval(t);
  }, []);

  // Stats counter animation on scroll
  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setStatsVisible(true);
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const selectedCity = CITIES.find(c => c.slug === detectedCity);
  const handleSearch = (q: string) => {
    if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}${detectedCity ? `&city=${detectedCity}` : ''}`);
  };

  return (
    <div className={`transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>

      {/* ================================================================ */}
      {/* HERO — Immersive fullscreen with rotating backgrounds            */}
      {/* ================================================================ */}
      <section className="relative min-h-[92vh] sm:min-h-[88vh] flex items-center overflow-hidden">
        {/* Rotating background images */}
        {HERO_IMAGES.map((img, i) => (
          <div
            key={img}
            className="absolute inset-0 transition-opacity duration-[2000ms]"
            style={{ opacity: bgIndex === i ? 1 : 0 }}
          >
            <Image
              src={img}
              alt=""
              fill
              className="object-cover"
              sizes="100vw"
              priority={i === 0}
            />
          </div>
        ))}

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

        {/* Animated grain/noise texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat' }} />

        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">

            {/* LEFT — Text + Search + CTA */}
            <div className="max-w-xl">
              {/* Location badge */}
              {detecting ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-white/50 text-xs">
                  <div className="w-3 h-3 border border-white/40 border-t-transparent rounded-full animate-spin" />
                  Detectando ubicacion...
                </div>
              ) : selectedCity ? (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-6 backdrop-blur-md" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
                  <svg className="w-3.5 h-3.5 text-[#e63946]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <span className="text-xs font-medium text-white/90">{selectedCity.name}</span>
                </div>
              ) : null}

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.05] tracking-[-0.03em]">
                No compres solo
                <br />un ticket.
                <br />
                <span className="relative inline-block">
                  <span className="relative z-10 text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #e63946 0%, #ff6b6b 50%, #e63946 100%)' }}>
                    Arma tu Day.
                  </span>
                  <span className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full" style={{ background: 'linear-gradient(90deg, #e63946, #ff6b6b, #e63946)' }} />
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-white/70 mt-5 leading-relaxed max-w-md">
                Combina restaurantes, shows y actividades en un solo plan.
                Con ruta optimizada y transporte resuelto.
              </p>

              {/* Search */}
              <div className="mt-7 max-w-md">
                <SearchBar
                  onSearch={handleSearch}
                  large
                  placeholder={selectedCity ? `Buscar en ${selectedCity.short}...` : 'Que quieres hacer hoy?'}
                  showSuggestions={false}
                />
              </div>

              {/* CTA Buttons */}
              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => router.push('/build-day')}
                  className="group px-7 py-3.5 text-white text-sm font-bold rounded-xl transition-all active:scale-[0.97] hover:shadow-xl hover:shadow-[#e63946]/25"
                  style={{ background: 'linear-gradient(135deg, #e63946, #c62d3a)' }}
                >
                  <span className="flex items-center gap-2">
                    Arma tu Day
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </button>
                <button
                  onClick={() => router.push(selectedCity ? `/${selectedCity.slug}` : '/search')}
                  className="px-6 py-3.5 text-white/90 text-sm font-medium rounded-xl transition backdrop-blur-md hover:bg-white/15"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
                >
                  Explorar eventos
                </button>
              </div>

              {/* Trust badges */}
              <div className="flex items-center gap-5 mt-7">
                {[
                  { text: 'Ruta completa', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
                  { text: 'Transporte incluido', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 5H4m0 0l4 4m-4-4l4-4' },
                  { text: 'Desde $0', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                ].map(item => (
                  <span key={item.text} className="flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-white/50">
                    <svg className="w-3.5 h-3.5 text-[#2a9d8f]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                    </svg>
                    {item.text}
                  </span>
                ))}
              </div>
            </div>

            {/* RIGHT — Animated "Arma tu Day" card (desktop only) */}
            <div className="hidden lg:block">
              <div className="relative max-w-[340px] ml-auto">
                {/* Glow effect behind card */}
                <div className="absolute -inset-4 rounded-3xl blur-2xl opacity-20" style={{ background: 'linear-gradient(135deg, #e63946, #8b5cf6)' }} />

                {/* Day Builder Card */}
                <div className="relative rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl" style={{ background: 'rgba(10,10,10,0.85)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {/* Card header */}
                  <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#e63946]">Tu Day</p>
                      <p className="text-sm font-bold text-white mt-0.5">Sabado en pareja</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-white/40 px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      CDMX
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="px-5 pb-2">
                    {DAY_STEPS.map((step, i) => (
                      <div key={step.time} className={`transition-all duration-700 ease-out ${i <= activeStep ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
                        {/* Step row */}
                        <div className="flex items-center gap-3 py-2.5">
                          {/* Icon */}
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${step.color}20`, border: `1px solid ${step.color}30` }}>
                            <svg className="w-4 h-4" fill="none" stroke={step.color} viewBox="0 0 24 24" strokeWidth={1.8}>
                              <path strokeLinecap="round" strokeLinejoin="round" d={step.icon} />
                            </svg>
                          </div>
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-white truncate">{step.title}</p>
                            <p className="text-[10px] text-white/40">{step.time}</p>
                          </div>
                          {/* Price */}
                          <span className="text-xs font-bold shrink-0" style={{ color: step.price === 'Incluido' ? '#2a9d8f' : 'white' }}>
                            {step.price}
                          </span>
                        </div>

                        {/* Route connector between steps */}
                        {i < DAY_STEPS.length - 1 && (
                          <div className={`ml-4 pl-4 py-1 transition-all duration-500 delay-300 ${i < activeStep ? 'opacity-100' : 'opacity-0'}`} style={{ borderLeft: '1px dashed rgba(255,255,255,0.12)' }}>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] text-white/30 bg-white/5 px-2 py-0.5 rounded">
                                {i === 0 ? 'Metro L3 · 15 min · $5' : 'Uber · 12 min · $85'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Add more CTA */}
                    <div className={`transition-all duration-500 ${activeStep >= 2 ? 'opacity-100' : 'opacity-0'}`}>
                      <div className="flex items-center gap-3 py-2.5 px-0 rounded-lg cursor-pointer group">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-dashed border-white/15 group-hover:border-white/30 transition">
                          <svg className="w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <p className="text-[11px] text-white/30">Agregar actividad</p>
                      </div>
                    </div>
                  </div>

                  {/* Summary bar */}
                  <div className={`mx-5 mb-3 p-3 rounded-xl transition-all duration-500 ${activeStep >= DAY_STEPS.length ? 'opacity-100' : 'opacity-0'}`} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="flex justify-between text-[10px] text-white/50 mb-1">
                      <span>3 actividades + transporte</span>
                      <span>Total</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-[#2a9d8f] font-medium">Ruta optimizada</span>
                      <span className="text-base font-black text-white">$1,330 <span className="text-[10px] font-normal text-white/40">MXN</span></span>
                    </div>
                  </div>

                  {/* Action button */}
                  <div className={`px-5 pb-5 transition-all duration-500 ${activeStep >= DAY_STEPS.length ? 'opacity-100' : 'opacity-30'}`}>
                    <div className="w-full py-3 rounded-xl text-white text-sm font-bold text-center transition" style={{ background: 'linear-gradient(135deg, #e63946, #c62d3a)' }}>
                      Reservar todo
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* MOBILE — Compact Day preview */}
            <div className="lg:hidden">
              <div className="rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl" style={{ background: 'rgba(10,10,10,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#e63946]">Ejemplo de Day</p>
                    <p className="text-sm font-bold text-white">Sabado en pareja</p>
                  </div>
                  <span className="text-[10px] px-2.5 py-1 rounded-full text-white/50 bg-white/5">3 actividades</span>
                </div>
                <div className="px-4 py-3 space-y-2">
                  {DAY_STEPS.map((step) => (
                    <div key={step.time} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${step.color}15` }}>
                        <svg className="w-4 h-4" fill="none" stroke={step.color} viewBox="0 0 24 24" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={step.icon} />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{step.title}</p>
                        <p className="text-[10px] text-white/40">{step.time}</p>
                      </div>
                      <span className="text-[10px] font-bold" style={{ color: step.price === 'Incluido' ? '#2a9d8f' : 'white' }}>{step.price}</span>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <span className="text-xs text-white/50">Total estimado</span>
                  <span className="text-sm font-black text-white">$1,330 MXN</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade to page bg */}
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none" style={{ background: 'linear-gradient(to top, var(--bg), transparent)' }} />

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce opacity-40">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* ================================================================ */}
      {/* CATEGORIES BAR — Sticky below navbar                             */}
      {/* ================================================================ */}
      <section className="border-b sticky top-16 z-30" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
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

      {/* ================================================================ */}
      {/* DAY MODES — "Elige tu plan"                                      */}
      {/* ================================================================ */}
      <section className="py-12 sm:py-16" style={{ background: 'var(--bg)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-7">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#e63946] mb-1">Arma tu Day</p>
              <h2 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--fg)' }}>Elige tu plan</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Te armamos el dia completo segun tu estilo</p>
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
                className="shrink-0 w-[60vw] sm:w-auto group relative rounded-2xl overflow-hidden text-left transition-all active:scale-[0.98]"
                style={{ border: '1px solid var(--border)' }}
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image src={day.img} alt={day.label} fill sizes="(max-width:640px) 60vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                  <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-[#e63946]/40 transition-all duration-300 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white font-bold text-lg">{day.label}</p>
                    <p className="text-white/60 text-xs mt-0.5">{day.sub}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <button onClick={() => router.push('/build-day')} className="w-full mt-5 py-3.5 text-white font-bold text-sm rounded-xl transition sm:hidden active:scale-[0.98]" style={{ background: 'linear-gradient(135deg, #e63946, #c62d3a)' }}>
            Arma tu Day
          </button>
        </div>
      </section>

      {/* ================================================================ */}
      {/* STATS BAR — Social proof                                         */}
      {/* ================================================================ */}
      <div ref={statsRef} className="py-8" style={{ background: 'var(--surface-2)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
            {[
              { value: '50K+', label: 'Days creados' },
              { value: '120+', label: 'Ciudades' },
              { value: '4.8', label: 'Calificacion promedio' },
              { value: '10K+', label: 'Eventos activos' },
            ].map((stat) => (
              <div key={stat.label} className={`text-center transition-all duration-700 ${statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <p className="text-2xl sm:text-3xl font-black" style={{ color: 'var(--fg)' }}>{stat.value}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* CITY SELECTOR — Only if no city detected                         */}
      {/* ================================================================ */}
      {!detectedCity && !detecting && (
        <section className="pb-10" style={{ background: 'var(--bg)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
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