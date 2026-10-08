import type { AddressJson } from "@/db/schema";
import { requireAdmin } from "@/lib/auth-server";
import { createOrder, deleteOrder, findOrCreateCustomer, getProductRowsByIds, markOrderPaid, updateOrder } from "@/lib/data";
import { placeholderEmail } from "@/lib/orders";
import { getStripe, stripeEnabled } from "@/lib/stripe";
import { getDictionary } from "@/i18n/config";
import { isColorId, productColors } from "@/lib/colors";
import { SITE_URL } from "@/lib/seo";

interface Body {
  lines: { productId: string; qty: number; color?: string }[];
  customerName?: string;
  customerEmail?: string;
  lang?: string;
  /** Regalo/muestra: no se cobra, no cuenta como venta, solo descuenta inventario y envía el producto. */
  isGift?: boolean;
  shippingAddress?: AddressJson;
}

/**
 * Cobro en persona (sin envío): el admin arma el carrito desde el panel y esto genera la orden
 * y el PaymentIntent de Stripe; el cliente paga abriendo el enlace/QR en su propio teléfono.
 */
export async function POST(req: Request) {
  const auth = await requireAdmin("pos");
  if ("response" in auth) return auth.response;

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.lines?.length) return Response.json({ error: "El carrito está vacío" }, { status: 400 });

  const lang = body.lang === "en" ? "en" : "es";
  const t = getDictionary(lang);
  const rows = await getProductRowsByIds(body.lines.map((l) => l.productId));
  const items: { productId: string; name: string; sku: string; qty: number; price: number; color?: string | null }[] = [];
  for (const l of body.lines) {
    const p = rows.find((r) => r.id === l.productId);
    const qty = Math.max(1, Math.floor(Number(l.qty) || 0));
    if (!p || !p.active) return Response.json({ error: "Un producto ya no está disponible" }, { status: 409 });
    if (p.stock < qty) return Response.json({ error: `Solo quedan ${p.stock} unidades de ${p.name}` }, { status: 409 });
    const available = productColors({ colors: p.colors });
    const color = available.length > 1 ? (isColorId(l.color) && available.includes(l.color) ? l.color : available[0]) : null;
    const baseName = lang === "en" ? p.nameEn || p.name : p.name;
    items.push({ productId: p.id, name: color ? `${baseName} · ${t.colors[color]}` : baseName, sku: p.sku, qty, price: p.price, color });
  }
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const isGift = !!body.isGift;
  if (!isGift && subtotal <= 0) return Response.json({ error: "El cobro debe ser mayor a $0" }, { status: 400 });

  const name = body.customerName?.trim() || (lang === "en" ? "In-person customer" : "Cliente en persona");

  if (isGift) {
    const email = body.customerEmail?.trim().toLowerCase();
    const a = body.shippingAddress;
    if (!email) return Response.json({ error: "El regalo necesita el correo de quien lo recibe, para mandarle el rastreo." }, { status: 400 });
    if (!a?.line1 || !a.city || !a.region || !a.zip) return Response.json({ error: "Falta la dirección de envío del regalo." }, { status: 400 });

    const customer = await findOrCreateCustomer({ name, email, phone: a.phone ?? "", city: `${a.city}, ${a.region}` });
    const order = await createOrder({
      customer,
      email,
      items,
      // No es una venta: sin precio, sin impuesto, sin costo de envío. No se reporta como ingreso en ningún lado.
      subtotal: 0,
      tax: 0,
      shippingAddress: { ...a, name: a.name || name, country: a.country || "Estados Unidos" },
      // provider/service vacíos a propósito: así buyLabel() no encuentra ninguna coincidencia y cae
      // directo a la tarifa más barata disponible (usd[0], ya viene ordenada de menor a mayor), en vez
      // de depender de que un texto de relleno no choque por casualidad con un transportista real.
      rate: { id: "gift", provider: "", service: "", label: "Regalo", amount: 0 },
      lang,
      isGift: true,
    });
    await markOrderPaid(order.id, null);
    return Response.json({ orderId: order.id, number: order.number, gift: true });
  }

  if (subtotal <= 0) return Response.json({ error: "El cobro debe ser mayor a $0" }, { status: 400 });
  const email = body.customerEmail?.trim().toLowerCase() || placeholderEmail(Date.now().toString(36));
  const customer = await findOrCreateCustomer({ name, email, phone: "", city: "" });

  const order = await createOrder({
    customer,
    email,
    items,
    subtotal,
    // Venta en persona sin impuesto por ahora: al vender físicamente en distintos estados (no siempre el
    // de origen), las reglas de nexo cambian y hay que confirmar primero con un contador en qué estados aplica.
    tax: 0,
    shippingAddress: { name, line1: t.pay.pickupNote, city: "-", region: "-", zip: "-", country: "-" },
    rate: { id: "pickup", provider: "Ryvox", service: "pickup", label: t.pay.pickupNote, amount: 0 },
    lang,
  });

  const stripe = getStripe();
  if (stripe && stripeEnabled()) {
    try {
      const intent = await stripe.paymentIntents.create({
        amount: subtotal,
        currency: "usd",
        automatic_payment_methods: { enabled: true },
        description: `RYVOX ${order.number} · en persona`,
        metadata: { orderId: order.id, orderNumber: order.number, channel: "pos" },
      });
      await updateOrder(order.id, { paymentIntentId: intent.id });
      return Response.json({ orderId: order.id, number: order.number, intentId: intent.id, payUrl: `${SITE_URL}/${lang}/pagar/${intent.id}` });
    } catch (err) {
      console.error("[stripe] paymentIntents.create (pos)", err);
      // Sin intento de pago la orden no sirve: se borra para no dejar órdenes "pendientes" huérfanas en el panel.
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
  const intentId = `mock-${order.id}`;
  return Response.json({ orderId: order.id, number: order.number, intentId, payUrl: `${SITE_URL}/${lang}/pagar/${intentId}` });
}
