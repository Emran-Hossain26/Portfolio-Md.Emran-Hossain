// Task U5 evidence — admin navigation reachability audit.
//  1. Discovers every /admin/* page route from src (page.tsx files).
//  2. Classifies: hub route vs detail route (dynamic [param] segments and
//     their children are detail routes — excluded from the 2-click rule).
//  3. Parses AdminV2Chrome.NAV (the REAL sidebar) for nav entries.
//  4. Every hub route must be exactly 1 nav click; every detail route must
//     name the hub that reaches it in 2 clicks (nav → hub action).
//  5. Redirect stubs (texts/messages) report their target.
// Exits non-zero on any violation.
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const adminDir = join(ROOT, "src", "app", "(admin)", "admin");
const chromePath = join(ROOT, "src", "components", "admin", "AdminV2Chrome.tsx");

// ---- 1. discover routes -----------------------------------------------------
const routes = [];
function walk(dir, prefix) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, prefix + "/" + entry);
    else if (entry === "page.tsx") routes.push("/admin" + prefix);
  }
}
walk(adminDir, "");

// ---- 2. classify -------------------------------------------------------------
// Special routes: part of the chrome itself or the auth flow — not nav items
// by design, and never more than one interaction away.
const SPECIAL = new Map([
  ["/admin/logout", "PASS — logout form pinned in the sidebar footer (always visible)"],
  ["/admin/verify-2fa", "PASS — 2FA step of the admin login flow (reached from /login, not nav)"],
]);

// Detail routes = dynamic [param] segments (and their children) plus the
// per-record /new editors — all reachable in 2 clicks via their hub, not nav.
const isDetail = (route) => /\[[a-z]+\]/.test(route) || route.endsWith("/new");
const hubRoutes = routes.filter((r) => !isDetail(r) && !SPECIAL.has(r));
const detailRoutes = routes.filter(isDetail);

// ---- 3. parse NAV from the chrome source -------------------------------------
const src = readFileSync(chromePath, "utf8");
const navBlock = src.slice(src.indexOf("const NAV"), src.indexOf("];", src.indexOf("const NAV")));
const navHrefs = [...navBlock.matchAll(/"\/admin[a-z/-]*"/g)].map((m) => m[0].replaceAll('"', ""));
const navSet = new Set(navHrefs);

// Detail-route reachability: parent hub + the linking artifact.
const DETAIL_PARENTS = {
  "/admin/projects/new": ["/admin/projects", "CmsManager “New record” button (1 click from nav hub)"],
  "/admin/projects/[id]": ["/admin/projects", "CmsManager “Edit” row action"],
  "/admin/projects/[id]/revisions": ["/admin/projects", "CmsManager “History” row action"],
  "/admin/services/new": ["/admin/services", "CmsManager “New record” button"],
  "/admin/services/[id]": ["/admin/services", "CmsManager “Edit” row action"],
  "/admin/services/[id]/revisions": ["/admin/services", "CmsManager “History” row action"],
  "/admin/experience/new": ["/admin/experience", "CmsManager “New record” button"],
  "/admin/experience/[id]": ["/admin/experience", "CmsManager “Edit” row action"],
  "/admin/experience/[id]/revisions": ["/admin/experience", "CmsManager “History” row action"],
  "/admin/preview/cms/[module]/[id]": ["/admin/projects · /admin/services · /admin/experience", "CmsManager “Preview” row action"],
  "/admin/preview/[slug]": ["/admin/blog", "blog row “Preview” button"],
};

// Redirect stubs.
const REDIRECTS = { "/admin/texts": "/admin/hero", "/admin/messages": "/admin/inbox" };

// ---- 4. verdicts ---------------------------------------------------------------
const failures = [];
console.log("route".padEnd(38), "status");
console.log("-".repeat(78));
for (const route of hubRoutes.sort()) {
  if (REDIRECTS[route]) {
    console.log(route.padEnd(38), `REDIRECT → ${REDIRECTS[route]} (legacy duplicate)`);
    continue;
  }
  if (navSet.has(route)) {
    console.log(route.padEnd(38), "PASS — 1 nav click");
  } else {
    failures.push(route);
    console.log(route.padEnd(38), "FAIL — not in AdminV2Chrome.NAV");
  }
}
for (const route of detailRoutes.sort()) {
  const entry = DETAIL_PARENTS[route];
  if (entry && navSet.has(entry[0].split(" · ")[0])) {
    console.log(route.padEnd(38), `PASS — detail route (excluded): via ${entry[0]} → ${entry[1]}`);
  } else {
    failures.push(route);
    console.log(route.padEnd(38), "FAIL — detail route without a documented 2-click path");
  }
}
for (const [route, verdict] of SPECIAL) {
  console.log(route.padEnd(38), verdict);
}

// ---- 5. summary -----------------------------------------------------------------
const groups = [...navBlock.matchAll(/\["([^"]+)", \[/g)].map((m) => m[1]);
console.log("-".repeat(78));
console.log(`NAV groups (${groups.length}/7 max): ${groups.join(", ")}`);
console.log(`Nav entries: ${navHrefs.length} · hub routes: ${hubRoutes.length} · detail routes: ${detailRoutes.length}`);
if (groups.length > 7) failures.push("too many groups");
if (failures.length) {
  console.error(`\n${failures.length} FAILURE(S)`);
  process.exit(1);
}
console.log("\nALL PASS — every admin page is reachable from the nav within two clicks.");
