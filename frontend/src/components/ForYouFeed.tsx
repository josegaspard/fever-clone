'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Event } from '@/lib/api';
import EventCard from './EventCard';
import Link from 'next/link';

export default function ForYouFeed({ citySlug }: { citySlug?: string }) {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) { setLoading(false); return; }
      try {
        const params = new URLSearchParams();
        if (citySlug) params.set('city', citySlug);
        params.set('limit', '8');
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/recommendations?${params.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        setEvents(data.data || []);
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, citySlug]);

  if (!user || (!loading && events.length === 0)) return null;

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-8 rounded-full bg-gradient-to-b from-[#e63946] to-[#ff6b6b]" />
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#e63946] mb-0.5">Personalizado</p>
            <h2 className="text-2xl md:text-3xl font-black" style={{ color: 'var(--fg)' }}>
              Para ti
            </h2>
          </div>
        </div>
        <p className="text-sm mb-8 ml-5" style={{ color: 'var(--text-secondary)' }}>
          Basado en tus gustos e intereses
        </p>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="aspect-[3/4] rounded-xl shimmer" style={{ background: 'var(--card)' }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {events.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/build-day"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#e63946] hover:bg-[#d32836] text-white font-bold text-sm rounded-full transition-all hover:scale-[1.03] shadow-lg shadow-[#e63946]/20"
          >
            Arma tu Day con estas actividades
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
