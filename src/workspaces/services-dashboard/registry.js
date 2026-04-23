/**
 * Master service registry for the CSC centre.
 *
 * Each entry carries a stable id, a category, a human label, and optional
 * detail fields: portal, pricing, required documents, notes, and flagged status.
 *
 * Pricing philosophy:
 *   actualCost    – what the operator pays (government portal fee / vendor cost)
 *   customerRef   – reference range shown to operator; NOT a fixed final price
 *   customAmount  – final charged amount is always entered by the operator
 *
 * @typedef {Object} ServicePricing
 * @property {string} [actualCost]    actual portal / vendor cost (INR)
 * @property {string} [customerRef]   reference customer price range / note
 * @property {boolean} [customOnly]   true = no fixed rate; operator enters full custom amount
 *
 * @typedef {Object} ServiceEntry
 * @property {string}   id           stable slug
 * @property {string}   label        display name
 * @property {string}   categoryId   foreign key into SERVICE_CATEGORIES
 * @property {string}   [portal]     portal or path used
 * @property {ServicePricing} [pricing]
 * @property {string[]} [required]   list of required documents / details
 * @property {string[]} [notes]      workflow / important notes
 * @property {boolean}  [flagged]    true = show red warning banner
 * @property {string}   [flagNote]   message shown in red banner when flagged
 *
 * @typedef {Object} ServiceCategory
 * @property {string} id
 * @property {string} label
 * @property {string} [helper]
 */

/** @type {ServiceCategory[]} */
export const SERVICE_CATEGORIES = [
  { id: "pan",          label: "PAN Card" },
  { id: "aadhaar",      label: "Aadhaar Card" },
  { id: "certificates", label: "Certificates", helper: "Gautam Budh Nagar: CSC Portal · Outside: eSathi Portal · Vendor cost ~₹15–17" },
  { id: "more_gov_ids", label: "More Government IDs" },
  { id: "in_house",     label: "In House Services" },
  { id: "agreements",   label: "Agreements / Affidavits" },
];

/** @type {ServiceEntry[]} */
export const SERVICE_REGISTRY = [

  // ── PAN Card ─────────────────────────────────────────────────────────────

  {
    id: "pan_fresh_adult",
    categoryId: "pan",
    label: "Fresh PAN Application – Adult",
    portal: "CSC PAN Portal",
    pricing: {
      actualCost: "₹110",
      customerRef: "₹800–1200 (reference range)",
    },
    required: [
      "Signature",
      "Email ID",
      "Mobile Number",
      "Aadhaar Card",
      "DOB Proof – Birth Certificate / 10th or 12th Marksheet / Driving License / Voter ID Card / Magistrate-stamped affidavit (if no other proof available)",
    ],
    notes: [
      "Aadhaar is extremely important; address is fetched from Aadhaar only.",
      "Email ID and mobile number are mandatory.",
    ],
  },

  {
    id: "pan_fresh_minor",
    categoryId: "pan",
    label: "Fresh PAN Application – Minor",
    portal: "Government NSDL Portal (not CSC PAN flow)",
    pricing: {
      actualCost: "₹100",
      customerRef: "~₹850 + courier (reference)",
    },
    required: [
      "Minor's Aadhaar Card",
      "Minor's Birth Certificate (mandatory – no BC = no minor PAN)",
      "Parent / representative Aadhaar Card",
      "Parent / representative name",
      "Parent / representative mobile number",
      "Parent / representative signature",
    ],
    notes: [
      "Birth Certificate is mandatory without exception.",
      "Representative can be either parent.",
      "Documents and application form must be physically printed.",
      "Printed packet must be couriered to Income Tax Office, Pune.",
      "Courier charge is separate and not included in the base price.",
      "Do NOT apply minor PAN through the CSC PAN flow.",
    ],
  },

  {
    id: "pan_photo_sign_update",
    categoryId: "pan",
    label: "PAN Photo & Signature Update",
    portal: "CSC PAN Portal",
    pricing: {
      actualCost: "₹100",
      customerRef: "~₹800 (reference)",
    },
    required: [
      "Aadhaar Card",
      "Mobile Number",
      "Email ID",
      "Signature",
      "Photograph",
    ],
  },

  {
    id: "pan_name_change",
    categoryId: "pan",
    label: "PAN Name Change",
    portal: "CSC PAN Portal",
    pricing: {
      actualCost: "₹100",
      customerRef: "₹1200–1500, can go up to ₹2000 (reference)",
    },
    required: [
      "Aadhaar Card",
      "Mobile Number",
      "Email ID",
      "Signature",
      "Photograph",
      "Supporting proof for name change",
    ],
  },

  {
    id: "pan_father_name_change",
    categoryId: "pan",
    label: "PAN Father's Name Change",
    portal: "CSC PAN Portal",
    pricing: {
      actualCost: "₹100",
      customerRef: "₹1200–1500, can go up to ₹2000 (reference)",
    },
    required: [
      "Aadhaar Card",
      "Mobile Number",
      "Email ID",
      "Signature",
      "Photograph",
      "Supporting proof for father's name change",
    ],
  },

  {
    id: "pan_address_update",
    categoryId: "pan",
    label: "PAN Address Update",
    portal: "CSC PAN Portal",
    pricing: {
      actualCost: "₹100",
      customerRef: "~₹800 (reference)",
    },
    required: [
      "Aadhaar Card",
      "Mobile Number",
      "Email ID",
      "Signature",
      "Photograph",
    ],
    notes: [
      "Address is based on Aadhaar; update Aadhaar address first if needed.",
    ],
  },

  {
    id: "pan_dob_change",
    categoryId: "pan",
    label: "PAN DOB Change",
    portal: "CSC PAN Portal",
    pricing: {
      actualCost: "₹100",
      customerRef: "₹1500–2000 (reference)",
    },
    required: [
      "Aadhaar Card",
      "Mobile Number",
      "Email ID",
      "Signature",
      "Photograph",
      "DOB Proof – Birth Certificate / 10th or 12th Marksheet / Driving License / Voter ID Card / Magistrate-stamped affidavit",
    ],
  },

  // ── Aadhaar Card ──────────────────────────────────────────────────────────

  {
    id: "aadhaar_address_update",
    categoryId: "aadhaar",
    label: "Aadhaar Address Update",
    portal: "UIDAI Portal",
    pricing: {
      actualCost: "₹75",
      customerRef: "₹250–350 (reference)",
    },
    required: [
      "Aadhaar Card",
      "Mobile Number (linked with Aadhaar for OTP)",
      "Address Proof in applicant's own name – Rent Agreement / Bank Passbook or Statement / Voter ID / Driving License / Property Papers / Gas Bill / Electricity Bill / Broadband or Wi-Fi Bill / similar document",
    ],
    notes: [
      "OTP required; biometric and relationship proof are NOT required.",
      "Address proof must be strictly in the applicant's own name.",
      "Family member-based update: needs applicant Aadhaar, family member Aadhaar, both phone numbers, and mutual consent.",
      "If mobile number is not linked with Aadhaar, service goes through private operator instead.",
    ],
  },

  {
    id: "aadhaar_pvc_order",
    categoryId: "aadhaar",
    label: "Aadhaar PVC Card Order",
    portal: "UIDAI Portal",
    pricing: {
      actualCost: "₹75",
      customerRef: "₹100–150 (reference)",
    },
    required: [
      "Aadhaar Card / Aadhaar Number",
      "Mobile Number linked with Aadhaar",
      "OTP",
    ],
    notes: [
      "OTP is sent only to the mobile number linked with Aadhaar.",
    ],
  },

  {
    id: "aadhaar_mobile_update",
    categoryId: "aadhaar",
    label: "Aadhaar Mobile Number Update",
    portal: "Private Operator",
    pricing: {
      actualCost: "₹200 (vendor cost)",
      customerRef: "₹500–600 (reference)",
    },
    required: [
      "Aadhaar Card",
    ],
    notes: [
      "Customer visits private operator; biometric is used to open Aadhaar and update mobile number.",
      "Old mobile number / OTP is NOT required.",
      "Same-day update.",
    ],
  },

  {
    id: "aadhaar_biometric_update",
    categoryId: "aadhaar",
    label: "Aadhaar Biometric Update",
    portal: "Private Operator",
    pricing: {
      actualCost: "₹400 (vendor cost)",
      customerRef: "₹600–800 (reference)",
    },
    required: [
      "Customer physical visit (mandatory)",
      "Aadhaar Number (for records)",
    ],
    notes: [
      "Process: fingerprint scan + eye / iris scan.",
      "Takes approximately 10–15 minutes.",
    ],
  },

  {
    id: "aadhaar_fresh_child_below5",
    categoryId: "aadhaar",
    label: "Fresh Aadhaar – Child Below 5",
    portal: "Private Operator",
    pricing: {
      actualCost: "₹400 with Birth Certificate / ₹1200 without BC (vendor cost)",
      customerRef: "₹1500 with BC / ₹2500 without BC (reference)",
    },
    required: [
      "Child's Birth Certificate (only valid document)",
      "Parent's Aadhaar Card",
      "Parent's Mobile Number",
      "Physical presence of parent and child",
    ],
    notes: [
      "Child photo is taken; child biometrics are NOT taken at this age.",
      "Parent biometric is used.",
      "Approximately 15–20 minutes.",
    ],
  },

  {
    id: "aadhaar_fresh_child_above5",
    categoryId: "aadhaar",
    label: "Fresh Aadhaar – Child Above 5",
    portal: "Private Operator",
    pricing: {
      actualCost: "₹400 with Birth Certificate / ₹1200 without BC (vendor cost)",
      customerRef: "₹1500 with BC / ₹2500 without BC (reference)",
    },
    required: [
      "Child's Birth Certificate",
      "Parent's Aadhaar Card",
      "Parent's Mobile Number",
      "Physical presence of parent and child",
    ],
    notes: [
      "Same as below-5, but child's biometric / fingerprint IS also required.",
      "Approximately 15–20 minutes.",
    ],
  },

  {
    id: "aadhaar_fresh_adult",
    categoryId: "aadhaar",
    label: "Fresh Aadhaar – Adult",
    portal: "Private Operator",
    pricing: {
      actualCost: "₹400 with documents / ₹1200 without documents (vendor cost)",
      customerRef: "₹1500 with docs / ₹2500 without docs (reference)",
    },
    required: [
      "Birth Certificate / 10th Marksheet / Voter ID / Passport",
      "Mobile Number",
      "Applicant physical presence (mandatory)",
    ],
    notes: [
      "Full biometric required: photo, fingerprint, iris / retina scan.",
      "Approximately 15–20 minutes.",
    ],
  },

  {
    id: "aadhaar_seva_appointment",
    categoryId: "aadhaar",
    label: "Aadhaar Seva Appointment",
    portal: "UIDAI Portal",
    pricing: {
      actualCost: "₹150 (vendor cost)",
      customerRef: "₹400–600 (reference)",
    },
    required: [
      "Aadhaar Card",
      "Mobile Number linked with Aadhaar",
      "OTP",
      "Service-specific: Address Update also needs Address Proof; Biometric Update also needs Mobile Number",
    ],
    notes: [
      "Appointments available for: Address Update, Biometric Update, Mobile Number Update.",
      "No appointment available for DOB update.",
      "Appointment slip is printed and also sent on WhatsApp.",
      "Customer must visit Aadhaar Seva Kendra physically.",
    ],
  },

  {
    id: "aadhaar_esignature",
    categoryId: "aadhaar",
    label: "Aadhaar E-Signature",
    portal: "Vendor",
    pricing: {
      actualCost: "₹20 (vendor cost)",
      customerRef: "₹50–100 (reference)",
    },
    required: [
      "Aadhaar Card",
      "Mobile Number linked with Aadhaar",
      "OTP",
    ],
    notes: [
      "Output: Digitally signed Aadhaar Card.",
    ],
  },

  {
    id: "aadhaar_name_change",
    categoryId: "aadhaar",
    label: "Aadhaar Name Change",
    flagged: true,
    flagNote: "Details have not been entered because these details will be entered by Ma'am.",
  },

  {
    id: "aadhaar_dob_update",
    categoryId: "aadhaar",
    label: "Aadhaar DOB Update",
    flagged: true,
    flagNote: "Details have not been entered because these details will be entered by Ma'am.",
  },

  // ── Certificates ──────────────────────────────────────────────────────────

  {
    id: "cert_income",
    categoryId: "certificates",
    label: "Income Certificate",
    pricing: {
      actualCost: "₹15–17 (vendor cost)",
      customerRef: "₹800–1200 (reference)",
    },
    required: [
      "Photo",
      "Aadhaar Card",
      "Self-declaration form (provided by shop)",
      "Payslip (optional)",
    ],
    flagged: true,
    flagNote: "More certificate-specific details are pending and will be entered by Ma'am.",
  },

  {
    id: "cert_caste",
    categoryId: "certificates",
    label: "Caste Certificate",
    pricing: {
      actualCost: "₹15–17 (vendor cost)",
      customerRef: "₹800–1200 (reference)",
    },
    required: [
      "Photo",
      "Aadhaar Card",
      "Previous caste certificate (if any)",
      "Family member's Aadhaar Card (if issued through a family member)",
    ],
    flagged: true,
    flagNote: "More certificate-specific details are pending and will be entered by Ma'am.",
  },

  {
    id: "cert_death",
    categoryId: "certificates",
    label: "Death Certificate",
    pricing: {
      actualCost: "₹15–17 (vendor cost)",
      customerRef: "₹800–1200 (reference)",
    },
    flagged: true,
    flagNote: "Details have not been entered because these details will be entered by Ma'am.",
  },

  {
    id: "cert_domicile",
    categoryId: "certificates",
    label: "Domicile Certificate",
    pricing: {
      actualCost: "₹15–17 (vendor cost)",
      customerRef: "₹800–1200 (reference)",
    },
    flagged: true,
    flagNote: "Details have not been entered because these details will be entered by Ma'am.",
  },

  {
    id: "cert_marriage",
    categoryId: "certificates",
    label: "Marriage Certificate",
    pricing: {
      actualCost: "₹15–17 (vendor cost)",
      customerRef: "₹800–1200 (reference)",
    },
    flagged: true,
    flagNote: "Details have not been entered because these details will be entered by Ma'am.",
  },

  {
    id: "cert_age",
    categoryId: "certificates",
    label: "Age Certificate",
    pricing: {
      actualCost: "₹15–17 (vendor cost)",
      customerRef: "₹800–1200 (reference)",
    },
    flagged: true,
    flagNote: "Details have not been entered because these details will be entered by Ma'am.",
  },

  {
    id: "cert_disability",
    categoryId: "certificates",
    label: "Disability Certificate",
    pricing: {
      actualCost: "₹15–17 (vendor cost)",
      customerRef: "₹800–1200 (reference)",
    },
    flagged: true,
    flagNote: "Details have not been entered because these details will be entered by Ma'am.",
  },

  // ── More Government IDs ───────────────────────────────────────────────────

  {
    id: "gov_voter_id",
    categoryId: "more_gov_ids",
    label: "Voter ID Card",
    flagged: true,
    flagNote: "Details have not been entered because these details will be entered by Ma'am.",
  },

  {
    id: "gov_ration_card",
    categoryId: "more_gov_ids",
    label: "Ration Card",
    flagged: true,
    flagNote: "Details have not been entered because these details will be entered by Ma'am.",
  },

  {
    id: "gov_ayushman",
    categoryId: "more_gov_ids",
    label: "Ayushman Card",
    flagged: true,
    flagNote: "Details have not been entered because these details will be entered by Ma'am.",
  },

  {
    id: "gov_senior_citizen",
    categoryId: "more_gov_ids",
    label: "Senior Citizen Card",
    flagged: true,
    flagNote: "Details have not been entered because the process still needs to be confirmed.",
  },

  // ── In House Services ─────────────────────────────────────────────────────

  {
    id: "inhouse_stamp_paper",
    categoryId: "in_house",
    label: "Stamp Paper",
    pricing: {
      actualCost: "Face value of stamp paper",
      customerRef: "Stamp value + custom service charge (no fixed rate – operator decides)",
      customOnly: true,
    },
    notes: [
      "Licensed stamp paper vendor.",
      "Stamp paper can be generated from ₹10 up to any amount.",
      "Enter: stamp paper value + extra service charge taken from customer.",
      "Example: ₹100 stamp paper may be charged as ₹140 total.",
    ],
  },

  {
    id: "inhouse_pvc_card",
    categoryId: "in_house",
    label: "PVC Card",
    pricing: {
      actualCost: "₹50 (B2B rate)",
      customerRef: "₹120–150 (reference)",
    },
    notes: [
      "General PVC card – not limited to Aadhaar PVC.",
    ],
  },

  {
    id: "inhouse_lamination",
    categoryId: "in_house",
    label: "Lamination",
    pricing: {
      actualCost: "₹20 (B2B rate)",
      customerRef: "₹50–100 (reference)",
    },
  },

  {
    id: "inhouse_passport_photo",
    categoryId: "in_house",
    label: "Passport Size Photos",
    pricing: {
      actualCost: "₹30 (B2B rate)",
      customerRef: "₹80 for 6 printed photos",
    },
  },

  {
    id: "inhouse_photocopy_bw",
    categoryId: "in_house",
    label: "Photocopy (B/W)",
    pricing: {
      customerRef: "₹5 per page",
    },
  },

  {
    id: "inhouse_photocopy_color",
    categoryId: "in_house",
    label: "Photocopy (Colour)",
    pricing: {
      customerRef: "₹10 per page",
    },
  },

  {
    id: "inhouse_print_bw",
    categoryId: "in_house",
    label: "Print Out (B/W)",
    pricing: {
      customerRef: "₹10 per page",
    },
  },

  {
    id: "inhouse_print_color",
    categoryId: "in_house",
    label: "Print Out (Colour)",
    pricing: {
      customerRef: "₹20 per page",
    },
  },

  {
    id: "inhouse_typing_english",
    categoryId: "in_house",
    label: "English Typing",
    pricing: {
      customerRef: "~₹150 starting; up to ₹1000–1300 depending on time and work",
      customOnly: true,
    },
    notes: [
      "Dynamic pricing – operator enters custom amount based on job.",
    ],
  },

  {
    id: "inhouse_typing_hindi",
    categoryId: "in_house",
    label: "Hindi Typing",
    pricing: {
      customerRef: "~₹150 starting; up to ₹1000–1300 depending on time and work",
      customOnly: true,
    },
    notes: [
      "Dynamic pricing – operator enters custom amount based on job.",
    ],
  },

  // ── Agreements / Affidavits ───────────────────────────────────────────────

  {
    id: "legal_rent_agreement",
    categoryId: "agreements",
    label: "Rent Agreement",
    pricing: {
      actualCost: "Notary ₹50–60 + stamp paper value + typing/drafting + printout charges",
      customerRef: "No fixed rate – custom charged by operator",
      customOnly: true,
    },
    notes: [
      "Components: Notary (₹50–60), Stamp Paper (customer's required value), Typing / Drafting (dynamic), Photocopy / Printout attachments (normal rates), Extra service charge (custom).",
    ],
  },

  {
    id: "legal_sale_agreement",
    categoryId: "agreements",
    label: "Sale Agreement",
    pricing: {
      actualCost: "Notary ₹50–60 + stamp paper value + typing/drafting + printout charges",
      customerRef: "No fixed rate – custom charged by operator",
      customOnly: true,
    },
    notes: [
      "Components: Notary (₹50–60), Stamp Paper (customer's required value), Typing / Drafting (dynamic), Photocopy / Printout attachments (normal rates), Extra service charge (custom).",
    ],
  },

  {
    id: "legal_indemnity_bond",
    categoryId: "agreements",
    label: "Indemnity Bond",
    pricing: {
      actualCost: "Notary ₹50–60 + stamp paper value + typing/drafting + printout charges",
      customerRef: "No fixed rate – custom charged by operator",
      customOnly: true,
    },
    notes: [
      "Components: Notary (₹50–60), Stamp Paper (customer's required value), Typing / Drafting (dynamic), Photocopy / Printout attachments (normal rates), Extra service charge (custom).",
    ],
  },

  {
    id: "legal_affidavits",
    categoryId: "agreements",
    label: "Affidavits",
    pricing: {
      actualCost: "Notary ₹50–60 + stamp paper value + typing/drafting + printout charges",
      customerRef: "No fixed rate – custom charged by operator",
      customOnly: true,
    },
    notes: [
      "Components: Notary (₹50–60), Stamp Paper (customer's required value), Typing / Drafting (dynamic), Photocopy / Printout attachments (normal rates), Extra service charge (custom).",
    ],
  },
];

/**
 * Group the flat registry by category, preserving declared order.
 * @returns {Array<{ id: string, label: string, helper?: string, services: ServiceEntry[] }>}
 */
export function groupServicesByCategory() {
  return SERVICE_CATEGORIES.map((category) => ({
    id: category.id,
    label: category.label,
    helper: category.helper,
    services: SERVICE_REGISTRY.filter((service) => service.categoryId === category.id),
  }));
}
