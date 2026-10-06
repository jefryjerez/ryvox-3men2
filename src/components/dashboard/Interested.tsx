"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Card, PageHeader, td, th } from "@/components/dashboard/ui";
import { useAdmin } from "@/store/admin";
import type { NotifyRequest } from "@/lib/orders";
import { useT } from "@/i18n/client";

const POLL_MS = 15_000;

/** Personas que dejaron su correo para que les avisen cuando un producto "Próximamente" salga a la venta. */
export function Interested() {
  const { t, f, shortDate } = useT();
  const d = t.dash.interested;
  const products = useAdmin((s) => s.products);
  const [requests, setRequests] = useState<NotifyRequest[] | null>(null);
  const [productId, setProductId] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/admin/notify-requests");
        if (res.status === 401) {
          window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
          return;
        }
        const data = (await res.json()) as { requests?: NotifyRequest[] };
        if (!cancelled) setRequests(data.requests ?? []);
      } catch {
        if (!cancelled) setRequests((prev) => prev ?? []);
      }
    };
    void load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const nameOf = (id: string) => products.find((p) => p.id === id)?.name ?? d.removedProduct;

  // Productos que tienen al menos una persona interesada, con su cantidad.
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of requests ?? []) map.set(r.productId, (map.get(r.productId) ?? 0) + 1);
    return map;
  }, [requests]);

  const rows = (requests ?? []).filter((r) => !productId || r.productId === productId);

  function copyEmails() {
    const emails = [...new Set(rows.map((r) => r.email))].join(", ");
    navigator.clipboard?.writeText(emails).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <>
      <PageHeader title={d.title} subtitle={d.subtitle} />

      <div className="flex flex-wrap items-center gap-3">
        <select value={productId} onChange={(e) => setProductId(e.target.value)} className="h-10 rounded-full border border-line bg-white px-4 text-sm outline-none focus:border-black">
          <option value="">
            {d.all} ({requests?.length ?? 0})
          </option>
          {[...counts.entries()].map(([id, n]) => (
            <option key={id} value={id}>
              {nameOf(id)} ({n})
            </option>
          ))}
        </select>
        <p className="text-sm text-black/55">{f(d.count, { n: rows.length })}</p>
        <button type="button" onClick={copyEmails} disabled={rows.length === 0} className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium text-black/60 hover:text-black disabled:opacity-40">
          {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? d.copied : d.copy}
        </button>
      </div>

      <Card className="mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead className="border-b border-line bg-mist/60">
              <tr>
                <th className={th}>{d.email}</th>
                <th className={th}>{d.product}</th>
                <th className={th}>{d.date}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-mist/50">
                  <td className={`${td} font-medium`}>{r.email}</td>
                  <td className={`${td} text-black/70`}>{nameOf(r.productId)}</td>
                  <td className={`${td} text-black/60`}>{shortDate(r.createdAt)}</td>
                </tr>
              ))}
              {requests !== null && rows.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-10 text-center text-sm text-black/50">
                    {d.none}
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
