"use client";

import { useFormStatus } from "react-dom";
import { Spinner } from "@/components/site/Spinner";

/** Tombol kirim form. Selama aksi berjalan, tombol terkunci dan menampilkan indikator aktivitas. */
export function SubmitButton({
  label = "Simpan",
  pendingLabel = "Menyimpan…",
  className = "btn",
}: {
  label?: string;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {pending && <Spinner label={pendingLabel} />}
      {pending ? pendingLabel : label}
    </button>
  );
}
