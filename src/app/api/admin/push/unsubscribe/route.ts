import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-server";
import { getDb, schema } from "@/db";

/** Borra la suscripción push de este navegador (al desactivar las notificaciones desde el panel). */
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const body = (await req.json().catch(() => null)) as { endpoint?: string } | null;
  if (!body?.endpoint) return Response.json({ error: "Falta el endpoint" }, { status: 400 });
  const db = await getDb();
  await db.delete(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.endpoint, body.endpoint));
  return Response.json({ ok: true });
}
