import { requireAdmin } from "@/lib/auth-server";
import { updateCustomer } from "@/lib/data";

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function PATCH(req: Request, ctx: RouteContext<"/api/admin/customers/[id]">) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as { name?: string; email?: string; phone?: string; city?: string; note?: string } | null;
  if (!body) return Response.json({ error: "Cuerpo inválido" }, { status: 400 });

  const name = str(body.name, 120);
  const email = str(body.email, 254).toLowerCase();
  if (!name) return Response.json({ error: "El nombre es obligatorio" }, { status: 400 });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return Response.json({ error: "Correo inválido" }, { status: 400 });

  try {
    const customer = await updateCustomer(id, { name, email, phone: str(body.phone, 40), city: str(body.city, 120), note: str(body.note, 500) || null });
    return customer ? Response.json({ customer }) : Response.json({ error: "Cliente no encontrado" }, { status: 404 });
  } catch (err) {
    console.error("[customers] update", err);
    return Response.json({ error: "Ya existe otro cliente con ese correo" }, { status: 409 });
  }
}
