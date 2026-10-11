// Tipe untuk toastify-js, sebatas opsi yang dipakai proyek ini.
declare module "toastify-js" {
  export type ToastifyOptions = {
    text?: string;
    duration?: number;
    gravity?: "top" | "bottom";
    position?: "left" | "center" | "right";
    close?: boolean;
    stopOnFocus?: boolean;
    className?: string;
    ariaLive?: "off" | "polite" | "assertive";
    style?: Record<string, string>;
    onClick?: () => void;
  };

  export default function Toastify(options?: ToastifyOptions): {
    showToast(): void;
    hideToast(): void;
  };
}
