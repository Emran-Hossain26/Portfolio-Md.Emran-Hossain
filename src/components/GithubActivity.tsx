"use client";

import { useEffect, useState } from "react";

type Event = { id: string; type: string; repo: string; date: string };

/**
 * Stage 6 #13 (optional) — recent public GitHub activity. Reads the public
 * API client-side (no token, no cookie, nothing stored); hides itself on
 * failure or when the profile has no public events.
 */
export function GithubActivity({ username }: { username: string }) {
  const [events, setEvents] = useState<Event[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=30`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((json: Array<{ id: string; type: string; repo: { name: string }; created_at: string }>) => {
        if (cancelled) return;
        const list = (json ?? [])
          .filter((e) => typeof e?.repo?.name === "string")
          .slice(0, 6)
          .map((e) => ({
            id: String(e.id),
            type: e.type.replace(/Event$/, ""),
            repo: e.repo.name,
            date: e.created_at,
          }));
        setEvents(list);
      })
      .catch(() => !cancelled && setEvents([]));
    return () => {
      cancelled = true;
    };
  }, [username]);

  if (!events?.length) return null;

  return (
    <div className="card" style={{ padding: 16 }}>
      <h3 style={{ margin: 0, fontSize: 16 }}>GitHub</h3>
      <div style={{ display: "grid", gap: 6, marginTop: 10 }}>
        {events.map((e) => (
          <div key={e.id} style={{ fontSize: 14, display: "flex", gap: 8, alignItems: "baseline" }}>
            <span className="chip" style={{ fontSize: 11 }}>{e.type}</span>
            <span style={{ color: "var(--mute)", wordBreak: "break-all" }}>{e.repo}</span>
            <span className="mute" style={{ fontSize: 12, marginLeft: "auto", whiteSpace: "nowrap" }}>
              {new Date(e.date).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
