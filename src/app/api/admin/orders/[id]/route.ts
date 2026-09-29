import { requireAdmin } from "@/lib/auth-server";
import { cancelOrder, getOrder, updateOrder } from "@/lib/data";
import { ORDER_STATUS, type OrderStatus } from "@/lib/orders";

export async function GET(_req: Request, ctx: RouteContext<"/api/admin/orders/[id]">) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const { id } = await ctx.params;
  const order = await getOrder(id);
  return order ? Response.json({ order }) : Response.json({ error: "Orden no encontrada" }, { status: 404 });
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/admin/orders/[id]">) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as { status?: OrderStatus; note?: string } | null;
  if (!body) return Response.json({ error: "Cuerpo inválido" }, { status: 400 });

  if (body.status && !(body.status in ORDER_STATUS)) return Response.json({ error: "Estado inválido" }, { status: 400 });

  const order =
    body.status === "cancelado"
      ? await cancelOrder(id)
      : await updateOrder(id, {
          ...(body.status ? { status: body.status } : {}),
          ...(body.note !== undefined ? { note: body.note } : {}),
          ...(body.status === "entregado" ? { deliveredAt: new Date() } : {}),
        });
  return order ? Response.json({ order }) : Response.json({ error: "Orden no encontrada" }, { status: 404 });
}
