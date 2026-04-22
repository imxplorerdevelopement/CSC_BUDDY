import React from "react";
import { SD } from "./theme.js";

/**
 * A single clickable service row. Shows a serial number, the service label,
 * and a chevron that rotates when expanded. When expanded, renders a minimal
 * placeholder details panel directly below the row — this is the future home
 * of rates, required documents, and workflow notes.
 *
 * @param {{
 *   serial: number,
 *   label: string,
 *   expanded: boolean,
 *   onToggle: () => void,
 * }} props
 */
export function ServiceRow({ serial, label, expanded, onToggle }) {
  return (
    <div style={{
      border: `1px solid ${expanded ? SD.borderAccent : SD.borderSoft}`,
      borderRadius: SD.rMd,
      background: expanded ? SD.primarySoft : SD.surface,
      overflow: "hidden",
      transition: "border-color 140ms ease, background 140ms ease",
    }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        style={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: "36px 1fr auto",
          gap: 12,
          alignItems: "center",
          padding: "11px 14px",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          textAlign: "left",
          fontFamily: SD.font,
          color: SD.text,
        }}
      >
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 28,
          height: 28,
          borderRadius: 999,
          background: expanded ? SD.primary : SD.surfaceSubtle,
          color: expanded ? "#ffffff" : SD.textMuted,
          fontFamily: SD.mono,
          fontSize: "0.74rem",
          fontWeight: 700,
          transition: "background 140ms ease, color 140ms ease",
        }}>
          {String(serial).padStart(2, "0")}
        </span>
        <span style={{
          fontSize: "0.92rem",
          fontWeight: 600,
          color: SD.text,
          letterSpacing: "0.005em",
        }}>
          {label}
        </span>
        <Chevron expanded={expanded} />
      </button>

      {expanded ? <DetailsPanel /> : null}
    </div>
  );
}

function Chevron({ expanded }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-flex",
        width: 22,
        height: 22,
        alignItems: "center",
        justifyContent: "center",
        color: expanded ? SD.primary : SD.textSubtle,
        transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
        transition: "transform 160ms ease, color 140ms ease",
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 6 15 12 9 18" />
      </svg>
    </span>
  );
}

/**
 * Placeholder panel shown when a service row is expanded. The layout blocks
 * out the future sections (information, rate, required documents, workflow)
 * without inventing any content. Each section reads as empty on purpose.
 */
function DetailsPanel() {
  return (
    <div style={{
      borderTop: `1px solid ${SD.borderSoft}`,
      background: SD.surface,
      padding: "14px 16px 16px 58px",
      display: "grid",
      gap: 10,
    }}>
      <div style={{
        fontFamily: SD.brand,
        fontSize: "0.58rem",
        fontWeight: 700,
        letterSpacing: "0.20em",
        textTransform: "uppercase",
        color: SD.textSubtle,
      }}>
        Service details
      </div>
      <div style={{
        fontFamily: SD.font,
        fontSize: "0.84rem",
        color: SD.textMuted,
        lineHeight: 1.5,
      }}>
        Service details will be added here.
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: 8,
      }}>
        <PlaceholderSlot label="Information" />
        <PlaceholderSlot label="Rate" />
        <PlaceholderSlot label="Required documents" />
        <PlaceholderSlot label="Workflow notes" />
      </div>
    </div>
  );
}

function PlaceholderSlot({ label }) {
  return (
    <div style={{
      border: `1px dashed ${SD.border}`,
      borderRadius: SD.rSm,
      padding: "9px 11px",
      background: SD.surfaceMuted,
      display: "grid",
      gap: 2,
    }}>
      <span style={{
        fontFamily: SD.brand,
        fontSize: "0.58rem",
        fontWeight: 700,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: SD.textSubtle,
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: SD.font,
        fontSize: "0.76rem",
        color: SD.textSubtle,
      }}>
        —
      </span>
    </div>
  );
}
