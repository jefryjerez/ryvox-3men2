import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { ProductCard } from "@/components/store/ProductCard";
import { ButtonLink } from "@/components/ui/Button";
import type { Product } from "@/lib/products";
import type { Dictionary } from "@/i18n/config";

export function CatalogPreview({ products, t }: { products: Product[]; t: Dictionary }) {
  return (
    <section className="border-t border-black/10">
      <div className="container-x mx-auto max-w-[1400px] py-24 md:py-32">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal>
            <p className="eyebrow text-black/50">{t.catalog.eyebrow}</p>
            <h2 className="display mt-4 text-[clamp(2.2rem,6vw,4.8rem)] uppercase">
              {t.catalog.title1}
              <br />
              {t.catalog.title2}
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <ButtonLink href="/productos" variant="secondary">
              {t.catalog.seeAll} <ArrowRight size={16} />
            </ButtonLink>
          </Reveal>
        </div>
        <ul className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
          {products.map((p, i) => (
            <Reveal key={p.id} as="li" delay={(i % 4) * 0.06}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
