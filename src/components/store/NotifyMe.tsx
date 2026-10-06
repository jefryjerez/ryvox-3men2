"use client";

import { useState, type FormEvent } from "react";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useT } from "@/i18n/client";

/** Botón "Notificarme": al tocarlo pide el correo para avisar cuando un producto "Próximamente" salga a la venta. */
export function NotifyMe({ productId }: { productId: string }) {
  const { t, locale } = useT();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setState("sending");
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, productId, lang: locale, website }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p className="inline-flex items-center gap-2 rounded-2xl bg-mist px-4 py-3 text-sm font-medium">
        <Check size={16} /> {t.product.notifyDone}
      </p>
    );
  }

  if (!open) {
    return (
      <Button type="button" size="lg" onClick={() => setOpen(true)}>
        <Bell size={18} /> {t.product.notifyButton}
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.product.notifyPlaceholder}
          autoComplete="email"
          className="h-14 min-w-0 flex-1 rounded-full border border-black/15 bg-white px-5 text-sm outline-none placeholder:text-black/35 focus:border-black"
        />
        <input type="text" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} className="hidden" aria-hidden />
        <Button type="submit" size="lg" disabled={state === "sending"}>
          {state === "sending" ? t.product.notifySending : t.product.notifySend}
        </Button>
      </div>
      {state === "error" && <p className="text-xs font-medium text-alert">{t.product.notifyError}</p>}
    </form>
  );
}
