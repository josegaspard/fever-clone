import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { supabase } from '@/lib/supabase';
import { sendPasswordResetEmail } from '@/lib/email';
import { rateLimit, rateLimitResponse, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  // Rate limit: 3 reset requests per minute per IP
  const ip = getClientIp(req);
  const rl = rateLimit(`forgot:${ip}`, { windowMs: 60_000, max: 3 });
  if (!rl.success) return rateLimitResponse();

  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'El email es obligatorio' },
        { status: 400 }
      );
    }

    // Always return success to avoid email enumeration
    const successResponse = NextResponse.json({
      success: true,
      message: 'Si el email existe, recibirás un enlace para restablecer tu contraseña',
    });

    // Check if user exists
    const { data: user } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (!user) {
      // Return success even if user doesn't exist (security best practice)
      return successResponse;
    }

    // Generate token and expiration (1 hour from now)
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    // Invalidate any existing unused tokens for this email
    await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('email', email)
      .eq('used', false);

    // Store the reset token
    const { error: insertError } = await supabase
      .from('password_reset_tokens')
      .insert({
        email,
        token,
        expires_at: expiresAt,
        used: false,
      });

    if (insertError) {
      console.error('Error storing reset token:', insertError);
      return NextResponse.json(
        { success: false, message: 'Error interno del servidor' },
        { status: 500 }
      );
    }

    // Build reset link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetLink = `${baseUrl}/auth/reset-password?token=${token}`;

    // Send reset email (falls back to console.log if no RESEND_API_KEY)
    await sendPasswordResetEmail(email, token);

    return successResponse;
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
