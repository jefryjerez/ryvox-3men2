import { autocompleteAddress } from "@/lib/places";
import { withinRateLimit } from "@/lib/rate-limit";

interface Body {
  input: string;
  sessionToken: string;
  lang?: string;
}

/** Sugerencias de dirección mientras el cliente escribe en el checkout. */
export async function POST(req: Request) {
  if (!(await withinRateLimit(req, "places-autocomplete"))) return Response.json({ error: "Demasiadas solicitudes" }, { status: 429 });

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.input || !body.sessionToken) return Response.json({ suggestions: [] });

  const suggestions = await autocompleteAddress(body.input, body.sessionToken, body.lang === "en" ? "en" : "es");
  return Response.json({ suggestions });
}
