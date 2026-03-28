'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Event,
  getBusinessEvents,
  deleteEvent,
  updateEvent,
} from '@/lib/api';

type StatusTab = 'all' | 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';

export default function BusinessEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<StatusTab>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [statusChanging, setStatusChanging] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params: { status?: string; page: number; limit: number } = {
        page,
        limit: 12,
      };
      if (tab !== 'all') params.status = tab;
      const res = await getBusinessEvents(params);
      setEvents(res.data || []);
      setTotalPages(res.totalPages || 1);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    setPage(1);
  }, [tab]);

  const handleDelete = async (id: string) => {
    if (!confirm('Estas seguro de que quieres eliminar este evento? Esta accion no se puede deshacer.')) return;
    setDeleting(id);
    try {
      await deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch {
      alert('Error al eliminar el evento');
    } finally {
      setDeleting(null);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setStatusChanging(id);
    try {
      await updateEvent(id, { status: newStatus });
      setEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e))
      );
    } catch {
      alert('Error al cambiar el estado');
    } finally {
      setStatusChanging(null);
    }
  };

  const s = (v: string) => (v || '').toUpperCase();

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return d;
    }
  };

  const getStatusBadge = (status: string) => {
    const upper = s(status);
    const map: Record<string, { bg: string; color: string; label: string }> = {
      PUBLISHED: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', label: 'Publicado' },
      DRAFT: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', label: 'Borrador' },
      ARCHIVED: { bg: 'rgba(107,114,128,0.1)', color: '#6b7280', label: 'Archivado' },
    };
    const info = map[upper] || map.DRAFT;
    return (
      <span
        className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold"
        style={{ background: info.bg, color: info.color }}
      >
        {info.label}
      </span>
    );
  };

  const getCurrencySymbol = (c?: string) => {
    if (c === 'MXN' || c === 'USD') return '$';
    if (c === 'GBP') return '\u00A3';
    return '\u20AC';
  };

  const tabs: { key: StatusTab; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'PUBLISHED', label: 'Publicados' },
    { key: 'DRAFT', label: 'Borradores' },
    { key: 'ARCHIVED', label: 'Archivados' },
  ];

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold" style={{ color: 'var(--fg)' }}>
            Mis Eventos
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Gestiona tus eventos y su estado
          </p>
        </div>
        <Link
          href="/business/events/new"
          className="btn-primary flex items-center gap-2 px-5 py-3 text-sm self-start"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Crear nuevo evento
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 p-1 rounded-xl inline-flex" style={{ background: 'var(--card)' }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2 text-sm rounded-lg font-medium transition-all duration-200"
            style={{
              background: tab === t.key ? 'var(--surface-2)' : 'transparent',
              color: tab === t.key ? 'var(--fg)' : 'var(--text-secondary)',
              boxShadow: tab === t.key ? 'var(--shadow)' : 'none',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
              <div className="shimmer aspect-video" />
              <div className="p-4 space-y-3">
                <div className="shimmer h-5 rounded w-3/4" />
                <div className="shimmer h-4 rounded w-1/2" />
                <div className="shimmer h-4 rounded w-1/3" />
                <div className="flex gap-2 pt-2">
                  <div className="shimmer h-8 w-16 rounded-lg" />
                  <div className="shimmer h-8 w-16 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        /* Empty state */
        <div
          className="rounded-2xl border p-12 text-center"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div
            className="w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center"
            style={{ background: 'rgba(230,57,70,0.1)' }}
          >
            <svg className="w-10 h-10" style={{ color: '#e63946' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--fg)' }}>
            {tab === 'all' ? 'No tienes eventos aun' : 'No hay eventos en esta categoria'}
          </h3>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Crea tu primer evento y comienza a vender tickets
          </p>
          <Link
            href="/business/events/new"
            className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Crear tu primer evento
          </Link>
        </div>
      ) : (
        <>
          {/* Event cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((event) => (
              <div
                key={event.id}
                className="rounded-2xl overflow-hidden border transition-all duration-200 hover:border-[#e63946]/30"
                style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                  {event.videoUrl ? (
                    <video
                      src={event.videoUrl}
                      muted
                      loop
                      playsInline
                      poster={event.image}
                      className="w-full h-full object-cover"
                      onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play()}
                      onMouseLeave={(e) => {
                        const v = e.currentTarget as HTMLVideoElement;
                        v.pause();
                        v.currentTime = 0;
                      }}
                    />
                  ) : event.image ? (
                    <img src={event.image} alt={event.title} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-10 h-10" style={{ color: 'var(--text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  {/* Status badge overlay */}
                  <div className="absolute top-3 left-3">
                    {getStatusBadge(event.status)}
                  </div>
                  {event.featured && (
                    <div
                      className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-semibold"
                      style={{ background: 'rgba(245,158,11,0.9)', color: '#fff' }}
                    >
                      Destacado
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3
                    className="font-bold text-base line-clamp-1 mb-1"
                    style={{ color: 'var(--fg)' }}
                  >
                    {event.title}
                  </h3>
                  <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                    {formatDate(event.date)}
                    {event.city?.name ? ` \u00B7 ${event.city.name}` : ''}
                  </p>

                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-sm" style={{ color: 'var(--fg)' }}>
                      {event.price === 0 ? (
                        <span style={{ color: '#10b981' }}>Gratis</span>
                      ) : (
                        `${getCurrencySymbol(event.currency)}${event.price.toFixed(0)}`
                      )}
                    </span>
                    {event.capacity && (
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {event.soldCount || 0}/{event.capacity} vendidos
                      </span>
                    )}
                  </div>

                  {/* Capacity bar */}
                  {event.capacity && (
                    <div
                      className="h-1.5 rounded-full overflow-hidden mb-4"
                      style={{ background: 'var(--border)' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(
                            ((event.soldCount || 0) / event.capacity) * 100,
                            100
                          )}%`,
                          background: 'linear-gradient(135deg, #e63946, #ff6b6b)',
                        }}
                      />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => router.push(`/business/events/${event.id}/edit`)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
                      style={{ background: 'var(--surface-2)', color: 'var(--fg)', border: '1px solid var(--border)' }}
                    >
                      Editar
                    </button>
                    <Link
                      href={`/events/${event.slug}`}
                      target="_blank"
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
                      style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                    >
                      Ver
                    </Link>
                    {/* Status toggle */}
                    {s(event.status) === 'DRAFT' && (
                      <button
                        onClick={() => handleStatusChange(event.id, 'PUBLISHED')}
                        disabled={statusChanging === event.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-50"
                        style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}
                      >
                        {statusChanging === event.id ? '...' : 'Publicar'}
                      </button>
                    )}
                    {s(event.status) === 'PUBLISHED' && (
                      <button
                        onClick={() => handleStatusChange(event.id, 'ARCHIVED')}
                        disabled={statusChanging === event.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-50"
                        style={{ background: 'rgba(107,114,128,0.1)', color: '#6b7280' }}
                      >
                        {statusChanging === event.id ? '...' : 'Archivar'}
                      </button>
                    )}
                    {s(event.status) === 'ARCHIVED' && (
                      <button
                        onClick={() => handleStatusChange(event.id, 'DRAFT')}
                        disabled={statusChanging === event.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-50"
                        style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}
                      >
                        {statusChanging === event.id ? '...' : 'Reactivar'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(event.id)}
                      disabled={deleting === event.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-50 ml-auto"
                      style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
                    >
                      {deleting === event.id ? '...' : 'Eliminar'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-30"
                style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--fg)' }}
              >
                Anterior
              </button>
              <span className="text-sm px-3" style={{ color: 'var(--text-secondary)' }}>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-30"
                style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--fg)' }}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
