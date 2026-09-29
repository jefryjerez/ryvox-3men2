import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { LANG_COOKIE, isLocale, localeFromAcceptLanguage, type Locale } from "@/i18n/config";

const PREVIEW_COOKIE = "ryvox_preview";
const PREVIEW_MAX_AGE = 60 * 60 * 24 * 30; // 30 días
const LANG_MAX_AGE = 60 * 60 * 24 * 365;

function siteLocked() {
  return process.env.SITE_LOCKED === "true";
}

/** Separa un prefijo de idioma explícito (/en/..., /es/...) del resto de la ruta. */
function splitLocale(pathname: string): { explicit: Locale | null; path: string } {
  const m = pathname.match(/^\/(es|en)(?=\/|$)(.*)$/);
  if (m && isLocale(m[1])) return { explicit: m[1], path: m[2] || "/" };
  return { explicit: null, path: pathname };
}

export async function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const { explicit, path } = splitLocale(url.pathname);
  const isApi = path.startsWith("/api/");

  // Idioma: prefijo explícito > cookie > idioma del dispositivo (Accept-Language)
  const cookieLang = request.cookies.get(LANG_COOKIE)?.value;
  const lang: Locale = explicit ?? (isLocale(cookieLang) ? cookieLang : localeFromAcceptLanguage(request.headers.get("accept-language")));

  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  // 1) Panel y su API: solo con sesión.
  if (path.startsWith("/dashboard") || path.startsWith("/api/admin")) {
    if (!session) {
      if (isApi) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      const login = new URL("/login", request.url);
      login.searchParams.set("next", path + url.search);
      return NextResponse.redirect(login);
    }
  }

  // 2) Web cerrada al público mientras se construye.
  if (siteLocked()) {
    const key = process.env.PREVIEW_KEY;
    if (path === "/preview") {
      const res = NextResponse.redirect(new URL("/", request.url));
      if (key && url.searchParams.get("key") === key) {
        res.cookies.set({ name: PREVIEW_COOKIE, value: key, httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: PREVIEW_MAX_AGE });
      }
      return res;
    }
    const hasPreview = !!key && request.cookies.get(PREVIEW_COOKIE)?.value === key;
    // /pagar y /api/pos: el cliente paga en persona aunque la tienda online siga "en construcción".
    const alwaysOpen =
      path === "/en-construccion" ||
      path.startsWith("/login") ||
      path.startsWith("/api/auth") ||
      path.startsWith("/api/webhooks") ||
      path === "/api/lang" ||
      path.startsWith("/pagar") ||
      path.startsWith("/api/pos");
    if (!session && !hasPreview && !alwaysOpen) {
      if (isApi) return NextResponse.json({ error: "Sitio en construcción" }, { status: 503 });
      return NextResponse.rewrite(new URL(`/${lang}/en-construccion`, request.url));
    }
  }

  // 3) La API no lleva idioma en la ruta.
  if (isApi) return NextResponse.next();

  // 4) Páginas: se sirven desde /[lang]/... sin cambiar la URL visible.
  const res = explicit ? NextResponse.next() : NextResponse.rewrite(new URL(`/${lang}${path}${url.search}`, request.url));
  if (explicit && cookieLang !== explicit) {
    res.cookies.set({ name: LANG_COOKIE, value: explicit, sameSite: "lax", path: "/", maxAge: LANG_MAX_AGE });
  }
  return res;
}

export const config = {
  // Todo menos archivos estáticos.
  matcher: ["/((?!_next/|brand/|products/|media/|favicon.ico|robots.txt|sitemap.xml|sw.js|manifest.webmanifest).*)"],
};
