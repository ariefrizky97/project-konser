// Pemberitahuan singkat di pojok layar, memakai toastify-js.
// Hanya dipanggil dari komponen klien.

export type ToastKind = "ok" | "error" | "info";

export async function toast(text: string, kind: ToastKind = "ok"): Promise<void> {
  const { default: Toastify } = await import("toastify-js");
  Toastify({
    text,
    duration: kind === "error" ? 6000 : 3200,
    gravity: "bottom",
    position: "right",
    close: kind === "error",
    stopOnFocus: true,
    className: `toast toast--${kind}`,
    ariaLive: kind === "error" ? "assertive" : "polite",
  }).showToast();
}
