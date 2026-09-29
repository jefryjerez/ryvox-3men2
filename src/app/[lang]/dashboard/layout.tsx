import type { Metadata } from "next";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { AdminBootstrap } from "@/components/dashboard/AdminBootstrap";
import { dict } from "@/i18n/server";

export async function generateMetadata({ params }: LayoutProps<"/[lang]/dashboard">): Promise<Metadata> {
  const { lang } = await params;
  const { t } = dict(lang);
  return {
    title: { default: t.meta.panel, template: `%s · ${t.meta.panel} RYVOX` },
    robots: { index: false, follow: false },
  };
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh bg-mist">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <Topbar />
        <main className="flex-1 px-4 pb-24 pt-4 sm:px-6 lg:px-8 lg:pb-10 lg:pt-6">
          <AdminBootstrap />
          {children}
        </main>
      </div>
    </div>
  );
}
