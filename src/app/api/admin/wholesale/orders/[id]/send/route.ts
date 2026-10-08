import { requireAdmin } from "@/lib/auth-server";
import { getOrder } from "@/lib/data";
import { sendWholesalePaymentLink } from "@/lib/email";
import { isPlaceholderEmail } from "@/lib/orders";
import { payUrlFor } from "@/lib/wholesale";

/** Manda (o reenvía) al cliente el enlace de pago de un cobro al por mayor por correo. */
export async function POST(_req: Request, ctx: RouteContext<"/api/admin/wholesale/orders/[id]/send">) {
  const auth = await requireAdmin(["wholesale", "pos"]);
  if ("response" in auth) return auth.response;
  const { id } = await ctx.params;
  const order = await getOrder(id);
  if (!order || !order.isWholesale) return Response.json({ error: "Cobro no encontrado" }, { status: 404 });
  if (order.paid) return Response.json({ error: "Este cobro ya se pagó" }, { status: 409 });
  const payUrl = payUrlFor(order);
  if (!payUrl || !order.email || isPlaceholderEmail(order.email)) return Response.json({ error: "Este cobro no tiene un enlace o un correo al que enviarlo" }, { status: 409 });
  await sendWholesalePaymentLink(order, payUrl);
  return Response.json({ ok: true });
}
