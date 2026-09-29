import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getProductBySlug, listProducts } from "@/lib/data";
import { localizeProduct } from "@/lib/products";
import { ProductDetail } from "@/components/store/ProductDetail";
import { ProductCard } from "@/components/store/ProductCard";
import { Reveal } from "@/components/motion/Reveal";
import { locales } from "@/i18n/config";
import { dict } from "@/i18n/server";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_NAME, SITE_URL, absoluteUrl, pageMeta } from "@/lib/seo";

/* Siempre en vivo: ver la nota en (store)/page.tsx sobre por qué no se usa ISR con caché en KV. */
export const revalidate = 0;

export async function generateStaticParams() {
  const products = await listProducts(true);
  return locales.flatMap((lang) => products.map((p) => ({ lang, slug: p.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/productos/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  const { locale } = dict(lang);
  const rawP = await getProductBySlug(slug);
  if (!rawP) return { title: "Producto" };
  const p = localizeProduct(rawP, locale);
  const description = `${p.tagline} ${p.description}`.slice(0, 158);
  return pageMeta(locale, `/productos/${p.slug}`, { title: p.name, description, image: { url: p.image, width: 1200, height: 1200 }, imageAlt: p.name });
}

export default async function ProductPage({ params }: PageProps<"/[lang]/productos/[slug]">) {
  const { lang, slug } = await params;
  const { t, locale } = dict(lang);
  const rawProduct = await getProductBySlug(slug);
  if (!rawProduct || !rawProduct.active) notFound();
  const product = localizeProduct(rawProduct, locale);

  const all = (await listProducts(true)).filter((p) => p.id !== product.id).map((p) => localizeProduct(p, locale));
  const related = all.filter((p) => p.category === product.category).concat(all.filter((p) => p.category !== product.category)).slice(0, 4);

  const url = `${SITE_URL}/${locale}/productos/${product.slug}`;
  const structured = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      image: [absoluteUrl(product.image), ...(product.gallery ?? []).map(absoluteUrl)],
      description: product.description,
      sku: product.sku,
      brand: { "@type": "Brand", name: SITE_NAME },
      offers: {
        "@type": "Offer",
        url,
        priceCurrency: "USD",
        price: (product.price / 100).toFixed(2),
        availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
        hasMerchantReturnPolicy: {
          "@type": "MerchantReturnPolicy",
          applicableCountry: "US",
          returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
          merchantReturnDays: 30,
          returnMethod: "https://schema.org/ReturnByMail",
          returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
        },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: SITE_NAME, item: `${SITE_URL}/${locale}` },
        { "@type": "ListItem", position: 2, name: t.meta.products, item: `${SITE_URL}/${locale}/productos` },
        { "@type": "ListItem", position: 3, name: product.name, item: url },
      ],
    },
  ];

  return (
    <div className="container-x mx-auto max-w-[1400px] pb-24 pt-24 md:pt-32">
      <JsonLd data={structured} />
      <Link href="/productos" className="inline-flex items-center gap-1 text-sm text-black/60 hover:text-black">
        <ChevronLeft size={16} /> {t.product.back}
      </Link>

      <ProductDetail product={product} />

      {related.length > 0 && (
        <section className="mt-24 border-t border-black/10 pt-14">
          <Reveal>
            <p className="eyebrow text-black/50">{t.product.related}</p>
          </Reveal>
          <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
            {related.map((p, i) => (
              <Reveal key={p.id} as="li" delay={i * 0.06}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
