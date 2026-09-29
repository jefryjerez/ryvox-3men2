"use client";

import { useState } from "react";
import { useT } from "@/i18n/client";
import { locales, type Locale } from "@/i18n/config";
import { cn } from "@/lib/format";

/** ES | EN. Guarda la cookie de idioma y recarga la misma página. */
export function LanguageSwitch({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  const { locale, t } = useT();
  const [busy, setBusy] = useState(false);

  async function change(l: Locale) {
    if (l === locale || busy) return;
    setBusy(true);
    await fetch(`/api/lang?set=${l}`, { method: "POST" }).catch(() => null);
    window.location.reload();
  }

  return (
    <nav aria-label={t.nav.language} className={cn("inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider", className)}>
      {locales.map((l, i) => (
        <span key={l} className="inline-flex items-center">
          {i > 0 && <span className={tone === "dark" ? "mx-1 text-black/25" : "mx-1 text-white/25"}>/</span>}
          <button
            type="button"
            onClick={() => change(l)}
            aria-current={l === locale ? "true" : undefined}
            disabled={busy}
            className={cn(
              "rounded-full px-2 py-1 transition-colors",
              l === locale ? (tone === "dark" ? "bg-black text-white" : "bg-white text-black") : tone === "dark" ? "text-black/50 hover:text-black" : "text-white/50 hover:text-white",
            )}
          >
            {l}
          </button>
        </span>
      ))}
    </nav>
  );
}
