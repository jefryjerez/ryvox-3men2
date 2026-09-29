import type { Metadata, Viewport } from "next";
import { Inter, Unbounded } from "next/font/google";
import "../globals.css";
import { LocaleProvider } from "@/i18n/client";
import { defaultLocale, getDictionary, isLocale, locales, type Locale } from "@/i18n/config";
import { OG_IMAGE, SITE_NAME, SITE_URL, ogLocale } from "@/lib/seo";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const unbounded = Unbounded({ variable: "--font-unbounded", subsets: ["latin"], weight: ["500", "700", "800"], display: "swap" });

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

function resolve(lang: string): Locale {
  return isLocale(lang) ? lang : defaultLocale;
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  const locale = resolve(lang);
  const t = getDictionary(locale);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t.meta.homeTitle, template: "%s · RYVOX" },
    description: t.meta.homeDescription,
    applicationName: SITE_NAME,
    keywords: t.meta.keywords,
    icons: { icon: "/favicon.ico", apple: "/brand/apple-touch-icon.png" },
    // iOS no lee start_url del manifest: "Agregar a inicio" desde /dashboard abre ahí directo (ver src/app/manifest.ts).
    appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "RYVOX" },
    // Vista previa al compartir el enlace (WhatsApp, Instagram, Facebook, iMessage): logo sobre negro.
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: ogLocale(locale),
      title: t.meta.homeTitle,
      description: t.meta.homeDescription,
      images: [{ url: OG_IMAGE.url, width: OG_IMAGE.width, height: OG_IMAGE.height, alt: SITE_NAME }],
    },
    twitter: { card: "summary_large_image", title: t.meta.homeTitle, description: t.meta.homeDescription, images: [OG_IMAGE.url] },
  };
}

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  const locale = resolve(lang);
  return (
    <html lang={locale} className={`${inter.variable} ${unbounded.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <LocaleProvider locale={locale} dict={getDictionary(locale)}>
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
