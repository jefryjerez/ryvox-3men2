/**
 * Paleta completa de colores de fabricación. Los primeros 6 son los que el usuario definió al inicio
 * (los únicos que usan los productos actuales); el resto se agregó para que, al crear productos nuevos
 * desde el panel, se pueda elegir entre toda la paleta. Nunca reordenar los primeros 6: productos ya
 * guardados dependen de estos ids.
 */
export const COLOR_IDS = [
  "negro",
  "azul",
  "verde",
  "rosado",
  "rojo",
  "dorado",
  "blanco",
  "gris",
  "plata",
  "morado",
  "naranja",
  "amarillo",
  "cafe",
  "turquesa",
  "cobre",
] as const;
export type ColorId = (typeof COLOR_IDS)[number];

export interface ColorSpec {
  /** Color del material en el 3D. */
  hex: string;
  /** Color del círculo selector en la interfaz. */
  swatch: string;
  /** Acabado metálico (dorado). */
  metal: boolean;
}

export const COLORS: Record<ColorId, ColorSpec> = {
  negro: { hex: "#161616", swatch: "#111111", metal: false },
  azul: { hex: "#1f4fd6", swatch: "#1f4fd6", metal: false },
  verde: { hex: "#2bcf3c", swatch: "#22c55e", metal: false },
  rosado: { hex: "#ff5fa2", swatch: "#f472b6", metal: false },
  rojo: { hex: "#d92027", swatch: "#dc2626", metal: false },
  dorado: { hex: "#d4af37", swatch: "#d4af37", metal: true },
  blanco: { hex: "#f5f5f5", swatch: "#ffffff", metal: false },
  gris: { hex: "#8a8a8a", swatch: "#9a9a9a", metal: false },
  plata: { hex: "#c7c7c7", swatch: "#c0c0c0", metal: false },
  morado: { hex: "#7c3aed", swatch: "#7c3aed", metal: false },
  naranja: { hex: "#f97316", swatch: "#f97316", metal: false },
  amarillo: { hex: "#eab308", swatch: "#eab308", metal: false },
  cafe: { hex: "#6b4226", swatch: "#6b4226", metal: false },
  turquesa: { hex: "#14b8a6", swatch: "#14b8a6", metal: false },
  cobre: { hex: "#b87333", swatch: "#b87333", metal: false },
};

export function isColorId(x: unknown): x is ColorId {
  return typeof x === "string" && (COLOR_IDS as readonly string[]).includes(x);
}

/** Colores válidos de un producto, en el orden canónico. */
export function productColors(p: { colors?: readonly string[] | null }): ColorId[] {
  const set = new Set((p.colors ?? []).filter(isColorId));
  return COLOR_IDS.filter((c) => set.has(c));
}

/** Foto del producto en un color; si ese color no tiene foto propia, la imagen principal. */
export function productImage(p: { image: string; colorImages?: Partial<Record<string, string>> | null }, color?: ColorId | null): string {
  return (color && p.colorImages?.[color]) || p.image;
}

/** Ruta de la foto de una variante a partir de la base: "/products/x.webp" o "/products/x-negro.webp" → "/products/x-<color>.webp". */
const VARIANT_SUFFIX = new RegExp(`(-(${COLOR_IDS.join("|")}))?\\.webp$`);

export function variantImagePath(base: string, color: ColorId): string {
  return base.replace(VARIANT_SUFFIX, `-${color}.webp`);
}

export function colorImagesFor(base: string): Record<ColorId, string> {
  return Object.fromEntries(COLOR_IDS.map((c) => [c, variantImagePath(base, c)])) as Record<ColorId, string>;
}
