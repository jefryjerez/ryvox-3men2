import { listProducts } from "@/lib/data";

export async function GET() {
  const products = await listProducts(true);
  return Response.json({ products });
}
