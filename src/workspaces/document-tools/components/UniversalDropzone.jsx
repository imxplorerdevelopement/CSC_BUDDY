import React, { useRef, useState } from "react";
import { DT, eyebrow } from "../theme.js";

/**
 * @typedef {Object} DropzoneProps
 * @property {string} [title]
 * @property {string} [helper]
 * @property {string} [accept]          MIME filter string passed to the hidden input
 * @property {boolean} [multiple]
 * @property {(files: File[]) => void} onFiles
 */

/**
 * Drag-and-drop file intake with a click-to-browse fallback. Validates the
 * count/type lightly and defers real validation to the consuming tool.
 *
 * @param {DropzoneProps} props
 */
export function UniversalDropzone({ title, helper, accept, multiple, onFiles }) {
  const inputRef = useRef(null);
  const [active, setActive] = useState(false);

  const emit = (fileList) => {
    const files = Array.from(fileList || []).filter(Boolean);
    if (!files.length) return;
    onFiles(multiple ? files : [files[0]]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setActive(false);
    emit(e.dataTransfer?.files);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setActive(true); }}
      onDragLeave={() => setActive(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      style={{
        border: `2px dashed ${active ? DT.primary : DT.border}`,
        background: active ? DT.primarySoft : DT.surfaceMuted,
        borderRadius: DT.rLg,
        padding: "28px 18px",
        display: "grid",
        gap: 8,
        justifyItems: "center",
        cursor: "pointer",
        transition: "all 120ms ease",
        fontFamily: DT.font,
        color: DT.text,
      }}
    >
      <div style={{ ...eyebrow, color: DT.primary }}>Drop anywhere to start</div>
      <div style={{ fontFamily: DT.brand, fontSize: "1rem", fontWeight: 700 }}>
        {title || "Drop a file here"}
      </div>
      {helper ? (
        <div style={{ fontSize: "0.80rem", color: DT.textSubtle, textAlign: "center" }}>
          {helper}
        </div>
      ) : null}
      <div style={{
        marginTop: 4,
        fontSize: "0.76rem",
        color: DT.primary,
        fontWeight: 600,
        fontFamily: DT.brand,
        letterSpacing: "0.06em",
      }}>
        or click to browse
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple || false}
        onClick={(e) => { e.target.value = ""; }}
        onChange={(e) => emit(e.target.files)}
        style={{ display: "none" }}
      />
    </div>
  );
}
