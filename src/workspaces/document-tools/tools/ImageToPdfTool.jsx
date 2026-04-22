import React, { useEffect, useState } from "react";
import { DT, eyebrow } from "../theme.js";
import { UniversalDropzone } from "../components/UniversalDropzone.jsx";
import { Field, selectStyle } from "../components/Field.jsx";
import { PrimaryButton } from "../components/PrimaryButton.jsx";
import { buildPdfFromImages } from "../lib/pdf.js";
import { loadImage } from "../lib/canvas.js";
import { stripExtension } from "../lib/download.js";
import { formatBytes } from "../lib/formatBytes.js";

const PAGE_SIZES = [
  { value: "Fit", label: "Fit to image (no margins)" },
  { value: "A4", label: "A4" },
  { value: "Letter", label: "Letter" },
  { value: "Legal", label: "Legal" },
];

/**
 * Image → PDF builder. Supports reordering and a single-PDF toggle.
 * Reordering uses two small buttons per row rather than HTML5 drag —
 * far more reliable for the operator persona.
 */
export function ImageToPdfTool({ onQueue }) {
  const [entries, setEntries] = useState([]); // { id, file, url, width, height }
  const [pageSize, setPageSize] = useState("Fit");
  const [combine, setCombine] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => {
    entries.forEach((e) => URL.revokeObjectURL(e.url));
    // We intentionally only run this on unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFiles = async (accepted) => {
    setError("");
    const imageOnly = accepted.filter((f) => /^image\/(jpeg|png|webp|jpg)$/i.test(f.type));
    if (!imageOnly.length) {
      setError("Only JPG, PNG, or WEBP images can go into a PDF.");
      return;
    }
    const loaded = [];
    for (const file of imageOnly) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const info = await loadImage(file);
        loaded.push({
          id: `${file.name}_${file.size}_${Math.random().toString(36).slice(2, 6)}`,
          file,
          url: info.url,
          width: info.width,
          height: info.height,
        });
      } catch (err) {
        setError(err?.message || `Couldn't read ${file.name}.`);
      }
    }
    setEntries((prev) => [...prev, ...loaded]);
  };

  const move = (id, delta) => {
    setEntries((prev) => {
      const idx = prev.findIndex((e) => e.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const target = idx + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const removeOne = (id) => {
    setEntries((prev) => {
      const target = prev.find((e) => e.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((e) => e.id !== id);
    });
  };

  const handleRun = async () => {
    if (!entries.length) return;
    setBusy(true);
    setError("");
    try {
      // Load bytes for each image (pdf-lib needs ArrayBuffer).
      const imageBuffers = [];
      for (const e of entries) {
        // eslint-disable-next-line no-await-in-loop
        const bytes = await e.file.arrayBuffer();
        const mime = /png/i.test(e.file.type) ? "image/png" : "image/jpeg";
        imageBuffers.push({ bytes, mime, width: e.width, height: e.height, source: e.file.name });
      }

      if (combine) {
        const blob = await buildPdfFromImages(imageBuffers, { pageSize, marginPt: pageSize === "Fit" ? 0 : 18 });
        const dateStamp = new Date().toISOString().slice(0, 10);
        const name = entries.length === 1
          ? `${stripExtension(entries[0].file.name)}.pdf`
          : `documents_${dateStamp}.pdf`;
        onQueue({
          name,
          descriptor: `documents_${dateStamp}`,
          ext: "pdf",
          blob,
          toolId: "image_to_pdf",
          meta: `${entries.length} page${entries.length === 1 ? "" : "s"}`,
        });
      } else {
        let index = 0;
        for (const img of imageBuffers) {
          index += 1;
          // eslint-disable-next-line no-await-in-loop
          const blob = await buildPdfFromImages([img], { pageSize, marginPt: pageSize === "Fit" ? 0 : 18 });
          const descriptor = imageBuffers.length > 1
            ? `document_${String(index).padStart(2, "0")}`
            : "document";
          onQueue({
            name: `${stripExtension(img.source)}.pdf`,
            descriptor,
            ext: "pdf",
            blob,
            toolId: "image_to_pdf",
            meta: "1 page",
          });
        }
      }
    } catch (err) {
      setError(err?.message || "Could not build PDF.");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    entries.forEach((e) => URL.revokeObjectURL(e.url));
    setEntries([]);
    setError("");
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Heading
        title="Image to PDF"
        subtitle="Combine one or more images into a clean PDF pack. Reorder using the arrows."
      />

      <UniversalDropzone
        title={entries.length ? `${entries.length} image${entries.length === 1 ? "" : "s"} queued` : "Drop image(s) to bundle"}
        helper="JPG · PNG · WEBP · drop again to append more"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        multiple
        onFiles={handleFiles}
      />

      {entries.length > 0 ? (
        <div style={{ display: "grid", gap: 6 }}>
          {entries.map((e, i) => (
            <div key={e.id} style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr auto auto auto",
              gap: 8,
              alignItems: "center",
              padding: "6px 8px",
              border: `1px solid ${DT.borderSoft}`,
              borderRadius: DT.rSm,
              background: DT.surface,
            }}>
              <img src={e.url} alt="" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6 }} />
              <div style={{ display: "grid", gap: 1 }}>
                <span style={{ fontFamily: DT.mono, fontSize: "0.80rem", color: DT.text, wordBreak: "break-all" }}>{e.file.name}</span>
                <span style={{ fontFamily: DT.mono, fontSize: "0.72rem", color: DT.textMuted }}>
                  #{i + 1} · {e.width}×{e.height}px · {formatBytes(e.file.size)}
                </span>
              </div>
              <MiniBtn onClick={() => move(e.id, -1)} disabled={i === 0}>↑</MiniBtn>
              <MiniBtn onClick={() => move(e.id, 1)} disabled={i === entries.length - 1}>↓</MiniBtn>
              <MiniBtn onClick={() => removeOne(e.id)}>✕</MiniBtn>
            </div>
          ))}
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
        <Field label="Page size" hint="Use Fit for ID scans — it keeps the scan edge-to-edge.">
          <select value={pageSize} onChange={(e) => setPageSize(e.target.value)} style={selectStyle}>
            {PAGE_SIZES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </Field>
        <Field label="Bundle mode" hint="Off = one PDF per image, on = one combined PDF.">
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
            <input type="checkbox" checked={combine} onChange={(e) => setCombine(e.target.checked)} />
            Combine into a single PDF
          </label>
        </Field>
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

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <PrimaryButton variant="ghost" onClick={reset} disabled={!entries.length}>Reset</PrimaryButton>
        <PrimaryButton onClick={handleRun} busy={busy} disabled={!entries.length}>
          Build PDF
        </PrimaryButton>
      </div>
    </div>
  );
}

function MiniBtn({ onClick, children, disabled }) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        width: 28,
        height: 28,
        borderRadius: 6,
        border: `1px solid ${DT.border}`,
        background: disabled ? DT.surfaceMuted : DT.surface,
        color: disabled ? DT.textSubtle : DT.text,
        fontFamily: DT.mono,
        fontSize: "0.78rem",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
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
