import React from "react";
import { DT } from "../theme.js";
import { CompressTool } from "../tools/CompressTool.jsx";
import { ResizeTool } from "../tools/ResizeTool.jsx";
import { PdfToImageTool } from "../tools/PdfToImageTool.jsx";
import { ImageToPdfTool } from "../tools/ImageToPdfTool.jsx";
import { PortalPrepTool } from "../tools/PortalPrepTool.jsx";
import { WordToPdfTool } from "../tools/WordToPdfTool.jsx";
import { WordToImageTool } from "../tools/WordToImageTool.jsx";

/**
 * Central workbench. Only one tool renders at a time — we switch on toolId.
 * Unknown tool ids render the empty state shipped by the consumer.
 *
 * @param {{
 *   toolId: string,
 *   onQueue: (entry: any) => any,
 *   emptyState?: React.ReactNode,
 *   toolContext?: Record<string, any>,
 * }} props
 */
export function Workbench({ toolId, onQueue, emptyState, toolContext }) {
  return (
    <section style={{
      border: `1px solid ${DT.border}`,
      borderRadius: DT.rLg,
      background: DT.surface,
      padding: 18,
      minHeight: 420,
      boxShadow: DT.shadowSoft,
      display: "grid",
      alignContent: "start",
    }}>
      {renderTool(toolId, onQueue, emptyState, toolContext)}
    </section>
  );
}

function renderTool(toolId, onQueue, emptyState, toolContext) {
  const ctx = toolContext || {};
  switch (toolId) {
    case "portal_prep":
      return (
        <PortalPrepTool
          key={`portal_prep:${ctx.presetId || "default"}`}
          onQueue={onQueue}
          initialPresetId={ctx.presetId}
        />
      );
    case "compress":
      return <CompressTool onQueue={onQueue} />;
    case "resize":
      return <ResizeTool onQueue={onQueue} />;
    case "pdf_to_image":
      return <PdfToImageTool onQueue={onQueue} />;
    case "image_to_pdf":
      return <ImageToPdfTool onQueue={onQueue} />;
    case "word_to_pdf":
      return <WordToPdfTool onQueue={onQueue} />;
    case "word_to_image":
      return <WordToImageTool onQueue={onQueue} />;
    default:
      return emptyState || null;
  }
}
