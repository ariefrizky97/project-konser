import Link from "next/link";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { Avatar } from "@/components/site/Avatar";
import { IconLink, IconLogout } from "@/components/site/Icons";
import { Crumbs, SideBrand, SideFold, SideMenu, SideOpen, SideScrim, type SideGroup } from "@/components/site/Side";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { BackupReminder } from "@/components/admin/BackupReminder";
import { logout } from "@/lib/actions/auth";
import { getCurrentUser } from "@/lib/auth";
import { getBackupStatus } from "@/lib/backup";
import { countMessages } from "@/lib/queries";
import { getSettings } from "@/lib/settings";

const SECTIONS = {
  trafik: "Trafik pengunjung",
  "kotak-masuk": "Kotak masuk",
  halaman: "Halaman",
  menu: "Menu & teks berjalan",
  buletin: "Buletin",
  riwayat: "Riwayat",
  cadangan: "Backup & Restore",
  berita: "Berita",
  event: "Event",
  direktori: "Direktori",
  slide: "Slide",
  kategori: "Kategori & label",
  iklan: "Iklan",
  media: "Media",
  pengguna: "Pengguna",
  pengaturan: "Pengaturan",
};

const INNER = {
  "berita/baru": "Artikel baru",
  "halaman/baru": "Halaman baru",
  "iklan/laporan": "Laporan",
  halaman: "Sunting halaman",
  "kotak-masuk": "Baca pesan",
  "event/baru": "Event baru",
  "direktori/baru": "Entri baru",
  "slide/baru": "Slide baru",
  "iklan/baru": "Iklan baru",
  berita: "Sunting artikel",
  event: "Sunting event",
  direktori: "Sunting entri",
  slide: "Sunting slide",
  iklan: "Sunting iklan",
};

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const [user, settings, cookieStore, inbox] = await Promise.all([
    getCurrentUser(),
    getSettings(),
    cookies(),
    countMessages(),
  ]);
  // Belum masuk: tanpa bilah samping. Dasbor (/admin) menampilkan form masuk, halaman lain
  // mengalihkan ke /admin lewat requireUser.
  if (!user) return <>{children}</>;
  const collapsed = cookieStore.get("sisi")?.value === "ciut";
  // Pengingat cadangan hanya untuk admin; "Ingatkan besok" menundanya 24 jam lewat cookie.
  const backup = user.role === "admin" ? await getBackupStatus() : null;
  const snoozed = Number(cookieStore.get("cadangan_tunda")?.value ?? 0) > Date.now();

  const groups: SideGroup[] = [
    {
      label: "Konten",
      items: [
        { href: "/admin", label: "Dasbor", icon: "home", exact: true },
        { href: "/admin/trafik", label: "Trafik", icon: "chart" },
        { href: "/admin/kotak-masuk", label: "Kotak masuk", icon: "inbox", badge: inbox.baru ? String(inbox.baru) : undefined },
        { href: "/admin/berita", label: "Berita", icon: "news" },
        { href: "/admin/event", label: "Event", icon: "calendar" },
        { href: "/admin/direktori", label: "Direktori", icon: "grid" },
        { href: "/admin/halaman", label: "Halaman", icon: "page" },
      ],
    },
    {
      label: "Tampilan",
      items: [
        { href: "/admin/slide", label: "Slide", icon: "layers" },
        { href: "/admin/iklan", label: "Iklan", icon: "megaphone" },
        { href: "/admin/media", label: "Media", icon: "image" },
        { href: "/admin/kategori", label: "Kategori & label", icon: "tag" },
        ...(user.role === "admin" ? [{ href: "/admin/menu", label: "Menu & teks berjalan", icon: "menu" as const }] : []),
      ],
    },
    {
      label: "Lainnya",
      items: [
        { href: "/admin/buletin", label: "Buletin", icon: "mail" },
        { href: "/admin/pengguna", label: "Pengguna", icon: "users" },
        { href: "/admin/riwayat", label: "Riwayat", icon: "clock" },
        ...(user.role === "admin"
          ? [
              {
                href: "/admin/cadangan",
                label: "Backup & Restore",
                icon: "database" as const,
                badge: backup?.overdue ? "!" : undefined,
              },
              { href: "/admin/pengaturan", label: "Pengaturan", icon: "sliders" as const },
            ]
          : []),
      ],
    },
  ];

  return (
    <div className="shell adm">
      <aside className="side" id="menu-samping">
        <div className="side-head">
          <SideBrand name={settings.site_name} href="/admin" label="Dasbor admin" />
          <SideFold collapsed={collapsed} />
        </div>

        <Suspense fallback={null}>
          <SideMenu groups={groups} label="Menu admin" />
        </Suspense>

        <div className="side-foot">
          <div className="side-user">
            <Link href="/admin/pengguna" className="side-avatar-link" title="Ubah profil dan foto">
              <Avatar name={user.name} src={user.avatar_url} crop={user.avatar_crop} className="side-avatar" />
            </Link>
            <p className="side-user-text">
              <strong>{user.name}</strong>
              <span>{user.role === "admin" ? "Admin" : "Editor"}</span>
            </p>
            <form action={logout}>
              <button type="submit" className="side-logout" aria-label="Keluar" title="Keluar">
                <IconLogout />
              </button>
            </form>
          </div>
        </div>
      </aside>
      <SideScrim />

      <div className="shell-main adm-main">
        <header className="bar">
          <SideOpen />
          <Suspense fallback={null}>
            <Crumbs root="Admin" base="/admin" home="Dasbor" labels={SECTIONS} inner={INNER} />
          </Suspense>
          <div className="bar-tools">
            <Link href="/" className="bar-link" target="_blank">
              <IconLink />
              <span>Lihat situs</span>
            </Link>
            <ThemeToggle />
          </div>
        </header>
        <main className="adm-body">
          {backup?.overdue && !snoozed && <BackupReminder status={backup} />}
          {children}
        </main>
      </div>
    </div>
  );
}
