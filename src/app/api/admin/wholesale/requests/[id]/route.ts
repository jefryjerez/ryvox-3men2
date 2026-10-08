import { requireAdmin } from "@/lib/auth-server";
import { listWholesaleRequests, updateWholesaleRequest } from "@/lib/wholesale";

/** Descartar una solicitud o volver a abrirla. El estado "cobro" lo pone solo el sistema al generar el cobro. */
export async function PATCH(req: Request, ctx: RouteContext<"/api/admin/wholesale/requests/[id]">) {
  const auth = await requireAdmin("wholesale");
  if ("response" in auth) return auth.response;
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as { status?: string } | null;
  if (body?.status !== "nueva" && body?.status !== "descartada") return Response.json({ error: "Estado inválido" }, { status: 400 });
  const updated = await updateWholesaleRequest(id, { status: body.status });
  if (!updated) return Response.json({ error: "Solicitud no encontrada" }, { status: 404 });
  return Response.json({ requests: await listWholesaleRequests() });
}
