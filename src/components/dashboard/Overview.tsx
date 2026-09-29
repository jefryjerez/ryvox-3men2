"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, ChevronRight, ClipboardList, DollarSign, Gift, Package, Truck } from "lucide-react";
import { useAdmin, isLowStock } from "@/store/admin";
import { giftsInWindow, orderTotal, ordersForDay, percentChange, salesForDay, salesSeries, sumSalesWindow } from "@/lib/orders";
import { Card, CardHeader, PageHeader, StatCard, StatusBadge, td, th } from "@/components/dashboard/ui";
import { pct } from "@/lib/format";
import { useT } from "@/i18n/client";

const SalesChart = dynamic(() => import("./SalesChart"), { ssr: false, loading: () => <div className="h-56 sm:h-64" /> });

export function Overview() {
  const { t, f, money, shortDate } = useT();
  const o = t.dash.overview;
  const orders = useAdmin((s) => s.orders);
  const products = useAdmin((s) => s.products);
  const customers = useAdmin((s) => s.customers);

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const yesterdayDate = new Date(now);
  yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
  const yesterday = yesterdayDate.toISOString().slice(0, 10);
  const todays = orders.filter((x) => x.createdAt.startsWith(today) && x.status !== "cancelado" && !x.isGift);
  // Ventas: solo órdenes realmente pagadas y no canceladas; el % se omite cuando no hay un día anterior con qué comparar.
  const salesToday = salesForDay(orders, today);
  const salesYesterday = salesForDay(orders, yesterday);
  const salesDelta = percentChange(salesToday, salesYesterday);
  const ordersYesterday = ordersForDay(orders, yesterday);
  const ordersDelta = percentChange(todays.length, ordersYesterday);
  const toShip = orders.filter((x) => x.status === "pendiente" || x.status === "procesando");
  const low = products.filter((p) => p.active && isLowStock(p)).sort((a, b) => a.stock - b.stock);
  const recent = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 7);
  const top = [...products].sort((a, b) => b.sold30d - a.sold30d).slice(0, 5);
  const series = salesSeries(orders, 30);
  const spark = series.slice(-8).map((d) => d.total);
  const totals30 = sumSalesWindow(orders, 29, 0);
  const prevTotals30 = sumSalesWindow(orders, 59, 30);
  const totals30Delta = percentChange(totals30, prevTotals30);
  const giftsMonth = giftsInWindow(orders, 30);
  const giftsWeek = giftsInWindow(orders, 7);

  return (
    <>
      <PageHeader title={o.greeting} subtitle={o.subtitle} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={<DollarSign size={20} />} label={o.salesToday} value={money(salesToday)} delta={salesDelta} hint={salesDelta !== undefined ? o.vsYesterday : undefined} spark={spark} />
        <StatCard icon={<ClipboardList size={20} />} label={o.ordersToday} value={String(todays.length)} delta={ordersDelta} hint={ordersDelta !== undefined ? o.vsYesterday : undefined} />
        <StatCard icon={<Truck size={20} />} label={o.toShip} value={String(toShip.length)} hint={o.waiting} href="/dashboard/envios" />
        <StatCard icon={<AlertTriangle size={20} />} label={o.lowStock} value={String(low.length)} hint={o.toRestock} alert={low.length > 0} href="/dashboard/inventario" />
        <StatCard icon={<Gift size={20} />} label={o.giftsMonth} value={String(giftsMonth)} hint={f(o.giftsWeekHint, { n: giftsWeek })} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
            <div>
              <h2 className="text-[15px] font-semibold tracking-tight">{o.sales}</h2>
              <p className="display mt-1 text-2xl">
                {money(totals30)}
                {totals30Delta !== undefined && (
                  <span className="ml-1 align-middle text-xs font-sans text-black/50">{f(o.last30Delta, { pct: pct(totals30Delta) })}</span>
                )}
              </p>
            </div>
            <span className="rounded-full border border-line px-3 py-1 text-xs text-black/60">{o.last30}</span>
          </div>
          <div className="px-2 pb-3 pt-2 sm:px-3">
            <SalesChart series={series} />
          </div>
        </Card>

        <Card>
          <CardHeader title={o.topProducts} action={o.products} href="/dashboard/productos" />
          <ol className="divide-y divide-line px-5 pb-2 pt-3">
            {top.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3 py-2.5">
                <span className="w-4 text-xs text-black/40 tabular-nums">{i + 1}</span>
                <span className="relative h-10 w-10 overflow-hidden rounded-lg bg-mist">
                  <Image src={p.image} alt="" fill sizes="40px" className="object-contain" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="text-[11px] text-black/50">{f(o.sold, { n: p.sold30d })}</p>
                </div>
                <p className="text-sm font-semibold tabular-nums">{money(p.sold30d * p.price)}</p>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="overflow-hidden xl:col-span-2">
          <CardHeader title={o.recent} action={o.viewAll} href="/dashboard/ordenes" />
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="border-y border-line bg-mist/60">
                <tr>
                  <th className={th}>{o.table.number}</th>
                  <th className={th}>{o.table.customer}</th>
                  <th className={th}>{o.table.items}</th>
                  <th className={th}>{o.table.total}</th>
                  <th className={th}>{o.table.status}</th>
                  <th className={th}>{o.table.date}</th>
                  <th className={th} />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recent.map((x) => {
                  const c = customers.find((y) => y.id === x.customerId);
                  const first = x.items[0];
                  const extra = x.items.length - 1;
                  return (
                    <tr key={x.id} className="hover:bg-mist/50">
                      <td className={`${td} font-medium tabular-nums`}>{x.number}</td>
                      <td className={td}>{c?.name}</td>
                      <td className={`${td} text-black/70`}>
                        {first?.name}
                        {extra > 0 && <span className="text-black/40"> +{extra}</span>}
                      </td>
                      <td className={`${td} font-medium tabular-nums`}>{money(orderTotal(x))}</td>
                      <td className={td}>
                        <StatusBadge status={x.status} />
                      </td>
                      <td className={`${td} text-black/60`}>{shortDate(x.createdAt)}</td>
                      <td className={`${td} text-right`}>
                        <Link href={`/dashboard/ordenes/${x.id}`} aria-label={f(t.dash.orders.view, { n: x.number })} className="inline-flex text-black/40 hover:text-black">
                          <ChevronRight size={16} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className={low.length > 0 ? "border-alert/40" : undefined}>
          <CardHeader title={o.lowStock} action={o.viewAll} href="/dashboard/inventario" />
          {low.length === 0 ? (
            <p className="px-5 py-8 text-sm text-black/55">{o.allOk}</p>
          ) : (
            <ul className="divide-y divide-line px-5 pb-2 pt-3">
              {low.map((p) => (
                <li key={p.id}>
                  <Link href={`/dashboard/productos/${p.id}`} className="flex items-center gap-3 py-2.5">
                    <span className="relative h-9 w-9 overflow-hidden rounded-lg bg-mist">
                      <Image src={p.image} alt="" fill sizes="36px" className="object-contain" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="text-[11px] text-black/50">{p.sku}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-alert">
                      <Package size={13} /> {f(o.left, { n: p.stock })}
                    </span>
                    <ChevronRight size={16} className="text-black/30" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
