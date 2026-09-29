import type { AddressJson } from "@/db/schema";
import { getProductRowsByIds } from "@/lib/data";
import { getRates } from "@/lib/shipping";
import { withinRateLimit } from "@/lib/rate-limit";

interface Body {
  lines: { productId: string; qty: number }[];
  address: AddressJson;
}

/** Tarifas de envío para el checkout. Con Shippo devuelve tarifas reales; sin él, tarifas fijas. */
export async function POST(req: Request) {
  if (!(await withinRateLimit(req, "shipping-rates"))) return Response.json({ error: "Demasiadas solicitudes" }, { status: 429 });

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.lines?.length || !body.address?.zip) return Response.json({ error: "Faltan datos" }, { status: 400 });

  const rows = await getProductRowsByIds(body.lines.map((l) => l.productId));
  let subtotal = 0;
  const items = body.lines.flatMap((l) => {
    const p = rows.find((r) => r.id === l.productId);
    if (!p) return [];
    subtotal += p.price * l.qty;
    return [{ weightOz: p.weightOz, dimL: p.dimL, dimW: p.dimW, dimH: p.dimH, qty: l.qty }];
  });

  const { rates, source } = await getRates(body.address, items, subtotal);
  return Response.json({ rates, source });
}
