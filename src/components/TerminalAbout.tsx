"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

export type TerminalProps = {
  name: string;
  role: string;
  email: string;
  skills: string[];
  projects: { title: string; slug: string }[];
  location: string;
};

type Line = { text: string; tone?: "in" | "err" };

/**
 * Stage 6 #6 — interactive terminal-style "About me". Purely client-side:
 * commands answer from props (no network). Styled as a dark console that
 * picks up the Cyber theme accent automatically via tokens.
 */
export function TerminalAbout(props: TerminalProps) {
  const t = useTranslations("terminal");
  const [lines, setLines] = useState<Line[]>([
    { text: `guest@${props.name.toLowerCase().replace(/\s+/g, "-")}:~$ ` },
  ]);
  const [input, setInput] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight });
  }, [lines]);

  const out = (text: string, tone?: Line["tone"]) =>
    setLines((prev) => [...prev, { text, tone }]);

  const run = (raw: string) => {
    const cmd = raw.trim().toLowerCase();
    setLines((prev) => [...prev, { text: `$ ${raw.trim()}`, tone: "in" }]);
    if (!cmd) return;
    switch (cmd) {
      case "help":
        out("available: help, whoami, skills, projects, contact, clear");
        break;
      case "whoami":
        out(`${props.name} — ${props.role}`);
        out(`location: ${props.location}`);
        break;
      case "skills":
        out(props.skills.join(" · ") || "n/a");
        break;
      case "projects":
        if (!props.projects.length) out("n/a");
        props.projects.forEach((p) => out(`- ${p.title}  (/projects/${p.slug})`));
        break;
      case "contact":
        out(`email: ${props.email}`);
        break;
      case "clear":
        setLines([]);
        break;
      default:
        out(`command not found: ${cmd} — try "help"`, "err");
    }
  };

  return (
    <div
      ref={boxRef}
      className="card"
      style={{
        background: "var(--ink, #0b1020)",
        color: "var(--bg, #e8ecff)",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: 13.5,
        padding: 16,
        maxHeight: 320,
        overflowY: "auto",
        cursor: "text",
      }}
      onClick={() => inputRef.current?.focus()}
    >
      {lines.map((l, i) => (
        <div
          key={i}
          style={{
            whiteSpace: "pre-wrap",
            color: l.tone === "err" ? "var(--bad, #ff6b6b)" : l.tone === "in" ? "var(--accent)" : "inherit",
          }}
        >
          {l.text}
        </div>
      ))}
      <div style={{ display: "flex", gap: 6 }}>
        <span style={{ color: "var(--accent)" }}>$</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              run(input);
              setInput("");
            }
          }}
          aria-label={t("title")}
          placeholder={t("hint")}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "inherit",
            font: "inherit",
            caretColor: "var(--accent)",
          }}
          autoComplete="off"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
