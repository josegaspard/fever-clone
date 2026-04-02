import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth-helpers';

function transformEvent(row: Record<string, unknown>): Record<string, unknown> {
  const city = row.cities as Record<string, unknown> | null;
  const category = row.categories as Record<string, unknown> | null;
  return {
    id: row.id, title: row.title, slug: row.slug, description: row.description,
    shortDescription: row.short_description, image: row.image, videoUrl: row.video_url,
    gallery: row.gallery, price: row.price, originalPrice: row.original_price,
    currency: row.currency, date: row.date, endDate: row.end_date, time: row.time,
    duration: row.duration, address: row.address, lat: row.lat, lng: row.lng,
    cityId: row.city_id, categoryId: row.category_id, organizerId: row.organizer_id,
    venueId: row.venue_id, status: row.status, featured: row.featured,
    capacity: row.capacity, soldCount: row.sold_count, rating: row.rating,
    reviewCount: row.review_count, metaTitle: row.meta_title,
    metaDescription: row.meta_description, createdAt: row.created_at,
    updatedAt: row.updated_at,
    city: city ? { id: city.id, name: city.name, slug: city.slug, country: city.country } : null,
    category: category ? { id: category.id, name: category.name, slug: category.slug, icon: category.icon } : null,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || (user.userType !== 'SUPERADMIN' && user.role.toUpperCase() !== 'ADMIN')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const { data, error } = await supabase
      .from('events')
      .select('*, cities(*), categories(*)')
      .eq('id', id)
      .single();
    if (error || !data) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    return NextResponse.json(transformEvent(data as Record<string, unknown>));
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || (user.userType !== 'SUPERADMIN' && user.role.toUpperCase() !== 'ADMIN')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const body = await req.json();

    const updateData: Record<string, unknown> = {};
    const fieldMap: Record<string, string> = {
      title: 'title', slug: 'slug', description: 'description',
      shortDescription: 'short_description', image: 'image', videoUrl: 'video_url',
      price: 'price', originalPrice: 'original_price', currency: 'currency',
      date: 'date', endDate: 'end_date', time: 'time', duration: 'duration',
      address: 'address', lat: 'lat', lng: 'lng', cityId: 'city_id',
      categoryId: 'category_id', venueId: 'venue_id', status: 'status',
      featured: 'featured', capacity: 'capacity', metaTitle: 'meta_title',
      metaDescription: 'meta_description',
    };

    for (const [camel, snake] of Object.entries(fieldMap)) {
      if (body[camel] !== undefined) {
        let val = body[camel];
        if (['price', 'originalPrice', 'capacity', 'cityId', 'categoryId', 'venueId'].includes(camel) && val !== null) {
          val = val === '' ? null : Number(val);
        }
        if (camel === 'status' && typeof val === 'string') val = val.toUpperCase();
        updateData[snake] = val;
      }
    }

    // Handle gallery as JSON array
    if (body.gallery !== undefined) {
      updateData.gallery = Array.isArray(body.gallery) ? body.gallery : [];
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', id)
      .select('*, cities(*), categories(*)')
      .single();

    if (error) return NextResponse.json({ message: error.message }, { status: 500 });
    return NextResponse.json(transformEvent(data as Record<string, unknown>));
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || (user.userType !== 'SUPERADMIN' && user.role.toUpperCase() !== 'ADMIN')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) return NextResponse.json({ message: error.message }, { status: 500 });
    return NextResponse.json({ message: 'Evento eliminado' });
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
