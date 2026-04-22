/**
 * Registry of tools shown in the left rail. Each tool has an id, display label,
 * short helper text, and the React component key used to render it.
 */
export const TOOL_CATEGORIES = [
  { id: "portal_prep", label: "Portal Prep" },
  { id: "compress", label: "Compress" },
  { id: "resize", label: "Resize" },
  { id: "convert", label: "Convert" },
  { id: "pdf_to_image", label: "PDF to Image" },
  { id: "image_to_pdf", label: "Image to PDF" },
];

export const TOOL_META = {
  portal_prep: {
    id: "portal_prep",
    label: "Portal Prep",
    description: "One-click prep for Aadhaar, PAN, NSP, passport, and other portal uploads.",
    accepts: "image/jpeg,image/png,image/webp,image/jpg",
    acceptsLabel: "JPG · PNG · WEBP",
    kind: "image",
  },
  compress: {
    id: "compress",
    label: "Image Compressor",
    description: "Shrink JPG / PNG to a target size in KB — ideal for portal uploads.",
    accepts: "image/jpeg,image/png,image/webp,image/jpg",
    acceptsLabel: "JPG · PNG · WEBP",
    kind: "image",
  },
  resize: {
    id: "resize",
    label: "Image Resizer",
    description: "Resize a photo to exact centimetre dimensions at print DPI.",
    accepts: "image/jpeg,image/png,image/webp,image/jpg",
    acceptsLabel: "JPG · PNG · WEBP",
    kind: "image",
  },
  convert: {
    id: "convert",
    label: "Change Format",
    description: "Swap between JPG, PNG, JPEG, and WebP without quality loss where possible.",
    accepts: "image/jpeg,image/png,image/webp,image/jpg",
    acceptsLabel: "JPG · PNG · WEBP",
    kind: "image",
  },
  pdf_to_image: {
    id: "pdf_to_image",
    label: "PDF to Image",
    description: "Export PDF pages as JPG or PNG at 200–300 DPI.",
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
  if (type === "application/pdf") return "pdf_to_image";
  if (type.startsWith("image/")) return "compress";
  return null;
}
