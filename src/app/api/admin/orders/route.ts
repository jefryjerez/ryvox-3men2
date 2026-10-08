import { requireAdmin } from "@/lib/auth-server";
import { READ_ACCESS } from "@/lib/permissions";
import { listOrders, purgeStaleUnpaidOrders } from "@/lib/data";

/** Por defecto solo órdenes pagadas: una orden sin pago no es una orden para el panel. `?abandoned=1` da los carritos abandonados. */
export async function GET(req: Request) {
  const abandoned = new URL(req.url).searchParams.get("abandoned") === "1";
  const auth = await requireAdmin(abandoned ? READ_ACCESS.abandoned : READ_ACCESS.orders);
  if ("response" in auth) return auth.response;
  // Los carritos abandonados se limpian solos: cada carga del panel borra los que ya pasaron de ABANDONED_TTL_DAYS.
  if (abandoned) await purgeStaleUnpaidOrders().catch((err) => console.error("[orders] purge", err));
  const orders = await listOrders({ paid: !abandoned });
  // Un cobro al por mayor esperando pago no es un carrito abandonado: vive en la sección Mayoreo.
  return Response.json({ orders: abandoned ? orders.filter((o) => !o.isWholesale) : orders });
}
