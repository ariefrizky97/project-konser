import { Suspense } from "react";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { MotionRoot } from "@/components/site/MotionRoot";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a className="skip" href="#konten">
        Langsung ke konten
      </a>
      <Header />
      <main id="konten">{children}</main>
      <Footer />
      <Suspense fallback={null}>
        <MotionRoot />
      </Suspense>
    </>
  );
}
