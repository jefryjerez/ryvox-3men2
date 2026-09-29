"use client";

import { motion, useInView, type Variants } from "motion/react";
import { useRef, type ReactNode } from "react";

/* Solo opacidad y transform: las dos propiedades que el navegador anima en la GPU sin repintar. */
const variants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1], delay },
  }),
};

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "span" | "p" | "h1" | "h2" | "h3";
  once?: boolean;
}

/** Aparece al entrar en pantalla: sube, se enfoca y se desvanece a opaco. */
export function Reveal({ children, delay = 0, className, as = "div", once = true }: RevealProps) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      custom={delay}
      viewport={{ once, margin: "-12% 0px -8% 0px" }}
    >
      {children}
    </Tag>
  );
}

/** Revela palabra por palabra. Para titulares grandes. */
export function RevealWords({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  // Se observa el contenedor, no el texto: el texto empieza recortado y nunca "entraría" en pantalla.
  const words = text.split(" ");
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  return (
    <span ref={ref} className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom pb-[0.08em]">
          <motion.span
            className="inline-block"
            initial={{ y: "110%" }}
            animate={{ y: inView ? 0 : "110%" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: delay + i * 0.06 }}
          >
            {w}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
