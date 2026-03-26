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
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) loadPlans();
  }, [user]);

  async function loadPlans() {
    setLoading(true);
    try {
      const res = await getPlans();
      setPlans(res.data || []);
    } catch {
      // Not available
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const plan = await createPlan({
        title: newTitle,
        description: newDesc || undefined,
        planDate: newDate || undefined,
      });
      setPlans((prev) => [plan, ...prev]);
      setShowCreate(false);
      setNewTitle('');
      setNewDate('');
      setNewDesc('');
      showToast('Plan creado');
      router.push(`/plans/${plan.id}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al crear', 'error');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminar este plan?')) return;
    try {
      await deletePlan(id);
      setPlans((prev) => prev.filter((p) => p.id !== id));
      showToast('Plan eliminado');
    } catch {
      showToast('Error al eliminar', 'error');
    }
  }

  const now = new Date().toISOString().split('T')[0];
  const filtered = plans.filter((p) => {
    if (!p.planDate) return filter === 'upcoming';
    return filter === 'upcoming' ? p.planDate >= now : p.planDate < now;
  });

  const formatDate = (d?: string) => {
    if (!d) return 'Sin fecha';
    try {
      return new Date(d).toLocaleDateString('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return d;
    }
  };

  if (authLoading || !user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[#1a1a1a] rounded w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 bg-[#1a1a1a] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-white">Mis Planes</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-[#e63946] hover:bg-[#c62d3a] px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Crear Plan
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreate}
            className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 w-full max-w-md space-y-4"
          >
            <h2 className="text-lg font-bold text-white">Nuevo Plan</h2>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Titulo</label>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#e63946]"
                placeholder="Noche en la ciudad..."
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Fecha</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#e63946]"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Descripcion (opcional)</label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={2}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#e63946] resize-none"
                placeholder="Describe tu plan..."
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={creating || !newTitle.trim()}
                className="flex-1 bg-[#e63946] hover:bg-[#c62d3a] py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
              >
                {creating ? 'Creando...' : 'Crear Plan'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-6 py-2.5 border border-[#2a2a2a] rounded-lg text-sm text-gray-400 hover:text-white transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['upcoming', 'past'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === f
                ? 'bg-[#e63946] text-white'
                : 'bg-[#1a1a1a] text-gray-400 hover:text-white border border-[#2a2a2a]'
            }`}
          >
            {f === 'upcoming' ? 'Proximos' : 'Pasados'}
          </button>
        ))}
      </div>

      {/* Plans grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-[#1a1a1a] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-20 h-20 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h2 className="text-lg font-semibold text-white mb-2">
            {filter === 'upcoming' ? 'No tienes planes proximos' : 'No tienes planes pasados'}
          </h2>
          <p className="text-gray-400 text-sm mb-6">Explora eventos y crea tu primer plan</p>
          <Link
            href="/search"
            className="inline-block bg-[#e63946] hover:bg-[#c62d3a] px-6 py-2.5 rounded-lg text-sm font-medium transition"
          >
            Explorar eventos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((plan) => (
            <Link
              key={plan.id}
              href={`/plans/${plan.id}`}
              className="group bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 hover:border-[#3a3a3a] transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-white group-hover:text-[#e63946] transition line-clamp-1">
                    {plan.title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDate(plan.planDate)}
                  </p>
                  {plan.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{plan.description}</p>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDelete(plan.id);
                  }}
                  className="text-gray-600 hover:text-red-400 transition opacity-0 group-hover:opacity-100 shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {plan.items?.length || 0} actividades
                </span>
                <span className="font-semibold text-white">
                  {plan.totalCost === 0 ? 'Gratis' : `${plan.totalCost.toFixed(2)}\u20AC`}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  plan.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'
                }`}>
                  {plan.status === 'active' ? 'Activo' : plan.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
