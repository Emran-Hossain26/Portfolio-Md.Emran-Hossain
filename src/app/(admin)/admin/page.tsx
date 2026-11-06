import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { getProjects, getBlogPosts, getCvPath } from "@/lib/cms";
import {
  IconBriefcase, IconFeather, IconPulse, IconAlert,
  IconHeading, IconPlus, IconFeather as IconWrite, IconLayers,
} from "@/components/admin/icons";

/** Dashboard Overview (approved mockup): welcome, 4 stat cards, quick actions. */
export default async function AdminDashboard() {
  const user = await requireAdmin();
  const [projects, posts, cv] = await Promise.all([
    getProjects(),
    getBlogPosts(),
    getCvPath(),
  ]);
  const published = posts.filter((p) => p.status === "published").length;

  const cards = [
    {
      label: "Total Projects", value: String(projects.length),
      icon: <IconBriefcase className="w-5 h-5" />, tone: "bg-blue-50 text-blue-600",
    },
    {
      label: "Published Blogs", value: String(published),
      icon: <IconFeather className="w-5 h-5" />, tone: "bg-purple-50 text-purple-600",
    },
    {
      label: "SEO Health", value: "Audit",
      icon: <IconPulse className="w-5 h-5" />, tone: "bg-emerald-50 text-emerald-600",
      href: "/admin/seo-health", hint: "Run the full check",
    },
    {
      label: "CV File", value: cv ? "Uploaded" : "Not uploaded",
      icon: cv ? <IconBriefcase className="w-5 h-5" /> : <IconAlert className="w-5 h-5" />,
      tone: cv ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500",
      href: "/admin/cv", hint: cv ? "Live on the hero." : "The hero's CV button stays disabled.",
      warn: !cv,
    },
  ];

  const actions = [
    { href: "/admin/texts", label: "Edit Hero Text", icon: <IconHeading className="w-4 h-4" /> },
    { href: "/admin/projects", label: "Add New Project", icon: <IconPlus className="w-4 h-4" /> },
    { href: "/admin/blog", label: "Write a Blog", icon: <IconWrite className="w-4 h-4" /> },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Dashboard Overview</h2>
        <p className="text-slate-500 mt-1">
          Welcome back, {user.email}! Everything you edit here publishes to the
          site immediately (cache is flushed on save).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href ?? "#"}
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow block"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-500">{c.label}</h3>
              <div className={"w-10 h-10 rounded-lg flex items-center justify-center " + c.tone}>
                {c.icon}
              </div>
            </div>
            <p className={"text-2xl font-bold " + (c.warn ? "text-red-500 text-base" : "text-slate-800")}>
              {c.value}
            </p>
            {c.hint ? <p className="text-xs text-slate-400 mt-1">{c.hint}</p> : null}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Quick actions
        </h3>
        <div className="flex flex-wrap gap-3">
          {actions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all duration-200"
            >
              {a.icon} {a.label}
            </Link>
          ))}
        </div>
        <p className="text-slate-400 text-xs mt-6 flex items-center gap-2">
          <IconLayers className="w-4 h-4" /> Pick a section from the sidebar —
          its forms and tables open right here.
        </p>
      </div>
    </div>
  );
}
