import { requireAdmin } from "@/lib/auth-server";
import { fetchVisitHistory } from "@/lib/cf-analytics";

/** Historial de visitas (Cloudflare Web Analytics) para el rango de fechas pedido. */
export async function GET(req: Request) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (!from || !to) return Response.json({ error: "missing from/to" }, { status: 400 });

  try {
    const days = await fetchVisitHistory(from, to);
    return Response.json({ days });
  } catch (err) {
    console.error("[analytics] history", err);
    return Response.json({ days: [], error: String(err) }, { status: 200 });
  }
}
