"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Minus, Plus, X } from "lucide-react";
import { cartSubtotal, useCart } from "@/store/cart";
import { ButtonLink } from "@/components/ui/Button";
import { useT } from "@/i18n/client";
import { FREE_SHIPPING_FROM } from "@/lib/shop-config";

export function useCartTotals() {
  const lines = useCart((s) => s.lines);
  const subtotal = cartSubtotal(lines);
  const shipping = subtotal === 0 ? 0 : subtotal >= FREE_SHIPPING_FROM ? 0 : 599;
  return { lines, subtotal, shipping, total: subtotal + shipping };
}

export function CartDrawer() {
  const { t, f, money } = useT();
  const open = useCart((s) => s.open);
  const setOpen = useCart((s) => s.setOpen);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const { lines, subtotal, shipping } = useCartTotals();

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button key="backdrop" aria-label={t.cart.closeCart} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
          <motion.aside
            key="panel"
            role="dialog"
            aria-label={t.cart.title}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-mist"
          >
            <div className="flex items-center justify-between border-b border-black/10 px-6 py-5">
              <h2 className="display text-xl">{t.cart.title}</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label={t.cart.close} className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/5">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {lines.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <p className="text-sm text-black/60">{t.cart.empty}</p>
                  <ButtonLink href="/productos" variant="secondary" className="mt-6" onClick={() => setOpen(false)}>
                    {t.cart.seeProducts}
                  </ButtonLink>
                </div>
              ) : (
                <ul className="divide-y divide-black/10">
                  {lines.map((line) => (
                    <li key={line.key} className="flex gap-4 py-4">
                      <Link href={`/productos/${line.slug}`} onClick={() => setOpen(false)} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white">
                        <Image src={line.image} alt={line.name} fill sizes="80px" className="object-contain" />
                      </Link>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-3">
                          <p className="truncate text-sm font-medium">{line.name}</p>
                          <button type="button" onClick={() => remove(line.key)} aria-label={f(t.cart.remove, { name: line.name })} className="text-black/40 hover:text-black">
                            <X size={16} />
                          </button>
                        </div>
                        <p className="mt-0.5 text-xs text-black/50">{line.color ? t.colors[line.color] : line.sku}</p>
                        <div className="mt-auto flex items-center justify-between">
                          <div className="inline-flex items-center rounded-full border border-black/15">
                            <button type="button" onClick={() => setQty(line.key, line.qty - 1)} aria-label={t.product.less} className="inline-flex h-8 w-8 items-center justify-center">
                              <Minus size={14} />
                            </button>
                            <span className="w-6 text-center text-sm tabular-nums">{line.qty}</span>
                            <button type="button" onClick={() => setQty(line.key, line.qty + 1)} aria-label={t.product.more} className="inline-flex h-8 w-8 items-center justify-center">
                              <Plus size={14} />
                            </button>
                          </div>
                          <p className="text-sm font-semibold tabular-nums">{money(line.price * line.qty)}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {lines.length > 0 && (
              <div className="border-t border-black/10 px-6 py-5">
                <div className="flex justify-between text-sm">
                  <span className="text-black/60">{t.cart.subtotal}</span>
                  <span className="tabular-nums">{money(subtotal)}</span>
                </div>
                <div className="mt-1 flex justify-between text-sm">
                  <span className="text-black/60">{t.cart.shippingEst}</span>
                  <span className="tabular-nums">{shipping === 0 ? t.cart.free : money(shipping)}</span>
                </div>
                {shipping > 0 && <p className="mt-2 text-xs text-black/50">{f(t.cart.freeFrom, { amount: money(FREE_SHIPPING_FROM) })}</p>}
                <ButtonLink href="/checkout" size="lg" className="mt-5 w-full" onClick={() => setOpen(false)}>
                  {t.cart.checkout}
                </ButtonLink>
                <Link href="/carrito" onClick={() => setOpen(false)} className="mt-3 block text-center text-xs text-black/60 underline-offset-4 hover:underline">
                  {t.cart.viewCart}
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
