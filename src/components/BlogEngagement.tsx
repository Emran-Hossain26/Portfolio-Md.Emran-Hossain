"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  submitCommentAction,
  toggleLikeAction,
  type CommentResult,
} from "@/lib/actions/blog-social";
import { TurnstileWidget } from "@/components/TurnstileWidget";

type C = {
  id: string;
  parent_id: string | null;
  name: string;
  body: string;
  created_at: string;
  likes: number;
  liked: boolean;
};
type Data = { likes: number; liked: boolean; comments: C[] };

const T = {
  en: {
    like: "Like", liked: "Liked", comments: "Comments", none: "No comments yet. Be the first to comment.",
    leave: "Leave a comment", reply: "Reply", cancel: "Cancel", name: "Your name", comment: "Your comment",
    replyTo: "Write a reply", send: "Post comment", sending: "Sending…",
    thanks: "Thank you! Your comment will appear after approval.",
    validation: "Please enter your name and a comment (links are limited to 2).",
    rate_limited: "Too many comments. Please try again later.",
    turnstile: "Spam check failed. Please try again.",
    unavailable: "Comments are not available right now.",
    not_found: "This post or comment is no longer available.",
    heartLabel: "like", limit: "No email needed. Comments are moderated.",
  },
  bn: {
    like: "লাইক", liked: "লাইক করেছেন", comments: "মন্তব্য", none: "এখনো কোনো মন্তব্য নেই। প্রথম মন্তব্যটি আপনিই করুন।",
    leave: "মন্তব্য করুন", reply: "উত্তর দিন", cancel: "বাতিল", name: "আপনার নাম", comment: "আপনার মন্তব্য",
    replyTo: "উত্তর লিখুন", send: "মন্তব্য পাঠান", sending: "পাঠানো হচ্ছে…",
    thanks: "ধন্যবাদ! অনুমোদনের পর আপনার মন্তব্য দেখা যাবে।",
    validation: "অনুগ্রহ করে নাম ও মন্তব্য লিখুন (লিংক সর্বোচ্চ ২টি)।",
    rate_limited: "অনেক বেশি মন্তব্য হয়েছে। পরে আবার চেষ্টা করুন।",
    turnstile: "স্প্যাম যাচাই ব্যর্থ হয়েছে। আবার চেষ্টা করুন।",
    unavailable: "এই মুহূর্তে মন্তব্য করা যাচ্ছে না।",
    not_found: "এই পোস্ট বা মন্তব্যটি আর পাওয়া যাচ্ছে না।",
    heartLabel: "লাইক", limit: "ইমেইল লাগবে না। মন্তব্য যাচাই করে প্রকাশ করা হয়।",
  },
} as const;

const initial: CommentResult = { ok: false };

function LikeButton({
  target, count, liked, onChange, label, activeLabel, small,
}: {
  target: string; count: number; liked: boolean;
  onChange: (liked: boolean, count: number) => void;
  label: string; activeLabel: string; small?: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="btn"
      disabled={pending}
      aria-pressed={liked}
      aria-label={`${liked ? activeLabel : label} (${count})`}
      onClick={() => {
        // Optimistic update, corrected by the server's answer.
        const nextLiked = !liked;
        onChange(nextLiked, Math.max(0, count + (nextLiked ? 1 : -1)));
        start(async () => {
          const r = await toggleLikeAction(target);
          if (r.ok && typeof r.liked === "boolean") onChange(r.liked, r.count ?? 0);
          else onChange(liked, count);
        });
      }}
      style={{
        padding: small ? "2px 10px" : undefined,
        fontSize: small ? 13 : undefined,
        borderColor: liked ? "var(--accent)" : undefined,
        color: liked ? "var(--accent)" : undefined,
      }}
    >
      <span aria-hidden="true">{liked ? "♥" : "♡"}</span> {liked ? activeLabel : label} · {count}
    </button>
  );
}

function CommentForm({
  slug, parentId, locale, onDone,
}: { slug: string; parentId?: string; locale: "en" | "bn"; onDone?: () => void }) {
  const t = T[locale];
  const [state, action, pending] = useActionState(submitCommentAction, initial);
  const [t0] = useState(() => Date.now());
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  if (state.ok) {
    return (
      <div className="card" role="status" style={{ padding: 14 }}>
        <p style={{ margin: 0 }}>{t.thanks}</p>
        {onDone ? (
          <button type="button" className="btn" style={{ marginTop: 10 }} onClick={onDone}>
            OK
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <form ref={formRef} action={action} style={{ display: "grid", gap: 10 }}>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="parent_id" value={parentId ?? ""} />
      <input type="hidden" name="t" value={t0} />
      <label>
        {t.name}
        <input name="name" required maxLength={80} autoComplete="nickname" />
      </label>
      <label>
        {parentId ? t.replyTo : t.comment}
        <textarea name="body" required minLength={2} maxLength={2000} rows={parentId ? 3 : 4} />
      </label>
      <TurnstileWidget />
      <input
        type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
      />
      {state.error ? <p role="alert" style={{ color: "var(--bad)", margin: 0, fontSize: 14 }}>{t[state.error]}</p> : null}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button className="btn" type="submit" disabled={pending}>{pending ? t.sending : t.send}</button>
        {onDone ? <button className="btn" type="button" onClick={onDone}>{t.cancel}</button> : null}
        <span className="mute" style={{ fontSize: 13 }}>{t.limit}</span>
      </div>
    </form>
  );
}

function CommentItem({
  c, replies, slug, locale, setLike,
}: {
  c: C; replies: C[]; slug: string; locale: "en" | "bn";
  setLike: (id: string, liked: boolean, count: number) => void;
}) {
  const t = T[locale];
  const [replying, setReplying] = useState(false);
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", { year: "numeric", month: "short", day: "numeric" });
  const body = (x: C, isReply: boolean) => (
    <div key={x.id} style={{ marginLeft: isReply ? 24 : 0, paddingLeft: isReply ? 14 : 0, borderLeft: isReply ? "2px solid var(--line)" : "none" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
        <b>{x.name}</b>
        <span className="mute" style={{ fontSize: 13 }}>{fmt(x.created_at)}</span>
      </div>
      <p style={{ margin: "6px 0 8px", whiteSpace: "pre-wrap", overflowWrap: "anywhere", color: "var(--ink)" }}>{x.body}</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <LikeButton
          small target={"comment:" + x.id} count={x.likes} liked={x.liked}
          label={t.like} activeLabel={t.liked}
          onChange={(l, n) => setLike(x.id, l, n)}
        />
        {!isReply ? (
          <button type="button" className="btn" style={{ padding: "2px 10px", fontSize: 13 }} onClick={() => setReplying((v) => !v)}>
            {t.reply}
          </button>
        ) : null}
      </div>
    </div>
  );
  return (
    <li style={{ display: "grid", gap: 12 }}>
      {body(c, false)}
      {replies.map((r) => body(r, true))}
      {replying ? (
        <div style={{ marginLeft: 24 }}>
          <CommentForm slug={slug} parentId={c.id} locale={locale} onDone={() => setReplying(false)} />
        </div>
      ) : null}
    </li>
  );
}

export function BlogEngagement({ slug, locale }: { slug: string; locale: "en" | "bn" }) {
  const t = T[locale];
  const [data, setData] = useState<Data>({ likes: 0, liked: false, comments: [] });

  useEffect(() => {
    let alive = true;
    fetch(`/api/blog-social?slug=${encodeURIComponent(slug)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (alive && j?.ok) setData({ likes: j.likes, liked: j.liked, comments: j.comments });
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [slug]);

  const { tops, repliesOf } = useMemo(() => {
    const tops = data.comments.filter((c) => !c.parent_id);
    const map = new Map<string, C[]>();
    for (const c of data.comments) {
      if (c.parent_id) map.set(c.parent_id, [...(map.get(c.parent_id) ?? []), c]);
    }
    return { tops, repliesOf: map };
  }, [data.comments]);

  const setCommentLike = (id: string, liked: boolean, count: number) =>
    setData((d) => ({ ...d, comments: d.comments.map((c) => (c.id === id ? { ...c, liked, likes: count } : c)) }));

  return (
    <section aria-label={t.comments} style={{ marginTop: 36, display: "grid", gap: 20 }}>
      <div>
        <LikeButton
          target={"post:" + slug} count={data.likes} liked={data.liked}
          label={t.like} activeLabel={t.liked}
          onChange={(liked, likes) => setData((d) => ({ ...d, liked, likes }))}
        />
      </div>

      <h2 style={{ fontSize: 22, margin: 0 }}>{t.comments} ({data.comments.length})</h2>
      {tops.length === 0 ? (
        <p className="mute" style={{ margin: 0 }}>{t.none}</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 22 }}>
          {tops.map((c) => (
            <CommentItem key={c.id} c={c} replies={repliesOf.get(c.id) ?? []} slug={slug} locale={locale} setLike={setCommentLike} />
          ))}
        </ul>
      )}

      <div className="card" style={{ padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>{t.leave}</h3>
        <CommentForm slug={slug} locale={locale} />
      </div>
    </section>
  );
}
