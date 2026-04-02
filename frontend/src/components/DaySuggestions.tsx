'use client';

import { useState, useEffect, useMemo } from 'react';
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

type TabKey = 'previa' | 'post-show' | 'cerca' | 'grupo';

const TABS: { key: TabKey; label: string; icon: string; desc: string }[] = [
  { key: 'previa', label: 'Previa', icon: '☕', desc: 'Restaurantes, cafes y experiencias gastronomicas' },
  { key: 'post-show', label: 'Post-show', icon: '🍸', desc: 'Bares, vida nocturna y comida tarde' },
  { key: 'cerca', label: 'Cerca', icon: '📍', desc: 'Actividades en la misma zona' },
  { key: 'grupo', label: 'Para tu grupo', icon: '👥', desc: 'Planes grupales con amigos' },
];

const TAB_CATEGORIES: Record<TabKey, string[] | null> = {
  'previa': ['gastronomia', 'bienestar', 'tours'],
  'post-show': ['nightlife', 'conciertos'],
  'cerca': null, // all, sorted by distance
  'grupo': ['deportes', 'festivales', 'experiencias-inmersivas'],
};

const TIME_ESTIMATES: Record<string, string> = {
  gastronomia: '1-2h',
  bienestar: '1h',
  tours: '2-3h',
  nightlife: '2-4h',
  conciertos: '2-3h',
  deportes: '1-2h',
  festivales: '3-5h',
  'experiencias-inmersivas': '1-2h',
};

function getTimeEstimate(categorySlug?: string): string {
  if (!categorySlug) return '~1h';
  return TIME_ESTIMATES[categorySlug] || '~1h';
}

export default function DaySuggestions({ planId, currentEventIds, citySlug, onItemAdded }: DaySuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('previa');
  const { showToast } = useToast();

  useEffect(() => {
    async function load() {
      try {
        const res = await getEvents({
          city: citySlug || undefined,
          status: 'PUBLISHED',
          limit: 40,
        });
        const events = (res.data || []).filter(
          (e: Event) => !currentEventIds.includes(String(e.id))
        );
        setSuggestions(events);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [citySlug, currentEventIds]);

  const filtered = useMemo(() => {
    const cats = TAB_CATEGORIES[activeTab];
    if (cats === null) {
      // "Cerca" — show all suggestions
      return suggestions.slice(0, 8);
    }
    const result = suggestions.filter((e) => {
      const slug = e.category?.slug || '';
      return cats.includes(slug);
    });
    return result.slice(0, 8);
  }, [suggestions, activeTab]);

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
  const currentTabMeta = TABS.find((t) => t.key === activeTab)!;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Header */}
      <div className="p-5 pb-2 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold" style={{ color: 'var(--fg)' }}>
            Completa tu Day perfecto
          </h3>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            Agrega actividades antes, despues o cerca de tu evento
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 hover:opacity-60 transition"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="px-5 pt-2 pb-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200"
                style={{
                  background: isActive ? 'var(--fg)' : 'var(--card)',
                  color: isActive ? 'var(--bg)' : 'var(--text-secondary)',
                  border: isActive ? '1px solid var(--fg)' : '1px solid var(--border)',
                }}
              >
                <span className="text-sm">{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>
        {/* Tab description */}
        <p className="text-[11px] mt-2 pl-1" style={{ color: 'var(--text-tertiary)' }}>
          {currentTabMeta.desc}
        </p>
      </div>

      {/* Suggestion Cards */}
      <div className="px-5 pb-4">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 rounded-xl shimmer"
                style={{ background: 'var(--card)' }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="text-center py-8 rounded-xl"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <p className="text-2xl mb-2">{currentTabMeta.icon}</p>
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              No hay sugerencias de {currentTabMeta.label.toLowerCase()} por ahora
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Prueba otra categoria o explora mas actividades
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-3 rounded-xl p-3 transition-all hover:opacity-90"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                {/* Thumbnail */}
                <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 relative">
                  {event.image ? (
                    <Image src={event.image} alt={event.title} fill sizes="56px" className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg" style={{ background: 'var(--surface)' }}>{currentTabMeta.icon}</div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold line-clamp-1" style={{ color: 'var(--fg)' }}>{event.title}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                    {event.category?.name || ''} · {getTimeEstimate(event.category?.slug)}
                  </p>
                </div>

                {/* Price + Action */}
                <div className="shrink-0 text-right">
                  <p className="text-xs font-bold mb-1" style={{ color: event.price === 0 ? '#2a9d8f' : 'var(--fg)' }}>
                    {event.price === 0 ? 'Gratis' : `${cs(event)}${event.price.toFixed(0)}`}
                  </p>
                  <button
                    onClick={() => handleAdd(event)}
                    disabled={adding === event.id}
                    className="px-3 py-1.5 text-[11px] font-bold rounded-lg text-white transition hover:opacity-90 disabled:opacity-50"
                    style={{ background: event.price === 0 ? '#2a9d8f' : '#e63946' }}
                  >
                    {adding === event.id ? '...' : event.price === 0 ? '+ Agregar' : 'Comprar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prominent CTA */}
      <div className="px-5 pb-5">
        <Link
          href={`/search${citySlug ? `?city=${citySlug}` : ''}`}
          className="group/cta block w-full text-center py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90"
          style={{
            background: 'linear-gradient(135deg, var(--fg), var(--text-secondary))',
            color: 'var(--bg)',
          }}
        >
          Explorar mas actividades
          <svg
            className="w-4 h-4 inline-block ml-1.5 transition-transform duration-200 group-hover/cta:translate-x-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
