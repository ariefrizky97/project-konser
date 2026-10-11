import type { MetadataRoute } from "next";
import { listDirectory, listEvents, listPosts } from "@/lib/queries";
import { siteUrl } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const pages: MetadataRoute.Sitemap = ["", "/berita", "/event", "/direktori", "/tentang"].map(
    (path) => ({ url: `${base}${path}`, changeFrequency: "daily" }),
  );

  try {
    const [posts, events, entries] = await Promise.all([
      listPosts({ limit: 1000 }),
      listEvents({ limit: 500 }),
      listDirectory({ limit: 1000 }),
    ]);
    for (const post of posts) {
      pages.push({ url: `${base}/berita/${post.slug}`, lastModified: post.updated_at });
    }
    for (const event of events) {
      pages.push({ url: `${base}/event/${event.slug}`, lastModified: event.updated_at });
    }
    for (const entry of entries) {
      pages.push({ url: `${base}/direktori/${entry.slug}`, lastModified: entry.updated_at });
    }
  } catch (error) {
    // Database belum siap: kirim halaman utama saja daripada gagal total.
    console.error("Sitemap: gagal membaca database.", error);
  }

  return pages;
}
