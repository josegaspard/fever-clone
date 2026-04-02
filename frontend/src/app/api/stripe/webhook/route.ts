import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function generateQRCode(eventId: string | number, userId: string | number): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 10);
  return `FEVER-${eventId}-${userId}-${ts}-${rand}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');

    let event: Stripe.Event;

    if (process.env.STRIPE_WEBHOOK_SECRET && sig) {
      try {
        event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
      } catch {
        return NextResponse.json({ message: 'Webhook signature verification failed' }, { status: 400 });
      }
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const { userId, eventId, planItemId } = session.metadata || {};

      if (userId && eventId) {
        // Prevent duplicate tickets for the same session
        const { data: existing } = await supabase
          .from('tickets')
          .select('id')
          .eq('payment_intent_id', session.id)
          .maybeSingle();

        if (!existing) {
          const qrCode = generateQRCode(eventId, userId);
          await supabase.from('tickets').insert({
            user_id: Number(userId),
            event_id: Number(eventId),
            plan_item_id: planItemId ? Number(planItemId) : null,
            qr_code: qrCode,
            status: 'ACTIVE',
            payment_intent_id: session.id,
            total_paid: (session.amount_total || 0) / 100,
          });

          // Mark plan item as paid
          if (planItemId) {
            await supabase
              .from('plan_items')
              .update({ is_paid: true })
              .eq('id', Number(planItemId));
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ message: 'Webhook error' }, { status: 500 });
  }
}
