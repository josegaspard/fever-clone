'use client';

import { useEffect, useState, FormEvent } from 'react';

interface City {
  id: number;
  slug: string;
  name: string;
  country: string | null;
}

interface CerebroResult {
  ok?: boolean;
  url?: string;
  slug?: string;
  city?: string;
  date?: string;
  eventsCount?: number;
  tiktok?: { url?: string; author?: string; title?: string };
  wordCount?: number;
  action?: string;
  _model?: string;
  error?: string;
  dryRun?: boolean;
  title?: string;
  meta_title?: string;
  meta_description?: string;
}

function todayInTZ(tz: string): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = fmt.formatToParts(new Date());
  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  const d = parts.find((p) => p.type === 'day')?.value;
  return `${y}-${m}-${d}`;
}

export default function CerebroPage() {
  const [token, setToken] = useState('');
  const [tokenSaved, setTokenSaved] = useState(false);

  const [cities, setCities] = useState<City[]>([]);
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [citySlug, setCitySlug] = useState('cdmx');
  const [date, setDate] = useState(todayInTZ('America/Mexico_City'));
  const [captionOverride, setCaptionOverride] = useState('');
  const [dryRun, setDryRun] = useState(false);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CerebroResult | null>(null);
  const [recent, setRecent] = useState<CerebroResult[]>([]);

  useEffect(() => {
    const t = localStorage.getItem('ctx_cerebro_token') || '';
    if (t) {
      setToken(t);
      setTokenSaved(true);
    }
    fetch('/api/cities')
      .then((r) => r.json())
      .then((data: City[]) => setCities(data || []))
      .catch(() => {});
    const r = localStorage.getItem('ctx_cerebro_recent');
    if (r) {
      try {
        setRecent(JSON.parse(r));
      } catch {}
    }
  }, []);

  const saveToken = () => {
    localStorage.setItem('ctx_cerebro_token', token.trim());
    setTokenSaved(true);
  };

  const clearToken = () => {
    localStorage.removeItem('ctx_cerebro_token');
    setToken('');
    setTokenSaved(false);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!tiktokUrl.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/cerebro/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tiktokUrl: tiktokUrl.trim(),
          citySlug,
          date,
          captionOverride: captionOverride.trim() || undefined,
          dryRun,
        }),
      });
      const data: CerebroResult = await res.json();
      setResult(data);
      if (data.ok && !data.dryRun) {
        const next = [data, ...recent].slice(0, 10);
        setRecent(next);
        localStorage.setItem('ctx_cerebro_recent', JSON.stringify(next));
        setTiktokUrl('');
        setCaptionOverride('');
      }
    } catch (err) {
      setResult({ error: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  if (!tokenSaved) {
    return (
      <div style={{ maxWidth: 460, margin: '60px auto', padding: '0 20px', fontFamily: '-apple-system, Segoe UI, Roboto, sans-serif', color: '#111' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>Cerebro CTXplorer</h1>
        <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 24px' }}>
          Pega tu token de acceso para empezar a convertir TikToks en notas.
        </p>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="CEREBRO_TOKEN"
          style={{ width: '100%', padding: '12px 14px', fontSize: 15, border: '1px solid #e5e7eb', borderRadius: 10, marginBottom: 12 }}
        />
        <button
          onClick={saveToken}
          disabled={!token.trim()}
          style={{ width: '100%', padding: '12px', fontSize: 15, fontWeight: 700, background: token.trim() ? '#e63946' : '#d1d5db', color: '#fff', border: 0, borderRadius: 10, cursor: token.trim() ? 'pointer' : 'not-allowed' }}
        >
          Entrar
        </button>
        <p style={{ color: '#9ca3af', fontSize: 12, marginTop: 16 }}>
          El token se guarda solo en este dispositivo (localStorage).
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: '24px auto 60px', padding: '0 20px', fontFamily: '-apple-system, Segoe UI, Roboto, sans-serif', color: '#111' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>Cerebro CTXplorer</h1>
        <button onClick={clearToken} style={{ background: 'none', border: 0, color: '#9ca3af', fontSize: 12, cursor: 'pointer' }}>
          cerrar sesion
        </button>
      </div>
      <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 24px' }}>
        Pega una URL de TikTok + ciudad + fecha. La IA genera la nota usando los eventos reales registrados ese dia.
      </p>

      <form onSubmit={submit}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
          URL del TikTok
        </label>
        <input
          type="url"
          value={tiktokUrl}
          onChange={(e) => setTiktokUrl(e.target.value)}
          placeholder="https://www.tiktok.com/@usuario/video/123..."
          required
          style={{ width: '100%', padding: '12px 14px', fontSize: 15, border: '1px solid #e5e7eb', borderRadius: 10, marginBottom: 16 }}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
              Ciudad
            </label>
            <select
              value={citySlug}
              onChange={(e) => setCitySlug(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', fontSize: 15, border: '1px solid #e5e7eb', borderRadius: 10, background: '#fff' }}
            >
              {cities.length === 0 ? (
                <option value="cdmx">Ciudad de Mexico</option>
              ) : (
                cities.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))
              )}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
              Fecha
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', fontSize: 15, border: '1px solid #e5e7eb', borderRadius: 10 }}
            />
          </div>
        </div>

        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
          Caption / descripcion <span style={{ color: '#9ca3af', fontWeight: 400 }}>(opcional, si TikTok bloquea el scrape)</span>
        </label>
        <textarea
          value={captionOverride}
          onChange={(e) => setCaptionOverride(e.target.value)}
          placeholder="Lo que dice el TikTok en sus propias palabras..."
          rows={3}
          style={{ width: '100%', padding: '12px 14px', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 10, marginBottom: 16, fontFamily: 'inherit', resize: 'vertical' }}
        />

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: 13, color: '#374151', cursor: 'pointer' }}>
          <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />
          Solo previsualizar (no publicar)
        </label>

        <button
          type="submit"
          disabled={loading || !tiktokUrl.trim()}
          style={{
            width: '100%',
            padding: '14px',
            fontSize: 15,
            fontWeight: 800,
            background: loading || !tiktokUrl.trim() ? '#d1d5db' : '#e63946',
            color: '#fff',
            border: 0,
            borderRadius: 10,
            cursor: loading || !tiktokUrl.trim() ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
          }}
        >
          {loading ? 'Generando nota... (~30-60s)' : dryRun ? 'Previsualizar' : 'Generar y publicar'}
        </button>
      </form>

      {result && (
        <div
          style={{
            marginTop: 24,
            padding: 16,
            background: result.ok ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${result.ok ? '#a7f3d0' : '#fecaca'}`,
            borderRadius: 12,
          }}
        >
          {result.ok ? (
            <>
              <p style={{ margin: 0, fontWeight: 700, color: '#065f46' }}>
                {result.dryRun ? 'Preview OK' : 'Publicado'}
              </p>
              {result.title && (
                <p style={{ margin: '8px 0 4px', fontSize: 15, fontWeight: 700 }}>{result.title}</p>
              )}
              {result.meta_description && (
                <p style={{ margin: '0 0 8px', fontSize: 13, color: '#374151' }}>{result.meta_description}</p>
              )}
              <p style={{ margin: '8px 0 4px', fontSize: 13, color: '#374151' }}>
                <strong>Ciudad:</strong> {result.city} · <strong>Fecha:</strong> {result.date} · <strong>Eventos usados:</strong>{' '}
                {result.eventsCount} · <strong>Palabras:</strong> {result.wordCount}
              </p>
              {result.url && (
                <p style={{ margin: '8px 0 0' }}>
                  <a href={result.url} target="_blank" rel="noopener" style={{ color: '#0369a1', fontWeight: 700 }}>
                    Ver post publicado &rarr;
                  </a>
                </p>
              )}
              {result._model && (
                <p style={{ margin: '8px 0 0', fontSize: 11, color: '#6b7280' }}>
                  IA usada: {result._model}
                </p>
              )}
            </>
          ) : (
            <>
              <p style={{ margin: 0, fontWeight: 700, color: '#991b1b' }}>Error</p>
              <p style={{ margin: '8px 0 0', fontSize: 13, color: '#374151' }}>{result.error}</p>
            </>
          )}
        </div>
      )}

      {recent.length > 0 && (
        <div style={{ marginTop: 36 }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 12px' }}>
            Recientes (este dispositivo)
          </h2>
          {recent.map((r, i) => (
            <a
              key={i}
              href={r.url}
              target="_blank"
              rel="noopener"
              style={{ display: 'block', padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, marginBottom: 8, textDecoration: 'none', color: 'inherit' }}
            >
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>
                {r.city} · {r.date}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b7280' }}>
                {r.eventsCount} eventos · {r.wordCount} palabras · @{r.tiktok?.author || 'tiktok'}
              </p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
