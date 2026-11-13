-- Task: IT Management System expandable module list.
-- Stores the verified 20-module list separately from the description so the
-- project card can render a compact collapsible section. Additive/idempotent.
alter table public.projects add column if not exists modules_en text not null default '';
