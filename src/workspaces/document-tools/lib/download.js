/**
 * Download + file-naming helpers.
 * All operations are client-local; we never POST files anywhere.
 */

const FORMAT_EXT = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

/**
 * Infer a clean file extension from a MIME type, falling back to the provided
 * default. Used when generating output file names inside tools.
 * @param {string} mime
 * @param {string} fallback
 * @returns {string}
 */
export function extensionForMime(mime, fallback = "bin") {
  return FORMAT_EXT[String(mime || "").toLowerCase()] || fallback;
}

/**
 * Strip the extension from a filename so we can append our own.
 * @param {string} filename
 * @returns {string}
 */
export function stripExtension(filename) {
  const name = String(filename || "file");
  const idx = name.lastIndexOf(".");
  if (idx <= 0) return name;
  return name.slice(0, idx);
}

/**
 * Read the extension (without dot) from a filename. Empty string when absent.
 * @param {string} filename
 * @returns {string}
 */
export function getExtension(filename) {
  const name = String(filename || "");
  const idx = name.lastIndexOf(".");
  if (idx <= 0 || idx === name.length - 1) return "";
  return name.slice(idx + 1);
}

/**
 * Combine a user-edited base name with the original extension, stripping any
 * extension the user typed so we never lose the correct one.
 * @param {string} nextBase
 * @param {string} originalFilename
 * @returns {string}
 */
export function joinWithOriginalExtension(nextBase, originalFilename) {
  const ext = getExtension(originalFilename);
  const cleaned = stripExtension(String(nextBase || "").trim()) || "file";
  return ext ? `${cleaned}.${ext}` : cleaned;
}

/**
 * Trigger a browser download for a blob by creating a temporary anchor.
 * @param {Blob} blob
 * @param {string} filename
 */
export function downloadBlob(blob, filename) {
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename || "download";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoke after a beat so the download actually starts in Safari/Firefox.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
