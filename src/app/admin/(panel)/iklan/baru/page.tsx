import type { Metadata } from "next";
import { AdForm } from "@/components/admin/AdForm";
import { Flash } from "@/components/admin/Flash";
import { PageHead } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { listPickerItems } from "@/lib/queries";

export const metadata: Metadata = { title: "Buat iklan" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function NewAdPage({ searchParams }: Props) {
  await requireUser();
  const [query, media] = await Promise.all([searchParams, listPickerItems()]);
  return (
    <>
      <PageHead title="Buat iklan" description="Pilih template, isi teksnya, lalu lihat hasilnya di pratinjau sebelum disimpan." />
      <Flash query={query} />
      <AdForm ad={null} media={media} />
    </>
  );
}
