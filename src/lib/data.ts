import "server-only";
import { and, asc, desc, eq, inArray, lt, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getStripe } from "@/lib/stripe";
import { ABANDONED_TTL_DAYS } from "@/lib/shop-config";
import type { AddressJson, CustomerRow, OrderItemRow, OrderRow, ProductRow } from "@/db/schema";
import { PRODUCTS, type Category, type Model3D, type Product } from "@/lib/products";
import { productColors, type ColorId } from "@/lib/colors";
import type { Customer, DiscountCode, Order, OrderStatus } from "@/lib/orders";
import type { ShippingRate } from "@/lib/shipping";
import { notifyNewOrder } from "@/lib/push";
import { sendAdminNewOrder } from "@/lib/email";
import { finalizeTax } from "@/lib/tax";

/* ---------- mapeo filas → tipos de la interfaz ---------- */

export function rowToProduct(r: ProductRow): Product {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    tagline: r.tagline,
    category: r.category as Category,
    sku: r.sku,
    price: r.price,
    compareAt: r.compareAt ?? undefined,
    description: r.description,
    specs: r.specs,
    nameEn: r.nameEn ?? undefined,
    taglineEn: r.taglineEn ?? undefined,
    descriptionEn: r.descriptionEn ?? undefined,
    specsEn: r.specsEn ?? undefined,
    image: r.image,
    gallery: r.gallery ?? [],
    colors: productColors({ colors: r.colors }),
    colorImages: (r.colorImages ?? {}) as Partial<Record<ColorId, string>>,
    stock: r.stock,
    lowStockAt: r.lowStockAt,
    active: r.active,
    model3d: (r.model3d as Model3D) ?? null,
    featured: r.featured,
    comingSoon: r.comingSoon,
    badge: r.badge ?? undefined,
    sold30d: r.sold30d,
    weightOz: r.weightOz,
    dims: { l: r.dimL, w: r.dimW, h: r.dimH },
  };
}

export function rowToCustomer(r: CustomerRow): Customer {
  return { id: r.id, name: r.name, email: r.email, phone: r.phone, city: r.city, createdAt: r.createdAt.toISOString(), note: r.note ?? undefined };
}

export function rowToOrder(r: OrderRow, items: OrderItemRow[]): Order {
  return {
    id: r.id,
    number: r.number,
    customerId: r.customerId,
    items: items.map((i) => ({ productId: i.productId, qty: i.qty, price: i.price, name: i.name, sku: i.sku, color: i.color ?? undefined })),
    status: r.status as OrderStatus,
    createdAt: r.createdAt.toISOString(),
    shippingAddress: r.shippingAddress,
    shippingCost: r.shippingCost,
    shippingProvider: r.shippingProvider,
    shippingService: r.shippingService,
    carrier: r.carrier ?? undefined,
    tracking: r.tracking ?? undefined,
    note: r.note ?? undefined,
    email: r.email,
    paid: r.paid,
    tax: r.tax,
    shippingLabel: r.shippingLabel,
    trackingUrl: r.trackingUrl,
    trackingStatus: r.trackingStatus,
    labelUrl: r.labelUrl,
    shippoTransactionId: r.shippoTransactionId,
    isGift: r.isGift,
    discountCode: r.discountCode,
    discountAmount: r.discountAmount,
    paymentIntentId: r.paymentIntentId,
    checkoutSessionId: r.checkoutSessionId,
    taxCalculationId: r.taxCalculationId,
    trackingToken: r.trackingToken,
    lang: r.lang === "en" ? "en" : "es",
  };
}

/** Durante `next build` no hay binding de D1: las páginas estáticas se pregeneran con los datos de ejemplo
 *  y se regeneran con la base real en la primera visita (revalidate). */
export function buildingWithoutDb() {
  return process.env.NEXT_PHASE === "phase-production-build";
}

/* ---------- productos ---------- */

export async function listProducts(activeOnly = false): Promise<Product[]> {
  if (buildingWithoutDb()) return PRODUCTS.filter((p) => !activeOnly || p.active);
  const db = await getDb();
  const rows = activeOnly
    ? await db.select().from(schema.products).where(eq(schema.products.active, true)).orderBy(desc(schema.products.sold30d))
    : await db.select().from(schema.products).orderBy(asc(schema.products.createdAt));
  return rows.map(rowToProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (buildingWithoutDb()) return PRODUCTS.find((p) => p.slug === slug) ?? null;
  const db = await getDb();
  const row = await db.query.products.findFirst({ where: (p, { eq }) => eq(p.slug, slug) });
  return row ? rowToProduct(row) : null;
}

export async function getProductRowsByIds(ids: string[]): Promise<ProductRow[]> {
  if (ids.length === 0) return [];
  const db = await getDb();
  return db.select().from(schema.products).where(inArray(schema.products.id, ids));
}

function productPatch(p: Partial<Product>) {
  const patch: Partial<typeof schema.products.$inferInsert> = {};
  if (p.slug !== undefined) patch.slug = p.slug;
  if (p.name !== undefined) patch.name = p.name;
  if (p.tagline !== undefined) patch.tagline = p.tagline;
  if (p.category !== undefined) patch.category = p.category;
  if (p.sku !== undefined) patch.sku = p.sku;
  if (p.price !== undefined) patch.price = p.price;
  if ("compareAt" in p) patch.compareAt = p.compareAt ?? null;
  if (p.description !== undefined) patch.description = p.description;
  if ("nameEn" in p) patch.nameEn = p.nameEn || null;
  if ("taglineEn" in p) patch.taglineEn = p.taglineEn || null;
  if ("descriptionEn" in p) patch.descriptionEn = p.descriptionEn || null;
  if ("specsEn" in p) patch.specsEn = p.specsEn?.length ? p.specsEn : null;
  if (p.specs !== undefined) patch.specs = p.specs;
  if (p.image !== undefined) patch.image = p.image;
  if (p.gallery !== undefined) patch.gallery = p.gallery;
  if (p.colors !== undefined) patch.colors = p.colors;
  if (p.colorImages !== undefined) patch.colorImages = p.colorImages as Record<string, string>;
  if (p.stock !== undefined) patch.stock = p.stock;
  if (p.lowStockAt !== undefined) patch.lowStockAt = p.lowStockAt;
  if (p.active !== undefined) patch.active = p.active;
  if ("model3d" in p) patch.model3d = p.model3d ?? null;
  if (p.featured !== undefined) patch.featured = p.featured;
  if (p.comingSoon !== undefined) patch.comingSoon = p.comingSoon;
  if ("badge" in p) patch.badge = p.badge ?? null;
  if (p.weightOz !== undefined) patch.weightOz = p.weightOz;
  if (p.dims) {
    patch.dimL = p.dims.l;
    patch.dimW = p.dims.w;
    patch.dimH = p.dims.h;
  }
  patch.updatedAt = new Date();
  return patch;
}

export async function createProduct(p: Product): Promise<Product> {
  const db = await getDb();
  const [row] = await db
    .insert(schema.products)
    .values({ ...productPatch(p), id: p.id, slug: p.slug, name: p.name, category: p.category, sku: p.sku, price: p.price, image: p.image })
    .returning();
  return rowToProduct(row);
}

export async function updateProduct(id: string, p: Partial<Product>): Promise<Product | null> {
  const db = await getDb();
  const [row] = await db.update(schema.products).set(productPatch(p)).where(eq(schema.products.id, id)).returning();
  return row ? rowToProduct(row) : null;
}

export async function adjustStock(id: string, delta: number, reason: string, orderId?: string): Promise<Product | null> {
  const db = await getDb();
  const [row] = await db
    .update(schema.products)
    .set({ stock: sql`max(0, ${schema.products.stock} + ${delta})`, updatedAt: new Date() })
    .where(eq(schema.products.id, id))
    .returning();
  if (row) await db.insert(schema.stockMovements).values({ productId: id, delta, reason, orderId: orderId ?? null });
  return row ? rowToProduct(row) : null;
}

/* ---------- clientes ---------- */

export async function listCustomers(): Promise<Customer[]> {
  const db = await getDb();
  const rows = await db.select().from(schema.customers).orderBy(desc(schema.customers.createdAt));
  return rows.map(rowToCustomer);
}

export async function findOrCreateCustomer(input: { name: string; email: string; phone: string; city: string }): Promise<CustomerRow> {
  const db = await getDb();
  const email = input.email.trim().toLowerCase();
  const existing = await db.query.customers.findFirst({ where: (c, { eq }) => eq(c.email, email) });
  if (existing) {
    const [updated] = await db
      .update(schema.customers)
      .set({ name: input.name || existing.name, phone: input.phone || existing.phone, city: input.city || existing.city })
      .where(eq(schema.customers.id, existing.id))
      .returning();
    return updated;
  }
  const [created] = await db
    .insert(schema.customers)
    .values({ id: `c-${Date.now().toString(36)}`, name: input.name, email, phone: input.phone, city: input.city })
    .returning();
  return created;
}

/* ---------- órdenes ---------- */

async function itemsFor(orderIds: string[]) {
  if (orderIds.length === 0) return new Map<string, OrderItemRow[]>();
  const db = await getDb();
  const rows = await db.select().from(schema.orderItems).where(inArray(schema.orderItems.orderId, orderIds)).orderBy(asc(schema.orderItems.id));
  const map = new Map<string, OrderItemRow[]>();
  for (const r of rows) map.set(r.orderId, [...(map.get(r.orderId) ?? []), r]);
  return map;
}

/** `paid: true` = órdenes reales; `paid: false` = carritos abandonados (se creó la orden, nunca se pagó). */
export async function listOrders(opts: { paid?: boolean } = {}): Promise<Order[]> {
  const db = await getDb();
  const base = db.select().from(schema.orders);
  const rows = await (opts.paid === undefined ? base : base.where(eq(schema.orders.paid, opts.paid))).orderBy(desc(schema.orders.createdAt));
  const items = await itemsFor(rows.map((r) => r.id));
  return rows.map((r) => rowToOrder(r, items.get(r.id) ?? []));
}

export async function getOrder(id: string): Promise<Order | null> {
  const db = await getDb();
  const row = await db.query.orders.findFirst({ where: (o, { eq }) => eq(o.id, id) });
  if (!row) return null;
  const items = await itemsFor([row.id]);
  return rowToOrder(row, items.get(row.id) ?? []);
}

/**
 * El número de orden es secuencial y adivinable (#10001, #10002…), así que por sí solo no basta para
 * identificar al dueño del pedido: hace falta además el token aleatorio que solo llega en el enlace de
 * su correo. Si falta o no coincide, se trata igual que "no existe" para no revelar que el número es válido.
 */
export async function getOrderByNumber(number: string, token: string | null): Promise<Order | null> {
  if (!token) return null;
  const db = await getDb();
  const row = await db.query.orders.findFirst({ where: (o, { eq }) => eq(o.number, number.startsWith("#") ? number : `#${number}`) });
  if (!row || !row.trackingToken || row.trackingToken !== token) return null;
  const items = await itemsFor([row.id]);
  return rowToOrder(row, items.get(row.id) ?? []);
}

export async function getOrderByPaymentIntent(paymentIntentId: string): Promise<OrderRow | null> {
  const db = await getDb();
  return (await db.query.orders.findFirst({ where: (o, { eq }) => eq(o.paymentIntentId, paymentIntentId) })) ?? null;
}

export async function getOrderByCheckoutSession(checkoutSessionId: string): Promise<OrderRow | null> {
  const db = await getDb();
  return (await db.query.orders.findFirst({ where: (o, { eq }) => eq(o.checkoutSessionId, checkoutSessionId) })) ?? null;
}

export async function updateOrder(id: string, patch: Partial<typeof schema.orders.$inferInsert>): Promise<Order | null> {
  const db = await getDb();
  await db.update(schema.orders).set({ ...patch, updatedAt: new Date() }).where(eq(schema.orders.id, id));
  return getOrder(id);
}

export interface CreateOrderInput {
  customer: CustomerRow;
  email: string;
  items: { productId: string; name: string; sku: string; qty: number; price: number; color?: string | null }[];
  subtotal: number;
  tax: number;
  taxCalculationId?: string | null;
  shippingAddress: AddressJson;
  rate: ShippingRate;
  note?: string;
  lang?: "es" | "en";
  isGift?: boolean;
  discountCode?: string | null;
  discountAmount?: number;
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const db = await getDb();
  const [{ max }] = await db.select({ max: sql<number>`coalesce(max(${schema.orders.seq}), 10000)` }).from(schema.orders);
  const seq = Number(max) + 1;
  const id = `o-${seq}`;
  const total = input.subtotal + input.rate.amount + input.tax;
  await db.insert(schema.orders).values({
    id,
    seq,
    number: `#${seq}`,
    customerId: input.customer.id,
    email: input.email,
    status: "pendiente",
    paid: false,
    subtotal: input.subtotal,
    shippingCost: input.rate.amount,
    tax: input.tax,
    taxCalculationId: input.taxCalculationId ?? null,
    total,
    shippingAddress: input.shippingAddress,
    shippingProvider: input.rate.provider,
    shippingService: input.rate.service,
    shippingLabel: input.rate.label,
    note: input.note ?? null,
    lang: input.lang ?? "es",
    isGift: input.isGift ?? false,
    discountCode: input.discountCode ?? null,
    discountAmount: input.discountAmount ?? 0,
    trackingToken: crypto.randomUUID(),
  });
  for (const i of input.items) await db.insert(schema.orderItems).values({ ...i, orderId: id }); // D1: ≤100 parámetros por sentencia
  return (await getOrder(id))!;
}

/** Borra una orden que nunca llegó a tener pago (falló Stripe): no toca inventario porque solo se descuenta al pagar. */
export async function deleteOrder(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(schema.orderItems).where(eq(schema.orderItems.orderId, id));
  await db.delete(schema.orders).where(eq(schema.orders.id, id));
}

/**
 * Borra los carritos abandonados que ya pasaron de ABANDONED_TTL_DAYS. Antes de borrar se consulta Stripe:
 * si en realidad ya se pagó (p. ej. el webhook falló), la orden se conserva; y el cobro de una venta en
 * persona no caduca solo, así que se cancela para que ese QR no pueda pagarse después sin orden. Si Stripe
 * no responde, esa orden se deja para la próxima carga del panel. Devuelve cuántas se borraron.
 */
export async function purgeStaleUnpaidOrders(days = ABANDONED_TTL_DAYS): Promise<number> {
  const db = await getDb();
  const cutoff = new Date(Date.now() - days * 86400e3);
  const stale = await db
    .select({ id: schema.orders.id, paymentIntentId: schema.orders.paymentIntentId, checkoutSessionId: schema.orders.checkoutSessionId })
    .from(schema.orders)
    .where(and(eq(schema.orders.paid, false), lt(schema.orders.createdAt, cutoff)));
  if (stale.length === 0) return 0;

  const stripe = getStripe();
  let removed = 0;
  for (const o of stale) {
    try {
      if (stripe && o.paymentIntentId) {
        const intent = await stripe.paymentIntents.retrieve(o.paymentIntentId);
        if (intent.status === "succeeded") continue;
        if (intent.status !== "canceled") await stripe.paymentIntents.cancel(o.paymentIntentId);
      } else if (stripe && o.checkoutSessionId) {
        const session = await stripe.checkout.sessions.retrieve(o.checkoutSessionId);
        if (session.payment_status === "paid") continue;
      }
    } catch (err) {
      console.error("[orders] purge: no se pudo comprobar en Stripe", o.id, err);
      continue;
    }
    await deleteOrder(o.id);
    removed++;
  }
  return removed;
}

/** Marca la orden como pagada y descuenta inventario. Idempotente: si ya estaba pagada no hace nada. */
export async function markOrderPaid(id: string, paymentIntentId?: string | null): Promise<Order | null> {
  const db = await getDb();
  const row = await db.query.orders.findFirst({ where: (o, { eq }) => eq(o.id, id) });
  if (!row) return null;
  if (row.paid) return getOrder(id);
  await db
    .update(schema.orders)
    .set({ paid: true, paymentIntentId: paymentIntentId ?? row.paymentIntentId, updatedAt: new Date() })
    .where(eq(schema.orders.id, id));
  const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, id));
  for (const it of items) {
    await adjustStock(it.productId, -it.qty, row.isGift ? "regalo" : "venta", id);
    // Un regalo descuenta inventario pero no cuenta como venta: no debe inflar "más vendidos" ni ninguna métrica de ventas.
    if (!row.isGift) await db.update(schema.products).set({ sold30d: sql`${schema.products.sold30d} + ${it.qty}` }).where(eq(schema.products.id, it.productId));
  }
  if (row.taxCalculationId) await finalizeTax(row.taxCalculationId, row.number).catch((err) => console.error("[stripe tax] finalize", err));
  if (row.discountCode) {
    await db
      .update(schema.discountCodes)
      .set({ usesCount: sql`${schema.discountCodes.usesCount} + 1` })
      .where(eq(schema.discountCodes.code, row.discountCode));
  }
  const order = await getOrder(id);
  if (order) {
    await notifyNewOrder(order).catch((err) => console.error("[push] nuevo pedido", err));
    await sendAdminNewOrder(order).catch((err) => console.error("[email] aviso admin nuevo pedido", err));
  }
  return order;
}

/** Cancela y repone inventario si la orden había sido pagada. */
export async function cancelOrder(id: string): Promise<Order | null> {
  const db = await getDb();
  const row = await db.query.orders.findFirst({ where: (o, { eq }) => eq(o.id, id) });
  if (!row) return null;
  if (row.status === "cancelado") return getOrder(id);
  if (row.paid) {
    const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, id));
    for (const it of items) await adjustStock(it.productId, it.qty, "cancelacion", id);
  }
  return updateOrder(id, { status: "cancelado" });
}

/* ---------- códigos de descuento ---------- */

function rowToDiscountCode(r: schema.DiscountCodeRow): DiscountCode {
  return { id: r.id, code: r.code, percentOff: r.percentOff, active: r.active, usesCount: r.usesCount, note: r.note, createdAt: r.createdAt.toISOString() };
}

export async function listDiscountCodes(): Promise<DiscountCode[]> {
  const db = await getDb();
  const rows = await db.select().from(schema.discountCodes).orderBy(desc(schema.discountCodes.createdAt));
  return rows.map(rowToDiscountCode);
}

export async function createDiscountCode(input: { code: string; percentOff: number; note?: string }): Promise<DiscountCode> {
  const db = await getDb();
  const id = `dc-${Date.now().toString(36)}`;
  await db.insert(schema.discountCodes).values({ id, code: input.code.trim().toUpperCase(), percentOff: input.percentOff, note: input.note ?? null });
  const [row] = await db.select().from(schema.discountCodes).where(eq(schema.discountCodes.id, id));
  return rowToDiscountCode(row);
}

export async function setDiscountCodeActive(id: string, active: boolean): Promise<DiscountCode | null> {
  const db = await getDb();
  await db.update(schema.discountCodes).set({ active }).where(eq(schema.discountCodes.id, id));
  const [row] = await db.select().from(schema.discountCodes).where(eq(schema.discountCodes.id, id));
  return row ? rowToDiscountCode(row) : null;
}

/** Busca un código activo por su texto (sin importar mayúsculas/minúsculas). Usado por el checkout público. */
export async function findActiveDiscountCode(code: string): Promise<DiscountCode | null> {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(schema.discountCodes)
    .where(and(eq(schema.discountCodes.code, code.trim().toUpperCase()), eq(schema.discountCodes.active, true)));
  return row ? rowToDiscountCode(row) : null;
}
