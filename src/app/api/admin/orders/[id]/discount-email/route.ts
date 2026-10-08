import { requireAdmin } from "@/lib/auth-server";
import { createDiscountCode, getOrder } from "@/lib/data";
import { sendAbandonedCartOffer } from "@/lib/email";
import { isPlaceholderEmail } from "@/lib/orders";

/** Genera un código de descuento y le manda al cliente una oferta por correo (p. ej. para un carrito abandonado). */
export async function POST(req: Request, ctx: RouteContext<"/api/admin/orders/[id]/discount-email">) {
  const auth = await requireAdmin("abandoned");
  if ("response" in auth) return auth.response;
  const { id } = await ctx.params;

  const body = (await req.json().catch(() => null)) as { percentOff?: number } | null;
  const percentOff = Math.round(Number(body?.percentOff));
  if (!Number.isFinite(percentOff) || percentOff < 1 || percentOff > 100) return Response.json({ error: "% inválido" }, { status: 400 });

  const order = await getOrder(id);
  if (!order) return Response.json({ error: "Orden no encontrada" }, { status: 404 });
  if (!order.email || isPlaceholderEmail(order.email)) return Response.json({ error: "Esta orden no tiene un correo real del cliente" }, { status: 409 });

  const code = `VUELVE${percentOff}-${Date.now().toString(36).slice(-5).toUpperCase()}`;
  const created = await createDiscountCode({ code, percentOff, note: `Carrito abandonado ${order.number} · ${order.shippingAddress.name}` });
  await sendAbandonedCartOffer(order, created.code, percentOff);
  return Response.json({ ok: true, code: created });
}
