import React from "react";
import { DT, eyebrow } from "../theme.js";

/**
 * Header strip for the Document Tools workspace — shows the privacy posture
 * (files never leave the device) and the workspace title.
 */
export function ToolsHeader() {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      padding: "12px 16px",
      border: `1px solid ${DT.border}`,
      borderRadius: DT.rLg,
      background: DT.surface,
      boxShadow: DT.shadowSoft,
    }}>
      <div>
        <div style={eyebrow}>Document Tools</div>
        <div style={{
          fontFamily: DT.brand,
          fontSize: "1.05rem",
          fontWeight: 700,
          color: DT.text,
          marginTop: 2,
        }}>
          Counter Utility Workstation
        </div>
      </div>
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        border: `1px solid ${DT.successSoft}`,
        background: DT.successSoft,
        color: DT.success,
        borderRadius: 999,
        fontFamily: DT.font,
        fontSize: "0.74rem",
        fontWeight: 600,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
          <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5" />
        </svg>
        Files stay on this device
      </div>
    </div>
  );
}
