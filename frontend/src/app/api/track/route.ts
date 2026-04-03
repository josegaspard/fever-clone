import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth-helpers';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req).catch(() => null);
    const body = await req.json();
    const { eventId, actionType, durationSeconds, metadata, sessionId } = body;

    if (!actionType) {
      return NextResponse.json({ message: 'actionType required' }, { status: 400 });
    }

    await supabase.from('user_behavior').insert({
      user_id: user?.id || null,
      session_id: sessionId || null,
      event_id: eventId ? Number(eventId) : null,
      action_type: actionType,
      duration_seconds: durationSeconds || null,
      metadata: metadata || {},
    });

    return NextResponse.json({ tracked: true });
  } catch {
    return NextResponse.json({ tracked: false }, { status: 200 });
  }
}
