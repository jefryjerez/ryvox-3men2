"use client";

import { COLORS, type ColorId } from "@/lib/colors";
import { cn } from "@/lib/format";
import { useT } from "@/i18n/client";

/** Círculos de color. En las tarjetas cambian la foto sin abrir el producto; en la ficha eligen la variante a comprar. */
export function ColorSwatches({
  colors,
  value,
  onChange,
  size = "sm",
  className,
}: {
  colors: ColorId[];
  value: ColorId | null;
  onChange: (c: ColorId) => void;
  size?: "sm" | "md";
  className?: string;
}) {
  const { t, f } = useT();
  // con un solo color no hay nada que elegir
  if (colors.length < 2) return null;
  return (
    <div role="radiogroup" aria-label={t.product.color} className={cn("flex items-center", size === "sm" ? "gap-1.5" : "gap-2.5", className)}>
      {colors.map((c) => {
        const selected = c === value;
        return (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={f(t.catalog.pickColor, { color: t.colors[c] })}
            title={t.colors[c]}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onChange(c);
            }}
            className={cn(
              "rounded-full border transition-transform duration-200",
              size === "sm" ? "h-3.5 w-3.5" : "h-7 w-7",
              selected ? "scale-110 border-black ring-2 ring-black ring-offset-2 ring-offset-white" : "border-black/20 hover:scale-110",
            )}
            style={{ background: COLORS[c].metal ? "linear-gradient(135deg,#f1d97a 0%,#c9a227 55%,#8a6d17 100%)" : COLORS[c].swatch }}
          />
        );
      })}
    </div>
  );
}
