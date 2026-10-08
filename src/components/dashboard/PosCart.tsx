"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Minus, Plus, Share2, Copy, Check, RotateCcw, Gift } from "lucide-react";
import { useAdmin } from "@/store/admin";
import { Card, PageHeader } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/Button";
import { AddressAutocomplete } from "@/components/store/AddressAutocomplete";
import { cn } from "@/lib/format";
import { useT } from "@/i18n/client";

const input = "h-11 w-full rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-black";

interface Line {
  productId: string;
  name: string;
  price: number;
  image: string;
  qty: number;
  stock: number;
}

interface Charge {
  number: string;
  payUrl: string;
  intentId: string;
}

interface GiftAddress {
  line1: string;
  line2: string;
  city: string;
  region: string;
  zip: string;
  country: string;
  phone: string;
}

const emptyGiftAddress: GiftAddress = { line1: "", line2: "", city: "", region: "", zip: "", country: "Estados Unidos", phone: "" };

export function PosCart({ hideHeader = false }: { hideHeader?: boolean }) {
  const { t, f, money, locale } = useT();
  const p = t.dash.pos;
  const allProducts = useAdmin((s) => s.products);
  const products = useMemo(() => allProducts.filter((x) => x.active), [allProducts]);
  const [lines, setLines] = useState<Line[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [charge, setCharge] = useState<Charge | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isGift, setIsGift] = useState(false);
  const [giftAddress, setGiftAddress] = useState<GiftAddress>(emptyGiftAddress);
  const [giftDone, setGiftDone] = useState<{ number: string } | null>(null);

  const total = useMemo(() => lines.reduce((s, l) => s + l.price * l.qty, 0), [lines]);
  function setGift<K extends keyof GiftAddress>(key: K, value: GiftAddress[K]) {
    setGiftAddress((prev) => ({ ...prev, [key]: value }));
  }
  const giftAddressReady = !!(giftAddress.line1 && giftAddress.city && giftAddress.region && giftAddress.zip);

  function add(prod: (typeof products)[number]) {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === prod.id);
      if (existing) return prev.map((l) => (l.productId === prod.id ? { ...l, qty: Math.min(l.qty + 1, prod.stock) } : l));
      return [...prev, { productId: prod.id, name: prod.name, price: prod.price, image: prod.image, qty: 1, stock: prod.stock }];
    });
  }
  function setQty(id: string, qty: number) {
    setLines((prev) => (qty <= 0 ? prev.filter((l) => l.productId !== id) : prev.map((l) => (l.productId === id ? { ...l, qty: Math.min(qty, l.stock) } : l))));
  }

  async function generateCharge() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/pos/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          lines: lines.map((l) => ({ productId: l.productId, qty: l.qty })),
          customerName: name || undefined,
          customerEmail: email || undefined,
          lang: locale,
          ...(isGift
            ? {
                isGift: true,
                shippingAddress: {
                  name,
                  line1: giftAddress.line1,
                  line2: giftAddress.line2 || undefined,
                  city: giftAddress.city,
                  region: giftAddress.region,
                  zip: giftAddress.zip,
                  country: giftAddress.country,
                  phone: giftAddress.phone || undefined,
                },
              }
            : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { number?: string; payUrl?: string; intentId?: string; gift?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? p.error);
      if (data.gift && data.number) {
        setGiftDone({ number: data.number });
        return;
      }
      if (!data.payUrl || !data.number || !data.intentId) throw new Error(data.error ?? p.error);
      setCharge({ number: data.number, payUrl: data.payUrl, intentId: data.intentId });
      setQr(await QRCode.toDataURL(data.payUrl, { width: 320, margin: 1, color: { dark: "#000000", light: "#ffffff" } }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // Mientras se muestra el QR, pregunta cada 3 s si ya se pagó; se detiene solo al pagar o al salir de esta vista.
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
  }, [charge, paid]);

  function reset() {
    setLines([]);
    setName("");
    setEmail("");
    setCharge(null);
    setQr(null);
    setPaid(false);
    setError(null);
    setIsGift(false);
    setGiftAddress(emptyGiftAddress);
    setGiftDone(null);
  }

  async function copyLink() {
    if (!charge) return;
    await navigator.clipboard.writeText(charge.payUrl).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function share() {
    if (!charge) return;
    if (navigator.share) await navigator.share({ title: "RYVOX", url: charge.payUrl }).catch(() => null);
    else await copyLink();
  }

  if (giftDone) {
    return (
      <>
        {!hideHeader && <PageHeader title={p.title} subtitle={p.subtitle} />}
        <Card className="mx-auto max-w-sm p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-black text-white">
            <Gift size={24} />
          </div>
          <p className="mt-4 text-lg font-semibold">{p.giftDoneTitle}</p>
          <p className="mt-1 text-sm text-black/55">{f(t.checkout.order, { n: giftDone.number })}</p>
          <p className="mt-3 text-sm text-black/60">{p.giftDoneHint}</p>
          <Button type="button" variant="secondary" className="mt-6 w-full" onClick={reset}>
            <RotateCcw size={14} /> {p.newSale}
          </Button>
        </Card>
      </>
    );
  }

  if (charge) {
    return (
      <>
        {!hideHeader && <PageHeader title={p.title} subtitle={p.subtitle} />}
        <Card className="mx-auto max-w-sm p-6 text-center">
          {paid ? (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-black text-white">
                <Check size={26} />
              </div>
              <p className="mt-4 text-lg font-semibold">{p.paid}</p>
              <p className="mt-1 text-sm text-black/55">
                {f(t.checkout.order, { n: charge.number })} · {money(total)}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold">{p.scanTitle}</p>
              <p className="mt-1 text-xs text-black/55">{p.scanHint}</p>
              {qr && <img src={qr} alt="QR" width={220} height={220} className="mx-auto mt-5 rounded-2xl border border-line" />}
              <p className="mt-4 text-xs text-black/45">{p.orLink}</p>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={copyLink} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line px-3 py-2 text-xs font-medium hover:bg-black/5">
                  <Copy size={13} /> {copied ? p.copied : p.copyLink}
                </button>
                <button type="button" onClick={share} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line px-3 py-2 text-xs font-medium hover:bg-black/5">
                  <Share2 size={13} /> {p.share}
                </button>
              </div>
              <p className="mt-5 flex items-center justify-center gap-2 text-xs text-black/50">
                <span className="h-2 w-2 animate-pulse rounded-full bg-black/40" /> {p.waiting}
              </p>
            </>
          )}
          <Button type="button" variant="secondary" className="mt-6 w-full" onClick={reset}>
            <RotateCcw size={14} /> {paid ? p.newSale : p.cancelSale}
          </Button>
        </Card>
      </>
    );
  }

  return (
    <>
      {!hideHeader && <PageHeader title={p.title} subtitle={p.subtitle} />}
      <div className="grid gap-4 xl:grid-cols-12">
        <Card className="p-5 xl:col-span-7">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {products.map((prod) => (
              <li key={prod.id}>
                <button
                  type="button"
                  onClick={() => add(prod)}
                  disabled={prod.stock === 0}
                  className="w-full rounded-2xl border border-line bg-white p-2.5 text-left transition-colors hover:border-black disabled:opacity-40"
                >
                  <span className="relative block aspect-square overflow-hidden rounded-xl bg-mist">
                    <Image src={prod.image} alt="" fill sizes="140px" className="object-contain p-2" />
                  </span>
                  <p className="mt-2 truncate text-xs font-medium">{prod.name}</p>
                  <p className="text-xs font-semibold tabular-nums">{money(prod.price)}</p>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5 xl:col-span-5">
          <h2 className="text-[15px] font-semibold tracking-tight">{p.cart}</h2>
          {lines.length === 0 ? (
            <p className="mt-4 text-sm text-black/50">{p.empty}</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {lines.map((l) => (
                <li key={l.productId} className="flex items-center gap-3 py-2.5">
                  <p className="min-w-0 flex-1 truncate text-sm">{l.name}</p>
                  <div className="inline-flex items-center rounded-full border border-line">
                    <button type="button" onClick={() => setQty(l.productId, l.qty - 1)} className="inline-flex h-8 w-8 items-center justify-center">
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center text-sm tabular-nums">{l.qty}</span>
                    <button type="button" onClick={() => setQty(l.productId, l.qty + 1)} disabled={l.qty >= l.stock} className="inline-flex h-8 w-8 items-center justify-center disabled:opacity-30">
                      <Plus size={14} />
                    </button>
                  </div>
                  <p className="w-16 text-right text-sm font-semibold tabular-nums">{money(l.price * l.qty)}</p>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 space-y-3 border-t border-line pt-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-black/60">{isGift ? p.giftRecipientName : p.customerName}</span>
              <input value={name} onChange={(e) => setName(e.target.value)} className={input} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-black/60">{isGift ? p.giftRecipientEmail : p.customerEmail}</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
            </label>

            <label className="flex items-center gap-2 rounded-xl border border-line px-3 py-2.5">
              <input type="checkbox" checked={isGift} onChange={(e) => setIsGift(e.target.checked)} className="h-4 w-4 accent-black" />
              <Gift size={14} className="text-black/60" />
              <span className="text-sm font-medium">{p.giftToggle}</span>
            </label>
            {isGift && <p className="text-xs text-black/50">{p.giftToggleHint}</p>}

            {isGift && (
              <div className="space-y-3 rounded-xl bg-mist p-3">
                <AddressAutocomplete
                  label={p.giftLine1}
                  value={giftAddress.line1}
                  onChange={(v) => setGift("line1", v)}
                  onSelectAddress={(a) => setGiftAddress((prev) => ({ ...prev, line1: a.line1, city: a.city, region: a.region, zip: a.zip, country: a.country || prev.country }))}
                />
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-black/60">{p.giftLine2}</span>
                  <input value={giftAddress.line2} onChange={(e) => setGift("line2", e.target.value)} className={input} />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-black/60">{p.giftCity}</span>
                    <input value={giftAddress.city} onChange={(e) => setGift("city", e.target.value)} className={input} />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-black/60">{p.giftRegion}</span>
                    <input value={giftAddress.region} onChange={(e) => setGift("region", e.target.value)} placeholder="NY" className={input} />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-black/60">{p.giftZip}</span>
                    <input value={giftAddress.zip} onChange={(e) => setGift("zip", e.target.value)} className={input} />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-black/60">{p.giftPhone}</span>
                    <input value={giftAddress.phone} onChange={(e) => setGift("phone", e.target.value)} className={input} />
                  </label>
                </div>
              </div>
            )}
          </div>

          {!isGift && (
            <div className={cn("mt-4 flex items-center justify-between border-t border-line pt-4 text-base font-semibold")}>
              <span>{p.total}</span>
              <span className="tabular-nums">{money(total)}</span>
            </div>
          )}
          {error && <p className="mt-3 text-sm font-medium text-alert">{error}</p>}
          <Button
            type="button"
            size="lg"
            className="mt-4 w-full"
            disabled={lines.length === 0 || busy || (isGift && (!email || !giftAddressReady))}
            onClick={generateCharge}
          >
            {busy ? p.charging : isGift ? p.giftSend : p.charge}
          </Button>
        </Card>
      </div>
    </>
  );
}
