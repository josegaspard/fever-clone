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

    if (user.userType !== 'BUSINESS') {
      return NextResponse.json(
        { message: 'Only business users can access this resource' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Verify the event belongs to this business user
    const { data: existing, error: fetchError } = await supabase
      .from('events')
      .select('id, organizer_id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { message: 'Event not found' },
        { status: 404 }
      );
    }

    if (existing.organizer_id !== user.id) {
      return NextResponse.json(
        { message: 'You do not have permission to update this event' },
        { status: 403 }
      );
    }

    const body = await req.json();

    const updateData: Record<string, unknown> = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.shortDescription !== undefined) updateData.short_description = body.shortDescription;
    if (body.image !== undefined) updateData.image = body.image;
    if (body.videoUrl !== undefined) updateData.video_url = body.videoUrl;
    if (body.gallery !== undefined) updateData.gallery = body.gallery;
    if (body.price !== undefined) updateData.price = Number(body.price);
    if (body.originalPrice !== undefined) updateData.original_price = body.originalPrice ? Number(body.originalPrice) : null;
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.date !== undefined) updateData.date = body.date;
    if (body.endDate !== undefined) updateData.end_date = body.endDate;
    if (body.time !== undefined) updateData.time = body.time;
    if (body.duration !== undefined) updateData.duration = body.duration;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.lat !== undefined) updateData.lat = body.lat;
    if (body.lng !== undefined) updateData.lng = body.lng;
    if (body.cityId !== undefined) updateData.city_id = body.cityId;
    if (body.categoryId !== undefined) updateData.category_id = body.categoryId;
    if (body.status !== undefined) updateData.status = body.status.toUpperCase();
    if (body.featured !== undefined) updateData.featured = body.featured;
    if (body.capacity !== undefined) updateData.capacity = body.capacity ? Number(body.capacity) : null;
    if (body.refundPolicyId !== undefined) updateData.refund_policy_id = body.refundPolicyId;

    const { data, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', id)
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
    console.error('Business update event error:', error);
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

    if (user.userType !== 'BUSINESS') {
      return NextResponse.json(
        { message: 'Only business users can access this resource' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Verify the event belongs to this business user
    const { data: existing, error: fetchError } = await supabase
      .from('events')
      .select('id, organizer_id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { message: 'Event not found' },
        { status: 404 }
      );
    }

    if (existing.organizer_id !== user.id) {
      return NextResponse.json(
        { message: 'You do not have permission to delete this event' },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Business delete event error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
