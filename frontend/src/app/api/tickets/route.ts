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

function generateQRCode(eventId: string, userId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `FEVER-${eventId}-${userId}-${timestamp}-${random}`;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('tickets')
      .select('*, events(*, cities(*), categories(*))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }

    const tickets = (data || []).map(transformTicket);
    return NextResponse.json({ data: tickets });
  } catch (error) {
    console.error('Get tickets error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { eventId, planItemId } = body;

    if (!eventId) {
      return NextResponse.json(
        { message: 'eventId is required' },
        { status: 400 }
      );
    }

    const qrCode = generateQRCode(eventId, user.id);

    const insertData: Record<string, unknown> = {
      user_id: user.id,
      event_id: eventId,
      qr_code: qrCode,
      status: 'ACTIVE',
    };

    if (planItemId) {
      insertData.plan_item_id = planItemId;

      // Mark the plan item as paid
      await supabase
        .from('plan_items')
        .update({ is_paid: true })
        .eq('id', planItemId);
    }

    const { data, error } = await supabase
      .from('tickets')
      .insert(insertData)
      .select('*, events(*, cities(*), categories(*))')
      .single();

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(transformTicket(data));
  } catch (error) {
    console.error('Create ticket error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
