import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth-helpers';

function transformVenue(row: Record<string, unknown>): Record<string, unknown> {
  const city = row.cities as Record<string, unknown> | null;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    shortDescription: row.short_description,
    logo: row.logo,
    coverImage: row.cover_image,
    category: row.category,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    phone: row.phone,
    email: row.email,
    website: row.website,
    instagram: row.instagram,
    twitter: row.twitter,
    facebook: row.facebook,
    tiktok: row.tiktok,
    rating: row.rating,
    reviewCount: row.review_count,
    followerCount: row.follower_count,
    verified: row.verified,
    featured: row.featured,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
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
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const { data, error } = await supabase
      .from('venues')
      .select('*, cities(id, name, slug, image, country)')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { message: 'Venue no encontrado' },
        { status: 404 }
      );
    }

    // Get events count for this venue
    const { count: eventsCount } = await supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('venue_id', data.id)
      .eq('status', 'PUBLISHED');

    const venue = transformVenue(data as Record<string, unknown>);
    venue.eventsCount = eventsCount || 0;

    return NextResponse.json(venue);
  } catch (error) {
    console.error('Get venue error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role.toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    const body = await req.json();

    const updateFields: Record<string, unknown> = {};
    const fieldMap: Record<string, string> = {
      name: 'name',
      slug: 'slug',
      description: 'description',
      shortDescription: 'short_description',
      logo: 'logo',
      coverImage: 'cover_image',
      category: 'category',
      address: 'address',
      cityId: 'city_id',
      lat: 'lat',
      lng: 'lng',
      phone: 'phone',
      email: 'email',
      website: 'website',
      instagram: 'instagram',
      twitter: 'twitter',
      facebook: 'facebook',
      tiktok: 'tiktok',
      verified: 'verified',
      featured: 'featured',
      metaTitle: 'meta_title',
      metaDescription: 'meta_description',
    };

    for (const [camel, snake] of Object.entries(fieldMap)) {
      if (body[camel] !== undefined) {
        updateFields[snake] = body[camel];
      }
    }

    updateFields.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('venues')
      .update(updateFields)
      .eq('slug', slug)
      .select('*, cities(id, name, slug, image, country)')
      .single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(transformVenue(data as Record<string, unknown>));
  } catch (error) {
    console.error('Update venue error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role.toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;

    const { error } = await supabase
      .from('venues')
      .delete()
      .eq('slug', slug);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Venue eliminado' });
  } catch (error) {
    console.error('Delete venue error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
