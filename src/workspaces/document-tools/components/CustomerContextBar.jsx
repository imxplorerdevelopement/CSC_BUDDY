import React, { useEffect, useRef, useState } from "react";
import { DT, eyebrow } from "../theme.js";

/**
 * Customer context bar.
 *
 * Empty state: a labelled input ("Customer name") with a Save button.
 * Set state: shows the name as a pill with Edit + New Customer actions, plus
 * a preview of how output filenames will be prefixed.
 *
 * @param {{
 *   customerName: string,
 *   slug: string,
 *   onSet: (name: string) => void,
 *   onClear: () => void,
 * }} props
 */
export function CustomerContextBar({ customerName, slug, onSet, onClear }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(customerName);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) {
      setDraft(customerName);
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing, customerName]);

  const commit = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      onClear();
      setEditing(false);
      return;
    }
    onSet(trimmed);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(customerName);
    setEditing(false);
  };

  const showInput = !customerName || editing;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      padding: "12px 16px",
      border: `1px solid ${customerName ? DT.borderAccent : DT.border}`,
      borderRadius: DT.rLg,
      background: customerName ? DT.primarySoft : DT.surface,
      boxShadow: DT.shadowSoft,
      flexWrap: "wrap",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", minWidth: 0 }}>
        <CustomerIcon active={Boolean(customerName)} />
        <div style={{ display: "grid", gap: 2, minWidth: 0 }}>
          <div style={{ ...eyebrow, color: customerName ? DT.primaryDark : DT.textSubtle }}>
            Current customer
          </div>
          {showInput ? (
            <InlineEditor
              inputRef={inputRef}
              value={draft}
              onChange={setDraft}
              onCommit={commit}
              onCancel={cancel}
              hasExisting={Boolean(customerName)}
            />
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{
                fontFamily: DT.brand,
                fontSize: "1.02rem",
                fontWeight: 700,
                color: DT.text,
                wordBreak: "break-word",
              }}>
                {customerName}
              </span>
              {slug ? (
                <span style={{
                  fontFamily: DT.mono,
                  fontSize: "0.72rem",
                  color: DT.textSubtle,
                }}>
                  files will be named {slug}_…
                </span>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {showInput ? (
          <>
            <SecondaryButton onClick={commit}>Save</SecondaryButton>
            {customerName ? <GhostButton onClick={cancel}>Cancel</GhostButton> : null}
          </>
        ) : (
          <>
            <GhostButton onClick={() => setEditing(true)}>Edit</GhostButton>
            <SecondaryButton onClick={onClear} tone="danger">New customer</SecondaryButton>
          </>
        )}
      </div>
    </div>
  );
}

function InlineEditor({ inputRef, value, onChange, onCommit, onCancel, hasExisting }) {
  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") { e.preventDefault(); onCommit(); }
        if (e.key === "Escape" && hasExisting) { e.preventDefault(); onCancel(); }
      }}
      placeholder="Enter customer name (e.g. Ramesh K.)"
      style={{
        width: 260,
        maxWidth: "100%",
        padding: "6px 10px",
        borderRadius: DT.rSm,
        border: `1px solid ${DT.border}`,
        background: DT.surface,
        color: DT.text,
        fontFamily: DT.font,
        fontSize: "0.92rem",
        outline: "none",
      }}
      autoComplete="off"
      spellCheck={false}
    />
  );
}

function SecondaryButton({ onClick, children, tone }) {
  const isDanger = tone === "danger";
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "7px 12px",
        borderRadius: DT.rSm,
        border: `1px solid ${isDanger ? DT.borderSoft : DT.borderAccent}`,
        background: isDanger ? DT.surface : DT.primary,
        color: isDanger ? DT.textMuted : "#ffffff",
        fontFamily: DT.brand,
        fontSize: "0.68rem",
        fontWeight: 700,
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function GhostButton({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "7px 10px",
        borderRadius: DT.rSm,
        border: "1px solid transparent",
        background: "transparent",
        color: DT.textMuted,
        fontFamily: DT.brand,
        fontSize: "0.66rem",
        fontWeight: 700,
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function CustomerIcon({ active }) {
  const color = active ? DT.primary : DT.textSubtle;
  return (
    <div
      aria-hidden="true"
      style={{
        width: 32,
        height: 32,
        borderRadius: 999,
        background: active ? "rgba(37,99,235,0.15)" : DT.surfaceMuted,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color,
        flexShrink: 0,
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8.5" r="3.5" />
        <path d="M5 20c1.2-3.5 4-5.5 7-5.5s5.8 2 7 5.5" />
      </svg>
    </div>
  );
}
