-- Stage 6 security hardening. Idempotent.
--  - login_attempts: durable store for login + 2FA rate limiting / lockout
--    (identifier + IP based, written server-side with the service role)
--  - admins.recovery_codes: hashed 2FA recovery codes (SHA-256, jsonb array)

create table if not exists public.login_attempts (
  id uuid primary key default gen_random_uuid(),
  identifier text not null,
  ip text not null default '',
  success boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists login_attempts_lookup_idx
  on public.login_attempts (identifier, created_at desc);
alter table public.login_attempts enable row level security;
-- No public policies: written/read only by server code via the service role.

alter table public.admins add column if not exists recovery_codes jsonb;
