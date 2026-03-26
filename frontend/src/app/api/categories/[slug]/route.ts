import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const { data: category, error } = await supabase
      .from('categories')
      .select('id, name, slug, icon, color')
      .eq('slug', slug)
      .single();

    if (error || !category) {
      return NextResponse.json(
        { message: 'Category not found' },
        { status: 404 }
      );
    }

    // Get event count for this category
    const { count } = await supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', category.id)
      .eq('status', 'published');

    return NextResponse.json({
      id: category.id,
      name: category.name,
      slug: category.slug,
      icon: category.icon,
      color: category.color,
      eventCount: count || 0,
    });
  } catch (error) {
    console.error('Get category error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
