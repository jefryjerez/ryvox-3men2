"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Check, CreditCard, MapPin, Printer, RefreshCw, Truck } from "lucide-react";
import { useAdmin } from "@/store/admin";
import { orderSubtotal, orderTimeline, orderTotal, type OrderStatus } from "@/lib/orders";
import { cn } from "@/lib/format";
import { Card, PageHeader, Pill, StatusBadge } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/Button";
import { ShipDialog } from "@/components/dashboard/ShipDialog";
import { useT } from "@/i18n/client";

const STATUSES: OrderStatus[] = ["pendiente", "procesando", "enviado", "entregado", "cancelado"];

export function OrderDetail({ id }: { id: string }) {
  const { t, f, money, longDate } = useT();
  const d = t.dash.order;
  // Una orden sin pago vive en `abandoned`, no en `orders`; el detalle sirve para ambas.
  const order = useAdmin((s) => s.orders.find((o) => o.id === id) ?? s.abandoned.find((o) => o.id === id));
  const isAbandoned = useAdmin((s) => s.abandoned.some((o) => o.id === id));
  const customers = useAdmin((s) => s.customers);
  const orders = useAdmin((s) => s.orders);
  const loaded = useAdmin((s) => s.loaded);
  const setOrderStatus = useAdmin((s) => s.setOrderStatus);
  const refreshLabel = useAdmin((s) => s.refreshLabel);
  const [ship, setShip] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const backHref = isAbandoned ? "/dashboard/abandonados" : "/dashboard/ordenes";

  if (!order) {
    return (
      <div className="py-20 text-center text-sm text-black/55">
        {loaded ? (
          <>
            {d.notFound}{" "}
            <Link href="/dashboard/ordenes" className="underline">
              {t.common.back}
            </Link>
          </>
        ) : (
          t.common.loading
        )}
      </div>
    );
  }

  const customer = customers.find((c) => c.id === order.customerId);
  const customerOrders = orders.filter((o) => o.customerId === order.customerId);
  const timeline = orderTimeline(order);
  // Sin pago no hay nada que enviar.
  const canShip = order.paid !== false && (order.status === "pendiente" || order.status === "procesando");
  // La guía se compró y se cobró en Shippo, pero el PDF no llegó a tiempo en esa respuesta: se puede volver a pedir sin comprar otra.
  const canRefreshLabel = !!order.shippoTransactionId && !order.labelUrl;

  async function handleRefreshLabel() {
    setRefreshing(true);
    setRefreshError(null);
    const res = await refreshLabel(id);
    if (!res.ok) setRefreshError(res.error);
    setRefreshing(false);
  }

  return (
    <>
      <Link href={backHref} className="mb-4 inline-flex items-center gap-1 text-sm text-black/60 hover:text-black">
        <ArrowLeft size={16} /> {d.back}
      </Link>
      <PageHeader title={f(d.title, { n: order.number })} subtitle={f(d.created, { date: longDate(order.createdAt) })}>
        <Button variant="secondary" size="sm" disabled={!order.labelUrl} title={order.labelUrl ? d.printHint : d.printNoLabel} onClick={() => order.labelUrl && window.open(order.labelUrl, "_blank", "noopener")}>
          <Printer size={14} /> {d.print}
        </Button>
        {canRefreshLabel && (
          <Button variant="secondary" size="sm" disabled={refreshing} onClick={handleRefreshLabel}>
            <RefreshCw size={14} className={refreshing ? "animate-spin" : undefined} /> {d.refreshLabel}
          </Button>
        )}
        {canShip && (
          <Button size="sm" onClick={() => setShip(true)}>
            <Truck size={14} /> {d.markShipped}
          </Button>
        )}
      </PageHeader>

      {refreshError && <p className="-mt-3 mb-3 text-sm font-medium text-alert">{refreshError}</p>}

      <div className="-mt-3 mb-5 flex flex-wrap items-center gap-2">
        {order.isGift ? (
          <Pill tone="muted">{t.dash.orders.gift}</Pill>
        ) : (
          <Pill tone={order.status === "cancelado" ? "muted" : order.paid === false ? "pending" : "active"}>
            {order.status === "cancelado" ? d.refunded : order.paid === false ? d.pendingPayment : d.paid}
          </Pill>
        )}
        <StatusBadge status={order.status} />
        {order.tracking && order.trackingUrl && (
          <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="text-xs text-black/60 underline-offset-4 hover:underline">
            {f(d.trackOn, { carrier: order.carrier ?? "" })}
          </a>
        )}
        <label className="ml-auto flex items-center gap-2 text-xs text-black/55">
          {d.changeStatus}
          <select value={order.status} onChange={(e) => setOrderStatus(order.id, e.target.value as OrderStatus)} className="h-9 rounded-full border border-line bg-white px-3 text-[13px] text-black outline-none focus:border-black">
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {t.status[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <div className="space-y-4 xl:col-span-2">
          <Card className="p-5">
            <h2 className="text-[15px] font-semibold tracking-tight">{d.customer}</h2>
            <div className="mt-4 flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
                {customer?.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
              </span>
              <div className="min-w-0">
                <Link href={`/dashboard/clientes/${customer?.id}`} className="font-medium hover:underline">
                  {customer?.name}
                </Link>
                <p className="truncate text-xs text-black/55">{customer?.email}</p>
                <p className="text-xs text-black/55">{customer?.phone}</p>
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm">
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-black/45">{d.orders}</dt>
                <dd className="mt-0.5 font-medium">{customerOrders.length}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-black/45">{d.since}</dt>
                <dd className="mt-0.5 font-medium">{customer && new Date(customer.createdAt).getFullYear()}</dd>
              </div>
            </dl>
            <div className="mt-4 border-t border-line pt-4">
              <p className="inline-flex items-center gap-1.5 text-xs font-medium text-black/60">
                <MapPin size={13} /> {d.shipTo}
              </p>
              <address className="mt-2 text-sm not-italic leading-relaxed">
                {order.shippingAddress.name}
                <br />
                {order.shippingAddress.line1}
                <br />
                {order.shippingAddress.city}, {order.shippingAddress.region} {order.shippingAddress.zip}
                <br />
                {order.shippingAddress.country}
              </address>
            </div>
            <div className="mt-4 border-t border-line pt-4">
              <p className="inline-flex items-center gap-1.5 text-xs font-medium text-black/60">
                <CreditCard size={13} /> {d.payment}
              </p>
              <p className="mt-2 text-sm">
                {order.isGift ? t.dash.orders.gift : order.paymentIntentId ? `Stripe · ${order.paymentIntentId}` : order.paid === false ? d.pendingPayment : d.paid}
              </p>
              {order.shippingLabel && <p className="mt-1 text-xs text-black/55">{f(d.shippingChosen, { label: order.shippingLabel })}</p>}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-[15px] font-semibold tracking-tight">{d.tracking}</h2>
            <ol className="mt-4 space-y-0">
              {timeline.map((e, i) => {
                const done = !!e.at;
                const last = i === timeline.length - 1;
                const detail = e.detailKey ? t.timeline[e.detailKey] : e.detail;
                return (
                  <li key={e.key} className="relative flex gap-4 pb-6 last:pb-0">
                    {!last && <span className={cn("absolute left-[11px] top-6 h-[calc(100%-8px)] w-px", done ? "bg-black" : "bg-line")} />}
                    <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full border", done ? "border-black bg-black text-white" : "border-line bg-white")}>
                      {done && <Check size={12} />}
                    </span>
                    <div className="min-w-0">
                      <p className={cn("text-sm font-medium", !done && "text-black/45")}>{t.timeline[e.key]}</p>
                      <p className="text-xs text-black/50">{e.at ? longDate(e.at) : detail ?? "—"}</p>
                      {e.at && detail && <p className="mt-0.5 text-xs text-black/70">{detail}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>
        </div>

        <div className="space-y-4 xl:col-span-3">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5">
              <h2 className="text-[15px] font-semibold tracking-tight">{f(d.items, { n: order.items.length })}</h2>
            </div>
            <ul className="mt-3 divide-y divide-line">
              {order.items.map((it) => (
                <li key={it.productId} className="flex items-center gap-4 px-5 py-3.5">
                  <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-mist">
                    <ItemImage productId={it.productId} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{it.name}</p>
                    <p className="text-[11px] text-black/50">SKU {it.sku}</p>
                  </div>
                  <p className="hidden text-sm text-black/60 sm:block tabular-nums">{money(it.price)}</p>
                  <p className="w-8 text-center text-sm tabular-nums">×{it.qty}</p>
                  <p className="w-20 text-right text-sm font-semibold tabular-nums">{money(it.price * it.qty)}</p>
                </li>
              ))}
            </ul>
            <dl className="space-y-1.5 border-t border-line px-5 py-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-black/60">{d.subtotal}</dt>
                <dd className="tabular-nums">{money(orderSubtotal(order))}</dd>
              </div>
              {order.discountCode && (
                <div className="flex justify-between">
                  <dt className="text-black/60">{f(d.discount, { code: order.discountCode })}</dt>
                  <dd className="tabular-nums">−{money(order.discountAmount ?? 0)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-black/60">{d.shipping}</dt>
                <dd className="tabular-nums">{money(order.shippingCost)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-base font-semibold">
                <dt>{d.total}</dt>
                <dd className="display tabular-nums">{money(orderTotal(order))}</dd>
              </div>
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="text-[15px] font-semibold tracking-tight">{d.notes}</h2>
            {order.note ? <p className="mt-3 rounded-xl bg-mist p-4 text-sm leading-relaxed">{order.note}</p> : <p className="mt-3 text-sm text-black/50">{d.noNotes}</p>}
            {customer?.note && <p className="mt-3 text-xs text-black/55">{f(d.customerNote, { note: customer.note })}</p>}
          </Card>
        </div>
      </div>

      <ShipDialog open={ship} onClose={() => setShip(false)} orderId={order.id} />
    </>
  );
}

function ItemImage({ productId }: { productId: string }) {
  const image = useAdmin((s) => s.products.find((p) => p.id === productId)?.image);
  return image ? <Image src={image} alt="" fill sizes="56px" className="object-contain" /> : null;
}
