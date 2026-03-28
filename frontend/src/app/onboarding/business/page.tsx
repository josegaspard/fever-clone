'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  getCities,
  getCategories,
  City,
  Category,
  createEvent,
  createRefundPolicy,
  RefundPolicy,
} from '@/lib/api';
import Link from 'next/link';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CompanyForm {
  companyName: string;
  companyDescription: string;
  companyWebsite: string;
  phone: string;
  companyLogo: string;
}

interface RefundForm {
  name: string;
  description: string;
  daysBeforeEvent: number;
  refundPercentage: number;
}

interface EventForm {
  title: string;
  description: string;
  categoryId: string;
  cityId: string;
  date: string;
  time: string;
  price: number;
  currency: string;
  capacity: number;
  image: string;
  videoUrl: string;
}

const CURRENCIES = ['MXN', 'EUR', 'USD', 'GBP'] as const;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/* ------------------------------------------------------------------ */
/*  Step indicator                                                     */
/* ------------------------------------------------------------------ */

const STEP_LABELS = [
  'Perfil',
  'Reembolsos',
  'Evento',
  'Listo',
];

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="w-full">
      {/* Step labels - desktop */}
      <div className="hidden sm:flex justify-between mb-3">
        {STEP_LABELS.map((label, i) => (
          <span
            key={label}
            className="text-xs font-medium transition-colors duration-300"
            style={{
              color: i <= current ? '#e63946' : 'var(--text-tertiary)',
            }}
          >
            {label}
          </span>
        ))}
      </div>

      {/* Bar */}
      <div
        className="h-1 rounded-full overflow-hidden"
        style={{ background: 'var(--border)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${((current + 1) / total) * 100}%`,
            background: 'linear-gradient(90deg, #e63946, #ff6b6b)',
          }}
        />
      </div>

      {/* Mobile step counter */}
      <p
        className="sm:hidden text-xs mt-2 text-center"
        style={{ color: 'var(--text-secondary)' }}
      >
        Paso {current + 1} de {total}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function BusinessOnboardingPage() {
  const { user, updateProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  /* ---- Wizard state ---- */
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  /* ---- Data from API ---- */
  const [cities, setCities] = useState<City[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  /* ---- Step 1: Company ---- */
  const [company, setCompany] = useState<CompanyForm>({
    companyName: '',
    companyDescription: '',
    companyWebsite: '',
    phone: '',
    companyLogo: '',
  });

  /* ---- Step 2: Refund Policy ---- */
  const [refund, setRefund] = useState<RefundForm>({
    name: '',
    description: '',
    daysBeforeEvent: 7,
    refundPercentage: 100,
  });

  /* ---- Step 3: Event ---- */
  const [event, setEvent] = useState<EventForm>({
    title: '',
    description: '',
    categoryId: '',
    cityId: '',
    date: '',
    time: '',
    price: 0,
    currency: 'MXN',
    capacity: 100,
    image: '',
    videoUrl: '',
  });

  /* ---- Created resources (for summary) ---- */
  const [createdRefundPolicy, setCreatedRefundPolicy] = useState<RefundPolicy | null>(null);
  const [createdEventTitle, setCreatedEventTitle] = useState('');

  /* ---- Validation ---- */
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  /* ---- Prefill company name from registration ---- */
  useEffect(() => {
    if (user?.companyName && !company.companyName) {
      setCompany((prev) => ({ ...prev, companyName: user.companyName || '' }));
    }
  }, [user, company.companyName]);

  /* ---- Load cities + categories ---- */
  useEffect(() => {
    getCities().then(setCities).catch(() => {});
    getCategories().then(setCategories).catch(() => {});
  }, []);

  /* ---- Navigation helpers ---- */
  const goNext = useCallback(() => {
    setDirection('forward');
    setStep((s) => Math.min(s + 1, 3));
    setError('');
  }, []);

  const goBack = useCallback(() => {
    setDirection('back');
    setStep((s) => Math.max(s - 1, 0));
    setError('');
  }, []);

  /* ---- Per-step validation ---- */
  const step1Valid = useMemo(() => company.companyName.trim().length > 0, [company.companyName]);

  const step2Valid = useMemo(
    () =>
      refund.name.trim().length > 0 &&
      refund.daysBeforeEvent >= 0 &&
      refund.refundPercentage >= 0 &&
      refund.refundPercentage <= 100,
    [refund],
  );

  const step3Valid = useMemo(
    () => event.title.trim().length > 0 && event.description.trim().length > 0,
    [event.title, event.description],
  );

  const canNext = [step1Valid, step2Valid, step3Valid, true][step];

  /* ---- Handlers ---- */

  const handleCompanyChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setCompany((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleRefundChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    setRefund((prev) => ({
      ...prev,
      [name]: type === 'number' || name === 'daysBeforeEvent' || name === 'refundPercentage'
        ? Number(value)
        : value,
    }));
  };

  const handleEventChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setEvent((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const fillDefaultRefund = () => {
    setRefund({
      name: 'Politica estandar',
      description: 'Reembolso completo hasta 7 dias antes del evento.',
      daysBeforeEvent: 7,
      refundPercentage: 100,
    });
  };

  /* ---- Step transitions with API calls ---- */

  const handleStep1Next = async () => {
    if (!step1Valid) return;
    setSubmitting(true);
    setError('');
    try {
      await updateProfile({
        companyName: company.companyName.trim(),
        companyDescription: company.companyDescription.trim(),
        companyWebsite: company.companyWebsite.trim(),
        phone: company.phone.trim(),
        companyLogo: company.companyLogo.trim() || undefined,
      } as Partial<Record<string, unknown>> & Record<string, unknown>);
      goNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el perfil');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStep2Next = async () => {
    if (!step2Valid) return;
    setSubmitting(true);
    setError('');
    try {
      const policy = await createRefundPolicy({
        name: refund.name,
        description: refund.description,
        daysBeforeEvent: refund.daysBeforeEvent,
        refundPercentage: refund.refundPercentage,
      } as Partial<RefundPolicy>);
      setCreatedRefundPolicy(policy);
      goNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la politica de reembolso');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStep3Next = async () => {
    if (!step3Valid) return;
    setSubmitting(true);
    setError('');
    try {
      const slug = slugify(event.title) || 'evento';
      const payload: Record<string, unknown> = {
        title: event.title.trim(),
        slug,
        description: event.description.trim(),
        price: event.price,
        currency: event.currency,
        capacity: event.capacity,
        status: 'DRAFT',
      };
      if (event.categoryId) payload.categoryId = event.categoryId;
      if (event.cityId) payload.cityId = event.cityId;
      if (event.date) payload.date = event.date;
      if (event.time) payload.time = event.time;
      if (event.image) payload.image = event.image.trim();
      if (event.videoUrl) payload.videoUrl = event.videoUrl.trim();
      if (createdRefundPolicy) payload.refundPolicyId = createdRefundPolicy.id;

      await createEvent(payload);
      setCreatedEventTitle(event.title);
      goNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el evento');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinish = async () => {
    setSubmitting(true);
    setError('');
    try {
      await updateProfile({ onboardingCompleted: true } as Partial<Record<string, unknown>> & Record<string, unknown>);
      router.push('/business');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al finalizar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setSubmitting(true);
    try {
      await updateProfile({ onboardingCompleted: true } as Partial<Record<string, unknown>> & Record<string, unknown>);
      router.push('/business');
    } catch {
      router.push('/business');
    }
  };

  /* ---- Handle next per step ---- */
  const handleNext = () => {
    if (step === 0) handleStep1Next();
    else if (step === 1) handleStep2Next();
    else if (step === 2) handleStep3Next();
    else handleFinish();
  };

  /* ---- Loading state ---- */
  if (authLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg)' }}
      >
        <div className="w-10 h-10 border-3 border-[#e63946] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--bg)', color: 'var(--fg)' }}
    >
      {/* ---- Top bar ---- */}
      <header
        className="sticky top-0 z-40 border-b px-4 sm:px-6 py-3 flex items-center justify-between"
        style={{
          background: 'var(--bg)',
          borderColor: 'var(--border)',
        }}
      >
        <Link
          href="/"
          className="text-2xl font-extrabold tracking-tight"
          style={{ color: '#e63946' }}
        >
          FEVER
        </Link>
        <button
          onClick={handleSkip}
          className="text-sm font-medium transition-colors hover:opacity-80"
          style={{ color: 'var(--text-secondary)' }}
        >
          Omitir
        </button>
      </header>

      {/* ---- Progress ---- */}
      <div className="max-w-2xl w-full mx-auto px-4 sm:px-6 pt-6">
        <ProgressBar current={step} total={4} />
      </div>

      {/* ---- Content ---- */}
      <main className="flex-1 flex flex-col max-w-2xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Error banner */}
        {error && (
          <div className="mb-6 rounded-xl px-4 py-3 text-sm font-medium bg-red-500/10 border border-red-500/30 text-red-400 animate-fade-in">
            {error}
          </div>
        )}

        {/* Steps */}
        <div
          key={step}
          className={`animate-fade-in flex-1 ${
            direction === 'back' ? '' : ''
          }`}
        >
          {step === 0 && (
            <Step1Company
              form={company}
              onChange={handleCompanyChange}
              touched={touched}
            />
          )}
          {step === 1 && (
            <Step2Refund
              form={refund}
              onChange={handleRefundChange}
              onDefault={fillDefaultRefund}
            />
          )}
          {step === 2 && (
            <Step3Event
              form={event}
              onChange={handleEventChange}
              onCategorySelect={(id) =>
                setEvent((prev) => ({
                  ...prev,
                  categoryId: prev.categoryId === id ? '' : id,
                }))
              }
              categories={categories}
              cities={cities}
              touched={touched}
            />
          )}
          {step === 3 && (
            <Step4Done
              companyName={company.companyName}
              eventTitle={createdEventTitle}
              refundPolicy={createdRefundPolicy}
            />
          )}
        </div>

        {/* ---- Bottom navigation ---- */}
        <div className="flex items-center justify-between pt-8 pb-4 gap-4">
          {step > 0 && step < 3 ? (
            <button
              onClick={goBack}
              className="btn-secondary px-6 py-3 text-sm font-semibold"
            >
              Atras
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={!canNext || submitting}
              className="btn-primary px-8 py-3 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting && (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {step === 2 ? 'Crear evento' : 'Siguiente'}
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={submitting}
              className="btn-primary px-8 py-3 text-sm font-semibold disabled:opacity-40 flex items-center gap-2"
            >
              {submitting && (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              Ir al panel de empresa
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

/* ================================================================== */
/*  STEP 1 - Company Profile                                           */
/* ================================================================== */

function Step1Company({
  form,
  onChange,
  touched,
}: {
  form: CompanyForm;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  touched: Record<string, boolean>;
}) {
  const showNameError = touched.companyName && !form.companyName.trim();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Configura tu perfil de empresa
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Esta informacion sera visible para los usuarios que vean tus eventos.
        </p>
      </div>

      {/* Company Logo */}
      <div>
        <label
          className="block text-sm font-semibold mb-2"
          style={{ color: 'var(--fg)' }}
        >
          Logo de empresa
        </label>
        <div
          className="rounded-xl border-2 border-dashed p-6 text-center transition-colors"
          style={{ borderColor: 'var(--border)' }}
        >
          {form.companyLogo ? (
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-20 h-20 rounded-xl overflow-hidden border"
                style={{ borderColor: 'var(--border)' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.companyLogo}
                  alt="Logo"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <input
                type="url"
                name="companyLogo"
                value={form.companyLogo}
                onChange={onChange}
                placeholder="https://ejemplo.com/logo.png"
                className="input-theme w-full rounded-lg px-4 py-2.5 text-sm"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="mx-auto w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: 'var(--card)' }}>
                <svg className="w-7 h-7" style={{ color: 'var(--text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                type="url"
                name="companyLogo"
                value={form.companyLogo}
                onChange={onChange}
                placeholder="URL del logo (https://...)"
                className="input-theme w-full rounded-lg px-4 py-2.5 text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Company Name */}
      <div>
        <label className="block text-sm font-semibold mb-2">
          Nombre de la empresa <span className="text-[#e63946]">*</span>
        </label>
        <input
          type="text"
          name="companyName"
          value={form.companyName}
          onChange={onChange}
          placeholder="Ej: Experiencias Unicas S.A."
          className={`input-theme w-full rounded-lg px-4 py-3 text-sm ${
            showNameError ? 'border-red-500 focus:border-red-500' : ''
          }`}
          required
        />
        {showNameError && (
          <p className="mt-1 text-xs text-red-400">El nombre es obligatorio</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold mb-2">
          Descripcion
        </label>
        <textarea
          name="companyDescription"
          value={form.companyDescription}
          onChange={onChange}
          rows={4}
          placeholder="Cuentanos sobre tu empresa..."
          className="input-theme w-full rounded-lg px-4 py-3 text-sm resize-none"
        />
      </div>

      {/* Website + Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2">
            Sitio web
          </label>
          <input
            type="url"
            name="companyWebsite"
            value={form.companyWebsite}
            onChange={onChange}
            placeholder="https://tuempresa.com"
            className="input-theme w-full rounded-lg px-4 py-3 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">
            Telefono
          </label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={onChange}
            placeholder="+52 55 1234 5678"
            className="input-theme w-full rounded-lg px-4 py-3 text-sm"
          />
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  STEP 2 - Refund Policy                                             */
/* ================================================================== */

function Step2Refund({
  form,
  onChange,
  onDefault,
}: {
  form: RefundForm;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onDefault: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Define tu politica de reembolsos
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Una buena politica de reembolsos genera confianza y mejora las
          conversiones. Los clientes veran esta politica al comprar entradas.
        </p>
      </div>

      {/* Quick fill */}
      <button
        type="button"
        onClick={onDefault}
        className="btn-secondary px-4 py-2.5 text-sm font-semibold flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Usar politica estandar
      </button>

      {/* Policy name */}
      <div>
        <label className="block text-sm font-semibold mb-2">
          Nombre de la politica <span className="text-[#e63946]">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={onChange}
          placeholder="Ej: Politica estandar"
          className="input-theme w-full rounded-lg px-4 py-3 text-sm"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold mb-2">
          Descripcion
        </label>
        <textarea
          name="description"
          value={form.description}
          onChange={onChange}
          rows={3}
          placeholder="Describe las condiciones de reembolso..."
          className="input-theme w-full rounded-lg px-4 py-3 text-sm resize-none"
        />
      </div>

      {/* Days + Percentage */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2">
            Dias antes del evento
          </label>
          <input
            type="number"
            name="daysBeforeEvent"
            value={form.daysBeforeEvent}
            onChange={onChange}
            min={0}
            max={365}
            className="input-theme w-full rounded-lg px-4 py-3 text-sm"
          />
          <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Limite para solicitar reembolso
          </p>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">
            Porcentaje de reembolso
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              name="refundPercentage"
              value={form.refundPercentage}
              onChange={onChange}
              min={0}
              max={100}
              step={5}
              className="flex-1 accent-[#e63946]"
            />
            <span
              className="text-sm font-bold tabular-nums w-12 text-right"
              style={{ color: '#e63946' }}
            >
              {form.refundPercentage}%
            </span>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>
          Vista previa para el cliente
        </p>
        <div
          className="rounded-xl border p-5"
          style={{
            background: 'var(--card)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(230, 57, 70, 0.1)' }}
            >
              <svg className="w-5 h-5 text-[#e63946]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold">
                {form.name || 'Nombre de la politica'}
              </h3>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                {form.description ||
                  `Reembolso del ${form.refundPercentage}% si cancelas con ${form.daysBeforeEvent} dias de anticipacion.`}
              </p>
              <div className="flex items-center gap-3 mt-3">
                <span
                  className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(230, 57, 70, 0.1)', color: '#e63946' }}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {form.daysBeforeEvent} dias
                </span>
                <span
                  className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(230, 57, 70, 0.1)', color: '#e63946' }}
                >
                  {form.refundPercentage}% reembolso
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  STEP 3 - Create First Event                                        */
/* ================================================================== */

function Step3Event({
  form,
  onChange,
  onCategorySelect,
  categories,
  cities,
  touched,
}: {
  form: EventForm;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onCategorySelect: (id: string) => void;
  categories: Category[];
  cities: City[];
  touched: Record<string, boolean>;
}) {
  const showTitleError = touched.title && !form.title.trim();
  const showDescError = touched.description && !form.description.trim();
  const slug = useMemo(() => slugify(form.title), [form.title]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Crea tu primer evento
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          No te preocupes, podras editarlo mas tarde. Se creara como borrador.
        </p>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-semibold mb-2">
          Titulo del evento <span className="text-[#e63946]">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={form.title}
          onChange={onChange}
          placeholder="Ej: Noche de Jazz en el Centro"
          className={`input-theme w-full rounded-lg px-4 py-3 text-sm ${
            showTitleError ? 'border-red-500' : ''
          }`}
          required
        />
        {slug && (
          <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            URL: /events/<span className="font-medium">{slug}</span>
          </p>
        )}
        {showTitleError && (
          <p className="mt-1 text-xs text-red-400">El titulo es obligatorio</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold mb-2">
          Descripcion <span className="text-[#e63946]">*</span>
        </label>
        <textarea
          name="description"
          value={form.description}
          onChange={onChange}
          rows={4}
          placeholder="Describe tu evento, que incluye, por que asistir..."
          className={`input-theme w-full rounded-lg px-4 py-3 text-sm resize-none ${
            showDescError ? 'border-red-500' : ''
          }`}
          required
        />
        {showDescError && (
          <p className="mt-1 text-xs text-red-400">La descripcion es obligatoria</p>
        )}
      </div>

      {/* Category pills */}
      {categories.length > 0 && (
        <div>
          <label className="block text-sm font-semibold mb-3">
            Categoria
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const selected = form.categoryId === cat.id;
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => onCategorySelect(cat.id)}
                  className="px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200"
                  style={{
                    background: selected ? '#e63946' : 'var(--card)',
                    borderColor: selected ? '#e63946' : 'var(--border)',
                    color: selected ? '#fff' : 'var(--fg)',
                  }}
                >
                  {cat.icon && <span className="mr-1.5">{cat.icon}</span>}
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* City */}
      {cities.length > 0 && (
        <div>
          <label className="block text-sm font-semibold mb-2">
            Ciudad
          </label>
          <select
            name="cityId"
            value={form.cityId}
            onChange={onChange}
            className="input-theme w-full rounded-lg px-4 py-3 text-sm"
          >
            <option value="">Seleccionar ciudad</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}, {c.country}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Date + Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2">
            Fecha
          </label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={onChange}
            className="input-theme w-full rounded-lg px-4 py-3 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">
            Hora
          </label>
          <input
            type="time"
            name="time"
            value={form.time}
            onChange={onChange}
            className="input-theme w-full rounded-lg px-4 py-3 text-sm"
          />
        </div>
      </div>

      {/* Price + Currency + Capacity */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2">
            Precio
          </label>
          <input
            type="number"
            name="price"
            value={form.price}
            onChange={onChange}
            min={0}
            step={0.01}
            className="input-theme w-full rounded-lg px-4 py-3 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">
            Moneda
          </label>
          <select
            name="currency"
            value={form.currency}
            onChange={onChange}
            className="input-theme w-full rounded-lg px-4 py-3 text-sm"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-sm font-semibold mb-2">
            Capacidad
          </label>
          <input
            type="number"
            name="capacity"
            value={form.capacity}
            onChange={onChange}
            min={1}
            className="input-theme w-full rounded-lg px-4 py-3 text-sm"
          />
        </div>
      </div>

      {/* Image + Video URLs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2">
            Imagen del evento
          </label>
          <input
            type="url"
            name="image"
            value={form.image}
            onChange={onChange}
            placeholder="https://..."
            className="input-theme w-full rounded-lg px-4 py-3 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">
            Video (YouTube, Vimeo)
          </label>
          <input
            type="url"
            name="videoUrl"
            value={form.videoUrl}
            onChange={onChange}
            placeholder="https://..."
            className="input-theme w-full rounded-lg px-4 py-3 text-sm"
          />
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  STEP 4 - All Set!                                                  */
/* ================================================================== */

function Step4Done({
  companyName,
  eventTitle,
  refundPolicy,
}: {
  companyName: string;
  eventTitle: string;
  refundPolicy: RefundPolicy | null;
}) {
  return (
    <div className="space-y-8 text-center animate-fade-in">
      {/* Checkmark */}
      <div className="flex justify-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(230, 57, 70, 0.1)' }}
        >
          <svg className="w-10 h-10 text-[#e63946]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Tu empresa esta lista!
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Has completado la configuracion inicial. Ya puedes gestionar tus eventos
          desde el panel de empresa.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
        {/* Company card */}
        <div
          className="rounded-xl border p-5"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(230, 57, 70, 0.1)' }}
            >
              <svg className="w-5 h-5 text-[#e63946]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                Empresa
              </p>
              <p className="font-bold text-sm">{companyName}</p>
            </div>
          </div>
        </div>

        {/* Event card */}
        <div
          className="rounded-xl border p-5"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(230, 57, 70, 0.1)' }}
            >
              <svg className="w-5 h-5 text-[#e63946]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                Primer evento
              </p>
              <p className="font-bold text-sm">{eventTitle || 'Sin evento creado'}</p>
            </div>
          </div>
        </div>

        {/* Refund policy card */}
        {refundPolicy && (
          <div
            className="rounded-xl border p-5"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(230, 57, 70, 0.1)' }}
              >
                <svg className="w-5 h-5 text-[#e63946]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                  Politica de reembolso
                </p>
                <p className="font-bold text-sm">{refundPolicy.name}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats preview */}
        <div
          className="rounded-xl border p-5"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(230, 57, 70, 0.1)' }}
            >
              <svg className="w-5 h-5 text-[#e63946]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                Estadisticas
              </p>
              <p className="font-bold text-sm">0 eventos publicados, 0 tickets vendidos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary CTA */}
      <div>
        <Link
          href="/business"
          className="text-sm font-medium hover:underline"
          style={{ color: 'var(--text-secondary)' }}
        >
          Crear otro evento
        </Link>
      </div>
    </div>
  );
}
