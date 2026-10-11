import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Flash } from "@/components/admin/Flash";
import { PageForm } from "@/components/admin/PageForm";
import { PageHead } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { getPageById } from "@/lib/queries";

export const metadata: Metadata = { title: "Sunting halaman" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditPagePage({ params, searchParams }: Props) {
  await requireUser();
  const { id } = await params;
  if (!/^\d{1,9}$/.test(id)) notFound();
  const [query, page] = await Promise.all([searchParams, getPageById(Number(id))]);
  if (!page) notFound();
  return (
    <>
      <PageHead title="Sunting halaman" />
      <Flash query={query} />
      <PageForm page={page} />
    </>
  );
}
