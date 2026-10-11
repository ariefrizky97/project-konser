"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export type NavChild = { href: string; label: string; color?: string | null };
export type NavItem = { href: string; label: string; also?: string[]; children?: NavChild[] };

function isActive(pathname: string, item: NavItem): boolean {
  if (!item.href.startsWith("/")) return false;
  const path = item.href.split(/[?#]/)[0];
  if (path === "/") return pathname === "/";
  return [path, ...(item.also ?? [])].some((base) => pathname === base || pathname.startsWith(`${base}/`));
}

function Caret() {
  return (
    <svg className="nav-caret" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
      <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Tautan navbar dengan penanda halaman aktif. Menu yang punya `children` (Berita)
 * membuka daftar pilihan saat disorot, difokus, atau diketuk panahnya.
 */
export function NavLinks({ items, className }: { items: NavItem[]; className: string }) {
  const pathname = usePathname() ?? "/";
  const search = useSearchParams()?.toString() ?? "";
  const [open, setOpen] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);

  // Menu menutup setelah berpindah halaman, saat Escape ditekan, atau saat mengetuk di luar.
  useEffect(() => setOpen(null), [pathname, search]);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(null);
    }
    function onClick(event: MouseEvent) {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(null);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, []);

  const current = new URLSearchParams(search);

  return (
    <div className="nav-items" ref={root}>
      {items.map((item) => {
        const active = isActive(pathname, item);
        if (!item.children?.length) {
          return (
            <Link key={item.href} href={item.href} className={className} aria-current={active ? "page" : undefined}>
              {item.label}
            </Link>
          );
        }
        const expanded = open === item.href;
        const menuId = `menu-${item.href.replace(/[^a-z0-9]+/gi, "-")}`;
        return (
          <div key={item.href} className={`nav-item${expanded ? " is-open" : ""}`}>
            <Link href={item.href} className={`${className} nav-link--menu`} aria-current={active ? "page" : undefined}>
              {item.label}
            </Link>
            <button
              type="button"
              className="nav-more"
              aria-expanded={expanded}
              aria-controls={menuId}
              aria-label={`${expanded ? "Tutup" : "Buka"} pilihan ${item.label}`}
              onClick={() => setOpen(expanded ? null : item.href)}
            >
              <Caret />
            </button>
            <ul className="nav-menu" id={menuId}>
              {item.children.map((child) => {
                const [path, query = ""] = child.href.split("?");
                const wanted = [...new URLSearchParams(query)];
                const here =
                  pathname === path &&
                  wanted.every(([key, value]) => current.get(key) === value) &&
                  (wanted.length > 0 || !current.has("kategori"));
                return (
                  <li key={child.href}>
                    <Link href={child.href} aria-current={here ? "page" : undefined}>
                      {child.color !== undefined && (
                        <span className="nav-dot" style={{ background: child.color || undefined }} />
                      )}
                      {child.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
