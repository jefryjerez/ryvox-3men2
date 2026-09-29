import type { Metadata } from "next";
import { Check } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { ClearCart } from "@/components/store/ClearCart";
import { dict } from "@/i18n/server";

export async function generateMetadata({ params }: PageProps<"/[lang]/checkout/confirmacion">): Promise<Metadata> {
  const { lang } = await params;
  return { title: dict(lang).t.meta.confirmed };
}

export default async function ConfirmationPage({ params, searchParams }: PageProps<"/[lang]/checkout/confirmacion">) {
  const { lang } = await params;
  const { t } = dict(lang);
  const { orden, t: tokenParam } = await searchParams;
  const number = typeof orden === "string" ? orden : null;
  const token = typeof tokenParam === "string" ? tokenParam : "";

  return (
    <div className="container-x mx-auto flex max-w-[1400px] flex-col items-start pb-24 pt-32 md:pt-44">
      <ClearCart />
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-black text-white">
        <Check size={26} />
      </span>
      <h1 className="display mt-8 text-[clamp(2.6rem,8vw,6rem)] uppercase">
        {t.confirmation.title1}
        <br />
        {t.confirmation.title2}
      </h1>
      {number && <p className="display mt-6 text-2xl">{number}</p>}
      <p className="mt-6 max-w-md text-black/65">{t.confirmation.text}</p>
      <div className="mt-10 flex flex-wrap gap-3">
        {number && (
          <ButtonLink href={`/seguimiento/${encodeURIComponent(number.replace("#", ""))}?t=${encodeURIComponent(token)}`} size="lg" variant="secondary">
            {t.confirmation.track}
          </ButtonLink>
        )}
        <ButtonLink href="/productos" size="lg">
          {t.confirmation.keep}
        </ButtonLink>
      </div>
    </div>
  );
}
