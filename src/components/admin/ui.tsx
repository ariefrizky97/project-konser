import Link from "next/link";
import type { PostStatus, Status } from "@/lib/types";

/** Judul halaman admin dengan tombol aksi utama di kanan. */
export function PageHead({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: { href: string; label: string };
}) {
  return (
    <header className="adm-head">
      <div>
        <h1 className="adm-title">{title}</h1>
        {description && <p className="adm-desc">{description}</p>}
      </div>
      {action && (
        <Link href={action.href} className="btn">
          {action.label}
        </Link>
      )}
    </header>
  );
}

/** Satu isian form: label, isi, dan petunjuk singkat. */
export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="field">
      <label className="field-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}

/** Pilihan status draf atau terbit. */
export function StatusField({ value }: { value: Status }) {
  return (
    <fieldset className="field">
      <legend className="field-label">Status</legend>
      <div className="seg">
        <label>
          <input type="radio" name="status" value="draft" defaultChecked={value === "draft"} />
          <span>Draf</span>
        </label>
        <label>
          <input type="radio" name="status" value="published" defaultChecked={value === "published"} />
          <span>Terbit</span>
        </label>
      </div>
    </fieldset>
  );
}

export function StatusBadge({ status, scheduled = false }: { status: PostStatus; scheduled?: boolean }) {
  if (status === "draft") return <span className="badge">Draf</span>;
  if (status === "review") return <span className="badge badge--note">Menunggu tinjauan</span>;
  if (scheduled) return <span className="badge badge--note">Terjadwal</span>;
  return <span className="badge badge--ok">Terbit</span>;
}
