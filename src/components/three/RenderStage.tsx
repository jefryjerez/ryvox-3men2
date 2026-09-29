"use client";

import { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";
import { createRoot, extend, useThree, type ReconcilerRoot, type RootState } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import type { Model3D } from "@/lib/products";
import type { ColorId } from "@/lib/colors";
import { Model, StudioLights } from "./ProductScene";

declare global {
  interface Window {
    __ryvoxExport?: (name: string) => Promise<string>;
    __ryvoxState?: RootState;
  }
}

function Capture({ stateRef }: { stateRef: React.RefObject<RootState | null> }) {
  const state = useThree();
  useEffect(() => {
    stateRef.current = state;
    window.__ryvoxState = state;
  }, [state, stateRef]);
  return null;
}

/**
 * Lienzo cuadrado y estático para exportar fotos de producto desde el 3D (solo desarrollo).
 * Usa la raíz imperativa de R3F con tamaño fijo: funciona aunque la pestaña esté oculta (sin medición ni requestAnimationFrame).
 */
export function RenderStage({ model, color = "negro" }: { model: Exclude<Model3D, null>; color?: ColorId }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<RootState | null>(null);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    // Un canvas nuevo por montaje: al desmontar, R3F pierde el contexto WebGL a propósito y el canvas ya no sirve (Strict Mode monta dos veces).
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 1200;
    canvas.style.cssText = "width:1200px;height:1200px;display:block";
    box.appendChild(canvas);
    extend(THREE as unknown as Parameters<typeof extend>[0]);
    let root: ReconcilerRoot<HTMLCanvasElement> | null = createRoot(canvas);
    let cancelled = false;
    void root
      .configure({
        size: { width: 1200, height: 1200, top: 0, left: 0 },
        dpr: 1,
        frameloop: "demand",
        camera: { position: [0, 0.2, 6.2], fov: 32 },
        gl: { antialias: true, alpha: true, preserveDrawingBuffer: true },
      })
      .then((r) => {
        if (cancelled) return;
        r.render(
          <>
            <Suspense fallback={null}>
              <StudioLights />
              <Model model={model} color={color} />
              <ContactShadows position={[0, -1.7, 0]} opacity={0.45} scale={8} blur={2.6} far={3} color="#000000" />
            </Suspense>
            <Capture stateRef={stateRef} />
          </>,
        );
      });

    window.__ryvoxExport = async (name: string) => {
      const s = stateRef.current;
      if (!s) throw new Error("escena no lista");
      // Sin requestAnimationFrame en pestañas ocultas: se fuerzan los frames a mano.
      for (let i = 0; i < 4; i++) {
        s.invalidate();
        s.advance(performance.now() + i * 16, true);
        await new Promise((r) => setTimeout(r, 150));
      }
      const dataUrl = s.gl.domElement.toDataURL("image/png");
      const res = await fetch("/api/dev/render", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, dataUrl }) });
      return `${res.status} ${await res.text()}`;
    };

    return () => {
      cancelled = true;
      delete window.__ryvoxExport;
      root?.unmount();
      root = null;
      canvas.remove();
    };
  }, [model, color]);

  return <div ref={boxRef} style={{ width: 1200, height: 1200 }} />;
}
