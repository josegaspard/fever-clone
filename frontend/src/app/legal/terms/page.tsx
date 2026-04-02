import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terminos y Condiciones',
  description: 'Terminos y condiciones de uso de la plataforma CTXplorer.',
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <nav className="mb-8">
        <ol className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <li><Link href="/" className="hover:opacity-80">Inicio</Link></li>
          <li>/</li>
          <li style={{ color: 'var(--text-secondary)' }}>Terminos y Condiciones</li>
        </ol>
      </nav>

      <h1 className="text-3xl font-black mb-2" style={{ color: 'var(--fg)' }}>Terminos y Condiciones</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-tertiary)' }}>Ultima actualizacion: Marzo 2026</p>

      <div className="prose-sm space-y-6" style={{ color: 'var(--text-secondary)' }}>
        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--fg)' }}>1. Aceptacion de los Terminos</h2>
          <p>Al acceder y utilizar la plataforma CTXplorer ("el Servicio"), aceptas quedar vinculado por estos Terminos y Condiciones. Si no estas de acuerdo con alguna parte de estos terminos, no podras acceder al Servicio.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--fg)' }}>2. Descripcion del Servicio</h2>
          <p>CTXplorer es una plataforma de descubrimiento de eventos y experiencias que permite a los usuarios explorar, planificar y adquirir entradas para eventos en diversas ciudades. El servicio incluye:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Navegacion y busqueda de eventos por ciudad, categoria y fecha</li>
            <li>Creacion de itinerarios personalizados ("Days")</li>
            <li>Compra de entradas y generacion de tickets QR</li>
            <li>Sistema de resenas y valoraciones</li>
            <li>Herramientas para organizadores de eventos</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--fg)' }}>3. Registro de Cuenta</h2>
          <p>Para acceder a ciertas funcionalidades, deberas crear una cuenta proporcionando informacion veraz y actualizada. Eres responsable de mantener la confidencialidad de tu contrasena y de todas las actividades realizadas bajo tu cuenta.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--fg)' }}>4. Compras y Pagos</h2>
          <p>Todas las transacciones se procesan a traves de Stripe, nuestro procesador de pagos certificado PCI DSS. Los precios se muestran en la moneda local del evento. Las compras son definitivas salvo que el organizador establezca una politica de reembolso especifica.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--fg)' }}>5. Politica de Reembolsos</h2>
          <p>Cada evento puede tener su propia politica de reembolso establecida por el organizador. En caso de cancelacion del evento por parte del organizador, se procedera al reembolso completo del importe pagado.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--fg)' }}>6. Contenido del Usuario</h2>
          <p>Al publicar resenas, comentarios u otro contenido, otorgas a CTXplorer una licencia no exclusiva, mundial y libre de regalias para utilizar, mostrar y distribuir dicho contenido en relacion con el Servicio. Te comprometes a no publicar contenido ofensivo, falso o que infrinja derechos de terceros.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--fg)' }}>7. Propiedad Intelectual</h2>
          <p>Todo el contenido de la plataforma, incluyendo diseno, logos, textos y software, es propiedad de CTXplorer o sus licenciantes y esta protegido por las leyes de propiedad intelectual aplicables.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--fg)' }}>8. Limitacion de Responsabilidad</h2>
          <p>CTXplorer actua como intermediario entre organizadores y asistentes. No somos responsables de la calidad, seguridad o legalidad de los eventos publicados. Los organizadores son los unicos responsables del cumplimiento de sus eventos.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--fg)' }}>9. Modificaciones</h2>
          <p>Nos reservamos el derecho de modificar estos terminos en cualquier momento. Los cambios entraran en vigor a partir de su publicacion en la plataforma. El uso continuado del Servicio despues de dichos cambios constituye tu aceptacion de los nuevos terminos.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--fg)' }}>10. Contacto</h2>
          <p>Para cualquier consulta relacionada con estos terminos, puedes contactarnos a traves de la plataforma o al correo: <strong>legal@fever-clone.vercel.app</strong></p>
        </section>
      </div>
    </div>
  );
}
