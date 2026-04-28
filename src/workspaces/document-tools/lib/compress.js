import { canvasToBlob, drawToCanvas, loadImage } from "./canvas.js";

/**
 * Produce a JPEG Blob from an image at a given quality, optionally scaling down.
 * Returns {blob, width, height}.
 * @param {HTMLImageElement} image
 * @param {number} quality 0..1
 * @param {number} scale 0..1
 * @param {string} mime "image/jpeg" | "image/png" | "image/webp"
 * @returns {Promise<{ blob: Blob, width: number, height: number }>}
 */
async function encodeAt(image, quality, scale, mime) {
  const w = Math.max(1, Math.round(image.naturalWidth * scale));
  const h = Math.max(1, Math.round(image.naturalHeight * scale));
  const fill = mime === "image/jpeg" ? "#ffffff" : undefined;
  const canvas = drawToCanvas(image, w, h, fill);
  const blob = await canvasToBlob(canvas, mime, quality);
  return { blob, width: w, height: h };
}

/**
 * Compress an image toward a target size in kilobytes using a binary search on
 * JPEG quality. If the target still can't be reached at the source dimensions,
 * progressively reduce the scale. Returns the best result plus diagnostic info.
 *
 * Assumption: the caller already validated that `file` is an image.
 *
 * @param {File|Blob} file
 * @param {Object} options
 * @param {number} options.targetKB
 * @param {boolean} [options.allowResize=true]
 * @param {string} [options.mime="image/jpeg"]
 * @param {number} [options.minQuality=0.30]
 * @param {number} [options.maxQuality=0.95]
 * @param {number} [options.minScale=0.35]
 * @returns {Promise<{ blob: Blob, quality: number, scale: number, width: number, height: number, reachedTarget: boolean }>}
 */
export async function compressToTargetKB(file, options) {
  const {
    targetKB,
    allowResize = true,
    mime = "image/jpeg",
    minQuality = 0.30,
    maxQuality = 0.95,
    minScale = 0.35,
  } = options;

  const targetBytes = Math.max(1, Number(targetKB) || 0) * 1024;
  const { image, url } = await loadImage(file);

  try {
    const scales = allowResize
      ? [1, 0.85, 0.72, 0.6, 0.5, 0.42, minScale]
      : [1];

    let best = null;

    for (const scale of scales) {
      // Binary search quality for this scale.
      let lo = minQuality;
      let hi = maxQuality;
      let attempt = null;

      for (let i = 0; i < 7; i += 1) {
        const q = (lo + hi) / 2;
        // eslint-disable-next-line no-await-in-loop
        const current = await encodeAt(image, q, scale, mime);
        if (current.blob.size <= targetBytes) {
          attempt = { ...current, quality: q, scale };
          lo = q; // try a higher quality next
        } else {
          hi = q;
        }
      }

      if (attempt) {
        // We reached the target at this scale; keep the best (highest quality×scale) result.
        if (!best || attempt.blob.size >= best.blob.size) best = { ...attempt, reachedTarget: true };
        // Higher scale usually wins on quality; since scales[] is descending, stop on first hit.
        return best;
      }

      // Remember the smallest blob we've produced as a floor.
      // eslint-disable-next-line no-await-in-loop
      const floor = await encodeAt(image, minQuality, scale, mime);
      const candidate = { ...floor, quality: minQuality, scale, reachedTarget: false };
      if (!best || candidate.blob.size < best.blob.size) best = candidate;

      if (!allowResize) break;
    }

    return best;
  } finally {
    URL.revokeObjectURL(url);
  }
}
