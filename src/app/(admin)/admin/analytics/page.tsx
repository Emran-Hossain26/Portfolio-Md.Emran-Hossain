import { Suspense } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import {
  getDaily,
  getSummary,
  getTopPages,
  getCountries,
  getDevices,
  getReferrers,
  type DailyPoint,
} from "@/lib/analytics";
import { getCvDownloads } from "@/lib/cms";


const RANGES = [7, 30, 90] as const;

function Chart({ data }: { data: DailyPoint[] }) {
  const W = 720;
  const H = 180;
  const PAD = 4;
  const max = Math.max(1, ...data.map((d) => d.views));
  const n = Math.max(1, data.length);
  const bw = (W - PAD * 2) / n;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Daily views and visitors"
      style={{ width: "100%", height: "auto", display: "block" }}
    >
      {data.map((d, i) => {
        const vh = ((H - 24) - PAD) * (d.views / max);
        const vh2 = ((H - 24) - PAD) * (d.visitors / max);
        const x = PAD + i * bw;
        return (
          <g key={d.day}>
            <rect
              x={x + bw * 0.15}
              y={H - 20 - vh}
              width={Math.max(1, bw * 0.7)}
              height={Math.max(d.views > 0 ? 2 : 0, vh)}
              rx={2}
              fill="var(--acc, #4f63ff)"
              opacity={0.85}
            >
              <title>{`${d.day}: ${d.views} views / ${d.visitors} visitors`}</title>
            </rect>
            <rect
              x={x + bw * 0.3}
              y={H - 20 - vh2}
              width={Math.max(1, bw * 0.4)}
              height={Math.max(d.visitors > 0 ? 2 : 0, vh2)}
              rx={2}
              fill="var(--ok, #1f9d61)"
              opacity={0.9}
            >
              <title>{`${d.day}: ${d.views} views / ${d.visitors} visitors`}</title>
            </rect>
          </g>
        );
      })}
      <line x1={0} y1={H - 20} x2={W} y2={H - 20} stroke="var(--line, #e5e7eb)" strokeWidth={1} />
      <text x={0} y={H - 6} fontSize={10} fill="var(--mut2, #6b7280)">
        {data[0]?.day ?? ""}
      </text>
      <text x={W} y={H - 6} fontSize={10} fill="var(--mut2, #6b7280)" textAnchor="end">
        {data[data.length - 1]?.day ?? ""}
      </text>
    </svg>
  );
}

async function AnalyticsInner({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const sp = await searchParams;
  await requireAdmin();
  const range = RANGES.includes(Number(sp.range) as (typeof RANGES)[number])
    ? (Number(sp.range) as (typeof RANGES)[number])
    : 30;

  const [daily, summary, topPages, countries, devices, referrers, cvDownloads] =
    await Promise.all([
      getDaily(range),
      getSummary(range),
      getTopPages(),
      getCountries(),
      getDevices(),
      getReferrers(),
      getCvDownloads(),
    ]);

  const empty = !daily.some((d) => d.views > 0 || d.visitors > 0) && topPages.length === 0;

  return (
    <AdminShell heading="Analytics">
      <p style={{ color: "var(--mut2)", fontSize: 14, marginBottom: 14 }}>
        First-party, privacy-friendly: no raw IPs, DNT respected, country via
        Vercel geo. Data lands as visitors browse the public site.
      </p>

      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {RANGES.map((r) => (
          <Link key={r} href={`/admin/analytics?range=${r}`} className={"btn s" + (r === range ? " p" : "")}>
            {r}d
          </Link>
        ))}
      </div>

      {empty ? (
        <p className="note">
          No visitor data yet. Once the 20261110 migration has run and the
          public site receives visits, charts appear here automatically.
        </p>
      ) : null}

      <div className="g g4">
        <div className="c k">
          <small>Visitors · {range}d</small>
          <div className="n">{summary.visitors}</div>
          <small>unique sessions</small>
        </div>
        <div className="c k">
          <small>Page views · {range}d</small>
          <div className="n">{summary.views}</div>
          <small>tracked pages</small>
        </div>
        <div className="c k">
          <small>CV downloads</small>
          <div className="n">{cvDownloads}</div>
          <small>all time</small>
        </div>
        <div className="c k">
          <small>Avg views / visitor</small>
          <div className="n">
            {summary.visitors > 0 ? (summary.views / summary.visitors).toFixed(1) : "0"}
          </div>
          <small>{range}d window</small>
        </div>
      </div>

      <div className="c" style={{ marginTop: 14 }}>
        <h3>Daily views &amp; visitors — last {range} days</h3>
        <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--mut2)", marginBottom: 6 }}>
          <span><i style={{ display: "inline-block", width: 10, height: 10, background: "var(--acc, #4f63ff)", borderRadius: 2, marginRight: 4 }} />views</span>
          <span><i style={{ display: "inline-block", width: 10, height: 10, background: "var(--ok, #1f9d61)", borderRadius: 2, marginRight: 4 }} />visitors</span>
        </div>
        <Chart data={daily} />
      </div>

      <div className="g e2" style={{ marginTop: 14 }}>
        <div className="c">
          <h3>Top pages (all time)</h3>
          {topPages.length ? (
            <table>
              <thead>
                <tr><th>Page</th><th>Views</th><th>Visitors</th></tr>
              </thead>
              <tbody>
                {topPages.map((r) => (
                  <tr key={r.label}>
                    <td>{r.label}</td>
                    <td>{r.views ?? 0}</td>
                    <td>{r.visitors}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="note">No page data yet.</p>
          )}
        </div>
        <div className="c">
          <h3>Referrers (all time)</h3>
          {referrers.length ? (
            <table>
              <thead>
                <tr><th>Source</th><th>Visitors</th></tr>
              </thead>
              <tbody>
                {referrers.map((r) => (
                  <tr key={r.label}>
                    <td>{r.label}</td>
                    <td>{r.visitors}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="note">No referrer data yet.</p>
          )}
        </div>
        <div className="c">
          <h3>Countries (all time)</h3>
          {countries.length ? (
            <table>
              <thead>
                <tr><th>Country</th><th>Visitors</th></tr>
              </thead>
              <tbody>
                {countries.map((r) => (
                  <tr key={r.label}>
                    <td>{r.label}</td>
                    <td>{r.visitors}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="note">No country data yet (populates on Vercel).</p>
          )}
        </div>
        <div className="c">
          <h3>Devices (all time)</h3>
          {devices.length ? (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {devices.map((r) => (
                <span key={r.label} className="chip">
                  {r.label} · {r.visitors}
                </span>
              ))}
            </div>
          ) : (
            <p className="note">No device data yet.</p>
          )}
        </div>
      </div>
    </AdminShell>
  );
}

export default function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <AnalyticsInner searchParams={searchParams} />
    </Suspense>
  );
}
