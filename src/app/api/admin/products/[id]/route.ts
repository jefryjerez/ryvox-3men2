import { requireAdmin } from "@/lib/auth-server";
import { adjustStock, updateProduct } from "@/lib/data";
import type { Product } from "@/lib/products";
import { revalidateStore } from "@/lib/store-revalidate";

type Body = Partial<Product> & { stockDelta?: number };

export async function PATCH(req: Request, ctx: RouteContext<"/api/admin/products/[id]">) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) return Response.json({ error: "Cuerpo inválido" }, { status: 400 });

  const { stockDelta, ...patch } = body;
  let product = null;
  if (typeof stockDelta === "number" && stockDelta !== 0) {
    product = await adjustStock(id, stockDelta, stockDelta > 0 ? "reposicion" : "ajuste");
  }
  if (Object.keys(patch).length > 0) {
    product = await updateProduct(id, patch);
  }
  if (!product) return Response.json({ error: "Producto no encontrado" }, { status: 404 });
  revalidateStore(product.slug);
  return Response.json({ product });
}
