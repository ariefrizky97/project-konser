import type { Metadata } from "next";
import { DirectoryForm } from "@/components/admin/DirectoryForm";
import { Flash } from "@/components/admin/Flash";
import { PageHead } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { listPickerItems } from "@/lib/queries";

export const metadata: Metadata = { title: "Tambah entri direktori" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function NewDirectoryEntryPage({ searchParams }: Props) {
  await requireUser();
  const [query, media] = await Promise.all([searchParams, listPickerItems()]);
  return (
    <>
      <PageHead title="Tambah entri direktori" />
      <Flash query={query} />
      <DirectoryForm entry={null} media={media} />
    </>
  );
}
