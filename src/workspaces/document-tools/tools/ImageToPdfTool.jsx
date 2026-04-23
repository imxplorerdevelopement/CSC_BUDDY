import React, { useEffect, useRef, useState } from "react";
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
 * Image → PDF builder. Supports a single-PDF toggle plus several reorder
 * ergonomics that scale to 20+ images: HTML5 drag-and-drop (primary),
 * up/down arrows (touch fallback), and jump-to-top / jump-to-bottom (for
 * the long-list case where arrow-clicking is painful).
 */
export function ImageToPdfTool({ onQueue }) {
  const [entries, setEntries] = useState([]); // { id, file, url, width, height }
  const [pageSize, setPageSize] = useState("Fit");
  const [combine, setCombine] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  // Ref lets drag handlers read the current id without re-binding on every render.
  const draggingRef = useRef(null);

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

  /**
   * Pure reorder: remove entry `id` and reinsert it at `toIndex`. Keeps React
   * happy by returning a new array rather than mutating.
   * @param {typeof entries} list
   * @param {string} id
   * @param {number} toIndex
   */
  const reorderTo = (list, id, toIndex) => {
    const fromIndex = list.findIndex((e) => e.id === id);
    if (fromIndex < 0 || fromIndex === toIndex) return list;
    const next = [...list];
    const [moved] = next.splice(fromIndex, 1);
    const clampedTo = Math.max(0, Math.min(next.length, toIndex));
    next.splice(clampedTo, 0, moved);
    return next;
  };

  const jumpToTop = (id) => setEntries((prev) => reorderTo(prev, id, 0));
  const jumpToBottom = (id) => setEntries((prev) => reorderTo(prev, id, prev.length));

  /**
   * Drop `draggingRef.current` above `targetId`. If the drag passes beneath
   * the last row, append — matches what most users expect from a drop near
   * the bottom of a list.
   */
  const handleDrop = (targetId) => {
    const id = draggingRef.current;
    draggingRef.current = null;
    setDraggingId(null);
    setDragOverId(null);
    if (!id || id === targetId) return;
    setEntries((prev) => {
      const targetIdx = targetId === "__end__"
        ? prev.length
        : prev.findIndex((e) => e.id === targetId);
      if (targetIdx < 0) return prev;
      return reorderTo(prev, id, targetIdx);
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
        title="JPG/PNG/JPEG to PDF"
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
        <div>
          {entries.length > 1 ? (
            <div style={{
              fontFamily: DT.font,
              fontSize: "0.74rem",
              color: DT.textSubtle,
              marginBottom: 6,
            }}>
              Drag the <DragDotsIcon inline /> handle to reorder. Use the arrows or ⇈ ⇊ to jump to top / bottom.
            </div>
          ) : null}
          <div style={{ display: "grid", gap: 6 }}>
            {entries.map((e, i) => {
              const isDragging = draggingId === e.id;
              const isDragTarget = dragOverId === e.id && draggingId && draggingId !== e.id;
              return (
                <div
                  key={e.id}
                  draggable
                  onDragStart={(ev) => {
                    draggingRef.current = e.id;
                    setDraggingId(e.id);
                    // Firefox requires setData to actually fire dragover on targets.
                    ev.dataTransfer.effectAllowed = "move";
                    try { ev.dataTransfer.setData("text/plain", e.id); } catch { /* no-op */ }
                  }}
                  onDragOver={(ev) => {
                    if (!draggingRef.current) return;
                    ev.preventDefault();
                    ev.dataTransfer.dropEffect = "move";
                    if (dragOverId !== e.id) setDragOverId(e.id);
                  }}
                  onDragLeave={() => {
                    setDragOverId((prev) => (prev === e.id ? null : prev));
                  }}
                  onDrop={(ev) => {
                    ev.preventDefault();
                    handleDrop(e.id);
                  }}
                  onDragEnd={() => {
                    draggingRef.current = null;
                    setDraggingId(null);
                    setDragOverId(null);
                  }}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto auto 1fr auto auto auto auto auto",
                    gap: 8,
                    alignItems: "center",
                    padding: "6px 8px",
                    border: `1px solid ${isDragTarget ? DT.primary : DT.borderSoft}`,
                    borderRadius: DT.rSm,
                    background: isDragTarget ? DT.primarySoft : DT.surface,
                    opacity: isDragging ? 0.4 : 1,
                    boxShadow: isDragTarget ? "0 0 0 2px rgba(37,99,235,0.18)" : "none",
                    transition: "border-color 120ms ease, background 120ms ease, box-shadow 120ms ease",
                    cursor: "grab",
                    userSelect: "none",
                  }}
                >
                  <DragHandle />
                  <img src={e.url} alt="" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6, pointerEvents: "none" }} />
                  <div style={{ display: "grid", gap: 1, minWidth: 0 }}>
                    <span style={{ fontFamily: DT.mono, fontSize: "0.80rem", color: DT.text, wordBreak: "break-all" }}>{e.file.name}</span>
                    <span style={{ fontFamily: DT.mono, fontSize: "0.72rem", color: DT.textMuted }}>
                      #{i + 1} · {e.width}×{e.height}px · {formatBytes(e.file.size)}
                    </span>
                  </div>
                  <MiniBtn onClick={() => jumpToTop(e.id)} disabled={i === 0} title="Move to top">⇈</MiniBtn>
                  <MiniBtn onClick={() => move(e.id, -1)} disabled={i === 0} title="Move up">↑</MiniBtn>
                  <MiniBtn onClick={() => move(e.id, 1)} disabled={i === entries.length - 1} title="Move down">↓</MiniBtn>
                  <MiniBtn onClick={() => jumpToBottom(e.id)} disabled={i === entries.length - 1} title="Move to bottom">⇊</MiniBtn>
                  <MiniBtn onClick={() => removeOne(e.id)} title="Remove">✕</MiniBtn>
                </div>
              );
            })}
            {/* Invisible end-of-list drop target so dragging past the last row appends cleanly. */}
            {draggingId ? (
              <div
                onDragOver={(ev) => { ev.preventDefault(); ev.dataTransfer.dropEffect = "move"; setDragOverId("__end__"); }}
                onDrop={(ev) => { ev.preventDefault(); handleDrop("__end__"); }}
                onDragLeave={() => setDragOverId((prev) => (prev === "__end__" ? null : prev))}
                style={{
                  height: 18,
                  borderRadius: DT.rSm,
                  border: `1px dashed ${dragOverId === "__end__" ? DT.primary : "transparent"}`,
                  background: dragOverId === "__end__" ? DT.primarySoft : "transparent",
                  transition: "all 120ms ease",
                }}
              />
            ) : null}
          </div>
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

function MiniBtn({ onClick, children, disabled, title }) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={title}
      // Dragging the parent row shouldn't start when the operator clicks a button;
      // stop propagation and also prevent the click being read as a drag-start.
      onMouseDown={(e) => e.stopPropagation()}
      draggable={false}
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

function DragHandle() {
  return (
    <span
      aria-hidden="true"
      title="Drag to reorder"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 20,
        height: 28,
        color: DT.textSubtle,
        cursor: "grab",
        flexShrink: 0,
      }}
    >
      <DragDotsIcon />
    </span>
  );
}

function DragDotsIcon({ inline }) {
  // Six-dot "grip" glyph. `inline` variant is sized for flowing text.
  const size = inline ? 10 : 12;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      aria-hidden="true"
      style={{ verticalAlign: inline ? "middle" : undefined, fill: "currentColor" }}
    >
      <circle cx="4" cy="2.5" r="1" />
      <circle cx="8" cy="2.5" r="1" />
      <circle cx="4" cy="6" r="1" />
      <circle cx="8" cy="6" r="1" />
      <circle cx="4" cy="9.5" r="1" />
      <circle cx="8" cy="9.5" r="1" />
    </svg>
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
