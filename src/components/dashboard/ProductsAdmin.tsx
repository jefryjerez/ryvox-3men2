"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { useAdmin, isLowStock } from "@/store/admin";
import { cn } from "@/lib/format";
import { Card, PageHeader, Pill, td, th } from "@/components/dashboard/ui";
import { ButtonLink } from "@/components/ui/Button";
import { useT } from "@/i18n/client";

function Toggle({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onChange} className={cn("relative h-6 w-11 rounded-full transition-colors", on ? "bg-black" : "bg-black/15")}>
      <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", on ? "left-[22px]" : "left-0.5")} />
    </button>
  );
}

export function ProductsAdmin() {
  const { t, f, money } = useT();
  const v = t.dash.products;
  const products = useAdmin((s) => s.products);
  const toggle = useAdmin((s) => s.toggleProductActive);
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return products.filter((p) => !term || p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term));
  }, [products, q]);

  return (
    <>
      <PageHeader title={v.title} subtitle={f(v.subtitle, { active: products.filter((p) => p.active).length, total: products.length })}>
        <ButtonLink href="/dashboard/productos/nuevo" size="sm">
          <Plus size={14} /> {v.new}
        </ButtonLink>
      </PageHeader>

      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={v.search} className="h-10 w-full rounded-full border border-line bg-white px-4 text-sm outline-none focus:border-black md:w-80" />

      <ul className="mt-4 space-y-2 md:hidden">
        {list.map((p) => (
          <li key={p.id} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3">
            <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-mist">
              <Image src={p.image} alt="" fill sizes="56px" className="object-contain" />
            </span>
            <div className="min-w-0 flex-1">
              <Link href={`/dashboard/productos/${p.id}`} className="block truncate text-sm font-semibold">
                {p.name}
              </Link>
              <p className="text-[11px] text-black/50">
                {p.sku} · {money(p.price)}
              </p>
              <p className={cn("mt-1 text-[11px]", isLowStock(p) ? "font-semibold text-alert" : "text-black/50")}>{f(v.stock, { n: p.stock })}</p>
            </div>
            <Toggle on={p.active} onChange={() => toggle(p.id)} label={f(v.activate, { name: p.name })} />
          </li>
        ))}
      </ul>

      <Card className="mt-4 hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead className="border-b border-line bg-mist/60">
              <tr>
                <th className={th}>{v.table.product}</th>
                <th className={th}>{v.table.category}</th>
                <th className={th}>{v.table.price}</th>
                <th className={th}>{v.table.stock}</th>
                <th className={th}>{v.table.sold}</th>
                <th className={th}>{v.table.status}</th>
                <th className={th}>{v.table.active}</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((p) => (
                <tr key={p.id} className={cn("hover:bg-mist/50", !p.active && "opacity-60")}>
                  <td className={td}>
                    <div className="flex items-center gap-3">
                      <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-mist">
                        <Image src={p.image} alt="" fill sizes="44px" className="object-contain" />
                      </span>
                      <div className="min-w-0">
                        <Link href={`/dashboard/productos/${p.id}`} className="block truncate font-medium hover:underline">
                          {p.name}
                        </Link>
                        <p className="text-[11px] text-black/50">{p.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className={`${td} text-black/70`}>{t.categories[p.category]}</td>
                  <td className={`${td} tabular-nums`}>{money(p.price)}</td>
                  <td className={cn(td, "tabular-nums", isLowStock(p) && "font-semibold text-alert")}>{p.stock}</td>
                  <td className={`${td} tabular-nums text-black/70`}>{p.sold30d}</td>
                  <td className={td}>{p.active ? <Pill tone="active">{v.activePill}</Pill> : <Pill tone="pending">{v.inactivePill}</Pill>}</td>
                  <td className={td}>
                    <Toggle on={p.active} onChange={() => toggle(p.id)} label={f(v.activate, { name: p.name })} />
                  </td>
                  <td className={`${td} text-right`}>
                    <Link href={`/dashboard/productos/${p.id}`} aria-label={f(v.edit, { name: p.name })} className="inline-flex text-black/40 hover:text-black">
                      <Pencil size={15} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
