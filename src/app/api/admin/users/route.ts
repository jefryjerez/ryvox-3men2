import { requireAdmin } from "@/lib/auth-server";
import { createTeamUser, listRoles, listTeam, teamErrorResponse } from "@/lib/team";

export async function GET() {
  const auth = await requireAdmin("team");
  if ("response" in auth) return auth.response;
  return Response.json({ users: await listTeam() });
}

export async function POST(req: Request) {
  const auth = await requireAdmin("team");
  if ("response" in auth) return auth.response;
  const body = (await req.json().catch(() => null)) as { name?: unknown; email?: unknown; roleId?: unknown } | null;
  if (!body) return Response.json({ error: "Cuerpo inválido" }, { status: 400 });
  try {
    await createTeamUser(body);
    return Response.json({ users: await listTeam(), roles: await listRoles() }, { status: 201 });
  } catch (err) {
    return teamErrorResponse(err);
  }
}
