/**
 * Master service registry for the CSC centre.
 *
 * Single source of truth for all services offered at the counter. Each entry
 * carries an id (stable across renames so future rate/document records stay
 * linked), a category, and a human label. The registry is deliberately
 * free of prices, descriptions, or document lists — those belong in their own
 * records keyed by `id` and will be added in a later pass.
 *
 * Other parts of the app (New Service Entry, Document intake, rate configuration)
 * can import this module to stay consistent with counter terminology.
 *
 * @typedef {Object} ServiceEntry
 * @property {string} id           stable slug, safe for DB/URL use
 * @property {string} label        display name shown to the operator
 * @property {string} categoryId   foreign key into SERVICE_CATEGORIES
 *
 * @typedef {Object} ServiceCategory
 * @property {string} id
 * @property {string} label
 * @property {string} [helper]     optional one-line caption shown under the category heading
 */

/** @type {ServiceCategory[]} */
export const SERVICE_CATEGORIES = [
  { id: "aadhaar", label: "Aadhaar Card" },
  { id: "pan", label: "PAN Card" },
  { id: "certificates", label: "Certificates" },
  { id: "more_gov_ids", label: "More Government IDs" },
  { id: "in_house", label: "In House Services" },
  { id: "agreements", label: "Agreements / Affidavits" },
];

/** @type {ServiceEntry[]} */
export const SERVICE_REGISTRY = [
  // Aadhaar
  { id: "aadhaar_address_update", categoryId: "aadhaar", label: "Address Update" },
  { id: "aadhaar_mobile_update", categoryId: "aadhaar", label: "Mobile Number Update" },
  { id: "aadhaar_biometric_update", categoryId: "aadhaar", label: "Biometric Update" },
  { id: "aadhaar_fresh_adult", categoryId: "aadhaar", label: "Fresh Application (Age 5+)" },
  { id: "aadhaar_fresh_child", categoryId: "aadhaar", label: "Fresh Application (Age less than 5)" },
  { id: "aadhaar_esignature", categoryId: "aadhaar", label: "E-Signature" },
  { id: "aadhaar_pvc_order", categoryId: "aadhaar", label: "PVC Card Order" },
  { id: "aadhaar_seva_appointment", categoryId: "aadhaar", label: "Aadhaar Seva Appointment" },
  { id: "aadhaar_dob_update", categoryId: "aadhaar", label: "Aadhaar DOB Update" },

  // PAN
  { id: "pan_photo_sign_update", categoryId: "pan", label: "Photo and Signature Update" },
  { id: "pan_name_change", categoryId: "pan", label: "Name Change" },
  { id: "pan_father_name_change", categoryId: "pan", label: "Father's Name Change" },
  { id: "pan_address_update", categoryId: "pan", label: "Address Update" },
  { id: "pan_fresh_adult", categoryId: "pan", label: "Fresh Application (Adult)" },
  { id: "pan_fresh_minor", categoryId: "pan", label: "Fresh Application (Minor)" },

  // Certificates
  { id: "cert_income", categoryId: "certificates", label: "Income Certificate" },
  { id: "cert_death", categoryId: "certificates", label: "Death Certificate" },
  { id: "cert_caste", categoryId: "certificates", label: "Caste Certificate" },
  { id: "cert_domicile", categoryId: "certificates", label: "Domicile Certificate" },
  { id: "cert_marriage", categoryId: "certificates", label: "Marriage Certificate" },
  { id: "cert_age", categoryId: "certificates", label: "Age Certificate" },
  { id: "cert_disability", categoryId: "certificates", label: "Disability Certificate" },

  // More government IDs
  { id: "gov_voter_id", categoryId: "more_gov_ids", label: "Voter ID Card" },
  { id: "gov_ration_card", categoryId: "more_gov_ids", label: "Ration Card" },
  { id: "gov_ayushman", categoryId: "more_gov_ids", label: "Ayushman Card" },
  { id: "gov_senior_citizen", categoryId: "more_gov_ids", label: "Senior Citizen Card" },

  // In-house services
  { id: "inhouse_stamp_paper", categoryId: "in_house", label: "Stamp Paper" },
  { id: "inhouse_pvc_card", categoryId: "in_house", label: "PVC Card" },
  { id: "inhouse_lamination", categoryId: "in_house", label: "Lamination" },
  { id: "inhouse_passport_photo", categoryId: "in_house", label: "Passport Size Photos" },
  { id: "inhouse_photocopy_bw", categoryId: "in_house", label: "Photocopy (B/w)" },
  { id: "inhouse_photocopy_color", categoryId: "in_house", label: "Photocopy (Colour)" },
  { id: "inhouse_print_bw", categoryId: "in_house", label: "Print Out (B/w)" },
  { id: "inhouse_print_color", categoryId: "in_house", label: "Print Out (Colour)" },
  { id: "inhouse_typing_english", categoryId: "in_house", label: "English Typing" },
  { id: "inhouse_typing_hindi", categoryId: "in_house", label: "Hindi Typing" },

  // Agreements / affidavits
  { id: "legal_rent_agreement", categoryId: "agreements", label: "Rent Agreement" },
  { id: "legal_sale_agreement", categoryId: "agreements", label: "Sale Agreement" },
  { id: "legal_indemnity_bond", categoryId: "agreements", label: "Indemnity Bond" },
  { id: "legal_affidavits", categoryId: "agreements", label: "Affidavits" },
];

/**
 * Group the flat registry by category, preserving the declared category order
 * and the declared service order within each category. Returned shape is safe
 * to render directly.
 *
 * @returns {Array<{ id: string, label: string, services: ServiceEntry[] }>}
 */
export function groupServicesByCategory() {
  return SERVICE_CATEGORIES.map((category) => ({
    id: category.id,
    label: category.label,
    services: SERVICE_REGISTRY.filter((service) => service.categoryId === category.id),
  }));
}
