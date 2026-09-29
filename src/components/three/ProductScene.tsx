"use client";

import { Suspense, useEffect, useRef, type RefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Float, Lightformer, OrbitControls } from "@react-three/drei";
import type { Group } from "three";
import type { Model3D } from "@/lib/products";
import type { ColorId } from "@/lib/colors";
import { AirbrushMountModel, DispenserModel, TemplateModel } from "./models";

export function Model({ model, color = "negro" }: { model: Exclude<Model3D, null>; color?: ColorId }) {
  switch (model) {
    case "template":
      return <TemplateModel color={color} />;
    case "airbrush-mount":
      return <AirbrushMountModel color={color} />;
    case "dispenser":
      return <DispenserModel color={color} />;
  }
}

/** Luces y entorno de estudio compartidos por el visor y el exportador de fotos. */
export function StudioLights() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 6, 4]} intensity={2.2} />
      <directionalLight position={[-5, 2, -3]} intensity={1.1} color="#ffffff" />
      {/* relleno frontal: evita que las caras negras mate queden como una mancha sin volumen */}
      <directionalLight position={[-2.5, 2.5, 6]} intensity={0.9} />
      <spotLight position={[0, 5, -6]} intensity={3} angle={0.5} penumbra={1} />
      {/* Entorno sintético: reflejos de estudio sin descargar ningún HDR. */}
      <Environment resolution={128}>
        <Lightformer intensity={3} rotation-x={Math.PI / 2} position={[0, 4, -2]} scale={[8, 3, 1]} />
        <Lightformer intensity={1.2} rotation-y={Math.PI / 2} position={[-5, 1, 0]} scale={[6, 2, 1]} />
        <Lightformer intensity={0.8} rotation-y={-Math.PI / 2} position={[5, -1, 0]} scale={[6, 2, 1]} />
      </Environment>
    </>
  );
}

interface SceneProps {
  model: Exclude<Model3D, null>;
  color?: ColorId;
  /** 0..1, progreso de scroll del contenedor. */
  scrollRef?: RefObject<number>;
  interactive?: boolean;
  active?: boolean;
  onReady?: () => void;
}

function Rig({ model, color, scrollRef, interactive }: Pick<SceneProps, "model" | "color" | "scrollRef" | "interactive">) {
  const group = useRef<Group>(null);
  useFrame((state, delta) => {
    if (!group.current) return;
    const scroll = scrollRef?.current ?? 0;
    const target = state.clock.elapsedTime * 0.28 + scroll * Math.PI * 1.2;
    // suaviza hacia el objetivo para que el scroll no dé tirones
    if (!interactive) group.current.rotation.y += (target - group.current.rotation.y) * Math.min(1, delta * 4);
    group.current.position.y = -scroll * 0.6;
  });
  return (
    <group ref={group}>
      <Float speed={1.4} rotationIntensity={0.15} floatIntensity={0.5}>
        <Model model={model} color={color} />
      </Float>
    </group>
  );
}

function Ready({ onReady }: { onReady?: () => void }) {
  useEffect(() => {
    onReady?.();
  }, [onReady]);
  return null;
}

export default function ProductScene({ model, color, scrollRef, interactive = false, active = true, onReady }: SceneProps) {
  return (
    <Canvas
      dpr={[1, 1.6]}
      frameloop={active ? "always" : "never"}
      camera={{ position: [0, 0.2, 6.2], fov: 32 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ touchAction: interactive ? "none" : "pan-y" }}
    >
      <Suspense fallback={null}>
        <StudioLights />
        <Rig model={model} color={color} scrollRef={scrollRef} interactive={interactive} />
        <ContactShadows position={[0, -1.7, 0]} opacity={0.45} scale={8} blur={2.6} far={3} color="#000000" />
        <Ready onReady={onReady} />
      </Suspense>
      {interactive && <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={0.6} maxPolarAngle={2.4} autoRotate autoRotateSpeed={1.2} />}
    </Canvas>
  );
}
