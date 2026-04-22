import React, { useState } from "react";
import { DT, eyebrow } from "./theme.js";
import { ToolsHeader } from "./components/ToolsHeader.jsx";
import { LeftRail } from "./components/LeftRail.jsx";
import { OutputQueue } from "./components/OutputQueue.jsx";
import { UniversalDropzone } from "./components/UniversalDropzone.jsx";
import { Workbench } from "./components/Workbench.jsx";
import { useOutputQueue } from "./state/useOutputQueue.js";
import { TOOL_META, suggestToolForFile } from "./state/tools.js";

/**
 * Counter Utility Workstation — the operator-facing document tools page.
 *
 * Three-pane layout: left rail (tool list) → workbench (active tool) →
 * right rail (output queue). The landing state shows a universal dropzone
 * that auto-routes to the right tool based on file type.
 */
export function DocumentToolsWorkspace() {
  const [activeTool, setActiveTool] = useState(null);
  const queue = useOutputQueue();

  const handleInitialDrop = (files) => {
    const suggested = suggestToolForFile(files[0]);
    if (suggested) setActiveTool(suggested);
  };

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
        }}>Pick a tool or drop a file</div>
        <div style={{ fontFamily: DT.font, fontSize: "0.90rem", color: DT.textMuted, marginTop: 4 }}>
          We'll pick the right tool based on the file type. Images open the compressor; PDFs open the page exporter.
        </div>
      </div>
      <UniversalDropzone
        title="Drop any document"
        helper="Image or PDF · we'll route you to the right tool"
        accept="image/jpeg,image/png,image/webp,image/jpg,application/pdf"
        onFiles={handleInitialDrop}
      />
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: 8,
      }}>
        {Object.values(TOOL_META).map((tool) => (
          <button
            key={tool.id}
            type="button"
            onClick={() => setActiveTool(tool.id)}
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
  );

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <ToolsHeader />
      <div style={{
        display: "grid",
        gridTemplateColumns: "220px minmax(0, 1fr) 260px",
        gap: 14,
        alignItems: "start",
      }}>
        <LeftRail activeId={activeTool} onSelect={setActiveTool} />
        <Workbench
          toolId={activeTool}
          onQueue={queue.push}
          emptyState={emptyState}
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
