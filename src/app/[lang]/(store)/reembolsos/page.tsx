import type { Metadata } from "next";
import { LegalPage } from "@/components/store/LegalPage";
import { getLegal } from "@/content/legal";
import { dict } from "@/i18n/server";
import { pageMeta } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const { locale } = dict(lang);
  const doc = getLegal(locale, "reembolsos");
  return pageMeta(locale, "/reembolsos", { title: doc.title, description: doc.description });
}

export default async function RefundsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const { t, locale } = dict(lang);
  return <LegalPage doc={getLegal(locale, "reembolsos")} related={{ href: "/terminos", label: t.legal.terms }} />;
}
