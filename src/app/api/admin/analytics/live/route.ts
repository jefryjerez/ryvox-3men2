import { requireAdmin } from "@/lib/auth-server";

/** Consulta al Worker aparte de presencia cuántos visitantes están activos ahora mismo. */
export async function GET() {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  const secret = process.env.PRESENCE_ADMIN_SECRET?.trim();
  if (!secret) return Response.json({ count: null });

  try {
    const res = await fetch("https://ryvox-presence.shopryvox.workers.dev/live", { headers: { "x-presence-secret": secret } });
    if (!res.ok) return Response.json({ count: null });
    const data = (await res.json()) as { count: number };
    return Response.json({ count: data.count });
  } catch (err) {
    console.error("[presence] /live", err);
    return Response.json({ count: null });
  }
}
