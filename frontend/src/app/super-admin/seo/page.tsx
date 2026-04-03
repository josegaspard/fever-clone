'use client';

import React, { useState, useEffect, useCallback } from 'react';

/* ─── Types ────────────────────────────────────────────────────────────── */
interface SeoConfig {
  siteTitle: string;
  siteDescription: string;
  keywords: string[];
  ogImageUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  googleAnalyticsId: string;
}

const DEFAULT_CONFIG: SeoConfig = {
  siteTitle: 'CTXplorer - Descubre los mejores planes y eventos en tu ciudad',
  siteDescription: 'Descubre experiencias unicas, conciertos, gastronomia, arte y mas.',
  keywords: ['eventos', 'experiencias', 'conciertos', 'teatro', 'gastronomia', 'planes'],
  ogImageUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&h=630&fit=crop',
  instagramUrl: 'https://www.instagram.com/ctxplorer',
  twitterUrl: 'https://twitter.com/ctxplorer',
  facebookUrl: 'https://www.facebook.com/ctxplorer',
  tiktokUrl: 'https://www.tiktok.com/@ctxplorer',
  googleAnalyticsId: '',
};

const SEO_CHECKS = [
  { id: 'metaDescription', label: 'Meta description', description: 'Descripcion meta configurada correctamente' },
  { id: 'ogTags', label: 'Open Graph tags', description: 'Etiquetas OG para redes sociales' },
  { id: 'structuredData', label: 'Structured Data (JSON-LD)', description: 'Datos estructurados para buscadores' },
  { id: 'sitemap', label: 'Sitemap XML', description: 'Sitemap generado y accesible' },
  { id: 'robotsTxt', label: 'robots.txt', description: 'Archivo robots.txt configurado' },
  { id: 'canonical', label: 'Canonical URLs', description: 'URLs canonicas para evitar duplicados' },
  { id: 'mobileFriendly', label: 'Mobile Friendly', description: 'Diseno responsive y mobile-first' },
  { id: 'sslCert', label: 'Certificado SSL', description: 'Conexion HTTPS segura' },
  { id: 'pageSpeed', label: 'Page Speed optimizado', description: 'Tiempo de carga menor a 3 segundos' },
  { id: 'altTags', label: 'Alt tags en imagenes', description: 'Texto alternativo en todas las imagenes' },
];

/* ─── Card Wrapper ─────────────────────────────────────────────────────── */
function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)',
      padding: '24px 28px', marginBottom: 20,
    }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg)', marginBottom: description ? 4 : 16 }}>
        {title}
      </h3>
      {description && (
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
          {description}
        </p>
      )}
      {children}
    </div>
  );
}

/* ─── Input Field ──────────────────────────────────────────────────────── */
function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
        {label}
      </label>
      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="input-theme"
          rows={3}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 14,
            outline: 'none', resize: 'vertical', fontFamily: 'inherit',
          }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="input-theme"
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 14, outline: 'none',
          }}
        />
      )}
    </div>
  );
}

/* ─── Tag Input ────────────────────────────────────────────────────────── */
function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState('');

  const addTag = () => {
    const val = input.trim();
    if (val && !tags.includes(val)) {
      onChange([...tags, val]);
      setInput('');
    }
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
        Keywords
      </label>
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 8, padding: '10px 14px',
        borderRadius: 10, background: 'var(--input-bg)', border: '1px solid var(--input-border)',
        minHeight: 44, alignItems: 'center',
      }}>
        {tags.map((tag) => (
          <span
            key={tag}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 10px', borderRadius: 6,
              background: 'rgba(230,57,70,0.12)', color: '#e63946',
              fontSize: 12, fontWeight: 600,
            }}
          >
            {tag}
            <button
              onClick={() => removeTag(tag)}
              style={{
                width: 16, height: 16, borderRadius: 4, border: 'none',
                background: 'rgba(230,57,70,0.2)', color: '#e63946',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, lineHeight: 1, padding: 0,
              }}
            >
              x
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); addTag(); }
            if (e.key === 'Backspace' && !input && tags.length > 0) {
              onChange(tags.slice(0, -1));
            }
          }}
          placeholder={tags.length === 0 ? 'Escribe y presiona Enter...' : 'Agregar...'}
          style={{
            flex: 1, minWidth: 120, border: 'none', background: 'transparent',
            color: 'var(--fg)', fontSize: 14, outline: 'none', padding: '2px 0',
          }}
        />
      </div>
    </div>
  );
}

/* ─── SEO Score ────────────────────────────────────────────────────────── */
function SeoScore({ checks, onToggle }: {
  checks: Record<string, boolean>;
  onToggle: (id: string) => void;
}) {
  const total = SEO_CHECKS.length;
  const passed = SEO_CHECKS.filter((c) => checks[c.id]).length;
  const score = Math.round((passed / total) * 100);

  let scoreColor = '#ef4444';
  if (score >= 80) scoreColor = '#22c55e';
  else if (score >= 50) scoreColor = '#eab308';
  else if (score >= 30) scoreColor = '#f97316';

  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <Card title="SEO Score" description="Evaluacion del estado SEO actual del sitio">
      <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Score circle */}
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <svg width="140" height="140" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="60" cy="60" r="54" fill="none" stroke="var(--border)" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="54" fill="none"
              stroke={scoreColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.25,0.46,0.45,0.94)' }}
            />
          </svg>
          <div style={{
            marginTop: -92, position: 'relative',
            fontSize: 32, fontWeight: 800, color: scoreColor,
            lineHeight: 1,
          }}>
            {score}
          </div>
          <div style={{ position: 'relative', marginTop: 4, fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
            de 100
          </div>
          <div style={{ marginTop: 36, fontSize: 13, fontWeight: 600, color: scoreColor }}>
            {score >= 80 ? 'Excelente' : score >= 50 ? 'Bueno' : score >= 30 ? 'Necesita mejoras' : 'Critico'}
          </div>
        </div>

        {/* Checklist */}
        <div style={{ flex: 1, minWidth: 280 }}>
          {SEO_CHECKS.map((check) => (
            <label
              key={check.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                borderRadius: 10, cursor: 'pointer', transition: 'background 0.15s',
                marginBottom: 2,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(128,128,128,0.06)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <input
                type="checkbox"
                checked={checks[check.id] || false}
                onChange={() => onToggle(check.id)}
                style={{ width: 18, height: 18, accentColor: '#22c55e', cursor: 'pointer', flexShrink: 0 }}
              />
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 14, fontWeight: 600, color: checks[check.id] ? 'var(--fg)' : 'var(--text-secondary)',
                  textDecoration: checks[check.id] ? 'none' : 'none',
                }}>
                  {check.label}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 1 }}>
                  {check.description}
                </div>
              </div>
              <div style={{
                width: 24, height: 24, borderRadius: 6,
                background: checks[check.id] ? 'rgba(34,197,94,0.12)' : 'rgba(128,128,128,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {checks[check.id] ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                )}
              </div>
            </label>
          ))}
        </div>
      </div>
    </Card>
  );
}

/* ─── Main Page ────────────────────────────────────────────────────────── */
export default function SuperAdminSeo() {
  const [config, setConfig] = useState<SeoConfig>(DEFAULT_CONFIG);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('fever-seo-config');
      if (savedConfig) setConfig(JSON.parse(savedConfig));

      const savedChecks = localStorage.getItem('fever-seo-checks');
      if (savedChecks) {
        setChecks(JSON.parse(savedChecks));
      } else {
        // Default some checks as passed
        setChecks({
          metaDescription: true,
          ogTags: true,
          structuredData: true,
          sitemap: true,
          robotsTxt: true,
          canonical: true,
          mobileFriendly: true,
          sslCert: true,
        });
      }
    } catch {
      // ignore
    }
  }, []);

  const updateConfig = useCallback((key: keyof SeoConfig, value: string | string[]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }, []);

  const toggleCheck = useCallback((id: string) => {
    setChecks((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem('fever-seo-checks', JSON.stringify(next));
      return next;
    });
  }, []);

  const handleSave = () => {
    localStorage.setItem('fever-seo-config', JSON.stringify(config));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--fg)', letterSpacing: -0.5, marginBottom: 4 }}>
            SEO
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Configuracion de optimizacion para motores de busqueda
          </p>
        </div>
        <button
          onClick={handleSave}
          className="btn-primary"
          style={{
            padding: '10px 28px', border: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          {saved ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Guardado
            </>
          ) : (
            'Guardar cambios'
          )}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20, alignItems: 'start' }}>
        <div>
          {/* General SEO */}
          <Card title="Configuracion General" description="Titulo y descripcion del sitio que aparecen en los resultados de busqueda">
            <Field
              label="Titulo del sitio"
              value={config.siteTitle}
              onChange={(v) => updateConfig('siteTitle', v)}
              placeholder="Titulo SEO del sitio"
            />
            <Field
              label="Descripcion del sitio"
              value={config.siteDescription}
              onChange={(v) => updateConfig('siteDescription', v)}
              placeholder="Meta description"
              type="textarea"
            />
            <TagInput
              tags={config.keywords}
              onChange={(tags) => updateConfig('keywords', tags)}
            />
            <Field
              label="OG Image URL"
              value={config.ogImageUrl}
              onChange={(v) => updateConfig('ogImageUrl', v)}
              placeholder="https://..."
            />
            {config.ogImageUrl && (
              <div style={{ marginTop: -8, marginBottom: 8 }}>
                <img
                  src={config.ogImageUrl}
                  alt="OG Preview"
                  style={{
                    width: '100%', maxWidth: 300, height: 'auto', borderRadius: 10,
                    border: '1px solid var(--border)', objectFit: 'cover',
                  }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            )}
          </Card>

          {/* Social Media */}
          <Card title="Redes Sociales" description="URLs de perfiles en redes sociales para metadatos y footer">
            <Field
              label="Instagram"
              value={config.instagramUrl}
              onChange={(v) => updateConfig('instagramUrl', v)}
              placeholder="https://www.instagram.com/..."
            />
            <Field
              label="Twitter / X"
              value={config.twitterUrl}
              onChange={(v) => updateConfig('twitterUrl', v)}
              placeholder="https://twitter.com/..."
            />
            <Field
              label="Facebook"
              value={config.facebookUrl}
              onChange={(v) => updateConfig('facebookUrl', v)}
              placeholder="https://www.facebook.com/..."
            />
            <Field
              label="TikTok"
              value={config.tiktokUrl}
              onChange={(v) => updateConfig('tiktokUrl', v)}
              placeholder="https://www.tiktok.com/@..."
            />
          </Card>
        </div>

        <div>
          {/* Analytics & Technical */}
          <Card title="Analytics y Tecnico" description="Configuracion de herramientas de analisis y archivos tecnicos">
            <Field
              label="Google Analytics ID"
              value={config.googleAnalyticsId}
              onChange={(v) => updateConfig('googleAnalyticsId', v)}
              placeholder="G-XXXXXXXXXX"
            />

            <div style={{ marginTop: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
                Archivos tecnicos
              </label>

              {/* Sitemap */}
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                  borderRadius: 10, border: '1px solid var(--border)', textDecoration: 'none',
                  marginBottom: 10, transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#22c55e'; e.currentTarget.style.background = 'rgba(34,197,94,0.04)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: 'rgba(34,197,94,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)' }}>sitemap.xml</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>/sitemap.xml</div>
                </div>
                <div style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                  background: 'rgba(34,197,94,0.12)', color: '#22c55e',
                }}>
                  Activo
                </div>
              </a>

              {/* robots.txt */}
              <a
                href="/robots.txt"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                  borderRadius: 10, border: '1px solid var(--border)', textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#22c55e'; e.currentTarget.style.background = 'rgba(34,197,94,0.04)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: 'rgba(34,197,94,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)' }}>robots.txt</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>/robots.txt</div>
                </div>
                <div style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                  background: 'rgba(34,197,94,0.12)', color: '#22c55e',
                }}>
                  Activo
                </div>
              </a>
            </div>
          </Card>

          {/* SEO Score */}
          <SeoScore checks={checks} onToggle={toggleCheck} />
        </div>
      </div>
    </div>
  );
}
