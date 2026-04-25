import React, { useMemo, useState } from "react";
import { DT, eyebrow } from "../theme.js";
import { UniversalDropzone } from "../components/UniversalDropzone.jsx";
import { Field, selectStyle } from "../components/Field.jsx";
import { PrimaryButton } from "../components/PrimaryButton.jsx";
import { canvasToBlob, drawToCanvas, loadImage } from "../lib/canvas.js";
import { extensionForMime, stripExtension } from "../lib/download.js";
import { formatBytes } from "../lib/formatBytes.js";

const TARGETS = [
  { value: "image/jpeg", ext: "jpg", label: "JPG (.jpg)" },
  { value: "image/jpeg", ext: "jpeg", label: "JPEG (.jpeg)" },
  { value: "image/png", ext: "png", label: "PNG (.png)" },
  { value: "image/webp", ext: "webp", label: "WEBP (.webp)" },
];

/**
 * Format converter — JPG ↔ PNG ↔ JPEG ↔ WEBP. Same underlying engine as the
 * compressor (canvas encode) but without the KB target.
 */
export function FormatConvertTool({ onQueue }) {
  const [files, setFiles] = useState([]);
  const [targetIdx, setTargetIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const target = TARGETS[targetIdx];
  const totalBytes = useMemo(() => files.reduce((s, f) => s + (f.size || 0), 0), [files]);

  const handleFiles = (accepted) => {
    setError("");
    const imageOnly = accepted.filter((f) => String(f.type).startsWith("image/"));
    if (!imageOnly.length) {
      setError("Please pick image files.");
      return;
    }
    setFiles(imageOnly);
  };

  const handleRun = async () => {
    if (!files.length) return;
    setBusy(true);
    setError("");
    try {
      let index = 0;
      for (const file of files) {
        index += 1;
        // eslint-disable-next-line no-await-in-loop
        const info = await loadImage(file);
        try {
          const fill = target.value === "image/jpeg" ? "#ffffff" : undefined;
          const canvas = drawToCanvas(info.image, info.width, info.height, fill);
          // eslint-disable-next-line no-await-in-loop
          const blob = await canvasToBlob(
            canvas,
            target.value,
            target.value === "image/jpeg" ? 0.95 : target.value === "image/webp" ? 0.92 : undefined,
          );
          const name = `${stripExtension(file.name)}.${target.ext}`;
          // Batch runs use an index so customer-prefixed names stay unique.
          const descriptor = files.length > 1
            ? `converted_${target.ext}_${String(index).padStart(2, "0")}`
            : `converted_${target.ext}`;
          onQueue({
            name,
            descriptor,
            ext: target.ext,
            blob,
            toolId: "convert",
            meta: target.ext.toUpperCase(),
          });
        } finally {
          URL.revokeObjectURL(info.url);
        }
      }
    } catch (err) {
      setError(err?.message || "Conversion failed.");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setFiles([]);
    setError("");
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Heading
        title="Change Format"
        subtitle="Swap between JPG, JPEG, PNG, and WEBP. Transparent pixels become white when exporting to JPG."
      />

      <UniversalDropzone
        title={files.length ? `${files.length} image${files.length === 1 ? "" : "s"} ready` : "Drop image(s) to convert"}
        helper={files.length ? `Total: ${formatBytes(totalBytes)}` : "JPG · PNG · WEBP · batch allowed"}
        accept="image/jpeg,image/png,image/webp,image/jpg"
        multiple
        onFiles={handleFiles}
      />

      <Field label="Convert to" hint="Some portals require exactly .jpg or exactly .jpeg — pick accordingly.">
        <select value={targetIdx} onChange={(e) => setTargetIdx(Number(e.target.value))} style={selectStyle}>
          {TARGETS.map((t, i) => <option key={`${t.ext}_${i}`} value={i}>{t.label}</option>)}
        </select>
      </Field>

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

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <PrimaryButton variant="ghost" onClick={reset} disabled={!files.length}>Reset</PrimaryButton>
        <PrimaryButton onClick={handleRun} busy={busy} disabled={!files.length}>
          Convert {files.length ? `${files.length} file${files.length === 1 ? "" : "s"}` : ""}
        </PrimaryButton>
      </div>
    </div>
  );
}

function Heading({ title, subtitle }) {
  return (
    <div>
      <div style={eyebrow}>Active tool</div>
      <div style={{ fontFamily: DT.brand, fontSize: "1.15rem", fontWeight: 700, color: DT.text, marginTop: 2 }}>{title}</div>
      <div style={{ fontFamily: DT.font, fontSize: "0.88rem", color: DT.textMuted, marginTop: 4 }}>{subtitle}</div>
    </div>
  );
}
