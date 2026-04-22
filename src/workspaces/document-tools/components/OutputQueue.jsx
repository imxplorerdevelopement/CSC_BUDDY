import React, { useEffect, useRef, useState } from "react";
import { DT, eyebrow } from "../theme.js";
import { downloadBlob, getExtension, joinWithOriginalExtension, stripExtension } from "../lib/download.js";
import { formatBytes } from "../lib/formatBytes.js";

/**
 * Right-rail queue of finished files. Each entry can be renamed inline
 * (the extension is preserved), downloaded, or removed.
 *
 * @param {{
 *   outputs: import("../state/useOutputQueue.js").OutputEntry[],
 *   onRemove: (id: string) => void,
 *   onClear: () => void,
 *   onRename: (id: string, nextName: string) => void,
 * }} props
 */
export function OutputQueue({ outputs, onRemove, onClear, onRename }) {
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
            <OutputCard
              key={entry.id}
              entry={entry}
              onRemove={onRemove}
              onRename={onRename}
            />
          ))}
        </div>
      )}
    </aside>
  );
}

/**
 * Single row in the queue. Displays the filename with a pencil icon; clicking it
 * (or clicking the name) toggles an inline editor. Enter saves, Esc cancels,
 * and the extension is always preserved so operators can't accidentally strip it.
 */
function OutputCard({ entry, onRemove, onRename }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => stripExtension(entry.name));
  const inputRef = useRef(null);
  const ext = getExtension(entry.name);

  useEffect(() => {
    if (!editing) setDraft(stripExtension(entry.name));
  }, [entry.name, editing]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    const next = joinWithOriginalExtension(draft, entry.name);
    if (next !== entry.name) onRename(entry.id, next);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(stripExtension(entry.name));
    setEditing(false);
  };

  return (
    <div style={{
      border: `1px solid ${DT.borderSoft}`,
      borderRadius: DT.rSm,
      padding: "10px 10px",
      display: "grid",
      gap: 6,
      background: DT.surfaceMuted,
    }}>
      {editing ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 4, alignItems: "center" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 0,
            alignItems: "stretch",
            border: `1px solid ${DT.borderAccent}`,
            borderRadius: DT.rSm,
            background: DT.surface,
            overflow: "hidden",
          }}>
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); commit(); }
                if (e.key === "Escape") { e.preventDefault(); cancel(); }
              }}
              onBlur={commit}
              style={{
                border: "none",
                outline: "none",
                background: "transparent",
                padding: "6px 8px",
                fontFamily: DT.mono,
                fontSize: "0.80rem",
                color: DT.text,
                minWidth: 0,
              }}
            />
            {ext ? (
              <span style={{
                padding: "6px 8px",
                background: DT.surfaceMuted,
                borderLeft: `1px solid ${DT.borderSoft}`,
                fontFamily: DT.mono,
                fontSize: "0.78rem",
                color: DT.textMuted,
                whiteSpace: "nowrap",
              }}>.{ext}</span>
            ) : null}
          </div>
          <IconButton title="Save name" onClick={commit}>✓</IconButton>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 6, alignItems: "start" }}>
          <button
            type="button"
            onClick={() => setEditing(true)}
            title="Rename"
            style={{
              textAlign: "left",
              padding: 0,
              border: "none",
              background: "transparent",
              fontFamily: DT.mono,
              fontSize: "0.80rem",
              fontWeight: 600,
              color: DT.text,
              wordBreak: "break-all",
              cursor: "pointer",
            }}
          >
            {entry.name}
          </button>
          <IconButton title="Rename" onClick={() => setEditing(true)}>
            <PencilIcon />
          </IconButton>
        </div>
      )}

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
  );
}

function IconButton({ onClick, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        width: 26,
        height: 26,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 6,
        border: `1px solid ${DT.borderSoft}`,
        background: DT.surface,
        color: DT.textMuted,
        cursor: "pointer",
        padding: 0,
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

function PencilIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}
