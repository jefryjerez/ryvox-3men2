import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Hero } from "@/components/store/Hero";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_NAME, SITE_URL, pageMeta } from "@/lib/seo";
import { About } from "@/components/store/About";
import { Featured } from "@/components/store/Featured";
import { CatalogPreview } from "@/components/store/CatalogPreview";
import { Manifesto } from "@/components/store/Manifesto";
import { WholesaleForm } from "@/components/store/WholesaleForm";
import { listProducts } from "@/lib/data";
import { localizeProduct } from "@/lib/products";
import { getLandingSettings, mergeLandingText } from "@/lib/landing";
import { dict } from "@/i18n/server";

/* Siempre en vivo: en Cloudflare Workers (solo caché KV, sin cola de revalidación) el ISR por tiempo/`revalidatePath`
   no se dispara de forma fiable, así que un cambio en el panel podía tardar hasta 5 min o no verse hasta el próximo
   deploy. Con revalidate = 0 cada visita lee la base de datos al instante (D1 es rápido; el tráfico es bajo). */
export const revalidate = 0;

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  const { t, locale } = dict(lang);
  return pageMeta(locale, "", { title: t.meta.homeTitle, absoluteTitle: true, description: t.meta.homeDescription, keywords: t.meta.keywords });
}

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  const { t: baseT, locale } = dict(lang);
  const [rawProducts, settings] = await Promise.all([listProducts(true), getLandingSettings()]);
  const products = rawProducts.map((p) => localizeProduct(p, locale));
  const t = mergeLandingText(baseT, settings.content[locale]);
  // El hero va deslizando el visual (3D o foto) de todos los productos activos, aunque alguno sea "próximamente" (ahí solo se exhibe, no se vende).
  const heroProducts = products.filter((p) => p.active);
  // El destacado sí debe poder comprarse: nunca un producto "próximamente".
  const buyable = products.filter((p) => !p.comingSoon);
  const featured = buyable.find((p) => p.model3d) ?? buyable[0];
  const featuredEyebrow = settings.content[locale].featured?.eyebrow;

  const structured = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/brand/icon-512.png`,
      email: "info@ryvoxshop.com",
      sameAs: ["https://instagram.com/ryvoxshop", "https://www.tiktok.com/@ryvoxshop"],
      address: { "@type": "PostalAddress", streetAddress: "55 E Sunrise Hwy", addressLocality: "Lindenhurst", addressRegion: "NY", postalCode: "11757", addressCountry: "US" },
    },
    { "@context": "https://schema.org", "@type": "WebSite", name: SITE_NAME, url: SITE_URL, inLanguage: [lang] },
  ];

  /* Orden editable desde el panel (Dashboard → Inicio). Cada sección es opcional según haya o no producto para ella. */
  const sections: Record<string, ReactNode> = {
    hero: heroProducts.length > 0 && <Hero key="hero" products={heroProducts} t={t} />,
    catalog: <CatalogPreview key="catalog" products={products.slice(0, 8)} t={t} />,
    featured: featured && <Featured key="featured" product={featured} eyebrow={featuredEyebrow} />,
    about: <About key="about" t={t} />,
    manifesto: <Manifesto key="manifesto" t={t} />,
  };

  return (
    <>
      <JsonLd data={structured} />
      {settings.order.map((id) => sections[id])}
      {/* Mayoreo: el solicitante elige entre lo que sí se vende (no "próximamente"). */}
      <WholesaleForm products={buyable.map((p) => ({ id: p.id, name: p.name }))} />
    </>
  );
}
