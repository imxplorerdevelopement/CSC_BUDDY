import React from "react";
import { DT } from "../theme.js";

/**
 * Large, high-contrast action button anchored to the bottom of each tool panel.
 * Disabled state is visually distinct to prevent misclicks on empty inputs.
 *
 * @param {{
 *   onClick: () => void,
 *   disabled?: boolean,
 *   busy?: boolean,
 *   children: React.ReactNode,
 *   variant?: "primary"|"ghost",
 * }} props
 */
export function PrimaryButton({ onClick, disabled, busy, children, variant = "primary" }) {
  const isPrimary = variant === "primary";
  const base = {
    padding: "11px 18px",
    borderRadius: DT.rSm,
    fontFamily: DT.brand,
    fontSize: "0.78rem",
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    cursor: disabled || busy ? "not-allowed" : "pointer",
    transition: "background 120ms ease, transform 80ms ease",
    border: "1px solid transparent",
    minWidth: 160,
  };
  const primary = {
    ...base,
    background: disabled || busy ? "rgba(37,99,235,0.45)" : DT.primary,
    color: "#ffffff",
    boxShadow: disabled ? "none" : "0 1px 2px rgba(37,99,235,0.3)",
  };
  const ghost = {
    ...base,
    background: "transparent",
    color: DT.primary,
    borderColor: DT.borderAccent,
  };
  return (
    <button
      type="button"
      onClick={disabled || busy ? undefined : onClick}
      disabled={disabled || busy}
      style={isPrimary ? primary : ghost}
    >
      {busy ? "Working…" : children}
    </button>
  );
}
