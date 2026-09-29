import type { Metadata } from "next";
import { Checkout } from "@/components/store/Checkout";
import { dict } from "@/i18n/server";

export async function generateMetadata({ params }: PageProps<"/[lang]/checkout">): Promise<Metadata> {
  const { lang } = await params;
  return { title: dict(lang).t.meta.checkout };
}

export default function Page() {
  return <Checkout />;
}
