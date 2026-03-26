import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth-helpers';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { inviteId } = await params;
    const body = await req.json();
    const { status } = body;

    if (!status || !['ACCEPTED', 'DECLINED'].includes(status)) {
      return NextResponse.json(
        { message: 'status must be ACCEPTED or DECLINED' },
        { status: 400 }
      );
    }

    // Get the invitation
    const { data: invitation } = await supabase
      .from('plan_invitations')
      .select('*')
      .eq('id', inviteId)
      .single();

    if (!invitation) {
      return NextResponse.json(
        { message: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Verify invitee: match by invitee_id or by email
    if (invitation.invitee_id && invitation.invitee_id !== user.id) {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      );
    }

    if (!invitation.invitee_id && invitation.invitee_email !== user.email) {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from('plan_invitations')
      .update({
        status,
        invitee_id: user.id,
        responded_at: new Date().toISOString(),
      })
      .eq('id', inviteId)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: data.id,
      planId: data.plan_id,
      inviterId: data.inviter_id,
      inviteeEmail: data.invitee_email,
      inviteeId: data.invitee_id,
      status: data.status,
      createdAt: data.created_at,
      respondedAt: data.responded_at,
    });
  } catch (error) {
    console.error('Respond to invitation error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
