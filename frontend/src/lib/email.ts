// Email service abstraction
// Supports Resend (recommended) or falls back to console.log
// Set RESEND_API_KEY in .env.local to enable real emails

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL = process.env.EMAIL_FROM || 'CTXplorer <noreply@fever-clone.vercel.app>';
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://fever-clone.vercel.app';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.log(`[EMAIL] To: ${to} | Subject: ${subject}`);
    console.log(`[EMAIL] Body preview: ${html.slice(0, 200)}...`);
    return true;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('[EMAIL] Failed:', err);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[EMAIL] Error:', err);
    return false;
  }
}

// ── Email Templates ──

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:system-ui,-apple-system,sans-serif">
  <div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
    <div style="background:#e63946;padding:24px 32px">
      <h1 style="color:white;font-size:24px;font-weight:900;margin:0;letter-spacing:-0.5px">CTXPLORER</h1>
    </div>
    <div style="padding:32px">
      ${content}
    </div>
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center">
      <p style="color:#9ca3af;font-size:12px;margin:0">&copy; ${new Date().getFullYear()} CTXplorer. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<boolean> {
  const resetUrl = `${BASE_URL}/auth/reset-password?token=${token}`;
  return sendEmail({
    to,
    subject: 'Restablecer tu contrasena - CTXplorer',
    html: baseTemplate(`
      <h2 style="color:#111;font-size:20px;font-weight:700;margin:0 0 8px">Restablecer contrasena</h2>
      <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px">Recibimos una solicitud para restablecer la contrasena de tu cuenta. Haz clic en el boton de abajo para crear una nueva contrasena.</p>
      <a href="${resetUrl}" style="display:inline-block;background:#e63946;color:white;font-weight:700;font-size:14px;padding:12px 32px;border-radius:8px;text-decoration:none">Restablecer contrasena</a>
      <p style="color:#9ca3af;font-size:12px;margin:24px 0 0">Este enlace expira en 1 hora. Si no solicitaste este cambio, ignora este email.</p>
    `),
  });
}

export async function sendWelcomeEmail(to: string, name: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: `Bienvenido a CTXplorer, ${name}!`,
    html: baseTemplate(`
      <h2 style="color:#111;font-size:20px;font-weight:700;margin:0 0 8px">Bienvenido a CTXplorer!</h2>
      <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 16px">Hola <strong>${name}</strong>, tu cuenta ha sido creada exitosamente.</p>
      <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px">Ahora puedes explorar miles de eventos, crear tu Day perfecto y comprar entradas con un solo clic.</p>
      <a href="${BASE_URL}/search" style="display:inline-block;background:#e63946;color:white;font-weight:700;font-size:14px;padding:12px 32px;border-radius:8px;text-decoration:none">Explorar eventos</a>
    `),
  });
}

export async function sendTicketConfirmationEmail(
  to: string,
  name: string,
  eventTitle: string,
  eventDate: string,
  qrCode: string,
  ticketId: string
): Promise<boolean> {
  return sendEmail({
    to,
    subject: `Tu entrada para ${eventTitle} - CTXplorer`,
    html: baseTemplate(`
      <h2 style="color:#111;font-size:20px;font-weight:700;margin:0 0 8px">Entrada confirmada!</h2>
      <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px">Hola <strong>${name}</strong>, tu entrada ha sido confirmada.</p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin:0 0 24px">
        <p style="color:#111;font-size:16px;font-weight:700;margin:0 0 8px">${eventTitle}</p>
        <p style="color:#6b7280;font-size:13px;margin:0 0 4px">Fecha: ${eventDate}</p>
        <p style="color:#6b7280;font-size:13px;margin:0 0 4px">Ticket: #${ticketId.slice(0, 8)}</p>
        <p style="color:#6b7280;font-size:13px;margin:0">Codigo QR: <code style="background:#e5e7eb;padding:2px 6px;border-radius:4px;font-size:11px">${qrCode}</code></p>
      </div>
      <a href="${BASE_URL}/tickets" style="display:inline-block;background:#e63946;color:white;font-weight:700;font-size:14px;padding:12px 32px;border-radius:8px;text-decoration:none">Ver mis tickets</a>
      <p style="color:#9ca3af;font-size:12px;margin:24px 0 0">Presenta el codigo QR en la entrada del evento.</p>
    `),
  });
}

export async function sendEventReminderEmail(
  to: string,
  name: string,
  eventTitle: string,
  eventDate: string,
  eventAddress: string
): Promise<boolean> {
  return sendEmail({
    to,
    subject: `Recordatorio: ${eventTitle} es manana! - CTXplorer`,
    html: baseTemplate(`
      <h2 style="color:#111;font-size:20px;font-weight:700;margin:0 0 8px">Tu evento es manana!</h2>
      <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px">Hola <strong>${name}</strong>, te recordamos que manana tienes un evento.</p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin:0 0 24px">
        <p style="color:#111;font-size:16px;font-weight:700;margin:0 0 8px">${eventTitle}</p>
        <p style="color:#6b7280;font-size:13px;margin:0 0 4px">Fecha: ${eventDate}</p>
        ${eventAddress ? `<p style="color:#6b7280;font-size:13px;margin:0">Ubicacion: ${eventAddress}</p>` : ''}
      </div>
      <a href="${BASE_URL}/tickets" style="display:inline-block;background:#e63946;color:white;font-weight:700;font-size:14px;padding:12px 32px;border-radius:8px;text-decoration:none">Ver mi ticket</a>
    `),
  });
}
