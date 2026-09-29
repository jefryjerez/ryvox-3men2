import type { Metadata } from "next";
import { dict } from "@/i18n/server";
import { PosCart } from "@/components/dashboard/PosCart";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const { t } = dict(lang);
  return { title: t.dash.pos.title };
}

export default function PosPage() {
  return <PosCart />;
}
