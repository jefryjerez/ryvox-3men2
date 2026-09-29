import "server-only";
import type { AddressJson } from "@/db/schema";
import { getStripe } from "@/lib/stripe";

export interface TaxLineItem {
  reference: string;
  amount: number; // centavos, total de la línea (precio × cantidad)
}

export interface TaxResult {
  amount: number;
  calculationId: string | null;
}

/**
 * Calcula el impuesto de venta con Stripe Tax. Requiere que la cuenta tenga Stripe Tax activado y
 * los registros fiscales configurados en el Dashboard (Settings → Tax); si no, o si falla la llamada,
 * se cobra $0 de impuesto en vez de romper el checkout (igual que Shippo cae a tarifas fijas si falla).
 */
export async function calculateTax(items: TaxLineItem[], shippingAmount: number, address: AddressJson): Promise<TaxResult> {
  const stripe = getStripe();
  if (!stripe) return { amount: 0, calculationId: null };
  try {
    const calc = await stripe.tax.calculations.create({
      currency: "usd",
      line_items: items.map((i) => ({ amount: i.amount, reference: i.reference })),
      shipping_cost: { amount: shippingAmount },
      customer_details: {
        address: { line1: address.line1, line2: address.line2 || undefined, city: address.city, state: address.region, postal_code: address.zip, country: "US" },
        address_source: "shipping",
      },
    });
    return { amount: calc.tax_amount_exclusive, calculationId: calc.id };
  } catch (err) {
    console.error("[stripe tax] calculation", err);
    return { amount: 0, calculationId: null };
  }
}

/** Registra la Transaction a partir de la Calculation guardada en la orden: sin esto, Stripe no cuenta el impuesto en sus reportes fiscales. */
export async function finalizeTax(calculationId: string, orderNumber: string) {
  const stripe = getStripe();
  if (!stripe) return;
  try {
    await stripe.tax.transactions.createFromCalculation({ calculation: calculationId, reference: orderNumber });
  } catch (err) {
    console.error("[stripe tax] transaction", err);
  }
}
