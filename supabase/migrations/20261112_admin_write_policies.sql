-- Harden admin-write policies (Stage 09 security review item, applied early).
-- The Stage 1/2 migrations granted EVERY authenticated Supabase user full
-- write access (`FOR ALL TO authenticated USING (true)`). Only admins-table
-- members — public.is_admin() — may write now. App code is unaffected: every
-- admin write already goes through the service-role client, which bypasses
-- RLS entirely. Idempotent: safe to re-run.

drop policy if exists posts_admin_write on public.posts;
create policy posts_admin_write on public.posts
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists services_admin_write on public.services;
create policy services_admin_write on public.services
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists skills_admin_write on public.skills;
create policy skills_admin_write on public.skills
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists certifications_admin_write on public.certifications;
create policy certifications_admin_write on public.certifications
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists faqs_admin_write on public.faqs;
create policy faqs_admin_write on public.faqs
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists stats_admin_write on public.stats;
create policy stats_admin_write on public.stats
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists social_links_admin_write on public.social_links;
create policy social_links_admin_write on public.social_links
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists contact_info_admin_write on public.contact_info;
create policy contact_info_admin_write on public.contact_info
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists media_assets_admin_write on public.media_assets;
create policy media_assets_admin_write on public.media_assets
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
