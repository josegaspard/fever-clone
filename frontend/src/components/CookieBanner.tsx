'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      // Show after a small delay so it doesn't block initial render
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem('cookie_consent', 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9999] p-4 animate-slide-up"
      style={{ background: 'var(--nav-bg)', backdropFilter: 'blur(20px)', borderTop: '1px solid var(--border)' }}
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium" style={{ color: 'var(--fg)' }}>
            🍪 Usamos cookies
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            Utilizamos cookies esenciales y analiticas para mejorar tu experiencia.{' '}
            <Link href="/legal/cookies" className="text-[#e63946] hover:underline">
              Mas informacion
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={decline}
            className="px-4 py-2 rounded-lg text-xs font-medium transition"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            Solo esenciales
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 rounded-lg text-xs font-medium bg-[#e63946] text-white hover:bg-[#d32836] transition"
          >
            Aceptar todas
          </button>
        </div>
      </div>
    </div>
  );
}
