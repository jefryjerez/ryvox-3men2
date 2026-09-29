import { requireAdmin } from "@/lib/auth-server";
import { fetchTopReferrers } from "@/lib/cf-analytics";

/** De dónde viene el tráfico (host de referencia) para el rango de fechas pedido. */
export async function GET(req: Request) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (!from || !to) return Response.json({ error: "missing from/to" }, { status: 400 });

  try {
    const referrers = await fetchTopReferrers(from, to);
    return Response.json({ referrers });
  } catch (err) {
    console.error("[analytics] referrers", err);
    return Response.json({ referrers: [], error: String(err) }, { status: 200 });
  }
}
