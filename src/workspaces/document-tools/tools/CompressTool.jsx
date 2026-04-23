import React, { useMemo, useState } from "react";
import { DT, eyebrow } from "../theme.js";
import { UniversalDropzone } from "../components/UniversalDropzone.jsx";
import { Field, inputStyle, selectStyle } from "../components/Field.jsx";
import { PrimaryButton } from "../components/PrimaryButton.jsx";
import { formatBytes, percentReduction } from "../lib/formatBytes.js";
import { compressToTargetKB } from "../lib/compress.js";
import { extensionForMime, stripExtension } from "../lib/download.js";

const SIZE_PRESETS_KB = [20, 50, 100, 300, 500];

// Each preset compresses slightly below the named value to prevent portal
// rejections caused by file-size edge cases.
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

/**
 * Infinite Compressor — custom-KB target with safe auto-resize fallback.
 * Batch friendly; reports per-file reduction and pushes results to the queue.
 *
 * @param {{ onQueue: (entry: { name: string, blob: Blob, toolId: string, meta?: string }) => void }} props
 */
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
      setError("Enter a custom size in KB.");
      return;
    }
    setBusy(true);
    setError("");
    setResults([]);

    // Apply undershoot: if this is a known preset value use the baked-in
    // undershoot; otherwise compress 4 KB below the entered value.
    const effectiveTargetKB = UNDERSHOOT_KB[targetKB] ?? Math.max(1, targetKB - 4);

    const completed = [];
    try {
      for (const file of files) {
        if (outputMime === "application/pdf") {
          // PDF output: compress image first to effectiveTargetKB as JPEG,
          // then wrap it in a one-page PDF using the canvas API.
          // eslint-disable-next-line no-await-in-loop
          const out = await compressToTargetKB(file, {
            targetKB: effectiveTargetKB,
            allowResize: true,
            mime: "image/jpeg",
          });
          // eslint-disable-next-line no-await-in-loop
          const pdfBlob = await imageBlobToPdf(out.blob);
          const ext = "pdf";
          const descriptor = `compressed_${targetKB}kb`;
          const name = `${stripExtension(file.name)}_${targetKB}kb.${ext}`;
          onQueue({ name, descriptor, ext, blob: pdfBlob, toolId: "compress", meta: `PDF · ~${targetKB} KB` });
          completed.push({
            source: file.name,
            original: file.size,
            final: pdfBlob.size,
            reachedTarget: true,
          });
        } else {
          // eslint-disable-next-line no-await-in-loop
          const out = await compressToTargetKB(file, {
            targetKB: effectiveTargetKB,
            allowResize: true,
            mime: outputMime,
          });
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
        title="Infinite Compressor"
        subtitle="Shrink JPG / PNG to a custom size. Output lands slightly below the target to prevent portal rejections."
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
          label="Custom size (KB)"
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

/**
 * Wrap a JPEG blob in a minimal single-page PDF using canvas jsPDF-free approach.
 * Embeds the image as a data URL in a PDF object stream.
 * @param {Blob} jpegBlob
 * @returns {Promise<Blob>}
 */
async function imageBlobToPdf(jpegBlob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const dataUrl = reader.result;
        // Draw onto a canvas then use the browser's built-in PDF print trick
        // via a hidden iframe — but since that requires user interaction, we
        // instead produce a minimal hand-rolled PDF with the JPEG inlined.
        const img = new Image();
        img.onload = () => {
          const w = img.naturalWidth;
          const h = img.naturalHeight;
          // PDF uses 72 pts per inch; scale pixels to pts at 96 DPI equivalent.
          const ptW = (w * 72) / 96;
          const ptH = (h * 72) / 96;

          // Build a minimal valid PDF embedding the JPEG.
          const base64 = dataUrl.split(",")[1];
          const imgBytes = atob(base64).length;

          const objects = [];
          const offsets = [];

          const push = (content) => {
            offsets.push(objects.reduce((sum, o) => sum + o.length, 0) + 9); // 9 = "%PDF-1.4\n"
            objects.push(content);
          };

          push(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`);
          push(`2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`);
          push(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${ptW.toFixed(2)} ${ptH.toFixed(2)}] /Contents 4 0 R /Resources << /XObject << /Im1 5 0 R >> >> >>\nendobj\n`);
          const streamContent = `q\n${ptW.toFixed(2)} 0 0 ${ptH.toFixed(2)} 0 0 cm\n/Im1 Do\nQ\n`;
          push(`4 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}endstream\nendobj\n`);
          push(`5 0 obj\n<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgBytes} >>\nstream\n`);

          const header = "%PDF-1.4\n";
          const headerBuf = new TextEncoder().encode(header);
          const parts = objects.slice(0, 4).map((o) => new TextEncoder().encode(o));
          const obj5Header = new TextEncoder().encode(objects[4]);
          const imgBuf = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
          const obj5Footer = new TextEncoder().encode("\nendstream\nendobj\n");

          // xref + trailer
          const xrefOffset = headerBuf.length + parts.reduce((s, p) => s + p.length, 0)
            + obj5Header.length + imgBuf.length + obj5Footer.length;

          const xrefLines = offsets.map((off, i) => `${String(off).padStart(10, "0")} 00000 n \n`).join("");
          const xref = `xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n${xrefLines}trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
          const xrefBuf = new TextEncoder().encode(xref);

          const totalLen = headerBuf.length + parts.reduce((s, p) => s + p.length, 0)
            + obj5Header.length + imgBuf.length + obj5Footer.length + xrefBuf.length;

          const out = new Uint8Array(totalLen);
          let pos = 0;
          const write = (buf) => { out.set(buf, pos); pos += buf.length; };
          write(headerBuf);
          parts.forEach(write);
          write(obj5Header);
          write(imgBuf);
          write(obj5Footer);
          write(xrefBuf);

          resolve(new Blob([out], { type: "application/pdf" }));
        };
        img.onerror = reject;
        img.src = dataUrl;
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(jpegBlob);
  });
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
            {r.source} → {formatBytes(r.original)} <span style={{ color: DT.textMuted }}>to</span> {formatBytes(r.final)}
            {r.width && r.height ? ` @ ${r.width}×${r.height}px` : ""}
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
