/**
 * Human-readable byte formatter used across tool result cards and size labels.
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(n < 10 * 1024 * 1024 ? 2 : 1)} MB`;
}

/**
 * Percent delta between original and new size (positive means smaller output).
 * @param {number} originalBytes
 * @param {number} newBytes
 * @returns {number}
 */
export function percentReduction(originalBytes, newBytes) {
  const o = Number(originalBytes) || 0;
  const n = Number(newBytes) || 0;
  if (!o) return 0;
  return Math.max(0, Math.round(((o - n) / o) * 100));
}
