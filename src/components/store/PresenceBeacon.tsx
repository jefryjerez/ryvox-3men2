"use client";

import { useEffect } from "react";

/**
 * Manda una señal "sigo aquí" cada 20s a un Worker aparte, solo para contar visitantes activos en el
 * panel de administración. Sin cookies ni datos personales: un id aleatorio guardado en sessionStorage
 * (se olvida al cerrar la pestaña). Si falla, no pasa nada — nunca puede romper la página.
 */
const PRESENCE_URL = "https://ryvox-presence.shopryvox.workers.dev/heartbeat";
const INTERVAL_MS = 20_000;

function visitorId() {
  try {
    let id = sessionStorage.getItem("ryvox_visitor");
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem("ryvox_visitor", id);
    }
    return id;
  } catch {
    return crypto.randomUUID(); // almacenamiento bloqueado (privado/incógnito): igual funciona, solo sin recordar entre pestañas
  }
}

export function PresenceBeacon() {
  useEffect(() => {
    const id = visitorId();
    const ping = () => {
      fetch(PRESENCE_URL, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) }).catch(() => {});
    };
    ping();
    const timer = setInterval(ping, INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return null;
}
