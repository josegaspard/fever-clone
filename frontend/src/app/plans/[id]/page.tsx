'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Plan, getPlan, updatePlan, createTicket } from '@/lib/api';
import PlanTimeline from '@/components/PlanTimeline';
import InviteFriends from '@/components/InviteFriends';
import SharePlan from '@/components/SharePlan';
import { useToast } from '@/components/Toast';

export default function PlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const planId = params.id as string;

  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editingDesc, setEditingDesc] = useState(false);
  const [editDesc, setEditDesc] = useState('');
  const [payingPending, setPayingPending] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && planId) loadPlan();
  }, [user, planId]);

  async function loadPlan() {
    setLoading(true);
    try {
      const p = await getPlan(planId);
      setPlan(p);
      setEditTitle(p.title);
      setEditDesc(p.description || '');
    } catch {
      setError('No se pudo cargar el Day.');
    } finally {
      setLoading(false);
    }
  }

  async function saveTitle() {
    if (!plan || !editTitle.trim()) return;
    try {
      const updated = await updatePlan(plan.id, { title: editTitle });
      setPlan(updated);
      setEditingTitle(false);
      showToast('Titulo actualizado');
    } catch {
      showToast('Error al guardar', 'error');
    }
  }

  async function saveDesc() {
    if (!plan) return;
    try {
      const updated = await updatePlan(plan.id, { description: editDesc });
      setPlan(updated);
      setEditingDesc(false);
      showToast('Descripcion actualizada');
    } catch {
      showToast('Error al guardar', 'error');
    }
  }

  function handleItemRemoved(itemId: string) {
    if (!plan) return;
    setPlan({
      ...plan,
      items: plan.items.filter((i) => i.id !== itemId),
      totalCost: plan.items
        .filter((i) => i.id !== itemId)
        .reduce((acc, i) => acc + i.cost, 0),
    });
  }

  async function handlePayPending() {
    if (!plan) return;
    const unpaidItems = plan.items.filter((i) => i.cost > 0 && !i.isPaid);
    if (unpaidItems.length === 0) {
      showToast('No hay pagos pendientes', 'info');
      return;
    }
    setPayingPending(true);
    try {
      for (const item of unpaidItems) {
        await createTicket(item.eventId, item.id);
      }
      showToast(`${unpaidItems.length} tickets creados exitosamente`);
      // Reload plan to get updated isPaid status
      await loadPlan();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al pagar', 'error');
    } finally {
      setPayingPending(false);
    }
  }

  const formatDate = (d?: string) => {
    if (!d) return 'Sin fecha';
    try {
      return new Date(d).toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return d;
    }
  };

  const isOwner = plan && user && String(plan.userId) === String(user.id);
  const unpaidCount = plan ? plan.items.filter((i) => i.cost > 0 && !i.isPaid).length : 0;
  const unpaidTotal = plan ? plan.items.filter((i) => i.cost > 0 && !i.isPaid).reduce((acc, i) => acc + i.cost, 0) : 0;

  // Build a Google Maps URL with all waypoints
  const getOverviewMapUrl = () => {
    if (!plan || !plan.items || plan.items.length === 0) return null;
    const sorted = [...plan.items].sort((a, b) => {
      const ta = a.startTime || '';
      const tb = b.startTime || '';
      if (ta < tb) return -1;
      if (ta > tb) return 1;
      return a.sortOrder - b.sortOrder;
    });
    const withCoords = sorted.filter((i) => {
      const ev = i.event as Record<string, unknown> | null;
      return ev && ev.lat && ev.lng;
    });
    if (withCoords.length < 2) return null;
    const first = withCoords[0].event as Record<string, unknown>;
    const last = withCoords[withCoords.length - 1].event as Record<string, unknown>;
    const origin = `${first.lat},${first.lng}`;
    const destination = `${last.lat},${last.lng}`;
    const waypoints = withCoords
      .slice(1, -1)
      .map((i) => {
        const ev = i.event as Record<string, unknown>;
        return `${ev.lat},${ev.lng}`;
      })
      .join('|');
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ''}&travelmode=driving`;
  };

  if (loading || authLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-[#1a1a1a] rounded w-64" />
          <div className="h-4 bg-[#1a1a1a] rounded w-32" />
          <div className="h-96 bg-[#1a1a1a] rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold mb-2">Day no encontrado</h1>
        <p className="text-gray-400 mb-6">{error}</p>
        <button
          onClick={() => router.push('/plans')}
          className="px-6 py-2 bg-[#e63946] rounded-lg hover:bg-[#c62d3a] transition"
        >
          Volver a mis Days
        </button>
      </div>
    );
  }

  const mapUrl = getOverviewMapUrl();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/plans" className="hover:text-white transition">Mis Days</Link>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-white">{plan.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div>
            {editingTitle && isOwner ? (
              <div className="flex items-center gap-2">
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2 text-xl font-bold text-white focus:outline-none focus:ring-1 focus:ring-[#e63946]"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
                />
                <button onClick={saveTitle} className="text-green-400 hover:text-green-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <button onClick={() => setEditingTitle(false)} className="text-gray-400 hover:text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <h1
                className={`text-2xl md:text-3xl font-extrabold text-white ${isOwner ? 'cursor-pointer hover:text-[#e63946] transition' : ''}`}
                onClick={() => isOwner && setEditingTitle(true)}
              >
                {plan.title}
              </h1>
            )}
            <p className="text-sm text-gray-400 mt-1">{formatDate(plan.planDate)}</p>
          </div>

          {/* Description */}
          {editingDesc && isOwner ? (
            <div className="space-y-2">
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={2}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#e63946] resize-none"
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={saveDesc} className="text-sm text-green-400 hover:underline">Guardar</button>
                <button onClick={() => setEditingDesc(false)} className="text-sm text-gray-400 hover:underline">Cancelar</button>
              </div>
            </div>
          ) : plan.description ? (
            <p
              className={`text-sm text-gray-300 ${isOwner ? 'cursor-pointer hover:text-white transition' : ''}`}
              onClick={() => isOwner && setEditingDesc(true)}
            >
              {plan.description}
            </p>
          ) : isOwner ? (
            <button
              onClick={() => setEditingDesc(true)}
              className="text-sm text-gray-500 hover:text-gray-300 transition"
            >
              + Agregar descripcion
            </button>
          ) : null}

          {/* Timeline */}
          <PlanTimeline
            planId={plan.id}
            items={plan.items || []}
            editable={!!isOwner}
            onItemRemoved={handleItemRemoved}
          />

          {/* Pay pending button */}
          {unpaidCount > 0 && isOwner && (
            <button
              onClick={handlePayPending}
              disabled={payingPending}
              className="w-full py-3 bg-[#FFB800] hover:bg-[#e6a600] text-black font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {payingPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Procesando pagos...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Pagar pendientes ({unpaidCount}) - ${unpaidTotal.toFixed(2)} MXN
                </>
              )}
            </button>
          )}

          {/* Add more */}
          <Link
            href="/search"
            className="inline-flex items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#e63946] px-5 py-3 rounded-xl text-sm text-gray-300 hover:text-white transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar mas actividades
          </Link>

          {/* Map overview */}
          {mapUrl && (
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 hover:border-[#3a3a3a] transition"
            >
              <div className="flex items-center gap-3">
                <svg className="w-8 h-8 text-[#e63946]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-white">Ver ruta completa en Google Maps</p>
                  <p className="text-xs text-gray-400">{plan.items?.length || 0} paradas</p>
                </div>
              </div>
            </a>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Cost breakdown */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white">Resumen de costos</h3>
            {(plan.items || []).map((item) => (
              <div key={item.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0 mr-2">
                  <span className="text-gray-400 truncate">{item.event?.title || 'Evento'}</span>
                  {item.cost > 0 && !item.isPaid && (
                    <span className="text-[10px] text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded shrink-0">Pendiente</span>
                  )}
                </div>
                <span className="text-white shrink-0">
                  {item.cost === 0 ? 'Gratis' : `$${item.cost.toFixed(2)} MXN`}
                </span>
              </div>
            ))}
            <div className="border-t border-[#2a2a2a] pt-3 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300">Total</span>
              <span className="text-lg font-bold text-white">
                {plan.totalCost === 0 ? 'Gratis' : `$${plan.totalCost.toFixed(2)} MXN`}
              </span>
            </div>
          </div>

          {/* Invite friends */}
          {isOwner && (
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
              <InviteFriends planId={plan.id} />
            </div>
          )}

          {/* Share */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
            <SharePlan shareCode={plan.shareCode} planTitle={plan.title} />
          </div>
        </div>
      </div>
    </div>
  );
}
