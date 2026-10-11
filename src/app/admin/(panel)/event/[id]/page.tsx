import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventForm } from "@/components/admin/EventForm";
import { Flash } from "@/components/admin/Flash";
import { PageHead } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { getEventById, listEventTypes, listPickerItems } from "@/lib/queries";

export const metadata: Metadata = { title: "Sunting event" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditEventPage({ params, searchParams }: Props) {
  await requireUser();
  const { id } = await params;
  if (!/^\d{1,9}$/.test(id)) notFound();

  const [query, event, types, media] = await Promise.all([
    searchParams,
    getEventById(Number(id)),
    listEventTypes(),
    listPickerItems(),
  ]);
  if (!event) notFound();

  return (
    <>
      <PageHead title="Sunting event" />
      <Flash query={query} />
      <EventForm event={event} types={types} media={media} />
    </>
  );
}
