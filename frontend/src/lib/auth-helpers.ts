import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { supabase } from './supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export function signToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch {
    return null;
  }
}

export async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  const decoded = verifyToken(token);
  if (!decoded) {
    return null;
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, name, role, avatar, user_type, onboarding_completed, company_name, company_description, company_logo, company_website, phone, created_at')
    .eq('id', decoded.userId)
    .single();

  if (error || !user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatar: user.avatar,
    userType: user.user_type || 'USER',
    onboardingCompleted: user.onboarding_completed ?? false,
    companyName: user.company_name,
    companyDescription: user.company_description,
    companyLogo: user.company_logo,
    companyWebsite: user.company_website,
    phone: user.phone,
    createdAt: user.created_at,
  };
}
