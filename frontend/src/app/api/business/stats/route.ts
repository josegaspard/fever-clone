import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth-helpers';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (user.userType !== 'BUSINESS') {
      return NextResponse.json(
        { message: 'Only business users can access this resource' },
        { status: 403 }
      );
    }

    // Total events count
    const { count: totalEvents, error: eventsError } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('organizer_id', user.id);

    if (eventsError) {
      return NextResponse.json(
        { message: eventsError.message },
        { status: 500 }
      );
    }

    // Get all event IDs for this business
    const { data: businessEvents, error: businessEventsError } = await supabase
      .from('events')
      .select('id, status')
      .eq('organizer_id', user.id);

    if (businessEventsError) {
      return NextResponse.json(
        { message: businessEventsError.message },
        { status: 500 }
      );
    }

    const eventIds = (businessEvents || []).map((e) => e.id);

    // Events by status
    const eventsByStatus: Record<string, number> = {};
    for (const event of businessEvents || []) {
      const status = event.status as string;
      eventsByStatus[status] = (eventsByStatus[status] || 0) + 1;
    }

    // Tickets stats and recent tickets (only if there are events)
    let totalTicketsSold = 0;
    let totalRevenue = 0;
    let recentTickets: Record<string, unknown>[] = [];

    if (eventIds.length > 0) {
      // Total tickets sold
      const { count: ticketsCount, error: ticketsCountError } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .in('event_id', eventIds);

      if (ticketsCountError) {
        return NextResponse.json(
          { message: ticketsCountError.message },
          { status: 500 }
        );
      }

      totalTicketsSold = ticketsCount || 0;

      // Total revenue
      const { data: revenueData, error: revenueError } = await supabase
        .from('tickets')
        .select('total_paid')
        .in('event_id', eventIds);

      if (revenueError) {
        return NextResponse.json(
          { message: revenueError.message },
          { status: 500 }
        );
      }

      totalRevenue = (revenueData || []).reduce(
        (sum, ticket) => sum + (Number(ticket.total_paid) || 0),
        0
      );

      // Recent tickets with event details
      const { data: recentTicketsData, error: recentTicketsError } = await supabase
        .from('tickets')
        .select('*, events(id, title, slug, date, image)')
        .in('event_id', eventIds)
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentTicketsError) {
        return NextResponse.json(
          { message: recentTicketsError.message },
          { status: 500 }
        );
      }

      recentTickets = (recentTicketsData || []).map((ticket) => {
        const event = ticket.events as Record<string, unknown> | null;
        return {
          id: ticket.id,
          eventId: ticket.event_id,
          userId: ticket.user_id,
          quantity: ticket.quantity,
          totalPaid: ticket.total_paid,
          status: ticket.status,
          createdAt: ticket.created_at,
          event: event
            ? {
                id: event.id,
                title: event.title,
                slug: event.slug,
                date: event.date,
                image: event.image,
              }
            : null,
        };
      });
    }

    return NextResponse.json({
      totalEvents: totalEvents || 0,
      totalTicketsSold,
      totalRevenue,
      eventsByStatus,
      recentTickets,
    });
  } catch (error) {
    console.error('Business stats error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
