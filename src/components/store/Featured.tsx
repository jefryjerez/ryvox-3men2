"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { ProductViewer } from "@/components/three/ProductViewer";
import { ColorSwatches } from "@/components/store/ColorSwatches";
import { NotifyMe } from "@/components/store/NotifyMe";
import { Button, ButtonLink } from "@/components/ui/Button";
import type { Product } from "@/lib/products";
import { productColors, productImage, type ColorId } from "@/lib/colors";
import { useCart } from "@/store/cart";
import { useT } from "@/i18n/client";

export function Featured({ product: featured, eyebrow }: { product: Product; eyebrow?: string }) {
  const { t, money } = useT();
  const add = useCart((s) => s.add);
  const colors = productColors(featured);
  const [color, setColor] = useState<ColorId | null>(colors[0] ?? null);
  const image = productImage(featured, color);

  return (
    <section className="container-x mx-auto max-w-[1400px] py-24 md:py-36">
      <Reveal>
        <p className="eyebrow text-black/50">{eyebrow || t.featured.eyebrow}</p>
      </Reveal>
      <div className="mt-8 grid items-center gap-10 md:grid-cols-12">
        <Reveal className="md:col-span-7">
          <div className="relative">
            <ProductViewer
              key={image}
              model={featured.model3d}
              color={color ?? undefined}
              image={image}
              alt={featured.name}
              interactive
              allowOptIn
              sizes="(max-width: 768px) 100vw, 58vw"
              className="aspect-square w-full overflow-hidden rounded-[2rem] bg-white md:aspect-[4/3]"
            />
            {/* selector de color sobre la imagen, igual que en las tarjetas del catálogo */}
            {colors.length > 0 && (
              <ColorSwatches colors={colors} value={color} onChange={setColor} size="md" className="absolute bottom-4 right-4 rounded-full bg-white/85 px-3 py-2 backdrop-blur" />
            )}
          </div>
        </Reveal>
        <div className="md:col-span-5">
          <Reveal delay={0.1}>
            <h2 className="display text-[clamp(2.2rem,5.5vw,4.4rem)] uppercase">{featured.name}</h2>
            <p className="mt-4 text-lg text-black/60">{featured.tagline}</p>
            <p className="mt-6 text-sm leading-relaxed text-black/65">{featured.description}</p>
          </Reveal>
          <Reveal delay={0.2}>
            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-black/10 pt-6">
              {featured.specs.map((s) => (
                <div key={s.label}>
                  <dt className="text-[11px] uppercase tracking-wider text-black/45">{s.label}</dt>
                  <dd className="mt-1 text-sm font-medium">{s.value}</dd>
                </div>
              ))}
            </dl>
            {colors.length > 1 && color && (
              <div className="mt-6">
                <p className="text-xs font-medium text-black/60">
                  {t.product.color}: <span className="text-black">{t.colors[color]}</span>
                </p>
                <ColorSwatches colors={colors} value={color} onChange={setColor} size="md" className="mt-3" />
              </div>
            )}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {featured.comingSoon ? (
                <NotifyMe productId={featured.id} />
              ) : (
                <Button size="lg" onClick={() => add(featured, 1, colors.length > 1 ? color : null)}>
                  {t.featured.add} · {money(featured.price)}
                </Button>
              )}
              <ButtonLink href={`/productos/${featured.slug}`} size="lg" variant="ghost">
                {t.featured.detail} <ArrowRight size={18} />
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
