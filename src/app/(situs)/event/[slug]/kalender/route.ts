import { icsFile } from "@/lib/calendar";
import { getEventBySlug } from "@/lib/queries";
import { getSettings, siteUrl } from "@/lib/settings";

/** Unduhan file .ics untuk satu event. */
export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const event = await getEventBySlug(slug);
  if (!event) return new Response("Event tidak ditemukan", { status: 404 });

  const settings = await getSettings();
  const body = icsFile(event, `${siteUrl()}/event/${event.slug}`, settings.site_name);
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
