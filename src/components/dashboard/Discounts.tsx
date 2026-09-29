"use client";

import { useState, type FormEvent } from "react";
import { Check, Copy } from "lucide-react";
import { Card, PageHeader, td, th } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/format";
import { useAdmin } from "@/store/admin";
import { useT } from "@/i18n/client";

const input = "h-11 w-full rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-black";

function suggestCode() {
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `VUELVE-${suffix}`;
}

export function Discounts() {
  const { t, shortDate } = useT();
  const d = t.dash.discounts;
  const codes = useAdmin((s) => s.discountCodes);
  const createDiscountCode = useAdmin((s) => s.createDiscountCode);
  const toggleDiscountCodeActive = useAdmin((s) => s.toggleDiscountCodeActive);

  const [code, setCode] = useState(suggestCode);
  const [percentOff, setPercentOff] = useState(10);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await createDiscountCode({ code, percentOff, note: note || undefined });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setCode(suggestCode());
    setNote("");
  }

  function copy(c: string) {
    navigator.clipboard?.writeText(c).then(() => {
      setCopied(c);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  return (
    <>
      <PageHeader title={d.title} subtitle={d.subtitle} />

      <Card className="p-5 sm:p-6">
        <h2 className="text-[15px] font-semibold tracking-tight">{d.create}</h2>
        <form onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-[2fr_1fr_2fr_auto] sm:items-end">
          <label>
            <span className="mb-1.5 block text-xs font-medium text-black/60">{d.code}</span>
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className={cn(input, "uppercase tracking-wide")} required />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium text-black/60">{d.percentOff}</span>
            <input type="number" min={1} max={100} value={percentOff} onChange={(e) => setPercentOff(Number(e.target.value))} className={input} required />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium text-black/60">{d.note}</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={d.notePlaceholder} className={input} />
          </label>
          <Button type="submit" disabled={busy}>
            {busy ? d.creating : d.createBtn}
          </Button>
        </form>
        {error && <p className="mt-3 text-sm font-medium text-alert">{error}</p>}
      </Card>

      <Card className="mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="border-b border-line bg-mist/60">
              <tr>
                <th className={th}>{d.code}</th>
                <th className={th}>{d.percentOff}</th>
                <th className={th}>{d.uses}</th>
                <th className={th}>{d.created}</th>
                <th className={th}>{d.active}</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {codes.map((c) => (
                <tr key={c.id} className="hover:bg-mist/50">
                  <td className={`${td} font-medium tabular-nums`}>{c.code}</td>
                  <td className={td}>{c.percentOff}%</td>
                  <td className={`${td} tabular-nums text-black/70`}>{c.usesCount}</td>
                  <td className={`${td} text-black/60`}>{shortDate(c.createdAt)}</td>
                  <td className={td}>
                    <button
                      onClick={() => toggleDiscountCodeActive(c.id)}
                      className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium", c.active ? "bg-black text-white" : "bg-mist text-black/60")}
                    >
                      {c.active ? d.on : d.off}
                    </button>
                  </td>
                  <td className={`${td} text-right`}>
                    <button onClick={() => copy(c.code)} className="inline-flex items-center gap-1.5 text-xs font-medium text-black/60 hover:text-black">
                      {copied === c.code ? <Check size={13} /> : <Copy size={13} />} {copied === c.code ? d.copied : d.copy}
                    </button>
                  </td>
                </tr>
              ))}
              {codes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-black/50">
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
