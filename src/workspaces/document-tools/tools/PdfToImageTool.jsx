import React, { useEffect, useState } from "react";
import { DT, eyebrow } from "../theme.js";
import { UniversalDropzone } from "../components/UniversalDropzone.jsx";
import { Field, selectStyle } from "../components/Field.jsx";
import { PrimaryButton } from "../components/PrimaryButton.jsx";
import { getPdfPageCount, renderPdfPageToImage } from "../lib/pdf.js";
import { extensionForMime, stripExtension } from "../lib/download.js";

/**
 * PDF → Image tool. Loads a PDF, counts pages, lets operator pick which to export,
 * and pushes each resulting image to the output queue.
 */
export function PdfToImageTool({ onQueue }) {
  const [file, setFile] = useState(null);
  const [buffer, setBuffer] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [selected, setSelected] = useState(new Set());
  const [outputMime, setOutputMime] = useState("image/jpeg");
  const [dpi, setDpi] = useState(200);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setSelected(new Set(Array.from({ length: pageCount }, (_, i) => i + 1)));
  }, [pageCount]);

  const handleFiles = async (accepted) => {
    setError("");
    const first = accepted[0];
    if (!first || first.type !== "application/pdf") {
      setError("Please pick a PDF file.");
      return;
    }
    try {
      const ab = await first.arrayBuffer();
      const count = await getPdfPageCount(ab);
      setFile(first);
      setBuffer(ab);
      setPageCount(count);
    } catch (err) {
      setError(err?.message || "Could not read this PDF.");
    }
  };

  const togglePage = (n) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n); else next.add(n);
      return next;
    });
  };

  const setAllPages = (on) => {
    setSelected(on ? new Set(Array.from({ length: pageCount }, (_, i) => i + 1)) : new Set());
  };

  const handleRun = async () => {
    if (!buffer || !pageCount) return;
    if (!selected.size) {
      setError("Pick at least one page to export.");
      return;
    }
    setBusy(true);
    setError("");
    setProgress({ current: 0, total: selected.size });
    try {
      const pages = Array.from(selected).sort((a, b) => a - b);
      const ext = extensionForMime(outputMime, "jpg");
      const base = stripExtension(file.name);
      let done = 0;
      for (const pageNumber of pages) {
        // eslint-disable-next-line no-await-in-loop
        const { blob } = await renderPdfPageToImage(buffer, pageNumber, {
          dpi,
          mime: outputMime,
          quality: outputMime === "image/jpeg" ? 0.92 : undefined,
        });
        onQueue({
          name: `${base}_page${String(pageNumber).padStart(2, "0")}.${ext}`,
          blob,
          toolId: "pdf_to_image",
          meta: `page ${pageNumber}`,
        });
        done += 1;
        setProgress({ current: done, total: pages.length });
      }
    } catch (err) {
      setError(err?.message || "Failed while rendering PDF.");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const reset = () => {
    setFile(null);
    setBuffer(null);
    setPageCount(0);
    setSelected(new Set());
    setError("");
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Heading
        title="PDF to Image"
        subtitle="Export selected PDF pages as JPG or PNG at printable DPI."
      />

      {!file ? (
        <UniversalDropzone
          title="Drop a PDF"
          helper="PDF only · we'll read it locally"
          accept="application/pdf"
          onFiles={handleFiles}
        />
      ) : (
        <div style={{
          border: `1px solid ${DT.borderSoft}`,
          borderRadius: DT.rMd,
          padding: 10,
          background: DT.surfaceMuted,
          display: "grid",
          gap: 8,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={{ fontFamily: DT.mono, fontSize: "0.86rem", color: DT.text, fontWeight: 600 }}>
              {file.name} — {pageCount} page{pageCount === 1 ? "" : "s"}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <MiniBtn onClick={() => setAllPages(true)}>Select all</MiniBtn>
              <MiniBtn onClick={() => setAllPages(false)}>Clear</MiniBtn>
            </div>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))",
            gap: 6,
            maxHeight: 180,
            overflowY: "auto",
            padding: 4,
          }}>
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => {
              const on = selected.has(n);
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => togglePage(n)}
                  style={{
                    aspectRatio: "1",
                    borderRadius: DT.rSm,
                    border: `1px solid ${on ? DT.primary : DT.border}`,
                    background: on ? DT.primarySoft : DT.surface,
                    color: on ? DT.primary : DT.textMuted,
                    fontFamily: DT.mono,
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
        <Field label="Output format">
          <select value={outputMime} onChange={(e) => setOutputMime(e.target.value)} style={selectStyle}>
            <option value="image/jpeg">JPG</option>
            <option value="image/png">PNG</option>
          </select>
        </Field>
        <Field label="DPI">
          <select value={dpi} onChange={(e) => setDpi(Number(e.target.value))} style={selectStyle}>
            <option value={150}>150 (fast)</option>
            <option value={200}>200 (portal default)</option>
            <option value={300}>300 (print sharp)</option>
          </select>
        </Field>
      </div>

      {progress ? (
        <div style={{
          padding: "8px 12px",
          borderRadius: DT.rSm,
          background: DT.primarySoft,
          color: DT.primaryDark,
          fontFamily: DT.mono,
          fontSize: "0.82rem",
        }}>
          Rendering page {progress.current} of {progress.total}…
        </div>
      ) : null}

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
        <PrimaryButton onClick={handleRun} busy={busy} disabled={!file || !selected.size}>
          Export {selected.size ? `${selected.size} page${selected.size === 1 ? "" : "s"}` : ""}
        </PrimaryButton>
      </div>
    </div>
  );
}

function MiniBtn({ onClick, children }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: "5px 10px",
      borderRadius: 999,
      border: `1px solid ${DT.border}`,
      background: DT.surface,
      color: DT.textMuted,
      fontFamily: DT.brand,
      fontSize: "0.66rem",
      fontWeight: 700,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      cursor: "pointer",
    }}>{children}</button>
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
