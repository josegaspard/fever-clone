import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth-helpers';

function transformInvitation(row: Record<string, unknown>): Record<string, unknown> {
  return {
    id: row.id,
    planId: row.plan_id,
    inviterId: row.inviter_id,
    inviteeEmail: row.invitee_email,
    inviteeId: row.invitee_id,
    status: row.status,
    createdAt: row.created_at,
    respondedAt: row.responded_at,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: planId } = await params;

    const { data, error } = await supabase
      .from('plan_invitations')
      .select('*')
      .eq('plan_id', planId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }

    const invitations = (data || []).map(transformInvitation);
    return NextResponse.json({ data: invitations });
  } catch (error) {
    console.error('Get invitations error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: planId } = await params;

    // Verify ownership
    const { data: plan } = await supabase
      .from('plans')
      .select('user_id')
      .eq('id', planId)
      .single();

    if (!plan || plan.user_id !== user.id) {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { message: 'email is required' },
        { status: 400 }
      );
    }

    // Look up invitee by email
    const { data: invitee } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    const insertData: Record<string, unknown> = {
      plan_id: planId,
      inviter_id: user.id,
      invitee_email: email,
      status: 'PENDING',
    };

    if (invitee) {
      insertData.invitee_id = invitee.id;
    }

    const { data, error } = await supabase
      .from('plan_invitations')
      .insert(insertData)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(transformInvitation(data));
  } catch (error) {
    console.error('Create invitation error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
