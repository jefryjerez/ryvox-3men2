"use client";

import Image from "next/image";
import { useState } from "react";
import { Box } from "lucide-react";
import { ProductViewer } from "@/components/three/ProductViewer";
import type { Product } from "@/lib/products";
import { productImage, type ColorId } from "@/lib/colors";
import { cn } from "@/lib/format";

/** Imagen principal (o 3D) más miniaturas de la galería. El color elegido cambia la foto y el material del 3D. */
export function ProductGallery({ product, color }: { product: Product; color: ColorId | null }) {
  const photos = product.gallery ?? [];
  const [active, setActive] = useState(0); // 0 = principal (3D/imagen), 1.. = galería
  const image = productImage(product, color);

  return (
    <div className="md:sticky md:top-28">
      <div className="relative aspect-square w-full overflow-hidden rounded-[2rem] bg-white">
        <div className={active === 0 ? "absolute inset-0" : "hidden"}>
          <ProductViewer key={image} model={product.model3d} color={color ?? undefined} image={image} alt={product.name} interactive allowOptIn priority sizes="(max-width: 768px) 100vw, 58vw" className="h-full w-full" />
        </div>
        {photos.map((src, i) => (
          <div key={src} className={active === i + 1 ? "absolute inset-0" : "hidden"}>
            <Image src={src} alt={`${product.name} ${i + 2}`} fill sizes="(max-width: 768px) 100vw, 58vw" className="object-cover" />
          </div>
        ))}
      </div>

      {photos.length > 0 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto scrollbar-none">
          {[image, ...photos].map((src, i) => (
            <li key={`${src}-${i}`}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`${product.name} ${i + 1}`}
                className={cn("relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-white transition-colors", active === i ? "border-black" : "border-transparent hover:border-black/30")}
              >
                <Image src={src} alt="" fill sizes="64px" className={i === 0 ? "object-contain p-1" : "object-cover"} />
                {i === 0 && product.model3d && (
                  <span className="absolute bottom-1 right-1 rounded-full bg-black p-1 text-white">
                    <Box size={10} />
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
