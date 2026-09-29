"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, Copy, PackageCheck, Printer, Truck, Warehouse } from "lucide-react";
import { useAdmin } from "@/store/admin";
import { orderTimeline } from "@/lib/orders";
import { cn } from "@/lib/format";
import { Card, PageHeader, StatCard, StatusBadge } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/Button";
import { ShipDialog } from "@/components/dashboard/ShipDialog";
import { useT } from "@/i18n/client";

type Tab = "por-enviar" | "en-camino" | "entregados";

export function Shipments() {
  const { t, shortDate } = useT();
  const s = t.dash.shipments;
  const orders = useAdmin((x) => x.orders);
  const customers = useAdmin((x) => x.customers);
  const [tab, setTab] = useState<Tab>("por-enviar");
  const [shipId, setShipId] = useState<string | null>(null);

  const groups = useMemo(
    () => ({
      "por-enviar": orders.filter((o) => o.status === "pendiente" || o.status === "procesando"),
      "en-camino": orders.filter((o) => o.status === "enviado"),
      entregados: orders.filter((o) => o.status === "entregado"),
    }),
    [orders],
  );
  const list = [...groups[tab]].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const TABS: { id: Tab; label: string }[] = [
    { id: "por-enviar", label: s.toShip },
    { id: "en-camino", label: s.inTransit },
    { id: "entregados", label: s.delivered },
  ];

  return (
    <>
      <PageHeader title={s.title} subtitle={s.subtitle} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard icon={<Warehouse size={20} />} label={s.toShip} value={String(groups["por-enviar"].length)} hint={s.waiting} />
        <StatCard icon={<Truck size={20} />} label={s.inTransit} value={String(groups["en-camino"].length)} hint={s.withTracking} />
        <StatCard icon={<PackageCheck size={20} />} label={s.delivered} value={String(groups.entregados.length)} hint={s.last30} />
      </div>

      <div className="mt-6 flex gap-2">
        {TABS.map((x) => (
          <button key={x.id} type="button" onClick={() => setTab(x.id)} className={cn("rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors", tab === x.id ? "border-black bg-black text-white" : "border-line bg-white text-black/70 hover:border-black")}>
            {x.label} <span className={cn("ml-1 tabular-nums", tab === x.id ? "text-white/60" : "text-black/40")}>{groups[x.id].length}</span>
          </button>
        ))}
      </div>

      <ul className="mt-4 grid gap-3 lg:grid-cols-2">
        {list.map((o) => {
          const c = customers.find((x) => x.id === o.customerId);
          const timeline = orderTimeline(o);
          const done = timeline.filter((e) => e.at).length;
          const current = timeline[Math.max(0, done - 1)];
          return (
            <li key={o.id}>
              <Card className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link href={`/dashboard/ordenes/${o.id}`} className="font-semibold tabular-nums hover:underline">
                      {o.number}
                    </Link>
                    <p className="text-sm">{c?.name}</p>
                    <p className="text-xs text-black/50">
                      {o.shippingAddress.city}, {o.shippingAddress.region} · {shortDate(o.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>

                <div className="mt-4 flex items-center gap-1.5" aria-hidden>
                  {timeline.map((e, i) => (
                    <span key={e.key} className={cn("h-1 flex-1 rounded-full", i < done ? "bg-black" : "bg-black/10")} />
                  ))}
                </div>
                <p className="mt-2 text-xs text-black/55">{current ? t.timeline[current.key] : ""}</p>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
                  {o.tracking ? (
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-wider text-black/45">{o.carrier}</p>
                      <button type="button" onClick={() => navigator.clipboard?.writeText(o.tracking!)} className="inline-flex max-w-full items-center gap-1.5 truncate text-sm font-medium hover:underline" title={s.copy}>
                        <span className="truncate">{o.tracking}</span> <Copy size={12} className="shrink-0 text-black/40" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-black/50">{s.noTracking}</p>
                  )}
                  {tab === "por-enviar" ? (
                    <Button size="sm" onClick={() => setShipId(o.id)}>
                      <Truck size={14} /> {s.send}
                    </Button>
                  ) : o.labelUrl ? (
                    <a href={o.labelUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-black/60 hover:text-black">
                      <Printer size={14} /> {s.label}
                    </a>
                  ) : (
                    <Link href={`/dashboard/ordenes/${o.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-black/60 hover:text-black">
                      {s.detail} <ChevronRight size={14} />
                    </Link>
                  )}
                </div>
              </Card>
            </li>
          );
        })}
        {list.length === 0 && <li className="rounded-2xl border border-dashed border-line p-10 text-center text-sm text-black/50">{s.empty}</li>}
      </ul>

      <ShipDialog open={!!shipId} onClose={() => setShipId(null)} orderId={shipId ?? ""} />
    </>
  );
}
