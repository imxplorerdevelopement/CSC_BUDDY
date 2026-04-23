import React, { useEffect, useMemo, useRef, useState } from "react";
import { dbLoad, dbSave, supabase } from "./supabase.js";
import { DS } from "./design-tokens.js";
import { DocumentToolsWorkspace } from "./src/workspaces/document-tools/DocumentToolsWorkspace.jsx";
import { ServicesDashboardWorkspace } from "./src/workspaces/services-dashboard/ServicesDashboardWorkspace.jsx";
import { SERVICE_REGISTRY, SERVICE_CATEGORIES } from "./src/workspaces/services-dashboard/registry.js";

// Map registry category IDs to the billing category names used by
// CATEGORY_DETAIL_SCHEMA_IDS and the service-entry dropdown grouping.
const REGISTRY_CAT_TO_BILLING = {
  pan:          "PAN Card",
  aadhaar:      "Aadhaar Card",
  certificates: "Certificates",
  more_gov_ids: "Government IDs",
  in_house:     "In House",
  agreements:   "Agreements & Affidavits",
};

// Variable pricing: services whose final amount is entered by the operator.
const VARIABLE_SERVICE_IDS = new Set([
  "inhouse_stamp_paper",
  "inhouse_typing_english",
  "inhouse_typing_hindi",
  "legal_rent_agreement",
  "legal_sale_agreement",
  "legal_indemnity_bond",
  "legal_affidavits",
]);

// Unit labels per service id; defaults to "per application".
const SERVICE_UNIT_MAP = {
  inhouse_photocopy_bw:    "per page",
  inhouse_photocopy_color: "per page",
  inhouse_print_bw:        "per page",
  inhouse_print_color:     "per page",
  inhouse_typing_english:  "per job",
  inhouse_typing_hindi:    "per job",
  inhouse_passport_photo:  "per set",
  inhouse_pvc_card:        "per card",
  inhouse_lamination:      "per piece",
  inhouse_stamp_paper:     "per document",
  legal_rent_agreement:    "per agreement",
  legal_sale_agreement:    "per agreement",
  legal_indemnity_bond:    "per document",
  legal_affidavits:        "per document",
  cert_income:             "per certificate",
  cert_death:              "per certificate",
  cert_caste:              "per certificate",
  cert_domicile:           "per certificate",
  cert_marriage:           "per certificate",
  cert_age:                "per certificate",
  cert_disability:         "per certificate",
};

const INITIAL_SERVICES = SERVICE_REGISTRY.map((entry) => ({
  id:       entry.id,
  name:     entry.label,
  category: REGISTRY_CAT_TO_BILLING[entry.categoryId] || entry.categoryId,
  price:    0,
  unit:     SERVICE_UNIT_MAP[entry.id] || "per application",
  variable: VARIABLE_SERVICE_IDS.has(entry.id),
}));

const CATEGORIES = SERVICE_CATEGORIES.map((c) => REGISTRY_CAT_TO_BILLING[c.id] || c.id);
const CAT_COLORS = {
  "PAN Card":               "#2563eb",
  "Aadhaar Card":           "#0284c7",
  "Certificates":           "#0ea5e9",
  "Government IDs":         "#1d4ed8",
  "In House":               "#6d28d9",
  "Agreements & Affidavits":"#1540b0",
  // legacy fallbacks for any old stored ticket data
  "Government ID":          "#2563eb",
  "Legal & Docs":           "#1d4ed8",
  "Government Services":    "#3b82f6",
  "Typing & Print":         "#60a5fa",
};

const OPERATOR_DIRECTORY = [
  {
    id: "samar",
    name: "Samar",
    role: "Home Desk Lead",
    desk: "Front Counter",
    status: "Available",
    focus: "Fast walk-in intake and ID submissions",
    specialties: ["PAN Card", "Aadhaar Card", "Certificates"],
  },
  {
    id: "navneet_mam",
    name: "Navneet Mam",
    role: "Second Desk Review",
    desk: "Verification Counter",
    status: "Available",
    focus: "Corrections, legal work, and follow-up cases",
    specialties: ["Agreements & Affidavits", "Government IDs", "Certificates"],
  },
];
const OPERATORS = OPERATOR_DIRECTORY.map((operator) => operator.name);
const DEFAULT_OPERATOR = OPERATORS[0];
const LEGACY_REFERENCE_TYPE_LABELS = {
  guardian: "Guardian / Parent",
  gatekeeper: "Gatekeeper / Agent",
  walkin_partner: "Walk-in Partner",
  incharge: "Incharge / Office Rep",
};
const QUANTITY_MODE_CONFIG = {
  fixed: {
    label: "Single",
    inputLabel: "Locked Qty",
    helper: "This service stays at one entry per line item.",
    min: 1,
    defaultMax: 1,
  },
  multiple: {
    label: "Qty",
    inputLabel: "Quantity",
    helper: "Use when the same service repeats by page, piece, or batch.",
    min: 1,
    defaultMax: 200,
  },
  people: {
    label: "Per Person",
    inputLabel: "People / Entries",
    helper: "Use when one service applies to multiple beneficiaries.",
    min: 1,
    defaultMax: 25,
  },
};
const SERVICE_DETAIL_LIBRARY = {
  government_id: {
    id: "government_id",
    title: "Application Details",
    fields: [
      { key: "requestType", label: "Request Type", type: "select", required: true, options: ["New Application", "Correction / Update", "Reprint / Download"] },
      { key: "proofUsed", label: "Proof / Source", type: "text", required: true, placeholder: "Aadhaar, PAN, birth proof" },
      { key: "submissionMode", label: "Submission Mode", type: "select", required: false, options: ["Online", "Offline", "Appointment"] },
    ],
  },
  certificate: {
    id: "certificate",
    title: "Certificate Details",
    fields: [
      { key: "purpose", label: "Purpose", type: "text", required: true, placeholder: "Scholarship, job, admission" },
      { key: "officeTarget", label: "Target Office", type: "text", required: false, placeholder: "Tehsil, school, employer" },
      { key: "urgency", label: "Priority", type: "select", required: false, options: ["Normal", "Today", "Urgent"] },
    ],
  },
  legal_docs: {
    id: "legal_docs",
    title: "Document Details",
    fields: [
      { key: "purpose", label: "Document Purpose", type: "text", required: true, placeholder: "Name change, rental, declaration" },
      { key: "partyCount", label: "Party Count", type: "number", required: true, min: 1, placeholder: "1" },
      { key: "paperValue", label: "Stamp / Paper Value", type: "text", required: false, placeholder: "Rs. 100, Rs. 500" },
    ],
  },
  government_service: {
    id: "government_service",
    title: "Service Details",
    fields: [
      { key: "serviceStage", label: "Current Stage", type: "select", required: true, options: ["Fresh", "Update", "Pending Follow-up"] },
      { key: "serviceId", label: "Reference ID", type: "text", required: false, placeholder: "Application no. or account id" },
      { key: "handoverMode", label: "Handover Mode", type: "select", required: false, options: ["Desk Pickup", "WhatsApp", "Print Copy"] },
    ],
  },
  typing_print: {
    id: "typing_print",
    title: "Output Details",
    fields: [
      { key: "format", label: "Format", type: "select", required: true, options: ["Black & White", "Color", "Soft Copy", "Print + Soft Copy"] },
      { key: "size", label: "Paper / Size", type: "select", required: false, options: ["A4", "Legal", "Photo", "Custom"] },
      { key: "notes", label: "Job Note", type: "text", required: false, placeholder: "Single side, Hindi draft, lamination gloss" },
    ],
  },
};
const CATEGORY_DETAIL_SCHEMA_IDS = {
  "PAN Card":               "government_id",
  "Aadhaar Card":           "government_id",
  "Certificates":           "certificate",
  "Government IDs":         "government_id",
  "In House":               "typing_print",
  "Agreements & Affidavits":"legal_docs",
  // legacy names kept for any stored tickets that reference them
  "Government ID":          "government_id",
  "Legal & Docs":           "legal_docs",
  "Government Services":    "government_service",
  "Typing & Print":         "typing_print",
};

const PHONE_REGEX = /^[0-9]{10}$/;
const DELETE_ACCESS_CODE = "241100";
const MENU_OPTION_STYLE = { color: "#0f172a", backgroundColor: "#ffffff" };
const MENU_OPTGROUP_STYLE = { color: "rgba(15,23,42,0.58)", backgroundColor: "#f1f5f9" };
const BRAND_PRIMARY = "#1a56db";
const BRAND_PRIMARY_DARK = "#1540b0";
const BRAND_PRIMARY_SOFT = "rgba(26,86,219,0.12)";
const NEGOTIATION_FACTOR_MIN = 0.5;
const NEGOTIATION_FACTOR_MAX = 1.5;
const NEGOTIATION_FACTOR_STEP = 0.05;
const RATE_CONTEXT_OPTIONS = OPERATOR_DIRECTORY.map((operator) => ({
  key: `operator:${operator.id}`,
  label: `${operator.name} Desk`,
  helper: operator.role,
}));
const DOCUMENT_PRESETS = [
  { id: "aadhaar", label: "Aadhaar" },
  { id: "pan", label: "PAN" },
  { id: "passport", label: "Passport" },
  { id: "voter_id", label: "Voter ID" },
  { id: "driving_license", label: "Driving License" },
  { id: "ration_card", label: "Ration Card" },
  { id: "bank_passbook", label: "Bank Passbook" },
  { id: "photo", label: "Photograph" },
];
const DOCUMENT_PRESET_MAP = DOCUMENT_PRESETS.reduce((acc, preset) => {
  acc[preset.id] = preset;
  return acc;
}, {});
const DOCUMENT_PRESET_BY_NAME = DOCUMENT_PRESETS.reduce((acc, preset) => {
  acc[String(preset.label || "").trim().toLowerCase()] = preset;
  return acc;
}, {});
const APP_FONT_STACK = "'Manrope', system-ui, -apple-system, sans-serif";
const APP_SERIF_STACK = "'Manrope', system-ui, -apple-system, sans-serif";
const APP_BRAND_STACK = "'League Spartan', 'Manrope', sans-serif";
const APP_MONO_STACK = "'JetBrains Mono', 'Cascadia Code', Consolas, monospace";
const OPS = {
  bg: "#eef2f7",
  shell: "#ffffff",
  surface: "#ffffff",
  surfaceMuted: "#f4f7fa",
  border: "rgba(13,27,42,0.11)",
  borderSoft: "rgba(13,27,42,0.07)",
  text: "#0d1b2a",
  textMuted: "#3d5068",
  primary: "#1a56db",
  primarySoft: "rgba(26,86,219,0.10)",
  primaryBorder: "rgba(26,86,219,0.32)",
  success: "#059669",
  successSoft: "rgba(5,150,105,0.10)",
  warning: "#b45309",
  warningSoft: "rgba(180,83,9,0.10)",
  danger: "#dc2626",
  dangerSoft: "rgba(220,38,38,0.10)",
  shadowSoft: "0 1px 3px rgba(13,27,42,0.07), 0 0 0 1px rgba(13,27,42,0.05)",
  shadowElevated: "0 8px 24px rgba(13,27,42,0.09), 0 0 0 1px rgba(13,27,42,0.06)",
};
const STATUS_THEME = {
  info: {
    text: "#1a56db",
    bg: "rgba(26,86,219,0.09)",
    border: "rgba(26,86,219,0.24)",
  },
  success: {
    text: "#059669",
    bg: "rgba(5,150,105,0.09)",
    border: "rgba(5,150,105,0.26)",
  },
  warning: {
    text: "#b45309",
    bg: "rgba(180,83,9,0.09)",
    border: "rgba(180,83,9,0.26)",
  },
  danger: {
    text: "#dc2626",
    bg: "rgba(220,38,38,0.09)",
    border: "rgba(220,38,38,0.28)",
  },
};
const ELEVATION = {
  flat: "none",
  raised: "0 6px 18px rgba(15,23,42,0.06)",
  prominent: "0 14px 34px rgba(15,23,42,0.10)",
};
const APP_MAX_WIDTH = 1240;
const STORAGE_KEYS = {
  activeTab: "csc-buddy.active-tab",
  sidePanelExpanded: "csc-buddy.side-menu-open",
  sidebarCollapsed: "csc-buddy.sidebar-collapsed",
  services: "csc-buddy.services",
  tickets: "csc-buddy.tickets",
  b2bLedger: "csc-buddy.b2b-ledger",
  ticketDraft: "csc-buddy.ticket-draft",
  ticketCounter: "csc-buddy.ticket-counter",
  quickLinks: "csc-buddy.quick-links",
  databaseRecords: "csc-buddy.database-records",
};
const TAB_CONFIG = [
  { id: "home", label: "Dashboard Home", shortLabel: "HM", navGroup: "home" },
  { id: "entry", label: "New Service Entry", shortLabel: "NS", navGroup: "primary" },
  { id: "monthly", label: "Analytics", shortLabel: "AN", navGroup: "primary" },
  { id: "b2b", label: "Vendor Dashboard", shortLabel: "VD", navGroup: "panel" },
  { id: "database", label: "Database", shortLabel: "DB", navGroup: "panel" },
  { id: "log", label: "Ticket Dashboard", shortLabel: "TD", navGroup: "panel" },
  { id: "quick_links", label: "Quick Website Links", shortLabel: "QL", navGroup: "panel" },
  { id: "doc_tools", label: "Document Tools", shortLabel: "DT", navGroup: "panel" },
  { id: "services_dashboard", label: "Services Dashboard", shortLabel: "SD", navGroup: "panel" },
];
const PRIMARY_TAB_CONFIG = TAB_CONFIG.filter((item) => item.navGroup === "primary");
const PANEL_TAB_CONFIG = TAB_CONFIG.filter((item) => item.navGroup === "panel");
const HOME_NAV_BUTTONS = [
  {
    id: "entry",
    label: "New Service Entry",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "100%", height: "100%" }}>
        <rect x="5" y="3.5" width="14" height="17" rx="2.5" />
        <path d="M9 2.5h6v2H9z" />
        <path d="M12 9v6" />
        <path d="M9 12h6" />
      </svg>
    ),
  },
  {
    id: "b2b",
    label: "Vendor Dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "100%", height: "100%" }}>
        <path d="M3.5 20.5h17" />
        <rect x="5" y="10" width="5.5" height="10.5" rx="1" />
        <rect x="12.5" y="6.5" width="6.5" height="14" rx="1" />
        <path d="M7.2 12.8h1.1M7.2 15.6h1.1M14.5 9.2h1.1M16.8 9.2h1.1M14.5 12h1.1M16.8 12h1.1" />
      </svg>
    ),
  },
  {
    id: "monthly",
    label: "Analytics",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "100%", height: "100%" }}>
        <path d="M4 20h16" />
        <rect x="5.5" y="12.5" width="3" height="7" rx="1" />
        <rect x="10.5" y="9.5" width="3" height="10" rx="1" />
        <rect x="15.5" y="6.5" width="3" height="13" rx="1" />
      </svg>
    ),
  },
  {
    id: "database",
    label: "Database",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "100%", height: "100%" }}>
        <path d="m12 3 7 3v5.7c0 4.2-2.7 7-7 9.3-4.3-2.3-7-5.1-7-9.3V6z" />
        <rect x="9.2" y="11.2" width="5.6" height="4.4" rx="1" />
        <path d="M10.3 11.2V10a1.7 1.7 0 0 1 3.4 0v1.2" />
      </svg>
    ),
  },
  {
    id: "log",
    label: "Ticket Dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "100%", height: "100%" }}>
        <path d="M4 8.5h3V6h10v2.5h3v7h-3V18H7v-2.5H4z" />
        <path d="M9 10.5h6M9 13.5h4" />
      </svg>
    ),
  },
  {
    id: "quick_links",
    label: "Quick Website Links",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "100%", height: "100%" }}>
        <path d="M14 5h5v5" />
        <path d="m10 14 9-9" />
        <path d="M19 13v5.5a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 18.5V6.5A1.5 1.5 0 0 1 5.5 5H11" />
      </svg>
    ),
  },
  {
    id: "doc_tools",
    label: "Document Tools",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "100%", height: "100%" }}>
        <path d="M7 3.5h7l4 4v13H7z" />
        <path d="M14 3.5v4h4" />
        <path d="M9.5 12h6.5M9.5 15h6.5M9.5 18h4.5" />
      </svg>
    ),
  },
  {
    id: "services_dashboard",
    label: "Services Dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "100%", height: "100%" }}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 12V3.5" />
        <path d="M12 12 18.5 16.5" />
      </svg>
    ),
  },
];
const CORE_WORKSPACE_TAB_IDS = ["entry", "monthly"];
const TOOL_WORKSPACE_TAB_IDS = ["b2b", "database", "log", "quick_links", "doc_tools", "services_dashboard"];
const DATABASE_SECTION_CONFIG = [
  {
    id: "aadhaar",
    label: "Aadhaar",
    fields: [
      { key: "aadhaarNumber", label: "Aadhaar Number", type: "text" },
      { key: "name", label: "Name", type: "text" },
      { key: "dateOfBirth", label: "Date of Birth", type: "text" },
      { key: "address", label: "Address", type: "text" },
      { key: "linkedMobileNumber", label: "Mobile Number Linked", type: "text" },
    ],
  },
  {
    id: "passport",
    label: "Passport",
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "passportNumber", label: "Passport Number", type: "text" },
      { key: "address", label: "Address", type: "text" },
      { key: "dateOfBirth", label: "Date of Birth", type: "text" },
    ],
  },
  {
    id: "pan_card",
    label: "PAN Card",
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "fatherName", label: "Father's Name", type: "text" },
      { key: "dateOfBirth", label: "Date of Birth", type: "text" },
      { key: "panNumber", label: "PAN Number", type: "text" },
    ],
  },
  {
    id: "mobile_numbers",
    label: "Mobile Numbers",
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "mobileNumber", label: "Mobile Number", type: "text" },
    ],
  },
];
const DATABASE_SECTION_MAP = DATABASE_SECTION_CONFIG.reduce((acc, section) => {
  acc[section.id] = section;
  return acc;
}, {});
const QUICK_LINK_DEFAULTS = [
  { id: "default_esathi", name: "e-Saathi", url: "https://edistrict.up.gov.in", isDefault: true },
  { id: "default_digitalseva", name: "Digital Seva Portal", url: "https://digitalseva.csc.gov.in", isDefault: true },
  { id: "default_estamping", name: "Estamping", url: "https://igrsup.gov.in", isDefault: true },
  { id: "default_pf", name: "PF (EPFO)", url: "https://www.epfindia.gov.in", isDefault: true },
  { id: "default_pension", name: "Pension (NPS)", url: "https://npscra.nsdl.co.in", isDefault: true },
  { id: "default_crsorgi", name: "dc.crsorgi", url: "https://dc.crsorgi.gov.in", isDefault: true },
];
const B2B_TRACKS = [
  { id: "take", label: "Services We Take", pendingLabel: "Pending Payable" },
  { id: "give", label: "Services We Give", pendingLabel: "Pending Collection" },
  { id: "agent", label: "Agents", pendingLabel: "Pending Commission" },
];
const B2B_TRACK_META = {
  take: {
    heading: "Purchase Ecosystem",
    entityPlural: "Vendors",
    entityCountLabel: "Total Vendors",
    amountLabel: "Total Purchase Amount",
    settledLabel: "Total Paid",
    pendingLabel: "Total Pending Payable",
    listHeading: "Outsource Partners",
    detailEntriesHeading: "Recent Purchases",
    amountCaption: "Payable by us",
    settledCaption: "Paid by us",
    pendingCaption: "Pending payable",
    submitLabel: "Add Purchase Entry",
    paidFieldLabel: "Paid Amount (Rs.)",
    rateFieldLabel: "Purchase Rate (Rs.)",
    previewVerb: "Payable",
  },
  give: {
    heading: "Sales Ecosystem",
    entityPlural: "Client-Vendors",
    entityCountLabel: "Total Client-Vendors",
    amountLabel: "Total Sales",
    settledLabel: "Total Collected",
    pendingLabel: "Total Pending Recovery",
    listHeading: "B2B Buyers",
    detailEntriesHeading: "Recent Sales Entries",
    amountCaption: "Receivable by us",
    settledCaption: "Collected by us",
    pendingCaption: "Pending collection",
    submitLabel: "Add Sales Entry",
    paidFieldLabel: "Collected Amount (Rs.)",
    rateFieldLabel: "Sales Rate (Rs.)",
    previewVerb: "Receivable",
  },
  agent: {
    heading: "Agent Ecosystem",
    entityPlural: "Agents",
    entityCountLabel: "Total Agents",
    amountLabel: "Total Referred Business",
    settledLabel: "Commission Paid",
    pendingLabel: "Commission Pending",
    listHeading: "Referral Agents",
    detailEntriesHeading: "Recent Referred Entries",
    amountCaption: "Referred business",
    settledCaption: "Commission paid",
    pendingCaption: "Pending commission",
    submitLabel: "Add Referral Entry",
    paidFieldLabel: "Commission Paid (Rs.)",
    rateFieldLabel: "Commission Rate (Rs.)",
    previewVerb: "Commission",
  },
};
const B2B_ROLE_BADGE_META = {
  take: { label: "Supplies to Us", color: "#1e3a8a", border: "rgba(30,58,138,0.28)", background: "rgba(30,58,138,0.08)" },
  give: { label: "Buys from Us", color: "#0f766e", border: "rgba(15,118,110,0.28)", background: "rgba(15,118,110,0.10)" },
  agent: { label: "Agent", color: "#7c2d12", border: "rgba(124,45,18,0.24)", background: "rgba(124,45,18,0.08)" },
};
const B2B_PAYMENT_MODES = ["Cash", "UPI", "Bank Transfer", "Credit", "Unspecified"];
const B2B_PARTNER_SEED = [
  {
    id: "raj_renu",
    name: "Raj/Renu",
    roles: ["take", "give"],
    servicesByRole: {
      take: [
        { label: "Outsource Services", items: ["Lamination", "PVC Card", "E-signature", "Appointments"] },
      ],
      give: [
        { label: "Services We Provide", items: ["E-Stamp Paper"] },
      ],
      agent: [],
    },
  },
  {
    id: "ashad_raja",
    name: "Ashad Raja",
    roles: ["take", "give"],
    servicesByRole: {
      take: [
        { label: "Outsource Services", items: ["Notary", "Mobile Number Update"] },
      ],
      give: [
        { label: "Services We Provide", items: ["E-Stamp Paper"] },
      ],
      agent: [],
    },
  },
  {
    id: "sachin",
    name: "Sachin",
    roles: ["take"],
    servicesByRole: {
      take: [
        { label: "Outsource Services", items: ["Notary"] },
      ],
      give: [],
      agent: [],
    },
  },
  {
    id: "varun_riya",
    name: "Varun/Riya",
    roles: ["take"],
    servicesByRole: {
      take: [
        {
          label: "Aadhaar Services",
          items: [
            "Child Fresh Apply (Age less than 5)",
            "Child Fresh Apply (Age more than 5)",
            "Mobile Number Update",
            "Address Update",
            "DOB Increase",
            "DOB Decrease",
            "Biometric Update",
          ],
        },
      ],
      give: [],
      agent: [],
    },
  },
  {
    id: "saurabh",
    name: "Saurabh",
    roles: ["take"],
    servicesByRole: {
      take: [
        {
          label: "Driving License",
          items: ["Learner's", "Permanent", "Learner's + Permanent", "Renewal"],
        },
      ],
      give: [],
      agent: [],
    },
  },
  {
    id: "karan",
    name: "Karan",
    roles: ["give"],
    servicesByRole: {
      take: [],
      give: [
        { label: "Services We Provide", items: ["E-Stamp Paper"] },
      ],
      agent: [],
    },
  },
];
const B2B_AGENT_SEED = [];

function createB2BEntryForm(track) {
  return {
    partnerName: "",
    serviceName: "",
    quantity: "1",
    rate: "",
    settledAmount: "",
    paymentMode: "UPI",
    entryDate: getTicketCounterDateKey(new Date()),
    note: "",
    includeInDailyRevenue: track === "give",
    referredClient: "",
    businessAmount: "",
  };
}

function dedupeB2BItems(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    const normalized = normalizeEntityKey(item);
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

function normalizeExternalUrl(url) {
  const trimmed = String(url || "").trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function canUseBrowserHistory() {
  return typeof window !== "undefined" && typeof window.history !== "undefined";
}

function normalizePhoneValue(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 10);
}

function normalizeOtpInput(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 6);
}

async function fetchDatabaseSessionStatus() {
  try {
    const response = await fetch("/api/database-auth/session", {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 404) {
        return { ok: false, authenticated: false, message: "Security API is not available in this environment." };
      }
      return { ok: false, authenticated: false, message: payload?.message || "Session check failed." };
    }
    return { ok: true, authenticated: Boolean(payload?.authenticated), expiresAt: payload?.expiresAt || "" };
  } catch (_error) {
    return { ok: false, authenticated: false, message: "Unable to reach security server." };
  }
}

async function verifyDatabaseAccessOnServer({ securityCode, authenticatorCode }) {
  try {
    const response = await fetch("/api/database-auth/verify", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        securityCode: String(securityCode || "").trim(),
        authenticatorCode: normalizeOtpInput(authenticatorCode),
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 404) {
        return { ok: false, message: "Security API not available. Deploy on Vercel or run a server with /api routes." };
      }
      return { ok: false, message: payload?.message || "Verification failed." };
    }
    return { ok: true, expiresAt: payload?.expiresAt || "" };
  } catch (_error) {
    return { ok: false, message: "Unable to reach security server. Try again." };
  }
}

function verifyDeleteAccess(actionLabel, enteredCode) {
  if (String(enteredCode || "").trim() !== DELETE_ACCESS_CODE) {
    return { ok: false, message: `Access denied. Invalid code for ${actionLabel}.` };
  }
  return { ok: true, message: "" };
}

function updateBrowserState(nextState, mode = "push") {
  if (!canUseBrowserHistory()) return;
  const mergedState = { ...(window.history.state || {}), ...nextState };
  if (mode === "replace") {
    window.history.replaceState(mergedState, "");
    return;
  }
  window.history.pushState(mergedState, "");
}

function getOperatorConfig(operatorName) {
  return OPERATOR_DIRECTORY.find((operator) => operator.name === operatorName) || OPERATOR_DIRECTORY[0];
}

function getInitialActiveTab() {
  return "home";
}

function getOperatorTicketMetrics(tickets, operatorName) {
  const base = tickets.reduce((acc, ticket) => {
    if (ticket.operator !== operatorName) return acc;
    acc.ticketCount += 1;
    acc.revenue += Number(ticket.total) || 0;
    return acc;
  }, { ticketCount: 0, revenue: 0 });
  const avgTicketRate = base.ticketCount > 0 ? Math.round((base.revenue / base.ticketCount) * 100) / 100 : 0;
  return { ...base, avgTicketRate };
}

function getDefaultQuantityModeForService(service) {
  const id = String(service?.id || "").trim();
  const unit = String(service?.unit || "").toLowerCase();
  if (["legal_rent_agreement", "legal_sale_agreement", "legal_indemnity_bond", "legal_affidavits", "inhouse_stamp_paper"].includes(id)) return "fixed";
  if (unit.includes("page") || unit.includes("piece")) return "multiple";
  if (unit.includes("card") || unit.includes("application") || unit.includes("certificate") || unit.includes("document") || unit.includes("agreement")) return "people";
  return "fixed";
}

function getQuantityModeConfig(quantityMode) {
  return QUANTITY_MODE_CONFIG[quantityMode] || QUANTITY_MODE_CONFIG.fixed;
}

function getDefaultDetailSchemaId(category) {
  return CATEGORY_DETAIL_SCHEMA_IDS[category] || "typing_print";
}

function getDetailSchemaTitle(schemaId) {
  return (SERVICE_DETAIL_LIBRARY[schemaId] || SERVICE_DETAIL_LIBRARY.typing_print).title;
}

function toMoney(value) {
  return Math.round((Math.max(0, Number(value) || 0) + Number.EPSILON) * 100) / 100;
}

function clampNegotiationFactor(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 1;
  const clamped = Math.min(NEGOTIATION_FACTOR_MAX, Math.max(NEGOTIATION_FACTOR_MIN, numeric));
  return Math.round((clamped + Number.EPSILON) * 100) / 100;
}

function normalizeRateCard(rawRateCard, fallbackPrice = 0) {
  const fallback = toMoney(fallbackPrice);
  const baseRate = toMoney(rawRateCard?.baseRate ?? fallback);
  const rawContextRates = rawRateCard?.contextRates && typeof rawRateCard.contextRates === "object"
    ? rawRateCard.contextRates
    : {};
  const contextRates = Object.entries(rawContextRates).reduce((acc, [key, value]) => {
    const contextKey = String(key || "").trim();
    const parsed = Number(value);
    if (!contextKey || !Number.isFinite(parsed) || parsed < 0) return acc;
    acc[contextKey] = toMoney(parsed);
    return acc;
  }, {});
  return { baseRate, contextRates };
}

function getRateContextMeta(contextKey) {
  return RATE_CONTEXT_OPTIONS.find((option) => option.key === contextKey) || null;
}

function resolveServiceRate(service, context = {}) {
  const rateCard = normalizeRateCard(service?.rateCard, service?.price);
  const operatorConfig = getOperatorConfig(context.operator || DEFAULT_OPERATOR);
  const operatorContextKey = `operator:${operatorConfig.id}`;
  const contextRate = Number.isFinite(Number(rateCard.contextRates[operatorContextKey]))
    ? toMoney(rateCard.contextRates[operatorContextKey])
    : null;
  const resolvedRate = contextRate ?? rateCard.baseRate;
  return {
    rateCard,
    baseRate: rateCard.baseRate,
    contextKey: operatorContextKey,
    contextLabel: `${operatorConfig.name} Desk`,
    contextRate,
    hasContextOverride: contextRate !== null,
    resolvedRate,
  };
}

function normalizeService(service) {
  const quantityMode = QUANTITY_MODE_CONFIG[service?.quantityMode] ? service.quantityMode : getDefaultQuantityModeForService(service);
  const quantityModeConfig = getQuantityModeConfig(quantityMode);
  const parsedMaxQty = Number(service?.maxQty);
  const parsedPrice = Number(service?.price);
  const hasExplicitPrice = Number.isFinite(parsedPrice);
  const normalizedPrice = hasExplicitPrice ? toMoney(Math.max(0, parsedPrice)) : null;
  const normalizedRateCard = normalizeRateCard(service?.rateCard, normalizedPrice ?? 0);
  const rateCard = {
    ...normalizedRateCard,
    baseRate: normalizedPrice ?? normalizedRateCard.baseRate,
  };
  return {
    ...service,
    price: rateCard.baseRate,
    rateCard,
    detailSchemaId: SERVICE_DETAIL_LIBRARY[service?.detailSchemaId] ? service.detailSchemaId : CATEGORY_DETAIL_SCHEMA_IDS[service?.category] || "typing_print",
    quantityMode,
    quantityEnabled: quantityMode !== "fixed",
    minQty: quantityModeConfig.min,
    maxQty: Number.isFinite(parsedMaxQty) && parsedMaxQty > 0 ? parsedMaxQty : quantityModeConfig.defaultMax,
  };
}

function getServiceDetailSchema(service) {
  const schemaId = service?.detailSchemaId || CATEGORY_DETAIL_SCHEMA_IDS[service?.category];
  return SERVICE_DETAIL_LIBRARY[schemaId] || SERVICE_DETAIL_LIBRARY.typing_print;
}

function createDetailDraftForService(service, existingValues = {}) {
  const schema = getServiceDetailSchema(service);
  return schema.fields.reduce((acc, field) => {
    const fallbackValue = field.type === "number" ? "" : "";
    acc[field.key] = existingValues[field.key] ?? fallbackValue;
    return acc;
  }, {});
}

function validateServiceDetailValues(service, values) {
  const schema = getServiceDetailSchema(service);
  return schema.fields.reduce((errors, field) => {
    const rawValue = values?.[field.key];
    const textValue = String(rawValue ?? "").trim();
    if (field.required && !textValue) {
      errors[field.key] = `${field.label} is required.`;
      return errors;
    }
    if (field.type === "number" && textValue) {
      const numericValue = Number(textValue);
      if (!Number.isFinite(numericValue) || numericValue < (field.min || 0)) {
        errors[field.key] = `${field.label} must be ${field.min || 0} or more.`;
      }
    }
    return errors;
  }, {});
}

function getServiceDetailEntries(service, values) {
  const schema = getServiceDetailSchema(service);
  return schema.fields
    .map((field) => {
      const value = String(values?.[field.key] ?? "").trim();
      return value ? { label: field.label, value } : null;
    })
    .filter(Boolean);
}

function buildServiceDetailSummary(service, values) {
  return getServiceDetailEntries(service, values)
    .slice(0, 3)
    .map((entry) => `${entry.label}: ${entry.value}`)
    .join(" | ");
}

function normalizeDocNameKey(name) {
  return String(name || "").trim().toLowerCase();
}

function getUniqueSubmittedDocumentNames(documents) {
  const list = Array.isArray(documents) ? documents : [];
  const unique = [];
  const seen = new Set();
  list.forEach((doc) => {
    if (!doc?.submitted) return;
    const name = String(doc?.name || "").trim();
    const key = normalizeDocNameKey(name);
    if (!key || seen.has(key)) return;
    seen.add(key);
    unique.push(name);
  });
  return unique;
}

function normalizeDocumentListInput(rawValue) {
  if (Array.isArray(rawValue)) {
    return rawValue
      .map((entry) => {
        if (typeof entry === "string") return entry;
        if (!entry || typeof entry !== "object") return "";
        return String(
          entry.label
          || entry.name
          || entry.title
          || entry.document
          || entry.doc
          || entry.id
          || ""
        ).trim();
      })
      .map((entry) => String(entry || "").trim())
      .filter(Boolean);
  }
  if (typeof rawValue === "string") {
    return rawValue
      .split(/\r?\n|,|\|/)
      .map((entry) => String(entry || "").trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeConfiguredDocumentName(rawName) {
  const rawText = String(rawName || "").trim();
  if (!rawText) return "";
  const presetById = DOCUMENT_PRESET_MAP[rawText];
  if (presetById?.label) return presetById.label;
  const presetByName = DOCUMENT_PRESET_BY_NAME[normalizeDocNameKey(rawText)];
  if (presetByName?.label) return presetByName.label;
  return rawText;
}

function getRequiredDocumentNamesForService(service) {
  const configuredLists = [
    service?.requiredDocuments,
    service?.requiredDocs,
    service?.requiredDocumentSet,
    service?.documentsRequired,
    service?.requiredDocIds,
    service?.requiredDocumentIds,
  ];
  const unique = [];
  const seen = new Set();
  configuredLists.forEach((listValue) => {
    normalizeDocumentListInput(listValue).forEach((rawName) => {
      const normalizedName = normalizeConfiguredDocumentName(rawName);
      const normalizedKey = normalizeDocNameKey(normalizedName);
      if (!normalizedKey || seen.has(normalizedKey)) return;
      seen.add(normalizedKey);
      unique.push(normalizedName);
    });
  });
  return unique;
}

function getServiceRequiredDocumentId(serviceId, documentName) {
  const safeServiceId = String(serviceId || "").trim() || "service";
  const normalizedName = normalizeDocNameKey(documentName)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return `doc_req_${safeServiceId}_${normalizedName || "document"}`;
}

function areDocumentListsEqual(currentList, nextList) {
  if (!Array.isArray(currentList) || !Array.isArray(nextList)) return false;
  if (currentList.length !== nextList.length) return false;
  for (let index = 0; index < currentList.length; index += 1) {
    const left = currentList[index] || {};
    const right = nextList[index] || {};
    if (left.id !== right.id) return false;
    if (left.name !== right.name) return false;
    if (Boolean(left.required) !== Boolean(right.required)) return false;
    if (Boolean(left.submitted) !== Boolean(right.submitted)) return false;
    if (String(left.source || "") !== String(right.source || "")) return false;
    if (String(left.docPresetId || "") !== String(right.docPresetId || "")) return false;
    if (String(left.serviceId || "") !== String(right.serviceId || "")) return false;
    if (String(left.serviceName || "") !== String(right.serviceName || "")) return false;
  }
  return true;
}

function syncServiceRequiredDocuments(existingDocuments, serviceItems) {
  const currentDocs = Array.isArray(existingDocuments) ? existingDocuments : [];
  const activeItems = Array.isArray(serviceItems) ? serviceItems : [];
  if (activeItems.length === 0) return currentDocs;
  const staticDocs = currentDocs.filter((doc) => doc.source !== "service_required");
  const existingById = new Map(currentDocs.map((doc) => [String(doc.id || ""), doc]));
  const submittedPresetIds = new Set(
    currentDocs
      .filter((doc) => doc.submitted)
      .map((doc) => String(doc.docPresetId || "").trim())
      .filter(Boolean)
  );
  const submittedNameKeys = new Set(
    currentDocs
      .filter((doc) => doc.submitted)
      .map((doc) => normalizeDocNameKey(doc.name))
      .filter(Boolean)
  );

  const generatedDocs = [];
  const seenServiceIds = new Set();
  activeItems.forEach((item) => {
    const serviceId = String(item?.id || "").trim();
    if (!serviceId || seenServiceIds.has(serviceId)) return;
    seenServiceIds.add(serviceId);
    const serviceName = String(item?.name || serviceId);
    const requiredDocumentNames = getRequiredDocumentNamesForService(item);
    requiredDocumentNames.forEach((documentName) => {
      const normalizedDocumentName = normalizeConfiguredDocumentName(documentName);
      const normalizedDocumentKey = normalizeDocNameKey(normalizedDocumentName);
      if (!normalizedDocumentKey) return;
      const docPreset = DOCUMENT_PRESET_BY_NAME[normalizedDocumentKey] || null;
      const docPresetId = docPreset?.id || "";
      const displayName = docPreset?.label || normalizedDocumentName;
      const docIdKey = getServiceRequiredDocumentId(serviceId, displayName);
      const existingDoc = existingById.get(docIdKey);
      const shouldPrefillSubmitted = (docPresetId && submittedPresetIds.has(docPresetId))
        || submittedNameKeys.has(normalizeDocNameKey(displayName));
      generatedDocs.push({
        id: docIdKey,
        name: displayName,
        required: true,
        submitted: existingDoc ? Boolean(existingDoc.submitted) : shouldPrefillSubmitted,
        source: "service_required",
        docPresetId,
        serviceId,
        serviceName,
      });
    });
  });

  return [...generatedDocs, ...staticDocs];
}

function getTicketServiceTypes(items) {
  return Array.from(new Set((Array.isArray(items) ? items : []).map((item) => item.category).filter(Boolean)));
}

function getLegacyReferenceTypeLabel(typeId) {
  return LEGACY_REFERENCE_TYPE_LABELS[String(typeId || "").trim()] || "";
}

function getHasReferenceValue(source) {
  if (!source || typeof source !== "object") return false;
  if (typeof source.hasReference === "boolean") return source.hasReference;
  return Boolean(String(source.referenceName || "").trim());
}

function getReferenceLabelValue(source) {
  if (!source || typeof source !== "object") return "";
  const explicitLabel = String(source.referenceLabel || "").trim();
  if (explicitLabel) return explicitLabel;
  const legacyLabel = String(source.referenceTypeLabel || "").trim();
  if (legacyLabel) return legacyLabel;
  return getLegacyReferenceTypeLabel(source.referenceType);
}

function formatReferenceSummary(reference, emptyText = "No reference added") {
  if (!reference?.hasReference || !reference?.name) return emptyText;
  return reference.label ? `${reference.name} (${reference.label})` : reference.name;
}

function getTicketCounterDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toIsoDateKey(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return "";
  return getTicketCounterDateKey(parsed);
}

function getOffsetDateKey(offsetDays = 0) {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() + offsetDays);
  return getTicketCounterDateKey(base);
}

function formatIsoDateForDisplay(dateKey) {
  const normalized = toIsoDateKey(dateKey);
  if (!normalized) return todayStr();
  const parsed = new Date(`${normalized}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return todayStr();
  return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function getTicketSequenceFromNo(ticketNo, expectedDayMonth) {
  const match = String(ticketNo || "").trim().match(/^SLP-(\d{2})(\d{2})-(\d{3})(?:-[a-z0-9]{4})?$/i);
  if (!match) return 0;
  const [, day, month, seq] = match;
  if (`${day}${month}` !== expectedDayMonth) return 0;
  return Number(seq) || 0;
}

function getNextTicketSequence(date = new Date()) {
  if (!canUseStorage()) return 1;
  const dateKey = getTicketCounterDateKey(date);
  const dayMonthKey = `${String(date.getDate()).padStart(2, "0")}${String(date.getMonth() + 1).padStart(2, "0")}`;
  const storedCounter = readStoredJSON(STORAGE_KEYS.ticketCounter, {});
  const lastSeq = storedCounter?.dateKey === dateKey ? Number(storedCounter.lastSeq) || 0 : 0;
  const storedTickets = readStoredJSON(STORAGE_KEYS.tickets, []);
  const maxExistingSeq = Array.isArray(storedTickets)
    ? storedTickets.reduce((maxSeq, ticket) => {
      const nextSeq = getTicketSequenceFromNo(ticket?.ticketNo, dayMonthKey);
      return nextSeq > maxSeq ? nextSeq : maxSeq;
    }, 0)
    : 0;
  const nextSeq = Math.max(lastSeq, maxExistingSeq) + 1;
  writeStoredJSON(STORAGE_KEYS.ticketCounter, { dateKey, lastSeq: nextSeq });
  return nextSeq;
}

function generateBillNo() {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const mon = String(d.getMonth() + 1).padStart(2, "0");
  const storedTickets = readStoredJSON(STORAGE_KEYS.tickets, []);
  const existingNos = new Set(
    Array.isArray(storedTickets)
      ? storedTickets.map((ticket) => ticket?.ticketNo).filter(Boolean)
      : []
  );
  let nextSeq = getNextTicketSequence(d);
  let ticketNo = `SLP-${day}${mon}-${String(nextSeq).padStart(3, "0")}`;
  while (existingNos.has(ticketNo)) {
    nextSeq += 1;
    ticketNo = `SLP-${day}${mon}-${String(nextSeq).padStart(3, "0")}`;
  }
  writeStoredJSON(STORAGE_KEYS.ticketCounter, { dateKey: getTicketCounterDateKey(d), lastSeq: nextSeq });
  return ticketNo;
}

function todayStr() {
  const d = new Date();
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function timeStr() {
  return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function formatSyncTime(dateValue) {
  if (!dateValue) return "";
  const parsed = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function toStructuredTicket(ticket) {
  const services = Array.isArray(ticket.items) ? ticket.items.map((it) => ({ ...it })) : [];
  const docItems = Array.isArray(ticket.documents) ? ticket.documents.map((doc) => ({ ...doc })) : [];
  const total = Number(ticket.total) || 0;
  const cash = Number(ticket.cashCollected) || 0;
  const upi = Number(ticket.upiCollected) || 0;
  const paidTotal = Number(ticket.paidTotal) || cash + upi;
  const pendingBalance = Number.isFinite(Number(ticket.pendingBalance))
    ? Math.max(0, Number(ticket.pendingBalance))
    : Math.max(0, total - paidTotal);
  const paymentStatus = ticket.paymentStatus || (pendingBalance === 0 && paidTotal > 0 ? "Paid" : paidTotal > 0 ? "Partial" : "Unpaid");
  const requiredDocs = docItems.filter((doc) => doc.required).map((doc) => doc.name);
  const submittedDocs = docItems.filter((doc) => doc.submitted).map((doc) => doc.name);
  const providedDocs = docItems.filter((doc) => doc.submitted).map((doc) => doc.name);
  const referenceName = String(ticket.referenceName || "").trim();
  const hasReference = getHasReferenceValue(ticket) && Boolean(referenceName);
  const referenceLabel = hasReference ? getReferenceLabelValue(ticket) : "";
  const serviceTypes = getTicketServiceTypes(services);

  return {
    meta: {
      ticketNo: ticket.ticketNo || "",
      createdDate: ticket.date || "",
      createdTime: ticket.time || "",
      updatedAt: ticket.updatedAt || "",
      status: ticket.status || "Open",
      primaryType: serviceTypes[0] || "Unassigned",
      serviceTypes,
    },
    parties: {
      documentHolder: {
        name: ticket.customerName || "Walk-in Customer",
        phone: ticket.customerPhone || "",
      },
      reference: {
        hasReference,
        name: hasReference ? referenceName : "",
        label: referenceLabel,
        typeId: hasReference ? ticket.referenceType || "" : "",
        typeLabel: referenceLabel,
      },
    },
    assignment: {
      operator: ticket.operator || "",
    },
    payment: {
      mode: ticket.payMode || "Unpaid",
      total,
      paidTotal,
      pendingBalance,
      status: paymentStatus,
      vendorAmount: Number.isFinite(Number(ticket.vendorAmount)) ? Math.max(0, Number(ticket.vendorAmount)) : null,
      breakdown: {
        cash,
        upi,
      },
    },
    documents: {
      items: docItems,
      required: requiredDocs,
      submitted: submittedDocs,
      provided: providedDocs,
      stats: {
        total: docItems.length,
        required: requiredDocs.length,
        submitted: submittedDocs.length,
        provided: providedDocs.length,
      },
    },
    services,
  };
}

function withStructuredTicket(ticket) {
  return { ...ticket, structured: toStructuredTicket(ticket) };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildPrintableTicketHtml(ticket) {
  const normalizedTicket = ticket?.structured ? ticket : withStructuredTicket(ticket || {});
  const structured = normalizedTicket.structured || toStructuredTicket(normalizedTicket);
  const servicesHtml = structured.services.length > 0
    ? structured.services.map((item) => `
        <div class="row item-row">
          <span>${escapeHtml(item.name)}</span>
          <span>Qty ${escapeHtml(item.qty)} | Rs. ${escapeHtml(item.amount)}</span>
        </div>
      `).join("")
    : `<div class="muted">No services linked to this ticket.</div>`;
  const providedDocNames = getUniqueSubmittedDocumentNames(structured.documents.items);
  const providedDocs = providedDocNames.join(", ");
  const statusColor = structured.meta.status === "Closed" ? "#047857" : "#B45309";
  const referenceSummary = formatReferenceSummary(structured.parties.reference);

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(structured.meta.ticketNo || "CSC Ticket Slip")}</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 24px;
        background: #f8fafc;
        color: #0f172a;
        font-family: Outfit, "Segoe UI", sans-serif;
      }
      .slip {
        max-width: 420px;
        margin: 0 auto;
        background: #ffffff;
        border: 1px solid #dbe4ee;
        border-radius: 24px;
        padding: 24px 22px;
        box-shadow: 0 18px 36px rgba(15, 23, 42, 0.08);
      }
      .title {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.34em;
        text-align: center;
        color: #475569;
        margin-bottom: 6px;
      }
      .status {
        text-align: left;
        color: ${statusColor};
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        margin-bottom: 0;
      }
      .row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
      }
      .stack { margin-bottom: 12px; }
      .label {
        font-size: 10px;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        margin-bottom: 4px;
      }
      .value {
        font-size: 15px;
        font-weight: 700;
        color: #0f172a;
      }
      .muted {
        font-size: 12px;
        color: #475569;
        line-height: 1.55;
      }
      .divider {
        border-top: 1px dashed #cbd5e1;
        border-bottom: 1px dashed #cbd5e1;
        padding: 10px 0 9px;
        margin: 13px 0 12px;
      }
      .item-row {
        font-size: 12px;
        color: #1e293b;
        padding: 6px 0;
        border-bottom: 1px solid #eef2f7;
      }
      .item-row:last-child { border-bottom: none; }
      .meta-line {
        font-size: 12px;
        color: #475569;
        margin-top: 6px;
      }
      .header-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
        margin-bottom: 12px;
      }
      .file-box {
        text-align: right;
      }
      .identity {
        margin-bottom: 10px;
      }
      .identity .name {
        font-size: 19px;
        font-weight: 700;
        color: #0f172a;
        line-height: 1.22;
        margin-bottom: 7px;
      }
      .meta-block {
        border-top: 1px solid #e2e8f0;
        padding-top: 10px;
      }
      .meta-tight {
        margin-top: 4px;
      }
      .doc-list {
        margin-top: 6px;
      }
      @media print {
        body { background: #ffffff; padding: 0; }
        .slip {
          box-shadow: none;
          border-radius: 0;
          border: 1px solid #d1d5db;
        }
      }
    </style>
  </head>
  <body>
    <div class="slip">
      <div class="title">CSC TICKET SLIP</div>
      <div class="header-row">
        <div class="status">${escapeHtml(structured.meta.status)}</div>
        <div class="file-box">
          <div class="label">File Number</div>
          <div class="value">${escapeHtml(structured.meta.ticketNo)}</div>
        </div>
      </div>
      <div class="identity">
        <div class="label">Document Holder</div>
        <div class="name">${escapeHtml(structured.parties.documentHolder.name || "-")}</div>
        ${structured.parties.documentHolder.phone ? `<div class="meta-line">Contact: ${escapeHtml(structured.parties.documentHolder.phone)}</div>` : ""}
        <div class="meta-line">Reference Contact: ${escapeHtml(referenceSummary)}</div>
      </div>
      <div class="divider">
        ${servicesHtml}
      </div>
      <div class="meta-block">
        <div class="meta-line row">
          <span>Operator: ${escapeHtml(structured.assignment.operator || "N/A")}</span>
          <span>Created: ${escapeHtml(structured.meta.createdDate)} ${escapeHtml(structured.meta.createdTime)}</span>
        </div>
        <div class="meta-line meta-tight">Payment: Collected Rs. ${escapeHtml(structured.payment.paidTotal)} | Pending Rs. ${escapeHtml(structured.payment.pendingBalance)}</div>
        <div class="meta-line meta-tight">Docs: ${escapeHtml(structured.documents.items.filter((doc) => doc.required && doc.submitted).length)}/${escapeHtml(structured.documents.items.filter((doc) => doc.required).length)} required submitted</div>
        ${providedDocs ? `<div class="meta-line doc-list">Documents Collected: ${escapeHtml(providedDocs)}</div>` : ""}
      </div>
    </div>
    <script>
      window.addEventListener("load", function () {
        setTimeout(function () { window.print(); }, 150);
      });
      window.addEventListener("afterprint", function () {
        window.close();
      });
    </script>
  </body>
</html>`;
}

function printTicketSlip(ticket) {
  if (typeof window === "undefined") return;
  const printWindow = window.open("", "_blank", "width=520,height=760");
  if (!printWindow) return;
  printWindow.document.open();
  printWindow.document.write(buildPrintableTicketHtml(ticket));
  printWindow.document.close();
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readStoredJSON(key, fallbackValue) {
  if (!canUseStorage()) return fallbackValue;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallbackValue;
  } catch {
    return fallbackValue;
  }
}

function writeStoredJSON(key, value) {
  if (!canUseStorage()) return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // Ignore quota or browser storage errors and continue with in-memory state.
    return false;
  }
}

function removeStoredValue(key) {
  if (!canUseStorage()) return false;
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    // Ignore storage cleanup failures.
    return false;
  }
}

function useDebouncedStoredJSON(key, value, delay = 180, enabled = true, callbacks = null) {
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!enabled) return undefined;
    callbacks?.onSchedule?.();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      const saved = writeStoredJSON(key, value);
      if (saved) {
        callbacks?.onSaved?.();
      } else {
        callbacks?.onError?.();
      }
      timeoutRef.current = null;
    }, delay);
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [key, value, delay, enabled, callbacks]);
}

function hydrateServices(storedServices) {
  if (!Array.isArray(storedServices) || storedServices.length === 0) {
    return INITIAL_SERVICES.map((service) => normalizeService(service));
  }

  const defaultIds = new Set(INITIAL_SERVICES.map((service) => service.id));
  const savedById = new Map(
    storedServices
      .filter((service) => service && typeof service === "object" && typeof service.id === "string")
      .map((service) => [service.id, service])
  );

  // Merge saved price/settings onto registry defaults (preserves operator-set rates).
  const mergedDefaults = INITIAL_SERVICES.map((service) => (
    savedById.has(service.id) ? normalizeService({ ...service, ...savedById.get(service.id) }) : normalizeService(service)
  ));

  // Only keep operator-created custom services — not old built-in IDs that no
  // longer exist in the registry (those would appear as unclickable orphans).
  const customServices = storedServices.filter((service) => (
    service &&
    typeof service === "object" &&
    typeof service.id === "string" &&
    !defaultIds.has(service.id) &&
    String(service.name || "").trim() !== "" &&
    service._custom === true
  ));

  return [...mergedDefaults, ...customServices.map((service) => normalizeService(service))];
}

function hydrateTickets(storedTickets) {
  if (!Array.isArray(storedTickets)) return [];
  return storedTickets
    .filter((ticket) => ticket && typeof ticket === "object")
    .map((ticket) => withStructuredTicket(ticket));
}

function serializeTickets(tickets) {
  return tickets.map((ticket) => {
    const { structured, ...rawTicket } = ticket || {};
    return rawTicket;
  });
}

function normalizeEntityKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normalizeB2BLedgerEntry(entry, fallbackIndex = 0) {
  const legacyFlow = entry?.flow === "us_to_vendor" ? "us_to_vendor" : "vendor_to_us";
  const rawEcosystem = String(entry?.ecosystem || "").trim().toLowerCase();
  const ecosystem = rawEcosystem === "agent"
    ? "agent"
    : rawEcosystem === "give"
      ? "give"
      : rawEcosystem === "take"
        ? "take"
        : (legacyFlow === "us_to_vendor" ? "give" : "take");
  const flow = ecosystem === "give" ? "us_to_vendor" : "vendor_to_us";
  const entityType = ecosystem === "agent" ? "agent" : "vendor";
  const partnerId = String(entry?.partnerId || entry?.vendorId || entry?.agentId || "").trim();
  const fallbackPartnerName = ecosystem === "agent" ? "Unknown Agent" : "Unknown Vendor";
  const partnerName = String(entry?.partnerName || entry?.vendorName || entry?.agentName || fallbackPartnerName).trim() || fallbackPartnerName;
  const partnerKey = normalizeEntityKey(partnerName || partnerId || fallbackPartnerName);
  const quantity = Math.max(1, Number(entry?.quantity) || 1);
  const rate = Math.max(0, Number(entry?.rate) || 0);
  const computedAmount = Math.max(0, Number(entry?.amount) || quantity * rate);
  const paidAmount = Math.max(0, Math.min(computedAmount, Number(entry?.paidAmount) || 0));
  const pendingAmount = Math.max(0, computedAmount - paidAmount);
  const paymentStatus = pendingAmount === 0 && computedAmount > 0
    ? "Paid"
    : paidAmount > 0
      ? "Partial"
      : "Unpaid";
  const defaultEntryDate = getTicketCounterDateKey(new Date());
  const entryDate = toIsoDateKey(entry?.entryDate) || defaultEntryDate;
  const includeInDailyRevenue = ecosystem === "give"
    ? (typeof entry?.includeInDailyRevenue === "boolean" ? entry.includeInDailyRevenue : true)
    : false;
  const businessAmount = Math.max(0, Number(entry?.businessAmount) || 0);
  const referredClient = String(entry?.referredClient || "").trim();
  return {
    id: String(entry?.id || `b2b_${Date.now()}_${fallbackIndex}`),
    ecosystem,
    entityType,
    partnerId,
    partnerName,
    partnerKey,
    vendorId: partnerId,
    vendorName: partnerName,
    flow,
    serviceName: String(entry?.serviceName || "").trim(),
    quantity,
    rate,
    amount: computedAmount,
    paidAmount,
    pendingAmount,
    businessAmount,
    referredClient,
    paymentStatus,
    paymentMode: String(entry?.paymentMode || "Unspecified"),
    entryDate,
    note: String(entry?.note || "").trim(),
    includeInDailyRevenue,
    createdAt: String(entry?.createdAt || new Date().toISOString()),
  };
}

function hydrateB2BLedger(storedLedger) {
  if (!Array.isArray(storedLedger)) return [];
  return storedLedger
    .filter((entry) => entry && typeof entry === "object")
    .map((entry, idx) => normalizeB2BLedgerEntry(entry, idx));
}

function serializeB2BLedger(ledger) {
  if (!Array.isArray(ledger)) return [];
  return ledger.map((entry, idx) => normalizeB2BLedgerEntry(entry, idx));
}

function getDatabaseSection(sectionId) {
  return DATABASE_SECTION_MAP[sectionId] || DATABASE_SECTION_CONFIG[0];
}

function createEmptyDatabaseRecordValues(sectionId) {
  const section = getDatabaseSection(sectionId);
  return section.fields.reduce((acc, field) => {
    acc[field.key] = "";
    return acc;
  }, {});
}

function formatAadhaarNumber(value) {
  const digits = String(value ?? "").replace(/\D/g, "").slice(0, 12);
  if (!digits) return "";
  return digits.match(/.{1,4}/g)?.join(" ") || "";
}

function formatDobValue(value) {
  const rawValue = String(value ?? "").trim();
  if (!rawValue) return "";
  const isoMatch = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${day}/${month}/${year}`;
  }
  const digits = rawValue.replace(/\D/g, "").slice(0, 8);
  if (!digits) return "";
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

const DATABASE_OCR_ENABLED_SECTION_IDS = new Set(["aadhaar", "pan_card", "passport"]);
let tesseractModulePromise = null;
const OCR_DIGIT_TO_LETTER_MAP = {
  "0": "O",
  "1": "I",
  "2": "Z",
  "5": "S",
  "6": "G",
  "8": "B",
};
const OCR_LETTER_TO_DIGIT_MAP = {
  O: "0",
  Q: "0",
  D: "0",
  I: "1",
  L: "1",
  Z: "2",
  S: "5",
  B: "8",
  G: "6",
  T: "7",
};

function coerceOcrAlpha(char) {
  if (/^[A-Z]$/.test(char)) return char;
  return OCR_DIGIT_TO_LETTER_MAP[char] || "";
}

function coerceOcrDigit(char) {
  if (/^\d$/.test(char)) return char;
  return OCR_LETTER_TO_DIGIT_MAP[char] || "";
}

function normalizeAadhaarDigits(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[OQD]/g, "0")
    .replace(/\D/g, "")
    .slice(0, 12);
}

function normalizePanNumberCandidate(value) {
  const raw = String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (raw.length < 10) return "";
  const candidate = raw.slice(0, 10);
  const chars = candidate.split("");
  const normalized = [
    coerceOcrAlpha(chars[0]),
    coerceOcrAlpha(chars[1]),
    coerceOcrAlpha(chars[2]),
    coerceOcrAlpha(chars[3]),
    coerceOcrAlpha(chars[4]),
    coerceOcrDigit(chars[5]),
    coerceOcrDigit(chars[6]),
    coerceOcrDigit(chars[7]),
    coerceOcrDigit(chars[8]),
    coerceOcrAlpha(chars[9]),
  ].join("");
  if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(normalized)) return "";
  return normalized;
}

function normalizePassportNumberCandidate(value) {
  const raw = String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (raw.length < 8) return "";
  const candidate = raw.slice(0, 8);
  const normalized = `${coerceOcrAlpha(candidate[0])}${coerceOcrDigit(candidate[1])}${coerceOcrDigit(candidate[2])}${coerceOcrDigit(candidate[3])}${coerceOcrDigit(candidate[4])}${coerceOcrDigit(candidate[5])}${coerceOcrDigit(candidate[6])}${coerceOcrDigit(candidate[7])}`;
  if (!/^[A-Z][0-9]{7}$/.test(normalized)) return "";
  return normalized;
}

function toOcrLines(rawText) {
  return String(rawText || "")
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function isLikelyNameLine(line, { allowSingleWord = false } = {}) {
  const cleaned = String(line || "").replace(/\s+/g, " ").trim();
  if (!cleaned) return false;
  if (/\d/.test(cleaned)) return false;
  if (cleaned.length < 3 || cleaned.length > 52) return false;
  if (!allowSingleWord && cleaned.split(" ").length < 2) return false;
  if (/(government|india|passport|uidai|authority|address|dob|date of birth|birth|male|female|signature|identification|card|number|republic|issuing|valid|expiry|nationality|code|p<|ind)/i.test(cleaned)) return false;
  return cleaned.split(" ").every((token) => /^[A-Za-z.'-]+$/.test(token));
}

function extractDateFromOcrText(rawText) {
  const text = String(rawText || "");
  const preferred = text.match(/(?:DOB|Date of Birth|Birth)[^0-9]{0,12}([0-9]{2}[\/\-.][0-9]{2}[\/\-.][0-9]{4}|[0-9]{4}[\/\-.][0-9]{2}[\/\-.][0-9]{2})/i);
  if (preferred?.[1]) return formatDobValue(preferred[1]);
  const dayFirst = text.match(/\b([0-9]{2}[\/\-.][0-9]{2}[\/\-.][0-9]{4})\b/);
  if (dayFirst?.[1]) return formatDobValue(dayFirst[1]);
  const yearFirst = text.match(/\b([0-9]{4}[\/\-.][0-9]{2}[\/\-.][0-9]{2})\b/);
  if (yearFirst?.[1]) return formatDobValue(yearFirst[1]);
  return "";
}

function parseAadhaarFromOcrText(rawText) {
  const lines = toOcrLines(rawText);
  const joined = lines.join("\n");
  const aadhaarRawMatch = (joined.match(/\b[0-9OQD]{4}\s?[0-9OQD]{4}\s?[0-9OQD]{4}\b/i) || [])[0]
    || (joined.match(/\b[0-9OQD]{12}\b/i) || [])[0]
    || "";
  const aadhaarNumber = formatAadhaarNumber(normalizeAadhaarDigits(aadhaarRawMatch));
  const dateOfBirth = extractDateFromOcrText(joined);
  const dobLineIndex = lines.findIndex((line) => /(dob|date of birth|year of birth)/i.test(line));
  let name = "";
  if (dobLineIndex > 0) {
    const candidate = lines
      .slice(Math.max(0, dobLineIndex - 3), dobLineIndex)
      .reverse()
      .find((line) => isLikelyNameLine(line, { allowSingleWord: true }));
    if (candidate) name = candidate;
  }
  if (!name) {
    name = lines.find((line) => isLikelyNameLine(line, { allowSingleWord: true })) || "";
  }
  const addressIndex = lines.findIndex((line) => /\baddress\b/i.test(line));
  const address = addressIndex >= 0
    ? lines.slice(addressIndex + 1, addressIndex + 4).join(", ")
    : "";
  const linkedMobileNumber = (joined.match(/(?:mobile|mob|m\.?)[\s:-]*([6-9]\d{9})/i) || [])[1]
    || (joined.match(/\b[6-9]\d{9}\b/) || [])[0]
    || "";
  return {
    aadhaarNumber,
    name,
    dateOfBirth,
    address,
    linkedMobileNumber,
  };
}

function parsePanFromOcrText(rawText) {
  const lines = toOcrLines(rawText);
  const joined = lines.join("\n");
  const joinedUpper = joined.toUpperCase();
  const directPan = (joinedUpper.match(/\b[A-Z0-9]{10}\b/g) || [])
    .map((candidate) => normalizePanNumberCandidate(candidate))
    .find(Boolean) || "";
  const labelPanRaw = ((joinedUpper.match(/(?:PAN|PERMANENT ACCOUNT NUMBER|NUMBER)[^A-Z0-9]{0,8}([A-Z0-9]{10})/i) || [])[1] || "");
  const panNumber = directPan || normalizePanNumberCandidate(labelPanRaw);
  const dateOfBirth = extractDateFromOcrText(joined);
  const fatherLabelIndex = lines.findIndex((line) => /father/i.test(line));
  let fatherName = "";
  if (fatherLabelIndex >= 0) {
    fatherName = lines
      .slice(fatherLabelIndex + 1, fatherLabelIndex + 3)
      .find((line) => isLikelyNameLine(line, { allowSingleWord: true })) || "";
  }
  const nameLabelIndex = lines.findIndex((line) => /^name$/i.test(line) || /\bname\b/i.test(line));
  let name = "";
  if (nameLabelIndex >= 0) {
    name = lines
      .slice(nameLabelIndex + 1, nameLabelIndex + 3)
      .find((line) => isLikelyNameLine(line, { allowSingleWord: true }) && line !== fatherName) || "";
  }
  if (!name) {
    const fallbackNames = lines.filter((line) => isLikelyNameLine(line, { allowSingleWord: true }));
    name = fallbackNames.find((line) => line !== fatherName) || fallbackNames[0] || "";
  }
  return {
    name,
    fatherName,
    dateOfBirth,
    panNumber,
  };
}

function parsePassportFromOcrText(rawText) {
  const lines = toOcrLines(rawText);
  const joined = lines.join("\n");
  const joinedUpper = joined.toUpperCase();
  const passportNumber = (joinedUpper.match(/\b[A-Z0-9][0-9OILSBGT]{7}\b/g) || [])
    .map((candidate) => normalizePassportNumberCandidate(candidate))
    .find(Boolean) || "";
  const dateOfBirth = extractDateFromOcrText(joined);
  const surnameIndex = lines.findIndex((line) => /\bsurname\b/i.test(line));
  const givenNameIndex = lines.findIndex((line) => /\bgiven name\b/i.test(line));
  let surname = "";
  let givenName = "";
  if (surnameIndex >= 0) {
    surname = lines
      .slice(surnameIndex + 1, surnameIndex + 3)
      .find((line) => isLikelyNameLine(line, { allowSingleWord: true })) || "";
  }
  if (givenNameIndex >= 0) {
    givenName = lines
      .slice(givenNameIndex + 1, givenNameIndex + 3)
      .find((line) => isLikelyNameLine(line, { allowSingleWord: true })) || "";
  }
  let name = `${givenName} ${surname}`.replace(/\s+/g, " ").trim();
  if (!name) {
    const mrzLine = lines.find((line) => /^P<\w{3}/i.test(line));
    if (mrzLine) {
      const cleanedMrz = mrzLine.replace(/^P<\w{3}/i, "");
      const parts = cleanedMrz
        .split("<<")
        .map((part) => part.replace(/</g, " ").trim())
        .filter(Boolean);
      if (parts.length >= 2) {
        name = `${parts[1]} ${parts[0]}`.replace(/\s+/g, " ").trim();
      } else if (parts.length === 1) {
        name = parts[0];
      }
    }
  }
  if (!name) {
    name = lines.find((line) => isLikelyNameLine(line, { allowSingleWord: true })) || "";
  }
  const addressIndex = lines.findIndex((line) => /\baddress\b/i.test(line));
  const address = addressIndex >= 0
    ? lines.slice(addressIndex + 1, addressIndex + 4).join(", ")
    : "";
  return {
    name,
    passportNumber,
    address,
    dateOfBirth,
  };
}

function getDatabaseValuesFromOcrText(sectionId, rawText) {
  if (sectionId === "aadhaar") return parseAadhaarFromOcrText(rawText);
  if (sectionId === "pan_card") return parsePanFromOcrText(rawText);
  if (sectionId === "passport") return parsePassportFromOcrText(rawText);
  return {};
}

function hasAnyDatabaseFieldValue(values) {
  if (!values || typeof values !== "object") return false;
  return Object.values(values).some((value) => String(value || "").trim().length > 0);
}

function normalizeOcrValuesForDatabaseSection(sectionId, extractedValues) {
  const baseline = createEmptyDatabaseRecordValues(sectionId);
  const nextValues = { ...baseline };
  Object.keys(nextValues).forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(extractedValues, key)) {
      nextValues[key] = sanitizeDatabaseFieldValue(key, extractedValues[key]);
    }
  });
  return nextValues;
}

function scoreOcrExtractionForSection(sectionId, rawText) {
  const extractedValues = getDatabaseValuesFromOcrText(sectionId, rawText);
  let score = 0;
  Object.entries(extractedValues).forEach(([key, value]) => {
    const trimmed = String(value || "").trim();
    if (!trimmed) return;
    score += key.toLowerCase().includes("number") ? 4 : 2;
  });
  if (sectionId === "aadhaar") {
    const aadhaarDigits = String(extractedValues.aadhaarNumber || "").replace(/\D/g, "");
    if (aadhaarDigits.length === 12) score += 12;
  }
  if (sectionId === "pan_card" && /^[A-Z]{5}\d{4}[A-Z]$/.test(String(extractedValues.panNumber || ""))) {
    score += 12;
  }
  if (sectionId === "passport" && /^[A-Z][0-9]{7}$/.test(String(extractedValues.passportNumber || ""))) {
    score += 12;
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(String(extractedValues.dateOfBirth || ""))) {
    score += 6;
  }
  return score;
}

async function preprocessImageForOcr(file) {
  if (typeof document === "undefined" || !file) return null;
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read image file."));
    reader.readAsDataURL(file);
  });
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Unable to load image for OCR."));
    img.src = dataUrl;
  });
  const baseW = Math.max(1, Number(image.naturalWidth || image.width || 1));
  const baseH = Math.max(1, Number(image.naturalHeight || image.height || 1));
  const maxDimension = 2300;
  const scale = Math.min(2.8, Math.max(1.35, maxDimension / Math.max(baseW, baseH)));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(baseW * scale));
  canvas.height = Math.max(1, Math.round(baseH * scale));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  for (let idx = 0; idx < pixels.length; idx += 4) {
    const r = pixels[idx];
    const g = pixels[idx + 1];
    const b = pixels[idx + 2];
    const luminance = (0.299 * r) + (0.587 * g) + (0.114 * b);
    const boosted = Math.max(0, Math.min(255, ((luminance - 128) * 1.55) + 128));
    const sharpened = boosted > 168 ? 255 : boosted < 72 ? 0 : boosted;
    pixels[idx] = sharpened;
    pixels[idx + 1] = sharpened;
    pixels[idx + 2] = sharpened;
  }
  ctx.putImageData(imageData, 0, 0);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob || null), "image/png", 1);
  });
}

async function runOcrOnDatabaseDocument(file, sectionId, onProgress) {
  if (!file) throw new Error("Select a document image first.");
  if (!file.type || !file.type.startsWith("image/")) {
    throw new Error("Only image files are supported right now (JPG, PNG, WEBP).");
  }
  onProgress?.(4);
  const preprocessedBlob = await preprocessImageForOcr(file).catch(() => null);
  const attempts = [
    { source: file, psm: 6 },
    { source: file, psm: 11 },
  ];
  if (preprocessedBlob) {
    attempts.push({ source: preprocessedBlob, psm: 6 });
    attempts.push({ source: preprocessedBlob, psm: 11 });
  }
  let activeAttemptIndex = 0;
  const totalAttempts = attempts.length;
  if (!tesseractModulePromise) {
    tesseractModulePromise = import("tesseract.js");
  }
  const { createWorker } = await tesseractModulePromise;
  const worker = await createWorker("eng", 1, {
    logger: (message) => {
      if (message?.status === "recognizing text" && typeof message.progress === "number") {
        const completed = activeAttemptIndex / totalAttempts;
        const running = (message.progress / totalAttempts);
        onProgress?.(Math.max(5, Math.min(98, Math.round((completed + running) * 100))));
      }
    },
  });
  try {
    let bestText = "";
    let bestScore = -1;
    for (let idx = 0; idx < attempts.length; idx += 1) {
      activeAttemptIndex = idx;
      const attempt = attempts[idx];
      await worker.setParameters({
        tessedit_pageseg_mode: attempt.psm,
        preserve_interword_spaces: "1",
      });
      const result = await worker.recognize(attempt.source);
      const text = String(result?.data?.text || "");
      const confidence = Number(result?.data?.confidence || 0);
      const extractionScore = scoreOcrExtractionForSection(sectionId, text);
      const finalScore = (extractionScore * 100) + confidence;
      if (finalScore > bestScore) {
        bestScore = finalScore;
        bestText = text;
      }
    }
    onProgress?.(100);
    return bestText;
  } finally {
    await worker.terminate();
  }
}

function normalizeDatabaseFieldInput(fieldKey, value) {
  const rawValue = String(value ?? "");
  if (fieldKey === "aadhaarNumber") return formatAadhaarNumber(rawValue);
  if (fieldKey === "dateOfBirth") return formatDobValue(rawValue);
  if (fieldKey === "linkedMobileNumber" || fieldKey === "mobileNumber") return rawValue.replace(/\D/g, "").slice(0, 10);
  if (fieldKey === "panNumber") return rawValue.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 10);
  if (fieldKey === "passportNumber") return rawValue.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 15);
  return rawValue;
}

function sanitizeDatabaseFieldValue(fieldKey, value) {
  const textValue = String(value ?? "").trim();
  if (!textValue) return "";
  if (fieldKey === "aadhaarNumber") return formatAadhaarNumber(textValue);
  if (fieldKey === "dateOfBirth") return formatDobValue(textValue);
  if (fieldKey === "linkedMobileNumber" || fieldKey === "mobileNumber") return textValue.replace(/\D/g, "").slice(0, 10);
  if (fieldKey === "panNumber") return textValue.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 10);
  if (fieldKey === "passportNumber") return textValue.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 15);
  if (fieldKey === "name" || fieldKey === "fatherName") return textValue.replace(/\s+/g, " ").trim();
  return textValue;
}

function normalizeDatabaseRecordEntry(entry, fallbackIndex = 0) {
  const sectionId = DATABASE_SECTION_MAP[entry?.sectionId] ? entry.sectionId : DATABASE_SECTION_CONFIG[0].id;
  const section = getDatabaseSection(sectionId);
  const sourceValues = entry?.values && typeof entry.values === "object" ? entry.values : {};
  const values = section.fields.reduce((acc, field) => {
    acc[field.key] = sanitizeDatabaseFieldValue(field.key, sourceValues[field.key]);
    return acc;
  }, {});
  const createdAt = String(entry?.createdAt || new Date().toISOString());
  return {
    id: String(entry?.id || `db_record_${Date.now()}_${fallbackIndex}`),
    sectionId,
    values,
    isActiveClient: Boolean(entry?.isActiveClient),
    createdAt,
    updatedAt: String(entry?.updatedAt || createdAt),
  };
}

function hydrateDatabaseRecords(storedRecords) {
  if (!Array.isArray(storedRecords)) return [];
  return storedRecords
    .filter((record) => record && typeof record === "object")
    .map((record, idx) => normalizeDatabaseRecordEntry(record, idx));
}

function serializeDatabaseRecords(records) {
  if (!Array.isArray(records)) return [];
  return records.map((record, idx) => normalizeDatabaseRecordEntry(record, idx));
}

function getStoredActiveTab() {
  const storedTab = readStoredJSON(STORAGE_KEYS.activeTab, "home");
  return TAB_CONFIG.some((item) => item.id === storedTab) ? storedTab : "home";
}

function getStoredSidePanelExpanded() {
  const storedValue = readStoredJSON(STORAGE_KEYS.sidePanelExpanded, false);
  return typeof storedValue === "boolean" ? storedValue : false;
}

function getStoredSidebarCollapsed() {
  const storedValue = readStoredJSON(STORAGE_KEYS.sidebarCollapsed, false);
  return typeof storedValue === "boolean" ? storedValue : false;
}

function getStoredTicketDraft() {
  const draft = readStoredJSON(STORAGE_KEYS.ticketDraft, null);
  return draft && typeof draft === "object" ? draft : {};
}

function normalizeQuickLinksList(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => ({
      id: String(item?.id || `custom_${Date.now()}_${Math.floor(Math.random() * 1000)}`),
      name: String(item?.name || "").trim(),
      url: normalizeExternalUrl(item?.url || ""),
      isDefault: false,
    }))
    .filter((item) => item.name && item.url);
}

function getStoredQuickLinks() {
  const stored = readStoredJSON(STORAGE_KEYS.quickLinks, []);
  return normalizeQuickLinksList(stored);
}

//  Tab Button  -  vertical sidebar nav item
function TabBtn({ label, active, onClick, badge, shortLabel = "", expanded = true }) {
  return (
    <button onClick={onClick} aria-pressed={active} title={expanded ? undefined : label} style={{
      width: "100%", padding: expanded ? "10px 12px 10px 14px" : "10px 10px", border: "none",
      background: active ? OPS.primarySoft : "transparent",
      cursor: "pointer", transition: "all 0.18s ease",
      display: "flex", alignItems: "center", gap: 10, textAlign: "left",
      justifyContent: "flex-start",
      borderRadius: 10,
      boxShadow: active ? `inset 3px 0 0 ${OPS.primary}` : `inset 3px 0 0 ${OPS.borderSoft}`,
      outline: "none",
    }}>
      <span style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        display: "grid",
        placeItems: "center",
        background: active ? OPS.primarySoft : OPS.surfaceMuted,
        color: active ? OPS.primary : OPS.textMuted,
        fontSize: "0.58rem",
        fontWeight: 800,
        fontFamily: APP_FONT_STACK,
        letterSpacing: "0.06em",
        flexShrink: 0,
      }}>
        {shortLabel || label.slice(0, 2).toUpperCase()}
      </span>
      {expanded ? (
        <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.02em",
            fontFamily: APP_FONT_STACK,
            color: active ? OPS.text : OPS.textMuted,
            transition: "color 0.18s ease",
          }}>{label}</span>
          {badge && (
            <span style={{
              fontSize: "0.56rem", fontWeight: 700, letterSpacing: "0.08em",
              fontFamily: APP_FONT_STACK, textTransform: "uppercase",
              background: active ? OPS.primarySoft : OPS.surfaceMuted,
              color: active ? OPS.primary : OPS.textMuted,
              borderRadius: 999, padding: "2px 6px",
            }}>{badge}</span>
          )}
        </span>
        </span>
      ) : (
        <span style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
          <span style={{
            fontSize: "0.72rem",
            fontWeight: 700,
            color: active ? OPS.text : OPS.textMuted,
            fontFamily: APP_FONT_STACK,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}>
            {label}
          </span>
          {!!badge && (
            <span style={{
              fontSize: "0.58rem",
              fontWeight: 700,
              letterSpacing: "0.06em",
              fontFamily: APP_FONT_STACK,
              textTransform: "uppercase",
              background: active ? OPS.primarySoft : OPS.surfaceMuted,
              color: active ? OPS.primary : OPS.textMuted,
              borderRadius: 999,
              padding: "2px 5px",
              flexShrink: 0,
            }}>
              {badge}
            </span>
          )}
        </span>
      )}
    </button>
  );
}

function TabPanel({ active, children }) {
  return (
    <div
      aria-hidden={!active}
      style={{ display: active ? "block" : "none" }}
    >
      {children}
    </div>
  );
}

function BootLoadingScreen() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at 18% 12%, rgba(59,130,246,0.16), transparent 36%), linear-gradient(160deg, #f8fbff 0%, #eef4ff 52%, #f8fbff 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @keyframes cscDiceTilt {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(10deg) scale(1.05); }
          100% { transform: rotate(0deg) scale(1); }
        }
        @keyframes cscBarShimmer {
          0% { transform: translateX(-120%); opacity: 0.32; }
          45% { opacity: 0.85; }
          100% { transform: translateX(170%); opacity: 0.32; }
        }
        @keyframes cscDotWave {
          0%, 100% { transform: translateY(0) scale(0.88); opacity: 0.36; }
          50% { transform: translateY(-3px) scale(1); opacity: 1; }
        }
      `}</style>
      <div style={{
        position: "absolute",
        top: "clamp(16px, 4vw, 24px)",
        left: "clamp(16px, 4vw, 24px)",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
        <div style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          background: "rgba(37,99,235,0.13)",
          border: "1px solid rgba(37,99,235,0.28)",
          display: "grid",
          placeItems: "center",
          animation: "cscDiceTilt 1.2s ease-in-out infinite",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 3 }}>
            {[0, 1, 2, 3].map((dot) => (
              <span
                key={dot}
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "#1d4ed8",
                  display: "inline-block",
                }}
              />
            ))}
          </div>
        </div>
        <div style={{
          fontFamily: APP_BRAND_STACK,
          fontSize: "0.72rem",
          letterSpacing: "0.20em",
          textTransform: "uppercase",
          fontWeight: 700,
          color: "#1d4ed8",
        }}>
          CSC BUDDY
        </div>
      </div>
      <div style={{
        width: "min(420px, 84vw)",
        display: "grid",
        gap: 16,
        justifyItems: "center",
      }}>
        <div style={{
          width: "100%",
          height: 8,
          borderRadius: 999,
          background: "rgba(37,99,235,0.12)",
          border: "1px solid rgba(37,99,235,0.16)",
          overflow: "hidden",
          position: "relative",
        }}>
          <span style={{
            display: "block",
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: "42%",
            borderRadius: 999,
            background: "linear-gradient(90deg, rgba(37,99,235,0.18) 0%, rgba(37,99,235,0.85) 52%, rgba(37,99,235,0.18) 100%)",
            animation: "cscBarShimmer 1.35s ease-in-out infinite",
          }} />
        </div>
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8 }}>
          {[0, 1, 2, 3].map((idx) => (
            <span key={idx} style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#2563eb",
              animation: `cscDotWave 1.05s ${idx * 0.14}s infinite`,
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function HomeLaunchpad({ onOpenSection }) {
  return (
    <div style={{
      minHeight: "100vh",
      padding: "24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "radial-gradient(circle at 14% 6%, rgba(59,130,246,0.16), transparent 32%), radial-gradient(circle at 85% 85%, rgba(14,165,233,0.12), transparent 28%), #f8fbff",
    }}>
      <div style={{
        width: "min(1120px, 100%)",
        borderRadius: 18,
        border: "1px solid rgba(15,23,42,0.12)",
        background: "rgba(255,255,255,0.90)",
        boxShadow: "0 14px 34px rgba(15,23,42,0.10)",
        padding: 18,
      }}>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
          {HOME_NAV_BUTTONS.map((item) => (
            <button
              key={item.id}
              onClick={() => onOpenSection(item.id)}
              style={{
                borderRadius: 14,
                border: item.id === "database" ? "1px solid rgba(220,38,38,0.28)" : "1px solid rgba(37,99,235,0.24)",
                background: item.id === "database" ? "linear-gradient(160deg, rgba(220,38,38,0.08), rgba(248,113,113,0.03))" : "rgba(239,246,255,0.64)",
                padding: "16px 16px",
                textAlign: "left",
                display: "grid",
                cursor: "pointer",
                transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
                boxShadow: "0 6px 16px rgba(15,23,42,0.05)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span style={{ width: 20, height: 20, flexShrink: 0, opacity: 0.7, color: "rgba(15,23,42,0.76)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                    {item.icon}
                  </span>
                  <span style={{ fontFamily: APP_FONT_STACK, fontSize: "1.02rem", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>
                    {item.label}
                  </span>
                </div>
                {item.id === "database" && (
                  <span style={{
                    borderRadius: 999,
                    padding: "4px 8px",
                    border: "1px solid rgba(220,38,38,0.26)",
                    background: "rgba(220,38,38,0.08)",
                    color: "#991b1b",
                    fontSize: "0.58rem",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    fontFamily: APP_BRAND_STACK,
                  }}>
                    2FA
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
}) {
  if (!isOpen) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={onCancel} style={{ position: "absolute", inset: 0, background: "rgba(2,6,23,0.58)", backdropFilter: "blur(2px)" }} />
      <div role="dialog" aria-modal="true" style={{ position: "relative", width: "min(460px, 100%)", borderRadius: 16, border: "1px solid rgba(15,23,42,0.16)", background: "rgba(255,255,255,0.98)", boxShadow: "0 24px 60px rgba(2,6,23,0.28)", padding: 18 }}>
        <div style={{ fontFamily: APP_BRAND_STACK, fontWeight: 700, fontSize: "0.56rem", letterSpacing: "0.22em", textTransform: "uppercase", color: DS.wine, marginBottom: 8 }}>
          {title || "Please confirm"}
        </div>
        <div style={{ fontFamily: APP_FONT_STACK, fontSize: "0.9rem", lineHeight: 1.6, color: "rgba(15,23,42,0.80)", marginBottom: 16 }}>
          {message}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onCancel} style={{ border: "1px solid rgba(15,23,42,0.16)", borderRadius: 999, background: "rgba(255,255,255,0.82)", color: "rgba(15,23,42,0.72)", fontFamily: APP_BRAND_STACK, fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", padding: "10px 14px", cursor: "pointer" }}>
            {cancelLabel}
          </button>
          <button onClick={onConfirm} style={{ border: "1px solid rgba(37,99,235,0.38)", borderRadius: 999, background: "rgba(37,99,235,0.12)", color: DS.wine, fontFamily: APP_BRAND_STACK, fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", padding: "10px 14px", cursor: "pointer" }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function AccessCodeDialog({
  isOpen,
  title,
  message,
  code,
  error,
  onCodeChange,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1250, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={onCancel} style={{ position: "absolute", inset: 0, background: "rgba(2,6,23,0.62)", backdropFilter: "blur(2px)" }} />
      <div role="dialog" aria-modal="true" style={{ position: "relative", width: "min(460px, 100%)", borderRadius: 16, border: "1px solid rgba(15,23,42,0.16)", background: "rgba(255,255,255,0.98)", boxShadow: "0 24px 60px rgba(2,6,23,0.30)", padding: 18 }}>
        <div style={{ fontFamily: APP_BRAND_STACK, fontWeight: 700, fontSize: "0.56rem", letterSpacing: "0.22em", textTransform: "uppercase", color: DS.wine, marginBottom: 8 }}>
          {title || "Access code required"}
        </div>
        <div style={{ fontFamily: APP_FONT_STACK, fontSize: "0.88rem", lineHeight: 1.6, color: "rgba(15,23,42,0.78)", marginBottom: 10 }}>
          {message}
        </div>
        <input
          type="password"
          value={code}
          onChange={(event) => onCodeChange?.(event.target.value)}
          autoFocus
          placeholder="Enter access code"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onConfirm?.();
            }
          }}
          style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: error ? "1px solid rgba(214,5,43,0.40)" : "1px solid rgba(15,23,42,0.16)", background: "rgba(255,255,255,0.86)", color: "#0f172a", outline: "none", fontFamily: APP_MONO_STACK, fontSize: "0.88rem", marginBottom: error ? 8 : 14 }}
        />
        {error && (
          <div style={{ marginBottom: 12, color: "#1d4ed8", fontSize: "0.78rem", fontFamily: APP_FONT_STACK, fontWeight: 600 }}>
            {error}
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onCancel} style={{ border: "1px solid rgba(15,23,42,0.16)", borderRadius: 999, background: "rgba(255,255,255,0.82)", color: "rgba(15,23,42,0.72)", fontFamily: APP_BRAND_STACK, fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", padding: "10px 14px", cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{ border: "1px solid rgba(37,99,235,0.38)", borderRadius: 999, background: "rgba(37,99,235,0.12)", color: DS.wine, fontFamily: APP_BRAND_STACK, fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", padding: "10px 14px", cursor: "pointer" }}>
            Verify
          </button>
        </div>
      </div>
    </div>
  );
}

function QuickLinksWorkspace({
  quickLinks,
  showAddQuickLink,
  onToggleAddQuickLink,
  quickLinkName,
  setQuickLinkName,
  quickLinkUrl,
  setQuickLinkUrl,
  quickLinkError,
  onSaveQuickLink,
  onRemoveQuickLink,
  onOpenQuickLink,
}) {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ border: "1px solid rgba(15,23,42,0.12)", borderRadius: 16, background: "rgba(255,255,255,0.92)", padding: "16px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontFamily: APP_FONT_STACK, fontSize: "1.2rem", fontWeight: 700, color: "#0f172a" }}>
              Quick Website Links
            </div>
          </div>
          <button
            onClick={onToggleAddQuickLink}
            style={{
              border: "1px solid rgba(37,99,235,0.28)",
              borderRadius: 10,
              background: "rgba(37,99,235,0.10)",
              color: "#1d4ed8",
              fontFamily: APP_BRAND_STACK,
              fontSize: "0.62rem",
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              cursor: "pointer",
              padding: "9px 14px",
            }}
          >
            {showAddQuickLink ? "Cancel" : "Add Link"}
          </button>
        </div>
        {showAddQuickLink && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              onSaveQuickLink();
            }}
            style={{ marginTop: 12, display: "grid", gap: 9, gridTemplateColumns: "1fr 1fr auto" }}
          >
            <input
              value={quickLinkName}
              onChange={(e) => setQuickLinkName(e.target.value)}
              placeholder="Portal name"
              style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(15,23,42,0.14)", background: "rgba(255,255,255,0.92)", color: "#0f172a", fontFamily: APP_FONT_STACK, fontSize: "0.84rem" }}
            />
            <input
              value={quickLinkUrl}
              onChange={(e) => setQuickLinkUrl(e.target.value)}
              placeholder="example.com"
              style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(15,23,42,0.14)", background: "rgba(255,255,255,0.92)", color: "#0f172a", fontFamily: APP_FONT_STACK, fontSize: "0.84rem" }}
            />
            <button
              type="submit"
              style={{
                border: "1px solid rgba(22,163,74,0.34)",
                borderRadius: 10,
                background: "rgba(22,163,74,0.11)",
                color: "#166534",
                fontFamily: APP_BRAND_STACK,
                fontSize: "0.62rem",
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                cursor: "pointer",
                padding: "10px 14px",
              }}
            >
              Save
            </button>
          </form>
        )}
        {quickLinkError && <div style={{ marginTop: 8, fontSize: "0.78rem", color: "#b91c1c", fontWeight: 600, fontFamily: APP_FONT_STACK }}>{quickLinkError}</div>}
      </div>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}>
        {quickLinks.map((link) => (
          <div key={link.id} style={{ border: "1px solid rgba(15,23,42,0.12)", borderRadius: 14, background: "rgba(255,255,255,0.90)", padding: "12px 12px" }}>
            <div style={{ fontFamily: APP_FONT_STACK, fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", marginBottom: 9 }}>{link.name}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => onOpenQuickLink(link.url)}
                style={{
                  border: "1px solid rgba(37,99,235,0.30)",
                  borderRadius: 9,
                  background: "rgba(37,99,235,0.10)",
                  color: "#1d4ed8",
                  fontFamily: APP_BRAND_STACK,
                  fontSize: "0.58rem",
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  padding: "7px 10px",
                }}
              >
                Open
              </button>
              {!link.isDefault && (
                <button
                  onClick={() => onRemoveQuickLink(link.id)}
                  style={{
                    border: "1px solid rgba(220,38,38,0.30)",
                    borderRadius: 9,
                    background: "rgba(220,38,38,0.10)",
                    color: "#991b1b",
                    fontFamily: APP_BRAND_STACK,
                    fontSize: "0.58rem",
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    padding: "7px 10px",
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DatabaseWorkspace({ tickets, services, b2bLedger, records = [], onUpsertRecord, onDeleteRecord, cloudSyncState = "local_only" }) {
  const isOffline = cloudSyncState === "local_only";
  const [activeSectionId, setActiveSectionId] = useState(() => DATABASE_SECTION_CONFIG[0].id);
  const [formValues, setFormValues] = useState(() => createEmptyDatabaseRecordValues(DATABASE_SECTION_CONFIG[0].id));
  const [isActiveClient, setIsActiveClient] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState("");
  const [search, setSearch] = useState("");
  const [formError, setFormError] = useState("");
  const [ocrFile, setOcrFile] = useState(null);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrError, setOcrError] = useState("");
  const [ocrStatus, setOcrStatus] = useState("");
  const [ocrDropActive, setOcrDropActive] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });
  const [accessCodeDialog, setAccessCodeDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    actionLabel: "",
    code: "",
    error: "",
    onAuthorized: null,
  });
  const ocrFileInputRef = useRef(null);
  const totalCollections = tickets.reduce((sum, ticket) => sum + (Number(ticket.total) || 0), 0);
  const totalB2B = b2bLedger.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
  const sectionConfig = getDatabaseSection(activeSectionId);
  const ocrEnabledForSection = DATABASE_OCR_ENABLED_SECTION_IDS.has(activeSectionId);
  const activeSectionRecords = useMemo(() => (
    records
      .filter((record) => record.sectionId === activeSectionId)
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
  ), [records, activeSectionId]);
  const filteredSectionRecords = useMemo(() => {
    const query = String(search || "").trim().toLowerCase();
    if (!query) return activeSectionRecords;
    return activeSectionRecords.filter((record) => (
      sectionConfig.fields.some((field) => String(record.values[field.key] || "").toLowerCase().includes(query))
    ));
  }, [activeSectionRecords, search, sectionConfig.fields]);

  const resetForm = (sectionId = activeSectionId) => {
    setFormValues(createEmptyDatabaseRecordValues(sectionId));
    setIsActiveClient(false);
    setEditingRecordId("");
    setFormError("");
  };

  useEffect(() => {
    resetForm(activeSectionId);
    setOcrFile(null);
    setOcrBusy(false);
    setOcrProgress(0);
    setOcrError("");
    setOcrStatus("");
    setOcrDropActive(false);
  }, [activeSectionId]);

  const handleFieldChange = (fieldKey, rawValue) => {
    setFormValues((prev) => ({
      ...prev,
      [fieldKey]: normalizeDatabaseFieldInput(fieldKey, rawValue),
    }));
  };
  const handleOcrFileSelection = (file) => {
    if (!file) return;
    if (!file.type || !file.type.startsWith("image/")) {
      setOcrError("Please upload an image file (JPG, PNG, WEBP).");
      setOcrStatus("");
      setOcrFile(null);
      return;
    }
    setOcrFile(file);
    setOcrError("");
    setOcrStatus("");
    setOcrProgress(0);
  };
  const handleOcrInputChange = (event) => {
    const nextFile = event.target.files?.[0] || null;
    handleOcrFileSelection(nextFile);
    event.target.value = "";
  };
  const handleOcrDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setOcrDropActive(false);
    if (ocrBusy) return;
    const droppedFile = event.dataTransfer?.files?.[0] || null;
    handleOcrFileSelection(droppedFile);
  };
  const handleRunOcrExtraction = async () => {
    if (!ocrEnabledForSection || ocrBusy) return;
    if (!ocrFile) {
      setOcrError("Choose or drop a document image first.");
      return;
    }
    setOcrBusy(true);
    setOcrError("");
    setOcrStatus("");
    setOcrProgress(0);
    setFormError("");
    try {
      const extractedText = await runOcrOnDatabaseDocument(ocrFile, activeSectionId, setOcrProgress);
      const extractedValues = getDatabaseValuesFromOcrText(activeSectionId, extractedText);
      const normalizedValues = normalizeOcrValuesForDatabaseSection(activeSectionId, extractedValues);
      if (!hasAnyDatabaseFieldValue(normalizedValues)) {
        setOcrError("Could not detect enough details. Try a clearer image.");
        return;
      }
      const createdAt = new Date().toISOString();
      const nextRecord = normalizeDatabaseRecordEntry({
        id: `db_record_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        sectionId: activeSectionId,
        values: normalizedValues,
        isActiveClient,
        createdAt,
        updatedAt: createdAt,
      }, activeSectionRecords.length);
      onUpsertRecord?.(nextRecord);
      setFormValues(normalizedValues);
      setEditingRecordId("");
      const extractedCount = Object.values(normalizedValues).filter((value) => String(value || "").trim()).length;
      setOcrStatus(`Extracted ${extractedCount} field${extractedCount === 1 ? "" : "s"} and created a new entry.`);
    } catch (error) {
      setOcrError(error?.message || "Failed to read document.");
    } finally {
      setOcrBusy(false);
    }
  };

  const handleSaveRecord = () => {
    setFormError("");
    const existingRecord = editingRecordId
      ? activeSectionRecords.find((record) => record.id === editingRecordId)
      : null;
    const nextRecord = normalizeDatabaseRecordEntry({
      id: editingRecordId || `db_record_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      sectionId: activeSectionId,
      values: formValues,
      isActiveClient,
      createdAt: existingRecord?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, activeSectionRecords.length);
    onUpsertRecord?.(nextRecord);
    resetForm(activeSectionId);
  };
  const handleFormSubmit = (event) => {
    event.preventDefault();
    handleSaveRecord();
  };

  const handleEditRecord = (record) => {
    setEditingRecordId(record.id);
    setFormValues({
      ...createEmptyDatabaseRecordValues(record.sectionId),
      ...(record.values || {}),
    });
    setIsActiveClient(Boolean(record?.isActiveClient));
    setFormError("");
  };

  const handleExportRecordsToExcel = () => {
    if (!Array.isArray(records) || records.length === 0) {
      if (typeof window !== "undefined") {
        window.alert("No database records to export.");
      }
      return;
    }
    const allFields = [];
    DATABASE_SECTION_CONFIG.forEach((section) => {
      section.fields.forEach((field) => {
        if (!allFields.some((existing) => existing.key === field.key)) {
          allFields.push({ key: field.key, label: field.label });
        }
      });
    });
    const sectionLabelById = DATABASE_SECTION_CONFIG.reduce((acc, section) => {
      acc[section.id] = section.label;
      return acc;
    }, {});
    const csvEscape = (value) => {
      const text = String(value ?? "");
      if (/[",\n]/.test(text)) {
        return `"${text.replace(/"/g, "\"\"")}"`;
      }
      return text;
    };
    const header = ["Section", "Active Client", "Created At", "Updated At", ...allFields.map((field) => field.label)];
    const rows = records
      .map((record, idx) => normalizeDatabaseRecordEntry(record, idx))
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
      .map((record) => {
        const base = [
          sectionLabelById[record.sectionId] || record.sectionId,
          record.isActiveClient ? "Yes" : "No",
          new Date(record.createdAt).toLocaleString("en-IN"),
          new Date(record.updatedAt).toLocaleString("en-IN"),
        ];
        const values = allFields.map((field) => record.values?.[field.key] || "");
        return [...base, ...values];
      });
    const csvContent = [header, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\n");
    const csvBlob = new Blob([`\uFEFF${csvContent}`], { type: "text/csv;charset=utf-8;" });
    const exportDate = new Date().toISOString().slice(0, 10);
    const filename = `database-export-${exportDate}.csv`;
    if (typeof window !== "undefined") {
      const blobUrl = window.URL.createObjectURL(csvBlob);
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(blobUrl);
    }
  };

  const handleDeleteRecord = (record) => {
    setConfirmDialog({
      isOpen: true,
      title: `Delete ${sectionConfig.label} Entry`,
      message: `Delete this ${sectionConfig.label} entry? This cannot be undone.`,
      onConfirm: () => {
        closeConfirmDialog();
        setAccessCodeDialog({
          isOpen: true,
          title: "Access Code Required",
          message: `Enter access code to delete database entry ${record.id}.`,
          actionLabel: `delete database entry ${record.id}`,
          code: "",
          error: "",
          onAuthorized: () => {
            onDeleteRecord?.(record.id);
            if (editingRecordId === record.id) {
              resetForm(activeSectionId);
            }
            closeAccessCodeDialog();
          },
        });
      },
    });
  };
  const closeConfirmDialog = () => {
    setConfirmDialog({
      isOpen: false,
      title: "",
      message: "",
      onConfirm: null,
    });
  };
  const closeAccessCodeDialog = () => {
    setAccessCodeDialog({
      isOpen: false,
      title: "",
      message: "",
      actionLabel: "",
      code: "",
      error: "",
      onAuthorized: null,
    });
  };
  const submitDeleteAccessCode = () => {
    const verification = verifyDeleteAccess(accessCodeDialog.actionLabel, accessCodeDialog.code);
    if (!verification.ok) {
      setAccessCodeDialog((prev) => ({ ...prev, error: verification.message }));
      return;
    }
    const onAuthorized = accessCodeDialog.onAuthorized;
    closeAccessCodeDialog();
    onAuthorized?.();
  };

  if (isOffline) {
    return (
      <div style={{ display: "grid", gap: 14 }}>
        {/* Header bar — same chrome as online, export button dimmed */}
        <div style={{ border: "1px solid rgba(13,27,42,0.11)", borderRadius: 14, background: "#ffffff", padding: 12 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between", alignItems: "center" }}>
            <button
              type="button"
              disabled
              style={{
                border: "1px solid rgba(21,128,61,0.14)",
                borderRadius: 8,
                background: "#ffffff",
                color: "rgba(22,101,52,0.35)",
                fontFamily: APP_BRAND_STACK,
                fontSize: "0.76rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                cursor: "not-allowed",
                padding: "9px 14px",
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                opacity: 0.45,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect width="16" height="16" rx="3" fill="#217346" opacity="0.4"/>
                <path d="M2 4h5v1.5H2V4zm0 2.5h5V8H2V6.5zm0 2.5h5v1.5H2V9zm6-5h6v1.5H8V4zm0 2.5h6V8H8V6.5zm0 2.5h6v1.5H8V9zm-6 2.5h12V13H2v-1.5z" fill="white" opacity="0.5"/>
              </svg>
              Export to Excel
            </button>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {DATABASE_SECTION_CONFIG.map((section, i) => (
                <div
                  key={section.id}
                  style={{
                    border: i === 0 ? "1px solid rgba(26,86,219,0.18)" : "1px solid rgba(13,27,42,0.08)",
                    borderRadius: 8,
                    background: i === 0 ? "rgba(26,86,219,0.05)" : "#ffffff",
                    color: i === 0 ? "rgba(21,64,176,0.45)" : "rgba(13,27,42,0.35)",
                    padding: "8px 12px",
                    fontFamily: APP_BRAND_STACK,
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    opacity: 0.6,
                  }}
                >
                  <span>{section.label}</span>
                  <span style={{ fontFamily: APP_MONO_STACK, fontSize: "0.72rem", color: "rgba(13,27,42,0.28)" }}>—</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Offline notice */}
        <div style={{
          border: "1px solid rgba(180,83,9,0.20)",
          borderRadius: 14,
          background: "rgba(255,251,235,0.80)",
          padding: "18px 20px",
          display: "flex",
          alignItems: "flex-start",
          gap: 14,
        }}>
          <div style={{
            flexShrink: 0,
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "rgba(180,83,9,0.10)",
            border: "1px solid rgba(180,83,9,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 1,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(180,83,9,0.75)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 6s4-2 11-2 11 2 11 2"/>
              <path d="M5 10s2.5-1 7-1 7 1 7 1"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
              <path d="M10.72 14.28A2 2 0 0 1 12 14a2 2 0 0 1 0 4"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: APP_FONT_STACK, fontSize: "0.90rem", fontWeight: 700, color: "#92400e", marginBottom: 4 }}>
              Supabase not connected
            </div>
            <div style={{ fontFamily: APP_FONT_STACK, fontSize: "0.82rem", color: "rgba(120,53,15,0.80)", lineHeight: 1.55, maxWidth: 480 }}>
              The database requires a live Supabase connection. Add your <code style={{ fontFamily: APP_MONO_STACK, fontSize: "0.78rem", background: "rgba(180,83,9,0.08)", padding: "1px 5px", borderRadius: 4 }}>VITE_SUPABASE_URL</code> and <code style={{ fontFamily: APP_MONO_STACK, fontSize: "0.78rem", background: "rgba(180,83,9,0.08)", padding: "1px 5px", borderRadius: 4 }}>VITE_SUPABASE_ANON_KEY</code> environment variables, then reload the app. Records will load automatically once connected.
            </div>
          </div>
        </div>

        {/* Skeleton grid matching the real layout */}
        <div className="csc-db-main-grid">
          {/* Left: skeleton form */}
          <div style={{ border: "1px solid rgba(15,23,42,0.09)", borderRadius: 14, background: "rgba(255,255,255,0.80)", padding: 14, display: "grid", gap: 12, alignContent: "start" }}>
            <div style={{ height: 10, width: 120, borderRadius: 6, background: "rgba(15,23,42,0.07)" }} />
            {[100, 80, 100, 80, 100].map((w, i) => (
              <div key={i} style={{ display: "grid", gap: 6 }}>
                <div style={{ height: 8, width: `${w * 0.55}%`, borderRadius: 4, background: "rgba(15,23,42,0.06)" }} />
                <div style={{ height: 38, borderRadius: 8, background: "rgba(15,23,42,0.04)", border: "1px solid rgba(15,23,42,0.07)" }} />
              </div>
            ))}
            <div style={{ height: 38, borderRadius: 8, background: "rgba(15,23,42,0.04)", border: "1px solid rgba(15,23,42,0.06)", marginTop: 4 }} />
          </div>

          {/* Right: skeleton records list */}
          <div style={{ border: "1px solid rgba(15,23,42,0.09)", borderRadius: 14, background: "rgba(255,255,255,0.80)", padding: 14, display: "grid", gap: 10, alignContent: "start" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div style={{ height: 10, width: 140, borderRadius: 6, background: "rgba(15,23,42,0.07)" }} />
              <div style={{ height: 32, width: 160, borderRadius: 8, background: "rgba(15,23,42,0.04)", border: "1px solid rgba(15,23,42,0.07)" }} />
            </div>
            <div style={{ border: "1px solid rgba(15,23,42,0.08)", borderRadius: 10, background: "rgba(248,250,252,0.60)", overflow: "hidden" }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ padding: "12px 14px", borderBottom: i < 3 ? "1px solid rgba(15,23,42,0.06)" : "none", display: "grid", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ height: 8, width: 110, borderRadius: 4, background: "rgba(15,23,42,0.07)" }} />
                    <div style={{ display: "flex", gap: 6 }}>
                      <div style={{ height: 26, width: 42, borderRadius: 7, background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.10)" }} />
                      <div style={{ height: 26, width: 46, borderRadius: 7, background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.08)" }} />
                    </div>
                  </div>
                  <div style={{ display: "grid", gap: 7 }}>
                    {[80, 55, 70, 45].map((w, j) => (
                      <div key={j} style={{ height: 8, width: `${w}%`, borderRadius: 4, background: "rgba(15,23,42,0.05)" }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ border: "1px solid rgba(13,27,42,0.11)", borderRadius: 14, background: "#ffffff", padding: 12 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between", alignItems: "center" }}>
          <button
            type="button"
            onClick={handleExportRecordsToExcel}
            style={{
              border: "1px solid rgba(21,128,61,0.32)",
              borderRadius: 8,
              background: "#ffffff",
              color: "#166534",
              fontFamily: APP_BRAND_STACK,
              fontSize: "0.76rem",
              fontWeight: 700,
              letterSpacing: "0.06em",
              cursor: "pointer",
              padding: "9px 14px",
              whiteSpace: "nowrap",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 1px 3px rgba(21,128,61,0.10)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <rect width="16" height="16" rx="3" fill="#217346"/>
              <path d="M2 4h5v1.5H2V4zm0 2.5h5V8H2V6.5zm0 2.5h5v1.5H2V9zm6-5h6v1.5H8V4zm0 2.5h6V8H8V6.5zm0 2.5h6v1.5H8V9zm-6 2.5h12V13H2v-1.5z" fill="white"/>
              <text x="3.5" y="14.5" fontSize="4.5" fontWeight="bold" fill="white" fontFamily="sans-serif">XLS</text>
            </svg>
            Export to Excel
          </button>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {DATABASE_SECTION_CONFIG.map((section) => {
            const count = records.filter((record) => record.sectionId === section.id).length;
            const active = section.id === activeSectionId;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSectionId(section.id)}
                style={{
                  border: active ? "1px solid rgba(26,86,219,0.30)" : "1px solid rgba(13,27,42,0.12)",
                  borderRadius: 8,
                  background: active ? "rgba(26,86,219,0.09)" : "#ffffff",
                  color: active ? "#1540b0" : "#0d1b2a",
                  padding: "8px 12px",
                  fontFamily: APP_BRAND_STACK,
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: active ? "none" : "0 1px 2px rgba(13,27,42,0.05)",
                }}
              >
                <span>{section.label}</span>
                <span style={{ fontFamily: APP_MONO_STACK, fontSize: "0.72rem", color: active ? "#1a56db" : "rgba(13,27,42,0.46)" }}>{count}</span>
              </button>
            );
          })}
          </div>
        </div>
      </div>

      <div className="csc-db-main-grid">
        <form onSubmit={handleFormSubmit} style={{ border: "1px solid rgba(15,23,42,0.12)", borderRadius: 14, background: "rgba(255,255,255,0.94)", padding: 14, display: "grid", gap: 10, alignContent: "start" }}>
          <div style={{ fontSize: "0.60rem", fontWeight: 700, letterSpacing: "0.20em", textTransform: "uppercase", color: "rgba(15,23,42,0.45)", fontFamily: APP_BRAND_STACK }}>
            {sectionConfig.label} Details
          </div>
          {ocrEnabledForSection && (
            <div style={{ border: "1px solid rgba(37,99,235,0.22)", borderRadius: 10, background: "rgba(37,99,235,0.06)", padding: 10, display: "grid", gap: 8 }}>
              <div style={{ fontSize: "0.56rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#1d4ed8", fontFamily: APP_BRAND_STACK }}>
                Auto Extract From Document
              </div>
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (!ocrBusy) setOcrDropActive(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setOcrDropActive(false);
                }}
                onDrop={handleOcrDrop}
                style={{
                  border: ocrDropActive ? "1px solid rgba(37,99,235,0.54)" : "1px dashed rgba(37,99,235,0.34)",
                  borderRadius: 9,
                  background: ocrDropActive ? "rgba(37,99,235,0.12)" : "rgba(255,255,255,0.86)",
                  padding: "10px 11px",
                  color: "rgba(15,23,42,0.65)",
                  fontSize: "0.80rem",
                  fontFamily: APP_FONT_STACK,
                  lineHeight: 1.5,
                }}
              >
                Drop Aadhaar/PAN/Passport image here, or choose a file and extract.
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => ocrFileInputRef.current?.click()}
                  style={{
                    border: "1px solid rgba(15,23,42,0.18)",
                    borderRadius: 9,
                    background: "rgba(255,255,255,0.92)",
                    color: "rgba(15,23,42,0.76)",
                    fontFamily: APP_BRAND_STACK,
                    fontWeight: 700,
                    fontSize: "0.56rem",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    padding: "9px 11px",
                    cursor: "pointer",
                  }}
                >
                  Choose File
                </button>
                <button
                  type="button"
                  onClick={handleRunOcrExtraction}
                  disabled={ocrBusy || !ocrFile}
                  style={{
                    border: "1px solid rgba(37,99,235,0.42)",
                    borderRadius: 9,
                    background: ocrBusy || !ocrFile ? "rgba(37,99,235,0.06)" : "rgba(37,99,235,0.13)",
                    color: ocrBusy || !ocrFile ? "rgba(37,99,235,0.50)" : "#1e40af",
                    fontFamily: APP_BRAND_STACK,
                    fontWeight: 700,
                    fontSize: "0.56rem",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    padding: "9px 11px",
                    cursor: ocrBusy || !ocrFile ? "not-allowed" : "pointer",
                  }}
                >
                  {ocrBusy ? "Reading..." : "Extract & Create Entry"}
                </button>
              </div>
              {ocrFile && (
                <div style={{ fontSize: "0.76rem", color: "rgba(15,23,42,0.64)", fontFamily: APP_FONT_STACK }}>
                  Selected: {ocrFile.name}
                </div>
              )}
              {ocrBusy && (
                <div style={{ fontSize: "0.76rem", color: "#1d4ed8", fontFamily: APP_FONT_STACK }}>
                  OCR in progress... {Math.min(100, Math.max(0, ocrProgress))}%
                </div>
              )}
              {ocrStatus && (
                <div style={{ fontSize: "0.76rem", color: "#166534", fontFamily: APP_FONT_STACK, fontWeight: 600 }}>
                  {ocrStatus}
                </div>
              )}
              {ocrError && (
                <div style={{ fontSize: "0.76rem", color: "#b91c1c", fontFamily: APP_FONT_STACK, fontWeight: 600 }}>
                  {ocrError}
                </div>
              )}
              <input
                ref={ocrFileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/bmp,image/tiff"
                onChange={handleOcrInputChange}
                style={{ display: "none" }}
              />
            </div>
          )}
          {sectionConfig.fields.map((field) => (
            <label key={field.key} style={{ display: "grid", gap: 5 }}>
              <span style={{ fontFamily: APP_FONT_STACK, fontSize: "0.78rem", color: "rgba(15,23,42,0.62)", fontWeight: 600 }}>{field.label}</span>
              <input
                type="text"
                value={formValues[field.key] || ""}
                onChange={(event) => handleFieldChange(field.key, event.target.value)}
                placeholder={field.key === "dateOfBirth" ? "DD/MM/YYYY" : field.label}
                inputMode={field.key === "dateOfBirth" || field.key === "aadhaarNumber" ? "numeric" : undefined}
                maxLength={field.key === "dateOfBirth" ? 10 : field.key === "aadhaarNumber" ? 14 : undefined}
                style={{
                  padding: "10px 12px",
                  borderRadius: 9,
                  border: "1px solid rgba(15,23,42,0.14)",
                  background: "rgba(255,255,255,0.92)",
                  color: "#0f172a",
                  fontFamily: field.key === "dateOfBirth" ? APP_MONO_STACK : APP_FONT_STACK,
                  fontSize: "0.84rem",
                  outline: "none",
                }}
              />
            </label>
          ))}
          {formError && (
            <div style={{ fontFamily: APP_FONT_STACK, fontSize: "0.76rem", color: "#b91c1c", fontWeight: 600 }}>
              {formError}
            </div>
          )}
          <label style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 2, fontFamily: APP_FONT_STACK, fontSize: "0.80rem", color: "rgba(15,23,42,0.70)", fontWeight: 600, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={isActiveClient}
              onChange={(event) => setIsActiveClient(event.target.checked)}
              style={{ width: 15, height: 15 }}
            />
            Active Client
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="submit"
              style={{
                border: "1px solid rgba(22,163,74,0.34)",
                borderRadius: 9,
                background: "rgba(22,163,74,0.12)",
                color: "#166534",
                fontFamily: APP_BRAND_STACK,
                fontWeight: 700,
                fontSize: "0.60rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                padding: "10px 12px",
                cursor: "pointer",
              }}
            >
              {editingRecordId ? "Update Entry" : "Save Entry"}
            </button>
            <button
              type="button"
              onClick={() => resetForm(activeSectionId)}
              style={{
                border: "1px solid rgba(15,23,42,0.18)",
                borderRadius: 9,
                background: "rgba(15,23,42,0.05)",
                color: "rgba(15,23,42,0.72)",
                fontFamily: APP_BRAND_STACK,
                fontWeight: 700,
                fontSize: "0.60rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                padding: "10px 12px",
                cursor: "pointer",
              }}
            >
              Clear
            </button>
          </div>
        </form>

      <div style={{ border: "1px solid rgba(15,23,42,0.12)", borderRadius: 14, background: "rgba(255,255,255,0.94)", padding: 14, display: "grid", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontSize: "0.60rem", fontWeight: 700, letterSpacing: "0.20em", textTransform: "uppercase", color: "rgba(15,23,42,0.45)", fontFamily: APP_BRAND_STACK }}>
              Saved {sectionConfig.label} Records
            </div>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Search ${sectionConfig.label}`}
              style={{
                width: "min(240px, 100%)",
                padding: "9px 10px",
                borderRadius: 8,
                border: "1px solid rgba(15,23,42,0.14)",
                background: "rgba(255,255,255,0.88)",
                color: "#0f172a",
                fontFamily: APP_FONT_STACK,
                fontSize: "0.82rem",
                outline: "none",
              }}
            />
          </div>
          <div style={{ maxHeight: 460, overflowY: "auto", border: "1px solid rgba(15,23,42,0.08)", borderRadius: 10, background: "rgba(248,250,252,0.84)" }}>
            {filteredSectionRecords.length === 0 ? (
              <div style={{ padding: 14, color: "rgba(15,23,42,0.56)", fontFamily: APP_FONT_STACK, fontSize: "0.84rem" }}>
                No entries yet for {sectionConfig.label}.
              </div>
            ) : (
              filteredSectionRecords.map((record) => (
                <div key={record.id} style={{ padding: "10px 12px", borderBottom: "1px solid rgba(15,23,42,0.08)", display: "grid", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <div style={{ fontFamily: APP_MONO_STACK, fontSize: "0.72rem", color: "rgba(15,23,42,0.54)" }}>
                      {new Date(record.createdAt).toLocaleString("en-IN")}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => handleEditRecord(record)}
                        style={{
                          border: "1px solid rgba(37,99,235,0.28)",
                          borderRadius: 7,
                          background: "rgba(37,99,235,0.10)",
                          color: "#1d4ed8",
                          fontFamily: APP_BRAND_STACK,
                          fontSize: "0.56rem",
                          fontWeight: 700,
                          letterSpacing: "0.10em",
                          textTransform: "uppercase",
                          cursor: "pointer",
                          padding: "6px 8px",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRecord(record)}
                        style={{
                          border: "1px solid rgba(220,38,38,0.28)",
                          borderRadius: 7,
                          background: "rgba(220,38,38,0.10)",
                          color: "#991b1b",
                          fontFamily: APP_BRAND_STACK,
                          fontSize: "0.56rem",
                          fontWeight: 700,
                          letterSpacing: "0.10em",
                          textTransform: "uppercase",
                          cursor: "pointer",
                          padding: "6px 8px",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div style={{ display: "grid", gap: 5 }}>
                    <div className="csc-record-row">
                      <span style={{ fontFamily: APP_FONT_STACK, fontSize: "0.78rem", color: "rgba(15,23,42,0.52)", fontWeight: 600 }}>Active Client</span>
                      <span style={{ fontFamily: APP_FONT_STACK, fontSize: "0.82rem", color: record.isActiveClient ? "#166534" : "rgba(15,23,42,0.72)", fontWeight: 600 }}>
                        {record.isActiveClient ? "Yes" : "No"}
                      </span>
                    </div>
                    {sectionConfig.fields.map((field) => (
                      <div key={`${record.id}_${field.key}`} className="csc-record-row">
                        <span style={{ fontFamily: APP_FONT_STACK, fontSize: "0.78rem", color: "rgba(15,23,42,0.52)", fontWeight: 600 }}>{field.label}</span>
                        <span style={{ fontFamily: APP_FONT_STACK, fontSize: "0.82rem", color: "#0f172a" }}>
                          {record.values[field.key] || "-"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onCancel={closeConfirmDialog}
        onConfirm={() => confirmDialog.onConfirm?.()}
        confirmLabel="Continue"
      />
      <AccessCodeDialog
        isOpen={accessCodeDialog.isOpen}
        title={accessCodeDialog.title}
        message={accessCodeDialog.message}
        code={accessCodeDialog.code}
        error={accessCodeDialog.error}
        onCodeChange={(nextCode) => setAccessCodeDialog((prev) => ({ ...prev, code: nextCode, error: "" }))}
        onCancel={closeAccessCodeDialog}
        onConfirm={submitDeleteAccessCode}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// HackerUnlockAnimation
// Displayed between "Unlock" click and database reveal. Runs hacker-terminal
// theatrics while the real API request completes in parallel.
// phase: "running" | "success" | "error"
// ---------------------------------------------------------------------------
const HACKER_BOOT_LINES = [
  "$ init secure_handshake --proto=TLSv1.3",
  "$ connect supabase://csc-db.internal:5432",
  "Resolving host... done",
  "$ AUTH verify --2fa --operator-key",
  "Reading operator token from vault...",
  "$ decrypt index.csc.db --algo=AES-256-GCM",
  "Checking certificate chain... OK",
  "$ scan --deep records/*.enc",
  "Mounting encrypted partition /db/csc_records",
  "Validating operator code... ████████ OK",
  "$ handshake supabase --credentials=env",
  "Supabase handshake established ✓",
  "$ load schema csc_buddy.public.*",
  "Fetching row-level security policies...",
  "Decrypting database index... ██████████ OK",
  "$ verify --integrity sha256:a3f9c1...",
  "Integrity check passed ✓",
  "Mounting CSC records... done",
  "$ grant access --scope=operator --level=full",
];

const HACKER_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*<>/\\|{}[]";

function seededRand(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function HackerUnlockAnimation({ phase, onDone }) {
  const [visibleLines, setVisibleLines] = useState([]);
  const [scrambleText, setScrambleText] = useState("");
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState(0);
  const [cursor, setCursor] = useState(true);
  const [showGranted, setShowGranted] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const timers = React.useRef([]);
  const intervals = React.useRef([]);
  const lineIndexRef = React.useRef(0);
  const rand = React.useRef(seededRand(42));

  const clear = () => {
    timers.current.forEach(clearTimeout);
    intervals.current.forEach(clearInterval);
    timers.current = [];
    intervals.current = [];
  };

  React.useEffect(() => {
    return () => clear();
  }, []);

  // Cursor blink
  React.useEffect(() => {
    const id = setInterval(() => setCursor((c) => !c), 530);
    intervals.current.push(id);
    return () => clearInterval(id);
  }, []);

  // Scrolling log lines
  React.useEffect(() => {
    if (phase !== "running" && phase !== "success") return;
    const addLine = () => {
      const idx = lineIndexRef.current;
      if (idx >= HACKER_BOOT_LINES.length) return;
      lineIndexRef.current = idx + 1;
      setVisibleLines((prev) => {
        const next = [...prev, { text: HACKER_BOOT_LINES[idx], id: idx }];
        return next.slice(-12);
      });
    };
    addLine();
    const id = setInterval(() => {
      addLine();
      setProgress((p) => Math.min(p + rand.current() * 8 + 3, 94));
    }, 220);
    intervals.current.push(id);
    return () => clearInterval(id);
  }, [phase]);

  // Scramble text effect on a rotating string
  React.useEffect(() => {
    if (phase !== "running") return;
    const targets = ["DECRYPTING...", "AUTH CHECK..", "VALIDATING..", "HANDSHAKE...", "MOUNTING DB."];
    let targetIdx = 0;
    let charPos = 0;
    const id = setInterval(() => {
      const target = targets[targetIdx % targets.length];
      let out = "";
      for (let i = 0; i < target.length; i++) {
        if (i < charPos) {
          out += target[i];
        } else {
          out += HACKER_CHARS[Math.floor(rand.current() * HACKER_CHARS.length)];
        }
      }
      setScrambleText(out);
      charPos++;
      if (charPos > target.length + 4) {
        charPos = 0;
        targetIdx++;
      }
    }, 55);
    intervals.current.push(id);
    return () => clearInterval(id);
  }, [phase]);

  // Stage progression (for the segmented progress bar labels)
  React.useEffect(() => {
    if (phase !== "running" && phase !== "success") return;
    const delays = [0, 400, 850, 1300, 1700];
    delays.forEach((d, i) => {
      const id = setTimeout(() => setStage(i + 1), d);
      timers.current.push(id);
    });
  }, [phase]);

  // Success sequence
  React.useEffect(() => {
    if (phase !== "success") return;
    clear();
    setProgress(100);
    const t1 = setTimeout(() => setShowGranted(true), 280);
    const t2 = setTimeout(() => setFadeOut(true), 1200);
    const t3 = setTimeout(() => onDone?.(), 1700);
    timers.current = [t1, t2, t3];
  }, [phase]);

  const stageLabels = ["INIT", "AUTH", "DECRYPT", "MOUNT", "VERIFY"];

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 130,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,0.92)",
      opacity: fadeOut ? 0 : 1,
      transition: fadeOut ? "opacity 0.5s ease" : "opacity 0.2s ease",
    }}>
      {/* Scanlines overlay */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,70,0.025) 2px, rgba(0,255,70,0.025) 4px)",
        pointerEvents: "none",
        zIndex: 1,
      }} />

      {/* Main terminal panel */}
      <div style={{
        position: "relative",
        zIndex: 2,
        width: "min(600px, 94vw)",
        background: "rgba(0,10,2,0.97)",
        border: showGranted ? "1px solid rgba(0,255,70,0.7)" : "1px solid rgba(0,255,70,0.28)",
        borderRadius: 12,
        boxShadow: showGranted
          ? "0 0 0 1px rgba(0,255,70,0.18), 0 0 60px rgba(0,255,70,0.22), 0 0 120px rgba(0,255,70,0.10), inset 0 0 40px rgba(0,255,70,0.04)"
          : "0 0 0 1px rgba(0,255,70,0.08), 0 0 40px rgba(0,255,70,0.12), inset 0 0 20px rgba(0,255,70,0.03)",
        transition: "border-color 0.3s ease, box-shadow 0.3s ease",
        fontFamily: "'Courier New', 'Consolas', 'Monaco', monospace",
        overflow: "hidden",
      }}>
        {/* Terminal title bar */}
        <div style={{
          background: "rgba(0,255,70,0.07)",
          borderBottom: "1px solid rgba(0,255,70,0.14)",
          padding: "8px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}>
          <div style={{ display: "flex", gap: 6 }}>
            {["rgba(255,95,86,0.7)", "rgba(255,189,46,0.7)", "rgba(39,201,63,0.7)"].map((c, i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
            ))}
          </div>
          <span style={{ fontSize: "0.64rem", color: "rgba(0,255,70,0.55)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
            CSC-BUDDY SECURE TERMINAL — v2.1.0
          </span>
          <span style={{ fontSize: "0.60rem", color: "rgba(0,255,70,0.35)", letterSpacing: "0.10em" }}>
            {showGranted ? "SESSION ACTIVE" : "AUTHENTICATING"}
          </span>
        </div>

        <div style={{ padding: "14px 16px", minHeight: 280 }}>
          {/* Scrolling log */}
          <div style={{ marginBottom: 14, minHeight: 180, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            {visibleLines.map((line, i) => {
              const isNew = i === visibleLines.length - 1;
              return (
                <div key={line.id} style={{
                  fontSize: "0.72rem",
                  lineHeight: 1.7,
                  color: line.text.startsWith("$") ? "rgba(0,255,70,0.95)" : "rgba(0,255,70,0.55)",
                  fontWeight: line.text.startsWith("$") ? 600 : 400,
                  opacity: isNew ? 1 : Math.max(0.25, 1 - (visibleLines.length - 1 - i) * 0.07),
                  animation: isNew ? "termFadeIn 0.12s ease-out" : "none",
                }}>
                  {line.text.startsWith("$") ? (
                    <span>
                      <span style={{ color: "rgba(0,255,70,0.40)" }}>❯ </span>
                      {line.text.slice(2)}
                    </span>
                  ) : (
                    <span style={{ paddingLeft: 14 }}>{line.text}</span>
                  )}
                </div>
              );
            })}
            {/* Blinking cursor line */}
            {!showGranted && (
              <div style={{ fontSize: "0.72rem", color: "rgba(0,255,70,0.95)", lineHeight: 1.7 }}>
                <span style={{ color: "rgba(0,255,70,0.40)" }}>❯ </span>
                <span style={{ letterSpacing: "0.08em" }}>{scrambleText}</span>
                <span style={{
                  display: "inline-block",
                  width: 7,
                  height: 13,
                  background: cursor ? "rgba(0,255,70,0.9)" : "transparent",
                  marginLeft: 2,
                  verticalAlign: "middle",
                  transition: "background 0.1s",
                }} />
              </div>
            )}
          </div>

          {/* Stage progress bar */}
          {!showGranted && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                {stageLabels.map((label, i) => (
                  <div key={label} style={{
                    flex: 1,
                    height: 3,
                    borderRadius: 2,
                    background: stage > i ? "rgba(0,255,70,0.80)" : "rgba(0,255,70,0.10)",
                    transition: "background 0.3s ease",
                    boxShadow: stage > i ? "0 0 6px rgba(0,255,70,0.5)" : "none",
                  }} />
                ))}
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {stageLabels.map((label, i) => (
                  <div key={label} style={{
                    flex: 1,
                    textAlign: "center",
                    fontSize: "0.52rem",
                    letterSpacing: "0.10em",
                    color: stage > i ? "rgba(0,255,70,0.70)" : "rgba(0,255,70,0.22)",
                    transition: "color 0.3s ease",
                  }}>
                    {label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress bar */}
          {!showGranted && (
            <div style={{
              background: "rgba(0,255,70,0.07)",
              border: "1px solid rgba(0,255,70,0.14)",
              borderRadius: 4,
              height: 6,
              overflow: "hidden",
              marginBottom: 10,
            }}>
              <div style={{
                height: "100%",
                width: `${progress}%`,
                background: "linear-gradient(90deg, rgba(0,200,50,0.7) 0%, rgba(0,255,70,0.95) 100%)",
                borderRadius: 4,
                transition: "width 0.35s ease",
                boxShadow: "0 0 8px rgba(0,255,70,0.6)",
              }} />
            </div>
          )}

          {/* Bottom status line */}
          {!showGranted && (
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.60rem",
              color: "rgba(0,255,70,0.38)",
              letterSpacing: "0.10em",
            }}>
              <span>SUPABASE://CSC-DB.INTERNAL</span>
              <span>{Math.round(progress)}%</span>
            </div>
          )}

          {/* ACCESS GRANTED reveal */}
          {showGranted && (
            <div style={{
              textAlign: "center",
              padding: "20px 0 10px",
              animation: "grantedReveal 0.4s ease-out",
            }}>
              <div style={{
                fontSize: "2.2rem",
                fontWeight: 900,
                color: "rgba(0,255,70,1)",
                letterSpacing: "0.18em",
                textShadow: "0 0 20px rgba(0,255,70,0.8), 0 0 50px rgba(0,255,70,0.4), 0 0 90px rgba(0,255,70,0.2)",
                marginBottom: 8,
                lineHeight: 1,
              }}>
                ACCESS GRANTED
              </div>
              <div style={{
                fontSize: "0.68rem",
                color: "rgba(0,255,70,0.60)",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                marginBottom: 16,
              }}>
                DATABASE UNLOCKED — OPERATOR SESSION ACTIVE
              </div>
              <div style={{
                width: "100%",
                height: 1,
                background: "linear-gradient(90deg, transparent, rgba(0,255,70,0.5), transparent)",
                marginBottom: 16,
              }} />
              <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "rgba(0,255,70,0.8)",
                    boxShadow: "0 0 8px rgba(0,255,70,0.7)",
                    animation: `dotPulse 0.6s ease ${i * 0.1}s both`,
                  }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom glow strip */}
        <div style={{
          height: 2,
          background: showGranted
            ? "linear-gradient(90deg, transparent, rgba(0,255,70,0.9), transparent)"
            : "linear-gradient(90deg, transparent, rgba(0,255,70,0.35), transparent)",
          transition: "background 0.3s ease",
        }} />
      </div>

      <style>{`
        @keyframes termFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes grantedReveal {
          from { opacity: 0; transform: scale(0.94); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes dotPulse {
          0%   { opacity: 0; transform: scale(0.4); }
          60%  { opacity: 1; transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function DatabaseAccessModal({ onClose, onVerify }) {
  const [securityCode, setSecurityCode] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const handleVerify = async () => {
    if (checking) return;
    if (!String(securityCode || "").trim()) {
      setError("Enter security code.");
      return;
    }
    if (normalizeOtpInput(authCode).length !== 6) {
      setError("Enter valid 6-digit authenticator code.");
      return;
    }
    setChecking(true);
    setError("");
    try {
      const result = await onVerify?.({
        securityCode: String(securityCode || "").trim(),
        authenticatorCode: normalizeOtpInput(authCode),
      });
      if (!result?.ok) {
        setError(result?.message || "Verification failed.");
        return;
      }
      // onVerify signals success; animation+close is handled by the parent
    } finally {
      setChecking(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(2,6,23,0.58)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      zIndex: 120,
    }}>
      <div style={{
        width: "min(460px, 100%)",
        borderRadius: 18,
        border: "1px solid rgba(220,38,38,0.26)",
        background: "rgba(255,255,255,0.97)",
        boxShadow: "0 24px 56px rgba(15,23,42,0.28)",
        padding: "20px 18px",
      }}>
        <div style={{ fontSize: "0.60rem", fontWeight: 700, letterSpacing: "0.20em", textTransform: "uppercase", color: "#991b1b", fontFamily: APP_BRAND_STACK, marginBottom: 8 }}>
          Database Access Gate
        </div>
        <div style={{ fontFamily: APP_FONT_STACK, fontSize: "1.12rem", color: "#0f172a", fontWeight: 700, marginBottom: 12 }}>
          Verify both factors to continue
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          <input
            value={securityCode}
            onChange={(e) => setSecurityCode(e.target.value)}
            placeholder="Security code"
            style={{ padding: "11px 12px", borderRadius: 10, border: "1px solid rgba(15,23,42,0.16)", background: "#fff", color: "#0f172a", fontFamily: APP_FONT_STACK, fontSize: "0.9rem" }}
          />
          <input
            value={authCode}
            onChange={(e) => setAuthCode(normalizeOtpInput(e.target.value))}
            placeholder="Authenticator code"
            inputMode="numeric"
            maxLength={6}
            style={{ padding: "11px 12px", borderRadius: 10, border: "1px solid rgba(15,23,42,0.16)", background: "#fff", color: "#0f172a", fontFamily: APP_MONO_STACK, fontSize: "0.94rem", letterSpacing: "0.10em" }}
          />
        </div>
        {error && <div style={{ marginTop: 10, fontFamily: APP_FONT_STACK, fontSize: "0.78rem", color: "#b91c1c", fontWeight: 600 }}>{error}</div>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
          <button
            onClick={onClose}
            disabled={checking}
            style={{ border: "1px solid rgba(15,23,42,0.16)", borderRadius: 10, background: "rgba(15,23,42,0.06)", color: "rgba(15,23,42,0.72)", fontFamily: APP_BRAND_STACK, fontSize: "0.60rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", cursor: checking ? "not-allowed" : "pointer", padding: "9px 12px", opacity: checking ? 0.4 : 1 }}
          >
            Cancel
          </button>
          <button
            onClick={handleVerify}
            disabled={checking}
            style={{ border: "1px solid rgba(22,163,74,0.32)", borderRadius: 10, background: checking ? "rgba(22,163,74,0.08)" : "rgba(22,163,74,0.14)", color: "#166534", fontFamily: APP_BRAND_STACK, fontSize: "0.60rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", cursor: checking ? "wait" : "pointer", padding: "9px 12px" }}
          >
            {checking ? "Verifying..." : "Unlock"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SideNavItem({ item, active, expanded, badge, onClick }) {
  return (
    <button
      onClick={onClick}
      title={expanded ? undefined : item.label}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: expanded ? "space-between" : "center",
        gap: 12,
        padding: expanded ? "12px 14px" : "12px 10px",
        borderRadius: 12,
        border: active ? `1px solid ${OPS.primaryBorder}` : `1px solid ${OPS.borderSoft}`,
        background: active ? OPS.primarySoft : OPS.surface,
        color: active ? OPS.text : OPS.textMuted,
        cursor: "pointer",
        transition: DS.transStd,
        fontFamily: APP_FONT_STACK,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <div style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          display: "grid",
          placeItems: "center",
          background: active ? OPS.primarySoft : OPS.surfaceMuted,
          color: active ? OPS.primary : OPS.textMuted,
          fontSize: 11,
          fontWeight: 800,
          flexShrink: 0,
          fontFamily: APP_FONT_STACK,
          letterSpacing: "0.06em",
        }}>
          {item.shortLabel}
        </div>
        {expanded && (
          <div style={{ minWidth: 0, textAlign: "left" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: active ? OPS.text : OPS.textMuted, fontFamily: APP_FONT_STACK }}>
              {item.label}
            </div>
          </div>
        )}
      </div>
      {expanded && !!badge && (
        <div style={{
          borderRadius: 999,
          padding: "4px 8px",
          background: active ? OPS.primarySoft : OPS.surfaceMuted,
          color: active ? OPS.primary : OPS.textMuted,
          fontSize: 11,
          fontWeight: 700,
          flexShrink: 0,
          fontFamily: APP_FONT_STACK,
          letterSpacing: "0.05em",
        }}>
          {badge}
        </div>
      )}
    </button>
  );
}

function WorkspaceSidebar({
  activeTab,
  onNavigate,
  onOpenWhatsApp,
  badgeMap = {},
  isOpen = false,
  onClose,
}) {
  const coreItems = TAB_CONFIG.filter((item) => CORE_WORKSPACE_TAB_IDS.includes(item.id));
  const toolItems = TAB_CONFIG.filter((item) => TOOL_WORKSPACE_TAB_IDS.includes(item.id));
  const handleClose = () => {
    onClose?.();
  };
  const menuButtonStyle = (active) => ({
    width: "100%",
    border: active ? "1px solid rgba(26,86,219,0.30)" : "1px solid rgba(13,27,42,0.10)",
    borderRadius: 10,
    background: active ? "rgba(26,86,219,0.09)" : "#ffffff",
    cursor: "pointer",
    padding: "10px 12px",
    textAlign: "left",
    display: "grid",
    transition: "all 0.15s ease",
    boxShadow: active ? "0 0 0 0 transparent" : "0 1px 2px rgba(13,27,42,0.04)",
  });

  const renderMenuGroup = (items, heading) => (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{
        fontSize: "0.56rem",
        fontWeight: 700,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "rgba(15,23,42,0.45)",
        fontFamily: APP_BRAND_STACK,
      }}>
        {heading}
      </div>
      {items.map((item) => {
        const active = activeTab === item.id;
        const badge = badgeMap[item.id];
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            style={menuButtonStyle(active)}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <span style={{
                  width: 30,
                  height: 30,
                  borderRadius: 9,
                  display: "grid",
                  placeItems: "center",
                  background: active ? "rgba(26,86,219,0.14)" : "rgba(13,27,42,0.06)",
                  color: active ? "#1a56db" : "rgba(13,27,42,0.60)",
                  fontSize: "0.60rem",
                  fontWeight: 800,
                  fontFamily: APP_BRAND_STACK,
                  letterSpacing: "0.06em",
                  flexShrink: 0,
                }}>
                  {item.shortLabel}
                </span>
                <span style={{
                  fontFamily: APP_FONT_STACK,
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  color: active ? "#1540b0" : "#0d1b2a",
                  lineHeight: 1.2,
                  letterSpacing: "-0.01em",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}>
                  {item.label}
                </span>
              </div>
              {badge && (
                <span style={{
                  borderRadius: 6,
                  padding: "3px 7px",
                  border: "1px solid rgba(26,86,219,0.20)",
                  background: "rgba(26,86,219,0.08)",
                  color: "#1a56db",
                  fontFamily: APP_MONO_STACK,
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  flexShrink: 0,
                }}>
                  {badge}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );

  return (
    <aside className="csc-sidebar" style={{
      width: 320,
      minWidth: 320,
      background: "#ffffff",
      borderRight: "1px solid rgba(13,27,42,0.10)",
      display: "flex",
      flexDirection: "column",
      position: "fixed",
      left: 0,
      top: 0,
      bottom: 0,
      height: "100vh",
      overflow: "hidden",
      zIndex: 40,
      boxShadow: "4px 0 20px rgba(13,27,42,0.10), 1px 0 0 rgba(13,27,42,0.08)",
      transform: isOpen ? "translateX(0)" : "translateX(-108%)",
      opacity: isOpen ? 1 : 0,
      pointerEvents: isOpen ? "auto" : "none",
      transition: "transform 0.22s ease, opacity 0.18s ease",
      willChange: "transform",
    }}>
      <div style={{ padding: "20px 16px 14px", borderBottom: "1px solid rgba(13,27,42,0.09)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: "#1a56db",
              border: "none",
              display: "grid",
              placeItems: "center",
              color: "#ffffff",
              fontFamily: APP_BRAND_STACK,
              fontWeight: 800,
              fontSize: "0.64rem",
              letterSpacing: "0.08em",
            }}>
              CSC
            </div>
            <div>
              <div style={{ fontFamily: APP_BRAND_STACK, fontSize: "0.94rem", fontWeight: 800, color: "#0d1b2a", letterSpacing: "0.02em" }}>
                Partner Desk
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              border: "1px solid rgba(13,27,42,0.12)",
              borderRadius: 7,
              background: "#f4f7fa",
              color: "rgba(13,27,42,0.62)",
              fontFamily: APP_BRAND_STACK,
              fontWeight: 700,
              fontSize: "0.68rem",
              letterSpacing: "0.04em",
              cursor: "pointer",
              padding: "5px 9px",
              flexShrink: 0,
            }}
            aria-label="Hide navigation menu"
            title="Hide navigation menu"
          >
            ← Hide
          </button>
        </div>
        <button
          onClick={() => onNavigate("home")}
          style={{
            width: "100%",
            border: "1px solid rgba(26,86,219,0.28)",
            borderRadius: 8,
            background: "rgba(26,86,219,0.08)",
            color: "#1a56db",
            fontFamily: APP_BRAND_STACK,
            fontSize: "0.72rem",
            fontWeight: 700,
            letterSpacing: "0.06em",
            cursor: "pointer",
            padding: "9px 12px",
            textAlign: "center",
          }}
        >
          Dashboard Home
        </button>
      </div>

      <div className="csc-sidebar-nav" style={{ flex: 1, overflowY: "auto", padding: "14px 14px 10px", display: "grid", gap: 14, alignContent: "start" }}>
        {renderMenuGroup(coreItems, "Core Workflows")}
        {renderMenuGroup(toolItems, "Dashboards & Tools")}
      </div>

      <div style={{ borderTop: "1px solid rgba(13,27,42,0.09)", padding: "12px 14px 16px", display: "grid", gap: 8 }}>
        <button
          onClick={onOpenWhatsApp}
          style={{
            width: "100%",
            border: "1px solid rgba(5,150,105,0.30)",
            borderRadius: 8,
            background: "rgba(5,150,105,0.08)",
            color: "#059669",
            fontFamily: APP_BRAND_STACK,
            fontSize: "0.72rem",
            fontWeight: 700,
            letterSpacing: "0.04em",
            cursor: "pointer",
            padding: "9px 10px",
          }}
        >
          Open WhatsApp
        </button>
      </div>
    </aside>
  );
}

//  RATE CARD TAB
function RateCard({ services, setServices }) {
  const [editingId, setEditingId] = useState(null);
  const [selectedServiceId, setSelectedServiceId] = useState(() => services[0]?.id || "");
  const [search, setSearch] = useState("");
  const [addingCustom, setAddingCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customCat, setCustomCat] = useState("In House");
  const [customPrice, setCustomPrice] = useState("");
  const [customUnit, setCustomUnit] = useState("per service");
  const [customQuantityMode, setCustomQuantityMode] = useState("fixed");
  const [customDetailSchemaId, setCustomDetailSchemaId] = useState(getDefaultDetailSchemaId("In House"));
  const [customVariable, setCustomVariable] = useState(false);

  const updateService = (id, updates) => {
    setServices((prev) => prev.map((service) => (
      service.id === id ? normalizeService({ ...service, ...updates }) : service
    )));
  };

  const updatePrice = (id, val) => {
    updateService(id, { price: Math.max(0, Number(val) || 0) });
  };

  const addCustom = () => {
    if (!customName.trim()) return;
    const newId = "custom_" + Date.now();
    const newService = normalizeService({
      id: newId,
      name: customName.trim(),
      category: customCat,
      price: Math.max(0, Number(customPrice) || 0),
      unit: customUnit.trim() || "per service",
      variable: customVariable,
      quantityMode: customQuantityMode,
      detailSchemaId: customDetailSchemaId,
      _custom: true,
    });
    setServices((prev) => [...prev, newService]);
    setCustomName("");
    setCustomPrice("");
    setCustomUnit("per service");
    setCustomQuantityMode("fixed");
    setCustomDetailSchemaId(getDefaultDetailSchemaId(customCat));
    setCustomVariable(false);
    setAddingCustom(false);
  };

  const unpriced = services.filter((s) => s.price === 0).length;
  const priced = services.length - unpriced;
  const filteredServices = services
    .filter((service) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return service.name.toLowerCase().includes(q) || service.category.toLowerCase().includes(q);
    })
    .sort((a, b) => `${a.category}:${a.name}`.localeCompare(`${b.category}:${b.name}`));
  const selectedService = services.find((service) => service.id === selectedServiceId) || null;
  const quantityModeSummary = Object.keys(QUANTITY_MODE_CONFIG).map((modeId) => ({
    id: modeId,
    label: QUANTITY_MODE_CONFIG[modeId].label,
    count: services.filter((service) => service.quantityMode === modeId).length,
  }));

  useEffect(() => {
    setCustomDetailSchemaId((current) => (
      current ? current : getDefaultDetailSchemaId(customCat)
    ));
  }, [customCat]);

  useEffect(() => {
    if (!selectedServiceId && services[0]?.id) {
      setSelectedServiceId(services[0].id);
      return;
    }
    if (selectedServiceId && !services.some((service) => service.id === selectedServiceId)) {
      setSelectedServiceId(services[0]?.id || "");
    }
  }, [services, selectedServiceId]);

  // Light theme ink helpers
  const rcInput = {
    padding: "9px 12px", borderRadius: 10, border: "1px solid rgba(15,23,42,0.13)",
    background: "rgba(255,255,255,0.80)", color: "#0f172a", outline: "none",
    fontSize: "0.85rem", fontFamily: APP_FONT_STACK,
  };
  const rcEyebrow = {
    fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.28em",
    textTransform: "uppercase", color: DS.wine, fontFamily: APP_BRAND_STACK, marginBottom: 4,
  };
  const listByCategory = CATEGORIES.map((category) => ({
    category,
    services: filteredServices.filter((service) => service.category === category),
  })).filter((group) => group.services.length > 0);
  const splitCardStyle = {
    background: OPS.surface,
    border: `1px solid ${OPS.borderSoft}`,
    borderRadius: 14,
    boxShadow: OPS.shadowSoft,
  };
  const splitInput = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: `1px solid ${OPS.border}`,
    background: OPS.surface,
    color: OPS.text,
    outline: "none",
    fontSize: "0.86rem",
    fontFamily: APP_FONT_STACK,
  };

  if (true) {
    return (
      <div style={{ animation: "fadeIn 0.3s ease-out" }}>
        <div style={{ ...splitCardStyle, padding: "14px 16px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.84rem", color: OPS.textMuted, fontFamily: APP_FONT_STACK }}>Total: <strong style={{ color: OPS.text }}>{services.length}</strong></span>
            <span style={{ fontSize: "0.84rem", color: OPS.textMuted, fontFamily: APP_FONT_STACK }}>Priced: <strong style={{ color: OPS.success }}>{priced}</strong></span>
            <span style={{ fontSize: "0.84rem", color: OPS.textMuted, fontFamily: APP_FONT_STACK }}>Unpriced: <strong style={{ color: unpriced > 0 ? OPS.danger : OPS.success }}>{unpriced}</strong></span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search services" style={{ ...splitInput, width: 220 }} />
            <button
              onClick={() => setAddingCustom((prev) => !prev)}
              style={{ border: `1px solid ${OPS.primaryBorder}`, borderRadius: 10, padding: "10px 12px", background: OPS.primarySoft, color: OPS.primary, fontWeight: 600, fontFamily: APP_FONT_STACK, cursor: "pointer" }}
            >
              {addingCustom ? "Close" : "Add Service"}
            </button>
          </div>
        </div>

        {addingCustom && (
          <div style={{ ...splitCardStyle, padding: 16, marginBottom: 12, display: "grid", gap: 10 }}>
            <div style={{ fontSize: "0.92rem", color: OPS.text, fontWeight: 600, fontFamily: APP_FONT_STACK }}>Create Custom Service</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
              <input placeholder="Service name" value={customName} onChange={(e) => setCustomName(e.target.value)} style={splitInput} />
              <input placeholder="Unit (e.g. per page)" value={customUnit} onChange={(e) => setCustomUnit(e.target.value)} style={splitInput} />
              <input type="number" placeholder="Base rate (Rs.)" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} style={splitInput} />
              <select value={customCat} onChange={(e) => setCustomCat(e.target.value)} style={splitInput}>
                {CATEGORIES.map((category) => <option key={`custom_cat_${category}`} value={category} style={MENU_OPTION_STYLE}>{category}</option>)}
              </select>
              <select value={customQuantityMode} onChange={(e) => setCustomQuantityMode(e.target.value)} style={splitInput}>
                {Object.entries(QUANTITY_MODE_CONFIG).map(([modeId, config]) => (
                  <option key={`custom_mode_${modeId}`} value={modeId} style={MENU_OPTION_STYLE}>{config.label}</option>
                ))}
              </select>
              <select value={customDetailSchemaId} onChange={(e) => setCustomDetailSchemaId(e.target.value)} style={splitInput}>
                {Object.values(SERVICE_DETAIL_LIBRARY).map((schema) => (
                  <option key={`custom_schema_${schema.id}`} value={schema.id} style={MENU_OPTION_STYLE}>{schema.title}</option>
                ))}
              </select>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.84rem", color: OPS.textMuted, fontFamily: APP_FONT_STACK }}>
              <input type="checkbox" checked={customVariable} onChange={(e) => setCustomVariable(e.target.checked)} />
              Allow custom amount at ticket desk
            </label>
            <button
              onClick={addCustom}
              style={{ border: `1px solid ${OPS.primaryBorder}`, borderRadius: 10, padding: "10px 12px", background: OPS.primary, color: "#ffffff", fontWeight: 600, fontFamily: APP_FONT_STACK, cursor: "pointer", width: "fit-content" }}
            >
              Save Service
            </button>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 360px) minmax(0, 1fr)", gap: 12, alignItems: "start" }}>
          <div style={{ ...splitCardStyle, padding: 12, maxHeight: "68vh", overflowY: "auto" }}>
            {listByCategory.length === 0 ? (
              <div style={{ padding: 14, color: OPS.textMuted, fontFamily: APP_FONT_STACK, fontSize: "0.84rem" }}>No services match this search.</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {listByCategory.map((group) => (
                  <div key={`group_${group.category}`} style={{ display: "grid", gap: 6 }}>
                    <div style={{ fontSize: "0.78rem", color: OPS.textMuted, fontFamily: APP_FONT_STACK, fontWeight: 600 }}>{group.category}</div>
                    {group.services.map((service) => {
                      const active = selectedServiceId === service.id;
                      return (
                        <button
                          key={service.id}
                          onClick={() => setSelectedServiceId(service.id)}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "10px 12px",
                            borderRadius: 10,
                            border: active ? `1px solid ${OPS.primaryBorder}` : `1px solid ${OPS.borderSoft}`,
                            background: active ? OPS.primarySoft : OPS.surface,
                            color: OPS.text,
                            cursor: "pointer",
                            display: "grid",
                            gap: 2,
                            fontFamily: APP_FONT_STACK,
                          }}
                        >
                          <span style={{ fontSize: "0.86rem", fontWeight: 600 }}>{service.name}</span>
                          <span style={{ fontSize: "0.76rem", color: OPS.textMuted }}>Rs. {service.price || 0}  |  {service.unit}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ ...splitCardStyle, padding: 16 }}>
            {!selectedService ? (
              <div style={{ color: OPS.textMuted, fontFamily: APP_FONT_STACK, fontSize: "0.86rem" }}>Select a service from the left list to edit details.</div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                <div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: OPS.text, fontFamily: APP_FONT_STACK }}>{selectedService.name}</div>
                  <div style={{ fontSize: "0.8rem", color: OPS.textMuted, fontFamily: APP_FONT_STACK }}>{selectedService.id}</div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontSize: "0.78rem", color: OPS.textMuted, fontFamily: APP_FONT_STACK, fontWeight: 600 }}>Category</span>
                    <select value={selectedService.category} onChange={(e) => updateService(selectedService.id, { category: e.target.value })} style={splitInput}>
                      {CATEGORIES.map((category) => <option key={`edit_cat_${category}`} value={category} style={MENU_OPTION_STYLE}>{category}</option>)}
                    </select>
                  </label>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontSize: "0.78rem", color: OPS.textMuted, fontFamily: APP_FONT_STACK, fontWeight: 600 }}>Unit</span>
                    <input value={selectedService.unit || ""} onChange={(e) => updateService(selectedService.id, { unit: e.target.value })} style={splitInput} />
                  </label>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontSize: "0.78rem", color: OPS.textMuted, fontFamily: APP_FONT_STACK, fontWeight: 600 }}>Base Rate (Rs.)</span>
                    <input type="number" min="0" value={selectedService.price ?? 0} onChange={(e) => updateService(selectedService.id, { price: Math.max(0, Number(e.target.value) || 0) })} style={splitInput} />
                  </label>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontSize: "0.78rem", color: OPS.textMuted, fontFamily: APP_FONT_STACK, fontWeight: 600 }}>Quantity Rule</span>
                    <select value={selectedService.quantityMode} onChange={(e) => updateService(selectedService.id, { quantityMode: e.target.value })} style={splitInput}>
                      {Object.entries(QUANTITY_MODE_CONFIG).map(([modeId, config]) => (
                        <option key={`edit_mode_${modeId}`} value={modeId} style={MENU_OPTION_STYLE}>{config.label}</option>
                      ))}
                    </select>
                  </label>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontSize: "0.78rem", color: OPS.textMuted, fontFamily: APP_FONT_STACK, fontWeight: 600 }}>Detail Template</span>
                    <select value={selectedService.detailSchemaId} onChange={(e) => updateService(selectedService.id, { detailSchemaId: e.target.value })} style={splitInput}>
                      {Object.values(SERVICE_DETAIL_LIBRARY).map((schema) => (
                        <option key={`edit_schema_${schema.id}`} value={schema.id} style={MENU_OPTION_STYLE}>{schema.title}</option>
                      ))}
                    </select>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 24, fontSize: "0.84rem", color: OPS.textMuted, fontFamily: APP_FONT_STACK }}>
                    <input type="checkbox" checked={Boolean(selectedService.variable)} onChange={(e) => updateService(selectedService.id, { variable: e.target.checked })} />
                    Allow custom amount
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>

      {/* Unpriced warning */}
      {unpriced > 0 && (
        <div style={{
          background: "rgba(214,5,43,0.06)", border: "1px solid rgba(214,5,43,0.20)",
          borderRadius: 12, padding: "13px 18px", marginBottom: 22,
          display: "flex", alignItems: "center", gap: 12,
          fontSize: "0.86rem", fontFamily: APP_FONT_STACK, color: "#1d4ed8",
        }}>
          <span style={{ fontWeight: 700, fontSize: "1rem", color: "#c0001a" }}>!</span>
          <span><strong>{unpriced} services</strong> still have a Rs. 0 rate. Tickets with only zero-rated items are blocked at save time.</span>
        </div>
      )}

      {/* Summary stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 28 }}>
        {quantityModeSummary.map((item) => (
          <div key={item.id} style={{
            background: "rgba(255,255,255,0.72)", border: "1px solid rgba(15,23,42,0.09)",
            borderRadius: 14, padding: "14px 16px",
            boxShadow: "0 4px 12px rgba(15,23,42,0.05)",
          }}>
            <div style={rcEyebrow}>{item.label}</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 300, color: "#0f172a", fontFamily: APP_SERIF_STACK, lineHeight: 1.1 }}>{item.count}</div>
          </div>
        ))}
      </div>

      {/* Category sections */}
      {CATEGORIES.map((cat) => {
        const catServices = services.filter((s) => s.category === cat);
        if (catServices.length === 0) return null;
        const color = CAT_COLORS[cat] || "#1a56db";
        const rgb = color.replace("#","").match(/.{2}/g).map(h=>parseInt(h,16)).join(",");
        return (
          <div key={cat} style={{
            marginBottom: 20, borderRadius: 16, overflow: "hidden",
            border: "1px solid rgba(15,23,42,0.10)",
            boxShadow: "0 4px 16px rgba(15,23,42,0.05)",
          }}>
            {/* Category header */}
            <div style={{
              background: `rgba(${rgb},0.10)`,
              borderBottom: "1px solid rgba(15,23,42,0.08)",
              padding: "11px 18px",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
              <span style={{ fontFamily: APP_BRAND_STACK, fontWeight: 700, fontSize: "0.60rem", letterSpacing: "0.28em", textTransform: "uppercase", color }}>
                {cat}
              </span>
              <span style={{ marginLeft: "auto", fontSize: "0.72rem", color: "rgba(15,23,42,0.40)", fontFamily: APP_FONT_STACK }}>
                {catServices.length} service{catServices.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Service rows */}
            <div style={{ background: "rgba(255,255,255,0.55)" }}>
              {catServices.map((s, i) => (
                <div key={s.id}
                  className="csc-hover-surface-row"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1.2fr) minmax(200px, 0.8fr) auto",
                    alignItems: "start",
                    padding: "16px 18px",
                    borderBottom: i < catServices.length - 1 ? "1px solid rgba(15,23,42,0.07)" : "none",
                    gap: 16, transition: "background 0.15s ease",
                  }}
                >
                  {/* Service info */}
                  <div>
                    <div style={{ fontSize: "0.90rem", fontWeight: 600, color: "#0f172a", fontFamily: APP_FONT_STACK, lineHeight: 1.3 }}>
                      {s.name}
                    </div>
                    <div style={{ fontSize: "0.76rem", color: "rgba(15,23,42,0.50)", fontFamily: APP_FONT_STACK, marginTop: 3, display: "flex", alignItems: "center", gap: 8 }}>
                      <span>{s.unit}</span>
                      {s.variable && <span style={{ background: "rgba(59,130,246,0.18)", color: "#1d4ed8", borderRadius: 999, padding: "1px 8px", fontSize: "0.62rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" }}>variable</span>}
                    </div>
                    <div style={{ fontSize: "0.70rem", color: "rgba(15,23,42,0.38)", marginTop: 5, fontFamily: APP_FONT_STACK }}>
                      Template: <strong style={{ color: "rgba(15,23,42,0.55)" }}>{getDetailSchemaTitle(s.detailSchemaId)}</strong>
                    </div>
                  </div>

                  {/* Config selects */}
                  <div style={{ display: "grid", gap: 10 }}>
                    <label style={{ display: "grid", gap: 4 }}>
                      <span style={rcEyebrow}>Quantity Rule</span>
                      <select value={s.quantityMode} onChange={(e) => updateService(s.id, { quantityMode: e.target.value })} style={rcInput}>
                        {Object.entries(QUANTITY_MODE_CONFIG).map(([modeId, config]) => (
                          <option key={`${s.id}_${modeId}`} value={modeId} style={MENU_OPTION_STYLE}>{config.label}</option>
                        ))}
                      </select>
                    </label>
                    <label style={{ display: "grid", gap: 4 }}>
                      <span style={rcEyebrow}>Detail Template</span>
                      <select value={s.detailSchemaId} onChange={(e) => updateService(s.id, { detailSchemaId: e.target.value })} style={rcInput}>
                        {Object.values(SERVICE_DETAIL_LIBRARY).map((schema) => (
                          <option key={`${s.id}_${schema.id}`} value={schema.id} style={MENU_OPTION_STYLE}>{schema.title}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {/* Price cell */}
                  {editingId === s.id ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, paddingTop: 2 }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "rgba(15,23,42,0.45)", fontFamily: APP_MONO_STACK }}>Rs.</span>
                      <input
                        autoFocus type="number" defaultValue={s.price || ""} placeholder="0"
                        onBlur={(e) => { updatePrice(s.id, e.target.value); setEditingId(null); }}
                        onKeyDown={(e) => { if (e.key === "Enter") { updatePrice(s.id, e.target.value); setEditingId(null); } }}
                        style={{
                          width: 80, padding: "8px 10px",
                          border: "2px solid rgba(37,99,235,0.50)", borderRadius: 8,
                          fontSize: "0.88rem", fontWeight: 600, fontFamily: APP_MONO_STACK,
                          outline: "none", textAlign: "right",
                          background: "rgba(255,255,255,0.90)", color: "#0f172a",
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      onClick={() => setEditingId(s.id)}
                      title="Click to edit price"
                      style={{
                        cursor: "pointer", padding: "7px 14px", borderRadius: 8, paddingTop: 4,
                        fontSize: "0.88rem", fontWeight: 600, fontFamily: APP_MONO_STACK,
                        color: s.price > 0 ? "#1d4ed8" : "rgba(15,23,42,0.30)",
                        background: s.price > 0 ? "rgba(59,130,246,0.14)" : "rgba(15,23,42,0.04)",
                        border: s.price > 0 ? "1px solid rgba(59,130,246,0.30)" : "1px dashed rgba(15,23,42,0.16)",
                        minWidth: 88, textAlign: "right", transition: DS.transColor,
                      }}
                    >
                      {s.price > 0 ? `Rs. ${s.price}` : "Rs.  - "}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Add Custom Service */}
      {!addingCustom ? (
        <button onClick={() => setAddingCustom(true)} style={{
          width: "100%", padding: "14px",
          border: "1px dashed rgba(15,23,42,0.18)", borderRadius: 12,
          background: "rgba(255,255,255,0.60)", cursor: "pointer",
          fontFamily: APP_BRAND_STACK, fontSize: "0.60rem",
          letterSpacing: "0.22em", textTransform: "uppercase",
          color: "rgba(15,23,42,0.45)", fontWeight: 700, transition: DS.transColor,
        }}>
          + Add Custom Service
        </button>
      ) : (
        <div style={{
          border: "1px solid rgba(37,99,235,0.22)", borderRadius: 16, padding: 22,
          background: "rgba(255,255,255,0.72)", boxShadow: "0 6px 18px rgba(15,23,42,0.06)",
        }}>
          <div style={rcEyebrow}>New Service</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12, marginTop: 8 }}>
            <input placeholder="Service name" value={customName} onChange={(e) => setCustomName(e.target.value)}
              style={{ ...rcInput, flex: 2, minWidth: 160 }} />
            <div style={{ display: "flex", alignItems: "center", border: "1px solid rgba(15,23,42,0.13)", borderRadius: 10, background: "rgba(255,255,255,0.80)", paddingRight: 10 }}>
              <span style={{ paddingLeft: 12, color: "#1d4ed8", fontWeight: 600, fontSize: "0.85rem", fontFamily: APP_MONO_STACK }}>Rs.</span>
              <input placeholder="0" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} type="number"
                style={{ width: 80, padding: "9px 8px", border: "none", background: "transparent", fontSize: "0.88rem", fontFamily: APP_MONO_STACK, outline: "none", textAlign: "right", color: "#0f172a" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            <select value={customCat} onChange={(e) => setCustomCat(e.target.value)} style={{ ...rcInput, flex: 1 }}>
              {CATEGORIES.map((c) => <option key={c} value={c} style={MENU_OPTION_STYLE}>{c}</option>)}
            </select>
            <input placeholder="Unit (e.g. per page)" value={customUnit} onChange={(e) => setCustomUnit(e.target.value)}
              style={{ ...rcInput, flex: 1 }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 16 }}>
            <label style={{ display: "grid", gap: 4 }}>
              <span style={rcEyebrow}>Quantity Rule</span>
              <select value={customQuantityMode} onChange={(e) => setCustomQuantityMode(e.target.value)} style={rcInput}>
                {Object.entries(QUANTITY_MODE_CONFIG).map(([modeId, config]) => (
                  <option key={`custom_mode_${modeId}`} value={modeId} style={MENU_OPTION_STYLE}>{config.label}</option>
                ))}
              </select>
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              <span style={rcEyebrow}>Detail Template</span>
              <select value={customDetailSchemaId} onChange={(e) => setCustomDetailSchemaId(e.target.value)} style={rcInput}>
                {Object.values(SERVICE_DETAIL_LIBRARY).map((schema) => (
                  <option key={`custom_schema_${schema.id}`} value={schema.id} style={MENU_OPTION_STYLE}>{schema.title}</option>
                ))}
              </select>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", border: "1px solid rgba(15,23,42,0.10)", borderRadius: 10, background: "rgba(255,255,255,0.60)", cursor: "pointer" }}>
              <input type="checkbox" checked={customVariable} onChange={(e) => setCustomVariable(e.target.checked)} />
              <span style={{ fontSize: "0.82rem", color: "rgba(15,23,42,0.70)", fontWeight: 500, fontFamily: APP_FONT_STACK }}>Allow custom amount at ticket desk</span>
            </label>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={addCustom} style={{
              flex: 1, padding: "12px", borderRadius: 999,
              background: "rgba(37,99,235,0.12)", color: "#1e40af",
              border: "1px solid rgba(37,99,235,0.38)",
              fontWeight: 700, fontSize: "0.60rem", letterSpacing: "0.20em",
              textTransform: "uppercase", cursor: "pointer", fontFamily: APP_BRAND_STACK,
            }}>
              Save Service
            </button>
            <button onClick={() => setAddingCustom(false)} style={{
              padding: "12px 22px", borderRadius: 999,
              background: "rgba(255,255,255,0.72)", color: "rgba(15,23,42,0.60)",
              border: "1px solid rgba(15,23,42,0.14)",
              fontWeight: 700, fontSize: "0.60rem", letterSpacing: "0.18em",
              textTransform: "uppercase", cursor: "pointer", fontFamily: APP_BRAND_STACK,
            }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


//  NEW ENTRY (FORMERLY NEW BILL) 
function NewEntry({ services, onSave }) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [items, setItems] = useState([]);
  const [selectedService, setSelectedService] = useState("");
  const [qty, setQty] = useState(1);
  const [customAmt, setCustomAmt] = useState("");
  const [payMode, setPayMode] = useState("Cash");
  const [operator, setOperator] = useState("Samar");
  const [saved, setSaved] = useState(null);

  const addItem = () => {
    if (!selectedService) return;
    const svc = services.find((s) => s.id === selectedService);
    if (!svc) return;
    const amt = svc.variable && customAmt ? Number(customAmt) : svc.price;
    setItems((prev) => [...prev, { ...svc, qty: Number(qty) || 1, amount: amt * (Number(qty) || 1) }]);
    setSelectedService(""); setQty(1); setCustomAmt("");
  };

  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const total = items.reduce((s, it) => s + it.amount, 0);

  const saveEntry = () => {
    if (items.length === 0) return;
    const entry = {
      billNo: generateBillNo(),
      date: todayStr(),
      time: timeStr(),
      customerName: customerName.trim() || "Walk-in Customer",
      customerPhone: customerPhone.trim(),
      items: [...items],
      total,
      payMode,
      operator,
    };
    onSave(entry);
    setSaved(entry);
  };

  const resetEntry = () => {
    setCustomerName(""); setCustomerPhone(""); setItems([]);
    setPayMode("Cash"); setSaved(null);
  };

  //  Customer Slip View (No Prices) 
  if (saved) {
    return (
      <div style={{ animation: "fadeIn 0.4s ease-out" }}>
        <div id="receipt" style={{
          background: "rgba(255,255,255,0.82)", border: "1px solid rgba(15,23,42,0.14)", borderRadius: 22,
          padding: "30px 24px", maxWidth: 420, margin: "0 auto",
          fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif",
          boxShadow: "0 18px 45px rgba(0,0,0,0.45)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Top Edge Detail */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, background: "#14B8A6" }} />

          {/* Slip Header */}
          <div style={{ textAlign: "center", borderBottom: "1px dashed rgba(255,255,255,0.3)", paddingBottom: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#F8FAFC", letterSpacing: 1 }}>
              CSC CENTRE
            </div>
            <div style={{ fontSize: 12, color: "#C6D0D9", marginTop: 6, lineHeight: 1.6 }}>
              Govt. Recognised Common Service Centre<br />
              Blue Sapphire Plaza, Greater Noida West
            </div>
            <div style={{ display: "inline-block", marginTop: 12, padding: "4px 12px", background: "rgba(255,255,255,0.12)", borderRadius: 100, fontSize: 11, fontWeight: 600, color: "#DCE6EE", letterSpacing: 0.5 }}>
              SERVICE SLIP
            </div>
          </div>

          {/* Customer & Slip Info */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#0F172A", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, color: "#AAB7C4", textTransform: "uppercase", fontWeight: 600, marginBottom: 2 }}>Customer Details</div>
              <div style={{ fontWeight: 600, color: "#F8FAFC" }}>{saved.customerName}</div>
              {saved.customerPhone && <div style={{ color: "#C6D0D9" }}>{saved.customerPhone}</div>}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "#AAB7C4", textTransform: "uppercase", fontWeight: 600, marginBottom: 2 }}>Date & Time</div>
              <div style={{ fontWeight: 500 }}>{saved.date}</div>
              <div style={{ color: "#C6D0D9" }}>{saved.time}</div>
            </div>
          </div>

          {/* Items Table (No Prices) */}
          <div style={{ padding: "12px 0", borderTop: "2px solid rgba(15,23,42,0.14)", borderBottom: "2px solid rgba(15,23,42,0.14)" }}>
            <div style={{ display: "flex", fontSize: 11, fontWeight: 700, color: "#AAB7C4", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
              <div style={{ flex: 1 }}>Services Requested</div>
              <div style={{ width: 40, textAlign: "right" }}>Qty</div>
            </div>
            {saved.items.map((it, i) => (
              <div key={i} style={{ display: "flex", fontSize: 14, color: "#F8FAFC", padding: "6px 0", alignItems: "flex-start" }}>
                <div style={{ flex: 1, fontWeight: 500 }}>{it.name}</div>
                <div style={{ width: 40, textAlign: "right", color: "#C6D0D9", fontWeight: 600 }}>{it.qty}</div>
              </div>
            ))}
          </div>

          {/* Footer Info */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20, fontSize: 11, color: "#C6D0D9" }}>
             <div>Ref: <strong>{saved.billNo}</strong></div>
             <div>Operator: <strong>{saved.operator}</strong></div>
          </div>

          <div style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "#AAB7C4", lineHeight: 1.6 }}>
            Thank you for visiting!<br />
            Please keep this slip for your reference.
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "center" }}>
          <button onClick={() => window.print()} style={{
            padding: "12px 24px", background: "rgba(255,255,255,0.74)", color: "#14B8A6",
            border: "1px solid #14B8A6", borderRadius: 8, fontWeight: 600, fontSize: 14,
            cursor: "pointer", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif",
          }}>
             Print Slip
          </button>
          <button onClick={resetEntry} style={{
            padding: "12px 24px", background: "#14B8A6", color: "white",
            border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14,
            cursor: "pointer", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif",
            boxShadow: "0 4px 12px rgba(20, 184, 166, 0.24)"
          }}>
            + New Entry
          </button>
        </div>
      </div>
    );
  }

  //  Entry Form 
  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      {/* Customer Info */}
      <div style={{
        background: "rgba(255,255,255,0.74)", borderRadius: 12, border: "1px solid rgba(15,23,42,0.12)",
        padding: 20, marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", marginBottom: 12, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", textTransform: "uppercase", letterSpacing: 0.5 }}>
          Customer Info <span style={{ fontWeight: 400, color: "#64748B", textTransform: "none", letterSpacing: 0 }}>(optional)</span>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <input placeholder="Customer Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
            style={{ flex: 2, minWidth: 150, padding: "10px 14px", border: "1px solid rgba(15,23,42,0.14)", borderRadius: 8, fontSize: 14, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", outline: "none", transition: "border 0.2s" }} 
            onFocus={(e) => e.target.style.borderColor = '#14B8A6'}
            onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
          />
          <input placeholder="Phone Number" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
            style={{ flex: 1, minWidth: 130, padding: "10px 14px", border: "1px solid rgba(15,23,42,0.14)", borderRadius: 8, fontSize: 14, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", outline: "none", transition: "border 0.2s" }} 
            onFocus={(e) => e.target.style.borderColor = '#14B8A6'}
            onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
          />
        </div>
      </div>

      {/* Add Items */}
      <div style={{
        background: "rgba(255,255,255,0.74)", borderRadius: 12, border: "1px solid rgba(15,23,42,0.12)",
        padding: 20, marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", marginBottom: 12, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", textTransform: "uppercase", letterSpacing: 0.5 }}>
          Select Services
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <select value={selectedService} onChange={(e) => { setSelectedService(e.target.value); setCustomAmt(""); }}
            style={{ flex: 3, minWidth: 180, padding: "11px 14px", border: "1px solid rgba(15,23,42,0.14)", borderRadius: 8, fontSize: 14, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", outline: "none", background: "rgba(255,255,255,0.74)", color: selectedService ? "#0F172A" : "#64748B" }}>
            <option value="" style={MENU_OPTION_STYLE}>Select a service...</option>
            {CATEGORIES.map((cat) => (
              <optgroup key={cat} label={cat} style={MENU_OPTGROUP_STYLE}>
                {services.filter((s) => s.category === cat).map((s) => (
                  <option key={s.id} value={s.id} style={MENU_OPTION_STYLE}>{s.name} {s.price > 0 ? ` - Rs. ${s.price}` : ""}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11, color: "#64748B", fontWeight: 500 }}>Qty</span>
            <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)}
              style={{ width: 60, padding: "10px", border: "1px solid rgba(15,23,42,0.14)", borderRadius: 8, fontSize: 14, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", outline: "none", textAlign: "center" }} />
          </div>
          {selectedService && services.find((s) => s.id === selectedService)?.variable && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 11, color: "#D97706", fontWeight: 600 }}>Custom Rs.</span>
              <input type="number" value={customAmt} onChange={(e) => setCustomAmt(e.target.value)} placeholder="0"
                style={{ width: 80, padding: "10px", border: "1px solid #F59E0B", borderRadius: 8, fontSize: 14, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", outline: "none", textAlign: "right", background: "#FFFBEB" }} />
            </div>
          )}
          <button onClick={addItem} className="csc-hover-accent" style={{
            padding: "11px 20px", background: "rgba(255,255,255,0.82)", color: "#14B8A6",
            border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14,
            cursor: "pointer", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", whiteSpace: "nowrap",
            transition: "all 0.2s"
          }}>
            Add
          </button>
        </div>
      </div>

      {/* Internal Item Review (Shows prices for operator reference) */}
      {items.length > 0 && (
        <div style={{
          background: "rgba(255,255,255,0.74)", borderRadius: 12, border: "1px solid rgba(15,23,42,0.12)",
          padding: 20, marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 12, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Internal Summary <span style={{ fontWeight: 400, color: "#475569", textTransform: "none", letterSpacing: 0 }}>(Prices not shown on slip)</span>
          </div>
          {items.map((it, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", padding: "12px 0",
              borderBottom: i < items.length - 1 ? "1px solid #F1F5F9" : "none",
              gap: 12,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#0F172A", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif" }}>{it.name}</div>
                <div style={{ fontSize: 12, color: "#64748B", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", marginTop: 2 }}>
                  {it.qty > 1 ? `${it.qty} x Rs. ${Math.round(it.amount / it.qty)}` : it.unit}
                </div>
              </div>
              <div style={{ fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", fontSize: 15, fontWeight: 600, color: "#14B8A6" }}>
                Rs. {it.amount}
              </div>
              <button onClick={() => removeItem(i)} style={{
                width: 28, height: 28, border: "none", borderRadius: 6,
                background: "#FEF2F2", color: "#EF4444", cursor: "pointer",
                fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.2s"
              }}>
                x
              </button>
            </div>
          ))}

          {/* Operator Total Bar */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "16px 16px", marginTop: 12, background: "rgba(255,255,255,0.72)", borderRadius: 8, border: "1px solid rgba(15,23,42,0.12)"
          }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#64748B", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif" }}>AMOUNT TO COLLECT</span>
            <span style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif" }}>Rs. {total}</span>
          </div>
        </div>
      )}

      {/* Payment & Operator */}
      {items.length > 0 && (
        <div style={{
          background: "rgba(255,255,255,0.74)", borderRadius: 12, border: "1px solid rgba(15,23,42,0.12)",
          padding: 20, marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center",
        }}>
          <div style={{ flex: 1, minWidth: 150 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#64748B", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif" }}>
              Payment Mode
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {["Cash", "UPI"].map((m) => (
                <button key={m} onClick={() => setPayMode(m)} style={{
                  flex: 1, padding: "10px", border: payMode === m ? "2px solid #14B8A6" : "1px solid rgba(15,23,42,0.18)",
                  borderRadius: 8, background: payMode === m ? "rgba(20, 184, 166, 0.16)" : "rgba(255,255,255,0.74)",
                  color: payMode === m ? "#14B8A6" : "#64748B",
                  fontWeight: payMode === m ? 600 : 500, fontSize: 13, cursor: "pointer",
                  fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", transition: "all 0.2s"
                }}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 150 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#64748B", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif" }}>
              Operator
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {OPERATORS.map((op) => (
                <button key={op} onClick={() => setOperator(op)} style={{
                  flex: 1, padding: "10px", border: operator === op ? "2px solid #14B8A6" : "1px solid rgba(15,23,42,0.18)",
                  borderRadius: 8, background: operator === op ? "rgba(20, 184, 166, 0.16)" : "rgba(255,255,255,0.74)",
                  color: operator === op ? "#14B8A6" : "#64748B",
                  fontWeight: operator === op ? 600 : 500, fontSize: 13, cursor: "pointer",
                  fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", transition: "all 0.2s"
                }}>
                  {op}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      {items.length > 0 && (
        <button onClick={saveEntry} style={{
          width: "100%", padding: "16px", background: "#14B8A6",
          color: "white", border: "none", borderRadius: 12, fontWeight: 700,
          fontSize: 15, cursor: "pointer", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif",
          boxShadow: "0 4px 14px rgba(20, 184, 166, 0.32)",
          letterSpacing: 0.5, transition: "transform 0.1s, boxShadow 0.2s"
        }}
        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          Save Entry & Generate Slip
        </button>
      )}
    </div>
  );
}


//  DASHBOARD (FORMERLY DAILY LOG) 
function Dashboard({ bills }) {
  const todayBills = bills; 
  const totalRevenue = todayBills.reduce((s, b) => s + b.total, 0);
  const cashTotal = todayBills.filter((b) => b.payMode === "Cash").reduce((s, b) => s + b.total, 0);
  const upiTotal = todayBills.filter((b) => b.payMode === "UPI").reduce((s, b) => s + b.total, 0);

  // Service-wise breakdown
  const svcMap = {};
  todayBills.forEach((b) => {
    b.items.forEach((it) => {
      if (!svcMap[it.name]) svcMap[it.name] = { count: 0, revenue: 0 };
      svcMap[it.name].count += it.qty;
      svcMap[it.name].revenue += it.amount;
    });
  });
  const svcList = Object.entries(svcMap).sort((a, b) => b[1].revenue - a[1].revenue);

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      {/* Revenue Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "#14B8A6", borderRadius: 16, padding: "20px", color: "white", boxShadow: "0 4px 12px rgba(79, 70, 229, 0.2)" }}>
          <div style={{ fontSize: 12, fontWeight: 500, opacity: 0.8, textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif" }}>Today's Revenue</div>
          <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", marginTop: 8 }}>{totalRevenue}</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.74)", borderRadius: 16, padding: "20px", border: "1px solid rgba(15,23,42,0.12)", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif" }}> Cash Collection</div>
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", marginTop: 8, color: "#10B981" }}>{cashTotal}</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.74)", borderRadius: 16, padding: "20px", border: "1px solid rgba(15,23,42,0.12)", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif" }}> UPI Collection</div>
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", marginTop: 8, color: "#22D3EE" }}>{upiTotal}</div>
        </div>
      </div>

      {/* Analytics Stats */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.74)", borderRadius: 12, padding: "16px", border: "1px solid rgba(15,23,42,0.12)", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#1E293B", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif" }}>{todayBills.length}</div>
          <div style={{ fontSize: 12, color: "#64748B", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", fontWeight: 500, marginTop: 4 }}>Total Entries</div>
        </div>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.74)", borderRadius: 12, padding: "16px", border: "1px solid rgba(15,23,42,0.12)", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#1E293B", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif" }}>
            {todayBills.length > 0 ? `${Math.round(totalRevenue / todayBills.length)}` : ""}
          </div>
          <div style={{ fontSize: 12, color: "#64748B", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", fontWeight: 500, marginTop: 4 }}>Average Order</div>
        </div>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.74)", borderRadius: 12, padding: "16px", border: "1px solid rgba(15,23,42,0.12)", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#1E293B", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif" }}>{svcList.length}</div>
          <div style={{ fontSize: 12, color: "#64748B", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", fontWeight: 500, marginTop: 4 }}>Unique Services</div>
        </div>
      </div>

      {/* Detailed Service Breakdown */}
      {svcList.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.74)", borderRadius: 16, border: "1px solid rgba(15,23,42,0.12)", padding: 24, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", marginBottom: 16, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", letterSpacing: 0.5 }}>
            Revenue by Service
          </div>
          {svcList.map(([name, data], i) => (
            <div key={name} style={{
              display: "flex", alignItems: "center", padding: "12px 0",
              borderBottom: i < svcList.length - 1 ? "1px solid #F1F5F9" : "none",
            }}>
              <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color: "#334155", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif" }}>{name}</div>
              <div style={{ fontSize: 12, color: "#64748B", marginRight: 16, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", background: "rgba(255,255,255,0.82)", padding: "4px 8px", borderRadius: 6 }}>{data.count} units</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#14B8A6", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", width: 80, textAlign: "right" }}>{data.revenue}</div>
            </div>
          ))}
        </div>
      )}

      {/* Transaction History */}
      {todayBills.length > 0 ? (
        <div style={{ background: "rgba(255,255,255,0.74)", borderRadius: 16, border: "1px solid rgba(15,23,42,0.12)", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
          <div style={{ padding: "16px 24px", fontSize: 14, fontWeight: 700, color: "#1E293B", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", letterSpacing: 0.5, borderBottom: "1px solid #E2E8F0", background: "rgba(255,255,255,0.72)" }}>
            Backend Transaction Log
          </div>
          {[...todayBills].reverse().map((b) => (
            <div key={b.billNo} className="csc-hover-surface-row" style={{
              padding: "16px 24px", borderBottom: "1px solid #F1F5F9",
              display: "flex", alignItems: "center", gap: 16, transition: "background 0.2s"
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#1E293B", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif" }}>{b.customerName}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "4px 8px", borderRadius: 6,
                    background: b.payMode === "Cash" ? "#ECFDF5" : "rgba(34, 211, 238, 0.14)",
                    color: b.payMode === "Cash" ? "#059669" : "#0891B2",
                    fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", letterSpacing: 0.5
                  }}>{b.payMode}</span>
                </div>
                <div style={{ fontSize: 12, color: "#64748B", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", lineHeight: 1.4 }}>
                  {b.billNo}  {b.time}  Op: {b.operator}<br/>
                  <span style={{ color: "#64748B" }}>{b.items.map((it) => it.name).join(", ")}</span>
                </div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#1E293B", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif" }}>
                {b.total}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: "center", padding: "60px 24px", color: "#64748B",
          fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", background: "rgba(255,255,255,0.74)", borderRadius: 16, border: "1px dashed #CBD5E1"
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}></div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#475569" }}>No analytics available yet</div>
          <div style={{ fontSize: 14, marginTop: 6 }}>Record a service entry to see your dashboard populate</div>
        </div>
      )}
    </div>
  );
}

function TicketWorkspace({ services, tickets, onSaveTicket, onNavigateTab, isActive }) {
  const [draftSeed] = useState(() => getStoredTicketDraft());
  const [hasReference, setHasReference] = useState(() => getHasReferenceValue(draftSeed));
  const [customerName, setCustomerName] = useState(() => draftSeed.customerName || "");
  const [customerPhone, setCustomerPhone] = useState(() => draftSeed.customerPhone || "");
  const [entryDateKey, setEntryDateKey] = useState(() => toIsoDateKey(draftSeed.entryDateKey) || getTicketCounterDateKey(new Date()));
  const [referenceName, setReferenceName] = useState(() => draftSeed.referenceName || "");
  const [referenceLabel, setReferenceLabel] = useState(() => getReferenceLabelValue(draftSeed));
  const [operator, setOperator] = useState(() => (
    typeof draftSeed.operator === "string" ? draftSeed.operator : DEFAULT_OPERATOR
  ));
  const [selectedService, setSelectedService] = useState(() => draftSeed.selectedService || "");
  const [qty, setQty] = useState(() => draftSeed.qty || 1);
  const [customAmt, setCustomAmt] = useState(() => draftSeed.customAmt || "");
  const [serviceDetailMap, setServiceDetailMap] = useState(() => {
    const seededMap = draftSeed.serviceDetailMap && typeof draftSeed.serviceDetailMap === "object"
      ? draftSeed.serviceDetailMap
      : {};
    const next = {};
    services.forEach((service) => {
      const fromMap = seededMap[service.id];
      const legacySeed = draftSeed.selectedService === service.id ? draftSeed.serviceDetailValues : null;
      const sourceValues = (fromMap && typeof fromMap === "object")
        ? fromMap
        : (legacySeed && typeof legacySeed === "object" ? legacySeed : null);
      if (sourceValues) {
        next[service.id] = createDetailDraftForService(service, sourceValues);
      }
    });
    return next;
  });
  const [serviceDetailErrorMap, setServiceDetailErrorMap] = useState(() => {
    if (draftSeed.serviceDetailErrorMap && typeof draftSeed.serviceDetailErrorMap === "object") {
      return draftSeed.serviceDetailErrorMap;
    }
    if (
      draftSeed.selectedService
      && draftSeed.serviceDetailErrors
      && typeof draftSeed.serviceDetailErrors === "object"
    ) {
      return { [draftSeed.selectedService]: draftSeed.serviceDetailErrors };
    }
    return {};
  });
  const [paymentCash, setPaymentCash] = useState(() => draftSeed.paymentCash || "");
  const [paymentUpi, setPaymentUpi] = useState(() => draftSeed.paymentUpi || "");
  const [ticketTotal, setTicketTotal] = useState(() => draftSeed.ticketTotal ?? "");
  const [vendorAmount, setVendorAmount] = useState(() => draftSeed.vendorAmount ?? "");
  const [docName, setDocName] = useState(() => draftSeed.docName || "");
  const [docRequired, setDocRequired] = useState(() => (
    typeof draftSeed.docRequired === "boolean" ? draftSeed.docRequired : true
  ));
  const [documents, setDocuments] = useState(() => (
    Array.isArray(draftSeed.documents) ? draftSeed.documents : []
  ));
  const [items, setItems] = useState(() => (
    Array.isArray(draftSeed.items) ? draftSeed.items : []
  ));
  const [ticketMeta, setTicketMeta] = useState(() => (
    draftSeed.ticketMeta && typeof draftSeed.ticketMeta === "object" ? draftSeed.ticketMeta : null
  ));
  const [subStep, setSubStep] = useState(() => {
    const seeded = Number(draftSeed?.subStep);
    return Number.isFinite(seeded) && seeded >= 1 && seeded <= 4 ? seeded : 1;
  });
  const [saved, setSaved] = useState(null);
  const [error, setError] = useState("");
  const [intakeFieldErrors, setIntakeFieldErrors] = useState({});
  const [draftStorageState, setDraftStorageState] = useState("idle");
  const [draftSavedAt, setDraftSavedAt] = useState(null);
  const [undoAction, setUndoAction] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });
  const undoTimeoutRef = useRef(null);
  const customerNameInputRef = useRef(null);
  const customerPhoneInputRef = useRef(null);
  const referenceNameInputRef = useRef(null);
  const referencePhoneInputRef = useRef(null);
  const entryDateInputRef = useRef(null);
  const availableServices = useMemo(
    () => services.filter((service) => (
      service
      && typeof service === "object"
      && String(service.id || "").trim()
      && String(service.name || "").trim()
    )),
    [services]
  );
  const intakeServiceGroups = useMemo(() => {
    const groups = new Map();
    availableServices.forEach((service) => {
      const category = String(service.category || "Other").trim() || "Other";
      if (!groups.has(category)) groups.set(category, []);
      groups.get(category).push(service);
    });
    const ordered = [];
    CATEGORIES.forEach((category) => {
      if (!groups.has(category)) return;
      ordered.push({ category, services: groups.get(category) });
      groups.delete(category);
    });
    Array.from(groups.entries())
      .sort((left, right) => left[0].localeCompare(right[0]))
      .forEach(([category, groupedServices]) => {
        ordered.push({ category, services: groupedServices });
      });
    return ordered;
  }, [availableServices]);
  const selectedServiceConfig = availableServices.find((service) => service.id === selectedService) || null;
  const selectedQuantityConfig = selectedServiceConfig ? getQuantityModeConfig(selectedServiceConfig.quantityMode) : null;
  const selectedDetailSchema = selectedServiceConfig ? getServiceDetailSchema(selectedServiceConfig) : null;
  const selectedServiceDetailValues = selectedServiceConfig
    ? createDetailDraftForService(selectedServiceConfig, serviceDetailMap[selectedServiceConfig.id] || {})
    : {};
  const selectedServiceDetailErrors = selectedServiceConfig
    ? (serviceDetailErrorMap[selectedServiceConfig.id] && typeof serviceDetailErrorMap[selectedServiceConfig.id] === "object"
      ? serviceDetailErrorMap[selectedServiceConfig.id]
      : {})
    : {};

  const total = Math.max(0, Number(ticketTotal) || 0);
  const cashCollected = Math.max(0, Number(paymentCash) || 0);
  const upiCollected = Math.max(0, Number(paymentUpi) || 0);
  const paidTotal = cashCollected + upiCollected;
  const pendingBalance = Math.max(total - paidTotal, 0);
  const isOverpaid = total > 0 && paidTotal > total;
  const requiredDocsCount = documents.filter((doc) => doc.required).length;
  const submittedRequiredDocsCount = documents.filter((doc) => doc.required && doc.submitted).length;
  const uniqueServiceItems = useMemo(() => {
    const seen = new Set();
    return items.filter((item) => {
      const serviceId = String(item?.id || "").trim();
      if (!serviceId || seen.has(serviceId)) return false;
      seen.add(serviceId);
      return true;
    });
  }, [items]);
  const serviceDocumentGroups = useMemo(
    () => uniqueServiceItems.map((serviceItem) => ({
      serviceId: serviceItem.id,
      serviceName: serviceItem.name,
      docs: documents.filter((doc) => doc.source === "service_required" && doc.serviceId === serviceItem.id),
    })),
    [uniqueServiceItems, documents]
  );
  const sanitizePhone = (value) => value.replace(/\D/g, "").slice(0, 10);
  const hasNoTotal = ticketTotal === "" || ticketTotal === null;
  const canSaveTicket = items.length > 0 && !isOverpaid && !hasNoTotal;
  const ENTRY_ACCENT = "#1a56db";
  const ENTRY_ACCENT_TEXT = "#1540b0";
  const ENTRY_ACCENT_SOFT = "rgba(26,86,219,0.10)";
  const ENTRY_ACCENT_SOFTER = "rgba(26,86,219,0.06)";
  const ENTRY_ACCENT_BORDER = "rgba(26,86,219,0.30)";
  const ticketReferenceSummary = ticketMeta
    ? formatReferenceSummary({
      hasReference: getHasReferenceValue(ticketMeta),
      name: ticketMeta.referenceName,
      label: getReferenceLabelValue(ticketMeta),
    })
    : "No reference added";
  const surfaceCardStyle = {
    background: "#ffffff",
    borderRadius: 14,
    border: "1px solid rgba(13,27,42,0.09)",
    padding: 22,
    boxShadow: "0 2px 8px rgba(13,27,42,0.07), 0 0 0 1px rgba(13,27,42,0.05)",
  };
  const softPanelStyle = {
    background: "#f4f7fa",
    borderRadius: 10,
    border: "1px solid rgba(13,27,42,0.08)",
    padding: 16,
  };
  const sectionEyebrowStyle = {
    fontSize: "0.62rem",
    color: ENTRY_ACCENT_TEXT,
    fontFamily: APP_BRAND_STACK,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.18em",
    marginBottom: 8,
    display: "block",
  };
  const inputStyle = {
    width: "100%",
    padding: "10px 13px",
    border: "1px solid rgba(13,27,42,0.14)",
    borderRadius: 8,
    background: "#ffffff",
    color: "#0d1b2a",
    outline: "none",
    fontFamily: APP_FONT_STACK,
    fontSize: "0.88rem",
    fontWeight: 500,
    boxShadow: "inset 0 1px 2px rgba(13,27,42,0.04)",
  };
  const primaryButtonStyle = {
    border: "none",
    borderRadius: 8,
    padding: "11px 20px",
    background: ENTRY_ACCENT,
    color: "#ffffff",
    fontFamily: APP_BRAND_STACK,
    fontWeight: 700,
    fontSize: "0.76rem",
    letterSpacing: "0.06em",
    cursor: "pointer",
    transition: "all 0.15s ease",
    boxShadow: "0 1px 3px rgba(26,86,219,0.25)",
  };
  const secondaryButtonStyle = {
    border: "1px solid rgba(13,27,42,0.15)",
    borderRadius: 8,
    padding: "11px 20px",
    background: "#ffffff",
    color: "#0d1b2a",
    fontFamily: APP_BRAND_STACK,
    fontWeight: 700,
    fontSize: "0.76rem",
    letterSpacing: "0.04em",
    cursor: "pointer",
    transition: "all 0.15s ease",
    boxShadow: "0 1px 2px rgba(13,27,42,0.06)",
  };
  const smallBadgeStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    borderRadius: 6,
    padding: "4px 10px",
    fontSize: "0.68rem",
    fontFamily: APP_BRAND_STACK,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  };
  const draftStatusLabel = draftStorageState === "saving"
    ? "Saving locally"
    : draftStorageState === "saved"
      ? "Saved locally"
      : draftStorageState === "error"
        ? "Local save failed"
        : "Draft idle";
  const draftStatusAccent = draftStorageState === "error"
    ? "#dc2626"
    : draftStorageState === "saving"
      ? ENTRY_ACCENT_TEXT
      : "rgba(13,27,42,0.50)";
  const closeConfirmDialog = () => {
    setConfirmDialog({
      isOpen: false,
      title: "",
      message: "",
      onConfirm: null,
    });
  };

  const draftPayload = {
    step: 1,
    subStep,
    hasReference,
    customerName,
    customerPhone,
    entryDateKey,
    referenceName,
    referenceLabel,
    operator,
    selectedService,
    qty,
    customAmt,
    serviceDetailMap,
    serviceDetailErrorMap,
    serviceDetailValues: selectedServiceDetailValues,
    serviceDetailErrors: selectedServiceDetailErrors,
    paymentCash,
    paymentUpi,
    ticketTotal,
    vendorAmount,
    docName,
    docRequired,
    documents,
    items,
    ticketMeta,
  };

  const draftStorageCallbacks = useMemo(() => ({
    onSchedule: () => setDraftStorageState("saving"),
    onSaved: () => {
      setDraftStorageState("saved");
      setDraftSavedAt(new Date());
    },
    onError: () => setDraftStorageState("error"),
  }), []);

  useDebouncedStoredJSON(STORAGE_KEYS.ticketDraft, draftPayload, 180, !saved, draftStorageCallbacks);

  useEffect(() => {
    if (saved) {
      removeStoredValue(STORAGE_KEYS.ticketDraft);
      setDraftStorageState("idle");
    }
  }, [saved]);

  useEffect(() => {
    if (!isActive) return;
    updateBrowserState({ tab: "entry" }, "replace");
  }, [isActive]);

  useEffect(() => {
    if (!selectedServiceConfig) {
      return;
    }
    setServiceDetailMap((prev) => ({
      ...prev,
      [selectedServiceConfig.id]: createDetailDraftForService(selectedServiceConfig, prev[selectedServiceConfig.id] || {}),
    }));
    setServiceDetailErrorMap((prev) => {
      if (prev[selectedServiceConfig.id] && typeof prev[selectedServiceConfig.id] === "object") return prev;
      return { ...prev, [selectedServiceConfig.id]: {} };
    });
    if (selectedServiceConfig.quantityMode === "fixed") {
      setQty(1);
    } else {
      const nextQty = Math.max(selectedServiceConfig.minQty || 1, Number(qty) || selectedServiceConfig.minQty || 1);
      setQty(nextQty);
    }
  }, [selectedService]);

  useEffect(() => {
    setDocuments((current) => {
      const synced = syncServiceRequiredDocuments(current, items);
      return areDocumentListsEqual(current, synced) ? current : synced;
    });
  }, [items]);

  useEffect(() => () => {
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }
  }, []);

  const focusIntakeField = (fieldKey) => {
    const refByField = {
      customerName: customerNameInputRef,
      customerPhone: customerPhoneInputRef,
      referenceName: referenceNameInputRef,
      referencePhone: referencePhoneInputRef,
      entryDateKey: entryDateInputRef,
    };
    const targetRef = refByField[fieldKey];
    if (!targetRef?.current) return;
    targetRef.current.focus();
    targetRef.current.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  };

  const getIntakeValidationSnapshot = () => {
    const trimmedName = customerName.trim();
    const phoneDigits = sanitizePhone(customerPhone);
    const normalizedEntryDateKey = toIsoDateKey(entryDateKey);
    const todayKey = getTicketCounterDateKey(new Date());
    const minEntryDateKey = getOffsetDateKey(-2);
    const trimmedReferenceName = referenceName.trim();
    const referencePhoneDigits = sanitizePhone(referenceLabel);
    const referenceEnabled = hasReference && Boolean(trimmedReferenceName);
    const nextErrors = {};

    if (!trimmedName) {
      nextErrors.customerName = "Document holder name is required.";
    }
    if (!PHONE_REGEX.test(phoneDigits)) {
      nextErrors.customerPhone = "Contact number must be exactly 10 digits.";
    }
    if (!normalizedEntryDateKey) {
      nextErrors.entryDateKey = "Entry date is required.";
    } else if (normalizedEntryDateKey > todayKey) {
      nextErrors.entryDateKey = "Entry date cannot be in the future.";
    } else if (normalizedEntryDateKey < minEntryDateKey) {
      nextErrors.entryDateKey = "Only today or past 2 days entries are allowed.";
    }
    if (hasReference && !trimmedReferenceName) {
      nextErrors.referenceName = "Reference name is required when reference is enabled.";
    }
    if (hasReference && referencePhoneDigits.length > 0 && !PHONE_REGEX.test(referencePhoneDigits)) {
      nextErrors.referencePhone = "Reference mobile must be exactly 10 digits if entered.";
    }

    return {
      nextErrors,
      trimmedName,
      phoneDigits,
      normalizedEntryDateKey,
      trimmedReferenceName,
      referencePhoneDigits,
      referenceEnabled,
    };
  };

  const validateIntakeDetails = ({ focusOnError = true } = {}) => {
    const {
      nextErrors,
      trimmedName,
      phoneDigits,
      normalizedEntryDateKey,
      trimmedReferenceName,
      referencePhoneDigits,
      referenceEnabled,
    } = getIntakeValidationSnapshot();
    setIntakeFieldErrors(nextErrors);

    const firstInvalidField = ["customerName", "customerPhone", "entryDateKey", "referenceName", "referencePhone"].find((fieldKey) => nextErrors[fieldKey]);
    if (firstInvalidField) {
      setError(nextErrors[firstInvalidField]);
      const fieldStepMap = {
        customerName: 1,
        customerPhone: 1,
        entryDateKey: 1,
        referenceName: 1,
        referencePhone: 1,
      };
      setSubStep(fieldStepMap[firstInvalidField] || 1);
      if (focusOnError) focusIntakeField(firstInvalidField);
    }

    return {
      isValid: !firstInvalidField,
      trimmedName,
      phoneDigits,
      normalizedEntryDateKey,
      trimmedReferenceName,
      trimmedReferenceLabel: referencePhoneDigits,
      referenceEnabled,
    };
  };

  const queueUndoAction = (message, undoFn) => {
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
    setUndoAction({ message, undoFn });
    undoTimeoutRef.current = setTimeout(() => {
      setUndoAction(null);
      undoTimeoutRef.current = null;
    }, 6000);
  };

  const createTicket = () => {
    const intakeValidation = validateIntakeDetails({ focusOnError: true });
    if (!intakeValidation.isValid) {
      return;
    }

    const {
      trimmedName,
      phoneDigits,
      normalizedEntryDateKey,
      trimmedReferenceName,
      trimmedReferenceLabel,
      referenceEnabled,
    } = intakeValidation;
    setTicketMeta((previous) => ({
      ticketNo: previous?.ticketNo || generateBillNo(),
      date: formatIsoDateForDisplay(normalizedEntryDateKey),
      time: previous?.time || timeStr(),
      entryDateKey: normalizedEntryDateKey,
      hasReference: referenceEnabled,
      referenceName: referenceEnabled ? trimmedReferenceName : "",
      referenceLabel: referenceEnabled ? trimmedReferenceLabel : "",
      referenceType: "",
      referenceTypeLabel: referenceEnabled ? trimmedReferenceLabel : "",
      customerName: trimmedName,
      customerPhone: phoneDigits,
      operator,
    }));
    setSubStep(2);
    setError("");
  };

  const addTask = () => {
    if (!selectedService) return;
    const svc = services.find((s) => s.id === selectedService);
    if (!svc) return;
    const selectedDetailDraft = createDetailDraftForService(svc, selectedServiceDetailValues);
    const detailErrors = validateServiceDetailValues(svc, selectedDetailDraft);
    if (Object.keys(detailErrors).length > 0) {
      setServiceDetailErrorMap((prev) => ({ ...prev, [svc.id]: detailErrors }));
      setError("Complete the service detail section before adding this line item.");
      return;
    }
    const quantityConfig = getQuantityModeConfig(svc.quantityMode);
    const minQty = svc.minQty || quantityConfig.min;
    const maxQty = svc.maxQty || quantityConfig.defaultMax;
    const rawQty = Number(qty);
    const qtyNum = svc.quantityMode === "fixed" ? 1 : Math.max(minQty, rawQty || minQty);
    if (svc.quantityMode !== "fixed" && (!Number.isFinite(rawQty) || rawQty < minQty || rawQty > maxQty)) {
      setError(`${quantityConfig.inputLabel} must stay between ${minQty} and ${maxQty} for ${svc.name}.`);
      return;
    }
    const detailValues = createDetailDraftForService(svc, selectedDetailDraft);
    setItems((prev) => [...prev, {
      ...svc,
      qty: qtyNum,
      unitPrice: 0,
      amount: 0,
      detailValues,
      detailSummary: buildServiceDetailSummary(svc, detailValues),
      done: false,
    }]);
    setSelectedService("");
    setQty(1);
    setCustomAmt("");
    setError("");
  };

  const addDocument = () => {
    const cleanName = docName.trim();
    if (!cleanName) {
      setError("Document name is required before adding to status tracker.");
      return;
    }
    const exists = documents.some((doc) => doc.name.trim().toLowerCase() === cleanName.toLowerCase());
    if (exists) {
      setError("This document is already listed in the ticket.");
      return;
    }
    setDocuments((prev) => [
      ...prev,
      {
        id: `doc_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: cleanName,
        docPresetId: DOCUMENT_PRESET_BY_NAME[normalizeDocNameKey(cleanName)]?.id || "",
        required: docRequired,
        submitted: true,
        source: "intake_custom",
      },
    ]);
    setDocName("");
    setDocRequired(true);
    setError("");
  };

  const removeDocument = (docId) => {
    const removeIndex = documents.findIndex((doc) => doc.id === docId);
    if (removeIndex < 0) return;
    const removedDoc = documents[removeIndex];
    setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
    queueUndoAction(`Removed document "${removedDoc.name}".`, () => {
      setDocuments((current) => {
        const insertAt = Math.min(removeIndex, current.length);
        const withUndo = [...current];
        withUndo.splice(insertAt, 0, removedDoc);
        return withUndo;
      });
    });
    setError("");
  };

  const toggleDocumentRequired = (docId) => {
    setDocuments((prev) => prev.map((doc) => (
      doc.id === docId ? { ...doc, required: !doc.required } : doc
    )));
  };

  const toggleDocumentSubmitted = (docId) => {
    setDocuments((prev) => prev.map((doc) => (
      doc.id === docId ? { ...doc, submitted: !doc.submitted } : doc
    )));
  };

  const setDocumentSubmitted = (docId, nextSubmitted) => {
    setDocuments((prev) => prev.map((doc) => (
      doc.id === docId ? { ...doc, submitted: Boolean(nextSubmitted) } : doc
    )));
  };

  const removeTask = (idx) => {
    if (idx < 0 || idx >= items.length) return;
    const removedItem = items[idx];
    setItems((prev) => prev.filter((_, i) => i !== idx));
    queueUndoAction(`Removed service "${removedItem.name}".`, () => {
      setItems((current) => {
        const insertAt = Math.min(idx, current.length);
        const withUndo = [...current];
        withUndo.splice(insertAt, 0, removedItem);
        return withUndo;
      });
    });
    setError("");
  };

  const saveTicket = (status) => {
    if (!ticketMeta) return;
    if (items.length === 0) {
      setSubStep(1);
      setError("Add at least one service before saving ticket.");
      return;
    }
    if (hasNoTotal) {
      setSubStep(4);
      setError("Enter the total amount charged before saving.");
      return;
    }
    if (isOverpaid) {
      setSubStep(4);
      setError("Collected amount cannot exceed ticket total.");
      return;
    }

    const payMode = cashCollected > 0 && upiCollected > 0
      ? "Cash+UPI"
      : cashCollected > 0
        ? "Cash"
        : upiCollected > 0
          ? "UPI"
          : "Unpaid";
    const paymentStatus = pendingBalance === 0 && paidTotal > 0
      ? "Paid"
      : paidTotal > 0
        ? "Partial"
        : "Unpaid";

    const vendorAmountVal = vendorAmount !== "" && vendorAmount !== null
      ? Math.max(0, Number(vendorAmount) || 0)
      : null;
    const ticket = withStructuredTicket({
      ...ticketMeta,
      status,
      payMode,
      paymentStatus,
      cashCollected,
      upiCollected,
      paidTotal,
      pendingBalance,
      vendorAmount: vendorAmountVal,
      operator,
      items: [...items],
      documents: [...documents],
      total,
      updatedAt: `${todayStr()} ${timeStr()}`,
    });
    onSaveTicket(ticket);
    setSaved(ticket);
    setError("");
  };

  const resetTicket = () => {
    removeStoredValue(STORAGE_KEYS.ticketDraft);
    setSubStep(1);
    updateBrowserState({ tab: "entry" }, "replace");
    setHasReference(false);
    setCustomerName("");
    setCustomerPhone("");
    setEntryDateKey(getTicketCounterDateKey(new Date()));
    setReferenceName("");
    setReferenceLabel("");
    setOperator(DEFAULT_OPERATOR);
    setSelectedService("");
    setQty(1);
    setCustomAmt("");
    setServiceDetailMap({});
    setServiceDetailErrorMap({});
    setPaymentCash("");
    setPaymentUpi("");
    setTicketTotal("");
    setVendorAmount("");
    setDocName("");
    setDocRequired(true);
    setDocuments([]);
    setItems([]);
    setTicketMeta(null);
    setIntakeFieldErrors({});
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }
    setUndoAction(null);
    setDraftSavedAt(null);
    setDraftStorageState("idle");
    setSaved(null);
    setError("");
  };
  const requestClearDraftConfirmation = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Clear Draft",
      message: "Clear all intake and ticket draft fields? This will remove the current draft from local storage.",
      onConfirm: () => {
        closeConfirmDialog();
        resetTicket();
      },
    });
  };

  if (saved) {
    const savedStructured = toStructuredTicket(saved);
    const submittedDocNames = getUniqueSubmittedDocumentNames(saved.documents);
    const submittedRequiredCount = saved.documents?.filter((doc) => doc.required && doc.submitted).length || 0;
    const requiredCount = saved.documents?.filter((doc) => doc.required).length || 0;
    return (
      <div style={{ animation: "fadeIn 0.3s ease-out" }}>
        <div id="receipt" style={{ background: "rgba(255,255,255,0.97)", border: "1px solid rgba(15,23,42,0.10)", borderRadius: 20, padding: "24px 22px", maxWidth: 470, margin: "0 auto", color: "#0f172a", boxShadow: "0 16px 44px rgba(15,23,42,0.11)" }}>
          <div style={{ fontFamily: APP_BRAND_STACK, fontSize: "0.58rem", letterSpacing: "0.34em", textTransform: "uppercase", color: "rgba(15,23,42,0.50)", textAlign: "center", marginBottom: 6 }}>CSC Ticket Slip</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 12 }}>
            <div style={{ fontFamily: APP_BRAND_STACK, fontSize: "0.58rem", letterSpacing: "0.16em", textTransform: "uppercase", color: saved.status === "Open" ? "#1d4ed8" : DS.wine, fontWeight: 700, paddingTop: 2 }}>
              {saved.status}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.62rem", fontFamily: APP_BRAND_STACK, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(15,23,42,0.48)", marginBottom: 3 }}>File Number</div>
              <div style={{ fontWeight: 700, fontSize: "0.98rem", fontFamily: APP_MONO_STACK }}>{saved.ticketNo}</div>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: "0.62rem", fontFamily: APP_BRAND_STACK, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(15,23,42,0.48)", marginBottom: 4 }}>Document Holder</div>
            <div style={{ fontWeight: 700, fontSize: "1.08rem", lineHeight: 1.25, fontFamily: APP_FONT_STACK, marginBottom: 6 }}>{saved.customerName}</div>
            {!!saved.customerPhone && (
              <div style={{ fontSize: "0.78rem", color: "rgba(15,23,42,0.62)", fontFamily: APP_FONT_STACK, marginBottom: 4 }}>
                Contact: {saved.customerPhone}
              </div>
            )}
            <div style={{ fontSize: "0.78rem", color: "rgba(15,23,42,0.62)", fontFamily: APP_FONT_STACK }}>
              Reference Contact: {formatReferenceSummary(savedStructured.parties.reference)}
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(15,23,42,0.10)", borderBottom: "1px solid rgba(15,23,42,0.10)", padding: "10px 0 9px", marginBottom: 11 }}>
            {saved.items.map((it, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "4px 0", fontSize: "0.83rem", fontFamily: APP_FONT_STACK, color: "#0f172a" }}>
                <span>{it.name}</span>
                <span style={{ color: "rgba(15,23,42,0.55)", whiteSpace: "nowrap" }}>x{it.qty}</span>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gap: 5 }}>
            <div style={{ fontSize: "0.78rem", color: "rgba(15,23,42,0.62)", fontFamily: APP_FONT_STACK }}>
              Operator: {saved.operator}
            </div>
            <div style={{ fontSize: "0.78rem", color: "rgba(15,23,42,0.62)", fontFamily: APP_FONT_STACK }}>
              Payment: Collected Rs. {saved.paidTotal || 0} | Pending Rs. {saved.pendingBalance || 0}
            </div>
            <div style={{ fontSize: "0.78rem", color: "rgba(15,23,42,0.62)", fontFamily: APP_FONT_STACK }}>
              Docs: {submittedRequiredCount}/{requiredCount} required submitted
            </div>
            {!!submittedDocNames.length && (
              <div style={{ fontSize: "0.73rem", color: "rgba(15,23,42,0.50)", fontFamily: APP_FONT_STACK, lineHeight: 1.55 }}>
                Documents Collected: {submittedDocNames.join(", ")}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 16 }}>
          <button onClick={() => printTicketSlip(saved)} style={{ ...secondaryButtonStyle }}>Print Ticket</button>
          <button
            onClick={() => {
              resetTicket();
              onNavigateTab?.("home");
            }}
            style={{ ...primaryButtonStyle }}
          >
            Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      {(() => {
        const WIZARD_STEPS = [
          { num: 1, label: "Customer", short: "Info" },
          { num: 2, label: "Services", short: "Svc" },
          { num: 3, label: "Documents", short: "Docs" },
          { num: 4, label: "Payment", short: "Pay" },
        ];
        const totalSubSteps = WIZARD_STEPS.length;
        const intakeSnapshot = getIntakeValidationSnapshot();
        const intakeStepHasError = {
          1: Boolean(
            intakeSnapshot.nextErrors.customerName
            || intakeSnapshot.nextErrors.customerPhone
            || intakeSnapshot.nextErrors.entryDateKey
            || intakeSnapshot.nextErrors.referenceName
            || intakeSnapshot.nextErrors.referencePhone
          ),
          2: items.length === 0,
          3: false,
          4: isOverpaid || hasNoTotal,
        };

        const goNextSubStep = () => {
          setError("");
          if (subStep === 1) {
            createTicket();
            return;
          }
          if (subStep === 2 && items.length === 0) {
            setError("Add at least one service before continuing.");
            return;
          }
          if (subStep < totalSubSteps) setSubStep(subStep + 1);
        };

        const goPrevSubStep = () => {
          setError("");
          if (subStep > 1) setSubStep(subStep - 1);
        };

        return (
          <div style={{ ...surfaceCardStyle, marginBottom: 16 }}>
            {/* Wizard progress strip */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={sectionEyebrowStyle}>Intake  -  Step {subStep} of {totalSubSteps}</div>
                <div style={{ ...smallBadgeStyle, background: ENTRY_ACCENT_SOFTER, border: `1px solid ${ENTRY_ACCENT_BORDER}`, color: draftStatusAccent }}>
                  {draftStatusLabel}{draftSavedAt ? `  |  ${formatSyncTime(draftSavedAt)}` : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {WIZARD_STEPS.map((ws, i) => {
                  const done = subStep > ws.num;
                  const active = subStep === ws.num;
                  const hasError = intakeStepHasError[ws.num];
                  return (
                    <React.Fragment key={ws.num}>
                      <button
                        onClick={() => { setError(""); setSubStep(ws.num); }}
                        style={{
                          display: "flex", alignItems: "center", gap: 7,
                          padding: "7px 13px", borderRadius: 999,
                          border: hasError && !active ? "1px solid rgba(214,5,43,0.32)" : "none",
                          background: active
                            ? ENTRY_ACCENT
                            : hasError
                              ? "rgba(214,5,43,0.09)"
                              : done
                                ? ENTRY_ACCENT_SOFT
                                : "rgba(15,23,42,0.06)",
                          color: active
                            ? "#fff"
                            : hasError
                              ? "#8f2e3d"
                              : done
                                ? ENTRY_ACCENT_TEXT
                                : "rgba(15,23,42,0.45)",
                          fontFamily: APP_BRAND_STACK, fontWeight: 700, fontSize: "0.58rem",
                          letterSpacing: "0.18em", textTransform: "uppercase",
                          cursor: "pointer",
                          transition: "all 0.22s ease",
                          transform: active ? "scale(1.05)" : "scale(1)",
                        }}
                      >
                        <span style={{
                          width: 18, height: 18, borderRadius: "50%",
                          background: active
                            ? "rgba(255,255,255,0.22)"
                            : hasError
                              ? "rgba(214,5,43,0.16)"
                              : done
                                ? ENTRY_ACCENT
                                : "rgba(15,23,42,0.10)",
                          color: active
                            ? "#fff"
                            : hasError
                              ? "#8f2e3d"
                              : done
                                ? "#fff"
                                : "rgba(15,23,42,0.40)",
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.62rem", fontWeight: 700, fontFamily: APP_BRAND_STACK,
                          flexShrink: 0,
                        }}>
                          {hasError ? "!" : done ? "\u2713" : ws.num}
                        </span>
                        {ws.label}
                      </button>
                      {i < WIZARD_STEPS.length - 1 && (
                        <div style={{ flex: 1, height: 1, background: done ? ENTRY_ACCENT_BORDER : "rgba(15,23,42,0.08)", borderRadius: 1, minWidth: 8 }} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
              {/* thin progress bar */}
              <div style={{ marginTop: 12, height: 3, borderRadius: 3, background: "rgba(15,23,42,0.07)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${((subStep - 1) / (totalSubSteps - 1)) * 100}%`, background: ENTRY_ACCENT, borderRadius: 3, transition: "width 0.40s cubic-bezier(0.16,1,0.3,1)" }} />
              </div>
            </div>

            {/* Sub-step panels */}
            {subStep === 1 && (
              <div style={{ animation: "fadeIn 0.28s ease-out" }}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: "1.55rem", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a", marginBottom: 0, lineHeight: 1.1, fontFamily: APP_FONT_STACK }}>
                    Customer Details
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
                  <label style={{ display: "grid", gap: 8 }}>
                    <span style={sectionEyebrowStyle}>Document Holder Name *</span>
                    <input
                      ref={customerNameInputRef}
                      autoFocus
                      placeholder="Harsh Kumar"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        setIntakeFieldErrors((prev) => ({ ...prev, customerName: "" }));
                        setError("");
                      }}
                      style={{
                        ...inputStyle,
                        fontSize: "1rem",
                        padding: "13px 16px",
                        border: intakeFieldErrors.customerName ? "1px solid rgba(214,5,43,0.45)" : inputStyle.border,
                        boxShadow: intakeFieldErrors.customerName ? "0 0 0 2px rgba(214,5,43,0.08)" : inputStyle.boxShadow,
                      }}
                    />
                    {intakeFieldErrors.customerName && (
                      <span style={{ fontSize: "0.78rem", color: "#8f2e3d", fontFamily: APP_FONT_STACK }}>
                        {intakeFieldErrors.customerName}
                      </span>
                    )}
                  </label>
                  <label style={{ display: "grid", gap: 8 }}>
                    <span style={sectionEyebrowStyle}>Customer Mobile Number *</span>
                    <input
                      ref={customerPhoneInputRef}
                      type="tel"
                      placeholder="10 digits"
                      value={customerPhone}
                      onChange={(e) => {
                        setCustomerPhone(sanitizePhone(e.target.value));
                        setIntakeFieldErrors((prev) => ({ ...prev, customerPhone: "" }));
                        setError("");
                      }}
                      style={{
                        ...inputStyle,
                        fontSize: "1rem",
                        padding: "13px 16px",
                        border: intakeFieldErrors.customerPhone ? "1px solid rgba(214,5,43,0.45)" : inputStyle.border,
                        boxShadow: intakeFieldErrors.customerPhone ? "0 0 0 2px rgba(214,5,43,0.08)" : inputStyle.boxShadow,
                      }}
                    />
                    {intakeFieldErrors.customerPhone && (
                      <span style={{ fontSize: "0.78rem", color: "#8f2e3d", fontFamily: APP_FONT_STACK }}>
                        {intakeFieldErrors.customerPhone}
                      </span>
                    )}
                  </label>
                  <label style={{ display: "grid", gap: 8 }}>
                    <span style={sectionEyebrowStyle}>Entry Date *</span>
                    <input
                      ref={entryDateInputRef}
                      type="date"
                      min={getOffsetDateKey(-2)}
                      max={getTicketCounterDateKey(new Date())}
                      value={entryDateKey}
                      onChange={(e) => {
                        setEntryDateKey(toIsoDateKey(e.target.value));
                        setIntakeFieldErrors((prev) => ({ ...prev, entryDateKey: "" }));
                        setError("");
                      }}
                      style={{
                        ...inputStyle,
                        fontSize: "1rem",
                        padding: "13px 16px",
                        border: intakeFieldErrors.entryDateKey ? "1px solid rgba(214,5,43,0.45)" : inputStyle.border,
                        boxShadow: intakeFieldErrors.entryDateKey ? "0 0 0 2px rgba(214,5,43,0.08)" : inputStyle.boxShadow,
                      }}
                    />
                    {intakeFieldErrors.entryDateKey && (
                      <span style={{ fontSize: "0.78rem", color: "#8f2e3d", fontFamily: APP_FONT_STACK }}>
                        {intakeFieldErrors.entryDateKey}
                      </span>
                    )}
                  </label>
                  <label style={{ display: "grid", gap: 8 }}>
                    <span style={sectionEyebrowStyle}>Reference (optional)</span>
                    <span style={{
                      ...inputStyle,
                      fontSize: "1rem",
                      padding: "13px 16px",
                      minHeight: 54,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 10,
                      cursor: "pointer",
                      border: hasReference ? `1px solid ${ENTRY_ACCENT_BORDER}` : inputStyle.border,
                      boxShadow: hasReference ? `0 0 0 2px ${ENTRY_ACCENT_SOFTER}` : inputStyle.boxShadow,
                      background: hasReference ? ENTRY_ACCENT_SOFTER : inputStyle.background,
                    }}>
                      <input
                        type="checkbox"
                        checked={hasReference}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setHasReference(checked);
                          if (!checked) {
                            setReferenceName("");
                            setReferenceLabel("");
                            setIntakeFieldErrors((prev) => ({ ...prev, referenceName: "", referencePhone: "" }));
                          }
                          setError("");
                        }}
                        style={{ width: 18, height: 18, flexShrink: 0 }}
                      />
                      <span style={{ fontSize: "0.96rem", color: "#475569", fontWeight: 500, fontFamily: APP_FONT_STACK }}>
                        Add reference person
                      </span>
                    </span>
                  </label>
                  {hasReference && (
                    <>
                      <label style={{ display: "grid", gap: 8 }}>
                        <span style={sectionEyebrowStyle}>Reference Person Name *</span>
                        <input
                          ref={referenceNameInputRef}
                          placeholder="Riya Sharma"
                          value={referenceName}
                          onChange={(e) => {
                            setReferenceName(e.target.value);
                            setIntakeFieldErrors((prev) => ({ ...prev, referenceName: "" }));
                            setError("");
                          }}
                          style={{
                            ...inputStyle,
                            fontSize: "1rem",
                            padding: "13px 16px",
                            border: intakeFieldErrors.referenceName ? "1px solid rgba(214,5,43,0.45)" : inputStyle.border,
                            boxShadow: intakeFieldErrors.referenceName ? "0 0 0 2px rgba(214,5,43,0.08)" : inputStyle.boxShadow,
                          }}
                        />
                        {intakeFieldErrors.referenceName && (
                          <span style={{ fontSize: "0.78rem", color: "#8f2e3d", fontFamily: APP_FONT_STACK }}>
                            {intakeFieldErrors.referenceName}
                          </span>
                        )}
                      </label>
                      <label style={{ display: "grid", gap: 8 }}>
                        <span style={sectionEyebrowStyle}>Reference Mobile Number *</span>
                        <input
                          ref={referencePhoneInputRef}
                          type="tel"
                          placeholder="10 digits"
                          value={referenceLabel}
                          onChange={(e) => {
                            setReferenceLabel(sanitizePhone(e.target.value));
                            setIntakeFieldErrors((prev) => ({ ...prev, referencePhone: "" }));
                            setError("");
                          }}
                          style={{
                            ...inputStyle,
                            fontSize: "1rem",
                            padding: "13px 16px",
                            border: intakeFieldErrors.referencePhone ? "1px solid rgba(214,5,43,0.45)" : inputStyle.border,
                            boxShadow: intakeFieldErrors.referencePhone ? "0 0 0 2px rgba(214,5,43,0.08)" : inputStyle.boxShadow,
                          }}
                        />
                        {intakeFieldErrors.referencePhone && (
                          <span style={{ fontSize: "0.78rem", color: "#8f2e3d", fontFamily: APP_FONT_STACK }}>
                            {intakeFieldErrors.referencePhone}
                          </span>
                        )}
                      </label>
                    </>
                  )}
                </div>
              </div>
            )}

            {subStep === 2 && (
              <div style={{ animation: "fadeIn 0.28s ease-out" }}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: "1.55rem", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a", marginBottom: 0, fontFamily: APP_FONT_STACK }}>
                    Add Services
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 14, alignItems: "end" }}>
                  <label style={{ display: "grid", gap: 7 }}>
                    <span style={sectionEyebrowStyle}>Select Service</span>
                    <select value={selectedService} onChange={(e) => { setSelectedService(e.target.value); setCustomAmt(""); }} style={inputStyle}>
                      <option value="" style={MENU_OPTION_STYLE}>Choose a service...</option>
                      {CATEGORIES.map((cat) => (
                        <optgroup key={cat} label={cat} style={MENU_OPTGROUP_STYLE}>
                          {services.filter((s) => s.category === cat).map((s) => (
                            <option key={s.id} value={s.id} style={MENU_OPTION_STYLE}>{s.name}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </label>
                  {selectedServiceConfig && (
                    <>
                      <label style={{ display: "grid", gap: 7 }}>
                        <span style={sectionEyebrowStyle}>{selectedQuantityConfig?.inputLabel || "Quantity"}</span>
                        <input
                          type="number"
                          min={selectedServiceConfig?.minQty || 1}
                          max={selectedServiceConfig?.maxQty || 1}
                          disabled={selectedServiceConfig?.quantityMode === "fixed"}
                          value={selectedServiceConfig?.quantityMode === "fixed" ? 1 : qty}
                          onChange={(e) => setQty(e.target.value)}
                          style={{ ...inputStyle, textAlign: "center", background: selectedServiceConfig?.quantityMode === "fixed" ? "rgba(15,23,42,0.04)" : "rgba(255,255,255,0.82)", color: selectedServiceConfig?.quantityMode === "fixed" ? "rgba(15,23,42,0.40)" : "#0f172a" }}
                        />
                      </label>
                    </>
                  )}
                </div>

                {selectedServiceConfig && selectedDetailSchema?.fields?.length > 0 && (
                  <div style={{ ...softPanelStyle, marginBottom: 14 }}>
                    <div style={{ marginBottom: 8 }}>
                      <div style={sectionEyebrowStyle}>{selectedDetailSchema?.title || "Service Details"}</div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                      {selectedDetailSchema.fields.map((field) => (
                        <label key={`${selectedServiceConfig.id}_${field.key}`} style={{ display: "grid", gap: 6 }}>
                          <span style={sectionEyebrowStyle}>{field.label}{field.required ? " *" : ""}</span>
                          {field.type === "select" ? (
                            <select
                              value={selectedServiceDetailValues[field.key] || ""}
                              onChange={(e) => {
                                setServiceDetailMap((prev) => ({ ...prev, [selectedServiceConfig.id]: { ...(prev[selectedServiceConfig.id] || {}), [field.key]: e.target.value } }));
                                setServiceDetailErrorMap((prev) => ({ ...prev, [selectedServiceConfig.id]: { ...(prev[selectedServiceConfig.id] || {}), [field.key]: "" } }));
                              }}
                              style={inputStyle}
                            >
                              <option value="" style={MENU_OPTION_STYLE}>Select...</option>
                              {field.options?.map((option) => (
                                <option key={`${field.key}_${option}`} value={option} style={MENU_OPTION_STYLE}>{option}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={field.type === "number" ? "number" : "text"}
                              min={field.min}
                              value={selectedServiceDetailValues[field.key] || ""}
                              onChange={(e) => {
                                setServiceDetailMap((prev) => ({ ...prev, [selectedServiceConfig.id]: { ...(prev[selectedServiceConfig.id] || {}), [field.key]: e.target.value } }));
                                setServiceDetailErrorMap((prev) => ({ ...prev, [selectedServiceConfig.id]: { ...(prev[selectedServiceConfig.id] || {}), [field.key]: "" } }));
                              }}
                              placeholder={field.placeholder}
                              style={inputStyle}
                            />
                          )}
                          {selectedServiceDetailErrors[field.key] && (
                            <span style={{ fontSize: "0.76rem", color: "#8f2e3d", fontFamily: APP_FONT_STACK }}>{selectedServiceDetailErrors[field.key]}</span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {selectedServiceConfig && (
                  <div style={{ ...softPanelStyle, marginBottom: 14 }}>
                    <div style={sectionEyebrowStyle}>Required Documents (Preview)</div>
                    {getRequiredDocumentNamesForService(selectedServiceConfig).length === 0 ? (
                      <div style={{ fontSize: "0.80rem", color: "rgba(15,23,42,0.50)", fontFamily: APP_FONT_STACK }}>
                        No required documents configured for this service.
                      </div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
                        {getRequiredDocumentNamesForService(selectedServiceConfig).map((docName) => (
                          <div key={`preview_${selectedServiceConfig.id}_${normalizeDocNameKey(docName)}`} style={{ border: "1px solid rgba(15,23,42,0.09)", borderRadius: 10, background: "rgba(255,255,255,0.74)", padding: "9px 11px", fontSize: "0.80rem", color: "#0f172a", fontFamily: APP_FONT_STACK, fontWeight: 600 }}>
                            {docName}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {selectedServiceConfig && (
                  <div style={{ marginBottom: 20 }}>
                    <button onClick={addTask} style={{ ...primaryButtonStyle, padding: "13px 28px" }}>
                      + Add to Ticket
                    </button>
                    {selectedServiceConfig?.quantityMode !== "fixed" && (
                      <span style={{ marginLeft: 12, fontSize: "0.80rem", color: "rgba(15,23,42,0.45)", fontFamily: APP_FONT_STACK }}>
                        max qty {selectedServiceConfig.maxQty}
                      </span>
                    )}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={sectionEyebrowStyle}>Added Services</div>
                  {items.length > 0 && (
                    <div style={{ ...smallBadgeStyle, background: ENTRY_ACCENT_SOFTER, border: `1px solid ${ENTRY_ACCENT_BORDER}`, color: ENTRY_ACCENT_TEXT }}>
                      {items.length} item{items.length === 1 ? "" : "s"}
                    </div>
                  )}
                </div>
                {items.length === 0 ? (
                  <div style={{ ...softPanelStyle, textAlign: "center", color: "rgba(15,23,42,0.45)", fontSize: "0.85rem", padding: "22px 16px" }}>
                    No services added yet.
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 8 }}>
                    {items.map((it, i) => (
                      <div key={i} style={{ ...softPanelStyle, padding: "12px 14px", display: "flex", gap: 12, alignItems: "center" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.90rem", fontFamily: APP_FONT_STACK }}>{it.name}</div>
                          <div style={{ fontSize: "0.76rem", color: "rgba(15,23,42,0.52)", marginTop: 2 }}>
                            {getQuantityModeConfig(it.quantityMode).inputLabel} {it.qty}
                          </div>
                          {!!it.detailSummary && (
                            <div style={{ fontSize: "0.74rem", color: "rgba(15,23,42,0.48)", lineHeight: 1.5, marginTop: 3 }}>{it.detailSummary}</div>
                          )}
                        </div>
                        <button onClick={() => removeTask(i)} style={{ width: 30, height: 30, border: "1px solid rgba(214,5,43,0.20)", borderRadius: 8, background: "rgba(214,5,43,0.06)", color: "#8f2e3d", cursor: "pointer", fontWeight: 800, fontSize: "0.8rem", flexShrink: 0 }}>
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {subStep === 3 && (
              <div style={{ animation: "fadeIn 0.28s ease-out" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: "1.55rem", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a", marginBottom: 0, fontFamily: APP_FONT_STACK }}>
                      Service Document Intake
                    </div>
                  </div>
                  <div style={{ ...smallBadgeStyle, background: "rgba(15,23,42,0.05)", border: "1px solid rgba(15,23,42,0.09)", color: "rgba(15,23,42,0.52)" }}>
                    {submittedRequiredDocsCount}/{requiredDocsCount} required submitted
                  </div>
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {serviceDocumentGroups.length === 0 ? (
                    <div style={{ ...softPanelStyle, textAlign: "center", color: "rgba(15,23,42,0.45)", fontSize: "0.84rem", padding: "22px 16px" }}>
                      Add at least one service first. Required documents will appear service-wise.
                    </div>
                  ) : (
                    serviceDocumentGroups.map((group) => (
                      <div key={`group_${group.serviceId}`} style={{ ...softPanelStyle, padding: "14px 15px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
                          <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#0f172a", fontFamily: APP_FONT_STACK }}>
                            {group.serviceName}
                          </div>
                          <div style={{ ...smallBadgeStyle, background: ENTRY_ACCENT_SOFTER, border: `1px solid ${ENTRY_ACCENT_BORDER}`, color: ENTRY_ACCENT_TEXT }}>
                            {group.docs.filter((doc) => doc.submitted).length}/{group.docs.length} intaked
                          </div>
                        </div>
                        {group.docs.length === 0 ? (
                          <div style={{ fontSize: "0.80rem", color: "rgba(15,23,42,0.45)", fontFamily: APP_FONT_STACK }}>
                            No required documents configured for this service.
                          </div>
                        ) : (
                          <div style={{ display: "grid", gap: 8 }}>
                            {group.docs.map((doc) => (
                              <div key={doc.id} style={{ border: "1px solid rgba(15,23,42,0.09)", borderRadius: 10, background: "rgba(255,255,255,0.72)", padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                                <div style={{ fontSize: "0.84rem", color: "#0f172a", fontWeight: 600, fontFamily: APP_FONT_STACK }}>
                                  {doc.name}
                                </div>
                                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                                  <label style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(15,23,42,0.64)", fontSize: "0.78rem", fontFamily: APP_FONT_STACK, cursor: "pointer" }}>
                                    <input
                                      type="radio"
                                      name={`doc_status_${doc.id}`}
                                      checked={Boolean(doc.submitted)}
                                      onChange={() => setDocumentSubmitted(doc.id, true)}
                                    />
                                    Intaked
                                  </label>
                                  <label style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(15,23,42,0.64)", fontSize: "0.78rem", fontFamily: APP_FONT_STACK, cursor: "pointer" }}>
                                    <input
                                      type="radio"
                                      name={`doc_status_${doc.id}`}
                                      checked={!doc.submitted}
                                      onChange={() => setDocumentSubmitted(doc.id, false)}
                                    />
                                    Pending
                                  </label>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div style={{ ...softPanelStyle, marginTop: 12 }}>
                  <div style={sectionEyebrowStyle}>Custom Documents</div>
                  <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 8, alignItems: "center", marginBottom: 10 }}>
                    <input
                      value={docName}
                      onChange={(e) => {
                        setDocName(e.target.value);
                        setError("");
                      }}
                      placeholder="Add custom document"
                      style={inputStyle}
                    />
                    <button onClick={addDocument} style={{ ...secondaryButtonStyle, padding: "11px 16px" }}>
                      Add
                    </button>
                  </div>
                  {documents.filter((doc) => doc.source !== "service_required").length === 0 ? (
                    <div style={{ fontSize: "0.80rem", color: "rgba(15,23,42,0.50)", fontFamily: APP_FONT_STACK }}>
                      No custom documents added.
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: 8 }}>
                      {documents.filter((doc) => doc.source !== "service_required").map((doc) => (
                        <div key={doc.id} style={{ border: "1px solid rgba(15,23,42,0.09)", borderRadius: 10, background: "rgba(255,255,255,0.72)", padding: "9px 11px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                          <div style={{ fontSize: "0.82rem", color: "#0f172a", fontFamily: APP_FONT_STACK, fontWeight: 600 }}>{doc.name}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.76rem", color: "rgba(15,23,42,0.60)", fontFamily: APP_FONT_STACK, cursor: "pointer" }}>
                              <input type="checkbox" checked={Boolean(doc.submitted)} onChange={() => toggleDocumentSubmitted(doc.id)} />
                              Received
                            </label>
                            <button onClick={() => removeDocument(doc.id)} style={{ width: 28, height: 28, border: "1px solid rgba(214,5,43,0.20)", borderRadius: 8, background: "rgba(214,5,43,0.06)", color: "#8f2e3d", cursor: "pointer", fontWeight: 800, fontSize: "0.8rem", flexShrink: 0 }}>
                              x
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {subStep === 4 && (
              <div style={{ animation: "fadeIn 0.28s ease-out" }}>
                <div style={{ maxWidth: 980, margin: "0 auto", width: "100%" }}>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: "1.55rem", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a", marginBottom: 0, fontFamily: APP_FONT_STACK }}>
                      Payment
                    </div>
                  </div>

                  <div style={{ ...softPanelStyle, marginBottom: 14 }}>
                    <label style={{ display: "grid", gap: 7, maxWidth: 280 }}>
                      <span style={sectionEyebrowStyle}>Operator</span>
                      <select value={operator} onChange={(e) => setOperator(e.target.value)} style={inputStyle}>
                        {OPERATORS.map((name) => (
                          <option key={`op_${name}`} value={name} style={MENU_OPTION_STYLE}>{name}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div style={{ ...softPanelStyle, marginBottom: 14, padding: "14px 16px" }}>
                    <div style={sectionEyebrowStyle}>Services Summary</div>
                    <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
                      {items.map((it, i) => (
                        <div key={i} style={{ fontSize: "0.86rem", color: "#0f172a", fontFamily: APP_FONT_STACK }}>
                          {it.name} ×{it.qty}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ maxWidth: 760, margin: "0 auto 14px", display: "grid", gap: 12 }}>
                    <label style={{ display: "grid", gap: 7 }}>
                      <span style={{ ...sectionEyebrowStyle, color: ENTRY_ACCENT_TEXT }}>Total Amount (Rs.) <span style={{ fontSize: "0.70rem", fontWeight: 400, color: "rgba(15,23,42,0.50)", textTransform: "none", letterSpacing: 0 }}>— final amount billed to customer</span></span>
                      <input
                        type="number"
                        min="0"
                        value={ticketTotal}
                        onChange={(e) => setTicketTotal(e.target.value)}
                        placeholder="Enter total amount charged"
                        style={{ ...inputStyle, fontSize: "1.15rem", fontWeight: 700, padding: "14px 16px", textAlign: "right", border: ticketTotal ? `1px solid ${ENTRY_ACCENT_BORDER}` : inputStyle.border }}
                      />
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                      <label style={{ display: "grid", gap: 7 }}>
                        <span style={sectionEyebrowStyle}>Cash Collected</span>
                        <input type="number" min="0" value={paymentCash} onChange={(e) => setPaymentCash(e.target.value)} placeholder="Rs. 0" style={{ ...inputStyle, fontSize: "1rem", padding: "12px 14px", textAlign: "right" }} />
                      </label>
                      <label style={{ display: "grid", gap: 7 }}>
                        <span style={sectionEyebrowStyle}>UPI Collected</span>
                        <input type="number" min="0" value={paymentUpi} onChange={(e) => setPaymentUpi(e.target.value)} placeholder="Rs. 0" style={{ ...inputStyle, fontSize: "1rem", padding: "12px 14px", textAlign: "right" }} />
                      </label>
                      <label style={{ display: "grid", gap: 7 }}>
                        <span style={sectionEyebrowStyle}>Vendor Amount <span style={{ fontSize: "0.70rem", fontWeight: 400, color: "rgba(15,23,42,0.45)", textTransform: "none", letterSpacing: 0 }}>(our actual cost)</span></span>
                        <input type="number" min="0" value={vendorAmount} onChange={(e) => setVendorAmount(e.target.value)} placeholder="Rs. 0 (optional)" style={{ ...inputStyle, fontSize: "1rem", padding: "12px 14px", textAlign: "right" }} />
                      </label>
                    </div>
                  </div>

                  <div style={{ ...softPanelStyle, marginBottom: 14 }}>
                    <div style={{ display: "grid", gap: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "rgba(15,23,42,0.60)", fontFamily: APP_FONT_STACK }}>
                        <span>Total Amount</span>
                        <span style={{ color: total > 0 ? "#0f172a" : "rgba(15,23,42,0.35)", fontWeight: 700 }}>
                          {total > 0 ? `Rs. ${total}` : "—"}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "rgba(15,23,42,0.60)", fontFamily: APP_FONT_STACK }}>
                        <span>Collected</span><span style={{ color: "#0f172a", fontWeight: 700 }}>Rs. {paidTotal}</span>
                      </div>
                      {total > 0 && (
                        <div style={{ borderTop: "1px solid rgba(15,23,42,0.08)", paddingTop: 10, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "1.02rem", fontFamily: APP_FONT_STACK, color: ENTRY_ACCENT_TEXT }}>
                          <span>Pending Balance</span><span>Rs. {pendingBalance}</span>
                        </div>
                      )}
                      {vendorAmount !== "" && vendorAmount !== null && (
                        <div style={{ borderTop: "1px solid rgba(15,23,42,0.08)", paddingTop: 10, display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "rgba(15,23,42,0.60)", fontFamily: APP_FONT_STACK }}>
                          <span>Vendor Amount (our cost)</span>
                          <span style={{ color: "#0f172a", fontWeight: 700 }}>Rs. {Math.max(0, Number(vendorAmount) || 0)}</span>
                        </div>
                      )}
                      <div style={{ borderTop: "1px solid rgba(15,23,42,0.08)", paddingTop: 10 }}>
                        <div style={{ fontSize: "0.74rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(15,23,42,0.48)", marginBottom: 8 }}>
                          Documents Collected
                        </div>
                        {documents.filter((doc) => doc.submitted).length === 0 ? (
                          <div style={{ fontSize: "0.82rem", color: "rgba(15,23,42,0.52)", fontFamily: APP_FONT_STACK }}>
                            No documents marked as collected.
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {Array.from(new Set(
                              documents
                                .filter((doc) => doc.submitted)
                                .map((doc) => String(doc.name || "").trim())
                                .filter(Boolean)
                            )).map((docName) => (
                              <span
                                key={`payment_doc_${normalizeDocNameKey(docName)}`}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  borderRadius: 999,
                                  border: "1px solid rgba(15,23,42,0.12)",
                                  background: "rgba(255,255,255,0.82)",
                                  color: "#0f172a",
                                  fontSize: "0.76rem",
                                  fontFamily: APP_FONT_STACK,
                                  fontWeight: 600,
                                  padding: "5px 10px",
                                }}
                              >
                                {docName}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ maxWidth: 760, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <button
                      onClick={() => saveTicket("Open")}
                      style={{ ...secondaryButtonStyle, background: canSaveTicket ? ENTRY_ACCENT_SOFTER : "rgba(15,23,42,0.04)", border: canSaveTicket ? `1px solid ${ENTRY_ACCENT_BORDER}` : "1px solid rgba(15,23,42,0.09)", color: canSaveTicket ? ENTRY_ACCENT_TEXT : "rgba(15,23,42,0.45)", cursor: "pointer" }}
                    >
                      Save for Later
                    </button>
                    <button
                      onClick={() => saveTicket("Closed")}
                      style={{ ...primaryButtonStyle, padding: "13px 22px", background: canSaveTicket ? ENTRY_ACCENT_SOFT : "rgba(15,23,42,0.04)", border: canSaveTicket ? `1px solid ${ENTRY_ACCENT_BORDER}` : "1px solid rgba(15,23,42,0.09)", color: canSaveTicket ? ENTRY_ACCENT_TEXT : "rgba(15,23,42,0.45)", cursor: "pointer" }}
                    >
                      Save & Complete
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{ marginTop: 16, padding: "11px 14px", borderRadius: 12, background: "rgba(214,5,43,0.07)", border: "1px solid rgba(214,5,43,0.22)", color: "#8f2e3d", fontSize: "0.84rem", fontFamily: APP_FONT_STACK, fontWeight: 600 }}>
                {error}
              </div>
            )}

            {/* Wizard nav buttons */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 28, gap: 12 }}>
              <div style={{ display: "flex", gap: 8 }}>
                {subStep > 1 ? (
                  <button onClick={goPrevSubStep} style={secondaryButtonStyle}>&larr; Back</button>
                ) : (
                  <button onClick={requestClearDraftConfirmation} style={secondaryButtonStyle}>Clear Draft</button>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {subStep < totalSubSteps && (
                  <span style={{ fontSize: "0.75rem", color: "rgba(15,23,42,0.40)", fontFamily: APP_FONT_STACK }}>
                    {totalSubSteps - subStep} step{totalSubSteps - subStep > 1 ? "s" : ""} left
                  </span>
                )}
                {subStep < totalSubSteps && (
                  <button
                    onClick={goNextSubStep}
                    style={{ ...primaryButtonStyle, padding: "13px 28px" }}
                  >
                    Next -&gt;
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onCancel={closeConfirmDialog}
        onConfirm={() => confirmDialog.onConfirm?.()}
        confirmLabel="Clear"
      />
    </div>
  );
}

function TicketDashboard({ tickets, onToggleTicketStatus, onToggleTaskDone, onUpdateTicket, onDeleteTicket, onNavigateTab }) {
  const [expandedTickets, setExpandedTickets] = useState({});
  const [viewTicketNo, setViewTicketNo] = useState(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [editTicketNo, setEditTicketNo] = useState(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [editDraft, setEditDraft] = useState({
    customerName: "",
    customerPhone: "",
    hasReference: false,
    referenceName: "",
    referenceLabel: "",
    operator: DEFAULT_OPERATOR,
    cashCollected: "",
    upiCollected: "",
  });
  const [editError, setEditError] = useState("");
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });
  const [accessCodeDialog, setAccessCodeDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    actionLabel: "",
    code: "",
    error: "",
    onAuthorized: null,
  });
  const [openMenuTicketNo, setOpenMenuTicketNo] = useState(null);
  const overflowMenuRef = useRef(null);

  const normalizedTickets = tickets.map((t) => (t.structured ? t : withStructuredTicket(t)));
  const typeFilterOptions = [
    { id: "all", label: "All Types" },
    { id: "with_reference", label: "With Reference" },
    { id: "no_reference", label: "No Reference" },
    ...CATEGORIES.map((category) => ({ id: `service:${category}`, label: category })),
  ];
  const paymentFilterOptions = [
    { id: "all", label: "All Payments" },
    { id: "paid", label: "Paid" },
    { id: "partial", label: "Partial" },
    { id: "unpaid", label: "Unpaid" },
  ];
  const doesTicketMatchTypeFilter = (ticket, nextTypeFilter) => {
    const structured = ticket.structured || toStructuredTicket(ticket);
    return nextTypeFilter === "all"
      ? true
      : nextTypeFilter === "with_reference"
        ? structured.parties.reference.hasReference
        : nextTypeFilter === "no_reference"
          ? !structured.parties.reference.hasReference
          : structured.meta.serviceTypes.includes(nextTypeFilter.replace("service:", ""));
  };
  const getTypeFilterCount = (nextTypeFilter) => (
    normalizedTickets.filter((ticket) => doesTicketMatchTypeFilter(ticket, nextTypeFilter)).length
  );
  const filteredTickets = normalizedTickets.filter((ticket) => {
    const structured = ticket.structured || toStructuredTicket(ticket);
    const matchesType = doesTicketMatchTypeFilter(ticket, typeFilter);
    const matchesPayment = paymentFilter === "all"
      ? true
      : structured.payment.status.toLowerCase() === paymentFilter;
    return matchesType && matchesPayment;
  });
  const openTickets = filteredTickets.filter((t) => t.status === "Open");
  const closedTickets = filteredTickets.filter((t) => t.status === "Closed");
  const totalTasks = filteredTickets.reduce((sum, t) => sum + t.items.length, 0);
  const doneTasks = filteredTickets.reduce((sum, t) => sum + t.items.filter((it) => it.done).length, 0);
  const activeTypeFilterLabel = typeFilterOptions.find((option) => option.id === typeFilter)?.label || "All Types";
  const activePaymentFilterLabel = paymentFilterOptions.find((option) => option.id === paymentFilter)?.label || "All Payments";
  const viewingTicket = normalizedTickets.find((t) => t.ticketNo === viewTicketNo) || null;
  const viewingStructured = viewingTicket ? (viewingTicket.structured || toStructuredTicket(viewingTicket)) : null;
  const editingTicket = normalizedTickets.find((t) => t.ticketNo === editTicketNo) || null;
  const detailCardStyle = {
    background: "rgba(255,255,255,0.65)",
    border: "1px solid rgba(15,23,42,0.09)",
    borderRadius: 12,
    padding: 14,
    boxShadow: "0 8px 20px rgba(15,23,42,0.06)",
  };
  const sectionCardStyle = {
    background: "rgba(255,255,255,0.72)",
    border: "1px solid rgba(15,23,42,0.09)",
    borderRadius: 14,
    padding: 14,
    boxShadow: "0 10px 24px rgba(15,23,42,0.07)",
  };
  const dashEyebrowStyle = {
    fontSize: "0.58rem",
    color: DS.wine,
    fontFamily: APP_BRAND_STACK,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.28em",
    marginBottom: 6,
    display: "block",
  };
  const dashInputStyle = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid rgba(15,23,42,0.12)",
    borderRadius: 8,
    background: "rgba(255,255,255,0.82)",
    color: "#0f172a",
    outline: "none",
    fontFamily: APP_FONT_STACK,
    fontSize: "0.84rem",
  };
  const actionButtonBase = {
    borderRadius: 999,
    padding: "7px 14px",
    fontFamily: APP_BRAND_STACK,
    fontSize: "0.58rem",
    fontWeight: 700,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    cursor: "pointer",
    transition: "all 0.18s ease",
  };
  const actionButtonStyles = {
    raw: {
      ...actionButtonBase,
      border: "1px solid rgba(74,130,192,0.35)",
      background: "rgba(74,130,192,0.10)",
      color: "#2a5a8f",
    },
    closeView: {
      ...actionButtonBase,
      border: "1px solid rgba(15,23,42,0.14)",
      background: "rgba(255,255,255,0.70)",
      color: "rgba(15,23,42,0.70)",
    },
    view: {
      ...actionButtonBase,
      border: "1px solid rgba(74,130,192,0.35)",
      background: "rgba(74,130,192,0.10)",
      color: "#2a5a8f",
    },
    print: {
      ...actionButtonBase,
      border: "1px solid rgba(37,99,235,0.35)",
      background: "rgba(37,99,235,0.08)",
      color: DS.wine,
    },
    edit: {
      ...actionButtonBase,
      border: "1px solid rgba(59,130,246,0.38)",
      background: "rgba(59,130,246,0.10)",
      color: "#1d4ed8",
    },
    neutral: {
      ...actionButtonBase,
      border: "1px solid rgba(15,23,42,0.14)",
      background: "rgba(15,23,42,0.04)",
      color: "rgba(15,23,42,0.60)",
    },
    success: {
      ...actionButtonBase,
      border: "1px solid rgba(58,158,120,0.38)",
      background: "rgba(58,158,120,0.10)",
      color: "#1e6447",
    },
    warning: {
      ...actionButtonBase,
      border: "1px solid rgba(59,130,246,0.38)",
      background: "rgba(59,130,246,0.10)",
      color: "#1d4ed8",
    },
  };

  const toggleExpand = (ticketNo) => {
    setExpandedTickets((prev) => ({ ...prev, [ticketNo]: !prev[ticketNo] }));
  };

  const startEdit = (ticket) => {
    setEditTicketNo(ticket.ticketNo);
    setEditDraft({
      customerName: ticket.customerName || "",
      customerPhone: ticket.customerPhone || "",
      hasReference: getHasReferenceValue(ticket),
      referenceName: ticket.referenceName || "",
      referenceLabel: getReferenceLabelValue(ticket),
      operator: ticket.operator || DEFAULT_OPERATOR,
      total: String(Number(ticket.total) || 0),
      cashCollected: String(Number(ticket.cashCollected) || 0),
      upiCollected: String(Number(ticket.upiCollected) || 0),
      vendorAmount: ticket.vendorAmount != null ? String(ticket.vendorAmount) : "",
    });
    setEditError("");
  };

  const saveEdit = () => {
    if (!editTicketNo || typeof onUpdateTicket !== "function") return;
    const name = editDraft.customerName.trim();
    const referenceName = editDraft.referenceName.trim();
    const referenceLabel = editDraft.referenceLabel.trim();
    const referenceEnabled = editDraft.hasReference && Boolean(referenceName);
    const phone = (editDraft.customerPhone || "").replace(/\D/g, "").slice(0, 10);
    const cashCollected = Math.max(0, Number(editDraft.cashCollected) || 0);
    const upiCollected = Math.max(0, Number(editDraft.upiCollected) || 0);
    const paidTotal = cashCollected + upiCollected;
    const total = Math.max(0, Number(editDraft.total) || 0);
    const pendingBalance = Math.max(0, total - paidTotal);

    if (!name) {
      setEditError("Document holder name is required.");
      return;
    }
    if (editDraft.hasReference && !referenceName) {
      setEditError("Reference name is required when reference is enabled.");
      return;
    }
    if (phone && !PHONE_REGEX.test(phone)) {
      setEditError("Contact number must be exactly 10 digits.");
      return;
    }
    if (paidTotal > total) {
      setEditError("Collected amount cannot exceed ticket total.");
      return;
    }
    const payMode = cashCollected > 0 && upiCollected > 0
      ? "Cash+UPI"
      : cashCollected > 0
        ? "Cash"
        : upiCollected > 0
          ? "UPI"
          : "Unpaid";
    const paymentStatus = pendingBalance === 0 && paidTotal > 0
      ? "Paid"
      : paidTotal > 0
        ? "Partial"
        : "Unpaid";

    const editVendorAmount = editDraft.vendorAmount !== "" && editDraft.vendorAmount != null
      ? Math.max(0, Number(editDraft.vendorAmount) || 0)
      : null;
    onUpdateTicket(editTicketNo, {
      customerName: name,
      customerPhone: phone,
      hasReference: referenceEnabled,
      referenceName: referenceEnabled ? referenceName : "",
      referenceLabel: referenceEnabled ? referenceLabel : "",
      referenceType: "",
      referenceTypeLabel: referenceEnabled ? referenceLabel : "",
      operator: editDraft.operator,
      total,
      payMode,
      paymentStatus,
      cashCollected,
      upiCollected,
      paidTotal,
      pendingBalance,
      vendorAmount: editVendorAmount,
    });
    setEditTicketNo(null);
    setEditError("");
  };

  const renderExpandedContent = (ticket) => {
    const structured = ticket.structured || toStructuredTicket(ticket);
    return (
      <div style={{ marginTop: 10, borderTop: "1px solid rgba(15,23,42,0.09)", paddingTop: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 8, marginBottom: 10 }}>
          {[
            { label: "Document Holder", main: structured.parties.documentHolder.name, sub: structured.parties.documentHolder.phone || "No contact saved" },
            { label: "Reference Contact", main: structured.parties.reference.hasReference ? structured.parties.reference.name : "No reference", sub: structured.parties.reference.hasReference ? (structured.parties.reference.label || "No label") : "Optional" },
            { label: "Meta", main: `Status: ${structured.meta.status}`, sub: `Updated: ${structured.meta.updatedAt || "N/A"}` },
            { label: "Payment", main: `Status: ${structured.payment.status}`, sub: `Paid Rs. ${structured.payment.paidTotal} | Pending Rs. ${structured.payment.pendingBalance}${structured.payment.vendorAmount != null ? ` | Vendor Rs. ${structured.payment.vendorAmount}` : ""}` },
          ].map((info) => (
            <div key={info.label} style={{ ...detailCardStyle, padding: 10 }}>
              <div style={dashEyebrowStyle}>{info.label}</div>
              <div style={{ fontSize: "0.84rem", fontWeight: 600, color: "#0f172a", fontFamily: APP_FONT_STACK }}>{info.main}</div>
              <div style={{ fontSize: "0.75rem", color: "rgba(15,23,42,0.55)", fontFamily: APP_FONT_STACK }}>{info.sub}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: "0.72rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: DS.wine, marginBottom: 6 }}>Service Breakdown</div>
        <div style={{ display: "grid", gap: 4 }}>
          {structured.services.map((it, idx) => (
            <div key={`${ticket.ticketNo}_expand_${idx}`} style={{ fontSize: "0.82rem", color: "#0f172a", padding: "5px 0", borderBottom: idx < structured.services.length - 1 ? "1px solid rgba(15,23,42,0.08)" : "none", fontFamily: APP_FONT_STACK }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span>{it.name}</span>
                <span style={{ color: "rgba(15,23,42,0.55)" }}>{getQuantityModeConfig(it.quantityMode).inputLabel} {it.qty} | Rs. {it.amount}</span>
              </div>
              {!!it.detailSummary && (
                <div style={{ color: "rgba(15,23,42,0.50)", marginTop: 2, lineHeight: 1.5, fontSize: "0.76rem" }}>{it.detailSummary}</div>
              )}
            </div>
          ))}
        </div>
        {structured.documents.items.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: "0.72rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: DS.wine, marginBottom: 5 }}>Document Status</div>
            <div style={{ display: "grid", gap: 4 }}>
              {structured.documents.items.map((doc, idx) => (
                <div key={`${ticket.ticketNo}_doc_${idx}`} style={{ display: "flex", justifyContent: "space-between", color: "#0f172a", fontSize: "0.80rem", fontFamily: APP_FONT_STACK }}>
                  <span>{doc.name}</span>
                  <span style={{ color: "rgba(15,23,42,0.55)" }}>{doc.required ? "Required" : "Optional"} | {doc.submitted ? "Submitted" : "Pending"}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const dashboardCard = {
    background: OPS.surface,
    border: `1px solid ${OPS.border}`,
    borderRadius: 14,
    boxShadow: ELEVATION.raised,
  };
  const dashLabel = {
    fontSize: "0.78rem",
    color: OPS.textMuted,
    fontFamily: APP_FONT_STACK,
    fontWeight: 600,
  };
  const listActionStyle = {
    border: `1px solid ${OPS.primaryBorder}`,
    borderRadius: 8,
    background: OPS.primarySoft,
    color: OPS.primary,
    fontFamily: APP_FONT_STACK,
    fontWeight: 600,
    fontSize: "0.75rem",
    padding: "7px 10px",
    cursor: "pointer",
    transition: "all 0.16s ease",
  };
  const compactInput = {
    width: "100%",
    padding: "9px 10px",
    borderRadius: 8,
    border: `1px solid ${OPS.border}`,
    background: OPS.surface,
    color: OPS.text,
    fontSize: "0.84rem",
    fontFamily: APP_FONT_STACK,
    outline: "none",
  };
  const dangerActionStyle = {
    ...listActionStyle,
    border: `1px solid rgba(220, 38, 38, 0.36)`,
    background: "rgba(220, 38, 38, 0.10)",
    color: OPS.danger,
  };
  const overflowMenuStyle = {
    position: "absolute",
    right: 0,
    top: "100%",
    marginTop: 6,
    zIndex: 10,
    minWidth: 170,
    borderRadius: 10,
    border: `1px solid ${OPS.border}`,
    background: "#ffffff",
    boxShadow: "0 12px 30px rgba(15,23,42,0.14)",
    padding: 6,
    display: "grid",
    gap: 4,
  };
  const overflowMenuItemStyle = {
    border: `1px solid ${OPS.borderSoft}`,
    borderRadius: 8,
    background: "rgba(248,250,252,0.95)",
    color: OPS.text,
    fontFamily: APP_FONT_STACK,
    fontWeight: 600,
    fontSize: "0.76rem",
    textAlign: "left",
    padding: "7px 9px",
    cursor: "pointer",
  };
  const closeConfirmDialog = () => {
    setConfirmDialog({
      isOpen: false,
      title: "",
      message: "",
      onConfirm: null,
    });
  };
  const closeAccessCodeDialog = () => {
    setAccessCodeDialog({
      isOpen: false,
      title: "",
      message: "",
      actionLabel: "",
      code: "",
      error: "",
      onAuthorized: null,
    });
  };
  const requestDeleteAccess = ({ title, message, actionLabel, onAuthorized }) => {
    setOpenMenuTicketNo(null);
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        closeConfirmDialog();
        setAccessCodeDialog({
          isOpen: true,
          title: "Access Code Required",
          message: `Enter access code to ${actionLabel}.`,
          actionLabel,
          code: "",
          error: "",
          onAuthorized,
        });
      },
    });
  };
  const submitDeleteAccessCode = () => {
    const verification = verifyDeleteAccess(accessCodeDialog.actionLabel, accessCodeDialog.code);
    if (!verification.ok) {
      setAccessCodeDialog((prev) => ({ ...prev, error: verification.message }));
      return;
    }
    const onAuthorized = accessCodeDialog.onAuthorized;
    closeAccessCodeDialog();
    onAuthorized?.();
  };
  const handleDeleteTicket = (ticket) => {
    if (typeof onDeleteTicket !== "function" || !ticket?.ticketNo) return;
    const ticketNo = ticket.ticketNo;
    const customerName = ticket.customerName || "Unknown customer";
    setOpenMenuTicketNo(null);
    const confirmed = typeof window !== "undefined" && typeof window.confirm === "function"
      ? window.confirm(`Delete ticket ${ticketNo} for ${customerName}?\n\nThis cannot be undone.`)
      : true;
    if (!confirmed) return;
    onDeleteTicket(ticketNo);
    setViewTicketNo((prev) => (prev === ticketNo ? null : prev));
    setEditTicketNo((prev) => (prev === ticketNo ? null : prev));
    setExpandedTickets((prev) => {
      if (!prev[ticketNo]) return prev;
      const next = { ...prev };
      delete next[ticketNo];
      return next;
    });
  };
  useEffect(() => {
    if (!openMenuTicketNo) return undefined;
    const handleOutsideClick = (event) => {
      if (overflowMenuRef.current && !overflowMenuRef.current.contains(event.target)) {
        setOpenMenuTicketNo(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [openMenuTicketNo]);

  if (true) {
    return (
      <div style={{ animation: "fadeIn 0.3s ease-out", display: "grid", gap: 12 }}>
        <div style={{ ...dashboardCard, padding: 14, display: "grid", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={{ fontSize: "0.95rem", fontWeight: 700, color: OPS.text, fontFamily: APP_FONT_STACK }}>Ticket List</div>
            <div style={{ fontSize: "0.8rem", color: OPS.textMuted, fontFamily: APP_FONT_STACK }}>
              Showing {filteredTickets.length} of {normalizedTickets.length}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={dashLabel}>Type Filter</span>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={compactInput}>
                {typeFilterOptions.map((option) => (
                  <option key={`type_filter_${option.id}`} value={option.id} style={MENU_OPTION_STYLE}>{option.label}</option>
                ))}
              </select>
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={dashLabel}>Payment Filter</span>
              <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} style={compactInput}>
                {paymentFilterOptions.map((option) => (
                  <option key={`pay_filter_${option.id}`} value={option.id} style={MENU_OPTION_STYLE}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {editTicketNo && (
          <div style={{ ...dashboardCard, padding: 14, display: "grid", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: OPS.text, fontFamily: APP_FONT_STACK }}>Edit Ticket {editTicketNo}</div>
              <button onClick={() => { setEditTicketNo(null); setEditError(""); }} style={{ ...listActionStyle, border: `1px solid ${OPS.border}`, background: OPS.surfaceMuted, color: OPS.textMuted }}>Cancel</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
              <input value={editDraft.customerName} onChange={(e) => setEditDraft((prev) => ({ ...prev, customerName: e.target.value }))} placeholder="Document Holder Name" style={compactInput} />
              <input value={editDraft.customerPhone} onChange={(e) => setEditDraft((prev) => ({ ...prev, customerPhone: e.target.value.replace(/\D/g, "").slice(0, 10) }))} placeholder="Contact Number" style={compactInput} />
              <select value={editDraft.hasReference ? "yes" : "no"} onChange={(e) => setEditDraft((prev) => ({ ...prev, hasReference: e.target.value === "yes" }))} style={compactInput}>
                <option value="no" style={MENU_OPTION_STYLE}>No Reference</option>
                <option value="yes" style={MENU_OPTION_STYLE}>With Reference</option>
              </select>
              {editDraft.hasReference && (
                <>
                  <input value={editDraft.referenceName} onChange={(e) => setEditDraft((prev) => ({ ...prev, referenceName: e.target.value }))} placeholder="Reference Name" style={compactInput} />
                  <input value={editDraft.referenceLabel} onChange={(e) => setEditDraft((prev) => ({ ...prev, referenceLabel: e.target.value }))} placeholder="Reference Label" style={compactInput} />
                </>
              )}
              <select value={editDraft.operator} onChange={(e) => setEditDraft((prev) => ({ ...prev, operator: e.target.value }))} style={compactInput}>
                {OPERATORS.map((op) => <option key={`edit_op_${op}`} value={op} style={MENU_OPTION_STYLE}>{op}</option>)}
              </select>
              <input type="number" min="0" value={editDraft.total ?? ""} onChange={(e) => setEditDraft((prev) => ({ ...prev, total: e.target.value }))} placeholder="Total amount billed" style={compactInput} />
              <input type="number" min="0" value={editDraft.cashCollected} onChange={(e) => setEditDraft((prev) => ({ ...prev, cashCollected: e.target.value }))} placeholder="Cash collected" style={compactInput} />
              <input type="number" min="0" value={editDraft.upiCollected} onChange={(e) => setEditDraft((prev) => ({ ...prev, upiCollected: e.target.value }))} placeholder="UPI collected" style={compactInput} />
              <input type="number" min="0" value={editDraft.vendorAmount ?? ""} onChange={(e) => setEditDraft((prev) => ({ ...prev, vendorAmount: e.target.value }))} placeholder="Vendor amount (our cost, optional)" style={compactInput} />
            </div>
            {editError && <div style={{ color: OPS.danger, fontSize: "0.8rem", fontFamily: APP_FONT_STACK }}>{editError}</div>}
            <button onClick={saveEdit} style={{ ...listActionStyle, background: OPS.primary, color: "#ffffff" }}>Save Changes</button>
          </div>
        )}

        <div className="csc-ticket-dashboard-grid" style={{ gap: 12, alignItems: "start" }}>
          <div style={{ ...dashboardCard, padding: 10, display: "grid", gap: 8, maxHeight: "68vh", overflowY: "auto" }}>
            {filteredTickets.length === 0 ? (
              <div className="csc-empty-state" style={{ margin: 6 }}>
                <div className="csc-empty-state-icon">TK</div>
                <div className="csc-empty-state-title">No tickets match current filters.</div>
                <div className="csc-empty-state-message">Try resetting filters, or create a new ticket from Service Entry.</div>
                <button type="button" className="csc-empty-state-cta" onClick={() => onNavigateTab?.("entry")}>
                  New Service Entry
                </button>
              </div>
            ) : (
              filteredTickets.map((ticket) => {
                const structured = ticket.structured || toStructuredTicket(ticket);
                const active = viewingTicket?.ticketNo === ticket.ticketNo;
                const paymentTone = structured.payment.status === "Paid"
                  ? STATUS_THEME.success
                  : structured.payment.status === "Partial"
                    ? STATUS_THEME.warning
                    : STATUS_THEME.danger;
                return (
                  <div key={ticket.ticketNo} style={{ border: active ? `1px solid ${OPS.primaryBorder}` : `1px solid ${OPS.borderSoft}`, background: active ? OPS.primarySoft : OPS.surface, borderRadius: 10, padding: 10, display: "grid", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <div>
                        <div style={{ fontSize: "0.72rem", color: OPS.textMuted, fontFamily: APP_MONO_STACK }}>{ticket.ticketNo}</div>
                        <div style={{ fontSize: "0.88rem", fontWeight: 600, color: OPS.text, fontFamily: APP_FONT_STACK }}>{ticket.customerName}</div>
                      </div>
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: paymentTone.text, fontFamily: APP_FONT_STACK }}>{structured.payment.status}</div>
                    </div>
                    <div style={{ fontSize: "0.76rem", color: OPS.textMuted, fontFamily: APP_FONT_STACK }}>
                      {structured.meta.primaryType || "Unassigned"}  |  Rs. {ticket.total || 0}  |  Pending Rs. {structured.payment.pendingBalance}
                    </div>
                    <div
                      ref={openMenuTicketNo === ticket.ticketNo ? overflowMenuRef : null}
                      style={{ display: "flex", gap: 6, flexWrap: "wrap", position: "relative" }}
                    >
                      <button onClick={() => { setViewTicketNo(ticket.ticketNo); setShowRawJson(false); setOpenMenuTicketNo(null); }} style={listActionStyle}>View</button>
                      <button
                        onClick={() => setOpenMenuTicketNo((prev) => (prev === ticket.ticketNo ? null : ticket.ticketNo))}
                        aria-label={`More actions for ${ticket.ticketNo}`}
                        aria-expanded={openMenuTicketNo === ticket.ticketNo}
                        style={{ ...listActionStyle, minWidth: 40, textAlign: "center", padding: "7px 12px" }}
                      >
                        ...
                      </button>
                      {openMenuTicketNo === ticket.ticketNo && (
                        <div style={overflowMenuStyle}>
                          <button onClick={() => { startEdit(ticket); setOpenMenuTicketNo(null); }} style={overflowMenuItemStyle}>Edit</button>
                          <button onClick={() => { printTicketSlip(ticket); setOpenMenuTicketNo(null); }} style={overflowMenuItemStyle}>Print</button>
                          {ticket.status === "Open" ? (
                            <button
                              onClick={() => { onToggleTicketStatus(ticket.ticketNo, "Closed"); setOpenMenuTicketNo(null); }}
                              style={{ ...overflowMenuItemStyle, border: "1px solid rgba(22,101,52,0.28)", background: "rgba(22,101,52,0.10)", color: OPS.success }}
                            >
                              Close
                            </button>
                          ) : (
                            <button
                              onClick={() => { onToggleTicketStatus(ticket.ticketNo, "Open"); setOpenMenuTicketNo(null); }}
                              style={{ ...overflowMenuItemStyle, border: "1px solid rgba(161,98,7,0.28)", background: "rgba(161,98,7,0.10)", color: OPS.warning }}
                            >
                              Reopen
                            </button>
                          )}
                          <button
                            onClick={() => { handleDeleteTicket(ticket); setOpenMenuTicketNo(null); }}
                            style={{ ...overflowMenuItemStyle, border: "1px solid rgba(220, 38, 38, 0.34)", background: "rgba(220, 38, 38, 0.10)", color: OPS.danger }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div style={{ ...dashboardCard, padding: 14 }}>
            {!viewingTicket ? (
              <div style={{ color: OPS.textMuted, fontFamily: APP_FONT_STACK, fontSize: "0.86rem" }}>Select a ticket from the left list to inspect full details.</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: "0.72rem", color: OPS.textMuted, fontFamily: APP_MONO_STACK }}>{viewingTicket.ticketNo}</div>
                    <div style={{ fontSize: "1rem", fontWeight: 700, color: OPS.text, fontFamily: APP_FONT_STACK }}>{viewingTicket.customerName}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button onClick={() => setShowRawJson((prev) => !prev)} style={listActionStyle}>{showRawJson ? "Hide JSON" : "Show JSON"}</button>
                    <button onClick={() => handleDeleteTicket(viewingTicket)} style={dangerActionStyle}>Delete Ticket</button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
                  <div style={{ ...dashboardCard, padding: 10 }}>
                    <div style={dashLabel}>Document Holder</div>
                    <div style={{ fontSize: "0.84rem", color: OPS.text, fontFamily: APP_FONT_STACK, fontWeight: 600 }}>{viewingStructured.parties.documentHolder.name}</div>
                    <div style={{ fontSize: "0.74rem", color: OPS.textMuted, fontFamily: APP_FONT_STACK }}>{viewingStructured.parties.documentHolder.phone || "No contact saved"}</div>
                  </div>
                  <div style={{ ...dashboardCard, padding: 10 }}>
                    <div style={dashLabel}>Reference</div>
                    <div style={{ fontSize: "0.84rem", color: OPS.text, fontFamily: APP_FONT_STACK, fontWeight: 600 }}>{viewingStructured.parties.reference.hasReference ? viewingStructured.parties.reference.name : "No reference"}</div>
                    <div style={{ fontSize: "0.74rem", color: OPS.textMuted, fontFamily: APP_FONT_STACK }}>{viewingStructured.parties.reference.label || " - "}</div>
                  </div>
                  <div style={{ ...dashboardCard, padding: 10 }}>
                    <div style={dashLabel}>Payment</div>
                    <div style={{ fontSize: "0.84rem", color: OPS.text, fontFamily: APP_FONT_STACK, fontWeight: 600 }}>{viewingStructured.payment.status}</div>
                    <div style={{ fontSize: "0.74rem", color: OPS.textMuted, fontFamily: APP_FONT_STACK }}>Paid Rs. {viewingStructured.payment.paidTotal}  |  Pending Rs. {viewingStructured.payment.pendingBalance}</div>
                  </div>
                </div>

                <div style={{ ...dashboardCard, padding: 10 }}>
                  <div style={{ fontSize: "0.78rem", color: OPS.textMuted, fontFamily: APP_FONT_STACK, fontWeight: 600, marginBottom: 6 }}>Services</div>
                  {viewingStructured.services.length === 0 ? (
                    <div style={{ color: OPS.textMuted, fontFamily: APP_FONT_STACK, fontSize: "0.82rem" }}>No services in this ticket.</div>
                  ) : (
                    <div style={{ display: "grid", gap: 6 }}>
                      {viewingStructured.services.map((item, index) => (
                        <label key={`ticket_service_${index}`} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", alignItems: "center", gap: 8, paddingBottom: 6, borderBottom: index < viewingStructured.services.length - 1 ? `1px solid ${OPS.borderSoft}` : "none" }}>
                          <span style={{ fontSize: "0.84rem", color: OPS.text, fontFamily: APP_FONT_STACK }}>{item.name}</span>
                          <span style={{ fontSize: "0.74rem", color: OPS.textMuted, fontFamily: APP_FONT_STACK }}>{getQuantityModeConfig(item.quantityMode).label} {item.qty}</span>
                          <input type="checkbox" checked={Boolean(item.done)} onChange={() => onToggleTaskDone(viewingTicket.ticketNo, index)} />
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ ...dashboardCard, padding: 10 }}>
                  <div style={{ fontSize: "0.78rem", color: OPS.textMuted, fontFamily: APP_FONT_STACK, fontWeight: 600, marginBottom: 6 }}>Documents</div>
                  {viewingStructured.documents.items.length === 0 ? (
                    <div style={{ color: OPS.textMuted, fontFamily: APP_FONT_STACK, fontSize: "0.82rem" }}>No document checklist added.</div>
                  ) : (
                    <div style={{ display: "grid", gap: 6 }}>
                      {viewingStructured.documents.items.map((doc, index) => (
                        <div key={`ticket_doc_${index}`} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: OPS.text, fontFamily: APP_FONT_STACK }}>
                          <span>{doc.name}</span>
                          <span style={{ color: OPS.textMuted }}>{doc.required ? "Required" : "Optional"}  |  {doc.submitted ? "Submitted" : "Pending"}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {showRawJson && (
                  <pre style={{ margin: 0, background: "#0f172a", borderRadius: 10, color: "#e2e8f0", padding: 12, fontSize: "0.72rem", overflowX: "auto", fontFamily: APP_MONO_STACK }}>
{JSON.stringify(viewingStructured, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      {viewingTicket && (
        <div style={{ background: "rgba(255,255,255,0.80)", border: "1px solid rgba(15,23,42,0.12)", borderRadius: 18, padding: 20, marginBottom: 18, boxShadow: "0 16px 40px rgba(15,23,42,0.09)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
            <div>
              <div style={dashEyebrowStyle}>Ticket View</div>
              <div style={{ fontFamily: APP_SERIF_STACK, fontSize: "1.2rem", fontWeight: 300, color: "#0f172a" }}>{viewingTicket.ticketNo}  -  {viewingTicket.customerName}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => printTicketSlip(viewingTicket)} style={actionButtonStyles.print}>Print Ticket</button>
              <button onClick={() => setShowRawJson((prev) => !prev)} style={actionButtonStyles.raw}>{showRawJson ? "Hide JSON" : "Show JSON"}</button>
              <button onClick={() => { setViewTicketNo(null); setShowRawJson(false); }} style={actionButtonStyles.closeView}>Close</button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 8 }}>
            <div style={detailCardStyle}>
              <div style={dashEyebrowStyle}>Document Holder</div>
              <div style={{ color: "#0f172a", fontWeight: 700, fontSize: "0.88rem", fontFamily: APP_FONT_STACK }}>{viewingStructured.parties.documentHolder.name}</div>
              <div style={{ color: "rgba(15,23,42,0.55)", fontSize: "0.76rem", fontFamily: APP_FONT_STACK }}>{viewingStructured.parties.documentHolder.phone || "No contact saved"}</div>
            </div>
            <div style={detailCardStyle}>
              <div style={dashEyebrowStyle}>Reference Contact</div>
              <div style={{ color: "#0f172a", fontWeight: 700, fontSize: "0.88rem", fontFamily: APP_FONT_STACK }}>
                {viewingStructured.parties.reference.hasReference ? viewingStructured.parties.reference.name : "No reference"}
              </div>
              <div style={{ color: "rgba(15,23,42,0.55)", fontSize: "0.76rem", fontFamily: APP_FONT_STACK }}>
                {viewingStructured.parties.reference.hasReference ? (viewingStructured.parties.reference.label || "No label") : "Optional"}
              </div>
            </div>
            <div style={detailCardStyle}>
              <div style={dashEyebrowStyle}>Meta</div>
              <div style={{ color: "#0f172a", fontSize: "0.82rem", fontFamily: APP_FONT_STACK }}>Status: {viewingStructured.meta.status}</div>
              <div style={{ color: "rgba(15,23,42,0.55)", fontSize: "0.76rem", fontFamily: APP_FONT_STACK }}>Created: {viewingStructured.meta.createdDate} {viewingStructured.meta.createdTime}</div>
              <div style={{ color: "rgba(15,23,42,0.55)", fontSize: "0.76rem", fontFamily: APP_FONT_STACK }}>Updated: {viewingStructured.meta.updatedAt || "N/A"}</div>
            </div>
            <div style={detailCardStyle}>
              <div style={dashEyebrowStyle}>Payment</div>
              <div style={{ color: "#0f172a", fontSize: "0.82rem", fontFamily: APP_FONT_STACK }}>Operator: {viewingStructured.assignment.operator || "N/A"}</div>
              <div style={{ color: "rgba(15,23,42,0.55)", fontSize: "0.76rem", fontFamily: APP_FONT_STACK }}>Mode: {viewingStructured.payment.mode} | Status: {viewingStructured.payment.status}</div>
              <div style={{ color: "rgba(15,23,42,0.55)", fontSize: "0.76rem", fontFamily: APP_FONT_STACK }}>Paid Rs. {viewingStructured.payment.paidTotal} | Pending Rs. {viewingStructured.payment.pendingBalance}</div>
            </div>
          </div>

          <div style={{ ...sectionCardStyle, marginTop: 10 }}>
            <div style={dashEyebrowStyle}>Services</div>
            {viewingStructured.services.length === 0 ? (
              <div style={{ color: "rgba(15,23,42,0.50)", fontSize: "0.82rem", fontFamily: APP_FONT_STACK }}>No services linked to this ticket.</div>
            ) : (
              <div style={{ display: "grid", gap: 5 }}>
                {viewingStructured.services.map((it, idx) => (
                  <div key={`view_${viewingTicket.ticketNo}_${idx}`} style={{ color: "#0f172a", fontSize: "0.82rem", paddingBottom: 5, borderBottom: idx < viewingStructured.services.length - 1 ? "1px solid rgba(15,23,42,0.08)" : "none", fontFamily: APP_FONT_STACK }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <span>{it.name}</span>
                      <span style={{ color: "rgba(15,23,42,0.55)" }}>{getQuantityModeConfig(it.quantityMode).inputLabel} {it.qty} | Rs. {it.amount}</span>
                    </div>
                    {!!it.detailSummary && (
                      <div style={{ color: "rgba(15,23,42,0.45)", marginTop: 3, lineHeight: 1.5, fontSize: "0.76rem" }}>{it.detailSummary}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ ...sectionCardStyle, marginTop: 8 }}>
            <div style={dashEyebrowStyle}>Document Status</div>
            {viewingStructured.documents.items.length === 0 ? (
              <div style={{ color: "rgba(15,23,42,0.50)", fontSize: "0.82rem", fontFamily: APP_FONT_STACK }}>No document checklist added.</div>
            ) : (
              <div style={{ display: "grid", gap: 5 }}>
                {viewingStructured.documents.items.map((doc, idx) => (
                  <div key={`view_doc_${idx}`} style={{ display: "flex", justifyContent: "space-between", color: "#0f172a", fontSize: "0.82rem", paddingBottom: 5, borderBottom: idx < viewingStructured.documents.items.length - 1 ? "1px solid rgba(15,23,42,0.08)" : "none", fontFamily: APP_FONT_STACK }}>
                    <span>{doc.name}</span>
                    <span style={{ color: "rgba(15,23,42,0.55)" }}>{doc.required ? "Required" : "Optional"} | {doc.submitted ? "Submitted" : "Pending"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {showRawJson && (
            <pre style={{ margin: "10px 0 0", background: "#0f172a", border: "1px solid rgba(15,23,42,0.20)", borderRadius: 10, padding: 14, color: "#f1f5f9", fontSize: "0.7rem", overflowX: "auto", fontFamily: APP_MONO_STACK }}>
{JSON.stringify(viewingStructured, null, 2)}
            </pre>
          )}
        </div>
      )}

      {editTicketNo && (
        <div style={{ background: "rgba(255,255,255,0.78)", border: "1px solid rgba(15,23,42,0.12)", borderRadius: 14, padding: 16, marginBottom: 14 }}>
          <div style={dashEyebrowStyle}>Edit Ticket</div>
          <div style={{ fontFamily: APP_SERIF_STACK, fontSize: "1.1rem", fontWeight: 300, color: "#0f172a", marginBottom: 12 }}>{editTicketNo}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
            <input value={editDraft.customerName} onChange={(e) => setEditDraft((prev) => ({ ...prev, customerName: e.target.value }))} placeholder="Document Holder Name" style={dashInputStyle} />
            <input value={editDraft.customerPhone} onChange={(e) => setEditDraft((prev) => ({ ...prev, customerPhone: e.target.value.replace(/\D/g, "").slice(0, 10) }))} placeholder="Contact Number" style={dashInputStyle} />
            <select value={editDraft.hasReference ? "yes" : "no"} onChange={(e) => setEditDraft((prev) => ({ ...prev, hasReference: e.target.value === "yes" }))} style={dashInputStyle}>
              <option value="no" style={MENU_OPTION_STYLE}>No Reference</option>
              <option value="yes" style={MENU_OPTION_STYLE}>Add Reference</option>
            </select>
            {editDraft.hasReference && (
              <>
                <input value={editDraft.referenceName} onChange={(e) => setEditDraft((prev) => ({ ...prev, referenceName: e.target.value }))} placeholder="Reference Name" style={dashInputStyle} />
                <input value={editDraft.referenceLabel} onChange={(e) => setEditDraft((prev) => ({ ...prev, referenceLabel: e.target.value }))} placeholder="Reference Label (optional)" style={dashInputStyle} />
              </>
            )}
            <select value={editDraft.operator} onChange={(e) => setEditDraft((prev) => ({ ...prev, operator: e.target.value }))} style={dashInputStyle}>
              {OPERATORS.map((op) => <option key={`editop_${op}`} value={op} style={MENU_OPTION_STYLE}>{op}</option>)}
            </select>
            <input type="number" min="0" value={editDraft.total ?? ""} onChange={(e) => setEditDraft((prev) => ({ ...prev, total: e.target.value }))} placeholder="Total amount billed" style={dashInputStyle} />
            <input type="number" min="0" value={editDraft.cashCollected} onChange={(e) => setEditDraft((prev) => ({ ...prev, cashCollected: e.target.value }))} placeholder="Cash collected" style={dashInputStyle} />
            <input type="number" min="0" value={editDraft.upiCollected} onChange={(e) => setEditDraft((prev) => ({ ...prev, upiCollected: e.target.value }))} placeholder="UPI collected" style={dashInputStyle} />
            <input type="number" min="0" value={editDraft.vendorAmount ?? ""} onChange={(e) => setEditDraft((prev) => ({ ...prev, vendorAmount: e.target.value }))} placeholder="Vendor amount (our cost, optional)" style={dashInputStyle} />
          </div>
          <div style={{ marginTop: 8, fontSize: "0.78rem", color: "rgba(15,23,42,0.55)", fontFamily: APP_FONT_STACK }}>
            Ticket total Rs. {Number(editDraft.total) || 0} | Collected Rs. {(Number(editDraft.cashCollected) || 0) + (Number(editDraft.upiCollected) || 0)} | Pending Rs. {Math.max((Number(editDraft.total) || 0) - ((Number(editDraft.cashCollected) || 0) + (Number(editDraft.upiCollected) || 0)), 0)}
          </div>
          {editError && <div style={{ marginTop: 8, color: "#FCA5A5", fontSize: 12 }}>{editError}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button onClick={saveEdit} style={{ ...actionButtonStyles.print }}>Save Changes</button>
            <button onClick={() => { setEditTicketNo(null); setEditError(""); }} style={{ ...actionButtonStyles.closeView }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ background: "rgba(255,255,255,0.72)", border: "1px solid rgba(15,23,42,0.10)", borderRadius: 14, padding: 14, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 12 }}>
          <div>
            <div style={dashEyebrowStyle}>Filters</div>
            <div style={{ fontFamily: APP_SERIF_STACK, fontSize: "1.1rem", fontWeight: 300, color: "#0f172a", marginBottom: 5 }}>Type and Payment Status</div>
            <div style={{ fontSize: "0.80rem", color: "rgba(15,23,42,0.55)", lineHeight: 1.55 }}>
              Filter tickets by reference state, service type, or payment status without leaving the dashboard.
            </div>
          </div>
          <div style={{ fontSize: "0.80rem", color: "rgba(15,23,42,0.55)", fontFamily: APP_FONT_STACK, fontWeight: 600 }}>
            Showing {filteredTickets.length} of {normalizedTickets.length} tickets
            <div style={{ marginTop: 3, fontSize: "0.72rem", color: "rgba(15,23,42,0.40)", fontFamily: APP_FONT_STACK }}>
              Active: {activeTypeFilterLabel} | {activePaymentFilterLabel}
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {typeFilterOptions.map((option) => {
              const active = typeFilter === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => setTypeFilter(option.id)}
                  style={{
                    padding: "7px 12px",
                    borderRadius: 999,
                    border: active ? "1px solid rgba(37,99,235,0.35)" : "1px solid rgba(15,23,42,0.10)",
                    background: active ? "rgba(37,99,235,0.09)" : "rgba(255,255,255,0.65)",
                    color: active ? DS.wine : "rgba(15,23,42,0.65)",
                    cursor: "pointer",
                    fontSize: "0.72rem",
                    fontFamily: APP_BRAND_STACK,
                    fontWeight: 700,
                    letterSpacing: "0.10em",
                    textTransform: "uppercase",
                    transition: "all 0.18s ease",
                    transform: active ? "translateY(-1px)" : "translateY(0)",
                  }}
                >
                  {option.label} ({getTypeFilterCount(option.id)})
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {paymentFilterOptions.map((option) => {
              const active = paymentFilter === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => setPaymentFilter(option.id)}
                  style={{
                    padding: "7px 12px",
                    borderRadius: 999,
                    border: active ? "1px solid rgba(59,130,246,0.38)" : "1px solid rgba(15,23,42,0.10)",
                    background: active ? "rgba(59,130,246,0.10)" : "rgba(255,255,255,0.65)",
                    color: active ? "#1d4ed8" : "rgba(15,23,42,0.65)",
                    cursor: "pointer",
                    fontSize: "0.72rem",
                    fontFamily: APP_BRAND_STACK,
                    fontWeight: 700,
                    letterSpacing: "0.10em",
                    textTransform: "uppercase",
                    transition: "all 0.18s ease",
                    transform: active ? "translateY(-1px)" : "translateY(0)",
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Visible", value: filteredTickets.length, color: "#0f172a" },
          { label: "Open", value: openTickets.length, color: "#1d4ed8" },
          { label: "Closed", value: closedTickets.length, color: DS.wine },
          { label: "Task Progress", value: `${doneTasks}/${totalTasks || 0}`, color: "#2a5a8f" },
        ].map((stat) => (
          <div key={stat.label} style={{ background: "rgba(255,255,255,0.72)", border: "1px solid rgba(15,23,42,0.09)", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: "0.58rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(15,23,42,0.42)", marginBottom: 4 }}>{stat.label}</div>
            <div style={{ fontFamily: APP_SERIF_STACK, fontSize: "1.6rem", fontWeight: 300, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: "0.58rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: DS.wine, marginBottom: 8 }}>Open Tickets</div>
      {openTickets.length === 0 ? (
        <div style={{ background: "rgba(255,255,255,0.65)", border: "1px dashed rgba(15,23,42,0.14)", borderRadius: 10, padding: 14, color: "rgba(15,23,42,0.45)", fontSize: "0.84rem", fontFamily: APP_FONT_STACK }}>No open tickets.</div>
      ) : (
        <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
          {openTickets.map((t) => (
            <div key={t.ticketNo} style={{ background: "rgba(255,255,255,0.72)", border: "1px solid rgba(15,23,42,0.10)", borderRadius: 12, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontFamily: APP_MONO_STACK, fontSize: "0.72rem", color: "rgba(15,23,42,0.45)", marginBottom: 2 }}>{t.ticketNo}</div>
                  <div style={{ color: "#0f172a", fontWeight: 700, fontSize: "0.92rem", fontFamily: APP_FONT_STACK }}>{t.customerName}</div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button onClick={() => printTicketSlip(t)} style={actionButtonStyles.print}>Print</button>
                  <button onClick={() => { setViewTicketNo(t.ticketNo); setShowRawJson(false); }} style={actionButtonStyles.view}>View</button>
                  <button onClick={() => startEdit(t)} style={actionButtonStyles.edit}>Edit</button>
                  <button onClick={() => toggleExpand(t.ticketNo)} style={actionButtonStyles.neutral}>{expandedTickets[t.ticketNo] ? "Collapse" : "Expand"}</button>
                  <button onClick={() => onToggleTicketStatus(t.ticketNo, "Closed")} style={actionButtonStyles.success}>Close</button>
                </div>
              </div>
              {t.items.map((it, idx) => (
                <label key={`${t.ticketNo}_${idx}`} style={{ display: "flex", alignItems: "center", gap: 8, color: "#0f172a", padding: "5px 0", borderBottom: idx < t.items.length - 1 ? "1px solid rgba(15,23,42,0.07)" : "none", cursor: "pointer" }}>
                  <input type="checkbox" checked={!!it.done} onChange={() => onToggleTaskDone(t.ticketNo, idx)} />
                  <span style={{ flex: 1, textDecoration: it.done ? "line-through" : "none", fontSize: "0.84rem", fontFamily: APP_FONT_STACK, color: it.done ? "rgba(15,23,42,0.40)" : "#0f172a" }}>
                    {it.name}
                    {!!it.detailSummary && <span style={{ display: "block", color: "rgba(15,23,42,0.50)", fontSize: "0.72rem", lineHeight: 1.45, marginTop: 2 }}>{it.detailSummary}</span>}
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "rgba(15,23,42,0.50)", fontFamily: APP_FONT_STACK }}>{getQuantityModeConfig(it.quantityMode).label} {it.qty}</span>
                </label>
              ))}
              <div style={{ marginTop: 8, fontSize: "0.74rem", color: "rgba(15,23,42,0.50)", fontFamily: APP_FONT_STACK }}>
                Type: {t.structured?.meta?.primaryType || "Unassigned"} | Payment: {t.paymentStatus || t.structured?.payment?.status || "Unpaid"} | Pending Rs. {t.pendingBalance ?? t.structured?.payment?.pendingBalance ?? 0} | Docs: {t.structured?.documents?.submitted?.length || 0}/{t.structured?.documents?.required?.length || 0} required submitted
              </div>
              {expandedTickets[t.ticketNo] && renderExpandedContent(t)}
            </div>
          ))}
        </div>
      )}

      <div style={{ fontSize: "0.58rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(15,23,42,0.45)", marginBottom: 8 }}>Closed Tickets</div>
      {closedTickets.length === 0 ? (
        <div style={{ background: "rgba(255,255,255,0.65)", border: "1px dashed rgba(15,23,42,0.14)", borderRadius: 10, padding: 14, color: "rgba(15,23,42,0.45)", fontSize: "0.84rem", fontFamily: APP_FONT_STACK }}>No closed tickets yet.</div>
      ) : (
        <div style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(15,23,42,0.09)", borderRadius: 12, overflow: "hidden" }}>
          {[...closedTickets].reverse().map((t, idx) => (
            <div key={t.ticketNo} style={{ padding: "11px 14px", borderBottom: idx < closedTickets.length - 1 ? "1px solid rgba(15,23,42,0.07)" : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <div style={{ color: "#0f172a", fontSize: "0.84rem", fontFamily: APP_FONT_STACK }}><span style={{ fontFamily: APP_MONO_STACK, fontSize: "0.70rem", color: "rgba(15,23,42,0.40)" }}>{t.ticketNo}</span> {t.customerName}  |  {t.structured?.meta?.primaryType || "Unassigned"}  |  Rs. {t.total}  |  {t.paymentStatus || t.structured?.payment?.status || "Unpaid"}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button onClick={() => printTicketSlip(t)} style={actionButtonStyles.print}>Print</button>
                  <button onClick={() => { setViewTicketNo(t.ticketNo); setShowRawJson(false); }} style={actionButtonStyles.view}>View</button>
                  <button onClick={() => startEdit(t)} style={actionButtonStyles.edit}>Edit</button>
                  <button onClick={() => toggleExpand(t.ticketNo)} style={actionButtonStyles.neutral}>{expandedTickets[t.ticketNo] ? "Collapse" : "Expand"}</button>
                  <button onClick={() => onToggleTicketStatus(t.ticketNo, "Open")} style={actionButtonStyles.warning}>Reopen</button>
                </div>
              </div>
              {expandedTickets[t.ticketNo] && renderExpandedContent(t)}
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onCancel={closeConfirmDialog}
        onConfirm={() => confirmDialog.onConfirm?.()}
        confirmLabel="Continue"
      />
      <AccessCodeDialog
        isOpen={accessCodeDialog.isOpen}
        title={accessCodeDialog.title}
        message={accessCodeDialog.message}
        code={accessCodeDialog.code}
        error={accessCodeDialog.error}
        onCodeChange={(nextCode) => setAccessCodeDialog((prev) => ({ ...prev, code: nextCode, error: "" }))}
        onCancel={closeAccessCodeDialog}
        onConfirm={submitDeleteAccessCode}
      />
    </div>
  );
}

// --- B2B TAB ---
function B2BWorkspace({ ledger = [], onAddLedgerEntry, onDeleteLedgerEntry }) {
  const [activeTrack, setActiveTrack] = useState("take");
  const [activeEntityKeys, setActiveEntityKeys] = useState({ take: "", give: "", agent: "" });
  const [entryForms, setEntryForms] = useState({
    take: createB2BEntryForm("take"),
    give: createB2BEntryForm("give"),
    agent: createB2BEntryForm("agent"),
  });
  const [formError, setFormError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: "", message: "", onConfirm: null });
  const [accessCodeDialog, setAccessCodeDialog] = useState({ isOpen: false, title: "", message: "", actionLabel: "", code: "", error: "", onAuthorized: null });
  const b2bFormRef = useRef(null);
  const normalizedLedger = useMemo(() => hydrateB2BLedger(ledger), [ledger]);
  const todayKey = getTicketCounterDateKey(new Date());
  const formatCurrency = (value) => `Rs. ${Math.round(Number(value) || 0).toLocaleString("en-IN")}`;
  const formatEntryDate = (value) => {
    const parsed = new Date(`${String(value || "").trim()}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return value || "N/A";
    return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };
  const getTrackFlow = (trackId) => (trackId === "give" ? "us_to_vendor" : "vendor_to_us");
  const getRoleHeading = (roleId) => (
    roleId === "take"
      ? "Services We Take From Them"
      : roleId === "give"
        ? "Services We Give To Them"
        : "Agent Referrals"
  );

  const entityDirectory = useMemo(() => {
    const entityMap = new Map();

    const ensureEntity = ({ id, name, key }) => {
      const resolvedName = String(name || "Unnamed Partner").trim() || "Unnamed Partner";
      const resolvedKey = String(key || id || normalizeEntityKey(resolvedName)).trim() || normalizeEntityKey(resolvedName);
      if (!entityMap.has(resolvedKey)) {
        entityMap.set(resolvedKey, {
          id: String(id || resolvedKey),
          key: resolvedKey,
          name: resolvedName,
          roles: [],
          servicesByRole: { take: [], give: [], agent: [] },
        });
      }
      return entityMap.get(resolvedKey);
    };

    const appendServiceGroup = (entity, roleId, label, items) => {
      const groupLabel = String(label || "Services").trim() || "Services";
      const normalizedItems = dedupeB2BItems(Array.isArray(items) ? items : [items]);
      if (normalizedItems.length === 0) return;
      const existingGroup = entity.servicesByRole[roleId].find((group) => normalizeEntityKey(group.label) === normalizeEntityKey(groupLabel));
      if (existingGroup) {
        existingGroup.items = dedupeB2BItems([...existingGroup.items, ...normalizedItems]);
        return;
      }
      entity.servicesByRole[roleId].push({ label: groupLabel, items: normalizedItems });
    };

    [...B2B_PARTNER_SEED, ...B2B_AGENT_SEED].forEach((seed) => {
      const entity = ensureEntity({ id: seed.id, name: seed.name, key: seed.id || normalizeEntityKey(seed.name) });
      (seed.roles || []).forEach((roleId) => {
        if (!entity.roles.includes(roleId)) entity.roles.push(roleId);
      });
      Object.entries(seed.servicesByRole || {}).forEach(([roleId, groups]) => {
        (groups || []).forEach((group) => appendServiceGroup(entity, roleId, group.label, group.items || []));
      });
    });

    normalizedLedger.forEach((entry) => {
      const entity = ensureEntity({ id: entry.partnerId || entry.partnerKey, name: entry.partnerName, key: entry.partnerId || entry.partnerKey });
      if (!entity.roles.includes(entry.ecosystem)) entity.roles.push(entry.ecosystem);
      if (entry.serviceName) {
        appendServiceGroup(
          entity,
          entry.ecosystem,
          entry.ecosystem === "take"
            ? "Services We Take"
            : entry.ecosystem === "give"
              ? "Services We Give"
              : "Referred Services",
          [entry.serviceName]
        );
      }
    });

    return Array.from(entityMap.values())
      .map((entity) => ({
        ...entity,
        roles: [...entity.roles].sort((a, b) => B2B_TRACKS.findIndex((track) => track.id === a) - B2B_TRACKS.findIndex((track) => track.id === b)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [normalizedLedger]);

  const entitiesByTrack = useMemo(() => {
    const next = { take: [], give: [], agent: [] };
    entityDirectory.forEach((entity) => {
      entity.roles.forEach((roleId) => {
        const entries = normalizedLedger
          .filter((entry) => (
            entry.ecosystem === roleId
            && (
              entry.partnerKey === entity.key
              || normalizeEntityKey(entry.partnerName) === normalizeEntityKey(entity.name)
              || (entity.id && entry.partnerId === entity.id)
            )
          ))
          .sort((a, b) => {
            const byDate = String(b.entryDate || "").localeCompare(String(a.entryDate || ""));
            if (byDate !== 0) return byDate;
            return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
          });

        const amountValue = roleId === "agent"
          ? entries.reduce((sum, entry) => sum + (Number(entry.businessAmount) || 0), 0)
          : entries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);

        next[roleId].push({
          ...entity,
          ecosystem: roleId,
          entries,
          amountValue,
          settledValue: entries.reduce((sum, entry) => sum + (Number(entry.paidAmount) || 0), 0),
          pendingValue: entries.reduce((sum, entry) => sum + (Number(entry.pendingAmount) || 0), 0),
          serviceNames: dedupeB2BItems([
            ...entity.servicesByRole[roleId].flatMap((group) => group.items || []),
            ...entries.map((entry) => entry.serviceName).filter(Boolean),
          ]),
          referredClients: dedupeB2BItems(entries.map((entry) => entry.referredClient).filter(Boolean)),
          latestEntry: entries[0] || null,
        });
      });
    });

    Object.keys(next).forEach((roleId) => {
      next[roleId].sort((a, b) => {
        if (b.pendingValue !== a.pendingValue) return b.pendingValue - a.pendingValue;
        if (b.amountValue !== a.amountValue) return b.amountValue - a.amountValue;
        return a.name.localeCompare(b.name);
      });
    });

    return next;
  }, [entityDirectory, normalizedLedger]);

  const trackEntities = entitiesByTrack[activeTrack] || [];
  const activeEntity = trackEntities.find((entity) => entity.key === activeEntityKeys[activeTrack]) || trackEntities[0] || null;
  const activeForm = entryForms[activeTrack];
  const matchingFormEntity = trackEntities.find((entity) => normalizeEntityKey(entity.name) === normalizeEntityKey(activeForm.partnerName));
  const serviceSuggestions = matchingFormEntity
    ? dedupeB2BItems(matchingFormEntity.servicesByRole[activeTrack].flatMap((group) => group.items || []))
    : [];
  const amountPreview = Math.max(1, Number(activeForm.quantity) || 1) * Math.max(0, Number(activeForm.rate) || 0);
  const settledPreview = Math.max(0, Math.min(amountPreview, Number(activeForm.settledAmount) || 0));
  const pendingPreview = Math.max(0, amountPreview - settledPreview);
  const serviceListId = `b2b_service_options_${activeTrack}_${matchingFormEntity?.key || "custom"}`;
  const partnerListId = `b2b_partner_options_${activeTrack}`;
  const trackMeta = B2B_TRACK_META[activeTrack];
  const trackTotals = trackEntities.reduce((acc, entity) => {
    acc.amount += Number(entity.amountValue) || 0;
    acc.settled += Number(entity.settledValue) || 0;
    acc.pending += Number(entity.pendingValue) || 0;
    return acc;
  }, { amount: 0, settled: 0, pending: 0 });

  useEffect(() => {
    if (trackEntities.length === 0) return;
    if (trackEntities.some((entity) => entity.key === activeEntityKeys[activeTrack])) return;
    setActiveEntityKeys((prev) => ({ ...prev, [activeTrack]: trackEntities[0].key }));
  }, [activeTrack, activeEntityKeys, trackEntities]);

  useEffect(() => {
    if (!activeEntity || String(activeForm.partnerName || "").trim()) return;
    setEntryForms((prev) => ({
      ...prev,
      [activeTrack]: {
        ...prev[activeTrack],
        partnerName: activeEntity.name,
      },
    }));
  }, [activeTrack, activeEntity, activeForm.partnerName]);

  const updateActiveForm = (field, value) => {
    setFormError("");
    setEntryForms((prev) => ({
      ...prev,
      [activeTrack]: {
        ...prev[activeTrack],
        [field]: value,
      },
    }));
  };

  const selectEntity = (entity) => {
    setActiveEntityKeys((prev) => ({ ...prev, [activeTrack]: entity.key }));
    setEntryForms((prev) => ({
      ...prev,
      [activeTrack]: {
        ...prev[activeTrack],
        partnerName: entity.name,
        serviceName: prev[activeTrack].serviceName || (entity.servicesByRole[activeTrack][0]?.items?.[0] || ""),
      },
    }));
  };

  const handleAddEntry = () => {
    const partnerName = String(activeForm.partnerName || "").trim();
    const serviceName = String(activeForm.serviceName || "").trim();
    const referredClient = String(activeForm.referredClient || "").trim();
    const qtyNum = Math.max(1, Number(activeForm.quantity) || 1);
    const rateNum = Math.max(0, Number(activeForm.rate) || 0);
    const amount = qtyNum * rateNum;
    const settledAmount = Math.max(0, Math.min(amount, Number(activeForm.settledAmount) || 0));
    const normalizedEntryDate = toIsoDateKey(activeForm.entryDate) || todayKey;
    const selectedEntity = entityDirectory.find((entity) => normalizeEntityKey(entity.name) === normalizeEntityKey(partnerName));
    const generatedPartnerId = selectedEntity?.id || `partner_${normalizeEntityKey(partnerName).replace(/\s+/g, "_") || Date.now()}`;

    if (!partnerName) {
      setFormError(activeTrack === "agent" ? "Agent name is required." : "Vendor name is required.");
      return;
    }
    if (activeTrack !== "agent" && !serviceName) {
      setFormError("Service name is required.");
      return;
    }
    if (activeTrack === "agent" && !referredClient) {
      setFormError("Client referred is required.");
      return;
    }
    if (rateNum <= 0) {
      setFormError(`${trackMeta.rateFieldLabel} must be greater than zero.`);
      return;
    }

    setFormError("");
    onAddLedgerEntry?.({
      id: `b2b_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      ecosystem: activeTrack,
      partnerId: generatedPartnerId,
      partnerName,
      vendorId: generatedPartnerId,
      vendorName: partnerName,
      flow: getTrackFlow(activeTrack),
      serviceName,
      quantity: qtyNum,
      rate: rateNum,
      amount,
      paidAmount: settledAmount,
      paymentMode: activeForm.paymentMode,
      entryDate: normalizedEntryDate,
      note: String(activeForm.note || "").trim(),
      includeInDailyRevenue: activeTrack === "give" ? Boolean(activeForm.includeInDailyRevenue) : false,
      businessAmount: activeTrack === "agent" ? Math.max(0, Number(activeForm.businessAmount) || 0) : 0,
      referredClient: activeTrack === "agent" ? referredClient : "",
      createdAt: new Date().toISOString(),
    });

    setEntryForms((prev) => ({
      ...prev,
      [activeTrack]: {
        ...createB2BEntryForm(activeTrack),
        partnerName,
        paymentMode: prev[activeTrack].paymentMode || "UPI",
        includeInDailyRevenue: activeTrack === "give" ? Boolean(prev[activeTrack].includeInDailyRevenue) : false,
      },
    }));
  };

  const handleDeleteEntry = (entry) => {
    if (!entry?.id || typeof onDeleteLedgerEntry !== "function") return;
    const targetTrackMeta = B2B_TRACK_META[entry.ecosystem] || trackMeta;
    setConfirmDialog({
      isOpen: true,
      title: `Delete ${targetTrackMeta.submitLabel}`,
      message: `Delete this ${entry.ecosystem === "agent" ? "agent" : "vendor"} entry for ${entry.partnerName || entry.serviceName}? This cannot be undone.`,
      onConfirm: () => {
        setConfirmDialog({ isOpen: false, title: "", message: "", onConfirm: null });
        setAccessCodeDialog({
          isOpen: true,
          title: "Access Code Required",
          message: `Enter access code to delete B2B entry ${entry.id}.`,
          actionLabel: `delete B2B entry ${entry.id}`,
          code: "",
          error: "",
          onAuthorized: () => onDeleteLedgerEntry(entry.id),
        });
      },
    });
  };

  const eb = { fontSize: "0.56rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(15,23,42,0.46)", fontFamily: APP_BRAND_STACK };
  const fmtMoneyCompact = (v) => {
    const n = Math.round(Number(v) || 0);
    return n === 0 ? "—" : `Rs. ${n.toLocaleString("en-IN")}`;
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out", maxWidth: 1140, margin: "0 auto", display: "grid", gap: 12 }}>
      {/* Compact header: title + tabs + inline stats + add button */}
      <div style={{ borderRadius: 14, border: "1px solid rgba(15,23,42,0.10)", background: "rgba(255,255,255,0.92)", padding: "12px 16px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <div style={{ fontFamily: APP_FONT_STACK, fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>
              Vendor Dashboard
            </div>
            <div style={{ fontSize: "0.72rem", color: "rgba(15,23,42,0.50)", fontFamily: APP_FONT_STACK }}>
              {trackEntities.length} {activeTrack === "agent" ? "agents" : "vendors"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {B2B_TRACKS.map((track) => {
              const active = track.id === activeTrack;
              return (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => { setActiveTrack(track.id); setFormError(""); }}
                  style={{
                    borderRadius: 8,
                    border: active ? "1px solid rgba(30,64,175,0.28)" : "1px solid rgba(15,23,42,0.10)",
                    background: active ? "rgba(30,64,175,0.10)" : "transparent",
                    color: active ? "#1d4ed8" : "rgba(15,23,42,0.62)",
                    padding: "6px 11px",
                    fontFamily: APP_FONT_STACK,
                    fontSize: "0.74rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {track.label}
                </button>
              );
            })}
          </div>
        </div>
        {/* Inline stat strip */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 18, marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(15,23,42,0.06)", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={eb}>{trackMeta.amountLabel}</span>
            <span style={{ fontFamily: APP_FONT_STACK, fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>{fmtMoneyCompact(trackTotals.amount)}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={eb}>{trackMeta.settledLabel}</span>
            <span style={{ fontFamily: APP_FONT_STACK, fontSize: "0.95rem", fontWeight: 700, color: "#166534" }}>{fmtMoneyCompact(trackTotals.settled)}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={eb}>{trackMeta.pendingLabel}</span>
            <span style={{ fontFamily: APP_FONT_STACK, fontSize: "0.95rem", fontWeight: 700, color: trackTotals.pending > 0 ? "#7c2d12" : "rgba(15,23,42,0.40)" }}>{fmtMoneyCompact(trackTotals.pending)}</span>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <button
              type="button"
              onClick={() => { setFormOpen((v) => !v); if (!formOpen) setTimeout(() => b2bFormRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50); }}
              style={{
                border: formOpen ? "1px solid rgba(15,23,42,0.16)" : "1px solid rgba(30,64,175,0.32)",
                borderRadius: 8,
                background: formOpen ? "rgba(255,255,255,0.92)" : "rgba(30,64,175,0.10)",
                color: formOpen ? "rgba(15,23,42,0.65)" : "#1d4ed8",
                padding: "8px 14px",
                fontFamily: APP_FONT_STACK,
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {formOpen ? "Close form" : `+ ${trackMeta.submitLabel}`}
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: "0 1 280px", minWidth: 240, borderRadius: 12, border: "1px solid rgba(15,23,42,0.10)", background: "rgba(255,255,255,0.92)", padding: 10 }}>
          <div style={{ ...eb, marginBottom: 8 }}>
            {trackMeta.listHeading}
          </div>
          {trackEntities.length === 0 ? (
            <div style={{ borderRadius: 14, border: "1px dashed rgba(15,23,42,0.16)", background: "rgba(248,250,252,0.90)", padding: "14px 12px", color: "rgba(15,23,42,0.56)", fontFamily: APP_FONT_STACK, fontSize: "0.84rem" }}>
              {activeTrack === "agent" ? "No agents tracked yet. Add the first referral entry below." : "No vendors in this track yet. Add the first entry below."}
            </div>
          ) : (
            <div role="tablist" aria-label={`${trackMeta.listHeading} list`} style={{ display: "grid", gap: 4 }}>
              {trackEntities.map((entity) => {
                const active = entity.key === activeEntity?.key;
                const hasPending = entity.pendingValue > 0;
                return (
                  <button
                    key={entity.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => selectEntity(entity)}
                    style={{
                      borderRadius: 8,
                      border: active ? "1px solid rgba(30,64,175,0.24)" : "1px solid transparent",
                      background: active ? "rgba(30,64,175,0.08)" : "transparent",
                      padding: "8px 10px",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: "0.84rem", fontWeight: 600, color: "#0f172a", fontFamily: APP_FONT_STACK }}>
                        {entity.name}
                      </span>
                      {hasPending && (
                        <span style={{ fontSize: "0.70rem", color: "#7c2d12", fontFamily: APP_FONT_STACK, fontWeight: 600 }}>
                          {fmtMoneyCompact(entity.pendingValue)}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ flex: "1 1 480px", minWidth: 280, borderRadius: 12, border: "1px solid rgba(15,23,42,0.10)", background: "rgba(255,255,255,0.92)", padding: 14 }}>
          {!activeEntity ? (
            <div style={{ fontSize: "0.84rem", color: "rgba(15,23,42,0.50)", fontFamily: APP_FONT_STACK, padding: "12px 4px" }}>
              Select a {activeTrack === "agent" ? "agent" : "vendor"} from the list, or click "+ {trackMeta.submitLabel}" above to add one.
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ fontFamily: APP_FONT_STACK, fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>
                    {activeEntity.name}
                  </div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {activeEntity.roles.map((roleId) => {
                      const badge = B2B_ROLE_BADGE_META[roleId];
                      return (
                        <span
                          key={`${activeEntity.key}_${roleId}_detail`}
                          style={{
                            borderRadius: 6,
                            border: `1px solid ${badge.border}`,
                            background: badge.background,
                            color: badge.color,
                            padding: "2px 7px",
                            fontFamily: APP_FONT_STACK,
                            fontSize: "0.65rem",
                            fontWeight: 600,
                          }}
                        >
                          {badge.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 14, fontSize: "0.74rem", fontFamily: APP_FONT_STACK, color: "rgba(15,23,42,0.55)" }}>
                  <span>Paid <strong style={{ color: "#166534", fontWeight: 700 }}>{fmtMoneyCompact(activeEntity.settledValue)}</strong></span>
                  <span>Pending <strong style={{ color: activeEntity.pendingValue > 0 ? "#7c2d12" : "rgba(15,23,42,0.40)", fontWeight: 700 }}>{fmtMoneyCompact(activeEntity.pendingValue)}</strong></span>
                </div>
              </div>

              {/* Services — collapsed inline */}
              {activeEntity.roles.some((roleId) => (activeEntity.servicesByRole[roleId] || []).length > 0) && (
                <div style={{ display: "grid", gap: 6, marginBottom: 12, paddingBottom: 10, borderBottom: "1px solid rgba(15,23,42,0.06)" }}>
                  {activeEntity.roles.map((roleId) => {
                    const groups = activeEntity.servicesByRole[roleId] || [];
                    if (groups.length === 0) return null;
                    const items = groups.flatMap((g) => g.items);
                    if (items.length === 0) return null;
                    return (
                      <div key={`${activeEntity.key}_${roleId}_services`} style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                        <span style={{ ...eb, color: B2B_ROLE_BADGE_META[roleId].color, minWidth: 70 }}>
                          {roleId === "take" ? "We take" : roleId === "give" ? "We give" : "Refers"}
                        </span>
                        <span style={{ fontSize: "0.78rem", color: "rgba(15,23,42,0.70)", fontFamily: APP_FONT_STACK, lineHeight: 1.45 }}>
                          {items.join(" · ")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeEntity.entries.length === 0 ? null : (
                <div style={{ display: "grid", gap: 8 }}>
                  {activeEntity.entries.slice(0, 6).map((entry) => (
                    <div key={entry.id} style={{ borderRadius: 12, border: "1px solid rgba(15,23,42,0.08)", background: "rgba(255,255,255,0.78)", padding: "10px 11px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
                        <div>
                          <div style={{ fontSize: "0.84rem", fontWeight: 700, color: "#0f172a", fontFamily: APP_FONT_STACK }}>
                            {entry.serviceName || entry.referredClient || "Untitled entry"}
                          </div>
                          <div style={{ marginTop: 4, fontSize: "0.74rem", color: "rgba(15,23,42,0.56)", fontFamily: APP_FONT_STACK }}>
                            {activeTrack === "agent" ? `Client ${entry.referredClient || "N/A"} | Commission ${formatCurrency(entry.amount)}` : `Qty ${entry.quantity} x Rs. ${entry.rate} = ${formatCurrency(entry.amount)}`}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteEntry(entry)}
                          style={{
                            border: "1px solid rgba(185,28,28,0.24)",
                            borderRadius: 999,
                            background: "rgba(185,28,28,0.08)",
                            color: "#991b1b",
                            fontSize: "0.56rem",
                            fontFamily: APP_BRAND_STACK,
                            fontWeight: 700,
                            letterSpacing: "0.14em",
                            textTransform: "uppercase",
                            padding: "5px 9px",
                            cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                      <div style={{ marginTop: 5, fontSize: "0.72rem", color: "rgba(15,23,42,0.52)", fontFamily: APP_FONT_STACK }}>
                        {entry.paymentStatus} | {trackMeta.settledLabel} {formatCurrency(entry.paidAmount)} | {trackMeta.pendingLabel.replace("Total ", "")} {formatCurrency(entry.pendingAmount)} | {entry.paymentMode} | {formatEntryDate(entry.entryDate)}
                      </div>
                      {entry.ecosystem === "agent" && Number(entry.businessAmount) > 0 && (
                        <div style={{ marginTop: 4, fontSize: "0.72rem", color: "rgba(15,23,42,0.52)", fontFamily: APP_FONT_STACK }}>
                          Referred business {formatCurrency(entry.businessAmount)}
                        </div>
                      )}
                      {entry.ecosystem === "give" && entry.includeInDailyRevenue && (
                        <div style={{ marginTop: 4, fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#1d4ed8", fontFamily: APP_BRAND_STACK }}>
                          Included in daily revenue
                        </div>
                      )}
                      {entry.note && (
                        <div style={{ marginTop: 4, fontSize: "0.72rem", color: "rgba(15,23,42,0.52)", fontFamily: APP_FONT_STACK }}>
                          Note: {entry.note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {formOpen && (
      <form ref={b2bFormRef} onSubmit={(event) => { event.preventDefault(); handleAddEntry(); setFormOpen(false); }} style={{ width: "100%", borderRadius: 12, border: "1px solid rgba(30,64,175,0.20)", background: "rgba(255,255,255,0.96)", padding: "14px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.20em", textTransform: "uppercase", color: DS.wine, fontFamily: APP_BRAND_STACK }}>
              {trackMeta.heading}
            </div>
            <div style={{ marginTop: 6, fontFamily: APP_SERIF_STACK, fontSize: "1.15rem", fontWeight: 300, color: "#0f172a" }}>
              {trackMeta.submitLabel}
            </div>
          </div>
          <div style={{ fontSize: "0.72rem", color: "rgba(15,23,42,0.52)", fontFamily: APP_FONT_STACK }}>
            {trackMeta.amountCaption} {formatCurrency(amountPreview)}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: "0.74rem", color: "rgba(15,23,42,0.60)", fontFamily: APP_FONT_STACK }}>{activeTrack === "agent" ? "Agent" : "Vendor"}</span>
            <input
              list={partnerListId}
              value={activeForm.partnerName}
              onChange={(event) => updateActiveForm("partnerName", event.target.value)}
              placeholder={activeTrack === "agent" ? "Agent name" : "Vendor name"}
              style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(15,23,42,0.12)", background: "rgba(255,255,255,0.94)", color: "#0f172a", fontFamily: APP_FONT_STACK, fontSize: "0.84rem" }}
            />
            <datalist id={partnerListId}>
              {trackEntities.map((entity) => (
                <option key={`${partnerListId}_${entity.key}`} value={entity.name} />
              ))}
            </datalist>
          </label>

          {activeTrack === "agent" && (
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: "0.74rem", color: "rgba(15,23,42,0.60)", fontFamily: APP_FONT_STACK }}>Client Referred</span>
              <input
                value={activeForm.referredClient}
                onChange={(event) => updateActiveForm("referredClient", event.target.value)}
                placeholder="Client name"
                style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(15,23,42,0.12)", background: "rgba(255,255,255,0.94)", color: "#0f172a", fontFamily: APP_FONT_STACK, fontSize: "0.84rem" }}
              />
            </label>
          )}

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: "0.74rem", color: "rgba(15,23,42,0.60)", fontFamily: APP_FONT_STACK }}>{activeTrack === "agent" ? "Service Referred" : "Service"}</span>
            <input
              list={serviceListId}
              value={activeForm.serviceName}
              onChange={(event) => updateActiveForm("serviceName", event.target.value)}
              placeholder={activeTrack === "agent" ? "Optional service" : "Service name"}
              style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(15,23,42,0.12)", background: "rgba(255,255,255,0.94)", color: "#0f172a", fontFamily: APP_FONT_STACK, fontSize: "0.84rem" }}
            />
            <datalist id={serviceListId}>
              {serviceSuggestions.map((service) => (
                <option key={`${serviceListId}_${service}`} value={service} />
              ))}
            </datalist>
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: "0.74rem", color: "rgba(15,23,42,0.60)", fontFamily: APP_FONT_STACK }}>Quantity</span>
            <input type="number" min="1" value={activeForm.quantity} onChange={(event) => updateActiveForm("quantity", event.target.value)} style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(15,23,42,0.12)", background: "rgba(255,255,255,0.94)", color: "#0f172a", fontFamily: APP_FONT_STACK, fontSize: "0.84rem" }} />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: "0.74rem", color: "rgba(15,23,42,0.60)", fontFamily: APP_FONT_STACK }}>{trackMeta.rateFieldLabel}</span>
            <input type="number" min="0" value={activeForm.rate} onChange={(event) => updateActiveForm("rate", event.target.value)} style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(15,23,42,0.12)", background: "rgba(255,255,255,0.94)", color: "#0f172a", fontFamily: APP_FONT_STACK, fontSize: "0.84rem" }} />
          </label>

          {activeTrack === "agent" && (
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: "0.74rem", color: "rgba(15,23,42,0.60)", fontFamily: APP_FONT_STACK }}>Referred Business (Rs.)</span>
              <input type="number" min="0" value={activeForm.businessAmount} onChange={(event) => updateActiveForm("businessAmount", event.target.value)} style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(15,23,42,0.12)", background: "rgba(255,255,255,0.94)", color: "#0f172a", fontFamily: APP_FONT_STACK, fontSize: "0.84rem" }} />
            </label>
          )}

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: "0.74rem", color: "rgba(15,23,42,0.60)", fontFamily: APP_FONT_STACK }}>{trackMeta.paidFieldLabel}</span>
            <input type="number" min="0" value={activeForm.settledAmount} onChange={(event) => updateActiveForm("settledAmount", event.target.value)} style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(15,23,42,0.12)", background: "rgba(255,255,255,0.94)", color: "#0f172a", fontFamily: APP_FONT_STACK, fontSize: "0.84rem" }} />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: "0.74rem", color: "rgba(15,23,42,0.60)", fontFamily: APP_FONT_STACK }}>Payment Mode</span>
            <select value={activeForm.paymentMode} onChange={(event) => updateActiveForm("paymentMode", event.target.value)} style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(15,23,42,0.12)", background: "rgba(255,255,255,0.94)", color: "#0f172a", fontFamily: APP_FONT_STACK, fontSize: "0.84rem" }}>
              {B2B_PAYMENT_MODES.map((mode) => (
                <option key={`b2b_payment_mode_${mode}`} value={mode} style={MENU_OPTION_STYLE}>{mode}</option>
              ))}
            </select>
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: "0.74rem", color: "rgba(15,23,42,0.60)", fontFamily: APP_FONT_STACK }}>Date</span>
            <input type="date" value={activeForm.entryDate} onChange={(event) => updateActiveForm("entryDate", event.target.value)} style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(15,23,42,0.12)", background: "rgba(255,255,255,0.94)", color: "#0f172a", fontFamily: APP_FONT_STACK, fontSize: "0.84rem" }} />
          </label>

          <label style={{ display: "grid", gap: 6, gridColumn: "1 / -1" }}>
            <span style={{ fontSize: "0.74rem", color: "rgba(15,23,42,0.60)", fontFamily: APP_FONT_STACK }}>Note</span>
            <textarea rows="2" value={activeForm.note} onChange={(event) => updateActiveForm("note", event.target.value)} placeholder="Optional note" style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(15,23,42,0.12)", background: "rgba(255,255,255,0.94)", color: "#0f172a", fontFamily: APP_FONT_STACK, fontSize: "0.84rem", resize: "vertical", minHeight: 76 }} />
          </label>
        </div>

        {activeTrack === "give" && (
          <label style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 12, padding: "8px 10px", border: "1px solid rgba(30,64,175,0.18)", borderRadius: 10, background: "rgba(30,64,175,0.06)", cursor: "pointer" }}>
            <input type="checkbox" checked={Boolean(activeForm.includeInDailyRevenue)} onChange={(event) => updateActiveForm("includeInDailyRevenue", event.target.checked)} />
            <span style={{ fontSize: "0.78rem", color: "rgba(15,23,42,0.70)", fontFamily: APP_FONT_STACK }}>
              Include this sales entry in daily revenue
            </span>
          </label>
        )}

        <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontSize: "0.78rem", color: "rgba(15,23,42,0.58)", fontFamily: APP_FONT_STACK }}>
            {trackMeta.previewVerb} {formatCurrency(amountPreview)} | {trackMeta.settledLabel} {formatCurrency(settledPreview)} | {trackMeta.pendingLabel.replace("Total ", "")} {formatCurrency(pendingPreview)}
          </div>
          <button type="submit" style={{ border: "1px solid rgba(30,64,175,0.32)", borderRadius: 999, background: "rgba(30,64,175,0.10)", color: "#1d4ed8", fontFamily: APP_BRAND_STACK, fontWeight: 700, fontSize: "0.56rem", letterSpacing: "0.20em", textTransform: "uppercase", padding: "11px 18px", cursor: "pointer" }}>
            {trackMeta.submitLabel}
          </button>
        </div>
        {formError && (
          <div style={{ marginTop: 10, color: "#991b1b", fontSize: "0.80rem", fontFamily: APP_FONT_STACK, fontWeight: 600 }}>
            {formError}
          </div>
        )}
      </form>
      )}

      <ConfirmDialog isOpen={confirmDialog.isOpen} title={confirmDialog.title} message={confirmDialog.message} onCancel={() => setConfirmDialog({ isOpen: false, title: "", message: "", onConfirm: null })} onConfirm={() => confirmDialog.onConfirm?.()} confirmLabel="Continue" />
      <AccessCodeDialog isOpen={accessCodeDialog.isOpen} title={accessCodeDialog.title} message={accessCodeDialog.message} code={accessCodeDialog.code} error={accessCodeDialog.error} onCodeChange={(nextCode) => setAccessCodeDialog((prev) => ({ ...prev, code: nextCode, error: "" }))} onCancel={() => setAccessCodeDialog({ isOpen: false, title: "", message: "", actionLabel: "", code: "", error: "", onAuthorized: null })} onConfirm={() => { const verification = verifyDeleteAccess(accessCodeDialog.actionLabel, accessCodeDialog.code); if (!verification.ok) { setAccessCodeDialog((prev) => ({ ...prev, error: verification.message })); } else { const onAuthorized = accessCodeDialog.onAuthorized; setAccessCodeDialog({ isOpen: false, title: "", message: "", actionLabel: "", code: "", error: "", onAuthorized: null }); onAuthorized?.(); } }} />
    </div>
  );
}

// --- Monthly Overview ---
function MonthlyOverview({ tickets, b2bLedger = [], onNavigateTab }) {
  const normalized = tickets.map((t) => t.structured ? t : withStructuredTicket(t));
  const b2bNormalized = useMemo(() => hydrateB2BLedger(b2bLedger), [b2bLedger]);

  const fmtINR = (n) => `Rs. ${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;
  const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);

  const byMonth = {};
  normalized.forEach((t) => {
    const normalizedDateKey = toIsoDateKey(t.entryDateKey || t.structured?.meta?.createdDate || t.date || "");
    const key = normalizedDateKey ? normalizedDateKey.slice(0, 7) : "Unknown";
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(t);
  });
  const months = Object.keys(byMonth).sort().reverse();

  const allRevenue = normalized.reduce((s, t) => s + (Number(t.structured?.payment?.paidTotal) || 0), 0);
  const allInvoiced = normalized.reduce((s, t) => s + (Number(t.total) || 0), 0);
  const allPending = normalized.reduce((s, t) => s + (Number(t.structured?.payment?.pendingBalance) || 0), 0);
  const openCount = normalized.filter((t) => t.status !== "Closed").length;
  const closedCount = normalized.filter((t) => t.status === "Closed").length;

  const todayKey = getTicketCounterDateKey(new Date());
  const daysAgoKey = (n) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return getTicketCounterDateKey(d);
  };

  const ticketDateKey = (t) => toIsoDateKey(t.entryDateKey || t.structured?.meta?.createdDate || t.date || "") || "";
  const ageDays = (t) => {
    const k = ticketDateKey(t);
    if (!k) return 0;
    const d = new Date(`${k}T00:00:00`);
    if (Number.isNaN(d.getTime())) return 0;
    return Math.floor((Date.now() - d.getTime()) / 86400000);
  };

  const last30 = normalized.filter((t) => {
    const k = ticketDateKey(t);
    return k && k >= daysAgoKey(30) && k <= todayKey;
  });
  const prev30 = normalized.filter((t) => {
    const k = ticketDateKey(t);
    return k && k >= daysAgoKey(60) && k < daysAgoKey(30);
  });
  const last7 = normalized.filter((t) => {
    const k = ticketDateKey(t);
    return k && k >= daysAgoKey(7);
  });

  const sumPaid = (arr) => arr.reduce((s, t) => s + (Number(t.structured?.payment?.paidTotal) || 0), 0);
  const sumInvoiced = (arr) => arr.reduce((s, t) => s + (Number(t.total) || 0), 0);
  const sumPending = (arr) => arr.reduce((s, t) => s + (Number(t.structured?.payment?.pendingBalance) || 0), 0);

  const last30Paid = sumPaid(last30);
  const prev30Paid = sumPaid(prev30);
  const growthMoM = prev30Paid > 0 ? Math.round(((last30Paid - prev30Paid) / prev30Paid) * 100) : 0;

  const collectionRate = allInvoiced > 0 ? Math.round((allRevenue / allInvoiced) * 100) : 0;

  const openTickets = normalized.filter((t) => t.status !== "Closed");
  const aging = {
    fresh: openTickets.filter((t) => ageDays(t) < 1).length,
    d1to3: openTickets.filter((t) => ageDays(t) >= 1 && ageDays(t) < 3).length,
    d3to7: openTickets.filter((t) => ageDays(t) >= 3 && ageDays(t) < 7).length,
    over7: openTickets.filter((t) => ageDays(t) >= 7).length,
  };
  const backlogPct = openTickets.length > 0 ? Math.round((aging.over7 / openTickets.length) * 100) : 0;

  const dailyAvg = last30.length > 0 ? last30Paid / 30 : 0;

  // Service performance
  const serviceStats = {};
  normalized.forEach((t) => {
    (t.structured?.items || t.items || []).forEach((item) => {
      const name = item.serviceName || item.name || "Unknown";
      if (!serviceStats[name]) {
        serviceStats[name] = { name, count: 0, revenue: 0, pending: 0, category: item.category || "Other" };
      }
      serviceStats[name].count += Number(item.quantity) || 1;
      serviceStats[name].revenue += Number(item.lineTotal || item.total || 0);
    });
  });
  normalized.forEach((t) => {
    const pendingT = Number(t.structured?.payment?.pendingBalance) || 0;
    const items = t.structured?.items || t.items || [];
    if (items.length === 0 || pendingT === 0) return;
    const totalT = Number(t.total) || 0;
    items.forEach((item) => {
      const name = item.serviceName || item.name || "Unknown";
      if (!serviceStats[name]) return;
      const itemTotal = Number(item.lineTotal || item.total || 0);
      const share = totalT > 0 ? itemTotal / totalT : 0;
      serviceStats[name].pending += pendingT * share;
    });
  });
  const topServicesByRevenue = Object.values(serviceStats).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  const topServicesByCount = Object.values(serviceStats).sort((a, b) => b.count - a.count).slice(0, 5);
  const top3RevenuePct = topServicesByRevenue.slice(0, 3).reduce((s, x) => s + x.revenue, 0);
  const concentration = allInvoiced > 0 ? Math.round((top3RevenuePct / allInvoiced) * 100) : 0;

  // Payment mode split
  const modeStats = { Cash: 0, UPI: 0, "Bank Transfer": 0, Other: 0 };
  normalized.forEach((t) => {
    const pays = t.structured?.payment?.paymentRecords || t.payments || [];
    pays.forEach((p) => {
      const mode = p.method || p.paymentMode || "Other";
      const amt = Number(p.amount) || 0;
      if (modeStats[mode] !== undefined) modeStats[mode] += amt;
      else modeStats.Other += amt;
    });
  });
  const totalModePaid = Object.values(modeStats).reduce((a, b) => a + b, 0) || allRevenue;

  // B2B integration
  const b2bPurchases = b2bNormalized.filter((e) => e.flow === "vendor_to_us");
  const b2bSales = b2bNormalized.filter((e) => e.flow === "us_to_vendor");
  const b2bAgents = b2bNormalized.filter((e) => e.type === "agent_commission");
  const b2bPurchaseValue = b2bPurchases.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const b2bSalesValue = b2bSales.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const b2bPayable = b2bPurchases.reduce((s, e) => s + (Number(e.pendingAmount) || 0), 0);
  const b2bReceivable = b2bSales.reduce((s, e) => s + (Number(e.pendingAmount) || 0), 0);
  const totalEcosystemRevenue = allRevenue + b2bSalesValue;
  const b2bRevSharePct = totalEcosystemRevenue > 0 ? Math.round((b2bSalesValue / totalEcosystemRevenue) * 100) : 0;
  const vendorCostPct = allInvoiced > 0 ? Math.round((b2bPurchaseValue / allInvoiced) * 100) : 0;

  // Vendor concentration
  const vendorMap = {};
  b2bPurchases.forEach((e) => {
    const v = e.vendorName || e.vendor || "Unknown";
    vendorMap[v] = (vendorMap[v] || 0) + (Number(e.amount) || 0);
  });
  const vendorList = Object.entries(vendorMap).map(([name, val]) => ({ name, val })).sort((a, b) => b.val - a.val);
  const topVendorPct = b2bPurchaseValue > 0 && vendorList.length > 0 ? Math.round((vendorList[0].val / b2bPurchaseValue) * 100) : 0;

  // Expansion Readiness Score
  const monthlyRevenues = months.slice(0, 6).map((m) => byMonth[m].reduce((s, t) => s + (Number(t.structured?.payment?.paidTotal) || 0), 0));
  const meanRev = monthlyRevenues.length > 0 ? monthlyRevenues.reduce((a, b) => a + b, 0) / monthlyRevenues.length : 0;
  const variance = monthlyRevenues.length > 0 ? monthlyRevenues.reduce((s, v) => s + Math.pow(v - meanRev, 2), 0) / monthlyRevenues.length : 0;
  const stdDev = Math.sqrt(variance);
  const cv = meanRev > 0 ? stdDev / meanRev : 1;

  const f1_revStability = cv < 0.10 ? 14 : cv < 0.15 ? 11 : cv < 0.25 ? 8 : 4;
  const pendingPctOfMRR = meanRev > 0 ? (allPending / meanRev) * 100 : 100;
  const f2_collection = collectionRate >= 92 && pendingPctOfMRR < 15 ? 14 : collectionRate >= 85 && pendingPctOfMRR < 20 ? 11 : collectionRate >= 75 ? 8 : 4;
  const f3_capacity = backlogPct < 2 ? 14 : backlogPct < 5 ? 11 : backlogPct < 10 ? 7 : 3;
  const f4_serviceMix = concentration >= 50 && concentration <= 65 ? 13 : concentration > 65 && concentration <= 75 ? 10 : concentration < 50 ? 9 : 6;
  const f5_vendor = vendorList.length === 0 ? 12 : topVendorPct < 50 ? 14 : topVendorPct < 70 ? 10 : 5;
  const f6_team = 7;
  const f7_cash = pendingPctOfMRR < 15 ? 14 : pendingPctOfMRR < 25 ? 10 : 5;

  const readinessScore = Math.round(f1_revStability + f2_collection + f3_capacity + f4_serviceMix + f5_vendor + f6_team + f7_cash);
  const readinessPhase = readinessScore >= 90 ? { label: "IDEAL", color: "#15803d", desc: "Expansion strategically and operationally sound" }
    : readinessScore >= 75 ? { label: "READY", color: "#16a34a", desc: "Can open second centre in 60-90 days" }
    : readinessScore >= 60 ? { label: "PREPARE", color: "#ca8a04", desc: "Plan expansion, address gaps in 90 days" }
    : readinessScore >= 40 ? { label: "HOLD", color: "#ea580c", desc: "Stabilize current operations first" }
    : { label: "NOT READY", color: "#dc2626", desc: "Foundational issues to fix before scaling" };

  // Health indicators
  const growthHealth = growthMoM >= 3 && growthMoM <= 15 ? "good" : growthMoM > 0 ? "watch" : "bad";
  const collectionHealth = collectionRate >= 90 ? "good" : collectionRate >= 80 ? "watch" : "bad";
  const backlogHealth = backlogPct < 2 ? "good" : backlogPct < 5 ? "watch" : "bad";
  const readinessHealth = readinessScore >= 75 ? "good" : readinessScore >= 60 ? "watch" : "bad";

  const healthColor = (h) => h === "good" ? "#15803d" : h === "watch" ? "#ca8a04" : "#dc2626";
  const healthLabel = (h) => h === "good" ? "HEALTHY" : h === "watch" ? "WATCH" : "ACTION";

  // Forecast
  const projectedRevenue30 = Math.round(dailyAvg * 30);
  const upsideProjection = Math.round(projectedRevenue30 * 1.08);
  const conservativeProjection = Math.round(projectedRevenue30 * 0.95);

  // Profit / Loss from ticket-level vendor amounts only
  const ticketsWithVendorAmount = normalized.filter((t) => {
    const va = t.vendorAmount ?? t.structured?.payment?.vendorAmount;
    return va !== null && va !== undefined && va !== "" && Number.isFinite(Number(va));
  });
  const totalTicketVendorCost = ticketsWithVendorAmount.reduce((s, t) => {
    const va = t.vendorAmount ?? t.structured?.payment?.vendorAmount ?? 0;
    return s + Math.max(0, Number(va) || 0);
  }, 0);
  const totalTicketRevenue = normalized.reduce((s, t) => s + (Number(t.total) || 0), 0);
  const netProfitLoss = totalTicketRevenue - totalTicketVendorCost;
  const grossMarginPct = totalTicketRevenue > 0 ? Math.round((netProfitLoss / totalTicketRevenue) * 100) : null;
  const vendorCoverageCount = ticketsWithVendorAmount.length;

  // Service category trend
  const catRevenue = {};
  CATEGORIES.forEach((c) => { catRevenue[c] = 0; });
  Object.values(serviceStats).forEach((s) => {
    if (catRevenue[s.category] !== undefined) catRevenue[s.category] += s.revenue;
  });

  const styles = {
    section: { background: "rgba(255,255,255,0.78)", border: "1px solid rgba(15,23,42,0.10)", borderRadius: 12, padding: "18px 20px", marginBottom: 16 },
    sectionTitle: { fontFamily: APP_FONT_STACK, fontSize: "0.92rem", fontWeight: 700, color: "#0f172a", marginBottom: 4, letterSpacing: "-0.01em" },
    sectionSubtitle: { fontFamily: APP_FONT_STACK, fontSize: "0.74rem", color: "rgba(15,23,42,0.55)", marginBottom: 14 },
    eyebrow: { fontFamily: APP_BRAND_STACK, fontSize: "0.56rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(15,23,42,0.45)", marginBottom: 6 },
    bigNumber: { fontFamily: APP_FONT_STACK, fontSize: "1.55rem", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em", lineHeight: 1.1 },
    midNumber: { fontFamily: APP_FONT_STACK, fontSize: "1.15rem", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" },
    label: { fontFamily: APP_FONT_STACK, fontSize: "0.72rem", color: "rgba(15,23,42,0.55)" },
    chip: { fontFamily: APP_BRAND_STACK, fontSize: "0.54rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 999 },
    decisionBox: { marginTop: 14, padding: "12px 14px", background: "rgba(15,23,42,0.03)", border: "1px solid rgba(15,23,42,0.08)", borderRadius: 10 },
  };

  if (normalized.length === 0) {
    return (
      <div style={{ animation: "fadeIn 0.3s ease-out" }}>
        <div style={styles.section}>
          <div className="csc-empty-state">
            <div className="csc-empty-state-icon">AN</div>
            <div className="csc-empty-state-title">No tickets recorded yet.</div>
            <div className="csc-empty-state-message">
              Once you start creating service tickets, the Analytics & Growth Dashboard will activate.
            </div>
            <button type="button" className="csc-empty-state-cta" onClick={() => onNavigateTab?.("entry")}>Start New Entry</button>
          </div>
        </div>
      </div>
    );
  }

  const HealthCard = ({ title, value, subtitle, health }) => (
    <div style={{ background: "rgba(255,255,255,0.85)", border: `1px solid ${healthColor(health)}33`, borderRadius: 12, padding: "14px 16px", borderLeft: `3px solid ${healthColor(health)}` }}>
      <div style={styles.eyebrow}>{title}</div>
      <div style={{ ...styles.bigNumber, color: healthColor(health) }}>{value}</div>
      <div style={{ ...styles.label, marginTop: 4 }}>{subtitle}</div>
      <div style={{ ...styles.chip, marginTop: 8, display: "inline-block", color: healthColor(health), background: `${healthColor(health)}14`, border: `1px solid ${healthColor(health)}33` }}>
        {healthLabel(health)}
      </div>
    </div>
  );

  const StatTile = ({ label, value, color = "#0f172a", small = false }) => (
    <div style={{ background: "rgba(15,23,42,0.03)", border: "1px solid rgba(15,23,42,0.07)", borderRadius: 10, padding: "10px 12px" }}>
      <div style={styles.eyebrow}>{label}</div>
      <div style={small ? styles.midNumber : styles.bigNumber}>
        <span style={{ color }}>{value}</span>
      </div>
    </div>
  );

  const Bar = ({ value, max, color }) => (
    <div style={{ height: 6, borderRadius: 999, background: "rgba(15,23,42,0.06)", overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%`, background: color, borderRadius: 999, transition: "width 0.4s ease" }} />
    </div>
  );

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>

      {/* SECTION 1: EXECUTIVE HEALTH CHECK */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Executive Health Check</div>
        <div style={styles.sectionSubtitle}>Four indicators tell you the state of the business in one glance.</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <HealthCard
            title="Growth"
            value={`${growthMoM > 0 ? "+" : ""}${growthMoM}%`}
            subtitle="Last 30 vs prior 30 days"
            health={growthHealth}
          />
          <HealthCard
            title="Collections"
            value={`${collectionRate}%`}
            subtitle={`of Rs. ${Math.round(allInvoiced).toLocaleString("en-IN")} invoiced`}
            health={collectionHealth}
          />
          <HealthCard
            title="Backlog"
            value={`${aging.over7}`}
            subtitle={`tickets older than 7 days (${backlogPct}% of open)`}
            health={backlogHealth}
          />
          <HealthCard
            title="Expansion Ready"
            value={`${readinessScore}/100`}
            subtitle={readinessPhase.label}
            health={readinessHealth}
          />
        </div>
      </div>

      {/* SECTION: PROFIT / LOSS */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Profit / Loss</div>
        <div style={styles.sectionSubtitle}>
          Based on ticket-level Vendor Amount entries only. Service Dashboard reference prices are not used here.
          {vendorCoverageCount < normalized.length && (
            <span style={{ color: "#ca8a04", fontWeight: 600 }}>
              {" "}({vendorCoverageCount} of {normalized.length} tickets have a vendor amount entered.)
            </span>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 14 }}>
          <StatTile label="Total Revenue" value={fmtINR(totalTicketRevenue)} color="#15803d" />
          <StatTile label="Total Vendor Cost" value={fmtINR(totalTicketVendorCost)} color="#dc2626" />
          <StatTile
            label="Net Profit / Loss"
            value={fmtINR(netProfitLoss)}
            color={netProfitLoss >= 0 ? "#15803d" : "#dc2626"}
          />
          {grossMarginPct !== null && (
            <StatTile
              label="Gross Margin"
              value={`${grossMarginPct}%`}
              color={grossMarginPct >= 30 ? "#15803d" : grossMarginPct >= 10 ? "#ca8a04" : "#dc2626"}
              small
            />
          )}
        </div>
        {vendorCoverageCount === 0 && (
          <div style={{ ...styles.decisionBox, borderColor: "rgba(202,138,4,0.30)", background: "rgba(202,138,4,0.05)" }}>
            <div style={{ fontFamily: APP_FONT_STACK, fontSize: "0.82rem", color: "#92400e", lineHeight: 1.5 }}>
              No vendor amounts recorded yet. Enter a Vendor Amount when creating or editing a ticket to track actual profit/loss per job.
            </div>
          </div>
        )}
        {vendorCoverageCount > 0 && (
          <div style={styles.decisionBox}>
            <div style={{ ...styles.eyebrow, color: "rgba(15,23,42,0.55)" }}>How this is calculated</div>
            <div style={{ fontFamily: APP_FONT_STACK, fontSize: "0.82rem", color: "#0f172a", lineHeight: 1.5 }}>
              Profit / Loss = Total ticket revenue − Total vendor amounts entered per ticket.
              Tickets without a vendor amount contribute to revenue but not to vendor cost.
              To improve accuracy, enter vendor amounts on all tickets.
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: REVENUE & COLLECTIONS */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Revenue & Collections</div>
        <div style={styles.sectionSubtitle}>The flow of real money — what's invoiced, what's collected, what's stuck.</div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 18 }}>
          <StatTile label="Invoiced (All)" value={fmtINR(allInvoiced)} color="#0f172a" />
          <StatTile label="Collected" value={fmtINR(allRevenue)} color="#15803d" />
          <StatTile label="Pending" value={fmtINR(allPending)} color="#dc2626" />
          <StatTile label="Daily Avg (30d)" value={fmtINR(dailyAvg)} color="#1d4ed8" small />
          <StatTile label="Last 7 days" value={fmtINR(sumPaid(last7))} color="#1d4ed8" small />
          <StatTile label="This Month" value={fmtINR(months[0] ? byMonth[months[0]].reduce((s, t) => s + (Number(t.structured?.payment?.paidTotal) || 0), 0) : 0)} color="#1d4ed8" small />
        </div>

        {/* Monthly trend bars */}
        <div style={{ marginBottom: 16 }}>
          <div style={styles.eyebrow}>Monthly Revenue Trend (last {Math.min(months.length, 6)})</div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 110, paddingTop: 12 }}>
            {months.slice(0, 6).reverse().map((m) => {
              const rev = byMonth[m].reduce((s, t) => s + (Number(t.structured?.payment?.paidTotal) || 0), 0);
              const pen = byMonth[m].reduce((s, t) => s + (Number(t.structured?.payment?.pendingBalance) || 0), 0);
              const maxRev = Math.max(...months.slice(0, 6).map((mm) => byMonth[mm].reduce((s, t) => s + (Number(t.structured?.payment?.paidTotal) || 0) + (Number(t.structured?.payment?.pendingBalance) || 0), 0)), 1);
              const collH = (rev / maxRev) * 100;
              const penH = (pen / maxRev) * 100;
              const label = (() => {
                if (!/^\d{4}-\d{2}$/.test(m)) return m;
                const [y, mm] = m.split("-");
                return new Date(Number(y), Number(mm) - 1, 1).toLocaleString("en-IN", { month: "short" });
              })();
              return (
                <div key={m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ width: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", height: 90 }}>
                    <div style={{ width: "100%", height: `${penH}%`, background: "rgba(220,38,38,0.55)", borderRadius: "3px 3px 0 0" }} title={`Pending: ${fmtINR(pen)}`} />
                    <div style={{ width: "100%", height: `${collH}%`, background: "#15803d", borderRadius: penH > 0 ? "0" : "3px 3px 0 0" }} title={`Collected: ${fmtINR(rev)}`} />
                  </div>
                  <div style={{ fontSize: "0.66rem", color: "rgba(15,23,42,0.55)", fontFamily: APP_FONT_STACK }}>{label}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: "0.66rem", color: "rgba(15,23,42,0.55)", fontFamily: APP_FONT_STACK }}>
            <span><span style={{ display: "inline-block", width: 8, height: 8, background: "#15803d", marginRight: 5, borderRadius: 2 }} />Collected</span>
            <span><span style={{ display: "inline-block", width: 8, height: 8, background: "rgba(220,38,38,0.55)", marginRight: 5, borderRadius: 2 }} />Pending</span>
          </div>
        </div>

        {/* Payment mode split */}
        <div>
          <div style={styles.eyebrow}>Payment Mode Split</div>
          <div style={{ display: "grid", gap: 8, marginTop: 6 }}>
            {Object.entries(modeStats).map(([mode, val]) => {
              const p = totalModePaid > 0 ? Math.round((val / totalModePaid) * 100) : 0;
              const color = mode === "Cash" ? "#ca8a04" : mode === "UPI" ? "#15803d" : mode === "Bank Transfer" ? "#1d4ed8" : "rgba(15,23,42,0.4)";
              return (
                <div key={mode}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: "0.78rem", color: "rgba(15,23,42,0.7)", fontFamily: APP_FONT_STACK }}>{mode}</span>
                    <span style={{ fontFamily: APP_FONT_STACK, fontSize: "0.78rem", fontWeight: 600, color }}>{fmtINR(val)} <span style={{ color: "rgba(15,23,42,0.4)", fontWeight: 400 }}>({p}%)</span></span>
                  </div>
                  <Bar value={val} max={totalModePaid} color={color} />
                </div>
              );
            })}
          </div>
        </div>

        <div style={styles.decisionBox}>
          <div style={{ ...styles.eyebrow, color: "rgba(15,23,42,0.55)" }}>Decision Support</div>
          <div style={{ fontFamily: APP_FONT_STACK, fontSize: "0.82rem", color: "#0f172a", lineHeight: 1.5 }}>
            {collectionRate >= 90
              ? `Collections are healthy at ${collectionRate}%. Continue current credit terms. Monitor any aging invoices.`
              : collectionRate >= 80
                ? `Collection rate at ${collectionRate}% is acceptable but watch closely. Pending balance is Rs. ${Math.round(allPending).toLocaleString("en-IN")} — chase outstanding invoices over 7 days old.`
                : `Collection discipline weak (${collectionRate}%). Pending Rs. ${Math.round(allPending).toLocaleString("en-IN")} is at risk. Tighten credit, require advance for new customers, follow up on every invoice >7 days.`}
            {modeStats.Cash > totalModePaid * 0.7 && " Cash dominates — digital adoption (UPI) will improve scalability."}
          </div>
        </div>
      </div>

      {/* SECTION 3: SERVICE PERFORMANCE */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Service Performance</div>
        <div style={styles.sectionSubtitle}>Which services drive the business, which create operational pain, which to push.</div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 18 }}>
          <StatTile label="Active Services" value={Object.keys(serviceStats).length} color="#0f172a" small />
          <StatTile label="Top 3 Concentration" value={`${concentration}%`} color={concentration >= 50 && concentration <= 65 ? "#15803d" : concentration > 75 ? "#dc2626" : "#ca8a04"} small />
          <StatTile label="Most Frequent" value={topServicesByCount[0]?.name?.slice(0, 18) || "—"} color="#1d4ed8" small />
          <StatTile label="Highest Revenue" value={topServicesByRevenue[0]?.name?.slice(0, 18) || "—"} color="#15803d" small />
        </div>

        {/* Top services horizontal bars */}
        <div style={{ marginBottom: 16 }}>
          <div style={styles.eyebrow}>Top 8 Services by Revenue</div>
          <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
            {topServicesByRevenue.map((s) => {
              const maxR = topServicesByRevenue[0]?.revenue || 1;
              const color = CAT_COLORS[s.category] || "#1d4ed8";
              return (
                <div key={s.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: "0.80rem", color: "#0f172a", fontFamily: APP_FONT_STACK, fontWeight: 500 }}>{s.name}</span>
                    <span style={{ fontFamily: APP_FONT_STACK, fontSize: "0.78rem", fontWeight: 700, color }}>
                      {fmtINR(s.revenue)} <span style={{ color: "rgba(15,23,42,0.4)", fontWeight: 400, fontSize: "0.70rem" }}>· {s.count} tickets</span>
                    </span>
                  </div>
                  <Bar value={s.revenue} max={maxR} color={color} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Category mix */}
        <div>
          <div style={styles.eyebrow}>Revenue by Category</div>
          <div style={{ display: "grid", gap: 8, marginTop: 6 }}>
            {CATEGORIES.map((c) => {
              const totalCat = Object.values(catRevenue).reduce((a, b) => a + b, 0);
              const p = totalCat > 0 ? Math.round((catRevenue[c] / totalCat) * 100) : 0;
              return (
                <div key={c}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: "0.76rem", color: "rgba(15,23,42,0.7)", fontFamily: APP_FONT_STACK }}>{c}</span>
                    <span style={{ fontFamily: APP_FONT_STACK, fontSize: "0.76rem", fontWeight: 600, color: CAT_COLORS[c] }}>{fmtINR(catRevenue[c])} ({p}%)</span>
                  </div>
                  <Bar value={catRevenue[c]} max={totalCat} color={CAT_COLORS[c]} />
                </div>
              );
            })}
          </div>
        </div>

        <div style={styles.decisionBox}>
          <div style={{ ...styles.eyebrow, color: "rgba(15,23,42,0.55)" }}>Decision Support</div>
          <div style={{ fontFamily: APP_FONT_STACK, fontSize: "0.82rem", color: "#0f172a", lineHeight: 1.5 }}>
            {concentration >= 50 && concentration <= 65
              ? `Service mix is healthy — top 3 services contribute ${concentration}% (well-diversified yet focused). Keep core stable, invest in growing services.`
              : concentration > 75
                ? `Over-concentrated: top 3 services = ${concentration}% of revenue. Vulnerable if demand drops. Develop secondary services.`
                : `Too scattered: top 3 services only ${concentration}% of revenue. Hard to scale or train second team. Identify a clear core.`}
            {topServicesByRevenue[0] && ` Push more "${topServicesByRevenue[0].name}" — your highest-grossing service.`}
          </div>
        </div>
      </div>

      {/* SECTION 4: WORKFLOW & OPERATIONS */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Workflow & Operations</div>
        <div style={styles.sectionSubtitle}>Are we clearing work fast enough? Is backlog growing? Can we handle 2x?</div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 18 }}>
          <StatTile label="Open Tickets" value={openCount} color="#1d4ed8" />
          <StatTile label="Closed (All)" value={closedCount} color="#15803d" />
          <StatTile label="Aging > 7d" value={aging.over7} color={aging.over7 > 0 ? "#dc2626" : "#15803d"} />
          <StatTile label="Completion Rate" value={`${pct(closedCount, normalized.length)}%`} color="#0f172a" small />
        </div>

        {/* Aging breakdown */}
        <div style={{ marginBottom: 16 }}>
          <div style={styles.eyebrow}>Open Ticket Aging</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 8 }}>
            {[
              { l: "< 1 day", v: aging.fresh, c: "#15803d" },
              { l: "1-3 days", v: aging.d1to3, c: "#ca8a04" },
              { l: "3-7 days", v: aging.d3to7, c: "#ea580c" },
              { l: "> 7 days", v: aging.over7, c: "#dc2626" },
            ].map((a) => (
              <div key={a.l} style={{ background: `${a.c}10`, border: `1px solid ${a.c}33`, borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ ...styles.eyebrow, color: a.c }}>{a.l}</div>
                <div style={{ fontFamily: APP_FONT_STACK, fontSize: "1.4rem", fontWeight: 700, color: a.c, lineHeight: 1.1 }}>{a.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Funnel */}
        <div>
          <div style={styles.eyebrow}>Ticket Funnel (All Time)</div>
          <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
            {[
              { l: "Total Created", v: normalized.length, c: "#0f172a" },
              { l: "Closed", v: closedCount, c: "#15803d" },
              { l: "Fully Paid", v: normalized.filter((t) => t.structured?.payment?.status === "Paid").length, c: "#1d4ed8" },
            ].map((step) => {
              const p = pct(step.v, normalized.length);
              return (
                <div key={step.l} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: "0.78rem", color: "rgba(15,23,42,0.7)", fontFamily: APP_FONT_STACK, width: 110 }}>{step.l}</span>
                  <div style={{ flex: 1, height: 22, background: "rgba(15,23,42,0.05)", borderRadius: 6, overflow: "hidden", position: "relative" }}>
                    <div style={{ height: "100%", width: `${p}%`, background: step.c, borderRadius: 6, transition: "width 0.4s ease" }} />
                    <div style={{ position: "absolute", left: 8, top: 0, bottom: 0, display: "flex", alignItems: "center", fontFamily: APP_FONT_STACK, fontSize: "0.74rem", fontWeight: 700, color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
                      {step.v} ({p}%)
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={styles.decisionBox}>
          <div style={{ ...styles.eyebrow, color: "rgba(15,23,42,0.55)" }}>Decision Support</div>
          <div style={{ fontFamily: APP_FONT_STACK, fontSize: "0.82rem", color: "#0f172a", lineHeight: 1.5 }}>
            {aging.over7 === 0 && backlogPct < 5
              ? `Backlog under control. ${aging.fresh} fresh tickets, no aging issues. Capacity available for growth.`
              : aging.over7 > 5
                ? `${aging.over7} tickets older than 7 days — scaling red flag. Investigate root cause (missing docs, vendor delay, capacity). Clear before adding intake.`
                : `Watch backlog: ${aging.over7} tickets >7d. Manageable but address before they accumulate.`}
            {growthMoM > 8 && " High growth — consider second operator before backlog appears."}
          </div>
        </div>
      </div>

      {/* SECTION 5: B2B / VENDOR INTEGRATION */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>B2B & Vendor Integration</div>
        <div style={styles.sectionSubtitle}>Are partnerships driving growth or hiding margin loss? Are we vendor-dependent?</div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 18 }}>
          <StatTile label="B2B Sales" value={fmtINR(b2bSalesValue)} color="#15803d" small />
          <StatTile label="Vendor Cost" value={fmtINR(b2bPurchaseValue)} color="#dc2626" small />
          <StatTile label="Receivable" value={fmtINR(b2bReceivable)} color="#1d4ed8" small />
          <StatTile label="Payable" value={fmtINR(b2bPayable)} color="#ea580c" small />
          <StatTile label="B2B Rev Share" value={`${b2bRevSharePct}%`} color="#0f172a" small />
          <StatTile label="Agent Entries" value={b2bAgents.length} color="#1d4ed8" small />
        </div>

        {/* Revenue mix walk-in vs B2B */}
        <div style={{ marginBottom: 16 }}>
          <div style={styles.eyebrow}>Total Ecosystem Revenue Mix</div>
          <div style={{ display: "flex", height: 28, borderRadius: 6, overflow: "hidden", marginTop: 8, background: "rgba(15,23,42,0.05)" }}>
            <div style={{ width: `${100 - b2bRevSharePct}%`, background: "#15803d", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: APP_FONT_STACK, fontSize: "0.72rem", fontWeight: 700 }}>
              Walk-in {100 - b2bRevSharePct}%
            </div>
            {b2bRevSharePct > 0 && (
              <div style={{ width: `${b2bRevSharePct}%`, background: "#1d4ed8", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: APP_FONT_STACK, fontSize: "0.72rem", fontWeight: 700 }}>
                B2B {b2bRevSharePct}%
              </div>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: "0.72rem", color: "rgba(15,23,42,0.55)", fontFamily: APP_FONT_STACK }}>
            <span>{fmtINR(allRevenue)} organic</span>
            <span>{fmtINR(b2bSalesValue)} B2B</span>
          </div>
        </div>

        {/* Vendor concentration */}
        {vendorList.length > 0 && (
          <div>
            <div style={styles.eyebrow}>Vendor Concentration</div>
            <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
              {vendorList.slice(0, 5).map((v) => {
                const p = b2bPurchaseValue > 0 ? Math.round((v.val / b2bPurchaseValue) * 100) : 0;
                const color = p > 70 ? "#dc2626" : p > 50 ? "#ea580c" : "#1d4ed8";
                return (
                  <div key={v.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: "0.78rem", color: "rgba(15,23,42,0.7)", fontFamily: APP_FONT_STACK }}>{v.name}</span>
                      <span style={{ fontFamily: APP_FONT_STACK, fontSize: "0.76rem", fontWeight: 700, color }}>{fmtINR(v.val)} ({p}%)</span>
                    </div>
                    <Bar value={v.val} max={b2bPurchaseValue} color={color} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={styles.decisionBox}>
          <div style={{ ...styles.eyebrow, color: "rgba(15,23,42,0.55)" }}>Decision Support</div>
          <div style={{ fontFamily: APP_FONT_STACK, fontSize: "0.82rem", color: "#0f172a", lineHeight: 1.5 }}>
            {b2bSalesValue === 0 && b2bPurchaseValue === 0
              ? "No B2B activity yet. Consider partnerships to extend reach without customer acquisition cost."
              : b2bRevSharePct > 0 && b2bRevSharePct < 25
                ? `B2B contributing ${b2bRevSharePct}% — healthy leverage without dependency. Vendor cost ${vendorCostPct}% of invoiced.`
                : b2bRevSharePct >= 25
                  ? `B2B dependence rising (${b2bRevSharePct}%). Strengthen organic walk-in to balance.`
                  : `Vendor cost ${vendorCostPct}% — monitor margin impact.`}
            {topVendorPct > 70 && vendorList.length > 0 && ` ⚠ Vendor "${vendorList[0].name}" is ${topVendorPct}% of outsourcing — find a backup.`}
            {b2bPayable > 0 && ` Pay vendors: ${fmtINR(b2bPayable)}.`}
            {b2bReceivable > 0 && ` Collect from partners: ${fmtINR(b2bReceivable)}.`}
          </div>
        </div>
      </div>

      {/* SECTION 6: EXPANSION READINESS */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Expansion Readiness</div>
        <div style={styles.sectionSubtitle}>The single number that tells you: should we open a second centre?</div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 1fr) 2fr", gap: 18, marginTop: 8 }}>
          {/* Score gauge */}
          <div style={{ background: `${readinessPhase.color}10`, border: `1px solid ${readinessPhase.color}33`, borderRadius: 12, padding: "20px 18px", textAlign: "center" }}>
            <div style={styles.eyebrow}>Readiness Score</div>
            <div style={{ fontFamily: APP_FONT_STACK, fontSize: "3.2rem", fontWeight: 700, color: readinessPhase.color, letterSpacing: "-0.04em", lineHeight: 1, margin: "8px 0" }}>
              {readinessScore}
              <span style={{ fontSize: "1rem", color: "rgba(15,23,42,0.4)", fontWeight: 500 }}> / 100</span>
            </div>
            <div style={{ ...styles.chip, display: "inline-block", color: readinessPhase.color, background: `${readinessPhase.color}1c`, border: `1px solid ${readinessPhase.color}55`, marginTop: 6 }}>
              {readinessPhase.label}
            </div>
            <div style={{ ...styles.label, marginTop: 12, fontSize: "0.74rem" }}>{readinessPhase.desc}</div>
          </div>

          {/* Factor breakdown */}
          <div>
            <div style={styles.eyebrow}>Factor Breakdown</div>
            <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
              {[
                { l: "Revenue Stability", v: f1_revStability, max: 15 },
                { l: "Collection Discipline", v: f2_collection, max: 15 },
                { l: "Operational Capacity", v: f3_capacity, max: 15 },
                { l: "Service Mix Maturity", v: f4_serviceMix, max: 15 },
                { l: "Vendor Stability", v: f5_vendor, max: 15 },
                { l: "Team Independence", v: f6_team, max: 10 },
                { l: "Cash Health", v: f7_cash, max: 15 },
              ].map((f) => {
                const p = f.v / f.max;
                const color = p >= 0.85 ? "#15803d" : p >= 0.6 ? "#ca8a04" : "#dc2626";
                return (
                  <div key={f.l}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: "0.76rem", color: "rgba(15,23,42,0.7)", fontFamily: APP_FONT_STACK }}>{f.l}</span>
                      <span style={{ fontFamily: APP_FONT_STACK, fontSize: "0.74rem", fontWeight: 700, color }}>{f.v}/{f.max}</span>
                    </div>
                    <Bar value={f.v} max={f.max} color={color} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={styles.decisionBox}>
          <div style={{ ...styles.eyebrow, color: "rgba(15,23,42,0.55)" }}>Recommended Action</div>
          <div style={{ fontFamily: APP_FONT_STACK, fontSize: "0.86rem", color: "#0f172a", lineHeight: 1.55, fontWeight: 500 }}>
            {readinessScore >= 75 && "✓ Open second centre in 60–90 days. Mirror playbook. Don't let centre 1 slip during transition."}
            {readinessScore >= 60 && readinessScore < 75 && "Prepare for expansion in 90 days: address weak factors below 11/15. Document SOPs, cross-train team, secure backup vendor."}
            {readinessScore >= 40 && readinessScore < 60 && "Hold expansion plans. Stabilize operations for 60–120 days, fix weak factors, then reassess."}
            {readinessScore < 40 && "Not ready. Foundational issues must be resolved (collections, backlog, or service mix). Reassess in 6 months."}
          </div>
          <div style={{ ...styles.label, marginTop: 8, lineHeight: 1.5 }}>
            Top gaps to address:
            {[
              { l: "Revenue Stability", v: f1_revStability, max: 15 },
              { l: "Collection Discipline", v: f2_collection, max: 15 },
              { l: "Operational Capacity", v: f3_capacity, max: 15 },
              { l: "Service Mix Maturity", v: f4_serviceMix, max: 15 },
              { l: "Vendor Stability", v: f5_vendor, max: 15 },
              { l: "Team Independence", v: f6_team, max: 10 },
              { l: "Cash Health", v: f7_cash, max: 15 },
            ].sort((a, b) => (a.v / a.max) - (b.v / b.max)).slice(0, 3).map((f) => ` ${f.l} (${f.v}/${f.max})`).join(",")}.
          </div>
        </div>
      </div>

      {/* SECTION 7: FORWARD VIEW */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Forward View</div>
        <div style={styles.sectionSubtitle}>Simple projections — what's coming if current trends hold.</div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 16 }}>
          <StatTile label="Conservative (30d)" value={fmtINR(conservativeProjection)} color="#ea580c" small />
          <StatTile label="Baseline (30d)" value={fmtINR(projectedRevenue30)} color="#1d4ed8" />
          <StatTile label="Upside (30d)" value={fmtINR(upsideProjection)} color="#15803d" small />
          <StatTile label="Confidence" value={last30.length >= 20 ? "HIGH" : last30.length >= 10 ? "MED" : "LOW"} color="#0f172a" small />
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ padding: "10px 12px", background: "rgba(21,128,61,0.06)", border: "1px solid rgba(21,128,61,0.2)", borderRadius: 8 }}>
            <div style={{ ...styles.eyebrow, color: "#15803d" }}>Revenue Trajectory</div>
            <div style={{ fontFamily: APP_FONT_STACK, fontSize: "0.82rem", color: "#0f172a", lineHeight: 1.5 }}>
              At Rs. {Math.round(dailyAvg).toLocaleString("en-IN")}/day average, next 30 days projects to {fmtINR(projectedRevenue30)}.
              {growthMoM > 0 ? ` Growing ${growthMoM}% MoM — sustainable trend.` : growthMoM < 0 ? ` Contracting ${Math.abs(growthMoM)}% — investigate cause.` : " Holding flat."}
            </div>
          </div>
          <div style={{ padding: "10px 12px", background: "rgba(29,78,216,0.06)", border: "1px solid rgba(29,78,216,0.2)", borderRadius: 8 }}>
            <div style={{ ...styles.eyebrow, color: "#1d4ed8" }}>Backlog Risk</div>
            <div style={{ fontFamily: APP_FONT_STACK, fontSize: "0.82rem", color: "#0f172a", lineHeight: 1.5 }}>
              {aging.over7 === 0 && backlogPct < 2
                ? "No accumulation risk. Current capacity comfortably handles intake."
                : `${aging.over7} tickets aging >7d. If trend continues, expect +${Math.round(aging.over7 * 1.5)} aging tickets in 30 days. Act before it doubles.`}
            </div>
          </div>
          <div style={{ padding: "10px 12px", background: "rgba(202,138,4,0.06)", border: "1px solid rgba(202,138,4,0.2)", borderRadius: 8 }}>
            <div style={{ ...styles.eyebrow, color: "#ca8a04" }}>Cash Health Outlook</div>
            <div style={{ fontFamily: APP_FONT_STACK, fontSize: "0.82rem", color: "#0f172a", lineHeight: 1.5 }}>
              Pending Rs. {Math.round(allPending).toLocaleString("en-IN")} ({Math.round(pendingPctOfMRR)}% of monthly).
              {pendingPctOfMRR < 15
                ? " Healthy. Working capital safe."
                : pendingPctOfMRR < 25
                  ? " Watch zone. Tighten collections to keep below 15%."
                  : " Risk zone. Working capital strain — recover pending balances urgently."}
              {b2bPayable > 0 && ` Vendor payable Rs. ${Math.round(b2bPayable).toLocaleString("en-IN")} due.`}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 8: HISTORICAL MONTHLY DETAIL */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Historical Monthly Detail</div>
        <div style={styles.sectionSubtitle}>Per-month breakdown of revenue, payment status, and ticket log.</div>

        {months.map((month) => {
          const mTickets = byMonth[month];
          const mRevenue = mTickets.reduce((s, t) => s + (Number(t.structured?.payment?.paidTotal) || 0), 0);
          const mPending = mTickets.reduce((s, t) => s + (Number(t.structured?.payment?.pendingBalance) || 0), 0);
          const mOpen = mTickets.filter((t) => t.status !== "Closed").length;
          const mClosed = mTickets.filter((t) => t.status === "Closed").length;
          const paid = mTickets.filter((t) => t.structured?.payment?.status === "Paid").length;
          const partial = mTickets.filter((t) => t.structured?.payment?.status === "Partial").length;
          const unpaid = mTickets.filter((t) => ["Unpaid", undefined].includes(t.structured?.payment?.status)).length;

          const label = (() => {
            if (!/^\d{4}-\d{2}$/.test(month)) return "Undated";
            const [y, m] = month.split("-");
            const parsedMonth = new Date(Number(y), Number(m) - 1, 1);
            if (Number.isNaN(parsedMonth.getTime())) return "Undated";
            return parsedMonth.toLocaleString("en-IN", { month: "long", year: "numeric" });
          })();

          return (
            <div key={month} style={{ marginTop: 14, padding: "14px 16px", background: "rgba(15,23,42,0.025)", border: "1px solid rgba(15,23,42,0.08)", borderRadius: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
                <div>
                  <div style={styles.eyebrow}>Period</div>
                  <div style={{ fontFamily: APP_FONT_STACK, fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>{label}</div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <StatTile label="Tickets" value={mTickets.length} small />
                  <StatTile label="Collected" value={fmtINR(mRevenue)} color="#15803d" small />
                  <StatTile label="Pending" value={fmtINR(mPending)} color="#dc2626" small />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 10 }}>
                <div style={{ padding: "8px 10px", background: "rgba(21,128,61,0.08)", borderRadius: 6, fontFamily: APP_FONT_STACK }}>
                  <div style={{ fontSize: "0.66rem", color: "#15803d", fontWeight: 700, letterSpacing: "0.1em" }}>PAID</div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: "#15803d" }}>{paid}</div>
                </div>
                <div style={{ padding: "8px 10px", background: "rgba(29,78,216,0.08)", borderRadius: 6, fontFamily: APP_FONT_STACK }}>
                  <div style={{ fontSize: "0.66rem", color: "#1d4ed8", fontWeight: 700, letterSpacing: "0.1em" }}>PARTIAL</div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: "#1d4ed8" }}>{partial}</div>
                </div>
                <div style={{ padding: "8px 10px", background: "rgba(220,38,38,0.08)", borderRadius: 6, fontFamily: APP_FONT_STACK }}>
                  <div style={{ fontSize: "0.66rem", color: "#dc2626", fontWeight: 700, letterSpacing: "0.1em" }}>UNPAID</div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: "#dc2626" }}>{unpaid}</div>
                </div>
                <div style={{ padding: "8px 10px", background: "rgba(15,23,42,0.05)", borderRadius: 6, fontFamily: APP_FONT_STACK }}>
                  <div style={{ fontSize: "0.66rem", color: "rgba(15,23,42,0.55)", fontWeight: 700, letterSpacing: "0.1em" }}>OPEN / CLOSED</div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>{mOpen} / {mClosed}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Customers ---
function CustomersWorkspace({ tickets, onDeleteCustomer, onNavigateTab }) {
  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });
  const [accessCodeDialog, setAccessCodeDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    actionLabel: "",
    code: "",
    error: "",
    onAuthorized: null,
  });

  const normalized = tickets.map((t) => t.structured ? t : withStructuredTicket(t));

  const customerMap = {};
  normalized.forEach((t) => {
    const phone = normalizePhoneValue(t.customerPhone) || null;
    const name = t.customerName || "Unknown";
    const key = phone || `nophone_${name}`;
    if (!customerMap[key]) customerMap[key] = { name, phone: phone || "", tickets: [] };
    customerMap[key].tickets.push(t);
    if (name !== "Unknown") customerMap[key].name = name;
  });
  const customers = Object.values(customerMap).sort((a, b) => b.tickets.length - a.tickets.length);
  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.phone.includes(q);
  });
  const selected = selectedKey ? customers.find((c) => (c.phone || `nophone_${c.name}`) === selectedKey) : null;
  const closeConfirmDialog = () => {
    setConfirmDialog({
      isOpen: false,
      title: "",
      message: "",
      onConfirm: null,
    });
  };
  const closeAccessCodeDialog = () => {
    setAccessCodeDialog({
      isOpen: false,
      title: "",
      message: "",
      actionLabel: "",
      code: "",
      error: "",
      onAuthorized: null,
    });
  };
  const submitDeleteAccessCode = () => {
    const verification = verifyDeleteAccess(accessCodeDialog.actionLabel, accessCodeDialog.code);
    if (!verification.ok) {
      setAccessCodeDialog((prev) => ({ ...prev, error: verification.message }));
      return;
    }
    const onAuthorized = accessCodeDialog.onAuthorized;
    closeAccessCodeDialog();
    onAuthorized?.();
  };
  const handleDeleteCustomer = (customer) => {
    if (typeof onDeleteCustomer !== "function" || !customer) return;
    const targetLabel = customer.phone
      ? `${customer.name} (+91 ${customer.phone})`
      : customer.name;
    setConfirmDialog({
      isOpen: true,
      title: "Delete Customer",
      message: `Delete customer ${targetLabel} and all linked tickets? This cannot be undone.`,
      onConfirm: () => {
        closeConfirmDialog();
        setAccessCodeDialog({
          isOpen: true,
          title: "Access Code Required",
          message: `Enter access code to delete customer ${customer.name}.`,
          actionLabel: `delete customer ${customer.name}`,
          code: "",
          error: "",
          onAuthorized: () => {
            onDeleteCustomer({ name: customer.name, phone: customer.phone || "" });
            setSelectedKey(null);
          },
        });
      },
    });
  };

  const eb = { fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.32em", textTransform: "uppercase", color: DS.wine, fontFamily: APP_BRAND_STACK, display: "block", marginBottom: 5 };
  const card = { background: "rgba(255,255,255,0.78)", border: "1px solid rgba(15,23,42,0.10)", borderRadius: 14, boxShadow: ELEVATION.raised };
  const inputSt = { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid rgba(15,23,42,0.12)", background: "rgba(255,255,255,0.86)", color: "#0f172a", outline: "none", fontFamily: APP_FONT_STACK, fontSize: "0.88rem" };

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>

      {/* Hero + summary */}
      <div style={{ ...card, padding: "22px 24px", marginBottom: 22, backgroundImage: "radial-gradient(circle at 5% 10%, rgba(59,130,246,0.14), transparent 32%), radial-gradient(circle at 92% 88%, rgba(37,99,235,0.08), transparent 30%)" }}>
        <span style={eb}>Customer Registry</span>
        <div style={{ fontFamily: APP_SERIF_STACK, fontSize: "clamp(1.4rem, 2.5vw, 2rem)", fontWeight: 300, color: "#0f172a", letterSpacing: "-0.02em", marginBottom: 18, lineHeight: 1 }}>
          Clients &amp; <em style={{ fontStyle: "italic", color: "rgba(15,23,42,0.45)" }}>Documents.</em>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 }}>
          {[
            { label: "Total Customers", value: customers.length, color: "#0f172a" },
            { label: "With Phone", value: customers.filter((c) => c.phone).length, color: "#2a5a8f" },
            { label: "Returning", value: customers.filter((c) => c.tickets.length > 1).length, color: "#2563eb" },
            { label: "Total Tickets", value: normalized.length, color: DS.wine },
          ].map((s) => (
            <div key={s.label} style={{ background: "rgba(15,23,42,0.04)", border: "1px solid rgba(15,23,42,0.08)", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontSize: "0.56rem", fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(15,23,42,0.38)", fontFamily: APP_BRAND_STACK, marginBottom: 5 }}>{s.label}</div>
              <div style={{ fontFamily: APP_SERIF_STACK, fontSize: "1.4rem", fontWeight: 300, color: s.color, lineHeight: 1 }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="csc-customers-grid"
        style={{ gridTemplateColumns: selected ? "minmax(280px,1fr) minmax(0,1.4fr)" : "1fr" }}
      >

        {/* Left: search + list */}
        <div>
          <div style={{ marginBottom: 12 }}>
            <input placeholder="Search by name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} style={inputSt} />
          </div>

          {filtered.length === 0 ? (
            <div style={{ ...card, padding: "20px 16px" }}>
              <div className="csc-empty-state">
                <div className="csc-empty-state-icon">CN</div>
                <div className="csc-empty-state-title">
                  {customers.length === 0 ? "No customers yet." : "No results."}
                </div>
                <div className="csc-empty-state-message">
                  {customers.length === 0
                    ? "Customers are created from tickets. Start with a service entry to build this list."
                    : "Try a different name or phone number to refine your search."}
                </div>
                {customers.length === 0 && (
                  <button
                    type="button"
                    className="csc-empty-state-cta"
                    onClick={() => onNavigateTab?.("entry")}
                  >
                    Create First Ticket
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {filtered.map((c) => {
                const key = c.phone || `nophone_${c.name}`;
                const isSelected = selectedKey === key;
                const totalPaid = c.tickets.reduce((s, t) => s + (Number(t.structured?.payment?.paidTotal) || 0), 0);
                const lastDate = c.tickets.map((t) => t.structured?.meta?.createdDate || "").sort().reverse()[0] || null;
                const allCats = [...new Set(c.tickets.flatMap((t) => t.structured?.meta?.serviceTypes || []))];
                const initials = c.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <div key={key} onClick={() => setSelectedKey(isSelected ? null : key)} style={{
                    ...card, padding: "14px 16px", cursor: "pointer",
                    border: isSelected ? "1px solid rgba(37,99,235,0.28)" : "1px solid rgba(15,23,42,0.09)",
                    background: isSelected ? "rgba(37,99,235,0.05)" : "rgba(255,255,255,0.75)",
                    boxShadow: isSelected ? "inset 3px 0 0 rgba(37,99,235,0.65), 0 4px 16px rgba(15,23,42,0.06)" : "0 4px 16px rgba(15,23,42,0.06)",
                    transition: "all 0.18s ease",
                  }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      {/* Avatar */}
                      <div style={{ width: 38, height: 38, borderRadius: "50%", background: isSelected ? "rgba(37,99,235,0.14)" : "rgba(15,23,42,0.07)", border: `1px solid ${isSelected ? "rgba(37,99,235,0.22)" : "rgba(15,23,42,0.10)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: APP_BRAND_STACK, fontWeight: 700, fontSize: "0.65rem", letterSpacing: "0.06em", color: isSelected ? DS.wine : "rgba(15,23,42,0.50)" }}>
                        {initials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                          <div>
                            <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "#0f172a", fontFamily: APP_FONT_STACK, lineHeight: 1.3 }}>{c.name}</div>
                            <div style={{ fontSize: "0.74rem", color: "rgba(15,23,42,0.48)", fontFamily: APP_MONO_STACK, marginTop: 1 }}>
                              {c.phone ? `+91 ${c.phone.slice(0,5)} ${c.phone.slice(5)}` : "No phone"}
                            </div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <div style={{ fontSize: "0.58rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: c.tickets.length > 1 ? "#2a5a8f" : "rgba(15,23,42,0.38)", background: c.tickets.length > 1 ? "rgba(42,90,143,0.09)" : "rgba(15,23,42,0.05)", borderRadius: 999, padding: "3px 9px", border: `1px solid ${c.tickets.length > 1 ? "rgba(42,90,143,0.22)" : "rgba(15,23,42,0.09)"}`, display: "inline-block", marginBottom: 4 }}>
                              {c.tickets.length} ticket{c.tickets.length !== 1 ? "s" : ""}
                            </div>
                            <div style={{ fontSize: "0.70rem", color: "rgba(15,23,42,0.40)", fontFamily: APP_MONO_STACK }}>Rs. {totalPaid.toLocaleString("en-IN")}</div>
                          </div>
                        </div>
                        <div style={{ marginTop: 8, display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
                          {allCats.map((cat) => (
                            <span key={cat} style={{ fontSize: "0.58rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: CAT_COLORS[cat] || "#888", background: `${CAT_COLORS[cat] || "#888"}18`, border: `1px solid ${CAT_COLORS[cat] || "#888"}28`, borderRadius: 999, padding: "2px 8px" }}>{cat}</span>
                          ))}
                          {lastDate && <span style={{ marginLeft: "auto", fontSize: "0.66rem", color: "rgba(15,23,42,0.32)", fontFamily: APP_FONT_STACK }}>Last: {lastDate}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: detail panel */}
        {selected && (() => {
          const totalPaid = selected.tickets.reduce((s, t) => s + (Number(t.structured?.payment?.paidTotal) || 0), 0);
          const totalPending = selected.tickets.reduce((s, t) => s + (Number(t.structured?.payment?.pendingBalance) || 0), 0);
          const allDocs = selected.tickets.flatMap((t) => (t.structured?.documents?.items || []).map((d) => ({ ...d, ticketNo: t.ticketNo, ticketDate: t.structured?.meta?.createdDate || "" })));
          const sortedTickets = [...selected.tickets].sort((a, b) => (b.structured?.meta?.createdDate || "").localeCompare(a.structured?.meta?.createdDate || ""));
          const initials = selected.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
          return (
            <div className="csc-sticky-panel">
              <div style={{ ...card, overflow: "hidden" }}>
                {/* Profile header */}
                <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(15,23,42,0.08)", backgroundImage: "radial-gradient(circle at 90% 0%, rgba(59,130,246,0.12), transparent 36%)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                      <div style={{ width: 50, height: 50, borderRadius: "50%", background: "rgba(37,99,235,0.10)", border: "1px solid rgba(37,99,235,0.20)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: APP_BRAND_STACK, fontWeight: 700, fontSize: "0.80rem", letterSpacing: "0.06em", color: DS.wine, flexShrink: 0 }}>
                        {initials}
                      </div>
                      <div>
                        <span style={eb}>Customer Profile</span>
                        <div style={{ fontFamily: APP_SERIF_STACK, fontSize: "1.35rem", fontWeight: 300, color: "#0f172a", letterSpacing: "-0.02em", lineHeight: 1.1 }}>{selected.name}</div>
                        <div style={{ fontSize: "0.76rem", color: "rgba(15,23,42,0.50)", fontFamily: APP_MONO_STACK, marginTop: 3 }}>
                          {selected.phone ? `+91 ${selected.phone.slice(0,5)} ${selected.phone.slice(5)}` : "No phone saved"}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <button
                        onClick={() => setSelectedKey(null)}
                        style={{ border: "1px solid rgba(15,23,42,0.12)", borderRadius: 999, padding: "7px 14px", background: "rgba(255,255,255,0.70)", color: "rgba(15,23,42,0.55)", fontFamily: APP_BRAND_STACK, fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", cursor: "pointer", flexShrink: 0 }}
                      >
                        Close
                      </button>
                      <button
                        onClick={() => handleDeleteCustomer(selected)}
                        style={{ border: "1px solid rgba(220,38,38,0.28)", borderRadius: 999, padding: "7px 14px", background: "rgba(220,38,38,0.08)", color: "#b91c1c", fontFamily: APP_BRAND_STACK, fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer", flexShrink: 0 }}
                      >
                        Delete Customer
                      </button>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 14 }}>
                    {[
                      { l: "Tickets", v: selected.tickets.length },
                      { l: "Collected", v: `Rs. ${totalPaid.toLocaleString("en-IN")}` },
                      { l: "Pending", v: `Rs. ${totalPending.toLocaleString("en-IN")}` },
                    ].map((s) => (
                      <div key={s.l} style={{ background: "rgba(15,23,42,0.04)", borderRadius: 10, padding: "9px 12px", border: "1px solid rgba(15,23,42,0.07)", textAlign: "center" }}>
                        <div style={{ fontSize: "0.56rem", fontWeight: 700, letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(15,23,42,0.36)", fontFamily: APP_BRAND_STACK, marginBottom: 4 }}>{s.l}</div>
                        <div style={{ fontFamily: APP_SERIF_STACK, fontSize: "1.05rem", fontWeight: 300, color: "#0f172a" }}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Documents section */}
                {allDocs.length > 0 && (
                  <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(15,23,42,0.07)" }}>
                    <span style={eb}>All Documents on File</span>
                    <div style={{ display: "grid", gap: 6, marginTop: 6 }}>
                      {allDocs.map((doc, di) => (
                        <div key={di} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 9, background: "rgba(15,23,42,0.03)", border: "1px solid rgba(15,23,42,0.07)" }}>
                          <div>
                            <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#0f172a", fontFamily: APP_FONT_STACK }}>{doc.name}</div>
                            <div style={{ fontSize: "0.66rem", color: "rgba(15,23,42,0.40)", fontFamily: APP_MONO_STACK, marginTop: 1 }}>{doc.ticketNo}  |  {doc.ticketDate || " - "}</div>
                          </div>
                          <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                            <span style={{ fontSize: "0.58rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: doc.required ? DS.wine : "rgba(15,23,42,0.40)", background: doc.required ? "rgba(37,99,235,0.07)" : "rgba(15,23,42,0.04)", borderRadius: 999, padding: "3px 8px", border: `1px solid ${doc.required ? "rgba(37,99,235,0.18)" : "rgba(15,23,42,0.08)"}` }}>{doc.required ? "Required" : "Optional"}</span>
                            <span style={{ fontSize: "0.58rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: doc.submitted ? "#2a6647" : "#2563eb", background: doc.submitted ? "rgba(42,102,71,0.08)" : "rgba(59,130,246,0.09)", borderRadius: 999, padding: "3px 8px", border: `1px solid ${doc.submitted ? "rgba(42,102,71,0.18)" : "rgba(59,130,246,0.22)"}` }}>{doc.submitted ? "Submitted" : "Pending"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ticket history */}
                <div style={{ padding: "14px 20px" }}>
                  <span style={eb}>Ticket History</span>
                  <div style={{ display: "grid", gap: 8, marginTop: 6 }}>
                    {sortedTickets.map((t) => {
                      const ps = t.structured?.payment?.status || "Unpaid";
                      const psColor = ps === "Paid" ? "#2a6647" : ps === "Partial" ? "#2563eb" : DS.wine;
                      const services = (t.structured?.services || []).map((s) => s.name).join(", ") || " - ";
                      return (
                        <div key={t.ticketNo} style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(15,23,42,0.09)", borderRadius: 10, padding: "12px 14px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                            <div>
                              <div style={{ fontFamily: APP_MONO_STACK, fontSize: "0.65rem", color: "rgba(15,23,42,0.35)", marginBottom: 2 }}>{t.ticketNo}  |  {t.structured?.meta?.createdDate || " - "}</div>
                              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0f172a", fontFamily: APP_FONT_STACK, lineHeight: 1.3 }}>{services}</div>
                              <div style={{ fontSize: "0.72rem", color: "rgba(15,23,42,0.45)", fontFamily: APP_FONT_STACK, marginTop: 2 }}>
                                {t.operator || " - "}  |  Rs. {(t.total || 0).toLocaleString("en-IN")}
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 5, alignItems: "flex-start", flexShrink: 0 }}>
                              <span style={{ fontSize: "0.58rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: psColor, background: `${psColor}15`, border: `1px solid ${psColor}28`, borderRadius: 999, padding: "3px 9px" }}>{ps}</span>
                              <span style={{ fontSize: "0.58rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: t.status === "Closed" ? DS.wine : "#2563eb", background: t.status === "Closed" ? "rgba(37,99,235,0.07)" : "rgba(59,130,246,0.09)", border: `1px solid ${t.status === "Closed" ? "rgba(37,99,235,0.18)" : "rgba(59,130,246,0.22)"}`, borderRadius: 999, padding: "3px 9px" }}>{t.status}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onCancel={closeConfirmDialog}
        onConfirm={() => confirmDialog.onConfirm?.()}
        confirmLabel="Continue"
      />
      <AccessCodeDialog
        isOpen={accessCodeDialog.isOpen}
        title={accessCodeDialog.title}
        message={accessCodeDialog.message}
        code={accessCodeDialog.code}
        error={accessCodeDialog.error}
        onCodeChange={(nextCode) => setAccessCodeDialog((prev) => ({ ...prev, code: nextCode, error: "" }))}
        onCancel={closeAccessCodeDialog}
        onConfirm={submitDeleteAccessCode}
      />
    </div>
  );
}

// --- Walk-in Intake Modal ---
function WalkInModal({ onClose, onStart }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [operator, setOperator] = useState(DEFAULT_OPERATOR);
  const [error, setError] = useState("");

  const handleStart = () => {
    const trimName = name.trim();
    const cleanPhone = phone.replace(/\D/g, "").slice(0, 10);
    if (!trimName) { setError("Customer name is required."); return; }
    if (cleanPhone && !/^[0-9]{10}$/.test(cleanPhone)) { setError("Phone must be exactly 10 digits."); return; }
    onStart({ name: trimName, phone: cleanPhone, operator });
  };
  const handleStartSubmit = (event) => {
    event.preventDefault();
    handleStart();
  };

  const inputSt = {
    width: "100%", padding: "11px 14px", borderRadius: 10,
    border: "1px solid rgba(15,23,42,0.14)", background: "rgba(255,255,255,0.86)",
    color: "#0f172a", outline: "none", fontFamily: APP_FONT_STACK, fontSize: "0.90rem",
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(15,17,22,0.55)", backdropFilter: "blur(6px)" }} />
      <div style={{
        position: "relative", zIndex: 1, width: "min(480px, 100%)",
        background: "#ffffff", border: "1px solid rgba(15,23,42,0.14)", borderRadius: 20,
        padding: "28px 24px", boxShadow: "0 28px 68px rgba(15,23,42,0.18)",
        backgroundImage: "radial-gradient(circle at 8% 8%, rgba(59,130,246,0.18), transparent 32%), radial-gradient(circle at 90% 90%, rgba(37,99,235,0.10), transparent 30%)",
      }}>
        <div style={{ fontSize: "0.58rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.32em", textTransform: "uppercase", color: DS.wine, marginBottom: 10 }}>
          Quick Walk-In
        </div>
        <div style={{ fontFamily: APP_SERIF_STACK, fontSize: "1.65rem", fontWeight: 300, letterSpacing: "-0.02em", color: "#0f172a", marginBottom: 6, lineHeight: 1.1 }}>
          Start <em style={{ fontStyle: "italic" }}>instantly.</em>
        </div>

        <form onSubmit={handleStartSubmit}>
          <div style={{ display: "grid", gap: 14, marginBottom: 18 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: "0.58rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: DS.wine }}>Customer Name *</span>
              <input autoFocus placeholder="e.g. Rahul Sharma" value={name} onChange={(e) => { setName(e.target.value); setError(""); }} style={inputSt} />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: "0.58rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(15,23,42,0.42)" }}>Phone (optional)</span>
              <input type="tel" placeholder="10-digit mobile" value={phone} onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setError(""); }} style={inputSt} />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: "0.58rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(15,23,42,0.42)" }}>Operator</span>
              <select value={operator} onChange={(e) => setOperator(e.target.value)} style={inputSt}>
                {OPERATORS.map((op) => <option key={op} value={op} style={MENU_OPTION_STYLE}>{op}</option>)}
              </select>
            </label>
          </div>

          {error && (
            <div style={{ marginBottom: 12, padding: "10px 14px", borderRadius: 10, background: "rgba(214,5,43,0.07)", border: "1px solid rgba(214,5,43,0.22)", color: "#1d4ed8", fontSize: "0.82rem", fontFamily: APP_FONT_STACK }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={{ border: "1px solid rgba(15,23,42,0.14)", borderRadius: 999, padding: "11px 20px", background: "rgba(255,255,255,0.72)", color: "rgba(15,23,42,0.70)", fontFamily: APP_BRAND_STACK, fontWeight: 700, fontSize: "0.58rem", letterSpacing: "0.22em", textTransform: "uppercase", cursor: "pointer" }}>
              Cancel
            </button>
            <button type="submit" style={{ border: "1px solid rgba(37,99,235,0.48)", borderRadius: 999, padding: "11px 24px", background: "rgba(37,99,235,0.13)", color: "#1e40af", fontFamily: APP_BRAND_STACK, fontWeight: 700, fontSize: "0.58rem", letterSpacing: "0.22em", textTransform: "uppercase", cursor: "pointer" }}>
              Start Ticket &rarr;
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- MAIN APP ---
export default function CSCBilling() {
  const [tab, setTab] = useState(() => getInitialActiveTab());
  const [isBootLoading, setIsBootLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => getStoredSidePanelExpanded());
  const [showDatabaseGate, setShowDatabaseGate] = useState(false);
  const [databaseUnlocked, setDatabaseUnlocked] = useState(false);
  const [unlockAnimPhase, setUnlockAnimPhase] = useState(null); // null | "running" | "success"
  const [services, setServices] = useState(() => (
    hydrateServices(readStoredJSON(STORAGE_KEYS.services, INITIAL_SERVICES))
  ));
  const [tickets, setTickets] = useState(() => (
    hydrateTickets(readStoredJSON(STORAGE_KEYS.tickets, []))
  ));
  const [b2bLedger, setB2BLedger] = useState(() => (
    hydrateB2BLedger(readStoredJSON(STORAGE_KEYS.b2bLedger, []))
  ));
  const [databaseRecords, setDatabaseRecords] = useState(() => (
    hydrateDatabaseRecords(readStoredJSON(STORAGE_KEYS.databaseRecords, []))
  ));
  const [customQuickLinks, setCustomQuickLinks] = useState(() => getStoredQuickLinks());
  const [showAddQuickLink, setShowAddQuickLink] = useState(false);
  const [quickLinkName, setQuickLinkName] = useState("");
  const [quickLinkUrl, setQuickLinkUrl] = useState("");
  const [quickLinkError, setQuickLinkError] = useState("");
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [entryWorkspaceKey, setEntryWorkspaceKey] = useState(0);
  const [cloudSyncState, setCloudSyncState] = useState(() => (supabase ? "connecting" : "local_only"));
  const [cloudLastSyncedAt, setCloudLastSyncedAt] = useState(null);
  const dbSyncedRef = useRef(false);
  const todayDateKey = getTicketCounterDateKey(new Date());
  const openTicketCount = tickets.filter((ticket) => ticket.status !== "Closed").length;
  const ticketRevenueToday = useMemo(() => (
    tickets.reduce((sum, ticket) => {
      const structured = ticket.structured || toStructuredTicket(ticket);
      const ticketDateKey = toIsoDateKey(structured.meta.createdDate || ticket.date || "");
      if (ticketDateKey !== todayDateKey) return sum;
      return sum + (Number(ticket.total) || Number(structured.payment.total) || 0);
    }, 0)
  ), [tickets, todayDateKey]);
  const b2bRevenueToday = useMemo(() => (
    b2bLedger.reduce((sum, entry) => {
      const normalizedEntry = normalizeB2BLedgerEntry(entry);
      if (normalizedEntry.flow !== "us_to_vendor") return sum;
      if (!normalizedEntry.includeInDailyRevenue) return sum;
      if (normalizedEntry.entryDate !== todayDateKey) return sum;
      return sum + (Number(normalizedEntry.amount) || 0);
    }, 0)
  ), [b2bLedger, todayDateKey]);
  const dailyRevenueTotal = ticketRevenueToday + b2bRevenueToday;
  const b2bPendingCount = b2bLedger.filter((entry) => (Number(entry.pendingAmount) || 0) > 0).length;
  const navBadges = {
    b2b: b2bPendingCount > 0 ? String(b2bPendingCount) : "",
    monthly: `${Math.max(1, tickets.length)}`,
    database: databaseUnlocked ? "Unlocked" : "2FA",
    log: openTicketCount > 0 ? String(openTicketCount) : String(tickets.length),
    quick_links: String(customQuickLinks.length + QUICK_LINK_DEFAULTS.length),
    doc_tools: String(Math.max(0, tickets.length)),
    services_dashboard: String(Math.max(0, services.length)),
  };
  const isHomeTab = tab === "home";
  const activeTabConfig = TAB_CONFIG.find((item) => item.id === tab) || TAB_CONFIG[0];
  const headerStats = [
    { label: "Daily Revenue", value: `Rs. ${Math.round(dailyRevenueTotal).toLocaleString("en-IN")}`, accent: "#0f172a" },
    { label: "B2B Sales Today", value: `Rs. ${Math.round(b2bRevenueToday).toLocaleString("en-IN")}`, accent: "#1d4ed8" },
    { label: "Open Tickets", value: String(openTicketCount), accent: openTicketCount > 0 ? "#1d4ed8" : "#0f172a" },
  ];
  const cloudSyncLabel = cloudSyncState === "local_only"
    ? "Local-only"
    : cloudSyncState === "syncing" || cloudSyncState === "connecting"
      ? "Syncing"
      : cloudSyncState === "synced"
        ? "Synced"
        : "Sync failed";
  const cloudSyncAccent = cloudSyncState === "synced"
    ? OPS.success
    : cloudSyncState === "sync_failed"
      ? OPS.danger
      : cloudSyncState === "local_only"
        ? OPS.textMuted
        : OPS.primary;
  const CSC_WHATSAPP_NUMBER = String(import.meta.env.VITE_CSC_WHATSAPP_NUMBER || "").replace(/\D/g, "");
  const quickLinks = [...QUICK_LINK_DEFAULTS, ...customQuickLinks];
  const navigateTab = (nextTab, mode = "push", options = {}) => {
    if (!TAB_CONFIG.some((item) => item.id === nextTab)) return;
    if (nextTab === "database" && !databaseUnlocked && !options.bypassDatabaseGate) {
      setShowDatabaseGate(true);
      return;
    }
    if (nextTab === tab) {
      if (nextTab === "home") setIsSidebarOpen(false);
      return;
    }
    const navigatingFromHome = tab === "home" && nextTab !== "home";
    if (nextTab === "home" || navigatingFromHome) {
      setIsSidebarOpen(false);
    }
    updateBrowserState({ tab: nextTab }, mode);
    setTab(nextTab);
  };

  const handleWalkInStart = ({ name, phone, operator }) => {
    writeStoredJSON(STORAGE_KEYS.ticketDraft, {
      step: 1,
      customerName: name,
      customerPhone: phone,
      operator,
      hasReference: false,
      referenceName: "",
      referenceLabel: "",
      items: [],
      documents: [],
    });
    setShowWalkIn(false);
    navigateTab("entry");
    setEntryWorkspaceKey((prev) => prev + 1);
  };

  const saveTicket = (ticket) => {
    const structured = withStructuredTicket(ticket);
    setTickets((prev) => [...prev, structured]);
    const phonesToSync = [];
    const holderPhone = String(structured.customerPhone || "").replace(/\D/g, "");
    const holderName = String(structured.customerName || "").trim();
    if (PHONE_REGEX.test(holderPhone)) {
      phonesToSync.push({ name: holderName, mobileNumber: holderPhone });
    }
    const refPhone = String(structured.referenceLabel || "").replace(/\D/g, "");
    const refName = String(structured.referenceName || "").trim();
    if (PHONE_REGEX.test(refPhone)) {
      phonesToSync.push({ name: refName || holderName, mobileNumber: refPhone });
    }
    if (phonesToSync.length > 0) {
      setDatabaseRecords((prev) => {
        const existingPhones = new Set(
          prev
            .filter((r) => r.sectionId === "mobile_numbers")
            .map((r) => String(r.values?.mobileNumber || "").replace(/\D/g, ""))
            .filter(Boolean)
        );
        const newRecords = phonesToSync
          .filter((p) => !existingPhones.has(p.mobileNumber))
          .map((p, i) => normalizeDatabaseRecordEntry({
            id: `db_record_phone_${Date.now()}_${i}`,
            sectionId: "mobile_numbers",
            values: { name: p.name, mobileNumber: p.mobileNumber },
            isActiveClient: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }, prev.length + i));
        return newRecords.length > 0 ? [...newRecords, ...prev] : prev;
      });
    }
  };
  const addB2BLedgerEntry = (entry) => {
    setB2BLedger((prev) => [...prev, normalizeB2BLedgerEntry(entry, prev.length)]);
  };
  const deleteB2BLedgerEntry = (entryId) => {
    setB2BLedger((prev) => prev.filter((entry) => entry.id !== entryId));
  };
  const upsertDatabaseRecord = (nextRecord) => {
    setDatabaseRecords((prev) => {
      const normalizedNext = normalizeDatabaseRecordEntry(nextRecord, prev.length);
      const matchIndex = prev.findIndex((record) => record.id === normalizedNext.id);
      if (matchIndex === -1) {
        return [normalizedNext, ...prev];
      }
      const updated = [...prev];
      updated[matchIndex] = normalizedNext;
      return updated;
    });
  };
  const deleteDatabaseRecord = (recordId) => {
    setDatabaseRecords((prev) => prev.filter((record) => record.id !== recordId));
  };
  const deleteTicket = (ticketNo) => {
    setTickets((prev) => prev.filter((ticket) => ticket.ticketNo !== ticketNo));
  };
  const deleteCustomerTickets = ({ name, phone }) => {
    const normalizedPhone = normalizePhoneValue(phone);
    const normalizedName = String(name || "").trim().toLowerCase();
    setTickets((prev) => prev.filter((ticket) => {
      const ticketPhone = normalizePhoneValue(ticket.customerPhone);
      if (normalizedPhone) {
        return ticketPhone !== normalizedPhone;
      }
      const ticketName = String(ticket.customerName || "Unknown").trim().toLowerCase();
      return Boolean(ticketPhone) || ticketName !== normalizedName;
    }));
  };
  const toggleTicketStatus = (ticketNo, status) => {
    setTickets((prev) => prev.map((t) => (
      t.ticketNo === ticketNo ? withStructuredTicket({ ...t, status, updatedAt: `${todayStr()} ${timeStr()}` }) : t
    )));
  };
  const toggleTaskDone = (ticketNo, taskIdx) => {
    setTickets((prev) => prev.map((t) => {
      if (t.ticketNo !== ticketNo) return t;
      return withStructuredTicket({
        ...t,
        items: t.items.map((it, idx) => idx === taskIdx ? { ...it, done: !it.done } : it),
        updatedAt: `${todayStr()} ${timeStr()}`,
      });
    }));
  };
  const updateTicket = (ticketNo, updates) => {
    setTickets((prev) => prev.map((t) => {
      if (t.ticketNo !== ticketNo) return t;
      return withStructuredTicket({
        ...t,
        ...updates,
        updatedAt: `${todayStr()} ${timeStr()}`,
      });
    }));
  };
  const addQuickLink = () => {
    const name = String(quickLinkName || "").trim();
    const url = normalizeExternalUrl(quickLinkUrl);
    if (!name || !url) {
      setQuickLinkError("Both name and URL are required.");
      return;
    }
    setCustomQuickLinks((prev) => [
      ...prev,
      {
        id: `custom_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name,
        url,
        isDefault: false,
      },
    ]);
    setQuickLinkName("");
    setQuickLinkUrl("");
    setQuickLinkError("");
    setShowAddQuickLink(false);
  };
  const removeQuickLink = (linkId) => {
    setCustomQuickLinks((prev) => prev.filter((item) => item.id !== linkId));
  };
  const openQuickLink = (url) => {
    if (typeof window === "undefined") return;
    const finalUrl = normalizeExternalUrl(url);
    if (!finalUrl) return;
    window.open(finalUrl, "_blank", "noopener,noreferrer");
  };
  const openCscWhatsApp = () => {
    if (typeof window === "undefined") return;
    const appUrl = CSC_WHATSAPP_NUMBER
      ? `whatsapp://send?phone=${CSC_WHATSAPP_NUMBER}`
      : "whatsapp://";
    const webUrl = CSC_WHATSAPP_NUMBER
      ? `https://wa.me/${CSC_WHATSAPP_NUMBER}`
      : "https://web.whatsapp.com";
    let fallbackTimer = null;
    const handleBlur = () => {
      if (fallbackTimer) {
        window.clearTimeout(fallbackTimer);
      }
    };
    window.addEventListener("blur", handleBlur, { once: true });
    fallbackTimer = window.setTimeout(() => {
      window.removeEventListener("blur", handleBlur);
      window.open(webUrl, "_blank", "noopener,noreferrer");
    }, 900);
    window.location.href = appUrl;
  };
  const handleDatabaseVerification = async ({ securityCode, authenticatorCode }) => {
    // Start hacker animation immediately — it renders over the modal.
    setUnlockAnimPhase("running");
    const result = await verifyDatabaseAccessOnServer({ securityCode, authenticatorCode });
    if (!result?.ok) {
      // Kill the animation; the modal stays mounted and will surface the error.
      setUnlockAnimPhase(null);
      return result;
    }
    // API succeeded. Lock in the unlocked state and cue the success reveal.
    // The modal will be closed after the animation finishes via handleUnlockAnimDone.
    setDatabaseUnlocked(true);
    setUnlockAnimPhase("success");
    return { ok: true };
  };

  const handleUnlockAnimDone = () => {
    setUnlockAnimPhase(null);
    setShowDatabaseGate(false);
    navigateTab("database", "push", { bypassDatabaseGate: true });
  };
  const lockDatabaseAccess = async () => {
    try {
      await fetch("/api/database-auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (_error) {
      // Ignore network errors and still clear local lock state.
    }
    setDatabaseUnlocked(false);
    setShowDatabaseGate(false);
    navigateTab("home", "replace");
  };

  useEffect(() => {
    const timer = window.setTimeout(() => setIsBootLoading(false), 1350);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function syncDatabaseSession() {
      const session = await fetchDatabaseSessionStatus();
      if (cancelled) return;
      setDatabaseUnlocked(Boolean(session?.authenticated));
    }
    syncDatabaseSession();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    updateBrowserState({ tab }, "replace");
  }, []);

  useEffect(() => {
    const handlePopState = (event) => {
      const nextTab = event.state?.tab;
      if (TAB_CONFIG.some((item) => item.id === nextTab)) {
        if (nextTab === "database" && !databaseUnlocked) {
          setShowDatabaseGate(true);
          setTab("home");
          return;
        }
        setTab(nextTab);
      }
    };
    if (typeof window === "undefined") return undefined;
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [databaseUnlocked]);

  useEffect(() => {
    writeStoredJSON(STORAGE_KEYS.activeTab, tab);
  }, [tab]);

  useEffect(() => {
    if (!isHomeTab) return;
    setShowWalkIn(false);
    setIsSidebarOpen(false);
  }, [isHomeTab]);

  useEffect(() => {
    writeStoredJSON(STORAGE_KEYS.sidePanelExpanded, isSidebarOpen);
  }, [isSidebarOpen]);

  useEffect(() => {
    if (typeof window === "undefined" || !isSidebarOpen || isHomeTab) return undefined;
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isSidebarOpen, isHomeTab]);

  useEffect(() => {
    let cancelled = false;
    async function loadFromSupabase() {
      if (!supabase) {
        if (!cancelled) {
          dbSyncedRef.current = true;
          setCloudSyncState("local_only");
        }
        return;
      }

      setCloudSyncState("connecting");
      const [
        remoteTicketsResult,
        remoteServicesResult,
        remoteQuickLinksResult,
        remoteB2BLedgerResult,
        remoteDatabaseRecordsResult,
      ] = await Promise.all([
        dbLoad("tickets"),
        dbLoad("services"),
        dbLoad("quick_links"),
        dbLoad("b2b_ledger"),
        dbLoad("database_records"),
      ]);

      if (cancelled) return;
      let syncFailed = [
        remoteTicketsResult,
        remoteServicesResult,
        remoteQuickLinksResult,
        remoteB2BLedgerResult,
        remoteDatabaseRecordsResult,
      ].some((result) => !result?.ok);

      const localTickets = readStoredJSON(STORAGE_KEYS.tickets, []);
      const localServices = readStoredJSON(STORAGE_KEYS.services, []);
      const localQuickLinks = getStoredQuickLinks();
      const localB2BLedger = readStoredJSON(STORAGE_KEYS.b2bLedger, []);
      const localDatabaseRecords = readStoredJSON(STORAGE_KEYS.databaseRecords, []);
      const remoteTickets = remoteTicketsResult?.value;
      const remoteServices = remoteServicesResult?.value;
      const remoteQuickLinks = remoteQuickLinksResult?.value;
      const remoteB2BLedger = remoteB2BLedgerResult?.value;
      const remoteDatabaseRecords = remoteDatabaseRecordsResult?.value;

      if (Array.isArray(remoteTickets) && remoteTickets.length > 0) {
        setTickets(hydrateTickets(remoteTickets));
        writeStoredJSON(STORAGE_KEYS.tickets, remoteTickets);
      } else if (Array.isArray(localTickets) && localTickets.length > 0) {
        const seedTicketsResult = await dbSave("tickets", localTickets);
        if (!seedTicketsResult?.ok) syncFailed = true;
      }

      if (Array.isArray(remoteServices) && remoteServices.length > 0) {
        setServices(hydrateServices(remoteServices));
        writeStoredJSON(STORAGE_KEYS.services, remoteServices);
      } else if (Array.isArray(localServices) && localServices.length > 0) {
        const seedServicesResult = await dbSave("services", localServices);
        if (!seedServicesResult?.ok) syncFailed = true;
      }

      if (Array.isArray(remoteQuickLinks) && remoteQuickLinks.length > 0) {
        setCustomQuickLinks(normalizeQuickLinksList(remoteQuickLinks));
        writeStoredJSON(STORAGE_KEYS.quickLinks, remoteQuickLinks);
      } else if (Array.isArray(localQuickLinks) && localQuickLinks.length > 0) {
        const seedQuickLinksResult = await dbSave("quick_links", localQuickLinks);
        if (!seedQuickLinksResult?.ok) syncFailed = true;
      }

      if (Array.isArray(remoteB2BLedger) && remoteB2BLedger.length > 0) {
        const hydratedRemoteLedger = hydrateB2BLedger(remoteB2BLedger);
        setB2BLedger(hydratedRemoteLedger);
        writeStoredJSON(STORAGE_KEYS.b2bLedger, serializeB2BLedger(hydratedRemoteLedger));
      } else if (Array.isArray(localB2BLedger) && localB2BLedger.length > 0) {
        const hydratedLocalLedger = hydrateB2BLedger(localB2BLedger);
        const seedB2BLedgerResult = await dbSave("b2b_ledger", serializeB2BLedger(hydratedLocalLedger));
        if (!seedB2BLedgerResult?.ok) syncFailed = true;
      }

      if (Array.isArray(remoteDatabaseRecords) && remoteDatabaseRecords.length > 0) {
        const hydratedRemoteRecords = hydrateDatabaseRecords(remoteDatabaseRecords);
        setDatabaseRecords(hydratedRemoteRecords);
        writeStoredJSON(STORAGE_KEYS.databaseRecords, serializeDatabaseRecords(hydratedRemoteRecords));
      } else if (Array.isArray(localDatabaseRecords) && localDatabaseRecords.length > 0) {
        const hydratedLocalRecords = hydrateDatabaseRecords(localDatabaseRecords);
        const seedDatabaseRecordsResult = await dbSave("database_records", serializeDatabaseRecords(hydratedLocalRecords));
        if (!seedDatabaseRecordsResult?.ok) syncFailed = true;
      }

      if (!cancelled) {
        dbSyncedRef.current = true;
        if (syncFailed) {
          setCloudSyncState("sync_failed");
        } else {
          setCloudSyncState("synced");
          setCloudLastSyncedAt(new Date());
        }
      }
    }
    loadFromSupabase();
    return () => {
      cancelled = true;
    };
  }, []);

  useDebouncedStoredJSON(STORAGE_KEYS.services, services, 180);
  useDebouncedStoredJSON(STORAGE_KEYS.tickets, serializeTickets(tickets), 180);
  useDebouncedStoredJSON(STORAGE_KEYS.b2bLedger, serializeB2BLedger(b2bLedger), 180);
  useDebouncedStoredJSON(STORAGE_KEYS.quickLinks, customQuickLinks, 180);
  useDebouncedStoredJSON(STORAGE_KEYS.databaseRecords, serializeDatabaseRecords(databaseRecords), 180);

  useEffect(() => {
    if (!dbSyncedRef.current || !supabase) return undefined;
    let cancelled = false;
    async function syncServices() {
      setCloudSyncState("syncing");
      const result = await dbSave("services", services);
      if (cancelled) return;
      if (!result?.ok) {
        setCloudSyncState("sync_failed");
        return;
      }
      setCloudSyncState("synced");
      setCloudLastSyncedAt(new Date());
    }
    syncServices();
    return () => {
      cancelled = true;
    };
  }, [services]);

  useEffect(() => {
    if (!dbSyncedRef.current || !supabase) return undefined;
    let cancelled = false;
    async function syncTickets() {
      setCloudSyncState("syncing");
      const result = await dbSave("tickets", serializeTickets(tickets));
      if (cancelled) return;
      if (!result?.ok) {
        setCloudSyncState("sync_failed");
        return;
      }
      setCloudSyncState("synced");
      setCloudLastSyncedAt(new Date());
    }
    syncTickets();
    return () => {
      cancelled = true;
    };
  }, [tickets]);

  useEffect(() => {
    if (!dbSyncedRef.current || !supabase) return undefined;
    let cancelled = false;
    async function syncQuickLinks() {
      setCloudSyncState("syncing");
      const result = await dbSave("quick_links", customQuickLinks);
      if (cancelled) return;
      if (!result?.ok) {
        setCloudSyncState("sync_failed");
        return;
      }
      setCloudSyncState("synced");
      setCloudLastSyncedAt(new Date());
    }
    syncQuickLinks();
    return () => {
      cancelled = true;
    };
  }, [customQuickLinks]);

  useEffect(() => {
    if (!dbSyncedRef.current || !supabase) return undefined;
    let cancelled = false;
    async function syncB2BLedger() {
      setCloudSyncState("syncing");
      const result = await dbSave("b2b_ledger", serializeB2BLedger(b2bLedger));
      if (cancelled) return;
      if (!result?.ok) {
        setCloudSyncState("sync_failed");
        return;
      }
      setCloudSyncState("synced");
      setCloudLastSyncedAt(new Date());
    }
    syncB2BLedger();
    return () => {
      cancelled = true;
    };
  }, [b2bLedger]);

  useEffect(() => {
    if (!dbSyncedRef.current || !supabase) return undefined;
    let cancelled = false;
    async function syncDatabaseRecords() {
      setCloudSyncState("syncing");
      const result = await dbSave("database_records", serializeDatabaseRecords(databaseRecords));
      if (cancelled) return;
      if (!result?.ok) {
        setCloudSyncState("sync_failed");
        return;
      }
      setCloudSyncState("synced");
      setCloudLastSyncedAt(new Date());
    }
    syncDatabaseRecords();
    return () => {
      cancelled = true;
    };
  }, [databaseRecords]);

  if (isBootLoading) {
    return <BootLoadingScreen />;
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f8fbff",
      fontFamily: APP_FONT_STACK,
      color: "#0f172a",
      display: "flex",
      flexDirection: "column",
    }}>
      {showWalkIn && <WalkInModal onClose={() => setShowWalkIn(false)} onStart={handleWalkInStart} />}
      {showDatabaseGate && (
        <DatabaseAccessModal
          onClose={() => setShowDatabaseGate(false)}
          onVerify={handleDatabaseVerification}
        />
      )}
      {unlockAnimPhase && (
        <HackerUnlockAnimation
          phase={unlockAnimPhase}
          onDone={handleUnlockAnimDone}
        />
      )}
      <style>{`
        :root { color-scheme: light; }
        * { box-sizing: border-box; }
        html, body {
          margin: 0;
          background: #eef2f7;
          color: #0d1b2a;
        }
        body, button, input, select, textarea {
          font-family: ${APP_FONT_STACK};
          color: #0d1b2a;
          font-style: normal;
        }
        h1, h2, h3, h4, h5, h6 {
          font-family: ${APP_BRAND_STACK};
          font-style: normal;
          color: #0d1b2a;
          margin: 0;
        }
        button, [role="button"], input, select, textarea {
          transition: background-color 150ms ease, border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease;
        }
        button:focus-visible,
        [role="button"]:focus-visible,
        input:focus-visible,
        select:focus-visible,
        textarea:focus-visible {
          outline: 2px solid transparent;
          box-shadow: 0 0 0 3px rgba(26,86,219,0.28);
        }
        .csc-hover-surface-row:hover,
        .csc-hover-surface-row:focus-within {
          background: rgba(255,255,255,0.82) !important;
        }
        .csc-hover-soft-row:hover,
        .csc-hover-soft-row:focus-within {
          background: rgba(255,255,255,0.60) !important;
        }
        .csc-hover-accent:hover,
        .csc-hover-accent:focus-visible {
          background: rgba(26,86,219,0.10) !important;
        }
        .csc-empty-state {
          text-align: center;
          border: 1px dashed rgba(13,27,42,0.13);
          border-radius: 12px;
          background: #ffffff;
          padding: 24px 20px;
        }
        .csc-empty-state-icon {
          width: 36px;
          height: 36px;
          margin: 0 auto 10px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          font-size: 16px;
          color: #1a56db;
          border: 1px solid rgba(26,86,219,0.22);
          background: rgba(26,86,219,0.08);
        }
        .csc-empty-state-title {
          font-size: 0.94rem;
          font-weight: 700;
          color: #0d1b2a;
          font-family: ${APP_BRAND_STACK};
          margin-bottom: 6px;
        }
        .csc-empty-state-message {
          font-size: 0.84rem;
          line-height: 1.65;
          color: rgba(13,27,42,0.52);
          font-family: ${APP_FONT_STACK};
          margin-bottom: 14px;
        }
        .csc-empty-state-cta {
          border: 1px solid rgba(26,86,219,0.28);
          border-radius: 8px;
          background: rgba(26,86,219,0.09);
          color: #1a56db;
          font-family: ${APP_BRAND_STACK};
          font-weight: 700;
          font-size: 0.72rem;
          letter-spacing: 0.06em;
          padding: 8px 14px;
          cursor: pointer;
        }
        .csc-ticket-dashboard-grid {
          display: grid;
          grid-template-columns: minmax(320px, 1fr) minmax(0, 1.3fr);
        }
        .csc-customers-grid {
          display: grid;
          gap: 16px;
          align-items: start;
        }
        .csc-db-main-grid {
          display: grid;
          gap: 12px;
          grid-template-columns: minmax(280px, 420px) minmax(420px, 1fr);
        }
        .csc-record-row {
          display: grid;
          grid-template-columns: 160px 1fr;
          gap: 8px;
        }
        .csc-sticky-panel {
          position: sticky;
          top: 80px;
        }
        select option {
          background: #ffffff;
          color: #0d1b2a;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes subtleGlow {
          from { box-shadow: 0 0 0 0 rgba(26,86,219,0); }
          to   { box-shadow: 0 0 22px 4px rgba(26,86,219,0.10); }
        }
        .csc-sidebar-nav::-webkit-scrollbar { width: 4px; }
        .csc-sidebar-nav::-webkit-scrollbar-track { background: transparent; }
        .csc-sidebar-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 999px; }
        .csc-content-scroll::-webkit-scrollbar { width: 4px; }
        .csc-content-scroll::-webkit-scrollbar-track { background: transparent; }
        .csc-content-scroll::-webkit-scrollbar-thumb { background: rgba(13,27,42,0.11); border-radius: 999px; }
        input[type="checkbox"] { accent-color: #1a56db; cursor: pointer; }
        input::placeholder, textarea::placeholder {
          color: rgba(13,27,42,0.38);
          font-style: normal;
        }
        @media (max-width: 1100px) {
          .csc-ticket-dashboard-grid { grid-template-columns: 1fr !important; }
          .csc-db-main-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 1024px) {
          .csc-customers-grid { grid-template-columns: 1fr !important; }
          .csc-sticky-panel { position: static !important; top: auto !important; }
        }
        @media (max-width: 720px) {
          .csc-record-row { grid-template-columns: 1fr !important; gap: 4px !important; }
        }
        @media print {
          @page { margin: 8mm; }
          html, body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body * { visibility: hidden !important; }
          #receipt, #receipt * { visibility: visible !important; }
          #receipt {
            position: fixed !important;
            top: 0 !important; left: 0 !important; right: 0 !important;
            margin: 0 auto !important;
            width: min(420px, 100%) !important;
            max-width: 420px !important;
            border: 1px solid #D1D5DB !important;
            border-radius: 20px !important;
            background: white !important;
            box-shadow: none !important;
            overflow: visible !important;
          }
          button { display: none !important; }
          .csc-sidebar { display: none !important; }
        }
      `}</style>

      {/* -- App Shell: Sidebar + Main -- */}
      <div style={{ display: "flex", minHeight: "100vh", position: "relative" }}>

        {!isHomeTab && isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(13,27,42,0.24)",
              zIndex: 30,
            }}
            aria-label="Close navigation menu overlay"
          />
        )}

        {!isHomeTab && (
          <WorkspaceSidebar
            activeTab={tab}
            onNavigate={(nextTab) => {
              navigateTab(nextTab);
              setIsSidebarOpen(false);
            }}
            onOpenWhatsApp={openCscWhatsApp}
            badgeMap={navBadges}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
        )}

        {/* -- Main Content Area -- */}
        <main style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          background: "#eef2f7",
          position: "relative",
        }}>
          {/* Subtle grid texture */}
          <div style={{ display: isHomeTab || tab === "entry" ? "none" : "block", position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.12, backgroundImage: "linear-gradient(90deg, rgba(13,27,42,0.05) 1px, transparent 1px), linear-gradient(rgba(13,27,42,0.05) 1px, transparent 1px)", backgroundSize: "80px 80px" }} />

          {!isHomeTab && (
          <>
          {/* Top bar */}
          <header style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            background: `rgba(255,255,255,0.96)`,
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderBottom: `1px solid rgba(13,27,42,0.09)`,
            padding: "0 28px",
            height: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}>
            {/* Active view label */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={() => setIsSidebarOpen((prev) => !prev)}
                style={{
                  border: "1px solid rgba(13,27,42,0.13)",
                  borderRadius: 7,
                  padding: "5px 10px",
                  background: "#f4f7fa",
                  color: "rgba(13,27,42,0.70)",
                  fontFamily: APP_BRAND_STACK,
                  fontWeight: 700,
                  fontSize: "0.68rem",
                  letterSpacing: "0.04em",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                }}
                aria-label={isSidebarOpen ? "Hide navigation menu" : "Open navigation menu"}
                title={isSidebarOpen ? "Hide navigation menu" : "Open navigation menu"}
              >
                {isSidebarOpen ? (
                  <span style={{ fontSize: "0.7rem", lineHeight: 1 }}>{"<"}</span>
                ) : (
                  <span style={{ display: "grid", gap: 2 }}>
                    <span style={{ width: 10, height: 1.5, borderRadius: 999, background: "rgba(13,27,42,0.65)", display: "block" }} />
                    <span style={{ width: 10, height: 1.5, borderRadius: 999, background: "rgba(13,27,42,0.65)", display: "block" }} />
                    <span style={{ width: 10, height: 1.5, borderRadius: 999, background: "rgba(13,27,42,0.65)", display: "block" }} />
                  </span>
                )}
                {isSidebarOpen ? "Hide Menu" : "Menu"}
              </button>
              <button
                onClick={() => navigateTab("home")}
                style={{
                  border: "1px solid rgba(26,86,219,0.24)",
                  borderRadius: 7,
                  padding: "5px 10px",
                  background: "rgba(26,86,219,0.08)",
                  color: "#1a56db",
                  fontFamily: APP_BRAND_STACK,
                  fontWeight: 700,
                  fontSize: "0.68rem",
                  letterSpacing: "0.04em",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Home
              </button>
            </div>

            {/* Stats strip + WhatsApp CTA */}
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              {headerStats.map((stat) => (
                <div key={stat.label} style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.60rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(13,27,42,0.40)", fontFamily: APP_BRAND_STACK, marginBottom: 2 }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: "0.86rem", fontWeight: 700, color: stat.accent || "#0d1b2a", fontFamily: APP_MONO_STACK, letterSpacing: "-0.01em" }}>
                    {stat.value}
                  </div>
                </div>
              ))}
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 7, padding: "4px 9px", border: `1px solid ${cloudSyncState === "sync_failed" ? "rgba(220,38,38,0.26)" : cloudSyncState === "synced" ? "rgba(5,150,105,0.26)" : "rgba(13,27,42,0.13)"}`, background: cloudSyncState === "sync_failed" ? "rgba(220,38,38,0.07)" : cloudSyncState === "synced" ? "rgba(5,150,105,0.07)" : "rgba(13,27,42,0.04)" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: cloudSyncAccent, display: "inline-block" }} />
                <span style={{ fontSize: "0.68rem", fontWeight: 700, color: cloudSyncAccent, fontFamily: APP_BRAND_STACK, letterSpacing: "0.06em" }}>
                  {cloudSyncLabel}
                </span>
                {cloudSyncState === "synced" && cloudLastSyncedAt && (
                  <span style={{ fontSize: "0.68rem", color: "rgba(13,27,42,0.40)", fontFamily: APP_MONO_STACK }}>
                    {formatSyncTime(cloudLastSyncedAt)}
                  </span>
                )}
              </div>
              {tab === "database" && databaseUnlocked && (
                <button
                  onClick={lockDatabaseAccess}
                  style={{
                    border: "1px solid rgba(220,38,38,0.34)",
                    borderRadius: 999,
                    padding: "10px 16px",
                    background: "rgba(220,38,38,0.10)",
                    color: "#991b1b",
                    fontFamily: APP_BRAND_STACK,
                    fontWeight: 700,
                    fontSize: "0.56rem",
                    letterSpacing: "0.20em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.22s ease",
                  }}
                >
                  Lock Database
                </button>
              )}
              <button
                onClick={openCscWhatsApp}
                style={{
                  border: "1px solid rgba(22,163,74,0.40)",
                  borderRadius: 999,
                  padding: "10px 18px",
                  background: "rgba(22,163,74,0.11)",
                  color: "#166534",
                  fontFamily: APP_BRAND_STACK,
                  fontWeight: 700,
                  fontSize: "0.56rem",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.22s ease",
                }}
              >
                Open WhatsApp
              </button>
            </div>
          </header>

          {/* Page title / hero area */}
          <div style={{
            padding: "22px 32px 16px",
            borderBottom: `1px solid rgba(13,27,42,0.09)`,
            background: "#ffffff",
            position: "relative",
            zIndex: 1,
          }}>
            <div style={{ width: "100%", maxWidth: 1240, margin: "0 auto", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
              <div>
                <div style={{
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "rgba(13,27,42,0.42)",
                  fontFamily: APP_BRAND_STACK,
                  marginBottom: 8,
                }}>
                  CSC Centre Workspace
                </div>
                <h1 style={{
                  margin: 0,
                  fontFamily: APP_BRAND_STACK,
                  fontSize: "clamp(1.4rem, 2.4vw, 1.9rem)",
                  fontWeight: 800,
                  lineHeight: 1.0,
                  letterSpacing: "-0.01em",
                  color: "#0d1b2a",
                }}>
                  {activeTabConfig.label}
                </h1>
              </div>
              {tab === "doc_tools" && (
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 10px",
                  border: "1px solid rgba(22,101,52,0.20)",
                  background: "rgba(22,101,52,0.07)",
                  color: "#166534",
                  borderRadius: 8,
                  fontFamily: APP_BRAND_STACK,
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  flexShrink: 0,
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
                    <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5" />
                  </svg>
                  Files stay on this device
                </div>
              )}
            </div>
          </div>
          </>
          )}

          {/* Tab Content */}
          <div className="csc-content-scroll" style={{
            flex: 1,
            padding: isHomeTab ? 0 : "24px 28px 48px",
            overflowY: "auto",
            position: "relative",
            zIndex: 1,
          }}>
            {isHomeTab && (
              <HomeLaunchpad
                onOpenSection={(sectionId) => navigateTab(sectionId)}
              />
            )}
            <TabPanel active={tab === "entry"}>
              <div style={{ width: "100%", maxWidth: 1240, margin: "0 auto" }}>
                <TicketWorkspace key={entryWorkspaceKey} services={services} tickets={tickets} onSaveTicket={saveTicket} onNavigateTab={navigateTab} isActive={tab === "entry"} />
              </div>
            </TabPanel>
            <TabPanel active={tab === "log"}>
              <TicketDashboard
                tickets={tickets}
                onToggleTicketStatus={toggleTicketStatus}
                onToggleTaskDone={toggleTaskDone}
                onUpdateTicket={updateTicket}
                onDeleteTicket={deleteTicket}
                onNavigateTab={navigateTab}
              />
            </TabPanel>
            <TabPanel active={tab === "b2b"}>
              <B2BWorkspace
                ledger={b2bLedger}
                onAddLedgerEntry={addB2BLedgerEntry}
                onDeleteLedgerEntry={deleteB2BLedgerEntry}
              />
            </TabPanel>
            <TabPanel active={tab === "monthly"}>
              <MonthlyOverview tickets={tickets} b2bLedger={b2bLedger} onNavigateTab={navigateTab} />
            </TabPanel>
            <TabPanel active={tab === "database"}>
              <DatabaseWorkspace
                tickets={tickets}
                services={services}
                b2bLedger={b2bLedger}
                records={databaseRecords}
                onUpsertRecord={upsertDatabaseRecord}
                onDeleteRecord={deleteDatabaseRecord}
                cloudSyncState={cloudSyncState}
              />
            </TabPanel>
            <TabPanel active={tab === "quick_links"}>
              <QuickLinksWorkspace
                quickLinks={quickLinks}
                showAddQuickLink={showAddQuickLink}
                onToggleAddQuickLink={() => {
                  setShowAddQuickLink((prev) => !prev);
                  setQuickLinkError("");
                }}
                quickLinkName={quickLinkName}
                setQuickLinkName={setQuickLinkName}
                quickLinkUrl={quickLinkUrl}
                setQuickLinkUrl={setQuickLinkUrl}
                quickLinkError={quickLinkError}
                onSaveQuickLink={addQuickLink}
                onRemoveQuickLink={removeQuickLink}
                onOpenQuickLink={openQuickLink}
              />
            </TabPanel>
            <TabPanel active={tab === "doc_tools"}>
              <DocumentToolsWorkspace />
            </TabPanel>
            <TabPanel active={tab === "services_dashboard"}>
              <ServicesDashboardWorkspace />
            </TabPanel>
            <TabPanel active={tab === "customers"}>
              <CustomersWorkspace tickets={tickets} onDeleteCustomer={deleteCustomerTickets} onNavigateTab={navigateTab} />
            </TabPanel>
          </div>
        </main>

      </div>
    </div>
  );
}








