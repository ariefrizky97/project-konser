import type { Metadata } from "next";
import { Flash } from "@/components/admin/Flash";
import { MenuEditor } from "@/components/admin/MenuEditor";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { PageHead } from "@/components/admin/ui";
import { saveSiteMenu } from "@/lib/actions/sitemenu";
import { requireAdmin } from "@/lib/auth";
import { listPages, listPosts } from "@/lib/queries";
import { DEFAULT_NAV, getSiteMenu } from "@/lib/sitemenu";

export const metadata: Metadata = { title: "Menu & teks berjalan" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function MenuPage({ searchParams }: Props) {
  await requireAdmin();
  const [query, menu, pages, posts] = await Promise.all([searchParams, getSiteMenu(), listPages(), listPosts({ limit: 8 })]);

  const navOptions = [
    ...DEFAULT_NAV,
    { label: "Kontak", href: "/kontak" },
    { label: "Pasang iklan", href: "/kontak?perihal=iklan" },
    ...pages.filter((page) => page.status === "published").map((page) => ({ label: page.title, href: `/halaman/${page.slug}` })),
  ];

  return (
    <>
      <PageHead
        title="Menu & teks berjalan"
        description="Atur isi dan urutan menu navbar, dan pilih sendiri apa yang tampil di teks berjalan paling atas."
      />
      <Flash query={query} />

      <form action={saveSiteMenu}>
        <div className="adm-cols">
          <section className="panel">
            <div className="panel-head">
              <h2>Menu navbar</h2>
            </div>
            <MenuEditor
              name="nav_items"
              initial={menu.nav}
              max={10}
              labelName="Nama menu"
              hrefHint="/alamat atau https://…"
              hrefRequired
              suggestions={navOptions}
            />
            <p className="field-hint">
              Paling banyak 10 menu. Menu yang mengarah ke /berita otomatis membuka pilihan kategori.
            </p>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>Teks berjalan</h2>
            </div>
            <fieldset className="field">
              <legend className="field-label">Isi</legend>
              <div className="seg">
                <label>
                  <input type="radio" name="ticker_mode" value="auto" defaultChecked={menu.tickerMode === "auto"} />
                  <span>Otomatis: 6 berita terbaru</span>
                </label>
                <label>
                  <input type="radio" name="ticker_mode" value="manual" defaultChecked={menu.tickerMode === "manual"} />
                  <span>Pilih sendiri</span>
                </label>
              </div>
              <p className="field-hint">Daftar di bawah hanya dipakai bila "Pilih sendiri" dipilih dan daftarnya tidak kosong.</p>
            </fieldset>
            <MenuEditor
              name="ticker_items"
              initial={menu.tickerItems.map((item) => ({ label: item.text, href: item.href }))}
              max={12}
              labelName="Teks, misalnya: Gerbang dibuka pukul 14.00"
              hrefHint="Tautan (boleh kosong)"
              hrefRequired={false}
              suggestions={posts.map((post) => ({ label: post.title, href: `/berita/${post.slug}` }))}
            />
            <fieldset className="field">
              <legend className="field-label">Kecepatan</legend>
              <div className="seg">
                {(["pelan", "sedang", "cepat"] as const).map((speed) => (
                  <label key={speed}>
                    <input type="radio" name="ticker_speed" value={speed} defaultChecked={menu.tickerSpeed === speed} />
                    <span>{speed.charAt(0).toUpperCase() + speed.slice(1)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </section>
        </div>
        <div className="form-actions menu-actions">
          <SubmitButton />
        </div>
      </form>
    </>
  );
}
