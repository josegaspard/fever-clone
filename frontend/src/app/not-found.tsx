import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-8xl font-black mb-4 gradient-text">404</p>
        <h1 className="text-2xl font-black mb-2" style={{ color: 'var(--fg)' }}>Pagina no encontrada</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
          La pagina que buscas no existe o fue movida. Explora nuestros eventos o vuelve al inicio.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/" className="btn-primary px-6 py-2.5 text-sm">
            Ir al inicio
          </Link>
          <Link
            href="/search"
            className="px-6 py-2.5 text-sm font-medium rounded-xl border transition"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            Explorar eventos
          </Link>
        </div>
      </div>
    </div>
  );
}
