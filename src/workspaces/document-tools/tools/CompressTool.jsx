import React, { useMemo, useState } from "react";
import { DT, eyebrow } from "../theme.js";
import { UniversalDropzone } from "../components/UniversalDropzone.jsx";
import { Field, inputStyle, selectStyle } from "../components/Field.jsx";
import { PrimaryButton } from "../components/PrimaryButton.jsx";
import { formatBytes, percentReduction } from "../lib/formatBytes.js";
import { compressToTargetKB } from "../lib/compress.js";
import { extensionForMime, stripExtension } from "../lib/download.js";

const SIZE_PRESETS_KB = [20, 50, 100, 200, 500];
const OUTPUT_FORMATS = [
  { value: "image/jpeg", label: "JPG (smallest)" },
  { value: "image/png", label: "PNG (lossless)" },
  { value: "image/webp", label: "WEBP (modern)" },
];

/**
 * Image Compressor — target-KB first, with safe auto-resize fallback.
 * Batch friendly; reports per-file reduction and can push all results
 * to the output queue at once.
 *
 * @param {{ onQueue: (entry: { name: string, blob: Blob, toolId: string, meta?: string }) => void }} props
 */
export function CompressTool({ onQueue }) {
  const [files, setFiles] = useState([]);
  const [targetKB, setTargetKB] = useState(50);
  const [outputMime, setOutputMime] = useState("image/jpeg");
  const [allowResize, setAllowResize] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState([]);

  const totalOriginalBytes = useMemo(
    () => files.reduce((sum, f) => sum + (f.size || 0), 0),
    [files],
  );

  const handleFiles = (accepted) => {
    setError("");
    setResults([]);
    const imageOnly = accepted.filter((f) => String(f.type).startsWith("image/"));
    if (!imageOnly.length) {
      setError("Please pick JPG, PNG, or WEBP images.");
      return;
    }
    setFiles(imageOnly);
  };

  const handleRun = async () => {
    if (!files.length) return;
    if (!targetKB || targetKB <= 0) {
      setError("Enter a target size in KB.");
      return;
    }
    setBusy(true);
    setError("");
    setResults([]);
    const completed = [];
    try {
      for (const file of files) {
        // eslint-disable-next-line no-await-in-loop
        const out = await compressToTargetKB(file, {
          targetKB,
          allowResize,
          mime: outputMime,
        });
        const ext = extensionForMime(outputMime, "jpg");
        const name = `${stripExtension(file.name)}_${targetKB}kb.${ext}`;
        const meta = out.reachedTarget
          ? `-${percentReduction(file.size, out.blob.size)}%`
          : "best effort";
        const entry = onQueue({ name, blob: out.blob, toolId: "compress", meta });
        completed.push({
          source: file.name,
          original: file.size,
          final: out.blob.size,
          reachedTarget: out.reachedTarget,
          width: out.width,
          height: out.height,
          quality: out.quality,
          outputId: entry?.id,
        });
      }
      setResults(completed);
    } catch (err) {
      setError(err?.message || "Compression failed. Try a different file.");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setFiles([]);
    setResults([]);
    setError("");
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <ToolHeader
        title="Image Compressor"
        subtitle="Shrink JPG / PNG to an exact target size. Great for Aadhaar, PAN, and scholarship portals."
      />

      <UniversalDropzone
        title={files.length ? `${files.length} image${files.length === 1 ? "" : "s"} ready` : "Drop image(s) here"}
        helper={files.length ? `Total: ${formatBytes(totalOriginalBytes)}` : "JPG · PNG · WEBP · batch allowed"}
        accept="image/jpeg,image/png,image/webp,image/jpg"
        multiple
        onFiles={handleFiles}
      />

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <Field
          label="Target size (KB)"
          hint="Enter a number or pick a preset below."
        >
          <input
            type="number"
            min="5"
            step="5"
            value={targetKB}
            onChange={(e) => setTargetKB(Number(e.target.value) || 0)}
            style={inputStyle}
          />
        </Field>
        <Field label="Output format">
          <select
            value={outputMime}
            onChange={(e) => setOutputMime(e.target.value)}
            style={selectStyle}
          >
            {OUTPUT_FORMATS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </Field>
        <Field label="If target can't be reached" hint="Allow the tool to shrink dimensions a little if quality alone isn't enough.">
          <label style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 10px",
            borderRadius: DT.rSm,
            border: `1px solid ${DT.border}`,
            background: DT.surface,
            fontFamily: DT.font,
            fontSize: "0.84rem",
            color: DT.text,
          }}>
            <input
              type="checkbox"
              checked={allowResize}
              onChange={(e) => setAllowResize(e.target.checked)}
            />
            Allow safe auto-resize
          </label>
        </Field>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {SIZE_PRESETS_KB.map((kb) => (
          <button
            key={kb}
            type="button"
            onClick={() => setTargetKB(kb)}
            style={{
              padding: "6px 11px",
              borderRadius: 999,
              border: `1px solid ${targetKB === kb ? DT.primary : DT.border}`,
              background: targetKB === kb ? DT.primarySoft : DT.surface,
              color: targetKB === kb ? DT.primary : DT.textMuted,
              fontFamily: DT.brand,
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.06em",
              cursor: "pointer",
            }}
          >
            {kb} KB
          </button>
        ))}
      </div>

      {error ? <ErrorBar message={error} /> : null}
      {results.length > 0 ? <ResultsList results={results} /> : null}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <PrimaryButton onClick={reset} variant="ghost" disabled={!files.length && !results.length}>
          Reset
        </PrimaryButton>
        <PrimaryButton onClick={handleRun} busy={busy} disabled={!files.length}>
          Compress {files.length ? `${files.length} file${files.length === 1 ? "" : "s"}` : ""}
        </PrimaryButton>
      </div>
    </div>
  );
}

function ToolHeader({ title, subtitle }) {
  return (
    <div>
      <div style={eyebrow}>Active tool</div>
      <div style={{
        fontFamily: DT.brand,
        fontSize: "1.15rem",
        fontWeight: 700,
        color: DT.text,
        marginTop: 2,
      }}>{title}</div>
      <div style={{ fontFamily: DT.font, fontSize: "0.88rem", color: DT.textMuted, marginTop: 4 }}>
        {subtitle}
      </div>
    </div>
  );
}

function ErrorBar({ message }) {
  return (
    <div style={{
      padding: "10px 12px",
      borderRadius: DT.rSm,
      background: DT.dangerSoft,
      border: `1px solid ${DT.dangerSoft}`,
      color: DT.danger,
      fontFamily: DT.font,
      fontSize: "0.84rem",
    }}>{message}</div>
  );
}

function ResultsList({ results }) {
  return (
    <div style={{
      border: `1px solid ${DT.borderSoft}`,
      borderRadius: DT.rMd,
      background: DT.surfaceMuted,
      padding: 10,
      display: "grid",
      gap: 6,
    }}>
      <div style={eyebrow}>Run summary</div>
      {results.map((r) => (
        <div key={`${r.source}_${r.outputId || ""}`} style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 8,
          fontFamily: DT.mono,
          fontSize: "0.78rem",
          color: DT.text,
        }}>
          <span>
            {r.source} → {formatBytes(r.original)} <span style={{ color: DT.textMuted }}>to</span> {formatBytes(r.final)}
            {r.width && r.height ? ` @ ${r.width}×${r.height}px` : ""}
          </span>
          <span style={{
            color: r.reachedTarget ? DT.success : DT.warning,
            fontWeight: 700,
          }}>
            {r.reachedTarget ? `-${percentReduction(r.original, r.final)}%` : "best effort"}
          </span>
        </div>
      ))}
    </div>
  );
}
