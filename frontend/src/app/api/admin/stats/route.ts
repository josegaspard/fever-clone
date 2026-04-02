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

    // Run all queries in parallel
    const [
      usersCount,
      eventsCount,
      ticketsCount,
      revenueResult,
      usersByTypeResult,
      eventsByStatusResult,
      recentUsersResult,
      recentEventsResult,
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('events').select('*', { count: 'exact', head: true }),
      supabase.from('tickets').select('*', { count: 'exact', head: true }),
      supabase.from('tickets').select('total_paid'),
      supabase.from('users').select('user_type'),
      supabase.from('events').select('status'),
      supabase
        .from('users')
        .select('id, name, email, user_type, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('events')
        .select('*, cities(*), categories(*)')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    // Calculate total revenue
    const totalRevenue = (revenueResult.data || []).reduce(
      (sum: number, ticket: Record<string, unknown>) =>
        sum + (Number(ticket.total_paid) || 0),
      0
    );

    // Group users by type
    const usersByTypeMap: Record<string, number> = {};
    for (const row of usersByTypeResult.data || []) {
      const type = (row as Record<string, unknown>).user_type as string || 'USER';
      usersByTypeMap[type] = (usersByTypeMap[type] || 0) + 1;
    }
    const usersByType = Object.entries(usersByTypeMap).map(([type, count]) => ({ type, count }));

    // Group events by status
    const eventsByStatusMap: Record<string, number> = {};
    for (const row of eventsByStatusResult.data || []) {
      const status = (row as Record<string, unknown>).status as string || 'unknown';
      eventsByStatusMap[status] = (eventsByStatusMap[status] || 0) + 1;
    }
    const eventsByStatus = Object.entries(eventsByStatusMap).map(([status, count]) => ({ status, count }));

    // Map recent users
    const recentUsers = (recentUsersResult.data || []).map(
      (u: Record<string, unknown>) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        userType: u.user_type || 'USER',
        createdAt: u.created_at,
      })
    );

    // Map recent events with city/category joins
    const recentEvents = (recentEventsResult.data || []).map(
      (e: Record<string, unknown>) => {
        const city = e.cities as Record<string, unknown> | null;
        const category = e.categories as Record<string, unknown> | null;
        return {
          id: e.id,
          title: e.title,
          slug: e.slug,
          image: e.image,
          price: e.price,
          date: e.date,
          status: e.status,
          featured: e.featured,
          capacity: e.capacity,
          soldCount: e.sold_count,
          createdAt: e.created_at,
          city: city
            ? { id: city.id, name: city.name, slug: city.slug }
            : null,
          category: category
            ? { id: category.id, name: category.name, slug: category.slug, icon: category.icon }
            : null,
        };
      }
    );

    return NextResponse.json({
      totalUsers: usersCount.count || 0,
      totalEvents: eventsCount.count || 0,
      totalTickets: ticketsCount.count || 0,
      totalRevenue,
      usersByType,
      eventsByStatus,
      recentUsers,
      recentEvents,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
