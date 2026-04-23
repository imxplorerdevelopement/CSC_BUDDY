import React from "react";
import { DT, eyebrow } from "../theme.js";
import { TOOL_CATEGORIES, TOOL_META } from "../state/tools.js";

/**
 * Vertical tool picker. Highlights the active tool and shows a short helper
 * under each label so operators don't have to hover to remember what a tool does.
 *
 * @param {{ activeId: string|null, onSelect: (id: string) => void }} props
 */
export function LeftRail({ activeId, onSelect }) {
  return (
    <aside style={{
      border: `1px solid ${DT.border}`,
      borderRadius: DT.rLg,
      background: DT.surface,
      padding: 12,
      display: "grid",
      gap: 10,
      alignContent: "start",
      boxShadow: DT.shadowSoft,
      minWidth: 220,
    }}>
      <div style={{ ...eyebrow, padding: "2px 4px" }}>Tools</div>
      <div style={{ display: "grid", gap: 6 }}>
        {TOOL_CATEGORIES.map((cat) => {
          const meta = TOOL_META[cat.id];
          const isActive = activeId === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelect(cat.id)}
              style={{
                textAlign: "left",
                padding: "9px 12px",
                borderRadius: DT.rSm,
                border: `1px solid ${isActive ? DT.borderAccent : "transparent"}`,
                background: isActive ? DT.surfaceActive : "transparent",
                cursor: "pointer",
                transition: "background 120ms ease",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = DT.surfaceMuted;
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = "transparent";
              }}
            >
              <span style={{
                fontFamily: DT.brand,
                fontSize: "0.86rem",
                fontWeight: 700,
                color: isActive ? DT.primary : DT.text,
                letterSpacing: "0.02em",
              }}>{meta.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
