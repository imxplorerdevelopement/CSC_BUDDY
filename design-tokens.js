/**
 * CSC Buddy Design Tokens — IMxplorer Design System
 * Variation 5: Dark (#0f1116) + Cream (#f6f2e9) + Wine-Red + Champagne Gold
 */

export const DS = {
  // Core palette
  dark:        "#0f1116",
  darkDeep:    "#080809",
  darkSoft:    "#0d0b08",
  cream:       "#f6f2e9",
  creamSoft:   "#f0ece9",
  creamText:   "#fcf9f8",
  wine:        "#8f2f2f",
  gold:        "#d3a65a",
  goldDark:    "#c9a84c",
  redBright:   "#d6052b",
  inkBlack:    "#0a0a0a",

  // Category semantic accents
  cat: {
    "Government ID":        "#4a82c0",
    "Certificates":         "#3a9e78",
    "Legal & Docs":         "#c0414a",
    "Government Services":  "#c8922a",
    "Typing & Print":       "#8b6fc0",
  },

  // Foreground tiers on dark
  fg1: "rgba(252,249,248,1)",
  fg2: "rgba(252,249,248,0.78)",
  fg3: "rgba(252,249,248,0.60)",
  fg4: "rgba(255,255,255,0.40)",
  fg5: "rgba(255,255,255,0.20)",

  // Foreground tiers on cream/light
  ink1: "rgba(10,10,10,1)",
  ink2: "rgba(10,10,10,0.85)",
  ink3: "rgba(10,10,10,0.60)",
  ink4: "rgba(10,10,10,0.40)",

  // Surfaces
  hairline:    "rgba(255,255,255,0.10)",
  hairlineSoft:"rgba(255,255,255,0.06)",
  glass:       "rgba(255,255,255,0.06)",
  card:        "rgba(10,10,10,0.35)",
  cardDeep:    "rgba(10,10,10,0.65)",

  // Fonts
  serif:  "'Cormorant Garamond', 'Times New Roman', serif",
  sans:   "'Manrope', system-ui, -apple-system, sans-serif",
  brand:  "'League Spartan', 'Manrope', sans-serif",
  mono:   "'JetBrains Mono', 'Cascadia Code', Consolas, monospace",

  // Radius
  rXs:   "4px",
  rSm:   "8px",
  rMd:   "14px",
  rLg:   "20px",
  rXl:   "24px",
  rPill: "999px",

  // Shadows
  shadowCard:  "0 20px 60px rgba(0,0,0,0.50)",
  shadowNav:   "0 8px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.03)",
  shadowSm:    "0 4px 12px rgba(0,0,0,0.08)",
  shadowMd:    "0 10px 20px rgba(0,0,0,0.15)",
  shadowLg:    "0 18px 36px rgba(0,0,0,0.25)",

  // Motion
  ease:      "cubic-bezier(0.16, 1, 0.3, 1)",
  easeSoft:  "cubic-bezier(0.2, 0.9, 0.22, 1)",
  transStd:  "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
  transColor:"color 0.18s ease, background 0.18s ease, border-color 0.18s ease",
};
