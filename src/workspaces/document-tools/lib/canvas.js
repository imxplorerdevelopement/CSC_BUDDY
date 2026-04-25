/**
 * Canvas-based helpers: load images to drawable bitmaps, resize, convert format.
 * All functions are pure (produce new Blobs/Objects — no mutation of inputs).
 */

/**
 * Load a File or Blob into an HTMLImageElement with resolved dimensions.
 * @param {File|Blob} file
 * @returns {Promise<{ image: HTMLImageElement, url: string, width: number, height: number }>}
 */
export function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      resolve({ image, url, width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image. The file may be corrupt or unsupported."));
    };
    image.src = url;
  });
}

/**
 * Draw an image onto a fresh canvas at exact target pixel dimensions using
 * high-quality resampling. Caller owns the returned canvas.
 * @param {HTMLImageElement} image
 * @param {number} targetWidthPx
 * @param {number} targetHeightPx
 * @param {string} [fillBackground] CSS color — used when exporting transparent sources to JPEG.
 * @returns {HTMLCanvasElement}
 */
export function drawToCanvas(image, targetWidthPx, targetHeightPx, fillBackground) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(targetWidthPx));
  canvas.height = Math.max(1, Math.round(targetHeightPx));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable in this browser.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  if (fillBackground) {
    ctx.fillStyle = fillBackground;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/**
 * Export a canvas to a Blob of the requested MIME type. JPEG/WebP accept a 0–1 quality.
 * @param {HTMLCanvasElement} canvas
 * @param {string} mime
 * @param {number} [quality]
 * @returns {Promise<Blob>}
 */
export function canvasToBlob(canvas, mime, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error(`Browser could not encode ${mime}.`));
          return;
        }
        resolve(blob);
      },
      mime,
      typeof quality === "number" ? quality : undefined,
    );
  });
}

/**
 * Convert a centimetre measurement to pixels at the given DPI.
 * Standard: 1 inch = 2.54 cm, pixels = cm / 2.54 * dpi.
 * @param {number} cm
 * @param {number} dpi
 * @returns {number}
 */
export function cmToPixels(cm, dpi) {
  const c = Number(cm) || 0;
  const d = Number(dpi) || 72;
  return Math.round((c / 2.54) * d);
}
