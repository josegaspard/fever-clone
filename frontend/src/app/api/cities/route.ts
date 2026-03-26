import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: cities, error } = await supabase
      .from('cities')
      .select('id, name, slug, image, country')
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }

    // Get event counts per city
    const { data: counts } = await supabase
      .from('events')
      .select('city_id')
      .eq('status', 'published');

    const countMap: Record<string, number> = {};
    if (counts) {
      for (const row of counts) {
        const cid = row.city_id as string;
        countMap[cid] = (countMap[cid] || 0) + 1;
      }
    }

    const result = (cities || []).map((city) => ({
      id: city.id,
      name: city.name,
      slug: city.slug,
      image: city.image,
      country: city.country,
      eventCount: countMap[city.id] || 0,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Get cities error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
