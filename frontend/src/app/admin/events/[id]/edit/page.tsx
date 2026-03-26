'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  fetchApi,
  updateEvent,
  getCities,
  getCategories,
  Event,
  City,
  Category,
} from '@/lib/api';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function EditEventPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [cities, setCities] = useState<City[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    shortDescription: '',
    image: '',
    price: '',
    originalPrice: '',
    date: '',
    endDate: '',
    time: '',
    duration: '',
    cityId: '',
    categoryId: '',
    address: '',
    status: 'DRAFT',
    featured: false,
    capacity: '',
  });

  useEffect(() => {
    if (!authLoading && (!user || user.role?.toUpperCase() !== 'ADMIN')) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || user.role?.toUpperCase() !== 'ADMIN') return;

    async function load() {
      try {
        const [event, c, cat] = await Promise.all([
          fetchApi<Event>(`/events/${id}`),
          getCities(),
          getCategories(),
        ]);
        setCities(c);
        setCategories(cat);

        setForm({
          title: event.title || '',
          slug: event.slug || '',
          description: event.description || '',
          shortDescription: event.shortDescription || '',
          image: event.image || '',
          price: String(event.price ?? ''),
          originalPrice: event.originalPrice ? String(event.originalPrice) : '',
          date: event.date ? event.date.split('T')[0] : '',
          endDate: event.endDate ? event.endDate.split('T')[0] : '',
          time: event.time || '',
          duration: event.duration || '',
          cityId: event.city?.id || '',
          categoryId: event.category?.id || '',
          address: event.address || '',
          status: event.status || 'draft',
          featured: event.featured || false,
          capacity: event.capacity ? String(event.capacity) : '',
        });
      } catch {
        setError('No se pudo cargar el evento.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, id]);

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
      const body: Record<string, unknown> = {
        title: form.title,
        slug: form.slug,
        description: form.description,
        shortDescription: form.shortDescription || undefined,
        image: form.image || undefined,
        price: Number(form.price) || 0,
        originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
        date: form.date,
        endDate: form.endDate || undefined,
        time: form.time || undefined,
        duration: form.duration || undefined,
        cityId: form.cityId || undefined,
        categoryId: form.categoryId || undefined,
        address: form.address || undefined,
        status: form.status,
        featured: form.featured,
        capacity: form.capacity ? Number(form.capacity) : undefined,
      };
      await updateEvent(id, body);
      router.push('/admin');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al actualizar el evento'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user) return null;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[#1a1a1a] rounded w-48" />
          <div className="h-64 bg-[#1a1a1a] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-extrabold mb-8">Editar evento</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Título *
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#e63946]"
            />
          </div>

          {/* Slug */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Slug
            </label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => updateField('slug', e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#e63946]"
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Descripción *
            </label>
            <textarea
              required
              rows={5}
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#e63946] resize-y"
            />
          </div>

          {/* Short description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Descripción corta
            </label>
            <input
              type="text"
              value={form.shortDescription}
              onChange={(e) =>
                updateField('shortDescription', e.target.value)
              }
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#e63946]"
            />
          </div>

          {/* Image URL */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              URL de imagen
            </label>
            <input
              type="url"
              value={form.image}
              onChange={(e) => updateField('image', e.target.value)}
              placeholder="https://..."
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#e63946]"
            />
            {form.image && (
              <img
                src={form.image}
                alt="Preview"
                className="mt-2 h-32 rounded-lg object-cover"
              />
            )}
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Precio *
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => updateField('price', e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#e63946]"
            />
          </div>

          {/* Original price */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Precio original
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.originalPrice}
              onChange={(e) => updateField('originalPrice', e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#e63946]"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Fecha *
            </label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => updateField('date', e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#e63946]"
            />
          </div>

          {/* End date */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Fecha fin
            </label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => updateField('endDate', e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#e63946]"
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Hora
            </label>
            <input
              type="time"
              value={form.time}
              onChange={(e) => updateField('time', e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#e63946]"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Duración
            </label>
            <input
              type="text"
              placeholder="ej: 2 horas"
              value={form.duration}
              onChange={(e) => updateField('duration', e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#e63946]"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Ciudad
            </label>
            <select
              value={form.cityId}
              onChange={(e) => updateField('cityId', e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#e63946]"
            >
              <option value="">Seleccionar ciudad</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Categoría
            </label>
            <select
              value={form.categoryId}
              onChange={(e) => updateField('categoryId', e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#e63946]"
            >
              <option value="">Seleccionar categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Dirección
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => updateField('address', e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#e63946]"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Estado
            </label>
            <select
              value={form.status}
              onChange={(e) => updateField('status', e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#e63946]"
            >
              <option value="DRAFT">Borrador</option>
              <option value="PUBLISHED">Publicado</option>
            </select>
          </div>

          {/* Capacity */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Aforo
            </label>
            <input
              type="number"
              min="0"
              value={form.capacity}
              onChange={(e) => updateField('capacity', e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#e63946]"
            />
          </div>

          {/* Featured */}
          <div className="md:col-span-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => updateField('featured', e.target.checked)}
                className="w-4 h-4 rounded border-[#2a2a2a] bg-[#1a1a1a] text-[#e63946] focus:ring-[#e63946]"
              />
              <span className="text-sm text-gray-300">Evento destacado</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4 border-t border-[#2a2a2a]">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-[#e63946] hover:bg-[#c62d3a] disabled:opacity-50 rounded-lg text-white font-bold transition"
          >
            {submitting ? 'Guardando...' : 'Guardar cambios'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin')}
            className="px-6 py-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg text-gray-300 transition"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
