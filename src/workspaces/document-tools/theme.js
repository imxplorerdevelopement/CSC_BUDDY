/**
 * Shared style tokens for the Document Tools workspace.
 * Values mirror the parent app (csc_billing.jsx) so the workspace stays visually consistent.
 */
export const DT = {
  font: "'Manrope', system-ui, -apple-system, sans-serif",
  brand: "'League Spartan', 'Manrope', sans-serif",
  mono: "'JetBrains Mono', 'Cascadia Code', Consolas, monospace",

  bg: "#f8fafc",
  surface: "#ffffff",
  surfaceMuted: "#f1f5f9",
  surfaceActive: "rgba(9,153,142,0.08)",

  border: "rgba(15,23,42,0.12)",
  borderSoft: "rgba(15,23,42,0.08)",
  borderAccent: "rgba(9,153,142,0.35)",

  text: "#0f172a",
  textMuted: "#475569",
  textSubtle: "rgba(15,23,42,0.55)",

  primary: "#09998e",
  primaryDark: "#067366",
  primarySoft: "rgba(9,153,142,0.12)",

  success: "#166534",
  successSoft: "rgba(22,101,52,0.10)",
  warning: "#b45309",
  warningSoft: "rgba(180,83,9,0.10)",
  danger: "#b91c1c",
  dangerSoft: "rgba(185,28,28,0.10)",

  shadowSoft: "0 1px 2px rgba(15,23,42,0.06)",
  shadowCard: "0 4px 20px rgba(15,23,42,0.08)",

  rSm: 8,
  rMd: 12,
  rLg: 16,
  rXl: 20,
};

export const eyebrow = {
  fontSize: "0.58rem",
  fontWeight: 700,
  letterSpacing: "0.20em",
  textTransform: "uppercase",
  color: "rgba(15,23,42,0.46)",
  fontFamily: DT.brand,
};

export const card = {
  border: `1px solid ${DT.border}`,
  borderRadius: DT.rLg,
  background: DT.surface,
  boxShadow: DT.shadowSoft,
};
