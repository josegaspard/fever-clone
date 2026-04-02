'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'guias', label: 'Guias' },
  { value: 'tendencias', label: 'Tendencias' },
  { value: 'eventos', label: 'Eventos' },
  { value: 'ciudades', label: 'Ciudades' },
  { value: 'gastronomia', label: 'Gastronomia' },
  { value: 'cultura', label: 'Cultura' },
  { value: 'tips', label: 'Tips' },
];

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function BlogEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [image, setImage] = useState('');
  const [category, setCategory] = useState('general');
  const [tagsStr, setTagsStr] = useState('');
  const [authorName, setAuthorName] = useState('CTXplorer Team');
  const [status, setStatus] = useState('DRAFT');
  const [featured, setFeatured] = useState(false);
  const [readingTime, setReadingTime] = useState(5);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Load existing post
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/blog/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const json = await res.json();
        if (json.data) {
          const p = json.data;
          setTitle(p.title || '');
          setSlug(p.slug || '');
          setContent(p.content || '');
          setExcerpt(p.excerpt || '');
          setImage(p.image || '');
          setCategory(p.category || 'general');
          setTagsStr((p.tags || []).join(', '));
          setAuthorName(p.author_name || 'CTXplorer Team');
          setStatus(p.status || 'DRAFT');
          setFeatured(p.featured || false);
          setReadingTime(p.reading_time || 5);
          setMetaTitle(p.meta_title || '');
          setMetaDescription(p.meta_description || '');
        }
      } catch {
        setError('Error al cargar el articulo');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSubmit = async () => {
    if (!title || !slug || !content) {
      setError('Titulo, slug y contenido son obligatorios');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/blog/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title,
          slug,
          content,
          excerpt: excerpt || null,
          image: image || null,
          author_name: authorName,
          category,
          tags: tagsStr
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          meta_title: metaTitle || title,
          meta_description: metaDescription || excerpt || '',
          status,
          featured,
          reading_time: readingTime,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Error al actualizar');
        return;
      }

      router.push('/super-admin/blog');
    } catch {
      setError('Error de conexion');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="shimmer rounded-2xl" style={{ height: 60 }} />
        <div className="shimmer rounded-2xl" style={{ height: 400 }} />
        <div className="shimmer rounded-2xl" style={{ height: 200 }} />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link
            href="/super-admin/blog"
            className="p-2 rounded-lg border transition hover:bg-[var(--surface-2)]"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--fg)' }}>
            Editar articulo
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="btn-secondary px-4 py-2 rounded-xl text-sm font-medium"
          >
            {showPreview ? 'Editar' : 'Vista previa'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="btn-primary px-5 py-2 rounded-xl text-sm font-semibold"
          >
            {saving ? 'Guardando...' : 'Actualizar'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl border border-red-500/30 text-red-600 dark:text-red-400 text-sm" style={{ background: 'rgba(239,68,68,0.06)' }}>
          {error}
        </div>
      )}

      {showPreview ? (
        /* Preview mode */
        <div
          className="rounded-2xl border p-8 md:p-12"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div className="max-w-[720px] mx-auto">
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4"
              style={{ background: 'rgba(230,57,70,0.12)', color: '#e63946' }}
            >
              {CATEGORIES.find((c) => c.value === category)?.label || category}
            </span>
            <h1
              className="text-3xl md:text-4xl font-black tracking-tight mb-4"
              style={{ color: 'var(--fg)' }}
            >
              {title || 'Sin titulo'}
            </h1>
            <div className="flex items-center gap-3 mb-6 text-sm" style={{ color: 'var(--text-tertiary)' }}>
              <span>{authorName}</span>
              <span>&middot;</span>
              <span>{readingTime} min de lectura</span>
            </div>
            {image && (
              <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-8">
                <Image
                  src={image}
                  alt={title}
                  fill
                  className="object-cover"
                  sizes="720px"
                />
              </div>
            )}
            <div
              className="blog-content"
              style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}
              dangerouslySetInnerHTML={{ __html: content || '<p><em>Sin contenido</em></p>' }}
            />
          </div>
        </div>
      ) : (
        /* Editor mode */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div
              className="rounded-2xl border p-6"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
            >
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--fg)' }}>
                Titulo
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Escribe el titulo del articulo..."
                className="input-theme w-full px-4 py-3 rounded-xl text-lg font-semibold"
              />
              <div className="mt-2 flex items-center gap-2">
                <label className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                  Slug:
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="input-theme flex-1 px-3 py-1.5 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Content */}
            <div
              className="rounded-2xl border p-6"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
            >
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--fg)' }}>
                Contenido (HTML)
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={20}
                placeholder="<h2>Subtitulo</h2>&#10;<p>Escribe el contenido del articulo en HTML...</p>"
                className="input-theme w-full px-4 py-3 rounded-xl text-sm font-mono"
                style={{ minHeight: 400, resize: 'vertical' }}
              />
            </div>

            {/* Excerpt */}
            <div
              className="rounded-2xl border p-6"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
            >
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--fg)' }}>
                Extracto
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={3}
                placeholder="Breve descripcion del articulo..."
                className="input-theme w-full px-4 py-3 rounded-xl text-sm"
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* SEO Section */}
            <div
              className="rounded-2xl border p-6"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
            >
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--fg)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                SEO
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Meta Titulo
                  </label>
                  <input
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder="Titulo para motores de busqueda"
                    className="input-theme w-full px-4 py-2.5 rounded-xl text-sm"
                  />
                  <p className="mt-1 text-xs" style={{ color: metaTitle.length > 60 ? '#e63946' : 'var(--text-tertiary)' }}>
                    {metaTitle.length}/60 caracteres
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Meta Descripcion
                  </label>
                  <textarea
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    rows={2}
                    placeholder="Descripcion para motores de busqueda"
                    className="input-theme w-full px-4 py-2.5 rounded-xl text-sm"
                    style={{ resize: 'vertical' }}
                  />
                  <p className="mt-1 text-xs" style={{ color: metaDescription.length > 160 ? '#e63946' : 'var(--text-tertiary)' }}>
                    {metaDescription.length}/160 caracteres
                  </p>
                </div>

                {/* Google SERP Preview */}
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Vista previa en Google
                  </label>
                  <div
                    className="rounded-xl p-4 border"
                    style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
                  >
                    <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>
                      fever-clone.vercel.app &rsaquo; blog &rsaquo; {slug || 'slug-del-articulo'}
                    </p>
                    <p
                      className="text-base font-medium mb-1 line-clamp-1"
                      style={{ color: '#1a0dab' }}
                    >
                      {(metaTitle || title || 'Titulo del articulo') + ' | CTXplorer'}
                    </p>
                    <p
                      className="text-xs line-clamp-2"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {metaDescription || excerpt || 'Descripcion del articulo...'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publish settings */}
            <div
              className="rounded-2xl border p-6"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
            >
              <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--fg)' }}>
                Publicacion
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Estado
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="input-theme w-full px-3 py-2 rounded-xl text-sm"
                  >
                    <option value="DRAFT">Borrador</option>
                    <option value="PUBLISHED">Publicado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="input-theme w-full px-3 py-2 rounded-xl text-sm"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    Destacado
                  </label>
                  <button
                    onClick={() => setFeatured(!featured)}
                    className="relative w-10 h-6 rounded-full transition-colors"
                    style={{
                      background: featured ? '#e63946' : 'var(--input-border)',
                    }}
                  >
                    <span
                      className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform"
                      style={{
                        left: featured ? 22 : 4,
                      }}
                    />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Tiempo de lectura (min)
                  </label>
                  <input
                    type="number"
                    value={readingTime}
                    onChange={(e) => setReadingTime(Number(e.target.value))}
                    min={1}
                    className="input-theme w-full px-3 py-2 rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Image */}
            <div
              className="rounded-2xl border p-6"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
            >
              <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--fg)' }}>
                Imagen destacada
              </h3>
              <input
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://..."
                className="input-theme w-full px-3 py-2 rounded-xl text-sm mb-3"
              />
              {image && (
                <div className="relative aspect-[16/10] rounded-xl overflow-hidden">
                  <Image
                    src={image}
                    alt="Vista previa"
                    fill
                    className="object-cover"
                    sizes="300px"
                  />
                </div>
              )}
            </div>

            {/* Author & Tags */}
            <div
              className="rounded-2xl border p-6"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
            >
              <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--fg)' }}>
                Detalles
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Autor
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="input-theme w-full px-3 py-2 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Etiquetas (separadas por coma)
                  </label>
                  <input
                    type="text"
                    value={tagsStr}
                    onChange={(e) => setTagsStr(e.target.value)}
                    placeholder="musica, conciertos, cdmx"
                    className="input-theme w-full px-3 py-2 rounded-xl text-sm"
                  />
                  {tagsStr && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {tagsStr
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean)
                        .map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded text-[10px] font-medium"
                            style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}
                          >
                            {tag}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
