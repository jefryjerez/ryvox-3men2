import { findActiveDiscountCode } from "@/lib/data";
import { withinRateLimit } from "@/lib/rate-limit";

/** Vista previa pública del código antes de pagar; el checkout vuelve a validarlo del lado del servidor. */
export async function POST(req: Request) {
  if (!(await withinRateLimit(req, "discount-validate"))) return Response.json({ error: "Demasiadas solicitudes" }, { status: 429 });

  const body = (await req.json().catch(() => null)) as { code?: string } | null;
  if (!body?.code) return Response.json({ valid: false });

  const dc = await findActiveDiscountCode(body.code);
  if (!dc) return Response.json({ valid: false });
  return Response.json({ valid: true, code: dc.code, percentOff: dc.percentOff });
}
