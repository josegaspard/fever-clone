'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { updateProfile, getTickets, getPlans, getFavorites, Ticket, Plan, Event } from '@/lib/api';
import { useToast } from '@/components/Toast';

export default function ProfilePage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');

  // Stats
  const [stats, setStats] = useState({ tickets: 0, plans: 0, favorites: 0 });
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login?redirect=/profile');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setPhone(user.phone || '');
    setCompanyName(user.companyName || '');
    setCompanyDescription(user.companyDescription || '');
    setCompanyWebsite(user.companyWebsite || '');

    // Load stats
    Promise.all([
      getTickets().catch(() => ({ data: [] })),
      getPlans().catch(() => ({ data: [] })),
      getFavorites().catch(() => []),
    ]).then(([t, p, f]) => {
      setStats({
        tickets: (t.data || []).length,
        plans: (p.data || []).length,
        favorites: (Array.isArray(f) ? f : []).length,
      });
      setRecentTickets((t.data || []).slice(0, 3));
    });
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        name,
        phone: phone || undefined,
        companyName: companyName || undefined,
        companyDescription: companyDescription || undefined,
        companyWebsite: companyWebsite || undefined,
      });
      showToast('Perfil actualizado');
      setEditing(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const isBusiness = user?.userType === 'BUSINESS';

  if (authLoading || !user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="space-y-4">
          <div className="shimmer h-20 w-20 rounded-full mx-auto" />
          <div className="shimmer h-6 w-48 rounded mx-auto" />
          <div className="shimmer h-4 w-32 rounded mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center">
        <div
          className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-2xl font-bold text-white mb-4"
          style={{ background: 'linear-gradient(135deg, #e63946, #ff6b6b)' }}
        >
          {(user.name || 'U').charAt(0).toUpperCase()}
        </div>
        <h1 className="text-2xl font-black" style={{ color: 'var(--fg)' }}>{user.name}</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{user.email}</p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: isBusiness ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)',
              color: isBusiness ? '#10b981' : '#6366f1',
            }}
          >
            {isBusiness ? 'EMPRESA' : user.userType === 'SUPERADMIN' ? 'ADMIN' : 'USUARIO'}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Tickets', value: stats.tickets, href: '/tickets', icon: '🎫' },
          { label: 'Days', value: stats.plans, href: '/plans', icon: '📅' },
          { label: 'Favoritos', value: stats.favorites, href: '/favorites', icon: '❤️' },
        ].map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-2xl p-4 text-center border transition hover:border-[#e63946]/30"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <span className="text-2xl block">{s.icon}</span>
            <p className="text-xl font-black mt-1" style={{ color: 'var(--fg)' }}>{s.value}</p>
            <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{s.label}</p>
          </Link>
        ))}
      </div>

      {/* Profile form */}
      <div className="rounded-2xl border p-6" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold" style={{ color: 'var(--fg)' }}>Informacion personal</h2>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="text-sm text-[#e63946] font-medium hover:underline">
              Editar
            </button>
          ) : (
            <button onClick={() => setEditing(false)} className="text-sm font-medium hover:underline" style={{ color: 'var(--text-secondary)' }}>
              Cancelar
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Nombre</label>
            {editing ? (
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full input-theme rounded-xl px-4 py-2.5 text-sm" />
            ) : (
              <p className="text-sm py-2.5" style={{ color: 'var(--fg)' }}>{user.name}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email</label>
            <p className="text-sm py-2.5" style={{ color: 'var(--text-tertiary)' }}>{user.email}</p>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Telefono</label>
            {editing ? (
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+52 55 1234 5678" className="w-full input-theme rounded-xl px-4 py-2.5 text-sm" />
            ) : (
              <p className="text-sm py-2.5" style={{ color: user.phone ? 'var(--fg)' : 'var(--text-tertiary)' }}>{user.phone || 'Sin telefono'}</p>
            )}
          </div>

          {isBusiness && (
            <>
              <hr style={{ borderColor: 'var(--border)' }} />
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Datos de empresa</p>
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Nombre de empresa</label>
                {editing ? (
                  <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full input-theme rounded-xl px-4 py-2.5 text-sm" />
                ) : (
                  <p className="text-sm py-2.5" style={{ color: 'var(--fg)' }}>{user.companyName || '-'}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Descripcion</label>
                {editing ? (
                  <textarea value={companyDescription} onChange={(e) => setCompanyDescription(e.target.value)} rows={3} className="w-full input-theme rounded-xl px-4 py-2.5 text-sm resize-none" />
                ) : (
                  <p className="text-sm py-2.5" style={{ color: user.companyDescription ? 'var(--fg)' : 'var(--text-tertiary)' }}>{user.companyDescription || 'Sin descripcion'}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Sitio web</label>
                {editing ? (
                  <input value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} placeholder="https://..." className="w-full input-theme rounded-xl px-4 py-2.5 text-sm" />
                ) : (
                  <p className="text-sm py-2.5" style={{ color: user.companyWebsite ? 'var(--fg)' : 'var(--text-tertiary)' }}>{user.companyWebsite || 'Sin sitio web'}</p>
                )}
              </div>
            </>
          )}

          {editing && (
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="w-full btn-primary py-3 text-sm disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          )}
        </div>
      </div>

      {/* Recent tickets */}
      {recentTickets.length > 0 && (
        <div className="rounded-2xl border p-6" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ color: 'var(--fg)' }}>Tickets recientes</h2>
            <Link href="/tickets" className="text-xs text-[#e63946] font-medium hover:underline">Ver todos</Link>
          </div>
          <div className="space-y-3">
            {recentTickets.map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--surface-2)' }}>
                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0" style={{ background: 'var(--border)' }}>
                  {t.event?.image && <img src={t.event.image as string} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--fg)' }}>{(t.event?.title as string) || 'Evento'}</p>
                  <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                    {t.status === 'ACTIVE' ? '🟢 Activo' : t.status === 'USED' ? '⚪ Usado' : '🔴 Cancelado'}
                  </p>
                </div>
                <code className="text-[10px] px-2 py-1 rounded shrink-0" style={{ background: 'var(--card)', color: 'var(--text-tertiary)' }}>
                  {t.qrCode?.slice(0, 8)}
                </code>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/build-day" className="rounded-2xl border p-4 text-center transition hover:border-[#e63946]/30" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <span className="text-2xl block mb-1">🎯</span>
          <p className="text-sm font-bold" style={{ color: 'var(--fg)' }}>Arma tu Day</p>
          <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Crea un plan perfecto</p>
        </Link>
        <Link href="/search" className="rounded-2xl border p-4 text-center transition hover:border-[#e63946]/30" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <span className="text-2xl block mb-1">🔍</span>
          <p className="text-sm font-bold" style={{ color: 'var(--fg)' }}>Explorar eventos</p>
          <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Descubre algo nuevo</p>
        </Link>
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl border p-6" style={{ borderColor: 'var(--border)' }}>
        <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--text-secondary)' }}>Sesion</h2>
        <button
          onClick={() => { logout(); router.push('/'); }}
          className="px-4 py-2 rounded-xl text-sm font-medium border transition hover:border-[#e63946] hover:text-[#e63946]"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
        >
          Cerrar sesion
        </button>
      </div>
    </div>
  );
}
