import type { Metadata } from "next";
import { dict } from "@/i18n/server";
import { Wholesale } from "@/components/dashboard/Wholesale";

export async function generateMetadata({ params }: PageProps<"/[lang]/dashboard/mayoreo">): Promise<Metadata> {
  const { lang } = await params;
  const { t } = dict(lang);
  return { title: t.dash.nav.wholesale };
}

export default function WholesalePage() {
  return <Wholesale />;
}
