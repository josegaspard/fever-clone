import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth-helpers';

function transformPlanItem(row: Record<string, unknown>): Record<string, unknown> {
  const event = row.events as Record<string, unknown> | null;
  const city = event?.cities as Record<string, unknown> | null;
  const category = event?.categories as Record<string, unknown> | null;

  return {
    id: row.id,
    planId: row.plan_id,
    eventId: row.event_id,
    startTime: row.start_time,
    endTime: row.end_time,
    sortOrder: row.sort_order,
    notes: row.notes,
    isPaid: row.is_paid,
    cost: row.cost,
    travelMode: row.travel_mode,
    travelDuration: row.travel_duration,
    travelDistance: row.travel_distance,
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
          lat: event.lat,
          lng: event.lng,
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('plan_items')
      .select('*, events(*, cities(*), categories(*))')
      .eq('plan_id', id)
      .order('sort_order', { ascending: true });

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }

    const items = (data || []).map(transformPlanItem);
    return NextResponse.json({ data: items });
  } catch (error) {
    console.error('Get plan items error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
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

    const { id: planId } = await params;

    // Verify ownership
    const { data: plan } = await supabase
      .from('plans')
      .select('user_id')
      .eq('id', planId)
      .single();

    if (!plan || plan.user_id !== user.id) {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { eventId, startTime, endTime, notes } = body;

    if (!eventId) {
      return NextResponse.json(
        { message: 'eventId is required' },
        { status: 400 }
      );
    }

    // Get event to determine price
    const { data: event } = await supabase
      .from('events')
      .select('id, price')
      .eq('id', eventId)
      .single();

    if (!event) {
      return NextResponse.json(
        { message: 'Event not found' },
        { status: 404 }
      );
    }

    const eventPrice = Number(event.price) || 0;
    const isFree = eventPrice === 0;

    // Get max sort_order for this plan
    const { data: existingItems } = await supabase
      .from('plan_items')
      .select('sort_order')
      .eq('plan_id', planId)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextSortOrder =
      existingItems && existingItems.length > 0
        ? (existingItems[0].sort_order as number) + 1
        : 0;

    // Insert plan item
    const { data: item, error } = await supabase
      .from('plan_items')
      .insert({
        plan_id: planId,
        event_id: eventId,
        start_time: startTime || null,
        end_time: endTime || null,
        sort_order: nextSortOrder,
        notes: notes || null,
        is_paid: isFree,
        cost: eventPrice,
      })
      .select('*, events(*, cities(*), categories(*))')
      .single();

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }

    // Update plan total_cost
    const { data: allItems } = await supabase
      .from('plan_items')
      .select('cost')
      .eq('plan_id', planId);

    const totalCost = (allItems || []).reduce(
      (sum, i) => sum + (Number(i.cost) || 0),
      0
    );

    await supabase
      .from('plans')
      .update({ total_cost: totalCost, updated_at: new Date().toISOString() })
      .eq('id', planId);

    // If free event, auto-create ticket
    if (isFree) {
      await supabase.from('tickets').insert({
        user_id: user.id,
        event_id: eventId,
        plan_item_id: item.id,
        qr_code: generateQRCode(eventId, user.id),
        status: 'ACTIVE',
      });
    }

    return NextResponse.json(transformPlanItem(item));
  } catch (error) {
    console.error('Add plan item error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
