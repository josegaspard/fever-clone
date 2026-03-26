import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth-helpers';

function transformTicket(row: Record<string, unknown>): Record<string, unknown> {
  const event = row.events as Record<string, unknown> | null;
  const city = event?.cities as Record<string, unknown> | null;
  const category = event?.categories as Record<string, unknown> | null;

  return {
    id: row.id,
    userId: row.user_id,
    eventId: row.event_id,
    planItemId: row.plan_item_id,
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
          price: event.price,
          date: event.date,
          time: event.time,
          address: event.address,
          city: city
            ? { id: city.id, name: city.name, slug: city.slug }
            : null,
          category: category
            ? { id: category.id, name: category.name, slug: category.slug, icon: category.icon, color: category.color }
            : null,
        }
      : null,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const { data, error } = await supabase
      .from('tickets')
      .select('*, events(*, cities(*), categories(*))')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { message: 'Ticket not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(transformTicket(data));
  } catch (error) {
    console.error('Get ticket error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('tickets')
      .update({
        status: 'USED',
        scanned_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('status', 'ACTIVE')
      .select('*, events(*, cities(*), categories(*))')
      .single();

    if (error || !data) {
      return NextResponse.json(
        { message: 'Ticket not found or already used' },
        { status: 404 }
      );
    }

    return NextResponse.json(transformTicket(data));
  } catch (error) {
    console.error('Scan ticket error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
