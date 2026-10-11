import { registerAdClick } from "@/lib/queries";
import { safeUrl } from "@/lib/format";

/** Mencatat klik iklan lalu meneruskan pengunjung ke alamat tujuan. */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const target = /^\d{1,9}$/.test(id) ? await registerAdClick(Number(id)) : null;
  const destination = safeUrl(target ?? "") || "/";
  return new Response(null, {
    status: 302,
    headers: {
      Location: destination,
      "Cache-Control": "no-store",
    },
  });
}
