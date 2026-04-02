import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Politica de Cookies',
  description: 'Politica de cookies de la plataforma CTXplorer.',
};

export default function CookiesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <nav className="mb-8">
        <ol className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <li><Link href="/" className="hover:opacity-80">Inicio</Link></li>
          <li>/</li>
          <li style={{ color: 'var(--text-secondary)' }}>Politica de Cookies</li>
        </ol>
      </nav>

      <h1 className="text-3xl font-black mb-2" style={{ color: 'var(--fg)' }}>Politica de Cookies</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-tertiary)' }}>Ultima actualizacion: Marzo 2026</p>

      <div className="prose-sm space-y-6" style={{ color: 'var(--text-secondary)' }}>
        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--fg)' }}>Que son las Cookies</h2>
          <p>Las cookies son pequenos archivos de texto que se almacenan en tu dispositivo cuando visitas un sitio web. Nos ayudan a hacer que el sitio funcione correctamente, sea mas seguro, y nos permita entender como se utiliza.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--fg)' }}>Cookies que Utilizamos</h2>
          <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--surface-2)' }}>
                  <th className="text-left p-3 font-semibold" style={{ color: 'var(--fg)' }}>Cookie</th>
                  <th className="text-left p-3 font-semibold" style={{ color: 'var(--fg)' }}>Tipo</th>
                  <th className="text-left p-3 font-semibold" style={{ color: 'var(--fg)' }}>Proposito</th>
                  <th className="text-left p-3 font-semibold" style={{ color: 'var(--fg)' }}>Duracion</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'token', type: 'Esencial', purpose: 'Autenticacion de sesion', duration: '7 dias' },
                  { name: 'theme', type: 'Funcional', purpose: 'Preferencia de tema claro/oscuro', duration: 'Permanente' },
                  { name: 'cookie_consent', type: 'Esencial', purpose: 'Recordar preferencia de cookies', duration: '1 ano' },
                  { name: '_ga', type: 'Analitica', purpose: 'Google Analytics - identificar usuarios', duration: '2 anos' },
                  { name: '_gid', type: 'Analitica', purpose: 'Google Analytics - identificar sesion', duration: '24 horas' },
                ].map((c, i) => (
                  <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                    <td className="p-3"><code className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--surface-2)' }}>{c.name}</code></td>
                    <td className="p-3 text-xs">{c.type}</td>
                    <td className="p-3 text-xs">{c.purpose}</td>
                    <td className="p-3 text-xs">{c.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--fg)' }}>Como Gestionar las Cookies</h2>
          <p>Puedes controlar y eliminar cookies a traves de la configuracion de tu navegador. Ten en cuenta que deshabilitar cookies esenciales puede afectar el funcionamiento del sitio.</p>
          <p className="mt-2">Para mas informacion sobre como gestionar cookies en tu navegador:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Chrome: Configuracion → Privacidad y seguridad → Cookies</li>
            <li>Firefox: Opciones → Privacidad y seguridad</li>
            <li>Safari: Preferencias → Privacidad</li>
            <li>Edge: Configuracion → Cookies y permisos del sitio</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--fg)' }}>Contacto</h2>
          <p>Para consultas sobre cookies: <strong>privacy@fever-clone.vercel.app</strong></p>
        </section>
      </div>
    </div>
  );
}
