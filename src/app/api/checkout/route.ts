import type { AddressJson } from "@/db/schema";
import { createOrder, deleteOrder, findActiveDiscountCode, findOrCreateCustomer, getProductRowsByIds, markOrderPaid, updateOrder } from "@/lib/data";
import { sendOrderConfirmation } from "@/lib/email";
import { resolveRate } from "@/lib/shipping";
import { getStripe, stripeEnabled } from "@/lib/stripe";
import { calculateTax } from "@/lib/tax";
import { getDictionary } from "@/i18n/config";
import { isColorId, productColors } from "@/lib/colors";
import { SITE_URL } from "@/lib/seo";

export const runtime = "nodejs";

interface Body {
  lines: { productId: string; qty: number; color?: string }[];
  contact: { email: string; phone: string };
  address: AddressJson;
  rateId: string;
  note?: string;
  lang?: string;
  discountCode?: string;
}

/**
 * Crea la orden y, si Stripe está configurado, el PaymentIntent.
 * Los precios se recalculan aquí con la base de datos: nunca se confía en lo que manda el navegador.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.lines?.length) return Response.json({ error: "El carrito está vacío" }, { status: 400 });
  const email = body.contact?.email?.trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return Response.json({ error: "Correo inválido" }, { status: 400 });
  const a = body.address;
  if (!a?.name || !a.line1 || !a.city || !a.region || !a.zip) return Response.json({ error: "Falta la dirección de envío" }, { status: 400 });

  const rows = await getProductRowsByIds(body.lines.map((l) => l.productId));
  const lang = body.lang === "en" ? "en" : "es";
  const colorNames = getDictionary(lang).colors;
  const items: { productId: string; name: string; sku: string; qty: number; price: number; color?: string | null }[] = [];
  for (const l of body.lines) {
    const p = rows.find((r) => r.id === l.productId);
    const qty = Math.max(1, Math.floor(Number(l.qty) || 0));
    if (!p || !p.active) return Response.json({ error: "Un producto del carrito ya no está disponible" }, { status: 409 });
    if (p.stock < qty) return Response.json({ error: `Solo quedan ${p.stock} unidades de ${p.name}` }, { status: 409 });
    // color: debe ser uno de los que se fabrica; se guarda en el artículo y en su nombre para etiquetas y correos
    const available = productColors({ colors: p.colors });
    // con un solo color no se etiqueta la variante
    const color = available.length > 1 ? (isColorId(l.color) && available.includes(l.color) ? l.color : available[0]) : null;
    if (l.color && !color) return Response.json({ error: "Ese color ya no está disponible" }, { status: 409 });
    const baseName = lang === "en" ? p.nameEn || p.name : p.name;
    items.push({ productId: p.id, name: color ? `${baseName} · ${colorNames[color]}` : baseName, sku: p.sku, qty, price: p.price, color });
  }
  // El % se aplica reduciendo el precio unitario: así el subtotal, el impuesto y las líneas de Stripe quedan consistentes.
  let discountCode: string | null = null;
  const rawSubtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  if (body.discountCode) {
    const dc = await findActiveDiscountCode(body.discountCode);
    if (!dc) return Response.json({ error: "El código de descuento ya no es válido." }, { status: 409 });
    discountCode = dc.code;
    const factor = (100 - dc.percentOff) / 100;
    for (const i of items) i.price = Math.round(i.price * factor);
  }
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const discountAmount = rawSubtotal - subtotal;

  const rate = await resolveRate(body.rateId, subtotal);
  if (!rate) return Response.json({ error: "La tarifa de envío ya no es válida. Vuelve a calcular el envío." }, { status: 409 });

  const { amount: tax, calculationId: taxCalculationId } = await calculateTax(
    items.map((i, idx) => ({ reference: `item-${idx}`, amount: i.qty * i.price })),
    rate.amount,
    a,
  );
  const customer = await findOrCreateCustomer({
    name: a.name,
    email,
    phone: body.contact.phone ?? "",
    city: `${a.city}, ${a.region}`,
  });
  const order = await createOrder({
    customer,
    email,
    items,
    subtotal,
    tax,
    taxCalculationId,
    shippingAddress: { ...a, phone: body.contact.phone, country: a.country || "Estados Unidos" },
    rate,
    note: body.note,
    lang,
    discountCode,
    discountAmount,
  });
  const total = subtotal + rate.amount + tax;

  const stripe = getStripe();
  if (stripe && stripeEnabled()) {
    try {
      const orderNumberPlain = order.number.replace("#", "");
      const confirmationUrl = `${SITE_URL}/${lang}/checkout/confirmacion?orden=${encodeURIComponent(orderNumberPlain)}&t=${encodeURIComponent(order.trackingToken ?? "")}`;
      const lineItems: Array<{ price_data: { currency: string; unit_amount: number; product_data: { name: string } }; quantity: number }> = items.map((i) => ({
        price_data: { currency: "usd", unit_amount: i.price, product_data: { name: i.name } },
        quantity: i.qty,
      }));
      if (rate.amount > 0) {
        lineItems.push({ price_data: { currency: "usd", unit_amount: rate.amount, product_data: { name: lang === "en" ? "Shipping" : "Envío" } }, quantity: 1 });
      }
      if (tax > 0) {
        lineItems.push({ price_data: { currency: "usd", unit_amount: tax, product_data: { name: lang === "en" ? "Tax" : "Impuesto" } }, quantity: 1 });
      }
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        locale: lang,
        line_items: lineItems,
        customer_email: email,
        success_url: confirmationUrl,
        cancel_url: `${SITE_URL}/${lang}/checkout`,
        payment_intent_data: { metadata: { orderId: order.id, orderNumber: order.number } },
        metadata: { orderId: order.id, orderNumber: order.number },
      });
      await updateOrder(order.id, { checkoutSessionId: session.id });
      if (!session.url) throw new Error("Stripe no devolvió la URL de pago");
      return Response.json({ mode: "stripe-session", orderId: order.id, number: order.number, trackingToken: order.trackingToken, url: session.url, tax, total });
    } catch (err) {
      console.error("[stripe] checkout.sessions.create", err);
      // Sin sesión de pago la orden no sirve: se borra para no dejar órdenes "pendientes" huérfanas en el panel.
      await deleteOrder(order.id).catch((e) => console.error("[orders] borrar tras fallo de Stripe", e));
      return Response.json({ error: "No se pudo iniciar el pago. Intenta de nuevo en unos minutos." }, { status: 502 });
    }
  }

  // Sin Stripe configurado, el pago solo se simula en desarrollo. En producción nunca se marca pagado sin cobrar.
  if (process.env.NODE_ENV !== "development") {
    await deleteOrder(order.id).catch((e) => console.error("[orders] borrar sin Stripe", e));
    return Response.json({ error: "Los pagos no están disponibles en este momento." }, { status: 503 });
  }
  const paid = await markOrderPaid(order.id, null);
  if (paid) await sendOrderConfirmation(paid);
  return Response.json({ mode: "mock", orderId: order.id, number: order.number, trackingToken: order.trackingToken, tax, total });
}
