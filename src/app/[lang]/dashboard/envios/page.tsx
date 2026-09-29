import type { Metadata } from "next";
import { dict } from "@/i18n/server";
import { Shipments } from "@/components/dashboard/Shipments";

export async function generateMetadata({ params }: PageProps<"/[lang]/dashboard/envios">): Promise<Metadata> {
  const { lang } = await params;
  const { t } = dict(lang);
  return { title: t.dash.nav.shipments };
}

export default function ShipmentsPage() {
  return <Shipments />;
}
