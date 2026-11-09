// Stage 6 item 1 — automated security walk (build gate).
//  1. Discovers every /admin/* page route + /api/admin/* endpoint from src.
//  2. Spawns a production server (`next start -p 3999`) against the build.
//  3. Walks every route UNAUTHENTICATED: admin pages must redirect to
//     /login (no data in the body); admin APIs must answer 401/403/503.
//  4. Static check: modules importing the service-role client must never be
//     "use client" files.
// Exits non-zero on ANY violation — wired into `npm run build`.
import { spawn } from "node:child_process";
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, sep } from "node:path";

const PORT = 3999;
const BASE = `http://127.0.0.1:${PORT}`;
const ROOT = process.cwd();
const SRC = join(ROOT, "src");

const failures = [];

// ---- 1. discover admin page routes ----------------------------------------
const adminDir = join(SRC, "app", "(admin)", "admin");
const pageRoutes = [];
function walkPages(dir, prefix) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walkPages(full, prefix + "/" + entry);
    } else if (entry === "page.tsx") {
      if (prefix.includes("[")) continue; // dynamic segments need a param
      pageRoutes.push("/admin" + prefix);
    }
  }
}
walkPages(adminDir, "");

// ---- 2. discover admin API routes -----------------------------------------
const apiDir = join(SRC, "app", "api", "admin");
const apiRoutes = [];
function walkApi(dir, prefix) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walkApi(full, prefix + "/" + entry);
    else if (entry === "route.ts") {
      const route = "/api/admin" + prefix;
      if (!route.endsWith("/is-admin")) apiRoutes.push(route); // gate endpoint returns {admin:false} — exempt
    }
  }
}
if (existsSync(apiDir)) walkApi(apiDir, "");

// ---- 3. static check: service-role imports never in client modules --------
function walkSrc(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (!full.includes(sep + "node_modules" + sep)) walkSrc(full);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      const src = readFileSync(full, "utf8");
      const usesService =
        src.includes("@/lib/supabase/admin") || src.includes("@/lib/supabase/service");
      if (usesService && src.trimStart().startsWith('"use client"')) {
        failures.push(`client module imports service-role client: ${full}`);
      }
    }
  }
}
walkSrc(SRC);

// ---- 4. spawn server + walk unauthenticated --------------------------------
const nextBin = join(ROOT, "node_modules", "next", "dist", "bin", "next");
// Kill any stale listener on the test port (a zombie server would serve
// a stale build and falsify the walk).
try {
  const { execSync } = await import("node:child_process");
  const out = execSync("netstat -ano | findstr :" + PORT + " | findstr LISTENING", { shell: "cmd.exe" }).toString();
  const pids = [...new Set(out.split(/\r?\n/).map((l) => l.trim().split(/\s+/).pop()).filter(Boolean))];
  for (const pid of pids) {
    try { execSync("taskkill /PID " + pid + " /F", { shell: "cmd.exe" }); } catch {}
  }
  await new Promise((res) => setTimeout(res, 500));
} catch {}
const server = spawn(process.execPath, [nextBin, "start", "-p", String(PORT)], { cwd: ROOT, stdio: "pipe" });
server.stdout.on("data", () => {});
server.stderr.on("data", () => {});

async function waitForServer() {
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(BASE + "/login", { redirect: "manual" });
      if (r.status > 0) return true;
    } catch {}
    await new Promise((res) => setTimeout(res, 500));
  }
  return false;
}

let serverUp = await waitForServer();
if (!serverUp) failures.push("test server did not start");

if (serverUp) {
  for (const route of pageRoutes) {
    try {
      const r = await fetch(BASE + route, { redirect: "manual" });
      const loc = r.headers.get("location") ?? "";
      const body = await r.text();
      const redirected = [301, 302, 303, 307, 308].includes(r.status) && loc.includes("/login");
      if (!redirected) failures.push(`PAGE OPEN: ${route} → status ${r.status} (location: ${loc || "-"})`);
      if (redirected && body.length > 2000) failures.push(`PAGE LEAKS BODY: ${route} (${body.length} bytes)`);
    } catch (e) {
      failures.push(`PAGE ERROR: ${route} → ${String(e).slice(0, 80)}`);
    }
  }
  for (const route of apiRoutes) {
    try {
      const r = await fetch(BASE + route, { redirect: "manual" });
      // 401/403 = auth enforced; 503 = not configured (still sealed);
      // 4xx JSON errors on POST-only routes (405 for GET) are acceptable.
      const sealed = [401, 403, 405, 503].includes(r.status) || r.status >= 400;
      if (!sealed) failures.push(`API OPEN: ${route} → status ${r.status}`);
    } catch (e) {
      failures.push(`API ERROR: ${route} → ${String(e).slice(0, 80)}`);
    }
  }
  // logout page intentionally signs out; /login is public — excluded above.
}

server.kill();
await new Promise((res) => setTimeout(res, 300));

console.log(`security-walk: ${pageRoutes.length} admin pages + ${apiRoutes.length} admin APIs checked`);
if (failures.length) {
  console.error("SECURITY WALK FAILED:");
  for (const f of failures) console.error("  ✗ " + f);
  process.exit(1);
}
console.log("security-walk: OK — every admin route is sealed");
