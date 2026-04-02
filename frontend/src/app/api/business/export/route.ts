import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth-helpers';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    if (user.userType !== 'BUSINESS') {
      return NextResponse.json(
        { message: 'Solo usuarios de negocio pueden exportar asistentes' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json(
        { message: 'eventId es requerido' },
        { status: 400 }
      );
    }

    // Verify the business user owns the event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title, organizer_id')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { message: 'Evento no encontrado' },
        { status: 404 }
      );
    }

    if (event.organizer_id !== user.id) {
      return NextResponse.json(
        { message: 'No tienes permiso para exportar asistentes de este evento' },
        { status: 403 }
      );
    }

    // Fetch all tickets for this event, joining with users
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('id, qr_code, status, created_at, users(name, email)')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (ticketsError) {
      return NextResponse.json(
        { message: ticketsError.message },
        { status: 500 }
      );
    }

    // Build CSV
    const rows: string[] = ['Nombre,Email,Ticket ID,QR Code,Estado,Fecha compra'];

    for (const ticket of tickets || []) {
      const ticketUser = ticket.users as unknown as Record<string, unknown> | null;
      const name = escapeCSV(String(ticketUser?.name || 'N/A'));
      const email = escapeCSV(String(ticketUser?.email || 'N/A'));
      const ticketId = escapeCSV(String(ticket.id));
      const qrCode = escapeCSV(String(ticket.qr_code));
      const status = mapStatus(String(ticket.status));
      const createdAt = formatDate(String(ticket.created_at));

      rows.push(`${name},${email},${ticketId},${qrCode},${status},${createdAt}`);
    }

    const csv = rows.join('\n');
    const safeTitle = (event.title || 'evento').replace(/[^a-zA-Z0-9_-]/g, '_');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="asistentes_${safeTitle}.csv"`,
      },
    });
  } catch (error) {
    console.error('Business export error:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function mapStatus(status: string): string {
  const upper = (status || '').toUpperCase();
  if (upper === 'ACTIVE') return 'Activo';
  if (upper === 'USED') return 'Utilizado';
  if (upper === 'CANCELLED') return 'Cancelado';
  return status;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}
