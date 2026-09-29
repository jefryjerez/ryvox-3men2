"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { Box } from "lucide-react";
import type { Model3D } from "@/lib/products";
import type { ColorId } from "@/lib/colors";
import { useCanRender3D } from "@/lib/use-can-render-3d";
import { cn } from "@/lib/format";
import { useT } from "@/i18n/client";

/* Three.js nunca entra en el paquete inicial: se descarga solo si el dispositivo lo aguanta. */
const ProductScene = dynamic(() => import("./ProductScene"), { ssr: false, loading: () => null });

interface ViewerProps {
  model: Model3D;
  color?: ColorId;
  image: string;
  alt: string;
  scrollRef?: RefObject<number>;
  interactive?: boolean;
  /** Permite forzar el 3D con un botón cuando el dispositivo cayó a imagen. */
  allowOptIn?: boolean;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
  sizes?: string;
}

export function ProductViewer({
  model,
  color,
  image,
  alt,
  scrollRef,
  interactive,
  allowOptIn,
  priority,
  className,
  imageClassName,
  sizes = "(max-width: 768px) 100vw, 50vw",
}: ViewerProps) {
  const { t } = useT();
  const can = useCanRender3D();
  const [forced, setForced] = useState(false);
  const [ready, setReady] = useState(false);
  const [inView, setInView] = useState(true);
  const box = useRef<HTMLDivElement>(null);

  const show3d = !!model && (can === true || forced);

  useEffect(() => {
    if (!box.current || !show3d) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: "20% 0px" });
    io.observe(box.current);
    return () => io.disconnect();
  }, [show3d]);

  const onReady = useCallback(() => setReady(true), []);

  return (
    <div ref={box} className={cn("relative", className)}>
      <Image
        src={image}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className={cn(
          "object-contain transition-opacity duration-700",
          show3d && ready ? "opacity-0" : "opacity-100",
          imageClassName,
        )}
      />
      {show3d && (
        <div className={cn("absolute inset-0 transition-opacity duration-700", ready ? "opacity-100" : "opacity-0")}>
          <ProductScene model={model} color={color} scrollRef={scrollRef} interactive={interactive} active={inView} onReady={onReady} />
        </div>
      )}
      {allowOptIn && model && can === false && !forced && (
        <button
          type="button"
          onClick={() => setForced(true)}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-xs font-medium text-white"
        >
          <Box size={14} /> {t.featured.view3d}
        </button>
      )}
    </div>
  );
}
