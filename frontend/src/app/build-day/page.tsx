'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getEvents, getCategories, getCities, Event, Category, City, createPlan, addPlanItem } from '@/lib/api';
import { useToast } from '@/components/Toast';
import EventCard from '@/components/EventCard';

type Step = 'who' | 'budget' | 'city' | 'vibes' | 'results';
type GroupType = 'solo' | 'pareja' | 'amigos' | 'familia';
type BudgetType = 'free' | 'low' | 'mid' | 'any';

interface Filters {
  group: GroupType | null;
  people: number;
  budget: BudgetType | null;
  city: string | null;
  categories: string[];
  walkLevel: 'poco' | 'normal' | 'mucho' | null;
}

const GROUP_OPTIONS: { value: GroupType; label: string; icon: string; desc: string }[] = [
  { value: 'solo', label: 'Solo', icon: '🧑', desc: 'Un día para mí' },
  { value: 'pareja', label: 'En pareja', icon: '💑', desc: 'Romántico y especial' },
  { value: 'amigos', label: 'Con amigos', icon: '👯', desc: 'Diversión en grupo' },
  { value: 'familia', label: 'En familia', icon: '👨‍👩‍👧‍👦', desc: 'Para todas las edades' },
];

const BUDGET_OPTIONS: { value: BudgetType; label: string; icon: string; range: string }[] = [
  { value: 'free', label: 'Solo gratis', icon: '🆓', range: '$0' },
  { value: 'low', label: 'Económico', icon: '💰', range: 'Hasta $300' },
  { value: 'mid', label: 'Moderado', icon: '💳', range: 'Hasta $1,000' },
  { value: 'any', label: 'Sin límite', icon: '✨', range: 'Lo mejor' },
];

const WALK_OPTIONS: { value: 'poco' | 'normal' | 'mucho'; label: string; icon: string }[] = [
  { value: 'poco', label: 'Poco caminar', icon: '🚗' },
  { value: 'normal', label: 'Normal', icon: '🚶' },
  { value: 'mucho', label: 'Mucho caminar', icon: '🥾' },
];

export default function BuildDayPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [step, setStep] = useState<Step>('who');
  const [filters, setFilters] = useState<Filters>({
    group: null, people: 2, budget: null, city: null, categories: [], walkLevel: null,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [results, setResults] = useState<Event[][]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([getCategories(), getCities()]).then(([cats, cits]) => {
      setCategories(cats);
      setCities(cits);
      // Auto-detect city
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          const { latitude, longitude } = pos.coords;
          // Simple nearest city detection
          const cityCoords: Record<string, [number, number]> = {
            cdmx: [19.4326, -99.1332], madrid: [40.4168, -3.7038],
            barcelona: [41.3874, 2.1686], london: [51.5074, -0.1278],
            'new-york': [40.7128, -74.006], paris: [48.8566, 2.3522],
          };
          let nearest = '';
          let minDist = Infinity;
          for (const [slug, [lat, lng]] of Object.entries(cityCoords)) {
            const d = Math.sqrt((latitude - lat) ** 2 + (longitude - lng) ** 2);
            if (d < minDist) { minDist = d; nearest = slug; }
          }
          if (nearest) setFilters(f => ({ ...f, city: nearest }));
        }, () => {});
      }
    }).catch(() => {});
  }, []);

  const steps: Step[] = ['who', 'budget', 'city', 'vibes', 'results'];
  const stepIndex = steps.indexOf(step);
  const canNext = () => {
    if (step === 'who') return !!filters.group;
    if (step === 'budget') return !!filters.budget;
    if (step === 'city') return !!filters.city;
    if (step === 'vibes') return filters.categories.length > 0;
    return false;
  };

  const goNext = async () => {
    const idx = steps.indexOf(step);
    if (idx < steps.length - 1) {
      const next = steps[idx + 1];
      setStep(next);
      if (next === 'results') await generateRoutes();
    }
  };

  const goBack = () => {
    const idx = steps.indexOf(step);
    if (idx > 0) setStep(steps[idx - 1]);
  };

  const toggleCategory = (slug: string) => {
    setFilters(f => ({
      ...f,
      categories: f.categories.includes(slug)
        ? f.categories.filter(c => c !== slug)
        : [...f.categories, slug],
    }));
  };

  async function generateRoutes() {
    setLoadingResults(true);
    try {
      const maxPrice = filters.budget === 'free' ? 0 : filters.budget === 'low' ? 300 : filters.budget === 'mid' ? 1000 : undefined;
      const allEvents: Event[] = [];

      // Fetch events for each selected category
      for (const catSlug of filters.categories) {
        const res = await getEvents({
          city: filters.city || undefined,
          category: catSlug,
          maxPrice,
          status: 'PUBLISHED',
          limit: 12,
          sortBy: 'rating',
        });
        allEvents.push(...(res.data || []));
      }

      // Also fetch general events for the city
      if (allEvents.length < 10) {
        const res = await getEvents({
          city: filters.city || undefined,
          maxPrice,
          status: 'PUBLISHED',
          limit: 20,
          sortBy: 'popularity',
        });
        for (const ev of (res.data || [])) {
          if (!allEvents.find(e => e.id === ev.id)) allEvents.push(ev);
        }
      }

      // Remove duplicates
      const unique = allEvents.filter((e, i, a) => a.findIndex(x => x.id === e.id) === i);

      // Generate 3 different route suggestions
      const routes: Event[][] = [];
      const numActivities = filters.group === 'solo' ? 3 : filters.group === 'pareja' ? 3 : 4;

      for (let r = 0; r < 3; r++) {
        const shuffled = [...unique].sort(() => Math.random() - 0.5);
        const route: Event[] = [];
        let totalCost = 0;
        const budgetLimit = maxPrice || 99999;

        for (const ev of shuffled) {
          if (route.length >= numActivities) break;
          if (totalCost + ev.price > budgetLimit && filters.budget !== 'any') continue;
          // Ensure variety - don't repeat categories
          if (route.length > 0 && route[route.length - 1].category?.slug === ev.category?.slug && route.length < numActivities - 1) continue;
          route.push(ev);
          totalCost += ev.price;
        }

        if (route.length >= 2) routes.push(route);
      }

      setResults(routes);
    } catch {
      showToast('Error al generar rutas', 'error');
    } finally {
      setLoadingResults(false);
    }
  }

  async function handleSelectRoute(routeIndex: number) {
    if (!user) { router.push('/auth/login?redirect=/build-day'); return; }
    setSelectedRoute(routeIndex);
    setCreatingPlan(true);
    try {
      const route = results[routeIndex];
      const totalCost = route.reduce((s, e) => s + e.price, 0);
      const plan = await createPlan({
        title: `Mi Day ${filters.group === 'pareja' ? 'Romántico' : filters.group === 'amigos' ? 'con Amigos' : filters.group === 'familia' ? 'Familiar' : 'Perfecto'}`,
        planDate: new Date().toISOString().split('T')[0],
      });

      const times = ['10:00', '12:00', '14:30', '17:00', '19:30', '21:00'];
      for (let i = 0; i < route.length; i++) {
        await addPlanItem(plan.id, {
          eventId: route[i].id,
          startTime: times[i] || `${10 + i * 2}:00`,
          endTime: times[i] ? `${parseInt(times[i]) + 2}:00` : `${12 + i * 2}:00`,
        });
      }

      showToast('Day creado exitosamente');
      router.push(`/plans/${plan.id}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al crear Day', 'error');
    } finally {
      setCreatingPlan(false);
      setSelectedRoute(null);
    }
  }

  const getRouteCost = (route: Event[]) => route.reduce((s, e) => s + e.price, 0);
  const getFreeCount = (route: Event[]) => route.filter(e => e.price === 0).length;
  const cs = (e: Event) => e.currency === 'GBP' ? '£' : e.currency === 'EUR' ? '€' : '$';

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Progress bar */}
      <div className="sticky top-16 z-40 border-b" style={{ background: 'var(--nav-bg)', backdropFilter: 'blur(20px)', borderColor: 'var(--border)' }}>
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <button onClick={goBack} className={`text-sm font-medium transition ${stepIndex === 0 ? 'opacity-0 pointer-events-none' : ''}`} style={{ color: 'var(--text-secondary)' }}>
              <svg className="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Atrás
            </button>
            <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
              {step === 'results' ? 'Resultados' : `Paso ${stepIndex + 1} de 4`}
            </span>
            <Link href="/" className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Cancelar</Link>
          </div>
          <div className="w-full h-1 rounded-full" style={{ background: 'var(--border)' }}>
            <div className="h-full bg-[#e63946] rounded-full transition-all duration-500" style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* STEP 1: Who */}
        {step === 'who' && (
          <div className="animate-fade-in">
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">¿Con quién vas?</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Armaremos el Day perfecto según tu grupo</p>
            </div>
            <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
              {GROUP_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFilters(f => ({ ...f, group: opt.value, people: opt.value === 'solo' ? 1 : opt.value === 'pareja' ? 2 : 4 }))}
                  className={`p-5 rounded-2xl border-2 text-left transition-all ${filters.group === opt.value ? 'border-[#e63946] shadow-lg shadow-[#e63946]/10' : 'hover:border-[var(--text-tertiary)]'}`}
                  style={{ background: filters.group === opt.value ? 'var(--card)' : 'var(--surface)', borderColor: filters.group === opt.value ? '#e63946' : 'var(--border)' }}
                >
                  <span className="text-3xl mb-2 block">{opt.icon}</span>
                  <p className="font-bold text-sm">{opt.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{opt.desc}</p>
                </button>
              ))}
            </div>
            {(filters.group === 'amigos' || filters.group === 'familia') && (
              <div className="mt-6 max-w-xs mx-auto animate-fade-in">
                <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>¿Cuántas personas?</label>
                <div className="flex items-center gap-4 justify-center">
                  <button onClick={() => setFilters(f => ({ ...f, people: Math.max(2, f.people - 1) }))} className="w-10 h-10 rounded-xl border flex items-center justify-center text-lg font-bold" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>−</button>
                  <span className="text-2xl font-black w-8 text-center">{filters.people}</span>
                  <button onClick={() => setFilters(f => ({ ...f, people: Math.min(20, f.people + 1) }))} className="w-10 h-10 rounded-xl border flex items-center justify-center text-lg font-bold" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>+</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Budget */}
        {step === 'budget' && (
          <div className="animate-fade-in">
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">¿Cuál es tu presupuesto?</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Por persona, para todo el Day</p>
            </div>
            <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
              {BUDGET_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFilters(f => ({ ...f, budget: opt.value }))}
                  className={`p-5 rounded-2xl border-2 text-left transition-all ${filters.budget === opt.value ? 'border-[#e63946] shadow-lg shadow-[#e63946]/10' : 'hover:border-[var(--text-tertiary)]'}`}
                  style={{ background: filters.budget === opt.value ? 'var(--card)' : 'var(--surface)', borderColor: filters.budget === opt.value ? '#e63946' : 'var(--border)' }}
                >
                  <span className="text-3xl mb-2 block">{opt.icon}</span>
                  <p className="font-bold text-sm">{opt.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{opt.range}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: City */}
        {step === 'city' && (
          <div className="animate-fade-in">
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">¿Dónde será tu Day?</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Selecciona tu ciudad</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-xl mx-auto">
              {cities.map(city => (
                <button
                  key={city.id}
                  onClick={() => setFilters(f => ({ ...f, city: city.slug }))}
                  className={`relative overflow-hidden rounded-2xl border-2 aspect-[4/3] group transition-all ${filters.city === city.slug ? 'border-[#e63946] shadow-lg shadow-[#e63946]/10' : ''}`}
                  style={{ borderColor: filters.city === city.slug ? '#e63946' : 'var(--border)' }}
                >
                  {city.image && <img src={city.image} alt={city.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-3 left-3 text-white">
                    <p className="font-bold text-sm">{city.name}</p>
                    <p className="text-[10px] opacity-80">{city.country}</p>
                  </div>
                  {filters.city === city.slug && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-[#e63946] rounded-full flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: Vibes / Categories */}
        {step === 'vibes' && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">¿Qué te apetece?</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Selecciona todo lo que quieras incluir</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-xl mx-auto mb-8">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.slug)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${filters.categories.includes(cat.slug) ? 'border-[#e63946] shadow-lg shadow-[#e63946]/10' : 'hover:border-[var(--text-tertiary)]'}`}
                  style={{ background: filters.categories.includes(cat.slug) ? 'var(--card)' : 'var(--surface)', borderColor: filters.categories.includes(cat.slug) ? '#e63946' : 'var(--border)' }}
                >
                  <span className="text-2xl mb-1 block">{cat.icon}</span>
                  <p className="font-bold text-sm">{cat.name}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{cat.name}</p>
                </button>
              ))}
            </div>

            {/* Walk preference */}
            <div className="max-w-xl mx-auto">
              <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>¿Cuánto quieres caminar?</p>
              <div className="flex gap-3">
                {WALK_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setFilters(f => ({ ...f, walkLevel: opt.value }))}
                    className={`flex-1 p-3 rounded-xl border-2 text-center transition-all ${filters.walkLevel === opt.value ? 'border-[#e63946]' : ''}`}
                    style={{ background: filters.walkLevel === opt.value ? 'var(--card)' : 'var(--surface)', borderColor: filters.walkLevel === opt.value ? '#e63946' : 'var(--border)' }}
                  >
                    <span className="text-lg block">{opt.icon}</span>
                    <p className="text-xs font-medium mt-1">{opt.label}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* RESULTS */}
        {step === 'results' && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">Tu Day Perfecto</h1>
              <p style={{ color: 'var(--text-secondary)' }}>
                {results.length} rutas sugeridas para {filters.group === 'solo' ? 'ti' : filters.group === 'pareja' ? 'tu pareja' : `${filters.people} personas`}
              </p>
            </div>

            {loadingResults ? (
              <div className="space-y-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="rounded-2xl p-6 animate-pulse" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                    <div className="h-5 w-40 rounded shimmer mb-4" />
                    <div className="grid grid-cols-3 gap-3">
                      {[1, 2, 3].map(j => <div key={j} className="aspect-[3/4] rounded-xl shimmer" />)}
                    </div>
                  </div>
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-16">
                <span className="text-5xl block mb-4">😢</span>
                <h2 className="text-xl font-bold mb-2">No encontramos rutas</h2>
                <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Intenta con menos filtros o una ciudad diferente</p>
                <button onClick={() => setStep('vibes')} className="btn-primary px-6 py-3 text-sm">Cambiar filtros</button>
              </div>
            ) : (
              <div className="space-y-6">
                {results.map((route, ri) => {
                  const cost = getRouteCost(route);
                  const freeCount = getFreeCount(route);
                  const currency = route[0] ? cs(route[0]) : '$';

                  return (
                    <div key={ri} className="rounded-2xl overflow-hidden border transition-all hover:shadow-lg" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                      {/* Route header */}
                      <div className="p-5 pb-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-black text-lg">
                            {ri === 0 ? '🏆 Ruta Recomendada' : ri === 1 ? '⭐ Alternativa Popular' : '🎯 Opción Económica'}
                          </h3>
                          <div className="text-right">
                            <p className="text-lg font-black">{cost === 0 ? 'GRATIS' : `${currency}${cost.toFixed(0)}`}</p>
                            <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                              {freeCount > 0 && `${freeCount} gratis · `}{route.length} actividades
                            </p>
                          </div>
                        </div>

                        {/* Timeline preview */}
                        <div className="flex items-center gap-1 mt-3 mb-4 overflow-x-auto scrollbar-hide pb-1">
                          {route.map((ev, ei) => (
                            <div key={ev.id} className="flex items-center shrink-0">
                              <div className="flex items-center gap-2 rounded-xl px-2.5 py-1.5" style={{ background: 'var(--surface-2)' }}>
                                <div className="w-5 h-5 bg-[#e63946] rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0">{ei + 1}</div>
                                <span className="text-xs font-medium truncate max-w-[100px]">{ev.title}</span>
                              </div>
                              {ei < route.length - 1 && (
                                <svg className="w-3 h-3 mx-0.5 shrink-0" style={{ color: 'var(--text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Event cards */}
                      <div className="px-5 pb-3">
                        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                          {route.map(ev => (
                            <div key={ev.id} className="shrink-0 w-[150px]">
                              <EventCard event={ev} />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* CTA */}
                      <div className="p-5 pt-2 flex gap-3">
                        <button
                          onClick={() => handleSelectRoute(ri)}
                          disabled={creatingPlan}
                          className="flex-1 btn-primary py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {creatingPlan && selectedRoute === ri ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                          )}
                          {creatingPlan && selectedRoute === ri ? 'Creando...' : 'Seleccionar esta ruta'}
                        </button>
                      </div>
                    </div>
                  );
                })}

                <button onClick={generateRoutes} disabled={loadingResults} className="w-full py-3 btn-secondary rounded-xl text-sm font-medium flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Generar nuevas rutas
                </button>
              </div>
            )}
          </div>
        )}

        {/* Bottom CTA */}
        {step !== 'results' && (
          <div className="fixed bottom-0 left-0 right-0 p-4 z-40" style={{ background: 'var(--nav-bg)', backdropFilter: 'blur(20px)', borderTop: '1px solid var(--border)' }}>
            <div className="max-w-3xl mx-auto">
              <button
                onClick={goNext}
                disabled={!canNext()}
                className="w-full py-3.5 btn-primary text-sm disabled:opacity-30 disabled:transform-none disabled:shadow-none"
              >
                {step === 'vibes' ? 'Generar mi Day perfecto' : 'Continuar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
