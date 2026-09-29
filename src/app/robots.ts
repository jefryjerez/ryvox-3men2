import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/* Se evalúa en cada petición: SITE_LOCKED solo existe en el Worker, no al compilar. */
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  if (process.env.SITE_LOCKED === "true") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  const privatePaths = ["/dashboard", "/checkout", "/carrito", "/login", "/seguimiento", "/preview", "/render"];
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", ...privatePaths, ...privatePaths.map((p) => `/*${p}`)],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
