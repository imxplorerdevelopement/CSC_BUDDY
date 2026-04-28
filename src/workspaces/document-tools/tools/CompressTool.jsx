import React, { useMemo, useState } from "react";
import { DT, eyebrow } from "../theme.js";
import { UniversalDropzone } from "../components/UniversalDropzone.jsx";
import { Field, inputStyle, selectStyle } from "../components/Field.jsx";
import { PrimaryButton } from "../components/PrimaryButton.jsx";
import { formatBytes, percentReduction } from "../lib/formatBytes.js";
import { compressToTargetKB } from "../lib/compress.js";
import { extensionForMime, stripExtension } from "../lib/download.js";
import { buildPdfFromImages, compressPdfToTargetKB, PdfPasswordRequiredError } from "../lib/pdf.js";

const SIZE_PRESETS_KB = [20, 50, 100, 300, 500];

const UNDERSHOOT_KB = {
  20: 17,
  50: 46,
  100: 96,
  300: 296,
  500: 496,
};

const OUTPUT_FORMATS = [
  { value: "image/jpeg", label: "JPG (Smallest)" },
  { value: "image/png", label: "PNG (Lossless)" },
  { value: "application/pdf", label: "PDF" },
];

function isPdf(file) {
  const type = String(file?.type || "").toLowerCase();
  const name = String(file?.name || "").toLowerCase();
  return type === "application/pdf" || name.endsWith(".pdf");
}

function isSupportedInput(file) {
  const type = String(file?.type || "").toLowerCase();
  const name = String(file?.name || "").toLowerCase();
  return isPdf(file)
    || type === "image/jpeg"
    || type === "image/jpg"
    || type === "image/png"
    || /\.(jpe?g|png)$/i.test(name);
}

export function CompressTool({ onQueue }) {
  const [files, setFiles] = useState([]);
  const [targetKB, setTargetKB] = useState(50);
  const [outputMime, setOutputMime] = useState("image/jpeg");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState([]);

  const totalOriginalBytes = useMemo(
    () => files.reduce((sum, f) => sum + (f.size || 0), 0),
    [files],
  );
  const hasPdf = files.some(isPdf);

  const handleFiles = (accepted) => {
    setError("");
    setResults([]);
    const supported = accepted.filter(isSupportedInput);
    if (!supported.length) {
      setError("Please pick PDF, PNG, JPG, or JPEG files.");
      return;
    }
    if (supported.length !== accepted.length) {
      setError("Some files were skipped because only PDF, PNG, JPG, and JPEG are supported.");
    }
    setFiles(supported);
  };

  const handleRun = async () => {
    if (!files.length) return;
    if (!targetKB || targetKB <= 0) {
      setError("Enter a custom size in KB.");
      return;
    }

    setBusy(true);
    setError("");
    setResults([]);

    const effectiveTargetKB = UNDERSHOOT_KB[targetKB] ?? Math.max(1, targetKB - 4);
    const completed = [];

    try {
      for (const file of files) {
        if (isPdf(file)) {
          // eslint-disable-next-line no-await-in-loop
          const out = await compressPdfToTargetKB(await file.arrayBuffer(), {
            targetKB: effectiveTargetKB,
          });
          const descriptor = `compressed_${targetKB}kb`;
          const name = `${stripExtension(file.name)}_${targetKB}kb.pdf`;
          onQueue({
            name,
            descriptor,
            ext: "pdf",
            blob: out.blob,
            toolId: "compress",
            meta: out.reachedTarget ? `PDF · ${out.dpi} DPI` : "PDF · best effort",
          });
          completed.push({
            source: file.name,
            original: file.size,
            final: out.blob.size,
            reachedTarget: out.reachedTarget,
            profile: `${out.dpi} DPI`,
          });
          continue;
        }

        // eslint-disable-next-line no-await-in-loop
        const out = await compressToTargetKB(file, {
          targetKB: effectiveTargetKB,
          allowResize: true,
          mime: outputMime === "application/pdf" ? "image/jpeg" : outputMime,
        });

        if (outputMime === "application/pdf") {
          // eslint-disable-next-line no-await-in-loop
          const bytes = await out.blob.arrayBuffer();
          // eslint-disable-next-line no-await-in-loop
          const pdfBlob = await buildPdfFromImages([{
            bytes,
            mime: "image/jpeg",
            width: out.width,
            height: out.height,
            source: file.name,
          }], { pageSize: "Fit" });
          const descriptor = `compressed_${targetKB}kb`;
          const name = `${stripExtension(file.name)}_${targetKB}kb.pdf`;
          onQueue({ name, descriptor, ext: "pdf", blob: pdfBlob, toolId: "compress", meta: `PDF · ~${targetKB} KB` });
          completed.push({
            source: file.name,
            original: file.size,
            final: pdfBlob.size,
            reachedTarget: pdfBlob.size <= targetKB * 1024,
            width: out.width,
            height: out.height,
          });
        } else {
          const ext = extensionForMime(outputMime, "jpg");
          const descriptor = `compressed_${targetKB}kb`;
          const name = `${stripExtension(file.name)}_${targetKB}kb.${ext}`;
          const meta = `-${percentReduction(file.size, out.blob.size)}%`;
          const entry = onQueue({ name, descriptor, ext, blob: out.blob, toolId: "compress", meta });
          completed.push({
            source: file.name,
            original: file.size,
            final: out.blob.size,
            reachedTarget: out.reachedTarget,
            width: out.width,
            height: out.height,
            outputId: entry?.id,
          });
        }
      }
      setResults(completed);
    } catch (err) {
      if (err instanceof PdfPasswordRequiredError) {
        setError("This PDF is password-protected. Remove the password or export an unlocked copy before compressing.");
      } else {
        setError(err?.message || "Compression failed. Try a different file.");
      }
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
      <ToolHeader title="Infinite Compressor" />

      <UniversalDropzone
        title={files.length ? `${files.length} file${files.length === 1 ? "" : "s"} ready` : "Drop file(s) here"}
        helper={files.length ? `Total: ${formatBytes(totalOriginalBytes)}` : "PDF · PNG · JPG · JPEG · batch allowed"}
        accept="application/pdf,image/jpeg,image/png,image/jpg"
        multiple
        onFiles={handleFiles}
      />

      {hasPdf ? (
        <div style={{
          padding: "9px 12px",
          borderRadius: DT.rSm,
          background: DT.primarySoft,
          color: DT.primaryDark,
          fontFamily: DT.font,
          fontSize: "0.82rem",
        }}>
          PDF inputs are rebuilt as compressed PDFs. Image output format applies to PNG/JPG/JPEG inputs.
        </div>
      ) : null}

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <Field label="Custom size (KB)" hint="Enter a number or pick a preset below.">
          <input
            type="number"
            min="5"
            step="5"
            value={targetKB}
            onChange={(e) => setTargetKB(Number(e.target.value) || 0)}
            style={inputStyle}
          />
        </Field>
        <Field label="Output format" hint=" ">
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

function ToolHeader({ title }) {
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
      {results.map((r, i) => (
        <div key={`${r.source}_${i}`} style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 8,
          fontFamily: DT.mono,
          fontSize: "0.78rem",
          color: DT.text,
        }}>
          <span>
            {r.source} -> {formatBytes(r.original)} <span style={{ color: DT.textMuted }}>to</span> {formatBytes(r.final)}
            {r.width && r.height ? ` @ ${r.width}x${r.height}px` : ""}
            {r.profile ? ` @ ${r.profile}` : ""}
            {!r.reachedTarget ? <span style={{ color: DT.textMuted }}> · best effort</span> : null}
          </span>
          <span style={{
            color: DT.success,
            fontWeight: 700,
          }}>
            -{percentReduction(r.original, r.final)}%
          </span>
        </div>
      ))}
    </div>
  );
}
