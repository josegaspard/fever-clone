import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Politica de Privacidad',
  description: 'Politica de privacidad y proteccion de datos de CTXplorer.',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <nav className="mb-8">
        <ol className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <li><Link href="/" className="hover:opacity-80">Inicio</Link></li>
          <li>/</li>
          <li style={{ color: 'var(--text-secondary)' }}>Politica de Privacidad</li>
        </ol>
      </nav>

      <h1 className="text-3xl font-black mb-2" style={{ color: 'var(--fg)' }}>Politica de Privacidad</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-tertiary)' }}>Ultima actualizacion: Marzo 2026</p>

      <div className="prose-sm space-y-6" style={{ color: 'var(--text-secondary)' }}>
        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--fg)' }}>1. Informacion que Recopilamos</h2>
          <p>Recopilamos la siguiente informacion cuando usas CTXplorer:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Datos de registro:</strong> nombre, correo electronico, contrasena (cifrada)</li>
            <li><strong>Datos de perfil:</strong> avatar, telefono, preferencias de ciudad</li>
            <li><strong>Datos de uso:</strong> eventos visitados, busquedas, favoritos, planes creados</li>
            <li><strong>Datos de pago:</strong> procesados directamente por Stripe (no almacenamos datos de tarjeta)</li>
            <li><strong>Datos de ubicacion:</strong> solo cuando autorizas explicitamente el acceso GPS</li>
            <li><strong>Datos del dispositivo:</strong> tipo de navegador, sistema operativo, direccion IP</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--fg)' }}>2. Como Usamos tu Informacion</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Proporcionar y mejorar el Servicio</li>
            <li>Procesar compras y generar tickets</li>
            <li>Personalizar recomendaciones de eventos</li>
            <li>Enviar notificaciones sobre tus compras y eventos</li>
            <li>Comunicaciones de marketing (con tu consentimiento)</li>
            <li>Prevenir fraude y mejorar la seguridad</li>
            <li>Cumplir con obligaciones legales</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--fg)' }}>3. Comparticion de Datos</h2>
          <p>No vendemos tu informacion personal. Compartimos datos limitados con:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Organizadores:</strong> nombre y email cuando compras un ticket de su evento</li>
            <li><strong>Stripe:</strong> para procesamiento de pagos</li>
            <li><strong>Supabase:</strong> almacenamiento seguro de datos</li>
            <li><strong>Vercel:</strong> hosting de la plataforma</li>
            <li><strong>Google:</strong> autenticacion OAuth (si eliges iniciar sesion con Google)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--fg)' }}>4. Seguridad</h2>
          <p>Implementamos medidas de seguridad estandar de la industria:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Contrasenas cifradas con bcrypt</li>
            <li>Comunicaciones HTTPS/TLS</li>
            <li>Tokens JWT con expiracion</li>
            <li>Headers de seguridad (CSP, HSTS, X-Frame-Options)</li>
            <li>Procesamiento de pagos PCI DSS a traves de Stripe</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--fg)' }}>5. Tus Derechos</h2>
          <p>Tienes derecho a:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Acceso:</strong> solicitar una copia de tus datos personales</li>
            <li><strong>Rectificacion:</strong> corregir datos inexactos</li>
            <li><strong>Eliminacion:</strong> solicitar la eliminacion de tu cuenta y datos</li>
            <li><strong>Portabilidad:</strong> recibir tus datos en formato estructurado</li>
            <li><strong>Oposicion:</strong> oponerte al tratamiento para fines de marketing</li>
          </ul>
          <p className="mt-2">Para ejercer estos derechos, contacta a: <strong>privacy@ctxplorer.com</strong></p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--fg)' }}>6. Cookies</h2>
          <p>Utilizamos cookies y tecnologias similares para:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Esenciales:</strong> autenticacion, preferencias de tema, sesion</li>
            <li><strong>Analiticas:</strong> entender como se usa la plataforma</li>
            <li><strong>Funcionales:</strong> recordar preferencias de ciudad y busqueda</li>
          </ul>
          <p className="mt-2">Puedes gestionar tus preferencias de cookies en cualquier momento.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--fg)' }}>7. Retencion de Datos</h2>
          <p>Conservamos tus datos mientras mantengas una cuenta activa. Tras la eliminacion de tu cuenta, tus datos seran eliminados en un plazo de 30 dias, excepto aquellos que debamos conservar por obligaciones legales o fiscales.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--fg)' }}>8. Contacto</h2>
          <p>Para consultas sobre privacidad: <strong>privacy@ctxplorer.com</strong></p>
        </section>
      </div>
    </div>
  );
}
