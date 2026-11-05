// Stage 5.1 login-safety guard: fails (exit 1) if any effect component or
// fx module is imported into the login/admin route groups or admin shell.
// Run: node scripts/guard-effects.mjs
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["src/app/(admin)", "src/components/admin"];
const PATTERNS = [
  "@/components/fx/",
  "@/components/EffectsButton",
  "@/lib/fx/",
  "components/AdminPreview",
  "components/Reveal",
  "components/ScrollProgress",
  "components/CursorTrail",
];

let bad = 0;
function walk(dir) {
  let entries;
  try { entries = readdirSync(dir); } catch { return; }
  for (const name of entries) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.(tsx?|css)$/.test(name)) {
      const text = readFileSync(p, "utf8");
      for (const pat of PATTERNS) {
        if (text.includes(pat)) {
          console.error(`FAIL: ${p} references effect code "${pat}"`);
          bad += 1;
        }
      }
    }
  }
}
for (const root of ROOTS) walk(root);

if (bad > 0) {
  console.error(`guard-effects: ${bad} violation(s)`);
  process.exit(1);
}
console.log("guard-effects: OK — no effect code is imported into /admin or /login routes");
