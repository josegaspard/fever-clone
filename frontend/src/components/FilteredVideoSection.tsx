'use client';

import { useCityFilter } from './CityFilterProvider';
import Link from 'next/link';
import { Event } from '@/lib/api';
import VideoEventCard from './VideoEventCard';

interface FilteredVideoSectionProps {
  events: Event[];
}

export default function FilteredVideoSection({ events }: FilteredVideoSectionProps) {
  const { filterEvents } = useCityFilter();
  const videoEvents = filterEvents(events);

  if (videoEvents.length === 0) return null;

  return (
    <section className="relative py-20 overflow-hidden" aria-label="Experiencias en video">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, var(--bg), #0a0a0a, #0a0a0a, var(--bg))' }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#e63946]/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-[#e63946]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm0 2v12h16V6H4zm4.5 2.5l7 3.5-7 3.5v-7z"/>
              </svg>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#e63946] mb-0.5">Exclusivo</p>
              <h2 className="text-2xl md:text-3xl font-black text-white">
                Experiencias en video
              </h2>
            </div>
          </div>
          <Link href="/search" className="hidden md:inline-flex items-center gap-1.5 text-sm font-semibold text-white/60 hover:text-white transition-colors">
            Ver todos
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {videoEvents.map((event) => (
            <VideoEventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </section>
  );
}
