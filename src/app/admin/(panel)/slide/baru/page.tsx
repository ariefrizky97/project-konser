import type { Metadata } from "next";
import { Flash } from "@/components/admin/Flash";
import { SlideForm } from "@/components/admin/SlideForm";
import { PageHead } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { adminListSlides, listPickerItems } from "@/lib/queries";

export const metadata: Metadata = { title: "Tambah slide" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function NewSlidePage({ searchParams }: Props) {
  await requireUser();
  const [query, media, slides] = await Promise.all([searchParams, listPickerItems(), adminListSlides()]);
  const nextSort = slides.reduce((max, slide) => Math.max(max, slide.sort), 0) + 1;
  return (
    <>
      <PageHead title="Tambah slide" description="Pilih foto atau video, beri judul, lalu simpan." />
      <Flash query={query} />
      <SlideForm slide={null} media={media} nextSort={nextSort} />
    </>
  );
}
