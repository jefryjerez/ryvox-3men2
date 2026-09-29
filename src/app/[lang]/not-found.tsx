"use client";

import { ButtonLink } from "@/components/ui/Button";
import { useT } from "@/i18n/client";

export default function NotFound() {
  const { t } = useT();
  return (
    <div className="container-x mx-auto flex min-h-svh max-w-[1400px] flex-col items-start justify-center py-24">
      <p className="eyebrow text-black/50">{t.notFound.eyebrow}</p>
      <h1 className="display mt-4 text-[clamp(2.6rem,8vw,6rem)] uppercase">{t.notFound.title}</h1>
      <ButtonLink href="/" size="lg" className="mt-10">
        {t.notFound.home}
      </ButtonLink>
    </div>
  );
}
