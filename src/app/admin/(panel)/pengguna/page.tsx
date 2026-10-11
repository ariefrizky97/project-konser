import type { Metadata } from "next";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { ProfilePhoto } from "@/components/admin/ProfilePhoto";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { Avatar } from "@/components/site/Avatar";
import { Flash } from "@/components/admin/Flash";
import { Field, PageHead } from "@/components/admin/ui";
import { changePassword } from "@/lib/actions/auth";
import { addUser, deleteUser, saveProfile } from "@/lib/actions/users";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { listPickerItems, listUsers } from "@/lib/queries";

export const metadata: Metadata = { title: "Pengguna" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function UsersPage({ searchParams }: Props) {
  const user = await requireUser();
  const isAdmin = user.role === "admin";
  const [query, users, media] = await Promise.all([
    searchParams,
    isAdmin ? listUsers() : Promise.resolve([]),
    listPickerItems(),
  ]);

  return (
    <>
      <PageHead
        title="Pengguna"
        description="Editor bisa mengelola konten. Admin juga bisa mengatur pengguna dan pengaturan situs."
      />
      <Flash query={query} />

      <section className="panel profile">
        <div className="panel-head">
          <h2>Profil saya</h2>
        </div>
        <form action={saveProfile} className="profile-form profile-form--photo">
          <div className="stack">
            <Field label="Nama tampilan" htmlFor="profile-name" hint="Tampil sebagai nama penulis di artikel.">
              <input id="profile-name" name="name" type="text" defaultValue={user.name} maxLength={80} required />
            </Field>
            <Field
              label="Foto profil"
              htmlFor="avatar_url"
              hint="Pilih atau unggah foto, lalu seret foto di lingkaran dan atur perbesarannya supaya wajah pas di tengah. Tampil di bilah samping admin dan di samping nama penulis artikel. Kosongkan untuk kembali memakai inisial."
            >
              <ProfilePhoto name={user.name} url={user.avatar_url} crop={user.avatar_crop} items={media} />
            </Field>
            <div className="form-actions">
              <SubmitButton label="Simpan profil" />
            </div>
          </div>
        </form>
      </section>

      {isAdmin && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Email</th>
                <th>Peran</th>
                <th>Bergabung</th>
                <th>
                  <span className="sr">Aksi</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((item) => (
                <tr key={item.id}>
                  <td className="cell-title cell-user">
                    <Avatar name={item.name} src={item.avatar_url} crop={item.avatar_crop} className="rowavatar" />
                    {item.name}
                  </td>
                  <td>{item.email}</td>
                  <td>{item.role === "admin" ? "Admin" : "Editor"}</td>
                  <td>{formatDate(item.created_at)}</td>
                  <td className="cell-actions">
                    {item.id === user.id ? (
                      <span className="badge">Anda</span>
                    ) : (
                      <form action={deleteUser}>
                        <input type="hidden" name="id" value={item.id} />
                        <ConfirmButton label="Hapus" message={`Hapus pengguna ${item.name}? Artikelnya tetap ada.`} />
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="adm-cols">
        {isAdmin && (
          <section className="panel">
            <div className="panel-head">
              <h2>Tambah pengguna</h2>
            </div>
            <form action={addUser} className="stack">
              <Field label="Nama" htmlFor="name">
                <input id="name" name="name" type="text" maxLength={80} required />
              </Field>
              <Field label="Email" htmlFor="email">
                <input id="email" name="email" type="email" maxLength={200} autoComplete="off" required />
              </Field>
              <Field label="Kata sandi awal" htmlFor="password" hint="Minimal 8 karakter. Minta pengguna menggantinya setelah masuk.">
                <input id="password" name="password" type="password" minLength={8} autoComplete="new-password" required />
              </Field>
              <Field label="Peran" htmlFor="role">
                <select id="role" name="role" defaultValue="editor">
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
              </Field>
              <div className="form-actions">
                <button type="submit" className="btn">
                  Tambah pengguna
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="panel">
          <div className="panel-head">
            <h2>Ganti kata sandi saya</h2>
          </div>
          <form action={changePassword} className="stack">
            <Field label="Kata sandi saat ini" htmlFor="current">
              <input id="current" name="current" type="password" autoComplete="current-password" required />
            </Field>
            <Field label="Kata sandi baru" htmlFor="next" hint="Minimal 8 karakter.">
              <input id="next" name="next" type="password" minLength={8} autoComplete="new-password" required />
            </Field>
            <div className="form-actions">
              <button type="submit" className="btn">
                Ganti kata sandi
              </button>
            </div>
          </form>
        </section>
      </div>
    </>
  );
}
