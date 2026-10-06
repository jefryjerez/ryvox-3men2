"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BarChart3, BellPlus, Boxes, ClipboardList, ExternalLink, LayoutGrid, LayoutTemplate, LogOut, Package, Percent, ShoppingCart, Smartphone, Truck, Users, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { LanguageSwitch } from "@/components/brand/LanguageSwitch";
import { useAdmin, isLowStock } from "@/store/admin";
import { cn } from "@/lib/format";
import { useT } from "@/i18n/client";

export function useSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [seenPath, setSeenPath] = useState(pathname);
  if (seenPath !== pathname) {
    setSeenPath(pathname);
    setOpen(false);
  }
  return { open, setOpen };
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useT();
  const pathname = usePathname();
  const orders = useAdmin((s) => s.orders);
  const abandoned = useAdmin((s) => s.abandoned);
  const products = useAdmin((s) => s.products);
  const pending = orders.filter((o) => o.status === "pendiente" || o.status === "procesando").length;
  const low = products.filter((p) => p.active && isLowStock(p)).length;

  const NAV = [
    { href: "/dashboard", label: t.dash.nav.overview, icon: LayoutGrid },
    { href: "/dashboard/analiticas", label: t.dash.nav.analytics, icon: BarChart3 },
    { href: "/dashboard/ordenes", label: t.dash.nav.orders, icon: ClipboardList },
    { href: "/dashboard/abandonados", label: t.dash.nav.abandoned, icon: ShoppingCart },
    { href: "/dashboard/descuentos", label: t.dash.nav.discounts, icon: Percent },
    { href: "/dashboard/interesados", label: t.dash.nav.interested, icon: BellPlus },
    { href: "/dashboard/inventario", label: t.dash.nav.inventory, icon: Boxes },
    { href: "/dashboard/productos", label: t.dash.nav.products, icon: Package },
    { href: "/dashboard/landing", label: t.dash.nav.landing, icon: LayoutTemplate },
    { href: "/dashboard/venta", label: t.dash.nav.pos, icon: Smartphone },
    { href: "/dashboard/clientes", label: t.dash.nav.customers, icon: Users },
    { href: "/dashboard/envios", label: t.dash.nav.shipments, icon: Truck },
  ];

  // la ruta puede llevar prefijo de idioma
  const path = pathname.replace(/^\/(es|en)(?=\/|$)/, "") || "/";

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3" aria-label={t.dash.nav.menu}>
      {NAV.map((n) => {
        const active = n.href === "/dashboard" ? path === n.href : path.startsWith(n.href);
        const badge = n.href === "/dashboard/ordenes" ? pending : n.href === "/dashboard/abandonados" ? abandoned.length : n.href === "/dashboard/inventario" ? low : 0;
        const alert = n.href === "/dashboard/inventario" && low > 0;
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={onNavigate}
            className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors", active ? "bg-white text-black" : "text-white/65 hover:bg-white/8 hover:text-white")}
          >
            <n.icon size={18} strokeWidth={1.75} />
            <span className="flex-1">{n.label}</span>
            {badge > 0 && (
              <span className={cn("min-w-6 rounded-full px-1.5 py-0.5 text-center text-[11px] font-semibold tabular-nums", alert ? "bg-alert text-white" : active ? "bg-black text-white" : "bg-white/15 text-white")}>
                {badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function Panel({ onClose }: { onClose?: () => void }) {
  const { t } = useT();
  return (
    <div className="flex h-full flex-col bg-black text-white">
      <div className="flex items-center justify-between px-6 pb-6 pt-7">
        <Logo variant="white" width={120} href="/dashboard" />
        {onClose && (
          <button type="button" onClick={onClose} aria-label={t.common.close} className="text-white/60 hover:text-white lg:hidden">
            <X size={20} />
          </button>
        )}
      </div>
      <NavList onNavigate={onClose} />
      <div className="mt-auto px-6 pb-7 pt-6">
        <Link href="/" className="inline-flex items-center gap-2 text-xs text-white/50 hover:text-white">
          <ExternalLink size={14} /> {t.dash.nav.store}
        </Link>
        <button
          type="button"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
            window.location.href = "/login";
          }}
          className="mt-3 inline-flex items-center gap-2 text-xs text-white/50 hover:text-white"
        >
          <LogOut size={14} /> {t.dash.nav.logout}
        </button>
        <div className="mt-5">
          <LanguageSwitch tone="light" />
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const { open, setOpen } = useSidebar();
  const { t } = useT();

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("ryvox:open-sidebar", handler);
    return () => window.removeEventListener("ryvox:open-sidebar", handler);
  }, [setOpen]);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <Panel />
      </aside>
      <AnimatePresence>
        {open && (
          <>
            <motion.button key="bd" aria-label={t.nav.closeMenu} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-black/50 lg:hidden" />
            <motion.aside key="pn" initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", stiffness: 320, damping: 34 }} className="fixed inset-y-0 left-0 z-50 w-72 lg:hidden">
              <Panel onClose={() => setOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
