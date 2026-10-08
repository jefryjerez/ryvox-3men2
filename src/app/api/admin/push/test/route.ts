import { requireAdmin } from "@/lib/auth-server";
import { notifyAdmins } from "@/lib/push";
import { pushEnabled } from "@/lib/web-push";

/** Botón "Probar" del panel: manda una notificación de prueba a todos los dispositivos suscritos. */
export async function POST() {
  const auth = await requireAdmin("any");
  if ("response" in auth) return auth.response;
  await notifyAdmins({ title: "🔔 RYVOX", body: "Así se ve una notificación del panel.", url: "/dashboard", tag: "test" });
  return Response.json({ ok: true, simulated: !pushEnabled() });
}
