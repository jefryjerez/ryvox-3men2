import { cookies } from "next/headers";
import { LANG_COOKIE, isLocale } from "@/i18n/config";

async function setLang(req: Request) {
  const url = new URL(req.url);
  const set = url.searchParams.get("set");
  if (!isLocale(set)) return false;
  const store = await cookies();
  store.set({ name: LANG_COOKIE, value: set, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  return true;
}

/** Cambia el idioma desde la interfaz: POST /api/lang?set=en */
export async function POST(req: Request) {
  const ok = await setLang(req);
  return Response.json({ ok }, { status: ok ? 200 : 400 });
}

/** Enlace directo: /api/lang?set=en&next=/productos */
export async function GET(req: Request) {
  await setLang(req);
  const next = new URL(req.url).searchParams.get("next") ?? "/";
  const target = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  return Response.redirect(new URL(target, req.url), 303);
}
