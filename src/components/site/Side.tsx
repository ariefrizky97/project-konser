"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  IconCalendar,
  IconChart,
  IconClock,
  IconDatabase,
  IconInbox,
  IconMail,
  IconPage,
  IconChevronLeft,
  IconGrid,
  IconHome,
  IconImage,
  IconInfo,
  IconLayers,
  IconMegaphone,
  IconMenu,
  IconNews,
  IconSearch,
  IconSliders,
  IconTag,
  IconUsers,
} from "./Icons";
import { LogoMark, Wordmark } from "./Logo";

const ICONS = {
  home: IconHome,
  news: IconNews,
  calendar: IconCalendar,
  grid: IconGrid,
  info: IconInfo,
  megaphone: IconMegaphone,
  search: IconSearch,
  image: IconImage,
  layers: IconLayers,
  tag: IconTag,
  sliders: IconSliders,
  users: IconUsers,
  chart: IconChart,
  inbox: IconInbox,
  page: IconPage,
  menu: IconMenu,
  mail: IconMail,
  clock: IconClock,
  database: IconDatabase,
};

export type SideIcon = keyof typeof ICONS;
export type SideChild = { href: string; label: string; color?: string | null };
export type SideItem = {
  href: string;
  label: string;
  icon: SideIcon;
  /** Hanya aktif bila alamatnya sama persis (beranda, dasbor). */
  exact?: boolean;
  /** Awalan alamat lain yang juga dianggap bagian dari menu ini. */
  also?: string[];
  badge?: string;
  children?: SideChild[];
};
export type SideGroup = { label: string; items: SideItem[] };

function inSection(pathname: string, item: SideItem): boolean {
  if (item.exact) return pathname === item.href;
  return [item.href, ...(item.also ?? [])].some((base) => pathname === base || pathname.startsWith(`${base}/`));
}

function childActive(pathname: string, search: URLSearchParams, href: string): boolean {
  const [path, query = ""] = href.split("?");
  if (pathname !== path) return false;
  for (const [key, value] of new URLSearchParams(query)) {
    if (search.get(key) !== value) return false;
  }
  return true;
}

function closeDrawer() {
  delete document.documentElement.dataset.drawer;
}

/** Merek di kepala bilah samping: logo dan nama situs. */
export function SideBrand({ name, href, label }: { name: string; href: string; label: string }) {
  return (
    <Link href={href} className="side-brand" aria-label={label} title={name}>
      <LogoMark className="side-mark" />
      <Wordmark name={name} className="side-name" />
    </Link>
  );
}

/**
 * Daftar menu di bilah samping: ikon, penanda halaman aktif, lencana,
 * dan sub-menu yang bisa dibuka tutup.
 */
export function SideMenu({ groups, label }: { groups: SideGroup[]; label: string }) {
  const pathname = usePathname() ?? "/";
  const search = useSearchParams() ?? new URLSearchParams();
  const [opened, setOpened] = useState<Record<string, boolean>>({});

  // Laci menu di layar sempit menutup sendiri setelah berpindah halaman atau saat Escape ditekan.
  const where = `${pathname}?${search.toString()}`;
  useEffect(() => {
    closeDrawer();
  }, [where]);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") closeDrawer();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <nav className="side-nav" aria-label={label}>
      {groups.map((group) => (
        <div className="side-block" key={group.label}>
          <p className="side-group">{group.label}</p>
          <ul>
            {group.items.map((item) => {
              const Icon = ICONS[item.icon];
              const active = inSection(pathname, item);
              const hasSub = Boolean(item.children?.length);
              const open = hasSub && (opened[item.href] ?? active);
              // Bila salah satu sub-menu sedang dibuka, penanda halaman aktif ada di sub-menu itu.
              const onChild = item.children?.some((child) => childActive(pathname, search, child.href)) ?? false;
              const subId = `sub-${item.href.replace(/[^a-z0-9]+/gi, "-")}`;
              return (
                <li key={item.href}>
                  <div className={`side-row${active ? " is-active" : ""}`}>
                    <Link
                      href={item.href}
                      className="side-link"
                      aria-current={active && !onChild ? "page" : undefined}
                      title={item.label}
                    >
                      <Icon className="side-icon" />
                      <span className="side-label">{item.label}</span>
                      {item.badge && <span className="side-badge">{item.badge}</span>}
                    </Link>
                    {hasSub && (
                      <button
                        type="button"
                        className="side-more"
                        aria-expanded={open}
                        aria-controls={subId}
                        aria-label={`${open ? "Tutup" : "Buka"} sub-menu ${item.label}`}
                        onClick={() => setOpened((state) => ({ ...state, [item.href]: !open }))}
                      >
                        <IconChevronLeft />
                      </button>
                    )}
                  </div>
                  {hasSub && (
                    <div className={`side-subwrap${open ? " is-open" : ""}`} id={subId}>
                      <ul className="side-sub">
                        {item.children?.map((child) => {
                          const current = childActive(pathname, search, child.href);
                          return (
                            <li key={child.href}>
                              <Link href={child.href} aria-current={current ? "page" : undefined}>
                                <span className="side-dot" style={{ background: child.color || undefined }} />
                                {child.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** Tombol ciutkan menu samping. Di layar sempit tombol ini menutup laci menu. */
export function SideFold({ collapsed }: { collapsed: boolean }) {
  const [folded, setFolded] = useState(collapsed);

  function toggle() {
    const root = document.documentElement;
    if (root.dataset.drawer === "buka") {
      closeDrawer();
      return;
    }
    const next = !folded;
    setFolded(next);
    if (next) root.dataset.side = "ciut";
    else delete root.dataset.side;
    document.cookie = `sisi=${next ? "ciut" : "lebar"}; path=/; max-age=31536000; samesite=lax`;
  }

  return (
    <button
      type="button"
      className="side-fold"
      onClick={toggle}
      aria-pressed={folded}
      aria-label={folded ? "Lebarkan menu samping" : "Ciutkan menu samping"}
    >
      <IconChevronLeft />
    </button>
  );
}

/** Tombol pembuka laci menu. Hanya tampil di layar sempit. */
export function SideOpen() {
  return (
    <button
      type="button"
      className="icon-btn side-open"
      aria-label="Buka menu"
      aria-controls="menu-samping"
      onClick={() => {
        document.documentElement.dataset.drawer = "buka";
      }}
    >
      <IconMenu />
    </button>
  );
}

/** Tirai gelap di belakang laci menu. Mengetuknya menutup laci. */
export function SideScrim() {
  return <button type="button" className="side-scrim" aria-label="Tutup menu" tabIndex={-1} onClick={closeDrawer} />;
}

/**
 * Remah roti di bilah atas: nama situs, bagian, lalu halaman di dalamnya.
 * `labels` memetakan potongan alamat pertama ke nama bagian; `inner` memberi nama
 * untuk halaman di dalam bagian itu.
 */
export function Crumbs({
  root,
  base,
  home,
  labels,
  inner,
}: {
  root: string;
  base: string;
  home: string;
  labels: Record<string, string>;
  inner: Record<string, string>;
}) {
  const pathname = usePathname() ?? base;
  const rest = pathname.slice(base === "/" ? 1 : base.length + 1);
  const parts = rest.split("/").filter(Boolean);
  const prefix = base === "/" ? "" : base;

  const trail: { label: string; href?: string }[] = [];
  if (!parts.length) {
    trail.push({ label: home });
  } else {
    const section = labels[parts[0]] ?? parts[0];
    if (parts.length === 1) {
      trail.push({ label: section });
    } else {
      trail.push({ label: section, href: `${prefix}/${parts[0]}` });
      trail.push({ label: inner[`${parts[0]}/${parts[1]}`] ?? inner[parts[0]] ?? "Detail" });
    }
  }

  return (
    <nav className="crumbs" aria-label="Posisi halaman">
      <ol>
        <li>
          <Link href={base}>{root}</Link>
        </li>
        {trail.map((item, index) => (
          <li key={index} aria-current={index === trail.length - 1 ? "page" : undefined}>
            {item.href ? <Link href={item.href}>{item.label}</Link> : item.label}
          </li>
        ))}
      </ol>
    </nav>
  );
}
