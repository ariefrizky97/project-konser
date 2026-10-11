import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Flash } from "@/components/admin/Flash";
import { PostForm } from "@/components/admin/PostForm";
import { PageHead } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { getPostById, getPostTags, listCategories, listPickerItems, listPostRevisions, listTagNames } from "@/lib/queries";
import { getSettings, siteUrl } from "@/lib/settings";

export const metadata: Metadata = { title: "Sunting artikel" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditPostPage({ params, searchParams }: Props) {
  const user = await requireUser();
  const { id } = await params;
  if (!/^\d{1,9}$/.test(id)) notFound();

  const [query, post, categories, media, tags, tagNames, revisions, settings] = await Promise.all([
    searchParams,
    getPostById(Number(id)),
    listCategories(),
    listPickerItems(),
    getPostTags(Number(id)),
    listTagNames(),
    listPostRevisions(Number(id)),
    getSettings(),
  ]);
  if (!post) notFound();

  return (
    <>
      <PageHead title="Sunting artikel" />
      <Flash query={query} />
      <PostForm
        post={post}
        categories={categories}
        media={media}
        tags={tags.map((tag) => tag.name)}
        tagSuggestions={tagNames}
        revisions={revisions}
        role={user.role}
        siteName={settings.site_name}
        siteUrl={siteUrl()}
      />
    </>
  );
}
