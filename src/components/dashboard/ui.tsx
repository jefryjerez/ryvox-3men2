"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, ChevronRight } from "lucide-react";
import { cn, pct } from "@/lib/format";
import type { OrderStatus } from "@/lib/orders";
import { useT } from "@/i18n/client";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl border border-line bg-white", className)}>{children}</div>;
}

export function CardHeader({ title, action, href }: { title: string; action?: string; href?: string }) {
  return (
    <div className="flex items-center justify-between px-5 pt-5">
      <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
      {action && href && (
        <Link href={href} className="inline-flex items-center gap-1 text-xs font-medium text-black/60 hover:text-black">
          {action} <ChevronRight size={14} />
        </Link>
      )}
    </div>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="display text-3xl md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-black/55">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

/* Escala mínima de estados:
   pendiente / procesando → gris medio · enviado / entregado / activo → negro · alerta → rojo */
type Tone = "pending" | "active" | "alert" | "muted";

export function Pill({ tone, children, className }: { tone: Tone; children: ReactNode; className?: string }) {
  const styles: Record<Tone, string> = {
    pending: "bg-black/6 text-black/70",
    active: "bg-black text-white",
    alert: "bg-alert text-white",
    muted: "border border-line text-black/45",
  };
  const dot: Record<Tone, string> = { pending: "bg-muted", active: "bg-white", alert: "bg-white", muted: "bg-black/30" };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold", styles[tone], className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", dot[tone])} />
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useT();
  const tone: Tone = status === "enviado" || status === "entregado" ? "active" : status === "cancelado" ? "muted" : "pending";
  return <Pill tone={tone}>{t.status[status]}</Pill>;
}

export function StockBar({ stock, low }: { stock: number; low: number }) {
  const isLow = stock <= low;
  const max = Math.max(low * 4, stock, 1);
  const w = Math.min(100, Math.round((stock / max) * 100));
  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/8">
        <div className={cn("h-full rounded-full", isLow ? "bg-alert" : "bg-black")} style={{ width: `${w}%` }} />
      </div>
      <span className={cn("w-8 text-right text-xs font-semibold tabular-nums", isLow && "text-alert")}>{stock}</span>
    </div>
  );
}

export function Sparkline({ data, alert }: { data: number[]; alert?: boolean }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex h-9 items-end gap-[3px]" aria-hidden>
      {data.map((v, i) => (
        <span key={i} className={cn("w-1.5 rounded-sm", alert ? "bg-alert/70" : i === data.length - 1 ? "bg-black" : "bg-black/20")} style={{ height: `${Math.max(12, (v / max) * 100)}%` }} />
      ))}
    </div>
  );
}

export function StatCard({ icon, label, value, delta, hint, spark, alert, href }: {
  icon: ReactNode; label: string; value: string; delta?: number; hint?: string; spark?: number[]; alert?: boolean; href?: string;
}) {
  const body = (
    <Card className={cn("flex items-center gap-4 p-4 sm:p-5", alert && "border-alert/40")}>
      <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", alert ? "bg-alert text-white" : "bg-black text-white")}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-black/55">{label}</p>
        <p className={cn("display mt-0.5 text-2xl tabular-nums", alert && "text-alert")}>{value}</p>
        {(delta !== undefined || hint) && (
          <p className="mt-1 flex items-center gap-1 text-[11px] text-black/50">
            {delta !== undefined && (
              <span className="inline-flex items-center font-semibold text-black">
                {delta >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {pct(delta)}
              </span>
            )}
            {hint}
          </p>
        )}
      </div>
      {spark && <div className="hidden sm:block">{<Sparkline data={spark} alert={alert} />}</div>}
    </Card>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export const th = "px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-black/45 first:pl-5 last:pr-5";
export const td = "px-4 py-3.5 text-sm first:pl-5 last:pr-5";
