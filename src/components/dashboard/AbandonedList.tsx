"use client";

import Link from "next/link";
import { useMemo, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { ChevronRight, Mail } from "lucide-react";
import { useAdmin } from "@/store/admin";
import { isPlaceholderEmail, orderTotal, type Customer, type Order } from "@/lib/orders";
import { cn } from "@/lib/format";
import { Card, PageHeader, td, th } from "@/components/dashboard/ui";
import { useT } from "@/i18n/client";

const OFFER_PERCENTS = [10, 15, 20, 25];

/** Llegó a la página de pago de Stripe (web) o se generó el cobro (venta en persona), pero nunca pagó. */
function reachedPayment(o: Order) {
  return !!(o.checkoutSessionId || o.paymentIntentId);
}

function StatePill({ o, d }: { o: Order; d: { inPerson: string; reached: string; notReached: string } }) {
  const inPerson = o.shippingService === "pickup";
  const reached = reachedPayment(o);
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium", reached ? "bg-black text-white" : "bg-mist text-black/60")}>
      {inPerson ? d.inPerson : reached ? d.reached : d.notReached}
    </span>
  );
}

/** Botón "Escribir" que abre un menú de plantillas de % para mandar la oferta por correo. Componente estable
 *  (fuera del padre) para que su ref no se pierda cada vez que el padre se re-renderiza. */
function Offer({
  o,
  customer,
  className,
  open,
  busy,
  label,
  onOpen,
  onClose,
}: {
  o: Order;
  customer: Customer | undefined;
  className?: string;
  open: boolean;
  busy: boolean;
  label: string;
  onOpen: (id: string, coords: { top: number; right: number }) => void;
  onClose: () => void;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  if (!customer || isPlaceholderEmail(customer.email)) return null;

  function toggle(e: MouseEvent) {
    e.stopPropagation();
    if (open) {
      onClose();
      return;
    }
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) onOpen(o.id, { top: rect.bottom + 6, right: window.innerWidth - rect.right });
  }

  return (
    <div className={cn("inline-block text-left", className)}>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        disabled={busy}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-black/60 hover:text-black disabled:opacity-50"
      >
        <Mail size={13} /> {label}
      </button>
    </div>
  );
}

export function AbandonedList() {
  const { t, f, money, shortDate } = useT();
  const abandoned = useAdmin((s) => s.abandoned);
  const customers = useAdmin((s) => s.customers);
  const sendAbandonedOffer = useAdmin((s) => s.sendAbandonedOffer);
  const [q, setQ] = useState("");
  const d = t.dash.abandoned;

  const [openId, setOpenId] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ top: number; right: number } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [sentId, setSentId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  function openMenu(id: string, c: { top: number; right: number }) {
    setCoords(c);
    setOpenId(id);
  }
  function closeMenu() {
    setOpenId(null);
  }

  async function sendOffer(o: Order, percentOff: number) {
    setBusyId(o.id);
    setErrorId(null);
    setOpenId(null);
    const res = await sendAbandonedOffer(o.id, percentOff);
    setBusyId(null);
    if (res.ok) {
      setSentId(o.id);
      setTimeout(() => setSentId(null), 2500);
    } else {
      setErrorId(o.id);
      setTimeout(() => setErrorId(null), 2500);
    }
  }

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return [...abandoned]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .filter((o) => {
        if (!term) return true;
        const c = customers.find((x) => x.id === o.customerId);
        return o.number.includes(term) || c?.name.toLowerCase().includes(term) || c?.email.toLowerCase().includes(term);
      });
  }, [abandoned, customers, q]);

  const openOrder = openId ? rows.find((o) => o.id === openId) : null;

  function offerLabel(o: Order) {
    return sentId === o.id ? d.sent : errorId === o.id ? d.sendError : d.write;
  }

  return (
    <>
      <PageHeader title={d.title} subtitle={f(d.subtitle, { n: abandoned.length })} />

      <div className="flex justify-end">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={d.search} className="h-10 w-full rounded-full border border-line bg-white px-4 text-sm outline-none focus:border-black md:w-72" />
      </div>

      <ul className="mt-4 space-y-2 md:hidden">
        {rows.map((o) => {
          const c = customers.find((x) => x.id === o.customerId);
          return (
            <li key={o.id} className="rounded-2xl border border-line bg-white p-4">
              <Link href={`/dashboard/ordenes/${o.id}`} className="block">
                <div className="flex items-center justify-between">
                  <p className="font-semibold tabular-nums">{o.number}</p>
                  <StatePill o={o} d={d} />
                </div>
                <p className="mt-1 text-sm">{c?.name}</p>
                <p className="text-[11px] text-black/45">{c && !isPlaceholderEmail(c.email) ? c.email : ""}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-black/55">
                  <span>
                    {f(t.dash.orders.itemsCount, { n: o.items.length })} · {shortDate(o.createdAt)}
                  </span>
                  <span className="text-sm font-semibold text-black tabular-nums">{money(orderTotal(o))}</span>
                </div>
              </Link>
              <Offer o={o} customer={c} className="mt-3" open={openId === o.id} busy={busyId === o.id} label={offerLabel(o)} onOpen={openMenu} onClose={closeMenu} />
            </li>
          );
        })}
        {rows.length === 0 && <li className="rounded-2xl border border-line bg-white p-6 text-center text-sm text-black/50">{d.none}</li>}
      </ul>

      <Card className="mt-4 hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="border-b border-line bg-mist/60">
              <tr>
                <th className={th}>{d.number}</th>
                <th className={th}>{d.customer}</th>
                <th className={th}>{d.items}</th>
                <th className={th}>{d.total}</th>
                <th className={th}>{d.state}</th>
                <th className={th}>{d.date}</th>
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
                      <p className="text-[11px] text-black/45">{c && !isPlaceholderEmail(c.email) ? c.email : "—"}</p>
                    </td>
                    <td className={`${td} text-black/70`}>
                      {first?.name}
                      {o.items.length > 1 && <span className="text-black/40"> +{o.items.length - 1}</span>}
                    </td>
                    <td className={`${td} font-medium tabular-nums`}>{money(orderTotal(o))}</td>
                    <td className={td}>
                      <StatePill o={o} d={d} />
                    </td>
                    <td className={`${td} text-black/60`}>{shortDate(o.createdAt)}</td>
                    <td className={`${td} text-right`}>
                      <div className="inline-flex items-center gap-4">
                        <Offer o={o} customer={c} open={openId === o.id} busy={busyId === o.id} label={offerLabel(o)} onOpen={openMenu} onClose={closeMenu} />
                        <Link href={`/dashboard/ordenes/${o.id}`} aria-label={f(d.view, { n: o.number })} className="inline-flex text-black/40 hover:text-black">
                          <ChevronRight size={16} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-black/50">
                    {d.none}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {openOrder &&
        coords &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <div className="fixed inset-0 z-40" onClick={closeMenu} />
            <div style={{ top: coords.top, right: coords.right }} className="fixed z-50 w-36 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-lg">
              {OFFER_PERCENTS.map((pct) => (
                <button
                  key={pct}
                  type="button"
                  disabled={busyId === openOrder.id}
                  onClick={() => sendOffer(openOrder, pct)}
                  className="block w-full px-3 py-2 text-left text-xs font-medium hover:bg-mist disabled:opacity-50"
                >
                  {f(d.template, { n: pct })}
                </button>
              ))}
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
