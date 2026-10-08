"use client";

import { useRef, useState, type FormEvent } from "react";
import { Check, Plus, X } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { AddressAutocomplete } from "@/components/store/AddressAutocomplete";
import { Button } from "@/components/ui/Button";
import type { ColorId } from "@/lib/colors";
import { useT } from "@/i18n/client";

const input = "h-12 w-full rounded-xl border border-black/15 bg-white px-4 text-sm outline-none transition-colors placeholder:text-black/35 focus:border-black";

interface Line {
  key: number;
  productId: string;
  color: string;
  qty: string;
}

/** Formulario de compra al por mayor en el inicio: el dueño recibe la solicitud en el panel y responde con el precio. */
export function WholesaleForm({ products }: { products: { id: string; name: string; colors: ColorId[] }[] }) {
  const { t, locale } = useT();
  const w = t.wholesale;
  const c = t.checkout;
  const nextKey = useRef(2);
  const [lines, setLines] = useState<Line[]>([{ key: 1, productId: "", color: "", qty: "1" }]);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", website: "" });
  const [address, setAddress] = useState({ line1: "", line2: "", city: "", region: "", zip: "", country: t.checkout.countryDefault });
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  // El formulario es largo: la sección muestra solo el botón y lo despliega al tocarlo.
  const [open, setOpen] = useState(false);

  const setLine = (key: number, patch: Partial<Line>) => setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const setAddr = (k: keyof typeof address, v: string) => setAddress((prev) => ({ ...prev, [k]: v }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setState("sending");
    try {
      const res = await fetch("/api/wholesale", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          lang: locale,
          address,
          items: lines.map((l) => ({ productId: l.productId, color: l.color || undefined, qty: Math.floor(Number(l.qty)) })),
        }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <section id="mayoreo" className="scroll-mt-24 bg-mist">
      <div className="container-x mx-auto max-w-[1400px] py-24 md:py-32">
        <div className="grid gap-12 md:grid-cols-12">
          <Reveal className={open ? "md:col-span-5" : "md:col-span-12"}>
            <p className="eyebrow text-black/50">{w.eyebrow}</p>
            <h2 className="display mt-5 text-[clamp(2.4rem,6vw,4.6rem)] uppercase">{w.title}</h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-black/65">{w.subtitle}</p>
            {!open && (
              <Button type="button" size="lg" className="mt-8" onClick={() => setOpen(true)}>
                {w.open}
              </Button>
            )}
          </Reveal>

          {open && (
          <Reveal delay={0.1} className="md:col-span-7">
            {state === "done" ? (
              <div className="rounded-3xl bg-white p-8 md:p-10">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
                  <Check size={22} />
                </span>
                <p className="mt-5 text-lg font-semibold tracking-tight">{w.done}</p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-6 rounded-3xl bg-white p-6 md:p-10">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-black/60">{w.name}</span>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoComplete="name" className={input} />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-black/60">{w.phone}</span>
                    <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required autoComplete="tel" className={input} />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="mb-1.5 block text-xs font-medium text-black/60">{w.email}</span>
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required autoComplete="email" className={input} />
                  </label>
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium text-black/60">{c.address}</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <AddressAutocomplete
                        label={c.line1}
                        value={address.line1}
                        onChange={(v) => setAddr("line1", v)}
                        onSelectAddress={(a) => setAddress((prev) => ({ ...prev, line1: a.line1, city: a.city, region: a.region, zip: a.zip, country: a.country || prev.country }))}
                      />
                    </div>
                    <label className="block sm:col-span-2">
                      <span className="mb-1.5 block text-xs font-medium text-black/60">{c.line2}</span>
                      <input value={address.line2} onChange={(e) => setAddr("line2", e.target.value)} autoComplete="address-line2" className={input} />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-black/60">{c.city}</span>
                      <input value={address.city} onChange={(e) => setAddr("city", e.target.value)} required autoComplete="address-level2" className={input} />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-black/60">{c.region}</span>
                      <input value={address.region} onChange={(e) => setAddr("region", e.target.value)} required placeholder="NY" autoComplete="address-level1" className={input} />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-black/60">{c.zip}</span>
                      <input value={address.zip} onChange={(e) => setAddr("zip", e.target.value)} required autoComplete="postal-code" className={input} />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-black/60">{c.country}</span>
                      <input value={address.country} onChange={(e) => setAddr("country", e.target.value)} autoComplete="country-name" className={input} />
                    </label>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium text-black/60">{w.products}</p>
                  <ul className="space-y-3">
                    {lines.map((l) => {
                      const p = products.find((x) => x.id === l.productId);
                      const needsColor = !!p && p.colors.length > 1;
                      return (
                        <li key={l.key} className="flex flex-wrap items-end gap-2">
                          <select
                            aria-label={w.product}
                            value={l.productId}
                            onChange={(e) => setLine(l.key, { productId: e.target.value, color: "" })}
                            required
                            className={`${input} min-w-[12rem] flex-1`}
                          >
                            <option value="">{w.choose}</option>
                            {products.map((prod) => (
                              <option key={prod.id} value={prod.id}>
                                {prod.name}
                              </option>
                            ))}
                          </select>
                          {needsColor && (
                            <select aria-label={w.color} value={l.color} onChange={(e) => setLine(l.key, { color: e.target.value })} required className={`${input} w-40`}>
                              <option value="">{w.chooseColor}</option>
                              {p.colors.map((col) => (
                                <option key={col} value={col}>
                                  {t.colors[col]}
                                </option>
                              ))}
                            </select>
                          )}
                          <input type="number" aria-label={w.qty} min={1} max={100000} step={1} value={l.qty} onChange={(e) => setLine(l.key, { qty: e.target.value })} required className={`${input} w-24`} />
                          <button
                            type="button"
                            aria-label={w.remove}
                            disabled={lines.length === 1}
                            onClick={() => setLines((prev) => prev.filter((x) => x.key !== l.key))}
                            className="inline-flex h-12 w-10 items-center justify-center rounded-full hover:bg-black/5 disabled:opacity-30"
                          >
                            <X size={16} />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  {lines.length < 20 && (
                    <button
                      type="button"
                      onClick={() => setLines((prev) => [...prev, { key: nextKey.current++, productId: "", color: "", qty: "1" }])}
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-black/70 hover:text-black"
                    >
                      <Plus size={15} /> {w.add}
                    </button>
                  )}
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-black/60">{w.message}</span>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    rows={4}
                    maxLength={1500}
                    placeholder={w.messagePlaceholder}
                    className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm outline-none placeholder:text-black/35 focus:border-black"
                  />
                </label>
                <input type="text" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="hidden" aria-hidden />

                {state === "error" && <p className="text-sm font-medium text-alert">{w.error}</p>}
                <div className="flex flex-wrap gap-3">
                  <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={state === "sending"}>
                    {state === "sending" ? w.sending : w.submit}
                  </Button>
                  <Button type="button" size="lg" variant="ghost" disabled={state === "sending"} onClick={() => setOpen(false)}>
                    {t.common.cancel}
                  </Button>
                </div>
              </form>
            )}
          </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
