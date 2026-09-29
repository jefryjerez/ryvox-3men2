import type Stripe from "stripe";
import { cancelOrder, getOrderByPaymentIntent, markOrderPaid } from "@/lib/data";
import { sendOrderConfirmation } from "@/lib/email";
import { isPlaceholderEmail } from "@/lib/orders";
import { getStripe, webhookCrypto } from "@/lib/stripe";

/**
 * Webhook de Stripe. Configurar en el dashboard de Stripe apuntando a /api/webhooks/stripe
 * con los eventos payment_intent.succeeded, payment_intent.payment_failed y charge.refunded.
 * En local: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.
 */
export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripe || !secret) return Response.json({ error: "Stripe no configurado" }, { status: 503 });

  const signature = req.headers.get("stripe-signature");
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(raw, signature ?? "", secret, undefined, webhookCrypto);
  } catch (err) {
    return Response.json({ error: `Firma inválida: ${(err as Error).message}` }, { status: 400 });
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const intent = event.data.object;
      const orderId = intent.metadata?.orderId;
      if (orderId) {
        const order = await markOrderPaid(orderId, intent.id);
        if (order && !order.trackingStatus && !isPlaceholderEmail(order.email ?? "")) await sendOrderConfirmation(order);
      }
      break;
    }
    case "payment_intent.payment_failed": {
      // La orden queda pendiente y sin pagar; el cliente puede reintentar. No hay que hacer nada.
      break;
    }
    case "charge.refunded": {
      const charge = event.data.object;
      const piId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
      if (piId) {
        const row = await getOrderByPaymentIntent(piId);
        if (row && charge.refunded) await cancelOrder(row.id);
      }
      break;
    }
  }
  return Response.json({ received: true });
}
