import { getProductRowsByIds } from "@/lib/data";
import { sendAdminWholesaleRequest } from "@/lib/email";
import { notifyAdmins } from "@/lib/push";
import { withinRateLimit } from "@/lib/rate-limit";
import { createWholesaleRequest } from "@/lib/wholesale";

interface Body {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  lang?: string;
  items?: { productId?: string; qty?: number }[];
  /** Señuelo anti-bots: las personas nunca lo ven ni lo llenan. */
  website?: string;
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Solicitud de compra al por mayor desde el formulario del landing. El dueño le pone precio desde el panel. */
export async function POST(req: Request) {
  if (!(await withinRateLimit(req, "wholesale"))) return Response.json({ error: "Demasiadas solicitudes" }, { status: 429 });

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) return Response.json({ error: "Solicitud inválida" }, { status: 400 });
  if (body.website) return Response.json({ ok: true });

  const name = str(body.name, 120);
  const email = str(body.email, 254).toLowerCase();
  const phone = str(body.phone, 40);
  if (!name || !phone) return Response.json({ error: "Falta el nombre o el teléfono" }, { status: 400 });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return Response.json({ error: "Correo inválido" }, { status: 400 });

  // Cantidades por producto (si repiten un producto se suman).
  const wanted = new Map<string, number>();
  for (const l of (Array.isArray(body.items) ? body.items : []).slice(0, 20)) {
    const qty = Math.floor(Number(l.qty));
    if (typeof l.productId !== "string" || !Number.isFinite(qty) || qty < 1 || qty > 100000) continue;
    wanted.set(l.productId, (wanted.get(l.productId) ?? 0) + qty);
  }
  if (wanted.size === 0) return Response.json({ error: "Elige al menos un producto" }, { status: 400 });

  const lang = body.lang === "en" ? "en" : "es";
  const rows = await getProductRowsByIds([...wanted.keys()]);
  const items: { productId: string; name: string; qty: number }[] = [];
  for (const [productId, qty] of wanted) {
    const p = rows.find((r) => r.id === productId);
    if (!p || !p.active || p.comingSoon) return Response.json({ error: "Un producto ya no está disponible" }, { status: 409 });
    items.push({ productId, name: lang === "en" ? p.nameEn || p.name : p.name, qty });
  }

  const request = await createWholesaleRequest({ name, email, phone, message: str(body.message, 1500), lang, items });
  await sendAdminWholesaleRequest(request).catch((err) => console.error("[email] aviso solicitud mayoreo", err));
  await notifyAdmins({ title: "Solicitud al por mayor", body: `${name} · ${items.length} producto(s)`, url: "/dashboard/mayoreo", tag: `wholesale-${request.id}` }, "wholesale").catch((err) => console.error("[push] solicitud mayoreo", err));
  return Response.json({ ok: true });
}
