import { requireAdmin } from "@/lib/supabase/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { ThemeEditor } from "@/components/admin/ThemeEditor";
import { getThemeOverrides, type ThemeTokens } from "@/lib/cms";
import { DEFAULT_LIGHT, DEFAULT_DARK } from "@/lib/theme-defaults";
import { saveThemeAction } from "@/app/(admin)/actions";

function readTokens(raw: Partial<ThemeTokens>, def: ThemeTokens): ThemeTokens {
  return {
    accent: raw.accent ?? def.accent,
    bg: raw.bg ?? def.bg,
    panel: raw.panel ?? def.panel,
    ink: raw.ink ?? def.ink,
    mute: raw.mute ?? def.mute,
    line: raw.line ?? def.line,
  };
}

export default async function ThemePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  await requireAdmin();
  const overrides = await getThemeOverrides();

  return (
    <AdminShell current="/admin/theme" heading="Theme colours">
      {saved ? <p className="admin-check pass">Saved.</p> : null}
      <ThemeEditor
        initialLight={readTokens(overrides.light, DEFAULT_LIGHT)}
        initialDark={readTokens(overrides.dark, DEFAULT_DARK)}
        saveTheme={async (lightJson, darkJson) => {
          "use server";
          await saveThemeAction(lightJson, darkJson);
        }}
      />
    </AdminShell>
  );
}
