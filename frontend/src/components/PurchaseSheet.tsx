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
  useAuth();
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
  const capacityPercent = event.capacity && event.soldCount ? Math.min(100, Math.round((event.soldCount / event.capacity) * 100)) : null;
  const isAlmostFull = capacityPercent !== null && capacityPercent > 70;

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
    const title = newDayTitle.trim() || `Day - ${event.title}`;
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

  async function handleQuickBuy() {
    setProcessing(true);
    setStep('processing');
    try {
      const plan = await createPlan({
        title: `Day - ${event.title}`,
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

  const sheetProps = {
    event, step, quantity, setQuantity, isFree, cs, cl, total,
    plans, loadingPlans, processing, showNewDay, setShowNewDay,
    newDayTitle, setNewDayTitle, onClose, onContinueToDay: handleContinueToDay,
    onQuickBuy: handleQuickBuy, onSelectPlan: handleSelectPlan,
    onCreateNewDay: handleCreateNewDay, onBack: () => setStep('details'),
    formatDate, capacityPercent, isAlmostFull,
  };

  return (
    <>
      {/* Backdrop -- desktop modal */}
      <div
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm hidden lg:flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
          style={{ background: 'var(--card)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <SheetContent {...sheetProps} />
        </div>
      </div>

      {/* Mobile -- full screen slide from bottom */}
      <div
        className={`fixed inset-0 z-[60] lg:hidden transition-transform duration-300 ease-out ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ background: 'var(--bg)' }}
      >
        <div className="h-full overflow-y-auto">
          <SheetContent {...sheetProps} mobile />
        </div>
      </div>
    </>
  );
}

// ── Inner content ──

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
  capacityPercent: number | null;
  isAlmostFull: boolean;
  mobile?: boolean;
}

function SheetContent({
  event, step, quantity, setQuantity, isFree, cs, cl, total,
  plans, loadingPlans, processing, showNewDay, setShowNewDay,
  newDayTitle, setNewDayTitle, onClose, onContinueToDay, onQuickBuy,
  onSelectPlan, onCreateNewDay, onBack, formatDate,
  capacityPercent, isAlmostFull,
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
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(230,57,70,0.1)' }}>
            <div className="w-8 h-8 border-3 border-[#e63946] border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {isFree ? 'Reservando tu entrada...' : 'Preparando tu pago seguro...'}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>No cierres esta ventana</p>
        </div>
      )}

      {/* Step 1: Event details + quantity */}
      {step === 'details' && (
        <>
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* Event card -- larger image */}
              <div className="flex gap-3">
                <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 relative" style={{ background: 'var(--surface)' }}>
                  {event.image && (
                    <Image src={event.image} alt={event.title} fill sizes="96px" className="object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm line-clamp-2" style={{ color: 'var(--fg)' }}>{event.title}</h3>
                  <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                    <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {event.date && formatDate(event.date)}
                    {event.time && ` · ${event.time}`}
                  </p>
                  {event.city?.name && (
                    <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                      <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {event.city.name}
                    </p>
                  )}
                  {event.rating && event.rating > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      <span className="text-[10px] font-semibold" style={{ color: 'var(--fg)' }}>{event.rating.toFixed(1)}</span>
                      {event.reviewCount && <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>({event.reviewCount})</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* Urgency bar -- capacity */}
              {isAlmostFull && capacityPercent !== null && (
                <div className="rounded-lg p-3" style={{ background: 'rgba(230,57,70,0.06)', border: '1px solid rgba(230,57,70,0.15)' }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-[#e63946] flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"/></svg>
                      Alta demanda
                    </span>
                    <span className="text-[10px] font-bold text-[#e63946]">{capacityPercent}% vendido</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${capacityPercent}%`, background: 'linear-gradient(90deg, #e63946, #ff6b6b)' }} />
                  </div>
                </div>
              )}

              {/* Social proof */}
              {event.soldCount && event.soldCount > 10 && (
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                  <span>{event.soldCount.toLocaleString()}+ personas ya compraron</span>
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--border)' }} />

              {/* Ticket type */}
              <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>Entrada General</p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Acceso completo al evento</p>
                  </div>
                  <p className="text-sm font-bold" style={{ color: isFree ? '#2a9d8f' : 'var(--fg)' }}>
                    {isFree ? 'GRATIS' : `${cs}${event.price.toFixed(0)} ${cl}`}
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
                    <span>{cs}{(event.price * quantity).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <span>Cargo por servicio</span>
                    <span className="text-green-500 font-medium">Gratis</span>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)' }} />
                  <div className="flex justify-between">
                    <span className="text-sm font-bold" style={{ color: 'var(--fg)' }}>Total</span>
                    <span className="text-base font-black" style={{ color: 'var(--fg)' }}>{cs}{total.toFixed(0)} {cl}</span>
                  </div>
                </div>
              )}

              {/* "Arma tu Day" upsell -- compelling design */}
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <div className="p-4 relative" style={{ background: 'linear-gradient(135deg, rgba(230,57,70,0.08), rgba(139,92,246,0.06))' }}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #e63946, #c62d3a)' }}>
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold" style={{ color: 'var(--fg)' }}>No solo compres un ticket</p>
                      <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        Al comprar, te sugerimos cena, bar y actividades para armar un dia completo con ruta y transporte.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 ml-[52px]">
                    {[
                      { label: 'Cena', color: '#f97316' },
                      { label: 'Bar', color: '#8b5cf6' },
                      { label: 'Cerca', color: '#2a9d8f' },
                      { label: 'Ruta', color: '#3b82f6' },
                    ].map(t => (
                      <span key={t.label} className="text-[10px] px-2.5 py-1 rounded-full font-medium" style={{ background: `${t.color}12`, color: t.color, border: `1px solid ${t.color}25` }}>
                        {t.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Security badges */}
              <div className="flex items-center justify-between py-2">
                {[
                  { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: 'Pago seguro', color: '#10b981' },
                  { icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', label: 'Stripe', color: '#6366f1' },
                  { icon: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z', label: 'Ticket QR', color: '#8b5cf6' },
                ].map(badge => (
                  <div key={badge.label} className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke={badge.color} viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={badge.icon} />
                    </svg>
                    <span className="text-[10px] font-medium" style={{ color: 'var(--text-tertiary)' }}>{badge.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom CTA -- fixed */}
          <div className="p-4 space-y-2" style={{ borderTop: '1px solid var(--border)', background: 'var(--card)' }}>
            <button
              onClick={onQuickBuy}
              disabled={processing}
              className="w-full py-3.5 text-white font-bold rounded-xl transition-all hover:shadow-lg active:scale-[0.99] disabled:opacity-60 text-sm"
              style={{
                background: isFree ? 'linear-gradient(135deg, #2a9d8f, #1a7a6f)' : 'linear-gradient(135deg, #e63946, #c62d3a)',
                boxShadow: isFree ? '0 4px 20px rgba(42,157,143,0.25)' : '0 4px 20px rgba(230,57,70,0.25)',
              }}
            >
              {isFree
                ? 'Reservar gratis y armar mi Day'
                : `${cs}${total.toFixed(0)} ${cl} -- Comprar y armar mi Day`
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
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="w-10 h-10 rounded-lg overflow-hidden relative shrink-0" style={{ background: 'var(--card)' }}>
                  {event.image && <Image src={event.image} alt="" fill sizes="40px" className="object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: 'var(--fg)' }}>{event.title}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                    {!isFree && <>{cs}{total.toFixed(0)} {cl} · </>}{quantity} entrada{quantity > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <p className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>Selecciona un Day</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {isFree ? 'Agrega este evento gratis a tu plan del dia.' : 'El evento se agregara y procederas al pago seguro.'}
              </p>

              {loadingPlans ? (
                <div className="py-8 flex justify-center">
                  <div className="w-6 h-6 border-2 border-[#e63946] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : plans.length === 0 && !showNewDay ? (
                <div className="text-center py-6">
                  <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(230,57,70,0.08)' }}>
                    <svg className="w-6 h-6 text-[#e63946]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold mb-1" style={{ color: 'var(--fg)' }}>Crea tu primer Day</p>
                  <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>Organiza tus actividades en un plan perfecto</p>
                  <button
                    onClick={() => setShowNewDay(true)}
                    className="px-6 py-2.5 text-white text-sm font-bold rounded-xl transition" style={{ background: 'linear-gradient(135deg, #e63946, #c62d3a)' }}
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
                    placeholder={`Day - ${event.title}`}
                    className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#e63946]"
                    style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--fg)' }}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={onCreateNewDay}
                      disabled={processing}
                      className="flex-1 py-2.5 text-white text-sm font-bold rounded-lg transition disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #e63946, #c62d3a)' }}
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