'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Event, Plan, getPlans, createPlan, addPlanItem, createTicket, createCheckoutSession } from '@/lib/api';
import { useToast } from './Toast';

interface PurchaseSheetProps {
  event: Event;
  open: boolean;
  onClose: () => void;
}

export default function PurchaseSheet({ event, open, onClose }: PurchaseSheetProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState<'details' | 'day' | 'processing'>('details');
  const [quantity, setQuantity] = useState(1);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [newDayTitle, setNewDayTitle] = useState('');
  const [showNewDay, setShowNewDay] = useState(false);

  const isFree = event.price === 0;
  const cs = event.currency === 'GBP' ? '\u00A3' : event.currency === 'EUR' ? '\u20AC' : '$';
  const cl = event.currency || 'MXN';
  const total = event.price * quantity;

  useEffect(() => {
    if (open) {
      setStep('details');
      setQuantity(1);
      setProcessing(false);
      setShowNewDay(false);
      setNewDayTitle('');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  async function loadPlans() {
    setLoadingPlans(true);
    try {
      const res = await getPlans();
      setPlans(res.data || []);
    } catch {
      setPlans([]);
    } finally {
      setLoadingPlans(false);
    }
  }

  function handleContinueToDay() {
    setStep('day');
    loadPlans();
  }

  async function handleSelectPlan(planId: string) {
    setProcessing(true);
    setStep('processing');
    try {
      const item = await addPlanItem(planId, {
        eventId: event.id,
        startTime: event.time || '18:00',
      });

      if (isFree) {
        await createTicket(String(event.id), String(item.id));
        showToast('Reservado y agregado a tu Day', 'success');
        onClose();
        router.push(`/plans/${planId}?success=true`);
      } else {
        const { url } = await createCheckoutSession({
          eventId: String(event.id),
          planItemId: String(item.id),
          planId: String(planId),
        });
        if (url) {
          window.location.href = url;
        } else {
          showToast('Error al iniciar el pago', 'error');
          setStep('day');
        }
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error', 'error');
      setStep('day');
    } finally {
      setProcessing(false);
    }
  }

  async function handleCreateNewDay() {
    const title = newDayTitle.trim() || `Day — ${event.title}`;
    setProcessing(true);
    setStep('processing');
    try {
      const plan = await createPlan({ title, planDate: event.date });
      const item = await addPlanItem(plan.id, {
        eventId: event.id,
        startTime: event.time || '18:00',
      });

      if (isFree) {
        await createTicket(String(event.id), String(item.id));
        showToast('Reservado y Day creado', 'success');
        onClose();
        router.push(`/plans/${plan.id}?success=true`);
      } else {
        const { url } = await createCheckoutSession({
          eventId: String(event.id),
          planItemId: String(item.id),
          planId: String(plan.id),
        });
        if (url) {
          window.location.href = url;
        } else {
          showToast('Error al iniciar el pago', 'error');
          setStep('day');
        }
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error', 'error');
      setStep('day');
    } finally {
      setProcessing(false);
    }
  }

  // Quick buy without selecting a day — creates day automatically
  async function handleQuickBuy() {
    setProcessing(true);
    setStep('processing');
    try {
      const plan = await createPlan({
        title: `Day — ${event.title}`,
        planDate: event.date,
      });
      const item = await addPlanItem(plan.id, {
        eventId: event.id,
        startTime: event.time || '18:00',
      });

      if (isFree) {
        await createTicket(String(event.id), String(item.id));
        showToast('Reservado y agregado a tu Day', 'success');
        onClose();
        router.push(`/plans/${plan.id}?success=true`);
      } else {
        const { url } = await createCheckoutSession({
          eventId: String(event.id),
          planItemId: String(item.id),
          planId: String(plan.id),
        });
        if (url) {
          window.location.href = url;
        } else {
          showToast('Error al iniciar el pago', 'error');
          setStep('details');
        }
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error', 'error');
      setStep('details');
    } finally {
      setProcessing(false);
    }
  }

  const formatDate = (d: string) => {
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

  if (!open) return null;

  return (
    <>
      {/* Backdrop — desktop modal */}
      <div
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm hidden lg:flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
          style={{ background: 'var(--card)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <SheetContent
            event={event}
            step={step}
            quantity={quantity}
            setQuantity={setQuantity}
            isFree={isFree}
            cs={cs}
            cl={cl}
            total={total}
            plans={plans}
            loadingPlans={loadingPlans}
            processing={processing}
            showNewDay={showNewDay}
            setShowNewDay={setShowNewDay}
            newDayTitle={newDayTitle}
            setNewDayTitle={setNewDayTitle}
            onClose={onClose}
            onContinueToDay={handleContinueToDay}
            onQuickBuy={handleQuickBuy}
            onSelectPlan={handleSelectPlan}
            onCreateNewDay={handleCreateNewDay}
            onBack={() => setStep('details')}
            formatDate={formatDate}
          />
        </div>
      </div>

      {/* Mobile — full screen slide from left */}
      <div
        className={`fixed inset-0 z-[60] lg:hidden transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: 'var(--bg)' }}
      >
        <div className="h-full overflow-y-auto">
          <SheetContent
            event={event}
            step={step}
            quantity={quantity}
            setQuantity={setQuantity}
            isFree={isFree}
            cs={cs}
            cl={cl}
            total={total}
            plans={plans}
            loadingPlans={loadingPlans}
            processing={processing}
            showNewDay={showNewDay}
            setShowNewDay={setShowNewDay}
            newDayTitle={newDayTitle}
            setNewDayTitle={setNewDayTitle}
            onClose={onClose}
            onContinueToDay={handleContinueToDay}
            onQuickBuy={handleQuickBuy}
            onSelectPlan={handleSelectPlan}
            onCreateNewDay={handleCreateNewDay}
            onBack={() => setStep('details')}
            formatDate={formatDate}
            mobile
          />
        </div>
      </div>
    </>
  );
}

// ── Inner content shared between mobile and desktop ──

interface SheetContentProps {
  event: Event;
  step: 'details' | 'day' | 'processing';
  quantity: number;
  setQuantity: (q: number) => void;
  isFree: boolean;
  cs: string;
  cl: string;
  total: number;
  plans: Plan[];
  loadingPlans: boolean;
  processing: boolean;
  showNewDay: boolean;
  setShowNewDay: (v: boolean) => void;
  newDayTitle: string;
  setNewDayTitle: (v: string) => void;
  onClose: () => void;
  onContinueToDay: () => void;
  onQuickBuy: () => void;
  onSelectPlan: (planId: string) => void;
  onCreateNewDay: () => void;
  onBack: () => void;
  formatDate: (d: string) => string;
  mobile?: boolean;
}

function SheetContent({
  event, step, quantity, setQuantity, isFree, cs, cl, total,
  plans, loadingPlans, processing, showNewDay, setShowNewDay,
  newDayTitle, setNewDayTitle, onClose, onContinueToDay, onQuickBuy,
  onSelectPlan, onCreateNewDay, onBack, formatDate, mobile,
}: SheetContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--border)' }}>
        {step === 'day' ? (
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </button>
        ) : (
          <h2 className="text-lg font-bold" style={{ color: 'var(--fg)' }}>
            {isFree ? 'Reservar entrada' : 'Comprar entrada'}
          </h2>
        )}
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center transition hover:opacity-70"
          style={{ background: 'var(--surface)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-secondary)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Processing state */}
      {step === 'processing' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
          <div className="w-12 h-12 border-3 border-[#e63946] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {isFree ? 'Reservando tu entrada...' : 'Preparando tu Day perfecto...'}
          </p>
        </div>
      )}

      {/* Step 1: Event details + quantity */}
      {step === 'details' && (
        <>
          <div className="flex-1 overflow-y-auto">
            {/* Event card */}
            <div className="p-4 space-y-4">
              <div className="flex gap-3">
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 relative" style={{ background: 'var(--surface)' }}>
                  {event.image && (
                    <Image src={event.image} alt={event.title} fill sizes="80px" className="object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm line-clamp-2" style={{ color: 'var(--fg)' }}>{event.title}</h3>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {event.date && formatDate(event.date)}
                    {event.time && ` · ${event.time}`}
                  </p>
                  {event.address && (
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-tertiary)' }}>{event.address}</p>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div style={{ borderTop: '1px solid var(--border)' }} />

              {/* Ticket type */}
              <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>Entrada General</p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Acceso al evento</p>
                  </div>
                  <p className="text-sm font-bold" style={{ color: isFree ? '#2a9d8f' : 'var(--fg)' }}>
                    {isFree ? 'GRATIS' : `${cs}${event.price.toFixed(2)} ${cl}`}
                  </p>
                </div>

                {/* Quantity selector */}
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Cantidad</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="w-8 h-8 rounded-full flex items-center justify-center transition disabled:opacity-30"
                      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--fg)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="text-sm font-bold w-6 text-center" style={{ color: 'var(--fg)' }}>{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(10, quantity + 1))}
                      disabled={quantity >= 10}
                      className="w-8 h-8 rounded-full flex items-center justify-center transition disabled:opacity-30"
                      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--fg)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Order summary */}
              {!isFree && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <span>Entrada General x{quantity}</span>
                    <span>{cs}{(event.price * quantity).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <span>Cargo por servicio</span>
                    <span>{cs}0.00</span>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)' }} />
                  <div className="flex justify-between">
                    <span className="text-sm font-bold" style={{ color: 'var(--fg)' }}>Total</span>
                    <span className="text-sm font-bold" style={{ color: 'var(--fg)' }}>{cs}{total.toFixed(2)} {cl}</span>
                  </div>
                </div>
              )}

              {/* Perfect Day upsell */}
              <div className="rounded-xl p-3.5" style={{ background: 'linear-gradient(135deg, rgba(230,57,70,0.06), rgba(42,157,143,0.06))', border: '1px solid var(--border)' }}>
                <p className="text-xs font-bold mb-2" style={{ color: 'var(--fg)' }}>Arma tu Day perfecto</p>
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-base">🍽️</span>
                    <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Cena antes</span>
                  </div>
                  <span className="text-[10px] hidden sm:inline" style={{ color: 'var(--text-tertiary)' }}>|</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-base">🍸</span>
                    <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Drinks despues</span>
                  </div>
                  <span className="text-[10px] hidden sm:inline" style={{ color: 'var(--text-tertiary)' }}>|</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-base">📍</span>
                    <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Actividades cerca</span>
                  </div>
                </div>
                <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Compra tu entrada y te ayudamos a armar el dia perfecto</p>
              </div>

              {/* Security badges */}
              <div className="flex items-center gap-4 flex-wrap pt-1">
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                  </svg>
                  <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Pago seguro</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
                  </svg>
                  <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Stripe</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM15.1 8H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z" />
                  </svg>
                  <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Ticket con QR</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="p-4 space-y-2" style={{ borderTop: '1px solid var(--border)', background: 'var(--card)' }}>
            <button
              onClick={onQuickBuy}
              disabled={processing}
              className="w-full py-3.5 text-white font-bold rounded-xl transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
              style={{
                background: isFree ? '#2a9d8f' : 'linear-gradient(135deg, #e63946, #c62d3a)',
                boxShadow: isFree ? '0 4px 20px rgba(42,157,143,0.3)' : '0 4px 20px rgba(230,57,70,0.3)',
              }}
            >
              {isFree
                ? 'Reservar y armar mi Day'
                : `Comprar y armar mi Day`
              }
            </button>
            <button
              onClick={onContinueToDay}
              className="w-full py-3 text-sm font-medium rounded-xl transition hover:opacity-80"
              style={{ color: 'var(--text-secondary)', background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              Agregar a un Day existente
            </button>
          </div>
        </>
      )}

      {/* Step 2: Select or create a Day */}
      {step === 'day' && (
        <>
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-3">
              <p className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>Selecciona un Day</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {isFree ? 'Agrega este evento gratis a tu plan del dia.' : 'El evento se agregara a tu Day y procederas al pago.'}
              </p>

              {loadingPlans ? (
                <div className="py-8 flex justify-center">
                  <div className="w-6 h-6 border-2 border-[#e63946] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : plans.length === 0 && !showNewDay ? (
                <div className="text-center py-6">
                  <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>No tienes Days creados</p>
                  <button
                    onClick={() => setShowNewDay(true)}
                    className="px-5 py-2.5 bg-[#e63946] hover:bg-[#c62d3a] text-white text-sm font-bold rounded-xl transition"
                  >
                    Crear mi primer Day
                  </button>
                </div>
              ) : (
                <>
                  {plans.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => onSelectPlan(plan.id)}
                      disabled={processing}
                      className="w-full text-left rounded-xl p-3.5 transition hover:opacity-80 disabled:opacity-50 flex items-center gap-3"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(230,57,70,0.1)' }}>
                        <svg className="w-5 h-5 text-[#e63946]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--fg)' }}>{plan.title}</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                          {plan.planDate ? formatDate(plan.planDate) : 'Sin fecha'}
                          {' · '}{plan.items?.length || 0} actividades
                        </p>
                      </div>
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-tertiary)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </>
              )}

              {/* Create new Day */}
              {showNewDay ? (
                <div className="rounded-xl p-3.5 space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <input
                    value={newDayTitle}
                    onChange={(e) => setNewDayTitle(e.target.value)}
                    placeholder={`Day — ${event.title}`}
                    className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#e63946]"
                    style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--fg)' }}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={onCreateNewDay}
                      disabled={processing}
                      className="flex-1 py-2.5 bg-[#e63946] hover:bg-[#c62d3a] text-white text-sm font-bold rounded-lg transition disabled:opacity-50"
                    >
                      {processing ? 'Creando...' : isFree ? 'Crear y reservar' : 'Crear y pagar'}
                    </button>
                    <button
                      onClick={() => setShowNewDay(false)}
                      className="px-3 py-2.5 text-sm rounded-lg transition"
                      style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : plans.length > 0 && (
                <button
                  onClick={() => setShowNewDay(true)}
                  className="w-full text-left rounded-xl p-3.5 transition hover:opacity-80 flex items-center gap-3"
                  style={{ border: '1px dashed var(--border)' }}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--surface)' }}>
                    <svg className="w-5 h-5 text-[#e63946]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-[#e63946]">Crear nuevo Day</p>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
