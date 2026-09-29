"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Minus, Plus, X } from "lucide-react";
import { useCart } from "@/store/cart";
import { useCartTotals } from "@/components/store/CartDrawer";
import { ButtonLink } from "@/components/ui/Button";
import { useHydrated } from "@/lib/use-hydrated";
import { useT } from "@/i18n/client";

export function CartPage() {
  const { t, money } = useT();
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const { lines, subtotal, shipping, total } = useCartTotals();
  const hydrated = useHydrated();

  return (
    <div className="container-x mx-auto max-w-[1400px] pb-24 pt-28 md:pt-36">
      <p className="eyebrow text-black/50">{t.cart.eyebrow}</p>
      <h1 className="display mt-4 text-[clamp(2.6rem,8vw,6rem)] uppercase">{t.cart.title}</h1>

      {!hydrated ? null : lines.length === 0 ? (
        <div className="mt-12 rounded-3xl bg-white p-10 text-center">
          <p className="text-black/60">{t.cart.emptyLong}</p>
          <ButtonLink href="/productos" className="mt-6">
            {t.cart.seeProducts} <ArrowRight size={16} />
          </ButtonLink>
        </div>
      ) : (
        <div className="mt-12 grid gap-10 md:grid-cols-12">
          <ul className="divide-y divide-black/10 md:col-span-8">
            {lines.map((line) => (
              <li key={line.productId} className="flex gap-5 py-6">
                <Link href={`/productos/${line.slug}`} className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-white">
                  <Image src={line.image} alt={line.name} fill sizes="112px" className="object-contain" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold tracking-tight">{line.name}</p>
                      <p className="mt-0.5 text-xs text-black/50">
                        {line.sku} · {money(line.price)} {t.cart.each}
                      </p>
                    </div>
                    <button type="button" onClick={() => remove(line.productId)} aria-label={t.cart.close} className="text-black/40 hover:text-black">
                      <X size={18} />
                    </button>
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="inline-flex items-center rounded-full border border-black/15">
                      <button type="button" onClick={() => setQty(line.productId, line.qty - 1)} aria-label={t.product.less} className="inline-flex h-9 w-9 items-center justify-center">
                        <Minus size={14} />
                      </button>
                      <span className="w-7 text-center text-sm tabular-nums">{line.qty}</span>
                      <button type="button" onClick={() => setQty(line.productId, line.qty + 1)} aria-label={t.product.more} className="inline-flex h-9 w-9 items-center justify-center">
                        <Plus size={14} />
                      </button>
                    </div>
                    <p className="font-semibold tabular-nums">{money(line.price * line.qty)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="md:col-span-4">
            <div className="rounded-3xl bg-white p-6 md:sticky md:top-28">
              <h2 className="font-semibold tracking-tight">{t.cart.summary}</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-black/60">{t.cart.subtotal}</dt>
                  <dd className="tabular-nums">{money(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-black/60">{t.cart.shippingEst}</dt>
                  <dd className="tabular-nums">{shipping === 0 ? t.cart.free : money(shipping)}</dd>
                </div>
                <div className="flex justify-between border-t border-black/10 pt-3 text-base font-semibold">
                  <dt>{t.cart.total}</dt>
                  <dd className="tabular-nums">{money(total)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-black/50">{t.cart.exactNote}</p>
              <ButtonLink href="/checkout" size="lg" className="mt-6 w-full">
                {t.cart.checkout} <ArrowRight size={18} />
              </ButtonLink>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
