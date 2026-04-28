/**
 * Portal preset registry.
 *
 * A preset describes what a government portal expects for a given upload:
 * format, physical dimensions, DPI, and file-size band. The Portal Prep tool
 * consumes these to turn a raw customer document into a portal-ready file in
 * one click.
 *
 * Each preset has a stable `id` so future UI (quick actions, command palette,
 * saved jobs) can reference it without being tied to display strings. Specs
 * below reflect the current public guidance for each portal; they are meant
 * as sensible defaults and the tool lets operators tweak inputs before export.
 *
 * @typedef {Object} PortalPreset
 * @property {string} id                          stable identifier
 * @property {string} name                        label shown in the dropdown
 * @property {"photo"|"signature"|"document"} kind category icon + grouping
 * @property {string} portal                      portal/scheme name for the header
 * @property {"image/jpeg"|"image/png"|"image/pdf"} mime  target output MIME
 * @property {"jpg"|"jpeg"|"png"|"pdf"} ext       file extension used when naming output
 * @property {number} [widthCm]                   physical width when dimensions matter
 * @property {number} [heightCm]                  physical height
 * @property {number} [dpi]                       DPI used for cm -> pixel conversion
 * @property {number} [targetMaxKB]               upper bound on file size
 * @property {number} [targetMinKB]               some portals enforce a minimum (e.g. 20 KB)
 * @property {string} [notes]                     one-line caption shown next to the preset
 */

/** @type {PortalPreset[]} */
export const PORTAL_PRESETS = [
  {
    id: "aadhaar_photo",
    name: "Aadhaar Update — Photo",
    kind: "photo",
    portal: "UIDAI / Aadhaar",
    mime: "image/jpeg",
    ext: "jpg",
    widthCm: 3.5,
    heightCm: 4.5,
    dpi: 300,
    targetMinKB: 20,
    targetMaxKB: 50,
    notes: "3.5×4.5 cm · 20–50 KB · JPG",
  },
  {
    id: "pan_photo",
    name: "PAN Application — Photo",
    kind: "photo",
    portal: "NSDL / UTIITSL",
    mime: "image/jpeg",
    ext: "jpg",
    widthCm: 3.5,
    heightCm: 2.5,
    dpi: 200,
    targetMinKB: 20,
    targetMaxKB: 50,
    notes: "3.5×2.5 cm · 20–50 KB · JPG",
  },
  {
    id: "pan_signature",
    name: "PAN Application — Signature",
    kind: "signature",
    portal: "NSDL / UTIITSL",
    mime: "image/jpeg",
    ext: "jpg",
    widthCm: 2,
    heightCm: 4.5,
    dpi: 200,
    targetMinKB: 10,
    targetMaxKB: 20,
    notes: "2×4.5 cm · 10–20 KB · JPG",
  },
  {
    id: "passport_photo",
    name: "Indian Passport — Photo",
    kind: "photo",
    portal: "Passport Seva",
    mime: "image/jpeg",
    ext: "jpg",
    widthCm: 3.5,
    heightCm: 4.5,
    dpi: 300,
    targetMinKB: 20,
    targetMaxKB: 300,
    notes: "3.5×4.5 cm · 20–300 KB · JPG",
  },
  {
    id: "driving_licence_photo",
    name: "Driving Licence — Photo",
    kind: "photo",
    portal: "Sarathi Parivahan",
    mime: "image/jpeg",
    ext: "jpg",
    widthCm: 3.5,
    heightCm: 4.5,
    dpi: 200,
    targetMaxKB: 200,
    notes: "3.5×4.5 cm · up to 200 KB · JPG",
  },
  {
    id: "driving_licence_signature",
    name: "Driving Licence — Signature",
    kind: "signature",
    portal: "Sarathi Parivahan",
    mime: "image/jpeg",
    ext: "jpg",
    widthCm: 6,
    heightCm: 2,
    dpi: 200,
    targetMaxKB: 100,
    notes: "6×2 cm · up to 100 KB · JPG",
  },
  {
    id: "voter_id_photo",
    name: "Voter ID — Photo",
    kind: "photo",
    portal: "NVSP / ECI",
    mime: "image/jpeg",
    ext: "jpg",
    widthCm: 3.5,
    heightCm: 4.5,
    dpi: 200,
    targetMaxKB: 100,
    notes: "3.5×4.5 cm · up to 100 KB · JPG",
  },
  {
    id: "nsp_photo",
    name: "NSP Scholarship — Photo",
    kind: "photo",
    portal: "National Scholarship Portal",
    mime: "image/jpeg",
    ext: "jpg",
    widthCm: 3.5,
    heightCm: 4.5,
    dpi: 200,
    targetMaxKB: 200,
    notes: "3.5×4.5 cm · up to 200 KB · JPG",
  },
  {
    id: "nsp_document",
    name: "NSP Scholarship — Document",
    kind: "document",
    portal: "National Scholarship Portal",
    mime: "image/jpeg",
    ext: "jpg",
    targetMaxKB: 200,
    notes: "Supporting document · up to 200 KB · JPG",
  },
  {
    id: "pmkisan_document",
    name: "PM-Kisan — Land Record",
    kind: "document",
    portal: "PM-Kisan",
    mime: "image/jpeg",
    ext: "jpg",
    targetMaxKB: 300,
    notes: "Land record / document · up to 300 KB · JPG",
  },
  {
    id: "ayushman_photo",
    name: "Ayushman Bharat — Photo",
    kind: "photo",
    portal: "PMJAY / Ayushman",
    mime: "image/jpeg",
    ext: "jpg",
    widthCm: 3.5,
    heightCm: 4.5,
    dpi: 200,
    targetMaxKB: 200,
    notes: "3.5×4.5 cm · up to 200 KB · JPG",
  },
  {
    id: "ration_card_document",
    name: "Ration Card — Document",
    kind: "document",
    portal: "State PDS portals",
    mime: "image/jpeg",
    ext: "jpg",
    targetMaxKB: 500,
    notes: "Supporting document · up to 500 KB · JPG",
  },
];

/** @type {Record<string, PortalPreset>} */
export const PORTAL_PRESET_MAP = PORTAL_PRESETS.reduce((acc, preset) => {
  acc[preset.id] = preset;
  return acc;
}, {});

/**
 * Group presets by their `kind` so the dropdown can show clean optgroups
 * without hardcoding labels at the call site.
 * @returns {Array<{ kind: "photo"|"signature"|"document", label: string, items: PortalPreset[] }>}
 */
export function groupPresetsByKind() {
  const labels = { photo: "Photos", signature: "Signatures", document: "Documents" };
  const order = ["photo", "signature", "document"];
  return order.map((kind) => ({
    kind,
    label: labels[kind],
    items: PORTAL_PRESETS.filter((preset) => preset.kind === kind),
  }));
}
