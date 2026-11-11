-- Stage U1: sections table — new order per spec + experience key.
-- Idempotent. The homepage reads this table for order + enable/disable.

insert into public.sections (key, sort_order, enabled)
values
  ('hero', 1, true),
  ('expertise', 2, true),
  ('projects', 3, true),
  ('experience', 4, true),
  ('skills', 5, true),
  ('stats', 6, true),
  ('reviews', 7, true),
  ('faq', 8, true),
  ('now', 9, true),
  ('blog', 10, true),
  ('contact', 11, true)
on conflict (key) do update set sort_order = excluded.sort_order;

-- Hide sections that are empty or not in the default layout
update public.sections set enabled = false where key = 'testimonials';
update public.sections set enabled = false where key = 'certifications';
