import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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
    venueId: row.venue_id,
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Get venue id from slug
    const { data: venue } = await supabase
      .from('venues')
      .select('id')
      .eq('slug', slug)
      .single();

    if (!venue) {
      return NextResponse.json(
        { message: 'Venue no encontrado' },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from('events')
      .select('*, cities(id, name, slug, image, country), categories(id, name, slug, icon, color)')
      .eq('venue_id', venue.id)
      .eq('status', 'PUBLISHED')
      .order('date', { ascending: true });

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    const events = (data || []).map((row) =>
      transformEvent(row as Record<string, unknown>)
    );

    return NextResponse.json(events);
  } catch (error) {
    console.error('Get venue events error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
