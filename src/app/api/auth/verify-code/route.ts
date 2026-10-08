import { cookies } from "next/headers";
import { getDb } from "@/db";
import { verifyLoginCode } from "@/lib/login-code";
import { sessionCookie, signSession } from "@/lib/session";
import { getDictionary, localeFromAcceptLanguage } from "@/i18n/config";

/** Segundo paso del login sin contraseña: valida el código de 6 dígitos y abre la sesión del panel. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { email?: string; code?: string; lang?: string } | null;
  const email = body?.email?.trim().toLowerCase();
  const code = body?.code?.trim();
  const lang = body?.lang === "en" || body?.lang === "es" ? body.lang : localeFromAcceptLanguage(req.headers.get("accept-language"));
  const t = getDictionary(lang).login;
  if (!email || !code || !/^\d{6}$/.test(code)) {
    return Response.json({ error: t.invalidCode }, { status: 400 });
  }

  const result = await verifyLoginCode(email, code);
  if (result === "expired") return Response.json({ error: t.expiredCode }, { status: 401 });
  if (result === "too-many-attempts") return Response.json({ error: t.tooManyAttempts }, { status: 401 });
  if (result === "invalid") return Response.json({ error: t.invalidCode }, { status: 401 });

  const db = await getDb();
  const user = await db.query.adminUsers.findFirst({ where: (u, { eq }) => eq(u.email, email) });
  if (!user || !user.active) return Response.json({ error: t.invalidCode }, { status: 401 });

  const token = await signSession({ sub: user.id, email: user.email, name: user.name });
  const store = await cookies();
  store.set(sessionCookie(token));
  return Response.json({ ok: true, name: user.name });
}
