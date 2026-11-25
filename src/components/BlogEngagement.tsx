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
      className={"cm-like" + (liked ? " on" : "") + (small ? " sm" : "")}
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
    >
      <span className="cm-heart" aria-hidden="true">{liked ? "♥" : "♡"}</span>
      <span>{liked ? activeLabel : label}</span>
      <span className="cm-count">{count}</span>
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
      <div className="cm-done" role="status">
        <p>{t.thanks}</p>
        {onDone ? (
          <button type="button" className="cm-btn ghost" onClick={onDone}>OK</button>
        ) : null}
      </div>
    );
  }

  return (
    <form ref={formRef} action={action} className="cm-form">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="parent_id" value={parentId ?? ""} />
      <input type="hidden" name="t" value={t0} />
      <label className="cm-field">
        <span>{t.name}</span>
        <input name="name" required maxLength={80} autoComplete="nickname" />
      </label>
      <label className="cm-field">
        <span>{parentId ? t.replyTo : t.comment}</span>
        <textarea name="body" required minLength={2} maxLength={2000} rows={parentId ? 3 : 5} />
      </label>
      <TurnstileWidget />
      <input
        type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
      />
      {state.error ? <p role="alert" className="cm-error">{t[state.error]}</p> : null}
      <div className="cm-actions">
        <span className="cm-note">{t.limit}</span>
        <div className="cm-actions-btns">
          {onDone ? <button className="cm-btn ghost" type="button" onClick={onDone}>{t.cancel}</button> : null}
          <button className="cm-btn" type="submit" disabled={pending}>{pending ? t.sending : t.send}</button>
        </div>
      </div>
    </form>
  );
}

function Avatar({ name }: { name: string }) {
  const hue = [...name].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 360, 7);
  return (
    <span className="cm-avatar" aria-hidden="true" style={{ background: `hsl(${hue} 55% 42%)` }}>
      {(name.trim()[0] ?? "?").toUpperCase()}
    </span>
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

  const one = (x: C, isReply: boolean) => (
    <div key={x.id} className={"cm-row" + (isReply ? " reply" : "")}>
      <Avatar name={x.name} />
      <div className="cm-body">
        <div className="cm-head">
          <b>{x.name}</b>
          <span>{fmt(x.created_at)}</span>
        </div>
        <p className="cm-text">{x.body}</p>
        <div className="cm-tools">
          <LikeButton
            small target={"comment:" + x.id} count={x.likes} liked={x.liked}
            label={t.like} activeLabel={t.liked}
            onChange={(l, n) => setLike(x.id, l, n)}
          />
          {!isReply ? (
            <button type="button" className="cm-link" onClick={() => setReplying((v) => !v)}>
              {t.reply}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <li className="cm-item">
      {one(c, false)}
      {replies.length || replying ? (
        <div className="cm-replies">
          {replies.map((r) => one(r, true))}
          {replying ? (
            <div className="cm-reply-form">
              <CommentForm slug={slug} parentId={c.id} locale={locale} onDone={() => setReplying(false)} />
            </div>
          ) : null}
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
    <section aria-label={t.comments} className="cm">
      <div className="cm-bar">
        <h2>
          {t.comments} <span>{data.comments.length}</span>
        </h2>
        <LikeButton
          target={"post:" + slug} count={data.likes} liked={data.liked}
          label={t.like} activeLabel={t.liked}
          onChange={(liked, likes) => setData((d) => ({ ...d, liked, likes }))}
        />
      </div>

      {tops.length === 0 ? (
        <p className="cm-empty">{t.none}</p>
      ) : (
        <ul className="cm-list">
          {tops.map((c) => (
            <CommentItem key={c.id} c={c} replies={repliesOf.get(c.id) ?? []} slug={slug} locale={locale} setLike={setCommentLike} />
          ))}
        </ul>
      )}

      <div className="cm-card">
        <h3>{t.leave}</h3>
        <CommentForm slug={slug} locale={locale} />
      </div>
    </section>
  );
}
