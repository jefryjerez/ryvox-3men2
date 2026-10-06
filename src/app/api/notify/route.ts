import { addNotifyRequest, getProductRowsByIds } from "@/lib/data";
import { withinRateLimit } from "@/lib/rate-limit";

interface Body {
  email?: string;
  productId?: string;
  lang?: string;
  /** Señuelo anti-bots: las personas nunca lo ven ni lo llenan. */
  website?: string;
}

/** Guarda el correo de alguien que quiere que le avisen cuando un producto "Próximamente" salga a la venta. */
export async function POST(req: Request) {
  if (!(await withinRateLimit(req, "notify"))) return Response.json({ error: "Demasiadas solicitudes" }, { status: 429 });

  const body = (await req.json().catch(() => null)) as Body | null;
  const email = body?.email?.trim().toLowerCase() ?? "";
  if (!email || email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return Response.json({ error: "Correo inválido" }, { status: 400 });
  if (body?.website) return Response.json({ ok: true });

  const productId = body?.productId ?? "";
  const [product] = productId ? await getProductRowsByIds([productId]) : [];
  if (!product || !product.comingSoon) return Response.json({ error: "Producto no disponible" }, { status: 404 });

  await addNotifyRequest({ email, productId: product.id, lang: body?.lang === "en" ? "en" : "es" });
  return Response.json({ ok: true });
}
