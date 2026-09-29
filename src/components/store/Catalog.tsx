"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CATEGORIES, type Category, type Product } from "@/lib/products";
import { ProductCard } from "@/components/store/ProductCard";
import { cn } from "@/lib/format";
import { useT } from "@/i18n/client";

type Sort = "destacado" | "precio-asc" | "precio-desc";

export function Catalog({ products }: { products: Product[] }) {
  const { t, f } = useT();
  const [cat, setCat] = useState<Category | "todos">("todos");
  const [sort, setSort] = useState<Sort>("destacado");

  const categories = useMemo(() => CATEGORIES.filter((c) => products.some((p) => p.active && p.category === c.id)), [products]);

  const items = useMemo(() => {
    const list = products.filter((p) => p.active && (cat === "todos" || p.category === cat));
    if (sort === "precio-asc") list.sort((a, b) => a.price - b.price);
    if (sort === "precio-desc") list.sort((a, b) => b.price - a.price);
    if (sort === "destacado") list.sort((a, b) => b.sold30d - a.sold30d);
    return list;
  }, [products, cat, sort]);

  return (
    <>
      <div className="sticky top-16 z-20 -mx-5 mt-8 bg-mist/85 px-5 py-3 backdrop-blur-xl md:top-20 md:mx-0 md:px-0">
        <div className="flex items-center justify-between gap-4">
          <div className="scrollbar-none flex gap-2 overflow-x-auto">
            {[{ id: "todos" as const, label: t.catalog.all }, ...categories.map((c) => ({ id: c.id, label: t.categories[c.id] }))].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCat(c.id)}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-[13px] font-medium transition-colors",
                  cat === c.id ? "border-black bg-black text-white" : "border-black/15 text-black/70 hover:border-black hover:text-black",
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
          <label className="hidden shrink-0 items-center gap-2 text-xs text-black/50 md:flex">
            {t.catalog.sort}
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="rounded-full border border-black/15 bg-transparent px-3 py-2 text-[13px] text-black">
              <option value="destacado">{t.catalog.sortBest}</option>
              <option value="precio-asc">{t.catalog.sortAsc}</option>
              <option value="precio-desc">{t.catalog.sortDesc}</option>
            </select>
          </label>
        </div>
      </div>

      <p className="mt-6 text-xs text-black/50">{f(t.catalog.count, { n: items.length })}</p>
      <motion.ul layout className="mt-4 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {items.map((p, i) => (
            <motion.li key={p.id} layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
              <ProductCard product={p} priority={i < 4} />
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
    </>
  );
}
