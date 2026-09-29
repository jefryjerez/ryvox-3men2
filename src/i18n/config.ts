import { es, type Dictionary } from "./es";
import { en } from "./en";

export const locales = ["es", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
export const LANG_COOKIE = "ryvox_lang";

export function isLocale(x: string | undefined | null): x is Locale {
  return !!x && (locales as readonly string[]).includes(x);
}

const dictionaries: Record<Locale, Dictionary> = { es, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}

/** Rellena {n}, {name}, {amount}… */
export function fill(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? String(vars[k]) : `{${k}}`));
}

/** Elige el idioma a partir del encabezado Accept-Language: español si aparece antes que inglés. */
export function localeFromAcceptLanguage(header: string | null): Locale {
  if (!header) return defaultLocale;
  const langs = header
    .split(",")
    .map((part, i) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: tag.toLowerCase(), q: q ? Number(q) : 1 - i * 0.001 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { tag } of langs) {
    if (tag.startsWith("es")) return "es";
    if (tag.startsWith("en")) return "en";
  }
  return defaultLocale;
}

export type { Dictionary };
