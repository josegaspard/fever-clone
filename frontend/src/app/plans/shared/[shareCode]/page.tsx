'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Plan, getSharedPlan } from '@/lib/api';
import PlanTimeline from '@/components/PlanTimeline';

export default function SharedPlanPage() {
  const params = useParams();
  const { user } = useAuth();
  const shareCode = params.shareCode as string;

  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (shareCode) loadPlan();
  }, [shareCode]);

  async function loadPlan() {
    setLoading(true);
    try {
      const p = await getSharedPlan(shareCode);
      setPlan(p);
    } catch {
      setError('No se pudo cargar el Day compartido.');
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 rounded w-64" style={{ background: 'var(--card)' }} />
          <div className="h-4 rounded w-32" style={{ background: 'var(--card)' }} />
          <div className="h-96 rounded-xl" style={{ background: 'var(--card)' }} />
        </div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold mb-2">Day no encontrado</h1>
        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>{error}</p>
        <Link
          href="/"
          className="px-6 py-2 bg-[#e63946] rounded-lg hover:bg-[#c62d3a] text-white transition inline-block"
        >
          Ir al inicio
        </Link>
      </div>
    );
  }

  const totalCost = (plan.items || []).reduce((acc, item) => acc + (item.cost || 0), 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Shared badge */}
      <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        Day compartido
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold" style={{ color: 'var(--fg)' }}>{plan.title}</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{formatDate(plan.planDate)}</p>
        {plan.description && (
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>{plan.description}</p>
        )}
      </div>

      {/* Summary card */}
      <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-4 text-sm">
          <span style={{ color: 'var(--text-secondary)' }}>{plan.items?.length || 0} actividades</span>
          <span className="font-bold" style={{ color: 'var(--fg)' }}>{totalCost === 0 ? 'Gratis' : `$${totalCost.toFixed(2)} MXN`}</span>
        </div>
      </div>

      {/* Timeline (read-only) */}
      <PlanTimeline planId={plan.id} items={plan.items || []} editable={false} />

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
        {user ? (
          <Link
            href="/plans"
            className="flex-1 bg-[#e63946] hover:bg-[#c62d3a] py-3 rounded-xl text-sm font-bold text-center transition"
          >
            Crea tu propio Day
          </Link>
        ) : (
          <>
            <Link
              href="/auth/register"
              className="flex-1 bg-[#e63946] hover:bg-[#c62d3a] py-3 rounded-xl text-sm font-bold text-center transition"
            >
              Crea tu propio Day
            </Link>
            <Link
              href="/auth/login"
              className="flex-1 py-3 rounded-xl text-sm font-medium text-center transition"
              style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              Iniciar sesion
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
