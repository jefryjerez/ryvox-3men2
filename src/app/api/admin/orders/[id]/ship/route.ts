import { requireAdmin } from "@/lib/auth-server";
import { getOrder, getProductRowsByIds, updateOrder } from "@/lib/data";
import { sendOrderShipped } from "@/lib/email";
import { buyLabel, registerTracking, shippoEnabled } from "@/lib/shipping";

/**
 * Marca una orden como enviada.
 * - Con `carrier` y `tracking` en el cuerpo: registro manual.
 * - Sin ellos: compra la etiqueta en Shippo (tarifa que pagó el cliente) y guarda guía y PDF.
 */
export async function POST(req: Request, ctx: RouteContext<"/api/admin/orders/[id]/ship">) {
  const auth = await requireAdmin(["orders", "shipments"]);
  if ("response" in auth) return auth.response;
  const { id } = await ctx.params;
  const order = await getOrder(id);
  if (!order) return Response.json({ error: "Orden no encontrada" }, { status: 404 });
  if (order.status === "cancelado") return Response.json({ error: "La orden está cancelada" }, { status: 409 });

  const body = (await req.json().catch(() => ({}))) as { carrier?: string; tracking?: string };
  const manual = !!(body.carrier && body.tracking);

  try {
    let patch;
    if (manual) {
      patch = { carrier: body.carrier!, tracking: body.tracking!, trackingStatus: "PRE_TRANSIT" };
      // guía manual: se registra en Shippo para recibir los eventos de seguimiento por webhook
      await registerTracking(body.carrier!, body.tracking!);
    } else {
      if (!shippoEnabled()) {
        return Response.json({ error: "Shippo no está configurado. Añade SHIPPO_API_KEY y la dirección de origen, o registra la guía a mano." }, { status: 409 });
      }
      const rows = await getProductRowsByIds(order.items.map((i) => i.productId));
      const items = order.items.map((i) => {
        const p = rows.find((r) => r.id === i.productId);
        return { weightOz: p?.weightOz ?? 8, dimL: p?.dimL ?? 8, dimW: p?.dimW ?? 6, dimH: p?.dimH ?? 3, qty: i.qty };
      });
      const label = await buyLabel({
        address: order.shippingAddress,
        email: order.email ?? "",
        items,
        // Se respeta la tarifa que el cliente pagó en el checkout, no la más barata disponible al momento de imprimir.
        provider: order.shippingProvider ?? order.carrier ?? null,
        service: order.shippingService ?? null,
        orderNumber: order.number,
      });
      patch = {
        carrier: label.carrier,
        tracking: label.tracking,
        trackingUrl: label.trackingUrl,
        labelUrl: label.labelUrl,
        shippoTransactionId: label.transactionId,
        trackingStatus: "PRE_TRANSIT",
      };
    }
    const updated = await updateOrder(id, { ...patch, status: "enviado", shippedAt: new Date() });
    if (updated) await sendOrderShipped(updated);
    return Response.json({ order: updated });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 502 });
  }
}
