import { integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

/* Esquema para Cloudflare D1 (SQLite). Local y producción usan el mismo esquema. */

const now = () => new Date();

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  tagline: text("tagline").notNull().default(""),
  category: text("category").notNull(),
  sku: text("sku").notNull().unique(),
  price: integer("price").notNull(), // centavos
  compareAt: integer("compare_at"),
  description: text("description").notNull().default(""),
  specs: text("specs", { mode: "json" }).$type<{ label: string; value: string }[]>().notNull().default([]),
  // Traducción al inglés; si falta, la tienda usa el texto en español de arriba.
  nameEn: text("name_en"),
  taglineEn: text("tagline_en"),
  descriptionEn: text("description_en"),
  specsEn: text("specs_en", { mode: "json" }).$type<{ label: string; value: string }[]>(),
  image: text("image").notNull(),
  gallery: text("gallery", { mode: "json" }).$type<string[]>().notNull().default([]),
  colors: text("colors", { mode: "json" }).$type<string[]>().notNull().default([]),
  colorImages: text("color_images", { mode: "json" }).$type<Record<string, string>>().notNull().default({}),
  stock: integer("stock").notNull().default(0),
  lowStockAt: integer("low_stock_at").notNull().default(10),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  model3d: text("model3d"),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  comingSoon: integer("coming_soon", { mode: "boolean" }).notNull().default(false),
  badge: text("badge"),
  sold30d: integer("sold_30d").notNull().default(0),
  // envío
  weightOz: real("weight_oz").notNull().default(8),
  dimL: real("dim_l").notNull().default(8),
  dimW: real("dim_w").notNull().default(6),
  dimH: real("dim_h").notNull().default(3),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
});

export const customers = sqliteTable("customers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull().default(""),
  city: text("city").notNull().default(""),
  note: text("note"),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
});

export interface AddressJson {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  zip: string;
  country: string;
  phone?: string;
}

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  seq: integer("seq").notNull().unique(),
  number: text("number").notNull().unique(),
  customerId: text("customer_id")
    .notNull()
    .references(() => customers.id),
  email: text("email").notNull(),
  status: text("status").notNull().default("pendiente"), // pendiente | procesando | enviado | entregado | cancelado
  paid: integer("paid", { mode: "boolean" }).notNull().default(false),
  paymentIntentId: text("payment_intent_id"),
  // Sesión de Stripe Checkout (página de pago alojada): se busca la orden por esto cuando
  // Stripe avisa por webhook que se completó el pago.
  checkoutSessionId: text("checkout_session_id"),
  // Calculation de Stripe Tax usada para el impuesto de esta orden; al pagarse se convierte en
  // Transaction (createFromCalculation) para que cuente en los reportes fiscales de Stripe.
  taxCalculationId: text("tax_calculation_id"),
  subtotal: integer("subtotal").notNull(),
  shippingCost: integer("shipping_cost").notNull().default(0),
  tax: integer("tax").notNull().default(0),
  total: integer("total").notNull(),
  shippingAddress: text("shipping_address", { mode: "json" }).$type<AddressJson>().notNull(),
  // tarifa elegida en el checkout
  shippingProvider: text("shipping_provider"),
  shippingService: text("shipping_service"),
  shippingLabel: text("shipping_label"),
  // envío realizado
  carrier: text("carrier"),
  tracking: text("tracking"),
  trackingUrl: text("tracking_url"),
  trackingStatus: text("tracking_status"),
  labelUrl: text("label_url"),
  shippoTransactionId: text("shippo_transaction_id"),
  shippedAt: integer("shipped_at", { mode: "timestamp_ms" }),
  deliveredAt: integer("delivered_at", { mode: "timestamp_ms" }),
  note: text("note"),
  // Regalo/muestra de producto (p. ej. a un barbero que hará un video): no es una venta, no se cobra ni
  // se reporta como ingreso; solo descuenta inventario. Se excluye de las cifras de ventas del panel.
  isGift: integer("is_gift", { mode: "boolean" }).notNull().default(false),
  // Pedido al por mayor con precios acordados y cobro por enlace/QR: no es un "carrito abandonado" mientras espera el pago, y no se borra solo.
  isWholesale: integer("is_wholesale", { mode: "boolean" }).notNull().default(false),
  // Código de descuento aplicado en el checkout (si hubo uno), y cuánto se descontó del subtotal (centavos).
  discountCode: text("discount_code"),
  discountAmount: integer("discount_amount").notNull().default(0),
  lang: text("lang").notNull().default("es"), // idioma del cliente para los correos
  // Token aleatorio requerido junto al número de orden para ver /seguimiento/[numero]: el número solo
  // es secuencial y adivinable, así que sin este token cualquiera podría ver pedidos ajenos.
  trackingToken: text("tracking_token"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
});

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => products.id),
  name: text("name").notNull(),
  sku: text("sku").notNull(),
  color: text("color"),
  qty: integer("qty").notNull(),
  price: integer("price").notNull(),
});

export const stockMovements = sqliteTable("stock_movements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: text("product_id")
    .notNull()
    .references(() => products.id),
  delta: integer("delta").notNull(),
  reason: text("reason").notNull(),
  orderId: text("order_id"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
});

/** Rol del equipo: acceso completo o solo las secciones elegidas (`permissions`). El rol "role-admin" es del sistema. */
export const roles = sqliteTable("roles", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  fullAccess: integer("full_access", { mode: "boolean" }).notNull().default(false),
  permissions: text("permissions", { mode: "json" }).$type<string[]>().notNull().default([]),
  isSystem: integer("is_system", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
});

export const adminUsers = sqliteTable("admin_users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  // Sin rol (null) = sin acceso a nada: nunca se asume acceso completo por omisión.
  roleId: text("role_id"),
  // Una persona desactivada ya no puede entrar, aunque su sesión siga abierta.
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
});

/** Código de acceso de un solo uso enviado por correo (login sin contraseña, verificación en dos pasos). */
export const loginCodes = sqliteTable("login_codes", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  codeHash: text("code_hash").notNull(),
  attempts: integer("attempts").notNull().default(0),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  usedAt: integer("used_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
});

/** Suscripción push de un navegador/dispositivo del panel (una por instalación de la app). */
export const pushSubscriptions = sqliteTable("push_subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => adminUsers.id),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
});

/** Fila única (id fijo "landing"): orden de las secciones del inicio y los textos editados desde el panel. */
export const siteSettings = sqliteTable("site_settings", {
  id: text("id").primaryKey(),
  order: text("order", { mode: "json" }).$type<string[]>().notNull().default([]),
  content: text("content", { mode: "json" }).$type<Record<string, unknown>>().notNull().default({}),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
});

/** Solicitud de compra al por mayor enviada desde el formulario del landing; el dueño le pone precio y genera el cobro. */
export const wholesaleRequests = sqliteTable("wholesale_requests", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  message: text("message").notNull().default(""),
  lang: text("lang").notNull().default("es"),
  // nueva | cobro (ya se generó el cobro) | descartada
  status: text("status").notNull().default("nueva"),
  items: text("items", { mode: "json" }).$type<{ productId: string; name: string; qty: number }[]>().notNull().default([]),
  orderId: text("order_id"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
});

/** Código de descuento (%) creado desde el panel, para enviar a clientes (p. ej. carritos abandonados). */
export const discountCodes = sqliteTable("discount_codes", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  percentOff: integer("percent_off").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  usesCount: integer("uses_count").notNull().default(0),
  note: text("note"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
});

/** Correo de alguien que pidió que le avisen cuando un producto "Próximamente" salga a la venta. */
export const notifyRequests = sqliteTable(
  "notify_requests",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    lang: text("lang").notNull().default("es"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
  },
  (t) => [uniqueIndex("notify_requests_email_product").on(t.email, t.productId)],
);

export type ProductRow = typeof products.$inferSelect;
export type CustomerRow = typeof customers.$inferSelect;
export type OrderRow = typeof orders.$inferSelect;
export type OrderItemRow = typeof orderItems.$inferSelect;
export type DiscountCodeRow = typeof discountCodes.$inferSelect;
export type RoleRow = typeof roles.$inferSelect;
export type WholesaleRequestRow = typeof wholesaleRequests.$inferSelect;
export type AdminUserRow = typeof adminUsers.$inferSelect;
