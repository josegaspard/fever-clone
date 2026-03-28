'use client';

import { useEffect, useState } from 'react';
import { getBusinessStats, getBusinessEvents, Event } from '@/lib/api';

interface BusinessStats {
  totalEvents: number;
  totalTicketsSold: number;
  totalRevenue: number;
  eventsByStatus: { status: string; count: number }[];
  recentTickets: Array<{
    id: string;
    eventId: string;
    status: string;
    createdAt: string;
    event: Partial<Event> | null;
  }>;
}

type TimePeriod = '7d' | '30d' | 'all';

export default function BusinessAnalyticsPage() {
  const [stats, setStats] = useState<BusinessStats | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<TimePeriod>('all');

  useEffect(() => {
    async function load() {
      try {
        const [s, eventsRes] = await Promise.all([
          getBusinessStats(),
          getBusinessEvents({ limit: 50 }),
        ]);
        setStats(s);
        setEvents(eventsRes.data || []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

  // Sort events by soldCount for the bar chart
  const sortedByTickets = [...events]
    .filter((e) => (e.soldCount || 0) > 0)
    .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
    .slice(0, 8);

  const maxTickets = sortedByTickets.length > 0
    ? Math.max(...sortedByTickets.map((e) => e.soldCount || 0))
    : 1;

  const periods: { key: TimePeriod; label: string }[] = [
    { key: '7d', label: 'Ultimos 7 dias' },
    { key: '30d', label: 'Ultimos 30 dias' },
    { key: 'all', label: 'Todo el tiempo' },
  ];

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <div className="shimmer h-8 rounded-lg w-48" />
        <div className="shimmer h-4 rounded w-36" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="shimmer h-28 rounded-2xl" />
          ))}
        </div>
        <div className="shimmer h-80 rounded-2xl" />
        <div className="shimmer h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold" style={{ color: 'var(--fg)' }}>
            Analiticas
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Rendimiento de tus eventos
          </p>
        </div>

        {/* Time period selector */}
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--card)' }}>
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className="px-3 py-1.5 text-xs rounded-lg font-medium transition-all duration-200"
              style={{
                background: period === p.key ? 'var(--surface-2)' : 'transparent',
                color: period === p.key ? 'var(--fg)' : 'var(--text-secondary)',
                boxShadow: period === p.key ? 'var(--shadow)' : 'none',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Revenue overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className="rounded-2xl border p-6"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Ingresos totales
            </span>
            <div className="flex items-center gap-1 text-xs font-medium" style={{ color: '#10b981' }}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              +12%
            </div>
          </div>
          <p className="text-3xl font-extrabold" style={{ color: 'var(--fg)' }}>
            {formatCurrency(stats?.totalRevenue || 0)}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            vs periodo anterior
          </p>
        </div>

        <div
          className="rounded-2xl border p-6"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
            Total tickets vendidos
          </span>
          <p className="text-3xl font-extrabold mt-2" style={{ color: 'var(--fg)' }}>
            {stats?.totalTicketsSold || 0}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            en {stats?.totalEvents || 0} eventos
          </p>
        </div>

        <div
          className="rounded-2xl border p-6"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
            Ingreso promedio por evento
          </span>
          <p className="text-3xl font-extrabold mt-2" style={{ color: 'var(--fg)' }}>
            {stats && stats.totalEvents > 0
              ? formatCurrency(stats.totalRevenue / stats.totalEvents)
              : formatCurrency(0)}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            promedio general
          </p>
        </div>
      </div>

      {/* Tickets sold per event - horizontal bar chart */}
      <div
        className="rounded-2xl border p-6"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <h2 className="font-bold text-lg mb-6" style={{ color: 'var(--fg)' }}>
          Tickets vendidos por evento
        </h2>
        {sortedByTickets.length === 0 ? (
          <p className="text-center py-12 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Aun no hay datos de tickets
          </p>
        ) : (
          <div className="space-y-4">
            {sortedByTickets.map((event) => {
              const pct = ((event.soldCount || 0) / maxTickets) * 100;
              return (
                <div key={event.id} className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium truncate max-w-[60%]" style={{ color: 'var(--fg)' }}>
                      {event.title}
                    </span>
                    <span className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
                      {event.soldCount || 0}
                    </span>
                  </div>
                  <div
                    className="h-3 rounded-full overflow-hidden"
                    style={{ background: 'var(--surface-2)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${pct}%`,
                        background: 'linear-gradient(135deg, #e63946, #ff6b6b)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Performance table */}
      <div
        className="rounded-2xl border p-6"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <h2 className="font-bold text-lg mb-4" style={{ color: 'var(--fg)' }}>
          Rendimiento por evento
        </h2>
        {events.length === 0 ? (
          <p className="text-center py-12 text-sm" style={{ color: 'var(--text-secondary)' }}>
            No hay eventos registrados
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="pb-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Evento
                  </th>
                  <th className="pb-3 text-center font-medium hidden sm:table-cell" style={{ color: 'var(--text-secondary)' }}>
                    Estado
                  </th>
                  <th className="pb-3 text-right font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Tickets
                  </th>
                  <th className="pb-3 text-right font-medium hidden md:table-cell" style={{ color: 'var(--text-secondary)' }}>
                    Ingresos
                  </th>
                  <th className="pb-3 text-right font-medium hidden lg:table-cell" style={{ color: 'var(--text-secondary)' }}>
                    Rating
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        {event.image && (
                          <img
                            src={event.image}
                            alt=""
                            className="w-8 h-8 rounded-lg object-cover hidden sm:block flex-shrink-0"
                          />
                        )}
                        <span className="font-medium truncate max-w-[200px]" style={{ color: 'var(--fg)' }}>
                          {event.title}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-center hidden sm:table-cell">
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          background:
                            (event.status || '').toUpperCase() === 'PUBLISHED'
                              ? 'rgba(16,185,129,0.1)'
                              : (event.status || '').toUpperCase() === 'DRAFT'
                              ? 'rgba(245,158,11,0.1)'
                              : 'rgba(107,114,128,0.1)',
                          color:
                            (event.status || '').toUpperCase() === 'PUBLISHED'
                              ? '#10b981'
                              : (event.status || '').toUpperCase() === 'DRAFT'
                              ? '#f59e0b'
                              : '#6b7280',
                        }}
                      >
                        {(event.status || '').toUpperCase() === 'PUBLISHED'
                          ? 'Publicado'
                          : (event.status || '').toUpperCase() === 'DRAFT'
                          ? 'Borrador'
                          : 'Archivado'}
                      </span>
                    </td>
                    <td className="py-3 text-right font-medium" style={{ color: 'var(--fg)' }}>
                      {event.soldCount || 0}
                    </td>
                    <td className="py-3 text-right hidden md:table-cell" style={{ color: 'var(--fg)' }}>
                      {formatCurrency((event.soldCount || 0) * event.price)}
                    </td>
                    <td className="py-3 text-right hidden lg:table-cell">
                      {event.rating && event.rating > 0 ? (
                        <div className="flex items-center justify-end gap-1">
                          <svg className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                          <span className="text-sm font-medium" style={{ color: 'var(--fg)' }}>
                            {event.rating.toFixed(1)}
                          </span>
                          {event.reviewCount !== undefined && (
                            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                              ({event.reviewCount})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          Sin rating
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Events by status breakdown */}
      {stats?.eventsByStatus && stats.eventsByStatus.length > 0 && (
        <div
          className="rounded-2xl border p-6"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <h2 className="font-bold text-lg mb-4" style={{ color: 'var(--fg)' }}>
            Eventos por estado
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {stats.eventsByStatus.map((item) => {
              const colorMap: Record<string, string> = {
                PUBLISHED: '#10b981',
                DRAFT: '#f59e0b',
                ARCHIVED: '#6b7280',
              };
              const labelMap: Record<string, string> = {
                PUBLISHED: 'Publicados',
                DRAFT: 'Borradores',
                ARCHIVED: 'Archivados',
              };
              const color = colorMap[(item.status || '').toUpperCase()] || '#6b7280';
              const label = labelMap[(item.status || '').toUpperCase()] || item.status;
              return (
                <div
                  key={item.status}
                  className="rounded-xl p-4 text-center"
                  style={{ background: 'var(--surface-2)' }}
                >
                  <div
                    className="w-3 h-3 rounded-full mx-auto mb-2"
                    style={{ background: color }}
                  />
                  <p className="text-2xl font-bold" style={{ color: 'var(--fg)' }}>
                    {item.count}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
