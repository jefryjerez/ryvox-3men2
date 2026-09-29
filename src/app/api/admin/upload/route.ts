import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAdmin } from "@/lib/auth-server";

const MAX_BYTES = 4 * 1024 * 1024;
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** Sube una imagen de producto a R2 y devuelve su URL pública (/media/...). */
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  const { env } = await getCloudflareContext({ async: true });
  const bucket = (env as CloudflareEnv & { MEDIA?: R2Bucket }).MEDIA;
  if (!bucket) return Response.json({ error: "R2 no está configurado (binding MEDIA)" }, { status: 503 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Falta el archivo" }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return Response.json({ error: "Formato no admitido. Usa JPG, PNG o WebP." }, { status: 415 });
  if (file.size > MAX_BYTES) return Response.json({ error: "La imagen supera 4 MB" }, { status: 413 });

  const base = String(form?.get("productId") ?? "producto")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40) || "producto";
  const key = `products/${base}-${Date.now().toString(36)}.${ext}`;

  await bucket.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" },
  });

  return Response.json({ url: `/media/${key}`, key });
}
