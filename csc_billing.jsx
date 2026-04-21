import React, { useEffect, useMemo, useRef, useState } from "react";
import { dbLoad, dbSave, supabase } from "./supabase.js";
import { DS } from "./design-tokens.js";

const INITIAL_SERVICES = [
  { id: "aadhaar", name: "Aadhaar Update / Correction", category: "Government ID", price: 0, unit: "per application", variable: false },
  { id: "pan_new", name: "PAN Card (New)", category: "Government ID", price: 0, unit: "per application", variable: false },
  { id: "pan_correction", name: "PAN Card (Correction)", category: "Government ID", price: 0, unit: "per application", variable: false },
  { id: "passport", name: "Passport Form Filling", category: "Government ID", price: 0, unit: "per application", variable: false },
  { id: "voter_id", name: "Voter ID Card", category: "Government ID", price: 0, unit: "per application", variable: false },
  { id: "driving_license", name: "Driving License", category: "Government ID", price: 0, unit: "per application", variable: false },
  { id: "income_cert", name: "Income Certificate", category: "Certificates", price: 0, unit: "per certificate", variable: false },
  { id: "caste_cert", name: "Caste Certificate", category: "Certificates", price: 0, unit: "per certificate", variable: false },
  { id: "domicile_cert", name: "Domicile Certificate", category: "Certificates", price: 0, unit: "per certificate", variable: false },
  { id: "date_cert", name: "Date Certificate", category: "Certificates", price: 0, unit: "per certificate", variable: false },
  { id: "life_cert", name: "Life Certificate", category: "Certificates", price: 0, unit: "per certificate", variable: false },
  { id: "ayushman", name: "Ayushman Card", category: "Certificates", price: 0, unit: "per card", variable: false },
  { id: "affidavit", name: "Affidavit / Stamp Paper", category: "Legal & Docs", price: 0, unit: "per document", variable: true },
  { id: "gazette", name: "Gazette Notification", category: "Legal & Docs", price: 0, unit: "per application", variable: true },
  { id: "rent_agreement", name: "Rent Agreement", category: "Legal & Docs", price: 0, unit: "per agreement", variable: true },
  { id: "deed", name: "Deed / Agreement Work", category: "Legal & Docs", price: 0, unit: "per document", variable: true },
  { id: "ration_card", name: "Ration Card", category: "Government Services", price: 0, unit: "per application", variable: false },
  { id: "pf", name: "Provident Fund (PF)", category: "Government Services", price: 0, unit: "per application", variable: false },
  { id: "pension", name: "Pension", category: "Government Services", price: 0, unit: "per application", variable: false },
  { id: "resume", name: "Resume / Biodata Making", category: "Typing & Print", price: 0, unit: "per resume", variable: false },
  { id: "typing_hindi", name: "Hindi Typing", category: "Typing & Print", price: 0, unit: "per page", variable: true },
  { id: "typing_english", name: "English Typing", category: "Typing & Print", price: 0, unit: "per page", variable: true },
  { id: "photocopy", name: "Photocopy", category: "Typing & Print", price: 0, unit: "per page", variable: true },
  { id: "lamination", name: "Lamination", category: "Typing & Print", price: 0, unit: "per piece", variable: false },
  { id: "pvc_card", name: "PVC Card (Aadhaar/PAN)", category: "Typing & Print", price: 0, unit: "per card", variable: false },
];

const CATEGORIES = ["Government ID", "Certificates", "Legal & Docs", "Government Services", "Typing & Print"];
const CAT_COLORS = {
  "Government ID":       "#2563eb",
  "Certificates":        "#0ea5e9",
  "Legal & Docs":        "#1d4ed8",
  "Government Services": "#3b82f6",
  "Typing & Print":      "#60a5fa",
};

const OPERATOR_DIRECTORY = [
  {
    id: "samar",
    name: "Samar",
    role: "Home Desk Lead",
    desk: "Front Counter",
    status: "Available",
    focus: "Fast walk-in intake and ID submissions",
    specialties: ["Government ID", "Certificates"],
  },
  {
    id: "navneet_mam",
    name: "Navneet Mam",
    role: "Second Desk Review",
    desk: "Verification Counter",
    status: "Available",
    focus: "Corrections, legal work, and follow-up cases",
    specialties: ["Legal & Docs", "Government Services"],
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
    description: "Capture the exact ID work being handled so follow-up is clear later.",
    fields: [
      { key: "requestType", label: "Request Type", type: "select", required: true, options: ["New Application", "Correction / Update", "Reprint / Download"] },
      { key: "proofUsed", label: "Proof / Source", type: "text", required: true, placeholder: "Aadhaar, PAN, birth proof" },
      { key: "submissionMode", label: "Submission Mode", type: "select", required: false, options: ["Online", "Offline", "Appointment"] },
    ],
  },
  certificate: {
    id: "certificate",
    title: "Certificate Details",
    description: "Store the purpose and destination so the certificate queue is easy to sort.",
    fields: [
      { key: "purpose", label: "Purpose", type: "text", required: true, placeholder: "Scholarship, job, admission" },
      { key: "officeTarget", label: "Target Office", type: "text", required: false, placeholder: "Tehsil, school, employer" },
      { key: "urgency", label: "Priority", type: "select", required: false, options: ["Normal", "Today", "Urgent"] },
    ],
  },
  legal_docs: {
    id: "legal_docs",
    title: "Document Details",
    description: "Track what legal document is being prepared and who is involved.",
    fields: [
      { key: "purpose", label: "Document Purpose", type: "text", required: true, placeholder: "Name change, rental, declaration" },
      { key: "partyCount", label: "Party Count", type: "number", required: true, min: 1, placeholder: "1" },
      { key: "paperValue", label: "Stamp / Paper Value", type: "text", required: false, placeholder: "Rs. 100, Rs. 500" },
    ],
  },
  government_service: {
    id: "government_service",
    title: "Service Details",
    description: "Capture the service stage so the desk knows what remains.",
    fields: [
      { key: "serviceStage", label: "Current Stage", type: "select", required: true, options: ["Fresh", "Update", "Pending Follow-up"] },
      { key: "serviceId", label: "Reference ID", type: "text", required: false, placeholder: "Application no. or account id" },
      { key: "handoverMode", label: "Handover Mode", type: "select", required: false, options: ["Desk Pickup", "WhatsApp", "Print Copy"] },
    ],
  },
  typing_print: {
    id: "typing_print",
    title: "Output Details",
    description: "Store the print or typing spec so the work can be reproduced quickly.",
    fields: [
      { key: "format", label: "Format", type: "select", required: true, options: ["Black & White", "Color", "Soft Copy", "Print + Soft Copy"] },
      { key: "size", label: "Paper / Size", type: "select", required: false, options: ["A4", "Legal", "Photo", "Custom"] },
      { key: "notes", label: "Job Note", type: "text", required: false, placeholder: "Single side, Hindi draft, lamination gloss" },
    ],
  },
};
const CATEGORY_DETAIL_SCHEMA_IDS = {
  "Government ID": "government_id",
  "Certificates": "certificate",
  "Legal & Docs": "legal_docs",
  "Government Services": "government_service",
  "Typing & Print": "typing_print",
};

const PHONE_REGEX = /^[0-9]{10}$/;
const DELETE_ACCESS_CODE = "241100";
const MENU_OPTION_STYLE = { color: "#0f172a", backgroundColor: "#ffffff" };
const MENU_OPTGROUP_STYLE = { color: "rgba(15,23,42,0.58)", backgroundColor: "#f1f5f9" };
const BRAND_PRIMARY = DS.wine;
const BRAND_PRIMARY_DARK = "#1e40af";
const BRAND_PRIMARY_SOFT = "rgba(37,99,235,0.14)";
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
const CATEGORY_REQUIRED_DOC_IDS = {
  "Government ID": ["aadhaar", "photo"],
  "Certificates": ["aadhaar", "photo"],
  "Legal & Docs": ["aadhaar", "pan"],
  "Government Services": ["aadhaar", "bank_passbook", "photo"],
  "Typing & Print": [],
};
const SERVICE_REQUIRED_DOC_IDS = {
  aadhaar: ["aadhaar", "photo"],
  pan_new: ["aadhaar", "photo"],
  pan_correction: ["aadhaar", "photo"],
  passport: ["aadhaar", "pan", "photo"],
  voter_id: ["aadhaar", "photo"],
  driving_license: ["aadhaar", "photo"],
  income_cert: ["aadhaar", "photo"],
  caste_cert: ["aadhaar", "photo"],
  domicile_cert: ["aadhaar", "photo"],
  date_cert: ["aadhaar", "photo"],
  life_cert: ["aadhaar", "photo"],
  ayushman: ["aadhaar", "photo"],
  affidavit: ["aadhaar", "pan", "photo"],
  gazette: ["aadhaar", "pan", "photo"],
  rent_agreement: ["aadhaar", "pan", "photo"],
  deed: ["aadhaar", "pan", "photo"],
  ration_card: ["aadhaar", "bank_passbook", "photo"],
  pf: ["aadhaar", "bank_passbook", "photo"],
  pension: ["aadhaar", "bank_passbook", "photo"],
  resume: ["photo"],
  typing_hindi: [],
  typing_english: [],
  photocopy: [],
  lamination: [],
  pvc_card: ["aadhaar", "photo"],
};
const APP_FONT_STACK = "'Manrope', system-ui, -apple-system, sans-serif";
const APP_SERIF_STACK = "'Manrope', system-ui, -apple-system, sans-serif";
const APP_BRAND_STACK = "'League Spartan', 'Manrope', sans-serif";
const APP_MONO_STACK = "'JetBrains Mono', 'Cascadia Code', Consolas, monospace";
const OPS = {
  bg: "#f8fafc",
  shell: "#ffffff",
  surface: "#ffffff",
  surfaceMuted: "#f1f5f9",
  border: "rgba(15,23,42,0.12)",
  borderSoft: "rgba(15,23,42,0.08)",
  text: "#0f172a",
  textMuted: "#475569",
  primary: "#2563eb",
  primarySoft: "rgba(37,99,235,0.12)",
  primaryBorder: "rgba(37,99,235,0.32)",
  success: "#166534",
  warning: "#a16207",
  danger: "#b91c1c",
  shadowSoft: "0 1px 2px rgba(15,23,42,0.08)",
  shadowElevated: "0 10px 24px rgba(15,23,42,0.10)",
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
  { id: "home", label: "Dashboard Home", description: "Open a workspace from a clean and simple launch screen.", shortLabel: "HM", navGroup: "home" },
  { id: "entry", label: "New Service Entry", description: "Create new customer service entries quickly.", shortLabel: "NS", navGroup: "primary" },
  { id: "rates", label: "Rate List", description: "Manage service rates and categories.", shortLabel: "RL", navGroup: "primary" },
  { id: "b2b", label: "Vendor Dashboard", description: "Track vendor purchases, sales, and payments.", shortLabel: "VD", navGroup: "primary" },
  { id: "monthly", label: "Analytics", description: "View revenue and ticket trends.", shortLabel: "AN", navGroup: "primary" },
  { id: "database", label: "Database", description: "Secure records protected with two-step verification.", shortLabel: "DB", navGroup: "panel" },
  { id: "log", label: "Ticket Dashboard", description: "Track payment, status, and service flow.", shortLabel: "TD", navGroup: "panel" },
  { id: "quick_links", label: "Quick Website Links", description: "Open frequently used government portals.", shortLabel: "QL", navGroup: "panel" },
  { id: "doc_tools", label: "Document Tools", description: "Review document intake and pending document status.", shortLabel: "DT", navGroup: "panel" },
  { id: "services_dashboard", label: "Services Dashboard", description: "Monitor service mix and category performance.", shortLabel: "SD", navGroup: "panel" },
];
const PRIMARY_TAB_CONFIG = TAB_CONFIG.filter((item) => item.navGroup === "primary");
const PANEL_TAB_CONFIG = TAB_CONFIG.filter((item) => item.navGroup === "panel");
const HOME_NAV_BUTTONS = [
  { id: "entry", label: "New Service Entry", helper: "Start customer intake and ticket creation." },
  { id: "rates", label: "Rate List", helper: "Update and review service pricing." },
  { id: "b2b", label: "Vendor Dashboard", helper: "Manage B2B entries, services, and payments." },
  { id: "monthly", label: "Analytics", helper: "Open monthly revenue and category trends." },
  { id: "database", label: "Database", helper: "Two-factor required: one security code and one Google Authenticator code." },
  { id: "log", label: "Ticket Dashboard", helper: "Track open/closed tickets and payment status." },
  { id: "quick_links", label: "Quick Website Links", helper: "Open core portal links in one click." },
  { id: "doc_tools", label: "Document Tools", helper: "View required, received, and pending documents." },
  { id: "services_dashboard", label: "Services Dashboard", helper: "Review service-wise totals and volume." },
];
const CORE_WORKSPACE_TAB_IDS = ["entry", "rates", "b2b", "monthly"];
const TOOL_WORKSPACE_TAB_IDS = ["database", "log", "quick_links", "doc_tools", "services_dashboard"];
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
  { id: "default_esathi", name: "e-Saathi", description: "UP state citizen services portal.", url: "https://edistrict.up.gov.in", isDefault: true },
  { id: "default_digitalseva", name: "Digital Seva Portal", description: "CSC services and transaction desk.", url: "https://digitalseva.csc.gov.in", isDefault: true },
  { id: "default_estamping", name: "Estamping", description: "Stamp and registration services.", url: "https://igrsup.gov.in", isDefault: true },
  { id: "default_pf", name: "PF (EPFO)", description: "Provident fund member services.", url: "https://www.epfindia.gov.in", isDefault: true },
  { id: "default_pension", name: "Pension (NPS)", description: "NPS CRA account and pension tools.", url: "https://npscra.nsdl.co.in", isDefault: true },
  { id: "default_crsorgi", name: "dc.crsorgi", description: "Civil registration and certificate access.", url: "https://dc.crsorgi.gov.in", isDefault: true },
];

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

function verifyDeleteAccess(actionLabel) {
  if (typeof window === "undefined") return false;
  const enteredCode = window.prompt(`Enter access code to ${actionLabel}:`);
  if (enteredCode === null) return false;
  if (String(enteredCode).trim() !== DELETE_ACCESS_CODE) {
    window.alert("Access denied. Invalid code.");
    return false;
  }
  return true;
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

function getInitialEntryStep(draftSeed) {
  if (canUseBrowserHistory()) {
    const historyStep = Number(window.history.state?.entryStep);
    if (historyStep === 1 || historyStep === 2) return historyStep;
  }
  return Number(draftSeed?.step) === 2 ? 2 : 1;
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
  if (["resume", "passport", "gazette", "rent_agreement", "deed", "affidavit"].includes(id)) return "fixed";
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

function getRequiredDocIdsForService(service) {
  const serviceId = String(service?.id || "").trim();
  const category = String(service?.category || "").trim();
  const fromService = SERVICE_REQUIRED_DOC_IDS[serviceId];
  const fromCategory = CATEGORY_REQUIRED_DOC_IDS[category] || [];
  const candidateIds = Array.isArray(fromService) ? fromService : fromCategory;
  const unique = [];
  const seen = new Set();
  candidateIds.forEach((docId) => {
    const normalizedDocId = String(docId || "").trim();
    if (!normalizedDocId || seen.has(normalizedDocId)) return;
    if (!DOCUMENT_PRESET_MAP[normalizedDocId]) return;
    seen.add(normalizedDocId);
    unique.push(normalizedDocId);
  });
  return unique;
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
    const requiredDocIds = getRequiredDocIdsForService(item);
    requiredDocIds.forEach((docId) => {
      const docPreset = DOCUMENT_PRESET_MAP[docId];
      if (!docPreset) return;
      const docIdKey = `doc_req_${serviceId}_${docId}`;
      const existingDoc = existingById.get(docIdKey);
      const shouldPrefillSubmitted = submittedPresetIds.has(docId) || submittedNameKeys.has(normalizeDocNameKey(docPreset.label));
      generatedDocs.push({
        id: docIdKey,
        name: docPreset.label,
        required: true,
        submitted: existingDoc ? Boolean(existingDoc.submitted) : shouldPrefillSubmitted,
        source: "service_required",
        docPresetId: docId,
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

function getNextTicketSequence(date = new Date()) {
  if (!canUseStorage()) return 1;
  const dateKey = getTicketCounterDateKey(date);
  const storedCounter = readStoredJSON(STORAGE_KEYS.ticketCounter, {});
  const lastSeq = storedCounter?.dateKey === dateKey ? Number(storedCounter.lastSeq) || 0 : 0;
  const nextSeq = lastSeq + 1;
  writeStoredJSON(STORAGE_KEYS.ticketCounter, { dateKey, lastSeq: nextSeq });
  return nextSeq;
}

function generateBillNo() {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const mon = String(d.getMonth() + 1).padStart(2, "0");
  const seq = String(getNextTicketSequence(d)).padStart(3, "0");
  return `SLP-${day}${mon}-${seq}`;
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
  const providedDocs = structured.documents.items
    .filter((doc) => doc.submitted)
    .map((doc) => doc.name)
    .join(", ");
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
        font-size: 20px;
        font-weight: 800;
        text-align: center;
        margin-bottom: 10px;
      }
      .status {
        text-align: center;
        color: ${statusColor};
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 1px;
        text-transform: uppercase;
        margin-bottom: 16px;
      }
      .row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
      }
      .stack { margin-bottom: 14px; }
      .label {
        font-size: 11px;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.7px;
        margin-bottom: 4px;
      }
      .value {
        font-size: 14px;
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
        padding: 10px 0;
        margin: 14px 0;
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
      <div class="status">Status: ${escapeHtml(structured.meta.status)}</div>
      <div class="row stack">
        <div>
          <div class="label">Document Holder</div>
          <div class="value">${escapeHtml(structured.parties.documentHolder.name)}</div>
        </div>
        <div style="text-align:right">
          <div class="label">Ticket</div>
          <div class="value">${escapeHtml(structured.meta.ticketNo)}</div>
        </div>
      </div>
      <div class="meta-line">Reference Contact: ${escapeHtml(referenceSummary)}</div>
      ${structured.parties.documentHolder.phone ? `<div class="meta-line">Contact: ${escapeHtml(structured.parties.documentHolder.phone)}</div>` : ""}
      <div class="meta-line">Created: ${escapeHtml(structured.meta.createdDate)} ${escapeHtml(structured.meta.createdTime)}</div>
      <div class="divider">
        ${servicesHtml}
      </div>
      <div class="row meta-line">
        <span>Operator: ${escapeHtml(structured.assignment.operator || "N/A")}</span>
        <span>Pay: ${escapeHtml(structured.payment.mode)}</span>
      </div>
      <div class="meta-line">Payment: ${escapeHtml(structured.payment.status)} | Paid Rs. ${escapeHtml(structured.payment.paidTotal)} | Pending Rs. ${escapeHtml(structured.payment.pendingBalance)}</div>
      <div class="meta-line">Docs: ${escapeHtml(structured.documents.items.filter((doc) => doc.required && doc.submitted).length)}/${escapeHtml(structured.documents.items.filter((doc) => doc.required).length)} required submitted</div>
      ${providedDocs ? `<div class="meta-line">Provided docs: ${escapeHtml(providedDocs)}</div>` : ""}
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

  const mergedDefaults = INITIAL_SERVICES.map((service) => (
    savedById.has(service.id) ? normalizeService({ ...service, ...savedById.get(service.id) }) : normalizeService(service)
  ));

  const customServices = storedServices.filter((service) => (
    service &&
    typeof service === "object" &&
    typeof service.id === "string" &&
    !defaultIds.has(service.id)
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

function normalizeB2BLedgerEntry(entry, fallbackIndex = 0) {
  const flow = entry?.flow === "us_to_vendor" ? "us_to_vendor" : "vendor_to_us";
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
  const includeInDailyRevenue = flow === "us_to_vendor"
    ? (typeof entry?.includeInDailyRevenue === "boolean" ? entry.includeInDailyRevenue : true)
    : false;
  return {
    id: String(entry?.id || `b2b_${Date.now()}_${fallbackIndex}`),
    vendorId: String(entry?.vendorId || ""),
    vendorName: String(entry?.vendorName || "Unknown Vendor"),
    flow,
    serviceName: String(entry?.serviceName || "").trim(),
    quantity,
    rate,
    amount: computedAmount,
    paidAmount,
    pendingAmount,
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
  const aadhaarNumber = (joined.match(/\b\d{4}\s?\d{4}\s?\d{4}\b/) || [])[0] || "";
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
  const panNumber = (joinedUpper.match(/\b[A-Z]{5}[0-9]{4}[A-Z]\b/) || [])[0] || "";
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
  const passportNumber = (joinedUpper.match(/\b[A-Z][0-9]{7}\b/) || [])[0] || "";
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

async function runOcrOnDatabaseDocument(file, onProgress) {
  if (!file) throw new Error("Select a document image first.");
  if (!file.type || !file.type.startsWith("image/")) {
    throw new Error("Only image files are supported right now (JPG, PNG, WEBP).");
  }
  if (!tesseractModulePromise) {
    tesseractModulePromise = import("tesseract.js");
  }
  const { createWorker } = await tesseractModulePromise;
  const worker = await createWorker("eng", 1, {
    logger: (message) => {
      if (message?.status === "recognizing text" && typeof message.progress === "number") {
        onProgress?.(Math.max(1, Math.round(message.progress * 100)));
      }
    },
  });
  try {
    onProgress?.(5);
    const result = await worker.recognize(file);
    onProgress?.(100);
    return String(result?.data?.text || "");
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
      description: String(item?.description || "Custom quick access link").trim() || "Custom quick access link",
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
function TabBtn({ label, description, active, onClick, badge, shortLabel = "", expanded = true }) {
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
        <span style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
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
        <span style={{
          fontSize: "0.76rem", lineHeight: 1.4, display: "block",
          color: active ? OPS.textMuted : "rgba(71,85,105,0.85)",
          fontFamily: APP_FONT_STACK, fontWeight: 400,
          transition: "color 0.18s ease",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {description}
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
              fontSize: "0.54rem",
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
        @keyframes cscBootPulse {
          0% { transform: scale(0.9); opacity: 0.45; }
          50% { transform: scale(1); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.45; }
        }
        @keyframes cscDiceTilt {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(10deg) scale(1.05); }
          100% { transform: rotate(0deg) scale(1); }
        }
        @keyframes cscBootSweep {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(120%); }
        }
      `}</style>
      <div style={{
        position: "absolute",
        top: 20,
        left: 24,
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
          CSC Buddy
        </div>
      </div>
      <div style={{
        width: "min(560px, 100%)",
        borderRadius: 22,
        border: "1px solid rgba(15,23,42,0.10)",
        background: "rgba(255,255,255,0.88)",
        boxShadow: "0 20px 50px rgba(15,23,42,0.12)",
        padding: "28px 24px",
      }}>
        <div style={{
          fontFamily: APP_BRAND_STACK,
          fontSize: "0.62rem",
          letterSpacing: "0.24em",
          textTransform: "uppercase",
          fontWeight: 700,
          color: "rgba(37,99,235,0.84)",
          marginBottom: 10,
        }}>
          Launching Workspace
        </div>
        <div style={{
          fontFamily: APP_FONT_STACK,
          fontSize: "1.55rem",
          fontWeight: 700,
          color: "#0f172a",
          marginBottom: 12,
          letterSpacing: "-0.01em",
        }}>
          Preparing a clean dashboard for your team
        </div>
        <div style={{
          fontFamily: APP_FONT_STACK,
          fontSize: "0.92rem",
          lineHeight: 1.6,
          color: "rgba(15,23,42,0.58)",
          marginBottom: 18,
        }}>
          Loading services, tickets, quick links, and B2B records.
        </div>
        <div style={{
          height: 12,
          borderRadius: 999,
          background: "rgba(37,99,235,0.10)",
          border: "1px solid rgba(37,99,235,0.18)",
          overflow: "hidden",
          position: "relative",
        }}>
          <span style={{
            display: "block",
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: "34%",
            borderRadius: 999,
            background: "linear-gradient(90deg, rgba(37,99,235,0.25) 0%, rgba(37,99,235,0.85) 50%, rgba(37,99,235,0.25) 100%)",
            animation: "cscBootSweep 1.35s linear infinite",
          }} />
        </div>
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8 }}>
          {[0, 1, 2].map((idx) => (
            <span key={idx} style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#2563eb",
              animation: `cscBootPulse 1.05s ${idx * 0.15}s infinite`,
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
                gap: 6,
                cursor: "pointer",
                transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
                boxShadow: "0 6px 16px rgba(15,23,42,0.05)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontFamily: APP_FONT_STACK, fontSize: "1.02rem", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>
                  {item.label}
                </span>
                {item.id === "database" && (
                  <span style={{
                    borderRadius: 999,
                    padding: "4px 8px",
                    border: "1px solid rgba(220,38,38,0.26)",
                    background: "rgba(220,38,38,0.08)",
                    color: "#991b1b",
                    fontSize: "0.54rem",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    fontFamily: APP_BRAND_STACK,
                  }}>
                    2FA
                  </span>
                )}
              </div>
              <span style={{ fontFamily: APP_FONT_STACK, fontSize: "0.82rem", lineHeight: 1.55, color: "rgba(15,23,42,0.62)" }}>
                {item.helper}
              </span>
            </button>
          ))}
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
            <div style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.20em", textTransform: "uppercase", color: "rgba(15,23,42,0.45)", fontFamily: APP_BRAND_STACK, marginBottom: 6 }}>
              Quick Website Links
            </div>
            <div style={{ fontFamily: APP_FONT_STACK, fontSize: "1.2rem", fontWeight: 700, color: "#0f172a" }}>
              Open frequently used portals without searching
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
            <div style={{ fontFamily: APP_FONT_STACK, fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", marginBottom: 5 }}>{link.name}</div>
            <div style={{ fontFamily: APP_FONT_STACK, fontSize: "0.78rem", lineHeight: 1.5, color: "rgba(15,23,42,0.60)", marginBottom: 9 }}>
              {link.description}
            </div>
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

function DocumentToolsWorkspace({ tickets }) {
  const normalizedTickets = useMemo(() => (
    tickets.map((ticket) => ticket.structured || toStructuredTicket(ticket))
  ), [tickets]);
  const docStats = useMemo(() => normalizedTickets.reduce((acc, structured) => {
    acc.totalTickets += 1;
    const required = structured.documents.items.filter((doc) => doc.required).length;
    const submitted = structured.documents.items.filter((doc) => doc.required && doc.submitted).length;
    acc.required += required;
    acc.submitted += submitted;
    acc.pending += Math.max(0, required - submitted);
    return acc;
  }, { totalTickets: 0, required: 0, submitted: 0, pending: 0 }), [normalizedTickets]);
  const pendingTickets = useMemo(() => normalizedTickets
    .filter((structured) => structured.documents.items.some((doc) => doc.required && !doc.submitted))
    .slice(0, 20), [normalizedTickets]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <div style={{ border: "1px solid rgba(15,23,42,0.12)", borderRadius: 14, background: "rgba(255,255,255,0.90)", padding: "12px 14px" }}>
          <div style={{ fontSize: "0.56rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(15,23,42,0.46)", fontFamily: APP_BRAND_STACK }}>Tickets Checked</div>
          <div style={{ marginTop: 6, fontSize: "1.12rem", fontWeight: 700, color: "#1e3a8a", fontFamily: APP_MONO_STACK }}>{docStats.totalTickets}</div>
        </div>
        <div style={{ border: "1px solid rgba(15,23,42,0.12)", borderRadius: 14, background: "rgba(255,255,255,0.90)", padding: "12px 14px" }}>
          <div style={{ fontSize: "0.56rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(15,23,42,0.46)", fontFamily: APP_BRAND_STACK }}>Required Docs</div>
          <div style={{ marginTop: 6, fontSize: "1.12rem", fontWeight: 700, color: "#1e3a8a", fontFamily: APP_MONO_STACK }}>{docStats.required}</div>
        </div>
        <div style={{ border: "1px solid rgba(15,23,42,0.12)", borderRadius: 14, background: "rgba(255,255,255,0.90)", padding: "12px 14px" }}>
          <div style={{ fontSize: "0.56rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(15,23,42,0.46)", fontFamily: APP_BRAND_STACK }}>Submitted</div>
          <div style={{ marginTop: 6, fontSize: "1.12rem", fontWeight: 700, color: "#166534", fontFamily: APP_MONO_STACK }}>{docStats.submitted}</div>
        </div>
        <div style={{ border: "1px solid rgba(15,23,42,0.12)", borderRadius: 14, background: "rgba(255,255,255,0.90)", padding: "12px 14px" }}>
          <div style={{ fontSize: "0.56rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(15,23,42,0.46)", fontFamily: APP_BRAND_STACK }}>Pending</div>
          <div style={{ marginTop: 6, fontSize: "1.12rem", fontWeight: 700, color: "#b45309", fontFamily: APP_MONO_STACK }}>{docStats.pending}</div>
        </div>
      </div>
      <div style={{ border: "1px solid rgba(15,23,42,0.12)", borderRadius: 16, background: "rgba(255,255,255,0.90)", overflow: "hidden" }}>
        <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(15,23,42,0.08)", fontSize: "0.64rem", fontWeight: 700, letterSpacing: "0.20em", textTransform: "uppercase", color: "rgba(15,23,42,0.46)", fontFamily: APP_BRAND_STACK }}>
          Tickets With Pending Documents
        </div>
        <div style={{ maxHeight: 420, overflowY: "auto" }}>
          {pendingTickets.length === 0 ? (
            <div style={{ padding: "14px", color: "rgba(15,23,42,0.56)", fontSize: "0.88rem", fontFamily: APP_FONT_STACK }}>
              No pending required documents found.
            </div>
          ) : pendingTickets.map((structured) => {
            const pendingNames = structured.documents.items
              .filter((doc) => doc.required && !doc.submitted)
              .map((doc) => doc.name)
              .slice(0, 4);
            return (
              <div key={structured.meta.ticketNo} style={{ padding: "11px 14px", borderBottom: "1px solid rgba(15,23,42,0.08)", display: "grid", gap: 4 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ fontFamily: APP_FONT_STACK, fontSize: "0.92rem", fontWeight: 700, color: "#0f172a" }}>
                    {structured.meta.ticketNo} - {structured.parties.documentHolder.name}
                  </div>
                  <div style={{ fontFamily: APP_MONO_STACK, fontSize: "0.78rem", color: "rgba(15,23,42,0.58)" }}>
                    {structured.meta.createdDate || "Undated"}
                  </div>
                </div>
                <div style={{ fontFamily: APP_FONT_STACK, fontSize: "0.80rem", color: "rgba(15,23,42,0.58)" }}>
                  Pending: {pendingNames.join(", ") || "Required documents not submitted"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ServicesDashboardWorkspace({ services, tickets }) {
  const serviceUsage = useMemo(() => {
    const counts = new Map();
    tickets.forEach((ticket) => {
      const structured = ticket.structured || toStructuredTicket(ticket);
      structured.services.forEach((item) => {
        const name = String(item?.service || item?.name || "").trim() || "Unspecified";
        counts.set(name, (counts.get(name) || 0) + (Number(item.qty) || 1));
      });
    });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);
  }, [tickets]);
  const categoryRows = useMemo(() => CATEGORIES.map((category) => {
    const categoryServices = services.filter((service) => service.category === category);
    const pricedCount = categoryServices.filter((service) => Number(service.price) > 0).length;
    return {
      category,
      total: categoryServices.length,
      priced: pricedCount,
      unpriced: Math.max(0, categoryServices.length - pricedCount),
    };
  }), [services]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ border: "1px solid rgba(15,23,42,0.12)", borderRadius: 16, background: "rgba(255,255,255,0.92)", padding: "14px 16px" }}>
        <div style={{ fontSize: "0.60rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(15,23,42,0.45)", fontFamily: APP_BRAND_STACK, marginBottom: 8 }}>
          Service Category Coverage
        </div>
        <div style={{ display: "grid", gap: 9 }}>
          {categoryRows.map((row) => (
            <div key={row.category} style={{ display: "grid", gridTemplateColumns: "minmax(150px, 1fr) auto auto auto", gap: 8, padding: "9px 10px", borderRadius: 10, border: "1px solid rgba(15,23,42,0.10)", background: "rgba(248,250,252,0.95)", alignItems: "center" }}>
              <div style={{ fontFamily: APP_FONT_STACK, fontWeight: 700, color: "#0f172a", fontSize: "0.86rem" }}>{row.category}</div>
              <div style={{ fontFamily: APP_MONO_STACK, fontSize: "0.78rem", color: "#1e3a8a" }}>Total: {row.total}</div>
              <div style={{ fontFamily: APP_MONO_STACK, fontSize: "0.78rem", color: "#166534" }}>Priced: {row.priced}</div>
              <div style={{ fontFamily: APP_MONO_STACK, fontSize: "0.78rem", color: "#b45309" }}>Unpriced: {row.unpriced}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ border: "1px solid rgba(15,23,42,0.12)", borderRadius: 16, background: "rgba(255,255,255,0.92)", padding: "14px 16px" }}>
        <div style={{ fontSize: "0.60rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(15,23,42,0.45)", fontFamily: APP_BRAND_STACK, marginBottom: 8 }}>
          Most Used Services
        </div>
        {serviceUsage.length === 0 ? (
          <div style={{ fontSize: "0.85rem", color: "rgba(15,23,42,0.60)", fontFamily: APP_FONT_STACK }}>
            Usage data will appear after tickets are created.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {serviceUsage.map((row) => (
              <div key={row.name} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, padding: "9px 10px", borderRadius: 10, border: "1px solid rgba(15,23,42,0.10)", background: "rgba(248,250,252,0.95)", alignItems: "center" }}>
                <div style={{ fontFamily: APP_FONT_STACK, fontSize: "0.85rem", color: "#0f172a", fontWeight: 600 }}>{row.name}</div>
                <div style={{ fontFamily: APP_MONO_STACK, fontSize: "0.80rem", color: "#1e3a8a", fontWeight: 700 }}>{row.count}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DatabaseWorkspace({ tickets, services, b2bLedger, records = [], onUpsertRecord, onDeleteRecord }) {
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
      const extractedText = await runOcrOnDatabaseDocument(ocrFile, setOcrProgress);
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
    if (typeof window !== "undefined") {
      const shouldDelete = window.confirm(`Delete this ${sectionConfig.label} entry?`);
      if (!shouldDelete) return;
    }
    if (!verifyDeleteAccess(`delete database entry ${record.id}`)) return;
    onDeleteRecord?.(record.id);
    if (editingRecordId === record.id) {
      resetForm(activeSectionId);
    }
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
        <div style={{ border: "1px solid rgba(15,23,42,0.12)", borderRadius: 12, background: "rgba(255,255,255,0.92)", padding: "11px 13px" }}>
          <div style={{ fontSize: "0.56rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(15,23,42,0.46)", fontFamily: APP_BRAND_STACK }}>Total Tickets</div>
          <div style={{ marginTop: 6, fontFamily: APP_MONO_STACK, fontSize: "1.1rem", fontWeight: 700, color: "#1e3a8a" }}>{tickets.length}</div>
        </div>
        <div style={{ border: "1px solid rgba(15,23,42,0.12)", borderRadius: 12, background: "rgba(255,255,255,0.92)", padding: "11px 13px" }}>
          <div style={{ fontSize: "0.56rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(15,23,42,0.46)", fontFamily: APP_BRAND_STACK }}>Service Records</div>
          <div style={{ marginTop: 6, fontFamily: APP_MONO_STACK, fontSize: "1.1rem", fontWeight: 700, color: "#1e3a8a" }}>{services.length}</div>
        </div>
        <div style={{ border: "1px solid rgba(15,23,42,0.12)", borderRadius: 12, background: "rgba(255,255,255,0.92)", padding: "11px 13px" }}>
          <div style={{ fontSize: "0.56rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(15,23,42,0.46)", fontFamily: APP_BRAND_STACK }}>Ticket Collection</div>
          <div style={{ marginTop: 6, fontFamily: APP_MONO_STACK, fontSize: "1.1rem", fontWeight: 700, color: "#166534" }}>Rs. {Math.round(totalCollections).toLocaleString("en-IN")}</div>
        </div>
        <div style={{ border: "1px solid rgba(15,23,42,0.12)", borderRadius: 12, background: "rgba(255,255,255,0.92)", padding: "11px 13px" }}>
          <div style={{ fontSize: "0.56rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(15,23,42,0.46)", fontFamily: APP_BRAND_STACK }}>B2B Ledger</div>
          <div style={{ marginTop: 6, fontFamily: APP_MONO_STACK, fontSize: "1.1rem", fontWeight: 700, color: "#1e3a8a" }}>Rs. {Math.round(totalB2B).toLocaleString("en-IN")}</div>
        </div>
      </div>

      <div style={{ border: "1px solid rgba(15,23,42,0.12)", borderRadius: 14, background: "rgba(255,255,255,0.94)", padding: 12 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between", alignItems: "center" }}>
          <button
            type="button"
            onClick={handleExportRecordsToExcel}
            style={{
              border: "1px solid rgba(37,99,235,0.30)",
              borderRadius: 10,
              background: "rgba(37,99,235,0.10)",
              color: "#1d4ed8",
              fontFamily: APP_BRAND_STACK,
              fontSize: "0.58rem",
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              cursor: "pointer",
              padding: "9px 12px",
              whiteSpace: "nowrap",
            }}
          >
            Export All To Excel
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
                  border: active ? "1px solid rgba(37,99,235,0.38)" : "1px solid rgba(15,23,42,0.14)",
                  borderRadius: 10,
                  background: active ? "rgba(37,99,235,0.11)" : "rgba(255,255,255,0.8)",
                  color: active ? "#1e3a8a" : "#0f172a",
                  padding: "9px 12px",
                  fontFamily: APP_FONT_STACK,
                  fontSize: "0.84rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span>{section.label}</span>
                <span style={{ fontFamily: APP_MONO_STACK, fontSize: "0.74rem", color: "rgba(15,23,42,0.56)" }}>{count}</span>
              </button>
            );
          })}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "minmax(280px, 420px) minmax(420px, 1fr)" }}>
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
                    <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 8 }}>
                      <span style={{ fontFamily: APP_FONT_STACK, fontSize: "0.78rem", color: "rgba(15,23,42,0.52)", fontWeight: 600 }}>Active Client</span>
                      <span style={{ fontFamily: APP_FONT_STACK, fontSize: "0.82rem", color: record.isActiveClient ? "#166534" : "rgba(15,23,42,0.72)", fontWeight: 600 }}>
                        {record.isActiveClient ? "Yes" : "No"}
                      </span>
                    </div>
                    {sectionConfig.fields.map((field) => (
                      <div key={`${record.id}_${field.key}`} style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 8 }}>
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
      onClose?.();
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
        <div style={{ fontFamily: APP_FONT_STACK, fontSize: "1.12rem", color: "#0f172a", fontWeight: 700, marginBottom: 6 }}>
          Verify both factors to continue
        </div>
        <div style={{ fontFamily: APP_FONT_STACK, fontSize: "0.84rem", color: "rgba(15,23,42,0.58)", lineHeight: 1.6, marginBottom: 12 }}>
          Enter your security code and Google Authenticator code.
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
            style={{ border: "1px solid rgba(15,23,42,0.16)", borderRadius: 10, background: "rgba(15,23,42,0.06)", color: "rgba(15,23,42,0.72)", fontFamily: APP_BRAND_STACK, fontSize: "0.60rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer", padding: "9px 12px" }}
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
            <div style={{ fontSize: 11, color: "rgba(71,85,105,0.86)", lineHeight: 1.4, fontFamily: APP_FONT_STACK }}>
              {item.description}
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
    border: active ? "1px solid rgba(37,99,235,0.34)" : "1px solid rgba(15,23,42,0.11)",
    borderRadius: 12,
    background: active ? "rgba(37,99,235,0.10)" : "rgba(255,255,255,0.72)",
    cursor: "pointer",
    padding: "11px 12px",
    textAlign: "left",
    display: "grid",
    gap: 4,
    transition: "all 0.18s ease",
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
                  background: active ? "rgba(37,99,235,0.18)" : "rgba(15,23,42,0.07)",
                  color: active ? "#1d4ed8" : "rgba(15,23,42,0.68)",
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
                  color: active ? "#1e3a8a" : "#0f172a",
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
                  borderRadius: 999,
                  padding: "3px 7px",
                  border: "1px solid rgba(37,99,235,0.22)",
                  background: "rgba(37,99,235,0.08)",
                  color: "#1d4ed8",
                  fontFamily: APP_MONO_STACK,
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  flexShrink: 0,
                }}>
                  {badge}
                </span>
              )}
            </div>
            <span style={{
              fontFamily: APP_FONT_STACK,
              fontSize: "0.76rem",
              color: "rgba(15,23,42,0.58)",
              lineHeight: 1.45,
            }}>
              {item.description}
            </span>
          </button>
        );
      })}
    </div>
  );

  return (
    <aside className="csc-sidebar" style={{
      width: 320,
      minWidth: 320,
      background: "linear-gradient(180deg, #ffffff 0%, #f3f7ff 100%)",
      borderRight: "1px solid rgba(15,23,42,0.12)",
      display: "flex",
      flexDirection: "column",
      position: "fixed",
      left: 0,
      top: 0,
      bottom: 0,
      height: "100vh",
      overflow: "hidden",
      zIndex: 40,
      boxShadow: "12px 0 30px rgba(15,23,42,0.18)",
      transform: isOpen ? "translateX(0)" : "translateX(-108%)",
      opacity: isOpen ? 1 : 0,
      pointerEvents: isOpen ? "auto" : "none",
      transition: "transform 0.22s ease, opacity 0.18s ease",
      willChange: "transform",
    }}>
      <div style={{ padding: "22px 18px 14px", borderBottom: "1px solid rgba(15,23,42,0.10)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "rgba(37,99,235,0.12)",
              border: "1px solid rgba(37,99,235,0.26)",
              display: "grid",
              placeItems: "center",
              color: "#1d4ed8",
              fontFamily: APP_BRAND_STACK,
              fontWeight: 800,
              fontSize: "0.66rem",
              letterSpacing: "0.08em",
            }}>
              CSC
            </div>
            <div>
              <div style={{ fontFamily: APP_BRAND_STACK, fontSize: "0.96rem", fontWeight: 800, color: "#0f172a", letterSpacing: "0.06em" }}>
                Partner Desk
              </div>
              <div style={{ fontFamily: APP_FONT_STACK, fontSize: "0.74rem", color: "rgba(15,23,42,0.52)" }}>
                Clear workflow menu for daily staff use
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              border: "1px solid rgba(15,23,42,0.14)",
              borderRadius: 9,
              background: "rgba(255,255,255,0.84)",
              color: "rgba(15,23,42,0.70)",
              fontFamily: APP_BRAND_STACK,
              fontWeight: 700,
              fontSize: "0.52rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              cursor: "pointer",
              padding: "6px 9px",
              flexShrink: 0,
            }}
            aria-label="Hide navigation menu"
            title="Hide navigation menu"
          >
            {"<"} Hide
          </button>
        </div>
        <button
          onClick={() => onNavigate("home")}
          style={{
            width: "100%",
            border: "1px solid rgba(37,99,235,0.30)",
            borderRadius: 10,
            background: "rgba(37,99,235,0.10)",
            color: "#1d4ed8",
            fontFamily: APP_BRAND_STACK,
            fontSize: "0.62rem",
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
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

      <div style={{ borderTop: "1px solid rgba(15,23,42,0.10)", padding: "12px 14px 16px", display: "grid", gap: 8 }}>
        <button
          onClick={onOpenWhatsApp}
          style={{
            width: "100%",
            border: "1px solid rgba(22,163,74,0.34)",
            borderRadius: 10,
            background: "rgba(22,163,74,0.12)",
            color: "#166534",
            fontFamily: APP_BRAND_STACK,
            fontSize: "0.62rem",
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
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
  const [customCat, setCustomCat] = useState("Typing & Print");
  const [customPrice, setCustomPrice] = useState("");
  const [customUnit, setCustomUnit] = useState("per service");
  const [customQuantityMode, setCustomQuantityMode] = useState("fixed");
  const [customDetailSchemaId, setCustomDetailSchemaId] = useState(getDefaultDetailSchemaId("Typing & Print"));
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
    fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.28em",
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
            <div style={{ fontSize: "0.76rem", color: "rgba(15,23,42,0.52)", lineHeight: 1.5, fontFamily: APP_FONT_STACK, marginTop: 4 }}>
              {QUANTITY_MODE_CONFIG[item.id].helper}
            </div>
          </div>
        ))}
      </div>

      {/* Category sections */}
      {CATEGORIES.map((cat) => {
        const catServices = services.filter((s) => s.category === cat);
        if (catServices.length === 0) return null;
        const color = CAT_COLORS[cat];
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
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1.2fr) minmax(200px, 0.8fr) auto",
                    alignItems: "start",
                    padding: "16px 18px",
                    borderBottom: i < catServices.length - 1 ? "1px solid rgba(15,23,42,0.07)" : "none",
                    gap: 16, transition: "background 0.15s ease",
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.82)"}
                  onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
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
          <button onClick={addItem} style={{
            padding: "11px 20px", background: "rgba(255,255,255,0.82)", color: "#14B8A6",
            border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14,
            cursor: "pointer", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", whiteSpace: "nowrap",
            transition: "all 0.2s"
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(20, 184, 166, 0.24)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.82)'}
          >
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
            <div key={b.billNo} style={{
              padding: "16px 24px", borderBottom: "1px solid #F1F5F9",
              display: "flex", alignItems: "center", gap: 16, transition: "background 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.72)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'white'}
            >
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
  const [step, setStep] = useState(() => getInitialEntryStep(draftSeed));
  const [hasReference, setHasReference] = useState(() => getHasReferenceValue(draftSeed));
  const [customerName, setCustomerName] = useState(() => draftSeed.customerName || "");
  const [customerPhone, setCustomerPhone] = useState(() => draftSeed.customerPhone || "");
  const [entryDateKey, setEntryDateKey] = useState(() => toIsoDateKey(draftSeed.entryDateKey) || getTicketCounterDateKey(new Date()));
  const [referenceName, setReferenceName] = useState(() => draftSeed.referenceName || "");
  const [referenceLabel, setReferenceLabel] = useState(() => getReferenceLabelValue(draftSeed));
  const [providedDocIds, setProvidedDocIds] = useState(() => (
    Array.isArray(draftSeed.providedDocIds) ? draftSeed.providedDocIds : []
  ));
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
  const [subStep, setSubStep] = useState(1);
  const [saved, setSaved] = useState(null);
  const [error, setError] = useState("");
  const [intakeFieldErrors, setIntakeFieldErrors] = useState({});
  const [draftStorageState, setDraftStorageState] = useState("idle");
  const [draftSavedAt, setDraftSavedAt] = useState(null);
  const [undoAction, setUndoAction] = useState(null);
  const undoTimeoutRef = useRef(null);
  const customerNameInputRef = useRef(null);
  const customerPhoneInputRef = useRef(null);
  const referenceNameInputRef = useRef(null);
  const referencePhoneInputRef = useRef(null);
  const entryDateInputRef = useRef(null);
  const selectedServiceConfig = services.find((service) => service.id === selectedService) || null;
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
  const selectedOperatorConfig = getOperatorConfig(operator);
  const selectedOperatorMetrics = getOperatorTicketMetrics(tickets, operator);

  const total = items.reduce((sum, it) => sum + it.amount, 0);
  const cashCollected = Math.max(0, Number(paymentCash) || 0);
  const upiCollected = Math.max(0, Number(paymentUpi) || 0);
  const paidTotal = cashCollected + upiCollected;
  const pendingBalance = Math.max(total - paidTotal, 0);
  const isOverpaid = paidTotal > total;
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
  const hasOnlyZeroPricedItems = items.length > 0 && total === 0;
  const canSaveTicket = items.length > 0 && !isOverpaid && !hasOnlyZeroPricedItems;
  const ticketReferenceSummary = ticketMeta
    ? formatReferenceSummary({
      hasReference: getHasReferenceValue(ticketMeta),
      name: ticketMeta.referenceName,
      label: getReferenceLabelValue(ticketMeta),
    })
    : "No reference added";
  const surfaceCardStyle = {
    background: "rgba(255,255,255,0.72)",
    borderRadius: 20,
    border: "1px solid rgba(15,23,42,0.10)",
    padding: 22,
    boxShadow: "0 20px 52px rgba(15,23,42,0.10)",
    backdropFilter: "blur(4px)",
  };
  const softPanelStyle = {
    background: "rgba(255,255,255,0.52)",
    borderRadius: 14,
    border: "1px solid rgba(15,23,42,0.07)",
    padding: 18,
    boxShadow: "0 10px 24px rgba(15,23,42,0.06)",
  };
  const sectionEyebrowStyle = {
    fontSize: "0.54rem",
    color: DS.wine,
    fontFamily: APP_BRAND_STACK,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.30em",
    marginBottom: 8,
    display: "block",
  };
  const inputStyle = {
    width: "100%",
    padding: "11px 14px",
    border: "1px solid rgba(15,23,42,0.12)",
    borderRadius: 10,
    background: "rgba(255,255,255,0.82)",
    color: "#0f172a",
    outline: "none",
    fontFamily: APP_FONT_STACK,
    fontSize: "0.88rem",
    boxShadow: "inset 0 1px 2px rgba(15,23,42,0.04)",
  };
  const primaryButtonStyle = {
    border: "1px solid rgba(37,99,235,0.50)",
    borderRadius: 999,
    padding: "12px 22px",
    background: "rgba(37,99,235,0.14)",
    color: "#1e40af",
    fontFamily: APP_BRAND_STACK,
    fontWeight: 700,
    fontSize: "0.6rem",
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    cursor: "pointer",
    transition: "all 0.22s ease",
  };
  const secondaryButtonStyle = {
    border: "1px solid rgba(15,23,42,0.14)",
    borderRadius: 999,
    padding: "12px 22px",
    background: "rgba(255,255,255,0.72)",
    color: "rgba(15,23,42,0.78)",
    fontFamily: APP_BRAND_STACK,
    fontWeight: 700,
    fontSize: "0.6rem",
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    cursor: "pointer",
    transition: "all 0.22s ease",
  };
  const smallBadgeStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    padding: "6px 12px",
    fontSize: "0.5rem",
    fontFamily: APP_BRAND_STACK,
    fontWeight: 700,
    letterSpacing: "0.18em",
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
    ? "#1d4ed8"
    : draftStorageState === "saving"
      ? "#1d4ed8"
      : "rgba(15,23,42,0.55)";
  function navigateToStep(nextStep, mode = "push") {
    const normalizedStep = nextStep === 2 ? 2 : 1;
    if (normalizedStep === step) {
      if (mode === "replace") {
        updateBrowserState({ tab: "entry", entryStep: normalizedStep }, "replace");
      }
      return;
    }
    updateBrowserState({ tab: "entry", entryStep: normalizedStep }, mode);
    setStep(normalizedStep);
    setSubStep(1);
  }

  const draftPayload = {
    step,
    hasReference,
    customerName,
    customerPhone,
    entryDateKey,
    referenceName,
    referenceLabel,
    providedDocIds,
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
    updateBrowserState({ tab: "entry", entryStep: step }, "replace");
  }, [isActive]);

  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state?.tab === "entry" && (event.state?.entryStep === 1 || event.state?.entryStep === 2)) {
        setStep(event.state.entryStep);
      }
    };
    if (typeof window === "undefined") return undefined;
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (step !== 2) return;
    if (ticketMeta) return;
    setError("Intake details are missing. Please start from Intake.");
    navigateToStep(1, "replace");
  }, [step, ticketMeta]);

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

  const toggleProvidedDoc = (docId) => {
    setProvidedDocIds((prev) => (
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    ));
  };

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
    if (hasReference && !PHONE_REGEX.test(referencePhoneDigits)) {
      nextErrors.referencePhone = "Reference mobile number must be exactly 10 digits.";
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
    setTicketMeta({
      ticketNo: generateBillNo(),
      date: formatIsoDateForDisplay(normalizedEntryDateKey),
      time: timeStr(),
      entryDateKey: normalizedEntryDateKey,
      hasReference: referenceEnabled,
      referenceName: referenceEnabled ? trimmedReferenceName : "",
      referenceLabel: referenceEnabled ? trimmedReferenceLabel : "",
      referenceType: "",
      referenceTypeLabel: referenceEnabled ? trimmedReferenceLabel : "",
      customerName: trimmedName,
      customerPhone: phoneDigits,
      operator,
    });
    const intakeDocs = providedDocIds.map((docId) => {
      const preset = DOCUMENT_PRESETS.find((doc) => doc.id === docId);
      return {
        id: `doc_intake_${docId}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: preset ? preset.label : docId,
        docPresetId: preset?.id || "",
        required: false,
        submitted: true,
        source: "intake",
      };
    });
    setDocuments(intakeDocs);
    setSubStep(1);
    navigateToStep(2);
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
    const unitPrice = svc.variable ? Number(customAmt) || 0 : svc.price;
    const detailValues = createDetailDraftForService(svc, selectedDetailDraft);
    setItems((prev) => [...prev, {
      ...svc,
      qty: qtyNum,
      unitPrice,
      amount: unitPrice * qtyNum,
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
        submitted: false,
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
    if (isOverpaid) {
      setSubStep(3);
      setError("Collected amount cannot exceed ticket total.");
      return;
    }
    if (hasOnlyZeroPricedItems) {
      setSubStep(3);
      setError("This ticket is still fully unpriced. Set at least one rate before saving.");
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

    const ticket = withStructuredTicket({
      ...ticketMeta,
      status,
      payMode,
      paymentStatus,
      cashCollected,
      upiCollected,
      paidTotal,
      pendingBalance,
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
    navigateToStep(1, "replace");
    setHasReference(false);
    setCustomerName("");
    setCustomerPhone("");
    setEntryDateKey(getTicketCounterDateKey(new Date()));
    setReferenceName("");
    setReferenceLabel("");
    setProvidedDocIds([]);
    setOperator(DEFAULT_OPERATOR);
    setSelectedService("");
    setQty(1);
    setCustomAmt("");
    setServiceDetailMap({});
    setServiceDetailErrorMap({});
    setPaymentCash("");
    setPaymentUpi("");
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

  if (saved) {
    return (
      <div style={{ animation: "fadeIn 0.3s ease-out" }}>
        <div id="receipt" style={{ background: "rgba(255,255,255,0.96)", border: "1px solid rgba(15,23,42,0.12)", borderRadius: 20, padding: "28px 24px", maxWidth: 420, margin: "0 auto", color: "#0f172a", boxShadow: "0 20px 52px rgba(15,23,42,0.12)" }}>
          <div style={{ fontFamily: APP_BRAND_STACK, fontSize: "0.6rem", letterSpacing: "0.36em", textTransform: "uppercase", color: DS.wine, textAlign: "center", marginBottom: 8 }}>CSC Ticket Slip</div>
          <div style={{ fontFamily: APP_SERIF_STACK, fontSize: "0.72rem", textAlign: "center", color: saved.status === "Open" ? "#1d4ed8" : DS.wine, fontWeight: 400, marginBottom: 16, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            {saved.status}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: "0.66rem", fontFamily: APP_BRAND_STACK, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(15,23,42,0.45)" }}>Document Holder</div>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", fontFamily: APP_FONT_STACK }}>{saved.customerName}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.66rem", fontFamily: APP_BRAND_STACK, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(15,23,42,0.45)" }}>Ticket</div>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", fontFamily: APP_MONO_STACK }}>{saved.ticketNo}</div>
            </div>
          </div>
          <div style={{ fontSize: "0.78rem", color: "rgba(15,23,42,0.55)", marginBottom: 5, fontFamily: APP_FONT_STACK }}>
            Reference Contact: {formatReferenceSummary(toStructuredTicket(saved).parties.reference)}
          </div>
          {!!saved.customerPhone && (
            <div style={{ fontSize: "0.78rem", color: "rgba(15,23,42,0.55)", marginBottom: 12, fontFamily: APP_FONT_STACK }}>Contact: {saved.customerPhone}</div>
          )}
          <div style={{ borderTop: "1px solid rgba(15,23,42,0.10)", borderBottom: "1px solid rgba(15,23,42,0.10)", padding: "10px 0", marginBottom: 12 }}>
            {saved.items.map((it, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "0.84rem", fontFamily: APP_FONT_STACK, color: "#0f172a" }}>
                <span>{it.name}</span>
                <span style={{ color: "rgba(15,23,42,0.55)" }}>x{it.qty}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontFamily: APP_FONT_STACK, color: "rgba(15,23,42,0.60)" }}>
            <span>Operator: {saved.operator}</span>
            <span>Pay: {saved.payMode}</span>
          </div>
          <div style={{ marginTop: 5, fontSize: "0.78rem", color: "rgba(15,23,42,0.55)", fontFamily: APP_FONT_STACK }}>
            Payment: {saved.paymentStatus || "Unpaid"} | Paid Rs. {saved.paidTotal || 0} | Pending Rs. {saved.pendingBalance || 0}
          </div>
          <div style={{ marginTop: 5, fontSize: "0.78rem", color: "rgba(15,23,42,0.55)", fontFamily: APP_FONT_STACK }}>
            Docs: {saved.documents?.filter((doc) => doc.required && doc.submitted).length || 0}/{saved.documents?.filter((doc) => doc.required).length || 0} required submitted
          </div>
          {!!saved.documents?.filter((doc) => doc.submitted).length && (
            <div style={{ marginTop: 5, fontSize: "0.72rem", color: "rgba(15,23,42,0.45)", fontFamily: APP_FONT_STACK }}>
              Provided docs: {saved.documents.filter((doc) => doc.submitted).map((doc) => doc.name).join(", ")}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 16 }}>
          <button onClick={() => printTicketSlip(saved)} style={{ ...secondaryButtonStyle }}>Print Ticket</button>
          <button onClick={resetTicket} style={{ ...primaryButtonStyle }}>+ New Ticket</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      {step === 1 && (() => {
        const WIZARD_STEPS = [
          { num: 1, label: "Customer", short: "Info" },
          { num: 2, label: "Documents", short: "Docs" },
          { num: 3, label: "Operator", short: "Op" },
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
          2: false,
          3: false,
        };

        const goNextSubStep = () => {
          setError("");
          if (subStep < totalSubSteps) setSubStep(subStep + 1);
          else {
            const intakeValidation = validateIntakeDetails({ focusOnError: true });
            if (!intakeValidation.isValid) return;
            createTicket();
          }
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
                <div style={{ ...smallBadgeStyle, background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.30)", color: draftStatusAccent }}>
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
                            ? DS.wine
                            : hasError
                              ? "rgba(214,5,43,0.09)"
                              : done
                                ? "rgba(37,99,235,0.12)"
                                : "rgba(15,23,42,0.06)",
                          color: active
                            ? "#fff"
                            : hasError
                              ? "#1d4ed8"
                              : done
                                ? DS.wine
                                : "rgba(15,23,42,0.45)",
                          fontFamily: APP_BRAND_STACK, fontWeight: 700, fontSize: "0.58rem",
                          letterSpacing: "0.18em", textTransform: "uppercase",
                          cursor: "pointer",
                          transition: "all 0.22s ease",
                        }}
                      >
                        <span style={{
                          width: 18, height: 18, borderRadius: "50%",
                          background: active
                            ? "rgba(255,255,255,0.22)"
                            : hasError
                              ? "rgba(214,5,43,0.16)"
                              : done
                                ? DS.wine
                                : "rgba(15,23,42,0.10)",
                          color: active
                            ? "#fff"
                            : hasError
                              ? "#1d4ed8"
                              : done
                                ? "#fff"
                                : "rgba(15,23,42,0.40)",
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.62rem", fontWeight: 700, fontFamily: APP_BRAND_STACK,
                          flexShrink: 0,
                        }}>
                          {hasError ? "!" : done ? "v" : ws.num}
                        </span>
                        {ws.label}
                      </button>
                      {i < WIZARD_STEPS.length - 1 && (
                        <div style={{ flex: 1, height: 1, background: done ? "rgba(37,99,235,0.25)" : "rgba(15,23,42,0.08)", borderRadius: 1, minWidth: 8 }} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
              {/* thin progress bar */}
              <div style={{ marginTop: 12, height: 3, borderRadius: 3, background: "rgba(15,23,42,0.07)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${((subStep - 1) / (totalSubSteps - 1)) * 100}%`, background: `linear-gradient(90deg, ${DS.wine}, rgba(59,130,246,0.80))`, borderRadius: 3, transition: "width 0.40s cubic-bezier(0.16,1,0.3,1)" }} />
              </div>
            </div>

            {/* Sub-step panels */}
            {subStep === 1 && (
              <div style={{ animation: "fadeIn 0.28s ease-out" }}>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: "1.55rem", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a", marginBottom: 6, lineHeight: 1.1, fontFamily: APP_FONT_STACK }}>
                    Customer Details
                  </div>
                  <div style={{ fontSize: "0.87rem", lineHeight: 1.7, color: "rgba(15,23,42,0.60)" }}>
                    Enter customer mobile number, name, and entry date first. Add reference person with number if needed.
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
                      <span style={{ fontSize: "0.78rem", color: "#1d4ed8", fontFamily: APP_FONT_STACK }}>
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
                      <span style={{ fontSize: "0.78rem", color: "#1d4ed8", fontFamily: APP_FONT_STACK }}>
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
                      <span style={{ fontSize: "0.78rem", color: "#1d4ed8", fontFamily: APP_FONT_STACK }}>
                        {intakeFieldErrors.entryDateKey}
                      </span>
                    )}
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", border: "1px solid rgba(15,23,42,0.10)", borderRadius: 10, background: "rgba(255,255,255,0.60)", cursor: "pointer" }}>
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
                    />
                    <span style={{ fontSize: "0.82rem", color: "rgba(15,23,42,0.70)", fontWeight: 500, fontFamily: APP_FONT_STACK }}>
                      Add reference person
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
                          <span style={{ fontSize: "0.78rem", color: "#1d4ed8", fontFamily: APP_FONT_STACK }}>
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
                          <span style={{ fontSize: "0.78rem", color: "#1d4ed8", fontFamily: APP_FONT_STACK }}>
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: "1.55rem", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a", marginBottom: 6, lineHeight: 1.1, fontFamily: APP_FONT_STACK }}>
                      Documents at Intake
                    </div>
                    <div style={{ fontSize: "0.87rem", lineHeight: 1.7, color: "rgba(15,23,42,0.60)" }}>
                      What did the customer hand over right now? These prefill the ticket checklist.
                    </div>
                  </div>
                  {providedDocIds.length > 0 && (
                    <div style={{ ...smallBadgeStyle, background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.30)", color: "#1d4ed8" }}>
                      {providedDocIds.length} selected
                    </div>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10 }}>
                  {DOCUMENT_PRESETS.map((doc) => {
                    const checked = providedDocIds.includes(doc.id);
                    return (
                      <button
                        key={`intake_${doc.id}`}
                        onClick={() => toggleProvidedDoc(doc.id)}
                        style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "13px 14px", borderRadius: 12,
                          border: checked ? "1.5px solid rgba(59,130,246,0.50)" : "1px solid rgba(15,23,42,0.10)",
                          background: checked ? "linear-gradient(135deg, rgba(59,130,246,0.13) 0%, rgba(59,130,246,0.06) 100%)" : "rgba(255,255,255,0.72)",
                          color: checked ? "#1d4ed8" : "#0f172a",
                          cursor: "pointer", fontSize: "0.86rem", fontFamily: APP_FONT_STACK, fontWeight: 600,
                          transition: "all 0.18s ease", textAlign: "left",
                          boxShadow: checked ? "0 6px 18px rgba(59,130,246,0.14)" : "0 3px 10px rgba(15,23,42,0.04)",
                        }}
                      >
                        <span style={{
                          width: 20, height: 20, borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                          background: checked ? "rgba(59,130,246,0.22)" : "rgba(15,23,42,0.07)",
                          color: checked ? "#1d4ed8" : "rgba(15,23,42,0.35)", fontSize: "0.72rem",
                        }}>
                          {checked ? "v" : ""}
                        </span>
                        {doc.label}
                      </button>
                    );
                  })}
                </div>
                {providedDocIds.length === 0 && (
                  <div style={{ marginTop: 14, fontSize: "0.82rem", color: "rgba(15,23,42,0.40)", fontFamily: APP_FONT_STACK }}>
                    Nothing selected  -  you can skip and add documents manually in the ticket.
                  </div>
                )}
              </div>
            )}

            {subStep === 3 && (
              <div style={{ animation: "fadeIn 0.28s ease-out" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: "1.55rem", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a", marginBottom: 6, lineHeight: 1.1, fontFamily: APP_FONT_STACK }}>
                      Assign Operator
                    </div>
                    <div style={{ fontSize: "0.87rem", lineHeight: 1.7, color: "rgba(15,23,42,0.60)" }}>
                      Pick the desk owner handling this file. Their metrics are live.
                    </div>
                  </div>
                  <div style={{ ...smallBadgeStyle, background: "rgba(15,23,42,0.05)", border: "1px solid rgba(15,23,42,0.09)", color: "rgba(15,23,42,0.55)" }}>
                    {selectedOperatorConfig.role}  |  Avg Rs. {selectedOperatorMetrics.avgTicketRate}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
                  {OPERATOR_DIRECTORY.map((op) => {
                    const metrics = getOperatorTicketMetrics(tickets, op.name);
                    const active = operator === op.name;
                    return (
                      <button
                        key={op.id}
                        onClick={() => setOperator(op.name)}
                        style={{
                          textAlign: "left", padding: "18px 16px", borderRadius: 16,
                          border: active ? "1.5px solid rgba(37,99,235,0.45)" : "1px solid rgba(15,23,42,0.10)",
                          background: active ? "linear-gradient(135deg, rgba(37,99,235,0.09) 0%, rgba(37,99,235,0.04) 100%)" : "rgba(255,255,255,0.72)",
                          cursor: "pointer", fontFamily: APP_FONT_STACK,
                          transition: "all 0.22s ease",
                          boxShadow: active ? "0 10px 28px rgba(37,99,235,0.12)" : "0 4px 14px rgba(15,23,42,0.05)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
                          <div>
                            <div style={{ fontSize: "1rem", fontWeight: 700, color: active ? DS.wine : "#0f172a", marginBottom: 3 }}>{op.name}</div>
                            <div style={{ fontSize: "0.76rem", color: "rgba(15,23,42,0.52)" }}>{op.role}  |  {op.desk}</div>
                          </div>
                          <div style={{ ...smallBadgeStyle, padding: "4px 9px", background: active ? "rgba(37,99,235,0.10)" : "rgba(15,23,42,0.04)", border: active ? "1px solid rgba(37,99,235,0.25)" : "1px solid rgba(15,23,42,0.08)", color: active ? DS.wine : "rgba(15,23,42,0.50)" }}>
                            {op.status}
                          </div>
                        </div>
                        <div style={{ fontSize: "0.80rem", color: "rgba(15,23,42,0.58)", lineHeight: 1.55, marginBottom: 10 }}>{op.focus}</div>
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
                          {op.specialties.map((specialty) => (
                            <span key={`${op.id}_${specialty}`} style={{ fontSize: "0.64rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: active ? DS.wine : "rgba(15,23,42,0.50)", background: active ? "rgba(37,99,235,0.08)" : "rgba(15,23,42,0.04)", borderRadius: 999, padding: "4px 8px" }}>
                              {specialty}
                            </span>
                          ))}
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 4, fontSize: "0.76rem", color: "rgba(15,23,42,0.52)", borderTop: "1px solid rgba(15,23,42,0.07)", paddingTop: 10 }}>
                          <span>{metrics.ticketCount} tickets</span>
                          <span>Rs. {metrics.revenue} today</span>
                          <span>Avg Rs. {metrics.avgTicketRate}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{ marginTop: 16, padding: "11px 14px", borderRadius: 12, background: "rgba(214,5,43,0.07)", border: "1px solid rgba(214,5,43,0.22)", color: "#1d4ed8", fontSize: "0.84rem", fontFamily: APP_FONT_STACK, fontWeight: 600 }}>
                {error}
              </div>
            )}

            {/* Wizard nav buttons */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 28, gap: 12 }}>
              <div style={{ display: "flex", gap: 8 }}>
                {subStep > 1 ? (
                  <button onClick={goPrevSubStep} style={secondaryButtonStyle}>&larr; Back</button>
                ) : (
                  <button onClick={resetTicket} style={secondaryButtonStyle}>Clear Draft</button>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: "0.75rem", color: "rgba(15,23,42,0.40)", fontFamily: APP_FONT_STACK }}>
                  {subStep < totalSubSteps ? `${totalSubSteps - subStep} step${totalSubSteps - subStep > 1 ? "s" : ""} left` : "Ready to continue"}
                </span>
                <button
                  onClick={goNextSubStep}
                  style={{ ...primaryButtonStyle, padding: "13px 28px" }}
                >
                  {subStep < totalSubSteps ? "Next ->" : "Continue to Ticket"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {step === 2 && (() => {
        const T2_STEPS = [
          { num: 1, label: "Services" },
          { num: 2, label: "Documents" },
          { num: 3, label: "Payment" },
        ];
        const t2Total = T2_STEPS.length;
        const t2StepHasError = {
          1: items.length === 0,
          2: false,
          3: isOverpaid || hasOnlyZeroPricedItems,
        };

        const goNextT2 = () => {
          setError("");
          if (subStep < t2Total) setSubStep(subStep + 1);
        };

        const goPrevT2 = () => {
          setError("");
          if (subStep > 1) setSubStep(subStep - 1);
          else navigateToStep(1, "replace");
        };

        return (
          <>
            {/* Ticket identity bar */}
            <div style={{ ...surfaceCardStyle, marginBottom: 16, padding: "16px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div>
                    <div style={{ ...sectionEyebrowStyle, marginBottom: 3 }}>Ticket in Progress</div>
                    <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", fontFamily: APP_FONT_STACK }}>
                      {ticketMeta?.customerName}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "rgba(15,23,42,0.50)", fontFamily: APP_FONT_STACK, marginTop: 2 }}>
                      #{ticketMeta?.ticketNo}  |  {ticketReferenceSummary}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  {items.length > 0 && (
                    <div style={{ ...smallBadgeStyle, background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.30)", color: "#1d4ed8" }}>
                      Rs. {total}
                    </div>
                  )}
                  <button onClick={() => navigateToStep(1, "replace")} style={secondaryButtonStyle}>
                    &larr; Intake
                  </button>
                  <button onClick={() => onNavigateTab?.("log")} style={secondaryButtonStyle}>
                    Dashboard
                  </button>
                </div>
              </div>
            </div>

            {/* Wizard card */}
            <div style={{ ...surfaceCardStyle, marginBottom: 16 }}>
              {/* Progress strip */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={sectionEyebrowStyle}>Build Ticket  -  Step {subStep} of {t2Total}</div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {T2_STEPS.map((ws, i) => {
                    const done = subStep > ws.num;
                    const active = subStep === ws.num;
                    const hasError = t2StepHasError[ws.num];
                    return (
                      <React.Fragment key={ws.num}>
                        <button
                          onClick={() => { setError(""); setSubStep(ws.num); }}
                          style={{
                            display: "flex", alignItems: "center", gap: 7,
                            padding: "7px 13px", borderRadius: 999,
                            border: hasError && !active ? "1px solid rgba(214,5,43,0.32)" : "none",
                            background: active
                              ? DS.wine
                              : hasError
                                ? "rgba(214,5,43,0.09)"
                                : done
                                  ? "rgba(37,99,235,0.12)"
                                  : "rgba(15,23,42,0.06)",
                            color: active
                              ? "#fff"
                              : hasError
                                ? "#1d4ed8"
                                : done
                                  ? DS.wine
                                  : "rgba(15,23,42,0.40)",
                            fontFamily: APP_BRAND_STACK, fontWeight: 700, fontSize: "0.58rem",
                            letterSpacing: "0.18em", textTransform: "uppercase",
                            cursor: "pointer",
                            transition: "all 0.22s ease",
                          }}
                        >
                          <span style={{
                            width: 18, height: 18, borderRadius: "50%",
                            background: active
                              ? "rgba(255,255,255,0.22)"
                              : hasError
                                ? "rgba(214,5,43,0.16)"
                                : done
                                  ? DS.wine
                                  : "rgba(15,23,42,0.10)",
                            color: active
                              ? "#fff"
                              : hasError
                                ? "#1d4ed8"
                                : done
                                  ? "#fff"
                                  : "rgba(15,23,42,0.40)",
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            fontSize: "0.62rem", fontWeight: 700, fontFamily: APP_BRAND_STACK, flexShrink: 0,
                          }}>
                            {hasError ? "!" : done ? "v" : ws.num}
                          </span>
                          {ws.label}
                        </button>
                        {i < T2_STEPS.length - 1 && (
                          <div style={{ flex: 1, height: 1, background: done ? "rgba(37,99,235,0.25)" : "rgba(15,23,42,0.08)", borderRadius: 1, minWidth: 8 }} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
                <div style={{ marginTop: 12, height: 3, borderRadius: 3, background: "rgba(15,23,42,0.07)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${((subStep - 1) / (t2Total - 1)) * 100}%`, background: `linear-gradient(90deg, ${DS.wine}, rgba(59,130,246,0.80))`, borderRadius: 3, transition: "width 0.40s cubic-bezier(0.16,1,0.3,1)" }} />
                </div>
              </div>

              {/* Step A: Services */}
              {subStep === 1 && (
                <div style={{ animation: "fadeIn 0.28s ease-out" }}>
                  <div style={{ marginBottom: 22 }}>
                    <div style={{ fontSize: "1.55rem", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a", marginBottom: 6, fontFamily: APP_FONT_STACK }}>
                      Add Services
                    </div>
                    <div style={{ fontSize: "0.87rem", lineHeight: 1.7, color: "rgba(15,23,42,0.58)" }}>
                      Pick each service this customer needs. Add them one at a time.
                    </div>
                  </div>

                  {/* Service picker */}
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
                        {selectedServiceConfig?.variable && (
                          <label style={{ display: "grid", gap: 7 }}>
                            <span style={sectionEyebrowStyle}>Custom Amount (Rs.)</span>
                            <input type="number" value={customAmt} onChange={(e) => setCustomAmt(e.target.value)} placeholder="0" style={inputStyle} />
                          </label>
                        )}
                      </>
                    )}
                  </div>

                  {/* Detail fields */}
                  {selectedServiceConfig && selectedDetailSchema?.fields?.length > 0 && (
                    <div style={{ ...softPanelStyle, marginBottom: 14 }}>
                      <div style={{ marginBottom: 10 }}>
                        <div style={sectionEyebrowStyle}>{selectedDetailSchema?.title || "Service Details"}</div>
                        <div style={{ fontSize: "0.82rem", color: "rgba(15,23,42,0.58)", lineHeight: 1.6 }}>
                          {selectedDetailSchema?.description}
                        </div>
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
                              <span style={{ fontSize: "0.76rem", color: "#1d4ed8", fontFamily: APP_FONT_STACK }}>{selectedServiceDetailErrors[field.key]}</span>
                            )}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedServiceConfig && (
                    <div style={{ ...softPanelStyle, marginBottom: 14 }}>
                      <div style={sectionEyebrowStyle}>Required Documents (Preview)</div>
                      {getRequiredDocIdsForService(selectedServiceConfig).length === 0 ? (
                        <div style={{ fontSize: "0.80rem", color: "rgba(15,23,42,0.50)", fontFamily: APP_FONT_STACK }}>
                          No compulsory documents configured for this service.
                        </div>
                      ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
                          {getRequiredDocIdsForService(selectedServiceConfig).map((docId) => (
                            <div key={`preview_${selectedServiceConfig.id}_${docId}`} style={{ border: "1px solid rgba(15,23,42,0.09)", borderRadius: 10, background: "rgba(255,255,255,0.74)", padding: "9px 11px", fontSize: "0.80rem", color: "#0f172a", fontFamily: APP_FONT_STACK, fontWeight: 600 }}>
                              {DOCUMENT_PRESET_MAP[docId]?.label || docId}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Add button */}
                  {selectedServiceConfig && (
                    <div style={{ marginBottom: 20 }}>
                      <button onClick={addTask} style={{ ...primaryButtonStyle, padding: "13px 28px" }}>
                        + Add to Ticket
                      </button>
                      <span style={{ marginLeft: 12, fontSize: "0.80rem", color: "rgba(15,23,42,0.45)", fontFamily: APP_FONT_STACK }}>
                        {selectedServiceConfig?.variable ? "Variable price" : `Rs. ${selectedServiceConfig?.price || 0}`}
                        {selectedServiceConfig?.quantityMode !== "fixed" ? `  |  max qty ${selectedServiceConfig.maxQty}` : ""}
                      </span>
                    </div>
                  )}

                  {/* Draft list */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={sectionEyebrowStyle}>Added Services</div>
                    {items.length > 0 && (
                      <div style={{ ...smallBadgeStyle, background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.28)", color: "#1d4ed8" }}>
                        Rs. {total}
                      </div>
                    )}
                  </div>
                  {items.length === 0 ? (
                    <div style={{ ...softPanelStyle, textAlign: "center", color: "rgba(15,23,42,0.45)", fontSize: "0.85rem", padding: "22px 16px" }}>
                      No services added yet. Choose one above and tap + Add to Ticket.
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: 8 }}>
                      {items.map((it, i) => (
                        <div key={i} style={{ ...softPanelStyle, padding: "12px 14px", display: "flex", gap: 12, alignItems: "center" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.90rem", fontFamily: APP_FONT_STACK }}>{it.name}</div>
                            <div style={{ fontSize: "0.76rem", color: "rgba(15,23,42,0.52)", marginTop: 2 }}>
                              {getQuantityModeConfig(it.quantityMode).inputLabel} {it.qty}  |  Unit Rs. {it.unitPrice}
                            </div>
                            {!!it.detailSummary && (
                              <div style={{ fontSize: "0.74rem", color: "rgba(15,23,42,0.48)", lineHeight: 1.5, marginTop: 3 }}>{it.detailSummary}</div>
                            )}
                          </div>
                          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1d4ed8", whiteSpace: "nowrap" }}>Rs. {it.amount}</div>
                          <button onClick={() => removeTask(i)} style={{ width: 30, height: 30, border: "1px solid rgba(214,5,43,0.20)", borderRadius: 8, background: "rgba(214,5,43,0.06)", color: "#1d4ed8", cursor: "pointer", fontWeight: 800, fontSize: "0.8rem", flexShrink: 0 }}>
                            x
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step B: Documents */}
              {subStep === 2 && (
                <div style={{ animation: "fadeIn 0.28s ease-out" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 22 }}>
                    <div>
                      <div style={{ fontSize: "1.55rem", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a", marginBottom: 6, fontFamily: APP_FONT_STACK }}>
                        Service Document Intake
                      </div>
                      <div style={{ fontSize: "0.87rem", lineHeight: 1.7, color: "rgba(15,23,42,0.58)" }}>
                        After selecting services, only required documents for each service are listed here. Mark each one as intaked or pending.
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
                            <div style={{ ...smallBadgeStyle, background: "rgba(59,130,246,0.10)", border: "1px solid rgba(59,130,246,0.24)", color: "#1d4ed8" }}>
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
                </div>
              )}

              {/* Step C: Payment */}
              {subStep === 3 && (
                <div style={{ animation: "fadeIn 0.28s ease-out" }}>
                  <div style={{ marginBottom: 22 }}>
                    <div style={{ fontSize: "1.55rem", fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a", marginBottom: 6, fontFamily: APP_FONT_STACK }}>
                      Payment & Save
                    </div>
                    <div style={{ fontSize: "0.87rem", lineHeight: 1.7, color: "rgba(15,23,42,0.58)" }}>
                      Enter what was collected. Partial payment is fine  -  you can keep the balance pending.
                    </div>
                  </div>

                  {/* Service summary */}
                  <div style={{ ...softPanelStyle, marginBottom: 18, padding: "14px 16px" }}>
                    <div style={sectionEyebrowStyle}>Services Summary</div>
                    <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
                      {items.map((it, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.86rem", color: "#0f172a", fontFamily: APP_FONT_STACK }}>
                          <span>{it.name} x{it.qty}</span>
                          <span style={{ fontWeight: 700 }}>Rs. {it.amount}</span>
                        </div>
                      ))}
                      <div style={{ borderTop: "1px solid rgba(15,23,42,0.09)", paddingTop: 8, marginTop: 4, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "1rem", fontFamily: APP_FONT_STACK, color: "#0f172a" }}>
                        <span>Total</span>
                        <span>Rs. {total}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                    <label style={{ display: "grid", gap: 7 }}>
                      <span style={sectionEyebrowStyle}>Cash Collected</span>
                      <input type="number" min="0" value={paymentCash} onChange={(e) => setPaymentCash(e.target.value)} placeholder="Rs. 0" style={{ ...inputStyle, fontSize: "1.1rem", padding: "14px 16px", textAlign: "right" }} />
                    </label>
                    <label style={{ display: "grid", gap: 7 }}>
                      <span style={sectionEyebrowStyle}>UPI Collected</span>
                      <input type="number" min="0" value={paymentUpi} onChange={(e) => setPaymentUpi(e.target.value)} placeholder="Rs. 0" style={{ ...inputStyle, fontSize: "1.1rem", padding: "14px 16px", textAlign: "right" }} />
                    </label>
                  </div>

                  <div style={{ ...softPanelStyle, marginBottom: 16 }}>
                    <div style={{ display: "grid", gap: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "rgba(15,23,42,0.60)", fontFamily: APP_FONT_STACK }}>
                        <span>Collected</span><span style={{ color: "#0f172a", fontWeight: 700 }}>Rs. {paidTotal}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "rgba(15,23,42,0.60)", fontFamily: APP_FONT_STACK }}>
                        <span>Docs submitted</span><span style={{ color: "#0f172a", fontWeight: 700 }}>{submittedRequiredDocsCount}/{requiredDocsCount}</span>
                      </div>
                      <div style={{ borderTop: "1px solid rgba(15,23,42,0.08)", paddingTop: 8, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "1.05rem", fontFamily: APP_FONT_STACK, color: pendingBalance > 0 ? "#1d4ed8" : DS.wine }}>
                        <span>Pending Balance</span><span>Rs. {pendingBalance}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 18, padding: "12px 14px", borderRadius: 10, background: isOverpaid ? "rgba(214,5,43,0.07)" : pendingBalance > 0 ? "rgba(59,130,246,0.10)" : "rgba(37,99,235,0.07)", border: isOverpaid ? "1px solid rgba(214,5,43,0.22)" : pendingBalance > 0 ? "1px solid rgba(59,130,246,0.26)" : "1px solid rgba(37,99,235,0.22)", color: isOverpaid ? "#1d4ed8" : pendingBalance > 0 ? "#1d4ed8" : DS.wine, fontSize: "0.83rem", lineHeight: 1.6, fontFamily: APP_FONT_STACK, fontWeight: 500 }}>
                    {hasOnlyZeroPricedItems
                      ? "All services are still Rs. 0. Update the rate card or enter a custom amount before saving."
                      : isOverpaid
                      ? "Collected exceeds the total. Reduce before saving."
                      : pendingBalance > 0
                        ? "Partial payment recorded. You can save and keep the balance pending."
                        : "Fully paid. Ready to complete."}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <button
                      onClick={() => saveTicket("Open")}
                      style={{ ...secondaryButtonStyle, background: canSaveTicket ? "rgba(59,130,246,0.12)" : "rgba(15,23,42,0.04)", border: canSaveTicket ? "1px solid rgba(59,130,246,0.34)" : "1px solid rgba(15,23,42,0.09)", color: canSaveTicket ? "#1d4ed8" : "rgba(15,23,42,0.45)", cursor: "pointer" }}
                    >
                      Save for Later
                    </button>
                    <button
                      onClick={() => saveTicket("Closed")}
                      style={{ ...primaryButtonStyle, padding: "13px 22px", background: canSaveTicket ? "rgba(37,99,235,0.14)" : "rgba(15,23,42,0.04)", border: canSaveTicket ? "1px solid rgba(37,99,235,0.42)" : "1px solid rgba(15,23,42,0.09)", color: canSaveTicket ? DS.wine : "rgba(15,23,42,0.45)", cursor: "pointer" }}
                    >
                      Save & Complete
                    </button>
                  </div>
                </div>
              )}

              {undoAction && (
                <div style={{ marginTop: 16, padding: "11px 14px", borderRadius: 12, background: "rgba(59,130,246,0.11)", border: "1px solid rgba(59,130,246,0.30)", color: "#1d4ed8", fontSize: "0.84rem", fontFamily: APP_FONT_STACK, fontWeight: 600, display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <span>{undoAction.message}</span>
                  <button
                    onClick={() => {
                      undoAction.undoFn?.();
                      if (undoTimeoutRef.current) {
                        clearTimeout(undoTimeoutRef.current);
                        undoTimeoutRef.current = null;
                      }
                      setUndoAction(null);
                    }}
                    style={{ border: "1px solid rgba(59,130,246,0.45)", borderRadius: 999, padding: "7px 12px", background: "rgba(255,255,255,0.74)", color: "#1d4ed8", fontFamily: APP_BRAND_STACK, fontWeight: 700, fontSize: "0.52rem", letterSpacing: "0.18em", textTransform: "uppercase", cursor: "pointer" }}
                  >
                    Undo
                  </button>
                </div>
              )}

              {/* Error */}
              {error && (
                <div style={{ marginTop: 16, padding: "11px 14px", borderRadius: 12, background: "rgba(214,5,43,0.07)", border: "1px solid rgba(214,5,43,0.22)", color: "#1d4ed8", fontSize: "0.84rem", fontFamily: APP_FONT_STACK, fontWeight: 600 }}>
                  {error}
                </div>
              )}

              {/* Wizard nav */}
              {subStep < 3 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 28, gap: 12 }}>
                  <button onClick={goPrevT2} style={secondaryButtonStyle}>&larr; Back</button>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: "0.75rem", color: "rgba(15,23,42,0.40)", fontFamily: APP_FONT_STACK }}>
                      {t2Total - subStep} step{t2Total - subStep > 1 ? "s" : ""} left
                    </span>
                    <button onClick={goNextT2} style={{ ...primaryButtonStyle, padding: "13px 28px" }}>
                      Next &rarr;
                    </button>
                  </div>
                </div>
              )}
              {subStep === 3 && (
                <div style={{ marginTop: 16 }}>
                  <button onClick={goPrevT2} style={secondaryButtonStyle}>&larr; Documents</button>
                </div>
              )}
            </div>
          </>
        );
      })()}
    </div>
  );
}

function TicketDashboard({ tickets, onToggleTicketStatus, onToggleTaskDone, onUpdateTicket, onDeleteTicket }) {
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
    fontSize: "0.52rem",
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
    fontSize: "0.52rem",
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
      cashCollected: String(Number(ticket.cashCollected) || 0),
      upiCollected: String(Number(ticket.upiCollected) || 0),
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
    const total = Number(editingTicket?.total) || 0;
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

    onUpdateTicket(editTicketNo, {
      customerName: name,
      customerPhone: phone,
      hasReference: referenceEnabled,
      referenceName: referenceEnabled ? referenceName : "",
      referenceLabel: referenceEnabled ? referenceLabel : "",
      referenceType: "",
      referenceTypeLabel: referenceEnabled ? referenceLabel : "",
      operator: editDraft.operator,
      payMode,
      paymentStatus,
      cashCollected,
      upiCollected,
      paidTotal,
      pendingBalance,
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
            { label: "Payment", main: `Status: ${structured.payment.status}`, sub: `Paid Rs. ${structured.payment.paidTotal} | Pending Rs. ${structured.payment.pendingBalance}` },
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
    border: `1px solid ${OPS.borderSoft}`,
    borderRadius: 14,
    boxShadow: OPS.shadowSoft,
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
  const handleDeleteTicket = (ticket) => {
    if (typeof onDeleteTicket !== "function" || !ticket?.ticketNo) return;
    const ticketNo = ticket.ticketNo;
    const customerName = ticket.customerName || "Unknown customer";
    const confirmed = typeof window !== "undefined"
      ? window.confirm(`Delete ticket ${ticketNo} for ${customerName}? This cannot be undone.`)
      : false;
    if (!confirmed) return;
    if (!verifyDeleteAccess(`delete ticket ${ticketNo}`)) return;
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
              <input type="number" min="0" value={editDraft.cashCollected} onChange={(e) => setEditDraft((prev) => ({ ...prev, cashCollected: e.target.value }))} placeholder="Cash collected" style={compactInput} />
              <input type="number" min="0" value={editDraft.upiCollected} onChange={(e) => setEditDraft((prev) => ({ ...prev, upiCollected: e.target.value }))} placeholder="UPI collected" style={compactInput} />
            </div>
            {editError && <div style={{ color: OPS.danger, fontSize: "0.8rem", fontFamily: APP_FONT_STACK }}>{editError}</div>}
            <button onClick={saveEdit} style={{ ...listActionStyle, background: OPS.primary, color: "#ffffff" }}>Save Changes</button>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 1fr) minmax(0, 1.3fr)", gap: 12, alignItems: "start" }}>
          <div style={{ ...dashboardCard, padding: 10, display: "grid", gap: 8, maxHeight: "68vh", overflowY: "auto" }}>
            {filteredTickets.length === 0 ? (
              <div style={{ padding: 12, color: OPS.textMuted, fontFamily: APP_FONT_STACK, fontSize: "0.84rem" }}>No tickets match current filters.</div>
            ) : (
              filteredTickets.map((ticket) => {
                const structured = ticket.structured || toStructuredTicket(ticket);
                const active = viewingTicket?.ticketNo === ticket.ticketNo;
                const paymentColor = structured.payment.status === "Paid" ? OPS.success : structured.payment.status === "Partial" ? OPS.warning : OPS.danger;
                return (
                  <div key={ticket.ticketNo} style={{ border: active ? `1px solid ${OPS.primaryBorder}` : `1px solid ${OPS.borderSoft}`, background: active ? OPS.primarySoft : OPS.surface, borderRadius: 10, padding: 10, display: "grid", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <div>
                        <div style={{ fontSize: "0.72rem", color: OPS.textMuted, fontFamily: APP_MONO_STACK }}>{ticket.ticketNo}</div>
                        <div style={{ fontSize: "0.88rem", fontWeight: 600, color: OPS.text, fontFamily: APP_FONT_STACK }}>{ticket.customerName}</div>
                      </div>
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: paymentColor, fontFamily: APP_FONT_STACK }}>{structured.payment.status}</div>
                    </div>
                    <div style={{ fontSize: "0.76rem", color: OPS.textMuted, fontFamily: APP_FONT_STACK }}>
                      {structured.meta.primaryType || "Unassigned"}  |  Rs. {ticket.total || 0}  |  Pending Rs. {structured.payment.pendingBalance}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button onClick={() => { setViewTicketNo(ticket.ticketNo); setShowRawJson(false); }} style={listActionStyle}>View</button>
                      <button onClick={() => startEdit(ticket)} style={listActionStyle}>Edit</button>
                      <button onClick={() => printTicketSlip(ticket)} style={listActionStyle}>Print</button>
                      <button onClick={() => handleDeleteTicket(ticket)} style={dangerActionStyle}>Delete</button>
                      {ticket.status === "Open" ? (
                        <button onClick={() => onToggleTicketStatus(ticket.ticketNo, "Closed")} style={{ ...listActionStyle, border: `1px solid rgba(22,101,52,0.28)`, background: "rgba(22,101,52,0.12)", color: OPS.success }}>Close</button>
                      ) : (
                        <button onClick={() => onToggleTicketStatus(ticket.ticketNo, "Open")} style={{ ...listActionStyle, border: `1px solid rgba(161,98,7,0.28)`, background: "rgba(161,98,7,0.12)", color: OPS.warning }}>Reopen</button>
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
            <input type="number" min="0" value={editDraft.cashCollected} onChange={(e) => setEditDraft((prev) => ({ ...prev, cashCollected: e.target.value }))} placeholder="Cash collected" style={dashInputStyle} />
            <input type="number" min="0" value={editDraft.upiCollected} onChange={(e) => setEditDraft((prev) => ({ ...prev, upiCollected: e.target.value }))} placeholder="UPI collected" style={dashInputStyle} />
          </div>
          <div style={{ marginTop: 8, fontSize: "0.78rem", color: "rgba(15,23,42,0.55)", fontFamily: APP_FONT_STACK }}>
            Ticket total Rs. {editingTicket?.total || 0} | Collected Rs. {(Number(editDraft.cashCollected) || 0) + (Number(editDraft.upiCollected) || 0)} | Pending Rs. {Math.max((Number(editingTicket?.total) || 0) - ((Number(editDraft.cashCollected) || 0) + (Number(editDraft.upiCollected) || 0)), 0)}
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
            <div style={{ fontSize: "0.52rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(15,23,42,0.42)", marginBottom: 4 }}>{stat.label}</div>
            <div style={{ fontFamily: APP_SERIF_STACK, fontSize: "1.6rem", fontWeight: 300, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: "0.52rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: DS.wine, marginBottom: 8 }}>Open Tickets</div>
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

      <div style={{ fontSize: "0.52rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(15,23,42,0.45)", marginBottom: 8 }}>Closed Tickets</div>
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
    </div>
  );
}

// --- B2B TAB ---
function B2BWorkspace({ ledger = [], onAddLedgerEntry, onDeleteLedgerEntry }) {
  const b2bVendors = [
    {
      id: "asaan_kagajat_raja",
      vendor: "Asaan Kagajat (RAJA)",
      inboundServices: ["Notary", "Mobile Number Update"],
      outboundServices: ["Document Printing", "Aadhaar Support", "Form Filling"],
    },
    {
      id: "raj_akansha",
      vendor: "RAJ/AKANSHA",
      inboundServices: ["PVC Card", "Lamination", "Mobile Number Update", "Aadhaar Appointment"],
      outboundServices: ["Certificate Printing", "Application Filing", "Document Scan"],
    },
  ];
  const [activeVendorId, setActiveVendorId] = useState(() => b2bVendors[0]?.id || "");
  const [flow, setFlow] = useState("vendor_to_us");
  const [serviceName, setServiceName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [rate, setRate] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("UPI");
  const [entryDate, setEntryDate] = useState(() => getTicketCounterDateKey(new Date()));
  const [entryNote, setEntryNote] = useState("");
  const [includeInDailyRevenue, setIncludeInDailyRevenue] = useState(true);
  const [formError, setFormError] = useState("");

  const normalizedLedger = useMemo(() => hydrateB2BLedger(ledger), [ledger]);
  const activeVendor = b2bVendors.find((vendor) => vendor.id === activeVendorId) || b2bVendors[0] || null;
  const serviceSuggestions = activeVendor
    ? (flow === "vendor_to_us" ? activeVendor.inboundServices : activeVendor.outboundServices)
    : [];
  const amountPreview = Math.max(1, Number(quantity) || 1) * Math.max(0, Number(rate) || 0);
  const paidPreview = Math.max(0, Math.min(amountPreview, Number(paidAmount) || 0));
  const pendingPreview = Math.max(0, amountPreview - paidPreview);
  const serviceListId = activeVendor ? `b2b_service_options_${activeVendor.id}_${flow}` : "b2b_service_options";
  const todayKey = getTicketCounterDateKey(new Date());

  useEffect(() => {
    if (!activeVendor) return;
    setServiceName(serviceSuggestions[0] || "");
  }, [activeVendorId, flow]);

  useEffect(() => {
    setIncludeInDailyRevenue(flow === "us_to_vendor");
  }, [flow]);

  const vendorSummaries = useMemo(() => (
    b2bVendors.map((vendor) => {
      const vendorEntries = normalizedLedger
        .filter((entry) => entry.vendorId === vendor.id || entry.vendorName === vendor.vendor)
        .sort((a, b) => {
          const byDate = String(b.entryDate || "").localeCompare(String(a.entryDate || ""));
          if (byDate !== 0) return byDate;
          return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
        });
      const purchases = vendorEntries.filter((entry) => entry.flow === "vendor_to_us");
      const sales = vendorEntries.filter((entry) => entry.flow === "us_to_vendor");
      return {
        ...vendor,
        entries: vendorEntries,
        purchasesValue: purchases.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0),
        purchasesPaid: purchases.reduce((sum, entry) => sum + (Number(entry.paidAmount) || 0), 0),
        purchasesPending: purchases.reduce((sum, entry) => sum + (Number(entry.pendingAmount) || 0), 0),
        salesValue: sales.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0),
        salesCollected: sales.reduce((sum, entry) => sum + (Number(entry.paidAmount) || 0), 0),
        salesPending: sales.reduce((sum, entry) => sum + (Number(entry.pendingAmount) || 0), 0),
      };
    })
  ), [normalizedLedger]);
  const activeSummary = vendorSummaries.find((vendor) => vendor.id === activeVendorId) || vendorSummaries[0] || null;
  const formatCurrency = (value) => `Rs. ${Math.round(Number(value) || 0).toLocaleString("en-IN")}`;
  const formatEntryDate = (value) => {
    const parsed = new Date(`${String(value || "").trim()}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return value || "N/A";
    return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const handleAddEntry = () => {
    if (!activeVendor) return;
    const trimmedService = String(serviceName || "").trim();
    const qtyNum = Math.max(1, Number(quantity) || 1);
    const rateNum = Math.max(0, Number(rate) || 0);
    const amount = qtyNum * rateNum;
    const paid = Math.max(0, Math.min(amount, Number(paidAmount) || 0));
    const normalizedEntryDate = toIsoDateKey(entryDate) || todayKey;

    if (!trimmedService) {
      setFormError("Service name is required.");
      return;
    }
    if (rateNum <= 0) {
      setFormError("B2B rate must be greater than zero.");
      return;
    }
    if (amount <= 0) {
      setFormError("Amount must be greater than zero.");
      return;
    }

    setFormError("");
    onAddLedgerEntry?.({
      id: `b2b_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      vendorId: activeVendor.id,
      vendorName: activeVendor.vendor,
      flow,
      serviceName: trimmedService,
      quantity: qtyNum,
      rate: rateNum,
      amount,
      paidAmount: paid,
      paymentMode,
      entryDate: normalizedEntryDate,
      note: String(entryNote || "").trim(),
      includeInDailyRevenue: flow === "us_to_vendor" ? includeInDailyRevenue : false,
      createdAt: new Date().toISOString(),
    });
    setRate("");
    setPaidAmount("");
    setQuantity("1");
    setEntryNote("");
    setServiceName(serviceSuggestions[0] || "");
  };
  const handleB2BFormSubmit = (event) => {
    event.preventDefault();
    handleAddEntry();
  };

  const handleDeleteEntry = (entry) => {
    if (!entry?.id || typeof onDeleteLedgerEntry !== "function") return;
    const confirmed = typeof window !== "undefined"
      ? window.confirm(`Delete B2B entry for ${entry.serviceName}? This cannot be undone.`)
      : false;
    if (!confirmed) return;
    if (!verifyDeleteAccess(`delete B2B entry ${entry.id}`)) return;
    onDeleteLedgerEntry(entry.id);
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 14 }}>
        <div style={{ flex: "1 1 250px", minWidth: 240, background: "rgba(255,255,255,0.72)", borderRadius: 14, border: "1px solid rgba(15,23,42,0.10)", padding: 12 }}>
          <div style={{ fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.26em", textTransform: "uppercase", color: DS.wine, fontFamily: APP_BRAND_STACK, marginBottom: 10 }}>
            Vendors
          </div>
          <div role="tablist" aria-label="B2B vendor list" style={{ display: "grid", gap: 7 }}>
            {vendorSummaries.map((vendor) => {
              const active = vendor.id === activeSummary?.id;
              return (
                <button
                  key={vendor.id}
                  role="tab"
                  aria-selected={active}
                  aria-controls={`b2b_vendor_panel_${vendor.id}`}
                  id={`b2b_vendor_tab_${vendor.id}`}
                  onClick={() => setActiveVendorId(vendor.id)}
                  style={{
                    borderRadius: 10,
                    border: active ? "1px solid rgba(37,99,235,0.35)" : "1px solid rgba(15,23,42,0.10)",
                    background: active ? "rgba(37,99,235,0.09)" : "rgba(255,255,255,0.65)",
                    padding: "9px 10px",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", fontFamily: APP_FONT_STACK }}>
                    {vendor.vendor}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "rgba(15,23,42,0.55)", marginTop: 2, fontFamily: APP_FONT_STACK }}>
                    Purchases {formatCurrency(vendor.purchasesValue)} | Sales {formatCurrency(vendor.salesValue)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div
          role="tabpanel"
          id={`b2b_vendor_panel_${activeSummary?.id || "none"}`}
          aria-labelledby={`b2b_vendor_tab_${activeSummary?.id || "none"}`}
          style={{ flex: "2 1 480px", minWidth: 280, background: "rgba(255,255,255,0.72)", borderRadius: 14, border: "1px solid rgba(15,23,42,0.10)", padding: 14 }}
        >
          {!activeSummary ? (
            <div style={{ color: "rgba(15,23,42,0.55)", fontFamily: APP_FONT_STACK }}>No vendor selected.</div>
          ) : (
            <>
              <div style={{ fontFamily: APP_SERIF_STACK, fontSize: "1.2rem", fontWeight: 300, color: "#0f172a", marginBottom: 6 }}>
                {activeSummary.vendor}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8, marginBottom: 10 }}>
                {[
                  { label: "Purchases", value: activeSummary.purchasesValue, color: "#1d4ed8" },
                  { label: "Vendor Pending", value: activeSummary.purchasesPending, color: "#0f172a" },
                  { label: "Sales", value: activeSummary.salesValue, color: "#1d4ed8" },
                  { label: "Collection Pending", value: activeSummary.salesPending, color: "#0f172a" },
                ].map((item) => (
                  <div key={item.label} style={{ borderRadius: 10, border: "1px solid rgba(15,23,42,0.10)", background: "rgba(255,255,255,0.60)", padding: "8px 9px" }}>
                    <div style={{ fontSize: "0.46rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(15,23,42,0.45)", fontFamily: APP_BRAND_STACK, marginBottom: 4 }}>
                      {item.label}
                    </div>
                    <div style={{ fontFamily: APP_SERIF_STACK, fontSize: "1.05rem", fontWeight: 300, color: item.color, lineHeight: 1 }}>
                      {formatCurrency(item.value)}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gap: 6, marginBottom: 10 }}>
                <div style={{ fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(15,23,42,0.45)", fontFamily: APP_BRAND_STACK }}>
                  Vendor Services
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {activeSummary.inboundServices.map((service) => (
                    <span key={`${activeSummary.id}_in_${service}`} style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "#1f2937", background: "rgba(15,23,42,0.06)", border: "1px solid rgba(15,23,42,0.11)", borderRadius: 999, padding: "4px 8px", fontFamily: APP_BRAND_STACK }}>
                      IN: {service}
                    </span>
                  ))}
                  {activeSummary.outboundServices.map((service) => (
                    <span key={`${activeSummary.id}_out_${service}`} style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "#1d4ed8", background: "rgba(59,130,246,0.10)", border: "1px solid rgba(59,130,246,0.24)", borderRadius: 999, padding: "4px 8px", fontFamily: APP_BRAND_STACK }}>
                      OUT: {service}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(15,23,42,0.45)", fontFamily: APP_BRAND_STACK, marginBottom: 6 }}>
                Recent Entries
              </div>
              {activeSummary.entries.length === 0 ? (
                <div style={{ background: "rgba(255,255,255,0.65)", border: "1px dashed rgba(15,23,42,0.14)", borderRadius: 10, padding: 12, color: "rgba(15,23,42,0.55)", fontSize: "0.82rem", fontFamily: APP_FONT_STACK }}>
                  No ledger entries for this vendor yet. Add a B2B entry below to start tracking payments and services.
                </div>
              ) : (
                <div style={{ display: "grid", gap: 7 }}>
                  {activeSummary.entries.slice(0, 8).map((entry) => (
                    <div key={entry.id} style={{ borderRadius: 10, border: "1px solid rgba(15,23,42,0.10)", background: "rgba(255,255,255,0.60)", padding: "9px 10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <div style={{ fontSize: "0.84rem", fontWeight: 600, color: "#0f172a", fontFamily: APP_FONT_STACK }}>
                          {entry.serviceName}
                        </div>
                        <button onClick={() => handleDeleteEntry(entry)} style={{ border: "1px solid rgba(214,5,43,0.28)", borderRadius: 999, background: "rgba(214,5,43,0.08)", color: "#1d4ed8", fontSize: "0.52rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", padding: "4px 8px", cursor: "pointer" }}>
                          Delete
                        </button>
                      </div>
                      <div style={{ fontSize: "0.74rem", color: "rgba(15,23,42,0.58)", marginTop: 3, fontFamily: APP_FONT_STACK }}>
                        {entry.flow === "vendor_to_us" ? "From Vendor" : "To Vendor"} | Qty {entry.quantity} x Rs. {entry.rate} = {formatCurrency(entry.amount)}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "rgba(15,23,42,0.52)", marginTop: 2, fontFamily: APP_FONT_STACK }}>
                        {entry.paymentStatus} | Paid {formatCurrency(entry.paidAmount)} | Pending {formatCurrency(entry.pendingAmount)} | {entry.paymentMode} | {formatEntryDate(entry.entryDate)}
                      </div>
                      {entry.flow === "us_to_vendor" && entry.includeInDailyRevenue && (
                        <div style={{ marginTop: 3, fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#1d4ed8", fontFamily: APP_BRAND_STACK }}>
                          Included in daily revenue
                        </div>
                      )}
                      {entry.note && (
                        <div style={{ marginTop: 3, fontSize: "0.72rem", color: "rgba(15,23,42,0.52)", fontFamily: APP_FONT_STACK }}>
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

      <form onSubmit={handleB2BFormSubmit} style={{ background: "rgba(255,255,255,0.72)", borderRadius: 14, border: "1px solid rgba(15,23,42,0.10)", padding: 14 }}>
        <div style={{ fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.26em", textTransform: "uppercase", color: DS.wine, fontFamily: APP_BRAND_STACK, marginBottom: 8 }}>
          Add B2B Entry
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
          <label style={{ display: "grid", gap: 5 }}>
            <span style={{ fontSize: "0.74rem", color: "rgba(15,23,42,0.60)", fontFamily: APP_FONT_STACK }}>Vendor</span>
            <select value={activeVendorId} onChange={(e) => setActiveVendorId(e.target.value)} style={{ padding: "10px 12px", borderRadius: 9, border: "1px solid rgba(15,23,42,0.12)", background: "rgba(255,255,255,0.85)", color: "#0f172a", fontFamily: APP_FONT_STACK, fontSize: "0.84rem" }}>
              {b2bVendors.map((vendor) => (
                <option key={`b2b_vendor_select_${vendor.id}`} value={vendor.id} style={MENU_OPTION_STYLE}>{vendor.vendor}</option>
              ))}
            </select>
          </label>
          <label style={{ display: "grid", gap: 5 }}>
            <span style={{ fontSize: "0.74rem", color: "rgba(15,23,42,0.60)", fontFamily: APP_FONT_STACK }}>Flow</span>
            <select value={flow} onChange={(e) => setFlow(e.target.value)} style={{ padding: "10px 12px", borderRadius: 9, border: "1px solid rgba(15,23,42,0.12)", background: "rgba(255,255,255,0.85)", color: "#0f172a", fontFamily: APP_FONT_STACK, fontSize: "0.84rem" }}>
              <option value="vendor_to_us" style={MENU_OPTION_STYLE}>From Vendor (Our Cost)</option>
              <option value="us_to_vendor" style={MENU_OPTION_STYLE}>To Vendor (Our Revenue)</option>
            </select>
          </label>
          <label style={{ display: "grid", gap: 5 }}>
            <span style={{ fontSize: "0.74rem", color: "rgba(15,23,42,0.60)", fontFamily: APP_FONT_STACK }}>Service</span>
            <input
              list={serviceListId}
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              placeholder="Service name"
              style={{ padding: "10px 12px", borderRadius: 9, border: "1px solid rgba(15,23,42,0.12)", background: "rgba(255,255,255,0.85)", color: "#0f172a", fontFamily: APP_FONT_STACK, fontSize: "0.84rem" }}
            />
            <datalist id={serviceListId}>
              {serviceSuggestions.map((service) => (
                <option key={`${serviceListId}_${service}`} value={service} />
              ))}
            </datalist>
          </label>
          <label style={{ display: "grid", gap: 5 }}>
            <span style={{ fontSize: "0.74rem", color: "rgba(15,23,42,0.60)", fontFamily: APP_FONT_STACK }}>Quantity</span>
            <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} style={{ padding: "10px 12px", borderRadius: 9, border: "1px solid rgba(15,23,42,0.12)", background: "rgba(255,255,255,0.85)", color: "#0f172a", fontFamily: APP_FONT_STACK, fontSize: "0.84rem" }} />
          </label>
          <label style={{ display: "grid", gap: 5 }}>
            <span style={{ fontSize: "0.74rem", color: "rgba(15,23,42,0.60)", fontFamily: APP_FONT_STACK }}>B2B Rate (Rs.)</span>
            <input type="number" min="0" value={rate} onChange={(e) => setRate(e.target.value)} style={{ padding: "10px 12px", borderRadius: 9, border: "1px solid rgba(15,23,42,0.12)", background: "rgba(255,255,255,0.85)", color: "#0f172a", fontFamily: APP_FONT_STACK, fontSize: "0.84rem" }} />
          </label>
          <label style={{ display: "grid", gap: 5 }}>
            <span style={{ fontSize: "0.74rem", color: "rgba(15,23,42,0.60)", fontFamily: APP_FONT_STACK }}>Paid Amount (Rs.)</span>
            <input type="number" min="0" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} style={{ padding: "10px 12px", borderRadius: 9, border: "1px solid rgba(15,23,42,0.12)", background: "rgba(255,255,255,0.85)", color: "#0f172a", fontFamily: APP_FONT_STACK, fontSize: "0.84rem" }} />
          </label>
          <label style={{ display: "grid", gap: 5 }}>
            <span style={{ fontSize: "0.74rem", color: "rgba(15,23,42,0.60)", fontFamily: APP_FONT_STACK }}>Payment Mode</span>
            <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} style={{ padding: "10px 12px", borderRadius: 9, border: "1px solid rgba(15,23,42,0.12)", background: "rgba(255,255,255,0.85)", color: "#0f172a", fontFamily: APP_FONT_STACK, fontSize: "0.84rem" }}>
              {["Cash", "UPI", "Bank Transfer", "Credit", "Unspecified"].map((mode) => (
                <option key={`b2b_mode_${mode}`} value={mode} style={MENU_OPTION_STYLE}>{mode}</option>
              ))}
            </select>
          </label>
          <label style={{ display: "grid", gap: 5 }}>
            <span style={{ fontSize: "0.74rem", color: "rgba(15,23,42,0.60)", fontFamily: APP_FONT_STACK }}>Date</span>
            <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} style={{ padding: "10px 12px", borderRadius: 9, border: "1px solid rgba(15,23,42,0.12)", background: "rgba(255,255,255,0.85)", color: "#0f172a", fontFamily: APP_FONT_STACK, fontSize: "0.84rem" }} />
          </label>
          <label style={{ display: "grid", gap: 5 }}>
            <span style={{ fontSize: "0.74rem", color: "rgba(15,23,42,0.60)", fontFamily: APP_FONT_STACK }}>Note</span>
            <input value={entryNote} onChange={(e) => setEntryNote(e.target.value)} placeholder="Optional note" style={{ padding: "10px 12px", borderRadius: 9, border: "1px solid rgba(15,23,42,0.12)", background: "rgba(255,255,255,0.85)", color: "#0f172a", fontFamily: APP_FONT_STACK, fontSize: "0.84rem" }} />
          </label>
        </div>

        {flow === "us_to_vendor" && (
          <label style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 10, padding: "8px 10px", border: "1px solid rgba(37,99,235,0.22)", borderRadius: 9, background: "rgba(37,99,235,0.08)", cursor: "pointer" }}>
            <input type="checkbox" checked={includeInDailyRevenue} onChange={(e) => setIncludeInDailyRevenue(e.target.checked)} />
            <span style={{ fontSize: "0.78rem", color: "rgba(15,23,42,0.72)", fontFamily: APP_FONT_STACK }}>
              Include this sale in daily revenue
            </span>
          </label>
        )}

        <div style={{ marginTop: 10, fontSize: "0.80rem", color: "rgba(15,23,42,0.60)", fontFamily: APP_FONT_STACK }}>
          Amount {formatCurrency(amountPreview)} | Paid {formatCurrency(paidPreview)} | Pending {formatCurrency(pendingPreview)}
        </div>
        {formError && (
          <div style={{ marginTop: 8, color: "#1d4ed8", fontSize: "0.80rem", fontFamily: APP_FONT_STACK, fontWeight: 600 }}>
            {formError}
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <button type="submit" style={{ border: "1px solid rgba(37,99,235,0.40)", borderRadius: 999, background: "rgba(37,99,235,0.12)", color: "#1e40af", fontFamily: APP_BRAND_STACK, fontWeight: 700, fontSize: "0.56rem", letterSpacing: "0.20em", textTransform: "uppercase", padding: "11px 18px", cursor: "pointer" }}>
            Add B2B Entry
          </button>
        </div>
      </form>
    </div>
  );
}

// --- Monthly Overview ---
function MonthlyOverview({ tickets }) {
  const normalized = tickets.map((t) => t.structured ? t : withStructuredTicket(t));

  const byMonth = {};
  normalized.forEach((t) => {
    const normalizedDateKey = toIsoDateKey(t.entryDateKey || t.structured?.meta?.createdDate || t.date || "");
    const key = normalizedDateKey ? normalizedDateKey.slice(0, 7) : "Unknown";
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(t);
  });
  const months = Object.keys(byMonth).sort().reverse();

  const allRevenue = normalized.reduce((s, t) => s + (Number(t.structured?.payment?.paidTotal) || 0), 0);
  const allPending = normalized.reduce((s, t) => s + (Number(t.structured?.payment?.pendingBalance) || 0), 0);
  const openCount = normalized.filter((t) => t.status !== "Closed").length;
  const closedCount = normalized.filter((t) => t.status === "Closed").length;

  const eb = { fontSize: "0.48rem", fontWeight: 700, letterSpacing: "0.32em", textTransform: "uppercase", color: DS.wine, fontFamily: APP_BRAND_STACK, display: "block", marginBottom: 5 };
  const card = { background: "rgba(255,255,255,0.75)", border: "1px solid rgba(15,23,42,0.09)", borderRadius: 16, boxShadow: "0 4px 16px rgba(15,23,42,0.06)" };

  const hasData = normalized.length > 0;

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>

      {/* Hero summary strip */}
      <div style={{ ...card, padding: "22px 24px", marginBottom: 24, backgroundImage: "radial-gradient(circle at 5% 10%, rgba(59,130,246,0.14), transparent 32%), radial-gradient(circle at 92% 88%, rgba(37,99,235,0.08), transparent 30%)" }}>
        <span style={eb}>Centre Performance</span>
        <div style={{ fontFamily: APP_SERIF_STACK, fontSize: "clamp(1.4rem, 2.5vw, 2rem)", fontWeight: 300, color: "#0f172a", letterSpacing: "-0.02em", marginBottom: 18, lineHeight: 1 }}>
          Monthly <em style={{ fontStyle: "italic", color: "rgba(15,23,42,0.45)" }}>Overview.</em>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
          {[
            { label: "Total Tickets", value: normalized.length, color: "#0f172a" },
            { label: "Open", value: openCount, color: "#2563eb" },
            { label: "Closed", value: closedCount, color: DS.wine },
            { label: "Revenue", value: `Rs. ${allRevenue.toLocaleString("en-IN")}`, color: "#2a5a8f" },
            { label: "Pending", value: `Rs. ${allPending.toLocaleString("en-IN")}`, color: DS.wine },
            { label: "Months Active", value: months.filter((m) => m !== "Unknown").length, color: "#0f172a" },
          ].map((s) => (
            <div key={s.label} style={{ background: "rgba(15,23,42,0.04)", border: "1px solid rgba(15,23,42,0.08)", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontSize: "0.44rem", fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(15,23,42,0.38)", fontFamily: APP_BRAND_STACK, marginBottom: 5 }}>{s.label}</div>
              <div style={{ fontFamily: APP_SERIF_STACK, fontSize: "1.4rem", fontWeight: 300, color: s.color, lineHeight: 1 }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Category breakdown bar  -  always shown */}
      <div style={{ ...card, padding: "18px 20px", marginBottom: 24 }}>
        <span style={eb}>Service Mix  -  All Time</span>
        <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
          {CATEGORIES.map((cat) => {
            const count = normalized.filter((t) => (t.structured?.meta?.serviceTypes || []).includes(cat)).length;
            const pct = normalized.length > 0 ? Math.round((count / normalized.length) * 100) : 0;
            return (
              <div key={cat}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: CAT_COLORS[cat], display: "inline-block", flexShrink: 0 }} />
                    <span style={{ fontSize: "0.80rem", fontFamily: APP_FONT_STACK, color: "rgba(15,23,42,0.72)" }}>{cat}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: "0.72rem", fontFamily: APP_MONO_STACK, color: CAT_COLORS[cat], fontWeight: 700 }}>{count}</span>
                    <span style={{ fontSize: "0.66rem", fontFamily: APP_MONO_STACK, color: "rgba(15,23,42,0.35)" }}>{pct}%</span>
                  </div>
                </div>
                <div style={{ height: 5, borderRadius: 999, background: "rgba(15,23,42,0.07)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, borderRadius: 999, background: CAT_COLORS[cat], transition: "width 0.6s ease", minWidth: pct > 0 ? 6 : 0 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Empty state */}
      {!hasData && (
        <div style={{ ...card, padding: "40px 28px", textAlign: "center" }}>
          <div style={{ fontFamily: APP_SERIF_STACK, fontSize: "1.4rem", fontWeight: 300, color: "#0f172a", marginBottom: 10 }}>
            No tickets recorded yet.
          </div>
          <div style={{ fontSize: "0.84rem", color: "rgba(15,23,42,0.50)", fontFamily: APP_FONT_STACK, lineHeight: 1.7, maxWidth: 400, margin: "0 auto" }}>
            Once you start creating service tickets from the <strong>Service Entry</strong> tab, monthly breakdowns, revenue trends, and category insights will appear here automatically.
          </div>
        </div>
      )}

      {/* Per-month cards */}
      {months.map((month) => {
        const mTickets = byMonth[month];
        const mRevenue = mTickets.reduce((s, t) => s + (Number(t.structured?.payment?.paidTotal) || 0), 0);
        const mPending = mTickets.reduce((s, t) => s + (Number(t.structured?.payment?.pendingBalance) || 0), 0);
        const mOpen = mTickets.filter((t) => t.status !== "Closed").length;
        const mClosed = mTickets.filter((t) => t.status === "Closed").length;
        const paid = mTickets.filter((t) => t.structured?.payment?.status === "Paid").length;
        const partial = mTickets.filter((t) => t.structured?.payment?.status === "Partial").length;
        const unpaid = mTickets.filter((t) => ["Unpaid", undefined].includes(t.structured?.payment?.status)).length;

        const catCounts = {};
        mTickets.forEach((t) => (t.structured?.meta?.serviceTypes || []).forEach((cat) => { catCounts[cat] = (catCounts[cat] || 0) + 1; }));

        const label = (() => {
          if (!/^\d{4}-\d{2}$/.test(month)) return "Undated";
          const [y, m] = month.split("-");
          const parsedMonth = new Date(Number(y), Number(m) - 1, 1);
          if (Number.isNaN(parsedMonth.getTime())) return "Undated";
          return parsedMonth.toLocaleString("en-IN", { month: "long", year: "numeric" });
        })();

        return (
          <div key={month} style={{ ...card, marginBottom: 18, overflow: "hidden" }}>
            {/* Month header */}
            <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid rgba(15,23,42,0.07)", backgroundImage: "radial-gradient(circle at 98% 0%, rgba(59,130,246,0.12), transparent 30%)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <span style={eb}>Period</span>
                  <div style={{ fontFamily: APP_SERIF_STACK, fontSize: "1.55rem", fontWeight: 300, color: "#0f172a", letterSpacing: "-0.02em", lineHeight: 1 }}>{label}</div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[
                    { l: "Tickets", v: mTickets.length, c: "#0f172a" },
                    { l: "Collected", v: `Rs. ${mRevenue.toLocaleString("en-IN")}`, c: "#2a5a8f" },
                    { l: "Pending", v: `Rs. ${mPending.toLocaleString("en-IN")}`, c: DS.wine },
                  ].map((s) => (
                    <div key={s.l} style={{ background: "rgba(15,23,42,0.04)", border: "1px solid rgba(15,23,42,0.08)", borderRadius: 10, padding: "8px 14px", textAlign: "right" }}>
                      <div style={{ fontSize: "0.42rem", fontWeight: 700, letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(15,23,42,0.36)", fontFamily: APP_BRAND_STACK, marginBottom: 3 }}>{s.l}</div>
                      <div style={{ fontFamily: APP_SERIF_STACK, fontSize: "1.05rem", fontWeight: 300, color: s.c }}>{s.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 0 }}>
              {/* Payment breakdown */}
              <div style={{ padding: "14px 20px", borderRight: "1px solid rgba(15,23,42,0.06)" }}>
                <span style={eb}>Payment Status</span>
                <div style={{ display: "grid", gap: 8, marginTop: 6 }}>
                  {[
                    { l: "Paid", v: paid, bar: "#2a6647", bg: "rgba(42,102,71,0.10)" },
                    { l: "Partial", v: partial, bar: "#2563eb", bg: "rgba(59,130,246,0.10)" },
                    { l: "Unpaid", v: unpaid, bar: DS.wine, bg: "rgba(37,99,235,0.10)" },
                  ].map((p) => (
                    <div key={p.l} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: p.bar, flexShrink: 0 }} />
                      <span style={{ fontSize: "0.80rem", color: "rgba(15,23,42,0.65)", fontFamily: APP_FONT_STACK, flex: 1 }}>{p.l}</span>
                      <span style={{ fontFamily: APP_MONO_STACK, fontSize: "0.88rem", fontWeight: 700, color: p.bar, background: p.bg, borderRadius: 6, padding: "2px 8px" }}>{p.v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                  {[{ l: "Open", v: mOpen, c: "#2563eb" }, { l: "Closed", v: mClosed, c: DS.wine }].map((s) => (
                    <div key={s.l} style={{ flex: 1, background: "rgba(15,23,42,0.04)", borderRadius: 8, padding: "7px 10px", border: "1px solid rgba(15,23,42,0.07)" }}>
                      <div style={{ fontSize: "0.42rem", fontWeight: 700, letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(15,23,42,0.36)", fontFamily: APP_BRAND_STACK, marginBottom: 3 }}>{s.l}</div>
                      <div style={{ fontFamily: APP_SERIF_STACK, fontSize: "1.1rem", fontWeight: 300, color: s.c }}>{s.v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category breakdown */}
              <div style={{ padding: "14px 20px" }}>
                <span style={eb}>By Service Category</span>
                <div style={{ display: "grid", gap: 8, marginTop: 6 }}>
                  {Object.keys(catCounts).length === 0 ? (
                    <div style={{ fontSize: "0.78rem", color: "rgba(15,23,42,0.35)", fontFamily: APP_FONT_STACK }}>No category data</div>
                  ) : Object.entries(catCounts).sort((a, b) => b[1] - a[1]).map(([cat, count]) => {
                    const pct = Math.round((count / mTickets.length) * 100);
                    return (
                      <div key={cat}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: CAT_COLORS[cat] || "#888", flexShrink: 0, display: "inline-block" }} />
                            <span style={{ fontSize: "0.76rem", color: "rgba(15,23,42,0.65)", fontFamily: APP_FONT_STACK }}>{cat}</span>
                          </div>
                          <span style={{ fontFamily: APP_MONO_STACK, fontSize: "0.76rem", fontWeight: 700, color: CAT_COLORS[cat] || "#0f172a" }}>{count}</span>
                        </div>
                        <div style={{ height: 4, borderRadius: 999, background: "rgba(15,23,42,0.07)" }}>
                          <div style={{ height: "100%", width: `${pct}%`, borderRadius: 999, background: CAT_COLORS[cat] || "#888", minWidth: pct > 0 ? 4 : 0 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Ticket rows */}
            <div style={{ borderTop: "1px solid rgba(15,23,42,0.07)" }}>
              <div style={{ padding: "10px 20px 6px" }}>
                <span style={{ ...eb, marginBottom: 8 }}>Ticket Log</span>
              </div>
              {mTickets.map((t, i) => {
                const ps = t.structured?.payment?.status || "Unpaid";
                const psColor = ps === "Paid" ? "#2a6647" : ps === "Partial" ? "#2563eb" : DS.wine;
                return (
                  <div key={t.ticketNo} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "9px 20px", borderTop: i > 0 ? "1px solid rgba(15,23,42,0.05)" : "none", flexWrap: "wrap", transition: "background 0.15s ease" }}
                    onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.60)"}
                    onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
                      <span style={{ fontFamily: APP_MONO_STACK, fontSize: "0.65rem", color: "rgba(15,23,42,0.35)", flexShrink: 0 }}>{t.ticketNo}</span>
                      <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#0f172a", fontFamily: APP_FONT_STACK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.customerName}</span>
                      <span style={{ fontSize: "0.72rem", color: "rgba(15,23,42,0.40)", fontFamily: APP_FONT_STACK, display: "none" }}>{t.structured?.meta?.primaryType || " - "}</span>
                    </div>
                    <div style={{ display: "flex", gap: 7, alignItems: "center", flexShrink: 0 }}>
                      <span style={{ fontFamily: APP_MONO_STACK, fontSize: "0.80rem", color: "#2a5a8f", fontWeight: 600 }}>Rs. {(t.total || 0).toLocaleString("en-IN")}</span>
                      <span style={{ fontSize: "0.56rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: psColor, background: `${psColor}15`, border: `1px solid ${psColor}28`, borderRadius: 999, padding: "3px 9px" }}>{ps}</span>
                      <span style={{ fontSize: "0.56rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: t.status === "Closed" ? DS.wine : "#2563eb", background: t.status === "Closed" ? "rgba(37,99,235,0.07)" : "rgba(59,130,246,0.10)", border: `1px solid ${t.status === "Closed" ? "rgba(37,99,235,0.20)" : "rgba(59,130,246,0.24)"}`, borderRadius: 999, padding: "3px 9px" }}>{t.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --- Customers ---
function CustomersWorkspace({ tickets, onDeleteCustomer }) {
  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState(null);

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
  const handleDeleteCustomer = (customer) => {
    if (typeof onDeleteCustomer !== "function" || !customer) return;
    const targetLabel = customer.phone
      ? `${customer.name} (+91 ${customer.phone})`
      : customer.name;
    const confirmed = typeof window !== "undefined"
      ? window.confirm(`Delete customer ${targetLabel} and all linked tickets? This cannot be undone.`)
      : false;
    if (!confirmed) return;
    if (!verifyDeleteAccess(`delete customer ${customer.name}`)) return;
    onDeleteCustomer({ name: customer.name, phone: customer.phone || "" });
    setSelectedKey(null);
  };

  const eb = { fontSize: "0.48rem", fontWeight: 700, letterSpacing: "0.32em", textTransform: "uppercase", color: DS.wine, fontFamily: APP_BRAND_STACK, display: "block", marginBottom: 5 };
  const card = { background: "rgba(255,255,255,0.75)", border: "1px solid rgba(15,23,42,0.09)", borderRadius: 16, boxShadow: "0 4px 16px rgba(15,23,42,0.06)" };
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
              <div style={{ fontSize: "0.44rem", fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(15,23,42,0.38)", fontFamily: APP_BRAND_STACK, marginBottom: 5 }}>{s.label}</div>
              <div style={{ fontFamily: APP_SERIF_STACK, fontSize: "1.4rem", fontWeight: 300, color: s.color, lineHeight: 1 }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "minmax(280px,1fr) minmax(0,1.4fr)" : "1fr", gap: 16, alignItems: "start" }}>

        {/* Left: search + list */}
        <div>
          <div style={{ marginBottom: 12 }}>
            <input placeholder="Search by name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} style={inputSt} />
          </div>

          {filtered.length === 0 ? (
            <div style={{ ...card, padding: "40px 24px", textAlign: "center" }}>
              <div style={{ fontFamily: APP_SERIF_STACK, fontSize: "1.3rem", fontWeight: 300, color: "#0f172a", marginBottom: 8 }}>
                {customers.length === 0 ? "No customers yet." : "No results."}
              </div>
              <div style={{ fontSize: "0.82rem", color: "rgba(15,23,42,0.48)", fontFamily: APP_FONT_STACK, lineHeight: 1.7, maxWidth: 340, margin: "0 auto" }}>
                {customers.length === 0
                  ? "Customers are automatically created from tickets. Start by adding a ticket in the Service Entry tab."
                  : "Try a different name or phone number."}
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
                            <span key={cat} style={{ fontSize: "0.52rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: CAT_COLORS[cat] || "#888", background: `${CAT_COLORS[cat] || "#888"}18`, border: `1px solid ${CAT_COLORS[cat] || "#888"}28`, borderRadius: 999, padding: "2px 8px" }}>{cat}</span>
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
            <div style={{ position: "sticky", top: 80 }}>
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
                        style={{ border: "1px solid rgba(15,23,42,0.12)", borderRadius: 999, padding: "7px 14px", background: "rgba(255,255,255,0.70)", color: "rgba(15,23,42,0.55)", fontFamily: APP_BRAND_STACK, fontSize: "0.54rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", cursor: "pointer", flexShrink: 0 }}
                      >
                        Close
                      </button>
                      <button
                        onClick={() => handleDeleteCustomer(selected)}
                        style={{ border: "1px solid rgba(220,38,38,0.28)", borderRadius: 999, padding: "7px 14px", background: "rgba(220,38,38,0.08)", color: "#b91c1c", fontFamily: APP_BRAND_STACK, fontSize: "0.54rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer", flexShrink: 0 }}
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
                        <div style={{ fontSize: "0.42rem", fontWeight: 700, letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(15,23,42,0.36)", fontFamily: APP_BRAND_STACK, marginBottom: 4 }}>{s.l}</div>
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
                            <span style={{ fontSize: "0.54rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: doc.required ? DS.wine : "rgba(15,23,42,0.40)", background: doc.required ? "rgba(37,99,235,0.07)" : "rgba(15,23,42,0.04)", borderRadius: 999, padding: "3px 8px", border: `1px solid ${doc.required ? "rgba(37,99,235,0.18)" : "rgba(15,23,42,0.08)"}` }}>{doc.required ? "Required" : "Optional"}</span>
                            <span style={{ fontSize: "0.54rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: doc.submitted ? "#2a6647" : "#2563eb", background: doc.submitted ? "rgba(42,102,71,0.08)" : "rgba(59,130,246,0.09)", borderRadius: 999, padding: "3px 8px", border: `1px solid ${doc.submitted ? "rgba(42,102,71,0.18)" : "rgba(59,130,246,0.22)"}` }}>{doc.submitted ? "Submitted" : "Pending"}</span>
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
                              <span style={{ fontSize: "0.54rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: psColor, background: `${psColor}15`, border: `1px solid ${psColor}28`, borderRadius: 999, padding: "3px 9px" }}>{ps}</span>
                              <span style={{ fontSize: "0.54rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: t.status === "Closed" ? DS.wine : "#2563eb", background: t.status === "Closed" ? "rgba(37,99,235,0.07)" : "rgba(59,130,246,0.09)", border: `1px solid ${t.status === "Closed" ? "rgba(37,99,235,0.18)" : "rgba(59,130,246,0.22)"}`, borderRadius: 999, padding: "3px 9px" }}>{t.status}</span>
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
        <div style={{ fontSize: "0.52rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.32em", textTransform: "uppercase", color: DS.wine, marginBottom: 10 }}>
          Quick Walk-In
        </div>
        <div style={{ fontFamily: APP_SERIF_STACK, fontSize: "1.65rem", fontWeight: 300, letterSpacing: "-0.02em", color: "#0f172a", marginBottom: 6, lineHeight: 1.1 }}>
          Start <em style={{ fontStyle: "italic" }}>instantly.</em>
        </div>
        <div style={{ fontSize: "0.84rem", color: "rgba(15,23,42,0.58)", fontFamily: APP_FONT_STACK, lineHeight: 1.65, marginBottom: 22 }}>
          Enter the customer name and start the ticket immediately  -  no WhatsApp needed.
        </div>

        <form onSubmit={handleStartSubmit}>
          <div style={{ display: "grid", gap: 14, marginBottom: 18 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: "0.52rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: DS.wine }}>Customer Name *</span>
              <input autoFocus placeholder="e.g. Rahul Sharma" value={name} onChange={(e) => { setName(e.target.value); setError(""); }} style={inputSt} />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: "0.52rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(15,23,42,0.42)" }}>Phone (optional)</span>
              <input type="tel" placeholder="10-digit mobile" value={phone} onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setError(""); }} style={inputSt} />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: "0.52rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(15,23,42,0.42)" }}>Operator</span>
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
      providedDocIds: [],
      items: [],
      documents: [],
    });
    setShowWalkIn(false);
    navigateTab("entry");
    setEntryWorkspaceKey((prev) => prev + 1);
  };

  const saveTicket = (ticket) => setTickets((prev) => [...prev, withStructuredTicket(ticket)]);
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
        description: "Custom quick access link",
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
    const result = await verifyDatabaseAccessOnServer({ securityCode, authenticatorCode });
    if (!result?.ok) return result;
    setDatabaseUnlocked(true);
    setShowDatabaseGate(false);
    navigateTab("database", "push", { bypassDatabaseGate: true });
    return { ok: true };
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
      <style>{`
        :root { color-scheme: light; }
        * { box-sizing: border-box; }
        html, body {
          margin: 0;
          background: #f8fbff;
          color: #0f172a;
        }
        body, button, input, select, textarea {
          font-family: ${APP_FONT_STACK};
          color: #0f172a;
        }
        input::placeholder, textarea::placeholder {
          color: rgba(15,23,42,0.45);
        }
        select option {
          background: #ffffff;
          color: #0f172a;
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
          from { box-shadow: 0 0 0 0 rgba(37,99,235,0); }
          to   { box-shadow: 0 0 22px 4px rgba(37,99,235,0.08); }
        }
        .csc-sidebar-nav::-webkit-scrollbar { width: 4px; }
        .csc-sidebar-nav::-webkit-scrollbar-track { background: transparent; }
        .csc-sidebar-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 999px; }
        .csc-content-scroll::-webkit-scrollbar { width: 4px; }
        .csc-content-scroll::-webkit-scrollbar-track { background: transparent; }
        .csc-content-scroll::-webkit-scrollbar-thumb { background: rgba(15,23,42,0.12); border-radius: 999px; }
        input[type="checkbox"] { accent-color: ${DS.wine}; cursor: pointer; }
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
              background: "rgba(15,23,42,0.28)",
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
          background: "#ffffff",
          position: "relative",
        }}>
          {/* Subtle grid texture */}
          <div style={{ display: isHomeTab ? "none" : "block", position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.18, backgroundImage: "linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px)", backgroundSize: "72px 72px" }} />

          {!isHomeTab && (
          <>
          {/* Top bar */}
          <header style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            background: `rgba(255,255,255,0.92)`,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottom: `1px solid rgba(15,23,42,0.10)`,
            padding: "0 28px",
            height: 60,
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
                  border: "1px solid rgba(15,23,42,0.16)",
                  borderRadius: 999,
                  padding: "6px 11px",
                  background: "rgba(255,255,255,0.86)",
                  color: "rgba(15,23,42,0.78)",
                  fontFamily: APP_BRAND_STACK,
                  fontWeight: 700,
                  fontSize: "0.56rem",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
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
                    <span style={{ width: 10, height: 1.5, borderRadius: 999, background: "rgba(15,23,42,0.72)", display: "block" }} />
                    <span style={{ width: 10, height: 1.5, borderRadius: 999, background: "rgba(15,23,42,0.72)", display: "block" }} />
                    <span style={{ width: 10, height: 1.5, borderRadius: 999, background: "rgba(15,23,42,0.72)", display: "block" }} />
                  </span>
                )}
                {isSidebarOpen ? "Hide Menu" : "Menu"}
              </button>
              <button
                onClick={() => navigateTab("home")}
                style={{
                  border: "1px solid rgba(37,99,235,0.28)",
                  borderRadius: 999,
                  padding: "6px 11px",
                  background: "rgba(37,99,235,0.10)",
                  color: "#1d4ed8",
                  fontFamily: APP_BRAND_STACK,
                  fontWeight: 700,
                  fontSize: "0.56rem",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Home
              </button>
              <div style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "#2563eb", opacity: 0.7, flexShrink: 0,
              }} />
              <div style={{
                fontFamily: APP_BRAND_STACK,
                fontSize: "0.80rem",
                fontWeight: 700,
                color: "#0f172a",
                letterSpacing: "0.04em",
              }}>
                {activeTabConfig.label}
              </div>
              <div style={{
                fontSize: "0.68rem", color: "rgba(15,23,42,0.38)",
                fontFamily: APP_FONT_STACK, fontWeight: 400,
              }}>
                {activeTabConfig.description}
              </div>
            </div>

            {/* Stats strip + WhatsApp CTA */}
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              {headerStats.map((stat) => (
                <div key={stat.label} style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.20em", textTransform: "uppercase", color: "rgba(15,23,42,0.38)", fontFamily: APP_BRAND_STACK, marginBottom: 2 }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: "0.86rem", fontWeight: 700, color: stat.accent || "#0f172a", fontFamily: APP_MONO_STACK, letterSpacing: "-0.01em" }}>
                    {stat.value}
                  </div>
                </div>
              ))}
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.20em", textTransform: "uppercase", color: "rgba(15,23,42,0.38)", fontFamily: APP_BRAND_STACK, marginBottom: 2 }}>
                  Data Sync
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 999, padding: "5px 10px", border: `1px solid ${cloudSyncState === "sync_failed" ? "rgba(214,5,43,0.30)" : cloudSyncState === "synced" ? "rgba(42,102,71,0.30)" : "rgba(15,23,42,0.16)"}`, background: cloudSyncState === "sync_failed" ? "rgba(214,5,43,0.08)" : cloudSyncState === "synced" ? "rgba(42,102,71,0.10)" : "rgba(15,23,42,0.05)" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: cloudSyncAccent, display: "inline-block" }} />
                  <span style={{ fontSize: "0.62rem", fontWeight: 700, color: cloudSyncAccent, fontFamily: APP_BRAND_STACK, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                    {cloudSyncLabel}
                  </span>
                  {cloudSyncState === "synced" && cloudLastSyncedAt && (
                    <span style={{ fontSize: "0.68rem", color: "rgba(15,23,42,0.40)", fontFamily: APP_MONO_STACK }}>
                      {formatSyncTime(cloudLastSyncedAt)}
                    </span>
                  )}
                </div>
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
            padding: "28px 32px 22px",
            borderBottom: `1px solid rgba(15,23,42,0.09)`,
            backgroundImage: `radial-gradient(circle at 8% 8%, rgba(59,130,246,0.20), transparent 32%), radial-gradient(circle at 90% 90%, rgba(37,99,235,0.10), transparent 30%)`,
            position: "relative",
            zIndex: 1,
          }}>
            <div style={{
              fontSize: "0.52rem",
              fontWeight: 700,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: DS.wine,
              fontFamily: APP_BRAND_STACK,
              marginBottom: 10,
            }}>
              CSC Centre Workspace
            </div>
            <h1 style={{
              margin: 0,
              fontFamily: APP_FONT_STACK,
              fontSize: "clamp(1.5rem, 2.8vw, 2.2rem)",
              fontWeight: 800,
              lineHeight: 1.0,
              letterSpacing: "-0.03em",
              color: "#0f172a",
            }}>
              {activeTabConfig.label}
            </h1>
            <p style={{
              margin: "10px 0 0",
              fontSize: "0.86rem",
              lineHeight: 1.72,
              color: "rgba(15,23,42,0.60)",
              maxWidth: 520,
              fontFamily: APP_FONT_STACK,
              fontWeight: 400,
            }}>
              {activeTabConfig.description}
            </p>
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
              <TicketWorkspace key={entryWorkspaceKey} services={services} tickets={tickets} onSaveTicket={saveTicket} onNavigateTab={navigateTab} isActive={tab === "entry"} />
            </TabPanel>
            <TabPanel active={tab === "rates"}>
              <RateCard services={services} setServices={setServices} />
            </TabPanel>
            <TabPanel active={tab === "log"}>
              <TicketDashboard
                tickets={tickets}
                onToggleTicketStatus={toggleTicketStatus}
                onToggleTaskDone={toggleTaskDone}
                onUpdateTicket={updateTicket}
                onDeleteTicket={deleteTicket}
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
              <MonthlyOverview tickets={tickets} />
            </TabPanel>
            <TabPanel active={tab === "database"}>
              <DatabaseWorkspace
                tickets={tickets}
                services={services}
                b2bLedger={b2bLedger}
                records={databaseRecords}
                onUpsertRecord={upsertDatabaseRecord}
                onDeleteRecord={deleteDatabaseRecord}
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
              <DocumentToolsWorkspace tickets={tickets} />
            </TabPanel>
            <TabPanel active={tab === "services_dashboard"}>
              <ServicesDashboardWorkspace services={services} tickets={tickets} />
            </TabPanel>
            <TabPanel active={tab === "customers"}>
              <CustomersWorkspace tickets={tickets} onDeleteCustomer={deleteCustomerTickets} />
            </TabPanel>
          </div>
        </main>

      </div>
    </div>
  );
}







