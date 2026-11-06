import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import {
  getProjects, getBlogPosts, getCvPath, getMessagesInbox, getTestimonials,
} from "@/lib/cms";
import {
  IconBriefcase, IconFeather, IconAlert, IconHeading,
  IconPlus, IconStar, IconEye,
} from "@/components/admin/icons";

/** Overview (advanced mockup): stats, needs-attention, quick actions. */
export default async function AdminDashboard() {
  const user = await requireAdmin();
  const [projects, posts, cv, msgs, reviews] = await Promise.all([
    getProjects(), getBlogPosts(), getCvPath(), getMessagesInbox(), getTestimonials(),
  ]);
  const published = posts.filter((p) => p.status === "published").length;
  const newMsgs = msgs.filter((m) => m.status === "new").length;
  const pendingReviews = reviews.filter((r) => r.status === "pending").length;

  const stats = [
    { label: "Projects", value: String(projects.length), icon: IconBriefcase, href: "/admin/projects" },
    { label: "Published blogs", value: String(published), icon: IconFeather, href: "/admin/blog" },
    { label: "New messages", value: String(newMsgs), icon: IconEye, href: "/admin/inbox" },
    { label: "CV file", value: cv ? "Uploaded" : "Not uploaded", icon: IconAlert, href: "/admin/cv", warn: !cv, hint: cv ? "Live on the hero." : "The hero's CV button stays disabled." },
  ];

  const attention = [
    { label: pendingReviews + " review" + (pendingReviews === 1 ? "" : "s") + " waiting", hint: "Approve or hide", href: "/admin/testimonials" },
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
      <div className="av2-hd">
        <div>
          <h2>Good day, Admin</h2>
          <p>
            Signed in as {user.email}. Everything you edit here publishes to
            the site immediately.
          </p>
        </div>
      </div>

      <div className="av2-g av2-g4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="av2-c av2-k"
            style={{ textDecoration: "none" }}
          >
            <small>{s.label}</small>
            <div className="n" style={{ color: s.warn ? "var(--bad2)" : undefined }}>
              {s.value}
            </div>
            {s.hint ? <small>{s.hint}</small> : null}
          </Link>
        ))}
      </div>

      <div className="av2-g av2-g2" style={{ marginTop: 14 }}>
        <div className="av2-c">
          <h3>Needs attention</h3>
          {attention.map((a) => (
            <div className="av2-row" key={a.href + a.label}>
              <div className="gr">
                {a.label}
                <small>{a.hint}</small>
              </div>
              <Link className="av2-btn s" href={a.href}>Open</Link>
            </div>
          ))}
        </div>
        <div className="av2-c">
          <h3>Quick actions</h3>
          {actions.map((a) => (
            <div className="av2-row" key={a.href}>
              <div className="gr">{a.label}</div>
              <Link className="av2-btn s" href={a.href}>
                <a.icon size={14} /> Go
              </Link>
            </div>
          ))}
        </div>
      </div>

      <div className="av2-note">
        Visitor analytics (chart, top pages) connect after the Vercel deploy
        with Google Analytics. Everything else on this page is live data.
      </div>
    </>
  );
}
