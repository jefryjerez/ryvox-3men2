"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { ArrowDown, ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { ProductViewer } from "@/components/three/ProductViewer";
import { RevealWords } from "@/components/motion/Reveal";
import type { Product } from "@/lib/products";
import type { Dictionary } from "@/i18n/config";
import { cn } from "@/lib/format";

const SLIDE_MS = 4500;

/** Hero: título + un solo botón a la izquierda; a la derecha, el visual (3D o foto) va deslizando entre todos los productos disponibles. */
export function Hero({ products, t }: { products: Product[]; t: Dictionary }) {
  const section = useRef<HTMLElement>(null);
  const scrollRef = useRef(0);
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end start"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    scrollRef.current = v;
  });
  const textY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 0.88]);

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const hero = products[Math.min(index, products.length - 1)];

  useEffect(() => {
    if (products.length < 2 || paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % products.length), SLIDE_MS);
    return () => clearInterval(id);
  }, [products.length, paused]);

  if (!hero) return null;

  return (
    <section ref={section} className="relative overflow-hidden pt-24 md:min-h-svh md:pt-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(to_right,rgba(0,0,0,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.06)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
      />
      <div className="container-x mx-auto grid max-w-[1400px] items-center gap-6 md:min-h-[calc(100svh-7rem)] md:grid-cols-12 md:gap-8">
        <motion.div style={{ y: textY, opacity: textOpacity }} className="relative z-10 order-2 md:order-1 md:col-span-6">
          <p className="eyebrow text-black/50">{t.hero.eyebrow}</p>
          <h1 className="display mt-5 text-[clamp(2.7rem,7vw,5.8rem)] uppercase">
            <RevealWords text={t.hero.line1} />
            <br />
            <RevealWords text={t.hero.line2} delay={0.1} />{" "}
            <span className="text-black/25">
              <RevealWords text={t.hero.line3} delay={0.15} />
            </span>
          </h1>
          <p className="mt-7 max-w-md text-base leading-relaxed text-black/65 md:text-lg">{t.hero.text}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonLink href="/productos" size="lg">
              {t.hero.cta} <ArrowRight size={18} />
            </ButtonLink>
          </div>
        </motion.div>

        <motion.div
          style={{ scale: imgScale }}
          className="order-1 md:order-2 md:col-span-6"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="relative mx-auto aspect-square w-full max-w-[560px] md:max-w-none md:aspect-[5/4]">
            <AnimatePresence initial={false}>
              <motion.div
                key={hero.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                <ProductViewer
                  model={hero.model3d}
                  image={hero.image}
                  alt={hero.name}
                  scrollRef={scrollRef}
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="h-full w-full"
                  imageClassName="scale-[1.1]"
                />
              </motion.div>
            </AnimatePresence>
          </div>
          {products.length > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              {products.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  aria-label={p.name}
                  aria-current={i === index}
                  onClick={() => setIndex(i)}
                  className={cn("h-1.5 rounded-full transition-all", i === index ? "w-6 bg-black" : "w-1.5 bg-black/20 hover:bg-black/40")}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>
      <div className="container-x mx-auto hidden max-w-[1400px] pb-8 md:block">
        <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-black/40">
          <ArrowDown size={14} className="animate-bounce" /> {t.hero.scroll}
        </span>
      </div>
    </section>
  );
}
