"use client";

import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Printer, X } from "lucide-react";
import { useAdmin } from "@/store/admin";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/format";
import { useT } from "@/i18n/client";

type Mode = "auto" | "manual";

export function ShipDialog({ open, onClose, orderId }: { open: boolean; onClose: () => void; orderId: string }) {
  const { t } = useT();
  const s = t.dash.ship;
  const markShipped = useAdmin((x) => x.markShipped);
  const [mode, setMode] = useState<Mode>("auto");
  const [carrier, setCarrier] = useState("UPS");
  const [tracking, setTracking] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await markShipped(orderId, mode === "auto" ? { auto: true } : { carrier, tracking: tracking.trim() });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      if (mode === "auto") setMode("manual");
      return;
    }
    setTracking("");
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button key="bd" aria-label={t.common.close} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
          <motion.div
            key="dlg"
            role="dialog"
            aria-modal="true"
            aria-label={s.title}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-4 bottom-4 z-50 rounded-3xl bg-white p-6 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">{s.title}</h2>
              <button type="button" onClick={onClose} aria-label={t.common.close} className="text-black/50 hover:text-black">
                <X size={20} />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 rounded-full bg-mist p-1 text-sm">
              {(["auto", "manual"] as Mode[]).map((m) => (
                <button key={m} type="button" onClick={() => setMode(m)} className={cn("rounded-full py-2 font-medium transition-colors", mode === m ? "bg-black text-white" : "text-black/60")}>
                  {m === "auto" ? s.auto : s.manual}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="mt-5 space-y-4">
              {mode === "auto" ? (
                <p className="rounded-xl bg-mist p-4 text-sm text-black/65">
                  <Printer size={14} className="mr-1 inline" /> {s.autoText}
                </p>
              ) : (
                <>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-black/60">{s.carrier}</span>
                    <select value={carrier} onChange={(e) => setCarrier(e.target.value)} className="h-11 w-full rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-black">
                      {["UPS", "USPS", "FedEx", "DHL"].map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-black/60">{s.tracking}</span>
                    <input value={tracking} onChange={(e) => setTracking(e.target.value)} required placeholder="1Z999AA10123456784" className="h-11 w-full rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-black" />
                  </label>
                </>
              )}
              {error && <p className="text-sm font-medium text-alert">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={onClose}>
                  {t.common.cancel}
                </Button>
                <Button type="submit" disabled={busy}>
                  {busy ? s.processing : mode === "auto" ? s.buy : s.confirm}
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
