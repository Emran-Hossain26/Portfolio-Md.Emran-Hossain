"use client";

/**
 * Mockup's fixed accent-colour chip, kept exactly as approved.
 * This is the live-preview demo of what the admin panel (milestone 3)
 * will write into the --accent CSS variable.
 */
export function AdminAccentDemo() {
  return (
    <div className="admin" title="Mockup of the admin accent-colour control">
      Accent{" "}
      <input
        type="color"
        defaultValue="#2F6BFF"
        aria-label="Accent colour"
        onChange={(e) =>
          document.documentElement.style.setProperty("--accent", e.target.value)
        }
      />
    </div>
  );
}
