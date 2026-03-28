'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getCategories, Category } from '@/lib/api';
import SearchBar from './SearchBar';

export default function HeroBanner() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.75;
    }
  }, []);

  const handleSearch = (q: string) => {
    if (q.trim()) {
      router.push(`/search?q=${encodeURIComponent(q.trim())}`);
    }
  };

  return (
    <section className="relative overflow-hidden min-h-[600px] md:min-h-[700px] lg:min-h-[85vh] flex items-center" role="banner">
      {/* Video Background */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover scale-105"
        poster="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1920&q=80"
      >
        <source src="https://videos.pexels.com/video-files/3045163/3045163-uhd_2560_1440_24fps.mp4" type="video/mp4" />
      </video>

      {/* Multi-layer overlay */}
      <div className="absolute inset-0 bg-black/60" />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, var(--bg), transparent, color-mix(in srgb, var(--bg) 50%, transparent))' }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, color-mix(in srgb, var(--bg) 40%, transparent), transparent, color-mix(in srgb, var(--bg) 40%, transparent))' }} />

      {/* Animated particles */}
      <div className="absolute top-20 left-[10%] w-72 h-72 bg-[#e63946]/10 rounded-full blur-[100px] hero-glow" />
      <div className="absolute bottom-20 right-[10%] w-96 h-96 bg-purple-600/8 rounded-full blur-[120px] hero-glow" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#e63946]/5 rounded-full blur-[150px] hero-glow" style={{ animationDelay: '1s' }} />

      {/* Content */}
      <div className="relative w-full max-w-5xl mx-auto px-4 pt-8 pb-16 text-center z-10">
        {/* Trust badge */}
        <div className="inline-flex items-center gap-2.5 bg-white/[0.08] backdrop-blur-xl border border-white/[0.08] rounded-full px-5 py-2 mb-8 animate-fade-in">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400"></span>
          </span>
          <span className="text-sm text-gray-200 font-medium">Miles de experiencias en 6 ciudades</span>
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-6 leading-[0.95] tracking-tight animate-fade-in" style={{ animationDelay: '100ms' }}>
          Vive algo
          <br />
          <span className="gradient-text">increíble</span> hoy
        </h1>

        <p className="text-gray-300/90 text-lg md:text-xl mb-10 max-w-2xl mx-auto animate-fade-in leading-relaxed font-light" style={{ animationDelay: '200ms' }}>
          Conciertos, experiencias inmersivas, gastronomía, arte y mucho más.
          <br className="hidden md:block" />
          Crea tu <strong className="text-white font-semibold">Day perfecto</strong> en minutos.
        </p>

        {/* Search + Build Day */}
        <div className="max-w-2xl mx-auto mb-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <div className="relative">
            <SearchBar onSearch={handleSearch} large placeholder="¿Qué quieres hacer hoy?" />
            <div className="absolute -inset-1 bg-gradient-to-r from-[#e63946]/20 via-purple-500/10 to-[#e63946]/20 rounded-2xl blur-xl -z-10" />
          </div>
        </div>

        <div className="animate-fade-in mb-8" style={{ animationDelay: '380ms' }}>
          <button
            onClick={() => router.push('/build-day')}
            className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-white text-black font-bold text-sm rounded-full hover:bg-gray-100 transition-all shadow-xl shadow-white/10 hover:shadow-white/20 hover:scale-[1.02]"
          >
            <svg className="w-5 h-5 text-[#e63946]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Arma tu Day perfecto
          </button>
        </div>

        {/* Category pills */}
        {categories.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2.5 animate-fade-in" style={{ animationDelay: '450ms' }}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => router.push(`/search?category=${encodeURIComponent(cat.slug)}`)}
                className="group px-5 py-2.5 bg-white/[0.06] backdrop-blur-sm border border-white/[0.06] rounded-full text-sm text-gray-300 hover:bg-white/[0.12] hover:border-[#e63946]/40 hover:text-white transition-all duration-300"
              >
                {cat.icon && <span className="mr-1.5 group-hover:scale-110 inline-block transition-transform">{cat.icon}</span>}
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center justify-center gap-8 md:gap-16 mt-12 animate-fade-in" style={{ animationDelay: '600ms' }}>
          {[
            { value: '34+', label: 'Eventos' },
            { value: '6', label: 'Ciudades' },
            { value: '4.7', label: 'Rating promedio' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl md:text-3xl font-black text-white">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32" style={{ background: 'linear-gradient(to top, var(--bg), transparent)' }} />

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <div className="w-6 h-10 border-2 border-white/20 rounded-full flex items-start justify-center p-1.5">
          <div className="w-1.5 h-3 bg-white/60 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
}
