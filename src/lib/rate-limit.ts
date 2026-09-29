import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Límite por IP para rutas públicas que llaman a una API externa de pago por uso (Google Places, Shippo).
 * En local (sin el binding de Cloudflare) siempre deja pasar. `keyPrefix` separa el cupo por ruta.
 */
export async function withinRateLimit(req: Request, keyPrefix: string): Promise<boolean> {
  const { env } = await getCloudflareContext({ async: true });
  const limiter = env.API_RATE_LIMITER;
  if (!limiter) return true;
  const ip = req.headers.get("cf-connecting-ip") ?? "unknown";
  const { success } = await limiter.limit({ key: `${keyPrefix}:${ip}` });
  return success;
}
