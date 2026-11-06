"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { writeTheme } from "@/lib/theme-client";

export type PaletteItem = {
  label: string;
  href: string;
  kind: "page" | "post" | "project" | "section";
};

type Command =
  | { type: "nav"; label: string; href: string; hint: string }
  | { type: "theme"; label: string; theme: string; hint: string };

/**
 * Stage 6 #7 — hand-rolled command palette (no dependency): Ctrl/Cmd+K
 * opens it; search pages, blog posts, projects, jump to home sections,
 * switch theme. Items come from the server layout as props.
 */
export function CommandPalette({
  items,
  themes,
}: {
  items: PaletteItem[];
  themes: { key: string; label: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = useMemo(() => {
    const nav: Command[] = items.map((it) => ({
      type: "nav",
      label: it.label,
      href: it.href,
      hint: it.kind,
    }));
    const themeCmds: Command[] = themes.map((th) => ({
      type: "theme",
      label: th.label,
      theme: th.key,
      hint: "theme",
    }));
    return [...nav, ...themeCmds];
  }, [items, themes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands.slice(0, 12);
    return commands.filter((c) => c.label.toLowerCase().includes(q)).slice(0, 12);
  }, [commands, query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        setQuery("");
        setActive(0);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!open) return null;

  const run = (c: Command) => {
    setOpen(false);
    if (c.type === "theme") {
      writeTheme(c.theme);
      return;
    }
    router.push(c.href);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onClick={() => setOpen(false)}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.4)",
        zIndex: 90,
        display: "grid",
        placeItems: "start center",
        paddingTop: "12vh",
      }}
    >
      <div
        className="card"
        onClick={(e) => e.stopPropagation()}
        style={{ width: "min(560px, calc(100vw - 32px))", padding: 10, boxShadow: "0 18px 50px rgba(0,0,0,.35)" }}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, filtered.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter" && filtered[active]) {
              run(filtered[active]);
            }
          }}
          placeholder="Search…"
          aria-label="Search"
          style={{ marginBottom: 8 }}
        />
        <div style={{ display: "grid", gap: 2, maxHeight: "50vh", overflowY: "auto" }}>
          {filtered.length === 0 ? (
            <p className="mute" style={{ margin: 0, padding: 8, fontSize: 14 }}>
              {locale === "bn" ? "কিছু পাওয়া যায়নি" : "No matches"}
            </p>
          ) : (
            filtered.map((c, i) => (
              <button
                key={c.type + c.label + i}
                type="button"
                onClick={() => run(c)}
                onMouseEnter={() => setActive(i)}
                className={"btn" + (i === active ? " p" : "")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                  textAlign: "left",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <span>{c.label}</span>
                <span className="mute" style={{ fontSize: 12 }}>
                  {c.hint}
                </span>
              </button>
            ))
          )}
        </div>
        <p className="mute" style={{ margin: "8px 0 0", fontSize: 12 }}>
          {pathname.startsWith("/bn") ? "↑↓ নেভিগেট · Enter চালান · Esc বন্ধ" : "↑↓ navigate · Enter run · Esc close"}
        </p>
      </div>
    </div>
  );
}
