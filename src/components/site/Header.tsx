import Link from "next/link";
import { Suspense } from "react";
import { formatDateFull, timeAgo } from "@/lib/format";
import { listCategories, listPosts } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { getSiteMenu, TICKER_SECONDS } from "@/lib/sitemenu";
import { AdSlot } from "./AdSlot";
import { IconSearch } from "./Icons";
import { Logo } from "./Logo";
import { NavLinks, type NavItem } from "./NavLinks";
import { Social } from "./Social";
import { ThemeToggle } from "./ThemeToggle";
import { Ticker, type TickerItem } from "./Ticker";
import { WeatherChip } from "./Weather";


/**
 * Kepala situs, dari atas ke bawah: baris teks berjalan, baris logo, lalu navbar
 * tembus pandang yang menempel di atas saat digulir. Ruang iklan lebar ada di bawahnya.
 */
export async function Header() {
  const [settings, latest, categories, menu] = await Promise.all([
    getSettings(),
    listPosts({ limit: 6 }),
    listCategories(),
    getSiteMenu(),
  ]);

  // Menu diatur dari Admin > Menu & teks berjalan. Menu yang mengarah ke /berita
  // otomatis membuka pilihan kategori.
  const nav: NavItem[] = menu.nav.map((link) =>
    link.href === "/berita"
      ? {
          href: link.href,
          label: link.label,
          also: ["/tagar"],
          children: [
            { href: "/berita", label: "Semua berita" },
            ...categories.map((category) => ({
              href: `/berita?kategori=${category.slug}`,
              label: category.name,
              color: category.color,
            })),
          ],
        }
      : { href: link.href, label: link.label },
  );

  // Teks berjalan: pilihan admin, atau enam berita terbaru.
  const manual = menu.tickerMode === "manual" && menu.tickerItems.length > 0;
  const ticker: TickerItem[] = manual
    ? menu.tickerItems.map((item, index) => ({ key: `m${index}`, text: item.text, href: item.href }))
    : latest.map((post) => ({
        key: `p${post.id}`,
        text: post.title,
        href: `/berita/${post.slug}`,
        label: post.category_name,
        color: post.category_color,
        note: post.published_at ? timeAgo(post.published_at) : undefined,
      }));

  return (
    <>
      {/* Baris paling atas: tanggal, teks berjalan, ikon media sosial. */}
      <div className="topbar">
        <span className="topbar-date">{formatDateFull(new Date())}</span>
        <Ticker items={ticker} seconds={TICKER_SECONDS[menu.tickerSpeed]} />
        <Social settings={settings} className="social--top" />
      </div>

      <header className="hd">
        <div className="wrap mast">
          <div className="mast-brand">
            <Link href="/" aria-label={`${settings.site_name}, ke beranda`} className="mast-logo">
              <Logo name={settings.site_name} />
            </Link>
          </div>
          <WeatherChip />
        </div>
      </header>

      <div className="nav">
        <div className="wrap nav-in">
          <nav className="nav-links" aria-label="Utama">
            <Suspense fallback={null}>
              <NavLinks items={nav} className="nav-link" />
            </Suspense>
          </nav>
          <form className="nav-search" action="/cari" role="search">
            <label className="sr" htmlFor="nav-q">
              Cari berita, event, atau direktori
            </label>
            <input id="nav-q" name="q" type="search" placeholder="Cari…" autoComplete="off" />
            <button type="submit" className="icon-btn" aria-label="Cari">
              <IconSearch />
            </button>
          </form>
          <ThemeToggle />
        </div>
      </div>

      {/* Ruang iklan header: selebar isi halaman. Diatur dari Admin > Iklan. */}
      <div className="wrap billboard">
        <AdSlot slot="header" />
      </div>
    </>
  );
}
