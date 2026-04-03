import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth-helpers';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    const city = req.nextUrl.searchParams.get('city') || '';
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '12');
    const exclude = req.nextUrl.searchParams.get('exclude') || ''; // comma-separated event IDs

    let categoryIds: number[] = [];

    if (user) {
      // Get user's top interests
      const { data: interests } = await supabase
        .from('user_interests')
        .select('category_id, score')
        .eq('user_id', user.id)
        .order('score', { ascending: false })
        .limit(5);

      categoryIds = (interests || [])
        .filter(i => i.category_id)
        .map(i => i.category_id as number);
    }

    // Build query
    let query = supabase
      .from('events')
      .select('*, cities(*), categories(*)')
      .eq('status', 'PUBLISHED')
      .order('date', { ascending: true })
      .limit(limit);

    if (city) {
      const { data: cityData } = await supabase.from('cities').select('id').eq('slug', city).single();
      if (cityData) query = query.eq('city_id', cityData.id);
    }

    // Exclude already-purchased events
    if (exclude) {
      const ids = exclude.split(',').map(Number).filter(n => !isNaN(n));
      if (ids.length > 0) query = query.not('id', 'in', `(${ids.join(',')})`);
    }

    const { data } = await query;
    let events = data || [];

    // Sort by relevance: events matching user interests come first
    if (categoryIds.length > 0) {
      events.sort((a, b) => {
        const aMatch = categoryIds.indexOf(a.category_id) !== -1 ? 0 : 1;
        const bMatch = categoryIds.indexOf(b.category_id) !== -1 ? 0 : 1;
        if (aMatch !== bMatch) return aMatch - bMatch;
        // Within matches, sort by interest score (higher category_id index = less relevant)
        const aScore = categoryIds.indexOf(a.category_id);
        const bScore = categoryIds.indexOf(b.category_id);
        return aScore - bScore;
      });
    }

    // Transform
    const transformed = events.map(row => {
      const cityObj = row.cities as Record<string, unknown> | null;
      const cat = row.categories as Record<string, unknown> | null;
      return {
        id: String(row.id),
        title: row.title,
        slug: row.slug,
        description: row.description || '',
        image: row.image,
        price: row.price,
        originalPrice: row.original_price,
        date: row.date,
        time: row.time,
        duration: row.duration,
        address: row.address,
        lat: row.lat,
        lng: row.lng,
        currency: row.currency,
        videoUrl: row.video_url,
        status: row.status,
        featured: row.featured,
        capacity: row.capacity,
        soldCount: row.sold_count,
        rating: row.rating,
        reviewCount: row.review_count,
        city: cityObj ? { id: String(cityObj.id), name: cityObj.name, slug: cityObj.slug, country: cityObj.country } : null,
        category: cat ? { id: String(cat.id), name: cat.name, slug: cat.slug, icon: cat.icon, color: cat.color } : null,
      };
    });

    return NextResponse.json({
      data: transformed,
      personalized: categoryIds.length > 0,
      interestCategories: categoryIds,
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
