-- ============================================================================
-- Stage 4.2: Complete theme presets (add sunset, forest, ocean, high-contrast)
-- and theme_visitor_switch setting. Idempotent.
-- Do NOT edit old migrations; this is additive.
-- ============================================================================

-- Backfill: the table is defined in the Stage 0 initial schema, but some
-- live databases never ran that file — without this CREATE the INSERTs
-- below fail with 42P01 and (the SQL Editor runs one transaction) roll back
-- the entire migration batch.
create table if not exists public.theme_presets (
  id uuid primary key default gen_random_uuid(),
  name_en text unique not null,
  name_bn text not null default '',
  is_default boolean not null default false,
  is_enabled boolean not null default true,
  colors jsonb not null default '{}'::jsonb,
  fonts jsonb not null default '{}'::jsonb,
  radius jsonb not null default '{}'::jsonb,
  shadows jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add the 4 missing presets (Ocean, Sunset, Forest, High Contrast)
INSERT INTO theme_presets (name_en, name_bn, is_default, is_enabled, colors, fonts, radius, shadows, sort_order) VALUES
  ('Ocean', 'ওশান', false, true, '{"accent":"#0E9AA7","bg":"#0A1929","panel":"#0F2744","ink":"#E0F0FF","mute":"#7BA8D4","line":"#1E3A5F","radius":"12px"}', '{"heading":"Bricolage Grotesque","body":"Hind Siliguri"}', '{"card":"12px","button":"12px"}', '{"card":"0 4px 14px rgba(14,154,167,0.2)"}', 6),
  ('Sunset', 'সানসেট', false, true, '{"accent":"#FF7A59","bg":"#1C0F1F","panel":"#2A1630","ink":"#FFEBDD","mute":"#D0A9B8","line":"#4A2A55","radius":"18px"}', '{"heading":"Bricolage Grotesque","body":"Hind Siliguri"}', '{"card":"18px","button":"18px"}', '{"card":"0 4px 14px rgba(255,122,89,0.2)"}', 7),
  ('Forest', 'ফরেস্ট', false, true, '{"accent":"#1F7A4A","bg":"#EEF3EC","panel":"#fff","ink":"#14261B","mute":"#4F6657","line":"#D3E0D3","radius":"12px"}', '{"heading":"Bricolage Grotesque","body":"Hind Siliguri"}', '{"card":"12px","button":"12px"}', '{"card":"0 4px 14px rgba(31,122,74,0.15)"}', 8),
  ('High Contrast', 'হাই কনট্রাস্ট', false, true, '{"accent":"#FFFF00","bg":"#000000","panel":"#000000","ink":"#FFFFFF","mute":"#E6E6E6","line":"#FFFFFF","radius":"0px"}', '{"heading":"Bricolage Grotesque","body":"Hind Siliguri"}', '{"card":"0px","button":"0px"}', '{"card":"0 4px 14px rgba(255,255,0,0.3)"}', 9)
ON CONFLICT (name_en) DO UPDATE SET
  name_bn = EXCLUDED.name_bn,
  is_enabled = EXCLUDED.is_enabled,
  colors = EXCLUDED.colors,
  fonts = EXCLUDED.fonts,
  radius = EXCLUDED.radius,
  shadows = EXCLUDED.shadows,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

-- Ensure exactly one default (Light)
UPDATE theme_presets SET is_default = false WHERE name_en != 'Light';
UPDATE theme_presets SET is_default = true WHERE name_en = 'Light';

-- theme_visitor_switch setting (default true)
INSERT INTO site_settings (key, value)
VALUES ('theme_visitor_switch', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;