import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth-helpers';

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const q = searchParams.get('q') || '';
    const userTypeFilter = searchParams.get('userType') || '';

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build query for data
    let dataQuery = supabase
      .from('users')
      .select(
        'id, email, name, role, user_type, avatar, onboarding_completed, company_name, created_at'
      )
      .order('created_at', { ascending: false })
      .range(from, to);

    // Build query for count
    let countQuery = supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Apply search filter
    if (q) {
      const pattern = `%${q}%`;
      dataQuery = dataQuery.or(`name.ilike.${pattern},email.ilike.${pattern}`);
      countQuery = countQuery.or(`name.ilike.${pattern},email.ilike.${pattern}`);
    }

    // Apply userType filter
    if (userTypeFilter) {
      dataQuery = dataQuery.eq('user_type', userTypeFilter);
      countQuery = countQuery.eq('user_type', userTypeFilter);
    }

    const [dataResult, countResult] = await Promise.all([dataQuery, countQuery]);

    if (dataResult.error) {
      return NextResponse.json(
        { message: dataResult.error.message },
        { status: 500 }
      );
    }

    const total = countResult.count || 0;
    const totalPages = Math.ceil(total / limit);

    const data = (dataResult.data || []).map((u: Record<string, unknown>) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      userType: u.user_type || 'USER',
      avatar: u.avatar,
      onboardingCompleted: u.onboarding_completed ?? false,
      companyName: u.company_name,
      createdAt: u.created_at,
    }));

    return NextResponse.json({
      data,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error('Admin users list error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
