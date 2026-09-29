import "server-only";

/** Autocompletado de direcciones con la API nueva de Google Places. Solo EE.UU. por ahora (única región que enviamos). */

export interface PlaceSuggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
}

export interface ParsedAddress {
  line1: string;
  city: string;
  region: string; // código de 2 letras del estado, ej. "NY"
  zip: string;
  country: string;
}

const API_BASE = "https://places.googleapis.com/v1";

export function placesEnabled() {
  return !!process.env.GOOGLE_PLACES_API_KEY;
}

/** Sugerencias de direcciones a partir de texto parcial. Devuelve [] si falta la clave o si Google no responde. */
export async function autocompleteAddress(input: string, sessionToken: string, languageCode: string): Promise<PlaceSuggestion[]> {
  const key = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!key || input.trim().length < 3) return [];

  try {
    const res = await fetch(`${API_BASE}/places:autocomplete`, {
      method: "POST",
      headers: { "content-type": "application/json", "X-Goog-Api-Key": key },
      body: JSON.stringify({
        input,
        sessionToken,
        languageCode,
        includedRegionCodes: ["us"],
        includedPrimaryTypes: ["street_address", "premise", "subpremise", "route"],
      }),
    });
    if (!res.ok) {
      console.error("[places] autocomplete", res.status, await res.text().catch(() => ""));
      return [];
    }
    const data = (await res.json()) as {
      suggestions?: { placePrediction?: { placeId: string; structuredFormat?: { mainText?: { text: string }; secondaryText?: { text: string } } } }[];
    };
    return (data.suggestions ?? [])
      .map((s) => s.placePrediction)
      .filter((p): p is NonNullable<typeof p> => !!p)
      .map((p) => ({
        placeId: p.placeId,
        mainText: p.structuredFormat?.mainText?.text ?? "",
        secondaryText: p.structuredFormat?.secondaryText?.text ?? "",
      }));
  } catch (err) {
    console.error("[places] autocomplete", err);
    return [];
  }
}

/** Detalle de una sugerencia elegida, ya partido en los campos del formulario de envío. */
export async function getPlaceAddress(placeId: string, sessionToken: string, languageCode = "es"): Promise<ParsedAddress | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!key) return null;

  try {
    const res = await fetch(`${API_BASE}/places/${encodeURIComponent(placeId)}?sessionToken=${encodeURIComponent(sessionToken)}&languageCode=${languageCode}`, {
      headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": "addressComponents" },
    });
    if (!res.ok) {
      console.error("[places] details", res.status, await res.text().catch(() => ""));
      return null;
    }
    const data = (await res.json()) as { addressComponents?: { longText: string; shortText: string; types: string[] }[] };
    const comps = data.addressComponents ?? [];
    const find = (type: string) => comps.find((c) => c.types.includes(type));

    const streetNumber = find("street_number")?.longText ?? "";
    const route = find("route")?.longText ?? "";
    const subpremise = find("subpremise")?.longText;
    const line1 = [streetNumber, route].filter(Boolean).join(" ") + (subpremise ? ` #${subpremise}` : "");

    return {
      line1: line1.trim(),
      city: find("locality")?.longText ?? find("sublocality")?.longText ?? find("postal_town")?.longText ?? "",
      region: find("administrative_area_level_1")?.shortText ?? "",
      zip: find("postal_code")?.longText ?? "",
      country: find("country")?.longText ?? (languageCode === "en" ? "United States" : "Estados Unidos"),
    };
  } catch (err) {
    console.error("[places] details", err);
    return null;
  }
}
