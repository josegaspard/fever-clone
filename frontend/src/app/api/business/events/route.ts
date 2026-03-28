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
    refundPolicyId: row.refund_policy_id,
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
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (user.userType !== 'BUSINESS') {
      return NextResponse.json(
        { message: 'Only business users can access this resource' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search') || searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    let query = supabase
      .from('events')
      .select('*, cities(*), categories(*)', { count: 'exact' })
      .eq('organizer_id', user.id);

    // Filter by status
    if (status) {
      query = query.eq('status', status.toUpperCase());
    }

    // Search by title
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    // Order and paginate
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }

    const total = count || 0;
    const events = (data || []).map(transformEvent);

    return NextResponse.json({
      data: events,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Business events list error:', error);
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

    if (user.userType !== 'BUSINESS') {
      return NextResponse.json(
        { message: 'Only business users can access this resource' },
        { status: 403 }
      );
    }

    const body = await req.json();

    const insertData: Record<string, unknown> = {
      title: body.title,
      slug: body.slug,
      description: body.description,
      short_description: body.shortDescription,
      image: body.image,
      video_url: body.videoUrl || null,
      gallery: body.gallery || null,
      price: body.price !== undefined ? Number(body.price) : 0,
      original_price: body.originalPrice ? Number(body.originalPrice) : null,
      currency: body.currency || 'EUR',
      date: body.date,
      end_date: body.endDate || null,
      time: body.time || null,
      duration: body.duration || null,
      address: body.address || null,
      lat: body.lat || null,
      lng: body.lng || null,
      city_id: body.cityId || null,
      category_id: body.categoryId || null,
      organizer_id: user.id,
      status: body.status ? body.status.toUpperCase() : 'DRAFT',
      featured: body.featured || false,
      capacity: body.capacity ? Number(body.capacity) : null,
      refund_policy_id: body.refundPolicyId || null,
    };

    const { data, error } = await supabase
      .from('events')
      .insert(insertData)
      .select('*, cities(*), categories(*)')
      .single();

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(transformEvent(data));
  } catch (error) {
    console.error('Business create event error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
