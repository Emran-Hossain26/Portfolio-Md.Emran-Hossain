import { readFileSync, writeFileSync } from "node:fs";

// Provide the root `locale` param only; slugs render on demand.
const GSP = `export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}`;

const FILES = [
  ["src/app/[locale]/blog/[slug]/page.tsx", `import { routing } from "@/i18n/routing";`],
  ["src/app/[locale]/blog/tag/[slug]/page.tsx", `import { routing } from "@/i18n/routing";`],
  ["src/app/[locale]/blog/category/[slug]/page.tsx", `import { routing } from "@/i18n/routing";`],
  ["src/app/[locale]/projects/[slug]/page.tsx", `import { routing } from "@/i18n/routing";`],
  ["src/app/[locale]/services/page.tsx", `import { routing } from "@/i18n/routing";`],
];

for (const [f, imp] of FILES) {
  let s = readFileSync(f, "utf8");
  const nl = s.includes("\r\n") ? "\r\n" : "\n";
  if (!s.includes("generateStaticParams")) {
    if (!s.includes(`from "@/i18n/routing"`)) {
      s = s.replace(/(import [^\n]*\n)/, `$1import { routing } from "@/i18n/routing";\n`);
    }
    s = s.replace(imp, imp + "\n\n// Root locale param only (Stage 6: nonce CSP makes the layout dynamic;\n// slugs render on demand)." + "\n" + GSP);
    writeFileSync(f, s);
    console.log("locale gSP added:", f.split(/[\\/]/).slice(-3).join("/"));
  } else console.log("already:", f);
}
