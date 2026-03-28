'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  getRefundPolicies,
  createRefundPolicy,
  deleteRefundPolicy,
  RefundPolicy,
} from '@/lib/api';
import { useToast } from '@/components/Toast';

export default function BusinessSettingsPage() {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();

  // Company profile state
  const [companyForm, setCompanyForm] = useState({
    companyName: '',
    companyDescription: '',
    companyWebsite: '',
    companyLogo: '',
    phone: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Refund policies state
  const [policies, setPolicies] = useState<RefundPolicy[]>([]);
  const [loadingPolicies, setLoadingPolicies] = useState(true);
  const [policyForm, setPolicyForm] = useState({
    name: '',
    description: '',
    daysBeforeEvent: '',
    refundPercentage: '',
    isDefault: false,
  });
  const [creatingPolicy, setCreatingPolicy] = useState(false);
  const [deletingPolicy, setDeletingPolicy] = useState<string | null>(null);

  // Notification preferences (visual only)
  const [notifications, setNotifications] = useState({
    emailTickets: true,
    emailReviews: true,
    emailWeeklyReport: false,
    pushNewTicket: true,
    pushEventReminder: true,
  });

  useEffect(() => {
    if (user) {
      setCompanyForm({
        companyName: user.companyName || '',
        companyDescription: user.companyDescription || '',
        companyWebsite: user.companyWebsite || '',
        companyLogo: user.companyLogo || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    setLoadingPolicies(true);
    try {
      const data = await getRefundPolicies();
      setPolicies(Array.isArray(data) ? data : []);
    } catch {
      setPolicies([]);
    } finally {
      setLoadingPolicies(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile(companyForm);
      showToast('Perfil actualizado', 'success');
    } catch {
      showToast('Error al guardar el perfil', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingPolicy(true);
    try {
      const newPolicy = await createRefundPolicy({
        name: policyForm.name,
        description: policyForm.description || undefined,
        daysBeforeEvent: Number(policyForm.daysBeforeEvent),
        refundPercentage: Number(policyForm.refundPercentage),
        isDefault: policyForm.isDefault,
      });
      setPolicies((prev) => [...prev, newPolicy]);
      setPolicyForm({
        name: '',
        description: '',
        daysBeforeEvent: '',
        refundPercentage: '',
        isDefault: false,
      });
      showToast('Politica creada', 'success');
    } catch {
      showToast('Error al crear la politica', 'error');
    } finally {
      setCreatingPolicy(false);
    }
  };

  const handleDeletePolicy = async (id: string) => {
    if (!confirm('Eliminar esta politica de reembolso?')) return;
    setDeletingPolicy(id);
    try {
      await deleteRefundPolicy(id);
      setPolicies((prev) => prev.filter((p) => p.id !== id));
      showToast('Politica eliminada', 'success');
    } catch {
      showToast('Error al eliminar la politica', 'error');
    } finally {
      setDeletingPolicy(null);
    }
  };

  const inputClass =
    'input-theme w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition';
  const labelClass = 'block text-sm font-medium mb-1.5';

  return (
    <div className="p-6 lg:p-8 space-y-8 animate-fade-in max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold" style={{ color: 'var(--fg)' }}>
          Configuracion
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Gestiona tu perfil de empresa y preferencias
        </p>
      </div>

      {/* Company profile */}
      <form
        onSubmit={handleSaveProfile}
        className="rounded-2xl border p-6 space-y-5"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg" style={{ color: 'var(--fg)' }}>
            Perfil de empresa
          </h2>
          <button
            type="submit"
            disabled={savingProfile}
            className="btn-primary px-5 py-2 text-sm disabled:opacity-50"
          >
            {savingProfile ? 'Guardando...' : 'Guardar'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
              Nombre de la empresa
            </label>
            <input
              type="text"
              value={companyForm.companyName}
              onChange={(e) =>
                setCompanyForm((prev) => ({ ...prev, companyName: e.target.value }))
              }
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
              Descripcion
            </label>
            <textarea
              value={companyForm.companyDescription}
              onChange={(e) =>
                setCompanyForm((prev) => ({ ...prev, companyDescription: e.target.value }))
              }
              rows={3}
              placeholder="Describe tu empresa..."
              className={`${inputClass} resize-y`}
            />
          </div>

          <div>
            <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
              Sitio web
            </label>
            <input
              type="url"
              value={companyForm.companyWebsite}
              onChange={(e) =>
                setCompanyForm((prev) => ({ ...prev, companyWebsite: e.target.value }))
              }
              placeholder="https://..."
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
              Telefono
            </label>
            <input
              type="tel"
              value={companyForm.phone}
              onChange={(e) =>
                setCompanyForm((prev) => ({ ...prev, phone: e.target.value }))
              }
              placeholder="+52 55 1234 5678"
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
              URL del logo
            </label>
            <input
              type="url"
              value={companyForm.companyLogo}
              onChange={(e) =>
                setCompanyForm((prev) => ({ ...prev, companyLogo: e.target.value }))
              }
              placeholder="https://ejemplo.com/logo.png"
              className={inputClass}
            />
            {companyForm.companyLogo && (
              <div className="mt-3 flex items-center gap-3">
                <img
                  src={companyForm.companyLogo}
                  alt="Logo preview"
                  className="w-16 h-16 rounded-xl object-cover border"
                  style={{ borderColor: 'var(--border)' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Vista previa del logo
                </span>
              </div>
            )}
          </div>
        </div>
      </form>

      {/* Refund policies */}
      <div
        className="rounded-2xl border p-6 space-y-5"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <h2 className="font-bold text-lg" style={{ color: 'var(--fg)' }}>
          Politicas de reembolso
        </h2>

        {/* Existing policies */}
        {loadingPolicies ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="shimmer h-20 rounded-xl" />
            ))}
          </div>
        ) : policies.length === 0 ? (
          <p className="text-sm py-4" style={{ color: 'var(--text-secondary)' }}>
            No tienes politicas de reembolso. Crea una a continuacion.
          </p>
        ) : (
          <div className="space-y-3">
            {policies.map((policy) => (
              <div
                key={policy.id}
                className="rounded-xl p-4 flex items-start justify-between gap-4"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm" style={{ color: 'var(--fg)' }}>
                      {policy.name}
                    </h4>
                    {policy.isDefault && (
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                        style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}
                      >
                        Default
                      </span>
                    )}
                  </div>
                  {policy.description && (
                    <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                      {policy.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    <span>
                      {policy.refundPercentage}% de reembolso
                    </span>
                    <span>
                      Hasta {policy.daysBeforeEvent} dias antes
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeletePolicy(policy.id)}
                  disabled={deletingPolicy === policy.id}
                  className="p-2 rounded-lg transition flex-shrink-0 disabled:opacity-50"
                  style={{ color: '#ef4444' }}
                  title="Eliminar politica"
                >
                  {deletingPolicy === policy.id ? (
                    <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Create new policy form */}
        <form onSubmit={handleCreatePolicy} className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--fg)' }}>
            Nueva politica
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
                Nombre *
              </label>
              <input
                type="text"
                required
                value={policyForm.name}
                onChange={(e) =>
                  setPolicyForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="ej: Politica flexible"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
                Descripcion
              </label>
              <input
                type="text"
                value={policyForm.description}
                onChange={(e) =>
                  setPolicyForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Descripcion opcional"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
                Dias antes del evento *
              </label>
              <input
                type="number"
                required
                min="0"
                value={policyForm.daysBeforeEvent}
                onChange={(e) =>
                  setPolicyForm((prev) => ({ ...prev, daysBeforeEvent: e.target.value }))
                }
                placeholder="ej: 7"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
                Porcentaje de reembolso *
              </label>
              <input
                type="number"
                required
                min="0"
                max="100"
                value={policyForm.refundPercentage}
                onChange={(e) =>
                  setPolicyForm((prev) => ({ ...prev, refundPercentage: e.target.value }))
                }
                placeholder="ej: 100"
                className={inputClass}
              />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer mt-4">
            <div
              className="relative w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer"
              style={{ background: policyForm.isDefault ? '#e63946' : 'var(--border)' }}
              onClick={() =>
                setPolicyForm((prev) => ({ ...prev, isDefault: !prev.isDefault }))
              }
            >
              <div
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200"
                style={{
                  transform: policyForm.isDefault ? 'translateX(22px)' : 'translateX(2px)',
                }}
              />
            </div>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Politica por defecto
            </span>
          </label>

          <button
            type="submit"
            disabled={creatingPolicy}
            className="btn-primary px-5 py-2.5 text-sm mt-4 disabled:opacity-50"
          >
            {creatingPolicy ? 'Creando...' : 'Crear politica'}
          </button>
        </form>
      </div>

      {/* Notification preferences (visual only) */}
      <div
        className="rounded-2xl border p-6 space-y-5"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <h2 className="font-bold text-lg" style={{ color: 'var(--fg)' }}>
          Notificaciones
        </h2>

        <div className="space-y-4">
          {[
            { key: 'emailTickets' as const, label: 'Email por cada ticket vendido', desc: 'Recibe un correo cada vez que se venda un ticket' },
            { key: 'emailReviews' as const, label: 'Email por nuevas resenas', desc: 'Notificacion cuando un usuario deje una resena' },
            { key: 'emailWeeklyReport' as const, label: 'Reporte semanal por email', desc: 'Resumen semanal de ventas y metricas' },
            { key: 'pushNewTicket' as const, label: 'Notificacion push - Nuevo ticket', desc: 'Alerta en tiempo real por cada venta' },
            { key: 'pushEventReminder' as const, label: 'Recordatorio de evento', desc: 'Recordatorio 24h antes de tus eventos' },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between gap-4 py-2"
            >
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--fg)' }}>
                  {item.label}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {item.desc}
                </p>
              </div>
              <div
                className="relative w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer flex-shrink-0"
                style={{ background: notifications[item.key] ? '#e63946' : 'var(--border)' }}
                onClick={() =>
                  setNotifications((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
                }
              >
                <div
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200"
                  style={{
                    transform: notifications[item.key]
                      ? 'translateX(22px)'
                      : 'translateX(2px)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div
        className="rounded-2xl border p-6"
        style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.03)' }}
      >
        <h2 className="font-bold text-lg mb-2" style={{ color: '#ef4444' }}>
          Zona de peligro
        </h2>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          Una vez que desactives tu cuenta, se ocultaran todos tus eventos y no podras acceder a este panel.
          Esta accion se puede revertir contactando al soporte.
        </p>
        <button
          className="px-5 py-2.5 rounded-xl text-sm font-bold transition"
          style={{
            background: 'rgba(239,68,68,0.1)',
            color: '#ef4444',
            border: '1px solid rgba(239,68,68,0.3)',
          }}
          onClick={() => alert('Contacta a soporte para desactivar tu cuenta.')}
        >
          Desactivar cuenta
        </button>
      </div>
    </div>
  );
}
