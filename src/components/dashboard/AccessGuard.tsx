"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Lock } from "lucide-react";
import { useAdmin } from "@/store/admin";
import { firstAllowedHref, hasAccess, pathNeed } from "@/lib/permissions";
import { useT } from "@/i18n/client";

/**
 * Si la pantalla no está permitida para el rol de esta persona, muestra un aviso en vez de la pantalla (o la manda a la
 * primera que sí puede usar). Es solo comodidad: lo que protege los datos es la comprobación del servidor en cada ruta.
 */
export function AccessGuard({ children }: { children: ReactNode }) {
  const { t } = useT();
  const router = useRouter();
  const pathname = usePathname();
  const me = useAdmin((s) => s.me);

  const path = pathname.replace(/^\/(es|en)(?=\/|$)/, "") || "/";
  const need = pathNeed(path);
  const allowed = !me || !need || hasAccess(me, need);
  const home = me ? firstAllowedHref(me) : null;

  useEffect(() => {
    // Al abrir el panel en una pantalla que no le toca (típicamente el Resumen), se le lleva a la primera que sí.
    if (!allowed && path === "/dashboard" && home) router.replace(home);
  }, [allowed, path, home, router]);

  if (allowed) return children;
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
        <Lock size={20} />
      </span>
      <h1 className="display mt-5 text-2xl">{t.dash.team.noAccessTitle}</h1>
      <p className="mt-2 text-sm text-black/60">{t.dash.team.noAccessText}</p>
      {home && (
        <Link href={home} className="mt-5 inline-block text-sm font-medium underline underline-offset-4">
          {t.dash.team.goHome}
        </Link>
      )}
    </div>
  );
}
