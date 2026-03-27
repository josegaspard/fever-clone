'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCategories, Category } from '@/lib/api';
import SearchBar from './SearchBar';

export default function HeroBanner() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  const handleSearch = (q: string) => {
    if (q.trim()) {
      router.push(`/search?q=${encodeURIComponent(q.trim())}`);
    }
  };

  return (
    <section className="relative overflow-hidden min-h-[520px] md:min-h-[600px] flex items-center" role="banner" aria-label="Descubre los mejores planes y eventos">
      {/* Video background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
        poster="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1920&q=80"
      >
        <source src="https://videos.pexels.com/video-files/3045163/3045163-uhd_2560_1440_24fps.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/65" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/40 via-transparent to-transparent" />

      {/* Animated accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#e63946]/8 rounded-full blur-3xl hero-glow" style={{ animationDelay: '1s' }} />
      <div className="absolute top-20 right-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl hero-glow" style={{ animationDelay: '2s' }} />

      <div className="relative w-full max-w-4xl mx-auto px-4 pt-16 pb-14 text-center z-10">
        {/* Trust badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-full px-4 py-1.5 mb-6 animate-fade-in">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs text-gray-200 font-medium">+10,000 experiencias en 6 ciudades</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-5 leading-[1.1] animate-fade-in tracking-tight">
          Descubre los mejores{' '}
          <span className="gradient-text">planes</span>
          <br className="hidden sm:block" />
          {' '}en tu ciudad
        </h1>
        <p className="text-gray-300 text-base md:text-xl mb-10 max-w-2xl mx-auto animate-fade-in leading-relaxed" style={{ animationDelay: '150ms' }}>
          Experiencias únicas, espectáculos increíbles y eventos exclusivos te
          esperan. Crea tu <strong className="text-white">Day perfecto</strong>.
        </p>

        {/* Search */}
        <div className="max-w-xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <SearchBar onSearch={handleSearch} large />
        </div>

        {/* Category pills */}
        {categories.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 animate-fade-in" style={{ animationDelay: '450ms' }}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() =>
                  router.push(
                    `/search?category=${encodeURIComponent(cat.slug)}`
                  )
                }
                className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full text-sm text-gray-200 hover:bg-[#e63946]/20 hover:border-[#e63946]/50 hover:text-white transition-all duration-200"
                aria-label={`Buscar eventos de ${cat.name}`}
              >
                {cat.icon && <span className="mr-1.5">{cat.icon}</span>}
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce z-10">
        <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
}
