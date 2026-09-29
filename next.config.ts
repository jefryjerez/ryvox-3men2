import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  images: {
    // En Cloudflare Workers no hay `sharp`; las imágenes se sirven tal cual (ya son WebP ligeras).
    // Cuando se active "Images → Transformations" en el panel, se cambia por un loader de Cloudflare.
    unoptimized: true,
  },
  reactStrictMode: true,
  async headers() {
    // No se agrega Content-Security-Policy: con Stripe Elements + Apple/Google Pay en producción,
    // una CSP mal calibrada podría romper el pago real sin avisar. Estas otras son seguras: no cambian
    // ningún comportamiento existente del sitio ni de Stripe.
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

// Durante `next dev`, expone los bindings de Cloudflare (D1 local, KV) vía getCloudflareContext().
initOpenNextCloudflareForDev();

export default nextConfig;
