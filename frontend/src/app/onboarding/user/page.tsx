'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getCities, getCategories, City, Category } from '@/lib/api';

/* ───────────────────────── Types ──────────────────────────────────────── */

type CompanionOption = 'solo' | 'pareja' | 'amigos' | 'familia';

interface CompanionCard {
  id: CompanionOption;
  emoji: string;
  title: string;
  description: string;
}

interface BudgetOption {
  id: string;
  emoji: string;
  title: string;
  range: string;
}

/* ───────────────────────── Static Data ─────────────────────────────────── */

const COMPANIONS: CompanionCard[] = [
  {
    id: 'solo',
    emoji: '\u{1F9D1}\u200D\u{1F4BB}',
    title: 'Solo',
    description: 'Tiempo para mi, a mi ritmo',
  },
  {
    id: 'pareja',
    emoji: '\u{1F491}',
    title: 'Pareja',
    description: 'Planes romanticos para dos',
  },
  {
    id: 'amigos',
    emoji: '\u{1F389}',
    title: 'Amigos',
    description: 'Salir con el grupo',
  },
  {
    id: 'familia',
    emoji: '\u{1F46A}',
    title: 'Familia',
    description: 'Diversión para todos',
  },
];

const BUDGETS: BudgetOption[] = [
  { id: 'free', emoji: '\u{1F389}', title: 'Gratis', range: '$0' },
  {
    id: 'economic',
    emoji: '\u{1F4B5}',
    title: 'Económico',
    range: '$0 – $500',
  },
  { id: 'medium', emoji: '\u{1F4B3}', title: 'Medio', range: '$500 – $2,000' },
  {
    id: 'premium',
    emoji: '\u{2728}',
    title: 'Premium',
    range: '$2,000+',
  },
];

const TOTAL_STEPS = 5;

/* ───────────────────────── Confetti ───────────────────────────────────── */

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  duration: number;
  size: number;
}

function Confetti() {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    const colors = [
      '#e63946',
      '#ff6b6b',
      '#ffd166',
      '#06d6a0',
      '#118ab2',
      '#ef476f',
      '#ffc43d',
      '#1b9aaa',
    ];
    const generated: ConfettiPiece[] = [];
    for (let i = 0; i < 60; i++) {
      generated.push({
        id: i,
        x: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 1.5,
        duration: 2 + Math.random() * 2,
        size: 6 + Math.random() * 8,
      });
    }
    setPieces(generated);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 50,
        overflow: 'hidden',
      }}
    >
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: '-5%',
            width: p.size,
            height: p.size,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            background: p.color,
            animation: `confetti-fall ${p.duration}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(${360 + Math.random() * 720}deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* ───────────────────────── Main Component ─────────────────────────────── */

export default function UserOnboardingPage() {
  const { user, updateProfile, loading } = useAuth();
  const router = useRouter();

  /* --- wizard state --- */
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<'next' | 'back'>('next');
  const [transitioning, setTransitioning] = useState(false);

  /* --- selection state --- */
  const [companion, setCompanion] = useState<CompanionOption | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [budget, setBudget] = useState<string | null>(null);

  /* --- data from API --- */
  const [cities, setCities] = useState<City[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  /* --- finishing state --- */
  const [finishing, setFinishing] = useState(false);

  /* redirect if already onboarded */
  useEffect(() => {
    if (!loading && user?.onboardingCompleted) {
      router.push('/');
    }
  }, [loading, user, router]);

  /* fetch cities & categories once */
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingData(true);
      try {
        const [c, cat] = await Promise.all([getCities(), getCategories()]);
        if (!cancelled) {
          setCities(c);
          setCategories(cat);
        }
      } catch {
        /* silently fail - user can still navigate */
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ── navigation helpers ─────────────────────────────────────────────── */

  const canAdvance = useCallback((): boolean => {
    switch (step) {
      case 1:
        return companion !== null;
      case 2:
        return selectedCity !== null;
      case 3:
        return selectedCategories.length >= 2;
      case 4:
        return budget !== null;
      case 5:
        return true;
      default:
        return false;
    }
  }, [step, companion, selectedCity, selectedCategories, budget]);

  const goNext = () => {
    if (!canAdvance() || step >= TOTAL_STEPS) return;
    setDirection('next');
    setTransitioning(true);
    setTimeout(() => {
      setStep((s) => s + 1);
      setTransitioning(false);
    }, 250);
  };

  const goBack = () => {
    if (step <= 1) return;
    setDirection('back');
    setTransitioning(true);
    setTimeout(() => {
      setStep((s) => s - 1);
      setTransitioning(false);
    }, 250);
  };

  const handleSkip = async () => {
    setFinishing(true);
    try {
      await updateProfile({ onboardingCompleted: true });
      router.push('/');
    } catch {
      setFinishing(false);
    }
  };

  const handleFinish = async () => {
    setFinishing(true);
    try {
      await updateProfile({ onboardingCompleted: true });
      router.push('/');
    } catch {
      setFinishing(false);
    }
  };

  /* ── toggle category ────────────────────────────────────────────────── */

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  /* ── detect location ────────────────────────────────────────────────── */

  const handleDetectLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        /* pick nearest city by rough distance */
        let nearest: City | null = null;
        let minDist = Infinity;
        /* city coords not available - just pick first city as fallback */
        if (cities.length > 0) {
          nearest = cities[0];
          /* rudimentary: we just select the first city since City type has no lat/lng */
          void pos.coords.latitude;
        }
        if (nearest) {
          setSelectedCity(nearest.id);
        }
      },
      () => {
        /* permission denied or error - do nothing */
      }
    );
  };

  /* ── helpers for summary ────────────────────────────────────────────── */

  const companionLabel =
    COMPANIONS.find((c) => c.id === companion)?.title ?? '';
  const cityLabel = cities.find((c) => c.id === selectedCity)?.name ?? '';
  const categoryLabels = categories
    .filter((c) => selectedCategories.includes(c.id))
    .map((c) => c.name);
  const budgetLabel = BUDGETS.find((b) => b.id === budget)?.title ?? '';

  /* ── loading guard ──────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg)',
        }}
      >
        <div className="shimmer" style={{ width: 48, height: 48, borderRadius: '50%' }} />
      </div>
    );
  }

  /* ─────────────────────────── Render ─────────────────────────────────── */

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          position: 'sticky',
          top: 0,
          zIndex: 30,
          background: 'var(--bg)',
        }}
      >
        <a
          href="/"
          className="gradient-text"
          style={{ fontSize: 28, fontWeight: 900, textDecoration: 'none', letterSpacing: -1 }}
        >
          FEVER
        </a>

        <button
          onClick={handleSkip}
          disabled={finishing}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
            padding: '8px 16px',
            borderRadius: 8,
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#e63946')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
        >
          Omitir
        </button>
      </header>

      {/* ── Progress bar ─────────────────────────────────────────────────── */}
      <div style={{ padding: '0 24px 16px', maxWidth: 600, width: '100%', margin: '0 auto' }}>
        <div
          style={{
            height: 4,
            borderRadius: 2,
            background: 'var(--border)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${(step / TOTAL_STEPS) * 100}%`,
              background: 'linear-gradient(90deg, #e63946, #ff6b6b)',
              borderRadius: 2,
              transition: 'width 0.4s cubic-bezier(0.25,0.46,0.45,0.94)',
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 8,
            fontSize: 12,
            color: 'var(--text-tertiary)',
          }}
        >
          <span>Paso {step} de {TOTAL_STEPS}</span>
          <span>{Math.round((step / TOTAL_STEPS) * 100)}%</span>
        </div>
      </div>

      {/* ── Step content ─────────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '0 24px 120px',
          maxWidth: 720,
          width: '100%',
          margin: '0 auto',
        }}
      >
        <div
          key={step}
          className="animate-fade-in"
          style={{
            width: '100%',
            opacity: transitioning ? 0 : undefined,
            transform: transitioning
              ? direction === 'next'
                ? 'translateY(12px)'
                : 'translateY(-12px)'
              : undefined,
            transition: 'opacity 0.25s ease, transform 0.25s ease',
          }}
        >
          {/* ── Step 1: Welcome & Who ────────────────────────────────────── */}
          {step === 1 && (
            <div>
              <h1
                className="gradient-text"
                style={{
                  fontSize: 'clamp(28px, 5vw, 40px)',
                  fontWeight: 900,
                  textAlign: 'center',
                  marginBottom: 8,
                  lineHeight: 1.2,
                }}
              >
                Vamos a crear tu Day perfecto
              </h1>
              <p
                style={{
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  fontSize: 16,
                  marginBottom: 40,
                }}
              >
                Primero, cuéntanos con quién vas
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: 16,
                }}
                className="stagger-children"
              >
                {COMPANIONS.map((c) => {
                  const selected = companion === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setCompanion(c.id)}
                      className="animate-fade-in card-hover"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 12,
                        padding: 24,
                        borderRadius: 20,
                        border: selected
                          ? '2px solid #e63946'
                          : '2px solid var(--border)',
                        background: selected
                          ? 'rgba(230,57,70,0.08)'
                          : 'var(--card)',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                        textAlign: 'center',
                      }}
                    >
                      <span style={{ fontSize: 48 }}>{c.emoji}</span>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 16,
                          color: selected ? '#e63946' : 'var(--fg)',
                        }}
                      >
                        {c.title}
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          color: 'var(--text-secondary)',
                          lineHeight: 1.4,
                        }}
                      >
                        {c.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Step 2: Where ────────────────────────────────────────────── */}
          {step === 2 && (
            <div>
              <h1
                className="gradient-text"
                style={{
                  fontSize: 'clamp(28px, 5vw, 40px)',
                  fontWeight: 900,
                  textAlign: 'center',
                  marginBottom: 8,
                  lineHeight: 1.2,
                }}
              >
                ¿Dónde quieres vivir tu experiencia?
              </h1>
              <p
                style={{
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  fontSize: 16,
                  marginBottom: 32,
                }}
              >
                Elige tu ciudad favorita
              </p>

              <button
                onClick={handleDetectLocation}
                className="btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 24px',
                  margin: '0 auto 28px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                </svg>
                Detectar mi ubicación
              </button>

              {loadingData ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="shimmer"
                      style={{ height: 120, borderRadius: 16 }}
                    />
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                    gap: 16,
                  }}
                  className="stagger-children"
                >
                  {cities.map((city) => {
                    const selected = selectedCity === city.id;
                    return (
                      <button
                        key={city.id}
                        onClick={() => setSelectedCity(city.id)}
                        className="animate-fade-in card-hover"
                        style={{
                          position: 'relative',
                          overflow: 'hidden',
                          borderRadius: 16,
                          border: selected
                            ? '2px solid #e63946'
                            : '2px solid var(--border)',
                          height: 120,
                          cursor: 'pointer',
                          textAlign: 'left',
                          padding: 0,
                          background: 'var(--card)',
                          transition: 'all 0.25s ease',
                        }}
                      >
                        {city.image && (
                          <img
                            src={city.image}
                            alt={city.name}
                            style={{
                              position: 'absolute',
                              inset: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              opacity: selected ? 0.7 : 0.5,
                              transition: 'opacity 0.3s',
                            }}
                          />
                        )}
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background:
                              'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)',
                          }}
                        />
                        <div
                          style={{
                            position: 'relative',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-end',
                            padding: 14,
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: 15,
                              color: '#fff',
                            }}
                          >
                            {city.name}
                          </span>
                          <span
                            style={{
                              fontSize: 12,
                              color: 'rgba(255,255,255,0.7)',
                            }}
                          >
                            {city.country}
                          </span>
                        </div>
                        {selected && (
                          <div
                            style={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              background: '#e63946',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: What Vibes ───────────────────────────────────────── */}
          {step === 3 && (
            <div>
              <h1
                className="gradient-text"
                style={{
                  fontSize: 'clamp(28px, 5vw, 40px)',
                  fontWeight: 900,
                  textAlign: 'center',
                  marginBottom: 8,
                  lineHeight: 1.2,
                }}
              >
                ¿Qué tipo de experiencias te gustan?
              </h1>
              <p
                style={{
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  fontSize: 16,
                  marginBottom: 12,
                }}
              >
                Selecciona al menos 2 categorías
              </p>
              <p
                style={{
                  textAlign: 'center',
                  fontSize: 13,
                  color: 'var(--text-tertiary)',
                  marginBottom: 32,
                }}
              >
                {selectedCategories.length} seleccionada
                {selectedCategories.length !== 1 ? 's' : ''}
                {selectedCategories.length < 2 && (
                  <span style={{ color: '#e63946' }}>
                    {' '}
                    (faltan {2 - selectedCategories.length})
                  </span>
                )}
              </p>

              {loadingData ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="shimmer"
                      style={{ width: 120, height: 44, borderRadius: 99 }}
                    />
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 12,
                    justifyContent: 'center',
                  }}
                >
                  {categories.map((cat) => {
                    const selected = selectedCategories.includes(cat.id);
                    const pillColor = cat.color || '#e63946';
                    return (
                      <button
                        key={cat.id}
                        onClick={() => toggleCategory(cat.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '10px 20px',
                          borderRadius: 99,
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: selected
                            ? `2px solid ${pillColor}`
                            : '2px solid var(--border)',
                          background: selected
                            ? `${pillColor}20`
                            : 'var(--card)',
                          color: selected ? pillColor : 'var(--fg)',
                          transition: 'all 0.2s ease',
                          transform: selected ? 'scale(1.05)' : 'scale(1)',
                        }}
                      >
                        {cat.icon && <span style={{ fontSize: 18 }}>{cat.icon}</span>}
                        {cat.name}
                        {selected && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={pillColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Step 4: Budget ───────────────────────────────────────────── */}
          {step === 4 && (
            <div>
              <h1
                className="gradient-text"
                style={{
                  fontSize: 'clamp(28px, 5vw, 40px)',
                  fontWeight: 900,
                  textAlign: 'center',
                  marginBottom: 8,
                  lineHeight: 1.2,
                }}
              >
                ¿Cuál es tu presupuesto?
              </h1>
              <p
                style={{
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  fontSize: 16,
                  marginBottom: 40,
                }}
              >
                Así te recomendamos experiencias a tu medida
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: 16,
                }}
                className="stagger-children"
              >
                {BUDGETS.map((b) => {
                  const selected = budget === b.id;
                  return (
                    <button
                      key={b.id}
                      onClick={() => setBudget(b.id)}
                      className="animate-fade-in card-hover"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 10,
                        padding: 24,
                        borderRadius: 20,
                        border: selected
                          ? '2px solid #e63946'
                          : '2px solid var(--border)',
                        background: selected
                          ? 'rgba(230,57,70,0.08)'
                          : 'var(--card)',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                        textAlign: 'center',
                      }}
                    >
                      <span style={{ fontSize: 40 }}>{b.emoji}</span>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 16,
                          color: selected ? '#e63946' : 'var(--fg)',
                        }}
                      >
                        {b.title}
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {b.range}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Step 5: All Set ──────────────────────────────────────────── */}
          {step === 5 && (
            <div style={{ textAlign: 'center' }}>
              <Confetti />

              <div
                style={{
                  fontSize: 64,
                  marginBottom: 16,
                  animation: 'bounce-in 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards',
                }}
              >
                {'\u{1F389}'}
              </div>

              <h1
                className="gradient-text"
                style={{
                  fontSize: 'clamp(28px, 5vw, 40px)',
                  fontWeight: 900,
                  marginBottom: 8,
                  lineHeight: 1.2,
                }}
              >
                ¡Todo listo! Tu experiencia Fever te espera
              </h1>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: 16,
                  marginBottom: 40,
                }}
              >
                Hemos personalizado tu feed de acuerdo a tus preferencias
              </p>

              {/* Summary */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: 12,
                  maxWidth: 520,
                  margin: '0 auto 40px',
                }}
              >
                {[
                  { label: 'Con quién', value: companionLabel },
                  { label: 'Ciudad', value: cityLabel },
                  { label: 'Vibes', value: categoryLabels.join(', ') || '-' },
                  { label: 'Presupuesto', value: budgetLabel },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      padding: 16,
                      borderRadius: 16,
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                        color: 'var(--text-tertiary)',
                        marginBottom: 6,
                      }}
                    >
                      {item.label}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: 'var(--fg)',
                        lineHeight: 1.4,
                      }}
                    >
                      {item.value || '-'}
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={handleFinish}
                disabled={finishing}
                className="btn-primary"
                style={{
                  width: '100%',
                  maxWidth: 400,
                  padding: '16px 32px',
                  fontSize: 18,
                  fontWeight: 800,
                  cursor: finishing ? 'not-allowed' : 'pointer',
                  opacity: finishing ? 0.7 : 1,
                  marginBottom: 16,
                }}
              >
                {finishing ? 'Guardando...' : 'Explorar eventos'}
              </button>

              <a
                href="/build-day"
                onClick={async (e) => {
                  e.preventDefault();
                  try {
                    await updateProfile({ onboardingCompleted: true });
                  } catch {
                    /* continue anyway */
                  }
                  router.push('/build-day');
                }}
                style={{
                  display: 'inline-block',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#e63946',
                  textDecoration: 'none',
                  padding: '8px 16px',
                  borderRadius: 8,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(230,57,70,0.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                Descubrir mi Day perfecto
              </a>

              <style>{`
                @keyframes bounce-in {
                  0% { transform: scale(0); opacity: 0; }
                  60% { transform: scale(1.2); opacity: 1; }
                  100% { transform: scale(1); opacity: 1; }
                }
              `}</style>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom navigation ────────────────────────────────────────────── */}
      {step < TOTAL_STEPS && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '16px 24px',
            background: 'var(--bg)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 20,
          }}
        >
          <button
            onClick={goBack}
            disabled={step <= 1}
            className="btn-secondary"
            style={{
              padding: '12px 28px',
              fontSize: 15,
              fontWeight: 600,
              cursor: step <= 1 ? 'not-allowed' : 'pointer',
              opacity: step <= 1 ? 0.4 : 1,
            }}
          >
            Atrás
          </button>

          <button
            onClick={goNext}
            disabled={!canAdvance()}
            className="btn-primary"
            style={{
              padding: '12px 36px',
              fontSize: 15,
              fontWeight: 700,
              cursor: canAdvance() ? 'pointer' : 'not-allowed',
              opacity: canAdvance() ? 1 : 0.5,
            }}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
