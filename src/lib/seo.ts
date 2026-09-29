import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";

/** URL pública del sitio (se fija en la compilación desde .env.production). */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ryvoxshop.com";
export const SITE_NAME = "RYVOX";
export const OG_IMAGE = { url: "/brand/og-image.png", width: 1200, height: 630 };

interface PageMetaOptions {
  title: string;
  description: string;
  /** Título tal cual, sin la plantilla "%s · RYVOX". */
  absoluteTitle?: boolean;
  image?: { url: string; width: number; height: number };
  imageAlt?: string;
  noIndex?: boolean;
  keywords?: string[];
}

export function ogLocale(lang: Locale) {
  return lang === "es" ? "es_US" : "en_US";
}

/**
 * Metadatos completos de una página pública: canónica por idioma, hreflang es/en,
 * Open Graph (WhatsApp, Instagram, Facebook) y Twitter Card.
 * `path` va sin prefijo de idioma, p. ej. "/productos/plantilla-hairline-beard".
 */
export function pageMeta(lang: Locale, path: string, o: PageMetaOptions): Metadata {
  const url = `${SITE_URL}/${lang}${path}`;
  const image = o.image ?? OG_IMAGE;
  const alt = o.imageAlt ?? o.title;
  return {
    title: o.absoluteTitle ? { absolute: o.title } : o.title,
    description: o.description,
    keywords: o.keywords,
    alternates: {
      canonical: url,
      languages: { es: `${SITE_URL}/es${path}`, en: `${SITE_URL}/en${path}`, "x-default": `${SITE_URL}/en${path}` },
    },
    openGraph: {
      type: "website",
      url,
      siteName: SITE_NAME,
      locale: ogLocale(lang),
      alternateLocale: [ogLocale(lang === "es" ? "en" : "es")],
      title: o.title,
      description: o.description,
      images: [{ url: image.url, width: image.width, height: image.height, alt }],
    },
    twitter: { card: "summary_large_image", title: o.title, description: o.description, images: [image.url] },
    robots: o.noIndex ? { index: false, follow: false } : { index: true, follow: true },
  };
}

export function absoluteUrl(path: string) {
  return path.startsWith("http") ? path : `${SITE_URL}${path}`;
}
