import "server-only";
import { getDb, schema } from "@/db";
import { buildingWithoutDb } from "@/lib/data";
import type { Dictionary } from "@/i18n/config";

/** Secciones que se pueden reordenar en el inicio de la tienda. */
export const LANDING_SECTIONS = ["hero", "catalog", "featured", "about", "manifesto"] as const;
export type LandingSectionId = (typeof LANDING_SECTIONS)[number];
export const DEFAULT_LANDING_ORDER: LandingSectionId[] = ["hero", "catalog", "featured", "about", "manifesto"];

export function isValidLandingOrder(x: unknown): x is LandingSectionId[] {
  return (
    Array.isArray(x) &&
    x.length === LANDING_SECTIONS.length &&
    x.every((s): s is LandingSectionId => (LANDING_SECTIONS as readonly string[]).includes(s as string)) &&
    new Set(x).size === LANDING_SECTIONS.length
  );
}

/* Textos editables por sección. Cada uno reemplaza por completo al del diccionario para ese idioma
   cuando está presente (el editor siempre envía la sección completa, precargada con el texto actual). */
export type HeroOverride = Dictionary["hero"];
export type AboutOverride = Dictionary["about"];
export type ManifestoOverride = Dictionary["manifesto"];
export type CatalogOverride = Pick<Dictionary["catalog"], "eyebrow" | "title1" | "title2" | "seeAll">;
export type FeaturedOverride = Pick<Dictionary["featured"], "eyebrow">;

export interface LandingTextOverrides {
  hero?: HeroOverride;
  catalog?: CatalogOverride;
  featured?: FeaturedOverride;
  about?: AboutOverride;
  manifesto?: ManifestoOverride;
}

export interface LandingSettings {
  order: LandingSectionId[];
  content: { es: LandingTextOverrides; en: LandingTextOverrides };
}

const DEFAULT_SETTINGS: LandingSettings = { order: DEFAULT_LANDING_ORDER, content: { es: {}, en: {} } };

export async function getLandingSettings(): Promise<LandingSettings> {
  if (buildingWithoutDb()) return DEFAULT_SETTINGS;
  const db = await getDb();
  const row = await db.query.siteSettings.findFirst({ where: (s, { eq }) => eq(s.id, "landing") });
  if (!row) return DEFAULT_SETTINGS;
  const content = (row.content ?? {}) as Partial<LandingSettings["content"]>;
  return {
    order: isValidLandingOrder(row.order) ? row.order : DEFAULT_LANDING_ORDER,
    content: { es: content.es ?? {}, en: content.en ?? {} },
  };
}

export async function saveLandingSettings(input: LandingSettings): Promise<LandingSettings> {
  const db = await getDb();
  await db
    .insert(schema.siteSettings)
    .values({ id: "landing", order: input.order, content: input.content, updatedAt: new Date() })
    .onConflictDoUpdate({ target: schema.siteSettings.id, set: { order: input.order, content: input.content, updatedAt: new Date() } });
  return input;
}

/** Aplica los textos guardados sobre el diccionario base para renderizar el inicio (solo hero/catalog/about/manifesto). */
export function mergeLandingText(dict: Dictionary, ov: LandingTextOverrides): Dictionary {
  return {
    ...dict,
    hero: ov.hero ?? dict.hero,
    catalog: { ...dict.catalog, ...(ov.catalog ?? {}) },
    about: ov.about ?? dict.about,
    manifesto: ov.manifesto ?? dict.manifesto,
  };
}
