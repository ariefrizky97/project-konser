import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Flash } from "@/components/admin/Flash";
import { SlideForm } from "@/components/admin/SlideForm";
import { PageHead } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { getSlideById, listPickerItems } from "@/lib/queries";

export const metadata: Metadata = { title: "Sunting slide" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditSlidePage({ params, searchParams }: Props) {
  await requireUser();
  const { id } = await params;
  if (!/^\d{1,9}$/.test(id)) notFound();

  const [query, slide, media] = await Promise.all([searchParams, getSlideById(Number(id)), listPickerItems()]);
  if (!slide) notFound();

  return (
    <>
      <PageHead title="Sunting slide" />
      <Flash query={query} />
      <SlideForm slide={slide} media={media} nextSort={slide.sort} />
    </>
  );
}
