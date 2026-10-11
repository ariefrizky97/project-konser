import type { Metadata, Viewport } from "next";
import { DM_Sans, Marcellus, Poppins } from "next/font/google";
import { cookies } from "next/headers";
import { Logo } from "@/components/site/Logo";
import { Spinner } from "@/components/site/Spinner";
import { getSettings, siteUrl } from "@/lib/settings";
import "toastify-js/src/toastify.css";
import "./globals.css";

// Layar pembuka hanya tampil sekali per sesi. Skrip kecil ini berjalan sebelum halaman
// digambar dan menandai kunjungan berikutnya supaya layar pembuka dilewati.
const SPLASH_SCRIPT = `try{if(sessionStorage.getItem("pk-splash")){document.documentElement.dataset.splash="off"}else{sessionStorage.setItem("pk-splash","1")}}catch(e){}`;

// Dua huruf: Poppins (huruf logo) untuk nama situs, judul, dan navbar; DM Sans untuk teks.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

// Marcellus tetap dipakai untuk judul halaman (Berita, Musik, Agenda, dan seterusnya).
const marcellus = Marcellus({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-marcellus",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

// Semua halaman dirender per permintaan karena isinya berasal dari database.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    metadataBase: new URL(siteUrl()),
    title: {
      default: `${settings.site_name}: ${settings.tagline}`,
      template: `%s | ${settings.site_name}`,
    },
    description: settings.description,
    openGraph: {
      siteName: settings.site_name,
      locale: "id_ID",
      type: "website",
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#17140F" },
    { media: "(prefers-color-scheme: dark)", color: "#161513" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Tema pilihan pengunjung dibaca dari cookie supaya halaman langsung tampil
  // dengan tema yang benar. Tanpa cookie, CSS mengikuti pengaturan perangkat.
  const [cookieStore, settings] = await Promise.all([cookies(), getSettings()]);
  const stored = cookieStore.get("tema")?.value;
  const theme = stored === "gelap" || stored === "terang" ? stored : undefined;
  // Menu samping yang diciutkan juga diingat lewat cookie supaya lebarnya tidak melompat.
  const side = cookieStore.get("sisi")?.value === "ciut" ? "ciut" : undefined;

  return (
    <html lang="id" data-theme={theme} data-side={side} className={`${poppins.variable} ${marcellus.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: SPLASH_SCRIPT }} />
        {/* Layar pembuka dengan indikator aktivitas. Hilang sendiri lewat CSS setelah satu detik. */}
        <div className="splash" aria-hidden="true">
          <Logo name={settings.site_name} intro />
          <Spinner large label="Memuat situs" />
        </div>
        {children}
      </body>
    </html>
  );
}
