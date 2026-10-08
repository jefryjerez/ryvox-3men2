import { getProductRowsByIds } from "@/lib/data";
import { isColorId, productColors, type ColorId } from "@/lib/colors";
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
  address?: { line1?: string; line2?: string; city?: string; region?: string; zip?: string; country?: string };
  items?: { productId?: string; color?: string; qty?: number }[];
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

  const a = body.address;
  const address = {
    name,
    line1: str(a?.line1, 200),
    line2: str(a?.line2, 120) || undefined,
    city: str(a?.city, 100),
    region: str(a?.region, 60),
    zip: str(a?.zip, 20),
    country: str(a?.country, 80) || "Estados Unidos",
    phone,
  };
  if (!address.line1 || !address.city || !address.region || !address.zip) return Response.json({ error: "Falta la dirección de envío" }, { status: 400 });

  // Cantidades por producto y color (si repiten la misma combinación se suman).
  const wanted = new Map<string, { productId: string; color: string | null; qty: number }>();
  for (const l of (Array.isArray(body.items) ? body.items : []).slice(0, 30)) {
    const qty = Math.floor(Number(l.qty));
    if (typeof l.productId !== "string" || !Number.isFinite(qty) || qty < 1 || qty > 100000) continue;
    const color = isColorId(l.color) ? l.color : null;
    const key = `${l.productId}|${color ?? ""}`;
    const prev = wanted.get(key);
    wanted.set(key, { productId: l.productId, color, qty: (prev?.qty ?? 0) + qty });
  }
  if (wanted.size === 0) return Response.json({ error: "Elige al menos un producto" }, { status: 400 });

  const lang = body.lang === "en" ? "en" : "es";
  const rows = await getProductRowsByIds([...new Set([...wanted.values()].map((w) => w.productId))]);
  const items: { productId: string; name: string; qty: number; color: ColorId | null }[] = [];
  for (const w of wanted.values()) {
    const p = rows.find((r) => r.id === w.productId);
    if (!p || !p.active || p.comingSoon) return Response.json({ error: "Un producto ya no está disponible" }, { status: 409 });
    // Con varios colores hay que elegir uno de los que se fabrican; con uno solo no se etiqueta la variante.
    const available = productColors({ colors: p.colors });
    let color: ColorId | null = null;
    if (available.length > 1) {
      if (!w.color || !available.includes(w.color as ColorId)) return Response.json({ error: "Elige el color de cada producto" }, { status: 400 });
      color = w.color as ColorId;
    }
    items.push({ productId: p.id, name: lang === "en" ? p.nameEn || p.name : p.name, qty: w.qty, color });
  }

  const request = await createWholesaleRequest({ name, email, phone, message: str(body.message, 1500), lang, items, address });
  await sendAdminWholesaleRequest(request).catch((err) => console.error("[email] aviso solicitud mayoreo", err));
  await notifyAdmins({ title: "Solicitud al por mayor", body: `${name} · ${items.length} producto(s)`, url: "/dashboard/mayoreo", tag: `wholesale-${request.id}` }, "wholesale").catch((err) => console.error("[push] solicitud mayoreo", err));
  return Response.json({ ok: true });
}
