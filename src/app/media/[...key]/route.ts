import { getCloudflareContext } from "@opennextjs/cloudflare";

/** Sirve archivos del bucket R2 (fotos de producto) con caché larga. */
export async function GET(_req: Request, ctx: RouteContext<"/media/[...key]">) {
  const { key } = await ctx.params;
  const objectKey = key.join("/");
  const { env } = await getCloudflareContext({ async: true });
  const bucket = (env as CloudflareEnv & { MEDIA?: R2Bucket }).MEDIA;
  if (!bucket) return new Response("R2 no configurado", { status: 503 });

  const object = await bucket.get(objectKey);
  if (!object) return new Response("No encontrado", { status: 404 });

  // Encabezados a mano: writeHttpMetadata falla en desarrollo (el objeto llega por RPC).
  const headers = new Headers();
  const ct = object.httpMetadata?.contentType;
  if (ct) headers.set("content-type", ct);
  headers.set("cache-control", object.httpMetadata?.cacheControl ?? "public, max-age=31536000, immutable");
  headers.set("etag", object.httpEtag);
  headers.set("content-length", String(object.size));
  return new Response(object.body, { headers });
}
