import React from "react";
import { DT } from "../theme.js";

/**
 * @typedef {Object} FieldProps
 * @property {string} label
 * @property {string} [hint]
 * @property {React.ReactNode} children
 */

/**
 * Labeled input wrapper used inside tool panels. Keeps label typography
 * and spacing consistent across tools.
 * @param {FieldProps} props
 */
export function Field({ label, hint, children }) {
  return (
    <label style={{ display: "grid", gap: 4, fontFamily: DT.font, fontSize: "0.82rem", color: DT.text }}>
      <span style={{
        fontSize: "0.60rem",
        fontWeight: 700,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: DT.textMuted,
        fontFamily: DT.brand,
      }}>{label}</span>
      {children}
      {hint ? (
        <span style={{ fontSize: "0.74rem", color: DT.textSubtle }}>{hint}</span>
      ) : null}
    </label>
  );
}

export const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: DT.rSm,
  border: `1px solid ${DT.border}`,
  background: DT.surface,
  color: DT.text,
  fontFamily: DT.mono,
  fontSize: "0.88rem",
  outline: "none",
};

export const selectStyle = {
  ...inputStyle,
  fontFamily: DT.font,
};
