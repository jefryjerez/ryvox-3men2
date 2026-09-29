"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import type { Dictionary } from "@/i18n/config";

export function Manifesto({ t }: { t: Dictionary }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], ["4%", "-24%"]);
  const words = t.manifesto.words;

  return (
    <section ref={ref} className="overflow-hidden border-t border-black/10 py-20 md:py-28">
      <motion.div style={{ x }} className="flex whitespace-nowrap" aria-hidden>
        {[...words, ...words].map((w, i) => (
          <span key={i} className="display px-6 text-[clamp(4rem,14vw,12rem)] leading-none text-black/[0.07] md:px-10">
            {w}
          </span>
        ))}
      </motion.div>
      <div className="container-x mx-auto mt-10 flex max-w-[1400px] flex-col items-start gap-6 md:flex-row md:items-end md:justify-between">
        <p className="display max-w-2xl text-[clamp(1.8rem,4.5vw,3.6rem)] uppercase leading-[1.02]">{t.manifesto.text}</p>
        <ButtonLink href="/productos" size="lg">
          {t.manifesto.cta} <ArrowRight size={18} />
        </ButtonLink>
      </div>
    </section>
  );
}
