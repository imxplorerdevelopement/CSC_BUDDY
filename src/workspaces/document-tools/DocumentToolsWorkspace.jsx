import React, { useCallback, useState } from "react";
import { DT, eyebrow } from "./theme.js";
import { ToolsHeader } from "./components/ToolsHeader.jsx";
import { LeftRail } from "./components/LeftRail.jsx";
import { OutputQueue } from "./components/OutputQueue.jsx";
import { UniversalDropzone } from "./components/UniversalDropzone.jsx";
import { Workbench } from "./components/Workbench.jsx";
import { CustomerContextBar } from "./components/CustomerContextBar.jsx";
import { useOutputQueue } from "./state/useOutputQueue.js";
import { useCustomerContext } from "./state/useCustomerContext.js";
import { TOOL_META, suggestToolForFile } from "./state/tools.js";
import { PORTAL_PRESETS } from "./state/presets.js";

// Shown as quick chips on the landing state. Keep the list short — the full
// registry is still available via the Portal Prep dropdown.
const FEATURED_PRESET_IDS = [
  "aadhaar_photo",
  "pan_photo",
  "pan_signature",
  "passport_photo",
  "nsp_document",
  "pmkisan_document",
];

/**
 * Counter Utility Workstation — the operator-facing document tools page.
 *
 * Three-pane layout: left rail (tool list) → workbench (active tool) →
 * right rail (output queue). The landing state shows a universal dropzone
 * that auto-routes to the right tool based on file type, plus a row of
 * popular portal presets for the single-click path.
 */
export function DocumentToolsWorkspace() {
  const [activeTool, setActiveTool] = useState(null);
  const [toolContext, setToolContext] = useState({});
  const queue = useOutputQueue();
  const customer = useCustomerContext();

  /**
   * Wrap the raw queue push so every output produced while a customer is set
   * gets the customer slug prepended to the filename. Tools keep their API
   * (`onQueue({ name, blob, toolId, meta })`) — they don't need to know the
   * customer context exists.
   */
  const handleToolOutput = useCallback((entry) => {
    customer.touch();
    const slug = customer.slug;
    const name = slug && entry.name && !entry.name.startsWith(`${slug}_`)
      ? `${slug}_${entry.name}`
      : entry.name;
    return queue.push({ ...entry, name });
  }, [customer, queue]);

  /**
   * Clearing the customer also clears the output queue so the next operator
   * starts fresh. Matches the physical workflow at the counter.
   */
  const handleNewCustomer = useCallback(() => {
    customer.clear();
    queue.clear();
  }, [customer, queue]);

  const openTool = (toolId, context = {}) => {
    setActiveTool(toolId);
    setToolContext(context);
  };

  const handleInitialDrop = (files) => {
    const suggested = suggestToolForFile(files[0]);
    if (suggested) openTool(suggested);
  };

  const featuredPresets = FEATURED_PRESET_IDS
    .map((id) => PORTAL_PRESETS.find((p) => p.id === id))
    .filter(Boolean);

  const emptyState = (
    <div style={{ display: "grid", gap: 14 }}>
      <div>
        <div style={eyebrow}>Start a job</div>
        <div style={{
          fontFamily: DT.brand,
          fontSize: "1.2rem",
          fontWeight: 700,
          color: DT.text,
          marginTop: 2,
        }}>Pick a portal, a tool, or drop a file</div>
        <div style={{ fontFamily: DT.font, fontSize: "0.90rem", color: DT.textMuted, marginTop: 4 }}>
          Portal Prep turns a customer file into a portal-ready output in one click. Everything else runs locally on this device.
        </div>
      </div>

      <div style={{
        border: `1px solid ${DT.borderAccent}`,
        borderRadius: DT.rLg,
        background: DT.primarySoft,
        padding: 14,
        display: "grid",
        gap: 10,
      }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <div>
            <div style={{ ...eyebrow, color: DT.primaryDark }}>Quick portal prep</div>
            <div style={{
              fontFamily: DT.brand,
              fontSize: "0.98rem",
              fontWeight: 700,
              color: DT.text,
              marginTop: 2,
            }}>Click a portal to open prep pre-configured</div>
          </div>
          <button
            type="button"
            onClick={() => openTool("portal_prep")}
            style={{
              fontFamily: DT.brand,
              fontSize: "0.66rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: DT.primary,
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            Browse all presets →
          </button>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 8,
        }}>
          {featuredPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => openTool("portal_prep", { presetId: preset.id })}
              style={{
                textAlign: "left",
                padding: "10px 12px",
                borderRadius: DT.rSm,
                border: `1px solid ${DT.border}`,
                background: DT.surface,
                cursor: "pointer",
                display: "grid",
                gap: 4,
                transition: "border-color 120ms ease, transform 80ms ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = DT.primary; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = DT.border; }}
            >
              <span style={{
                fontFamily: DT.brand,
                fontSize: "0.84rem",
                fontWeight: 700,
                color: DT.text,
              }}>{preset.name}</span>
              <span style={{
                fontFamily: DT.mono,
                fontSize: "0.70rem",
                color: DT.textSubtle,
              }}>{preset.notes}</span>
            </button>
          ))}
        </div>
      </div>

      <UniversalDropzone
        title="Drop any document"
        helper="Image or PDF · we'll route you to the right tool"
        accept="image/jpeg,image/png,image/webp,image/jpg,application/pdf"
        onFiles={handleInitialDrop}
      />

      <div>
        <div style={{ ...eyebrow, marginBottom: 8 }}>Or open a tool directly</div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 8,
        }}>
          {Object.values(TOOL_META).map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => openTool(tool.id)}
              style={{
                textAlign: "left",
                padding: "12px 14px",
                borderRadius: DT.rSm,
                border: `1px solid ${DT.border}`,
                background: DT.surface,
                cursor: "pointer",
                display: "grid",
                gap: 4,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = DT.borderAccent; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = DT.border; }}
            >
              <span style={{
                fontFamily: DT.brand,
                fontSize: "0.86rem",
                fontWeight: 700,
                color: DT.text,
              }}>{tool.label}</span>
              <span style={{
                fontFamily: DT.font,
                fontSize: "0.74rem",
                color: DT.textSubtle,
                lineHeight: 1.35,
              }}>{tool.description}</span>
              <span style={{
                fontFamily: DT.mono,
                fontSize: "0.66rem",
                color: DT.primary,
                marginTop: 2,
              }}>{tool.acceptsLabel}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <ToolsHeader />
      <CustomerContextBar
        customerName={customer.customerName}
        slug={customer.slug}
        onSet={customer.setCustomerName}
        onClear={handleNewCustomer}
      />
      <div style={{
        display: "grid",
        gridTemplateColumns: "220px minmax(0, 1fr) 260px",
        gap: 14,
        alignItems: "start",
      }}>
        <LeftRail activeId={activeTool} onSelect={(id) => openTool(id)} />
        <Workbench
          toolId={activeTool}
          onQueue={handleToolOutput}
          emptyState={emptyState}
          toolContext={toolContext}
        />
        <OutputQueue
          outputs={queue.outputs}
          onRemove={queue.remove}
          onClear={queue.clear}
          onRename={queue.rename}
        />
      </div>
    </div>
  );
}

export default DocumentToolsWorkspace;
