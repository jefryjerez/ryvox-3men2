import type { AddressJson } from "@/db/schema";
import { requireAdmin } from "@/lib/auth-server";
import { createOrder, deleteOrder, findOrCreateCustomer, getProductRowsByIds, markOrderPaid, updateOrder } from "@/lib/data";
import { isColorId, productColors, type ColorId } from "@/lib/colors";
import { getDictionary } from "@/i18n/config";
import { getStripe, stripeEnabled } from "@/lib/stripe";
import { calculateTax } from "@/lib/tax";
import { listWholesaleCharges, payUrlFor, updateWholesaleRequest } from "@/lib/wholesale";
import { SITE_URL } from "@/lib/seo";

interface Body {
  /** Solicitud del landing de la que sale este cobro (opcional: también se puede crear desde cero). */
  requestId?: string;
  name?: string;
  email?: string;
  phone?: string;
  /** Mensaje para el cliente: va en el correo y queda como nota de la orden. */
  message?: string;
  lang?: string;
  address?: { line1?: string; line2?: string; city?: string; region?: string; zip?: string; country?: string };
  lines?: { productId?: string; color?: string; qty?: number; unitPrice?: number }[];
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const MAX_UNIT_CENTS = 1_000_000; // $10,000 por unidad: tope para atrapar un precio mal tecleado

export async function GET() {
  const auth = await requireAdmin("wholesale");
  if ("response" in auth) return auth.response;
  return Response.json({ charges: await listWholesaleCharges() });
}

/**
 * Cobro al por mayor: el dueño elige productos, cantidades y el precio unitario que acordó; se crea la orden y el
 * cobro con Stripe, y el cliente paga con el enlace/QR. Los precios vienen del panel (solo personal autorizado);
 * el servidor igualmente valida existencia, inventario y rangos.
 */
export async function POST(req: Request) {
  const auth = await requireAdmin(["wholesale", "pos"]);
  if ("response" in auth) return auth.response;

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) return Response.json({ error: "Solicitud inválida" }, { status: 400 });

  const lang = body.lang === "en" ? "en" : "es";
  const name = str(body.name, 120);
  const email = str(body.email, 254).toLowerCase();
  const phone = str(body.phone, 40);
  const a = body.address;
  const address: AddressJson = {
    name,
    line1: str(a?.line1, 200),
    line2: str(a?.line2, 120) || undefined,
    city: str(a?.city, 100),
    region: str(a?.region, 60),
    zip: str(a?.zip, 20),
    country: str(a?.country, 80) || "Estados Unidos",
    phone: phone || undefined,
  };
  if (!name) return Response.json({ error: "Falta el nombre del cliente" }, { status: 400 });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return Response.json({ error: "Correo inválido" }, { status: 400 });
  if (!address.line1 || !address.city || !address.region || !address.zip) return Response.json({ error: "Falta la dirección de envío" }, { status: 400 });

  const lines = Array.isArray(body.lines) ? body.lines : [];
  if (lines.length === 0 || lines.length > 20) return Response.json({ error: "Agrega entre 1 y 20 productos" }, { status: 400 });
  const keys = lines.map((l) => `${l.productId}|${isColorId(l.color) ? l.color : ""}`);
  if (new Set(keys).size !== keys.length) return Response.json({ error: "Un producto está repetido con el mismo color: junta las cantidades en una sola línea" }, { status: 400 });

  const rows = await getProductRowsByIds([...new Set(lines.map((l) => l.productId).filter((x): x is string => typeof x === "string"))]);
  const colorNames = getDictionary(lang).colors as Record<string, string>;
  const items: { productId: string; name: string; sku: string; qty: number; price: number; color: ColorId | null }[] = [];
  const qtyByProduct = new Map<string, number>();
  for (const l of lines) {
    const p = rows.find((r) => r.id === l.productId);
    const qty = Math.floor(Number(l.qty));
    const price = Math.round(Number(l.unitPrice));
    if (!p || !p.active || p.comingSoon) return Response.json({ error: "Un producto ya no está disponible" }, { status: 409 });
    if (!Number.isFinite(qty) || qty < 1 || qty > 100000) return Response.json({ error: `Cantidad inválida en ${p.name}` }, { status: 400 });
    if (!Number.isFinite(price) || price < 1 || price > MAX_UNIT_CENTS) return Response.json({ error: `Pon el precio por unidad de ${p.name}` }, { status: 400 });
    // Con varios colores hay que elegir uno de los que se fabrican; con uno solo no se etiqueta la variante.
    const available = productColors({ colors: p.colors });
    let color: ColorId | null = null;
    if (available.length > 1) {
      if (!isColorId(l.color) || !available.includes(l.color)) return Response.json({ error: `Elige el color de ${p.name}` }, { status: 400 });
      color = l.color;
    }
    // El inventario es del producto (no por color): se suma lo pedido de todos sus colores.
    const total = (qtyByProduct.get(p.id) ?? 0) + qty;
    qtyByProduct.set(p.id, total);
    if (p.stock < total) return Response.json({ error: `Solo quedan ${p.stock} unidades de ${p.name}` }, { status: 409 });
    const baseName = lang === "en" ? p.nameEn || p.name : p.name;
    items.push({ productId: p.id, name: color ? `${baseName} · ${colorNames[color] ?? color}` : baseName, sku: p.sku, qty, price, color });
  }
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);

  // Mismo cálculo de impuesto que la tienda (según la dirección de envío). Si Stripe Tax no responde, se cobra sin impuesto.
  const { amount: tax, calculationId: taxCalculationId } = await calculateTax(
    items.map((i, idx) => ({ reference: `item-${idx}`, amount: i.qty * i.price })),
    0,
    address,
  );
  const total = subtotal + tax;
  if (total < 50) return Response.json({ error: "El total debe ser de al menos $0.50" }, { status: 400 });

  const customer = await findOrCreateCustomer({ name, email, phone, city: `${address.city}, ${address.region}` });
  const order = await createOrder({
    customer,
    email,
    items,
    subtotal,
    tax,
    taxCalculationId,
    shippingAddress: address,
    // provider/service vacíos: al comprar la guía se toma la tarifa más barata disponible, igual que en los regalos.
    rate: { id: "wholesale", provider: "", service: "", label: "Mayoreo", amount: 0 },
    note: str(body.message, 1500) || undefined,
    lang,
    isWholesale: true,
  });

  const linkRequest = async (): Promise<void> => {
    if (body.requestId) await updateWholesaleRequest(body.requestId, { status: "cobro", orderId: order.id });
  };

  const stripe = getStripe();
  if (stripe && stripeEnabled()) {
    try {
      const intent = await stripe.paymentIntents.create({
        amount: total,
        currency: "usd",
        automatic_payment_methods: { enabled: true },
        description: `RYVOX ${order.number} · mayoreo`,
        metadata: { orderId: order.id, orderNumber: order.number, channel: "wholesale" },
      });
      const updated = await updateOrder(order.id, { paymentIntentId: intent.id });
      await linkRequest();
      return Response.json({ orderId: order.id, number: order.number, intentId: intent.id, payUrl: payUrlFor({ id: order.id, paymentIntentId: intent.id, lang }), total, tax, paid: !!updated?.paid });
    } catch (err) {
      console.error("[stripe] paymentIntents.create (wholesale)", err);
      await deleteOrder(order.id).catch((e) => console.error("[orders] borrar tras fallo de Stripe", e));
      return Response.json({ error: "No se pudo iniciar el cobro. Intenta de nuevo en unos minutos." }, { status: 502 });
    }
  }

  // Sin Stripe configurado, el cobro solo se simula en desarrollo. En producción nunca se marca pagado sin cobrar.
  if (process.env.NODE_ENV !== "development") {
    await deleteOrder(order.id).catch((e) => console.error("[orders] borrar sin Stripe", e));
    return Response.json({ error: "Los cobros no están disponibles en este momento." }, { status: 503 });
  }
  await markOrderPaid(order.id, null);
  await linkRequest();
  const intentId = `mock-${order.id}`;
  return Response.json({ orderId: order.id, number: order.number, intentId, payUrl: `${SITE_URL}/${lang}/pagar/${intentId}`, total, tax, paid: true });
}
