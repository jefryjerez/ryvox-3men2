import { requireAdmin } from "@/lib/auth-server";
import { listNotifyRequests } from "@/lib/data";

export async function GET() {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  return Response.json({ requests: await listNotifyRequests() });
}
