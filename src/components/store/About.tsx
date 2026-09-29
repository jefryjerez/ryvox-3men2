import { Crosshair, Layers, Zap } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import type { Dictionary } from "@/i18n/config";

const ICONS = [Crosshair, Zap, Layers];

export function About({ t }: { t: Dictionary }) {
  return (
    <section id="ryvox" className="bg-black text-white">
      <div className="container-x mx-auto max-w-[1400px] py-24 md:py-36">
        <div className="grid gap-12 md:grid-cols-12">
          <Reveal className="md:col-span-5">
            <p className="eyebrow text-white/50">{t.about.eyebrow}</p>
            <h2 className="display mt-5 text-[clamp(2.4rem,6.5vw,5.2rem)] uppercase">
              {t.about.title1}
              <br />
              {t.about.title2}
              <br />
              <span className="text-white/35">{t.about.title3}</span>
            </h2>
          </Reveal>
          <div className="md:col-span-6 md:col-start-7">
            <Reveal delay={0.1}>
              <p className="text-lg leading-relaxed text-white/70 md:text-2xl md:leading-snug">{t.about.text}</p>
            </Reveal>
            <ul className="mt-14 grid gap-10 sm:grid-cols-3">
              {t.about.pillars.map((p, i) => {
                const Icon = ICONS[i] ?? Crosshair;
                return (
                  <Reveal key={p.title} delay={0.1 + i * 0.08} as="li">
                    <Icon size={22} strokeWidth={1.5} className="text-white/70" />
                    <h3 className="mt-5 text-lg font-semibold tracking-tight">{p.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/55">{p.text}</p>
                  </Reveal>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="mt-24 border-t border-white/10 pt-14 md:mt-32">
          <Reveal>
            <p className="eyebrow text-white/50">{t.about.forWho}</p>
          </Reveal>
          <ul className="mt-8 grid gap-px overflow-hidden rounded-3xl bg-white/10 md:grid-cols-3">
            {t.about.audience.map((a, i) => (
              <Reveal key={a.title} delay={i * 0.08} as="li" className="bg-charcoal p-8 md:p-10">
                <span className="display text-3xl text-white/25">0{i + 1}</span>
                <h3 className="mt-6 text-xl font-semibold tracking-tight">{a.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/55">{a.text}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
