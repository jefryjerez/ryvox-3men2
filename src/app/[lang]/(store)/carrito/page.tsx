import type { Metadata } from "next";
import { CartPage } from "@/components/store/CartPage";
import { dict } from "@/i18n/server";

export async function generateMetadata({ params }: PageProps<"/[lang]/carrito">): Promise<Metadata> {
  const { lang } = await params;
  return { title: dict(lang).t.meta.cart };
}

export default function Page() {
  return <CartPage />;
}
