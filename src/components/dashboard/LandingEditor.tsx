"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { Card, PageHeader } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/format";
import { useT } from "@/i18n/client";
import { es } from "@/i18n/es";
import { en } from "@/i18n/en";
import type {
  AboutOverride,
  CatalogOverride,
  FeaturedOverride,
  HeroOverride,
  LandingSectionId,
  LandingTextOverrides,
  ManifestoOverride,
} from "@/lib/landing";

const input = "h-10 w-full rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-black";
const textarea = "w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm leading-relaxed outline-none focus:border-black";
const label = "mb-1.5 block text-xs font-medium text-black/60";

interface LangContent {
  hero: HeroOverride;
  catalog: CatalogOverride;
  featured: FeaturedOverride;
  about: AboutOverride;
  manifesto: ManifestoOverride;
}
type Lang = "es" | "en";
interface FormState {
  order: LandingSectionId[];
  es: LangContent;
  en: LangContent;
}

const DICTS: Record<Lang, typeof es> = { es, en };

/** Completa con el texto del diccionario lo que todavía no se personalizó, para que el editor nunca muestre campos vacíos. */
function defaultsFor(lang: Lang, ov: LandingTextOverrides): LangContent {
  const d = DICTS[lang];
  return {
    hero: ov.hero ?? d.hero,
    catalog: { eyebrow: ov.catalog?.eyebrow ?? d.catalog.eyebrow, title1: ov.catalog?.title1 ?? d.catalog.title1, title2: ov.catalog?.title2 ?? d.catalog.title2, seeAll: ov.catalog?.seeAll ?? d.catalog.seeAll },
    featured: { eyebrow: ov.featured?.eyebrow ?? d.featured.eyebrow },
    about: ov.about ?? d.about,
    manifesto: ov.manifesto ?? d.manifesto,
  };
}

function Field({ v, onChange, big }: { v: string; onChange: (v: string) => void; big?: boolean }) {
  return big ? (
    <textarea value={v} onChange={(e) => onChange(e.target.value)} rows={3} className={textarea} />
  ) : (
    <input value={v} onChange={(e) => onChange(e.target.value)} className={input} />
  );
}

function Labeled({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={label}>{text}</span>
      {children}
    </label>
  );
}

export function LandingEditor() {
  const { t, f } = useT();
  const e = t.dash.landing;
  const [form, setForm] = useState<FormState | null>(null);
  const [lang, setLang] = useState<Lang>("es");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/landing")
      .then((r) => r.json() as Promise<{ order: LandingSectionId[]; content: { es: LandingTextOverrides; en: LandingTextOverrides } }>)
      .then((data) => {
        setForm({ order: data.order, es: defaultsFor("es", data.content.es), en: defaultsFor("en", data.content.en) });
      })
      .catch(() => setError(e.loadError));
  }, [e.loadError]);

  if (!form) return <p className="text-sm text-black/50">{error ?? t.common.loading}</p>;

  function move(id: LandingSectionId, dir: -1 | 1) {
    setForm((prev) => {
      if (!prev) return prev;
      const order = [...prev.order];
      const i = order.indexOf(id);
      const j = i + dir;
      if (j < 0 || j >= order.length) return prev;
      [order[i], order[j]] = [order[j], order[i]];
      return { ...prev, order };
    });
  }

  function setContent<S extends keyof LangContent>(section: S, patch: Partial<LangContent[S]>) {
    setForm((prev) => (prev ? { ...prev, [lang]: { ...prev[lang], [section]: { ...prev[lang][section], ...patch } } } : prev));
  }

  function resetLang() {
    setForm((prev) => (prev ? { ...prev, [lang]: defaultsFor(lang, {}) } : prev));
  }

  async function save() {
    if (!form) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/landing", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ order: form.order, content: { es: form.es, en: form.en } }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? e.saveError);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const c = form[lang];

  return (
    <>
      <PageHeader title={e.title} subtitle={e.subtitle}>
        <Button onClick={save} disabled={busy}>
          {busy ? e.saving : saved ? e.saved : e.save}
        </Button>
      </PageHeader>
      {error && <p className="mb-4 text-sm font-medium text-alert">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="p-5 lg:col-span-4">
          <h2 className="text-[15px] font-semibold tracking-tight">{e.orderTitle}</h2>
          <p className="mt-1 text-xs text-black/50">{e.orderHint}</p>
          <ol className="mt-4 space-y-2">
            {form.order.map((id, i) => (
              <li key={id} className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/6 text-xs font-semibold tabular-nums">{i + 1}</span>
                <span className="flex-1 text-sm font-medium">{e.sections[id]}</span>
                <button type="button" aria-label={e.moveUp} disabled={i === 0} onClick={() => move(id, -1)} className="rounded-lg p-1.5 text-black/50 hover:bg-black/6 hover:text-black disabled:opacity-25 disabled:hover:bg-transparent">
                  <ChevronUp size={16} />
                </button>
                <button
                  type="button"
                  aria-label={e.moveDown}
                  disabled={i === form.order.length - 1}
                  onClick={() => move(id, 1)}
                  className="rounded-lg p-1.5 text-black/50 hover:bg-black/6 hover:text-black disabled:opacity-25 disabled:hover:bg-transparent"
                >
                  <ChevronDown size={16} />
                </button>
              </li>
            ))}
          </ol>
        </Card>

        <div className="lg:col-span-8">
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-semibold tracking-tight">{e.textsTitle}</h2>
                <p className="mt-1 text-xs text-black/50">{e.textsHint}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-full border border-line p-0.5">
                  {(["es", "en"] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLang(l)}
                      className={cn("rounded-full px-3 py-1 text-xs font-semibold uppercase", lang === l ? "bg-black text-white" : "text-black/60")}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={resetLang} className="inline-flex items-center gap-1.5 text-xs text-black/50 hover:text-black">
                  <RotateCcw size={13} /> {e.restore}
                </button>
              </div>
            </div>
          </Card>

          <div className="mt-6 space-y-6">
            <Card className="p-5">
              <h3 className="text-[15px] font-semibold tracking-tight">{e.hero.title}</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Labeled text={e.hero.eyebrow}>
                  <Field v={c.hero.eyebrow} onChange={(v) => setContent("hero", { eyebrow: v })} />
                </Labeled>
                <Labeled text={e.hero.cta}>
                  <Field v={c.hero.cta} onChange={(v) => setContent("hero", { cta: v })} />
                </Labeled>
                <Labeled text={e.hero.line1}>
                  <Field v={c.hero.line1} onChange={(v) => setContent("hero", { line1: v })} />
                </Labeled>
                <Labeled text={e.hero.line2}>
                  <Field v={c.hero.line2} onChange={(v) => setContent("hero", { line2: v })} />
                </Labeled>
                <Labeled text={e.hero.line3}>
                  <Field v={c.hero.line3} onChange={(v) => setContent("hero", { line3: v })} />
                </Labeled>
                <Labeled text={e.hero.scroll}>
                  <Field v={c.hero.scroll} onChange={(v) => setContent("hero", { scroll: v })} />
                </Labeled>
                <div className="sm:col-span-2">
                  <Labeled text={e.hero.text}>
                    <Field big v={c.hero.text} onChange={(v) => setContent("hero", { text: v })} />
                  </Labeled>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-[15px] font-semibold tracking-tight">{e.catalog.title}</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Labeled text={e.catalog.eyebrow}>
                  <Field v={c.catalog.eyebrow} onChange={(v) => setContent("catalog", { eyebrow: v })} />
                </Labeled>
                <Labeled text={e.catalog.seeAll}>
                  <Field v={c.catalog.seeAll} onChange={(v) => setContent("catalog", { seeAll: v })} />
                </Labeled>
                <Labeled text={e.catalog.title1}>
                  <Field v={c.catalog.title1} onChange={(v) => setContent("catalog", { title1: v })} />
                </Labeled>
                <Labeled text={e.catalog.title2}>
                  <Field v={c.catalog.title2} onChange={(v) => setContent("catalog", { title2: v })} />
                </Labeled>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-[15px] font-semibold tracking-tight">{e.featured.title}</h3>
              <div className="mt-4 max-w-sm">
                <Labeled text={e.featured.eyebrow}>
                  <Field v={c.featured.eyebrow} onChange={(v) => setContent("featured", { eyebrow: v })} />
                </Labeled>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-[15px] font-semibold tracking-tight">{e.about.title}</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Labeled text={e.about.eyebrow}>
                  <Field v={c.about.eyebrow} onChange={(v) => setContent("about", { eyebrow: v })} />
                </Labeled>
                <Labeled text={e.about.forWho}>
                  <Field v={c.about.forWho} onChange={(v) => setContent("about", { forWho: v })} />
                </Labeled>
                <Labeled text={e.about.title1}>
                  <Field v={c.about.title1} onChange={(v) => setContent("about", { title1: v })} />
                </Labeled>
                <Labeled text={e.about.title2}>
                  <Field v={c.about.title2} onChange={(v) => setContent("about", { title2: v })} />
                </Labeled>
                <Labeled text={e.about.title3}>
                  <Field v={c.about.title3} onChange={(v) => setContent("about", { title3: v })} />
                </Labeled>
                <div className="sm:col-span-2">
                  <Labeled text={e.about.text}>
                    <Field big v={c.about.text} onChange={(v) => setContent("about", { text: v })} />
                  </Labeled>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {c.about.pillars.map((p, i) => (
                  <div key={i} className="rounded-xl border border-line p-3">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-black/45">{f(e.about.pillar, { n: i + 1 })}</p>
                    <Labeled text={e.about.pillarTitle}>
                      <input value={p.title} onChange={(x) => setContent("about", { pillars: c.about.pillars.map((q, j) => (j === i ? { ...q, title: x.target.value } : q)) })} className={input} />
                    </Labeled>
                    <div className="mt-2">
                      <Labeled text={e.about.pillarText}>
                        <textarea
                          value={p.text}
                          onChange={(x) => setContent("about", { pillars: c.about.pillars.map((q, j) => (j === i ? { ...q, text: x.target.value } : q)) })}
                          rows={3}
                          className={textarea}
                        />
                      </Labeled>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {c.about.audience.map((a, i) => (
                  <div key={i} className="rounded-xl border border-line p-3">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-black/45">{f(e.about.audience, { n: i + 1 })}</p>
                    <Labeled text={e.about.audienceTitle}>
                      <input value={a.title} onChange={(x) => setContent("about", { audience: c.about.audience.map((q, j) => (j === i ? { ...q, title: x.target.value } : q)) })} className={input} />
                    </Labeled>
                    <div className="mt-2">
                      <Labeled text={e.about.audienceText}>
                        <textarea
                          value={a.text}
                          onChange={(x) => setContent("about", { audience: c.about.audience.map((q, j) => (j === i ? { ...q, text: x.target.value } : q)) })}
                          rows={3}
                          className={textarea}
                        />
                      </Labeled>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-[15px] font-semibold tracking-tight">{e.manifesto.title}</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                {c.manifesto.words.map((w, i) => (
                  <Labeled key={i} text={f(e.manifesto.word, { n: i + 1 })}>
                    <input value={w} onChange={(x) => setContent("manifesto", { words: c.manifesto.words.map((q, j) => (j === i ? x.target.value : q)) })} className={input} />
                  </Labeled>
                ))}
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Labeled text={e.manifesto.text}>
                    <Field big v={c.manifesto.text} onChange={(v) => setContent("manifesto", { text: v })} />
                  </Labeled>
                </div>
                <Labeled text={e.manifesto.cta}>
                  <Field v={c.manifesto.cta} onChange={(v) => setContent("manifesto", { cta: v })} />
                </Labeled>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
