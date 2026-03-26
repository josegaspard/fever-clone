'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Event, Plan, getPlans, createPlan, addPlanItem } from '@/lib/api';
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
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [startTime, setStartTime] = useState(event.time || '18:00');
  const [endTime, setEndTime] = useState('20:00');
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

  const handleOpen = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      router.push('/auth/login');
      return;
    }
    setOpen(!open);
    if (!open) {
      setLoading(true);
      try {
        const res = await getPlans();
        // Filter plans for same date
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
      await addPlanItem(planId, {
        eventId: event.id,
        startTime,
        endTime,
      });
      showToast('Agregado al plan');
      setOpen(false);
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
      await addPlanItem(plan.id, {
        eventId: event.id,
        startTime,
        endTime,
      });
      showToast('Plan creado y evento agregado');
      setOpen(false);
      setShowCreate(false);
      setNewTitle('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al crear plan', 'error');
    } finally {
      setAdding(false);
    }
  };

  const isFree = event.price === 0;

  return (
    <div ref={ref} className="relative">
      {variant === 'icon' ? (
        <button
          onClick={handleOpen}
          className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center transition hover:bg-black/60 text-white"
          title="Agregar al plan"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11v6m-3-3h6" />
          </svg>
        </button>
      ) : (
        <button
          onClick={handleOpen}
          className="w-full py-2.5 border border-[#2a2a2a] rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:border-gray-400 transition flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11v6m-3-3h6" />
          </svg>
          Agregar al plan
        </button>
      )}

      {/* Dropdown */}
      {open && (
        <div className={`absolute z-50 ${variant === 'icon' ? 'right-0 top-full mt-2' : 'left-0 right-0 top-full mt-2'} bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden min-w-[280px]`}>
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
            {!isFree && (
              <p className="text-xs text-[#FFB800]">
                Precio: {event.price.toFixed(2)}&euro;
              </p>
            )}
            {isFree && (
              <span className="inline-block text-xs font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded">
                GRATIS
              </span>
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
                No tienes planes aun
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
                  <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              ))
            )}
          </div>

          {/* Create new plan */}
          <div className="border-t border-[#2a2a2a]">
            {showCreate ? (
              <div className="p-3 space-y-2">
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Nombre del plan..."
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#e63946]"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateAndAdd}
                    disabled={adding || !newTitle.trim()}
                    className="flex-1 bg-[#e63946] hover:bg-[#c62d3a] text-sm py-1.5 rounded-lg transition disabled:opacity-50"
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
                Crear nuevo plan
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
