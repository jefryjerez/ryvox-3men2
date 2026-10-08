import { requireAdmin } from "@/lib/auth-server";
import { createRole, listRoles, teamErrorResponse } from "@/lib/team";

export async function GET() {
  const auth = await requireAdmin("team");
  if ("response" in auth) return auth.response;
  return Response.json({ roles: await listRoles() });
}

export async function POST(req: Request) {
  const auth = await requireAdmin("team");
  if ("response" in auth) return auth.response;
  const body = (await req.json().catch(() => null)) as { name?: unknown; fullAccess?: unknown; permissions?: unknown } | null;
  if (!body) return Response.json({ error: "Cuerpo inválido" }, { status: 400 });
  try {
    await createRole(body);
    return Response.json({ roles: await listRoles() }, { status: 201 });
  } catch (err) {
    return teamErrorResponse(err);
  }
}
