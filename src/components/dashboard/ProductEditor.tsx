"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { ArrowLeft, ImageUp } from "lucide-react";
import { useAdmin } from "@/store/admin";
import { CATEGORIES, type Category, type Product } from "@/lib/products";
import { COLORS, COLOR_IDS, isColorId, type ColorId } from "@/lib/colors";
import { Card, PageHeader, Pill } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/format";
import { useT } from "@/i18n/client";

const input = "h-11 w-full rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-black";
const label = "mb-1.5 block text-xs font-medium text-black/60";

const EMPTY: Product = {
  id: "",
  slug: "",
  name: "",
  tagline: "",
  category: "accesorios",
  sku: "",
  price: 0,
  description: "",
  specs: [],
  image: "/products/dispensador-cuchillas-negro.webp",
  colors: [],
  stock: 0,
  lowStockAt: 10,
  active: true,
  model3d: null,
  sold30d: 0,
  weightOz: 8,
  dims: { l: 8, w: 6, h: 3 },
};

function Switch({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={onChange} className={cn("relative h-6 w-11 rounded-full transition-colors", on ? "bg-black" : "bg-black/15")}>
      <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", on ? "left-[22px]" : "left-0.5")} />
    </button>
  );
}

export function ProductEditor({ id }: { id: string }) {
  const { t, f } = useT();
  const e = t.dash.editor;
  const router = useRouter();
  const loaded = useAdmin((s) => s.loaded);
  const existing = useAdmin((s) => s.products.find((p) => p.id === id));
  const upsert = useAdmin((s) => s.upsertProduct);
  const isNew = id === "nuevo";
  const [draft, setDraft] = useState<Product | null>(isNew ? EMPTY : null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<"main" | "gallery" | `color:${ColorId}`>("main");

  if (!isNew && !draft && existing) setDraft(existing);

  if (!isNew && !existing) {
    return (
      <div className="py-20 text-center text-sm text-black/55">
        {loaded ? (
          <>
            {e.notFound}{" "}
            <Link href="/dashboard/productos" className="underline">
              {t.common.back}
            </Link>
          </>
        ) : (
          t.common.loading
        )}
      </div>
    );
  }
  if (!draft) return null;

  const set = <K extends keyof Product>(k: K, v: Product[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));
  const dims = draft.dims ?? { l: 8, w: 6, h: 3 };

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    if (!draft) return;
    setBusy(true);
    setError(null);
    const result = await upsert({ ...draft, weightOz: draft.weightOz ?? 8, dims });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
    if (isNew && result.product) router.replace(`/dashboard/productos/${result.product.id}`);
  }

  async function upload(ev: ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("productId", draft?.id || draft?.sku || "nuevo");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed");
      if (uploadTarget === "gallery") set("gallery", [...(draft?.gallery ?? []), data.url]);
      else if (uploadTarget.startsWith("color:")) {
        const c = uploadTarget.slice(6);
        if (isColorId(c)) set("colorImages", { ...(draft?.colorImages ?? {}), [c]: data.url });
      } else set("image", data.url);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <>
      <Link href="/dashboard/productos" className="mb-4 inline-flex items-center gap-1 text-sm text-black/60 hover:text-black">
        <ArrowLeft size={16} /> {e.back}
      </Link>
      <form onSubmit={submit}>
        <PageHeader title={isNew ? e.newTitle : draft.name} subtitle={isNew ? e.newSubtitle : `SKU ${draft.sku}`}>
          {saved && <Pill tone="active">{t.common.saved}</Pill>}
          <Button type="submit" size="sm" disabled={busy || uploading}>
            {busy ? t.common.saving : isNew ? e.create : t.common.save}
          </Button>
        </PageHeader>
        {error && <p className="-mt-2 mb-4 text-sm font-medium text-alert">{error}</p>}

        <div className="grid gap-4 xl:grid-cols-3">
          <div className="space-y-4 xl:col-span-2">
            <Card className="p-5">
              <h2 className="text-[15px] font-semibold tracking-tight">{e.info}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className={label}>{e.name}</span>
                  <input required value={draft.name} onChange={(x) => set("name", x.target.value)} className={input} />
                </label>
                <label className="sm:col-span-2">
                  <span className={label}>{e.tagline}</span>
                  <input value={draft.tagline} onChange={(x) => set("tagline", x.target.value)} className={input} />
                </label>
                <label>
                  <span className={label}>{e.sku}</span>
                  <input required value={draft.sku} onChange={(x) => set("sku", x.target.value.toUpperCase())} className={input} />
                </label>
                <label>
                  <span className={label}>{e.category}</span>
                  <select value={draft.category} onChange={(x) => set("category", x.target.value as Category)} className={input}>
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {t.categories[c.id]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="sm:col-span-2">
                  <span className={label}>{e.description}</span>
                  <textarea rows={4} value={draft.description} onChange={(x) => set("description", x.target.value)} className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-black" />
                </label>
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="text-[15px] font-semibold tracking-tight">{e.translation}</h2>
              <p className="mt-1 text-xs text-black/50">{e.translationHint}</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className={label}>{e.nameEn}</span>
                  <input value={draft.nameEn ?? ""} onChange={(x) => set("nameEn", x.target.value || undefined)} className={input} placeholder={draft.name} />
                </label>
                <label className="sm:col-span-2">
                  <span className={label}>{e.taglineEn}</span>
                  <input value={draft.taglineEn ?? ""} onChange={(x) => set("taglineEn", x.target.value || undefined)} className={input} placeholder={draft.tagline} />
                </label>
                <label className="sm:col-span-2">
                  <span className={label}>{e.descriptionEn}</span>
                  <textarea rows={4} value={draft.descriptionEn ?? ""} onChange={(x) => set("descriptionEn", x.target.value || undefined)} className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-black" placeholder={draft.description} />
                </label>
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="text-[15px] font-semibold tracking-tight">{e.pricing}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label>
                  <span className={label}>{e.price}</span>
                  <input type="number" min={0} step="0.01" required value={(draft.price / 100).toFixed(2)} onChange={(x) => set("price", Math.round(Number(x.target.value) * 100))} className={input} />
                </label>
                <label>
                  <span className={label}>{e.compareAt}</span>
                  <input type="number" min={0} step="0.01" value={draft.compareAt ? (draft.compareAt / 100).toFixed(2) : ""} onChange={(x) => set("compareAt", x.target.value ? Math.round(Number(x.target.value) * 100) : undefined)} className={input} />
                </label>
                <label>
                  <span className={label}>{e.stock}</span>
                  <input type="number" min={0} value={draft.stock} onChange={(x) => set("stock", Number(x.target.value))} className={input} />
                </label>
                <label>
                  <span className={label}>{e.lowAt}</span>
                  <input type="number" min={0} value={draft.lowStockAt} onChange={(x) => set("lowStockAt", Number(x.target.value))} className={input} />
                </label>
              </div>
              {draft.stock <= draft.lowStockAt && <p className="mt-4 rounded-xl border border-alert/40 bg-alert/5 px-4 py-3 text-xs font-medium text-alert">{e.lowWarning}</p>}
            </Card>

            <Card className="p-5">
              <h2 className="text-[15px] font-semibold tracking-tight">{e.shipping}</h2>
              <p className="mt-1 text-xs text-black/50">{e.shippingText}</p>
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <label>
                  <span className={label}>{e.weight}</span>
                  <input type="number" min={0} step="0.5" value={draft.weightOz ?? 8} onChange={(x) => set("weightOz", Number(x.target.value))} className={input} />
                </label>
                <label>
                  <span className={label}>{e.length}</span>
                  <input type="number" min={0} step="0.5" value={dims.l} onChange={(x) => set("dims", { ...dims, l: Number(x.target.value) })} className={input} />
                </label>
                <label>
                  <span className={label}>{e.width}</span>
                  <input type="number" min={0} step="0.5" value={dims.w} onChange={(x) => set("dims", { ...dims, w: Number(x.target.value) })} className={input} />
                </label>
                <label>
                  <span className={label}>{e.height}</span>
                  <input type="number" min={0} step="0.5" value={dims.h} onChange={(x) => set("dims", { ...dims, h: Number(x.target.value) })} className={input} />
                </label>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="p-5">
              <h2 className="text-[15px] font-semibold tracking-tight">{e.image}</h2>
              <div className="relative mt-4 aspect-square overflow-hidden rounded-2xl bg-mist">
                <Image src={draft.image} alt="" fill sizes="320px" className="object-contain" />
              </div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} className="hidden" />
              <Button type="button" variant="secondary" size="sm" className="mt-3 w-full" disabled={uploading} onClick={() => { setUploadTarget("main"); fileRef.current?.click(); }}>
                <ImageUp size={14} /> {uploading ? e.uploading : e.upload}
              </Button>
              <p className="mt-2 text-[11px] text-black/45">{e.uploadHint}</p>
              <label className="mt-3 block">
                <span className={label}>{e.imagePath}</span>
                <input value={draft.image} onChange={(x) => set("image", x.target.value)} className={input} placeholder="/products/archivo.webp" />
              </label>
            </Card>

            <Card className="p-5">
              <h2 className="text-[15px] font-semibold tracking-tight">{e.colors}</h2>
              <p className="mt-1 text-xs text-black/50">{e.colorsHint}</p>
              <ul className="mt-3 space-y-2">
                {COLOR_IDS.map((c) => {
                  const on = (draft.colors ?? []).includes(c);
                  return (
                    <li key={c} className="rounded-xl border border-line p-2.5">
                      <label className="flex items-center gap-2.5 text-sm">
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => set("colors", on ? (draft.colors ?? []).filter((x) => x !== c) : COLOR_IDS.filter((x) => x === c || (draft.colors ?? []).includes(x)))}
                          className="accent-black"
                        />
                        <span className="inline-block h-4 w-4 rounded-full border border-black/15" style={{ background: COLORS[c].swatch }} />
                        {t.colors[c]}
                      </label>
                      {on && (
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            value={draft.colorImages?.[c] ?? ""}
                            onChange={(x) => set("colorImages", { ...(draft.colorImages ?? {}), [c]: x.target.value })}
                            placeholder={f(e.colorImage, { color: t.colors[c] })}
                            className={cn(input, "h-9 text-xs")}
                          />
                          <Button type="button" variant="secondary" size="sm" disabled={uploading} onClick={() => { setUploadTarget(`color:${c}`); fileRef.current?.click(); }} aria-label={f(e.colorImage, { color: t.colors[c] })}>
                            <ImageUp size={14} />
                          </Button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Card>

            <Card className="p-5">
              <h2 className="text-[15px] font-semibold tracking-tight">{e.gallery}</h2>
              <p className="mt-1 text-xs text-black/50">{e.galleryHint}</p>
              <ul className="mt-3 grid grid-cols-3 gap-2">
                {(draft.gallery ?? []).map((src, i) => (
                  <li key={src + i} className="group relative aspect-square overflow-hidden rounded-xl bg-mist">
                    <Image src={src} alt="" fill sizes="120px" className="object-cover" />
                    <button
                      type="button"
                      onClick={() => set("gallery", (draft.gallery ?? []).filter((_, j) => j !== i))}
                      aria-label={e.removePhoto}
                      className="absolute right-1 top-1 rounded-full bg-black/80 px-2 py-0.5 text-[10px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
              <Button type="button" variant="secondary" size="sm" className="mt-3 w-full" disabled={uploading} onClick={() => { setUploadTarget("gallery"); fileRef.current?.click(); }}>
                <ImageUp size={14} /> {uploading ? e.uploading : e.addPhoto}
              </Button>
            </Card>

            <Card className="p-5">
              <h2 className="text-[15px] font-semibold tracking-tight">{e.visibility}</h2>
              <label className="mt-4 flex items-center justify-between">
                <span className="text-sm">{e.activeInStore}</span>
                <Switch on={draft.active} onChange={() => set("active", !draft.active)} />
              </label>
              <label className="mt-4 flex items-center justify-between">
                <span className="text-sm">{e.featured}</span>
                <Switch on={!!draft.featured} onChange={() => set("featured", !draft.featured)} />
              </label>
              <label className="mt-4 flex items-center justify-between">
                <span className="text-sm">{e.comingSoon}</span>
                <Switch on={!!draft.comingSoon} onChange={() => set("comingSoon", !draft.comingSoon)} />
              </label>
              <label className="mt-4 block">
                <span className={label}>{e.badge}</span>
                <input value={draft.badge ?? ""} onChange={(x) => set("badge", x.target.value || undefined)} placeholder={e.badgePlaceholder} className={input} />
              </label>
              <label className="mt-4 block">
                <span className={label}>{e.view3d}</span>
                <select value={draft.model3d ?? ""} onChange={(x) => set("model3d", (x.target.value || null) as Product["model3d"])} className={input}>
                  <option value="">{e.no3d}</option>
                  <option value="template">{e.template}</option>
                  <option value="airbrush-mount">{e.airbrushMount}</option>
                  <option value="dispenser">{e.dispenser}</option>
                </select>
              </label>
            </Card>
          </div>
        </div>
      </form>
    </>
  );
}
