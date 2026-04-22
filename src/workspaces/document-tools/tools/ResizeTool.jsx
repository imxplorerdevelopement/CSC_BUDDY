import React, { useEffect, useMemo, useState } from "react";
import { DT, eyebrow } from "../theme.js";
import { UniversalDropzone } from "../components/UniversalDropzone.jsx";
import { Field, inputStyle, selectStyle } from "../components/Field.jsx";
import { PrimaryButton } from "../components/PrimaryButton.jsx";
import { canvasToBlob, cmToPixels, drawToCanvas, loadImage } from "../lib/canvas.js";
import { extensionForMime, stripExtension } from "../lib/download.js";
import { formatBytes } from "../lib/formatBytes.js";

const SIZE_PRESETS = [
  { id: "passport", label: "Passport / Aadhaar photo", widthCm: 3.5, heightCm: 4.5, dpi: 300 },
  { id: "pan", label: "PAN photo (3.5×2.5)", widthCm: 3.5, heightCm: 2.5, dpi: 200 },
  { id: "signature", label: "Signature (6×2)", widthCm: 6, heightCm: 2, dpi: 200 },
  { id: "stamp", label: "Stamp (2×2.5)", widthCm: 2, heightCm: 2.5, dpi: 300 },
  { id: "a4", label: "A4 full page (21×29.7)", widthCm: 21, heightCm: 29.7, dpi: 150 },
];

const OUTPUT_FORMATS = [
  { value: "image/jpeg", label: "JPG" },
  { value: "image/png", label: "PNG" },
];

/**
 * Image Resizer — cm-first inputs with DPI-aware pixel conversion.
 * Presets cover the most common CSC document photo sizes.
 */
export function ResizeTool({ onQueue }) {
  const [file, setFile] = useState(null);
  const [sourceInfo, setSourceInfo] = useState(null);
  const [widthCm, setWidthCm] = useState(3.5);
  const [heightCm, setHeightCm] = useState(4.5);
  const [dpi, setDpi] = useState(300);
  const [outputMime, setOutputMime] = useState("image/jpeg");
  const [lockAspect, setLockAspect] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Compute aspect ratio from the currently loaded source (not from inputs).
  const sourceAspect = sourceInfo && sourceInfo.height > 0 ? sourceInfo.width / sourceInfo.height : null;

  useEffect(() => () => {
    if (sourceInfo?.url) URL.revokeObjectURL(sourceInfo.url);
  }, [sourceInfo]);

  const handleFiles = async (accepted) => {
    setError("");
    const first = accepted[0];
    if (!first || !String(first.type).startsWith("image/")) {
      setError("Please pick an image file.");
      return;
    }
    try {
      const info = await loadImage(first);
      // Revoke any prior preview URL before replacing.
      if (sourceInfo?.url) URL.revokeObjectURL(sourceInfo.url);
      setFile(first);
      setSourceInfo(info);
    } catch (err) {
      setError(err?.message || "Could not read image.");
    }
  };

  const applyPreset = (preset) => {
    setWidthCm(preset.widthCm);
    setHeightCm(preset.heightCm);
    setDpi(preset.dpi);
  };

  const handleWidthChange = (value) => {
    const w = Number(value) || 0;
    setWidthCm(w);
    if (lockAspect && sourceAspect && w > 0) {
      setHeightCm(Number((w / sourceAspect).toFixed(2)));
    }
  };

  const handleHeightChange = (value) => {
    const h = Number(value) || 0;
    setHeightCm(h);
    if (lockAspect && sourceAspect && h > 0) {
      setWidthCm(Number((h * sourceAspect).toFixed(2)));
    }
  };

  const targetPx = useMemo(() => ({
    w: cmToPixels(widthCm, dpi),
    h: cmToPixels(heightCm, dpi),
  }), [widthCm, heightCm, dpi]);

  const handleRun = async () => {
    if (!file || !sourceInfo) return;
    if (targetPx.w < 10 || targetPx.h < 10) {
      setError("Target size is too small. Increase width, height, or DPI.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const fill = outputMime === "image/jpeg" ? "#ffffff" : undefined;
      const canvas = drawToCanvas(sourceInfo.image, targetPx.w, targetPx.h, fill);
      const blob = await canvasToBlob(canvas, outputMime, outputMime === "image/jpeg" ? 0.92 : undefined);
      const ext = extensionForMime(outputMime, "jpg");
      const name = `${stripExtension(file.name)}_${widthCm}x${heightCm}cm_${dpi}dpi.${ext}`;
      onQueue({
        name,
        blob,
        toolId: "resize",
        meta: `${targetPx.w}×${targetPx.h}px`,
      });
    } catch (err) {
      setError(err?.message || "Resize failed.");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    if (sourceInfo?.url) URL.revokeObjectURL(sourceInfo.url);
    setFile(null);
    setSourceInfo(null);
    setError("");
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Heading
        title="Image Resizer"
        subtitle="Enter dimensions in centimetres — we'll compute pixels using your chosen DPI."
      />

      {!file ? (
        <UniversalDropzone
          title="Drop an image to resize"
          helper="JPG · PNG · WEBP"
          accept="image/jpeg,image/png,image/webp,image/jpg"
          onFiles={handleFiles}
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(160px, 260px) 1fr", gap: 14, alignItems: "start" }}>
          <div style={{
            border: `1px solid ${DT.borderSoft}`,
            borderRadius: DT.rMd,
            padding: 8,
            background: DT.surfaceMuted,
            display: "grid",
            gap: 6,
            justifyItems: "center",
          }}>
            <img
              src={sourceInfo.url}
              alt="source preview"
              style={{ maxWidth: "100%", maxHeight: 220, borderRadius: DT.rSm, display: "block" }}
            />
            <div style={{ fontFamily: DT.mono, fontSize: "0.74rem", color: DT.textMuted }}>
              {sourceInfo.width}×{sourceInfo.height}px · {formatBytes(file.size)}
            </div>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {SIZE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 999,
                    border: `1px solid ${DT.border}`,
                    background: DT.surface,
                    color: DT.textMuted,
                    fontFamily: DT.brand,
                    fontSize: "0.70rem",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    cursor: "pointer",
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
              <Field label="Width (cm)">
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={widthCm}
                  onChange={(e) => handleWidthChange(e.target.value)}
                  style={inputStyle}
                />
              </Field>
              <Field label="Height (cm)">
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={heightCm}
                  onChange={(e) => handleHeightChange(e.target.value)}
                  style={inputStyle}
                />
              </Field>
              <Field label="DPI">
                <select value={dpi} onChange={(e) => setDpi(Number(e.target.value))} style={selectStyle}>
                  <option value={72}>72 (screen)</option>
                  <option value={150}>150 (draft print)</option>
                  <option value={200}>200 (portal photo)</option>
                  <option value={300}>300 (print / official)</option>
                </select>
              </Field>
              <Field label="Output">
                <select value={outputMime} onChange={(e) => setOutputMime(e.target.value)} style={selectStyle}>
                  {OUTPUT_FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </Field>
            </div>

            <label style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontFamily: DT.font,
              fontSize: "0.84rem",
              color: DT.text,
            }}>
              <input type="checkbox" checked={lockAspect} onChange={(e) => setLockAspect(e.target.checked)} />
              Lock aspect ratio to source
            </label>

            <div style={{
              padding: "9px 12px",
              borderRadius: DT.rSm,
              background: DT.primarySoft,
              color: DT.primaryDark,
              fontFamily: DT.mono,
              fontSize: "0.82rem",
              fontWeight: 600,
            }}>
              → {targetPx.w} × {targetPx.h} pixels @ {dpi} DPI
            </div>
          </div>
        </div>
      )}

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
        <PrimaryButton variant="ghost" onClick={reset} disabled={!file}>Reset</PrimaryButton>
        <PrimaryButton onClick={handleRun} busy={busy} disabled={!file}>
          Resize
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
