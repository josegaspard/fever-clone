'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getAllEventsAdmin, Event, PaginatedResponse } from '@/lib/api';
import { useToast } from '@/components/Toast';

interface Category { id: string; name: string; slug: string; icon?: string }
interface City { id: string; name: string; slug: string; country: string }
interface VenueOption { id: string; slug: string; name: string; category?: string }

const CURRENCIES = ['MXN', 'USD', 'EUR', 'GBP'];
const STATUSES = ['PUBLISHED', 'DRAFT', 'ARCHIVED'];

function StatusBadge({ status }: { status: string }) {
  const c: Record<string, { bg: string; fg: string }> = {
    PUBLISHED: { bg: 'rgba(34,197,94,0.12)', fg: '#22c55e' },
    DRAFT: { bg: 'rgba(234,179,8,0.12)', fg: '#eab308' },
    ARCHIVED: { bg: 'rgba(128,128,128,0.12)', fg: '#888' },
  };
  const col = c[status.toUpperCase()] || c.DRAFT;
  return <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: col.bg, color: col.fg }}>{status}</span>;
}

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 24 }}>
      <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)', color: page <= 1 ? 'var(--text-tertiary)' : 'var(--fg)', cursor: page <= 1 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 500 }}>Anterior</button>
      <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>{page} / {totalPages}</span>
      <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)', color: page >= totalPages ? 'var(--text-tertiary)' : 'var(--fg)', cursor: page >= totalPages ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 500 }}>Siguiente</button>
    </div>
  );
}

const emptyForm = {
  title: '', slug: '', description: '', shortDescription: '', image: '', videoUrl: '',
  gallery: [] as string[], galleryInput: '',
  price: '', originalPrice: '', currency: 'MXN', date: '', endDate: '', time: '', duration: '',
  address: '', lat: '', lng: '', cityId: '', categoryId: '', venueId: '',
  status: 'DRAFT', featured: false, capacity: '', metaTitle: '', metaDescription: '',
};

const TABS = [
  { label: 'Todos', value: '' },
  { label: 'Publicados', value: 'PUBLISHED' },
  { label: 'Borradores', value: 'DRAFT' },
  { label: 'Archivados', value: 'ARCHIVED' },
];

export default function SuperAdminEvents() {
  const { showToast } = useToast();
  const [data, setData] = useState<PaginatedResponse<Event> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [venues, setVenues] = useState<VenueOption[]>([]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounce(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getAllEventsAdmin({ page, limit: 15, q: searchDebounce || undefined, status: statusFilter || undefined });
      setData(result);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [page, searchDebounce, statusFilter]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  useEffect(() => {
    Promise.all([fetch('/api/categories'), fetch('/api/cities'), fetch('/api/venues')])
      .then(async ([catRes, citRes, venRes]) => {
        const cats = await catRes.json();
        const cits = await citRes.json();
        const vens = await venRes.json();
        setCategories(Array.isArray(cats) ? cats : []);
        setCities(Array.isArray(cits) ? cits : []);
        setVenues(Array.isArray(vens) ? vens : []);
      }).catch(() => {});
  }, []);

  useEffect(() => { setPage(1); setSelectedIds(new Set()); }, [searchDebounce, statusFilter]);

  const toggleSelect = (id: string) => setSelectedIds(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSelectAll = () => { if (!data) return; selectedIds.size === data.data.length ? setSelectedIds(new Set()) : setSelectedIds(new Set(data.data.map(e => e.id))); };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      await Promise.all(Array.from(selectedIds).map(id => fetch(`/api/admin/events/${id}`, { method: 'PATCH', headers, body: JSON.stringify({ status: newStatus }) })));
      showToast(`${selectedIds.size} evento(s) actualizados`);
      setSelectedIds(new Set());
      loadEvents();
    } catch { showToast('Error', 'error'); } finally { setBulkLoading(false); }
  };

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setShowForm(true); };

  const openEdit = (ev: Event) => {
    setEditingId(ev.id);
    const evAny = ev as unknown as Record<string, unknown>;
    const gal = Array.isArray(evAny.gallery) ? (evAny.gallery as string[]) : [];
    setForm({
      title: ev.title || '', slug: ev.slug || '', description: ev.description || '',
      shortDescription: ev.shortDescription || '', image: ev.image || '', videoUrl: ev.videoUrl || '',
      gallery: gal, galleryInput: '',
      price: ev.price?.toString() || '0', originalPrice: ev.originalPrice?.toString() || '',
      currency: ev.currency || 'MXN', date: ev.date ? ev.date.split('T')[0] : '',
      endDate: ev.endDate ? ev.endDate.split('T')[0] : '', time: ev.time || '',
      duration: ev.duration || '', address: ev.address || '',
      lat: ev.lat?.toString() || '', lng: ev.lng?.toString() || '',
      cityId: ev.city?.id?.toString() || '', categoryId: ev.category?.id?.toString() || '',
      venueId: (evAny.venueId as string)?.toString() || '', status: ev.status || 'DRAFT',
      featured: ev.featured || false, capacity: ev.capacity?.toString() || '',
      metaTitle: (evAny.metaTitle as string) || '', metaDescription: (evAny.metaDescription as string) || '',
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.slug) { showToast('Titulo y slug son requeridos', 'error'); return; }
    setSaving(true);
    try {
      const { galleryInput: _gi, ...formRest } = form;
      const body = {
        ...formRest,
        gallery: form.gallery.filter(Boolean),
        price: form.price ? Number(form.price) : 0,
        originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
        capacity: form.capacity ? Number(form.capacity) : null,
        cityId: form.cityId ? Number(form.cityId) : null,
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        venueId: form.venueId ? Number(form.venueId) : null,
        lat: form.lat ? Number(form.lat) : null,
        lng: form.lng ? Number(form.lng) : null,
      };

      if (editingId) {
        const res = await fetch(`/api/admin/events/${editingId}`, { method: 'PATCH', headers, body: JSON.stringify(body) });
        if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
        showToast('Evento actualizado');
      } else {
        const res = await fetch('/api/business/events', { method: 'POST', headers, body: JSON.stringify(body) });
        if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
        showToast('Evento creado');
      }
      setShowForm(false);
      loadEvents();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar este evento? Esta accion no se puede deshacer.')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/events/${id}`, { method: 'DELETE', headers });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      showToast('Evento eliminado');
      loadEvents();
    } catch (err) { showToast(err instanceof Error ? err.message : 'Error', 'error'); }
    finally { setDeleting(null); }
  };

  const handleQuickStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/admin/events/${id}`, { method: 'PATCH', headers, body: JSON.stringify({ status }) });
      loadEvents();
    } catch { /* silent */ }
  };

  const updateField = (key: string, value: string | boolean) => setForm(f => ({ ...f, [key]: value }));
  const allSelected = data ? data.data.length > 0 && selectedIds.size === data.data.length : false;

  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 10, background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--fg)', fontSize: 14 };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--fg)', letterSpacing: -0.5, marginBottom: 4 }}>Eventos</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Gestiona todos los eventos de la plataforma</p>
        </div>
        <button onClick={openCreate} style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #e63946, #d32836)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Nuevo Evento
        </button>
      </div>

      {/* Edit Form */}
      {showForm && (
        <div style={{ marginBottom: 32, padding: 24, borderRadius: 16, background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--fg)' }}>{editingId ? `Editar evento` : 'Nuevo Evento'}</h2>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 22 }}>x</button>
          </div>
          <form onSubmit={handleSave}>
            {/* Basic */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
              <div><label style={labelStyle}>Titulo *</label><input style={inputStyle} value={form.title} onChange={e => updateField('title', e.target.value)} required /></div>
              <div><label style={labelStyle}>Slug *</label><input style={inputStyle} value={form.slug} onChange={e => updateField('slug', e.target.value)} required /></div>
              <div><label style={labelStyle}>Estado</label>
                <select style={inputStyle} value={form.status} onChange={e => updateField('status', e.target.value)}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div><label style={labelStyle}>Categoria</label>
                <select style={inputStyle} value={form.categoryId} onChange={e => updateField('categoryId', e.target.value)}>
                  <option value="">Sin categoria</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Descripcion corta</label>
              <input style={inputStyle} value={form.shortDescription} onChange={e => updateField('shortDescription', e.target.value)} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Descripcion completa</label>
              <textarea style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }} value={form.description} onChange={e => updateField('description', e.target.value)} />
            </div>

            {/* Media - Image principal + Video */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Imagen principal (URL)</label>
                <input style={inputStyle} value={form.image} onChange={e => updateField('image', e.target.value)} placeholder="https://..." />
                {form.image && <div style={{ marginTop: 8, height: 50, width: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}><Image src={form.image} alt="" width={80} height={50} style={{ objectFit: 'cover', width: '100%', height: '100%' }} /></div>}
              </div>
              <div>
                <label style={labelStyle}>Video (URL .mp4)</label>
                <input style={inputStyle} value={form.videoUrl} onChange={e => updateField('videoUrl', e.target.value)} placeholder="https://...video.mp4" />
                {form.videoUrl && <div style={{ marginTop: 8, fontSize: 12, color: '#22c55e', fontWeight: 600 }}>Video configurado</div>}
              </div>
              <div>
                <label style={labelStyle}>Venue / Organizador</label>
                <select style={inputStyle} value={form.venueId} onChange={e => updateField('venueId', e.target.value)}>
                  <option value="">Sin venue</option>
                  {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
            </div>

            {/* Gallery - Multiple images */}
            <div style={{ marginBottom: 20, padding: 16, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <label style={labelStyle}>Galeria de fotos ({form.gallery.length} imagenes)</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  value={form.galleryInput}
                  onChange={e => setForm(f => ({ ...f, galleryInput: e.target.value }))}
                  placeholder="Pega URL de imagen y presiona Agregar"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (form.galleryInput.trim()) {
                        setForm(f => ({ ...f, gallery: [...f.gallery, f.galleryInput.trim()], galleryInput: '' }));
                      }
                    }
                  }}
                />
                <button type="button" onClick={() => {
                  if (form.galleryInput.trim()) setForm(f => ({ ...f, gallery: [...f.gallery, f.galleryInput.trim()], galleryInput: '' }));
                }} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: '#e63946', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Agregar</button>
              </div>
              {form.gallery.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {form.gallery.map((url, i) => (
                    <div key={i} style={{ position: 'relative', width: 80, height: 60, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <Image src={url} alt={`Gallery ${i + 1}`} width={80} height={60} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                      <button type="button" onClick={() => setForm(f => ({ ...f, gallery: f.gallery.filter((_, idx) => idx !== i) }))} style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: '50%', background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>x</button>
                    </div>
                  ))}
                </div>
              )}
              {form.gallery.length === 0 && <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0 }}>Sin imagenes en la galeria. Agrega URLs arriba.</p>}
            </div>

            {/* Price */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 20 }}>
              <div><label style={labelStyle}>Precio</label><input style={inputStyle} type="number" step="0.01" value={form.price} onChange={e => updateField('price', e.target.value)} /></div>
              <div><label style={labelStyle}>Precio original</label><input style={inputStyle} type="number" step="0.01" value={form.originalPrice} onChange={e => updateField('originalPrice', e.target.value)} /></div>
              <div><label style={labelStyle}>Moneda</label>
                <select style={inputStyle} value={form.currency} onChange={e => updateField('currency', e.target.value)}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div><label style={labelStyle}>Capacidad</label><input style={inputStyle} type="number" value={form.capacity} onChange={e => updateField('capacity', e.target.value)} /></div>
            </div>

            {/* Date/Time */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 20 }}>
              <div><label style={labelStyle}>Fecha inicio</label><input style={inputStyle} type="date" value={form.date} onChange={e => updateField('date', e.target.value)} /></div>
              <div><label style={labelStyle}>Fecha fin</label><input style={inputStyle} type="date" value={form.endDate} onChange={e => updateField('endDate', e.target.value)} /></div>
              <div><label style={labelStyle}>Hora</label><input style={inputStyle} value={form.time} onChange={e => updateField('time', e.target.value)} placeholder="10:00 - 18:00" /></div>
              <div><label style={labelStyle}>Duracion</label><input style={inputStyle} value={form.duration} onChange={e => updateField('duration', e.target.value)} placeholder="2h 30min" /></div>
            </div>

            {/* Location */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 20 }}>
              <div><label style={labelStyle}>Ciudad</label>
                <select style={inputStyle} value={form.cityId} onChange={e => updateField('cityId', e.target.value)}>
                  <option value="">Sin ciudad</option>
                  {cities.map(c => <option key={c.id} value={c.id}>{c.name} ({c.country})</option>)}
                </select>
              </div>
              <div><label style={labelStyle}>Direccion</label><input style={inputStyle} value={form.address} onChange={e => updateField('address', e.target.value)} /></div>
              <div><label style={labelStyle}>Latitud</label><input style={inputStyle} type="number" step="any" value={form.lat} onChange={e => updateField('lat', e.target.value)} /></div>
              <div><label style={labelStyle}>Longitud</label><input style={inputStyle} type="number" step="any" value={form.lng} onChange={e => updateField('lng', e.target.value)} /></div>
            </div>

            {/* SEO */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 20 }}>
              <div><label style={labelStyle}>Meta titulo (SEO)</label><input style={inputStyle} value={form.metaTitle} onChange={e => updateField('metaTitle', e.target.value)} /></div>
              <div><label style={labelStyle}>Meta descripcion (SEO)</label><input style={inputStyle} value={form.metaDescription} onChange={e => updateField('metaDescription', e.target.value)} /></div>
            </div>

            {/* Flags */}
            <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={form.featured} onChange={e => updateField('featured', e.target.checked)} style={{ width: 18, height: 18, accentColor: '#e63946' }} />
                Destacado
              </label>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" disabled={saving} style={{ padding: '12px 28px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #e63946, #d32836)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear evento'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '12px 28px', borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--card)', borderRadius: 12, padding: 4, border: '1px solid var(--border)', width: 'fit-content' }}>
        {TABS.map(tab => (
          <button key={tab.value} onClick={() => setStatusFilter(tab.value)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: statusFilter === tab.value ? 'rgba(230,57,70,0.12)' : 'transparent', color: statusFilter === tab.value ? '#e63946' : 'var(--text-secondary)', fontSize: 13, fontWeight: statusFilter === tab.value ? 700 : 500, cursor: 'pointer' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search + Bulk */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: 400 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input type="text" placeholder="Buscar por titulo..." value={search} onChange={e => setSearch(e.target.value)} className="input-theme" style={{ width: '100%', padding: '10px 14px 10px 42px', borderRadius: 10, fontSize: 14, outline: 'none' }} />
        </div>
        {selectedIds.size > 0 && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(230,57,70,0.08)', borderRadius: 10, padding: '6px 14px', border: '1px solid rgba(230,57,70,0.2)' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#e63946' }}>{selectedIds.size} sel.</span>
            {['PUBLISHED', 'DRAFT', 'ARCHIVED'].map(s => (
              <button key={s} onClick={() => handleBulkStatusChange(s)} disabled={bulkLoading} style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--fg)', fontSize: 11, fontWeight: 600, cursor: bulkLoading ? 'wait' : 'pointer' }}>
                {s === 'PUBLISHED' ? 'Publicar' : s === 'DRAFT' ? 'Borrador' : 'Archivar'}
              </button>
            ))}
          </div>
        )}
        {data && <div style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, marginLeft: 'auto' }}>{data.total} evento{data.total !== 1 ? 's' : ''}</div>}
      </div>

      {/* Table */}
      <div style={{ background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', width: 40 }}>
                  <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#e63946' }} />
                </th>
                {['Img', 'Titulo', 'Ciudad', 'Cat.', 'Precio', 'Estado', 'Fecha', 'Acciones'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '14px 12px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  {Array.from({ length: 9 }).map((_, j) => <td key={j} style={{ padding: '12px' }}><div className="shimmer" style={{ width: j === 0 ? 16 : j === 1 ? 48 : 80, height: j === 1 ? 36 : 16, borderRadius: 6 }} /></td>)}
                </tr>
              )) : !data || data.data.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>No se encontraron eventos</td></tr>
              ) : data.data.map((event, i) => (
                <tr key={event.id} style={{ borderBottom: i < data.data.length - 1 ? '1px solid var(--border)' : undefined, background: selectedIds.has(event.id) ? 'rgba(230,57,70,0.06)' : undefined }}>
                  <td style={{ padding: '10px 16px' }}>
                    <input type="checkbox" checked={selectedIds.has(event.id)} onChange={() => toggleSelect(event.id)} style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#e63946' }} />
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    {event.image ? <img src={event.image} alt="" style={{ width: 48, height: 36, borderRadius: 8, objectFit: 'cover', display: 'block' }} /> : <div style={{ width: 48, height: 36, borderRadius: 8, background: 'var(--border)' }} />}
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--fg)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.title}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontSize: 12 }}>{event.city?.name || '-'}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontSize: 12 }}>{event.category?.name || '-'}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--fg)', whiteSpace: 'nowrap' }}>${event.price?.toLocaleString() || '0'}</td>
                  <td style={{ padding: '10px 12px' }}><StatusBadge status={event.status || 'DRAFT'} /></td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontSize: 12 }}>{event.date ? new Date(event.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '-'}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <button onClick={() => openEdit(event)} title="Editar" style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                      </button>
                      <Link href={`/events/${event.slug}`} target="_blank" title="Ver" style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', textDecoration: 'none' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                      </Link>
                      <select value={event.status || 'DRAFT'} onChange={e => handleQuickStatus(event.id, e.target.value)} style={{ padding: '4px 6px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--fg)', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
                        <option value="PUBLISHED">PUB</option>
                        <option value="DRAFT">DRA</option>
                        <option value="ARCHIVED">ARC</option>
                      </select>
                      <button onClick={() => handleDelete(event.id)} disabled={deleting === event.id} title="Eliminar" style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', cursor: 'pointer', opacity: deleting === event.id ? 0.5 : 1 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {data && <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />}
    </div>
  );
}
