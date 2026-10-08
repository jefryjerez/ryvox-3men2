import { getDb } from "@/db";
import { createLoginCode, isRateLimited } from "@/lib/login-code";
import { sendLoginCode } from "@/lib/email";
import { getDictionary, localeFromAcceptLanguage } from "@/i18n/config";

/**
 * Primer paso del login sin contraseña: si el correo corresponde a un administrador se le envía
 * un código de 6 dígitos. Siempre responde igual exista o no la cuenta, para no revelar quién es admin.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { email?: string; lang?: string } | null;
  const email = body?.email?.trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return Response.json({ error: "Correo inválido" }, { status: 400 });
  }
  const lang = body?.lang === "en" || body?.lang === "es" ? body.lang : localeFromAcceptLanguage(req.headers.get("accept-language"));
  const t = getDictionary(lang).login;

  if (await isRateLimited(email)) {
    return Response.json({ error: t.tooSoon }, { status: 429 });
  }

  const db = await getDb();
  const user = await db.query.adminUsers.findFirst({ where: (u, { eq }) => eq(u.email, email) });
  if (user && user.active) {
    const code = await createLoginCode(email);
    await sendLoginCode(email, code, lang);
  }
  return Response.json({ ok: true });
}
