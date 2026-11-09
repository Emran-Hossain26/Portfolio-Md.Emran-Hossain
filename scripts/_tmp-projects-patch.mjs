import { readFileSync, writeFileSync } from "node:fs";

const f = "src/lib/cms.ts";
let s = readFileSync(f, "utf8");
const nl = s.includes("\r\n") ? "\r\n" : "\n";
const j = (t) => t.split("\n").join(nl);

// getProjects: retry without the Stage 6 columns when they don't exist yet
// (pre-migration), so the real DB showcase (slides/video/demo) never falls
// back to seeds.
const oldProjects = j(`    const { data, error } = await db()
      .from("projects")
      .select(
        "slug,title_en,title_bn,problem_en,problem_bn,solution_en,solution_bn,result_en,result_bn,metrics,tech,media,video,demo_url,slides,sort_order",
      )
      .eq("published", true)
      .order("sort_order");
    if (error || !data?.length) {
      return (await import("@/data/projects")).seedProjects;
    }`);
const newProjects = j(`    // result_en/result_bn/metrics arrive with migration 20261113 — retry
    // without them pre-migration so the real showcase never falls back to seeds.
    const P_SELECT = "slug,title_en,title_bn,problem_en,problem_bn,solution_en,solution_bn,tech,media,video,demo_url,slides,sort_order";
    const P_SELECT_FULL = P_SELECT.replace("tech,", "result_en,result_bn,metrics,tech,");
    const fetchProjects = async (select: string) => {
      const { data, error } = await db()
        .from("projects")
        .select(select)
        .eq("published", true)
        .order("sort_order");
      return error ? null : data;
    };
    let data = await fetchProjects(P_SELECT_FULL);
    if (!data) data = await fetchProjects(P_SELECT);
    if (!data?.length) {
      return (await import("@/data/projects")).seedProjects;
    }`);
if (s.includes(oldProjects)) {
  s = s.replace(oldProjects, newProjects);
  console.log("projects retry added");
} else console.log("PROJECTS MISS");

// getServices: same retry for price
const oldSvc = j(`    const { data, error } = await db().from("services").select("id,title_en,title_bn,desc_en,desc_bn,icon,price,sort_order").eq("published", true).is("deleted_at", null).order("sort_order");
    if (error || !data?.length) {`);
const newSvc = j(`    // price arrives with migration 20261113 — retry without it pre-migration.
    const fetchServices = async (select: string) => {
      const { data, error } = await db().from("services").select(select).eq("published", true).is("deleted_at", null).order("sort_order");
      return error ? null : data;
    };
    let data = (await fetchServices("id,title_en,title_bn,desc_en,desc_bn,icon,price,sort_order"))
      ?? (await fetchServices("id,title_en,title_bn,desc_en,desc_bn,icon,sort_order"));
    if (!data?.length) {`);
if (s.includes(oldSvc)) {
  s = s.replace(oldSvc, newSvc);
  console.log("services retry added");
} else console.log("SERVICES MISS");

writeFileSync(f, s);
