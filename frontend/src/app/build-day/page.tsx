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
type DayMode = '1day' | 'multi';

interface Filters {
  group: GroupType | null;
  people: number;
  locationMode: LocationMode | null;
  city: string | null;
  citySearch: string;
  dayMode: DayMode;
  dateFrom: string;
  dateTo: string;
  budgetMode: 'free' | 'preset' | 'custom';
  budgetPreset: number | null;
  budgetCustom: string;
  categories: string[];
  walkLevel: 'poco' | 'normal' | 'mucho' | null;
}

const GROUP_OPTIONS: { value: GroupType; label: string; icon: string; desc: string }[] = [
  { value: 'solo', label: 'Solo yo', icon: '🧑', desc: 'Un día para mí' },
  { value: 'pareja', label: 'En pareja', icon: '💑', desc: 'Romántico y especial' },
  { value: 'amigos', label: 'Con amigos', icon: '👯', desc: 'Diversión en grupo' },
  { value: 'familia', label: 'En familia', icon: '👨‍👩‍👧‍👦', desc: 'Todas las edades' },
];

const WALK_OPTIONS: { value: 'poco' | 'normal' | 'mucho'; label: string; icon: string; desc: string }[] = [
  { value: 'poco', label: 'Poco', icon: '🚗', desc: 'Prefiero transporte' },
  { value: 'normal', label: 'Normal', icon: '🚶', desc: 'Equilibrado' },
  { value: 'mucho', label: 'Mucho', icon: '🥾', desc: 'Me encanta caminar' },
];

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
    categories: [], walkLevel: null,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [results, setResults] = useState<Event[][]>([]);
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
    }, () => {
      showToast('No pudimos detectar tu ubicación', 'error');
      setGeoDetecting(false);
      setFilters(f => ({ ...f, locationMode: 'trip' }));
    });
  }

  const filteredCities = cities.filter(c =>
    !filters.citySearch || c.name.toLowerCase().includes(filters.citySearch.toLowerCase()) || c.country.toLowerCase().includes(filters.citySearch.toLowerCase())
  );

  const steps: Step[] = ['who', 'where', 'when', 'budget', 'vibes', 'results'];
  const stepIndex = steps.indexOf(step);
  const totalSteps = steps.length - 1; // exclude results

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

  const goNext = async () => {
    const idx = steps.indexOf(step);
    if (idx < steps.length - 1) {
      const next = steps[idx + 1];
      setStep(next);
      if (next === 'results') await generateRoutes();
    }
  };
  const goBack = () => { const idx = steps.indexOf(step); if (idx > 0) setStep(steps[idx - 1]); };

  const toggleCategory = (slug: string) => {
    setFilters(f => ({ ...f, categories: f.categories.includes(slug) ? f.categories.filter(c => c !== slug) : [...f.categories, slug] }));
  };

  const getMaxPrice = (): number | undefined => {
    if (filters.budgetMode === 'free') return 0;
    if (filters.budgetMode === 'custom') return Number(filters.budgetCustom) || undefined;
    return filters.budgetPreset || undefined;
  };

  const getDayCount = (): number => {
    if (filters.dayMode === '1day') return 1;
    const from = new Date(filters.dateFrom);
    const to = new Date(filters.dateTo);
    return Math.max(1, Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  };

  async function generateRoutes() {
    setLoadingResults(true);
    try {
      const maxPrice = getMaxPrice();
      const dayCount = getDayCount();
      const allEvents: Event[] = [];

      for (const catSlug of filters.categories) {
        const res = await getEvents({ city: filters.city || undefined, category: catSlug, maxPrice, status: 'PUBLISHED', limit: 15, sortBy: 'rating' });
        allEvents.push(...(res.data || []));
      }
      if (allEvents.length < 12) {
        const res = await getEvents({ city: filters.city || undefined, maxPrice, status: 'PUBLISHED', limit: 24, sortBy: 'popularity' });
        for (const ev of (res.data || [])) { if (!allEvents.find(e => e.id === ev.id)) allEvents.push(ev); }
      }

      const unique = allEvents.filter((e, i, a) => a.findIndex(x => x.id === e.id) === i);
      const perDay = filters.group === 'solo' ? 3 : filters.group === 'pareja' ? 3 : 4;
      const totalActivities = perDay * dayCount;
      const budgetLimit = maxPrice || 999999;
      const routes: Event[][] = [];

      for (let r = 0; r < 3; r++) {
        const shuffled = [...unique].sort(() => Math.random() - 0.5);
        const route: Event[] = [];
        let totalCost = 0;
        for (const ev of shuffled) {
          if (route.length >= totalActivities) break;
          if (totalCost + ev.price > budgetLimit && filters.budgetMode !== 'preset') continue;
          if (filters.budgetMode !== 'free' && route.length > 0 && route[route.length - 1].category?.slug === ev.category?.slug && route.length < totalActivities - 1) continue;
          route.push(ev);
          totalCost += ev.price;
        }
        if (route.length >= 2) routes.push(route);
      }
      setResults(routes);
    } catch { showToast('Error al generar rutas', 'error'); }
    finally { setLoadingResults(false); }
  }

  async function handleSelectRoute(ri: number) {
    if (!user) { router.push('/auth/login?redirect=/build-day'); return; }
    setSelectedRoute(ri); setCreatingPlan(true);
    try {
      const route = results[ri];
      const dayCount = getDayCount();
      const label = filters.group === 'pareja' ? 'Romántico' : filters.group === 'amigos' ? 'con Amigos' : filters.group === 'familia' ? 'Familiar' : 'Perfecto';
      const plan = await createPlan({ title: `Mi Day ${label}${dayCount > 1 ? ` (${dayCount} días)` : ''}`, planDate: filters.dateFrom });
      const perDay = Math.ceil(route.length / dayCount);
      const times = ['09:00', '11:30', '14:00', '16:30', '19:00', '21:30'];
      for (let i = 0; i < route.length; i++) {
        await addPlanItem(plan.id, { eventId: route[i].id, startTime: times[i % times.length] || `${9 + (i % perDay) * 2}:00`, endTime: times[i % times.length] ? undefined : undefined });
      }
      showToast(`Day creado con ${route.length} actividades`);
      router.push(`/plans/${plan.id}`);
    } catch (err) { showToast(err instanceof Error ? err.message : 'Error', 'error'); }
    finally { setCreatingPlan(false); setSelectedRoute(null); }
  }

  const getRouteCost = (r: Event[]) => r.reduce((s, e) => s + e.price, 0);
  const getFreeCount = (r: Event[]) => r.filter(e => e.price === 0).length;
  const cs = (e: Event) => e.currency === 'GBP' ? '£' : e.currency === 'EUR' ? '€' : '$';
  const selectedCityName = cities.find(c => c.slug === filters.city)?.name || '';

  // Selection card helper
  const selCard = (selected: boolean) => ({
    background: selected ? 'var(--card)' : 'var(--surface)',
    borderColor: selected ? '#e63946' : 'var(--border)',
  });

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--bg)' }}>
      {/* Progress */}
      <div className="sticky top-16 z-40" style={{ background: 'var(--nav-bg)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <button onClick={goBack} className={`text-sm font-medium flex items-center gap-1 transition ${stepIndex === 0 ? 'opacity-0 pointer-events-none' : ''}`} style={{ color: 'var(--text-secondary)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Atrás
            </button>
            <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: 'var(--text-tertiary)' }}>
              {step === 'results' ? '✨ Resultados' : `${stepIndex + 1} / ${totalSteps}`}
            </span>
            <Link href="/" className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Salir</Link>
          </div>
          <div className="flex gap-1">
            {steps.slice(0, -1).map((_, i) => (
              <div key={i} className="flex-1 h-1 rounded-full transition-all duration-500" style={{ background: i <= stepIndex ? '#e63946' : 'var(--border)' }} />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* ─── STEP 1: WHO ─── */}
        {step === 'who' && (
          <div className="animate-fade-in space-y-8">
            <div className="text-center">
              <span className="text-5xl block mb-4">👋</span>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">¿Con quién vas?</h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Personalizaremos todo para tu grupo</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {GROUP_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setFilters(f => ({ ...f, group: opt.value, people: opt.value === 'solo' ? 1 : opt.value === 'pareja' ? 2 : 4 }))}
                  className={`p-5 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] ${filters.group === opt.value ? 'border-[#e63946] shadow-lg shadow-[#e63946]/10 scale-[1.02]' : ''}`}
                  style={selCard(filters.group === opt.value)}>
                  <span className="text-3xl">{opt.icon}</span>
                  <p className="font-bold text-sm mt-2">{opt.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{opt.desc}</p>
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

        {/* ─── STEP 2: WHERE ─── */}
        {step === 'where' && (
          <div className="animate-fade-in space-y-6">
            <div className="text-center">
              <span className="text-5xl block mb-4">📍</span>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">¿Dónde será?</h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Podemos detectar tu ubicación o elige tu destino</p>
            </div>

            {/* Location mode */}
            {!filters.locationMode ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button onClick={detectLocation} disabled={geoDetecting}
                  className="p-5 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] hover:border-[#e63946]" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                  <div className="flex items-center gap-3">
                    {geoDetecting ? <div className="w-8 h-8 border-2 border-[#e63946] border-t-transparent rounded-full animate-spin" /> : <span className="text-3xl">📡</span>}
                    <div>
                      <p className="font-bold text-sm">{geoDetecting ? 'Detectando...' : 'Usar mi ubicación'}</p>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Detectamos la ciudad más cercana</p>
                    </div>
                  </div>
                </button>
                <button onClick={() => setFilters(f => ({ ...f, locationMode: 'trip' }))}
                  className="p-5 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] hover:border-[#e63946]" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">✈️</span>
                    <div>
                      <p className="font-bold text-sm">Es un viaje</p>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Busco eventos en otro lugar</p>
                    </div>
                  </div>
                </button>
              </div>
            ) : (
              <>
                {/* Detected or search */}
                {filters.locationMode === 'current' && filters.city && (
                  <div className="p-4 rounded-2xl border-2 border-[#e63946] flex items-center gap-3 animate-fade-in" style={{ background: 'var(--card)' }}>
                    <span className="text-2xl">📍</span>
                    <div className="flex-1">
                      <p className="font-bold text-sm">Estás en <span className="text-[#e63946]">{selectedCityName}</span></p>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Detectado por tu ubicación</p>
                    </div>
                    <button onClick={() => setFilters(f => ({ ...f, locationMode: 'trip', city: null }))} className="text-xs font-medium text-[#e63946] hover:underline">Cambiar</button>
                  </div>
                )}

                {(filters.locationMode === 'trip' || !filters.city) && (
                  <div className="space-y-4 animate-fade-in">
                    {/* Search bar */}
                    <div className="relative">
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      <input
                        value={filters.citySearch} onChange={(e) => setFilters(f => ({ ...f, citySearch: e.target.value }))}
                        placeholder="Buscar ciudad o país..."
                        className="w-full input-theme rounded-2xl pl-12 pr-4 py-4 text-sm"
                        autoFocus
                      />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {filteredCities.map(city => (
                        <button key={city.id} onClick={() => setFilters(f => ({ ...f, city: city.slug }))}
                          className={`relative overflow-hidden rounded-2xl border-2 aspect-[4/3] group transition-all hover:scale-[1.02]`}
                          style={{ borderColor: filters.city === city.slug ? '#e63946' : 'var(--border)' }}>
                          {city.image && <img src={city.image} alt={city.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                          <div className="absolute bottom-3 left-3 text-white"><p className="font-bold text-sm">{city.name}</p><p className="text-[10px] opacity-80">{city.country}</p></div>
                          {filters.city === city.slug && <div className="absolute top-2 right-2 w-6 h-6 bg-[#e63946] rounded-full flex items-center justify-center"><svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ─── STEP 3: WHEN ─── */}
        {step === 'when' && (
          <div className="animate-fade-in space-y-8">
            <div className="text-center">
              <span className="text-5xl block mb-4">📅</span>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">¿Cuándo será?</h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>¿Un solo día o un viaje de varios días?</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setFilters(f => ({ ...f, dayMode: '1day', dateTo: f.dateFrom }))}
                className="p-5 rounded-2xl border-2 text-left transition-all hover:scale-[1.02]"
                style={selCard(filters.dayMode === '1day')}>
                <span className="text-3xl">☀️</span>
                <p className="font-bold text-sm mt-2">Un solo día</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>El Day perfecto</p>
              </button>
              <button onClick={() => setFilters(f => ({ ...f, dayMode: 'multi' }))}
                className="p-5 rounded-2xl border-2 text-left transition-all hover:scale-[1.02]"
                style={selCard(filters.dayMode === 'multi')}>
                <span className="text-3xl">🗓️</span>
                <p className="font-bold text-sm mt-2">Varios días</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Viaje completo</p>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold block mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {filters.dayMode === '1day' ? '¿Qué día?' : 'Fecha de inicio'}
                </label>
                <input type="date" value={filters.dateFrom} min={today()}
                  onChange={(e) => setFilters(f => ({ ...f, dateFrom: e.target.value, dateTo: f.dayMode === '1day' ? e.target.value : f.dateTo < e.target.value ? e.target.value : f.dateTo }))}
                  className="w-full input-theme rounded-xl px-4 py-3 text-sm" />
              </div>
              {filters.dayMode === 'multi' && (
                <div className="animate-fade-in">
                  <label className="text-sm font-semibold block mb-2" style={{ color: 'var(--text-secondary)' }}>Fecha de fin</label>
                  <input type="date" value={filters.dateTo} min={filters.dateFrom}
                    onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value }))}
                    className="w-full input-theme rounded-xl px-4 py-3 text-sm" />
                  {getDayCount() > 1 && (
                    <p className="text-xs font-semibold text-[#e63946] mt-2">{getDayCount()} días de aventura 🎉</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── STEP 4: BUDGET ─── */}
        {step === 'budget' && (
          <div className="animate-fade-in space-y-8">
            <div className="text-center">
              <span className="text-5xl block mb-4">💰</span>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Tu presupuesto</h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Por persona, para {getDayCount() > 1 ? `${getDayCount()} días` : 'todo el Day'}</p>
            </div>

            {/* Budget tabs */}
            <div className="flex rounded-xl p-1 gap-1" style={{ background: 'var(--card)' }}>
              {[
                { key: 'free' as const, label: '🆓 Solo gratis' },
                { key: 'preset' as const, label: '💳 Elegir rango' },
                { key: 'custom' as const, label: '✏️ Personalizado' },
              ].map(t => (
                <button key={t.key} onClick={() => setFilters(f => ({ ...f, budgetMode: t.key }))}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all ${filters.budgetMode === t.key ? 'bg-[#e63946] text-white shadow-md' : ''}`}
                  style={filters.budgetMode !== t.key ? { color: 'var(--text-secondary)' } : {}}>
                  {t.label}
                </button>
              ))}
            </div>

            {filters.budgetMode === 'preset' && (
              <div className="grid grid-cols-2 gap-3 animate-fade-in">
                {[
                  { amount: 300, label: 'Económico', desc: 'Lo esencial', icon: '🪙' },
                  { amount: 700, label: 'Moderado', desc: 'Buen balance', icon: '💳' },
                  { amount: 1500, label: 'Premium', desc: 'Sin escatimar', icon: '💎' },
                  { amount: 99999, label: 'Sin límite', desc: 'Lo mejor de lo mejor', icon: '✨' },
                ].map(opt => (
                  <button key={opt.amount} onClick={() => setFilters(f => ({ ...f, budgetPreset: opt.amount }))}
                    className="p-4 rounded-2xl border-2 text-left transition-all hover:scale-[1.02]"
                    style={selCard(filters.budgetPreset === opt.amount)}>
                    <span className="text-2xl">{opt.icon}</span>
                    <p className="font-bold text-sm mt-1">{opt.label}</p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {opt.amount === 99999 ? 'Sin tope' : `Hasta $${opt.amount.toLocaleString()}`}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {filters.budgetMode === 'custom' && (
              <div className="max-w-xs mx-auto animate-fade-in space-y-3">
                <label className="text-sm font-semibold block" style={{ color: 'var(--text-secondary)' }}>¿Cuánto quieres gastar?</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold" style={{ color: 'var(--text-tertiary)' }}>$</span>
                  <input type="number" value={filters.budgetCustom} onChange={(e) => setFilters(f => ({ ...f, budgetCustom: e.target.value }))}
                    placeholder="1000" min="0" step="50"
                    className="w-full input-theme rounded-xl pl-10 pr-16 py-4 text-2xl font-black text-center" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>MXN</span>
                </div>
                {filters.budgetCustom && (
                  <p className="text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
                    ${Number(filters.budgetCustom).toLocaleString()} MXN por persona
                  </p>
                )}
              </div>
            )}

            {filters.budgetMode === 'free' && (
              <div className="text-center py-4 animate-fade-in">
                <span className="text-6xl block mb-3">🎉</span>
                <p className="text-lg font-bold">¡Perfecto!</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Buscaremos solo eventos gratuitos</p>
              </div>
            )}
          </div>
        )}

        {/* ─── STEP 5: VIBES ─── */}
        {step === 'vibes' && (
          <div className="animate-fade-in space-y-8">
            <div className="text-center">
              <span className="text-5xl block mb-4">🎨</span>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">¿Qué te apetece?</h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Elige todo lo que quieras — cuanto más, mejor</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {categories.map(cat => (
                <button key={cat.id} onClick={() => toggleCategory(cat.slug)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] ${filters.categories.includes(cat.slug) ? 'border-[#e63946] shadow-lg shadow-[#e63946]/10 scale-[1.02]' : ''}`}
                  style={selCard(filters.categories.includes(cat.slug))}>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{cat.icon}</span>
                    {filters.categories.includes(cat.slug) && (
                      <div className="w-5 h-5 bg-[#e63946] rounded-full flex items-center justify-center"><svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
                    )}
                  </div>
                  <p className="font-bold text-sm mt-2">{cat.name}</p>
                </button>
              ))}
            </div>

            <button onClick={() => setFilters(f => ({ ...f, categories: categories.map(c => c.slug) }))}
              className="w-full py-2.5 rounded-xl text-sm font-medium transition" style={{ color: 'var(--text-secondary)', background: 'var(--card)', border: '1px solid var(--border)' }}>
              Seleccionar todo
            </button>

            <div>
              <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>¿Cuánto caminar?</p>
              <div className="grid grid-cols-3 gap-3">
                {WALK_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setFilters(f => ({ ...f, walkLevel: opt.value }))}
                    className="p-3 rounded-xl border-2 text-center transition-all hover:scale-[1.02]"
                    style={selCard(filters.walkLevel === opt.value)}>
                    <span className="text-xl">{opt.icon}</span>
                    <p className="text-xs font-bold mt-1">{opt.label}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── RESULTS ─── */}
        {step === 'results' && (
          <div className="animate-fade-in space-y-6">
            <div className="text-center">
              <span className="text-5xl block mb-4">✨</span>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Tu Day Perfecto</h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {results.length} rutas en <strong>{selectedCityName}</strong>
                {' · '}{getDayCount() > 1 ? `${getDayCount()} días` : '1 día'}
                {' · '}{filters.group === 'solo' ? 'solo' : filters.group === 'pareja' ? 'en pareja' : `${filters.people} personas`}
              </p>
            </div>

            {/* Summary chips */}
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                selectedCityName,
                getDayCount() > 1 ? `${getDayCount()} días` : filters.dateFrom,
                filters.budgetMode === 'free' ? 'Gratis' : filters.budgetMode === 'custom' ? `$${Number(filters.budgetCustom).toLocaleString()}` : filters.budgetPreset === 99999 ? 'Sin límite' : `Hasta $${(filters.budgetPreset || 0).toLocaleString()}`,
                ...filters.categories.slice(0, 3).map(s => categories.find(c => c.slug === s)?.name || s),
              ].filter(Boolean).map((chip, i) => (
                <span key={i} className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>{chip}</span>
              ))}
            </div>

            {loadingResults ? (
              <div className="space-y-6">{[1, 2, 3].map(i => (
                <div key={i} className="rounded-2xl p-6 animate-pulse" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <div className="h-5 w-40 rounded shimmer mb-4" />
                  <div className="grid grid-cols-3 gap-3">{[1, 2, 3].map(j => <div key={j} className="aspect-[3/4] rounded-xl shimmer" />)}</div>
                </div>
              ))}</div>
            ) : results.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-5xl block mb-4">😢</span>
                <h2 className="text-xl font-bold mb-2">No encontramos rutas</h2>
                <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Intenta con menos filtros</p>
                <button onClick={() => setStep('vibes')} className="btn-primary px-6 py-3 text-sm">Cambiar filtros</button>
              </div>
            ) : (
              <div className="space-y-6">
                {results.map((route, ri) => {
                  const cost = getRouteCost(route);
                  const freeC = getFreeCount(route);
                  const cur = route[0] ? cs(route[0]) : '$';
                  return (
                    <div key={ri} className="rounded-2xl overflow-hidden border transition-all hover:shadow-lg" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                      <div className="p-5 pb-3">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-black text-base">{ri === 0 ? '🏆 Recomendada' : ri === 1 ? '⭐ Popular' : '🎯 Económica'}</h3>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{route.length} actividades{freeC > 0 ? ` · ${freeC} gratis` : ''}{getDayCount() > 1 ? ` · ${getDayCount()} días` : ''}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-xl font-black ${cost === 0 ? 'text-green-500' : ''}`}>{cost === 0 ? 'GRATIS' : `${cur}${cost.toFixed(0)}`}</p>
                            {cost > 0 && filters.people > 1 && <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>total · {cur}{Math.round(cost / filters.people)}/persona</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-1 mb-3">
                          {route.map((ev, ei) => (
                            <div key={ev.id} className="flex items-center shrink-0">
                              <div className="flex items-center gap-1.5 rounded-lg px-2 py-1" style={{ background: 'var(--surface-2)' }}>
                                <div className="w-4 h-4 bg-[#e63946] rounded-full flex items-center justify-center text-[8px] font-bold text-white">{ei + 1}</div>
                                <span className="text-[11px] font-medium truncate max-w-[80px]">{ev.title}</span>
                              </div>
                              {ei < route.length - 1 && <svg className="w-2.5 h-2.5 mx-0.5 shrink-0" style={{ color: 'var(--text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="px-5 pb-3"><div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">{route.map(ev => <div key={ev.id} className="shrink-0 w-[140px]"><EventCard event={ev} /></div>)}</div></div>
                      <div className="p-5 pt-2">
                        <button onClick={() => handleSelectRoute(ri)} disabled={creatingPlan}
                          className="w-full btn-primary py-3.5 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                          {creatingPlan && selectedRoute === ri ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                          {creatingPlan && selectedRoute === ri ? 'Creando tu Day...' : cost === 0 ? 'Reservar gratis' : `Seleccionar · ${cur}${cost.toFixed(0)}`}
                        </button>
                      </div>
                    </div>
                  );
                })}
                <button onClick={generateRoutes} disabled={loadingResults} className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition" style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Generar nuevas rutas
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sticky bottom CTA */}
      {step !== 'results' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-40 safe-area-bottom" style={{ background: 'var(--nav-bg)', backdropFilter: 'blur(20px)', borderTop: '1px solid var(--border)' }}>
          <div className="max-w-2xl mx-auto">
            <button onClick={goNext} disabled={!canNext()}
              className="w-full py-4 btn-primary text-sm disabled:opacity-20 disabled:transform-none disabled:shadow-none transition-all">
              {step === 'vibes' ? '✨ Generar mi Day perfecto' : 'Continuar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
