'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { getAdminStats, AdminStats, User, Event } from '@/lib/api';

/* ─── Animated Counter ─────────────────────────────────────────────────── */
function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    const duration = 1200;
    const start = performance.now();
    const from = 0;

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (progress < 1) {
        ref.current = requestAnimationFrame(animate);
      }
    };
    ref.current = requestAnimationFrame(animate);
    return () => {
      if (ref.current) cancelAnimationFrame(ref.current);
    };
  }, [value]);

  return <>{prefix}{display.toLocaleString()}{suffix}</>;
}

/* ─── Skeleton ─────────────────────────────────────────────────────────── */
function Skeleton({ width, height, radius = 8 }: { width: string | number; height: string | number; radius?: number }) {
  return (
    <div
      className="shimmer"
      style={{ width, height, borderRadius: radius, minWidth: typeof width === 'number' ? width : undefined }}
    />
  );
}

/* ─── Stat Card ────────────────────────────────────────────────────────── */
function StatCard({ icon, label, value, prefix, suffix, borderColor, loading }: {
  icon: React.ReactNode; label: string; value: number; prefix?: string; suffix?: string;
  borderColor: string; loading: boolean;
}) {
  return (
    <div
      style={{
        background: 'var(--card)',
        borderRadius: 16,
        padding: '24px 28px',
        border: '1px solid var(--border)',
        borderLeft: `4px solid ${borderColor}`,
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      className="card-hover"
    >
      <div style={{
        width: 52,
        height: 52,
        borderRadius: 14,
        background: `${borderColor}18`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: borderColor,
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        {loading ? (
          <>
            <Skeleton width={80} height={32} />
            <div style={{ height: 6 }} />
            <Skeleton width={100} height={14} />
          </>
        ) : (
          <>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--fg)', lineHeight: 1.1, letterSpacing: -0.5 }}>
              <AnimatedNumber value={value} prefix={prefix} suffix={suffix} />
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, marginTop: 4 }}>
              {label}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Bar Chart ────────────────────────────────────────────────────────── */
function BarChart({ data, colors, title, loading }: {
  data: { label: string; value: number }[];
  colors: Record<string, string>;
  title: string;
  loading: boolean;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div style={{
      background: 'var(--card)',
      borderRadius: 16,
      border: '1px solid var(--border)',
      padding: '24px 28px',
    }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: 'var(--fg)' }}>{title}</h3>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} width="100%" height={36} />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div style={{ color: 'var(--text-secondary)', fontSize: 14, padding: '20px 0' }}>Sin datos</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {data.map((item) => {
            const color = colors[item.label] || '#6b7280';
            const pct = (item.value / max) * 100;
            return (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                  <span style={{ color: 'var(--fg)' }}>{item.label}</span>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{item.value}</span>
                </div>
                <div style={{ height: 10, borderRadius: 5, background: 'var(--border)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      borderRadius: 5,
                      background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                      width: `${pct}%`,
                      transition: 'width 1s cubic-bezier(0.25,0.46,0.45,0.94)',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Table ────────────────────────────────────────────────────────────── */
function DataTable({ title, headers, rows, loading, emptyMsg }: {
  title: string;
  headers: string[];
  rows: React.ReactNode[][];
  loading: boolean;
  emptyMsg?: string;
}) {
  return (
    <div style={{
      background: 'var(--card)',
      borderRadius: 16,
      border: '1px solid var(--border)',
      overflow: 'hidden',
    }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg)' }}>{title}</h3>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h} style={{
                  textAlign: 'left',
                  padding: '12px 16px',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: 12,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  borderBottom: '1px solid var(--border)',
                  whiteSpace: 'nowrap',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {headers.map((h, j) => (
                    <td key={j} style={{ padding: '12px 16px' }}>
                      <Skeleton width={j === 0 ? 140 : 80} height={16} />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={headers.length} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  {emptyMsg || 'Sin datos'}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={i}
                  style={{
                    borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : undefined,
                    background: i % 2 === 1 ? 'rgba(128,128,128,0.03)' : undefined,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(230,57,70,0.04)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 === 1 ? 'rgba(128,128,128,0.03)' : ''; }}
                >
                  {row.map((cell, j) => (
                    <td key={j} style={{ padding: '12px 16px', color: 'var(--fg)', whiteSpace: 'nowrap' }}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Badge ────────────────────────────────────────────────────────────── */
function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, { bg: string; fg: string }> = {
    USER: { bg: 'rgba(59,130,246,0.12)', fg: '#3b82f6' },
    BUSINESS: { bg: 'rgba(34,197,94,0.12)', fg: '#22c55e' },
    SUPERADMIN: { bg: 'rgba(230,57,70,0.12)', fg: '#e63946' },
  };
  const c = colors[type.toUpperCase()] || { bg: 'rgba(128,128,128,0.12)', fg: '#888' };
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 6,
      fontSize: 11,
      fontWeight: 700,
      background: c.bg,
      color: c.fg,
      letterSpacing: 0.3,
    }}>
      {type}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; fg: string }> = {
    PUBLISHED: { bg: 'rgba(34,197,94,0.12)', fg: '#22c55e' },
    DRAFT: { bg: 'rgba(234,179,8,0.12)', fg: '#eab308' },
    ARCHIVED: { bg: 'rgba(128,128,128,0.12)', fg: '#888' },
  };
  const c = colors[status.toUpperCase()] || { bg: 'rgba(128,128,128,0.12)', fg: '#888' };
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 6,
      fontSize: 11,
      fontWeight: 700,
      background: c.bg,
      color: c.fg,
      letterSpacing: 0.3,
    }}>
      {status}
    </span>
  );
}

/* ─── Main Dashboard ───────────────────────────────────────────────────── */
export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAdminStats();
      setStats(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error cargando estadisticas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const userTypeColors: Record<string, string> = {
    USER: '#3b82f6',
    BUSINESS: '#22c55e',
    SUPERADMIN: '#e63946',
  };

  const statusColors: Record<string, string> = {
    PUBLISHED: '#22c55e',
    DRAFT: '#eab308',
    ARCHIVED: '#6b7280',
  };

  const userChartData = (stats?.usersByType || []).map((u) => ({
    label: u.type,
    value: u.count,
  }));

  const eventChartData = (stats?.eventsByStatus || []).map((e) => ({
    label: e.status,
    value: e.count,
  }));

  const userRows: React.ReactNode[][] = (stats?.recentUsers || []).slice(0, 10).map((u: User) => [
    <div key="name" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        background: 'linear-gradient(135deg, #e63946, #ff6b6b)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 700,
        fontSize: 13,
        flexShrink: 0,
      }}>
        {(u.name || '?').charAt(0).toUpperCase()}
      </div>
      <span style={{ fontWeight: 600 }}>{u.name}</span>
    </div>,
    u.email,
    <TypeBadge key="type" type={u.userType || 'USER'} />,
    new Date(u.id).toISOString() !== 'Invalid Date' ? '-' : '-',
  ]);

  const eventRows: React.ReactNode[][] = (stats?.recentEvents || []).slice(0, 10).map((e: Event) => [
    <span key="title" style={{ fontWeight: 600 }}>{e.title}</span>,
    e.city?.name || '-',
    e.category?.name || '-',
    <StatusBadge key="status" status={e.status || 'DRAFT'} />,
    `$${e.price?.toLocaleString() || '0'}`,
  ]);

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ color: '#e63946', fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Error</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{error}</div>
        <button onClick={loadStats} className="btn-primary" style={{ marginTop: 16, padding: '10px 24px', border: 'none', cursor: 'pointer' }}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--fg)', letterSpacing: -0.5, marginBottom: 4 }}>
          Dashboard
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Panel de administracion general de la plataforma
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 20,
        marginBottom: 32,
      }}
        className="stagger-children"
      >
        <div className="animate-fade-in">
          <StatCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            }
            label="Total Usuarios"
            value={stats?.totalUsers || 0}
            borderColor="#3b82f6"
            loading={loading}
          />
        </div>
        <div className="animate-fade-in">
          <StatCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            }
            label="Total Eventos"
            value={stats?.totalEvents || 0}
            borderColor="#22c55e"
            loading={loading}
          />
        </div>
        <div className="animate-fade-in">
          <StatCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                <path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" />
              </svg>
            }
            label="Tickets Vendidos"
            value={stats?.totalTickets || 0}
            borderColor="#a855f7"
            loading={loading}
          />
        </div>
        <div className="animate-fade-in">
          <StatCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            }
            label="Ingresos Totales"
            value={stats?.totalRevenue || 0}
            prefix="$"
            borderColor="#f97316"
            loading={loading}
          />
        </div>
      </div>

      {/* Charts Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 20,
        marginBottom: 32,
      }}>
        <BarChart
          title="Usuarios por Tipo"
          data={userChartData}
          colors={userTypeColors}
          loading={loading}
        />
        <BarChart
          title="Eventos por Estado"
          data={eventChartData}
          colors={statusColors}
          loading={loading}
        />
      </div>

      {/* Tables Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: 20,
      }}>
        <DataTable
          title="Usuarios Recientes"
          headers={['Nombre', 'Email', 'Tipo', '']}
          rows={userRows}
          loading={loading}
          emptyMsg="No hay usuarios recientes"
        />
        <DataTable
          title="Eventos Recientes"
          headers={['Titulo', 'Ciudad', 'Categoria', 'Estado', 'Precio']}
          rows={eventRows}
          loading={loading}
          emptyMsg="No hay eventos recientes"
        />
      </div>
    </div>
  );
}
