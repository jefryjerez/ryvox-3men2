import type { Metadata } from "next";
import { Catalog } from "@/components/store/Catalog";
import { listProducts } from "@/lib/data";
import { localizeProduct } from "@/lib/products";
import { dict } from "@/i18n/server";
import { pageMeta } from "@/lib/seo";

/* Siempre en vivo: ver la nota en (store)/page.tsx sobre por qué no se usa ISR con caché en KV. */
export const revalidate = 0;

export async function generateMetadata({ params }: PageProps<"/[lang]/productos">): Promise<Metadata> {
  const { lang } = await params;
  const { t, locale } = dict(lang);
  return pageMeta(locale, "/productos", { title: t.meta.products, description: t.meta.productsDescription, keywords: t.meta.keywords });
}

export default async function ProductsPage({ params }: PageProps<"/[lang]/productos">) {
  const { lang } = await params;
  const { t, locale } = dict(lang);
  const rawProducts = await listProducts(true);
  const products = rawProducts.map((p) => localizeProduct(p, locale));
  return (
    <div className="container-x mx-auto max-w-[1400px] pb-24 pt-28 md:pt-36">
      <p className="eyebrow text-black/50">{t.catalog.eyebrow}</p>
      <h1 className="display mt-4 text-[clamp(2.6rem,8vw,6rem)] uppercase">{t.catalog.heading}</h1>
      <Catalog products={products} />
    </div>
  );
}
