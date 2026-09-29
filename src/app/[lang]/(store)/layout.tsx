import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { CartDrawer } from "@/components/store/CartDrawer";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { PresenceBeacon } from "@/components/store/PresenceBeacon";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SmoothScroll />
      <PresenceBeacon />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
    </>
  );
}
