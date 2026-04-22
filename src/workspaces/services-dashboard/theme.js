/**
 * Shared style tokens for the Services Dashboard. Same palette as the rest of
 * the app, tuned for a calm, registry-style list view.
 */
export const SD = {
  font: "'Manrope', system-ui, -apple-system, sans-serif",
  brand: "'League Spartan', 'Manrope', sans-serif",
  mono: "'JetBrains Mono', 'Cascadia Code', Consolas, monospace",

  surface: "#ffffff",
  surfaceMuted: "#f8fafc",
  surfaceSubtle: "#f1f5f9",

  border: "rgba(15,23,42,0.10)",
  borderSoft: "rgba(15,23,42,0.06)",
  borderAccent: "rgba(37,99,235,0.32)",

  text: "#0f172a",
  textMuted: "#475569",
  textSubtle: "rgba(15,23,42,0.55)",

  primary: "#2563eb",
  primaryDark: "#1d4ed8",
  primarySoft: "rgba(37,99,235,0.10)",

  shadowSoft: "0 1px 2px rgba(15,23,42,0.05)",

  rSm: 8,
  rMd: 12,
  rLg: 16,

  // Page is intentionally narrower than the full workspace to avoid the
  // "stretched and cluttered" feeling the current pages suffer from.
  pageMaxWidth: 780,
};
