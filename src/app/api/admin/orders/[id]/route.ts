import type { AddressJson } from "@/db/schema";
import { requireAdmin } from "@/lib/auth-server";
import { cancelOrder, getOrder, updateOrder } from "@/lib/data";
import { ORDER_STATUS, type OrderStatus } from "@/lib/orders";

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function GET(_req: Request, ctx: RouteContext<"/api/admin/orders/[id]">) {
  const auth = await requireAdmin(["orders", "abandoned", "shipments", "customers"]);
  if ("response" in auth) return auth.response;
  const { id } = await ctx.params;
  const order = await getOrder(id);
  return order ? Response.json({ order }) : Response.json({ error: "Orden no encontrada" }, { status: 404 });
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/admin/orders/[id]">) {
  const auth = await requireAdmin(["orders", "abandoned"]);
  if ("response" in auth) return auth.response;
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as { status?: OrderStatus; note?: string; email?: string; shippingAddress?: Partial<AddressJson> } | null;
  if (!body) return Response.json({ error: "Cuerpo inválido" }, { status: 400 });

  if (body.status && !(body.status in ORDER_STATUS)) return Response.json({ error: "Estado inválido" }, { status: 400 });

  // Corrección de datos del cliente (p. ej. dirección mal escrita): se valida aquí, no se confía en el navegador.
  let email: string | undefined;
  if (body.email !== undefined) {
    email = str(body.email, 254).toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return Response.json({ error: "Correo inválido" }, { status: 400 });
  }
  let shippingAddress: AddressJson | undefined;
  if (body.shippingAddress) {
    const current = await getOrder(id);
    if (!current) return Response.json({ error: "Orden no encontrada" }, { status: 404 });
    // Una vez enviada, la dirección ya no se puede cambiar: el paquete ya salió con la anterior.
    if (current.status === "enviado" || current.status === "entregado" || current.status === "cancelado") {
      return Response.json({ error: "La orden ya fue enviada o cancelada: no se puede cambiar la dirección." }, { status: 409 });
    }
    const a = body.shippingAddress;
    const next = { name: str(a.name, 120), line1: str(a.line1, 200), city: str(a.city, 100), region: str(a.region, 60), zip: str(a.zip, 20), country: str(a.country, 80) };
    if (!next.name || !next.line1 || !next.city || !next.region || !next.zip) return Response.json({ error: "Faltan datos de la dirección" }, { status: 400 });
    const line2 = str(a.line2, 120);
    const phone = str(a.phone, 40);
    shippingAddress = { ...current.shippingAddress, ...next, country: next.country || current.shippingAddress.country, line2: line2 || undefined, phone: phone || undefined };
  }

  const order =
    body.status === "cancelado"
      ? await cancelOrder(id)
      : await updateOrder(id, {
          ...(body.status ? { status: body.status } : {}),
          ...(body.note !== undefined ? { note: body.note } : {}),
          ...(body.status === "entregado" ? { deliveredAt: new Date() } : {}),
          ...(email ? { email } : {}),
          ...(shippingAddress ? { shippingAddress } : {}),
        });
  return order ? Response.json({ order }) : Response.json({ error: "Orden no encontrada" }, { status: 404 });
}
