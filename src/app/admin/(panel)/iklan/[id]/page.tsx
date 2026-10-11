import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdForm } from "@/components/admin/AdForm";
import { Flash } from "@/components/admin/Flash";
import { PageHead } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { getAdById, listPickerItems } from "@/lib/queries";

export const metadata: Metadata = { title: "Sunting iklan" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditAdPage({ params, searchParams }: Props) {
  await requireUser();
  const { id } = await params;
  if (!/^\d{1,9}$/.test(id)) notFound();

  const [query, ad, media] = await Promise.all([searchParams, getAdById(Number(id)), listPickerItems()]);
  if (!ad) notFound();

  return (
    <>
      <PageHead title="Sunting iklan" />
      <Flash query={query} />
      <AdForm ad={ad} media={media} />
    </>
  );
}
