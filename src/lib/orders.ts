import { PRODUCTS } from "./products";

export type OrderStatus =
  | "pendiente"
  | "procesando"
  | "enviado"
  | "entregado"
  | "cancelado";

export const ORDER_STATUS: Record<OrderStatus, string> = {
  pendiente: "Pendiente",
  procesando: "Procesando",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export interface Address {
  name: string;
  line1: string;
  line2?: string;
  phone?: string;
  city: string;
  region: string;
  zip: string;
  country: string;
}

export interface DiscountCode {
  id: string;
  code: string;
  percentOff: number;
  active: boolean;
  usesCount: number;
  note?: string | null;
  createdAt: string;
}

/** Persona que pidió que le avisen cuando un producto "Próximamente" salga a la venta. */
export interface NotifyRequest {
  id: string;
  email: string;
  productId: string;
  lang: "es" | "en";
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  createdAt: string;
  note?: string;
}

export interface OrderItem {
  productId: string;
  qty: number;
  price: number;
  name?: string;
  sku?: string;
  color?: string;
}

export type TimelineKey = "placed" | "processing" | "shipped" | "delivered" | "cancelled";
export type TimelineDetailKey = "paid" | "packing" | "trackingSoon" | "refunded";
export interface TimelineEvent {
  key: TimelineKey;
  at: string | null;
  detailKey?: TimelineDetailKey;
  detail?: string; // texto libre (p. ej. transportista y guía)
}

export interface Order {
  id: string;
  number: string;
  customerId: string;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: string;
  shippingAddress: Address;
  shippingCost: number;
  /** Tarifa elegida por el cliente en el checkout (provider/service de Shippo, o "Ryvox"/"standard"|"express" en modo tarifa fija). */
  shippingProvider?: string | null;
  shippingService?: string | null;
  carrier?: string;
  tracking?: string;
  note?: string;
  // campos que llegan de la base de datos (opcionales para los datos de ejemplo)
  email?: string;
  paid?: boolean;
  tax?: number;
  shippingLabel?: string | null;
  trackingUrl?: string | null;
  trackingStatus?: string | null;
  labelUrl?: string | null;
  shippoTransactionId?: string | null;
  /** Regalo/muestra de producto: no es una venta, no se reporta como ingreso, solo descuenta inventario. */
  isGift?: boolean;
  /** Código de descuento aplicado en el checkout, y cuánto se descontó del subtotal (centavos). */
  discountCode?: string | null;
  discountAmount?: number;
  paymentIntentId?: string | null;
  checkoutSessionId?: string | null;
  taxCalculationId?: string | null;
  trackingToken?: string | null;
  lang?: "es" | "en";
}

export const CUSTOMERS: Customer[] = [
  { id: "c-01", name: "Marcos Torres", email: "marcos.t@email.com", phone: "+1 347 555 0182", city: "Brooklyn, NY", createdAt: "2025-01-12T10:00:00Z", note: "Pide envío rápido siempre." },
  { id: "c-02", name: "Carlos Medina", email: "carlos.m@email.com", phone: "+1 305 555 0141", city: "Miami, FL", createdAt: "2025-03-02T10:00:00Z" },
  { id: "c-03", name: "Emilia Ruiz", email: "emilia.r@email.com", phone: "+1 213 555 0199", city: "Los Ángeles, CA", createdAt: "2025-05-20T10:00:00Z" },
  { id: "c-04", name: "Daniel Peña", email: "daniel.p@email.com", phone: "+1 713 555 0123", city: "Houston, TX", createdAt: "2025-06-11T10:00:00Z" },
  { id: "c-05", name: "Jason López", email: "jason.l@email.com", phone: "+1 201 555 0177", city: "Newark, NJ", createdAt: "2025-08-01T10:00:00Z" },
  { id: "c-06", name: "Steven Kim", email: "steven.k@email.com", phone: "+1 415 555 0166", city: "San Francisco, CA", createdAt: "2026-01-15T10:00:00Z" },
  { id: "c-07", name: "Anthony Díaz", email: "anthony.d@email.com", phone: "+1 786 555 0155", city: "Hialeah, FL", createdAt: "2026-02-09T10:00:00Z" },
  { id: "c-08", name: "Brian Suárez", email: "brian.s@email.com", phone: "+1 917 555 0133", city: "Bronx, NY", createdAt: "2026-04-22T10:00:00Z" },
];

function price(id: string) {
  const found = PRODUCTS.find((x) => x.id === id);
  return found ? found.price : 0;
}

function addr(name: string, line1: string, city: string, region: string, zip: string): Address {
  return { name, line1, city, region, zip, country: "Estados Unidos" };
}

export const ORDERS: Order[] = [
  {
    id: "o-10048", number: "#10048", customerId: "c-01",
    items: [{ productId: "p-001", qty: 1, price: price("p-001") }, { productId: "p-004", qty: 2, price: price("p-004") }, { productId: "p-006", qty: 1, price: price("p-006") }],
    status: "procesando", createdAt: "2026-09-09T10:24:00Z",
    shippingAddress: addr("Marcos Torres", "1234 Bedford Ave", "Brooklyn", "NY", "11216"), shippingCost: 899,
    note: "El cliente pidió envío rápido. Incluir tarjeta de agradecimiento.",
  },
  {
    id: "o-10047", number: "#10047", customerId: "c-02",
    items: [{ productId: "p-002", qty: 1, price: price("p-002") }],
    status: "pendiente", createdAt: "2026-09-09T08:10:00Z",
    shippingAddress: addr("Carlos Medina", "88 NW 2nd St", "Miami", "FL", "33128"), shippingCost: 599,
  },
  {
    id: "o-10046", number: "#10046", customerId: "c-03",
    items: [{ productId: "p-003", qty: 1, price: price("p-003") }, { productId: "p-006", qty: 1, price: price("p-006") }],
    status: "enviado", createdAt: "2026-09-08T16:40:00Z",
    shippingAddress: addr("Emilia Ruiz", "455 S Grand Ave", "Los Ángeles", "CA", "90071"), shippingCost: 899,
    carrier: "UPS", tracking: "1Z999AA10123456784",
  },
  {
    id: "o-10045", number: "#10045", customerId: "c-04",
    items: [{ productId: "p-004", qty: 1, price: price("p-004") }],
    status: "pendiente", createdAt: "2026-09-08T14:05:00Z",
    shippingAddress: addr("Daniel Peña", "1200 McKinney St", "Houston", "TX", "77010"), shippingCost: 599,
  },
  {
    id: "o-10044", number: "#10044", customerId: "c-05",
    items: [{ productId: "p-009", qty: 2, price: price("p-009") }],
    status: "entregado", createdAt: "2026-09-07T11:30:00Z",
    shippingAddress: addr("Jason López", "60 Park Pl", "Newark", "NJ", "07102"), shippingCost: 599,
    carrier: "USPS", tracking: "9400111899223456789012",
  },
  {
    id: "o-10043", number: "#10043", customerId: "c-06",
    items: [{ productId: "p-008", qty: 1, price: price("p-008") }],
    status: "procesando", createdAt: "2026-09-07T09:12:00Z",
    shippingAddress: addr("Steven Kim", "1 Market St", "San Francisco", "CA", "94105"), shippingCost: 899,
  },
  {
    id: "o-10042", number: "#10042", customerId: "c-07",
    items: [{ productId: "p-005", qty: 1, price: price("p-005") }, { productId: "p-007", qty: 1, price: price("p-007") }],
    status: "enviado", createdAt: "2026-09-06T18:22:00Z",
    shippingAddress: addr("Anthony Díaz", "501 Palm Ave", "Hialeah", "FL", "33010"), shippingCost: 599,
    carrier: "FedEx", tracking: "771234567890",
  },
  {
    id: "o-10041", number: "#10041", customerId: "c-08",
    items: [{ productId: "p-006", qty: 2, price: price("p-006") }],
    status: "entregado", createdAt: "2026-09-05T13:00:00Z",
    shippingAddress: addr("Brian Suárez", "2500 Grand Concourse", "Bronx", "NY", "10458"), shippingCost: 599,
    carrier: "UPS", tracking: "1Z999AA10123456790",
  },
  {
    id: "o-10040", number: "#10040", customerId: "c-01",
    items: [{ productId: "p-002", qty: 2, price: price("p-002") }],
    status: "entregado", createdAt: "2026-08-28T13:00:00Z",
    shippingAddress: addr("Marcos Torres", "1234 Bedford Ave", "Brooklyn", "NY", "11216"), shippingCost: 599,
    carrier: "USPS", tracking: "9400111899223456789999",
  },
  {
    id: "o-10039", number: "#10039", customerId: "c-01",
    items: [{ productId: "p-003", qty: 1, price: price("p-003") }],
    status: "entregado", createdAt: "2026-07-14T13:00:00Z",
    shippingAddress: addr("Marcos Torres", "1234 Bedford Ave", "Brooklyn", "NY", "11216"), shippingCost: 899,
    carrier: "UPS", tracking: "1Z999AA10123456701",
  },
  {
    id: "o-10038", number: "#10038", customerId: "c-03",
    items: [{ productId: "p-001", qty: 1, price: price("p-001") }],
    status: "cancelado", createdAt: "2026-07-02T13:00:00Z",
    shippingAddress: addr("Emilia Ruiz", "455 S Grand Ave", "Los Ángeles", "CA", "90071"), shippingCost: 899,
  },
];

export function orderSubtotal(o: Order) {
  return o.items.reduce((s, i) => s + i.qty * i.price, 0);
}
export function orderTotal(o: Order) {
  return orderSubtotal(o) + o.shippingCost + (o.tax ?? 0);
}

export function orderTimeline(o: Order): TimelineEvent[] {
  const placed = o.createdAt;
  const plus = (h: number) => new Date(new Date(placed).getTime() + h * 3600e3).toISOString();
  const rank: Record<OrderStatus, number> = { pendiente: 0, procesando: 1, enviado: 2, entregado: 3, cancelado: -1 };
  const r = rank[o.status];
  const paidKey = o.paid ? ("paid" as const) : undefined;
  if (o.status === "cancelado") {
    return [
      { key: "placed", at: placed, detailKey: paidKey },
      { key: "cancelled", at: plus(2), detailKey: "refunded" },
    ];
  }
  return [
    { key: "placed", at: placed, detailKey: paidKey },
    { key: "processing", at: r >= 1 ? plus(1) : null, detailKey: r >= 1 ? "packing" : undefined },
    { key: "shipped", at: r >= 2 ? plus(20) : null, detail: r >= 2 ? `${o.carrier} · ${o.tracking}` : undefined, detailKey: r >= 2 ? undefined : "trackingSoon" },
    { key: "delivered", at: r >= 3 ? plus(68) : null },
  ];
}

/** Correo sintético para ventas en persona sin correo real del cliente; nunca se le manda nada a este dominio. */
export const POS_PLACEHOLDER_DOMAIN = "sin-correo.ryvoxshop.internal";
export function placeholderEmail(seed: string) {
  return `pos-${seed}@${POS_PLACEHOLDER_DOMAIN}`;
}
export function isPlaceholderEmail(email: string) {
  return email.toLowerCase().endsWith(`@${POS_PLACEHOLDER_DOMAIN}`);
}

/** Una orden cuenta como venta real cuando se pagó, no se canceló/reembolsó después, y no es un regalo. */
export function isRealSale(o: Order) {
  return o.paid === true && o.status !== "cancelado" && !o.isGift;
}

function dayKeyOf(iso: string) {
  return iso.slice(0, 10); // "YYYY-MM-DD" en UTC, igual que createdAt
}

/** Suma en centavos de las ventas reales de un día ("YYYY-MM-DD"). */
export function salesForDay(orders: Order[], dayISO: string) {
  return orders.filter((o) => isRealSale(o) && dayKeyOf(o.createdAt) === dayISO).reduce((s, o) => s + orderTotal(o), 0);
}

/** Cuenta de órdenes de clientes (no canceladas, sin contar regalos) en un día ("YYYY-MM-DD"); no exige que estén pagadas. */
export function ordersForDay(orders: Order[], dayISO: string) {
  return orders.filter((o) => o.status !== "cancelado" && !o.isGift && dayKeyOf(o.createdAt) === dayISO).length;
}

/** Cuenta de regalos/muestras enviados en los últimos `days` días (hoy incluido). No es una cifra de dinero. */
export function giftsInWindow(orders: Order[], days: number): number {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - (days - 1));
  const cutoffISO = cutoff.toISOString().slice(0, 10);
  return orders.filter((o) => o.isGift && o.status !== "cancelado" && dayKeyOf(o.createdAt) >= cutoffISO).length;
}

/** Suma en centavos de ventas reales entre "hace N días" y "hace M días" (M ≤ N, ambos inclusive; 0 = hoy). */
export function sumSalesWindow(orders: Order[], daysAgoStart: number, daysAgoEnd: number): number {
  const today = new Date();
  let total = 0;
  for (let n = daysAgoEnd; n <= daysAgoStart; n++) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - n);
    total += salesForDay(orders, d.toISOString().slice(0, 10));
  }
  return total;
}

/** Serie diaria de ventas reales de los últimos `days` días (hoy incluido), en centavos. */
export function salesSeries(orders: Order[], days: number): { dateISO: string; total: number }[] {
  const today = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - (days - 1 - i));
    const dateISO = d.toISOString().slice(0, 10);
    return { dateISO, total: salesForDay(orders, dateISO) };
  });
}

/** Cambio porcentual entre dos totales; `undefined` cuando no hay un punto de comparación real (evita mostrar un % inventado). */
export function percentChange(current: number, previous: number): number | undefined {
  if (previous <= 0) return undefined;
  return Math.round(((current - previous) / previous) * 100);
}
