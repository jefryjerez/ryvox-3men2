import { requireAdmin } from "@/lib/auth-server";
import { listCustomers } from "@/lib/data";

export async function GET() {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  return Response.json({ customers: await listCustomers() });
}
