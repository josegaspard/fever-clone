'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getEvents, getCategories, getCities, Event, Category, City, createPlan, addPlanItem } from '@/lib/api';
import { useToast } from '@/components/Toast';
import EventCard from '@/components/EventCard';

type Step = 'who' | 'where' | 'when' | 'budget' | 'vibes' | 'results';
type GroupType = 'solo' | 'pareja' | 'amigos' | 'familia';
type LocationMode = 'current' | 'trip';

interface Filters {
  group: GroupType | null;
  people: number;
  locationMode: LocationMode | null;
  city: string | null;
  citySearch: string;
  dayMode: '1day' | 'multi';
  dateFrom: string;
  dateTo: string;
  budgetMode: 'free' | 'preset' | 'custom';
  budgetPreset: number | null;
  budgetCustom: string;
  categories: string[];
  activityCount: number;
  walkLevel: 'poco' | 'normal' | 'mucho' | null;
}

interface ScoredRoute {
  events: Event[];
  totalCost: number;
  totalDistanceKm: number;
  totalDurationMin: number;
  avgDistanceKm: number;
  justification: string;
  tips: string[];
  label: string;
  emoji: string;
}

// ── Haversine ──
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parseDuration(d?: string): number {
  if (!d) return 60;
  let min = 0;
  const hMatch = d.match(/(\d+)\s*h/);
  const mMatch = d.match(/(\d+)\s*min/);
  if (hMatch) min += parseInt(hMatch[1]) * 60;
  if (mMatch) min += parseInt(mMatch[1]);
  return min || 60;
}

function travelTimeMin(distKm: number, walk: string | null): number {
  const speed = walk === 'mucho' ? 5 : walk === 'poco' ? 30 : 12; // km/h
  return Math.round((distKm / speed) * 60);
}

function transportTip(distKm: number, citySlug: string | null): string {
  if (distKm < 0.8) return 'Camina, está a unos minutos';
  if (distKm < 3) return 'Perfecto para caminar (~' + Math.round(distKm / 5 * 60) + ' min)';
  if (['cdmx', 'madrid', 'barcelona', 'london', 'paris'].includes(citySlug || '')) {
    if (distKm < 8) return 'Toma el metro (~' + Math.round(distKm / 25 * 60 + 5) + ' min)';
    return 'Uber/taxi recomendado (~' + Math.round(distKm / 30 * 60 + 5) + ' min)';
  }
  if (distKm < 6) return 'Taxi corto (~' + Math.round(distKm / 25 * 60 + 3) + ' min)';
  return 'Transporte recomendado (~' + Math.round(distKm / 30 * 60 + 5) + ' min)';
}

const today = () => new Date().toISOString().split('T')[0];

export default function BuildDayPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [step, setStep] = useState<Step>('who');
  const [filters, setFilters] = useState<Filters>({
    group: null, people: 2, locationMode: null, city: null, citySearch: '',
    dayMode: '1day', dateFrom: today(), dateTo: today(),
    budgetMode: 'preset', budgetPreset: null, budgetCustom: '',
    categories: [], activityCount: 4, walkLevel: null,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [results, setResults] = useState<ScoredRoute[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<number | null>(null);
  const [geoDetecting, setGeoDetecting] = useState(false);

  useEffect(() => {
    Promise.all([getCategories(), getCities()]).then(([cats, cits]) => {
      setCategories(cats); setCities(cits);
    }).catch(() => {});
  }, []);

  const CITY_COORDS: Record<string, [number, number]> = {
    cdmx: [19.4326, -99.1332], madrid: [40.4168, -3.7038],
    barcelona: [41.3874, 2.1686], london: [51.5074, -0.1278],
    'new-york': [40.7128, -74.006], paris: [48.8566, 2.3522],
  };

  function detectLocation() {
    setGeoDetecting(true);
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      let nearest = ''; let minDist = Infinity;
      for (const [slug, [lat, lng]] of Object.entries(CITY_COORDS)) {
        const d = Math.sqrt((latitude - lat) ** 2 + (longitude - lng) ** 2);
        if (d < minDist) { minDist = d; nearest = slug; }
      }
      setFilters(f => ({ ...f, city: nearest, locationMode: 'current' }));
      setGeoDetecting(false);
    }, () => { showToast('No pudimos detectar tu ubicación', 'error'); setGeoDetecting(false); setFilters(f => ({ ...f, locationMode: 'trip' })); });
  }

  const filteredCities = cities.filter(c => !filters.citySearch || c.name.toLowerCase().includes(filters.citySearch.toLowerCase()) || c.country.toLowerCase().includes(filters.citySearch.toLowerCase()));
  const steps: Step[] = ['who', 'where', 'when', 'budget', 'vibes', 'results'];
  const stepIndex = steps.indexOf(step);

  const canNext = (): boolean => {
    switch (step) {
      case 'who': return !!filters.group;
      case 'where': return !!filters.city;
      case 'when': return !!filters.dateFrom;
      case 'budget': return filters.budgetMode === 'free' || !!filters.budgetPreset || (filters.budgetMode === 'custom' && Number(filters.budgetCustom) > 0);
      case 'vibes': return filters.categories.length > 0;
      default: return false;
    }
  };

  const goNext = async () => { const idx = steps.indexOf(step); if (idx < steps.length - 1) { const next = steps[idx + 1]; setStep(next); if (next === 'results') await generateRoutes(); } };
  const goBack = () => { const idx = steps.indexOf(step); if (idx > 0) setStep(steps[idx - 1]); };
  const toggleCategory = (slug: string) => setFilters(f => ({ ...f, categories: f.categories.includes(slug) ? f.categories.filter(c => c !== slug) : [...f.categories, slug] }));

  const getMaxPrice = (): number | undefined => {
    if (filters.budgetMode === 'free') return 0;
    if (filters.budgetMode === 'custom') return Number(filters.budgetCustom) || undefined;
    if (filters.budgetPreset === 99999) return undefined;
    return filters.budgetPreset || undefined;
  };

  const getDayCount = (): number => {
    if (filters.dayMode === '1day') return 1;
    const from = new Date(filters.dateFrom); const to = new Date(filters.dateTo);
    return Math.max(1, Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  };

  // ── INTELLIGENT ROUTE GENERATION ──
  async function generateRoutes() {
    setLoadingResults(true);
    try {
      const maxPrice = getMaxPrice();
      const dayCount = getDayCount();
      const target = filters.activityCount * dayCount;
      const allEvents: Event[] = [];

      // Fetch ALL events for the city (no artificial limits)
      let page = 1;
      let hasMore = true;
      while (hasMore) {
        const res = await getEvents({ city: filters.city || undefined, maxPrice, status: 'PUBLISHED', limit: 50, page, sortBy: 'rating' });
        const batch = res.data || [];
        for (const ev of batch) {
          if (!allEvents.find(e => e.id === ev.id)) {
            // Filter by selected categories if any
            if (filters.categories.length > 0 && ev.category && !filters.categories.includes(ev.category.slug)) continue;
            allEvents.push(ev);
          }
        }
        hasMore = batch.length === 50 && page < 5; // Safety limit: max 250 events
        page++;
      }
      // If category filter left us with too few, fetch all categories too
      if (allEvents.length < target * 2) {
        const res = await getEvents({ city: filters.city || undefined, maxPrice, status: 'PUBLISHED', limit: 50, sortBy: 'popularity' });
        for (const ev of (res.data || [])) { if (!allEvents.find(e => e.id === ev.id)) allEvents.push(ev); }
      }
      const unique = allEvents.filter((e, i, a) => a.findIndex(x => x.id === e.id) === i);

      // Score and build routes with different strategies
      const strategies: { name: string; emoji: string; sortFn: (a: Event, b: Event) => number; maxDist?: number }[] = [
        { name: 'Ruta Óptima', emoji: '🏆', sortFn: (a, b) => (b.rating || 0) - (a.rating || 0) },
        { name: 'Ruta Cercana', emoji: '📍', sortFn: () => 0, maxDist: 5 },
        { name: 'Más por menos', emoji: '💰', sortFn: (a, b) => a.price - b.price },
      ];

      const scored: ScoredRoute[] = [];

      for (const strat of strategies) {
        const pool = [...unique].sort(strat.sortFn);
        // Greedy nearest-neighbor with constraints
        const route: Event[] = [];
        let totalCost = 0;
        const budgetLimit = maxPrice || 999999;
        const usedIds = new Set<string>();

        // Start with highest rated event that has coordinates
        const start = pool.find(e => e.lat && e.lng && !usedIds.has(e.id));
        if (!start) continue;
        route.push(start);
        usedIds.add(start.id);
        totalCost += start.price;

        // Build route greedily by proximity
        while (route.length < target && pool.length > 0) {
          const last = route[route.length - 1];
          let best: Event | null = null;
          let bestScore = -Infinity;

          for (const ev of pool) {
            if (usedIds.has(ev.id)) continue;
            if (totalCost + ev.price > budgetLimit && filters.budgetMode !== 'preset') continue;

            const dist = (last.lat && last.lng && ev.lat && ev.lng)
              ? haversine(last.lat, last.lng, ev.lat, ev.lng) : 10;

            if (strat.maxDist && dist > strat.maxDist) continue;

            // Score: prefer close, high-rated, category variety
            const catVariety = route.some(r => r.category?.slug === ev.category?.slug) ? 0 : 2;
            const ratingScore = (ev.rating || 3) / 5;
            const distPenalty = dist > 5 ? -2 : dist > 2 ? -0.5 : 0;
            const score = ratingScore + catVariety + distPenalty - (strat.name === 'Más por menos' ? ev.price / 500 : 0);

            if (score > bestScore) { bestScore = score; best = ev; }
          }

          if (!best) break;
          route.push(best);
          usedIds.add(best.id);
          totalCost += best.price;
        }

        if (route.length < 2) continue;

        // Calculate total distance and duration
        let totalDist = 0;
        let totalDur = 0;
        const tips: string[] = [];

        for (let i = 0; i < route.length; i++) {
          totalDur += parseDuration(route[i].duration);
          if (i < route.length - 1) {
            const d = (route[i].lat && route[i].lng && route[i + 1].lat && route[i + 1].lng)
              ? haversine(route[i].lat!, route[i].lng!, route[i + 1].lat!, route[i + 1].lng!) : 3;
            totalDist += d;
            const travel = travelTimeMin(d, filters.walkLevel);
            totalDur += travel;

            const tip = transportTip(d, filters.city);
            if (i < 3) tips.push(`${route[i].title?.split(':')[0]} → ${route[i + 1].title?.split(':')[0]}: ${tip} (${d.toFixed(1)} km)`);
          }
        }

        const avgDist = totalDist / Math.max(1, route.length - 1);
        const hours = Math.round(totalDur / 60 * 10) / 10;

        // Build justification
        let justification = '';
        if (route.length <= 3) {
          justification = `${route.length} actividades porque cada una dura ~${Math.round(totalDur / route.length)} min y el recorrido total es ${totalDist.toFixed(1)} km (~${hours}h en total).`;
        } else if (route.length <= 5) {
          justification = `${route.length} actividades bien distribuidas. Distancia promedio entre paradas: ${avgDist.toFixed(1)} km. Duración total estimada: ~${hours}h.`;
        } else {
          justification = `${route.length} actividades porque son cortas (~${Math.round(totalDur / route.length)} min c/u) y cercanas entre sí (${avgDist.toFixed(1)} km promedio). Total: ~${hours}h.`;
        }

        if (avgDist < 1.5) justification += ' Todo muy caminable.';
        else if (avgDist < 4) justification += ' Combina caminata y transporte público.';
        else justification += ' Recomendamos usar transporte entre paradas.';

        scored.push({
          events: route, totalCost, totalDistanceKm: totalDist,
          totalDurationMin: totalDur, avgDistanceKm: avgDist,
          justification, tips,
          label: strat.name, emoji: strat.emoji,
        });
      }

      setResults(scored);
    } catch { showToast('Error al generar rutas', 'error'); }
    finally { setLoadingResults(false); }
  }

  async function handleSelectRoute(ri: number) {
    if (!user) { router.push('/auth/login?redirect=/build-day'); return; }
    setSelectedRoute(ri); setCreatingPlan(true);
    try {
      const sr = results[ri];
      const dayCount = getDayCount();
      const label = filters.group === 'pareja' ? 'Romántico' : filters.group === 'amigos' ? 'con Amigos' : filters.group === 'familia' ? 'Familiar' : 'Perfecto';
      const plan = await createPlan({ title: `Mi Day ${label}${dayCount > 1 ? ` (${dayCount} días)` : ''}`, planDate: filters.dateFrom });

      let hour = 9;
      for (let i = 0; i < sr.events.length; i++) {
        const dur = parseDuration(sr.events[i].duration);
        const startH = String(Math.floor(hour)).padStart(2, '0');
        const startM = String(Math.round((hour % 1) * 60)).padStart(2, '0');
        await addPlanItem(plan.id, { eventId: sr.events[i].id, startTime: `${startH}:${startM}` });
        hour += dur / 60;
        // Add travel time to next
        if (i < sr.events.length - 1 && sr.events[i].lat && sr.events[i + 1].lat) {
          const d = haversine(sr.events[i].lat!, sr.events[i].lng!, sr.events[i + 1].lat!, sr.events[i + 1].lng!);
          hour += travelTimeMin(d, filters.walkLevel) / 60;
        } else { hour += 0.5; }
      }

      showToast(`Day creado con ${sr.events.length} actividades`);
      router.push(`/plans/${plan.id}`);
    } catch (err) { showToast(err instanceof Error ? err.message : 'Error', 'error'); }
    finally { setCreatingPlan(false); setSelectedRoute(null); }
  }

  const cs = (e: Event) => e.currency === 'GBP' ? '£' : e.currency === 'EUR' ? '€' : '$';
  const selectedCityName = cities.find(c => c.slug === filters.city)?.name || '';
  const sel = (on: boolean) => ({ background: on ? 'var(--card)' : 'var(--surface)', borderColor: on ? '#e63946' : 'var(--border)' });

  return (
    <div className="min-h-screen pb-28" style={{ background: 'var(--bg)' }}>
      {/* Progress */}
      <div className="sticky top-16 z-40" style={{ background: 'var(--nav-bg)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <button onClick={goBack} className={`text-sm font-medium flex items-center gap-1 transition ${stepIndex === 0 ? 'opacity-0 pointer-events-none' : ''}`} style={{ color: 'var(--text-secondary)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>Atrás
            </button>
            <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: 'var(--text-tertiary)' }}>{step === 'results' ? '✨ Resultados' : `${stepIndex + 1} / 5`}</span>
            <Link href="/" className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Salir</Link>
          </div>
          <div className="flex gap-1">{steps.slice(0, -1).map((_, i) => (<div key={i} className="flex-1 h-1 rounded-full transition-all duration-500" style={{ background: i <= stepIndex ? '#e63946' : 'var(--border)' }} />))}</div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* STEP 1: WHO */}
        {step === 'who' && (
          <div className="animate-fade-in space-y-8">
            <div className="text-center"><span className="text-5xl block mb-4">👋</span><h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">¿Con quién vas?</h1><p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Personalizaremos todo para tu grupo</p></div>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: 'solo' as const, label: 'Solo yo', icon: '🧑', desc: 'Un día para mí' },
                { value: 'pareja' as const, label: 'En pareja', icon: '💑', desc: 'Romántico y especial' },
                { value: 'amigos' as const, label: 'Con amigos', icon: '👯', desc: 'Diversión en grupo' },
                { value: 'familia' as const, label: 'En familia', icon: '👨‍👩‍👧‍👦', desc: 'Todas las edades' },
              ]).map(opt => (
                <button key={opt.value} onClick={() => setFilters(f => ({ ...f, group: opt.value, people: opt.value === 'solo' ? 1 : opt.value === 'pareja' ? 2 : 4 }))}
                  className={`p-5 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] ${filters.group === opt.value ? 'border-[#e63946] shadow-lg shadow-[#e63946]/10 scale-[1.02]' : ''}`} style={sel(filters.group === opt.value)}>
                  <span className="text-3xl">{opt.icon}</span><p className="font-bold text-sm mt-2">{opt.label}</p><p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{opt.desc}</p>
                </button>
              ))}
            </div>
            {(filters.group === 'amigos' || filters.group === 'familia') && (
              <div className="flex items-center justify-center gap-5 animate-fade-in">
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Personas:</span>
                <button onClick={() => setFilters(f => ({ ...f, people: Math.max(2, f.people - 1) }))} className="w-11 h-11 rounded-full border-2 flex items-center justify-center text-xl font-bold transition hover:border-[#e63946]" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>−</button>
                <span className="text-3xl font-black w-10 text-center tabular-nums">{filters.people}</span>
                <button onClick={() => setFilters(f => ({ ...f, people: Math.min(20, f.people + 1) }))} className="w-11 h-11 rounded-full border-2 flex items-center justify-center text-xl font-bold transition hover:border-[#e63946]" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>+</button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: WHERE */}
        {step === 'where' && (
          <div className="animate-fade-in space-y-6">
            <div className="text-center"><span className="text-5xl block mb-4">📍</span><h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">¿Dónde será?</h1><p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Detectamos tu ubicación o elige tu destino</p></div>
            {!filters.locationMode ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button onClick={detectLocation} disabled={geoDetecting} className="p-5 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] hover:border-[#e63946]" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                  <div className="flex items-center gap-3">{geoDetecting ? <div className="w-8 h-8 border-2 border-[#e63946] border-t-transparent rounded-full animate-spin" /> : <span className="text-3xl">📡</span>}<div><p className="font-bold text-sm">{geoDetecting ? 'Detectando...' : 'Usar mi ubicación'}</p><p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Detectamos la ciudad más cercana</p></div></div>
                </button>
                <button onClick={() => setFilters(f => ({ ...f, locationMode: 'trip' }))} className="p-5 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] hover:border-[#e63946]" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                  <div className="flex items-center gap-3"><span className="text-3xl">✈️</span><div><p className="font-bold text-sm">Es un viaje</p><p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Busco eventos en otro lugar</p></div></div>
                </button>
              </div>
            ) : (
              <>
                {filters.locationMode === 'current' && filters.city && (
                  <div className="p-4 rounded-2xl border-2 border-[#e63946] flex items-center gap-3 animate-fade-in" style={{ background: 'var(--card)' }}>
                    <span className="text-2xl">📍</span><div className="flex-1"><p className="font-bold text-sm">Estás en <span className="text-[#e63946]">{selectedCityName}</span></p></div>
                    <button onClick={() => setFilters(f => ({ ...f, locationMode: 'trip', city: null }))} className="text-xs font-medium text-[#e63946]">Cambiar</button>
                  </div>
                )}
                {(filters.locationMode === 'trip' || !filters.city) && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="relative">
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      <input value={filters.citySearch} onChange={(e) => setFilters(f => ({ ...f, citySearch: e.target.value }))} placeholder="Buscar ciudad..." className="w-full input-theme rounded-2xl pl-12 pr-4 py-4 text-sm" autoFocus />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{filteredCities.map(city => (
                      <button key={city.id} onClick={() => setFilters(f => ({ ...f, city: city.slug }))} className="relative overflow-hidden rounded-2xl border-2 aspect-[4/3] group transition-all hover:scale-[1.02]" style={{ borderColor: filters.city === city.slug ? '#e63946' : 'var(--border)' }}>
                        {city.image && <img src={city.image} alt={city.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" /><div className="absolute bottom-3 left-3 text-white"><p className="font-bold text-sm">{city.name}</p><p className="text-[10px] opacity-80">{city.country}</p></div>
                        {filters.city === city.slug && <div className="absolute top-2 right-2 w-6 h-6 bg-[#e63946] rounded-full flex items-center justify-center"><svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>}
                      </button>
                    ))}</div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* STEP 3: WHEN + ACTIVITY COUNT */}
        {step === 'when' && (
          <div className="animate-fade-in space-y-8">
            <div className="text-center"><span className="text-5xl block mb-4">📅</span><h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">¿Cuándo y cuánto?</h1><p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Elige duración y cantidad de actividades</p></div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setFilters(f => ({ ...f, dayMode: '1day', dateTo: f.dateFrom }))} className="p-5 rounded-2xl border-2 text-left transition-all hover:scale-[1.02]" style={sel(filters.dayMode === '1day')}><span className="text-3xl">☀️</span><p className="font-bold text-sm mt-2">Un solo día</p></button>
              <button onClick={() => setFilters(f => ({ ...f, dayMode: 'multi' }))} className="p-5 rounded-2xl border-2 text-left transition-all hover:scale-[1.02]" style={sel(filters.dayMode === 'multi')}><span className="text-3xl">🗓️</span><p className="font-bold text-sm mt-2">Varios días</p></button>
            </div>
            <div className="space-y-4">
              <div><label className="text-sm font-semibold block mb-2" style={{ color: 'var(--text-secondary)' }}>{filters.dayMode === '1day' ? '¿Qué día?' : 'Desde'}</label>
                <input type="date" value={filters.dateFrom} min={today()} onChange={(e) => setFilters(f => ({ ...f, dateFrom: e.target.value, dateTo: f.dayMode === '1day' ? e.target.value : f.dateTo < e.target.value ? e.target.value : f.dateTo }))} className="w-full input-theme rounded-xl px-4 py-3 text-sm" /></div>
              {filters.dayMode === 'multi' && (<div className="animate-fade-in"><label className="text-sm font-semibold block mb-2" style={{ color: 'var(--text-secondary)' }}>Hasta</label>
                <input type="date" value={filters.dateTo} min={filters.dateFrom} onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value }))} className="w-full input-theme rounded-xl px-4 py-3 text-sm" />
                {getDayCount() > 1 && <p className="text-xs font-semibold text-[#e63946] mt-2">{getDayCount()} días de aventura 🎉</p>}</div>)}
            </div>

            {/* Activity count */}
            <div>
              <label className="text-sm font-semibold block mb-3" style={{ color: 'var(--text-secondary)' }}>¿Cuántas actividades {getDayCount() > 1 ? 'por día' : ''}?</label>
              <div className="flex items-center gap-3 justify-center mb-2">
                <button onClick={() => setFilters(f => ({ ...f, activityCount: Math.max(2, f.activityCount - 1) }))} className="w-11 h-11 rounded-full border-2 flex items-center justify-center text-xl font-bold transition hover:border-[#e63946]" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>−</button>
                <span className="text-4xl font-black w-12 text-center tabular-nums">{filters.activityCount}</span>
                <button onClick={() => setFilters(f => ({ ...f, activityCount: Math.min(10, f.activityCount + 1) }))} className="w-11 h-11 rounded-full border-2 flex items-center justify-center text-xl font-bold transition hover:border-[#e63946]" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>+</button>
              </div>
              <div className="flex justify-center gap-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                <span>{filters.activityCount <= 3 ? '🧘 Relajado' : filters.activityCount <= 5 ? '⚡ Activo' : '🔥 Intenso'}</span>
                <span>·</span>
                <span>{getDayCount() > 1 ? `${filters.activityCount * getDayCount()} total en ${getDayCount()} días` : `${filters.activityCount} actividades`}</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: BUDGET */}
        {step === 'budget' && (
          <div className="animate-fade-in space-y-8">
            <div className="text-center"><span className="text-5xl block mb-4">💰</span><h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Tu presupuesto</h1><p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Por persona{getDayCount() > 1 ? `, para ${getDayCount()} días` : ''}</p></div>
            <div className="flex rounded-xl p-1 gap-1" style={{ background: 'var(--card)' }}>
              {([{ key: 'free' as const, label: '🆓 Gratis' }, { key: 'preset' as const, label: '💳 Rango' }, { key: 'custom' as const, label: '✏️ Exacto' }]).map(t => (
                <button key={t.key} onClick={() => setFilters(f => ({ ...f, budgetMode: t.key }))} className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all ${filters.budgetMode === t.key ? 'bg-[#e63946] text-white shadow-md' : ''}`} style={filters.budgetMode !== t.key ? { color: 'var(--text-secondary)' } : {}}>{t.label}</button>
              ))}
            </div>
            {filters.budgetMode === 'preset' && (<div className="grid grid-cols-2 gap-3 animate-fade-in">
              {[{ a: 300, l: 'Económico', i: '🪙' }, { a: 700, l: 'Moderado', i: '💳' }, { a: 1500, l: 'Premium', i: '💎' }, { a: 99999, l: 'Sin límite', i: '✨' }].map(o => (
                <button key={o.a} onClick={() => setFilters(f => ({ ...f, budgetPreset: o.a }))} className="p-4 rounded-2xl border-2 text-left transition-all hover:scale-[1.02]" style={sel(filters.budgetPreset === o.a)}>
                  <span className="text-2xl">{o.i}</span><p className="font-bold text-sm mt-1">{o.l}</p><p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{o.a === 99999 ? 'Sin tope' : `$${o.a.toLocaleString()}`}</p></button>
              ))}</div>)}
            {filters.budgetMode === 'custom' && (<div className="max-w-xs mx-auto animate-fade-in space-y-3">
              <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold" style={{ color: 'var(--text-tertiary)' }}>$</span>
                <input type="number" value={filters.budgetCustom} onChange={(e) => setFilters(f => ({ ...f, budgetCustom: e.target.value }))} placeholder="1000" className="w-full input-theme rounded-xl pl-10 pr-16 py-4 text-2xl font-black text-center" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>MXN</span></div></div>)}
            {filters.budgetMode === 'free' && <div className="text-center py-4 animate-fade-in"><span className="text-6xl block mb-3">🎉</span><p className="text-lg font-bold">Solo eventos gratuitos</p></div>}
          </div>
        )}

        {/* STEP 5: VIBES */}
        {step === 'vibes' && (
          <div className="animate-fade-in space-y-8">
            <div className="text-center"><span className="text-5xl block mb-4">🎨</span><h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">¿Qué te apetece?</h1><p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Cuanto más elijas, mejores rutas</p></div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {categories.map(cat => (
                <button key={cat.id} onClick={() => toggleCategory(cat.slug)} className={`p-4 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] ${filters.categories.includes(cat.slug) ? 'scale-[1.02]' : ''}`} style={sel(filters.categories.includes(cat.slug))}>
                  <div className="flex items-center justify-between"><span className="text-2xl">{cat.icon}</span>{filters.categories.includes(cat.slug) && <div className="w-5 h-5 bg-[#e63946] rounded-full flex items-center justify-center"><svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>}</div>
                  <p className="font-bold text-sm mt-2">{cat.name}</p></button>
              ))}
            </div>
            <button onClick={() => setFilters(f => ({ ...f, categories: categories.map(c => c.slug) }))} className="w-full py-2.5 rounded-xl text-sm font-medium" style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>Seleccionar todo</button>
            <div><p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>¿Cuánto caminar?</p>
              <div className="grid grid-cols-3 gap-3">{([{ value: 'poco' as const, label: 'Poco', icon: '🚗', desc: 'Transporte' }, { value: 'normal' as const, label: 'Normal', icon: '🚶', desc: 'Equilibrado' }, { value: 'mucho' as const, label: 'Mucho', icon: '🥾', desc: 'A pie' }]).map(opt => (
                <button key={opt.value} onClick={() => setFilters(f => ({ ...f, walkLevel: opt.value }))} className="p-3 rounded-xl border-2 text-center transition-all hover:scale-[1.02]" style={sel(filters.walkLevel === opt.value)}>
                  <span className="text-xl">{opt.icon}</span><p className="text-xs font-bold mt-1">{opt.label}</p></button>
              ))}</div></div>
          </div>
        )}

        {/* RESULTS */}
        {step === 'results' && (
          <div className="animate-fade-in space-y-6">
            <div className="text-center"><span className="text-5xl block mb-4">✨</span><h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Tu Day Perfecto</h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{results.length} rutas inteligentes en <strong>{selectedCityName}</strong></p></div>

            {loadingResults ? (
              <div className="space-y-6">{[1, 2, 3].map(i => <div key={i} className="rounded-2xl p-6 animate-pulse" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}><div className="h-5 w-48 rounded shimmer mb-4" /><div className="h-3 w-full rounded shimmer mb-6" /><div className="grid grid-cols-3 gap-3">{[1, 2, 3].map(j => <div key={j} className="aspect-[3/4] rounded-xl shimmer" />)}</div></div>)}</div>
            ) : results.length === 0 ? (
              <div className="text-center py-12"><span className="text-5xl block mb-4">😢</span><h2 className="text-xl font-bold mb-2">No encontramos rutas</h2><button onClick={() => setStep('vibes')} className="btn-primary px-6 py-3 text-sm mt-4">Cambiar filtros</button></div>
            ) : (
              <div className="space-y-8">
                {results.map((sr, ri) => (
                  <div key={ri} className="rounded-2xl overflow-hidden border transition-all" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                    <div className="p-5">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div><h3 className="font-black text-lg">{sr.emoji} {sr.label}</h3><p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{sr.events.length} actividades · {sr.totalDistanceKm.toFixed(1)} km · ~{Math.round(sr.totalDurationMin / 60)}h</p></div>
                        <div className="text-right"><p className={`text-xl font-black ${sr.totalCost === 0 ? 'text-green-500' : ''}`}>{sr.totalCost === 0 ? 'GRATIS' : `${cs(sr.events[0])}${sr.totalCost.toFixed(0)}`}</p>
                          {sr.totalCost > 0 && filters.people > 1 && <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{cs(sr.events[0])}{Math.round(sr.totalCost / filters.people)}/persona</p>}</div>
                      </div>

                      {/* Justification */}
                      <div className="p-3 rounded-xl mb-4 text-xs leading-relaxed" style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}>
                        💡 <strong>¿Por qué {sr.events.length} actividades?</strong> {sr.justification}
                      </div>

                      {/* Transport tips */}
                      {sr.tips.length > 0 && (
                        <div className="space-y-1.5 mb-4">
                          {sr.tips.map((tip, ti) => (
                            <div key={ti} className="flex items-start gap-2 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                              <span className="shrink-0 mt-0.5">🚇</span>
                              <span>{tip}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Timeline */}
                      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-2">
                        {sr.events.map((ev, ei) => (
                          <div key={ev.id} className="flex items-center shrink-0">
                            <div className="flex items-center gap-1.5 rounded-lg px-2 py-1" style={{ background: 'var(--surface-2)' }}>
                              <div className="w-4 h-4 bg-[#e63946] rounded-full flex items-center justify-center text-[8px] font-bold text-white">{ei + 1}</div>
                              <span className="text-[11px] font-medium truncate max-w-[80px]">{ev.title}</span>
                            </div>
                            {ei < sr.events.length - 1 && <svg className="w-2.5 h-2.5 mx-0.5 shrink-0" style={{ color: 'var(--text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Cards */}
                    <div className="px-5 pb-3"><div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">{sr.events.map(ev => <div key={ev.id} className="shrink-0 w-[140px]"><EventCard event={ev} /></div>)}</div></div>

                    {/* CTA */}
                    <div className="p-5 pt-2">
                      <button onClick={() => handleSelectRoute(ri)} disabled={creatingPlan} className="w-full btn-primary py-3.5 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                        {creatingPlan && selectedRoute === ri ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                        {creatingPlan && selectedRoute === ri ? 'Creando tu Day...' : sr.totalCost === 0 ? 'Reservar gratis' : `Crear Day · ${cs(sr.events[0])}${sr.totalCost.toFixed(0)}`}
                      </button>
                    </div>
                  </div>
                ))}

                <button onClick={generateRoutes} disabled={loadingResults} className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2" style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Regenerar con diferentes combinaciones
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      {step !== 'results' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-40" style={{ background: 'var(--nav-bg)', backdropFilter: 'blur(20px)', borderTop: '1px solid var(--border)' }}>
          <div className="max-w-2xl mx-auto"><button onClick={goNext} disabled={!canNext()} className="w-full py-4 btn-primary text-sm disabled:opacity-20 disabled:transform-none disabled:shadow-none">{step === 'vibes' ? '✨ Generar mi Day perfecto' : 'Continuar'}</button></div>
        </div>
      )}
    </div>
  );
}
