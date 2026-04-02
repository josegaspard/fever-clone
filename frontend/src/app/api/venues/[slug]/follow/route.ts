import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth-helpers';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ following: false, notifications: false });
    }

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

    const { data: follow } = await supabase
      .from('venue_follows')
      .select('id, notifications')
      .eq('user_id', user.id)
      .eq('venue_id', venue.id)
      .single();

    return NextResponse.json({
      following: !!follow,
      notifications: follow?.notifications ?? false,
    });
  } catch (error) {
    console.error('Check follow error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { slug } = await params;

    // Get venue
    const { data: venue } = await supabase
      .from('venues')
      .select('id, follower_count')
      .eq('slug', slug)
      .single();

    if (!venue) {
      return NextResponse.json(
        { message: 'Venue no encontrado' },
        { status: 404 }
      );
    }

    // Check if already following
    const { data: existing } = await supabase
      .from('venue_follows')
      .select('id')
      .eq('user_id', user.id)
      .eq('venue_id', venue.id)
      .single();

    let following: boolean;
    let newCount: number;

    if (existing) {
      // Unfollow
      await supabase
        .from('venue_follows')
        .delete()
        .eq('user_id', user.id)
        .eq('venue_id', venue.id);

      newCount = Math.max(0, (venue.follower_count || 0) - 1);
      following = false;
    } else {
      // Follow
      await supabase
        .from('venue_follows')
        .insert({ user_id: user.id, venue_id: venue.id, notifications: true });

      newCount = (venue.follower_count || 0) + 1;
      following = true;
    }

    // Update follower count on venue
    await supabase
      .from('venues')
      .update({ follower_count: newCount })
      .eq('id', venue.id);

    return NextResponse.json({ following, followerCount: newCount });
  } catch (error) {
    console.error('Toggle follow error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
