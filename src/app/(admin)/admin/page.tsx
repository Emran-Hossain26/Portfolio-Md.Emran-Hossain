import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import {
  getBlogPosts, getCvPath, getMessagesInbox, getTestimonials,
  getCvDownloads, getModuleSettings,
} from "@/lib/cms";
import { getSummary } from "@/lib/analytics";
import {
  IconBriefcase, IconFeather, IconAlert, IconHeading,
  IconPlus, IconStar, IconEye,
} from "@/components/admin/icons";

/** Overview (advanced mockup + Stage 7): live KPIs, needs-attention, quick actions. */
export default async function AdminDashboard() {
  const user = await requireAdmin();
  const [posts, cv, msgs, reviews, cvDownloads, visitors, modules] =
    await Promise.all([
      getBlogPosts(), getCvPath(), getMessagesInbox(), getTestimonials(),
      getCvDownloads(), getSummary(30), getModuleSettings(),
    ]);
  const published = posts.filter((p) => p.status === "published").length;
  const drafts = posts.filter((p) => p.status === "draft").length;
  const newMsgs = msgs.filter((m) => m.status === "new").length;
  const liveReviews = reviews.length;
  const conversion = visitors.visitors > 0
    ? ((newMsgs / visitors.visitors) * 100).toFixed(1) + "%"
    : "—";

  const stats = [
    { label: "Visitors · 30d", value: String(visitors.visitors), icon: IconEye, href: "/admin/analytics", hint: visitors.views + " page views" },
    { label: "New messages", value: String(newMsgs), icon: IconAlert, href: "/admin/inbox", hint: "Conversion " + conversion },
    { label: "CV downloads", value: String(cvDownloads), icon: IconBriefcase, href: "/admin/cv", hint: cv ? "Live on the hero." : "Upload a CV to enable." },
    { label: "Draft posts", value: String(drafts), icon: IconFeather, href: "/admin/blog", hint: published + " published" },
  ];

  const attention = [
    { label: liveReviews + " testimonial" + (liveReviews === 1 ? "" : "s") + " live", hint: "Moderate", href: "/admin/testimonials" },
    { label: newMsgs + " new message" + (newMsgs === 1 ? "" : "s"), hint: "Inbox", href: "/admin/inbox" },
    { label: "SEO audit", hint: "Run the full check", href: "/admin/seo-health" },
  ];

  const actions = [
    { href: "/admin/hero", label: "Edit hero", icon: IconHeading },
    { href: "/admin/projects", label: "Add project", icon: IconPlus },
    { href: "/admin/blog", label: "Write a blog", icon: IconFeather },
    { href: "/admin/testimonials", label: "Moderate reviews", icon: IconStar },
  ];

  return (
    <>
      <div className="hd">
        <div>
          <h2>Good day, Admin</h2>
          <p>
            Signed in as {user.email}. Everything you edit here publishes to
            the site immediately.
          </p>
        </div>
        <Link className="btn" href="/admin/analytics">Full analytics →</Link>
      </div>

      <div className="g g4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="c k"
            style={{ textDecoration: "none" }}
          >
            <small>{s.label}</small>
            <div className="n">{s.value}</div>
            {s.hint ? <small>{s.hint}</small> : null}
          </Link>
        ))}
      </div>

      <div className="g g2" style={{ marginTop: 14 }}>
        <div className="c">
          <h3>Needs attention</h3>
          {attention.map((a) => (
            <div className="row" key={a.href + a.label}>
              <div className="gr">
                {a.label}
                <small>{a.hint}</small>
              </div>
              <Link className="btn s" href={a.href}>Open</Link>
            </div>
          ))}
        </div>
        <div className="c">
          <h3>Quick actions</h3>
          {actions.map((a) => (
            <div className="row" key={a.href}>
              <div className="gr">{a.label}</div>
              <Link className="btn s" href={a.href}>
                <a.icon size={14} /> Go
              </Link>
            </div>
          ))}
        </div>
      </div>

      <div className="note">
        KPIs are live from first-party analytics (no cookies, DNT respected).
        Conversion = new messages ÷ visitors over 30 days.
        {modules.palette ? "" : " Command palette is off in Extras."}
      </div>
    </>
  );
}
