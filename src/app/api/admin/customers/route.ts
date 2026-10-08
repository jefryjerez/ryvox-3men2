import { requireAdmin } from "@/lib/auth-server";
import { READ_ACCESS } from "@/lib/permissions";
import { listCustomers } from "@/lib/data";

export async function GET() {
  const auth = await requireAdmin(READ_ACCESS.customers);
  if ("response" in auth) return auth.response;
  return Response.json({ customers: await listCustomers() });
}
