import Link from "next/link";
import { Flash } from "@/components/admin/Flash";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { Logo } from "@/components/site/Logo";
import { login } from "@/lib/actions/auth";

/**
 * Layar masuk admin. Tampil langsung di /admin bila belum masuk (tanpa alamat /admin/masuk),
 * dengan logo di tengah yang batangnya bergerak seperti ekualiser.
 */
export function LoginScreen({ query, siteName }: { query: Record<string, string | string[] | undefined>; siteName: string }) {
  return (
    <main className="login">
      {/* Latar: deretan batang ekualiser yang naik turun, murni hiasan. */}
      <div className="login-eq" aria-hidden="true">
        {Array.from({ length: 44 }, (_, index) => (
          <span
            key={index}
            style={
              {
                "--h": `${22 + ((index * 37) % 74)}%`,
                "--t": `${(1.1 + ((index * 53) % 10) / 10).toFixed(1)}s`,
                "--d": `${(-((index * 29) % 20) / 10).toFixed(1)}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
      <div className="login-card">
        <Link href="/" className="login-logo" aria-label="Kembali ke situs">
          <Logo name={siteName} intro live />
        </Link>
        <h1 className="adm-title">Masuk ke admin</h1>
        <Flash query={query} />
        <form action={login} className="login-form">
          <div className="field">
            <label className="field-label" htmlFor="email">
              Email
            </label>
            <input id="email" name="email" type="email" autoComplete="username" required autoFocus />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="password">
              Kata sandi
            </label>
            <input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          <SubmitButton label="Masuk" pendingLabel="Memeriksa…" />
        </form>
      </div>
    </main>
  );
}
