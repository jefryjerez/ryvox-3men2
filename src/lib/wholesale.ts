import "server-only";
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { listOrders } from "@/lib/data";
import type { Address, Order, WholesaleRequest } from "@/lib/orders";
import { SITE_URL } from "@/lib/seo";

const STATUSES: WholesaleRequest["status"][] = ["nueva", "cobro", "descartada"];
export const isRequestStatus = (v: unknown): v is WholesaleRequest["status"] => STATUSES.includes(v as WholesaleRequest["status"]);

function rowToRequest(r: schema.WholesaleRequestRow): WholesaleRequest {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    message: r.message,
    lang: r.lang === "en" ? "en" : "es",
    status: isRequestStatus(r.status) ? r.status : "nueva",
    items: r.items,
    address: r.address ?? null,
    orderId: r.orderId,
    createdAt: r.createdAt.toISOString(),
  };
}

export async function createWholesaleRequest(input: {
  name: string;
  email: string;
  phone: string;
  message: string;
  lang: "es" | "en";
  items: { productId: string; name: string; qty: number; color?: string | null }[];
  address: Address;
}): Promise<WholesaleRequest> {
  const db = await getDb();
  const id = `w-${crypto.randomUUID()}`;
  await db.insert(schema.wholesaleRequests).values({ id, ...input });
  const [row] = await db.select().from(schema.wholesaleRequests).where(eq(schema.wholesaleRequests.id, id));
  return rowToRequest(row);
}

export async function listWholesaleRequests(): Promise<WholesaleRequest[]> {
  const db = await getDb();
  const rows = await db.select().from(schema.wholesaleRequests).orderBy(desc(schema.wholesaleRequests.createdAt));
  return rows.map(rowToRequest);
}

export async function updateWholesaleRequest(id: string, patch: { status?: WholesaleRequest["status"]; orderId?: string | null }): Promise<WholesaleRequest | null> {
  const db = await getDb();
  await db.update(schema.wholesaleRequests).set({ ...patch, updatedAt: new Date() }).where(eq(schema.wholesaleRequests.id, id));
  const [row] = await db.select().from(schema.wholesaleRequests).where(eq(schema.wholesaleRequests.id, id));
  return row ? rowToRequest(row) : null;
}

/** Enlace de pago de un cobro (el mismo que muestra el QR): usa el PaymentIntent como identificador, imposible de adivinar. */
export function payUrlFor(order: Pick<Order, "id" | "paymentIntentId" | "lang">): string | null {
  if (!order.paymentIntentId) return null;
  return `${SITE_URL}/${order.lang ?? "es"}/pagar/${order.paymentIntentId}`;
}

export interface WholesaleCharge {
  order: Order;
  payUrl: string | null;
}

/** Cobros al por mayor (pagados y pendientes), el más reciente primero. */
export async function listWholesaleCharges(): Promise<WholesaleCharge[]> {
  const orders = await listOrders();
  return orders.filter((o) => o.isWholesale).map((order) => ({ order, payUrl: payUrlFor(order) }));
}

/** Si un cobro se cancela, la solicitud de la que salió vuelve a quedar como nueva para poder cobrarla otra vez. */
export async function releaseRequestForOrder(orderId: string): Promise<void> {
  const db = await getDb();
  await db.update(schema.wholesaleRequests).set({ status: "nueva", orderId: null, updatedAt: new Date() }).where(eq(schema.wholesaleRequests.orderId, orderId));
}
