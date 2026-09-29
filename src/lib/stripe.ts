import "server-only";
import Stripe from "stripe";

let client: Stripe | null | undefined;

/** Cliente de Stripe, o null si no hay clave (modo simulado). Usa fetch: necesario en Cloudflare Workers.
 *  Se recorta la clave, pero OJO: `trim()` solo quita espacios en los extremos. Un carácter invisible EN
 *  MEDIO del secreto (pasó al pegarlo por PowerShell) hace que el Worker rechace el header Authorization
 *  y devuelva un 400 vacío en 0 ms sin salir a la red — el SDK lo reporta como "Invalid JSON received
 *  from the Stripe API". Subir secretos siempre con scripts/put-secret.sh, que valida la forma antes. */
export function getStripe(): Stripe | null {
  if (client !== undefined) return client;
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  client = key ? new Stripe(key, { httpClient: Stripe.createFetchHttpClient() }) : null;
  return client;
}

/** Proveedor de firma para verificar webhooks sin las APIs de Node. */
export const webhookCrypto = Stripe.createSubtleCryptoProvider();

export function stripeEnabled() {
  return !!process.env.STRIPE_SECRET_KEY && !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
}
