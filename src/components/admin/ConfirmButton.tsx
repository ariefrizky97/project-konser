"use client";

/** Tombol kirim yang meminta konfirmasi dulu. Dipakai untuk aksi hapus. */
export function ConfirmButton({
  label,
  message,
  className = "link-danger",
}: {
  label: string;
  message: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {label}
    </button>
  );
}
