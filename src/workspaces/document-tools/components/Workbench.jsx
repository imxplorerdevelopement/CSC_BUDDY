import React from "react";
import { DT } from "../theme.js";
import { CompressTool } from "../tools/CompressTool.jsx";
import { ResizeTool } from "../tools/ResizeTool.jsx";
import { FormatConvertTool } from "../tools/FormatConvertTool.jsx";
import { PdfToImageTool } from "../tools/PdfToImageTool.jsx";
import { ImageToPdfTool } from "../tools/ImageToPdfTool.jsx";

/**
 * Central workbench. Only one tool renders at a time — we switch on toolId.
 * Unknown tool ids render the empty state shipped by the consumer.
 *
 * @param {{ toolId: string, onQueue: (entry: any) => any, emptyState?: React.ReactNode }} props
 */
export function Workbench({ toolId, onQueue, emptyState }) {
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
      {renderTool(toolId, onQueue, emptyState)}
    </section>
  );
}

function renderTool(toolId, onQueue, emptyState) {
  switch (toolId) {
    case "compress":
      return <CompressTool onQueue={onQueue} />;
    case "resize":
      return <ResizeTool onQueue={onQueue} />;
    case "convert":
      return <FormatConvertTool onQueue={onQueue} />;
    case "pdf_to_image":
      return <PdfToImageTool onQueue={onQueue} />;
    case "image_to_pdf":
      return <ImageToPdfTool onQueue={onQueue} />;
    default:
      return emptyState || null;
  }
}
