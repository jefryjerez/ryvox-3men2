import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession, type Session } from "./session";

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

/** Para rutas de API del panel: devuelve la sesión o una respuesta 401 lista para retornar. */
export async function requireAdmin(): Promise<{ session: Session } | { response: Response }> {
  const session = await getSession();
  if (!session) return { response: Response.json({ error: "No autorizado" }, { status: 401 }) };
  return { session };
}
