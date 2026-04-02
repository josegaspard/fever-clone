'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { Event } from '@/lib/api';
import EventCard, { EventCardSkeleton } from './EventCard';

interface EventCarouselProps {
  title: string;
  events: Event[];
  loading?: boolean;
  viewAllHref?: string;
  favoriteIds?: string[];
}

export default function EventCarousel({
  title,
  events,
  loading = false,
  viewAllHref,
  favoriteIds = [],
}: EventCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.7;
    scrollRef.current.scrollBy({
      left: dir === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  if (!loading && events.length === 0) return null;

  return (
    <section className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-bold" style={{ color: 'var(--fg)' }}>{title}</h2>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-sm text-[#e63946] hover:underline"
          >
            Ver todo &rarr;
          </Link>
        )}
      </div>

      {/* Carousel */}
      <div className="relative group">
        {/* Left arrow */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full border flex items-center justify-center opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity -translate-x-1/2"
          style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--fg)' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Right arrow */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full border flex items-center justify-center opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity translate-x-1/2"
          style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--fg)' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-snap-x snap-mandatory pb-2"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-[160px] sm:w-[200px] md:w-[220px] snap-start"
                >
                  <EventCardSkeleton />
                </div>
              ))
            : events.map((event) => (
                <div
                  key={event.id}
                  className="flex-shrink-0 w-[160px] sm:w-[200px] md:w-[220px] snap-start"
                >
                  <EventCard
                    event={event}
                    isFavorite={favoriteIds.includes(event.id)}
                  />
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}
