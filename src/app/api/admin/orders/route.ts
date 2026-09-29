import { requireAdmin } from "@/lib/auth-server";
import { listOrders, purgeStaleUnpaidOrders } from "@/lib/data";

/** Por defecto solo órdenes pagadas: una orden sin pago no es una orden para el panel. `?abandoned=1` da los carritos abandonados. */
export async function GET(req: Request) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const abandoned = new URL(req.url).searchParams.get("abandoned") === "1";
  // Los carritos abandonados se limpian solos: cada carga del panel borra los que ya pasaron de ABANDONED_TTL_DAYS.
  if (abandoned) await purgeStaleUnpaidOrders().catch((err) => console.error("[orders] purge", err));
  return Response.json({ orders: await listOrders({ paid: !abandoned }) });
}
