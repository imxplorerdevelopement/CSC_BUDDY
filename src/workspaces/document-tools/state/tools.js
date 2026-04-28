/**
 * Registry of tools shown in the left rail. Each tool has an id, display label,
 * short helper text, and the React component key used to render it.
 */
export const TOOL_CATEGORIES = [
  { id: "portal_prep", label: "Portal Prep" },
  { id: "compress", label: "Infinite Compressor" },
  { id: "resize", label: "Image Resizer" },
  { id: "pdf_to_image", label: "PDF to Image" },
  { id: "image_to_pdf", label: "Image to PDF" },
  { id: "word_to_pdf", label: "Word to PDF" },
  { id: "word_to_image", label: "Word to Image" },
  { id: "pdf_to_word", label: "PDF to Word" },
];

export const TOOL_META = {
  portal_prep: {
    id: "portal_prep",
    label: "Portal Prep",
    description: "Select a service preset, upload all required documents, get portal-ready files in one click.",
    accepts: "image/jpeg,image/png,image/webp,image/jpg,application/pdf",
    acceptsLabel: "JPG · PNG · PDF",
    kind: "image",
  },
  compress: {
    id: "compress",
    label: "Infinite Compressor",
    description: "Shrink PDF, PNG, JPG, and JPEG to a custom size in KB - ideal for portal uploads.",
    accepts: "application/pdf,image/jpeg,image/png,image/jpg",
    acceptsLabel: "PDF · PNG · JPG · JPEG",
    kind: "document",
  },
  resize: {
    id: "resize",
    label: "Image Resizer",
    description: "Resize a photo to exact centimetre dimensions at print DPI.",
    accepts: "image/jpeg,image/png,image/webp,image/jpg",
    acceptsLabel: "JPG · PNG · WEBP",
    kind: "image",
  },
  pdf_to_image: {
    id: "pdf_to_image",
    label: "PDF to Image",
    description: "Export PDF pages as JPG or PNG at 200-300 DPI.",
    accepts: "application/pdf",
    acceptsLabel: "PDF",
    kind: "pdf",
  },
  image_to_pdf: {
    id: "image_to_pdf",
    label: "Image to PDF",
    description: "Combine one or more images into a clean PDF pack.",
    accepts: "image/jpeg,image/png,image/webp,image/jpg",
    acceptsLabel: "JPG · PNG · WEBP",
    kind: "image",
  },
  word_to_pdf: {
    id: "word_to_pdf",
    label: "Word to PDF",
    description: "Convert Word documents (.docx / .doc) into PDF.",
    accepts: ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    acceptsLabel: "DOC · DOCX",
    kind: "document",
  },
  word_to_image: {
    id: "word_to_image",
    label: "Word to Image",
    description: "Convert Word documents into JPG or PNG images, one page per file.",
    accepts: ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    acceptsLabel: "DOC · DOCX",
    kind: "document",
  },
  pdf_to_word: {
    id: "pdf_to_word",
    label: "PDF to Word",
    description: "Convert PDF pages into a Word document with one rendered page image per page.",
    accepts: "application/pdf",
    acceptsLabel: "PDF",
    kind: "pdf",
  },
};

/**
 * Pick the most likely tool for an arbitrary file based on MIME type.
 * Returns null when we can't confidently route the file.
 * @param {File} file
 * @returns {string|null}
 */
export function suggestToolForFile(file) {
  if (!file) return null;
  const type = String(file.type || "").toLowerCase();
  const name = String(file.name || "").toLowerCase();
  if (type === "application/pdf" || name.endsWith(".pdf")) return "pdf_to_image";
  if (type === "application/msword" || type.includes("wordprocessingml") || name.endsWith(".docx") || name.endsWith(".doc")) return "word_to_pdf";
  if (/^image\/(jpeg|jpg|png)$/i.test(type) || /\.(jpe?g|png)$/i.test(name)) return "compress";
  if (type.startsWith("image/")) return "resize";
  return null;
}
