"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/lib/products";
import { productImage, type ColorId } from "@/lib/colors";

/** Cada línea guarda una copia de lo esencial del producto: el carrito no depende del catálogo. */
export interface CartLine {
  /** productId, o productId:color cuando el artículo tiene variantes. */
  key: string;
  productId: string;
  slug: string;
  name: string;
  sku: string;
  price: number;
  image: string;
  qty: number;
  color?: ColorId;
}

export type CartProduct = Pick<Product, "id" | "slug" | "name" | "sku" | "price" | "image"> & { colorImages?: Product["colorImages"] };

interface CartState {
  lines: CartLine[];
  open: boolean;
  add: (product: CartProduct, qty?: number, color?: ColorId | null) => void;
  remove: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
}

export function lineKey(productId: string, color?: ColorId | null) {
  return color ? `${productId}:${color}` : productId;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      open: false,
      add: (p, qty = 1, color = null) =>
        set((s) => {
          const key = lineKey(p.id, color);
          const existing = s.lines.find((l) => l.key === key);
          const lines = existing
            ? s.lines.map((l) => (l.key === key ? { ...l, qty: l.qty + qty, price: p.price } : l))
            : [
                ...s.lines,
                { key, productId: p.id, slug: p.slug, name: p.name, sku: p.sku, price: p.price, image: productImage(p, color), qty, color: color ?? undefined },
              ];
          return { lines, open: true };
        }),
      remove: (key) => set((s) => ({ lines: s.lines.filter((l) => l.key !== key) })),
      setQty: (key, qty) =>
        set((s) => ({
          lines: qty <= 0 ? s.lines.filter((l) => l.key !== key) : s.lines.map((l) => (l.key === key ? { ...l, qty } : l)),
        })),
      clear: () => set({ lines: [] }),
      setOpen: (open) => set({ open }),
    }),
    {
      name: "ryvox.cart",
      version: 3,
      partialize: (s) => ({ lines: s.lines }),
      migrate: () => ({ lines: [] }),
    },
  ),
);

export function cartCount(lines: CartLine[]) {
  return lines.reduce((n, l) => n + l.qty, 0);
}

export function cartSubtotal(lines: CartLine[]) {
  return lines.reduce((s, l) => s + l.price * l.qty, 0);
}
