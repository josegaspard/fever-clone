import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, slug, icon, color')
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }

    // Get event counts per category
    const { data: counts } = await supabase
      .from('events')
      .select('category_id')
      .eq('status', 'PUBLISHED');

    const countMap: Record<string, number> = {};
    if (counts) {
      for (const row of counts) {
        const cid = row.category_id as string;
        countMap[cid] = (countMap[cid] || 0) + 1;
      }
    }

    const result = (categories || []).map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon,
      color: cat.color,
      eventCount: countMap[cat.id] || 0,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
