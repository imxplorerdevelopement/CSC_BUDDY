import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";

/**
 * Configure the pdf.js worker exactly once per page load.
 * Vite resolves `?url` at build time so the worker is served from our own origin —
 * this also keeps us aligned with the "no external network" privacy posture.
 */
let configured = false;
export function ensurePdfWorker() {
  if (configured) return pdfjsLib;
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  configured = true;
  return pdfjsLib;
}

export { pdfjsLib };
