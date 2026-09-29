"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { Lock, Truck } from "lucide-react";
import { useCart } from "@/store/cart";
import { AddressAutocomplete } from "@/components/store/AddressAutocomplete";
import { useCartTotals } from "@/components/store/CartDrawer";
import { Button, ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/format";
import { useHydrated } from "@/lib/use-hydrated";
import { useT } from "@/i18n/client";

const input = "h-12 w-full rounded-xl border border-black/15 bg-white px-4 text-sm outline-none transition-colors placeholder:text-black/35 focus:border-black";

const stripeEnabled = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

interface Rate {
  id: string;
  provider: string;
  service: string;
  label: string;
  amount: number;
  days?: number;
}

interface Form {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  zip: string;
  country: string;
  note: string;
}

function Field({ label, name, value, onChange, type = "text", autoComplete, placeholder, required = true, span }: {
  label: string; name: keyof Form; value: string; onChange: (k: keyof Form, v: string) => void; type?: string; autoComplete?: string; placeholder?: string; required?: boolean; span?: boolean;
}) {
  return (
    <label className={span ? "sm:col-span-2" : ""}>
      <span className="mb-1.5 block text-xs font-medium text-black/60">{label}</span>
      <input name={name} value={value} onChange={(e) => onChange(name, e.target.value)} type={type} autoComplete={autoComplete} placeholder={placeholder} required={required} className={input} />
    </label>
  );
}

export function Checkout() {
  const { t, f, money, locale } = useT();
  const router = useRouter();
  const clear = useCart((s) => s.clear);
  const { lines, subtotal } = useCartTotals();
  const hydrated = useHydrated();

  const [form, setForm] = useState<Form>({ email: "", phone: "", firstName: "", lastName: "", line1: "", line2: "", city: "", region: "", zip: "", country: t.checkout.countryDefault, note: "" });
  const [rates, setRates] = useState<Rate[] | null>(null);
  const [rateId, setRateId] = useState<string | null>(null);
  const [ratesBusy, setRatesBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  const [discountInput, setDiscountInput] = useState("");
  const [discount, setDiscount] = useState<{ code: string; percentOff: number } | null>(null);
  const [discountBusy, setDiscountBusy] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);

  const set = (k: keyof Form, v: string) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    if (["line1", "city", "region", "zip", "country"].includes(k)) {
      setRates(null);
      setRateId(null);
    }
  };

  const applySuggestedAddress = (a: { line1: string; city: string; region: string; zip: string; country: string }) => {
    setForm((prev) => ({ ...prev, line1: a.line1, city: a.city, region: a.region, zip: a.zip, country: a.country || prev.country }));
    setRates(null);
    setRateId(null);
  };

  const address = useMemo(
    () => ({ name: `${form.firstName} ${form.lastName}`.trim(), line1: form.line1, line2: form.line2 || undefined, city: form.city, region: form.region, zip: form.zip, country: form.country }),
    [form],
  );
  const addressReady = !!(form.firstName && form.line1 && form.city && form.region && form.zip);
  const rate = rates?.find((r) => r.id === rateId) ?? null;
  const discountAmount = useMemo(() => {
    if (!discount) return 0;
    const factor = (100 - discount.percentOff) / 100;
    const discounted = lines.reduce((s, l) => s + l.qty * Math.round(l.price * factor), 0);
    return subtotal - discounted;
  }, [discount, lines, subtotal]);
  const total = subtotal - discountAmount + (rate?.amount ?? 0);

  async function applyDiscount() {
    if (!discountInput.trim()) return;
    setDiscountBusy(true);
    setDiscountError(null);
    try {
      const res = await fetch("/api/discount/validate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: discountInput.trim() }),
      });
      const data = (await res.json()) as { valid: boolean; code?: string; percentOff?: number };
      if (!data.valid || !data.code || !data.percentOff) {
        setDiscount(null);
        setDiscountError(t.checkout.discountInvalid);
        return;
      }
      setDiscount({ code: data.code, percentOff: data.percentOff });
    } catch {
      setDiscountError(t.checkout.discountInvalid);
    } finally {
      setDiscountBusy(false);
    }
  }

  async function fetchRates() {
    setRatesBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/shipping/rates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lines: lines.map((l) => ({ productId: l.productId, qty: l.qty, color: l.color })), address, lang: locale }),
      });
      const data = (await res.json()) as { rates?: Rate[]; error?: string };
      if (!res.ok || !data.rates) throw new Error(data.error ?? t.checkout.rateError);
      setRates(data.rates);
      setRateId(data.rates[0]?.id ?? null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRatesBusy(false);
    }
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!rate) {
      setError(t.checkout.chooseRate);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          lines: lines.map((l) => ({ productId: l.productId, qty: l.qty, color: l.color })),
          contact: { email: form.email, phone: form.phone },
          address,
          rateId: rate.id,
          note: form.note || undefined,
          lang: locale,
          discountCode: discount?.code,
        }),
      });
      const data = (await res.json()) as {
        mode?: "stripe-session" | "mock";
        number?: string;
        trackingToken?: string;
        url?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? t.checkout.orderError);
      if (data.mode === "mock") {
        clear();
        router.push(`/checkout/confirmacion?orden=${encodeURIComponent(data.number ?? "")}&t=${encodeURIComponent(data.trackingToken ?? "")}`);
        return;
      }
      if (data.mode === "stripe-session" && data.url) {
        // Redirige a la página de pago alojada por Stripe; el carrito se limpia al volver, en /checkout/confirmacion.
        setRedirecting(true);
        window.location.href = data.url;
        return;
      }
      throw new Error(t.checkout.orderError);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  if (hydrated && lines.length === 0 && !redirecting) {
    return (
      <div className="container-x mx-auto max-w-[1400px] pb-24 pt-28 md:pt-36">
        <h1 className="display text-4xl uppercase">{t.checkout.nothing}</h1>
        <p className="mt-4 text-black/60">{t.cart.empty}</p>
        <ButtonLink href="/productos" className="mt-6">{t.cart.seeProducts}</ButtonLink>
      </div>
    );
  }

  return (
    <div className="container-x mx-auto max-w-[1400px] pb-24 pt-28 md:pt-36">
      <p className="eyebrow text-black/50">{t.checkout.step1}</p>
      <h1 className="display mt-4 text-[clamp(2.6rem,8vw,6rem)] uppercase">{t.checkout.shipping}</h1>

      <div className="mt-12 grid gap-10 md:grid-cols-12">
        <div className="md:col-span-7">
            <form id="checkout-form" onSubmit={submit} className="space-y-10">
              <section>
                <h2 className="font-semibold tracking-tight">{t.checkout.contact}</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label={t.checkout.email} name="email" type="email" autoComplete="email" placeholder="tu@correo.com" value={form.email} onChange={set} span />
                  <Field label={t.checkout.phone} name="phone" type="tel" autoComplete="tel" placeholder="+1 000 000 0000" value={form.phone} onChange={set} span />
                </div>
              </section>

              <section>
                <h2 className="font-semibold tracking-tight">{t.checkout.address}</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label={t.checkout.firstName} name="firstName" autoComplete="given-name" value={form.firstName} onChange={set} />
                  <Field label={t.checkout.lastName} name="lastName" autoComplete="family-name" value={form.lastName} onChange={set} />
                  <AddressAutocomplete label={t.checkout.line1} value={form.line1} onChange={(v) => set("line1", v)} onSelectAddress={applySuggestedAddress} />
                  <Field label={t.checkout.line2} name="line2" autoComplete="address-line2" value={form.line2} onChange={set} required={false} span />
                  <Field label={t.checkout.city} name="city" autoComplete="address-level2" value={form.city} onChange={set} />
                  <Field label={t.checkout.region} name="region" autoComplete="address-level1" placeholder="NY" value={form.region} onChange={set} />
                  <Field label={t.checkout.zip} name="zip" autoComplete="postal-code" value={form.zip} onChange={set} />
                  <Field label={t.checkout.country} name="country" autoComplete="country-name" value={form.country} onChange={set} />
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold tracking-tight">{t.checkout.shippingOption}</h2>
                  {rates && (
                    <button type="button" onClick={fetchRates} className="text-xs text-black/60 underline-offset-4 hover:underline">
                      {t.checkout.recalc}
                    </button>
                  )}
                </div>
                {!rates ? (
                  <Button type="button" variant="secondary" className="mt-4" disabled={!addressReady || ratesBusy} onClick={fetchRates}>
                    <Truck size={16} /> {ratesBusy ? t.checkout.calculating : t.checkout.calc}
                  </Button>
                ) : (
                  <ul className="mt-4 space-y-2">
                    {rates.map((r) => (
                      <li key={r.id}>
                        <label className={cn("flex cursor-pointer items-center gap-3 rounded-xl border bg-white px-4 py-3 text-sm transition-colors", rateId === r.id ? "border-black" : "border-black/10 hover:border-black/40")}>
                          <input type="radio" name="rate" value={r.id} checked={rateId === r.id} onChange={() => setRateId(r.id)} className="accent-black" />
                          <span className="flex-1">{r.label}</span>
                          <span className="font-semibold tabular-nums">{r.amount === 0 ? t.cart.free : money(r.amount)}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-black/60">{t.checkout.note}</span>
                  <textarea value={form.note} onChange={(e) => set("note", e.target.value)} rows={2} className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm outline-none focus:border-black" />
                </label>
              </section>

              {!stripeEnabled && <p className="rounded-2xl border border-dashed border-black/20 bg-white/60 p-5 text-sm text-black/60">{t.checkout.mockNote}</p>}
            </form>
        </div>

        <aside className="md:col-span-5">
          <div className="rounded-3xl bg-white p-6 md:sticky md:top-28">
            <h2 className="font-semibold tracking-tight">{t.checkout.yourOrder}</h2>
            <ul className="mt-4 divide-y divide-black/10">
              {lines.map((line) => (
                <li key={line.key} className="flex items-center gap-4 py-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-mist">
                    <Image src={line.image} alt="" fill sizes="56px" className="object-contain" />
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-[10px] font-semibold text-white">{line.qty}</span>
                  </div>
                  <p className="min-w-0 flex-1 truncate text-sm">
                    {line.name}
                    {line.color && <span className="text-black/50"> · {t.colors[line.color]}</span>}
                  </p>
                  <p className="text-sm tabular-nums">{money(line.price * line.qty)}</p>
                </li>
              ))}
            </ul>
            {discount ? (
              <div className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-mist px-4 py-2.5 text-sm">
                <span className="font-medium">
                  {discount.code} · −{discount.percentOff}%
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setDiscount(null);
                    setDiscountInput("");
                  }}
                  className="text-xs text-black/50 underline-offset-2 hover:underline"
                >
                  {t.checkout.discountRemove}
                </button>
              </div>
            ) : (
              <div className="mt-4 flex gap-2">
                <input
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  placeholder={t.checkout.discountPlaceholder}
                  className="h-11 min-w-0 flex-1 rounded-xl border border-black/15 bg-white px-3 text-sm uppercase outline-none placeholder:normal-case focus:border-black"
                />
                <Button type="button" variant="secondary" size="md" disabled={discountBusy} onClick={applyDiscount}>
                  {discountBusy ? t.checkout.calculating : t.checkout.discountApply}
                </Button>
              </div>
            )}
            {discountError && <p className="mt-2 text-xs font-medium text-alert">{discountError}</p>}

            <dl className="mt-4 space-y-2 border-t border-black/10 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-black/60">{t.cart.subtotal}</dt>
                <dd className="tabular-nums">{money(subtotal)}</dd>
              </div>
              {discount && (
                <div className="flex justify-between">
                  <dt className="text-black/60">{f(t.checkout.discountLine, { code: discount.code })}</dt>
                  <dd className="tabular-nums">−{money(discountAmount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-black/60">{t.checkout.shipping}</dt>
                <dd className="tabular-nums">{rate ? (rate.amount === 0 ? t.cart.free : money(rate.amount)) : "—"}</dd>
              </div>
              <div className="flex justify-between border-t border-black/10 pt-3 text-base font-semibold">
                <dt>{t.cart.total}</dt>
                <dd className="tabular-nums">{money(total)}</dd>
              </div>
            </dl>
            <p className="mt-2 text-[11px] text-black/45">{t.checkout.taxNote}</p>
            {error && <p className="mt-4 text-sm font-medium text-alert">{error}</p>}
            <Button type="submit" form="checkout-form" size="lg" className="mt-6 w-full" disabled={busy || redirecting || !hydrated || !rate}>
              {redirecting ? t.checkout.processing : busy ? t.checkout.processing : stripeEnabled ? t.checkout.continue : f(t.checkout.confirm, { amount: money(total) })}
            </Button>
            <p className="mt-3 inline-flex items-center gap-1 text-[11px] text-black/45">
              <Lock size={11} /> {t.checkout.encrypted}
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-black/45">
              {t.checkout.acceptPrefix}{" "}
              <Link href="/terminos" className="underline underline-offset-2 hover:text-black">
                {t.legal.terms}
              </Link>{" "}
              {t.checkout.acceptAnd}{" "}
              <Link href="/reembolsos" className="underline underline-offset-2 hover:text-black">
                {t.legal.refunds}
              </Link>
              .
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
