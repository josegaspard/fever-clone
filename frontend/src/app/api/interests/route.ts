import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth-helpers';

// GET: fetch user's interests with category details
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { data } = await supabase
      .from('user_interests')
      .select('*, categories(id, name, slug, icon, color)')
      .eq('user_id', user.id)
      .order('score', { ascending: false });

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('Get interests error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST: add/update interests (from onboarding or profile)
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { categoryIds } = await req.json(); // array of category IDs

    if (!Array.isArray(categoryIds)) {
      return NextResponse.json({ message: 'categoryIds must be an array' }, { status: 400 });
    }

    // Upsert each interest
    for (const catId of categoryIds) {
      await supabase.from('user_interests').upsert({
        user_id: user.id,
        category_id: catId,
        interest_type: 'category',
        score: 1.0,
        source: 'manual',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,category_id,interest_type,interest_value' });
    }

    // Remove interests not in the list
    if (categoryIds.length > 0) {
      await supabase
        .from('user_interests')
        .delete()
        .eq('user_id', user.id)
        .eq('source', 'manual')
        .not('category_id', 'in', `(${categoryIds.join(',')})`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update interests error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
