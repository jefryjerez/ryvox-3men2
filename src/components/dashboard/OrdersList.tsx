"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, Download } from "lucide-react";
import { useAdmin } from "@/store/admin";
import { orderTotal, type OrderStatus } from "@/lib/orders";
import { cn } from "@/lib/format";
import { Card, PageHeader, Pill, StatusBadge, td, th } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/Button";
import { useT } from "@/i18n/client";

const STATUSES: OrderStatus[] = ["pendiente", "procesando", "enviado", "entregado", "cancelado"];

export function OrdersList() {
  const { t, f, money, shortDate } = useT();
  const orders = useAdmin((s) => s.orders);
  const customers = useAdmin((s) => s.customers);
  const [tab, setTab] = useState<OrderStatus | "todas">("todas");
  const [q, setQ] = useState("");

  const TABS: Array<{ id: OrderStatus | "todas"; label: string }> = [{ id: "todas", label: t.dash.orders.all }, ...STATUSES.map((s) => ({ id: s, label: t.status[s] }))];

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return [...orders]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .filter((o) => tab === "todas" || o.status === tab)
      .filter((o) => {
        if (!term) return true;
        const c = customers.find((x) => x.id === o.customerId);
        return o.number.includes(term) || c?.name.toLowerCase().includes(term) || c?.email.toLowerCase().includes(term);
      });
  }, [orders, customers, tab, q]);

  const counts = TABS.map((x) => (x.id === "todas" ? orders.length : orders.filter((o) => o.status === x.id).length));

  return (
    <>
      <PageHeader title={t.dash.orders.title} subtitle={f(t.dash.orders.total, { n: orders.length })}>
        <Button variant="secondary" size="sm">
          <Download size={14} /> {t.common.export}
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
          {TABS.map((x, i) => (
            <button
              key={x.id}
              type="button"
              onClick={() => setTab(x.id)}
              className={cn("shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors", tab === x.id ? "border-black bg-black text-white" : "border-line bg-white text-black/70 hover:border-black")}
            >
              {x.label} <span className={cn("ml-1 tabular-nums", tab === x.id ? "text-white/60" : "text-black/40")}>{counts[i]}</span>
            </button>
          ))}
        </div>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.dash.orders.search} className="h-10 rounded-full border border-line bg-white px-4 text-sm outline-none focus:border-black md:w-72" />
      </div>

      <ul className="mt-4 space-y-2 md:hidden">
        {rows.map((o) => {
          const c = customers.find((x) => x.id === o.customerId);
          return (
            <li key={o.id}>
              <Link href={`/dashboard/ordenes/${o.id}`} className="block rounded-2xl border border-line bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold tabular-nums">{o.number}</p>
                  <div className="flex items-center gap-1.5">
                    {o.isGift && <Pill tone="muted">{t.dash.orders.gift}</Pill>}
                    <StatusBadge status={o.status} />
                  </div>
                </div>
                <p className="mt-1 text-sm">{c?.name}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-black/55">
                  <span>
                    {f(t.dash.orders.itemsCount, { n: o.items.length })} · {shortDate(o.createdAt)}
                  </span>
                  <span className="text-sm font-semibold text-black tabular-nums">{o.isGift ? t.dash.orders.gift : money(orderTotal(o))}</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      <Card className="mt-4 hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="border-b border-line bg-mist/60">
              <tr>
                <th className={th}>{t.dash.overview.table.number}</th>
                <th className={th}>{t.dash.overview.table.customer}</th>
                <th className={th}>{t.dash.overview.table.items}</th>
                <th className={th}>{t.dash.overview.table.total}</th>
                <th className={th}>{t.dash.overview.table.status}</th>
                <th className={th}>{t.dash.overview.table.shipping}</th>
                <th className={th}>{t.dash.overview.table.date}</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((o) => {
                const c = customers.find((x) => x.id === o.customerId);
                const first = o.items[0];
                return (
                  <tr key={o.id} className="hover:bg-mist/50">
                    <td className={`${td} font-medium tabular-nums`}>
                      <Link href={`/dashboard/ordenes/${o.id}`}>{o.number}</Link>
                    </td>
                    <td className={td}>
                      <p>{c?.name}</p>
                      <p className="text-[11px] text-black/45">{c?.email}</p>
                    </td>
                    <td className={`${td} text-black/70`}>
                      {first?.name}
                      {o.items.length > 1 && <span className="text-black/40"> +{o.items.length - 1}</span>}
                    </td>
                    <td className={`${td} font-medium tabular-nums`}>{o.isGift ? t.dash.orders.gift : money(orderTotal(o))}</td>
                    <td className={td}>
                      <div className="flex items-center gap-1.5">
                        {o.isGift && <Pill tone="muted">{t.dash.orders.gift}</Pill>}
                        <StatusBadge status={o.status} />
                      </div>
                    </td>
                    <td className={`${td} text-black/60`}>{o.tracking ? `${o.carrier} · ${o.tracking.slice(-6)}` : "—"}</td>
                    <td className={`${td} text-black/60`}>{shortDate(o.createdAt)}</td>
                    <td className={`${td} text-right`}>
                      <Link href={`/dashboard/ordenes/${o.id}`} aria-label={f(t.dash.orders.view, { n: o.number })} className="inline-flex text-black/40 hover:text-black">
                        <ChevronRight size={16} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-sm text-black/50">
                    {t.dash.orders.none}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
