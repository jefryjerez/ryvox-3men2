"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, Boxes, Minus, PackageCheck, PackageX, Plus } from "lucide-react";
import { useAdmin, isLowStock } from "@/store/admin";
import { CATEGORIES, type Category } from "@/lib/products";
import { cn } from "@/lib/format";
import { Card, PageHeader, Pill, StatCard, StockBar } from "@/components/dashboard/ui";
import { useT } from "@/i18n/client";

export function Inventory() {
  const { t, f } = useT();
  const v = t.dash.inventory;
  const products = useAdmin((s) => s.products);
  const adjustStock = useAdmin((s) => s.adjustStock);
  const [cat, setCat] = useState<Category | "todos">("todos");
  const [onlyLow, setOnlyLow] = useState(false);

  const list = useMemo(
    () =>
      products
        .filter((p) => cat === "todos" || p.category === cat)
        .filter((p) => !onlyLow || isLowStock(p))
        .sort((a, b) => a.stock - a.lowStockAt - (b.stock - b.lowStockAt)),
    [products, cat, onlyLow],
  );

  const inStock = products.filter((p) => !isLowStock(p)).length;
  const low = products.filter((p) => isLowStock(p) && p.stock > 0).length;
  const out = products.filter((p) => p.stock === 0).length;

  return (
    <>
      <PageHeader title={v.title} subtitle={v.subtitle} />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard icon={<Boxes size={20} />} label={v.products} value={String(products.length)} />
        <StatCard icon={<PackageCheck size={20} />} label={v.inStock} value={String(inStock)} />
        <StatCard icon={<AlertTriangle size={20} />} label={v.low} value={String(low)} alert={low > 0} />
        <StatCard icon={<PackageX size={20} />} label={v.out} value={String(out)} alert={out > 0} />
      </div>

      <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
          {[{ id: "todos" as const, label: t.catalog.all }, ...CATEGORIES.map((c) => ({ id: c.id, label: t.categories[c.id] }))].map((c) => (
            <button key={c.id} type="button" onClick={() => setCat(c.id)} className={cn("shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors", cat === c.id ? "border-black bg-black text-white" : "border-line bg-white text-black/70 hover:border-black")}>
              {c.label}
            </button>
          ))}
        </div>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyLow} onChange={(e) => setOnlyLow(e.target.checked)} className="h-4 w-4 accent-black" />
          {v.onlyLow}
        </label>
      </div>

      <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {list.map((p) => {
          const lowP = isLowStock(p);
          return (
            <li key={p.id}>
              <Card className={cn("p-4", lowP && "border-alert/40")}>
                <div className="flex gap-4">
                  <Link href={`/dashboard/productos/${p.id}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-mist">
                    <Image src={p.image} alt="" fill sizes="80px" className="object-contain" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link href={`/dashboard/productos/${p.id}`} className="block truncate text-sm font-semibold hover:underline">
                          {p.name}
                        </Link>
                        <p className="text-[11px] text-black/50">
                          {p.sku} · {t.categories[p.category]}
                        </p>
                      </div>
                      {p.stock === 0 ? <Pill tone="alert">{v.outPill}</Pill> : lowP ? <Pill tone="alert">{v.lowPill}</Pill> : <Pill tone="active">{v.okPill}</Pill>}
                    </div>
                    <div className="mt-3">
                      <StockBar stock={p.stock} low={p.lowStockAt} />
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-[11px] text-black/50">{f(v.alertFrom, { n: p.lowStockAt })}</p>
                      <div className="inline-flex items-center rounded-full border border-line">
                        <button type="button" onClick={() => adjustStock(p.id, -1)} aria-label={v.minus} className="inline-flex h-8 w-8 items-center justify-center hover:bg-mist">
                          <Minus size={14} />
                        </button>
                        <button type="button" onClick={() => adjustStock(p.id, 10)} aria-label={v.plus10} className="inline-flex h-8 items-center justify-center border-l border-line px-2 text-xs font-medium hover:bg-mist">
                          +10
                        </button>
                        <button type="button" onClick={() => adjustStock(p.id, 1)} aria-label={v.plus} className="inline-flex h-8 w-8 items-center justify-center border-l border-line hover:bg-mist">
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </>
  );
}
