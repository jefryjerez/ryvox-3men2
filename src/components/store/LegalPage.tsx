import Link from "next/link";
import type { LegalDocument } from "@/content/legal";

/** Página legal con el mismo lenguaje visual de la tienda: cabecera display y texto legible. */
export function LegalPage({ doc, related }: { doc: LegalDocument; related: { href: string; label: string } }) {
  return (
    <article className="container-x mx-auto max-w-[900px] pb-24 pt-28 md:pt-36">
      <p className="eyebrow text-black/50">{doc.eyebrow}</p>
      <h1 className="display mt-4 text-[clamp(2.2rem,6vw,4.5rem)] uppercase leading-[0.95]">{doc.title}</h1>
      <p className="mt-4 text-xs uppercase tracking-wider text-black/45">{doc.updated}</p>
      <p className="mt-8 text-lg leading-relaxed text-black/70">{doc.intro}</p>

      <div className="mt-12 divide-y divide-black/10 border-t border-black/10">
        {doc.sections.map((s) => (
          <section key={s.heading} className="py-8">
            <h2 className="text-lg font-semibold tracking-tight">{s.heading}</h2>
            {s.paragraphs.map((p, i) => (
              <p key={i} className="mt-3 text-[15px] leading-relaxed text-black/70">
                {p}
              </p>
            ))}
            {s.bullets && (
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-black/70">
                {s.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      <p className="mt-10 text-sm text-black/60">
        <Link href={related.href} className="font-medium text-black underline-offset-4 hover:underline">
          {related.label} →
        </Link>
      </p>
    </article>
  );
}
