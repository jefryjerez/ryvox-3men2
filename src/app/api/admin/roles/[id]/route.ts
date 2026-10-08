import { requireAdmin } from "@/lib/auth-server";
import { deleteRole, listRoles, teamErrorResponse, updateRole } from "@/lib/team";

export async function PATCH(req: Request, ctx: RouteContext<"/api/admin/roles/[id]">) {
  const auth = await requireAdmin("team");
  if ("response" in auth) return auth.response;
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as { name?: unknown; fullAccess?: unknown; permissions?: unknown } | null;
  if (!body) return Response.json({ error: "Cuerpo inválido" }, { status: 400 });
  try {
    await updateRole(id, body, auth.session.sub);
    return Response.json({ roles: await listRoles() });
  } catch (err) {
    return teamErrorResponse(err);
  }
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/admin/roles/[id]">) {
  const auth = await requireAdmin("team");
  if ("response" in auth) return auth.response;
  const { id } = await ctx.params;
  try {
    await deleteRole(id);
    return Response.json({ roles: await listRoles() });
  } catch (err) {
    return teamErrorResponse(err);
  }
}
