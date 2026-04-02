'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

interface SearchBarProps {
  initialValue?: string;
  onSearch: (query: string) => void;
  placeholder?: string;
  large?: boolean;
  debounceMs?: number;
  showSuggestions?: boolean;
}

interface Suggestion {
  id: string;
  title: string;
  slug: string;
  category?: string;
  categoryIcon?: string;
  city?: string;
  price?: number;
}

export default function SearchBar({
  initialValue = '',
  onSearch,
  placeholder = 'Buscar eventos, experiencias...',
  large = false,
  debounceMs = 400,
  showSuggestions = true,
}: SearchBarProps) {
  const [value, setValue] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const debounced = useCallback(
    (() => {
      let timer: NodeJS.Timeout;
      return (val: string) => {
        clearTimeout(timer);
        timer = setTimeout(() => onSearch(val), debounceMs);
      };
    })(),
    [onSearch, debounceMs]
  );

  // Fetch suggestions
  const fetchSuggestions = useCallback(
    (() => {
      let timer: NodeJS.Timeout;
      return (q: string) => {
        clearTimeout(timer);
        if (q.length < 2) { setSuggestions([]); setShowDropdown(false); return; }
        timer = setTimeout(async () => {
          setLoading(true);
          try {
            const res = await fetch(`/api/events?q=${encodeURIComponent(q)}&limit=5&status=PUBLISHED`);
            if (res.ok) {
              const data = await res.json();
              const items = (data.data || data || []).slice(0, 5).map((e: Record<string, unknown>) => ({
                id: String(e.id),
                title: e.title as string,
                slug: e.slug as string,
                category: (e.category as Record<string, unknown>)?.name as string || undefined,
                categoryIcon: (e.category as Record<string, unknown>)?.icon as string || undefined,
                city: (e.city as Record<string, unknown>)?.name as string || undefined,
                price: e.price as number,
              }));
              setSuggestions(items);
              setShowDropdown(items.length > 0);
            }
          } catch { /* silent */ }
          finally { setLoading(false); }
        }, 250);
      };
    })(),
    []
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setValue(v);
    debounced(v);
    if (showSuggestions) fetchSuggestions(v);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowDropdown(false);
    onSearch(value);
  };

  return (
    <form ref={wrapperRef} onSubmit={handleSubmit} className="relative w-full">
      <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }}>
        {loading ? (
          <div className={`${large ? 'w-5 h-5' : 'w-4 h-4'} border-2 border-[#e63946] border-t-transparent rounded-full animate-spin`} />
        ) : (
          <svg
            className={large ? 'w-5 h-5' : 'w-4 h-4'}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        )}
      </div>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
        placeholder={placeholder}
        className={`w-full rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e63946] focus:border-transparent transition ${
          large ? 'pl-12 pr-4 py-4 text-lg' : 'pl-10 pr-4 py-2.5 text-sm'
        }`}
        style={{ background: 'var(--input-bg)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)', color: 'var(--fg)' }}
        autoComplete="off"
      />

      {/* Autocomplete dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full mt-2 rounded-xl shadow-xl overflow-hidden z-50 animate-slide-up"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          {suggestions.map((s) => (
            <Link
              key={s.id}
              href={`/events/${s.slug}`}
              className="flex items-center gap-3 px-4 py-3 transition hover:bg-[var(--card-hover)]"
              onClick={() => setShowDropdown(false)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--fg)' }}>{s.title}</p>
                <p className="text-[11px] truncate" style={{ color: 'var(--text-tertiary)' }}>
                  {s.categoryIcon} {s.category}{s.city ? ` · ${s.city}` : ''}
                </p>
              </div>
              <span className="text-xs font-bold shrink-0" style={{ color: s.price === 0 ? '#10b981' : '#e63946' }}>
                {s.price === 0 ? 'Gratis' : `$${s.price}`}
              </span>
            </Link>
          ))}
          <button
            type="submit"
            className="w-full text-left px-4 py-2.5 text-xs font-medium transition hover:bg-[var(--card-hover)]"
            style={{ color: '#e63946', borderTop: '1px solid var(--border)' }}
            onClick={() => { setShowDropdown(false); onSearch(value); }}
          >
            Ver todos los resultados para &ldquo;{value}&rdquo; →
          </button>
        </div>
      )}
    </form>
  );
}
