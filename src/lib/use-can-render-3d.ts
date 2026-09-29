"use client";

import { useSyncExternalStore } from "react";

type NetInfo = EventTarget & { saveData?: boolean; effectiveType?: string };
type Nav = Navigator & { connection?: NetInfo; deviceMemory?: number };

let webglOk: boolean | null = null;
let webglTries = 0;

/** Crear un contexto WebGL cuesta: se guarda el resultado positivo y se reintenta el negativo pocas veces. */
function hasWebGL() {
  if (webglOk === true || webglTries >= 3) return webglOk === true;
  webglTries += 1;
  try {
    const c = document.createElement("canvas");
    webglOk = !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    webglOk = false;
  }
  return webglOk;
}

const REDUCED = "(prefers-reduced-motion: reduce)";

function detect(): boolean {
  const nav = navigator as Nav;
  const conn = nav.connection;
  const reduced = window.matchMedia(REDUCED).matches;
  // Móvil incluido: solo se apaga con conexión muy lenta, ahorro de datos o dispositivos muy básicos.
  const slow = !!conn && (conn.saveData === true || /(^|\b)(slow-2g|2g)\b/.test(conn.effectiveType ?? ""));
  const lowMem = typeof nav.deviceMemory === "number" && nav.deviceMemory < 2;
  const lowCpu = typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency < 2;
  if (reduced || slow || lowMem || lowCpu) return false;
  return hasWebGL();
}

/** Reevalúa cuando cambia la red o la preferencia de movimiento. */
function subscribe(onChange: () => void) {
  const conn = (navigator as Nav).connection;
  const mq = window.matchMedia(REDUCED);
  conn?.addEventListener("change", onChange);
  mq.addEventListener("change", onChange);
  return () => {
    conn?.removeEventListener("change", onChange);
    mq.removeEventListener("change", onChange);
  };
}

/**
 * Decide si vale la pena cargar Three.js en este dispositivo.
 * `null` en el servidor y durante la hidratación → se muestra la imagen.
 * `false` con conexión muy lenta (2G), ahorro de datos, dispositivos muy básicos o
 * preferencia de movimiento reducido → imagen estática, nunca se descarga el 3D.
 * En un teléfono normal sí se carga el 3D.
 */
export function useCanRender3D(): boolean | null {
  return useSyncExternalStore(subscribe, detect, () => null);
}
