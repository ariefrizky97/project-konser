import type { Metadata } from "next";
import { EventForm } from "@/components/admin/EventForm";
import { Flash } from "@/components/admin/Flash";
import { PageHead } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { listEventTypes, listPickerItems } from "@/lib/queries";

export const metadata: Metadata = { title: "Tambah event" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function NewEventPage({ searchParams }: Props) {
  await requireUser();
  const [query, types, media] = await Promise.all([searchParams, listEventTypes(), listPickerItems()]);
  return (
    <>
      <PageHead title="Tambah event" />
      <Flash query={query} />
      <EventForm event={null} types={types} media={media} />
    </>
  );
}
