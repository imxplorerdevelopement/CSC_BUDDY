import { PDFDocument } from "pdf-lib";
import { canvasToBlob } from "./canvas.js";
import { ensurePdfWorker } from "./pdfWorker.js";

/**
 * Render a single PDF page to a PNG/JPEG Blob at the requested DPI.
 * Used by the PDF → Image tool.
 *
 * @param {ArrayBuffer} arrayBuffer  raw PDF bytes (already read from File)
 * @param {number} pageNumber         1-based page index
 * @param {Object} options
 * @param {number} options.dpi
 * @param {string} options.mime       "image/jpeg" | "image/png"
 * @param {number} [options.quality]  for JPEG, 0..1
 * @returns {Promise<{ blob: Blob, width: number, height: number }>}
 */
export async function renderPdfPageToImage(arrayBuffer, pageNumber, options) {
  const pdfjs = ensurePdfWorker();
  // pdf.js consumes the buffer — clone so we can re-use the source across pages.
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer.slice(0) });
  const pdf = await loadingTask.promise;
  try {
    const page = await pdf.getPage(pageNumber);
    const scale = options.dpi / 72; // PDF internal unit is 72 DPI
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable in this browser.");
    if (options.mime === "image/jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    await page.render({ canvasContext: ctx, viewport }).promise;
    const blob = await canvasToBlob(canvas, options.mime, options.quality);
    return { blob, width: canvas.width, height: canvas.height };
  } finally {
    await pdf.destroy();
  }
}

/**
 * Count pages in a PDF without rendering.
 * @param {ArrayBuffer} arrayBuffer
 * @returns {Promise<number>}
 */
export async function getPdfPageCount(arrayBuffer) {
  const pdfjs = ensurePdfWorker();
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer.slice(0) });
  const pdf = await loadingTask.promise;
  try {
    return pdf.numPages;
  } finally {
    await pdf.destroy();
  }
}

const PAGE_SIZES_PT = {
  A4: { w: 595.28, h: 841.89 },
  Letter: { w: 612, h: 792 },
  Legal: { w: 612, h: 1008 },
};

/**
 * Combine one or more raster images into a single PDF using pdf-lib.
 * "Fit" embeds each image on a page sized to the image itself (no margins,
 * clean for ID scans). Named sizes (A4/Letter/Legal) center + fit with a small margin.
 *
 * @param {Array<{ bytes: ArrayBuffer, mime: string, width: number, height: number }>} images
 * @param {Object} options
 * @param {"Fit"|"A4"|"Letter"|"Legal"} options.pageSize
 * @param {number} [options.marginPt=0]
 * @returns {Promise<Blob>}
 */
export async function buildPdfFromImages(images, options) {
  const { pageSize, marginPt = 0 } = options;
  const pdfDoc = await PDFDocument.create();

  for (const img of images) {
    const embedded = img.mime === "image/png"
      ? await pdfDoc.embedPng(img.bytes)
      : await pdfDoc.embedJpg(img.bytes);

    let pageW;
    let pageH;
    if (pageSize === "Fit") {
      pageW = embedded.width;
      pageH = embedded.height;
    } else {
      const s = PAGE_SIZES_PT[pageSize] || PAGE_SIZES_PT.A4;
      const portrait = embedded.width <= embedded.height;
      pageW = portrait ? s.w : s.h;
      pageH = portrait ? s.h : s.w;
    }

    const page = pdfDoc.addPage([pageW, pageH]);

    if (pageSize === "Fit") {
      page.drawImage(embedded, { x: 0, y: 0, width: pageW, height: pageH });
    } else {
      const availW = pageW - marginPt * 2;
      const availH = pageH - marginPt * 2;
      const ratio = Math.min(availW / embedded.width, availH / embedded.height);
      const drawW = embedded.width * ratio;
      const drawH = embedded.height * ratio;
      page.drawImage(embedded, {
        x: (pageW - drawW) / 2,
        y: (pageH - drawH) / 2,
        width: drawW,
        height: drawH,
      });
    }
  }

  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: "application/pdf" });
}
