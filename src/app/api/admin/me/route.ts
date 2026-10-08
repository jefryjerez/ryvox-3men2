import { requireAdmin } from "@/lib/auth-server";

/** Quién es la persona con sesión y qué secciones puede usar: el panel solo muestra y pide lo que le toca. */
export async function GET() {
  const auth = await requireAdmin("any");
  if ("response" in auth) return auth.response;
  return Response.json({ me: auth.me });
}
