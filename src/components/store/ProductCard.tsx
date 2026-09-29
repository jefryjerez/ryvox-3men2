"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Plus } from "lucide-react";
import type { Product } from "@/lib/products";
import { productColors, productImage, type ColorId } from "@/lib/colors";
import { ColorSwatches } from "@/components/store/ColorSwatches";
import { useCart } from "@/store/cart";
import { useT } from "@/i18n/client";

export function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  const { t, f, money } = useT();
  const add = useCart((s) => s.add);
  const colors = productColors(product);
  const [color, setColor] = useState<ColorId | null>(colors[0] ?? null);
  const image = productImage(product, color);

  return (
    <article className="group relative flex flex-col">
      <div className="relative">
        <Link href={`/productos/${product.slug}`} className="relative block aspect-square overflow-hidden rounded-3xl bg-white transition-shadow duration-500 group-hover:shadow-[0_24px_60px_-30px_rgba(0,0,0,0.35)]">
          <Image
            key={image}
            src={image}
            alt={color ? `${product.name} · ${t.colors[color]}` : product.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-3 transition-transform duration-700 ease-out-expo group-hover:scale-[1.06]"
          />
          {(product.comingSoon || product.badge) && (
            <span className="absolute left-3 top-3 rounded-full bg-black px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
              {product.comingSoon ? t.product.comingSoon : product.badge}
            </span>
          )}
          {product.model3d && (
            <span className="absolute right-3 top-3 rounded-full border border-black/10 bg-white/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-black/70 backdrop-blur">3D</span>
          )}
        </Link>
        {/* selector de color: cambia la foto sin entrar al producto */}
        {colors.length > 0 && (
          <ColorSwatches colors={colors} value={color} onChange={setColor} className="absolute bottom-3 right-3 rounded-full bg-white/85 px-2 py-1.5 backdrop-blur" />
        )}
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold tracking-tight">
            <Link href={`/productos/${product.slug}`}>{product.name}</Link>
          </h3>
          <p className="mt-0.5 truncate text-xs text-black/50">{color && colors.length > 1 ? t.colors[color] : product.tagline}</p>
        </div>
        <div className="text-right">
          {product.comingSoon ? (
            <p className="text-[15px] font-semibold text-black/50">{t.product.comingSoon}</p>
          ) : (
            <>
              <p className="text-[15px] font-semibold tabular-nums">{money(product.price)}</p>
              {product.compareAt && <p className="text-xs text-black/40 line-through tabular-nums">{money(product.compareAt)}</p>}
            </>
          )}
        </div>
      </div>
      {!product.comingSoon && (
        <button
          type="button"
          onClick={() => add(product, 1, colors.length > 1 ? color : null)}
          aria-label={f(t.catalog.addAria, { name: product.name })}
          className="absolute bottom-[4.4rem] left-3 inline-flex h-10 w-10 translate-y-2 items-center justify-center rounded-full bg-black text-white opacity-0 transition-all duration-300 ease-out-expo group-hover:translate-y-0 group-hover:opacity-100 focus-visible:opacity-100 max-md:translate-y-0 max-md:opacity-100"
        >
          <Plus size={18} />
        </button>
      )}
    </article>
  );
}
