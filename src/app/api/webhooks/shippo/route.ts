import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";

interface TrackEvent {
  event?: string;
  data?: {
    tracking_number?: string;
    carrier?: string;
    tracking_status?: { status?: string; status_details?: string; status_date?: string } | null;
  };
}

const ORDER_STATUS_FOR: Record<string, string | undefined> = {
  DELIVERED: "entregado",
  TRANSIT: "enviado",
  PRE_TRANSIT: "enviado",
};

/**
 * Webhook de seguimiento de Shippo (evento track_updated).
 * Configurar en Shippo → Settings → API → Webhooks con la URL
 * https://tudominio.com/api/webhooks/shippo?token=SHIPPO_WEBHOOK_SECRET
 */
export async function POST(req: Request) {
  const expected = process.env.SHIPPO_WEBHOOK_SECRET?.trim();
  if (expected) {
    const token = new URL(req.url).searchParams.get("token");
    if (token !== expected) return Response.json({ error: "Token inválido" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as TrackEvent | null;
  const tracking = body?.data?.tracking_number;
  const status = body?.data?.tracking_status?.status;
  if (body?.event !== "track_updated" || !tracking || !status) return Response.json({ ignored: true });

  const db = await getDb();
  // si varias órdenes comparten guía (p. ej. números de prueba), se actualiza la más reciente no cancelada
  const candidates = await db.query.orders.findMany({ where: (o, { eq }) => eq(o.tracking, tracking), orderBy: (o, { desc }) => desc(o.createdAt) });
  const order = candidates.find((o) => o.status !== "cancelado") ?? candidates[0];
  if (!order) return Response.json({ ignored: true });

  const nextStatus = ORDER_STATUS_FOR[status];
  await db
    .update(schema.orders)
    .set({
      trackingStatus: status,
      ...(nextStatus && order.status !== "cancelado" ? { status: nextStatus } : {}),
      ...(status === "DELIVERED" ? { deliveredAt: new Date(body?.data?.tracking_status?.status_date ?? Date.now()) } : {}),
      updatedAt: new Date(),
    })
    .where(eq(schema.orders.id, order.id));

  return Response.json({ ok: true });
}
