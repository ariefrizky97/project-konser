import { redirect } from "next/navigation";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Alamat lama: form masuk sekarang langsung ada di /admin. */
export default async function OldLoginPage({ searchParams }: Props) {
  const query = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) if (typeof value === "string") params.set(key, value);
  const rest = params.toString();
  redirect(rest ? `/admin?${rest}` : "/admin");
}
