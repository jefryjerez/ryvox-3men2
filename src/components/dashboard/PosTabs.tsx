"use client";

import { useState } from "react";
import { PageHeader } from "@/components/dashboard/ui";
import { PosCart } from "@/components/dashboard/PosCart";
import { WholesaleOrderForm } from "@/components/dashboard/WholesaleOrderForm";
import { cn } from "@/lib/format";
import { useT } from "@/i18n/client";

/** Venta en persona: venta normal (QR) o cobro al por mayor con precios acordados (QR o enlace por correo). */
export function PosTabs() {
  const { t } = useT();
  const p = t.dash.pos;
  const [mode, setMode] = useState<"sale" | "wholesale">("sale");
  // Al terminar un cobro al por mayor se reinicia el formulario con una clave nueva.
  const [formKey, setFormKey] = useState(0);

  const tab = (value: typeof mode, label: string) => (
    <button
      type="button"
      onClick={() => setMode(value)}
      className={cn("rounded-full px-4 py-1.5 text-[13px] font-medium transition", mode === value ? "bg-black text-white" : "text-black/60 hover:text-black")}
    >
      {label}
    </button>
  );

  return (
    <>
      <PageHeader title={p.title} subtitle={p.subtitle} />
      <div className="mb-4 inline-flex rounded-full border border-line bg-white p-1">
        {tab("sale", p.tabSale)}
        {tab("wholesale", p.tabWholesale)}
      </div>
      {mode === "sale" ? <PosCart hideHeader /> : <WholesaleOrderForm key={formKey} onClose={() => setFormKey((k) => k + 1)} />}
    </>
  );
}
