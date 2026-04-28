import React, { useEffect, useRef, useState } from "react";
import { DT, eyebrow } from "../theme.js";
import { UniversalDropzone } from "../components/UniversalDropzone.jsx";
import { Field, selectStyle } from "../components/Field.jsx";
import { PrimaryButton } from "../components/PrimaryButton.jsx";
import { getPdfPageCount, PdfPasswordRequiredError, renderPdfPageToImage } from "../lib/pdf.js";
import { buildDocxFromImages } from "../lib/docx.js";
import { stripExtension } from "../lib/download.js";
import { formatBytes } from "../lib/formatBytes.js";

export function PdfToWordTool({ onQueue }) {
  const [file, setFile] = useState(null);
  const [buffer, setBuffer] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [password, setPassword] = useState("");
  const [needsPassword, setNeedsPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [dpi, setDpi] = useState(150);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const passwordInputRef = useRef(null);

  useEffect(() => {
    if (needsPassword) passwordInputRef.current?.focus();
  }, [needsPassword]);

  const probe = async (ab, pwd) => {
    try {
      const count = await getPdfPageCount(ab, pwd);
      return { ok: true, count };
    } catch (err) {
      if (err instanceof PdfPasswordRequiredError) return { ok: false, reason: err.reason };
      throw err;
    }
  };

  const handleFiles = async (accepted) => {
    setError("");
    setPasswordError("");
    setPassword("");
    setNeedsPassword(false);
    setDone(false);
    const first = accepted[0];
    const name = String(first?.name || "").toLowerCase();
    if (!first || (first.type !== "application/pdf" && !name.endsWith(".pdf"))) {
      setError("Please pick a PDF file.");
      return;
    }
    try {
      const ab = await first.arrayBuffer();
      const result = await probe(ab, "");
      setFile(first);
      setBuffer(ab);
      if (!result.ok) {
        setPageCount(0);
        setNeedsPassword(true);
        return;
      }
      setPageCount(result.count);
    } catch (err) {
      setError(err?.message || "Could not read this PDF.");
    }
  };

  const handleUnlock = async () => {
    if (!buffer) return;
    if (!password) {
      setPasswordError("Enter the PDF password.");
      return;
    }
    setBusy(true);
    setPasswordError("");
    try {
      const result = await probe(buffer, password);
      if (!result.ok) {
        setPasswordError(result.reason === "incorrect"
          ? "That password didn't unlock the PDF. Try again."
          : "This PDF still needs a password.");
        passwordInputRef.current?.select();
        return;
      }
      setPageCount(result.count);
      setNeedsPassword(false);
    } catch (err) {
      setPasswordError(err?.message || "Could not unlock this PDF.");
    } finally {
      setBusy(false);
    }
  };

  const handleRun = async () => {
    if (!file || !buffer || !pageCount) return;
    setBusy(true);
    setDone(false);
    setError("");
    setProgress({ current: 0, total: pageCount });
    try {
      const images = [];
      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        // eslint-disable-next-line no-await-in-loop
        const rendered = await renderPdfPageToImage(buffer, pageNumber, {
          dpi,
          mime: "image/jpeg",
          quality: 0.9,
          password: password || undefined,
        });
        images.push({
          blob: rendered.blob,
          mime: "image/jpeg",
          width: rendered.width,
          height: rendered.height,
          alt: `Page ${pageNumber}`,
        });
        setProgress({ current: pageNumber, total: pageCount });
      }

      const docxBlob = await buildDocxFromImages(images);
      const base = stripExtension(file.name);
      onQueue({
        name: `${base}.docx`,
        descriptor: "pdf_to_word",
        ext: "docx",
        blob: docxBlob,
        toolId: "pdf_to_word",
        meta: `${pageCount} page${pageCount === 1 ? "" : "s"} · DOCX`,
      });
      setDone(true);
    } catch (err) {
      if (err instanceof PdfPasswordRequiredError) {
        setNeedsPassword(true);
        setPasswordError(err.reason === "incorrect"
          ? "That password did not unlock every page. Try again."
          : "This PDF needs a password.");
      } else {
        setError(err?.message || "Could not convert this PDF to Word.");
      }
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const reset = () => {
    setFile(null);
    setBuffer(null);
    setPageCount(0);
    setPassword("");
    setNeedsPassword(false);
    setPasswordError("");
    setError("");
    setDone(false);
    setProgress(null);
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Heading />

      {!file ? (
        <UniversalDropzone
          title="Drop a PDF"
          helper="PDF only"
          accept="application/pdf"
          onFiles={handleFiles}
        />
      ) : needsPassword ? (
        <PasswordPanel
          file={file}
          password={password}
          setPassword={setPassword}
          onUnlock={handleUnlock}
          onCancel={reset}
          error={passwordError}
          busy={busy}
          inputRef={passwordInputRef}
        />
      ) : (
        <div style={{
          border: `1px solid ${DT.borderSoft}`,
          borderRadius: DT.rMd,
          background: DT.surfaceMuted,
          padding: 10,
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
        }}>
          <div style={{ display: "grid", gap: 2, minWidth: 0 }}>
            <span style={{ fontFamily: DT.mono, fontSize: "0.84rem", color: DT.text, fontWeight: 700, wordBreak: "break-all" }}>
              {file.name}
            </span>
            <span style={{ fontFamily: DT.mono, fontSize: "0.74rem", color: DT.textMuted }}>
              {pageCount} page{pageCount === 1 ? "" : "s"} · {formatBytes(file.size)}
            </span>
          </div>
          <PrimaryButton variant="ghost" onClick={reset} disabled={busy}>Change file</PrimaryButton>
        </div>
      )}

      <Field label="Page image quality">
        <select value={dpi} onChange={(e) => setDpi(Number(e.target.value))} style={selectStyle}>
          <option value={120}>Compact DOCX</option>
          <option value={150}>Balanced</option>
          <option value={200}>Sharper</option>
        </select>
      </Field>

      {progress ? (
        <div style={{
          padding: "8px 12px",
          borderRadius: DT.rSm,
          background: DT.primarySoft,
          color: DT.primaryDark,
          fontFamily: DT.mono,
          fontSize: "0.82rem",
        }}>
          Rendering page {progress.current} of {progress.total}...
        </div>
      ) : null}

      {error ? <ErrorBar message={error} /> : null}

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
          Word document created and added to Output Queue.
        </div>
      ) : null}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <PrimaryButton variant="ghost" onClick={reset} disabled={!file && !done}>Reset</PrimaryButton>
        <PrimaryButton onClick={handleRun} busy={busy} disabled={!file || needsPassword || !pageCount}>
          Convert to Word
        </PrimaryButton>
      </div>
    </div>
  );
}

function PasswordPanel({ file, password, setPassword, onUnlock, onCancel, error, busy, inputRef }) {
  const [reveal, setReveal] = useState(false);
  return (
    <div style={{
      border: `1px solid ${DT.borderAccent}`,
      borderRadius: DT.rMd,
      padding: 14,
      background: DT.primarySoft,
      display: "grid",
      gap: 10,
    }}>
      <div style={{ fontFamily: DT.brand, fontSize: "0.92rem", fontWeight: 700, color: DT.primaryDark }}>
        Password required
      </div>
      <div style={{ fontFamily: DT.mono, fontSize: "0.80rem", color: DT.textMuted, wordBreak: "break-all" }}>
        {file.name}
      </div>
      <Field label="PDF password">
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          border: `1px solid ${DT.border}`,
          borderRadius: DT.rSm,
          background: DT.surface,
          overflow: "hidden",
        }}>
          <input
            ref={inputRef}
            type={reveal ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); onUnlock(); }
              if (e.key === "Escape") { e.preventDefault(); onCancel(); }
            }}
            autoComplete="off"
            placeholder="Enter password"
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              padding: "10px 12px",
              fontFamily: DT.font,
              fontSize: "0.86rem",
              color: DT.text,
            }}
          />
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            style={{
              padding: "0 12px",
              border: "none",
              borderLeft: `1px solid ${DT.borderSoft}`,
              background: DT.surfaceMuted,
              color: DT.textMuted,
              fontFamily: DT.brand,
              fontSize: "0.64rem",
              fontWeight: 700,
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            {reveal ? "Hide" : "Show"}
          </button>
        </div>
      </Field>
      {error ? <ErrorBar message={error} /> : null}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <PrimaryButton variant="ghost" onClick={onCancel} disabled={busy}>Cancel</PrimaryButton>
        <PrimaryButton onClick={onUnlock} busy={busy} disabled={!password}>Unlock PDF</PrimaryButton>
      </div>
    </div>
  );
}

function Heading() {
  return (
    <div>
      <div style={eyebrow}>Active tool</div>
      <div style={{ fontFamily: DT.brand, fontSize: "1.15rem", fontWeight: 700, color: DT.text, marginTop: 2 }}>
        PDF to Word
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
      color: DT.danger,
      fontFamily: DT.font,
      fontSize: "0.84rem",
    }}>{message}</div>
  );
}
