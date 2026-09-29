import type { Metadata } from "next";
import { dict } from "@/i18n/server";
import { LandingEditor } from "@/components/dashboard/LandingEditor";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const { t } = dict(lang);
  return { title: t.dash.landing.title };
}

export default function LandingSettingsPage() {
  return <LandingEditor />;
}
