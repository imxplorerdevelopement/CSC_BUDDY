import React, { useState } from "react";
import { DT, eyebrow } from "../theme.js";
import { UniversalDropzone } from "../components/UniversalDropzone.jsx";
import { Field, selectStyle } from "../components/Field.jsx";
import { PrimaryButton } from "../components/PrimaryButton.jsx";
import { formatBytes } from "../lib/formatBytes.js";
import { stripExtension } from "../lib/download.js";
import { canvasToBlob, drawToCanvas, loadImage } from "../lib/canvas.js";

const WORD_ACCEPT = ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const OUTPUT_FORMATS = [
  { value: "image/jpeg", ext: "jpg", label: "JPG" },
  { value: "image/png", ext: "png", label: "PNG" },
];

/**
 * Extract embedded images from a .docx file using JSZip.
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
    else continue;

    // eslint-disable-next-line no-await-in-loop
    const arrayBuf = await entry.async("arraybuffer");
    results.push({ blob: new Blob([arrayBuf], { type: mime }), mime, filename: name.split("/").pop() });
  }

  return results;
}

/**
 * Word to JPG/PNG — extracts embedded images from .docx and outputs each as
 * a separate image file in the chosen format.
 *
 * @param {{ onQueue: (entry: any) => any }} props
 */
export function WordToImageTool({ onQueue }) {
  const [file, setFile] = useState(null);
  const [outputMime, setOutputMime] = useState("image/jpeg");
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

      const fmt = OUTPUT_FORMATS.find((f) => f.value === outputMime) || OUTPUT_FORMATS[0];
      const base = stripExtension(file.name);

      let count = 0;
      for (const img of images) {
        // Re-encode into the chosen output format.
        // eslint-disable-next-line no-await-in-loop
        const info = await loadImage(img.blob);
        const fill = outputMime === "image/jpeg" ? "#ffffff" : undefined;
        const canvas = drawToCanvas(info.image, info.width, info.height, fill);
        // eslint-disable-next-line no-await-in-loop
        const outBlob = await canvasToBlob(canvas, outputMime, outputMime === "image/jpeg" ? 0.93 : undefined);
        URL.revokeObjectURL(info.url);

        count += 1;
        const pageStr = String(count).padStart(2, "0");
        const descriptor = `word_img_${pageStr}`;
        onQueue({
          name: `${base}_${pageStr}.${fmt.ext}`,
          descriptor,
          ext: fmt.ext,
          blob: outBlob,
          toolId: "word_to_image",
          meta: `${fmt.label} · image ${count}`,
        });
      }

      setImageCount(count);
      setDone(true);
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

      <Field label="Output format">
        <select value={outputMime} onChange={(e) => setOutputMime(e.target.value)} style={selectStyle}>
          {OUTPUT_FORMATS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </Field>

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
        Extracts all embedded images from the Word document and outputs each as a separate image file. Works for scanned documents saved as Word files.
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
          {imageCount} image{imageCount === 1 ? "" : "s"} extracted and added to Output Queue.
        </div>
      ) : null}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <PrimaryButton variant="ghost" onClick={reset} disabled={!file && !done}>Reset</PrimaryButton>
        <PrimaryButton onClick={handleRun} busy={busy} disabled={!file}>
          Convert to {OUTPUT_FORMATS.find((f) => f.value === outputMime)?.label || "Image"}
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
      }}>Word to JPG/PNG</div>
      <div style={{
        fontFamily: DT.font,
        fontSize: "0.88rem",
        color: DT.textMuted,
        marginTop: 4,
      }}>
        Extract images from a Word document and export each as JPG or PNG.
      </div>
    </div>
  );
}
