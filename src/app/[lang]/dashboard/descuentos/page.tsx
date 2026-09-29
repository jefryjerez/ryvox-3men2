import type { Metadata } from "next";
import { dict } from "@/i18n/server";
import { Discounts } from "@/components/dashboard/Discounts";

export async function generateMetadata({ params }: PageProps<"/[lang]/dashboard/descuentos">): Promise<Metadata> {
  const { lang } = await params;
  const { t } = dict(lang);
  return { title: t.dash.nav.discounts };
}

export default function DiscountsPage() {
  return <Discounts />;
}
