export type ThemePreset = {
  id: string;
  label: string;
  labelBn: string;
};

export const THEME_PRESETS: ThemePreset[] = [
  { id: "light", label: "Light", labelBn: "Light" },
  { id: "dark", label: "Dark", labelBn: "Dark" },
  { id: "cyber", label: "Cyber", labelBn: "Cyber" },
  { id: "aurora", label: "Aurora", labelBn: "Aurora" },
  { id: "warm", label: "Warm Paper", labelBn: "Warm Paper" },
  { id: "ocean", label: "Ocean", labelBn: "Ocean" },
  { id: "sunset", label: "Sunset", labelBn: "Sunset" },
  { id: "forest", label: "Forest", labelBn: "Forest" },
  { id: "contrast", label: "High Contrast", labelBn: "High Contrast" },
];

export const DEFAULT_THEME = "light";

export function isValidTheme(id: string): boolean {
  return THEME_PRESETS.some((p) => p.id === id);
}
