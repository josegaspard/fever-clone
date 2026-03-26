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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: planId, itemId } = await params;

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
    const updateData: Record<string, unknown> = {};

    if (body.sortOrder !== undefined) updateData.sort_order = body.sortOrder;
    if (body.startTime !== undefined) updateData.start_time = body.startTime;
    if (body.endTime !== undefined) updateData.end_time = body.endTime;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.travelMode !== undefined) updateData.travel_mode = body.travelMode;
    if (body.travelDuration !== undefined) updateData.travel_duration = body.travelDuration;
    if (body.travelDistance !== undefined) updateData.travel_distance = body.travelDistance;

    const { data, error } = await supabase
      .from('plan_items')
      .update(updateData)
      .eq('id', itemId)
      .eq('plan_id', planId)
      .select('*, events(*, cities(*), categories(*))')
      .single();

    if (error || !data) {
      return NextResponse.json(
        { message: error?.message || 'Item not found' },
        { status: error ? 500 : 404 }
      );
    }

    return NextResponse.json(transformPlanItem(data));
  } catch (error) {
    console.error('Update plan item error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: planId, itemId } = await params;

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

    const { error } = await supabase
      .from('plan_items')
      .delete()
      .eq('id', itemId)
      .eq('plan_id', planId);

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }

    // Recalculate total_cost
    const { data: remainingItems } = await supabase
      .from('plan_items')
      .select('cost')
      .eq('plan_id', planId);

    const totalCost = (remainingItems || []).reduce(
      (sum, i) => sum + (Number(i.cost) || 0),
      0
    );

    await supabase
      .from('plans')
      .update({ total_cost: totalCost, updated_at: new Date().toISOString() })
      .eq('id', planId);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Delete plan item error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
