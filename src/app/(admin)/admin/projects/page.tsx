import { requireAdmin } from "@/lib/supabase/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { RowForm, type AdminField } from "@/components/admin/RowForm";
import { SlidesEditor, type Slide } from "@/components/admin/SlidesEditor";
import { adminConfigured, createServiceClient } from "@/lib/supabase/service";
import { seedProjects } from "@/data/projects";

type Row = Record<string, unknown> & { id: string };

const SPEC: Omit<AdminField, "value">[] = [
  { name: "slug", label: "Slug (URL part, e.g. likhon-tools)", type: "text" },
  { name: "title_en", label: "Title (EN)", type: "text" },
  { name: "title_bn", label: "Title (BN)", type: "text" },
  { name: "problem_en", label: "Problem (EN)", type: "textarea" },
  { name: "problem_bn", label: "Problem (BN)", type: "textarea" },
  { name: "solution_en", label: "Solution (EN)", type: "textarea" },
  { name: "solution_bn", label: "Solution (BN)", type: "textarea" },
  {
    name: "media",
    label: "Media area",
    type: "radio",
    options: [
      { value: "slides", label: "Slides (module screenshots)" },
      { value: "video", label: "Promo video" },
      { value: "none", label: "None (hide media)" },
    ],
  },
  { name: "video", label: "Promo video URL (YouTube/Vimeo/MP4 — used only in Video mode)", type: "text" },
  { name: "demo_url", label: "Live demo URL (optional — button only when set)", type: "text" },
  { name: "tech", label: "Tech tags (comma-separated)", type: "text" },
  { name: "published", label: "Published", type: "check" },
  { name: "sort_order", label: "Sort order (1, 2, 3… lower first)", type: "number" },
];

/** RowForm fields whose value is a string[] stored comma-separated. */
const ARRAY_FIELDS = new Set(["tech"]);

/** [cols...] beyond the baseline (absent until the upgrade SQL, kept for safety). */
const EXTRA_COLS =
  "problem_en,problem_bn,solution_en,solution_bn,tech,media,video,demo_url,slides";
const BASE_COLS = "id,slug,title_en,title_bn,published,sort_order";

export default async function AdminProjectsPage() {
  await requireAdmin();

  let rows: Row[];
  if (adminConfigured()) {
    const client = createServiceClient();
    // The full editor needs the upgrade SQL; until it runs, fall back to the
    // baseline editor so the page never breaks.
    let data: Record<string, unknown>[] | null;
    ({ data } = await client
      .from("projects")
      .select(`${BASE_COLS},${EXTRA_COLS}`)
      .order("sort_order"));
    if (!data) {
      ({ data } = await client.from("projects").select(BASE_COLS).order("sort_order"));
    }
    rows = (data ?? []) as Row[];
  } else {
    rows = seedProjects.map((p, i) => ({
      id: `seed-${i}`,
      slug: p.slug,
      title_en: p.title.en,
      title_bn: p.title.bn,
      problem_en: p.problem?.en ?? "",
      problem_bn: p.problem?.bn ?? "",
      solution_en: p.solution?.en ?? "",
      solution_bn: p.solution?.bn ?? "",
      tech: p.tech,
      media: p.media ?? "slides",
      video: p.video ?? "",
      demo_url: p.demo_url ?? "",
      slides: p.slides ?? [],
      published: true,
      sort_order: i + 1,
    }));
  }

  const blank: Record<string, unknown> = {
    id: "__new",
    slug: "",
    title_en: "",
    title_bn: "",
    problem_en: "",
    problem_bn: "",
    solution_en: "",
    solution_bn: "",
    media: "slides",
    video: "",
    demo_url: "",
    tech: [],
    slides: [],
    published: true,
    sort_order: rows.length + 1,
  };

  const toFields = (row: Row) =>
    SPEC.map((field) => ({
      ...field,
      value: ARRAY_FIELDS.has(field.name)
        ? Array.isArray(row[field.name])
          ? (row[field.name] as string[]).join(", ")
          : String(row[field.name] ?? "")
        : (row[field.name] ?? (field.type === "check" ? false : field.type === "number" ? 0 : "")) as string | number | boolean,
    }));

  const asSlides = (v: unknown): Slide[] =>
    Array.isArray(v) ? (v as Slide[]).filter((s) => s && typeof s.src === "string") : [];

  return (
    <AdminShell current="/admin/projects" heading="Projects">
      <p className="admin-note">
        Tags and slide captions — EN/BN lists stay independent; BN falls back to
        EN on the site. “Media area” switches per project between screenshot
        slides, a promo video (fill the video URL only in Video mode), or
        nothing. Only published projects are public.
      </p>
      {rows.map((row) => (
        <RowForm
          key={row.id}
          table="projects"
          id={row.id}
          fields={toFields(row)}
        >
          {typeof row.slug === "string" && row.slug !== "" && (
            <SlidesEditor
              initial={asSlides(row.slides)}
              slug={row.slug}
            />
          )}
        </RowForm>
      ))}
      <h2 style={{ fontSize: 20, marginTop: 28 }}>Add project</h2>
      <RowForm table="projects" id="__new" fields={toFields(blank as Row)} />
    </AdminShell>
  );
}
