import { requireAdmin } from "@/lib/auth-server";
import { getLandingSettings, isValidLandingOrder, saveLandingSettings, type LandingSettings } from "@/lib/landing";
import { revalidateStore } from "@/lib/store-revalidate";

/** Orden de las secciones y textos del inicio, editables desde el panel sin tocar código. */
export async function GET() {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  return Response.json(await getLandingSettings());
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const body = (await req.json().catch(() => null)) as Partial<LandingSettings> | null;
  if (!body) return Response.json({ error: "Datos inválidos" }, { status: 400 });
  if (body.order !== undefined && !isValidLandingOrder(body.order)) {
    return Response.json({ error: "El orden debe incluir cada sección una sola vez" }, { status: 400 });
  }

  const current = await getLandingSettings();
  const next: LandingSettings = {
    order: body.order ?? current.order,
    content: {
      es: { ...current.content.es, ...(body.content?.es ?? {}) },
      en: { ...current.content.en, ...(body.content?.en ?? {}) },
    },
  };
  const saved = await saveLandingSettings(next);
  revalidateStore();
  return Response.json(saved);
}
