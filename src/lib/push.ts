import "server-only";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { sendWebPush, type PushSubscriptionJSON } from "@/lib/web-push";
import type { Order } from "@/lib/orders";
import { orderTotal } from "@/lib/orders";
import { money } from "@/lib/format";

/** Envía una notificación push a todos los dispositivos con sesión abierta en el panel. Borra las que ya no valen. */
export async function notifyAdmins(payload: { title: string; body: string; url?: string; tag?: string }) {
  const db = await getDb();
  const rows = await db.select().from(schema.pushSubscriptions);
  if (rows.length === 0) return;

  await Promise.all(
    rows.map(async (row) => {
      const sub: PushSubscriptionJSON = { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } };
      const result = await sendWebPush(sub, payload);
      if (result === "gone") await db.delete(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.endpoint, row.endpoint));
    }),
  );
}

/** Notificación de pedido pagado, para el panel (nuevo pedido en la tienda o cobro en persona). */
export async function notifyNewOrder(order: Order) {
  const total = money(orderTotal(order));
  await notifyAdmins({
    title: "🛎️ Nuevo pedido",
    body: `${order.number} · ${total}`,
    url: `/dashboard/ordenes/${order.id}`,
    tag: `order-${order.id}`,
  });
}
