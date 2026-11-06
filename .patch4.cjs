const fs = require("fs");

// AdminChrome: render sidebar directly (no wrapper div), pass open state.
let c = fs.readFileSync("src/components/admin/AdminChrome.tsx", "utf8");
const chromeOld = `        <AdminSidebar />`;
if (!c.includes(chromeOld)) throw new Error("chrome sidebar tag not found");
c = c.replace(chromeOld, `        <AdminSidebar open={open} />`);
// Remove the old wrapper div if it still exists (multi-line block).
c = c.replace(/\s*<div\n\s+className=\{\n\s*"fixed inset-y-0[^`]*?\/AdminSidebar open=\{open\} \/>\n\s+<\/div>/, "");
fs.writeFileSync("src/components/admin/AdminChrome.tsx", c);
console.log("chrome ok:", c.includes("<AdminSidebar open={open} />") && !c.includes("fixed inset-y-0 left-0 z-40 transition-transform"));

// AdminSidebar: own the responsive positioning classes.
let s = fs.readFileSync("src/components/admin/AdminSidebar.tsx", "utf8");
s = s.replace(
  "export function AdminSidebar() {",
  "export function AdminSidebar({ open }: { open?: boolean }) {",
);
const asideOld = `    <aside className="w-64 h-full bg-white border-r border-slate-200 flex flex-col justify-between shadow-sm z-10">`;
if (!s.includes(asideOld)) throw new Error("aside tag not found");
s = s.replace(
  asideOld,
  `    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col justify-between shadow-sm transition-transform duration-200",
        "md:static md:translate-x-0 md:z-10",
        open ? "translate-x-0" : "-translate-x-full",
      )}
    >`,
);
fs.writeFileSync("src/components/admin/AdminSidebar.tsx", s);
console.log("sidebar ok:", s.includes("md:static"));
