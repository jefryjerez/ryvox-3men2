"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Dictionary, Locale } from "./config";
import { fill } from "./config";
import { money as fmtMoney, shortDate as fmtShortDate, longDate as fmtLongDate } from "@/lib/format";

interface Ctx {
  locale: Locale;
  t: Dictionary;
  f: typeof fill;
  money: (cents: number) => string;
  shortDate: (iso: string) => string;
  longDate: (iso: string) => string;
}

const LocaleContext = createContext<Ctx | null>(null);

export function LocaleProvider({ locale, dict, children }: { locale: Locale; dict: Dictionary; children: ReactNode }) {
  const value: Ctx = {
    locale,
    t: dict,
    f: fill,
    money: (c) => fmtMoney(c, "USD", locale),
    shortDate: (iso) => fmtShortDate(iso, locale),
    longDate: (iso) => fmtLongDate(iso, locale),
  };
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/** Diccionario y formateadores del idioma activo. */
export function useT(): Ctx {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useT debe usarse dentro de LocaleProvider");
  return ctx;
}
