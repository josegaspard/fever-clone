'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Plan, getPlans, createPlan, deletePlan } from '@/lib/api';
import { useToast } from '@/components/Toast';

export default function PlansPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => { if (user) loadPlans(); }, [user]);

  async function loadPlans() {
    setLoading(true);
    try { const res = await getPlans(); setPlans(res.data || []); }
    catch {} finally { setLoading(false); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const plan = await createPlan({ title: newTitle, description: newDesc || undefined, planDate: newDate || undefined });
      setPlans(prev => [plan, ...prev]);
      setShowCreate(false); setNewTitle(''); setNewDate(''); setNewDesc('');
      showToast('Day creado'); router.push(`/plans/${plan.id}`);
    } catch (err) { showToast(err instanceof Error ? err.message : 'Error', 'error'); }
    finally { setCreating(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este Day?')) return;
    try { await deletePlan(id); setPlans(prev => prev.filter(p => p.id !== id)); showToast('Day eliminado'); }
    catch { showToast('Error al eliminar', 'error'); }
  }

  const now = new Date().toISOString().split('T')[0];
  const filtered = plans.filter(p => {
    if (filter === 'all') return true;
    if (!p.planDate) return true;
    return filter === 'upcoming' ? p.planDate >= now : p.planDate < now;
  });

  const totalCost = plans.reduce((s, p) => s + (p.totalCost || 0), 0);
  const totalActivities = plans.reduce((s, p) => s + (p.items?.length || 0), 0);
  const paidCount = plans.reduce((s, p) => s + (p.items?.filter(i => i.isPaid).length || 0), 0);

  const formatDate = (d?: string) => {
    if (!d) return 'Sin fecha';
    try { return new Date(d).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }); }
    catch { return d; }
  };

  const daysUntil = (d?: string) => {
    if (!d) return null;
    const diff = Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return null;
    if (diff === 0) return 'Hoy';
    if (diff === 1) return 'Mañana';
    return `En ${diff} días`;
  };

  // Not logged in
  if (!authLoading && !user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: 'var(--card)' }}>
          <span className="text-4xl">📅</span>
        </div>
        <h1 className="text-2xl font-black mb-2">Inicia sesión para ver tus Days</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>Organiza tu día perfecto con los mejores eventos.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/auth/login" className="btn-primary px-8 py-3 text-sm text-center">Iniciar sesión</Link>
          <Link href="/build-day" className="btn-secondary px-8 py-3 text-sm text-center">Armar un Day</Link>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12"><div className="animate-pulse space-y-4"><div className="h-8 rounded w-48 shimmer" /><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1, 2, 3].map(i => <div key={i} className="h-52 rounded-2xl shimmer" />)}</div></div></div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Mis Days</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{plans.length} planes · {totalActivities} actividades</p>
        </div>
        <div className="flex gap-2">
          <Link href="/build-day" className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2">
            <span>✨</span> Arma tu Day
          </Link>
          <button onClick={() => setShowCreate(true)} className="px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Manual
          </button>
        </div>
      </div>

      {/* Stats */}
      {plans.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Days creados', value: plans.length, icon: '📅' },
            { label: 'Actividades', value: totalActivities, icon: '🎯' },
            { label: 'Invertido', value: totalCost === 0 ? 'Gratis' : `$${totalCost.toLocaleString()}`, icon: '💰' },
          ].map(s => (
            <div key={s.label} className="p-4 rounded-2xl text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <span className="text-2xl block mb-1">{s.icon}</span>
              <p className="text-lg font-black">{s.value}</p>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--card)' }}>
        {(['all', 'upcoming', 'past'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${filter === f ? 'bg-[#e63946] text-white shadow-md' : ''}`}
            style={filter !== f ? { color: 'var(--text-secondary)' } : {}}>
            {f === 'all' ? 'Todos' : f === 'upcoming' ? 'Próximos' : 'Pasados'}
          </button>
        ))}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'var(--overlay)' }} onClick={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} onClick={e => e.stopPropagation()} className="w-full max-w-md p-6 rounded-2xl space-y-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h2 className="text-lg font-black">Nuevo Day</h2>
            <div><label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Título</label>
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full input-theme rounded-xl px-4 py-3 text-sm" placeholder="Noche en la ciudad..." autoFocus /></div>
            <div><label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Fecha</label>
              <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="w-full input-theme rounded-xl px-4 py-3 text-sm" /></div>
            <div><label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Descripción (opcional)</label>
              <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={2} className="w-full input-theme rounded-xl px-4 py-3 text-sm resize-none" placeholder="Describe tu Day..." /></div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={creating || !newTitle.trim()} className="flex-1 btn-primary py-3 text-sm disabled:opacity-50">{creating ? 'Creando...' : 'Crear Day'}</button>
              <button type="button" onClick={() => setShowCreate(false)} className="px-6 py-3 rounded-xl text-sm font-medium transition" style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Plans grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1, 2, 3].map(i => <div key={i} className="h-56 rounded-2xl shimmer" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-6xl block mb-4">📅</span>
          <h2 className="text-xl font-bold mb-2">{filter === 'all' ? 'Aún no tienes Days' : filter === 'upcoming' ? 'No tienes Days próximos' : 'No tienes Days pasados'}</h2>
          <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>Crea tu primer Day perfecto con nuestro asistente</p>
          <Link href="/build-day" className="btn-primary px-8 py-3 text-sm inline-flex items-center gap-2">✨ Arma tu Day perfecto</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(plan => {
            const itemCount = plan.items?.length || 0;
            const previewItems = (plan.items || []).slice(0, 4);
            const paidItems = plan.items?.filter(i => i.isPaid).length || 0;
            const countdown = daysUntil(plan.planDate);
            const isUpcoming = plan.planDate && plan.planDate >= now;

            return (
              <Link key={plan.id} href={`/plans/${plan.id}`}
                className="group rounded-2xl overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>

                {/* Image strip */}
                {previewItems.length > 0 && (
                  <div className="flex h-24 overflow-hidden">
                    {previewItems.map((item, i) => (
                      <div key={item.id} className="flex-1 relative overflow-hidden" style={{ maxWidth: `${100 / previewItems.length}%` }}>
                        {item.event?.image ? (
                          <img src={item.event.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full" style={{ background: `hsl(${i * 60}, 50%, 30%)` }} />
                        )}
                      </div>
                    ))}
                    {itemCount > 4 && (
                      <div className="absolute right-2 top-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-black/60 backdrop-blur-sm">
                        +{itemCount - 4}
                      </div>
                    )}
                  </div>
                )}

                <div className="p-4 space-y-3">
                  {/* Title + countdown */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base group-hover:text-[#e63946] transition line-clamp-1">{plan.title}</h3>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{formatDate(plan.planDate)}</p>
                    </div>
                    {countdown && isUpcoming && (
                      <span className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#e63946]/10 text-[#e63946]">{countdown}</span>
                    )}
                  </div>

                  {plan.description && <p className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{plan.description}</p>}

                  {/* Bottom row */}
                  <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      <span>{itemCount} actividades</span>
                      {paidItems > 0 && <span className="text-green-500">{paidItems} pagadas</span>}
                    </div>
                    <span className="text-sm font-black">{plan.totalCost === 0 ? 'Gratis' : `$${plan.totalCost.toLocaleString()}`}</span>
                  </div>

                  {/* Delete */}
                  <button onClick={e => { e.preventDefault(); e.stopPropagation(); handleDelete(plan.id); }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-black/60 text-white/70 hover:text-red-400 hover:bg-black/80">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
