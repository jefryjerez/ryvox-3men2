import { requireAdmin } from "@/lib/auth-server";
import { createProduct, listProducts } from "@/lib/data";
import type { Product } from "@/lib/products";
import { revalidateStore, slugify } from "@/lib/store-revalidate";

export async function GET() {
  const auth = await requireAdmin("any");
  if ("response" in auth) return auth.response;
  return Response.json({ products: await listProducts(false) });
}

export async function POST(req: Request) {
  const auth = await requireAdmin("products");
  if ("response" in auth) return auth.response;
  const body = (await req.json().catch(() => null)) as Product | null;
  if (!body?.name || !body.sku || typeof body.price !== "number") {
    return Response.json({ error: "Nombre, SKU y precio son obligatorios" }, { status: 400 });
  }
  const id = body.id || `p-${Date.now().toString(36)}`;
  const slug = body.slug || slugify(body.name);
  try {
    const product = await createProduct({ ...body, id, slug });
    revalidateStore(slug);
    return Response.json({ product }, { status: 201 });
  } catch (err) {
    return Response.json({ error: `No se pudo crear: ${(err as Error).message}` }, { status: 409 });
  }
}
