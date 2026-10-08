import { requireAdmin } from "@/lib/auth-server";
import { listWholesaleRequests } from "@/lib/wholesale";

export async function GET() {
  const auth = await requireAdmin("wholesale");
  if ("response" in auth) return auth.response;
  return Response.json({ requests: await listWholesaleRequests() });
}
