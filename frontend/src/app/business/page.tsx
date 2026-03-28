'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getBusinessStats, getBusinessEvents, Event, Ticket } from '@/lib/api';

interface BusinessStats {
  totalEvents: number;
  totalTicketsSold: number;
  totalRevenue: number;
  eventsByStatus: { status: string; count: number }[];
  recentTickets: Ticket[];
}

export default function BusinessDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<BusinessStats | null>(null);
  const [topEvents, setTopEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, eventsRes] = await Promise.all([
          getBusinessStats(),
          getBusinessEvents({ limit: 10 }),
        ]);
        setStats(s);
        // Sort events by soldCount descending and take top 3
        const sorted = [...(eventsRes.data || [])].sort(
          (a, b) => (b.soldCount || 0) - (a.soldCount || 0)
        );
        setTopEvents(sorted.slice(0, 3));
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const conversionRate =
    stats && stats.totalEvents > 0
      ? ((stats.totalTicketsSold / Math.max(stats.totalEvents * 100, 1)) * 100).toFixed(1)
      : '0';

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return d;
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header skeleton */}
        <div className="shimmer h-8 rounded-lg w-64" />
        <div className="shimmer h-4 rounded w-48" />

        {/* Stats skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="shimmer h-28 rounded-2xl" />
          ))}
        </div>

        {/* Quick actions skeleton */}
        <div className="flex gap-3">
          <div className="shimmer h-12 w-40 rounded-xl" />
          <div className="shimmer h-12 w-40 rounded-xl" />
        </div>

        {/* Table skeleton */}
        <div className="shimmer h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold" style={{ color: 'var(--fg)' }}>
          Bienvenido, {user?.companyName || user?.name}
        </h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
          Resumen de tu actividad empresarial
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {[
          {
            label: 'Total Eventos',
            value: String(stats?.totalEvents || 0),
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            ),
            color: '#6366f1',
          },
          {
            label: 'Tickets Vendidos',
            value: String(stats?.totalTicketsSold || 0),
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            ),
            color: '#10b981',
          },
          {
            label: 'Ingresos',
            value: formatCurrency(stats?.totalRevenue || 0),
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            color: '#f59e0b',
          },
          {
            label: 'Tasa de Conversion',
            value: `${conversionRate}%`,
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            ),
            color: '#e63946',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="animate-fade-in rounded-2xl p-5 border transition-all duration-200"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                {stat.label}
              </span>
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${stat.color}15`, color: stat.color }}
              >
                {stat.icon}
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--fg)' }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/business/events/new"
          className="btn-primary flex items-center gap-2 px-5 py-3 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Crear evento
        </Link>
        <Link
          href="/business/analytics"
          className="btn-secondary flex items-center gap-2 px-5 py-3 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Ver analiticas
        </Link>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent tickets */}
        <div
          className="lg:col-span-2 rounded-2xl border p-5"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--fg)' }}>
            Tickets recientes
          </h2>
          {!stats?.recentTickets || stats.recentTickets.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
              Aun no hay tickets vendidos
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th className="pb-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Evento
                    </th>
                    <th className="pb-3 text-left font-medium hidden sm:table-cell" style={{ color: 'var(--text-secondary)' }}>
                      Estado
                    </th>
                    <th className="pb-3 text-left font-medium hidden md:table-cell" style={{ color: 'var(--text-secondary)' }}>
                      Fecha
                    </th>
                    <th className="pb-3 text-right font-medium" style={{ color: 'var(--text-secondary)' }}>
                      QR
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentTickets.slice(0, 5).map((ticket) => (
                    <tr key={ticket.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="py-3 pr-4">
                        <span className="font-medium truncate block max-w-[200px]" style={{ color: 'var(--fg)' }}>
                          {ticket.event?.title || 'Evento'}
                        </span>
                      </td>
                      <td className="py-3 hidden sm:table-cell">
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            background:
                              ticket.status === 'ACTIVE'
                                ? 'rgba(16,185,129,0.1)'
                                : ticket.status === 'USED'
                                ? 'rgba(99,102,241,0.1)'
                                : 'rgba(239,68,68,0.1)',
                            color:
                              ticket.status === 'ACTIVE'
                                ? '#10b981'
                                : ticket.status === 'USED'
                                ? '#6366f1'
                                : '#ef4444',
                          }}
                        >
                          {ticket.status === 'ACTIVE'
                            ? 'Activo'
                            : ticket.status === 'USED'
                            ? 'Usado'
                            : 'Cancelado'}
                        </span>
                      </td>
                      <td
                        className="py-3 hidden md:table-cell text-sm"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {formatDate(ticket.createdAt)}
                      </td>
                      <td className="py-3 text-right">
                        <code
                          className="text-xs px-2 py-1 rounded"
                          style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}
                        >
                          {ticket.qrCode?.slice(0, 8)}...
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Event performance */}
        <div
          className="rounded-2xl border p-5"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--fg)' }}>
            Top eventos
          </h2>
          {topEvents.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
              Crea tu primer evento
            </p>
          ) : (
            <div className="space-y-3">
              {topEvents.map((event, idx) => (
                <Link
                  key={event.id}
                  href={`/business/events/${event.id}/edit`}
                  className="block rounded-xl p-3 border transition-all duration-200 hover:border-[#e63946]/30"
                  style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{
                        background:
                          idx === 0 ? '#f59e0b' : idx === 1 ? '#9ca3af' : '#cd7f32',
                      }}
                    >
                      {idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-sm font-semibold truncate"
                        style={{ color: 'var(--fg)' }}
                      >
                        {event.title}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        {event.soldCount || 0} tickets vendidos
                      </p>
                      {event.capacity && (
                        <div className="mt-2">
                          <div
                            className="h-1.5 rounded-full overflow-hidden"
                            style={{ background: 'var(--border)' }}
                          >
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(
                                  ((event.soldCount || 0) / event.capacity) * 100,
                                  100
                                )}%`,
                                background: 'linear-gradient(135deg, #e63946, #ff6b6b)',
                              }}
                            />
                          </div>
                          <p className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
                            {event.soldCount || 0}/{event.capacity} capacidad
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
