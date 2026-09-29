export type FormatLocale = "es" | "en";

const INTL: Record<FormatLocale, string> = { es: "es-US", en: "en-US" };

export function money(cents: number, currency = "USD", locale: FormatLocale = "es") {
  return new Intl.NumberFormat(INTL[locale], {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function shortDate(iso: string, locale: FormatLocale = "es") {
  return new Intl.DateTimeFormat(INTL[locale], {
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

export function longDate(iso: string, locale: FormatLocale = "es") {
  return new Intl.DateTimeFormat(INTL[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function pct(n: number) {
  const sign = n > 0 ? "+" : "";
  return sign + n + "%";
}

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
