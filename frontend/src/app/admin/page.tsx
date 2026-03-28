'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Event, getAdminEvents, deleteEvent } from '@/lib/api';

type StatusTab = 'all' | 'published' | 'draft' | 'archived';

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<StatusTab>('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role.toUpperCase() !== 'ADMIN')) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role?.toUpperCase() === 'ADMIN') {
      loadEvents();
    }
  }, [user]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await getAdminEvents();
      setEvents(Array.isArray(data) ? data : []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este evento?')) return;
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

  const s = (v: string) => (v || '').toUpperCase();
  const filtered = events.filter((e) =>
    tab === 'all' ? true : s(e.status) === tab.toUpperCase()
  );

  const stats = {
    total: events.length,
    published: events.filter((e) => s(e.status) === 'PUBLISHED').length,
    draft: events.filter((e) => s(e.status) === 'DRAFT').length,
    archived: events.filter((e) => s(e.status) === 'ARCHIVED').length,
  };

  if (authLoading || !user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 rounded w-48" style={{ background: 'var(--card)' }} />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl" style={{ background: 'var(--card)' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold">Admin Panel</h1>
        <Link
          href="/admin/events/new"
          className="px-5 py-2.5 bg-[#e63946] hover:bg-[#c62d3a] rounded-lg text-sm font-bold transition"
        >
          + Crear evento
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total eventos', value: stats.total, color: '' },
          {
            label: 'Publicados',
            value: stats.published,
            color: 'text-green-400',
          },
          { label: 'Borradores', value: stats.draft, color: 'text-yellow-400' },
          {
            label: 'Archivados',
            value: stats.archived,
            color: '',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl p-4"
            style={{ background: 'var(--card)', borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid' }}
          >
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 rounded-lg p-1 inline-flex" style={{ background: 'var(--card)' }}>
        {(
          [
            { key: 'all', label: 'Todos' },
            { key: 'published', label: 'Publicados' },
            { key: 'draft', label: 'Borradores' },
            { key: 'archived', label: 'Archivados' },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm rounded-md transition font-medium`}
            style={tab === t.key ? { background: 'var(--surface-2)', color: 'var(--fg)' } : { color: 'var(--text-secondary)' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg animate-pulse" style={{ background: 'var(--card)' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-secondary)' }}>
          No hay eventos en esta categoría.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                <th className="pb-3 font-medium">Título</th>
                <th className="pb-3 font-medium hidden md:table-cell">Ciudad</th>
                <th className="pb-3 font-medium hidden md:table-cell">Categoría</th>
                <th className="pb-3 font-medium">Estado</th>
                <th className="pb-3 font-medium hidden sm:table-cell">Fecha</th>
                <th className="pb-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((event) => (
                <tr key={event.id} className="table-row-theme transition hover:opacity-80">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      {event.image && (
                        <img
                          src={event.image}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover hidden sm:block"
                        />
                      )}
                      <span className="font-medium truncate max-w-[200px]" style={{ color: 'var(--fg)' }}>
                        {event.title}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 hidden md:table-cell" style={{ color: 'var(--text-secondary)' }}>
                    {event.city?.name || '-'}
                  </td>
                  <td className="py-3 hidden md:table-cell" style={{ color: 'var(--text-secondary)' }}>
                    {event.category?.name || '-'}
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        s(event.status) === 'PUBLISHED'
                          ? 'bg-green-500/10 text-green-400'
                          : s(event.status) === 'DRAFT'
                          ? 'bg-yellow-500/10 text-yellow-400'
                          : 'bg-gray-500/10 text-gray-400'
                      }`}
                    >
                      {s(event.status) === 'PUBLISHED'
                        ? 'Publicado'
                        : s(event.status) === 'DRAFT'
                        ? 'Borrador'
                        : 'Archivado'}
                    </span>
                  </td>
                  <td className="py-3 hidden sm:table-cell" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(event.date).toLocaleDateString('es-ES')}
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/events/${event.id}/edit`}
                        className="px-3 py-1 rounded-lg text-xs transition"
                        style={{ background: 'var(--surface-2)' }}
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => handleDelete(event.id)}
                        disabled={deleting === event.id}
                        className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs transition disabled:opacity-50"
                      >
                        {deleting === event.id ? '...' : 'Eliminar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
