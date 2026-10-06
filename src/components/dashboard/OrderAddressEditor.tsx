"use client";

import { useState, type FormEvent } from "react";
import { Pencil } from "lucide-react";
import { AddressAutocomplete } from "@/components/store/AddressAutocomplete";
import { Button } from "@/components/ui/Button";
import { useAdmin } from "@/store/admin";
import type { Order } from "@/lib/orders";
import { useT } from "@/i18n/client";

const input = "h-10 w-full rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-black";

/** Dirección de envío de la orden, con modo de edición para corregir lo que el cliente escribió mal. */
export function OrderAddressEditor({ order }: { order: Order }) {
  const { t } = useT();
  const d = t.dash.order;
  const editOrderContact = useAdmin((s) => s.editOrderContact);
  const a = order.shippingAddress;
  // Una vez enviada o cancelada, el paquete ya salió con la dirección anterior: ya no tiene caso cambiarla.
  const locked = order.status === "enviado" || order.status === "entregado" || order.status === "cancelado";
  const labelBought = !!(order.labelUrl || order.shippoTransactionId);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ name: "", line1: "", line2: "", city: "", region: "", zip: "", country: "", phone: "", email: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof draft, v: string) => setDraft((prev) => ({ ...prev, [k]: v }));

  function startEdit() {
    setDraft({ name: a.name, line1: a.line1, line2: a.line2 ?? "", city: a.city, region: a.region, zip: a.zip, country: a.country, phone: a.phone ?? "", email: order.email ?? "" });
    setError(null);
    setEditing(true);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { email, ...address } = draft;
    const res = await editOrderContact(order.id, { email, shippingAddress: address });
    setBusy(false);
    if (res.ok) setEditing(false);
    else setError(res.error);
  }

  if (!editing) {
    return (
      <>
        <div className="flex items-center justify-between">
          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-black/60">{d.shipTo}</p>
          {!locked && (
            <button type="button" onClick={startEdit} aria-label={d.editAddress} title={d.editAddress} className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-black/5">
              <Pencil size={14} />
            </button>
          )}
        </div>
        <address className="mt-2 text-sm not-italic leading-relaxed">
          {a.name}
          <br />
          {a.line1}
          {a.line2 && (
            <>
              <br />
              {a.line2}
            </>
          )}
          <br />
          {a.city}, {a.region} {a.zip}
          <br />
          {a.country}
          {a.phone && (
            <>
              <br />
              {a.phone}
            </>
          )}
        </address>
        {locked && <p className="mt-2 text-[11px] text-black/45">{d.lockedAddress}</p>}
      </>
    );
  }

  const field = (k: keyof typeof draft, label: string, required = true) => (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-black/60">{label}</span>
      <input value={draft[k]} onChange={(e) => set(k, e.target.value)} required={required} type={k === "email" ? "email" : "text"} className={input} />
    </label>
  );

  return (
    <form onSubmit={save} className="space-y-3">
      <p className="text-sm font-semibold">{d.editAddress}</p>
      {labelBought && <p className="rounded-xl bg-mist p-3 text-xs leading-relaxed">{d.labelWarning}</p>}
      {field("name", d.addrName)}
      <AddressAutocomplete
        label={d.addrLine1}
        value={draft.line1}
        onChange={(v) => set("line1", v)}
        onSelectAddress={(p) => setDraft((prev) => ({ ...prev, line1: p.line1, city: p.city, region: p.region, zip: p.zip, country: p.country || prev.country }))}
      />
      {field("line2", d.addrLine2, false)}
      <div className="grid grid-cols-2 gap-3">
        {field("city", d.addrCity)}
        {field("region", d.addrRegion)}
        {field("zip", d.addrZip)}
        {field("country", d.addrCountry)}
      </div>
      {field("phone", d.addrPhone, false)}
      {field("email", d.editEmail)}
      {error && <p className="text-sm font-medium text-alert">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={busy}>
          {busy ? t.common.saving : t.common.save}
        </Button>
        <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => setEditing(false)}>
          {t.common.cancel}
        </Button>
      </div>
    </form>
  );
}
