'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: 'rgba(230,57,70,0.1)' }}>
          <svg className="w-8 h-8 text-[#e63946]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="text-2xl font-black mb-2" style={{ color: 'var(--fg)' }}>Algo salio mal</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="btn-primary px-6 py-2.5 text-sm"
          >
            Intentar de nuevo
          </button>
          <a
            href="/"
            className="px-6 py-2.5 text-sm font-medium rounded-xl border transition"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            Ir al inicio
          </a>
        </div>
        {error.digest && (
          <p className="text-[10px] mt-6" style={{ color: 'var(--text-tertiary)' }}>
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
