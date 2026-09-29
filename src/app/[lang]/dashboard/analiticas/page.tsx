import type { Metadata } from "next";
import { dict } from "@/i18n/server";
import { Analytics } from "@/components/dashboard/Analytics";

export async function generateMetadata({ params }: PageProps<"/[lang]/dashboard/analiticas">): Promise<Metadata> {
  const { lang } = await params;
  const { t } = dict(lang);
  return { title: t.dash.nav.analytics };
}

export default function AnalyticsPage() {
  return <Analytics />;
}
