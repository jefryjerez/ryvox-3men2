import type { MetadataRoute } from "next";

/**
 * Manifiesto de instalación del panel: el ícono que se agrega al inicio del teléfono abre directo
 * en /dashboard (Android/Chrome respeta start_url; en iOS/Safari hay que "Agregar a inicio" estando
 * ya dentro de /dashboard, porque Safari usa la página en la que estás, no start_url).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/dashboard",
    name: "RYVOX · Panel",
    short_name: "RYVOX",
    description: "Panel de administración de la tienda RYVOX.",
    start_url: "/dashboard",
    scope: "/dashboard/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#e8e8e8",
    theme_color: "#000000",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
