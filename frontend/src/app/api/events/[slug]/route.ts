import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth-helpers';

function transformEvent(row: Record<string, unknown>): Record<string, unknown> {
  const city = row.cities as Record<string, unknown> | null;
  const category = row.categories as Record<string, unknown> | null;
  const organizer = row.organizer as Record<string, unknown> | null;

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    shortDescription: row.short_description,
    image: row.image,
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
    organizer: organizer
      ? { id: organizer.id, name: organizer.name }
      : null,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Try to find by slug first
    let query = supabase
      .from('events')
      .select('*, cities(*), categories(*), organizer:users!events_organizer_id_fkey(id, name)')
      .eq('slug', slug)
      .single();

    let { data, error } = await query;

    // If not found by slug, try by ID (for admin edit page)
    if (error || !data) {
      const idQuery = supabase
        .from('events')
        .select('*, cities(*), categories(*), organizer:users!events_organizer_id_fkey(id, name)')
        .eq('id', slug)
        .single();

      const result = await idQuery;
      data = result.data;
      error = result.error;
    }

    if (error || !data) {
      return NextResponse.json(
        { message: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(transformEvent(data));
  } catch (error) {
    console.error('Get event error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || (user.role || '').toUpperCase() !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { slug } = await params;
    const body = await req.json();

    const updateData: Record<string, unknown> = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.shortDescription !== undefined) updateData.short_description = body.shortDescription;
    if (body.image !== undefined) updateData.image = body.image;
    if (body.gallery !== undefined) updateData.gallery = body.gallery;
    if (body.price !== undefined) updateData.price = Number(body.price);
    if (body.originalPrice !== undefined) updateData.original_price = body.originalPrice ? Number(body.originalPrice) : null;
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.date !== undefined) updateData.date = body.date;
    if (body.endDate !== undefined) updateData.end_date = body.endDate || null;
    if (body.time !== undefined) updateData.time = body.time || null;
    if (body.duration !== undefined) updateData.duration = body.duration || null;
    if (body.address !== undefined) updateData.address = body.address || null;
    if (body.lat !== undefined) updateData.lat = body.lat;
    if (body.lng !== undefined) updateData.lng = body.lng;
    if (body.cityId !== undefined) updateData.city_id = body.cityId || null;
    if (body.categoryId !== undefined) updateData.category_id = body.categoryId || null;
    if (body.organizerId !== undefined) updateData.organizer_id = body.organizerId;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.featured !== undefined) updateData.featured = body.featured;
    if (body.capacity !== undefined) updateData.capacity = body.capacity ? Number(body.capacity) : null;

    updateData.updated_at = new Date().toISOString();

    // Try updating by slug first, then by ID
    let { data, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('slug', slug)
      .select('*, cities(*), categories(*)')
      .single();

    if (error || !data) {
      const result = await supabase
        .from('events')
        .update(updateData)
        .eq('id', slug)
        .select('*, cities(*), categories(*)')
        .single();
      data = result.data;
      error = result.error;
    }

    if (error || !data) {
      return NextResponse.json(
        { message: error?.message || 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(transformEvent(data));
  } catch (error) {
    console.error('Update event error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || (user.role || '').toUpperCase() !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { slug } = await params;

    // Try deleting by slug first, then by ID
    let { error, count } = await supabase
      .from('events')
      .delete()
      .eq('slug', slug);

    if (error || count === 0) {
      const result = await supabase
        .from('events')
        .delete()
        .eq('id', slug);
      error = result.error;
    }

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Delete event error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
