import { requireAdmin } from "@/lib/auth-server";
import { deleteOrder, getOrder } from "@/lib/data";
import { getStripe } from "@/lib/stripe";
import { releaseRequestForOrder } from "@/lib/wholesale";

/** Cancela un cobro al por mayor que todavía no se pagó: anula el cobro en Stripe y borra la orden pendiente. */
export async function DELETE(_req: Request, ctx: RouteContext<"/api/admin/wholesale/orders/[id]">) {
  const auth = await requireAdmin(["wholesale", "pos"]);
  if ("response" in auth) return auth.response;
  const { id } = await ctx.params;
  const order = await getOrder(id);
  if (!order || !order.isWholesale) return Response.json({ error: "Cobro no encontrado" }, { status: 404 });
  if (order.paid) return Response.json({ error: "Este cobro ya se pagó: no se puede cancelar desde aquí" }, { status: 409 });

  const stripe = getStripe();
  if (stripe && order.paymentIntentId && !order.paymentIntentId.startsWith("mock-")) {
    try {
      const intent = await stripe.paymentIntents.retrieve(order.paymentIntentId);
      if (intent.status === "succeeded") return Response.json({ error: "El cliente acaba de pagar: no se puede cancelar" }, { status: 409 });
      if (intent.status !== "canceled") await stripe.paymentIntents.cancel(order.paymentIntentId);
    } catch (err) {
      console.error("[wholesale] cancelar cobro en Stripe", err);
      return Response.json({ error: "No se pudo cancelar el cobro en Stripe. Intenta de nuevo." }, { status: 502 });
    }
  }
  await releaseRequestForOrder(order.id);
  await deleteOrder(order.id);
  return Response.json({ ok: true });
}
