import "server-only";
import { revalidatePath } from "next/cache";

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Regenera las páginas estáticas de la tienda tras cambiar el catálogo. */
export function revalidateStore(slug?: string) {
  revalidatePath("/");
  revalidatePath("/productos");
  if (slug) revalidatePath(`/productos/${slug}`);
}
