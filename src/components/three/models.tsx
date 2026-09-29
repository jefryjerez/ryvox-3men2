"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { RoundedBox, useTexture } from "@react-three/drei";
import { COLORS, COLOR_IDS, type ColorId } from "@/lib/colors";
import outline from "./template-outline.json";

/** Textura de relieve con las líneas de capa horizontales típicas de una pieza impresa en 3D. */
function makeLayerLinesTexture() {
  const c = document.createElement("canvas");
  c.width = 8;
  c.height = 64;
  const ctx = c.getContext("2d")!;
  for (let y = 0; y < 64; y++) {
    const v = 128 + Math.round(40 * Math.sin((y / 64) * Math.PI * 8));
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(0, y, 8, 1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 26);
  return tex;
}

/* Materiales compartidos: plástico impreso en 3D en cada color, acrílico y detalles. */
function useMaterials() {
  return useMemo(() => {
    const layers = makeLayerLinesTexture();
    const prints = Object.fromEntries(
      COLOR_IDS.map((c) => {
        const spec = COLORS[c];
        const mat = spec.metal
          ? new THREE.MeshStandardMaterial({ color: spec.hex, roughness: 0.4, metalness: 0.7, bumpMap: layers, bumpScale: 0.2 })
          : new THREE.MeshStandardMaterial({ color: spec.hex, roughness: 0.78, metalness: 0.06, bumpMap: layers, bumpScale: 0.35 });
        return [c, mat];
      }),
    ) as Record<ColorId, THREE.MeshStandardMaterial>;
    // acrílico de la plantilla en cada color (el negro conserva el acabado original)
    const acrylics = Object.fromEntries(
      COLOR_IDS.map((c) => {
        const spec = COLORS[c];
        return [c, new THREE.MeshPhysicalMaterial({ color: c === "negro" ? "#0a0a0a" : spec.hex, roughness: 0.32, metalness: spec.metal ? 0.6 : 0.05, clearcoat: 0.7, clearcoatRoughness: 0.25 })];
      }),
    ) as Record<ColorId, THREE.MeshPhysicalMaterial>;
    return {
      prints,
      acrylics,
      print: prints.negro,
      dark: new THREE.MeshStandardMaterial({ color: "#262626", roughness: 0.6, metalness: 0.4 }),
      slot: new THREE.MeshStandardMaterial({ color: "#000000", roughness: 1, metalness: 0 }),
      paper: new THREE.MeshStandardMaterial({ color: "#e6e6e6", roughness: 0.95, metalness: 0 }),
      acrylic: acrylics.negro,
      white: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.9, metalness: 0 }),
    };
  }, []);
}

function LogoDecal({ width = 1, position, rotation, opacity = 1 }: { width?: number; position: [number, number, number]; rotation?: [number, number, number]; opacity?: number }) {
  const tex = useTexture("/brand/ryvox-logo-white.png");
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[width, width * (302 / 1129)]} />
      <meshBasicMaterial map={tex} transparent opacity={opacity} toneMapped={false} depthWrite={false} />
    </mesh>
  );
}

/**
 * Plantilla Hairline & Beard: la silueta real (contorno trazado desde el arte) extruida en acrílico,
 * con el arte impreso como textura en la cara frontal. Ambos archivos los genera scripts/trace-template.mjs.
 */
export function TemplateModel({ color = "negro" }: { color?: ColorId }) {
  const m = useMaterials();
  const art = useTexture(color === "negro" ? "/products/plantilla-hairline-art.png" : `/products/plantilla-hairline-art-${color}.png`, (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
  });
  const W = 3.9;
  const H = W / outline.aspect;
  const depth = 0.08;

  const { body, face } = useMemo(() => {
    const s = new THREE.Shape();
    outline.points.forEach(([x, y], i) => (i === 0 ? s.moveTo(x * W, y * H) : s.lineTo(x * W, y * H)));
    s.closePath();
    const body = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 1, curveSegments: 1 });
    const face = new THREE.ShapeGeometry(s);
    // ambas geometrías generan UV = (x, y) en unidades de la forma: se normalizan a 0..1 sobre la caja del arte
    for (const g of [body, face]) {
      const uv = g.attributes.uv as THREE.BufferAttribute;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / W, uv.getY(i) / H);
      g.translate(-W / 2, -H / 2, 0);
    }
    body.translate(0, 0, -depth / 2);
    return { body, face };
  }, [H]);

  const faceMat = useMemo(() => {
    // el arte también va como emisivo suave: los negros se mantienen negros y las escalas/logo no se lavan con los reflejos
    return new THREE.MeshPhysicalMaterial({ map: art, emissiveMap: art, emissive: "#ffffff", emissiveIntensity: 0.45, color: "#ffffff", roughness: 0.6, metalness: 0, clearcoat: 0.3, clearcoatRoughness: 0.4, transparent: true, alphaTest: 0.5 });
  }, [art]);

  return (
    <group rotation={[-0.32, 0.22, 0.04]} scale={0.62}>
      <mesh geometry={body} material={m.acrylics[color]} />
      {/* la cara con el arte va por delante del bisel del cuerpo (bevelThickness) para que no quede tapada */}
      <mesh geometry={face} material={faceMat} position={[0, 0, depth / 2 + 0.012]} />
    </group>
  );
}

/**
 * Brazo en J del soporte: perfil lateral (x = hacia el frente, y = altura) extruido a lo ancho.
 * Base plana, punta vertical y cuna cóncava que baja hasta la placa.
 */
function hookArmGeometry(width: number) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(1.25, 0);
  s.lineTo(1.25, 0.95);
  s.lineTo(0.92, 0.95);
  s.lineTo(0.92, 0.66);
  s.bezierCurveTo(0.92, 0.18, 0.08, 0.18, 0, 1.5);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: width, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2, curveSegments: 28 });
  return g;
}

/** Soporte de pared para aerógrafo: placa lisa (sin tornillos) y dos brazos en J impresos en 3D. */
export function AirbrushMountModel({ color = "negro" }: { color?: ColorId }) {
  const m = useMaterials();
  const mat = m.prints[color];
  const arm = useMemo(() => hookArmGeometry(0.5), []);
  const plateH = 2.3;
  return (
    <group rotation={[0.16, -0.5, 0.01]} position={[0.05, 0.05, 0]} scale={0.88}>
      {/* placa de pared (cara frontal en z = 0) */}
      <RoundedBox args={[3.4, plateH, 0.18]} radius={0.03} smoothness={4} material={mat} position={[0, 0, -0.09]} />
      {/* brazos: el perfil se gira para que "x" del perfil apunte al frente (+z) */}
      {[1.2, -1.2].map((x) => (
        <mesh key={x} geometry={arm} material={mat} rotation={[0, -Math.PI / 2, 0]} position={[x + 0.25, -plateH / 2, 0]} />
      ))}
      <LogoDecal width={1.5} position={[0, 0.42, 0.003]} opacity={color === "negro" ? 1 : 0.92} />
    </group>
  );
}

/** Textura de "papel impreso" para los paquetes de hojas: fondo claro con marcas de texto en gris, repetida. */
function makePaperTexture() {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#ececec";
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = "#3a3a3a";
    ctx.font = "bold 22px Arial, sans-serif";
    let seed = 7;
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 26; i++) {
      ctx.save();
      ctx.translate(rnd() * 256, rnd() * 256);
      ctx.rotate((rnd() - 0.5) * 1.2);
      ctx.globalAlpha = 0.35 + rnd() * 0.45;
      ctx.fillText(rnd() > 0.5 ? "ASTRA" : "PLATINUM", -30, 0);
      ctx.restore();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2.2, 2.2);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

function usePaperTexture() {
  return useMemo(() => makePaperTexture(), []);
}

/**
 * Dispensador de cuchillas, calcado del producto real: caja impresa en 3D, tapa con boca en forma de D que deja ver
 * los paquetes, ranura vertical en el lateral (desde el borde superior, fondo redondeado) por donde asoma la tira
 * de hojas envueltas, cara frontal con el logo RYVOX y una junta fina cerca de la base.
 */
export function DispenserModel({ color = "negro" }: { color?: ColorId }) {
  const m = useMaterials();
  const mat = m.prints[color];
  const paperTex = usePaperTexture();
  const W = 1.3; // ancho (cara frontal)
  const H = 1.9; // alto
  const D = 0.85; // fondo (lateral con la ranura)
  const t = 0.08; // grosor de pared
  const c = 0.13; // media anchura de la ranura lateral
  const slotDepth = 0.85; // cuánto baja la ranura desde el borde superior

  const paper = useMemo(() => new THREE.MeshStandardMaterial({ map: paperTex, roughness: 0.95, metalness: 0 }), [paperTex]);

  const lid = useMemo(() => {
    // Tapa en el plano (x, z): rectángulo cuyo contorno entra por el canal de la ranura (+x) y rodea la boca en D.
    const r = D / 2 - 0.13; // radio del extremo redondo de la boca
    const x0 = -W / 2 + 0.16; // extremo recto de la boca
    const cx = W / 2 - 0.1 - r; // centro del extremo redondo
    const k = Math.sqrt(r * r - c * c); // donde el canal toca el círculo
    const rr = 0.07; // radio de las esquinas del extremo recto
    const sh = new THREE.Shape();
    sh.moveTo(-W / 2, -D / 2);
    sh.lineTo(W / 2, -D / 2);
    sh.lineTo(W / 2, -c);
    sh.lineTo(cx + k, -c);
    sh.absarc(cx, 0, r, -Math.asin(c / r), -Math.PI / 2, true);
    sh.lineTo(x0 + rr, -r);
    sh.absarc(x0 + rr, -r + rr, rr, -Math.PI / 2, -Math.PI, true);
    sh.lineTo(x0, r - rr);
    sh.absarc(x0 + rr, r - rr, rr, Math.PI, Math.PI / 2, true);
    sh.lineTo(cx, r);
    sh.absarc(cx, 0, r, Math.PI / 2, Math.asin(c / r), true);
    sh.lineTo(W / 2, c);
    sh.lineTo(W / 2, D / 2);
    sh.lineTo(-W / 2, D / 2);
    sh.closePath();
    return new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: false, curveSegments: 24 });
  }, []);

  const sideWall = useMemo(() => {
    // Pared lateral (+x) en el plano (z, y) con la ranura en U abierta por arriba.
    const yc = H / 2 - slotDepth + c;
    const sh = new THREE.Shape();
    sh.moveTo(-D / 2, -H / 2);
    sh.lineTo(D / 2, -H / 2);
    sh.lineTo(D / 2, H / 2);
    sh.lineTo(c, H / 2);
    sh.lineTo(c, yc);
    sh.absarc(0, yc, c, 0, Math.PI, true);
    sh.lineTo(-c, H / 2);
    sh.lineTo(-D / 2, H / 2);
    sh.closePath();
    return new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: false, curveSegments: 20 });
  }, []);

  return (
    <group rotation={[0.5, -0.62, 0.05]} position={[0, -0.02, 0]} scale={1.02}>
      {/* paredes frontal y trasera, pared izquierda y base */}
      <mesh material={mat} position={[0, 0, D / 2 - t / 2]}>
        <boxGeometry args={[W, H, t]} />
      </mesh>
      <mesh material={mat} position={[0, 0, -D / 2 + t / 2]}>
        <boxGeometry args={[W, H, t]} />
      </mesh>
      <mesh material={mat} position={[-W / 2 + t / 2, 0, 0]}>
        <boxGeometry args={[t, H, D]} />
      </mesh>
      <mesh material={mat} position={[0, -H / 2 + t / 2, 0]}>
        <boxGeometry args={[W, t, D]} />
      </mesh>
      {/* pared lateral derecha con la ranura */}
      <mesh geometry={sideWall} material={mat} rotation={[0, Math.PI / 2, 0]} position={[W / 2 - t, 0, 0]} />
      {/* tapa con la boca en D (la forma se define en x,z y se gira para quedar horizontal) */}
      <mesh geometry={lid} material={mat} rotation={[-Math.PI / 2, 0, 0]} position={[0, H / 2 - t, 0]} />
      {/* paquete de hojas dentro, justo bajo la tapa; y la tira que asoma por la ranura */}
      <mesh material={paper} position={[0, -0.06, 0]}>
        <boxGeometry args={[W - 2 * t - 0.03, H - t - 0.16, D - 2 * t - 0.03]} />
      </mesh>
      <mesh material={paper} position={[W / 2 - t / 2, H / 2 - slotDepth / 2 + 0.02, 0]}>
        <boxGeometry args={[t - 0.02, slotDepth - 0.16, c * 2 - 0.08]} />
      </mesh>
      {/* logo RYVOX en la cara frontal */}
      <LogoDecal width={0.78} position={[0, 0.12, D / 2 + 0.003]} />
      <LogoDecal width={0.78} position={[0, 0.12, D / 2 + 0.003]} />
      {/* junta fina cerca de la base (tapa/base de la pieza impresa) */}
      {[
        [0, D / 2 + 0.001, W + 0.002, 0.012, 0.004] as const,
        [0, -D / 2 - 0.001, W + 0.002, 0.012, 0.004] as const,
      ].map(([x, z, w, h, d], i) => (
        <mesh key={i} material={m.slot} position={[x, -H / 2 + 0.3, z]}>
          <boxGeometry args={[w, h, d]} />
        </mesh>
      ))}
      <mesh material={m.slot} position={[W / 2 + 0.001, -H / 2 + 0.3, 0]}>
        <boxGeometry args={[0.004, 0.012, D + 0.002]} />
      </mesh>
      <mesh material={m.slot} position={[-W / 2 - 0.001, -H / 2 + 0.3, 0]}>
        <boxGeometry args={[0.004, 0.012, D + 0.002]} />
      </mesh>
    </group>
  );
}
