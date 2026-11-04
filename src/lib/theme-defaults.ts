import type { ThemeTokens } from "@/lib/cms";

/** Shipped defaults from the approved mockup tokens (globals.css). */
export const DEFAULT_LIGHT: ThemeTokens = {
  accent: "#2F6BFF",
  bg: "#F4F6F9",
  panel: "#FFFFFF",
  ink: "#0F1B2D",
  mute: "#5B6678",
  line: "#DCE1E9",
};

/** Dark mode only redefines bg/panel/ink/mute/line; accent is shared. */
export const DEFAULT_DARK: ThemeTokens = {
  accent: "#2F6BFF",
  bg: "#0C1524",
  panel: "#122035",
  ink: "#E8EDF5",
  mute: "#93A0B5",
  line: "#223552",
};
