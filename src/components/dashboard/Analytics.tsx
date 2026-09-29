"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Radio } from "lucide-react";
import { Card, PageHeader } from "@/components/dashboard/ui";
import { useT } from "@/i18n/client";

const VisitsChart = dynamic(() => import("./VisitsChart"), { ssr: false, loading: () => <div className="h-56 sm:h-64" /> });

const POLL_MS = 15_000;

type Range = "7d" | "30d" | "90d" | "custom";

function isoDaysAgo(n: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

export function Analytics() {
  const { t } = useT();
  const a = t.dash.analytics;
  const [live, setLive] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch("/api/admin/analytics/live");
        const data = (await res.json().catch(() => ({}))) as { count?: number | null };
        if (!cancelled) setLive(typeof data.count === "number" ? data.count : null);
      } catch {
        if (!cancelled) setLive(null);
      }
    };
    poll();
    const timer = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const [range, setRange] = useState<Range>("30d");
  const [customFrom, setCustomFrom] = useState(isoDaysAgo(30));
  const [customTo, setCustomTo] = useState(isoDaysAgo(0));

  const { from, to } = useMemo(() => {
    if (range === "7d") return { from: isoDaysAgo(7), to: isoDaysAgo(0) };
    if (range === "90d") return { from: isoDaysAgo(90), to: isoDaysAgo(0) };
    if (range === "custom") return { from: customFrom, to: customTo };
    return { from: isoDaysAgo(30), to: isoDaysAgo(0) };
  }, [range, customFrom, customTo]);

  const [days, setDays] = useState<{ date: string; visits: number }[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setDays(null);
      setError(null);
      try {
        const res = await fetch(`/api/admin/analytics/history?from=${from}&to=${to}`);
        const data = (await res.json()) as { days?: { date: string; visits: number }[]; error?: string };
        if (cancelled) return;
        if (data.error) setError(data.error);
        setDays(data.days ?? []);
      } catch {
        if (!cancelled) setError("fetch failed");
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  const total = days?.reduce((sum, d) => sum + d.visits, 0) ?? 0;

  const [referrers, setReferrers] = useState<{ host: string; visits: number }[] | null>(null);
  const [refError, setRefError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setReferrers(null);
      setRefError(null);
      try {
        const res = await fetch(`/api/admin/analytics/referrers?from=${from}&to=${to}`);
        const data = (await res.json()) as { referrers?: { host: string; visits: number }[]; error?: string };
        if (cancelled) return;
        if (data.error) setRefError(data.error);
        setReferrers(data.referrers ?? []);
      } catch {
        if (!cancelled) setRefError("fetch failed");
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  const maxRefVisits = Math.max(1, ...(referrers ?? []).map((r) => r.visits));

  const tab = (value: Range, label: string) => (
    <button
      onClick={() => setRange(value)}
      className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition ${
        range === value ? "bg-black text-white" : "bg-mist text-black/60 hover:text-black"
      }`}
    >
      {label}
    </button>
  );

  return (
    <>
      <PageHeader title={a.title} subtitle={a.subtitle} />

      <Card className="flex items-center gap-4 p-5 sm:p-6">
        <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black text-white">
          <Radio size={22} />
          {live !== null && live > 0 && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 animate-pulse rounded-full bg-alert ring-2 ring-white" />}
        </span>
        <div>
          <p className="text-xs text-black/55">{a.liveNow}</p>
          <p className="display mt-0.5 text-3xl tabular-nums">{live === null ? "—" : live}</p>
        </div>
      </Card>

      <Card className="mt-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight">{a.historyTitle}</h2>
            <p className="display mt-0.5 text-2xl tabular-nums">{total}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {tab("7d", a.range7d)}
            {tab("30d", a.range30d)}
            {tab("90d", a.range90d)}
            {tab("custom", a.rangeCustom)}
          </div>
        </div>

        {range === "custom" && (
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <label className="flex items-center gap-2">
              <span className="text-black/55">{a.from}</span>
              <input
                type="date"
                value={customFrom}
                max={customTo}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="rounded-lg border border-line px-2.5 py-1.5"
              />
            </label>
            <label className="flex items-center gap-2">
              <span className="text-black/55">{a.to}</span>
              <input
                type="date"
                value={customTo}
                min={customFrom}
                max={isoDaysAgo(0)}
                onChange={(e) => setCustomTo(e.target.value)}
                className="rounded-lg border border-line px-2.5 py-1.5"
              />
            </label>
          </div>
        )}

        <div className="mt-4">
          {error ? (
            <p className="py-8 text-center text-sm text-black/45">
              {a.historyError}
              <br />
              <span className="text-xs text-black/30">{error}</span>
            </p>
          ) : days === null ? (
            <div className="h-56 sm:h-64" />
          ) : days.length === 0 ? (
            <p className="py-8 text-center text-sm text-black/45">{a.historyEmpty}</p>
          ) : (
            <VisitsChart series={days} />
          )}
        </div>
      </Card>

      <Card className="mt-4 p-5 sm:p-6">
        <h2 className="text-[15px] font-semibold tracking-tight">{a.sourcesTitle}</h2>
        <div className="mt-4">
          {refError ? (
            <p className="py-8 text-center text-sm text-black/45">
              {a.historyError}
              <br />
              <span className="text-xs text-black/30">{refError}</span>
            </p>
          ) : referrers === null ? (
            <div className="h-32" />
          ) : referrers.length === 0 ? (
            <p className="py-8 text-center text-sm text-black/45">{a.sourcesEmpty}</p>
          ) : (
            <ul className="space-y-2.5">
              {referrers.map((r) => (
                <li key={r.host} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 truncate text-sm sm:w-48">{r.host || a.direct}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-mist">
                    <span className="block h-full rounded-full bg-black" style={{ width: `${(r.visits / maxRefVisits) * 100}%` }} />
                  </span>
                  <span className="w-10 shrink-0 text-right text-sm tabular-nums text-black/60">{r.visits}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </>
  );
}
