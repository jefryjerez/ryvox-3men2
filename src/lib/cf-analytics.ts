const CF_API = "https://api.cloudflare.com/client/v4";
const HOST = "ryvoxshop.com";

let cachedSiteTag: string | null = null;

async function cfFetch(path: string, token: string, init?: RequestInit) {
  const res = await fetch(`${CF_API}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json", ...init?.headers },
  });
  const data = (await res.json()) as { success: boolean; result?: unknown; errors?: unknown };
  if (!res.ok || !data.success) throw new Error(`Cloudflare API ${path}: ${JSON.stringify(data.errors ?? data)}`);
  return data.result;
}

async function siteTag(accountId: string, token: string): Promise<string> {
  if (cachedSiteTag) return cachedSiteTag;
  const sites = (await cfFetch(`/accounts/${accountId}/rum/site_info/list`, token)) as Array<{
    site_tag: string;
    ruleset?: { zone_name?: string };
  }>;
  const site = sites.find((s) => s.ruleset?.zone_name === HOST);
  if (!site) throw new Error(`No se encontró el sitio de Web Analytics para ${HOST}`);
  cachedSiteTag = site.site_tag;
  return site.site_tag;
}

export type VisitDay = { date: string; visits: number; pageviews: number };

/** Historial diario de visitas (Cloudflare Web Analytics / RUM), agrupado por día. */
export async function fetchVisitHistory(fromISODate: string, toISODate: string): Promise<VisitDay[]> {
  const accountId = process.env.CF_ACCOUNT_ID;
  const token = process.env.CF_ANALYTICS_TOKEN;
  if (!accountId || !token) return [];

  const tag = await siteTag(accountId, token);

  const query = `
    query VisitHistory($accountTag: String!, $siteTag: String!, $from: Date!, $to: Date!) {
      viewer {
        accounts(filter: { accountTag: $accountTag }) {
          rumPageloadEventsAdaptiveGroups(
            limit: 366
            filter: { siteTag: $siteTag, date_geq: $from, date_leq: $to }
            orderBy: [date_ASC]
          ) {
            count
            sum { visits }
            dimensions { date }
          }
        }
      }
    }
  `;

  const res = await fetch(`${CF_API}/graphql`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ query, variables: { accountTag: accountId, siteTag: tag, from: fromISODate, to: toISODate } }),
  });
  const data = (await res.json()) as {
    data?: { viewer?: { accounts?: Array<{ rumPageloadEventsAdaptiveGroups?: Array<{ count: number; sum?: { visits: number }; dimensions: { date: string } }> }> } };
    errors?: unknown;
  };
  if (data.errors) throw new Error(`Cloudflare GraphQL: ${JSON.stringify(data.errors)}`);

  const rows = data.data?.viewer?.accounts?.[0]?.rumPageloadEventsAdaptiveGroups ?? [];
  return rows
    .map((r) => ({ date: r.dimensions.date, visits: r.sum?.visits ?? 0, pageviews: r.count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export type Referrer = { host: string; visits: number };

/** De dónde viene el tráfico (host de referencia), agregado para todo el rango. */
export async function fetchTopReferrers(fromISODate: string, toISODate: string): Promise<Referrer[]> {
  const accountId = process.env.CF_ACCOUNT_ID;
  const token = process.env.CF_ANALYTICS_TOKEN;
  if (!accountId || !token) return [];

  const tag = await siteTag(accountId, token);

  const query = `
    query TrafficSources($accountTag: String!, $siteTag: String!, $from: Date!, $to: Date!) {
      viewer {
        accounts(filter: { accountTag: $accountTag }) {
          rumPageloadEventsAdaptiveGroups(
            limit: 50
            filter: { siteTag: $siteTag, date_geq: $from, date_leq: $to }
          ) {
            sum { visits }
            dimensions { refererHost }
          }
        }
      }
    }
  `;

  const res = await fetch(`${CF_API}/graphql`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ query, variables: { accountTag: accountId, siteTag: tag, from: fromISODate, to: toISODate } }),
  });
  const data = (await res.json()) as {
    data?: { viewer?: { accounts?: Array<{ rumPageloadEventsAdaptiveGroups?: Array<{ sum?: { visits: number }; dimensions: { refererHost: string } }> }> } };
    errors?: unknown;
  };
  if (data.errors) throw new Error(`Cloudflare GraphQL: ${JSON.stringify(data.errors)}`);

  const rows = data.data?.viewer?.accounts?.[0]?.rumPageloadEventsAdaptiveGroups ?? [];
  return rows
    .map((r) => ({ host: r.dimensions.refererHost, visits: r.sum?.visits ?? 0 }))
    .filter((r) => r.visits > 0)
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 10);
}
