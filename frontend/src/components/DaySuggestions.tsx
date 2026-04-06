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
  eventCategory?: string;
  onItemAdded?: () => void;
}

type TabKey = 'previa' | 'post-show' | 'cerca' | 'grupo';

const TABS: { key: TabKey; label: string; desc: string }[] = [
  { key: 'previa', label: 'Previa', desc: 'Antes de tu evento principal' },
  { key: 'post-show', label: 'Post-show', desc: 'Sigue la fiesta despues' },
  { key: 'cerca', label: 'Cerca', desc: 'Actividades en la misma zona' },
  { key: 'grupo', label: 'Para tu grupo', desc: 'Ideales para ir en grupo' },
];

const RELATED_CATEGORIES: Record<string, { previa: string[]; 'post-show': string[] }> = {
  conciertos: { previa: ['gastronomia', 'tours'], 'post-show': ['nightlife', 'gastronomia'] },
  gastronomia: { previa: ['conciertos', 'arte'], 'post-show': ['nightlife', 'conciertos'] },
  deportes: { previa: ['gastronomia'], 'post-show': ['nightlife', 'gastronomia'] },
  arte: { previa: ['gastronomia', 'bienestar'], 'post-show': ['tours', 'gastronomia'] },
  nightlife: { previa: ['gastronomia', 'conciertos'], 'post-show': ['gastronomia', 'bienestar'] },
  festivales: { previa: ['gastronomia', 'tours'], 'post-show': ['nightlife', 'gastronomia'] },
  tours: { previa: ['gastronomia', 'bienestar'], 'post-show': ['nightlife', 'conciertos'] },
  bienestar: { previa: ['gastronomia', 'tours'], 'post-show': ['arte', 'gastronomia'] },
};

const DEFAULT_TAB_CATEGORIES: Record<TabKey, string[] | null> = {
  'previa': ['gastronomia', 'bienestar', 'tours'],
  'post-show': ['nightlife', 'conciertos'],
  'cerca': null,
  'grupo': ['deportes', 'festivales', 'experiencias-inmersivas'],
};

function getTabCategories(eventCategory?: string): Record<TabKey, string[] | null> {
  if (!eventCategory || !RELATED_CATEGORIES[eventCategory]) {
    return DEFAULT_TAB_CATEGORIES;
  }
  const related = RELATED_CATEGORIES[eventCategory];
  return {
    'previa': related.previa,
    'post-show': related['post-show'],
    'cerca': null,
    'grupo': DEFAULT_TAB_CATEGORIES['grupo'],
  };
}

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

export default function DaySuggestions({ planId, currentEventIds, citySlug, eventCategory, onItemAdded }: DaySuggestionsProps) {
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

  const tabCategories = useMemo(() => getTabCategories(eventCategory), [eventCategory]);

  const filtered = useMemo(() => {
    const cats = tabCategories[activeTab];
    if (cats === null) {
      return suggestions.slice(0, 8);
    }
    const result = suggestions.filter((e) => {
      const slug = e.category?.slug || '';
      return cats.includes(slug);
    });
    return result.slice(0, 8);
  }, [suggestions, activeTab, tabCategories]);

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

  const cs = (e: Event) => e.currency === 'GBP' ? '\u00a3' : e.currency === 'EUR' ? '\u20ac' : '$';

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      {/* Header with gradient accent */}
      <div className="relative p-5 pb-3 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1" style={{ background: 'linear-gradient(90deg, #e63946, #f97316, #8b5cf6)' }} />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#e63946] mb-1">Tu Day no esta completo</p>
            <h3 className="text-lg font-bold" style={{ color: 'var(--fg)' }}>
              Agrega mas actividades
            </h3>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              Los mejores Days tienen 3+ actividades con ruta optimizada
            </p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 rounded-full hover:opacity-60 transition"
            style={{ color: 'var(--text-tertiary)', background: 'var(--surface)' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Savings hint */}
        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(42,157,143,0.08)', border: '1px solid rgba(42,157,143,0.15)' }}>
          <svg className="w-4 h-4 text-[#2a9d8f] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <p className="text-[11px] text-[#2a9d8f] font-medium">
            Agrega cena + bar y calcula la ruta mas rapida entre actividades
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 pt-1 pb-3">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`shrink-0 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${isActive ? 'text-white shadow-sm' : ''}`}
                style={{
                  background: isActive ? 'linear-gradient(135deg, #e63946, #c62d3a)' : 'var(--surface)',
                  color: isActive ? 'white' : 'var(--text-secondary)',
                  border: isActive ? 'none' : '1px solid var(--border)',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <div className="px-5 pb-4">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[3/4] rounded-xl animate-pulse" style={{ background: 'var(--surface)' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              No hay sugerencias de &quot;{TABS.find(t => t.key === activeTab)?.label}&quot; por ahora
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Prueba otra categoria
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((event) => (
              <div
                key={event.id}
                className="group rounded-xl overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  {event.image ? (
                    <Image src={event.image} alt={event.title} fill sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--card)' }}>
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-tertiary)' }} strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                      </svg>
                    </div>
                  )}
                  {/* Price badge */}
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white backdrop-blur-sm" style={{ background: event.price === 0 ? '#2a9d8f' : 'rgba(0,0,0,0.7)' }}>
                      {event.price === 0 ? 'Gratis' : `${cs(event)}${event.price.toFixed(0)}`}
                    </span>
                  </div>
                  {/* Hover overlay with quick-add */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Link href={`/events/${event.slug}`} className="text-white text-[10px] font-semibold underline underline-offset-2">
                      Ver detalles
                    </Link>
                  </div>
                </div>

                {/* Info */}
                <div className="p-2.5">
                  <p className="text-xs font-bold line-clamp-2 leading-tight mb-1" style={{ color: 'var(--fg)' }}>{event.title}</p>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                      {event.category?.name || ''}
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>·</span>
                    <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                      {getTimeEstimate(event.category?.slug)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleAdd(event)}
                    disabled={adding === event.id}
                    className="w-full py-2 text-[11px] font-bold rounded-lg text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                    style={{ background: event.price === 0 ? 'linear-gradient(135deg, #2a9d8f, #1a7a6f)' : 'linear-gradient(135deg, #e63946, #c62d3a)' }}
                  >
                    {adding === event.id ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                        Agregando...
                      </span>
                    ) : event.price === 0 ? (
                      '+ Agregar gratis'
                    ) : (
                      `${cs(event)}${event.price.toFixed(0)} - Agregar`
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="px-5 pb-5">
        <Link
          href={`/search${citySlug ? `?city=${citySlug}` : ''}`}
          className="group/cta flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-semibold transition-all hover:shadow-md"
          style={{ background: 'var(--surface)', color: 'var(--fg)', border: '1px solid var(--border)' }}
        >
          Explorar mas actividades
          <svg
            className="w-4 h-4 transition-transform group-hover/cta:translate-x-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}