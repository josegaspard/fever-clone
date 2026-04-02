'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  status: string;
  category: string;
  featured: boolean;
  author_name: string;
  created_at: string;
  updated_at: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  guias: 'Guias',
  tendencias: 'Tendencias',
  eventos: 'Eventos',
  ciudades: 'Ciudades',
  gastronomia: 'Gastronomia',
  cultura: 'Cultura',
  tips: 'Tips',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function BlogAdminPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);

  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/blog', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      setPosts(json.data || []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Seguro que deseas eliminar este articulo?')) return;
    setDeleting(id);
    try {
      await fetch(`/api/blog/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      alert('Error al eliminar');
    } finally {
      setDeleting(null);
    }
  };

  const filteredPosts = posts.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: 'var(--fg)' }}
          >
            Blog
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Gestiona los articulos del blog
          </p>
        </div>
        <Link
          href="/super-admin/blog/new"
          className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
          style={{ textDecoration: 'none' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nuevo articulo
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar por titulo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-theme w-full md:w-80 px-4 py-2.5 rounded-xl text-sm"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="shimmer rounded-xl"
              style={{ height: 60 }}
            />
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div
          className="text-center py-20 rounded-2xl border"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <svg
            className="w-12 h-12 mx-auto mb-3"
            style={{ color: 'var(--text-tertiary)' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {search ? 'No se encontraron articulos' : 'No hay articulos todavia'}
          </p>
          {!search && (
            <Link
              href="/super-admin/blog/new"
              className="inline-block mt-4 text-sm font-medium text-[#e63946] hover:underline"
            >
              Crear el primer articulo
            </Link>
          )}
        </div>
      ) : (
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  className="border-b text-left"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <th
                    className="px-5 py-3 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    Titulo
                  </th>
                  <th
                    className="px-5 py-3 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    Estado
                  </th>
                  <th
                    className="px-5 py-3 text-xs font-semibold uppercase tracking-wider hidden md:table-cell"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    Categoria
                  </th>
                  <th
                    className="px-5 py-3 text-xs font-semibold uppercase tracking-wider hidden md:table-cell"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    Fecha
                  </th>
                  <th
                    className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-right"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.map((post) => (
                  <tr
                    key={post.id}
                    className="border-b last:border-b-0 transition hover:bg-[var(--surface-2)]"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-sm font-medium truncate max-w-[300px]"
                          style={{ color: 'var(--fg)' }}
                        >
                          {post.title}
                        </span>
                        {post.featured && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0"
                            style={{ background: 'rgba(234,179,8,0.12)', color: '#ca8a04' }}
                          >
                            DEST.
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${
                          post.status === 'PUBLISHED'
                            ? 'badge-green'
                            : 'badge-yellow'
                        }`}
                      >
                        {post.status === 'PUBLISHED' ? 'Publicado' : 'Borrador'}
                      </span>
                    </td>
                    <td
                      className="px-5 py-4 text-sm hidden md:table-cell"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {CATEGORY_LABELS[post.category] || post.category}
                    </td>
                    <td
                      className="px-5 py-4 text-sm hidden md:table-cell"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      {formatDate(post.created_at)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          className="p-2 rounded-lg hover:bg-[var(--surface-2)] transition"
                          style={{ color: 'var(--text-tertiary)' }}
                          title="Ver"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </Link>
                        <Link
                          href={`/super-admin/blog/${post.id}/edit`}
                          className="p-2 rounded-lg hover:bg-[var(--surface-2)] transition"
                          style={{ color: 'var(--text-secondary)' }}
                          title="Editar"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleDelete(post.id)}
                          disabled={deleting === post.id}
                          className="p-2 rounded-lg hover:bg-red-500/10 transition"
                          style={{ color: deleting === post.id ? 'var(--text-tertiary)' : '#e63946' }}
                          title="Eliminar"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stats */}
      {!loading && posts.length > 0 && (
        <div className="mt-6 flex items-center gap-6 text-sm" style={{ color: 'var(--text-tertiary)' }}>
          <span>{posts.length} articulo{posts.length !== 1 ? 's' : ''} en total</span>
          <span>{posts.filter((p) => p.status === 'PUBLISHED').length} publicado{posts.filter((p) => p.status === 'PUBLISHED').length !== 1 ? 's' : ''}</span>
          <span>{posts.filter((p) => p.status === 'DRAFT').length} borrador{posts.filter((p) => p.status === 'DRAFT').length !== 1 ? 'es' : ''}</span>
        </div>
      )}
    </div>
  );
}
