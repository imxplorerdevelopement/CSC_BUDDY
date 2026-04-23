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

// Service group chips shown on the landing state — one per Portal Prep group.
const PORTAL_PREP_GROUPS = [
  { id: "certificates", label: "Certificates", hint: "Photo · Aadhaar · Self Declaration + docs" },
  { id: "pan_card", label: "PAN Card", hint: "Photo · Signature · Aadhaar · Birth Proof" },
  { id: "aadhaar_card", label: "Aadhaar Card", hint: "Aadhaar Card PDF" },
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
   * is renamed to `{slug}_{descriptor}.{ext}` — the original source filename is
   * dropped because it's usually phone/CMS noise (IMG_2025…, hash_name, etc.)
   * and stacks up visually when combined with the slug.
   *
   * Tools optionally pass `descriptor` + `ext` alongside `name`; the fallback
   * (no customer set, or a legacy tool that only passes `name`) preserves
   * today's behaviour. Tools keep their simple API — they don't need to know
   * the customer context exists.
   */
  const handleToolOutput = useCallback((entry) => {
    customer.touch();
    const slug = customer.slug;

    let name = entry.name;
    if (slug && entry.descriptor && entry.ext) {
      name = `${slug}_${entry.descriptor}.${entry.ext}`;
    } else if (slug && entry.name && !entry.name.startsWith(`${slug}_`)) {
      // Legacy path: no descriptor provided, so we prepend rather than replace.
      name = `${slug}_${entry.name}`;
    }

    // Never persist descriptor/ext on the queue entry — they're a naming hint only.
    const { descriptor, ext, ...rest } = entry;
    return queue.push({ ...rest, name });
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

  const emptyState = (
    <div style={{ display: "grid", gap: 14 }}>
      <div>
        <div style={{
          fontFamily: DT.brand,
          fontSize: "1.2rem",
          fontWeight: 700,
          color: DT.text,
        }}>Pick a portal, a tool, or drop a file</div>
      </div>

      <div style={{
        border: `1px solid ${DT.borderAccent}`,
        borderRadius: DT.rLg,
        background: DT.primarySoft,
        padding: 14,
        display: "grid",
        gap: 10,
      }}>
        <div style={{ ...eyebrow, color: DT.primaryDark }}>Quick portal prep</div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 8,
        }}>
          {PORTAL_PREP_GROUPS.map((group) => (
            <button
              key={group.id}
              type="button"
              onClick={() => openTool("portal_prep")}
              style={{
                textAlign: "left",
                padding: "10px 12px",
                borderRadius: DT.rSm,
                border: `1px solid ${DT.border}`,
                background: DT.surface,
                cursor: "pointer",
                display: "grid",
                gap: 4,
                transition: "border-color 120ms ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = DT.primary; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = DT.border; }}
            >
              <span style={{
                fontFamily: DT.brand,
                fontSize: "0.84rem",
                fontWeight: 700,
                color: DT.text,
              }}>{group.label}</span>
              <span style={{
                fontFamily: DT.mono,
                fontSize: "0.70rem",
                color: DT.textSubtle,
              }}>{group.hint}</span>
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
                padding: "10px 14px",
                borderRadius: DT.rSm,
                border: `1px solid ${DT.border}`,
                background: DT.surface,
                cursor: "pointer",
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
