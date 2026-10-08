import { requireAdmin } from "@/lib/auth-server";
import { setDiscountCodeActive } from "@/lib/data";

export async function PATCH(req: Request, ctx: RouteContext<"/api/admin/discount-codes/[id]">) {
  const auth = await requireAdmin("discounts");
  if ("response" in auth) return auth.response;
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as { active?: boolean } | null;
  if (typeof body?.active !== "boolean") return Response.json({ error: "Falta 'active'" }, { status: 400 });
  const code = await setDiscountCodeActive(id, body.active);
  if (!code) return Response.json({ error: "Código no encontrado" }, { status: 404 });
  return Response.json({ code });
}
