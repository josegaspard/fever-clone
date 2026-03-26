import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const { data: city, error } = await supabase
      .from('cities')
      .select('id, name, slug, image, country')
      .eq('slug', slug)
      .single();

    if (error || !city) {
      return NextResponse.json(
        { message: 'City not found' },
        { status: 404 }
      );
    }

    // Get event count for this city
    const { count } = await supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('city_id', city.id)
      .eq('status', 'PUBLISHED');

    return NextResponse.json({
      id: city.id,
      name: city.name,
      slug: city.slug,
      image: city.image,
      country: city.country,
      eventCount: count || 0,
    });
  } catch (error) {
    console.error('Get city error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
