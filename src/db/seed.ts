import { count } from "drizzle-orm";
import { PRODUCTS } from "@/lib/products";
import { hashPassword } from "@/lib/password";
import * as schema from "./schema";
import type { Db } from "./index";

const WEIGHTS: Record<string, [number, number, number, number]> = {
  // oz, largo, ancho, alto (pulgadas)
  maquinas: [14, 9, 5, 3],
  plantillas: [3, 10, 6, 0.5],
  organizacion: [18, 12, 6, 4],
  cuchillas: [6, 6, 4, 2],
  accesorios: [10, 12, 9, 2],
  cuidado: [12, 8, 3, 3],
};

/** Carga el catálogo inicial y el usuario admin si la base está vacía. Idempotente. No crea clientes ni órdenes. */
export async function seedIfEmpty(db: Db) {
  const [{ n }] = await db.select({ n: count() }).from(schema.products);
  if (Number(n) > 0) {
    await ensureAdmin(db);
    return;
  }

  // D1 admite como máximo 100 parámetros por sentencia: se inserta fila a fila.
  for (const p of PRODUCTS) {
    const [weightOz, dimL, dimW, dimH] = WEIGHTS[p.category] ?? [8, 8, 6, 3];
    await db.insert(schema.products).values({
        id: p.id,
        slug: p.slug,
        name: p.name,
        tagline: p.tagline,
        category: p.category,
        sku: p.sku,
        price: p.price,
        compareAt: p.compareAt ?? null,
        description: p.description,
        specs: p.specs,
        nameEn: p.nameEn ?? null,
        taglineEn: p.taglineEn ?? null,
        descriptionEn: p.descriptionEn ?? null,
        specsEn: p.specsEn ?? null,
        image: p.image,
        gallery: p.gallery ?? [],
        colors: p.colors ?? [],
        colorImages: (p.colorImages ?? {}) as Record<string, string>,
        stock: p.stock,
        lowStockAt: p.lowStockAt,
        active: p.active,
        model3d: p.model3d,
        featured: !!p.featured,
        comingSoon: !!p.comingSoon,
        badge: p.badge ?? null,
        sold30d: p.sold30d,
        weightOz,
        dimL,
        dimW,
        dimH,
    });
  }

  await ensureAdmin(db);
}

/** Crea el usuario administrador a partir de ADMIN_EMAIL / ADMIN_PASSWORD si no existe. */
async function ensureAdmin(db: Db) {
  const email = (process.env.ADMIN_EMAIL ?? "admin@ryvox.co").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "ryvox2026";
  const existing = await db.query.adminUsers.findFirst({ where: (u, { eq }) => eq(u.email, email) });
  if (existing) return;
  await db.insert(schema.adminUsers).values({
    id: `u-${Date.now()}`,
    email,
    name: process.env.ADMIN_NAME ?? "Ryvox",
    passwordHash: await hashPassword(password),
  });
  if (!process.env.ADMIN_PASSWORD) {
    console.warn(`[ryvox] Usuario admin creado con la contraseña por defecto (${email}). Define ADMIN_PASSWORD en .env.local.`);
  }
}
