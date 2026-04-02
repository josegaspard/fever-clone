import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth-helpers';

function transformTicket(row: Record<string, unknown>): Record<string, unknown> {
  const event = row.events as Record<string, unknown> | null;
  const user = row.users as Record<string, unknown> | null;

  return {
    id: row.id,
    userId: row.user_id,
    eventId: row.event_id,
    qrCode: row.qr_code,
    status: row.status,
    scannedAt: row.scanned_at,
    createdAt: row.created_at,
    event: event
      ? {
          id: event.id,
          title: event.title,
          slug: event.slug,
          image: event.image,
          date: event.date,
          time: event.time,
        }
      : null,
    attendee: user
      ? {
          id: user.id,
          name: user.name,
          email: user.email,
        }
      : null,
  };
}

export async function PUT(req: NextRequest) {
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
        { message: 'Solo usuarios de negocio pueden escanear tickets' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { qrCode } = body;

    if (!qrCode || typeof qrCode !== 'string') {
      return NextResponse.json(
        { message: 'El codigo QR es requerido' },
        { status: 400 }
      );
    }

    // Find ticket by QR code
    const { data: ticket, error: findError } = await supabase
      .from('tickets')
      .select('*, events(*), users(*)')
      .eq('qr_code', qrCode.trim())
      .single();

    if (findError || !ticket) {
      return NextResponse.json(
        { message: 'Ticket no encontrado. Verifica el codigo QR.' },
        { status: 404 }
      );
    }

    // Verify the business user owns the event
    const event = ticket.events as Record<string, unknown> | null;
    if (!event || event.organizer_id !== user.id) {
      return NextResponse.json(
        { message: 'Este ticket no pertenece a uno de tus eventos' },
        { status: 403 }
      );
    }

    // Check if already used
    if ((ticket.status as string).toUpperCase() === 'USED') {
      return NextResponse.json(
        {
          message: 'Este ticket ya fue utilizado',
          ticket: transformTicket(ticket),
        },
        { status: 409 }
      );
    }

    // Check if cancelled
    if ((ticket.status as string).toUpperCase() === 'CANCELLED') {
      return NextResponse.json(
        { message: 'Este ticket esta cancelado' },
        { status: 410 }
      );
    }

    // Mark as scanned
    const { data: updated, error: updateError } = await supabase
      .from('tickets')
      .update({
        status: 'USED',
        scanned_at: new Date().toISOString(),
      })
      .eq('id', ticket.id)
      .eq('status', 'ACTIVE')
      .select('*, events(*), users(*)')
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { message: 'Error al escanear el ticket' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Ticket escaneado correctamente',
      ticket: transformTicket(updated),
    });
  } catch (error) {
    console.error('Business scan ticket error:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
