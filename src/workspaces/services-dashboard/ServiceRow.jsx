import React from "react";
import { SD } from "./theme.js";

const FLAG_BG      = "rgba(220,38,38,0.07)";
const FLAG_BORDER  = "rgba(220,38,38,0.30)";
const FLAG_TEXT    = "#b91c1c";
const FLAG_ACCENT  = "#dc2626";

const COST_BG      = "rgba(9,153,142,0.06)";
const COST_BORDER  = "rgba(9,153,142,0.18)";


/**
 * A single clickable service row. Shows a serial number, the service label,
 * a flagged indicator badge when applicable, and a chevron toggle.
 * When expanded it renders a full details panel with pricing, required
 * documents, notes, and (for flagged services) a prominent red warning.
 *
 * @param {{
 *   serial: number,
 *   service: import('./registry.js').ServiceEntry,
 *   expanded: boolean,
 *   onToggle: () => void,
 * }} props
 */
export function ServiceRow({ serial, service, expanded, onToggle, categoryLabel }) {
  const { label, flagged } = service;

  return (
    <div style={{
      border: `1px solid ${flagged ? FLAG_BORDER : (expanded ? SD.borderAccent : SD.borderSoft)}`,
      borderRadius: SD.rMd,
      background: flagged ? FLAG_BG : (expanded ? SD.primarySoft : SD.surface),
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
          gridTemplateColumns: "36px 1fr auto auto",
          gap: 10,
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
          background: flagged ? FLAG_ACCENT : (expanded ? SD.primary : SD.surfaceSubtle),
          color: (flagged || expanded) ? "#ffffff" : SD.textMuted,
          fontFamily: SD.mono,
          fontSize: "0.74rem",
          fontWeight: 700,
          transition: "background 140ms ease, color 140ms ease",
          flexShrink: 0,
        }}>
          {String(serial).padStart(2, "0")}
        </span>

        <span style={{ display: "grid", gap: 1 }}>
          <span style={{
            fontSize: "0.92rem",
            fontWeight: 600,
            color: flagged ? FLAG_TEXT : SD.text,
            letterSpacing: "0.005em",
          }}>
            {label}
          </span>
          {categoryLabel && (
            <span style={{
              fontSize: "0.68rem",
              color: SD.textSubtle,
              fontFamily: SD.mono,
            }}>
              {categoryLabel}
            </span>
          )}
        </span>

        {flagged && (
          <span style={{
            fontSize: "0.68rem",
            fontWeight: 700,
            letterSpacing: "0.10em",
            textTransform: "uppercase",
            color: FLAG_ACCENT,
            border: `1px solid ${FLAG_BORDER}`,
            borderRadius: 4,
            padding: "2px 6px",
            background: "rgba(220,38,38,0.10)",
            flexShrink: 0,
          }}>
            Pending
          </span>
        )}

        <Chevron expanded={expanded} flagged={flagged} />
      </button>

      {expanded ? <DetailsPanel service={service} /> : null}
    </div>
  );
}

function Chevron({ expanded, flagged }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-flex",
        width: 22,
        height: 22,
        alignItems: "center",
        justifyContent: "center",
        color: flagged ? FLAG_ACCENT : (expanded ? SD.primary : SD.textSubtle),
        transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
        transition: "transform 160ms ease, color 140ms ease",
        flexShrink: 0,
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 6 15 12 9 18" />
      </svg>
    </span>
  );
}

/**
 * Full details panel shown when a service row is expanded.
 * Renders: flagged warning, portal, pricing, required docs, notes, custom amount input.
 */
function DetailsPanel({ service }) {
  const { flagged, flagNote, portal, pricing, required, notes } = service;

  const hasContent = portal || pricing || (required && required.length > 0) || (notes && notes.length > 0);

  return (
    <div style={{
      borderTop: `1px solid ${flagged ? FLAG_BORDER : SD.borderSoft}`,
      background: SD.surface,
      padding: "14px 16px 16px 58px",
      display: "grid",
      gap: 12,
    }}>

      {/* Flagged red warning banner */}
      {flagged && (
        <div style={{
          background: "rgba(220,38,38,0.08)",
          border: `1px solid ${FLAG_BORDER}`,
          borderRadius: SD.rSm,
          padding: "10px 14px",
          display: "grid",
          gap: 4,
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={FLAG_ACCENT} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span style={{
              fontFamily: SD.brand,
              fontSize: "0.70rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: FLAG_ACCENT,
            }}>
              Details Pending
            </span>
          </div>
          {flagNote && (
            <p style={{
              margin: 0,
              fontSize: "0.84rem",
              color: FLAG_TEXT,
              lineHeight: 1.55,
            }}>
              {flagNote}
            </p>
          )}
        </div>
      )}

      {/* Show placeholder note if no content at all and not flagged */}
      {!hasContent && !flagged && (
        <p style={{
          margin: 0,
          fontSize: "0.84rem",
          color: SD.textMuted,
          lineHeight: 1.5,
        }}>
          Service details will be added here.
        </p>
      )}

      {/* Portal */}
      {portal && (
        <DetailRow label="Portal / Path" value={portal} />
      )}

      {/* Pricing block */}
      {pricing && (
        <PricingBlock pricing={pricing} />
      )}

      {/* Required documents */}
      {required && required.length > 0 && (
        <Section label="Required Documents / Details">
          <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 3 }}>
            {required.map((item, i) => (
              <li key={i} style={{ fontSize: "0.84rem", color: SD.textMuted, lineHeight: 1.55 }}>
                {item}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Notes */}
      {notes && notes.length > 0 && (
        <Section label="Notes">
          <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 3 }}>
            {notes.map((note, i) => (
              <li key={i} style={{ fontSize: "0.84rem", color: SD.textMuted, lineHeight: 1.55 }}>
                {note}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function PricingBlock({ pricing }) {
  const { actualCost, customerRef, customOnly } = pricing;
  return (
    <div style={{
      background: COST_BG,
      border: `1px solid ${COST_BORDER}`,
      borderRadius: SD.rSm,
      padding: "10px 14px",
      display: "grid",
      gap: 7,
    }}>
      <span style={{
        fontFamily: SD.brand,
        fontSize: "0.60rem",
        fontWeight: 700,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: SD.primary,
      }}>
        Pricing
      </span>

      {actualCost && (
        <div style={{ display: "grid", gap: 1 }}>
          <span style={{ fontSize: "0.70rem", fontWeight: 700, letterSpacing: "0.06em", color: SD.textSubtle, textTransform: "uppercase" }}>
            Actual / Vendor Cost
          </span>
          <span style={{ fontSize: "0.88rem", fontWeight: 700, color: SD.text, fontFamily: SD.mono }}>
            {actualCost}
          </span>
        </div>
      )}

      {customerRef && (
        <div style={{ display: "grid", gap: 1 }}>
          <span style={{ fontSize: "0.70rem", fontWeight: 700, letterSpacing: "0.06em", color: SD.textSubtle, textTransform: "uppercase" }}>
            Reference Customer Price
          </span>
          <span style={{ fontSize: "0.88rem", fontWeight: 700, color: SD.text, fontFamily: SD.mono }}>
            {customerRef}
          </span>
        </div>
      )}

      {customOnly && (
        <div style={{
          marginTop: 2,
          background: "rgba(234,179,8,0.07)",
          border: "1px solid rgba(234,179,8,0.35)",
          borderRadius: 6,
          padding: "5px 10px",
          fontSize: "0.76rem",
          color: "#92400e",
          fontWeight: 600,
        }}>
          No fixed rate — operator decides final charged amount.
        </div>
      )}
    </div>
  );
}


function Section({ label, children }) {
  return (
    <div style={{ display: "grid", gap: 5 }}>
      <span style={{
        fontFamily: SD.brand,
        fontSize: "0.60rem",
        fontWeight: 700,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: SD.textSubtle,
      }}>
        {label}
      </span>
      {children}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={{ display: "grid", gap: 1 }}>
      <span style={{
        fontFamily: SD.brand,
        fontSize: "0.60rem",
        fontWeight: 700,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: SD.textSubtle,
      }}>
        {label}
      </span>
      <span style={{ fontSize: "0.86rem", color: SD.textMuted }}>
        {value}
      </span>
    </div>
  );
}
