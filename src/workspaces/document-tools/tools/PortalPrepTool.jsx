import React, { useCallback, useRef, useState } from "react";
import { DT, eyebrow } from "../theme.js";
import { PrimaryButton } from "../components/PrimaryButton.jsx";
import { formatBytes } from "../lib/formatBytes.js";
import { prepareForPortal } from "../lib/portalPrep.js";
import { stripExtension } from "../lib/download.js";

// ─── Preset definitions ───────────────────────────────────────────────────────

const SERVICE_GROUPS = [
  { id: "certificates", label: "Certificates" },
  { id: "pan_card", label: "PAN Card" },
  { id: "aadhaar_card", label: "Aadhaar Card" },
];

/**
 * Each slot describes one required upload box.
 * `preset` is the portal-prep spec applied when processing.
 */
const GROUP_SLOTS = {
  certificates: [
    {
      id: "photo",
      label: "Photo",
      hint: "45 KB · JPG",
      accept: "image/jpeg,image/jpg,image/png,image/webp",
      kind: "image",
      preset: { mime: "image/jpeg", ext: "jpg", targetMaxKB: 45 },
    },
    {
      id: "aadhaar",
      label: "Aadhaar Card",
      hint: "95 KB · JPG",
      accept: "image/jpeg,image/jpg,image/png,image/webp",
      kind: "image",
      preset: { mime: "image/jpeg", ext: "jpg", targetMaxKB: 95 },
    },
    {
      id: "self_declaration",
      label: "Self Declaration Form",
      hint: "95 KB · JPG",
      accept: "image/jpeg,image/jpg,image/png,image/webp",
      kind: "image",
      preset: { mime: "image/jpeg", ext: "jpg", targetMaxKB: 95 },
    },
    {
      id: "other1",
      label: "Other Document 1",
      hint: "95 KB · JPG",
      accept: "image/jpeg,image/jpg,image/png,image/webp",
      kind: "image",
      preset: { mime: "image/jpeg", ext: "jpg", targetMaxKB: 95 },
    },
    {
      id: "other2",
      label: "Other Document 2",
      hint: "95 KB · JPG",
      accept: "image/jpeg,image/jpg,image/png,image/webp",
      kind: "image",
      preset: { mime: "image/jpeg", ext: "jpg", targetMaxKB: 95 },
    },
    {
      id: "other3",
      label: "Other Document 3",
      hint: "95 KB · JPG",
      accept: "image/jpeg,image/jpg,image/png,image/webp",
      kind: "image",
      preset: { mime: "image/jpeg", ext: "jpg", targetMaxKB: 95 },
    },
  ],
  pan_card: [
    {
      id: "photo",
      label: "Photo",
      hint: "3.5 × 2.5 cm · 45 KB · JPG · 200 DPI",
      accept: "image/jpeg,image/jpg,image/png,image/webp",
      kind: "image",
      preset: {
        mime: "image/jpeg",
        ext: "jpg",
        widthCm: 3.5,
        heightCm: 2.5,
        dpi: 200,
        targetMaxKB: 45,
      },
    },
    {
      id: "signature",
      label: "Signature",
      hint: "2 × 4.5 cm · 45 KB · JPG · 200 DPI",
      accept: "image/jpeg,image/jpg,image/png,image/webp",
      kind: "image",
      preset: {
        mime: "image/jpeg",
        ext: "jpg",
        widthCm: 2,
        heightCm: 4.5,
        dpi: 200,
        targetMaxKB: 45,
      },
    },
    {
      id: "aadhaar",
      label: "Aadhaar Card",
      hint: "290 KB · PDF",
      accept: "application/pdf",
      kind: "pdf",
      preset: null, // PDF pass-through — compress if image, else send as-is
    },
    {
      id: "birth_proof",
      label: "Birth Proof",
      hint: "290 KB · PDF",
      accept: "application/pdf",
      kind: "pdf",
      preset: null,
    },
  ],
  aadhaar_card: [
    {
      id: "aadhaar",
      label: "Aadhaar Card",
      hint: "950 KB · PDF",
      accept: "application/pdf",
      kind: "pdf",
      preset: null,
    },
  ],
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Portal Prep — select a service group (Certificates / PAN Card / Aadhaar Card),
 * upload each required document into its labelled box, click once, and receive
 * all portal-ready files in the output queue.
 *
 * @param {{ onQueue: (entry: any) => any, initialPresetId?: string }} props
 */
export function PortalPrepTool({ onQueue }) {
  const [groupId, setGroupId] = useState("certificates");
  const [files, setFiles] = useState({}); // { slotId: File }
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null); // { current, total, label }
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const slots = GROUP_SLOTS[groupId] || [];
  const group = SERVICE_GROUPS.find((g) => g.id === groupId);

  const handleGroupChange = (id) => {
    setGroupId(id);
    setFiles({});
    setDone(false);
    setError("");
    setProgress(null);
  };

  const setSlotFile = (slotId, file) => {
    setFiles((prev) => ({ ...prev, [slotId]: file }));
    setDone(false);
    setError("");
  };

  const clearSlotFile = (slotId) => {
    setFiles((prev) => {
      const next = { ...prev };
      delete next[slotId];
      return next;
    });
    setDone(false);
  };

  const uploadedCount = slots.filter((s) => files[s.id]).length;
  const allUploaded = uploadedCount === slots.length;

  const handleRun = async () => {
    if (!uploadedCount) return;
    setBusy(true);
    setError("");
    setDone(false);
    setProgress({ current: 0, total: uploadedCount, label: "" });

    const slotsWithFiles = slots.filter((s) => files[s.id]);
    let processed = 0;

    try {
      for (const slot of slotsWithFiles) {
        const file = files[slot.id];
        setProgress({ current: processed, total: slotsWithFiles.length, label: slot.label });

        if (slot.kind === "pdf" || !slot.preset) {
          // PDF pass-through — send as-is
          const ext = "pdf";
          const descriptor = `${groupId}_${slot.id}`;
          onQueue({
            name: `${stripExtension(file.name)}_${descriptor}.${ext}`,
            descriptor,
            ext,
            blob: file,
            toolId: "portal_prep",
            meta: `${group.label} · ${slot.label} · PDF`,
          });
        } else {
          // Image — run through portal prep pipeline
          // eslint-disable-next-line no-await-in-loop
          const prep = await prepareForPortal(file, slot.preset);
          const descriptor = `${groupId}_${slot.id}`;
          onQueue({
            name: `${stripExtension(file.name)}_${descriptor}.${slot.preset.ext}`,
            descriptor,
            ext: slot.preset.ext,
            blob: prep.blob,
            toolId: "portal_prep",
            meta: `${group.label} · ${slot.label} · ${Math.round(prep.finalBytes / 1024)} KB`,
          });
        }

        processed += 1;
        setProgress({ current: processed, total: slotsWithFiles.length, label: slot.label });
      }

      setDone(true);
    } catch (err) {
      setError(err?.message || "Could not prepare one or more files.");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const reset = () => {
    setFiles({});
    setDone(false);
    setError("");
    setProgress(null);
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Heading />

      {/* Service group selector */}
      <div style={{ display: "grid", gap: 6 }}>
        <div style={{ ...eyebrow }}>Select service</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {SERVICE_GROUPS.map((g) => {
            const active = g.id === groupId;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => handleGroupChange(g.id)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 999,
                  border: `1.5px solid ${active ? DT.primary : DT.border}`,
                  background: active ? DT.primarySoft : DT.surface,
                  color: active ? DT.primary : DT.textMuted,
                  fontFamily: DT.brand,
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  cursor: "pointer",
                  transition: "all 120ms ease",
                }}
              >
                {g.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Document upload boxes */}
      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
          <div style={{ ...eyebrow }}>Upload documents</div>
          <span style={{
            fontFamily: DT.mono,
            fontSize: "0.72rem",
            color: uploadedCount === slots.length ? DT.success : DT.textMuted,
            fontWeight: 600,
          }}>
            {uploadedCount} / {slots.length} uploaded
          </span>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 8,
        }}>
          {slots.map((slot) => (
            <DocumentBox
              key={slot.id}
              slot={slot}
              file={files[slot.id] || null}
              onFile={(f) => setSlotFile(slot.id, f)}
              onClear={() => clearSlotFile(slot.id)}
            />
          ))}
        </div>
      </div>

      {/* Progress */}
      {progress ? (
        <div style={{
          padding: "9px 12px",
          borderRadius: DT.rSm,
          background: DT.primarySoft,
          color: DT.primaryDark,
          fontFamily: DT.mono,
          fontSize: "0.80rem",
        }}>
          Processing {progress.label} ({progress.current} / {progress.total})…
        </div>
      ) : null}

      {/* Error */}
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

      {/* Done confirmation */}
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
          All files processed and added to Output Queue.
        </div>
      ) : null}

      {/* Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <PrimaryButton variant="ghost" onClick={reset} disabled={uploadedCount === 0 && !done}>
          Reset
        </PrimaryButton>
        <PrimaryButton onClick={handleRun} busy={busy} disabled={uploadedCount === 0}>
          {allUploaded
            ? `Prepare all ${slots.length} documents`
            : uploadedCount > 0
              ? `Prepare ${uploadedCount} document${uploadedCount === 1 ? "" : "s"}`
              : "Upload files to prepare"}
        </PrimaryButton>
      </div>
    </div>
  );
}

// ─── DocumentBox ──────────────────────────────────────────────────────────────

/**
 * Single document upload slot with drag-and-drop and click-to-browse.
 */
function DocumentBox({ slot, file, onFile, onClear }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer?.files?.[0];
    if (dropped) onFile(dropped);
  }, [onFile]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleInputChange = (e) => {
    const picked = e.target.files?.[0];
    if (picked) onFile(picked);
    e.target.value = "";
  };

  const borderColor = dragging ? DT.primary : file ? DT.borderAccent : DT.border;
  const bgColor = dragging ? DT.primarySoft : file ? DT.successSoft : DT.surfaceMuted;

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      style={{
        border: `1.5px dashed ${borderColor}`,
        borderRadius: DT.rMd,
        background: bgColor,
        padding: "12px 10px",
        display: "grid",
        gap: 6,
        cursor: "pointer",
        transition: "all 120ms ease",
        minHeight: 90,
      }}
      onClick={() => !file && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={slot.accept}
        style={{ display: "none" }}
        onChange={handleInputChange}
      />

      {/* Slot label + hint */}
      <div>
        <div style={{
          fontFamily: DT.brand,
          fontSize: "0.82rem",
          fontWeight: 700,
          color: file ? DT.success : DT.text,
          letterSpacing: "0.02em",
        }}>
          {slot.label}
        </div>
        <div style={{
          fontFamily: DT.mono,
          fontSize: "0.68rem",
          color: DT.textSubtle,
          marginTop: 2,
        }}>
          {slot.hint}
        </div>
      </div>

      {/* File state */}
      {file ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
          <div style={{
            fontFamily: DT.mono,
            fontSize: "0.70rem",
            color: DT.success,
            fontWeight: 600,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {file.name} · {formatBytes(file.size)}
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            style={{
              flexShrink: 0,
              padding: "2px 7px",
              borderRadius: 999,
              border: `1px solid ${DT.borderSoft}`,
              background: DT.surface,
              color: DT.textMuted,
              fontFamily: DT.brand,
              fontSize: "0.60rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        </div>
      ) : (
        <div style={{
          fontFamily: DT.font,
          fontSize: "0.74rem",
          color: DT.textMuted,
        }}>
          Drop here or click to browse
        </div>
      )}
    </div>
  );
}

// ─── Heading ──────────────────────────────────────────────────────────────────

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
      }}>
        Portal Prep
      </div>
      <div style={{
        fontFamily: DT.font,
        fontSize: "0.88rem",
        color: DT.textMuted,
        marginTop: 4,
      }}>
        Select a service, upload all required documents, click once — all portal-ready files appear in the Output Queue.
      </div>
    </div>
  );
}
