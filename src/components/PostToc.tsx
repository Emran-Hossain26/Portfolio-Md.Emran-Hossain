"use client";

import { useEffect, useState } from "react";

type Item = { id: string; text: string; level: number };

/** "On this page" list that highlights the section currently being read. */
export function PostToc({ items, label }: { items: Item[]; label: string }) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const els = items
      .map((i) => document.getElementById(i.id))
      .filter((e): e is HTMLElement => !!e);
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -65% 0px" },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [items]);

  return (
    <div role="navigation" aria-label={label} className="post-toc">
      <b className="post-side-title">{label}</b>
      <ul>
        {items.map((h) => (
          <li key={h.id} style={{ paddingLeft: h.level === 3 ? 14 : 0 }}>
            <a href={`#${h.id}`} className={active === h.id ? "on" : undefined} aria-current={active === h.id ? "true" : undefined}>
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
