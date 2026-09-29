"use client";

import { useState } from "react";
import type { Product } from "@/lib/products";
import { productColors, type ColorId } from "@/lib/colors";
import { ProductGallery } from "@/components/store/ProductGallery";
import { ColorSwatches } from "@/components/store/ColorSwatches";
import { AddToCart } from "@/components/store/AddToCart";
import { useT } from "@/i18n/client";
import { FREE_SHIPPING_FROM } from "@/lib/shop-config";

/** Ficha de producto: galería/3D a la izquierda, datos y compra a la derecha; el color elegido se comparte entre ambos. */
export function ProductDetail({ product }: { product: Product }) {
  const { t, f, money } = useT();
  const colors = productColors(product);
  const [color, setColor] = useState<ColorId | null>(colors[0] ?? null);

  return (
    <div className="mt-6 grid gap-10 md:grid-cols-12 md:gap-12">
      <div className="md:col-span-7">
        <ProductGallery product={product} color={color} />
      </div>

      <div className="md:col-span-5">
        <p className="eyebrow text-black/50">{t.categories[product.category]}</p>
        <h1 className="display mt-4 text-[clamp(2.2rem,5.5vw,4rem)] uppercase">{product.name}</h1>
        <p className="mt-3 text-lg text-black/60">{product.tagline}</p>

        <div className="mt-6 flex items-baseline gap-3">
          <span className="display text-3xl">{money(product.price)}</span>
          {product.compareAt && <span className="text-black/40 line-through">{money(product.compareAt)}</span>}
        </div>

        {colors.length > 1 && color && (
          <div className="mt-7">
            <p className="text-xs font-medium text-black/60">
              {t.product.color}: <span className="text-black">{t.colors[color]}</span>
            </p>
            <ColorSwatches colors={colors} value={color} onChange={setColor} size="md" className="mt-3" />
          </div>
        )}

        <AddToCart product={product} color={colors.length > 1 ? color : null} />

        <p className="mt-8 text-sm leading-relaxed text-black/70">{product.description}</p>

        <dl className="mt-8 divide-y divide-black/10 border-y border-black/10">
          {product.specs.map((s) => (
            <div key={s.label} className="grid grid-cols-2 gap-4 py-3 text-sm">
              <dt className="text-black/50">{s.label}</dt>
              <dd className="font-medium">{s.value}</dd>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-4 py-3 text-sm">
            <dt className="text-black/50">{t.product.sku}</dt>
            <dd className="font-medium">{product.sku}</dd>
          </div>
        </dl>

        <ul className="mt-6 space-y-2 text-xs text-black/55">
          <li>{f(t.product.freeShipping, { amount: money(FREE_SHIPPING_FROM) })}</li>
          <li>{t.product.returns}</li>
          <li>{t.product.warranty}</li>
        </ul>
      </div>
    </div>
  );
}
