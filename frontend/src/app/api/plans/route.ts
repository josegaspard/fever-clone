import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth-helpers';

function generateShareCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

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
      .from('plans')
      .select('*, plan_items(*, events(*, cities(*), categories(*)))')
      .eq('user_id', user.id)
      .order('plan_date', { ascending: false });

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }

    const plans = (data || []).map(transformPlan);
    return NextResponse.json({ data: plans });
  } catch (error) {
    console.error('Get plans error:', error);
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
    const { title, description, planDate } = body;

    if (!title) {
      return NextResponse.json(
        { message: 'title is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('plans')
      .insert({
        user_id: user.id,
        title,
        description: description || null,
        plan_date: planDate || null,
        status: 'draft',
        share_code: generateShareCode(),
        total_cost: 0,
      })
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
    console.error('Create plan error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
