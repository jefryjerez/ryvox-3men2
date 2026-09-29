import { getPlaceAddress } from "@/lib/places";
import { withinRateLimit } from "@/lib/rate-limit";

interface Body {
  placeId: string;
  sessionToken: string;
  lang?: string;
}

/** Dirección completa de la sugerencia elegida, para rellenar el formulario del checkout. */
export async function POST(req: Request) {
  if (!(await withinRateLimit(req, "places-details"))) return Response.json({ error: "Demasiadas solicitudes" }, { status: 429 });

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.placeId || !body.sessionToken) return Response.json({ error: "Faltan datos" }, { status: 400 });

  const address = await getPlaceAddress(body.placeId, body.sessionToken, body.lang === "en" ? "en" : "es");
  if (!address) return Response.json({ error: "No se pudo obtener la dirección" }, { status: 502 });
  return Response.json({ address });
}
