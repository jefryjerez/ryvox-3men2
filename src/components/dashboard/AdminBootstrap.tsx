"use client";

import { useEffect, useRef } from "react";
import { useAdmin } from "@/store/admin";
import { playOrderChime } from "@/lib/notification-sound";
import { useT } from "@/i18n/client";

const POLL_MS = 5000;

/** Carga productos, órdenes y clientes de la API al entrar al panel, y de ahí en adelante refresca sola cada
 *  5s: así el panel se entera de pedidos u otros cambios sin que haya que cerrar y volver a abrir la app. */
export function AdminBootstrap() {
  const { t, f } = useT();
  const loaded = useAdmin((s) => s.loaded);
  const loading = useAdmin((s) => s.loading);
  const error = useAdmin((s) => s.error);
  const load = useAdmin((s) => s.load);
  const orders = useAdmin((s) => s.orders);

  useEffect(() => {
    if (!loaded) void load();
  }, [loaded, load]);

  useEffect(() => {
    const timer = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  // Suena la campanita cuando aparece un pedido pagado que no estaba en el refresco anterior. `null` = todavía
  // no se guardó una base de comparación (recién cargó o aún no hay pedidos), para no sonar en el primer load.
  const seenIds = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!loaded) return;
    if (seenIds.current === null) {
      seenIds.current = new Set(orders.map((o) => o.id));
      return;
    }
    if (orders.some((o) => !seenIds.current!.has(o.id))) playOrderChime();
    seenIds.current = new Set(orders.map((o) => o.id));
  }, [orders, loaded]);

  if (error && !loaded) {
    return (
      <div className="mb-4 rounded-2xl border border-alert/40 bg-white px-4 py-3 text-sm text-alert">
        {f(t.dash.loadError, { error })}{" "}
        <button type="button" onClick={() => load()} className="underline">
          {t.common.retry}
        </button>
      </div>
    );
  }
  return loading && !loaded ? <div className="fixed inset-x-0 top-0 z-50 h-0.5 animate-pulse bg-black" aria-hidden /> : null;
}
