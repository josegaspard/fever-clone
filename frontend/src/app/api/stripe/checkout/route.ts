import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getUserFromRequest } from '@/lib/auth-helpers';
import { supabase } from '@/lib/supabase';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(key);
}

// Temporary diagnostic endpoint - remove after fixing
export async function GET() {
  try {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return NextResponse.json({ error: 'STRIPE_SECRET_KEY is missing', envKeys: Object.keys(process.env).filter(k => k.includes('STRIPE')) });
    const stripe = new Stripe(key);
    const balance = await stripe.balance.retrieve();
    return NextResponse.json({ ok: true, keyPrefix: key.substring(0, 12) + '...', currency: balance.available?.[0]?.currency });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'unknown', stack: e instanceof Error ? e.stack?.split('\n').slice(0, 3) : null });
  }
}

export async function POST(req: NextRequest) {
  try {
    const stripe = getStripe();

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
    const unitAmount = Math.round(event.price * 100); // Stripe uses cents

    const origin = req.headers.get('origin') || 'https://fever-clone.vercel.app';

    // Redirect to the plan page if buying within a plan, otherwise to tickets
    const successUrl = planId
      ? `${origin}/plans/${planId}?success=true&session_id={CHECKOUT_SESSION_ID}`
      : `${origin}/tickets?success=true&session_id={CHECKOUT_SESSION_ID}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: event.title,
              images: event.image ? [event.image] : [],
              description: `Entrada para ${event.title}`,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: String(user.id),
        eventId: String(eventId),
        planItemId: planItemId ? String(planItemId) : '',
        planId: planId ? String(planId) : '',
      },
      success_url: successUrl,
      cancel_url: `${origin}/events/${event.slug}?cancelled=true`,
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error: unknown) {
    console.error('Stripe checkout error:', error);
    const msg = error instanceof Error ? error.message : 'Error creating checkout session';
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
