import React, { useEffect, useRef, useState } from "react";
import { DT, eyebrow } from "../theme.js";
import { UniversalDropzone } from "../components/UniversalDropzone.jsx";
import { Field, inputStyle, selectStyle } from "../components/Field.jsx";
import { PrimaryButton } from "../components/PrimaryButton.jsx";
import { getPdfPageCount, PdfPasswordRequiredError, renderPdfPageToImage } from "../lib/pdf.js";
import { extensionForMime, stripExtension } from "../lib/download.js";

/**
 * PDF → Image tool. Loads a PDF, counts pages, lets the operator pick which
 * to export, and pushes each resulting image to the output queue.
 *
 * Supports password-protected PDFs: when pdf.js signals an encrypted file we
 * show an inline password field instead of a hard error, and remember the
 * password for the subsequent render calls.
 */
export function PdfToImageTool({ onQueue }) {
  const [file, setFile] = useState(null);
  const [buffer, setBuffer] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [password, setPassword] = useState("");
  const [needsPassword, setNeedsPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [outputMime, setOutputMime] = useState("image/jpeg");
  const [dpi, setDpi] = useState(200);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");
  const passwordInputRef = useRef(null);

  useEffect(() => {
    setSelected(new Set(Array.from({ length: pageCount }, (_, i) => i + 1)));
  }, [pageCount]);

  useEffect(() => {
    if (needsPassword) passwordInputRef.current?.focus();
  }, [needsPassword]);

  /**
   * Probe the page count for a buffer, optionally with a password. Returns
   * { ok: true, count } on success, { ok: false, reason } when locked, and
   * throws for other errors.
   */
  const probe = async (ab, pwd) => {
    try {
      const count = await getPdfPageCount(ab, pwd);
      return { ok: true, count };
    } catch (err) {
      if (err instanceof PdfPasswordRequiredError) {
        return { ok: false, reason: err.reason };
      }
      throw err;
    }
  };

  const handleFiles = async (accepted) => {
    setError("");
    setPasswordError("");
    setPassword("");
    setNeedsPassword(false);

    const first = accepted[0];
    if (!first || first.type !== "application/pdf") {
      setError("Please pick a PDF file.");
      return;
    }
    try {
      const ab = await first.arrayBuffer();
      const result = await probe(ab, "");
      if (!result.ok) {
        // Encrypted — remember the file + buffer so the unlock step can reuse it.
        setFile(first);
        setBuffer(ab);
        setPageCount(0);
        setNeedsPassword(true);
        return;
      }
      setFile(first);
      setBuffer(ab);
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
    setUnlocking(true);
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
      setUnlocking(false);
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
          password: password || undefined,
        });
        const pageStr = String(pageNumber).padStart(2, "0");
        onQueue({
          name: `${base}_page${pageStr}.${ext}`,
          descriptor: `page${pageStr}`,
          ext,
          blob,
          toolId: "pdf_to_image",
          meta: `page ${pageNumber}`,
        });
        done += 1;
        setProgress({ current: done, total: pages.length });
      }
    } catch (err) {
      // If the password changed somewhere between probe and render (e.g. a
      // malformed per-page encryption), fall back to the unlock prompt.
      if (err instanceof PdfPasswordRequiredError) {
        setNeedsPassword(true);
        setPasswordError(err.reason === "incorrect"
          ? "That password didn't unlock every page. Try again."
          : "This PDF needs a password.");
      } else {
        setError(err?.message || "Failed while rendering PDF.");
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
    setSelected(new Set());
    setError("");
    setPassword("");
    setNeedsPassword(false);
    setPasswordError("");
  };

  const showPageGrid = Boolean(file) && !needsPassword && pageCount > 0;

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Heading
        title="PDF to PNG/JPG"
        subtitle="Export selected PDF pages as JPG or PNG at printable DPI. Password-protected PDFs are supported."
      />

      {!file ? (
        <UniversalDropzone
          title="Drop a PDF"
          helper="PDF only · we'll read it locally"
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
          busy={unlocking}
          inputRef={passwordInputRef}
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
              {password ? (
                <span style={{
                  marginLeft: 8,
                  fontFamily: DT.brand,
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: DT.success,
                  background: DT.successSoft,
                  padding: "3px 7px",
                  borderRadius: 999,
                }}>Unlocked</span>
              ) : null}
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
        <PrimaryButton onClick={handleRun} busy={busy} disabled={!showPageGrid || !selected.size}>
          Export {showPageGrid && selected.size ? `${selected.size} page${selected.size === 1 ? "" : "s"}` : ""}
        </PrimaryButton>
      </div>
    </div>
  );
}

/**
 * Inline unlock panel shown when pdf.js reports the PDF is encrypted.
 * Enter submits, Esc cancels back to the intake state.
 *
 * @param {{
 *   file: File,
 *   password: string,
 *   setPassword: (value: string) => void,
 *   onUnlock: () => void,
 *   onCancel: () => void,
 *   error?: string,
 *   busy?: boolean,
 *   inputRef: React.RefObject<HTMLInputElement>,
 * }} props
 */
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
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: DT.primary }}>
          <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
          <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5" />
        </svg>
        <div style={{
          fontFamily: DT.brand,
          fontSize: "0.92rem",
          fontWeight: 700,
          color: DT.primaryDark,
        }}>
          Password required
        </div>
      </div>
      <div style={{ fontFamily: DT.mono, fontSize: "0.80rem", color: DT.textMuted, wordBreak: "break-all" }}>
        {file.name}
      </div>
      <div style={{ fontFamily: DT.font, fontSize: "0.82rem", color: DT.text }}>
        This PDF is encrypted. Enter its password below — it stays on this device.
      </div>

      <Field label="PDF password">
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 0,
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
            spellCheck={false}
            placeholder="Enter password"
            style={{ ...inputStyle, border: "none", borderRadius: 0 }}
          />
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            title={reveal ? "Hide password" : "Show password"}
            style={{
              padding: "0 12px",
              borderLeft: `1px solid ${DT.borderSoft}`,
              background: DT.surfaceMuted,
              color: DT.textMuted,
              fontFamily: DT.brand,
              fontSize: "0.64rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            {reveal ? "Hide" : "Show"}
          </button>
        </div>
      </Field>

      {error ? (
        <div style={{
          padding: "8px 10px",
          borderRadius: DT.rSm,
          background: DT.dangerSoft,
          color: DT.danger,
          fontFamily: DT.font,
          fontSize: "0.82rem",
        }}>{error}</div>
      ) : null}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <PrimaryButton variant="ghost" onClick={onCancel} disabled={busy}>Cancel</PrimaryButton>
        <PrimaryButton onClick={onUnlock} busy={busy} disabled={!password}>
          Unlock PDF
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
