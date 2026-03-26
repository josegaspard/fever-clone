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
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
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

  const filtered = events.filter((e) =>
    tab === 'all' ? true : e.status === tab
  );

  const stats = {
    total: events.length,
    published: events.filter((e) => e.status === 'published').length,
    draft: events.filter((e) => e.status === 'draft').length,
    archived: events.filter((e) => e.status === 'archived').length,
  };

  if (authLoading || !user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[#1a1a1a] rounded w-48" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-[#1a1a1a] rounded-xl" />
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
          { label: 'Total eventos', value: stats.total, color: 'text-white' },
          {
            label: 'Publicados',
            value: stats.published,
            color: 'text-green-400',
          },
          { label: 'Borradores', value: stats.draft, color: 'text-yellow-400' },
          {
            label: 'Archivados',
            value: stats.archived,
            color: 'text-gray-400',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4"
          >
            <p className="text-sm text-gray-400">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-[#1a1a1a] rounded-lg p-1 inline-flex">
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
            className={`px-4 py-2 text-sm rounded-md transition ${
              tab === t.key
                ? 'bg-[#2a2a2a] text-white font-medium'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-[#1a1a1a] rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          No hay eventos en esta categoría.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a2a] text-left text-gray-400">
                <th className="pb-3 font-medium">Título</th>
                <th className="pb-3 font-medium hidden md:table-cell">Ciudad</th>
                <th className="pb-3 font-medium hidden md:table-cell">Categoría</th>
                <th className="pb-3 font-medium">Estado</th>
                <th className="pb-3 font-medium hidden sm:table-cell">Fecha</th>
                <th className="pb-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {filtered.map((event) => (
                <tr key={event.id} className="hover:bg-[#1a1a1a] transition">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      {event.image && (
                        <img
                          src={event.image}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover hidden sm:block"
                        />
                      )}
                      <span className="font-medium text-white truncate max-w-[200px]">
                        {event.title}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 text-gray-400 hidden md:table-cell">
                    {event.city?.name || '-'}
                  </td>
                  <td className="py-3 text-gray-400 hidden md:table-cell">
                    {event.category?.name || '-'}
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        event.status === 'published'
                          ? 'bg-green-500/10 text-green-400'
                          : event.status === 'draft'
                          ? 'bg-yellow-500/10 text-yellow-400'
                          : 'bg-gray-500/10 text-gray-400'
                      }`}
                    >
                      {event.status === 'published'
                        ? 'Publicado'
                        : event.status === 'draft'
                        ? 'Borrador'
                        : 'Archivado'}
                    </span>
                  </td>
                  <td className="py-3 text-gray-400 hidden sm:table-cell">
                    {new Date(event.date).toLocaleDateString('es-ES')}
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/events/${event.id}/edit`}
                        className="px-3 py-1 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg text-xs transition"
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
