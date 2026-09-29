import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { listProducts } from "@/lib/data";
import { SITE_URL } from "@/lib/seo";

/* Se genera en cada petición con los productos activos de la base de datos. */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (process.env.SITE_LOCKED === "true") return [];

  const products = await listProducts(true);
  const now = new Date();
  const pages: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" }[] = [
    { path: "", priority: 1, changeFrequency: "weekly" },
    { path: "/productos", priority: 0.9, changeFrequency: "daily" },
    ...products.map((p) => ({ path: `/productos/${p.slug}`, priority: 0.8, changeFrequency: "weekly" as const })),
    { path: "/terminos", priority: 0.3, changeFrequency: "monthly" },
    { path: "/reembolsos", priority: 0.3, changeFrequency: "monthly" },
    { path: "/privacidad", priority: 0.3, changeFrequency: "monthly" },
  ];

  return pages.flatMap(({ path, priority, changeFrequency }) =>
    locales.map((lang) => ({
      url: `${SITE_URL}/${lang}${path}`,
      lastModified: now,
      changeFrequency,
      priority,
      alternates: { languages: { es: `${SITE_URL}/es${path}`, en: `${SITE_URL}/en${path}` } },
    })),
  );
}
