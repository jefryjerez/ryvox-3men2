"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Menu, ShoppingBag, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { LanguageSwitch } from "@/components/brand/LanguageSwitch";
import { cartCount, useCart } from "@/store/cart";
import { cn } from "@/lib/format";
import { useHydrated } from "@/lib/use-hydrated";
import { useT } from "@/i18n/client";

export function Header() {
  const { t, f } = useT();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const lines = useCart((s) => s.lines);
  const setCartOpen = useCart((s) => s.setOpen);
  const hydrated = useHydrated();
  const count = hydrated ? cartCount(lines) : 0;

  const NAV = [
    { href: "/productos", label: t.nav.products },
    { href: "/#ryvox", label: t.nav.about },
    { href: "/#contacto", label: t.nav.contact },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const [seenPath, setSeenPath] = useState(pathname);
  if (seenPath !== pathname) {
    setSeenPath(pathname);
    setOpen(false);
  }

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 transition-[background-color,backdrop-filter,box-shadow] duration-500",
          scrolled || open ? "bg-mist/85 backdrop-blur-xl shadow-[0_1px_0_0_rgba(0,0,0,0.06)]" : "bg-transparent",
        )}
      >
        <div className="container-x mx-auto flex h-16 max-w-[1400px] items-center justify-between md:h-20">
          <Logo width={124} priority />
          <nav className="hidden items-center gap-8 md:flex" aria-label={t.dash.nav.menu}>
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="text-sm font-medium text-black/70 transition-colors hover:text-black">
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <LanguageSwitch className="hidden md:inline-flex" />
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={f(t.nav.cartAria, { n: count })}
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-black/5"
            >
              <ShoppingBag size={20} strokeWidth={1.75} />
              {count > 0 && (
                <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-[10px] font-semibold text-white">{count}</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
              aria-expanded={open}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-black/5 md:hidden"
            >
              {open ? <X size={22} strokeWidth={1.75} /> : <Menu size={22} strokeWidth={1.75} />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="fixed inset-0 z-30 flex flex-col bg-mist pt-24 md:hidden">
            <nav className="container-x flex flex-col" aria-label={t.dash.nav.mobileMenu}>
              {NAV.map((n, i) => (
                <motion.div key={n.href} initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.08 + i * 0.06, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
                  <Link href={n.href} className="display block border-b border-black/10 py-6 text-4xl">
                    {n.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
            <div className="container-x mt-auto flex items-center justify-between pb-10">
              <p className="text-xs text-black/50">BUILD TO EVOLVE</p>
              <LanguageSwitch />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
