import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DirectoryForm } from "@/components/admin/DirectoryForm";
import { Flash } from "@/components/admin/Flash";
import { PageHead } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { getDirectoryById, listPickerItems } from "@/lib/queries";

export const metadata: Metadata = { title: "Sunting entri direktori" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditDirectoryEntryPage({ params, searchParams }: Props) {
  await requireUser();
  const { id } = await params;
  if (!/^\d{1,9}$/.test(id)) notFound();

  const [query, entry, media] = await Promise.all([searchParams, getDirectoryById(Number(id)), listPickerItems()]);
  if (!entry) notFound();

  return (
    <>
      <PageHead title="Sunting entri direktori" />
      <Flash query={query} />
      <DirectoryForm entry={entry} media={media} />
    </>
  );
}
