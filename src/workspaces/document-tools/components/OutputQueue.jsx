import React from "react";
import { DT, eyebrow } from "../theme.js";
import { downloadBlob } from "../lib/download.js";
import { formatBytes } from "../lib/formatBytes.js";

/**
 * Right-rail queue of finished files. Each entry has a download and remove
 * button. A "Clear all" action is shown when at least one output is present.
 *
 * @param {{ outputs: import("../state/useOutputQueue.js").OutputEntry[], onRemove: (id: string) => void, onClear: () => void }} props
 */
export function OutputQueue({ outputs, onRemove, onClear }) {
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
      minWidth: 240,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={eyebrow}>Output queue</div>
        {outputs.length > 0 ? (
          <button
            type="button"
            onClick={onClear}
            style={{
              fontFamily: DT.brand,
              fontSize: "0.62rem",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: DT.textMuted,
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            Clear all
          </button>
        ) : null}
      </div>

      {outputs.length === 0 ? (
        <div style={{
          padding: "18px 10px",
          border: `1px dashed ${DT.borderSoft}`,
          borderRadius: DT.rSm,
          fontFamily: DT.font,
          fontSize: "0.80rem",
          color: DT.textSubtle,
          textAlign: "center",
        }}>
          Finished files will appear here.<br />
          They auto-clear after 30 minutes.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {outputs.map((entry) => (
            <div key={entry.id} style={{
              border: `1px solid ${DT.borderSoft}`,
              borderRadius: DT.rSm,
              padding: "10px 10px",
              display: "grid",
              gap: 6,
              background: DT.surfaceMuted,
            }}>
              <div style={{
                fontFamily: DT.mono,
                fontSize: "0.80rem",
                fontWeight: 600,
                color: DT.text,
                wordBreak: "break-all",
              }}>
                {entry.name}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: DT.mono, fontSize: "0.74rem", color: DT.textMuted }}>
                  {formatBytes(entry.size)}
                </span>
                {entry.meta ? (
                  <span style={{
                    fontFamily: DT.font,
                    fontSize: "0.70rem",
                    color: DT.success,
                    background: DT.successSoft,
                    padding: "2px 6px",
                    borderRadius: 999,
                    fontWeight: 600,
                  }}>{entry.meta}</span>
                ) : null}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  onClick={() => downloadBlob(entry.blob, entry.name)}
                  style={{
                    flex: 1,
                    padding: "7px 10px",
                    borderRadius: DT.rSm,
                    border: `1px solid ${DT.borderAccent}`,
                    background: DT.primary,
                    color: "#ffffff",
                    fontFamily: DT.brand,
                    fontSize: "0.70rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  Download
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(entry.id)}
                  style={{
                    padding: "7px 10px",
                    borderRadius: DT.rSm,
                    border: `1px solid ${DT.borderSoft}`,
                    background: DT.surface,
                    color: DT.textMuted,
                    fontFamily: DT.brand,
                    fontSize: "0.70rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
