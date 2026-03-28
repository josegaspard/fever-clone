import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth-helpers';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (
      !user ||
      (user.userType !== 'SUPERADMIN' && (user.role || '').toUpperCase() !== 'ADMIN')
    ) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { role, userType } = body as { role?: string; userType?: string };

    const updates: Record<string, string> = {};
    if (role !== undefined) {
      updates.role = role;
    }
    if (userType !== undefined) {
      updates.user_type = userType;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { message: 'No fields to update' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select('id, email, name, role, user_type, avatar, onboarding_completed, company_name, created_at')
      .single();

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      userType: data.user_type || 'USER',
      avatar: data.avatar,
      onboardingCompleted: data.onboarding_completed ?? false,
      companyName: data.company_name,
      createdAt: data.created_at,
    });
  } catch (error) {
    console.error('Admin update user error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (
      !user ||
      (user.userType !== 'SUPERADMIN' && (user.role || '').toUpperCase() !== 'ADMIN')
    ) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Prevent self-deletion
    if (id === user.id) {
      return NextResponse.json(
        { message: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
