import { requireAdmin } from "@/lib/auth-server";
import { listRoles, listTeam, teamErrorResponse, updateTeamUser } from "@/lib/team";

export async function PATCH(req: Request, ctx: RouteContext<"/api/admin/users/[id]">) {
  const auth = await requireAdmin("team");
  if ("response" in auth) return auth.response;
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as { name?: unknown; roleId?: unknown; active?: unknown } | null;
  if (!body) return Response.json({ error: "Cuerpo inválido" }, { status: 400 });
  try {
    await updateTeamUser(id, body, auth.session.sub);
    return Response.json({ users: await listTeam(), roles: await listRoles() });
  } catch (err) {
    return teamErrorResponse(err);
  }
}
