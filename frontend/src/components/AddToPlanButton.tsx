'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Event, Plan, getPlans, createPlan, addPlanItem, createTicket, createCheckoutSession } from '@/lib/api';
import { useToast } from './Toast';

interface AddToPlanButtonProps {
  event: Event;
  variant?: 'icon' | 'full';
}

export default function AddToPlanButton({ event, variant = 'full' }: AddToPlanButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [startTime, setStartTime] = useState(event.time || '18:00');
  const [endTime, setEndTime] = useState('20:00');
  const [successPlanId, setSuccessPlanId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const isFree = event.price === 0;

  const handleOpen = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setOpen(!open);
    if (!open) {
      setLoading(true);
      try {
        const res = await getPlans();
        setPlans(res.data || []);
      } catch {
        setPlans([]);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddToPlan = async (planId: string) => {
    setAdding(true);
    try {
      const item = await addPlanItem(planId, {
        eventId: event.id,
        startTime,
        endTime,
      });
      // For paid events, redirect to Stripe or create ticket
      if (!isFree && item.id) {
        try {
          const { url } = await createCheckoutSession({
            eventId: event.id,
            planItemId: item.id,
            planId,
          });
          if (url) {
            window.location.href = url;
            return;
          }
        } catch {
          // Fallback: create ticket directly (demo mode)
          try { await createTicket(event.id, item.id); } catch {}
        }
      }
      setSuccessPlanId(planId);
      showToast(isFree ? 'Agregado gratis a tu Day' : 'Agregado a tu Day');
      setTimeout(() => {
        setOpen(false);
        setSuccessPlanId(null);
      }, 2000);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al agregar', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleCreateAndAdd = async () => {
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const plan = await createPlan({
        title: newTitle,
        planDate: event.date,
      });
      const item = await addPlanItem(plan.id, {
        eventId: event.id,
        startTime,
        endTime,
      });
      // For paid events, redirect to Stripe or create ticket
      if (!isFree && item.id) {
        try {
          const { url } = await createCheckoutSession({
            eventId: event.id,
            planItemId: item.id,
            planId: plan.id,
          });
          if (url) { window.location.href = url; return; }
        } catch {
          try { await createTicket(event.id, item.id); } catch {}
        }
      }
      setSuccessPlanId(plan.id);
      showToast('Day creado y evento agregado');
      setTimeout(() => {
        setOpen(false);
        setShowCreate(false);
        setNewTitle('');
        setSuccessPlanId(null);
      }, 2000);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al crear Day', 'error');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      {/* Auth modal for non-logged users */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAuthModal(false)}>
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8 w-full max-w-sm text-center space-y-5" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 bg-[#e63946]/10 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-[#e63946]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white">Registrate para crear tu Day</h2>
            <p className="text-sm text-gray-400">
              Crea tu cuenta gratis y organiza tu dia perfecto con los mejores eventos.
            </p>
            <div className="space-y-3">
              <Link
                href="/auth/register"
                className="block w-full py-3 bg-[#e63946] hover:bg-[#c62d3a] rounded-xl text-white font-bold transition text-center"
              >
                Registrarse gratis
              </Link>
              <Link
                href="/auth/login"
                className="block w-full py-3 border border-[#2a2a2a] hover:border-gray-400 rounded-xl text-gray-300 font-medium transition text-center"
              >
                Ya tengo cuenta
              </Link>
            </div>
            <button
              onClick={() => setShowAuthModal(false)}
              className="text-xs text-gray-500 hover:text-gray-300 transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {variant === 'icon' ? (
        <button
          onClick={handleOpen}
          className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center transition hover:bg-black/60 text-white"
          title="Agregar a mi Day"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11v6m-3-3h6" />
          </svg>
        </button>
      ) : (
        <button
          onClick={handleOpen}
          className={`w-full py-3 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 ${
            isFree
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-[#e63946] hover:bg-[#c62d3a] text-white'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11v6m-3-3h6" />
          </svg>
          {isFree ? 'Agregar gratis a tu Day' : `Comprar y agregar ($${event.price.toFixed(2)} MXN)`}
        </button>
      )}

      {/* Dropdown */}
      {open && (
        <div className={`absolute z-50 ${variant === 'icon' ? 'right-0 top-full mt-2' : 'left-0 right-0 top-full mt-2'} bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden min-w-[280px]`}>
          {/* Success state */}
          {successPlanId ? (
            <div className="p-5 text-center space-y-3">
              <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-white">Agregado exitosamente</p>
              <Link
                href={`/plans/${successPlanId}`}
                className="inline-block text-sm text-[#e63946] hover:underline font-medium"
                onClick={() => setOpen(false)}
              >
                Ver mi Day &rarr;
              </Link>
            </div>
          ) : (
            <>
              {/* Time picker */}
              <div className="p-3 border-b border-[#2a2a2a] space-y-2">
                <p className="text-xs text-gray-400 font-medium">Horario</p>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-500">Inicio</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#e63946]"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-500">Fin</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#e63946]"
                    />
                  </div>
                </div>
                {isFree ? (
                  <span className="inline-block text-xs font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded">
                    GRATIS
                  </span>
                ) : (
                  <p className="text-xs text-[#FFB800]">
                    Precio: ${event.price.toFixed(2)} MXN
                  </p>
                )}
              </div>

              {/* Plan list */}
              <div className="max-h-48 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center">
                    <div className="w-5 h-5 border-2 border-[#e63946] border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : plans.length === 0 ? (
                  <div className="p-3 text-center text-xs text-gray-400">
                    No tienes Days aun. Crea uno nuevo.
                  </div>
                ) : (
                  plans.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => handleAddToPlan(plan.id)}
                      disabled={adding}
                      className="w-full text-left px-3 py-2.5 hover:bg-[#2a2a2a] transition flex items-center justify-between gap-2 disabled:opacity-50"
                    >
                      <div>
                        <p className="text-sm text-white">{plan.title}</p>
                        <p className="text-[10px] text-gray-500">
                          {plan.planDate ? new Date(plan.planDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : ''}
                          {' '}&middot; {plan.items?.length || 0} actividades
                        </p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg shrink-0 ${
                        isFree
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-[#e63946]/10 text-[#e63946]'
                      }`}>
                        {isFree ? 'Gratis' : `$${event.price.toFixed(2)}`}
                      </span>
                    </button>
                  ))
                )}
              </div>

              {/* Create new Day */}
              <div className="border-t border-[#2a2a2a]">
                {showCreate ? (
                  <div className="p-3 space-y-2">
                    <input
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Nombre de tu Day..."
                      className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#e63946]"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreateAndAdd}
                        disabled={adding || !newTitle.trim()}
                        className={`flex-1 text-sm py-1.5 rounded-lg transition disabled:opacity-50 ${
                          isFree
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-[#e63946] hover:bg-[#c62d3a] text-white'
                        }`}
                      >
                        {adding ? 'Creando...' : 'Crear y agregar'}
                      </button>
                      <button
                        onClick={() => setShowCreate(false)}
                        className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowCreate(true)}
                    className="w-full px-3 py-2.5 text-sm text-[#e63946] hover:bg-[#2a2a2a] transition text-left flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Crear nuevo Day
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
