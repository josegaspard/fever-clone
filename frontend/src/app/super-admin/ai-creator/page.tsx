'use client';

import React, { useState, useEffect } from 'react';
import {
  createEvent,
  getCities,
  getCategories,
  fetchApi,
  City,
  Category,
} from '@/lib/api';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

type Step = 'input' | 'processing' | 'review' | 'success';

interface ParsedResult {
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  image: string | null;
  gallery: string[];
  videoUrl: string | null;
  price: number | null;
  originalPrice: number | null;
  currency: string;
  date: string | null;
  endDate: string | null;
  time: string | null;
  duration: string | null;
  citySlug: string | null;
  categorySlug: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  capacity: number | null;
  status: string;
  featured: boolean;
  metaTitle: string;
  metaDescription: string;
  links: string[];
  detected: Record<string, boolean>;
}

interface EventForm {
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  image: string;
  gallery: string;
  videoUrl: string;
  price: string;
  originalPrice: string;
  currency: string;
  date: string;
  endDate: string;
  time: string;
  duration: string;
  cityId: string;
  categoryId: string;
  address: string;
  lat: string;
  lng: string;
  capacity: string;
  status: string;
  featured: boolean;
  metaTitle: string;
  metaDescription: string;
}

// ── Magic loading animation particles ──────────────────────────────────────
function MagicLoader() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, padding: '60px 20px' }}>
      <div style={{ position: 'relative', width: 120, height: 120 }}>
        {/* Outer ring */}
        <div style={{
          position: 'absolute', inset: 0,
          border: '3px solid transparent',
          borderTopColor: '#e63946',
          borderRadius: '50%',
          animation: 'aiSpin 1.2s linear infinite',
        }} />
        {/* Middle ring */}
        <div style={{
          position: 'absolute', inset: 12,
          border: '3px solid transparent',
          borderTopColor: '#ff6b6b',
          borderBottomColor: '#ff6b6b',
          borderRadius: '50%',
          animation: 'aiSpin 0.8s linear infinite reverse',
        }} />
        {/* Inner sparkle */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" style={{ animation: 'aiPulse 1.5s ease-in-out infinite' }}>
            <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" fill="#e63946" />
          </svg>
        </div>
        {/* Floating particles */}
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{
            position: 'absolute',
            width: 6, height: 6,
            borderRadius: '50%',
            background: i % 2 === 0 ? '#e63946' : '#ff6b6b',
            top: '50%', left: '50%',
            animation: `aiParticle 2s ease-in-out infinite`,
            animationDelay: `${i * 0.33}s`,
            opacity: 0.7,
          }} />
        ))}
      </div>
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ color: 'var(--fg)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
          Analizando contenido...
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Extrayendo titulo, fecha, precio, ubicacion y mas
        </p>
      </div>
      <style>{`
        @keyframes aiSpin { to { transform: rotate(360deg); } }
        @keyframes aiPulse { 0%, 100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.2); opacity: 1; } }
        @keyframes aiParticle {
          0% { transform: translate(-50%, -50%) rotate(var(--angle, 0deg)) translateX(30px) scale(1); opacity: 0.7; }
          50% { transform: translate(-50%, -50%) rotate(var(--angle, 0deg)) translateX(55px) scale(1.3); opacity: 1; }
          100% { transform: translate(-50%, -50%) rotate(var(--angle, 0deg)) translateX(30px) scale(1); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}

// ── Detection badge ────────────────────────────────────────────────────────
function DetectionBadge({ detected }: { detected: boolean }) {
  if (detected) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 6,
        background: 'rgba(34,197,94,0.12)', color: '#16a34a',
      }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Detectado automaticamente
      </span>
    );
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 6,
      background: 'rgba(234,179,8,0.12)', color: '#ca8a04',
    }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <path d="M12 9v4M12 17h.01" />
      </svg>
      No detectado - completar manualmente
    </span>
  );
}

export default function AICreatorPage() {
  const [step, setStep] = useState<Step>('input');
  const [content, setContent] = useState('');
  const [imageUrls, setImageUrls] = useState('');
  const [linkUrls, setLinkUrls] = useState('');
  const [error, setError] = useState('');
  const [cities, setCities] = useState<City[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [detected, setDetected] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [createdSlug, setCreatedSlug] = useState('');
  const [createdTitle, setCreatedTitle] = useState('');

  const [form, setForm] = useState<EventForm>({
    title: '',
    slug: '',
    description: '',
    shortDescription: '',
    image: '',
    gallery: '',
    videoUrl: '',
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
    capacity: '',
    status: 'DRAFT',
    featured: false,
    metaTitle: '',
    metaDescription: '',
  });

  useEffect(() => {
    Promise.all([getCities(), getCategories()])
      .then(([c, cat]) => {
        setCities(c);
        setCategories(cat);
      })
      .catch(() => {});
  }, []);

  const updateField = (field: keyof EventForm, value: string | boolean) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'title' && typeof value === 'string') {
        next.slug = slugify(value);
        if (!next.metaTitle || next.metaTitle === `${prev.title.slice(0, 55)} | CTXplorer`) {
          next.metaTitle = `${value.slice(0, 55)} | CTXplorer`;
        }
      }
      return next;
    });
  };

  // ── Step 1: Parse content via API ──────────────────────────────────────
  const handleGenerate = async () => {
    if (!content.trim()) {
      setError('Por favor, pega algun contenido para analizar.');
      return;
    }
    setError('');
    setStep('processing');

    try {
      const images = imageUrls.split(',').map(u => u.trim()).filter(Boolean);
      const links = linkUrls.split(',').map(u => u.trim()).filter(Boolean);

      const result = await fetchApi<ParsedResult>('/admin/ai-parse', {
        method: 'POST',
        body: JSON.stringify({ content: content.trim(), images, links }),
      });

      // Find city ID from slug
      let cityId = '';
      if (result.citySlug) {
        const matchedCity = cities.find(c =>
          c.slug === result.citySlug || c.slug.includes(result.citySlug!)
        );
        if (matchedCity) cityId = matchedCity.id;
      }

      // Find category ID from slug
      let categoryId = '';
      if (result.categorySlug) {
        const matchedCat = categories.find(c =>
          c.slug === result.categorySlug || c.slug.includes(result.categorySlug!)
        );
        if (matchedCat) categoryId = matchedCat.id;
      }

      setForm({
        title: result.title || '',
        slug: result.slug || '',
        description: result.description || '',
        shortDescription: result.shortDescription || '',
        image: result.image || '',
        gallery: result.gallery?.join(', ') || '',
        videoUrl: result.videoUrl || '',
        price: result.price !== null ? String(result.price) : '',
        originalPrice: '',
        currency: result.currency || 'MXN',
        date: result.date || '',
        endDate: '',
        time: result.time || '',
        duration: result.duration || '',
        cityId,
        categoryId,
        address: result.address || '',
        lat: result.lat ? String(result.lat) : '',
        lng: result.lng ? String(result.lng) : '',
        capacity: '',
        status: 'DRAFT',
        featured: false,
        metaTitle: result.metaTitle || '',
        metaDescription: result.metaDescription || '',
      });

      setDetected(result.detected || {});
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al analizar el contenido');
      setStep('input');
    }
  };

  // ── Step 4: Create event ───────────────────────────────────────────────
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('El titulo es obligatorio.');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const galleryUrls = form.gallery.split(',').map(u => u.trim()).filter(Boolean);

      const body: Record<string, unknown> = {
        title: form.title,
        slug: form.slug || slugify(form.title),
        description: form.description,
        shortDescription: form.shortDescription || undefined,
        image: form.image || undefined,
        videoUrl: form.videoUrl || undefined,
        gallery: galleryUrls.length > 0 ? galleryUrls : undefined,
        price: Number(form.price) || 0,
        originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
        currency: form.currency,
        date: form.date || undefined,
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
      };

      const created = await createEvent(body);
      setCreatedSlug(created.slug);
      setCreatedTitle(created.title);
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el evento');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep('input');
    setContent('');
    setImageUrls('');
    setLinkUrls('');
    setError('');
    setDetected({});
    setCreatedSlug('');
    setCreatedTitle('');
    setForm({
      title: '', slug: '', description: '', shortDescription: '',
      image: '', gallery: '', videoUrl: '', price: '', originalPrice: '',
      currency: 'MXN', date: '', endDate: '', time: '', duration: '',
      cityId: '', categoryId: '', address: '', lat: '', lng: '',
      capacity: '', status: 'DRAFT', featured: false, metaTitle: '', metaDescription: '',
    });
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 12,
    border: '1px solid var(--border)',
    background: 'var(--bg)',
    color: 'var(--fg)',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 6,
    color: 'var(--text-secondary)',
  };

  const cardStyle: React.CSSProperties = {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: 24,
  };

  const sectionTitleStyle: React.CSSProperties = {
    color: 'var(--fg)',
    fontSize: 17,
    fontWeight: 700,
    marginBottom: 20,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  };

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #e63946, #ff6b6b)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z"
                fill="#fff" />
            </svg>
          </div>
          <div>
            <h1 style={{ color: 'var(--fg)', fontSize: 28, fontWeight: 800, letterSpacing: -0.5, margin: 0 }}>
              Crear con IA
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0, marginTop: 2 }}>
              Pega cualquier contenido y generaremos un evento automaticamente
            </p>
          </div>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          {[
            { key: 'input', label: '1. Contenido' },
            { key: 'processing', label: '2. Analisis' },
            { key: 'review', label: '3. Revision' },
            { key: 'success', label: '4. Publicado' },
          ].map((s, i) => {
            const steps: Step[] = ['input', 'processing', 'review', 'success'];
            const currentIdx = steps.indexOf(step);
            const stepIdx = steps.indexOf(s.key as Step);
            const isActive = stepIdx === currentIdx;
            const isDone = stepIdx < currentIdx;
            return (
              <div key={s.key} style={{
                flex: 1,
                height: 4,
                borderRadius: 4,
                background: isDone ? '#e63946' : isActive ? 'linear-gradient(90deg, #e63946, #ff6b6b)' : 'var(--border)',
                transition: 'all 0.3s',
                position: 'relative',
              }}>
                <span style={{
                  position: 'absolute',
                  top: 10,
                  left: 0,
                  fontSize: 11,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive || isDone ? '#e63946' : 'var(--text-tertiary)',
                  whiteSpace: 'nowrap',
                }}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 12,
          padding: '12px 16px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <span className="text-red-600 dark:text-red-400" style={{ fontSize: 14 }}>{error}</span>
        </div>
      )}

      {/* ── STEP 1: Input ──────────────────────────────────────────────────── */}
      {step === 'input' && (
        <div style={{ maxWidth: 800 }}>
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              Pega tu contenido
            </h2>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 13, marginBottom: 20, marginTop: -12 }}>
              Puede ser una descripcion de evento, contenido de sitio web, post de redes sociales, nota de prensa, o cualquier texto con informacion del evento.
            </p>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Contenido del evento *</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={"Ejemplo:\n\nFestival de Jazz en el Parque\n25 de abril de 2026\nParque Lincoln, Polanco, CDMX\n\nVen a disfrutar de una noche increible de jazz en vivo con los mejores musicos de Mexico. El festival incluye food trucks, bebidas artesanales y una zona lounge.\n\nHora: 7:00 PM\nDuracion: 4 horas\nPrecio: $350 MXN\nCapacidad: 500 personas"}
                style={{
                  ...inputStyle,
                  minHeight: 260,
                  resize: 'vertical',
                  lineHeight: 1.6,
                  fontFamily: 'inherit',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#e63946'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div>
                <label style={labelStyle}>
                  URLs de imagenes
                  <span style={{ fontWeight: 400, color: 'var(--text-tertiary)', marginLeft: 6 }}>(opcional, separadas por coma)</span>
                </label>
                <textarea
                  value={imageUrls}
                  onChange={(e) => setImageUrls(e.target.value)}
                  placeholder="https://ejemplo.com/img1.jpg, https://ejemplo.com/img2.jpg"
                  style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#e63946'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                />
              </div>
              <div>
                <label style={labelStyle}>
                  Links externos
                  <span style={{ fontWeight: 400, color: 'var(--text-tertiary)', marginLeft: 6 }}>(opcional, separadas por coma)</span>
                </label>
                <textarea
                  value={linkUrls}
                  onChange={(e) => setLinkUrls(e.target.value)}
                  placeholder="https://ejemplo.com/evento, https://facebook.com/evento"
                  style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#e63946'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!content.trim()}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                width: '100%',
                padding: '14px 24px',
                borderRadius: 12,
                border: 'none',
                background: content.trim()
                  ? 'linear-gradient(135deg, #e63946, #d32836)'
                  : 'var(--border)',
                color: content.trim() ? '#fff' : 'var(--text-tertiary)',
                fontSize: 16,
                fontWeight: 700,
                cursor: content.trim() ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s',
                letterSpacing: -0.3,
              }}
              onMouseEnter={(e) => {
                if (content.trim()) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(230,57,70,0.3)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z"
                  fill="currentColor" />
              </svg>
              Generar evento con IA
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Processing ─────────────────────────────────────────────── */}
      {step === 'processing' && (
        <div style={{ ...cardStyle, maxWidth: 600, margin: '0 auto' }}>
          <MagicLoader />
        </div>
      )}

      {/* ── STEP 3: Review & Edit ──────────────────────────────────────────── */}
      {step === 'review' && (
        <form onSubmit={handlePublish}>
          <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>
            {/* Left: Form */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Summary bar */}
              <div style={{
                ...cardStyle,
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: 'rgba(230,57,70,0.06)',
                borderColor: 'rgba(230,57,70,0.2)',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" fill="#e63946" />
                </svg>
                <span style={{ color: 'var(--fg)', fontSize: 14, fontWeight: 600 }}>
                  {Object.values(detected).filter(Boolean).length} de {Object.keys(detected).length} campos detectados automaticamente
                </span>
                <button
                  type="button"
                  onClick={() => { setStep('input'); setError(''); }}
                  style={{
                    marginLeft: 'auto',
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--card)',
                    color: 'var(--text-secondary)',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Volver a pegar
                </button>
              </div>

              {/* Basic info */}
              <div style={cardStyle}>
                <h2 style={sectionTitleStyle}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Informacion basica
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <label style={{ ...labelStyle, marginBottom: 0 }}>Titulo *</label>
                      <DetectionBadge detected={detected.title} />
                    </div>
                    <input
                      type="text"
                      required
                      value={form.title}
                      onChange={(e) => updateField('title', e.target.value)}
                      placeholder="Nombre del evento"
                      style={inputStyle}
                      className="input-theme"
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <label style={{ ...labelStyle, marginBottom: 0 }}>Slug</label>
                      <DetectionBadge detected={detected.slug} />
                    </div>
                    <input
                      type="text"
                      value={form.slug}
                      onChange={(e) => updateField('slug', e.target.value)}
                      style={inputStyle}
                      className="input-theme"
                    />
                    <p style={{ color: 'var(--text-tertiary)', fontSize: 11, marginTop: 4 }}>
                      Se genera automaticamente desde el titulo
                    </p>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <label style={{ ...labelStyle, marginBottom: 0 }}>Descripcion *</label>
                      <DetectionBadge detected={detected.description} />
                    </div>
                    <textarea
                      required
                      rows={5}
                      value={form.description}
                      onChange={(e) => updateField('description', e.target.value)}
                      placeholder="Descripcion completa del evento..."
                      style={{ ...inputStyle, resize: 'vertical' }}
                      className="input-theme"
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <label style={{ ...labelStyle, marginBottom: 0 }}>Descripcion corta</label>
                      <DetectionBadge detected={detected.shortDescription} />
                    </div>
                    <input
                      type="text"
                      value={form.shortDescription}
                      onChange={(e) => updateField('shortDescription', e.target.value)}
                      placeholder="Resumen breve (150 caracteres)"
                      style={inputStyle}
                      className="input-theme"
                    />
                  </div>
                </div>
              </div>

              {/* Category */}
              <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h2 style={{ ...sectionTitleStyle, marginBottom: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                      <line x1="4" y1="22" x2="4" y2="15" />
                    </svg>
                    Categoria
                  </h2>
                  <DetectionBadge detected={detected.category} />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {categories.length === 0 ? (
                    <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Cargando categorias...</p>
                  ) : (
                    categories.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => updateField('categoryId', form.categoryId === cat.id ? '' : cat.id)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 20,
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          background: form.categoryId === cat.id ? 'linear-gradient(135deg, #e63946, #d32836)' : 'var(--bg)',
                          color: form.categoryId === cat.id ? '#fff' : 'var(--text-secondary)',
                          border: `1px solid ${form.categoryId === cat.id ? '#e63946' : 'var(--border)'}`,
                        }}
                      >
                        {cat.icon && <span style={{ marginRight: 4 }}>{cat.icon}</span>}
                        {cat.name}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Date, time & Location */}
              <div style={cardStyle}>
                <h2 style={sectionTitleStyle}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  Fecha y ubicacion
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <label style={{ ...labelStyle, marginBottom: 0 }}>Fecha</label>
                      <DetectionBadge detected={detected.date} />
                    </div>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => updateField('date', e.target.value)}
                      style={inputStyle}
                      className="input-theme"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Fecha fin</label>
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => updateField('endDate', e.target.value)}
                      style={inputStyle}
                      className="input-theme"
                    />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <label style={{ ...labelStyle, marginBottom: 0 }}>Hora</label>
                      <DetectionBadge detected={detected.time} />
                    </div>
                    <input
                      type="time"
                      value={form.time}
                      onChange={(e) => updateField('time', e.target.value)}
                      style={inputStyle}
                      className="input-theme"
                    />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <label style={{ ...labelStyle, marginBottom: 0 }}>Duracion</label>
                      <DetectionBadge detected={detected.duration} />
                    </div>
                    <input
                      type="text"
                      value={form.duration}
                      onChange={(e) => updateField('duration', e.target.value)}
                      placeholder="ej: 2 horas"
                      style={inputStyle}
                      className="input-theme"
                    />
                  </div>
                </div>

                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>Ciudad</label>
                    <DetectionBadge detected={detected.city} />
                  </div>
                  <select
                    value={form.cityId}
                    onChange={(e) => updateField('cityId', e.target.value)}
                    style={inputStyle}
                    className="input-theme"
                  >
                    <option value="">Seleccionar ciudad</option>
                    {cities.map(c => (
                      <option key={c.id} value={c.id}>{c.name}, {c.country}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>Direccion</label>
                    <DetectionBadge detected={detected.address} />
                  </div>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="Direccion del evento"
                    style={inputStyle}
                    className="input-theme"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                  <div>
                    <label style={labelStyle}>Latitud</label>
                    <input
                      type="number"
                      step="any"
                      value={form.lat}
                      onChange={(e) => updateField('lat', e.target.value)}
                      placeholder="ej: 19.4326"
                      style={inputStyle}
                      className="input-theme"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Longitud</label>
                    <input
                      type="number"
                      step="any"
                      value={form.lng}
                      onChange={(e) => updateField('lng', e.target.value)}
                      placeholder="ej: -99.1332"
                      style={inputStyle}
                      className="input-theme"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div style={cardStyle}>
                <h2 style={sectionTitleStyle}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                  Precio y capacidad
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <label style={{ ...labelStyle, marginBottom: 0 }}>Precio</label>
                      <DetectionBadge detected={detected.price} />
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => updateField('price', e.target.value)}
                      placeholder="0.00"
                      style={inputStyle}
                      className="input-theme"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Precio original</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.originalPrice}
                      onChange={(e) => updateField('originalPrice', e.target.value)}
                      placeholder="Precio sin descuento"
                      style={inputStyle}
                      className="input-theme"
                    />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <label style={{ ...labelStyle, marginBottom: 0 }}>Moneda</label>
                      <DetectionBadge detected={detected.currency} />
                    </div>
                    <select
                      value={form.currency}
                      onChange={(e) => updateField('currency', e.target.value)}
                      style={inputStyle}
                      className="input-theme"
                    >
                      <option value="MXN">MXN - Peso mexicano</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="USD">USD - Dolar americano</option>
                      <option value="GBP">GBP - Libra esterlina</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Capacidad</label>
                    <input
                      type="number"
                      min="0"
                      value={form.capacity}
                      onChange={(e) => updateField('capacity', e.target.value)}
                      placeholder="Maximo de asistentes"
                      style={inputStyle}
                      className="input-theme"
                    />
                  </div>
                </div>
              </div>

              {/* Media */}
              <div style={cardStyle}>
                <h2 style={sectionTitleStyle}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  Multimedia
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <label style={{ ...labelStyle, marginBottom: 0 }}>URL imagen principal</label>
                      <DetectionBadge detected={detected.image} />
                    </div>
                    <input
                      type="url"
                      value={form.image}
                      onChange={(e) => updateField('image', e.target.value)}
                      placeholder="https://ejemplo.com/imagen.jpg"
                      style={inputStyle}
                      className="input-theme"
                    />
                    {form.image && (
                      <img
                        src={form.image}
                        alt="Vista previa"
                        style={{
                          marginTop: 10,
                          height: 140,
                          width: '100%',
                          objectFit: 'cover',
                          borderRadius: 10,
                          border: '1px solid var(--border)',
                        }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                  </div>

                  <div>
                    <label style={labelStyle}>URL de video</label>
                    <input
                      type="url"
                      value={form.videoUrl}
                      onChange={(e) => updateField('videoUrl', e.target.value)}
                      placeholder="https://ejemplo.com/video.mp4"
                      style={inputStyle}
                      className="input-theme"
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <label style={{ ...labelStyle, marginBottom: 0 }}>Galeria (URLs separadas por coma)</label>
                      <DetectionBadge detected={detected.gallery} />
                    </div>
                    <textarea
                      value={form.gallery}
                      onChange={(e) => updateField('gallery', e.target.value)}
                      placeholder="https://img1.jpg, https://img2.jpg, ..."
                      rows={2}
                      style={{ ...inputStyle, resize: 'vertical' }}
                      className="input-theme"
                    />
                    {form.gallery && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto', paddingBottom: 4 }}>
                        {form.gallery.split(',').map(u => u.trim()).filter(Boolean).map((url, idx) => (
                          <img
                            key={idx}
                            src={url}
                            alt={`Galeria ${idx + 1}`}
                            style={{
                              height: 64, width: 64, objectFit: 'cover',
                              borderRadius: 8, flexShrink: 0,
                              border: '1px solid var(--border)',
                            }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SEO */}
              <div style={cardStyle}>
                <h2 style={sectionTitleStyle}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  SEO
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <label style={{ ...labelStyle, marginBottom: 0 }}>Meta titulo</label>
                      <DetectionBadge detected={detected.metaTitle} />
                    </div>
                    <input
                      type="text"
                      value={form.metaTitle}
                      onChange={(e) => updateField('metaTitle', e.target.value)}
                      placeholder="Titulo para buscadores (max 60 chars)"
                      style={inputStyle}
                      className="input-theme"
                    />
                    <p style={{ color: form.metaTitle.length > 60 ? '#dc2626' : 'var(--text-tertiary)', fontSize: 11, marginTop: 4 }}>
                      {form.metaTitle.length}/60 caracteres
                    </p>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <label style={{ ...labelStyle, marginBottom: 0 }}>Meta descripcion</label>
                      <DetectionBadge detected={detected.metaDescription} />
                    </div>
                    <textarea
                      value={form.metaDescription}
                      onChange={(e) => updateField('metaDescription', e.target.value)}
                      placeholder="Descripcion para buscadores (max 155 chars)"
                      rows={2}
                      style={{ ...inputStyle, resize: 'vertical' }}
                      className="input-theme"
                    />
                    <p style={{ color: form.metaDescription.length > 155 ? '#dc2626' : 'var(--text-tertiary)', fontSize: 11, marginTop: 4 }}>
                      {form.metaDescription.length}/155 caracteres
                    </p>
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div style={cardStyle}>
                <h2 style={sectionTitleStyle}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  Configuracion
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Estado</label>
                    <select
                      value={form.status}
                      onChange={(e) => updateField('status', e.target.value)}
                      style={inputStyle}
                      className="input-theme"
                    >
                      <option value="DRAFT">Borrador</option>
                      <option value="PUBLISHED">Publicado</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                      <div
                        style={{
                          position: 'relative', width: 40, height: 20, borderRadius: 10,
                          background: form.featured ? '#e63946' : 'var(--border)',
                          cursor: 'pointer', transition: 'background 0.2s',
                        }}
                        onClick={() => updateField('featured', !form.featured)}
                      >
                        <div style={{
                          position: 'absolute', top: 2, width: 16, height: 16, borderRadius: '50%',
                          background: '#fff', transition: 'transform 0.2s',
                          transform: form.featured ? 'translateX(22px)' : 'translateX(2px)',
                        }} />
                      </div>
                      <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                        Evento destacado
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Submit buttons */}
              <div style={{ display: 'flex', gap: 12, paddingTop: 8, paddingBottom: 32 }}>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                  style={{
                    padding: '14px 32px',
                    fontSize: 15,
                    fontWeight: 700,
                    borderRadius: 12,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {submitting ? (
                    <>
                      <div style={{
                        width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#fff', borderRadius: '50%', animation: 'aiSpin 0.8s linear infinite',
                      }} />
                      Creando...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      Publicar evento
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep('input'); setError(''); }}
                  className="btn-secondary"
                  style={{
                    padding: '14px 24px',
                    fontSize: 15,
                    fontWeight: 600,
                    borderRadius: 12,
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>

            {/* Right: Live preview card */}
            <div style={{ width: 320, flexShrink: 0, position: 'sticky', top: 24 }}
              className="ai-creator-preview"
            >
              <h3 style={{
                fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)',
                textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12,
              }}>
                Vista previa
              </h3>
              <div style={{
                borderRadius: 16, overflow: 'hidden',
                border: '1px solid var(--border)', background: 'var(--card)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              }}>
                {/* Image */}
                <div style={{ aspectRatio: '3/4', position: 'relative', overflow: 'hidden', background: 'var(--bg)' }}>
                  {form.image ? (
                    <img
                      src={form.image}
                      alt="Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                  )}
                  {form.categoryId && (
                    <div style={{
                      position: 'absolute', bottom: 10, left: 10,
                      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                      color: '#fff', fontSize: 11, padding: '4px 10px', borderRadius: 20,
                    }}>
                      {categories.find(c => c.id === form.categoryId)?.name || ''}
                    </div>
                  )}
                  {form.featured && (
                    <div style={{
                      position: 'absolute', top: 10, right: 10,
                      background: '#e63946', color: '#fff', fontSize: 10,
                      fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                      textTransform: 'uppercase', letterSpacing: 0.5,
                    }}>
                      Destacado
                    </div>
                  )}
                </div>
                <div style={{ padding: 14 }}>
                  <h4 style={{
                    color: 'var(--fg)', fontSize: 14, fontWeight: 600,
                    lineHeight: 1.4, marginBottom: 6,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {form.title || 'Titulo del evento'}
                  </h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 8 }}>
                    {form.date
                      ? new Date(form.date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                      : 'Fecha'}
                    {form.time ? ` \u00B7 ${form.time}` : ''}
                    {form.cityId ? ` \u00B7 ${cities.find(c => c.id === form.cityId)?.name || ''}` : ''}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--fg)', fontSize: 15, fontWeight: 700 }}>
                      {form.price
                        ? `${form.currency === 'GBP' ? '\u00A3' : form.currency === 'EUR' ? '\u20AC' : '$'}${Number(form.price).toFixed(0)} ${form.currency}`
                        : 'Gratis'}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                      background: form.status === 'PUBLISHED' ? 'rgba(34,197,94,0.12)' : 'rgba(234,179,8,0.12)',
                      color: form.status === 'PUBLISHED' ? '#16a34a' : '#ca8a04',
                      textTransform: 'uppercase',
                    }}>
                      {form.status === 'PUBLISHED' ? 'Publicado' : 'Borrador'}
                    </span>
                  </div>
                </div>
              </div>

              {/* SEO Preview */}
              {(form.metaTitle || form.metaDescription) && (
                <div style={{ marginTop: 20 }}>
                  <h3 style={{
                    fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)',
                    textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10,
                  }}>
                    Vista previa SEO
                  </h3>
                  <div style={{
                    padding: 16, borderRadius: 12,
                    border: '1px solid var(--border)', background: 'var(--card)',
                  }}>
                    <div style={{ color: '#1a0dab', fontSize: 16, fontWeight: 500, marginBottom: 4, lineHeight: 1.3 }}>
                      {form.metaTitle || form.title || 'Titulo del evento'}
                    </div>
                    <div style={{ color: '#006621', fontSize: 12, marginBottom: 4 }}>
                      fever.com/evento/{form.slug || 'slug'}
                    </div>
                    <div style={{ color: '#545454', fontSize: 13, lineHeight: 1.4 }}>
                      {form.metaDescription || form.shortDescription || 'Descripcion del evento...'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <style>{`
            @media (max-width: 1100px) {
              .ai-creator-preview { display: none !important; }
            }
          `}</style>
        </form>
      )}

      {/* ── STEP 4: Success ──────────────────────────────────────────────── */}
      {step === 'success' && (
        <div style={{
          ...cardStyle,
          maxWidth: 560,
          margin: '0 auto',
          textAlign: 'center',
          padding: 48,
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'rgba(34,197,94,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h2 style={{ color: 'var(--fg)', fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
            Evento creado exitosamente
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 28, lineHeight: 1.5 }}>
            <strong>{createdTitle}</strong> se ha creado correctamente.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href={`/evento/${createdSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 24px', borderRadius: 12,
                background: 'linear-gradient(135deg, #e63946, #d32836)',
                color: '#fff', fontSize: 14, fontWeight: 600,
                textDecoration: 'none', transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(230,57,70,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Ver evento
            </a>

            <button
              onClick={handleReset}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 24px', borderRadius: 12,
                border: '1px solid var(--border)',
                background: 'var(--card)', color: 'var(--fg)',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#e63946';
                e.currentTarget.style.color = '#e63946';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--fg)';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Crear otro evento
            </button>

            <a
              href="/super-admin/events"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 24px', borderRadius: 12,
                border: '1px solid var(--border)',
                background: 'var(--card)', color: 'var(--text-secondary)',
                fontSize: 14, fontWeight: 500, textDecoration: 'none',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--fg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              Ir a Eventos
            </a>
          </div>
        </div>
      )}

      <style>{`
        @keyframes aiSpin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
