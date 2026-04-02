'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import Image from 'next/image';

interface Venue {
  id: string;
  slug: string;
  name: string;
  description?: string;
  shortDescription?: string;
  logo?: string;
  coverImage?: string;
  category?: string;
  address?: string;
  lat?: number;
  lng?: number;
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  twitter?: string;
  facebook?: string;
  tiktok?: string;
  rating?: number;
  reviewCount?: number;
  followerCount?: number;
  verified?: boolean;
  featured?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  eventsCount?: number;
  city?: { id: string; name: string; slug: string } | null;
}

interface City {
  id: string;
  name: string;
  slug: string;
  country: string;
}

const CATEGORIES = [
  { value: 'museo', label: 'Museo' },
  { value: 'teatro', label: 'Teatro' },
  { value: 'galeria', label: 'Galeria' },
  { value: 'bar', label: 'Bar' },
  { value: 'club', label: 'Club' },
  { value: 'restaurante', label: 'Restaurante' },
  { value: 'auditorio', label: 'Auditorio' },
  { value: 'centro_cultural', label: 'Centro Cultural' },
  { value: 'general', label: 'General' },
];

const emptyForm = {
  slug: '', name: '', description: '', shortDescription: '',
  logo: '', coverImage: '', category: 'general', address: '',
  cityId: '', lat: '', lng: '', phone: '', email: '', website: '',
  instagram: '', twitter: '', facebook: '', tiktok: '',
  verified: false, featured: false, metaTitle: '', metaDescription: '',
};

export default function VenuesAdminPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingVenue, setEditingVenue] = useState<string | null>(null); // slug
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [deleting, setDeleting] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [venuesRes, citiesRes] = await Promise.all([
        fetch('/api/venues'),
        fetch('/api/cities'),
      ]);
      const venuesData = await venuesRes.json();
      const citiesData = await citiesRes.json();
      setVenues(Array.isArray(venuesData) ? venuesData : []);
      setCities(Array.isArray(citiesData) ? citiesData : []);
    } catch {
      showToast('Error cargando datos', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => {
    setEditingVenue(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (v: Venue) => {
    setEditingVenue(v.slug);
    setForm({
      slug: v.slug, name: v.name, description: v.description || '',
      shortDescription: v.shortDescription || '', logo: v.logo || '',
      coverImage: v.coverImage || '', category: v.category || 'general',
      address: v.address || '', cityId: v.city?.id || '',
      lat: v.lat?.toString() || '', lng: v.lng?.toString() || '',
      phone: v.phone || '', email: v.email || '', website: v.website || '',
      instagram: v.instagram || '', twitter: v.twitter || '',
      facebook: v.facebook || '', tiktok: v.tiktok || '',
      verified: v.verified || false, featured: v.featured || false,
      metaTitle: v.metaTitle || '', metaDescription: v.metaDescription || '',
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.slug || !form.name) {
      showToast('Slug y nombre son requeridos', 'error');
      return;
    }
    setSaving(true);
    try {
      const body = {
        ...form,
        cityId: form.cityId ? Number(form.cityId) : null,
        lat: form.lat ? Number(form.lat) : null,
        lng: form.lng ? Number(form.lng) : null,
      };

      const url = editingVenue ? `/api/venues/${editingVenue}` : '/api/venues';
      const method = editingVenue ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast(editingVenue ? 'Venue actualizado' : 'Venue creado');
      setShowForm(false);
      loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm('Eliminar este venue? Esta accion no se puede deshacer.')) return;
    setDeleting(slug);
    try {
      const res = await fetch(`/api/venues/${slug}`, { method: 'DELETE', headers });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      showToast('Venue eliminado');
      loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const updateField = (key: string, value: string | boolean) => setForm((f) => ({ ...f, [key]: value }));

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    background: 'var(--input-bg)', border: '1px solid var(--input-border)',
    color: 'var(--fg)', fontSize: 16,
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6,
    color: 'var(--text-secondary)',
  };

  if (!user) return null;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--fg)', margin: 0 }}>Venues</h1>
          <p style={{ fontSize: 14, color: 'var(--text-tertiary)', margin: '4px 0 0' }}>
            {venues.length} venues registrados
          </p>
        </div>
        <button
          onClick={openCreate}
          style={{
            padding: '12px 20px', borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg, #e63946, #d32836)', color: '#fff',
            fontWeight: 700, fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8, minHeight: 44,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Nuevo Venue
        </button>
      </div>

      {/* Edit/Create Form */}
      {showForm && (
        <div style={{ marginBottom: 32, padding: 24, borderRadius: 16, background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--fg)' }}>
              {editingVenue ? `Editar: ${form.name}` : 'Nuevo Venue'}
            </h2>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 22 }}>x</button>
          </div>
          <form onSubmit={handleSave}>
            {/* Basic info */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>Nombre *</label>
                <input style={inputStyle} value={form.name} onChange={(e) => updateField('name', e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>Slug *</label>
                <input style={inputStyle} value={form.slug} onChange={(e) => updateField('slug', e.target.value)} required placeholder="mi-venue" />
              </div>
              <div>
                <label style={labelStyle}>Categoria</label>
                <select style={inputStyle} value={form.category} onChange={(e) => updateField('category', e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Ciudad</label>
                <select style={inputStyle} value={form.cityId} onChange={(e) => updateField('cityId', e.target.value)}>
                  <option value="">Sin ciudad</option>
                  {cities.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.country})</option>)}
                </select>
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Descripcion corta</label>
              <input style={inputStyle} value={form.shortDescription} onChange={(e) => updateField('shortDescription', e.target.value)} placeholder="Una frase que describa el venue" />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Descripcion completa</label>
              <textarea style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }} value={form.description} onChange={(e) => updateField('description', e.target.value)} />
            </div>

            {/* Media */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>Logo (URL)</label>
                <input style={inputStyle} value={form.logo} onChange={(e) => updateField('logo', e.target.value)} placeholder="https://..." />
                {form.logo && <div style={{ marginTop: 8, width: 48, height: 48, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}><Image src={form.logo} alt="" width={48} height={48} style={{ objectFit: 'cover', width: '100%', height: '100%' }} /></div>}
              </div>
              <div>
                <label style={labelStyle}>Imagen de portada (URL)</label>
                <input style={inputStyle} value={form.coverImage} onChange={(e) => updateField('coverImage', e.target.value)} placeholder="https://..." />
                {form.coverImage && <div style={{ marginTop: 8, height: 60, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}><Image src={form.coverImage} alt="" width={200} height={60} style={{ objectFit: 'cover', width: '100%', height: '100%' }} /></div>}
              </div>
            </div>

            {/* Location */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>Direccion</label>
                <input style={inputStyle} value={form.address} onChange={(e) => updateField('address', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Latitud</label>
                <input style={inputStyle} type="number" step="any" value={form.lat} onChange={(e) => updateField('lat', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Longitud</label>
                <input style={inputStyle} type="number" step="any" value={form.lng} onChange={(e) => updateField('lng', e.target.value)} />
              </div>
            </div>

            {/* Contact */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
              <div><label style={labelStyle}>Telefono</label><input style={inputStyle} value={form.phone} onChange={(e) => updateField('phone', e.target.value)} /></div>
              <div><label style={labelStyle}>Email</label><input style={inputStyle} type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} /></div>
              <div><label style={labelStyle}>Website</label><input style={inputStyle} value={form.website} onChange={(e) => updateField('website', e.target.value)} placeholder="https://..." /></div>
            </div>

            {/* Social */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
              <div><label style={labelStyle}>Instagram</label><input style={inputStyle} value={form.instagram} onChange={(e) => updateField('instagram', e.target.value)} placeholder="@usuario" /></div>
              <div><label style={labelStyle}>Twitter / X</label><input style={inputStyle} value={form.twitter} onChange={(e) => updateField('twitter', e.target.value)} placeholder="@usuario" /></div>
              <div><label style={labelStyle}>Facebook</label><input style={inputStyle} value={form.facebook} onChange={(e) => updateField('facebook', e.target.value)} /></div>
              <div><label style={labelStyle}>TikTok</label><input style={inputStyle} value={form.tiktok} onChange={(e) => updateField('tiktok', e.target.value)} placeholder="@usuario" /></div>
            </div>

            {/* SEO */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 20 }}>
              <div><label style={labelStyle}>Meta titulo (SEO)</label><input style={inputStyle} value={form.metaTitle} onChange={(e) => updateField('metaTitle', e.target.value)} /></div>
              <div><label style={labelStyle}>Meta descripcion (SEO)</label><input style={inputStyle} value={form.metaDescription} onChange={(e) => updateField('metaDescription', e.target.value)} /></div>
            </div>

            {/* Flags */}
            <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={form.verified} onChange={(e) => updateField('verified', e.target.checked)} style={{ width: 18, height: 18, accentColor: '#2a9d8f' }} />
                Verificado
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={form.featured} onChange={(e) => updateField('featured', e.target.checked)} style={{ width: 18, height: 18, accentColor: '#e63946' }} />
                Destacado
              </label>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" disabled={saving} style={{
                padding: '12px 28px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg, #e63946, #d32836)', color: '#fff',
                fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
                minHeight: 44,
              }}>
                {saving ? 'Guardando...' : editingVenue ? 'Guardar cambios' : 'Crear venue'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={{
                padding: '12px 28px', borderRadius: 12,
                background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)',
                fontWeight: 600, fontSize: 14, cursor: 'pointer', minHeight: 44,
              }}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Venues Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: '#e63946', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : venues.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 48, marginBottom: 8 }}>🏛️</p>
          <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg)' }}>No hay venues</p>
          <p style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>Crea el primero</p>
        </div>
      ) : (
        <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 700 }}>
            <thead>
              <tr style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Venue</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Categoria</th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Rating</th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Seguidores</th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Estado</th>
                <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {venues.map((v) => (
                <tr key={v.id} className="table-row-theme" style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: 'var(--surface-2)' }}>
                        {v.logo ? (
                          <Image src={v.logo} alt="" width={40} height={40} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#e63946', fontSize: 16 }}>{v.name.charAt(0)}</div>
                        )}
                      </div>
                      <div>
                        <a href={`/venues/${v.slug}`} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, color: 'var(--fg)', textDecoration: 'none' }}>{v.name}</a>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{v.city?.name || 'Sin ciudad'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className="badge badge-gray">{CATEGORIES.find((c) => c.value === v.category)?.label || v.category}</span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    {v.rating ? (
                      <span style={{ fontWeight: 700 }}>
                        <span style={{ color: '#eab308' }}>&#9733;</span> {v.rating.toFixed(1)}
                      </span>
                    ) : '-'}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600 }}>{v.followerCount || 0}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                      {v.verified && <span className="badge badge-green">Verificado</span>}
                      {v.featured && <span className="badge badge-purple">Destacado</span>}
                      {!v.verified && !v.featured && <span className="badge badge-gray">Normal</span>}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => openEdit(v)}
                        style={{
                          padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)',
                          background: 'var(--card)', color: 'var(--fg)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                          minHeight: 40,
                        }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(v.slug)}
                        disabled={deleting === v.slug}
                        style={{
                          padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)',
                          background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: 13, fontWeight: 600,
                          cursor: deleting === v.slug ? 'not-allowed' : 'pointer', opacity: deleting === v.slug ? 0.5 : 1,
                          minHeight: 40,
                        }}
                      >
                        {deleting === v.slug ? '...' : 'Eliminar'}
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
    </div>
  );
}
