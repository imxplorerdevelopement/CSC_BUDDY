import React, { useState } from "react";
import { DT, eyebrow } from "../theme.js";
import { UniversalDropzone } from "../components/UniversalDropzone.jsx";
import { PrimaryButton } from "../components/PrimaryButton.jsx";
import { formatBytes } from "../lib/formatBytes.js";
import { stripExtension } from "../lib/download.js";
import { buildPdfFromImages } from "../lib/pdf.js";
import { loadImage } from "../lib/canvas.js";

const WORD_ACCEPT = ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/**
 * Extract embedded images from a .docx file (which is a ZIP archive).
 * Returns an array of { blob, mime, filename } sorted by filename.
 * @param {File} file
 * @returns {Promise<Array<{ blob: Blob, mime: string, filename: string }>>}
 */
async function extractDocxImages(file) {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(file);

  const mediaFiles = Object.keys(zip.files).filter(
    (name) => name.startsWith("word/media/") && !zip.files[name].dir,
  );

  if (!mediaFiles.length) return [];

  mediaFiles.sort();

  const results = [];
  for (const name of mediaFiles) {
    const entry = zip.files[name];
    const lower = name.toLowerCase();
    let mime = "image/jpeg";
    if (lower.endsWith(".png")) mime = "image/png";
    else if (lower.endsWith(".gif")) mime = "image/gif";
    else if (lower.endsWith(".webp")) mime = "image/webp";
    else if (lower.endsWith(".bmp")) mime = "image/bmp";
    else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) mime = "image/jpeg";
    else continue; // skip non-image entries (emf, wmf, etc.)

    // eslint-disable-next-line no-await-in-loop
    const arrayBuf = await entry.async("arraybuffer");
    results.push({ blob: new Blob([arrayBuf], { type: mime }), mime, filename: name.split("/").pop() });
  }

  return results;
}

/**
 * Word to PDF — extracts embedded images from the .docx and packages them into
 * a multi-page PDF (one image per page, Fit layout). Handles the common CSC
 * counter case where Word files contain scanned or photographed documents.
 *
 * @param {{ onQueue: (entry: any) => any }} props
 */
export function WordToPdfTool({ onQueue }) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [imageCount, setImageCount] = useState(0);

  const handleFiles = (accepted) => {
    setError("");
    setDone(false);
    setImageCount(0);
    const first = accepted[0];
    if (!first) return;
    const name = String(first.name || "").toLowerCase();
    if (!name.endsWith(".docx") && !name.endsWith(".doc")) {
      setError("Please pick a Word file (.doc or .docx).");
      return;
    }
    setFile(first);
  };

  const handleRun = async () => {
    if (!file) return;
    setBusy(true);
    setError("");
    setDone(false);

    try {
      const images = await extractDocxImages(file);

      if (!images.length) {
        setError("No embedded images found in this Word file. Only image-containing Word documents are supported.");
        return;
      }

      // Load each image so pdf-lib can get dimensions.
      const loaded = [];
      for (const img of images) {
        // eslint-disable-next-line no-await-in-loop
        const info = await loadImage(img.blob);
        loaded.push({ ...img, width: info.width, height: info.height, url: info.url });
      }

      // Build the PDF using the existing pdf builder.
      const imageBuffers = [];
      for (const img of loaded) {
        // eslint-disable-next-line no-await-in-loop
        const bytes = await img.blob.arrayBuffer();
        imageBuffers.push({ bytes, mime: img.mime, width: img.width, height: img.height, source: img.filename });
      }

      const pdfBlob = await buildPdfFromImages(imageBuffers, { pageSize: "Fit" });

      const base = stripExtension(file.name);
      onQueue({
        name: `${base}.pdf`,
        descriptor: "word_to_pdf",
        ext: "pdf",
        blob: pdfBlob,
        toolId: "word_to_pdf",
        meta: `${images.length} page${images.length === 1 ? "" : "s"} · PDF`,
      });

      setImageCount(images.length);
      setDone(true);

      // Cleanup object URLs.
      loaded.forEach((img) => URL.revokeObjectURL(img.url));
    } catch (err) {
      setError(err?.message || "Could not convert this Word file.");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setFile(null);
    setDone(false);
    setError("");
    setImageCount(0);
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Heading />

      <UniversalDropzone
        title={file ? file.name : "Drop a Word file here"}
        helper={file ? formatBytes(file.size) : "DOC · DOCX"}
        accept={WORD_ACCEPT}
        onFiles={handleFiles}
      />

      <div style={{
        padding: "10px 12px",
        borderRadius: DT.rSm,
        background: DT.surfaceMuted,
        border: `1px solid ${DT.borderSoft}`,
        fontFamily: DT.font,
        fontSize: "0.80rem",
        color: DT.textMuted,
        lineHeight: 1.5,
      }}>
        Extracts embedded images from the Word document and packages them into a PDF — one image per page. Works for scanned documents saved as Word files.
      </div>

      {error ? (
        <div style={{
          padding: "10px 12px",
          borderRadius: DT.rSm,
          background: DT.dangerSoft,
          color: DT.danger,
          fontFamily: DT.font,
          fontSize: "0.84rem",
        }}>{error}</div>
      ) : null}

      {done ? (
        <div style={{
          padding: "10px 12px",
          borderRadius: DT.rSm,
          background: DT.successSoft,
          color: DT.success,
          fontFamily: DT.font,
          fontSize: "0.84rem",
          fontWeight: 600,
        }}>
          PDF created from {imageCount} image{imageCount === 1 ? "" : "s"} — added to Output Queue.
        </div>
      ) : null}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <PrimaryButton variant="ghost" onClick={reset} disabled={!file && !done}>Reset</PrimaryButton>
        <PrimaryButton onClick={handleRun} busy={busy} disabled={!file}>
          Convert to PDF
        </PrimaryButton>
      </div>
    </div>
  );
}

function Heading() {
  return (
    <div>
      <div style={eyebrow}>Active tool</div>
      <div style={{
        fontFamily: DT.brand,
        fontSize: "1.15rem",
        fontWeight: 700,
        color: DT.text,
        marginTop: 2,
      }}>Word to PDF</div>
    </div>
  );
}
