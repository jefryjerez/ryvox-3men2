"use client";

import { Bell, Menu, RefreshCw, Search } from "lucide-react";
import { useAdmin, isLowStock } from "@/store/admin";
import { PushBell } from "@/components/dashboard/PushBell";
import { useT } from "@/i18n/client";

export function Topbar() {
  const { t, f } = useT();
  const products = useAdmin((s) => s.products);
  const loading = useAdmin((s) => s.loading);
  const load = useAdmin((s) => s.load);
  const me = useAdmin((s) => s.me);
  const low = products.filter((p) => p.active && isLowStock(p)).length;

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-mist/85 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button type="button" aria-label={t.nav.openMenu} onClick={() => window.dispatchEvent(new Event("ryvox:open-sidebar"))} className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/5 lg:hidden">
          <Menu size={20} />
        </button>
        <label className="relative hidden flex-1 md:block md:max-w-md">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-black/40" />
          <input type="search" placeholder={t.dash.topbar.search} className="h-10 w-full rounded-full border border-line bg-white pl-10 pr-4 text-sm outline-none placeholder:text-black/40 focus:border-black" />
        </label>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            aria-label={t.dash.topbar.refresh}
            title={t.dash.topbar.refresh}
            disabled={loading}
            onClick={() => load()}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/5 disabled:opacity-50"
          >
            <RefreshCw size={18} strokeWidth={1.75} className={loading ? "animate-spin" : ""} />
          </button>
          <button type="button" aria-label={low > 0 ? f(t.dash.topbar.alerts, { n: low }) : t.dash.topbar.noAlerts} className="relative inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/5">
            <Bell size={19} strokeWidth={1.75} />
            {low > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-alert" />}
          </button>
          <PushBell />
          <div className="flex items-center gap-3 pl-1">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-xs font-semibold uppercase text-white">{me?.name.trim().charAt(0) || "·"}</span>
            <div className="hidden leading-tight sm:block">
              <p className="text-sm font-medium">{me?.name ?? ""}</p>
              <p className="text-[11px] text-black/50">{me?.roleName ?? ""}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
