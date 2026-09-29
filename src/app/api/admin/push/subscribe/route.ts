import { requireAdmin } from "@/lib/auth-server";
import { getDb, schema } from "@/db";

interface Body {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
}

/** Registra (o actualiza) la suscripción push de este navegador para el administrador que la pide. */
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.endpoint || !body.keys?.p256dh || !body.keys.auth) {
    return Response.json({ error: "Suscripción inválida" }, { status: 400 });
  }
  const db = await getDb();
  await db
    .insert(schema.pushSubscriptions)
    .values({ id: `ps-${Date.now().toString(36)}`, userId: auth.session.sub, endpoint: body.endpoint, p256dh: body.keys.p256dh, auth: body.keys.auth })
    .onConflictDoUpdate({ target: schema.pushSubscriptions.endpoint, set: { userId: auth.session.sub, p256dh: body.keys.p256dh, auth: body.keys.auth } });
  return Response.json({ ok: true });
}
