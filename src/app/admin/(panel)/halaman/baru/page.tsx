import type { Metadata } from "next";
import { Flash } from "@/components/admin/Flash";
import { PageForm } from "@/components/admin/PageForm";
import { PageHead } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Buat halaman" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function NewPagePage({ searchParams }: Props) {
  await requireUser();
  return (
    <>
      <PageHead title="Buat halaman" />
      <Flash query={await searchParams} />
      <PageForm page={null} />
    </>
  );
}
