const { readFileSync, writeFileSync } = require("fs");
const f = "scripts/security-walk.mjs";
let s = readFileSync(f, "utf8");
if (s.includes("killPort")) {
  console.log("already");
} else {
  const marker =
    'const server = spawn(process.execPath, [nextBin, "start", "-p", String(PORT)], { cwd: ROOT, stdio: "pipe" });';
  const killLines = [
    "// Kill any stale listener on the test port (a zombie server would serve",
    "// a stale build and falsify the walk).",
    "try {",
    '  const { execSync } = await import("node:child_process");',
    '  const out = execSync("netstat -ano | findstr :" + PORT + " | findstr LISTENING", { shell: "cmd.exe" }).toString();',
    '  const pids = [...new Set(out.split(/\\r?\\n/).map((l) => l.trim().split(/\\s+/).pop()).filter(Boolean))];',
    "  for (const pid of pids) {",
    '    try { execSync("taskkill /PID " + pid + " /F", { shell: "cmd.exe" }); } catch {}',
    "  }",
    "  await new Promise((res) => setTimeout(res, 500));",
    "} catch {}",
    "",
  ];
  s = s.replace(marker, killLines.join("\n") + marker);
  writeFileSync(f, s);
  console.log("walk hardened");
}
