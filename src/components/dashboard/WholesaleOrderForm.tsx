"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import QRCode from "qrcode";
import { Check, Copy, Mail, Plus, RotateCcw, X } from "lucide-react";
import { AddressAutocomplete } from "@/components/store/AddressAutocomplete";
import { Card } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/Button";
import { productColors } from "@/lib/colors";
import { useAdmin } from "@/store/admin";
import { useT } from "@/i18n/client";

const input = "h-11 w-full rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-black";

export interface WholesaleInitial {
  requestId: string;
  name: string;
  email: string;
  phone: string;
  customerMessage: string;
  address?: { line1: string; line2?: string; city: string; region: string; zip: string; country: string } | null;
  lines: { productId: string; qty: number; color?: string | null }[];
}

interface Line {
  key: number;
  productId: string;
  color: string;
  qty: string;
  price: string;
}

interface Charge {
  orderId: string;
  number: string;
  intentId: string;
  payUrl: string;
  total: number;
}

const toCents = (v: string) => Math.round((parseFloat(v.replace(",", ".")) || 0) * 100);

/** Cobro al por mayor: productos con el precio acordado + datos del cliente; genera QR/enlace de pago (copiar o mandar por correo). */
export function WholesaleOrderForm({ initial, onClose, onChanged }: { initial?: WholesaleInitial; onClose?: () => void; onChanged?: () => void }) {
  const { t, f, money, locale } = useT();
  const w = t.dash.wholesale;
  const fm = w.form;
  const allProducts = useAdmin((s) => s.products);
  const products = useMemo(() => allProducts.filter((p) => p.active && !p.comingSoon), [allProducts]);

  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [address, setAddress] = useState({
    line1: initial?.address?.line1 ?? "",
    line2: initial?.address?.line2 ?? "",
    city: initial?.address?.city ?? "",
    region: initial?.address?.region ?? "",
    zip: initial?.address?.zip ?? "",
    country: initial?.address?.country ?? "Estados Unidos",
  });
  const [message, setMessage] = useState("");
  const [lines, setLines] = useState<Line[]>(() =>
    initial?.lines.length
      ? initial.lines.map((l, i) => ({ key: i + 1, productId: l.productId, color: l.color ?? "", qty: String(l.qty), price: "" }))
      : [{ key: 1, productId: "", color: "", qty: "1", price: "" }],
  );
  const [lineSeq, setLineSeq] = useState(() => (initial?.lines.length ?? 0) + 2);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [charge, setCharge] = useState<Charge | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mail, setMail] = useState<"idle" | "sending" | "sent">("idle");

  const setAddr = (k: keyof typeof address, v: string) => setAddress((prev) => ({ ...prev, [k]: v }));
  const setLine = (key: number, patch: Partial<Line>) => setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const subtotal = lines.reduce((s, l) => s + (Math.floor(Number(l.qty)) || 0) * toCents(l.price), 0);
  const ready =
    !!(name && email && address.line1 && address.city && address.region && address.zip) &&
    lines.length > 0 &&
    lines.every((l) => l.productId && (productColors(products.find((x) => x.id === l.productId) ?? {}).length < 2 || l.color) && Number(l.qty) >= 1 && toCents(l.price) >= 1);

  async function generate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/wholesale/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          requestId: initial?.requestId,
          name,
          email,
          phone,
          message,
          lang: locale,
          address,
          lines: lines.map((l) => ({ productId: l.productId, color: l.color || undefined, qty: Math.floor(Number(l.qty)), unitPrice: toCents(l.price) })),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as Partial<Charge> & { error?: string };
      if (!res.ok || !data.payUrl || !data.orderId || !data.intentId || !data.number) throw new Error(data.error ?? t.dash.pos.error);
      setCharge({ orderId: data.orderId, number: data.number, intentId: data.intentId, payUrl: data.payUrl, total: data.total ?? subtotal });
      setQr(await QRCode.toDataURL(data.payUrl, { width: 320, margin: 1, color: { dark: "#000000", light: "#ffffff" } }));
      onChanged?.();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // Mientras se muestra el cobro, pregunta cada 3 s si ya se pagó.
  useEffect(() => {
    if (!charge || paid) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const check = async () => {
      try {
        const res = await fetch(`/api/pos/${charge.intentId}`);
        const data = (await res.json().catch(() => ({}))) as { paid?: boolean };
        if (!cancelled && data.paid) {
          setPaid(true);
          onChanged?.();
          return;
        }
      } catch {
        // red intermitente: se reintenta en el próximo ciclo
      }
      if (!cancelled) timer = setTimeout(check, 3000);
    };
    timer = setTimeout(check, 3000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [charge, paid, onChanged]);

  async function copyLink() {
    if (!charge) return;
    await navigator.clipboard.writeText(charge.payUrl).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function sendEmail() {
    if (!charge) return;
    setMail("sending");
    setError(null);
    try {
      const res = await fetch(`/api/admin/wholesale/orders/${charge.orderId}/send`, { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? t.dash.pos.error);
      setMail("sent");
    } catch (err) {
      setError((err as Error).message);
      setMail("idle");
    }
  }

  if (charge) {
    const r = w.result;
    return (
      <Card className="mx-auto max-w-md p-6 text-center">
        {paid ? (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-black text-white">
              <Check size={26} />
            </div>
            <p className="mt-4 text-lg font-semibold">{r.paid}</p>
            <p className="mt-1 text-sm text-black/55">
              {f(t.checkout.order, { n: charge.number })} · {money(charge.total)}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold">
              {r.title} · {f(t.checkout.order, { n: charge.number })}
            </p>
            <p className="display mt-1 text-2xl tabular-nums">{money(charge.total)}</p>
            <p className="mt-3 text-xs text-black/55">{r.scan}</p>
            {qr && <img src={qr} alt="QR" width={220} height={220} className="mx-auto mt-3 rounded-2xl border border-line" />}
            <p className="mt-4 text-xs text-black/45">{r.orLink}</p>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={copyLink} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line px-3 py-2 text-xs font-medium hover:bg-black/5">
                {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? w.copied : w.copyLink}
              </button>
              <button
                type="button"
                onClick={sendEmail}
                disabled={mail === "sending"}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line px-3 py-2 text-xs font-medium hover:bg-black/5 disabled:opacity-50"
              >
                {mail === "sent" ? <Check size={13} /> : <Mail size={13} />} {mail === "sending" ? w.sending : mail === "sent" ? w.sent : r.sendEmail}
              </button>
            </div>
            {mail === "sent" && <p className="mt-2 text-xs text-black/50">{f(r.sentTo, { email })}</p>}
            {error && <p className="mt-3 text-sm font-medium text-alert">{error}</p>}
            <p className="mt-5 flex items-center justify-center gap-2 text-xs text-black/50">
              <span className="h-2 w-2 animate-pulse rounded-full bg-black/40" /> {r.waiting}
            </p>
          </>
        )}
        <Button type="button" variant="secondary" className="mt-6 w-full" onClick={onClose}>
          <RotateCcw size={14} /> {paid ? r.newCharge : r.done}
        </Button>
      </Card>
    );
  }

  return (
    <form onSubmit={generate} className="space-y-4">
      {initial?.customerMessage && (
        <Card className="p-4">
          <p className="text-[11px] uppercase tracking-wider text-black/45">{w.customerMessage}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm">{initial.customerMessage}</p>
        </Card>
      )}

      <Card className="p-5">
        <h2 className="text-[15px] font-semibold tracking-tight">{fm.customer}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-black/60">{fm.name}</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required className={input} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-black/60">{fm.email}</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={input} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-black/60">{fm.phone}</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={input} />
          </label>
        </div>

        <h2 className="mt-6 text-[15px] font-semibold tracking-tight">{fm.address}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <AddressAutocomplete
              label={fm.line1}
              value={address.line1}
              onChange={(v) => setAddr("line1", v)}
              onSelectAddress={(a) => setAddress((prev) => ({ ...prev, line1: a.line1, city: a.city, region: a.region, zip: a.zip, country: a.country || prev.country }))}
            />
          </div>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-xs font-medium text-black/60">{fm.line2}</span>
            <input value={address.line2} onChange={(e) => setAddr("line2", e.target.value)} className={input} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-black/60">{fm.city}</span>
            <input value={address.city} onChange={(e) => setAddr("city", e.target.value)} required className={input} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-black/60">{fm.region}</span>
            <input value={address.region} onChange={(e) => setAddr("region", e.target.value)} placeholder="NY" required className={input} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-black/60">{fm.zip}</span>
            <input value={address.zip} onChange={(e) => setAddr("zip", e.target.value)} required className={input} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-black/60">{fm.country}</span>
            <input value={address.country} onChange={(e) => setAddr("country", e.target.value)} className={input} />
          </label>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-[15px] font-semibold tracking-tight">{fm.products}</h2>
        <ul className="mt-4 space-y-3">
          {lines.map((l) => {
            const p = products.find((x) => x.id === l.productId);
            const colors = p ? productColors(p) : [];
            const lineTotal = (Math.floor(Number(l.qty)) || 0) * toCents(l.price);
            return (
              <li key={l.key} className="rounded-2xl border border-line p-3">
                <div className="flex flex-wrap items-end gap-3">
                  <label className="block min-w-[12rem] flex-1">
                    <span className="mb-1.5 block text-xs font-medium text-black/60">{fm.product}</span>
                    <select value={l.productId} onChange={(e) => setLine(l.key, { productId: e.target.value, color: "" })} required className={input}>
                      <option value="">{fm.pick}</option>
                      {products.map((prod) => (
                        <option key={prod.id} value={prod.id}>
                          {prod.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  {colors.length > 1 && (
                    <label className="block w-36">
                      <span className="mb-1.5 block text-xs font-medium text-black/60">{fm.color}</span>
                      <select value={l.color} onChange={(e) => setLine(l.key, { color: e.target.value })} required className={input}>
                        <option value="">{fm.pickColor}</option>
                        {colors.map((c) => (
                          <option key={c} value={c}>
                            {t.colors[c]}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <label className="block w-24">
                    <span className="mb-1.5 block text-xs font-medium text-black/60">{fm.qty}</span>
                    <input type="number" min={1} step={1} value={l.qty} onChange={(e) => setLine(l.key, { qty: e.target.value })} required className={input} />
                  </label>
                  <label className="block w-32">
                    <span className="mb-1.5 block text-xs font-medium text-black/60">{fm.unitPrice}</span>
                    <input type="number" min={0.01} step="0.01" inputMode="decimal" value={l.price} onChange={(e) => setLine(l.key, { price: e.target.value })} required className={input} />
                  </label>
                  <button
                    type="button"
                    aria-label={fm.removeProduct}
                    onClick={() => setLines((prev) => (prev.length > 1 ? prev.filter((x) => x.key !== l.key) : prev))}
                    disabled={lines.length === 1}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-black/5 disabled:opacity-30"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-black/50">
                  <span>{p ? f(fm.retail, { price: money(p.price), stock: p.stock }) : ""}</span>
                  <span className="font-medium tabular-nums text-black/70">{lineTotal > 0 ? money(lineTotal) : ""}</span>
                </div>
              </li>
            );
          })}
        </ul>
        <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={() => {
            setLines((prev) => [...prev, { key: lineSeq, productId: "", color: "", qty: "1", price: "" }]);
            setLineSeq((n) => n + 1);
          }}>
          <Plus size={14} /> {fm.addProduct}
        </Button>

        <label className="mt-6 block">
          <span className="mb-1.5 block text-xs font-medium text-black/60">{fm.message}</span>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} maxLength={1500} className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-black" />
          <span className="mt-1 block text-[11px] text-black/45">{fm.messageHint}</span>
        </label>

        <div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-base font-semibold">
          <span>{fm.subtotal}</span>
          <span className="tabular-nums">{money(subtotal)}</span>
        </div>
        <p className="mt-1 text-[11px] text-black/45">{fm.taxNote}</p>
        {error && <p className="mt-3 text-sm font-medium text-alert">{error}</p>}
        <div className="mt-4 flex gap-2">
          <Button type="submit" size="lg" className="flex-1" disabled={busy || !ready} title={ready ? undefined : fm.needProduct}>
            {busy ? fm.generating : fm.generate}
          </Button>
          {onClose && (
            <Button type="button" size="lg" variant="ghost" disabled={busy} onClick={onClose}>
              {t.common.cancel}
            </Button>
          )}
        </div>
      </Card>
    </form>
  );
}
