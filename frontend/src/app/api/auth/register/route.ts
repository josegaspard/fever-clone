import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabase';
import { signToken } from '@/lib/auth-helpers';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, userType, companyName } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    const validUserTypes = ['USER', 'BUSINESS'];
    const finalUserType = validUserTypes.includes(userType) ? userType : 'USER';

    // Check if user already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Email already registered' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        name,
        email,
        password: hashedPassword,
        role: 'user',
        user_type: finalUserType,
        onboarding_completed: false,
        company_name: finalUserType === 'BUSINESS' ? companyName || null : null,
      })
      .select('id, email, name, role, avatar, user_type, onboarding_completed, company_name, created_at')
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    const token = signToken(user.id);

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        userType: user.user_type || 'USER',
        onboardingCompleted: user.onboarding_completed ?? false,
        companyName: user.company_name,
        avatar: user.avatar,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
