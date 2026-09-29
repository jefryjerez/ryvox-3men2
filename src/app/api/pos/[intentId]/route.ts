import { getOrder, getOrderByPaymentIntent } from "@/lib/data";
import { orderTotal } from "@/lib/orders";
import { getStripe } from "@/lib/stripe";

/**
 * Pública a propósito: la trae el navegador del cliente al abrir el enlace/QR de un cobro en persona.
 * El identificador es el PaymentIntent de Stripe (aleatorio e imposible de adivinar), no el número de pedido.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ intentId: string }> }) {
  const { intentId } = await params;

  const order = intentId.startsWith("mock-") ? await getOrder(intentId.slice(5)) : await getOrderByPaymentIntent(intentId).then((row) => (row ? getOrder(row.id) : null));
  if (!order) return Response.json({ error: "not-found" }, { status: 404 });

  let clientSecret: string | null = null;
  if (!order.paid && !intentId.startsWith("mock-")) {
    const stripe = getStripe();
    if (stripe) {
      try {
        const intent = await stripe.paymentIntents.retrieve(intentId);
        clientSecret = intent.client_secret;
      } catch (err) {
        console.error("[stripe] paymentIntents.retrieve", err);
      }
    }
  }

  return Response.json({
    number: order.number,
    items: order.items.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
    total: orderTotal(order),
    paid: !!order.paid,
    lang: order.lang ?? "es",
    clientSecret,
  });
}
