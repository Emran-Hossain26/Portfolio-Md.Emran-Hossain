import { readFileSync, writeFileSync } from "node:fs";

/**
 * Stage 6 item 5 — nonce-based CSP makes the [locale] layout dynamic
 * (headers()), so prerender-time generateStaticParams conflicts. Removing
 * them switches those pages to on-demand dynamic rendering; data stays
 * cached through the "use cache" layer.
 */
const FILES = [
  "src/app/[locale]/blog/[slug]/page.tsx",
  "src/app/[locale]/blog/tag/[slug]/page.tsx",
  "src/app/[locale]/blog/category/[slug]/page.tsx",
  "src/app/[locale]/projects/[slug]/page.tsx",
  "src/app/[locale]/services/page.tsx",
  "src/app/[locale]/layout.tsx",
];

for (const f of FILES) {
  let s = readFileSync(f, "utf8");
  const nl = s.includes("\r\n") ? "\r\n" : "\n";
  let removed = 0;
  // Remove generateStaticParams function blocks (export async function or export function)
  const re = /\r?\n?export (?:async )?function generateStaticParams\(\)[^{]*\{[\s\S]*?\n\}/g;
  s = s.replace(re, () => { removed++; return ""; });
  // Remove leftover generateStaticParams mentions in comments? keep.
  if (removed) writeFileSync(f, s);
  console.log(f.split(/[\\/]/).slice(-3).join("/"), "removed:", removed);
}
