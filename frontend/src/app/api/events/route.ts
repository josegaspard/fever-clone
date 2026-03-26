import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth-helpers';

// Haversine distance in km between two lat/lng points
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper to transform a DB event row (with joined city/category) to camelCase
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
    organizer: organizer
      ? { id: organizer.id, name: organizer.name }
      : null,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const citySlug = searchParams.get('city') || searchParams.get('citySlug');
    const categorySlug = searchParams.get('category') || searchParams.get('categorySlug');
    const search = searchParams.get('q') || searchParams.get('search');
    const featured = searchParams.get('featured');
    const status = (searchParams.get('status') || 'PUBLISHED').toUpperCase();
    const sortBy = searchParams.get('sortBy');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '24', 10);
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const date = searchParams.get('date');
    const rating = searchParams.get('rating');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('events')
      .select(
        '*, cities(*), categories(*)',
        { count: 'exact' }
      );

    // Filter by status
    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }

    // Filter by featured
    if (featured === 'true') {
      query = query.eq('featured', true);
    }

    // Filter by city slug
    if (citySlug) {
      const { data: cityData } = await supabase
        .from('cities')
        .select('id')
        .eq('slug', citySlug)
        .single();
      if (cityData) {
        query = query.eq('city_id', cityData.id);
      } else {
        // No matching city, return empty
        return NextResponse.json({
          data: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        });
      }
    }

    // Filter by category slug
    if (categorySlug) {
      const { data: catData } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .single();
      if (catData) {
        query = query.eq('category_id', catData.id);
      } else {
        return NextResponse.json({
          data: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        });
      }
    }

    // Search by title
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    // Price range
    if (minPrice) {
      query = query.gte('price', Number(minPrice));
    }
    if (maxPrice) {
      query = query.lte('price', Number(maxPrice));
    }

    // Date filter (legacy single date)
    if (date) {
      query = query.gte('date', date);
    }

    // Date range filter
    if (dateFrom) {
      query = query.gte('date', dateFrom);
    }
    if (dateTo) {
      query = query.lte('date', dateTo);
    }

    // Rating filter
    if (rating) {
      query = query.gte('rating', Number(rating));
    }

    // Sorting
    if (sortBy === 'price') {
      query = query.order('price', { ascending: true });
    } else if (sortBy === 'rating') {
      query = query.order('rating', { ascending: false, nullsFirst: false });
    } else if (sortBy === 'popularity') {
      query = query.order('sold_count', { ascending: false, nullsFirst: false });
    } else {
      query = query.order('date', { ascending: true });
    }

    // When using geo filter, fetch all matching rows first then filter in-memory
    const useGeoFilter = lat && lng && radius;

    if (!useGeoFilter) {
      // Pagination (only when not doing geo filter)
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }

    let filtered = data || [];

    // Location-based filter (Haversine)
    if (useGeoFilter) {
      const centerLat = Number(lat);
      const centerLng = Number(lng);
      const maxDistance = Number(radius);
      filtered = filtered.filter((row) => {
        const eLat = row.lat as number | null;
        const eLng = row.lng as number | null;
        if (eLat == null || eLng == null) return false;
        return haversineDistance(centerLat, centerLng, eLat, eLng) <= maxDistance;
      });
    }

    const total = useGeoFilter ? filtered.length : (count || 0);

    // Apply pagination for geo-filtered results
    if (useGeoFilter) {
      filtered = filtered.slice(offset, offset + limit);
    }

    const events = filtered.map(transformEvent);

    return NextResponse.json({
      data: events,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get events error:', error);
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
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();

    const insertData: Record<string, unknown> = {
      title: body.title,
      slug: body.slug,
      description: body.description,
      short_description: body.shortDescription,
      image: body.image,
      gallery: body.gallery,
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
      organizer_id: body.organizerId || user.id,
      status: body.status ? body.status.toUpperCase() : 'DRAFT',
      featured: body.featured || false,
      capacity: body.capacity ? Number(body.capacity) : null,
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
    console.error('Create event error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
