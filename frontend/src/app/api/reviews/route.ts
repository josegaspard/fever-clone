import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth-helpers';

function transformReview(row: Record<string, unknown>): Record<string, unknown> {
  const user = row.users as Record<string, unknown> | null;
  return {
    id: row.id,
    userId: row.user_id,
    eventId: row.event_id,
    rating: row.rating,
    comment: row.comment,
    media: Array.isArray(row.media) ? row.media : [],
    createdAt: row.created_at,
    user: user
      ? {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
        }
      : null,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json(
        { message: 'eventId is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('reviews')
      .select('*, users(id, name, avatar)')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }

    const reviews = (data || []).map(transformReview);
    return NextResponse.json({ data: reviews });
  } catch (error) {
    console.error('Get reviews error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { eventId, rating, comment } = body;

    if (!eventId || !rating) {
      return NextResponse.json(
        { message: 'eventId and rating are required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { message: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Insert the review
    const { media } = body;

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        user_id: user.id,
        event_id: eventId,
        rating: Number(rating),
        comment: comment || null,
        media: Array.isArray(media) ? media : [],
      })
      .select('*, users(id, name, avatar)')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { message: 'You have already reviewed this event' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }

    // Update event rating and review_count
    const { data: reviewStats } = await supabase
      .from('reviews')
      .select('rating')
      .eq('event_id', eventId);

    if (reviewStats && reviewStats.length > 0) {
      const avg =
        reviewStats.reduce((sum, r) => sum + (r.rating as number), 0) /
        reviewStats.length;

      await supabase
        .from('events')
        .update({
          rating: Math.round(avg * 100) / 100,
          review_count: reviewStats.length,
        })
        .eq('id', eventId);
    }

    return NextResponse.json(transformReview(data));
  } catch (error) {
    console.error('Create review error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
