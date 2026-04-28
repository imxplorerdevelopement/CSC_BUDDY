import { canvasToBlob, cmToPixels, drawToCanvas, loadImage } from "./canvas.js";
import { compressToTargetKB } from "./compress.js";

/**
 * Convert an already-compressed Blob straight back into a File-like object so
 * downstream code can treat the intermediate result uniformly.
 * @param {Blob} blob
 * @param {string} filename
 * @returns {File}
 */
function blobToFile(blob, filename) {
  return new File([blob], filename, { type: blob.type });
}

/**
 * Resize an input image to exact physical cm dimensions at the given DPI and
 * return a JPEG blob. Used as the first step when a preset specifies size.
 *
 * @param {File|Blob} file
 * @param {Object} spec
 * @param {number} spec.widthCm
 * @param {number} spec.heightCm
 * @param {number} spec.dpi
 * @param {string} spec.mime
 * @returns {Promise<{ blob: Blob, width: number, height: number }>}
 */
async function resizeToSpec(file, spec) {
  const { image, url } = await loadImage(file);
  try {
    const targetW = Math.max(1, cmToPixels(spec.widthCm, spec.dpi));
    const targetH = Math.max(1, cmToPixels(spec.heightCm, spec.dpi));
    const fill = spec.mime === "image/jpeg" ? "#ffffff" : undefined;
    const canvas = drawToCanvas(image, targetW, targetH, fill);
    const blob = await canvasToBlob(canvas, spec.mime, spec.mime === "image/jpeg" ? 0.95 : undefined);
    return { blob, width: targetW, height: targetH };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Re-encode a file into the target MIME without changing dimensions. Used
 * when a preset has a size target but no physical dimensions.
 *
 * @param {File|Blob} file
 * @param {string} mime
 */
async function reencode(file, mime) {
  const { image, url } = await loadImage(file);
  try {
    const fill = mime === "image/jpeg" ? "#ffffff" : undefined;
    const canvas = drawToCanvas(image, image.naturalWidth, image.naturalHeight, fill);
    const blob = await canvasToBlob(canvas, mime, mime === "image/jpeg" ? 0.95 : undefined);
    return { blob, width: image.naturalWidth, height: image.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * @typedef {Object} PrepResult
 * @property {Blob} blob
 * @property {number} width
 * @property {number} height
 * @property {number} originalBytes
 * @property {number} finalBytes
 * @property {boolean} reachedTarget  whether the size target was satisfied
 * @property {string[]} steps          human-readable log of the steps taken
 * @property {string[]} warnings       non-fatal issues worth surfacing in the UI
 */

/**
 * Prepare a file for a specific portal preset.
 *
 * Order of operations (each step is skipped when not applicable):
 *   1. If the preset has physical dimensions, resize to exact cm × cm at DPI.
 *   2. If the preset has a max KB, compress toward the upper bound (with
 *      safe auto-resize fallback to stay at or under the limit).
 *   3. If the preset has a min KB and we ended up under it, re-encode at a
 *      higher quality to land inside the band.
 *
 * Always returns a PrepResult — throws only for truly unreadable inputs.
 *
 * @param {File} file
 * @param {import("../state/presets.js").PortalPreset} preset
 * @returns {Promise<PrepResult>}
 */
export async function prepareForPortal(file, preset) {
  const steps = [];
  const warnings = [];
  const originalBytes = file.size;

  // Step 1: dimensions (or re-encode-only when no dimensions).
  let workingFile = file;
  let width = 0;
  let height = 0;

  if (preset.widthCm && preset.heightCm && preset.dpi) {
    const { blob, width: w, height: h } = await resizeToSpec(file, {
      widthCm: preset.widthCm,
      heightCm: preset.heightCm,
      dpi: preset.dpi,
      mime: preset.mime,
    });
    workingFile = blobToFile(blob, file.name);
    width = w;
    height = h;
    steps.push(`Resized to ${preset.widthCm}×${preset.heightCm} cm @ ${preset.dpi} DPI (${w}×${h}px)`);
  } else {
    const { blob, width: w, height: h } = await reencode(file, preset.mime);
    workingFile = blobToFile(blob, file.name);
    width = w;
    height = h;
    steps.push(`Re-encoded as ${preset.ext.toUpperCase()} (${w}×${h}px)`);
  }

  let reachedTarget = true;
  let finalBlob = workingFile;

  // Step 2: compress to max.
  if (preset.targetMaxKB) {
    const result = await compressToTargetKB(workingFile, {
      targetKB: preset.targetMaxKB,
      // For preset flows we don't want auto-resize to fight the dimensions we
      // just established. Only let compress auto-resize when dimensions are
      // NOT a preset constraint.
      allowResize: !(preset.widthCm && preset.heightCm),
      mime: preset.mime,
    });
    finalBlob = result.blob;
    reachedTarget = result.reachedTarget;
    width = result.width || width;
    height = result.height || height;
    steps.push(`Compressed toward ${preset.targetMaxKB} KB (landed at ${Math.round(result.blob.size / 1024)} KB)`);
    if (!result.reachedTarget) {
      warnings.push(`Could not reach ${preset.targetMaxKB} KB without changing dimensions. Output is best-effort.`);
    }
  }

  // Step 3: nudge back up if we under-shot the min.
  if (preset.targetMinKB && finalBlob.size < preset.targetMinKB * 1024) {
    // Re-encode current working file at high quality; if that's still too
    // small, surface a warning rather than padding junk data.
    const highQuality = await reencode(blobToFile(finalBlob, file.name), preset.mime);
    if (highQuality.blob.size >= preset.targetMinKB * 1024) {
      finalBlob = highQuality.blob;
      steps.push(`Raised quality to meet ${preset.targetMinKB} KB minimum`);
    } else {
      warnings.push(`Output is ${Math.round(finalBlob.size / 1024)} KB, below the portal's ${preset.targetMinKB} KB minimum. Use a higher-quality source image.`);
    }
  }

  return {
    blob: finalBlob,
    width,
    height,
    originalBytes,
    finalBytes: finalBlob.size,
    reachedTarget,
    steps,
    warnings,
  };
}
