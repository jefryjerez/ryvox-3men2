import "server-only";
import { Shippo } from "shippo";
import type { AddressJson } from "@/db/schema";
import { FREE_SHIPPING_FROM } from "@/lib/shop-config";

export { FREE_SHIPPING_FROM };

export interface ShippingRate {
  id: string; // "flat-standard" | "flat-express" | objectId de Shippo
  provider: string; // USPS, UPS, FedEx… o "Ryvox"
  service: string; // token del nivel de servicio
  label: string; // texto para el cliente
  amount: number; // centavos
  days?: number;
}

export interface ParcelItem {
  weightOz: number;
  dimL: number;
  dimW: number;
  dimH: number;
  qty: number;
}

let client: Shippo | null | undefined;
function shippo(): Shippo | null {
  if (client !== undefined) return client;
  const key = process.env.SHIPPO_API_KEY?.trim();
  client = key ? new Shippo({ apiKeyHeader: key }) : null;
  return client;
}

export function shippoEnabled() {
  return !!process.env.SHIPPO_API_KEY && !!process.env.SHIP_FROM_STREET1 && !!process.env.SHIP_FROM_ZIP;
}

function fromAddress() {
  return {
    name: process.env.SHIP_FROM_NAME ?? "Ryvox",
    street1: process.env.SHIP_FROM_STREET1 ?? "",
    city: process.env.SHIP_FROM_CITY ?? "",
    state: process.env.SHIP_FROM_STATE ?? "",
    zip: process.env.SHIP_FROM_ZIP ?? "",
    country: process.env.SHIP_FROM_COUNTRY ?? "US",
    phone: process.env.SHIP_FROM_PHONE ?? "",
    email: process.env.SHIP_FROM_EMAIL ?? "",
  };
}

function toAddress(a: AddressJson, email?: string) {
  return {
    name: a.name,
    street1: a.line1,
    street2: a.line2,
    city: a.city,
    state: a.region,
    zip: a.zip,
    country: countryCode(a.country),
    phone: a.phone,
    email,
    validate: false,
  };
}

function countryCode(c: string) {
  const v = c.trim().toLowerCase();
  if (["us", "usa", "estados unidos", "united states"].includes(v)) return "US";
  if (v.length === 2) return v.toUpperCase();
  return "US";
}

/** Un solo paquete: pesos sumados, base de la caja más grande, alturas apiladas. */
export function parcelFor(items: ParcelItem[]) {
  let weight = 0,
    l = 6,
    w = 4,
    h = 0;
  for (const it of items) {
    weight += it.weightOz * it.qty;
    l = Math.max(l, it.dimL);
    w = Math.max(w, it.dimW);
    h += it.dimH * it.qty;
  }
  return {
    length: String(Math.ceil(l)),
    width: String(Math.ceil(w)),
    height: String(Math.max(1, Math.ceil(h))),
    distanceUnit: "in" as const,
    weight: String(Math.max(1, Math.ceil(weight + 2))), // +2 oz de embalaje
    massUnit: "oz" as const,
  };
}

/** Tarifas fijas cuando Shippo no está configurado o falla. */
export function flatRates(subtotal: number): ShippingRate[] {
  const standard = subtotal >= FREE_SHIPPING_FROM ? 0 : 599;
  return [
    { id: "flat-standard", provider: "Ryvox", service: "standard", label: "Envío estándar · 3 a 5 días", amount: standard, days: 5 },
    { id: "flat-express", provider: "Ryvox", service: "express", label: "Envío exprés · 1 a 2 días", amount: 1499, days: 2 },
  ];
}

export async function getRates(address: AddressJson, items: ParcelItem[], subtotal: number): Promise<{ rates: ShippingRate[]; source: "shippo" | "flat" }> {
  const s = shippo();
  if (!s || !shippoEnabled()) return { rates: flatRates(subtotal), source: "flat" };
  try {
    const shipment = await s.shipments.create({
      addressFrom: fromAddress(),
      addressTo: toAddress(address),
      parcels: [parcelFor(items)],
      async: false,
    });
    const rates = shipment.rates
      .filter((r) => r.currency === "USD")
      .map<ShippingRate>((r) => ({
        id: r.objectId,
        provider: r.provider,
        service: r.servicelevel?.token ?? "",
        label: `${r.provider} ${r.servicelevel?.name ?? ""}${r.estimatedDays ? ` · ${r.estimatedDays} día${r.estimatedDays > 1 ? "s" : ""}` : ""}`.trim(),
        amount: Math.round(Number(r.amount) * 100),
        days: r.estimatedDays,
      }))
      .sort((a, b) => a.amount - b.amount)
      .slice(0, 5);
    if (rates.length === 0) return { rates: flatRates(subtotal), source: "flat" };
    // envío gratis sobre el umbral: la opción más barata sale a 0
    if (subtotal >= FREE_SHIPPING_FROM) rates[0] = { ...rates[0], amount: 0, label: `${rates[0].label} · Gratis` };
    return { rates, source: "shippo" };
  } catch (err) {
    console.error("[shippo] rates", err);
    return { rates: flatRates(subtotal), source: "flat" };
  }
}

/** Valida en el servidor la tarifa elegida por el cliente. */
export async function resolveRate(rateId: string, subtotal: number): Promise<ShippingRate | null> {
  const flat = flatRates(subtotal).find((r) => r.id === rateId);
  if (flat) return flat;
  const s = shippo();
  if (!s) return null;
  try {
    const r = await s.rates.get(rateId);
    const amount = Math.round(Number(r.amount) * 100);
    return {
      id: r.objectId,
      provider: r.provider,
      service: r.servicelevel?.token ?? "",
      label: `${r.provider} ${r.servicelevel?.name ?? ""}`.trim(),
      amount: subtotal >= FREE_SHIPPING_FROM ? 0 : amount,
      days: r.estimatedDays,
    };
  } catch {
    return null;
  }
}

const CARRIER_TOKENS: Record<string, string> = { usps: "usps", ups: "ups", fedex: "fedex", dhl: "dhl_express", "dhl express": "dhl_express", shippo: "shippo" };

/**
 * Da de alta una guía registrada a mano para que Shippo envíe los eventos de seguimiento por webhook.
 * Los números de prueba (SHIPPO_TRANSIT, SHIPPO_DELIVERED…) usan el transportista "shippo".
 */
export async function registerTracking(carrier: string, tracking: string): Promise<boolean> {
  const s = shippo();
  if (!s) return false;
  const token = tracking.toUpperCase().startsWith("SHIPPO_") ? "shippo" : CARRIER_TOKENS[carrier.trim().toLowerCase()];
  if (!token) return false;
  try {
    await s.trackingStatus.create({ carrier: token, trackingNumber: tracking });
    return true;
  } catch (err) {
    console.error("[shippo] registerTracking", err);
    return false;
  }
}

export interface LabelResult {
  carrier: string;
  tracking: string;
  trackingUrl: string | null;
  labelUrl: string | null;
  transactionId: string;
}

/**
 * Compra la etiqueta para una orden. Cotiza de nuevo (las tarifas caducan) y elige el mismo
 * nivel de servicio que pagó el cliente; si no está, la más barata del mismo transportista o la más barata.
 */
export async function buyLabel(opts: { address: AddressJson; email: string; items: ParcelItem[]; provider?: string | null; service?: string | null; orderNumber: string }): Promise<LabelResult> {
  const s = shippo();
  if (!s || !shippoEnabled()) throw new Error("Shippo no está configurado (SHIPPO_API_KEY y dirección de origen)");

  const shipment = await s.shipments.create({
    addressFrom: fromAddress(),
    addressTo: toAddress(opts.address, opts.email),
    parcels: [parcelFor(opts.items)],
    metadata: `Orden ${opts.orderNumber}`,
    async: false,
  });
  const usd = shipment.rates.filter((r) => r.currency === "USD").sort((a, b) => Number(a.amount) - Number(b.amount));
  const rate =
    usd.find((r) => r.servicelevel?.token === opts.service) ??
    usd.find((r) => r.provider === opts.provider) ??
    usd[0];
  if (!rate) throw new Error("Shippo no devolvió tarifas para esta dirección");

  let tx = await s.transactions.create({
    rate: rate.objectId,
    labelFileType: "PDF_4x6",
    metadata: `Orden ${opts.orderNumber}`,
    async: false,
  });
  if (tx.status !== "SUCCESS" || !tx.trackingNumber) {
    const msg = tx.messages?.map((m) => m.text).filter(Boolean).join(" · ") || "La compra de la etiqueta falló";
    throw new Error(msg);
  }
  const trackingNumber = tx.trackingNumber;
  // El pago de la guía a veces confirma antes de que el PDF termine de generarse: se reintenta
  // consultando la misma transacción unos segundos, en vez de dejar labelUrl vacío para siempre.
  for (let i = 0; i < 5 && !tx.labelUrl; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    tx = await s.transactions.get(tx.objectId!);
  }
  return {
    carrier: rate.provider,
    tracking: trackingNumber,
    trackingUrl: tx.trackingUrlProvider ?? null,
    labelUrl: tx.labelUrl ?? null,
    transactionId: tx.objectId ?? "",
  };
}

/** Vuelve a consultar una transacción ya comprada para recuperar el PDF si quedó vacío la primera vez. */
export async function refreshLabelUrl(transactionId: string): Promise<{ labelUrl: string | null; trackingUrl: string | null; status?: string; messages?: string }> {
  const s = shippo();
  if (!s) throw new Error("Shippo no está configurado");
  const tx = await s.transactions.get(transactionId);
  return {
    labelUrl: tx.labelUrl ?? null,
    trackingUrl: tx.trackingUrlProvider ?? null,
    status: tx.status,
    messages: tx.messages?.map((m) => m.text).filter(Boolean).join(" · "),
  };
}
