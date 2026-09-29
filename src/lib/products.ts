import { colorImagesFor, type ColorId } from "@/lib/colors";
import type { Locale } from "@/i18n/config";

export type Category =
  | "maquinas"
  | "plantillas"
  | "organizacion"
  | "cuchillas"
  | "accesorios"
  | "cuidado";

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "maquinas", label: "Máquinas" },
  { id: "plantillas", label: "Plantillas" },
  { id: "organizacion", label: "Organización" },
  { id: "cuchillas", label: "Cuchillas" },
  { id: "accesorios", label: "Accesorios" },
  { id: "cuidado", label: "Cuidado" },
];

export type Model3D = "template" | "airbrush-mount" | "dispenser" | null;

export interface Product {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  category: Category;
  sku: string;
  price: number; // centavos
  compareAt?: number;
  description: string;
  specs: { label: string; value: string }[];
  /** Traducción al inglés de name/tagline/description/specs. Si falta, la tienda muestra el texto en español de arriba. */
  nameEn?: string;
  taglineEn?: string;
  descriptionEn?: string;
  specsEn?: { label: string; value: string }[];
  image: string;
  gallery?: string[]; // fotos adicionales
  /** Colores en que se fabrica (vacío = un solo acabado). El primero es el que se muestra por defecto. */
  colors: ColorId[];
  /** Foto por color; si falta, se usa `image`. */
  colorImages?: Partial<Record<ColorId, string>>;
  stock: number;
  lowStockAt: number;
  active: boolean;
  model3d: Model3D;
  featured?: boolean;
  /** Todavía no se vende: se ve en la tienda pero no se puede comprar ("Próximamente"). */
  comingSoon?: boolean;
  badge?: string;
  sold30d: number;
  // envío (pulgadas y onzas); opcionales en los datos de ejemplo
  weightOz?: number;
  dims?: { l: number; w: number; h: number };
}

/* Los 6 colores originales en que se fabrican los productos actuales. No usar COLOR_IDS aquí:
   ese arreglo crece cuando se agregan colores nuevos a la paleta para futuros productos, y estos
   3 productos deben seguir fabricándose solo en los colores que el usuario ya definió. */
const CURRENT_COLORS: ColorId[] = ["negro", "azul", "verde", "rosado", "rojo", "dorado"];

/* Catálogo inicial: se carga en la base de datos la primera vez que arranca vacía. Nombre, precio y detalles se editan desde el panel. */
export const PRODUCTS: Product[] = [
  {
    id: "p-001",
    slug: "plantilla-hairline-beard",
    name: "Plantilla Hairline & Beard",
    tagline: "Líneas perfectas. Simétricas. Siempre.",
    category: "plantillas",
    sku: "RVX-TPL-HB",
    price: 2900,
    description:
      "Guía de acrílico mate con reglas grabadas, curva C-Cup y curva de barba. Apoya, marca y corta: la misma línea en los dos lados sin tener que mirar dos veces.",
    specs: [
      { label: "Material", value: "Acrílico mate 3 mm" },
      { label: "Escalas", value: "Frontal + lateral, mm" },
      { label: "Curvas", value: "C-Cup y barba" },
      { label: "Limpieza", value: "Apto para desinfectante" },
    ],
    nameEn: "Hairline & Beard Template",
    taglineEn: "Perfect lines. Symmetrical. Every time.",
    descriptionEn:
      "Matte acrylic guide with engraved rulers, C-Cup curve and beard curve. Rest it, mark it, cut: the same line on both sides without looking twice.",
    specsEn: [
      { label: "Material", value: "3 mm matte acrylic" },
      { label: "Scales", value: "Front + side, mm" },
      { label: "Curves", value: "C-Cup and beard" },
      { label: "Cleaning", value: "Disinfectant safe" },
    ],
    image: "/products/plantilla-hairline-negro.webp",
    colors: ["negro"], // el usuario vende la plantilla solo en negro; las fotos y texturas de los otros colores siguen en public/products por si las activa desde el panel
    colorImages: colorImagesFor("/products/plantilla-hairline-negro.webp"),
    stock: 50,
    lowStockAt: 10,
    active: true,
    model3d: "template",
    comingSoon: true,
    sold30d: 0,
  },
  {
    id: "p-002",
    slug: "dispensador-cuchillas",
    name: "Dispensador de Cuchillas",
    tagline: "Una cuchilla nueva, sin tocar las demás.",
    category: "cuchillas",
    sku: "RVX-DSP-BLD",
    price: 1900,
    description:
      "Dispensador impreso en 3D para paquetes de hojas de afeitar de doble filo. Carga el paquete completo por arriba y saca las hojas de una en una por la ranura lateral, sin abrir envoltorios cada vez.",
    specs: [
      { label: "Material", value: "PETG mate impreso en 3D" },
      { label: "Capacidad", value: "1 paquete de 100 hojas" },
      { label: "Compatible", value: "Astra, Derby, Shark y similares" },
      { label: "Medidas", value: "8 × 11 × 5 cm" },
    ],
    nameEn: "Razor Blade Dispenser",
    taglineEn: "One fresh blade at a time, no fumbling.",
    descriptionEn:
      "3D-printed dispenser for double-edge razor blade packs. Load the full pack from the top and pull blades one at a time through the side slot, no unwrapping every time.",
    specsEn: [
      { label: "Material", value: "Matte 3D-printed PETG" },
      { label: "Capacity", value: "1 pack of 100 blades" },
      { label: "Compatible", value: "Astra, Derby, Shark and similar" },
      { label: "Dimensions", value: "8 × 11 × 5 cm" },
    ],
    image: "/products/dispensador-cuchillas-negro.webp",
    colors: CURRENT_COLORS,
    colorImages: colorImagesFor("/products/dispensador-cuchillas-negro.webp"),
    stock: 30,
    lowStockAt: 5,
    active: true,
    model3d: "dispenser",
    badge: "Nuevo",
    sold30d: 0,
  },
  {
    id: "p-003",
    slug: "soporte-aerografo",
    name: "Soporte de Pared para Aerógrafo",
    tagline: "Tu aerógrafo siempre a mano.",
    category: "organizacion",
    sku: "RVX-WM-AIR",
    price: 2400,
    description:
      "Soporte impreso en 3D para colgar el aerógrafo en la pared de la estación: dos brazos en J con cuna curva sostienen el cuerpo sin rayarlo y lo dejan listo para tomarlo con una mano. Placa lisa, sin tornillos a la vista. Disponible en seis colores.",
    specs: [
      { label: "Material", value: "PETG mate impreso en 3D" },
      { label: "Compatible", value: "Aerógrafos de gravedad estándar" },
      { label: "Fijación", value: "Adhesivo de montaje" },
      { label: "Medidas", value: "13 × 9 × 5 cm" },
    ],
    nameEn: "Airbrush Wall Mount",
    taglineEn: "Your airbrush always within reach.",
    descriptionEn:
      "3D-printed mount to hang the airbrush on your station wall: two J-arms with a curved cradle hold the body without scratching it, ready to grab with one hand. Flat plate, no visible screws. Available in six colors.",
    specsEn: [
      { label: "Material", value: "Matte 3D-printed PETG" },
      { label: "Compatible", value: "Standard gravity-feed airbrushes" },
      { label: "Mounting", value: "Adhesive mount" },
      { label: "Dimensions", value: "13 × 9 × 5 cm" },
    ],
    image: "/products/soporte-aerografo-negro.webp",
    colors: CURRENT_COLORS,
    colorImages: colorImagesFor("/products/soporte-aerografo-negro.webp"),
    stock: 25,
    lowStockAt: 5,
    active: true,
    model3d: "airbrush-mount",
    badge: "Nuevo",
    featured: true,
    sold30d: 0,
  },
];

export function getProduct(slug: string) {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function categoryLabel(id: Category) {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

/** Aplica la traducción al inglés cuando existe; si falta, se queda en español (nunca se ve vacío). */
export function localizeProduct(p: Product, locale: Locale): Product {
  if (locale !== "en") return p;
  return {
    ...p,
    name: p.nameEn || p.name,
    tagline: p.taglineEn || p.tagline,
    description: p.descriptionEn || p.description,
    specs: p.specsEn && p.specsEn.length > 0 ? p.specsEn : p.specs,
  };
}
