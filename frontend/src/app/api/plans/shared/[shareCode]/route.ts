import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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
  { params }: { params: Promise<{ shareCode: string }> }
) {
  try {
    const { shareCode } = await params;

    const { data, error } = await supabase
      .from('plans')
      .select('*, plan_items(*, events(*, cities(*), categories(*)))')
      .eq('share_code', shareCode)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { message: 'Plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(transformPlan(data));
  } catch (error) {
    console.error('Get shared plan error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
