import type { Metadata } from "next";
import { Flash } from "@/components/admin/Flash";
import { PostForm } from "@/components/admin/PostForm";
import { PageHead } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { listCategories, listPickerItems, listTagNames } from "@/lib/queries";
import { getSettings, siteUrl } from "@/lib/settings";

export const metadata: Metadata = { title: "Tulis artikel" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function NewPostPage({ searchParams }: Props) {
  const user = await requireUser();
  const [query, categories, media, tagNames, settings] = await Promise.all([
    searchParams,
    listCategories(),
    listPickerItems(),
    listTagNames(),
    getSettings(),
  ]);
  return (
    <>
      <PageHead title="Tulis artikel" />
      <Flash query={query} />
      <PostForm
        post={null}
        categories={categories}
        media={media}
        tags={[]}
        tagSuggestions={tagNames}
        role={user.role}
        siteName={settings.site_name}
        siteUrl={siteUrl()}
      />
    </>
  );
}
