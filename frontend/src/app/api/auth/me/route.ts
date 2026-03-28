import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-helpers';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Get me error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const allowedFields: Record<string, string> = {
      name: 'name',
      avatar: 'avatar',
      phone: 'phone',
      companyName: 'company_name',
      companyDescription: 'company_description',
      companyLogo: 'company_logo',
      companyWebsite: 'company_website',
      onboardingCompleted: 'onboarding_completed',
    };

    const updateData: Record<string, unknown> = {};
    for (const [camel, snake] of Object.entries(allowedFields)) {
      if (body[camel] !== undefined) {
        updateData[snake] = body[camel];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select('id, email, name, role, avatar, user_type, onboarding_completed, company_name, company_description, company_logo, company_website, phone, created_at')
      .single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      avatar: data.avatar,
      userType: data.user_type || 'USER',
      onboardingCompleted: data.onboarding_completed ?? false,
      companyName: data.company_name,
      companyDescription: data.company_description,
      companyLogo: data.company_logo,
      companyWebsite: data.company_website,
      phone: data.phone,
      createdAt: data.created_at,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
