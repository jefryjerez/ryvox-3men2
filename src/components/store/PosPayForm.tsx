"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Elements, ExpressCheckoutElement, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Check, Lock } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { useT } from "@/i18n/client";

const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = pk ? loadStripe(pk) : null;

interface OrderInfo {
  number: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  paid: boolean;
  clientSecret: string | null;
}

function Summary({ order }: { order: OrderInfo }) {
  const { t, f, money } = useT();
  return (
    <div className="rounded-3xl bg-white p-6">
      <p className="text-xs font-medium text-black/50">{f(t.pay.order, { n: order.number })}</p>
      <ul className="mt-3 divide-y divide-black/10">
        {order.items.map((i, idx) => (
          <li key={idx} className="flex items-center justify-between py-2 text-sm">
            <span className="text-black/70">
              {i.name} <span className="text-black/40">× {i.qty}</span>
            </span>
            <span className="font-medium tabular-nums">{money(i.price * i.qty)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center justify-between border-t border-black/10 pt-3 text-base font-semibold">
        <span>{t.cart.total}</span>
        <span className="tabular-nums">{money(order.total)}</span>
      </div>
    </div>
  );
}

function PayInner({ order, onPaid }: { order: OrderInfo; onPaid: () => void }) {
  const { t, f, money } = useT();
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasWallets, setHasWallets] = useState(false);

  async function confirm() {
    if (!stripe || !elements) return;
    setBusy(true);
    setError(null);
    const { error } = await stripe.confirmPayment({ elements, redirect: "if_required" });
    if (error) {
      setError(error.message ?? t.checkout.payFailed);
      setBusy(false);
      return;
    }
    onPaid();
  }

  async function pay(e: FormEvent) {
    e.preventDefault();
    await confirm();
  }

  return (
    <form onSubmit={pay} className="space-y-6">
      <Summary order={order} />
      <div className="rounded-3xl bg-white p-6">
        <div className={hasWallets ? "" : "hidden"}>
          <ExpressCheckoutElement
            options={{ buttonHeight: 48, buttonTheme: { applePay: "black", googlePay: "black" }, layout: { maxColumns: 2, overflow: "never" } }}
            onReady={({ availablePaymentMethods }) => setHasWallets(!!availablePaymentMethods)}
            onConfirm={() => void confirm()}
          />
          <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wider text-black/40">
            <span className="h-px flex-1 bg-black/10" />
            {t.checkout.orCard}
            <span className="h-px flex-1 bg-black/10" />
          </div>
        </div>
        <PaymentElement options={{ layout: "tabs", wallets: { applePay: "never", googlePay: "never" } }} />
      </div>
      {error && <p className="text-sm font-medium text-alert">{error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={!stripe || busy}>
        {busy ? t.checkout.processing : f(t.checkout.pay, { amount: money(order.total) })}
      </Button>
      <p className="flex items-center justify-center gap-1 text-[11px] text-black/45">
        <Lock size={11} /> {t.checkout.encrypted}
      </p>
    </form>
  );
}

export function PosPayForm({ intentId }: { intentId: string }) {
  const { t, f, money, locale } = useT();
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [paidNow, setPaidNow] = useState(false);

  useEffect(() => {
    fetch(`/api/pos/${intentId}`)
      .then((r) => {
        if (!r.ok) throw new Error("not-found");
        return r.json() as Promise<OrderInfo>;
      })
      .then(setOrder)
      .catch(() => setNotFound(true));
  }, [intentId]);

  if (notFound) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center">
        <Logo width={120} className="mx-auto" />
        <p className="mt-6 text-sm text-black/60">{t.pay.notFound}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center">
        <Logo width={120} className="mx-auto" />
        <p className="mt-6 text-sm text-black/40">{t.common.loading}</p>
      </div>
    );
  }

  if (order.paid || paidNow) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center">
        <Logo width={120} className="mx-auto" />
        <div className="mx-auto mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-black text-white">
          <Check size={26} />
        </div>
        <h1 className="display mt-5 text-2xl uppercase">{t.pay.thankYouTitle}</h1>
        <p className="mt-2 text-sm text-black/60">{t.pay.thankYouText}</p>
        <p className="mt-4 text-xs text-black/40">
          {f(t.pay.order, { n: order.number })} · {money(order.total)}
        </p>
      </div>
    );
  }

  if (!order.clientSecret || !stripePromise) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center">
        <Logo width={120} className="mx-auto" />
        <p className="mt-6 text-sm text-black/60">{t.pay.notFound}</p>
      </div>
    );
  }

  return (
    <>
      <Logo width={120} className="mx-auto mb-8" />
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret: order.clientSecret,
          locale,
          appearance: { theme: "flat", variables: { colorPrimary: "#000000", colorBackground: "#ffffff", colorText: "#000000", borderRadius: "12px", fontFamily: "Inter, system-ui, sans-serif" } },
        }}
      >
        <PayInner order={order} onPaid={() => setPaidNow(true)} />
      </Elements>
    </>
  );
}
