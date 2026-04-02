'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Event, getEvents, addPlanItem, createTicket, createCheckoutSession } from '@/lib/api';
import { useToast } from './Toast';

interface DaySuggestionsProps {
  planId: string;
  currentEventIds: string[];
  citySlug?: string;
  onItemAdded?: () => void;
}

const SUGGESTION_CATEGORIES = [
  { key: 'before', label: 'Antes del evento', icon: '☕', desc: 'Come algo, toma un cafe o haz una actividad antes' },
  { key: 'after', label: 'Después del evento', icon: '🍸', desc: 'Un bar, restaurante o actividad nocturna para cerrar tu Day' },
  { key: 'nearby', label: 'Cerca del lugar', icon: '📍', desc: 'Actividades y experiencias en la misma zona' },
  { key: 'group', label: 'Para tu grupo', icon: '👥', desc: 'Actividades grupales, mesas, experiencias compartidas' },
];

export default function DaySuggestions({ planId, currentEventIds, citySlug, onItemAdded }: DaySuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    async function load() {
      try {
        const res = await getEvents({
          city: citySlug || undefined,
          status: 'PUBLISHED',
          limit: 12,
        });
        const events = (res.data || []).filter(
          (e: Event) => !currentEventIds.includes(String(e.id))
        );
        setSuggestions(events.slice(0, 8));
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [citySlug, currentEventIds]);

  async function handleAdd(event: Event) {
    setAdding(event.id);
    try {
      const item = await addPlanItem(planId, {
        eventId: event.id,
        startTime: event.time || '18:00',
      });

      if (event.price === 0) {
        await createTicket(String(event.id), String(item.id));
        showToast(`${event.title} agregado a tu Day`, 'success');
      } else {
        const { url } = await createCheckoutSession({
          eventId: String(event.id),
          planItemId: String(item.id),
          planId,
        });
        if (url) {
          window.location.href = url;
          return;
        }
      }
      onItemAdded?.();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error', 'error');
    } finally {
      setAdding(null);
    }
  }

  if (dismissed || (!loading && suggestions.length === 0)) return null;

  const cs = (e: Event) => e.currency === 'GBP' ? '£' : e.currency === 'EUR' ? '€' : '$';

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      {/* Header */}
      <div className="p-5 pb-3 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold" style={{ color: 'var(--fg)' }}>Sigue armando tu Day</h3>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            Agrega mas actividades para un dia perfecto
          </p>
        </div>
        <button onClick={() => setDismissed(true)} className="p-1 hover:opacity-60 transition" style={{ color: 'var(--text-tertiary)' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Quick category chips */}
      <div className="px-5 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
        {SUGGESTION_CATEGORIES.map(cat => (
          <div
            key={cat.key}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--fg)' }}
          >
            <span>{cat.icon}</span>
            {cat.label}
          </div>
        ))}
      </div>

      {/* Suggestion cards */}
      <div className="px-5 pb-5">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 rounded-xl shimmer" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {suggestions.map(event => (
              <div
                key={event.id}
                className="flex gap-3 rounded-xl p-2.5 transition hover:opacity-90"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 relative">
                  {event.image ? (
                    <Image src={event.image} alt={event.title} fill sizes="64px" className="object-cover" />
                  ) : (
                    <div className="w-full h-full" style={{ background: 'var(--surface)' }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold line-clamp-1" style={{ color: 'var(--fg)' }}>{event.title}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                    {event.time || ''} · {event.category?.name || ''}
                  </p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs font-bold" style={{ color: event.price === 0 ? '#2a9d8f' : 'var(--fg)' }}>
                      {event.price === 0 ? 'Gratis' : `${cs(event)}${event.price.toFixed(0)}`}
                    </span>
                    <button
                      onClick={() => handleAdd(event)}
                      disabled={adding === event.id}
                      className="px-2.5 py-1 text-[10px] font-bold rounded-lg text-white transition hover:opacity-90 disabled:opacity-50"
                      style={{ background: event.price === 0 ? '#2a9d8f' : '#e63946' }}
                    >
                      {adding === event.id ? '...' : event.price === 0 ? 'Agregar' : 'Comprar'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="px-5 pb-5">
        <Link
          href={`/search${citySlug ? `?city=${citySlug}` : ''}`}
          className="block w-full text-center py-3 rounded-xl text-sm font-medium transition hover:opacity-80"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
        >
          Explorar mas eventos
        </Link>
      </div>
    </div>
  );
}
