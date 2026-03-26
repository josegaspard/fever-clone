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
    <section className="relative overflow-hidden" role="banner">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#e63946]/10 via-[#0a0a0a] to-[#0a0a0a]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#e63946]/5 via-transparent to-transparent hero-glow" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#e63946]/5 rounded-full blur-3xl hero-glow" style={{ animationDelay: '1s' }} />
      <div className="absolute top-20 right-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl hero-glow" style={{ animationDelay: '2s' }} />

      <div className="relative max-w-4xl mx-auto px-4 pt-20 pb-14 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-5 leading-tight animate-fade-in">
          Descubre los mejores{' '}
          <span className="gradient-text">planes</span> en tu ciudad
        </h1>
        <p className="text-gray-400 text-base md:text-lg mb-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '150ms' }}>
          Experiencias únicas, espectáculos increíbles y eventos exclusivos te
          esperan. Crea tu Day perfecto.
        </p>

        {/* Search */}
        <div className="max-w-xl mx-auto mb-8">
          <SearchBar onSearch={handleSearch} large />
        </div>

        {/* Category pills */}
        {categories.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() =>
                  router.push(
                    `/search?category=${encodeURIComponent(cat.slug)}`
                  )
                }
                className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-full text-sm text-gray-300 hover:border-[#e63946] hover:text-[#e63946] transition"
              >
                {cat.icon && <span className="mr-1">{cat.icon}</span>}
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
