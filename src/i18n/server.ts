import { defaultLocale, getDictionary, isLocale, type Locale } from "./config";

/** Para páginas y layouts de servidor: idioma y diccionario a partir del segmento [lang]. */
export function localeOf(lang: string): Locale {
  return isLocale(lang) ? lang : defaultLocale;
}

export function dict(lang: string) {
  const locale = localeOf(lang);
  return { locale, t: getDictionary(locale) };
}
