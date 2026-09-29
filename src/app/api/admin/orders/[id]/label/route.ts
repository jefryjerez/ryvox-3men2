import { requireAdmin } from "@/lib/auth-server";
import { getOrder, updateOrder } from "@/lib/data";
import { refreshLabelUrl } from "@/lib/shipping";

/** Vuelve a pedirle a Shippo el PDF de una guía ya comprada (no compra una guía nueva, no cobra de nuevo). */
export async function POST(_req: Request, ctx: RouteContext<"/api/admin/orders/[id]/label">) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const { id } = await ctx.params;
  const order = await getOrder(id);
  if (!order) return Response.json({ error: "Orden no encontrada" }, { status: 404 });
  if (!order.shippoTransactionId) return Response.json({ error: "Esta orden no tiene una guía comprada en Shippo" }, { status: 409 });

  try {
    const { labelUrl, trackingUrl, status, messages } = await refreshLabelUrl(order.shippoTransactionId);
    if (!labelUrl) {
      const detail = [status, messages].filter(Boolean).join(": ");
      return Response.json({ error: `Shippo no tiene el PDF todavía${detail ? ` (${detail})` : ""}.` }, { status: 409 });
    }
    const updated = await updateOrder(id, { labelUrl, trackingUrl: trackingUrl ?? order.trackingUrl });
    return Response.json({ order: updated });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 502 });
  }
}
