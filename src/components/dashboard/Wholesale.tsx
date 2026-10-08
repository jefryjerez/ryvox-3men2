"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Mail, Plus, X } from "lucide-react";
import { Card, PageHeader, Pill } from "@/components/dashboard/ui";
import { WholesaleOrderForm, type WholesaleInitial } from "@/components/dashboard/WholesaleOrderForm";
import { Button } from "@/components/ui/Button";
import { orderTotal, type WholesaleRequest } from "@/lib/orders";
import type { WholesaleCharge } from "@/lib/wholesale";
import { useT } from "@/i18n/client";

const POLL_MS = 15_000;

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) } });
  if (res.status === 401) {
    window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
    throw new Error("Sesión caducada");
  }
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
  return data;
}

/** Mayoreo: solicitudes que llegan del landing (el dueño les pone precio) y los cobros al por mayor con su enlace de pago. */
export function Wholesale() {
  const { t, f, money, shortDate } = useT();
  const w = t.dash.wholesale;
  const [requests, setRequests] = useState<WholesaleRequest[] | null>(null);
  const [charges, setCharges] = useState<WholesaleCharge[] | null>(null);
  const [form, setForm] = useState<{ initial?: WholesaleInitial } | null>(null);
  // Cada vez que se abre el formulario cambia la clave para que empiece limpio.
  const [formSeq, setFormSeq] = useState(0);
  const [tick, setTick] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mail, setMail] = useState<{ id: string; state: "sending" | "sent" } | null>(null);

  // Vuelve a lanzar la carga (por ejemplo después de una acción) sin duplicar la lógica del efecto.
  const load = useCallback(async () => setTick((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const [r, c] = await Promise.all([call<{ requests: WholesaleRequest[] }>("/api/admin/wholesale/requests"), call<{ charges: WholesaleCharge[] }>("/api/admin/wholesale/orders")]);
        if (cancelled) return;
        setRequests(r.requests);
        setCharges(c.charges);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      }
    };
    void run();
    const timer = setInterval(() => void run(), POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [tick]);

  async function setStatus(id: string, status: "nueva" | "descartada") {
    setError(null);
    try {
      const data = await call<{ requests: WholesaleRequest[] }>(`/api/admin/wholesale/requests/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      setRequests(data.requests);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function copyLink(id: string, url: string) {
    await navigator.clipboard.writeText(url).catch(() => null);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  }

  async function sendEmail(id: string) {
    setMail({ id, state: "sending" });
    setError(null);
    try {
      await call(`/api/admin/wholesale/orders/${id}/send`, { method: "POST" });
      setMail({ id, state: "sent" });
      setTimeout(() => setMail(null), 2500);
    } catch (err) {
      setError((err as Error).message);
      setMail(null);
    }
  }

  async function cancelCharge(id: string, number: string) {
    if (!window.confirm(f(w.cancelConfirm, { n: number }))) return;
    setError(null);
    try {
      await call(`/api/admin/wholesale/orders/${id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const openForm = (initial?: WholesaleInitial) => {
    setFormSeq((n) => n + 1);
    setForm({ initial });
  };
  const prepare = (r: WholesaleRequest) =>
    openForm({ requestId: r.id, name: r.name, email: r.email, phone: r.phone, customerMessage: r.message, lines: r.items.map((i) => ({ productId: i.productId, qty: i.qty })) });

  const closeForm = useCallback(() => {
    setForm(null);
    void load();
  }, [load]);

  return (
    <>
      <PageHeader title={w.title} subtitle={w.subtitle}>
        {!form && (
          <Button size="sm" onClick={() => openForm()}>
            <Plus size={14} /> {w.newCharge}
          </Button>
        )}
      </PageHeader>
      {error && <p className="mb-4 rounded-2xl border border-alert/40 bg-white px-4 py-3 text-sm font-medium text-alert">{error}</p>}

      {form && (
        <div className="mb-6">
          {form.initial && <p className="mb-2 text-sm font-medium">{f(w.requestFrom, { name: form.initial.name })}</p>}
          <WholesaleOrderForm key={formSeq} initial={form.initial} onClose={closeForm} onChanged={load} />
        </div>
      )}

      <Card className="p-5 sm:p-6">
        <h2 className="text-[15px] font-semibold tracking-tight">{w.requestsTitle}</h2>
        <ul className="mt-3 divide-y divide-line">
          {(requests ?? []).map((r) => (
            <li key={r.id} className="py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {r.name} <span className="font-normal text-black/45">· {shortDate(r.createdAt)}</span>
                  </p>
                  <p className="text-xs text-black/55">
                    {r.email}
                    {r.phone && ` · ${r.phone}`}
                  </p>
                </div>
                <Pill tone={r.status === "nueva" ? "pending" : r.status === "cobro" ? "active" : "muted"}>{w.status[r.status]}</Pill>
              </div>
              <ul className="mt-2 space-y-0.5 text-sm">
                {r.items.map((i) => (
                  <li key={i.productId}>
                    {i.name} <span className="text-black/50">× {i.qty}</span>
                  </li>
                ))}
              </ul>
              {r.message && <p className="mt-2 whitespace-pre-wrap rounded-xl bg-mist p-3 text-xs leading-relaxed">{r.message}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {r.status === "nueva" && (
                  <Button size="sm" onClick={() => prepare(r)}>
                    {w.prepare}
                  </Button>
                )}
                {r.status === "nueva" && (
                  <Button size="sm" variant="ghost" onClick={() => setStatus(r.id, "descartada")}>
                    {w.discard}
                  </Button>
                )}
                {r.status === "descartada" && (
                  <Button size="sm" variant="secondary" onClick={() => setStatus(r.id, "nueva")}>
                    {w.reopen}
                  </Button>
                )}
              </div>
            </li>
          ))}
          {requests !== null && requests.length === 0 && <li className="py-6 text-center text-sm text-black/50">{w.noRequests}</li>}
        </ul>
      </Card>

      <Card className="mt-4 p-5 sm:p-6">
        <h2 className="text-[15px] font-semibold tracking-tight">{w.chargesTitle}</h2>
        <ul className="mt-3 divide-y divide-line">
          {(charges ?? []).map(({ order, payUrl }) => (
            <li key={order.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium tabular-nums">
                  {order.number} <span className="font-normal text-black/50">· {shortDate(order.createdAt)}</span>
                </p>
                <p className="truncate text-xs text-black/55">
                  {order.shippingAddress.name} · {order.email}
                </p>
              </div>
              <p className="text-sm font-semibold tabular-nums">{money(orderTotal(order))}</p>
              <Pill tone={order.paid ? "active" : "pending"}>{order.paid ? w.paid : w.pending}</Pill>
              {order.paid ? (
                <Link href={`/dashboard/ordenes/${order.id}`} className="text-xs font-medium text-black/60 underline-offset-4 hover:underline">
                  {w.viewOrder}
                </Link>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  {payUrl && (
                    <button type="button" onClick={() => copyLink(order.id, payUrl)} className="inline-flex items-center gap-1.5 text-xs font-medium text-black/60 hover:text-black">
                      {copiedId === order.id ? <Check size={13} /> : <Copy size={13} />} {copiedId === order.id ? w.copied : w.copyLink}
                    </button>
                  )}
                  {payUrl && (
                    <button type="button" disabled={mail?.id === order.id && mail.state === "sending"} onClick={() => sendEmail(order.id)} className="inline-flex items-center gap-1.5 text-xs font-medium text-black/60 hover:text-black disabled:opacity-50">
                      {mail?.id === order.id && mail.state === "sent" ? <Check size={13} /> : <Mail size={13} />}{" "}
                      {mail?.id === order.id ? (mail.state === "sending" ? w.sending : w.sent) : w.sendEmail}
                    </button>
                  )}
                  <button type="button" onClick={() => cancelCharge(order.id, order.number)} className="inline-flex items-center gap-1.5 text-xs font-medium text-alert hover:opacity-80">
                    <X size={13} /> {w.cancelCharge}
                  </button>
                </div>
              )}
            </li>
          ))}
          {charges !== null && charges.length === 0 && <li className="py-6 text-center text-sm text-black/50">{w.noCharges}</li>}
        </ul>
      </Card>
    </>
  );
}
