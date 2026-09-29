import type { Metadata } from "next";
import { Check } from "lucide-react";
import { getOrderByNumber } from "@/lib/data";
import { orderTimeline } from "@/lib/orders";
import { cn, longDate } from "@/lib/format";
import { ButtonLink } from "@/components/ui/Button";
import { fill } from "@/i18n/config";
import { dict } from "@/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[lang]/seguimiento/[numero]">): Promise<Metadata> {
  const { lang } = await params;
  return { title: dict(lang).t.meta.tracking, robots: { index: false } };
}

export default async function TrackingPage({ params, searchParams }: PageProps<"/[lang]/seguimiento/[numero]">) {
  const { lang, numero } = await params;
  const { t: tokenParam } = await searchParams;
  const { t, locale } = dict(lang);
  const order = await getOrderByNumber(numero, typeof tokenParam === "string" ? tokenParam : null);

  return (
    <div className="container-x mx-auto max-w-[1400px] pb-24 pt-28 md:pt-36">
      <p className="eyebrow text-black/50">{t.tracking.eyebrow}</p>
      {!order ? (
        <>
          <h1 className="display mt-4 text-[clamp(2.2rem,7vw,5rem)] uppercase">{t.tracking.notFound}</h1>
          <p className="mt-4 max-w-md text-black/60">{t.tracking.notFoundText}</p>
          <ButtonLink href="/" className="mt-8">{t.tracking.home}</ButtonLink>
        </>
      ) : (
        <>
          <h1 className="display mt-4 text-[clamp(2.2rem,7vw,5rem)] uppercase">{fill(t.tracking.order, { n: order.number })}</h1>
          <div className="mt-10 grid gap-8 md:grid-cols-12">
            <ol className="rounded-3xl bg-white p-6 md:col-span-7 md:p-8">
              {orderTimeline(order).map((e, i, arr) => {
                const done = !!e.at;
                const detail = e.detailKey ? t.timeline[e.detailKey] : e.detail;
                return (
                  <li key={e.key} className="relative flex gap-4 pb-7 last:pb-0">
                    {i < arr.length - 1 && <span className={cn("absolute left-[11px] top-6 h-[calc(100%-8px)] w-px", done ? "bg-black" : "bg-line")} />}
                    <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full border", done ? "border-black bg-black text-white" : "border-line bg-white")}>
                      {done && <Check size={12} />}
                    </span>
                    <div>
                      <p className={cn("text-sm font-medium", !done && "text-black/45")}>{t.timeline[e.key]}</p>
                      <p className="text-xs text-black/50">{e.at ? longDate(e.at, locale) : detail ?? "—"}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
            <aside className="md:col-span-5">
              <div className="rounded-3xl bg-white p-6">
                <p className="text-[11px] uppercase tracking-wider text-black/45">{t.tracking.shipping}</p>
                <p className="mt-2 text-sm">{order.shippingLabel ?? t.tracking.standard}</p>
                {order.tracking && (
                  <>
                    <p className="mt-4 text-[11px] uppercase tracking-wider text-black/45">{order.carrier}</p>
                    <p className="mt-1 break-all text-sm font-medium">{order.tracking}</p>
                    {order.trackingUrl && (
                      <ButtonLink href={order.trackingUrl} size="sm" className="mt-4" target="_blank" rel="noreferrer">
                        {fill(t.tracking.viewOn, { carrier: order.carrier ?? "" })}
                      </ButtonLink>
                    )}
                  </>
                )}
                <p className="mt-6 text-[11px] uppercase tracking-wider text-black/45">{t.tracking.deliverTo}</p>
                <address className="mt-1 text-sm not-italic leading-relaxed">
                  {order.shippingAddress.name}
                  <br />
                  {order.shippingAddress.city}, {order.shippingAddress.region} {order.shippingAddress.zip}
                </address>
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
