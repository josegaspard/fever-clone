import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { signToken } from '@/lib/auth-helpers';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { credential } = await req.json();

    if (!credential) {
      return NextResponse.json({ message: 'Google credential required' }, { status: 400 });
    }

    // Decode Google JWT (base64url encoded payload)
    const parts = credential.split('.');
    if (parts.length !== 3) {
      return NextResponse.json({ message: 'Invalid credential format' }, { status: 400 });
    }

    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
    );

    const { email, name, picture, sub: googleId } = payload;

    if (!email) {
      return NextResponse.json({ message: 'Email not found in Google credential' }, { status: 400 });
    }

    // Check if user exists
    let { data: user } = await supabase
      .from('users')
      .select('id, email, name, role, avatar, created_at')
      .eq('email', email)
      .single();

    if (!user) {
      // Create new user with Google info
      const hashedPassword = await bcrypt.hash(`google_${googleId}_${Date.now()}`, 10);
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          email,
          name: name || email.split('@')[0],
          password: hashedPassword,
          role: 'USER',
          avatar: picture || `https://picsum.photos/seed/${googleId}/200/200`,
          google_id: googleId,
        })
        .select('id, email, name, role, avatar, created_at')
        .single();

      if (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
      }
      user = newUser;
    }

    const token = signToken(user!.id);

    return NextResponse.json({
      token,
      user: {
        id: user!.id,
        email: user!.email,
        name: user!.name,
        role: user!.role,
        avatar: user!.avatar,
        createdAt: user!.created_at,
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
