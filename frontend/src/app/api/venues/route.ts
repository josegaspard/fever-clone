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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city');
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');

    let query = supabase
      .from('venues')
      .select('*, cities(id, name, slug, image, country)')
      .order('featured', { ascending: false })
      .order('follower_count', { ascending: false });

    if (city) {
      const { data: cityRow } = await supabase
        .from('cities')
        .select('id')
        .eq('slug', city)
        .single();
      if (cityRow) {
        query = query.eq('city_id', cityRow.id);
      }
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (featured === 'true') {
      query = query.eq('featured', true);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    const venues = (data || []).map((row) =>
      transformVenue(row as Record<string, unknown>)
    );

    return NextResponse.json(venues);
  } catch (error) {
    console.error('Get venues error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role.toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      slug,
      name,
      description,
      shortDescription,
      logo,
      coverImage,
      category,
      address,
      cityId,
      lat,
      lng,
      phone,
      email,
      website,
      instagram,
      twitter,
      facebook,
      tiktok,
      metaTitle,
      metaDescription,
    } = body;

    if (!slug || !name) {
      return NextResponse.json(
        { message: 'slug y name son requeridos' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('venues')
      .insert({
        slug,
        name,
        description,
        short_description: shortDescription,
        logo,
        cover_image: coverImage,
        category: category || 'general',
        address,
        city_id: cityId || null,
        lat,
        lng,
        phone,
        email,
        website,
        instagram,
        twitter,
        facebook,
        tiktok,
        meta_title: metaTitle,
        meta_description: metaDescription,
      })
      .select('*, cities(id, name, slug, image, country)')
      .single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(
      transformVenue(data as Record<string, unknown>),
      { status: 201 }
    );
  } catch (error) {
    console.error('Create venue error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
