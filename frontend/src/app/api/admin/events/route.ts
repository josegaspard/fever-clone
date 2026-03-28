import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth-helpers';

function transformEvent(row: Record<string, unknown>): Record<string, unknown> {
  const city = row.cities as Record<string, unknown> | null;
  const category = row.categories as Record<string, unknown> | null;

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    shortDescription: row.short_description,
    image: row.image,
    videoUrl: row.video_url,
    gallery: row.gallery,
    price: row.price,
    originalPrice: row.original_price,
    currency: row.currency,
    date: row.date,
    endDate: row.end_date,
    time: row.time,
    duration: row.duration,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    cityId: row.city_id,
    categoryId: row.category_id,
    organizerId: row.organizer_id,
    status: row.status,
    featured: row.featured,
    capacity: row.capacity,
    soldCount: row.sold_count,
    rating: row.rating,
    reviewCount: row.review_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    city: city
      ? {
          id: city.id,
          name: city.name,
          slug: city.slug,
          image: city.image,
          country: city.country,
        }
      : null,
    category: category
      ? {
          id: category.id,
          name: category.name,
          slug: category.slug,
          icon: category.icon,
          color: category.color,
        }
      : null,
  };
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.userType !== 'SUPERADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)));
    const q = searchParams.get('q');

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('events')
      .select('*, cities(*), categories(*)', { count: 'exact' });

    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }

    if (q) {
      query = query.ilike('title', `%${q}%`);
    }

    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: (data || []).map(transformEvent),
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error('Admin events GET error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.userType !== 'SUPERADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { ids, status } = body as { ids: number[]; status: string };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { message: 'ids must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { message: 'status is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('events')
      .update({ status })
      .in('id', ids)
      .select();

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Updated ${data?.length ?? 0} event(s)`,
      updated: data?.length ?? 0,
    });
  } catch (error) {
    console.error('Admin events PUT error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
