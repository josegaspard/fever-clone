import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-helpers';
import { supabase } from '@/lib/supabase';

async function stripeRequest(endpoint: string, body: Record<string, string>) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');

  const res = await fetch(`https://api.stripe.com/v1${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(body).toString(),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `Stripe error ${res.status}`);
  return data;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { eventId, planItemId, planId } = await req.json();

    if (!eventId) {
      return NextResponse.json({ message: 'eventId is required' }, { status: 400 });
    }

    // Get event details
    const { data: event } = await supabase
      .from('events')
      .select('id, title, price, currency, image, slug')
      .eq('id', eventId)
      .single();

    if (!event) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }

    if (event.price === 0) {
      return NextResponse.json({ message: 'Event is free, no payment needed' }, { status: 400 });
    }

    const currency = (event.currency || 'MXN').toLowerCase();
    const unitAmount = Math.round(event.price * 100);
    const origin = req.headers.get('origin') || 'https://ctxplorer.com';

    const successUrl = planId
      ? `${origin}/plans/${planId}?success=true&session_id={CHECKOUT_SESSION_ID}`
      : `${origin}/tickets?success=true&session_id={CHECKOUT_SESSION_ID}`;

    const params: Record<string, string> = {
      'payment_method_types[0]': 'card',
      'mode': 'payment',
      'line_items[0][price_data][currency]': currency,
      'line_items[0][price_data][product_data][name]': event.title,
      'line_items[0][price_data][product_data][description]': `Entrada para ${event.title}`,
      'line_items[0][price_data][unit_amount]': String(unitAmount),
      'line_items[0][quantity]': '1',
      'metadata[userId]': String(user.id),
      'metadata[eventId]': String(eventId),
      'success_url': successUrl,
      'cancel_url': `${origin}/events/${event.slug}?cancelled=true`,
    };

    if (event.image) {
      params['line_items[0][price_data][product_data][images][0]'] = event.image;
    }
    if (planItemId) params['metadata[planItemId]'] = String(planItemId);
    if (planId) params['metadata[planId]'] = String(planId);

    const session = await stripeRequest('/checkout/sessions', params);

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error: unknown) {
    console.error('Stripe checkout error:', error);
    const msg = error instanceof Error ? error.message : 'Error creating checkout session';
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
