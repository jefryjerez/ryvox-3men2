"use client";

import { useState } from "react";
import { Clock, Minus, Plus, ShoppingBag } from "lucide-react";
import type { Product } from "@/lib/products";
import type { ColorId } from "@/lib/colors";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/store/cart";
import { useT } from "@/i18n/client";

export function AddToCart({ product, color = null }: { product: Product; color?: ColorId | null }) {
  const { t, f } = useT();
  const [qty, setQty] = useState(1);
  const add = useCart((s) => s.add);
  const out = product.stock === 0;
  const low = !out && product.stock <= product.lowStockAt;

  if (product.comingSoon) {
    return (
      <div className="mt-8">
        <Button size="lg" className="w-full" disabled>
          <Clock size={18} /> {t.product.comingSoon}
        </Button>
        <p className="mt-3 text-xs font-medium text-black/50">{t.product.comingSoonHint}</p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex gap-3">
        <div className="inline-flex h-14 items-center rounded-full border border-black/15">
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label={t.product.less} className="inline-flex h-full w-12 items-center justify-center">
            <Minus size={16} />
          </button>
          <span className="w-8 text-center tabular-nums">{qty}</span>
          <button type="button" onClick={() => setQty((q) => Math.min(product.stock, q + 1))} aria-label={t.product.more} className="inline-flex h-full w-12 items-center justify-center">
            <Plus size={16} />
          </button>
        </div>
        <Button size="lg" className="flex-1" disabled={out} onClick={() => add(product, qty, color)}>
          <ShoppingBag size={18} /> {out ? t.product.soldOut : t.product.add}
        </Button>
      </div>
      {low && <p className="mt-3 text-xs font-medium text-black/70">{f(t.product.lastUnits, { n: product.stock })}</p>}
    </div>
  );
}
