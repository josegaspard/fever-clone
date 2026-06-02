'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createEvent,
  getCities,
  getCategories,
  getRefundPolicies,
  City,
  Category,
  RefundPolicy,
} from '@/lib/api';
import { useToast } from '@/components/Toast';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function NewBusinessEventPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [cities, setCities] = useState<City[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [policies, setPolicies] = useState<RefundPolicy[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    shortDescription: '',
    image: '',
    videoUrl: '',
    gallery: '',
    price: '',
    originalPrice: '',
    currency: 'MXN',
    date: '',
    endDate: '',
    time: '',
    duration: '',
    cityId: '',
    categoryId: '',
    address: '',
    lat: '',
    lng: '',
    status: 'DRAFT',
    featured: false,
    capacity: '',
    refundPolicyId: '',
    metaTitle: '',
    metaDescription: '',
  });

  useEffect(() => {
    Promise.all([getCities(), getCategories(), getRefundPolicies()])
      .then(([c, cat, pol]) => {
        setCities(c);
        setCategories(cat);
        setPolicies(pol);
      })
      .catch(() => {});
  }, []);

  const updateField = (field: string, value: string | boolean) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'title' && typeof value === 'string') {
        next.slug = slugify(value);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const galleryUrls = form.gallery
        .split(',')
        .map((u) => u.trim())
        .filter(Boolean);

      const body: Record<string, unknown> = {
        title: form.title,
        slug: form.slug,
        description: form.description,
        shortDescription: form.shortDescription || undefined,
        image: form.image || undefined,
        videoUrl: form.videoUrl || undefined,
        gallery: galleryUrls.length > 0 ? galleryUrls : undefined,
        price: Number(form.price) || 0,
        originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
        currency: form.currency,
        date: form.date,
        endDate: form.endDate || undefined,
        time: form.time || undefined,
        duration: form.duration || undefined,
        cityId: form.cityId || undefined,
        categoryId: form.categoryId || undefined,
        address: form.address || undefined,
        lat: form.lat ? Number(form.lat) : undefined,
        lng: form.lng ? Number(form.lng) : undefined,
        status: form.status,
        featured: form.featured,
        capacity: form.capacity ? Number(form.capacity) : undefined,
        refundPolicyId: form.refundPolicyId || undefined,
      };

      await createEvent(body);
      showToast('Evento creado exitosamente', 'success');
      router.push('/business/events');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el evento');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'input-theme w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition';
  const labelClass = 'block text-sm font-medium mb-1.5';

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.push('/business/events')}
          className="p-2 rounded-xl transition"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <svg className="w-4 h-4" style={{ color: 'var(--fg)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl lg:text-3xl font-extrabold" style={{ color: 'var(--fg)' }}>
          Crear evento
        </h1>
      </div>

      <div className="flex flex-col xl:flex-row gap-8">
        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm rounded-xl p-4">
              {error}
            </div>
          )}

          {/* Basic info */}
          <div
            className="rounded-2xl border p-6 space-y-5"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <h2 className="font-bold text-lg" style={{ color: 'var(--fg)' }}>
              Informacion basica
            </h2>

            <div>
              <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
                Titulo *
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="Nombre de tu evento"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
                Slug
              </label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => updateField('slug', e.target.value)}
                className={inputClass}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                Se genera automaticamente a partir del titulo
              </p>
            </div>

            <div>
              <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
                Descripcion *
              </label>
              <textarea
                required
                rows={5}
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Describe tu evento en detalle..."
                className={`${inputClass} resize-y`}
              />
            </div>

            <div>
              <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
                Descripcion corta
              </label>
              <input
                type="text"
                value={form.shortDescription}
                onChange={(e) => updateField('shortDescription', e.target.value)}
                placeholder="Breve resumen del evento"
                className={inputClass}
              />
            </div>
          </div>

          {/* Category selector - visual pills */}
          <div
            className="rounded-2xl border p-6"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <h2 className="font-bold text-lg mb-4" style={{ color: 'var(--fg)' }}>
              Categoria
            </h2>
            <div className="flex flex-wrap gap-2">
              {categories.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  Cargando categorias...
                </p>
              ) : (
                categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => updateField('categoryId', form.categoryId === cat.id ? '' : cat.id)}
                    className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
                    style={{
                      background:
                        form.categoryId === cat.id
                          ? 'linear-gradient(135deg, #e63946, #d32836)'
                          : 'var(--surface-2)',
                      color: form.categoryId === cat.id ? '#fff' : 'var(--text-secondary)',
                      border: `1px solid ${
                        form.categoryId === cat.id ? '#e63946' : 'var(--border)'
                      }`,
                    }}
                  >
                    {cat.icon && <span className="mr-1">{cat.icon}</span>}
                    {cat.name}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Date/time & Location */}
          <div
            className="rounded-2xl border p-6 space-y-5"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <h2 className="font-bold text-lg" style={{ color: 'var(--fg)' }}>
              Fecha y ubicacion
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
                  Fecha *
                </label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => updateField('date', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
                  Fecha fin
                </label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => updateField('endDate', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
                  Hora
                </label>
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => updateField('time', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
                  Duracion
                </label>
                <input
                  type="text"
                  value={form.duration}
                  onChange={(e) => updateField('duration', e.target.value)}
                  placeholder="ej: 2 horas"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
                Ciudad
              </label>
              <select
                value={form.cityId}
                onChange={(e) => updateField('cityId', e.target.value)}
                className={inputClass}
              >
                <option value="">Seleccionar ciudad</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}, {c.country}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
                Direccion
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
                placeholder="Direccion del evento"
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
                  Latitud
                </label>
                <input
                  type="number"
                  step="any"
                  value={form.lat}
                  onChange={(e) => updateField('lat', e.target.value)}
                  placeholder="ej: 19.4326"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
                  Longitud
                </label>
                <input
                  type="number"
                  step="any"
                  value={form.lng}
                  onChange={(e) => updateField('lng', e.target.value)}
                  placeholder="ej: -99.1332"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div
            className="rounded-2xl border p-6 space-y-5"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <h2 className="font-bold text-lg" style={{ color: 'var(--fg)' }}>
              Precio y capacidad
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
                  Precio *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => updateField('price', e.target.value)}
                  placeholder="0.00"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
                  Precio original
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.originalPrice}
                  onChange={(e) => updateField('originalPrice', e.target.value)}
                  placeholder="Precio sin descuento"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
                  Moneda
                </label>
                <select
                  value={form.currency}
                  onChange={(e) => updateField('currency', e.target.value)}
                  className={inputClass}
                >
                  <option value="MXN">MXN - Peso mexicano</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="USD">USD - Dolar americano</option>
                  <option value="GBP">GBP - Libra esterlina</option>
                </select>
              </div>
              <div>
                <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
                  Capacidad
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.capacity}
                  onChange={(e) => updateField('capacity', e.target.value)}
                  placeholder="Maximo de asistentes"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Media */}
          <div
            className="rounded-2xl border p-6 space-y-5"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <h2 className="font-bold text-lg" style={{ color: 'var(--fg)' }}>
              Multimedia
            </h2>

            <div>
              <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
                URL de imagen principal
              </label>
              <input
                type="url"
                value={form.image}
                onChange={(e) => updateField('image', e.target.value)}
                placeholder="https://ejemplo.com/imagen.jpg"
                className={inputClass}
              />
              {form.image && (
                <img
                  src={form.image}
                  alt="Preview"
                  className="mt-3 h-40 w-full object-cover rounded-xl border"
                  style={{ borderColor: 'var(--border)' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
            </div>

            <div>
              <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
                URL de video
              </label>
              <p className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>YouTube (youtube.com/watch?v=...) o URL directa .mp4</p>
              <input
                type="url"
                value={form.videoUrl}
                onChange={(e) => {
                  let url = e.target.value;
                  const watchMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
                  const shortMatch = url.match(/youtu\.be\/([^?]+)/);
                  if (watchMatch) url = `https://www.youtube.com/embed/${watchMatch[1]}`;
                  else if (shortMatch) url = `https://www.youtube.com/embed/${shortMatch[1]}`;
                  updateField('videoUrl', url);
                }}
                placeholder="https://www.youtube.com/watch?v=... o URL de video"
                className={inputClass}
                style={{ fontSize: 16 }}
              />
              {form.videoUrl && (() => {
                const ytMatch = form.videoUrl.match(/\/embed\/([^?&]+)/);
                return ytMatch ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${ytMatch[1]}?modestbranding=1&rel=0`}
                    className="mt-3 w-full rounded-xl"
                    style={{ height: 200, border: 'none' }}
                    allow="encrypted-media; picture-in-picture"
                    allowFullScreen
                    title="Video preview"
                  />
                ) : (
                  <video src={form.videoUrl} controls className="mt-3 h-40 w-full object-cover rounded-xl" />
                );
              })()}
            </div>

            <div>
              <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
                Galeria (URLs separadas por coma)
              </label>
              <textarea
                value={form.gallery}
                onChange={(e) => updateField('gallery', e.target.value)}
                placeholder="https://img1.jpg, https://img2.jpg, ..."
                rows={2}
                className={`${inputClass} resize-y`}
              />
              {form.gallery && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                  {form.gallery
                    .split(',')
                    .map((u) => u.trim())
                    .filter(Boolean)
                    .map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt={`Gallery ${idx + 1}`}
                        className="h-20 w-20 object-cover rounded-lg flex-shrink-0 border"
                        style={{ borderColor: 'var(--border)' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Settings */}
          <div
            className="rounded-2xl border p-6 space-y-5"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <h2 className="font-bold text-lg" style={{ color: 'var(--fg)' }}>
              Configuracion
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
                  Estado
                </label>
                <select
                  value={form.status}
                  onChange={(e) => updateField('status', e.target.value)}
                  className={inputClass}
                >
                  <option value="DRAFT">Borrador</option>
                  <option value="PUBLISHED">Publicado</option>
                </select>
              </div>

              <div>
                <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
                  Politica de reembolso
                </label>
                <select
                  value={form.refundPolicyId}
                  onChange={(e) => updateField('refundPolicyId', e.target.value)}
                  className={inputClass}
                >
                  <option value="">Sin politica</option>
                  {policies.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.refundPercentage}% hasta {p.daysBeforeEvent} dias antes)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <div
                className="relative w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer"
                style={{ background: form.featured ? '#e63946' : 'var(--border)' }}
                onClick={() => updateField('featured', !form.featured)}
              >
                <div
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200"
                  style={{
                    transform: form.featured ? 'translateX(22px)' : 'translateX(2px)',
                  }}
                />
              </div>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Evento destacado
              </span>
            </label>
          </div>

          {/* SEO */}
          <div
            className="rounded-2xl border p-6 space-y-5"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-[#e63946]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" strokeWidth={2}/><line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth={2}/></svg>
              <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>SEO</h3>
            </div>
            <div>
              <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
                Meta titulo <span className="text-xs font-normal" style={{ color: 'var(--text-tertiary)' }}>(max 60 chars)</span>
              </label>
              <input value={form.metaTitle} onChange={(e) => updateField('metaTitle', e.target.value)} placeholder={form.title || 'Titulo para buscadores'} maxLength={70} className={inputClass} />
              <div className="flex justify-between mt-1">
                <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Se usa el titulo del evento si esta vacio</span>
                <span className={`text-[10px] font-medium ${(form.metaTitle || form.title).length > 60 ? 'text-red-600 dark:text-red-400' : ''}`} style={(form.metaTitle || form.title).length <= 60 ? { color: 'var(--text-tertiary)' } : {}}>{(form.metaTitle || form.title).length}/60</span>
              </div>
            </div>
            <div>
              <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
                Meta descripcion <span className="text-xs font-normal" style={{ color: 'var(--text-tertiary)' }}>(max 160 chars)</span>
              </label>
              <textarea value={form.metaDescription} onChange={(e) => updateField('metaDescription', e.target.value)} placeholder={form.shortDescription || form.description?.slice(0, 160) || 'Descripcion para buscadores'} maxLength={170} rows={3} className={inputClass} style={{ resize: 'vertical' }} />
              <div className="flex justify-between mt-1">
                <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Se usa la descripcion corta si esta vacio</span>
                <span className={`text-[10px] font-medium ${(form.metaDescription || form.shortDescription || '').length > 160 ? 'text-red-600 dark:text-red-400' : ''}`} style={(form.metaDescription || form.shortDescription || '').length <= 160 ? { color: 'var(--text-tertiary)' } : {}}>{(form.metaDescription || form.shortDescription || '').length}/160</span>
              </div>
            </div>
            {/* Google SERP Preview */}
            <div className="rounded-xl p-4" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>Vista previa en Google</p>
              <div>
                <p className="text-sm truncate" style={{ color: '#1a0dab' }}>{form.metaTitle || form.title || 'Titulo del evento'} | CTXplorer</p>
                <p className="text-xs truncate" style={{ color: '#006621' }}>ctxplorer.com/events/{form.slug || 'slug-del-evento'}</p>
                <p className="text-xs line-clamp-2 mt-0.5" style={{ color: 'var(--text-secondary)' }}>{form.metaDescription || form.shortDescription || form.description?.slice(0, 160) || 'Descripcion del evento que aparecera en los resultados de busqueda...'}</p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary px-8 py-3 text-sm disabled:opacity-50"
            >
              {submitting ? 'Creando...' : 'Crear evento'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/business/events')}
              className="btn-secondary px-6 py-3 text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>

        {/* Live preview */}
        <div className="xl:w-[340px] flex-shrink-0">
          <div className="sticky top-6">
            <h3 className="text-sm font-bold mb-3 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Vista previa
            </h3>
            <div
              className="rounded-2xl overflow-hidden border"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
            >
              {/* Preview image */}
              <div className="aspect-[3/4] relative overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                {form.image ? (
                  <img
                    src={form.image}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-12 h-12" style={{ color: 'var(--text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                {form.categoryId && (
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
                    {categories.find((c) => c.id === form.categoryId)?.name || ''}
                  </div>
                )}
              </div>
              <div className="p-3">
                <h4 className="text-sm font-semibold line-clamp-2 leading-snug mb-1" style={{ color: 'var(--fg)' }}>
                  {form.title || 'Titulo del evento'}
                </h4>
                <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {form.date
                    ? new Date(form.date + 'T00:00:00').toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                      })
                    : 'Fecha'}
                  {form.time ? ` \u00B7 ${form.time}` : ''}
                </p>
                <span className="text-sm font-bold" style={{ color: 'var(--fg)' }}>
                  {form.price
                    ? `${form.currency === 'GBP' ? '\u00A3' : form.currency === 'EUR' ? '\u20AC' : '$'}${Number(form.price).toFixed(0)} ${form.currency}`
                    : 'Gratis'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
