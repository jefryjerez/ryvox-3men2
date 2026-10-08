import "server-only";
import { cookies } from "next/headers";
import { hasAccess, type AdminMe, type Need } from "./permissions";
import { SESSION_COOKIE, verifySession, type Session } from "./session";
import { getAdminMe } from "./team";

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

/**
 * Para rutas de API del panel. Además de la sesión, consulta en la base que la persona siga activa y que su rol
 * permita lo que la ruta pide (`need`): 401 si no hay sesión válida, 403 si el rol no alcanza.
 */
export async function requireAdmin(need: Need): Promise<{ session: Session; me: AdminMe } | { response: Response }> {
  const session = await getSession();
  if (!session) return { response: Response.json({ error: "No autorizado" }, { status: 401 }) };
  const me = await getAdminMe(session.sub);
  if (!me) return { response: Response.json({ error: "No autorizado" }, { status: 401 }) };
  if (!hasAccess(me, need)) return { response: Response.json({ error: "No tienes permiso para esto" }, { status: 403 }) };
  return { session, me };
}
