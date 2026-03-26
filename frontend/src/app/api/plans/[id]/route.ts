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

function transformPlan(row: Record<string, unknown>): Record<string, unknown> {
  const items = row.plan_items as Record<string, unknown>[] | null;

  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    planDate: row.plan_date,
    status: row.status,
    shareCode: row.share_code,
    totalCost: row.total_cost,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: items ? items.map(transformPlanItem) : [],
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const shareCode = searchParams.get('share_code');

    // If accessing via share_code, allow public access
    if (shareCode) {
      const { data, error } = await supabase
        .from('plans')
        .select('*, plan_items(*, events(*, cities(*), categories(*)))')
        .eq('id', id)
        .eq('share_code', shareCode)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { message: 'Plan not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(transformPlan(data));
    }

    // Otherwise require auth
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is owner
    const { data: plan, error } = await supabase
      .from('plans')
      .select('*, plan_items(*, events(*, cities(*), categories(*)))')
      .eq('id', id)
      .single();

    if (error || !plan) {
      return NextResponse.json(
        { message: 'Plan not found' },
        { status: 404 }
      );
    }

    // Allow if owner
    if (plan.user_id === user.id) {
      return NextResponse.json(transformPlan(plan));
    }

    // Allow if invited and accepted
    const { data: invitation } = await supabase
      .from('plan_invitations')
      .select('id')
      .eq('plan_id', id)
      .eq('invitee_id', user.id)
      .eq('status', 'ACCEPTED')
      .single();

    if (invitation) {
      return NextResponse.json(transformPlan(plan));
    }

    return NextResponse.json(
      { message: 'Forbidden' },
      { status: 403 }
    );
  } catch (error) {
    console.error('Get plan error:', error);
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
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verify ownership
    const { data: existing } = await supabase
      .from('plans')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const updateData: Record<string, unknown> = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.planDate !== undefined) updateData.plan_date = body.planDate;
    if (body.status !== undefined) updateData.status = body.status;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('plans')
      .update(updateData)
      .eq('id', id)
      .select('*, plan_items(*, events(*, cities(*), categories(*)))')
      .single();

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(transformPlan(data));
  } catch (error) {
    console.error('Update plan error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Verify ownership
    const { data: existing } = await supabase
      .from('plans')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('plans')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Delete plan error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
