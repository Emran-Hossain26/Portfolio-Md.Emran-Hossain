-- Blog engagement: comments (with one-level replies) and likes.
-- All access goes through server code using the service role; RLS is enabled
-- with NO policies, so the anon/authenticated keys can read or write nothing.

create table if not exists public.blog_comments (
  id uuid primary key default gen_random_uuid(),
  post_slug text not null,
  parent_id uuid references public.blog_comments(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  body text not null check (char_length(body) between 2 and 2000),
  status text not null default 'pending' check (status in ('pending','approved','hidden')),
  ip_hash text,
  created_at timestamptz not null default now()
);
create index if not exists blog_comments_post_idx on public.blog_comments (post_slug, status, created_at);
create index if not exists blog_comments_status_idx on public.blog_comments (status, created_at desc);

create table if not exists public.blog_likes (
  id bigint generated always as identity primary key,
  target text not null,        -- 'post:<slug>' or 'comment:<uuid>'
  voter text not null,         -- random per-browser id from a cookie
  created_at timestamptz not null default now(),
  unique (target, voter)
);
create index if not exists blog_likes_target_idx on public.blog_likes (target);

alter table public.blog_comments enable row level security;
alter table public.blog_likes enable row level security;
