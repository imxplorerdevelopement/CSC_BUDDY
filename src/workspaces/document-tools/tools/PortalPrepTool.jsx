import React, { useMemo, useState } from "react";
import { DT, eyebrow } from "../theme.js";
import { UniversalDropzone } from "../components/UniversalDropzone.jsx";
import { Field, selectStyle } from "../components/Field.jsx";
import { PrimaryButton } from "../components/PrimaryButton.jsx";
import { formatBytes, percentReduction } from "../lib/formatBytes.js";
import { stripExtension } from "../lib/download.js";
import { groupPresetsByKind, PORTAL_PRESET_MAP, PORTAL_PRESETS } from "../state/presets.js";
import { prepareForPortal } from "../lib/portalPrep.js";

/**
 * Portal Prep — pick a portal, drop a file, get a portal-ready output.
 *
 * This is the highest-value tool on the dashboard. Instead of asking the
 * operator to remember "Aadhaar wants 3.5×4.5 cm, 20–50 KB, JPG", they pick
 * "Aadhaar Update — Photo" and the engine chains resize → compress → format
 * for them. The tool reuses the same primitives as Resize and Compress —
 * presets are the only new surface.
 *
 * @param {{ onQueue: (entry: { name: string, blob: Blob, toolId: string, meta?: string }) => any }} props
 */
export function PortalPrepTool({ onQueue, initialPresetId }) {
  const [presetId, setPresetId] = useState(
    initialPresetId && PORTAL_PRESET_MAP[initialPresetId]
      ? initialPresetId
      : PORTAL_PRESETS[0]?.id || "",
  );
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const groups = useMemo(() => groupPresetsByKind(), []);
  const preset = PORTAL_PRESET_MAP[presetId];

  const handleFiles = (accepted) => {
    setError("");
    setResult(null);
    const first = accepted[0];
    if (!first || !String(first.type).startsWith("image/")) {
      setError("Please pick an image (JPG, PNG, or WEBP).");
      return;
    }
    setFile(first);
  };

  const handleRun = async () => {
    if (!file || !preset) return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const prep = await prepareForPortal(file, preset);
      const name = `${stripExtension(file.name)}_${preset.id}.${preset.ext}`;
      onQueue({
        name,
        blob: prep.blob,
        toolId: "portal_prep",
        meta: `${preset.portal} · ${Math.round(prep.finalBytes / 1024)} KB`,
      });
      setResult(prep);
    } catch (err) {
      setError(err?.message || "Could not prepare this file.");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError("");
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Heading
        title="Portal Prep"
        subtitle="Pick a portal, drop a file, get a portal-ready output. We handle the size, dimensions, and format for you."
      />

      <Field
        label="Portal / Document"
        hint={preset ? `${preset.portal} · ${preset.notes}` : "Choose which portal this file is for."}
      >
        <select value={presetId} onChange={(e) => { setPresetId(e.target.value); setResult(null); }} style={selectStyle}>
          {groups.map((group) => (
            <optgroup key={group.kind} label={group.label}>
              {group.items.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </Field>

      {preset ? <PresetSummary preset={preset} /> : null}

      <UniversalDropzone
        title={file ? file.name : "Drop the customer file here"}
        helper={file
          ? `${formatBytes(file.size)} · ready to prepare`
          : "JPG · PNG · WEBP"}
        accept="image/jpeg,image/png,image/webp,image/jpg"
        onFiles={handleFiles}
      />

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

      {result ? <ResultCard result={result} preset={preset} /> : null}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <PrimaryButton variant="ghost" onClick={reset} disabled={!file && !result}>Reset</PrimaryButton>
        <PrimaryButton onClick={handleRun} busy={busy} disabled={!file || !preset}>
          Prepare for {preset?.portal?.split(" / ")[0] || "portal"}
        </PrimaryButton>
      </div>
    </div>
  );
}

/**
 * Compact spec row showing the chosen portal's constraints. Keeps operators
 * oriented on what the output will look like before they run the job.
 * @param {{ preset: import("../state/presets.js").PortalPreset }} props
 */
function PresetSummary({ preset }) {
  const rows = [
    preset.widthCm && preset.heightCm ? { label: "Size", value: `${preset.widthCm} × ${preset.heightCm} cm` } : null,
    preset.dpi ? { label: "DPI", value: `${preset.dpi}` } : null,
    preset.targetMinKB || preset.targetMaxKB ? {
      label: "File size",
      value: preset.targetMinKB && preset.targetMaxKB
        ? `${preset.targetMinKB}–${preset.targetMaxKB} KB`
        : preset.targetMaxKB
          ? `up to ${preset.targetMaxKB} KB`
          : `≥ ${preset.targetMinKB} KB`,
    } : null,
    { label: "Format", value: preset.ext.toUpperCase() },
  ].filter(Boolean);

  return (
    <div style={{
      border: `1px solid ${DT.borderSoft}`,
      borderRadius: DT.rMd,
      background: DT.surfaceMuted,
      padding: "10px 12px",
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
      gap: 8,
    }}>
      {rows.map((row) => (
        <div key={row.label} style={{ display: "grid", gap: 2 }}>
          <span style={{ ...eyebrow, color: DT.textSubtle }}>{row.label}</span>
          <span style={{ fontFamily: DT.mono, fontSize: "0.82rem", color: DT.text, fontWeight: 600 }}>
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function ResultCard({ result, preset }) {
  const successfulSize = preset.targetMaxKB
    ? result.finalBytes <= preset.targetMaxKB * 1024
    : true;

  return (
    <div style={{
      border: `1px solid ${successfulSize ? DT.borderSoft : DT.border}`,
      borderRadius: DT.rMd,
      background: DT.surfaceMuted,
      padding: 12,
      display: "grid",
      gap: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ ...eyebrow, color: DT.textSubtle }}>Run summary</div>
        <span style={{
          fontFamily: DT.brand,
          fontSize: "0.62rem",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: successfulSize ? DT.success : DT.warning,
          background: successfulSize ? DT.successSoft : DT.warningSoft,
          padding: "3px 7px",
          borderRadius: 999,
        }}>
          {successfulSize ? "Portal-ready" : "Best effort"}
        </span>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: 8,
        fontFamily: DT.mono,
        fontSize: "0.80rem",
        color: DT.text,
      }}>
        <Stat label="From" value={formatBytes(result.originalBytes)} />
        <Stat label="To" value={`${formatBytes(result.finalBytes)} (-${percentReduction(result.originalBytes, result.finalBytes)}%)`} />
        {result.width && result.height ? (
          <Stat label="Dimensions" value={`${result.width} × ${result.height}px`} />
        ) : null}
      </div>

      {result.steps.length ? (
        <ul style={{
          margin: 0,
          paddingLeft: 18,
          color: DT.textMuted,
          fontFamily: DT.font,
          fontSize: "0.78rem",
          lineHeight: 1.55,
        }}>
          {result.steps.map((step, i) => <li key={i}>{step}</li>)}
        </ul>
      ) : null}

      {result.warnings.map((warning, i) => (
        <div key={i} style={{
          padding: "8px 10px",
          borderRadius: DT.rSm,
          background: DT.warningSoft,
          color: DT.warning,
          fontFamily: DT.font,
          fontSize: "0.80rem",
        }}>{warning}</div>
      ))}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ display: "grid", gap: 2 }}>
      <span style={{ ...eyebrow, color: DT.textSubtle }}>{label}</span>
      <span style={{ fontFamily: DT.mono, fontSize: "0.84rem", color: DT.text, fontWeight: 600 }}>
        {value}
      </span>
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
