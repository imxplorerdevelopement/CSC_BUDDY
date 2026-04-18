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
  "Government ID":       "#4a82c0",
  "Certificates":        "#3a9e78",
  "Legal & Docs":        "#c0414a",
  "Government Services": "#c8922a",
  "Typing & Print":      "#8b6fc0",
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
const MENU_OPTION_STYLE = { color: "#15120f", backgroundColor: "#fffaf2" };
const MENU_OPTGROUP_STYLE = { color: "rgba(21,18,15,0.58)", backgroundColor: "#f8f1e4" };
const BRAND_PRIMARY = DS.wine;
const BRAND_PRIMARY_DARK = "#6b2323";
const BRAND_PRIMARY_SOFT = "rgba(143,47,47,0.14)";
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
  services: "csc-buddy.services",
  tickets: "csc-buddy.tickets",
  ticketDraft: "csc-buddy.ticket-draft",
  ticketCounter: "csc-buddy.ticket-counter",
  quickLinks: "csc-buddy.quick-links",
};
const TAB_CONFIG = [
  { id: "entry", label: "Service Entry", description: "Create tickets and capture walk-ins.", shortLabel: "SE", navGroup: "primary" },
  { id: "rates", label: "Rate Card", description: "Maintain service pricing and categories.", shortLabel: "RC", navGroup: "primary" },
  { id: "log", label: "Ticket Dashboard", description: "Track payment, status, and document flow.", shortLabel: "TD", navGroup: "panel" },
  { id: "b2b", label: "B2B Desk", description: "Prepare partner and bulk workflows.", shortLabel: "B2", navGroup: "panel" },
  { id: "monthly", label: "Monthly Overview", description: "Revenue, volume, and service trends by month.", shortLabel: "MO", navGroup: "panel" },
  { id: "customers", label: "Customers", description: "Customer profiles, documents, and contact history.", shortLabel: "CU", navGroup: "panel" },
];
const PRIMARY_TAB_CONFIG = TAB_CONFIG.filter((item) => item.navGroup === "primary");
const PANEL_TAB_CONFIG = TAB_CONFIG.filter((item) => item.navGroup === "panel");
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
  if (canUseBrowserHistory()) {
    const historyTab = window.history.state?.tab;
    if (TAB_CONFIG.some((item) => item.id === historyTab)) return historyTab;
  }
  return getStoredActiveTab();
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
  const rateCard = normalizeRateCard(service?.rateCard, service?.price);
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

function getStoredActiveTab() {
  const storedTab = readStoredJSON(STORAGE_KEYS.activeTab, "entry");
  return TAB_CONFIG.some((item) => item.id === storedTab) ? storedTab : "entry";
}

function getStoredSidePanelExpanded() {
  const storedValue = readStoredJSON(STORAGE_KEYS.sidePanelExpanded, false);
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

//  Tab Button — vertical sidebar nav item
function TabBtn({ label, description, active, onClick, badge }) {
  return (
    <button onClick={onClick} aria-pressed={active} style={{
      width: "100%", padding: "10px 12px 10px 14px", border: "none",
      background: active ? OPS.primarySoft : "transparent",
      cursor: "pointer", transition: "all 0.18s ease",
      display: "flex", alignItems: "center", gap: 10, textAlign: "left",
      borderRadius: 10,
      boxShadow: active ? `inset 3px 0 0 ${OPS.primary}` : `inset 3px 0 0 ${OPS.borderSoft}`,
      outline: "none",
    }}>
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

  // Cream ink helpers
  const rcInput = {
    padding: "9px 12px", borderRadius: 10, border: "1px solid rgba(21,18,15,0.13)",
    background: "rgba(255,255,255,0.80)", color: "#15120f", outline: "none",
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
                          <span style={{ fontSize: "0.76rem", color: OPS.textMuted }}>Rs. {service.price || 0} · {service.unit}</span>
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
          fontSize: "0.86rem", fontFamily: APP_FONT_STACK, color: "#8f1020",
        }}>
          <span style={{ fontWeight: 700, fontSize: "1rem", color: "#c0001a" }}>!</span>
          <span><strong>{unpriced} services</strong> still have a Rs. 0 rate. Tickets with only zero-rated items are blocked at save time.</span>
        </div>
      )}

      {/* Summary stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 28 }}>
        {quantityModeSummary.map((item) => (
          <div key={item.id} style={{
            background: "rgba(255,255,255,0.72)", border: "1px solid rgba(21,18,15,0.09)",
            borderRadius: 14, padding: "14px 16px",
            boxShadow: "0 4px 12px rgba(17,14,12,0.05)",
          }}>
            <div style={rcEyebrow}>{item.label}</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 300, color: "#15120f", fontFamily: APP_SERIF_STACK, lineHeight: 1.1 }}>{item.count}</div>
            <div style={{ fontSize: "0.76rem", color: "rgba(21,18,15,0.52)", lineHeight: 1.5, fontFamily: APP_FONT_STACK, marginTop: 4 }}>
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
            border: "1px solid rgba(21,18,15,0.10)",
            boxShadow: "0 4px 16px rgba(17,14,12,0.05)",
          }}>
            {/* Category header */}
            <div style={{
              background: `rgba(${rgb},0.10)`,
              borderBottom: "1px solid rgba(21,18,15,0.08)",
              padding: "11px 18px",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
              <span style={{ fontFamily: APP_BRAND_STACK, fontWeight: 700, fontSize: "0.60rem", letterSpacing: "0.28em", textTransform: "uppercase", color }}>
                {cat}
              </span>
              <span style={{ marginLeft: "auto", fontSize: "0.72rem", color: "rgba(21,18,15,0.40)", fontFamily: APP_FONT_STACK }}>
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
                    borderBottom: i < catServices.length - 1 ? "1px solid rgba(21,18,15,0.07)" : "none",
                    gap: 16, transition: "background 0.15s ease",
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.82)"}
                  onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                >
                  {/* Service info */}
                  <div>
                    <div style={{ fontSize: "0.90rem", fontWeight: 600, color: "#15120f", fontFamily: APP_FONT_STACK, lineHeight: 1.3 }}>
                      {s.name}
                    </div>
                    <div style={{ fontSize: "0.76rem", color: "rgba(21,18,15,0.50)", fontFamily: APP_FONT_STACK, marginTop: 3, display: "flex", alignItems: "center", gap: 8 }}>
                      <span>{s.unit}</span>
                      {s.variable && <span style={{ background: "rgba(211,166,90,0.18)", color: "#7b5d2c", borderRadius: 999, padding: "1px 8px", fontSize: "0.62rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" }}>variable</span>}
                    </div>
                    <div style={{ fontSize: "0.70rem", color: "rgba(21,18,15,0.38)", marginTop: 5, fontFamily: APP_FONT_STACK }}>
                      Template: <strong style={{ color: "rgba(21,18,15,0.55)" }}>{getDetailSchemaTitle(s.detailSchemaId)}</strong>
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
                      <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "rgba(21,18,15,0.45)", fontFamily: APP_MONO_STACK }}>Rs.</span>
                      <input
                        autoFocus type="number" defaultValue={s.price || ""} placeholder="0"
                        onBlur={(e) => { updatePrice(s.id, e.target.value); setEditingId(null); }}
                        onKeyDown={(e) => { if (e.key === "Enter") { updatePrice(s.id, e.target.value); setEditingId(null); } }}
                        style={{
                          width: 80, padding: "8px 10px",
                          border: "2px solid rgba(143,47,47,0.50)", borderRadius: 8,
                          fontSize: "0.88rem", fontWeight: 600, fontFamily: APP_MONO_STACK,
                          outline: "none", textAlign: "right",
                          background: "rgba(255,255,255,0.90)", color: "#15120f",
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
                        color: s.price > 0 ? "#7b5d2c" : "rgba(21,18,15,0.30)",
                        background: s.price > 0 ? "rgba(211,166,90,0.14)" : "rgba(21,18,15,0.04)",
                        border: s.price > 0 ? "1px solid rgba(211,166,90,0.30)" : "1px dashed rgba(21,18,15,0.16)",
                        minWidth: 88, textAlign: "right", transition: DS.transColor,
                      }}
                    >
                      {s.price > 0 ? `Rs. ${s.price}` : "Rs. —"}
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
          border: "1px dashed rgba(21,18,15,0.18)", borderRadius: 12,
          background: "rgba(255,255,255,0.60)", cursor: "pointer",
          fontFamily: APP_BRAND_STACK, fontSize: "0.60rem",
          letterSpacing: "0.22em", textTransform: "uppercase",
          color: "rgba(21,18,15,0.45)", fontWeight: 700, transition: DS.transColor,
        }}>
          + Add Custom Service
        </button>
      ) : (
        <div style={{
          border: "1px solid rgba(143,47,47,0.22)", borderRadius: 16, padding: 22,
          background: "rgba(255,255,255,0.72)", boxShadow: "0 6px 18px rgba(17,14,12,0.06)",
        }}>
          <div style={rcEyebrow}>New Service</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12, marginTop: 8 }}>
            <input placeholder="Service name" value={customName} onChange={(e) => setCustomName(e.target.value)}
              style={{ ...rcInput, flex: 2, minWidth: 160 }} />
            <div style={{ display: "flex", alignItems: "center", border: "1px solid rgba(21,18,15,0.13)", borderRadius: 10, background: "rgba(255,255,255,0.80)", paddingRight: 10 }}>
              <span style={{ paddingLeft: 12, color: "#7b5d2c", fontWeight: 600, fontSize: "0.85rem", fontFamily: APP_MONO_STACK }}>Rs.</span>
              <input placeholder="0" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} type="number"
                style={{ width: 80, padding: "9px 8px", border: "none", background: "transparent", fontSize: "0.88rem", fontFamily: APP_MONO_STACK, outline: "none", textAlign: "right", color: "#15120f" }} />
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
            <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", border: "1px solid rgba(21,18,15,0.10)", borderRadius: 10, background: "rgba(255,255,255,0.60)", cursor: "pointer" }}>
              <input type="checkbox" checked={customVariable} onChange={(e) => setCustomVariable(e.target.checked)} />
              <span style={{ fontSize: "0.82rem", color: "rgba(21,18,15,0.70)", fontWeight: 500, fontFamily: APP_FONT_STACK }}>Allow custom amount at ticket desk</span>
            </label>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={addCustom} style={{
              flex: 1, padding: "12px", borderRadius: 999,
              background: "rgba(143,47,47,0.12)", color: "#6b1f1f",
              border: "1px solid rgba(143,47,47,0.38)",
              fontWeight: 700, fontSize: "0.60rem", letterSpacing: "0.20em",
              textTransform: "uppercase", cursor: "pointer", fontFamily: APP_BRAND_STACK,
            }}>
              Save Service
            </button>
            <button onClick={() => setAddingCustom(false)} style={{
              padding: "12px 22px", borderRadius: 999,
              background: "rgba(255,255,255,0.72)", color: "rgba(21,18,15,0.60)",
              border: "1px solid rgba(21,18,15,0.14)",
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
    border: "1px solid rgba(21,18,15,0.10)",
    padding: 22,
    boxShadow: "0 20px 52px rgba(17,14,12,0.10)",
    backdropFilter: "blur(4px)",
  };
  const softPanelStyle = {
    background: "rgba(255,255,255,0.52)",
    borderRadius: 14,
    border: "1px solid rgba(21,18,15,0.07)",
    padding: 18,
    boxShadow: "0 10px 24px rgba(17,14,12,0.06)",
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
    border: "1px solid rgba(21,18,15,0.12)",
    borderRadius: 10,
    background: "rgba(255,255,255,0.82)",
    color: "#15120f",
    outline: "none",
    fontFamily: APP_FONT_STACK,
    fontSize: "0.88rem",
    boxShadow: "inset 0 1px 2px rgba(21,18,15,0.04)",
  };
  const primaryButtonStyle = {
    border: "1px solid rgba(143,47,47,0.50)",
    borderRadius: 999,
    padding: "12px 22px",
    background: "rgba(143,47,47,0.14)",
    color: "#6b1f1f",
    fontFamily: APP_BRAND_STACK,
    fontWeight: 700,
    fontSize: "0.6rem",
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    cursor: "pointer",
    transition: "all 0.22s ease",
  };
  const secondaryButtonStyle = {
    border: "1px solid rgba(21,18,15,0.14)",
    borderRadius: 999,
    padding: "12px 22px",
    background: "rgba(255,255,255,0.72)",
    color: "rgba(21,18,15,0.78)",
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
    ? "#8f1020"
    : draftStorageState === "saving"
      ? "#7b5d2c"
      : "rgba(21,18,15,0.55)";
  const workspaceMetrics = [
    {
      label: "Current step",
      value: step === 1 ? "Intake" : "Ticket",
      helper: step === 1 ? "Capture holder and optional reference" : "Build tasks and payment",
    },
    {
      label: "Services added",
      value: String(items.length),
      helper: items.length > 0 ? `Draft total Rs. ${total}` : "No services selected yet",
    },
    {
      label: "Required docs",
      value: `${submittedRequiredDocsCount}/${requiredDocsCount}`,
      helper: requiredDocsCount > 0 ? "Submitted vs tracked" : "No required docs yet",
    },
    {
      label: "Balance",
      value: `Rs. ${pendingBalance}`,
      helper: paidTotal > 0 ? `Collected Rs. ${paidTotal}` : "No payment collected",
    },
  ];
  const flowNavItems = [
    {
      id: "home",
      label: "Intake (Home)",
      helper: "Capture holder and reference details",
      active: step === 1,
      action: () => {
        if (step === 1) return;
        navigateToStep(1, "replace");
      },
    },
    {
      id: "second",
      label: "Ticket Builder (Second)",
      helper: "Add services, documents, and payment",
      active: step === 2,
      action: () => {
        if (step === 2) return;
        createTicket();
      },
    },
  ];
  const goToPageItems = [
    { id: "rates", label: "Rate Card", helper: "Edit service rules", tabId: "rates" },
    { id: "log", label: "Ticket Dashboard", helper: "Review saved tickets", tabId: "log" },
    { id: "b2b", label: "B2B Desk", helper: "Jump to partner workspace", tabId: "b2b" },
  ];

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
    };
    const targetRef = refByField[fieldKey];
    if (!targetRef?.current) return;
    targetRef.current.focus();
    targetRef.current.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  };

  const validateIntakeDetails = () => {
    const trimmedName = customerName.trim();
    const phoneDigits = sanitizePhone(customerPhone);
    const trimmedReferenceName = referenceName.trim();
    const trimmedReferenceLabel = referenceLabel.trim();
    const referenceEnabled = hasReference && Boolean(trimmedReferenceName);
    const nextErrors = {};

    if (!trimmedName) {
      nextErrors.customerName = "Document holder name is required.";
    }
    if (hasReference && !trimmedReferenceName) {
      nextErrors.referenceName = "Reference name is required when reference is enabled.";
    }
    if (phoneDigits && !PHONE_REGEX.test(phoneDigits)) {
      nextErrors.customerPhone = "Contact number must be exactly 10 digits.";
    }

    setIntakeFieldErrors(nextErrors);

    const firstInvalidField = ["customerName", "referenceName", "customerPhone"].find((fieldKey) => nextErrors[fieldKey]);
    if (firstInvalidField) {
      setError(nextErrors[firstInvalidField]);
      focusIntakeField(firstInvalidField);
    }

    return {
      isValid: !firstInvalidField,
      trimmedName,
      phoneDigits,
      trimmedReferenceName,
      trimmedReferenceLabel,
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
    const intakeValidation = validateIntakeDetails();
    if (!intakeValidation.isValid) {
      return;
    }

    const { trimmedName, phoneDigits, trimmedReferenceName, trimmedReferenceLabel, referenceEnabled } = intakeValidation;
    setTicketMeta({
      ticketNo: generateBillNo(),
      date: todayStr(),
      time: timeStr(),
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
      setError("Add at least one service before saving ticket.");
      return;
    }
    if (isOverpaid) {
      setError("Collected amount cannot exceed ticket total.");
      return;
    }
    if (hasOnlyZeroPricedItems) {
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
        <div id="receipt" style={{ background: "rgba(255,250,242,0.96)", border: "1px solid rgba(21,18,15,0.12)", borderRadius: 20, padding: "28px 24px", maxWidth: 420, margin: "0 auto", color: "#15120f", boxShadow: "0 20px 52px rgba(17,14,12,0.12)" }}>
          <div style={{ fontFamily: APP_BRAND_STACK, fontSize: "0.6rem", letterSpacing: "0.36em", textTransform: "uppercase", color: DS.wine, textAlign: "center", marginBottom: 8 }}>CSC Ticket Slip</div>
          <div style={{ fontFamily: APP_SERIF_STACK, fontSize: "0.72rem", textAlign: "center", color: saved.status === "Open" ? "#7b5d2c" : DS.wine, fontWeight: 400, marginBottom: 16, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            {saved.status}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: "0.66rem", fontFamily: APP_BRAND_STACK, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(21,18,15,0.45)" }}>Document Holder</div>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", fontFamily: APP_FONT_STACK }}>{saved.customerName}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.66rem", fontFamily: APP_BRAND_STACK, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(21,18,15,0.45)" }}>Ticket</div>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", fontFamily: APP_MONO_STACK }}>{saved.ticketNo}</div>
            </div>
          </div>
          <div style={{ fontSize: "0.78rem", color: "rgba(21,18,15,0.55)", marginBottom: 5, fontFamily: APP_FONT_STACK }}>
            Reference Contact: {formatReferenceSummary(toStructuredTicket(saved).parties.reference)}
          </div>
          {!!saved.customerPhone && (
            <div style={{ fontSize: "0.78rem", color: "rgba(21,18,15,0.55)", marginBottom: 12, fontFamily: APP_FONT_STACK }}>Contact: {saved.customerPhone}</div>
          )}
          <div style={{ borderTop: "1px solid rgba(21,18,15,0.10)", borderBottom: "1px solid rgba(21,18,15,0.10)", padding: "10px 0", marginBottom: 12 }}>
            {saved.items.map((it, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "0.84rem", fontFamily: APP_FONT_STACK, color: "#15120f" }}>
                <span>{it.name}</span>
                <span style={{ color: "rgba(21,18,15,0.55)" }}>×{it.qty}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontFamily: APP_FONT_STACK, color: "rgba(21,18,15,0.60)" }}>
            <span>Operator: {saved.operator}</span>
            <span>Pay: {saved.payMode}</span>
          </div>
          <div style={{ marginTop: 5, fontSize: "0.78rem", color: "rgba(21,18,15,0.55)", fontFamily: APP_FONT_STACK }}>
            Payment: {saved.paymentStatus || "Unpaid"} | Paid Rs. {saved.paidTotal || 0} | Pending Rs. {saved.pendingBalance || 0}
          </div>
          <div style={{ marginTop: 5, fontSize: "0.78rem", color: "rgba(21,18,15,0.55)", fontFamily: APP_FONT_STACK }}>
            Docs: {saved.documents?.filter((doc) => doc.required && doc.submitted).length || 0}/{saved.documents?.filter((doc) => doc.required).length || 0} required submitted
          </div>
          {!!saved.documents?.filter((doc) => doc.submitted).length && (
            <div style={{ marginTop: 5, fontSize: "0.72rem", color: "rgba(21,18,15,0.45)", fontFamily: APP_FONT_STACK }}>
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
      {!saved && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 16 }}>
          {workspaceMetrics.map((metric) => (
            <div key={metric.label} style={{ ...surfaceCardStyle, padding: 16, minHeight: 106 }}>
              <div style={{ ...sectionEyebrowStyle, marginBottom: 6 }}>
                {metric.label}
              </div>
              <div style={{ fontFamily: APP_SERIF_STACK, fontSize: "1.7rem", fontWeight: 300, letterSpacing: "-0.02em", color: "#15120f", marginBottom: 4, lineHeight: 1 }}>
                {metric.value}
              </div>
              <div style={{ fontSize: "0.78rem", lineHeight: 1.55, color: "rgba(21,18,15,0.58)" }}>
                {metric.helper}
              </div>
            </div>
          ))}
        </div>
      )}

      {!saved && (
        <div style={{ ...surfaceCardStyle, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "flex-start", marginBottom: 14 }}>
            <div>
              <div style={sectionEyebrowStyle}>Flow Map</div>
              <div style={{ fontFamily: APP_SERIF_STACK, fontSize: "1.45rem", fontWeight: 300, letterSpacing: "-0.015em", color: "#15120f", marginBottom: 6 }}>
                Intake, Ticket Builder, and Workspace Switch
              </div>
              <div style={{ maxWidth: 620, fontSize: "0.84rem", lineHeight: 1.7, color: "rgba(21,18,15,0.60)" }}>
                Use Intake for customer context, Ticket Builder for services and payment, and Workspace Switch to jump tabs without losing draft state.
              </div>
            </div>
            <div style={{ ...smallBadgeStyle, background: "rgba(21,18,15,0.05)", border: "1px solid rgba(21,18,15,0.10)", color: "rgba(21,18,15,0.55)" }}>
              Browser back stays in flow
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, marginBottom: 12 }}>
            {flowNavItems.map((item) => (
              <button
                key={item.id}
                onClick={item.action}
                style={{
                  textAlign: "left",
                  padding: "14px 16px",
                  borderRadius: 14,
                  border: item.active ? "1px solid rgba(143,47,47,0.35)" : "1px solid rgba(21,18,15,0.09)",
                  background: item.active ? "linear-gradient(180deg, rgba(143,47,47,0.09) 0%, rgba(143,47,47,0.05) 100%)" : "rgba(255,255,255,0.60)",
                  color: item.active ? DS.wine : "#15120f",
                  cursor: "pointer",
                  boxShadow: item.active ? "0 8px 24px rgba(143,47,47,0.10)" : "0 4px 12px rgba(17,14,12,0.04)",
                  transition: "all 0.2s ease",
                  fontFamily: APP_FONT_STACK,
                }}
              >
                <div style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 5, color: item.active ? DS.wine : "#15120f" }}>{item.label}</div>
                <div style={{ fontSize: "0.78rem", lineHeight: 1.5, color: item.active ? DS.wine : "rgba(21,18,15,0.55)" }}>{item.helper}</div>
              </button>
            ))}
          </div>
          <div style={{ ...softPanelStyle, padding: 14 }}>
            <div style={{ ...sectionEyebrowStyle, marginBottom: 8 }}>Switch Workspace (Go To Page)</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
              {goToPageItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigateTab?.(item.tabId)}
                  style={{
                    textAlign: "left",
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: "1px solid rgba(21,18,15,0.08)",
                    background: "rgba(255,255,255,0.72)",
                    color: "#15120f",
                    cursor: "pointer",
                    fontFamily: APP_FONT_STACK,
                    transition: "all 0.18s ease",
                  }}
                >
                  <div style={{ fontSize: "0.86rem", fontWeight: 700, marginBottom: 3 }}>{item.label}</div>
                  <div style={{ fontSize: "0.76rem", lineHeight: 1.5, color: "rgba(21,18,15,0.55)" }}>{item.helper}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 1 && (() => {
        const WIZARD_STEPS = [
          { num: 1, label: "Reference", short: "Ref" },
          { num: 2, label: "Customer", short: "Info" },
          { num: 3, label: "Documents", short: "Docs" },
          { num: 4, label: "Operator", short: "Op" },
        ];
        const totalSubSteps = WIZARD_STEPS.length;

        const goNextSubStep = () => {
          if (subStep === 2) {
            const intakeValidation = validateIntakeDetails();
            if (!intakeValidation.isValid) return;
          }
          setError("");
          if (subStep < totalSubSteps) setSubStep(subStep + 1);
          else createTicket();
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
                <div style={sectionEyebrowStyle}>Intake — Step {subStep} of {totalSubSteps}</div>
                <div style={{ ...smallBadgeStyle, background: "rgba(184,148,63,0.12)", border: "1px solid rgba(184,148,63,0.30)", color: draftStatusAccent }}>
                  {draftStatusLabel}{draftSavedAt ? ` · ${formatSyncTime(draftSavedAt)}` : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {WIZARD_STEPS.map((ws, i) => {
                  const done = subStep > ws.num;
                  const active = subStep === ws.num;
                  return (
                    <React.Fragment key={ws.num}>
                      <button
                        onClick={() => { setError(""); setSubStep(ws.num); }}
                        style={{
                          display: "flex", alignItems: "center", gap: 7,
                          padding: "7px 13px", borderRadius: 999, border: "none",
                          background: active ? DS.wine : done ? "rgba(143,47,47,0.12)" : "rgba(21,18,15,0.06)",
                          color: active ? "#fff" : done ? DS.wine : "rgba(21,18,15,0.45)",
                          fontFamily: APP_BRAND_STACK, fontWeight: 700, fontSize: "0.58rem",
                          letterSpacing: "0.18em", textTransform: "uppercase",
                          cursor: done ? "pointer" : active ? "default" : "not-allowed",
                          transition: "all 0.22s ease",
                          pointerEvents: done ? "auto" : active ? "none" : "none",
                        }}
                      >
                        <span style={{
                          width: 18, height: 18, borderRadius: "50%",
                          background: active ? "rgba(255,255,255,0.22)" : done ? DS.wine : "rgba(21,18,15,0.10)",
                          color: active ? "#fff" : done ? "#fff" : "rgba(21,18,15,0.40)",
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.62rem", fontWeight: 700, fontFamily: APP_BRAND_STACK,
                          flexShrink: 0,
                        }}>
                          {done ? "✓" : ws.num}
                        </span>
                        {ws.label}
                      </button>
                      {i < WIZARD_STEPS.length - 1 && (
                        <div style={{ flex: 1, height: 1, background: done ? "rgba(143,47,47,0.25)" : "rgba(21,18,15,0.08)", borderRadius: 1, minWidth: 8 }} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
              {/* thin progress bar */}
              <div style={{ marginTop: 12, height: 3, borderRadius: 3, background: "rgba(21,18,15,0.07)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${((subStep - 1) / (totalSubSteps - 1)) * 100}%`, background: `linear-gradient(90deg, ${DS.wine}, rgba(211,166,90,0.80))`, borderRadius: 3, transition: "width 0.40s cubic-bezier(0.16,1,0.3,1)" }} />
              </div>
            </div>

            {/* Sub-step panels */}
            {subStep === 1 && (
              <div style={{ animation: "fadeIn 0.28s ease-out" }}>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: "1.55rem", fontWeight: 700, letterSpacing: "-0.02em", color: "#15120f", marginBottom: 6, lineHeight: 1.1, fontFamily: APP_FONT_STACK }}>
                    Reference Contact
                  </div>
                  <div style={{ fontSize: "0.87rem", lineHeight: 1.7, color: "rgba(21,18,15,0.60)", maxWidth: 560 }}>
                    Add a reference only when someone else needs to be attached to this ticket.
                    You can name the reference however it fits the case.
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                  {[
                    {
                      id: "no_reference",
                      icon: "—",
                      title: "No Reference",
                      helper: "The document holder is the only person on this ticket.",
                      active: !hasReference,
                      onClick: () => {
                        setHasReference(false);
                        setIntakeFieldErrors((prev) => ({ ...prev, referenceName: "" }));
                        setError("");
                      },
                    },
                    {
                      id: "with_reference",
                      icon: "+",
                      title: "Add Reference",
                      helper: "Another person should be attached — agent, relative, or colleague.",
                      active: hasReference,
                      onClick: () => {
                        setHasReference(true);
                        setError("");
                      },
                    },
                  ].map((choice) => (
                    <button
                      key={choice.id}
                      onClick={choice.onClick}
                      style={{
                        textAlign: "left", padding: "20px 18px", borderRadius: 16,
                        border: choice.active ? "1.5px solid rgba(143,47,47,0.45)" : "1px solid rgba(21,18,15,0.10)",
                        background: choice.active ? "linear-gradient(135deg, rgba(143,47,47,0.09) 0%, rgba(143,47,47,0.04) 100%)" : "rgba(255,255,255,0.72)",
                        cursor: "pointer", fontFamily: APP_FONT_STACK,
                        transition: "all 0.22s ease",
                        boxShadow: choice.active ? "0 10px 28px rgba(143,47,47,0.12)" : "0 4px 14px rgba(17,14,12,0.05)",
                      }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: 10, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", fontWeight: 700, background: choice.active ? "rgba(143,47,47,0.14)" : "rgba(21,18,15,0.06)", color: choice.active ? DS.wine : "rgba(21,18,15,0.40)" }}>
                        {choice.icon}
                      </div>
                      <div style={{ fontSize: "1rem", fontWeight: 700, color: choice.active ? DS.wine : "#15120f", marginBottom: 7 }}>{choice.title}</div>
                      <div style={{ fontSize: "0.83rem", color: choice.active ? "rgba(143,47,47,0.70)" : "rgba(21,18,15,0.52)", lineHeight: 1.55 }}>
                        {choice.helper}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {subStep === 2 && (
              <div style={{ animation: "fadeIn 0.28s ease-out" }}>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: "1.55rem", fontWeight: 700, letterSpacing: "-0.02em", color: "#15120f", marginBottom: 6, lineHeight: 1.1, fontFamily: APP_FONT_STACK }}>
                    Customer Details
                  </div>
                  <div style={{ fontSize: "0.87rem", lineHeight: 1.7, color: "rgba(21,18,15,0.60)" }}>
                    Who is this file for? {hasReference ? "Add their reference contact below too." : "No reference will be added."}
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
                      onKeyDown={(e) => e.key === "Enter" && goNextSubStep()}
                      style={{
                        ...inputStyle,
                        fontSize: "1rem",
                        padding: "13px 16px",
                        border: intakeFieldErrors.customerName ? "1px solid rgba(214,5,43,0.45)" : inputStyle.border,
                        boxShadow: intakeFieldErrors.customerName ? "0 0 0 2px rgba(214,5,43,0.08)" : inputStyle.boxShadow,
                      }}
                    />
                    {intakeFieldErrors.customerName && (
                      <span style={{ fontSize: "0.78rem", color: "#8f1020", fontFamily: APP_FONT_STACK }}>
                        {intakeFieldErrors.customerName}
                      </span>
                    )}
                  </label>
                  <label style={{ display: "grid", gap: 8 }}>
                    <span style={sectionEyebrowStyle}>Contact Number</span>
                    <input
                      ref={customerPhoneInputRef}
                      type="tel"
                      placeholder="Optional, 10 digits"
                      value={customerPhone}
                      onChange={(e) => {
                        setCustomerPhone(sanitizePhone(e.target.value));
                        setIntakeFieldErrors((prev) => ({ ...prev, customerPhone: "" }));
                        setError("");
                      }}
                      onKeyDown={(e) => e.key === "Enter" && goNextSubStep()}
                      style={{
                        ...inputStyle,
                        fontSize: "1rem",
                        padding: "13px 16px",
                        border: intakeFieldErrors.customerPhone ? "1px solid rgba(214,5,43,0.45)" : inputStyle.border,
                        boxShadow: intakeFieldErrors.customerPhone ? "0 0 0 2px rgba(214,5,43,0.08)" : inputStyle.boxShadow,
                      }}
                    />
                    {intakeFieldErrors.customerPhone && (
                      <span style={{ fontSize: "0.78rem", color: "#8f1020", fontFamily: APP_FONT_STACK }}>
                        {intakeFieldErrors.customerPhone}
                      </span>
                    )}
                  </label>
                  {hasReference && (
                    <>
                      <label style={{ display: "grid", gap: 8 }}>
                        <span style={sectionEyebrowStyle}>Reference Name *</span>
                        <input
                          ref={referenceNameInputRef}
                          placeholder="Riya Sharma"
                          value={referenceName}
                          onChange={(e) => {
                            setReferenceName(e.target.value);
                            setIntakeFieldErrors((prev) => ({ ...prev, referenceName: "" }));
                            setError("");
                          }}
                          onKeyDown={(e) => e.key === "Enter" && goNextSubStep()}
                          style={{
                            ...inputStyle,
                            fontSize: "1rem",
                            padding: "13px 16px",
                            border: intakeFieldErrors.referenceName ? "1px solid rgba(214,5,43,0.45)" : inputStyle.border,
                            boxShadow: intakeFieldErrors.referenceName ? "0 0 0 2px rgba(214,5,43,0.08)" : inputStyle.boxShadow,
                          }}
                        />
                        {intakeFieldErrors.referenceName && (
                          <span style={{ fontSize: "0.78rem", color: "#8f1020", fontFamily: APP_FONT_STACK }}>
                            {intakeFieldErrors.referenceName}
                          </span>
                        )}
                      </label>
                      <label style={{ display: "grid", gap: 8 }}>
                        <span style={sectionEyebrowStyle}>Reference Label</span>
                        <input
                          placeholder="e.g. relative, agent, office staff"
                          value={referenceLabel}
                          onChange={(e) => setReferenceLabel(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && goNextSubStep()}
                          style={{ ...inputStyle, fontSize: "1rem", padding: "13px 16px" }}
                        />
                      </label>
                    </>
                  )}
                </div>
              </div>
            )}

            {subStep === 3 && (
              <div style={{ animation: "fadeIn 0.28s ease-out" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: "1.55rem", fontWeight: 700, letterSpacing: "-0.02em", color: "#15120f", marginBottom: 6, lineHeight: 1.1, fontFamily: APP_FONT_STACK }}>
                      Documents at Intake
                    </div>
                    <div style={{ fontSize: "0.87rem", lineHeight: 1.7, color: "rgba(21,18,15,0.60)" }}>
                      What did the customer hand over right now? These prefill the ticket checklist.
                    </div>
                  </div>
                  {providedDocIds.length > 0 && (
                    <div style={{ ...smallBadgeStyle, background: "rgba(184,148,63,0.12)", border: "1px solid rgba(184,148,63,0.30)", color: "#7b5d2c" }}>
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
                          border: checked ? "1.5px solid rgba(184,148,63,0.50)" : "1px solid rgba(21,18,15,0.10)",
                          background: checked ? "linear-gradient(135deg, rgba(184,148,63,0.13) 0%, rgba(184,148,63,0.06) 100%)" : "rgba(255,255,255,0.72)",
                          color: checked ? "#7b5d2c" : "#15120f",
                          cursor: "pointer", fontSize: "0.86rem", fontFamily: APP_FONT_STACK, fontWeight: 600,
                          transition: "all 0.18s ease", textAlign: "left",
                          boxShadow: checked ? "0 6px 18px rgba(184,148,63,0.14)" : "0 3px 10px rgba(17,14,12,0.04)",
                        }}
                      >
                        <span style={{
                          width: 20, height: 20, borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                          background: checked ? "rgba(184,148,63,0.22)" : "rgba(21,18,15,0.07)",
                          color: checked ? "#7b5d2c" : "rgba(21,18,15,0.35)", fontSize: "0.72rem",
                        }}>
                          {checked ? "✓" : ""}
                        </span>
                        {doc.label}
                      </button>
                    );
                  })}
                </div>
                {providedDocIds.length === 0 && (
                  <div style={{ marginTop: 14, fontSize: "0.82rem", color: "rgba(21,18,15,0.40)", fontFamily: APP_FONT_STACK }}>
                    Nothing selected — you can skip and add documents manually in the ticket.
                  </div>
                )}
              </div>
            )}

            {subStep === 4 && (
              <div style={{ animation: "fadeIn 0.28s ease-out" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: "1.55rem", fontWeight: 700, letterSpacing: "-0.02em", color: "#15120f", marginBottom: 6, lineHeight: 1.1, fontFamily: APP_FONT_STACK }}>
                      Assign Operator
                    </div>
                    <div style={{ fontSize: "0.87rem", lineHeight: 1.7, color: "rgba(21,18,15,0.60)" }}>
                      Pick the desk owner handling this file. Their metrics are live.
                    </div>
                  </div>
                  <div style={{ ...smallBadgeStyle, background: "rgba(21,18,15,0.05)", border: "1px solid rgba(21,18,15,0.09)", color: "rgba(21,18,15,0.55)" }}>
                    {selectedOperatorConfig.role} · Avg Rs. {selectedOperatorMetrics.avgTicketRate}
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
                          border: active ? "1.5px solid rgba(143,47,47,0.45)" : "1px solid rgba(21,18,15,0.10)",
                          background: active ? "linear-gradient(135deg, rgba(143,47,47,0.09) 0%, rgba(143,47,47,0.04) 100%)" : "rgba(255,255,255,0.72)",
                          cursor: "pointer", fontFamily: APP_FONT_STACK,
                          transition: "all 0.22s ease",
                          boxShadow: active ? "0 10px 28px rgba(143,47,47,0.12)" : "0 4px 14px rgba(17,14,12,0.05)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
                          <div>
                            <div style={{ fontSize: "1rem", fontWeight: 700, color: active ? DS.wine : "#15120f", marginBottom: 3 }}>{op.name}</div>
                            <div style={{ fontSize: "0.76rem", color: "rgba(21,18,15,0.52)" }}>{op.role} · {op.desk}</div>
                          </div>
                          <div style={{ ...smallBadgeStyle, padding: "4px 9px", background: active ? "rgba(143,47,47,0.10)" : "rgba(21,18,15,0.04)", border: active ? "1px solid rgba(143,47,47,0.25)" : "1px solid rgba(21,18,15,0.08)", color: active ? DS.wine : "rgba(21,18,15,0.50)" }}>
                            {op.status}
                          </div>
                        </div>
                        <div style={{ fontSize: "0.80rem", color: "rgba(21,18,15,0.58)", lineHeight: 1.55, marginBottom: 10 }}>{op.focus}</div>
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
                          {op.specialties.map((specialty) => (
                            <span key={`${op.id}_${specialty}`} style={{ fontSize: "0.64rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: active ? DS.wine : "rgba(21,18,15,0.50)", background: active ? "rgba(143,47,47,0.08)" : "rgba(21,18,15,0.04)", borderRadius: 999, padding: "4px 8px" }}>
                              {specialty}
                            </span>
                          ))}
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 4, fontSize: "0.76rem", color: "rgba(21,18,15,0.52)", borderTop: "1px solid rgba(21,18,15,0.07)", paddingTop: 10 }}>
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
              <div style={{ marginTop: 16, padding: "11px 14px", borderRadius: 12, background: "rgba(214,5,43,0.07)", border: "1px solid rgba(214,5,43,0.22)", color: "#8f1020", fontSize: "0.84rem", fontFamily: APP_FONT_STACK, fontWeight: 600 }}>
                {error}
              </div>
            )}

            {/* Wizard nav buttons */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 28, gap: 12 }}>
              <div style={{ display: "flex", gap: 8 }}>
                {subStep > 1 ? (
                  <button onClick={goPrevSubStep} style={secondaryButtonStyle}>← Back</button>
                ) : (
                  <button onClick={resetTicket} style={secondaryButtonStyle}>Clear Draft</button>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: "0.75rem", color: "rgba(21,18,15,0.40)", fontFamily: APP_FONT_STACK }}>
                  {subStep < totalSubSteps ? `${totalSubSteps - subStep} step${totalSubSteps - subStep > 1 ? "s" : ""} left` : "Ready to continue"}
                </span>
                <button
                  onClick={goNextSubStep}
                  style={{ ...primaryButtonStyle, padding: "13px 28px" }}
                >
                  {subStep < totalSubSteps ? "Next →" : "Continue to Ticket"}
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

        const goNextT2 = () => {
          if (subStep === 1 && items.length === 0) {
            setError("Add at least one service before continuing.");
            return;
          }
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
                    <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#15120f", fontFamily: APP_FONT_STACK }}>
                      {ticketMeta?.customerName}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "rgba(21,18,15,0.50)", fontFamily: APP_FONT_STACK, marginTop: 2 }}>
                      #{ticketMeta?.ticketNo} · {ticketReferenceSummary}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  {items.length > 0 && (
                    <div style={{ ...smallBadgeStyle, background: "rgba(184,148,63,0.12)", border: "1px solid rgba(184,148,63,0.30)", color: "#7b5d2c" }}>
                      Rs. {total}
                    </div>
                  )}
                  <button onClick={() => navigateToStep(1, "replace")} style={secondaryButtonStyle}>
                    ← Intake
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
                  <div style={sectionEyebrowStyle}>Build Ticket — Step {subStep} of {t2Total}</div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {T2_STEPS.map((ws, i) => {
                    const done = subStep > ws.num;
                    const active = subStep === ws.num;
                    return (
                      <React.Fragment key={ws.num}>
                        <button
                          onClick={() => done && setSubStep(ws.num)}
                          style={{
                            display: "flex", alignItems: "center", gap: 7,
                            padding: "7px 13px", borderRadius: 999, border: "none",
                            background: active ? DS.wine : done ? "rgba(143,47,47,0.12)" : "rgba(21,18,15,0.06)",
                            color: active ? "#fff" : done ? DS.wine : "rgba(21,18,15,0.40)",
                            fontFamily: APP_BRAND_STACK, fontWeight: 700, fontSize: "0.58rem",
                            letterSpacing: "0.18em", textTransform: "uppercase",
                            cursor: done ? "pointer" : "default",
                            transition: "all 0.22s ease",
                          }}
                        >
                          <span style={{
                            width: 18, height: 18, borderRadius: "50%",
                            background: active ? "rgba(255,255,255,0.22)" : done ? DS.wine : "rgba(21,18,15,0.10)",
                            color: active ? "#fff" : done ? "#fff" : "rgba(21,18,15,0.40)",
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            fontSize: "0.62rem", fontWeight: 700, fontFamily: APP_BRAND_STACK, flexShrink: 0,
                          }}>
                            {done ? "✓" : ws.num}
                          </span>
                          {ws.label}
                        </button>
                        {i < T2_STEPS.length - 1 && (
                          <div style={{ flex: 1, height: 1, background: done ? "rgba(143,47,47,0.25)" : "rgba(21,18,15,0.08)", borderRadius: 1, minWidth: 8 }} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
                <div style={{ marginTop: 12, height: 3, borderRadius: 3, background: "rgba(21,18,15,0.07)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${((subStep - 1) / (t2Total - 1)) * 100}%`, background: `linear-gradient(90deg, ${DS.wine}, rgba(211,166,90,0.80))`, borderRadius: 3, transition: "width 0.40s cubic-bezier(0.16,1,0.3,1)" }} />
                </div>
              </div>

              {/* Step A: Services */}
              {subStep === 1 && (
                <div style={{ animation: "fadeIn 0.28s ease-out" }}>
                  <div style={{ marginBottom: 22 }}>
                    <div style={{ fontSize: "1.55rem", fontWeight: 700, letterSpacing: "-0.02em", color: "#15120f", marginBottom: 6, fontFamily: APP_FONT_STACK }}>
                      Add Services
                    </div>
                    <div style={{ fontSize: "0.87rem", lineHeight: 1.7, color: "rgba(21,18,15,0.58)" }}>
                      Pick each service this customer needs. Add them one at a time.
                    </div>
                  </div>

                  {/* Service picker */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 14, alignItems: "end" }}>
                    <label style={{ display: "grid", gap: 7 }}>
                      <span style={sectionEyebrowStyle}>Select Service</span>
                      <select value={selectedService} onChange={(e) => { setSelectedService(e.target.value); setCustomAmt(""); }} style={inputStyle}>
                        <option value="" style={MENU_OPTION_STYLE}>Choose a service…</option>
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
                            style={{ ...inputStyle, textAlign: "center", background: selectedServiceConfig?.quantityMode === "fixed" ? "rgba(21,18,15,0.04)" : "rgba(255,255,255,0.82)", color: selectedServiceConfig?.quantityMode === "fixed" ? "rgba(21,18,15,0.40)" : "#15120f" }}
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
                        <div style={{ fontSize: "0.82rem", color: "rgba(21,18,15,0.58)", lineHeight: 1.6 }}>
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
                                <option value="" style={MENU_OPTION_STYLE}>Select…</option>
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
                              <span style={{ fontSize: "0.76rem", color: "#8f1020", fontFamily: APP_FONT_STACK }}>{selectedServiceDetailErrors[field.key]}</span>
                            )}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add button */}
                  {selectedServiceConfig && (
                    <div style={{ marginBottom: 20 }}>
                      <button onClick={addTask} style={{ ...primaryButtonStyle, padding: "13px 28px" }}>
                        + Add to Ticket
                      </button>
                      <span style={{ marginLeft: 12, fontSize: "0.80rem", color: "rgba(21,18,15,0.45)", fontFamily: APP_FONT_STACK }}>
                        {selectedServiceConfig?.variable ? "Variable price" : `Rs. ${selectedServiceConfig?.price || 0}`}
                        {selectedServiceConfig?.quantityMode !== "fixed" ? ` · max qty ${selectedServiceConfig.maxQty}` : ""}
                      </span>
                    </div>
                  )}

                  {/* Draft list */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={sectionEyebrowStyle}>Added Services</div>
                    {items.length > 0 && (
                      <div style={{ ...smallBadgeStyle, background: "rgba(184,148,63,0.12)", border: "1px solid rgba(184,148,63,0.28)", color: "#7b5d2c" }}>
                        Rs. {total}
                      </div>
                    )}
                  </div>
                  {items.length === 0 ? (
                    <div style={{ ...softPanelStyle, textAlign: "center", color: "rgba(21,18,15,0.45)", fontSize: "0.85rem", padding: "22px 16px" }}>
                      No services added yet. Choose one above and tap + Add to Ticket.
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: 8 }}>
                      {items.map((it, i) => (
                        <div key={i} style={{ ...softPanelStyle, padding: "12px 14px", display: "flex", gap: 12, alignItems: "center" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, color: "#15120f", fontSize: "0.90rem", fontFamily: APP_FONT_STACK }}>{it.name}</div>
                            <div style={{ fontSize: "0.76rem", color: "rgba(21,18,15,0.52)", marginTop: 2 }}>
                              {getQuantityModeConfig(it.quantityMode).inputLabel} {it.qty} · Unit Rs. {it.unitPrice}
                            </div>
                            {!!it.detailSummary && (
                              <div style={{ fontSize: "0.74rem", color: "rgba(21,18,15,0.48)", lineHeight: 1.5, marginTop: 3 }}>{it.detailSummary}</div>
                            )}
                          </div>
                          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#7b5d2c", whiteSpace: "nowrap" }}>Rs. {it.amount}</div>
                          <button onClick={() => removeTask(i)} style={{ width: 30, height: 30, border: "1px solid rgba(214,5,43,0.20)", borderRadius: 8, background: "rgba(214,5,43,0.06)", color: "#8f1020", cursor: "pointer", fontWeight: 800, fontSize: "0.8rem", flexShrink: 0 }}>
                            ×
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
                      <div style={{ fontSize: "1.55rem", fontWeight: 700, letterSpacing: "-0.02em", color: "#15120f", marginBottom: 6, fontFamily: APP_FONT_STACK }}>
                        Document Checklist
                      </div>
                      <div style={{ fontSize: "0.87rem", lineHeight: 1.7, color: "rgba(21,18,15,0.58)" }}>
                        Track which documents were submitted. Intake docs are already prefilled.
                      </div>
                    </div>
                    <div style={{ ...smallBadgeStyle, background: "rgba(21,18,15,0.05)", border: "1px solid rgba(21,18,15,0.09)", color: "rgba(21,18,15,0.52)" }}>
                      {submittedRequiredDocsCount}/{requiredDocsCount} required submitted
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, marginBottom: 16, alignItems: "end" }}>
                    <label style={{ display: "grid", gap: 7 }}>
                      <span style={sectionEyebrowStyle}>Add Document</span>
                      <input
                        value={docName}
                        onChange={(e) => setDocName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addDocument()}
                        placeholder="e.g. Aadhaar copy"
                        style={inputStyle}
                      />
                    </label>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 7, color: "rgba(21,18,15,0.65)", fontSize: "0.84rem", fontFamily: APP_FONT_STACK, fontWeight: 600, cursor: "pointer" }}>
                        <input type="checkbox" checked={docRequired} onChange={(e) => setDocRequired(e.target.checked)} />
                        Required
                      </label>
                      <button onClick={addDocument} style={secondaryButtonStyle}>Add</button>
                    </div>
                  </div>

                  <div style={{ display: "grid", gap: 8 }}>
                    {documents.length === 0 ? (
                      <div style={{ ...softPanelStyle, textAlign: "center", color: "rgba(21,18,15,0.45)", fontSize: "0.84rem", padding: "22px 16px" }}>
                        No documents tracked. You can skip this step.
                      </div>
                    ) : (
                      documents.map((doc) => (
                        <div key={doc.id} style={{ ...softPanelStyle, padding: "12px 14px", display: "flex", gap: 12, alignItems: "center" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "0.88rem", color: "#15120f", fontWeight: 700, fontFamily: APP_FONT_STACK, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              {doc.name}
                              {doc.source === "intake" && (
                                <span style={{ ...smallBadgeStyle, padding: "2px 7px", fontSize: "0.52rem", background: "rgba(184,148,63,0.10)", border: "1px solid rgba(184,148,63,0.25)", color: "#7b5d2c" }}>
                                  Intake
                                </span>
                              )}
                            </div>
                            <div style={{ display: "flex", gap: 14, marginTop: 6 }}>
                              <label style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(21,18,15,0.58)", fontSize: "0.78rem", fontFamily: APP_FONT_STACK, cursor: "pointer" }}>
                                <input type="checkbox" checked={doc.required} onChange={() => toggleDocumentRequired(doc.id)} />
                                Required
                              </label>
                              <label style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(21,18,15,0.58)", fontSize: "0.78rem", fontFamily: APP_FONT_STACK, cursor: "pointer" }}>
                                <input type="checkbox" checked={doc.submitted} onChange={() => toggleDocumentSubmitted(doc.id)} />
                                Submitted
                              </label>
                            </div>
                          </div>
                          <button onClick={() => removeDocument(doc.id)} style={{ width: 28, height: 28, border: "1px solid rgba(214,5,43,0.20)", borderRadius: 7, background: "rgba(214,5,43,0.06)", color: "#8f1020", cursor: "pointer", fontWeight: 800, fontSize: "0.8rem", flexShrink: 0 }}>
                            ×
                          </button>
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
                    <div style={{ fontSize: "1.55rem", fontWeight: 700, letterSpacing: "-0.02em", color: "#15120f", marginBottom: 6, fontFamily: APP_FONT_STACK }}>
                      Payment & Save
                    </div>
                    <div style={{ fontSize: "0.87rem", lineHeight: 1.7, color: "rgba(21,18,15,0.58)" }}>
                      Enter what was collected. Partial payment is fine — you can keep the balance pending.
                    </div>
                  </div>

                  {/* Service summary */}
                  <div style={{ ...softPanelStyle, marginBottom: 18, padding: "14px 16px" }}>
                    <div style={sectionEyebrowStyle}>Services Summary</div>
                    <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
                      {items.map((it, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.86rem", color: "#15120f", fontFamily: APP_FONT_STACK }}>
                          <span>{it.name} ×{it.qty}</span>
                          <span style={{ fontWeight: 700 }}>Rs. {it.amount}</span>
                        </div>
                      ))}
                      <div style={{ borderTop: "1px solid rgba(21,18,15,0.09)", paddingTop: 8, marginTop: 4, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "1rem", fontFamily: APP_FONT_STACK, color: "#15120f" }}>
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
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "rgba(21,18,15,0.60)", fontFamily: APP_FONT_STACK }}>
                        <span>Collected</span><span style={{ color: "#15120f", fontWeight: 700 }}>Rs. {paidTotal}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "rgba(21,18,15,0.60)", fontFamily: APP_FONT_STACK }}>
                        <span>Docs submitted</span><span style={{ color: "#15120f", fontWeight: 700 }}>{submittedRequiredDocsCount}/{requiredDocsCount}</span>
                      </div>
                      <div style={{ borderTop: "1px solid rgba(21,18,15,0.08)", paddingTop: 8, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "1.05rem", fontFamily: APP_FONT_STACK, color: pendingBalance > 0 ? "#7b5d2c" : DS.wine }}>
                        <span>Pending Balance</span><span>Rs. {pendingBalance}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 18, padding: "12px 14px", borderRadius: 10, background: isOverpaid ? "rgba(214,5,43,0.07)" : pendingBalance > 0 ? "rgba(184,148,63,0.10)" : "rgba(143,47,47,0.07)", border: isOverpaid ? "1px solid rgba(214,5,43,0.22)" : pendingBalance > 0 ? "1px solid rgba(184,148,63,0.26)" : "1px solid rgba(143,47,47,0.22)", color: isOverpaid ? "#8f1020" : pendingBalance > 0 ? "#7b5d2c" : DS.wine, fontSize: "0.83rem", lineHeight: 1.6, fontFamily: APP_FONT_STACK, fontWeight: 500 }}>
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
                      disabled={!canSaveTicket}
                      style={{ ...secondaryButtonStyle, background: canSaveTicket ? "rgba(184,148,63,0.12)" : "rgba(21,18,15,0.04)", border: canSaveTicket ? "1px solid rgba(184,148,63,0.34)" : "1px solid rgba(21,18,15,0.09)", color: canSaveTicket ? "#7b5d2c" : "rgba(21,18,15,0.30)", cursor: canSaveTicket ? "pointer" : "not-allowed" }}
                    >
                      Save for Later
                    </button>
                    <button
                      onClick={() => saveTicket("Closed")}
                      disabled={!canSaveTicket}
                      style={{ ...primaryButtonStyle, padding: "13px 22px", background: canSaveTicket ? "rgba(143,47,47,0.14)" : "rgba(21,18,15,0.04)", border: canSaveTicket ? "1px solid rgba(143,47,47,0.42)" : "1px solid rgba(21,18,15,0.09)", color: canSaveTicket ? DS.wine : "rgba(21,18,15,0.30)", cursor: canSaveTicket ? "pointer" : "not-allowed" }}
                    >
                      Save & Complete
                    </button>
                  </div>
                </div>
              )}

              {undoAction && (
                <div style={{ marginTop: 16, padding: "11px 14px", borderRadius: 12, background: "rgba(184,148,63,0.11)", border: "1px solid rgba(184,148,63,0.30)", color: "#7b5d2c", fontSize: "0.84rem", fontFamily: APP_FONT_STACK, fontWeight: 600, display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
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
                    style={{ border: "1px solid rgba(184,148,63,0.45)", borderRadius: 999, padding: "7px 12px", background: "rgba(255,255,255,0.74)", color: "#7b5d2c", fontFamily: APP_BRAND_STACK, fontWeight: 700, fontSize: "0.52rem", letterSpacing: "0.18em", textTransform: "uppercase", cursor: "pointer" }}
                  >
                    Undo
                  </button>
                </div>
              )}

              {/* Error */}
              {error && (
                <div style={{ marginTop: 16, padding: "11px 14px", borderRadius: 12, background: "rgba(214,5,43,0.07)", border: "1px solid rgba(214,5,43,0.22)", color: "#8f1020", fontSize: "0.84rem", fontFamily: APP_FONT_STACK, fontWeight: 600 }}>
                  {error}
                </div>
              )}

              {/* Wizard nav */}
              {subStep < 3 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 28, gap: 12 }}>
                  <button onClick={goPrevT2} style={secondaryButtonStyle}>← Back</button>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: "0.75rem", color: "rgba(21,18,15,0.40)", fontFamily: APP_FONT_STACK }}>
                      {t2Total - subStep} step{t2Total - subStep > 1 ? "s" : ""} left
                    </span>
                    <button onClick={goNextT2} style={{ ...primaryButtonStyle, padding: "13px 28px" }}>
                      Next →
                    </button>
                  </div>
                </div>
              )}
              {subStep === 3 && (
                <div style={{ marginTop: 16 }}>
                  <button onClick={goPrevT2} style={secondaryButtonStyle}>← Documents</button>
                </div>
              )}
            </div>
          </>
        );
      })()}
    </div>
  );
}

function TicketDashboard({ tickets, onToggleTicketStatus, onToggleTaskDone, onUpdateTicket }) {
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
    border: "1px solid rgba(21,18,15,0.09)",
    borderRadius: 12,
    padding: 14,
    boxShadow: "0 8px 20px rgba(17,14,12,0.06)",
  };
  const sectionCardStyle = {
    background: "rgba(255,255,255,0.72)",
    border: "1px solid rgba(21,18,15,0.09)",
    borderRadius: 14,
    padding: 14,
    boxShadow: "0 10px 24px rgba(17,14,12,0.07)",
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
    border: "1px solid rgba(21,18,15,0.12)",
    borderRadius: 8,
    background: "rgba(255,255,255,0.82)",
    color: "#15120f",
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
      border: "1px solid rgba(21,18,15,0.14)",
      background: "rgba(255,255,255,0.70)",
      color: "rgba(21,18,15,0.70)",
    },
    view: {
      ...actionButtonBase,
      border: "1px solid rgba(74,130,192,0.35)",
      background: "rgba(74,130,192,0.10)",
      color: "#2a5a8f",
    },
    print: {
      ...actionButtonBase,
      border: "1px solid rgba(143,47,47,0.35)",
      background: "rgba(143,47,47,0.08)",
      color: DS.wine,
    },
    edit: {
      ...actionButtonBase,
      border: "1px solid rgba(184,148,63,0.38)",
      background: "rgba(184,148,63,0.10)",
      color: "#7b5d2c",
    },
    neutral: {
      ...actionButtonBase,
      border: "1px solid rgba(21,18,15,0.14)",
      background: "rgba(21,18,15,0.04)",
      color: "rgba(21,18,15,0.60)",
    },
    success: {
      ...actionButtonBase,
      border: "1px solid rgba(58,158,120,0.38)",
      background: "rgba(58,158,120,0.10)",
      color: "#1e6447",
    },
    warning: {
      ...actionButtonBase,
      border: "1px solid rgba(184,148,63,0.38)",
      background: "rgba(184,148,63,0.10)",
      color: "#7b5d2c",
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
      <div style={{ marginTop: 10, borderTop: "1px solid rgba(21,18,15,0.09)", paddingTop: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 8, marginBottom: 10 }}>
          {[
            { label: "Document Holder", main: structured.parties.documentHolder.name, sub: structured.parties.documentHolder.phone || "No contact saved" },
            { label: "Reference Contact", main: structured.parties.reference.hasReference ? structured.parties.reference.name : "No reference", sub: structured.parties.reference.hasReference ? (structured.parties.reference.label || "No label") : "Optional" },
            { label: "Meta", main: `Status: ${structured.meta.status}`, sub: `Updated: ${structured.meta.updatedAt || "N/A"}` },
            { label: "Payment", main: `Status: ${structured.payment.status}`, sub: `Paid Rs. ${structured.payment.paidTotal} | Pending Rs. ${structured.payment.pendingBalance}` },
          ].map((info) => (
            <div key={info.label} style={{ ...detailCardStyle, padding: 10 }}>
              <div style={dashEyebrowStyle}>{info.label}</div>
              <div style={{ fontSize: "0.84rem", fontWeight: 600, color: "#15120f", fontFamily: APP_FONT_STACK }}>{info.main}</div>
              <div style={{ fontSize: "0.75rem", color: "rgba(21,18,15,0.55)", fontFamily: APP_FONT_STACK }}>{info.sub}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: "0.72rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: DS.wine, marginBottom: 6 }}>Service Breakdown</div>
        <div style={{ display: "grid", gap: 4 }}>
          {structured.services.map((it, idx) => (
            <div key={`${ticket.ticketNo}_expand_${idx}`} style={{ fontSize: "0.82rem", color: "#15120f", padding: "5px 0", borderBottom: idx < structured.services.length - 1 ? "1px solid rgba(21,18,15,0.08)" : "none", fontFamily: APP_FONT_STACK }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span>{it.name}</span>
                <span style={{ color: "rgba(21,18,15,0.55)" }}>{getQuantityModeConfig(it.quantityMode).inputLabel} {it.qty} | Rs. {it.amount}</span>
              </div>
              {!!it.detailSummary && (
                <div style={{ color: "rgba(21,18,15,0.50)", marginTop: 2, lineHeight: 1.5, fontSize: "0.76rem" }}>{it.detailSummary}</div>
              )}
            </div>
          ))}
        </div>
        {structured.documents.items.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: "0.72rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: DS.wine, marginBottom: 5 }}>Document Status</div>
            <div style={{ display: "grid", gap: 4 }}>
              {structured.documents.items.map((doc, idx) => (
                <div key={`${ticket.ticketNo}_doc_${idx}`} style={{ display: "flex", justifyContent: "space-between", color: "#15120f", fontSize: "0.80rem", fontFamily: APP_FONT_STACK }}>
                  <span>{doc.name}</span>
                  <span style={{ color: "rgba(21,18,15,0.55)" }}>{doc.required ? "Required" : "Optional"} | {doc.submitted ? "Submitted" : "Pending"}</span>
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
                      {structured.meta.primaryType || "Unassigned"} · Rs. {ticket.total || 0} · Pending Rs. {structured.payment.pendingBalance}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button onClick={() => { setViewTicketNo(ticket.ticketNo); setShowRawJson(false); }} style={listActionStyle}>View</button>
                      <button onClick={() => startEdit(ticket)} style={listActionStyle}>Edit</button>
                      <button onClick={() => printTicketSlip(ticket)} style={listActionStyle}>Print</button>
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
                  <button onClick={() => setShowRawJson((prev) => !prev)} style={listActionStyle}>{showRawJson ? "Hide JSON" : "Show JSON"}</button>
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
                    <div style={{ fontSize: "0.74rem", color: OPS.textMuted, fontFamily: APP_FONT_STACK }}>{viewingStructured.parties.reference.label || "—"}</div>
                  </div>
                  <div style={{ ...dashboardCard, padding: 10 }}>
                    <div style={dashLabel}>Payment</div>
                    <div style={{ fontSize: "0.84rem", color: OPS.text, fontFamily: APP_FONT_STACK, fontWeight: 600 }}>{viewingStructured.payment.status}</div>
                    <div style={{ fontSize: "0.74rem", color: OPS.textMuted, fontFamily: APP_FONT_STACK }}>Paid Rs. {viewingStructured.payment.paidTotal} · Pending Rs. {viewingStructured.payment.pendingBalance}</div>
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
                          <span style={{ color: OPS.textMuted }}>{doc.required ? "Required" : "Optional"} · {doc.submitted ? "Submitted" : "Pending"}</span>
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
        <div style={{ background: "rgba(255,255,255,0.80)", border: "1px solid rgba(21,18,15,0.12)", borderRadius: 18, padding: 20, marginBottom: 18, boxShadow: "0 16px 40px rgba(17,14,12,0.09)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
            <div>
              <div style={dashEyebrowStyle}>Ticket View</div>
              <div style={{ fontFamily: APP_SERIF_STACK, fontSize: "1.2rem", fontWeight: 300, color: "#15120f" }}>{viewingTicket.ticketNo} — {viewingTicket.customerName}</div>
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
              <div style={{ color: "#15120f", fontWeight: 700, fontSize: "0.88rem", fontFamily: APP_FONT_STACK }}>{viewingStructured.parties.documentHolder.name}</div>
              <div style={{ color: "rgba(21,18,15,0.55)", fontSize: "0.76rem", fontFamily: APP_FONT_STACK }}>{viewingStructured.parties.documentHolder.phone || "No contact saved"}</div>
            </div>
            <div style={detailCardStyle}>
              <div style={dashEyebrowStyle}>Reference Contact</div>
              <div style={{ color: "#15120f", fontWeight: 700, fontSize: "0.88rem", fontFamily: APP_FONT_STACK }}>
                {viewingStructured.parties.reference.hasReference ? viewingStructured.parties.reference.name : "No reference"}
              </div>
              <div style={{ color: "rgba(21,18,15,0.55)", fontSize: "0.76rem", fontFamily: APP_FONT_STACK }}>
                {viewingStructured.parties.reference.hasReference ? (viewingStructured.parties.reference.label || "No label") : "Optional"}
              </div>
            </div>
            <div style={detailCardStyle}>
              <div style={dashEyebrowStyle}>Meta</div>
              <div style={{ color: "#15120f", fontSize: "0.82rem", fontFamily: APP_FONT_STACK }}>Status: {viewingStructured.meta.status}</div>
              <div style={{ color: "rgba(21,18,15,0.55)", fontSize: "0.76rem", fontFamily: APP_FONT_STACK }}>Created: {viewingStructured.meta.createdDate} {viewingStructured.meta.createdTime}</div>
              <div style={{ color: "rgba(21,18,15,0.55)", fontSize: "0.76rem", fontFamily: APP_FONT_STACK }}>Updated: {viewingStructured.meta.updatedAt || "N/A"}</div>
            </div>
            <div style={detailCardStyle}>
              <div style={dashEyebrowStyle}>Payment</div>
              <div style={{ color: "#15120f", fontSize: "0.82rem", fontFamily: APP_FONT_STACK }}>Operator: {viewingStructured.assignment.operator || "N/A"}</div>
              <div style={{ color: "rgba(21,18,15,0.55)", fontSize: "0.76rem", fontFamily: APP_FONT_STACK }}>Mode: {viewingStructured.payment.mode} | Status: {viewingStructured.payment.status}</div>
              <div style={{ color: "rgba(21,18,15,0.55)", fontSize: "0.76rem", fontFamily: APP_FONT_STACK }}>Paid Rs. {viewingStructured.payment.paidTotal} | Pending Rs. {viewingStructured.payment.pendingBalance}</div>
            </div>
          </div>

          <div style={{ ...sectionCardStyle, marginTop: 10 }}>
            <div style={dashEyebrowStyle}>Services</div>
            {viewingStructured.services.length === 0 ? (
              <div style={{ color: "rgba(21,18,15,0.50)", fontSize: "0.82rem", fontFamily: APP_FONT_STACK }}>No services linked to this ticket.</div>
            ) : (
              <div style={{ display: "grid", gap: 5 }}>
                {viewingStructured.services.map((it, idx) => (
                  <div key={`view_${viewingTicket.ticketNo}_${idx}`} style={{ color: "#15120f", fontSize: "0.82rem", paddingBottom: 5, borderBottom: idx < viewingStructured.services.length - 1 ? "1px solid rgba(21,18,15,0.08)" : "none", fontFamily: APP_FONT_STACK }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <span>{it.name}</span>
                      <span style={{ color: "rgba(21,18,15,0.55)" }}>{getQuantityModeConfig(it.quantityMode).inputLabel} {it.qty} | Rs. {it.amount}</span>
                    </div>
                    {!!it.detailSummary && (
                      <div style={{ color: "rgba(21,18,15,0.45)", marginTop: 3, lineHeight: 1.5, fontSize: "0.76rem" }}>{it.detailSummary}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ ...sectionCardStyle, marginTop: 8 }}>
            <div style={dashEyebrowStyle}>Document Status</div>
            {viewingStructured.documents.items.length === 0 ? (
              <div style={{ color: "rgba(21,18,15,0.50)", fontSize: "0.82rem", fontFamily: APP_FONT_STACK }}>No document checklist added.</div>
            ) : (
              <div style={{ display: "grid", gap: 5 }}>
                {viewingStructured.documents.items.map((doc, idx) => (
                  <div key={`view_doc_${idx}`} style={{ display: "flex", justifyContent: "space-between", color: "#15120f", fontSize: "0.82rem", paddingBottom: 5, borderBottom: idx < viewingStructured.documents.items.length - 1 ? "1px solid rgba(21,18,15,0.08)" : "none", fontFamily: APP_FONT_STACK }}>
                    <span>{doc.name}</span>
                    <span style={{ color: "rgba(21,18,15,0.55)" }}>{doc.required ? "Required" : "Optional"} | {doc.submitted ? "Submitted" : "Pending"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {showRawJson && (
            <pre style={{ margin: "10px 0 0", background: "#15120f", border: "1px solid rgba(21,18,15,0.20)", borderRadius: 10, padding: 14, color: "#f8f1e4", fontSize: "0.7rem", overflowX: "auto", fontFamily: APP_MONO_STACK }}>
{JSON.stringify(viewingStructured, null, 2)}
            </pre>
          )}
        </div>
      )}

      {editTicketNo && (
        <div style={{ background: "rgba(255,255,255,0.78)", border: "1px solid rgba(21,18,15,0.12)", borderRadius: 14, padding: 16, marginBottom: 14 }}>
          <div style={dashEyebrowStyle}>Edit Ticket</div>
          <div style={{ fontFamily: APP_SERIF_STACK, fontSize: "1.1rem", fontWeight: 300, color: "#15120f", marginBottom: 12 }}>{editTicketNo}</div>
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
          <div style={{ marginTop: 8, fontSize: "0.78rem", color: "rgba(21,18,15,0.55)", fontFamily: APP_FONT_STACK }}>
            Ticket total Rs. {editingTicket?.total || 0} | Collected Rs. {(Number(editDraft.cashCollected) || 0) + (Number(editDraft.upiCollected) || 0)} | Pending Rs. {Math.max((Number(editingTicket?.total) || 0) - ((Number(editDraft.cashCollected) || 0) + (Number(editDraft.upiCollected) || 0)), 0)}
          </div>
          {editError && <div style={{ marginTop: 8, color: "#FCA5A5", fontSize: 12 }}>{editError}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button onClick={saveEdit} style={{ ...actionButtonStyles.print }}>Save Changes</button>
            <button onClick={() => { setEditTicketNo(null); setEditError(""); }} style={{ ...actionButtonStyles.closeView }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ background: "rgba(255,255,255,0.72)", border: "1px solid rgba(21,18,15,0.10)", borderRadius: 14, padding: 14, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 12 }}>
          <div>
            <div style={dashEyebrowStyle}>Filters</div>
            <div style={{ fontFamily: APP_SERIF_STACK, fontSize: "1.1rem", fontWeight: 300, color: "#15120f", marginBottom: 5 }}>Type and Payment Status</div>
            <div style={{ fontSize: "0.80rem", color: "rgba(21,18,15,0.55)", lineHeight: 1.55 }}>
              Filter tickets by reference state, service type, or payment status without leaving the dashboard.
            </div>
          </div>
          <div style={{ fontSize: "0.80rem", color: "rgba(21,18,15,0.55)", fontFamily: APP_FONT_STACK, fontWeight: 600 }}>
            Showing {filteredTickets.length} of {normalizedTickets.length} tickets
            <div style={{ marginTop: 3, fontSize: "0.72rem", color: "rgba(21,18,15,0.40)", fontFamily: APP_FONT_STACK }}>
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
                    border: active ? "1px solid rgba(143,47,47,0.35)" : "1px solid rgba(21,18,15,0.10)",
                    background: active ? "rgba(143,47,47,0.09)" : "rgba(255,255,255,0.65)",
                    color: active ? DS.wine : "rgba(21,18,15,0.65)",
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
                    border: active ? "1px solid rgba(184,148,63,0.38)" : "1px solid rgba(21,18,15,0.10)",
                    background: active ? "rgba(184,148,63,0.10)" : "rgba(255,255,255,0.65)",
                    color: active ? "#7b5d2c" : "rgba(21,18,15,0.65)",
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
          { label: "Visible", value: filteredTickets.length, color: "#15120f" },
          { label: "Open", value: openTickets.length, color: "#7b5d2c" },
          { label: "Closed", value: closedTickets.length, color: DS.wine },
          { label: "Task Progress", value: `${doneTasks}/${totalTasks || 0}`, color: "#2a5a8f" },
        ].map((stat) => (
          <div key={stat.label} style={{ background: "rgba(255,255,255,0.72)", border: "1px solid rgba(21,18,15,0.09)", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: "0.52rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(21,18,15,0.42)", marginBottom: 4 }}>{stat.label}</div>
            <div style={{ fontFamily: APP_SERIF_STACK, fontSize: "1.6rem", fontWeight: 300, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: "0.52rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: DS.wine, marginBottom: 8 }}>Open Tickets</div>
      {openTickets.length === 0 ? (
        <div style={{ background: "rgba(255,255,255,0.65)", border: "1px dashed rgba(21,18,15,0.14)", borderRadius: 10, padding: 14, color: "rgba(21,18,15,0.45)", fontSize: "0.84rem", fontFamily: APP_FONT_STACK }}>No open tickets.</div>
      ) : (
        <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
          {openTickets.map((t) => (
            <div key={t.ticketNo} style={{ background: "rgba(255,255,255,0.72)", border: "1px solid rgba(21,18,15,0.10)", borderRadius: 12, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontFamily: APP_MONO_STACK, fontSize: "0.72rem", color: "rgba(21,18,15,0.45)", marginBottom: 2 }}>{t.ticketNo}</div>
                  <div style={{ color: "#15120f", fontWeight: 700, fontSize: "0.92rem", fontFamily: APP_FONT_STACK }}>{t.customerName}</div>
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
                <label key={`${t.ticketNo}_${idx}`} style={{ display: "flex", alignItems: "center", gap: 8, color: "#15120f", padding: "5px 0", borderBottom: idx < t.items.length - 1 ? "1px solid rgba(21,18,15,0.07)" : "none", cursor: "pointer" }}>
                  <input type="checkbox" checked={!!it.done} onChange={() => onToggleTaskDone(t.ticketNo, idx)} />
                  <span style={{ flex: 1, textDecoration: it.done ? "line-through" : "none", fontSize: "0.84rem", fontFamily: APP_FONT_STACK, color: it.done ? "rgba(21,18,15,0.40)" : "#15120f" }}>
                    {it.name}
                    {!!it.detailSummary && <span style={{ display: "block", color: "rgba(21,18,15,0.50)", fontSize: "0.72rem", lineHeight: 1.45, marginTop: 2 }}>{it.detailSummary}</span>}
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "rgba(21,18,15,0.50)", fontFamily: APP_FONT_STACK }}>{getQuantityModeConfig(it.quantityMode).label} {it.qty}</span>
                </label>
              ))}
              <div style={{ marginTop: 8, fontSize: "0.74rem", color: "rgba(21,18,15,0.50)", fontFamily: APP_FONT_STACK }}>
                Type: {t.structured?.meta?.primaryType || "Unassigned"} | Payment: {t.paymentStatus || t.structured?.payment?.status || "Unpaid"} | Pending Rs. {t.pendingBalance ?? t.structured?.payment?.pendingBalance ?? 0} | Docs: {t.structured?.documents?.submitted?.length || 0}/{t.structured?.documents?.required?.length || 0} required submitted
              </div>
              {expandedTickets[t.ticketNo] && renderExpandedContent(t)}
            </div>
          ))}
        </div>
      )}

      <div style={{ fontSize: "0.52rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(21,18,15,0.45)", marginBottom: 8 }}>Closed Tickets</div>
      {closedTickets.length === 0 ? (
        <div style={{ background: "rgba(255,255,255,0.65)", border: "1px dashed rgba(21,18,15,0.14)", borderRadius: 10, padding: 14, color: "rgba(21,18,15,0.45)", fontSize: "0.84rem", fontFamily: APP_FONT_STACK }}>No closed tickets yet.</div>
      ) : (
        <div style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(21,18,15,0.09)", borderRadius: 12, overflow: "hidden" }}>
          {[...closedTickets].reverse().map((t, idx) => (
            <div key={t.ticketNo} style={{ padding: "11px 14px", borderBottom: idx < closedTickets.length - 1 ? "1px solid rgba(21,18,15,0.07)" : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <div style={{ color: "#15120f", fontSize: "0.84rem", fontFamily: APP_FONT_STACK }}><span style={{ fontFamily: APP_MONO_STACK, fontSize: "0.70rem", color: "rgba(21,18,15,0.40)" }}>{t.ticketNo}</span> {t.customerName} · {t.structured?.meta?.primaryType || "Unassigned"} · Rs. {t.total} · {t.paymentStatus || t.structured?.payment?.status || "Unpaid"}</div>
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
function B2BWorkspace() {
  const b2bServices = [
    { name: "Bulk Form Filing Support", unit: "per batch", note: "Ideal for partners with recurring submissions" },
    { name: "Enterprise Document Printing", unit: "per order", note: "Bulk print, scan, and dispatch workflow" },
    { name: "Staff Onboarding KYC Desk", unit: "per employee", note: "Structured verification with tracking" },
    { name: "Vendor Certificate Processing", unit: "per request", note: "Fast turnaround for compliance docs" },
  ];

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      <div style={{
        background: "linear-gradient(145deg, rgba(255,255,255,0.82), rgba(242,232,216,0.88))",
        borderRadius: 18,
        padding: "22px 24px",
        border: "1px solid rgba(21,18,15,0.10)",
        marginBottom: 16,
        boxShadow: "0 16px 40px rgba(17,14,12,0.09)",
        backgroundImage: "radial-gradient(circle at 12% 10%, rgba(184,148,63,0.16), transparent 36%), radial-gradient(circle at 88% 88%, rgba(143,47,47,0.10), transparent 34%), linear-gradient(145deg, rgba(255,255,255,0.84), rgba(242,232,216,0.88))",
      }}>
        <div style={{ fontSize: "0.52rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.32em", color: DS.wine, fontFamily: APP_BRAND_STACK, marginBottom: 10 }}>
          Partner Desk
        </div>
        <div style={{ fontFamily: APP_SERIF_STACK, fontSize: "1.8rem", fontWeight: 300, letterSpacing: "-0.02em", color: "#15120f", marginBottom: 8 }}>
          B2B Workspace
        </div>
        <div style={{ fontSize: "0.86rem", color: "rgba(21,18,15,0.65)", fontFamily: APP_FONT_STACK, lineHeight: 1.72 }}>
          Manage business clients, bulk service requests, and partner operations from one place.
        </div>
      </div>

      <div style={{
        background: "rgba(255,255,255,0.72)",
        borderRadius: 14,
        border: "1px solid rgba(21,18,15,0.10)",
        overflow: "hidden",
        boxShadow: "0 8px 24px rgba(17,14,12,0.07)",
        marginBottom: 14,
      }}>
        <div style={{
          padding: "12px 18px",
          borderBottom: "1px solid rgba(21,18,15,0.08)",
          background: "rgba(255,255,255,0.60)",
          fontSize: "0.52rem",
          fontWeight: 700,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: DS.wine,
          fontFamily: APP_BRAND_STACK,
        }}>
          B2B Services
        </div>
        {b2bServices.map((svc, i) => (
          <div key={svc.name} style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "13px 18px",
            borderBottom: i < b2bServices.length - 1 ? "1px solid rgba(21,18,15,0.07)" : "none",
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#15120f", fontFamily: APP_FONT_STACK }}>
                {svc.name}
              </div>
              <div style={{ fontSize: "0.76rem", color: "rgba(21,18,15,0.55)", marginTop: 2, fontFamily: APP_FONT_STACK }}>
                {svc.note}
              </div>
            </div>
            <div style={{
              fontSize: "0.58rem",
              fontFamily: APP_BRAND_STACK,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#7b5d2c",
              background: "rgba(184,148,63,0.12)",
              border: "1px solid rgba(184,148,63,0.30)",
              borderRadius: 999,
              padding: "5px 10px",
            }}>
              {svc.unit}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        background: "rgba(255,255,255,0.65)",
        borderRadius: 14,
        border: "1px dashed rgba(21,18,15,0.14)",
        padding: "22px 20px",
        textAlign: "center",
      }}>
        <div style={{ fontFamily: APP_SERIF_STACK, fontSize: "1.1rem", fontWeight: 300, color: "#15120f", marginBottom: 8 }}>
          B2B billing board is ready for expansion
        </div>
        <div style={{ fontSize: "0.84rem", color: "rgba(21,18,15,0.55)", fontFamily: APP_FONT_STACK }}>
          We can plug in corporate client profiles, credit cycles, and GST invoices in this tab next.
        </div>
      </div>
    </div>
  );
}

// --- Monthly Overview ---
function MonthlyOverview({ tickets }) {
  const normalized = tickets.map((t) => t.structured ? t : withStructuredTicket(t));

  const byMonth = {};
  normalized.forEach((t) => {
    const key = (t.structured?.meta?.createdDate || t.date || "").slice(0, 7) || "Unknown";
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(t);
  });
  const months = Object.keys(byMonth).sort().reverse();

  const allRevenue = normalized.reduce((s, t) => s + (Number(t.structured?.payment?.paidTotal) || 0), 0);
  const allPending = normalized.reduce((s, t) => s + (Number(t.structured?.payment?.pendingBalance) || 0), 0);
  const openCount = normalized.filter((t) => t.status !== "Closed").length;
  const closedCount = normalized.filter((t) => t.status === "Closed").length;

  const eb = { fontSize: "0.48rem", fontWeight: 700, letterSpacing: "0.32em", textTransform: "uppercase", color: DS.wine, fontFamily: APP_BRAND_STACK, display: "block", marginBottom: 5 };
  const card = { background: "rgba(255,255,255,0.75)", border: "1px solid rgba(21,18,15,0.09)", borderRadius: 16, boxShadow: "0 4px 16px rgba(17,14,12,0.06)" };

  const hasData = normalized.length > 0;

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>

      {/* Hero summary strip */}
      <div style={{ ...card, padding: "22px 24px", marginBottom: 24, backgroundImage: "radial-gradient(circle at 5% 10%, rgba(184,148,63,0.14), transparent 32%), radial-gradient(circle at 92% 88%, rgba(143,47,47,0.08), transparent 30%)" }}>
        <span style={eb}>Centre Performance</span>
        <div style={{ fontFamily: APP_SERIF_STACK, fontSize: "clamp(1.4rem, 2.5vw, 2rem)", fontWeight: 300, color: "#15120f", letterSpacing: "-0.02em", marginBottom: 18, lineHeight: 1 }}>
          Monthly <em style={{ fontStyle: "italic", color: "rgba(21,18,15,0.45)" }}>Overview.</em>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
          {[
            { label: "Total Tickets", value: normalized.length, color: "#15120f" },
            { label: "Open", value: openCount, color: "#c8922a" },
            { label: "Closed", value: closedCount, color: DS.wine },
            { label: "Revenue", value: `Rs. ${allRevenue.toLocaleString("en-IN")}`, color: "#2a5a8f" },
            { label: "Pending", value: `Rs. ${allPending.toLocaleString("en-IN")}`, color: DS.wine },
            { label: "Months Active", value: months.filter((m) => m !== "Unknown").length, color: "#15120f" },
          ].map((s) => (
            <div key={s.label} style={{ background: "rgba(21,18,15,0.04)", border: "1px solid rgba(21,18,15,0.08)", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontSize: "0.44rem", fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(21,18,15,0.38)", fontFamily: APP_BRAND_STACK, marginBottom: 5 }}>{s.label}</div>
              <div style={{ fontFamily: APP_SERIF_STACK, fontSize: "1.4rem", fontWeight: 300, color: s.color, lineHeight: 1 }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Category breakdown bar — always shown */}
      <div style={{ ...card, padding: "18px 20px", marginBottom: 24 }}>
        <span style={eb}>Service Mix — All Time</span>
        <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
          {CATEGORIES.map((cat) => {
            const count = normalized.filter((t) => (t.structured?.meta?.serviceTypes || []).includes(cat)).length;
            const pct = normalized.length > 0 ? Math.round((count / normalized.length) * 100) : 0;
            return (
              <div key={cat}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: CAT_COLORS[cat], display: "inline-block", flexShrink: 0 }} />
                    <span style={{ fontSize: "0.80rem", fontFamily: APP_FONT_STACK, color: "rgba(21,18,15,0.72)" }}>{cat}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: "0.72rem", fontFamily: APP_MONO_STACK, color: CAT_COLORS[cat], fontWeight: 700 }}>{count}</span>
                    <span style={{ fontSize: "0.66rem", fontFamily: APP_MONO_STACK, color: "rgba(21,18,15,0.35)" }}>{pct}%</span>
                  </div>
                </div>
                <div style={{ height: 5, borderRadius: 999, background: "rgba(21,18,15,0.07)", overflow: "hidden" }}>
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
          <div style={{ fontFamily: APP_SERIF_STACK, fontSize: "1.4rem", fontWeight: 300, color: "#15120f", marginBottom: 10 }}>
            No tickets recorded yet.
          </div>
          <div style={{ fontSize: "0.84rem", color: "rgba(21,18,15,0.50)", fontFamily: APP_FONT_STACK, lineHeight: 1.7, maxWidth: 400, margin: "0 auto" }}>
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

        const label = month === "Unknown" ? "Undated" : (() => {
          const [y, m] = month.split("-");
          return new Date(Number(y), Number(m) - 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
        })();

        return (
          <div key={month} style={{ ...card, marginBottom: 18, overflow: "hidden" }}>
            {/* Month header */}
            <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid rgba(21,18,15,0.07)", backgroundImage: "radial-gradient(circle at 98% 0%, rgba(184,148,63,0.12), transparent 30%)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <span style={eb}>Period</span>
                  <div style={{ fontFamily: APP_SERIF_STACK, fontSize: "1.55rem", fontWeight: 300, color: "#15120f", letterSpacing: "-0.02em", lineHeight: 1 }}>{label}</div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[
                    { l: "Tickets", v: mTickets.length, c: "#15120f" },
                    { l: "Collected", v: `Rs. ${mRevenue.toLocaleString("en-IN")}`, c: "#2a5a8f" },
                    { l: "Pending", v: `Rs. ${mPending.toLocaleString("en-IN")}`, c: DS.wine },
                  ].map((s) => (
                    <div key={s.l} style={{ background: "rgba(21,18,15,0.04)", border: "1px solid rgba(21,18,15,0.08)", borderRadius: 10, padding: "8px 14px", textAlign: "right" }}>
                      <div style={{ fontSize: "0.42rem", fontWeight: 700, letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(21,18,15,0.36)", fontFamily: APP_BRAND_STACK, marginBottom: 3 }}>{s.l}</div>
                      <div style={{ fontFamily: APP_SERIF_STACK, fontSize: "1.05rem", fontWeight: 300, color: s.c }}>{s.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 0 }}>
              {/* Payment breakdown */}
              <div style={{ padding: "14px 20px", borderRight: "1px solid rgba(21,18,15,0.06)" }}>
                <span style={eb}>Payment Status</span>
                <div style={{ display: "grid", gap: 8, marginTop: 6 }}>
                  {[
                    { l: "Paid", v: paid, bar: "#2a6647", bg: "rgba(42,102,71,0.10)" },
                    { l: "Partial", v: partial, bar: "#c8922a", bg: "rgba(200,146,42,0.10)" },
                    { l: "Unpaid", v: unpaid, bar: DS.wine, bg: "rgba(143,47,47,0.10)" },
                  ].map((p) => (
                    <div key={p.l} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: p.bar, flexShrink: 0 }} />
                      <span style={{ fontSize: "0.80rem", color: "rgba(21,18,15,0.65)", fontFamily: APP_FONT_STACK, flex: 1 }}>{p.l}</span>
                      <span style={{ fontFamily: APP_MONO_STACK, fontSize: "0.88rem", fontWeight: 700, color: p.bar, background: p.bg, borderRadius: 6, padding: "2px 8px" }}>{p.v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                  {[{ l: "Open", v: mOpen, c: "#c8922a" }, { l: "Closed", v: mClosed, c: DS.wine }].map((s) => (
                    <div key={s.l} style={{ flex: 1, background: "rgba(21,18,15,0.04)", borderRadius: 8, padding: "7px 10px", border: "1px solid rgba(21,18,15,0.07)" }}>
                      <div style={{ fontSize: "0.42rem", fontWeight: 700, letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(21,18,15,0.36)", fontFamily: APP_BRAND_STACK, marginBottom: 3 }}>{s.l}</div>
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
                    <div style={{ fontSize: "0.78rem", color: "rgba(21,18,15,0.35)", fontFamily: APP_FONT_STACK }}>No category data</div>
                  ) : Object.entries(catCounts).sort((a, b) => b[1] - a[1]).map(([cat, count]) => {
                    const pct = Math.round((count / mTickets.length) * 100);
                    return (
                      <div key={cat}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: CAT_COLORS[cat] || "#888", flexShrink: 0, display: "inline-block" }} />
                            <span style={{ fontSize: "0.76rem", color: "rgba(21,18,15,0.65)", fontFamily: APP_FONT_STACK }}>{cat}</span>
                          </div>
                          <span style={{ fontFamily: APP_MONO_STACK, fontSize: "0.76rem", fontWeight: 700, color: CAT_COLORS[cat] || "#15120f" }}>{count}</span>
                        </div>
                        <div style={{ height: 4, borderRadius: 999, background: "rgba(21,18,15,0.07)" }}>
                          <div style={{ height: "100%", width: `${pct}%`, borderRadius: 999, background: CAT_COLORS[cat] || "#888", minWidth: pct > 0 ? 4 : 0 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Ticket rows */}
            <div style={{ borderTop: "1px solid rgba(21,18,15,0.07)" }}>
              <div style={{ padding: "10px 20px 6px" }}>
                <span style={{ ...eb, marginBottom: 8 }}>Ticket Log</span>
              </div>
              {mTickets.map((t, i) => {
                const ps = t.structured?.payment?.status || "Unpaid";
                const psColor = ps === "Paid" ? "#2a6647" : ps === "Partial" ? "#c8922a" : DS.wine;
                return (
                  <div key={t.ticketNo} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "9px 20px", borderTop: i > 0 ? "1px solid rgba(21,18,15,0.05)" : "none", flexWrap: "wrap", transition: "background 0.15s ease" }}
                    onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.60)"}
                    onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
                      <span style={{ fontFamily: APP_MONO_STACK, fontSize: "0.65rem", color: "rgba(21,18,15,0.35)", flexShrink: 0 }}>{t.ticketNo}</span>
                      <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#15120f", fontFamily: APP_FONT_STACK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.customerName}</span>
                      <span style={{ fontSize: "0.72rem", color: "rgba(21,18,15,0.40)", fontFamily: APP_FONT_STACK, display: "none" }}>{t.structured?.meta?.primaryType || "—"}</span>
                    </div>
                    <div style={{ display: "flex", gap: 7, alignItems: "center", flexShrink: 0 }}>
                      <span style={{ fontFamily: APP_MONO_STACK, fontSize: "0.80rem", color: "#2a5a8f", fontWeight: 600 }}>Rs. {(t.total || 0).toLocaleString("en-IN")}</span>
                      <span style={{ fontSize: "0.56rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: psColor, background: `${psColor}15`, border: `1px solid ${psColor}28`, borderRadius: 999, padding: "3px 9px" }}>{ps}</span>
                      <span style={{ fontSize: "0.56rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: t.status === "Closed" ? DS.wine : "#c8922a", background: t.status === "Closed" ? "rgba(143,47,47,0.07)" : "rgba(200,146,42,0.10)", border: `1px solid ${t.status === "Closed" ? "rgba(143,47,47,0.20)" : "rgba(200,146,42,0.24)"}`, borderRadius: 999, padding: "3px 9px" }}>{t.status}</span>
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
function CustomersWorkspace({ tickets }) {
  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState(null);

  const normalized = tickets.map((t) => t.structured ? t : withStructuredTicket(t));

  const customerMap = {};
  normalized.forEach((t) => {
    const phone = (t.customerPhone || "").replace(/\D/g, "") || null;
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

  const eb = { fontSize: "0.48rem", fontWeight: 700, letterSpacing: "0.32em", textTransform: "uppercase", color: DS.wine, fontFamily: APP_BRAND_STACK, display: "block", marginBottom: 5 };
  const card = { background: "rgba(255,255,255,0.75)", border: "1px solid rgba(21,18,15,0.09)", borderRadius: 16, boxShadow: "0 4px 16px rgba(17,14,12,0.06)" };
  const inputSt = { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid rgba(21,18,15,0.12)", background: "rgba(255,255,255,0.86)", color: "#15120f", outline: "none", fontFamily: APP_FONT_STACK, fontSize: "0.88rem" };

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>

      {/* Hero + summary */}
      <div style={{ ...card, padding: "22px 24px", marginBottom: 22, backgroundImage: "radial-gradient(circle at 5% 10%, rgba(184,148,63,0.14), transparent 32%), radial-gradient(circle at 92% 88%, rgba(143,47,47,0.08), transparent 30%)" }}>
        <span style={eb}>Customer Registry</span>
        <div style={{ fontFamily: APP_SERIF_STACK, fontSize: "clamp(1.4rem, 2.5vw, 2rem)", fontWeight: 300, color: "#15120f", letterSpacing: "-0.02em", marginBottom: 18, lineHeight: 1 }}>
          Clients &amp; <em style={{ fontStyle: "italic", color: "rgba(21,18,15,0.45)" }}>Documents.</em>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 }}>
          {[
            { label: "Total Customers", value: customers.length, color: "#15120f" },
            { label: "With Phone", value: customers.filter((c) => c.phone).length, color: "#2a5a8f" },
            { label: "Returning", value: customers.filter((c) => c.tickets.length > 1).length, color: "#c8922a" },
            { label: "Total Tickets", value: normalized.length, color: DS.wine },
          ].map((s) => (
            <div key={s.label} style={{ background: "rgba(21,18,15,0.04)", border: "1px solid rgba(21,18,15,0.08)", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontSize: "0.44rem", fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(21,18,15,0.38)", fontFamily: APP_BRAND_STACK, marginBottom: 5 }}>{s.label}</div>
              <div style={{ fontFamily: APP_SERIF_STACK, fontSize: "1.4rem", fontWeight: 300, color: s.color, lineHeight: 1 }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "minmax(280px,1fr) minmax(0,1.4fr)" : "1fr", gap: 16, alignItems: "start" }}>

        {/* Left: search + list */}
        <div>
          <div style={{ marginBottom: 12 }}>
            <input placeholder="Search by name or phone…" value={search} onChange={(e) => setSearch(e.target.value)} style={inputSt} />
          </div>

          {filtered.length === 0 ? (
            <div style={{ ...card, padding: "40px 24px", textAlign: "center" }}>
              <div style={{ fontFamily: APP_SERIF_STACK, fontSize: "1.3rem", fontWeight: 300, color: "#15120f", marginBottom: 8 }}>
                {customers.length === 0 ? "No customers yet." : "No results."}
              </div>
              <div style={{ fontSize: "0.82rem", color: "rgba(21,18,15,0.48)", fontFamily: APP_FONT_STACK, lineHeight: 1.7, maxWidth: 340, margin: "0 auto" }}>
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
                    border: isSelected ? "1px solid rgba(143,47,47,0.28)" : "1px solid rgba(21,18,15,0.09)",
                    background: isSelected ? "rgba(143,47,47,0.05)" : "rgba(255,255,255,0.75)",
                    boxShadow: isSelected ? "inset 3px 0 0 rgba(143,47,47,0.65), 0 4px 16px rgba(17,14,12,0.06)" : "0 4px 16px rgba(17,14,12,0.06)",
                    transition: "all 0.18s ease",
                  }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      {/* Avatar */}
                      <div style={{ width: 38, height: 38, borderRadius: "50%", background: isSelected ? "rgba(143,47,47,0.14)" : "rgba(21,18,15,0.07)", border: `1px solid ${isSelected ? "rgba(143,47,47,0.22)" : "rgba(21,18,15,0.10)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: APP_BRAND_STACK, fontWeight: 700, fontSize: "0.65rem", letterSpacing: "0.06em", color: isSelected ? DS.wine : "rgba(21,18,15,0.50)" }}>
                        {initials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                          <div>
                            <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "#15120f", fontFamily: APP_FONT_STACK, lineHeight: 1.3 }}>{c.name}</div>
                            <div style={{ fontSize: "0.74rem", color: "rgba(21,18,15,0.48)", fontFamily: APP_MONO_STACK, marginTop: 1 }}>
                              {c.phone ? `+91 ${c.phone.slice(0,5)} ${c.phone.slice(5)}` : "No phone"}
                            </div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <div style={{ fontSize: "0.58rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: c.tickets.length > 1 ? "#2a5a8f" : "rgba(21,18,15,0.38)", background: c.tickets.length > 1 ? "rgba(42,90,143,0.09)" : "rgba(21,18,15,0.05)", borderRadius: 999, padding: "3px 9px", border: `1px solid ${c.tickets.length > 1 ? "rgba(42,90,143,0.22)" : "rgba(21,18,15,0.09)"}`, display: "inline-block", marginBottom: 4 }}>
                              {c.tickets.length} ticket{c.tickets.length !== 1 ? "s" : ""}
                            </div>
                            <div style={{ fontSize: "0.70rem", color: "rgba(21,18,15,0.40)", fontFamily: APP_MONO_STACK }}>Rs. {totalPaid.toLocaleString("en-IN")}</div>
                          </div>
                        </div>
                        <div style={{ marginTop: 8, display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
                          {allCats.map((cat) => (
                            <span key={cat} style={{ fontSize: "0.52rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: CAT_COLORS[cat] || "#888", background: `${CAT_COLORS[cat] || "#888"}18`, border: `1px solid ${CAT_COLORS[cat] || "#888"}28`, borderRadius: 999, padding: "2px 8px" }}>{cat}</span>
                          ))}
                          {lastDate && <span style={{ marginLeft: "auto", fontSize: "0.66rem", color: "rgba(21,18,15,0.32)", fontFamily: APP_FONT_STACK }}>Last: {lastDate}</span>}
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
                <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(21,18,15,0.08)", backgroundImage: "radial-gradient(circle at 90% 0%, rgba(184,148,63,0.12), transparent 36%)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                      <div style={{ width: 50, height: 50, borderRadius: "50%", background: "rgba(143,47,47,0.10)", border: "1px solid rgba(143,47,47,0.20)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: APP_BRAND_STACK, fontWeight: 700, fontSize: "0.80rem", letterSpacing: "0.06em", color: DS.wine, flexShrink: 0 }}>
                        {initials}
                      </div>
                      <div>
                        <span style={eb}>Customer Profile</span>
                        <div style={{ fontFamily: APP_SERIF_STACK, fontSize: "1.35rem", fontWeight: 300, color: "#15120f", letterSpacing: "-0.02em", lineHeight: 1.1 }}>{selected.name}</div>
                        <div style={{ fontSize: "0.76rem", color: "rgba(21,18,15,0.50)", fontFamily: APP_MONO_STACK, marginTop: 3 }}>
                          {selected.phone ? `+91 ${selected.phone.slice(0,5)} ${selected.phone.slice(5)}` : "No phone saved"}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setSelectedKey(null)} style={{ border: "1px solid rgba(21,18,15,0.12)", borderRadius: 999, padding: "7px 14px", background: "rgba(255,255,255,0.70)", color: "rgba(21,18,15,0.55)", fontFamily: APP_BRAND_STACK, fontSize: "0.54rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", cursor: "pointer", flexShrink: 0 }}>Close</button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 14 }}>
                    {[
                      { l: "Tickets", v: selected.tickets.length },
                      { l: "Collected", v: `Rs. ${totalPaid.toLocaleString("en-IN")}` },
                      { l: "Pending", v: `Rs. ${totalPending.toLocaleString("en-IN")}` },
                    ].map((s) => (
                      <div key={s.l} style={{ background: "rgba(21,18,15,0.04)", borderRadius: 10, padding: "9px 12px", border: "1px solid rgba(21,18,15,0.07)", textAlign: "center" }}>
                        <div style={{ fontSize: "0.42rem", fontWeight: 700, letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(21,18,15,0.36)", fontFamily: APP_BRAND_STACK, marginBottom: 4 }}>{s.l}</div>
                        <div style={{ fontFamily: APP_SERIF_STACK, fontSize: "1.05rem", fontWeight: 300, color: "#15120f" }}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Documents section */}
                {allDocs.length > 0 && (
                  <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(21,18,15,0.07)" }}>
                    <span style={eb}>All Documents on File</span>
                    <div style={{ display: "grid", gap: 6, marginTop: 6 }}>
                      {allDocs.map((doc, di) => (
                        <div key={di} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 9, background: "rgba(21,18,15,0.03)", border: "1px solid rgba(21,18,15,0.07)" }}>
                          <div>
                            <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#15120f", fontFamily: APP_FONT_STACK }}>{doc.name}</div>
                            <div style={{ fontSize: "0.66rem", color: "rgba(21,18,15,0.40)", fontFamily: APP_MONO_STACK, marginTop: 1 }}>{doc.ticketNo} · {doc.ticketDate || "—"}</div>
                          </div>
                          <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                            <span style={{ fontSize: "0.54rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: doc.required ? DS.wine : "rgba(21,18,15,0.40)", background: doc.required ? "rgba(143,47,47,0.07)" : "rgba(21,18,15,0.04)", borderRadius: 999, padding: "3px 8px", border: `1px solid ${doc.required ? "rgba(143,47,47,0.18)" : "rgba(21,18,15,0.08)"}` }}>{doc.required ? "Required" : "Optional"}</span>
                            <span style={{ fontSize: "0.54rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: doc.submitted ? "#2a6647" : "#c8922a", background: doc.submitted ? "rgba(42,102,71,0.08)" : "rgba(200,146,42,0.09)", borderRadius: 999, padding: "3px 8px", border: `1px solid ${doc.submitted ? "rgba(42,102,71,0.18)" : "rgba(200,146,42,0.22)"}` }}>{doc.submitted ? "Submitted" : "Pending"}</span>
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
                      const psColor = ps === "Paid" ? "#2a6647" : ps === "Partial" ? "#c8922a" : DS.wine;
                      const services = (t.structured?.services || []).map((s) => s.name).join(", ") || "—";
                      return (
                        <div key={t.ticketNo} style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(21,18,15,0.09)", borderRadius: 10, padding: "12px 14px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                            <div>
                              <div style={{ fontFamily: APP_MONO_STACK, fontSize: "0.65rem", color: "rgba(21,18,15,0.35)", marginBottom: 2 }}>{t.ticketNo} · {t.structured?.meta?.createdDate || "—"}</div>
                              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#15120f", fontFamily: APP_FONT_STACK, lineHeight: 1.3 }}>{services}</div>
                              <div style={{ fontSize: "0.72rem", color: "rgba(21,18,15,0.45)", fontFamily: APP_FONT_STACK, marginTop: 2 }}>
                                {t.operator || "—"} · Rs. {(t.total || 0).toLocaleString("en-IN")}
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 5, alignItems: "flex-start", flexShrink: 0 }}>
                              <span style={{ fontSize: "0.54rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: psColor, background: `${psColor}15`, border: `1px solid ${psColor}28`, borderRadius: 999, padding: "3px 9px" }}>{ps}</span>
                              <span style={{ fontSize: "0.54rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: t.status === "Closed" ? DS.wine : "#c8922a", background: t.status === "Closed" ? "rgba(143,47,47,0.07)" : "rgba(200,146,42,0.09)", border: `1px solid ${t.status === "Closed" ? "rgba(143,47,47,0.18)" : "rgba(200,146,42,0.22)"}`, borderRadius: 999, padding: "3px 9px" }}>{t.status}</span>
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

  const inputSt = {
    width: "100%", padding: "11px 14px", borderRadius: 10,
    border: "1px solid rgba(21,18,15,0.14)", background: "rgba(255,255,255,0.86)",
    color: "#15120f", outline: "none", fontFamily: APP_FONT_STACK, fontSize: "0.90rem",
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(15,17,22,0.55)", backdropFilter: "blur(6px)" }} />
      <div style={{
        position: "relative", zIndex: 1, width: "min(480px, 100%)",
        background: "#fffaf2", border: "1px solid rgba(21,18,15,0.14)", borderRadius: 20,
        padding: "28px 24px", boxShadow: "0 28px 68px rgba(17,14,12,0.18)",
        backgroundImage: "radial-gradient(circle at 8% 8%, rgba(184,148,63,0.18), transparent 32%), radial-gradient(circle at 90% 90%, rgba(143,47,47,0.10), transparent 30%)",
      }}>
        <div style={{ fontSize: "0.52rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.32em", textTransform: "uppercase", color: DS.wine, marginBottom: 10 }}>
          Quick Walk-In
        </div>
        <div style={{ fontFamily: APP_SERIF_STACK, fontSize: "1.65rem", fontWeight: 300, letterSpacing: "-0.02em", color: "#15120f", marginBottom: 6, lineHeight: 1.1 }}>
          Start <em style={{ fontStyle: "italic" }}>instantly.</em>
        </div>
        <div style={{ fontSize: "0.84rem", color: "rgba(21,18,15,0.58)", fontFamily: APP_FONT_STACK, lineHeight: 1.65, marginBottom: 22 }}>
          Enter the customer name and start the ticket immediately — no WhatsApp needed.
        </div>

        <div style={{ display: "grid", gap: 14, marginBottom: 18 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: "0.52rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: DS.wine }}>Customer Name *</span>
            <input autoFocus placeholder="e.g. Rahul Sharma" value={name} onChange={(e) => { setName(e.target.value); setError(""); }} style={inputSt} />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: "0.52rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(21,18,15,0.42)" }}>Phone (optional)</span>
            <input type="tel" placeholder="10-digit mobile" value={phone} onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setError(""); }} style={inputSt} />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: "0.52rem", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(21,18,15,0.42)" }}>Operator</span>
            <select value={operator} onChange={(e) => setOperator(e.target.value)} style={inputSt}>
              {OPERATORS.map((op) => <option key={op} value={op} style={MENU_OPTION_STYLE}>{op}</option>)}
            </select>
          </label>
        </div>

        {error && (
          <div style={{ marginBottom: 12, padding: "10px 14px", borderRadius: 10, background: "rgba(214,5,43,0.07)", border: "1px solid rgba(214,5,43,0.22)", color: "#8f1020", fontSize: "0.82rem", fontFamily: APP_FONT_STACK }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ border: "1px solid rgba(21,18,15,0.14)", borderRadius: 999, padding: "11px 20px", background: "rgba(255,255,255,0.72)", color: "rgba(21,18,15,0.70)", fontFamily: APP_BRAND_STACK, fontWeight: 700, fontSize: "0.58rem", letterSpacing: "0.22em", textTransform: "uppercase", cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={handleStart} style={{ border: "1px solid rgba(143,47,47,0.48)", borderRadius: 999, padding: "11px 24px", background: "rgba(143,47,47,0.13)", color: "#6b1f1f", fontFamily: APP_BRAND_STACK, fontWeight: 700, fontSize: "0.58rem", letterSpacing: "0.22em", textTransform: "uppercase", cursor: "pointer" }}>
            Start Ticket →
          </button>
        </div>
      </div>
    </div>
  );
}

// --- MAIN APP ---
export default function CSCBilling() {
  const [tab, setTab] = useState(() => getInitialActiveTab());
  const [sidePanelExpanded, setSidePanelExpanded] = useState(() => getStoredSidePanelExpanded());
  const [services, setServices] = useState(() => (
    hydrateServices(readStoredJSON(STORAGE_KEYS.services, INITIAL_SERVICES))
  ));
  const [tickets, setTickets] = useState(() => (
    hydrateTickets(readStoredJSON(STORAGE_KEYS.tickets, []))
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
  const openTicketCount = tickets.filter((ticket) => ticket.status !== "Closed").length;
  const panelBadges = {
    log: openTicketCount > 0 ? String(openTicketCount) : String(tickets.length),
  };
  const headerStats = [];
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
  const quickLinks = [...QUICK_LINK_DEFAULTS, ...customQuickLinks];
  const navigateTab = (nextTab, mode = "push") => {
    if (!TAB_CONFIG.some((item) => item.id === nextTab)) return;
    if (nextTab === tab) return;
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

  useEffect(() => {
    updateBrowserState({ tab }, "replace");
  }, []);

  useEffect(() => {
    const handlePopState = (event) => {
      const nextTab = event.state?.tab;
      if (TAB_CONFIG.some((item) => item.id === nextTab)) {
        setTab(nextTab);
      }
    };
    if (typeof window === "undefined") return undefined;
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    writeStoredJSON(STORAGE_KEYS.activeTab, tab);
  }, [tab]);

  useEffect(() => {
    writeStoredJSON(STORAGE_KEYS.sidePanelExpanded, sidePanelExpanded);
  }, [sidePanelExpanded]);

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
      const [remoteTicketsResult, remoteServicesResult, remoteQuickLinksResult] = await Promise.all([
        dbLoad("tickets"),
        dbLoad("services"),
        dbLoad("quick_links"),
      ]);

      if (cancelled) return;
      let syncFailed = [remoteTicketsResult, remoteServicesResult, remoteQuickLinksResult].some((result) => !result?.ok);

      const localTickets = readStoredJSON(STORAGE_KEYS.tickets, []);
      const localServices = readStoredJSON(STORAGE_KEYS.services, []);
      const localQuickLinks = getStoredQuickLinks();
      const remoteTickets = remoteTicketsResult?.value;
      const remoteServices = remoteServicesResult?.value;
      const remoteQuickLinks = remoteQuickLinksResult?.value;

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
  useDebouncedStoredJSON(STORAGE_KEYS.quickLinks, customQuickLinks, 180);

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

  return (
    <div style={{
      minHeight: "100vh",
      background: DS.dark,
      fontFamily: APP_FONT_STACK,
      color: DS.fg1,
      display: "flex",
      flexDirection: "column",
    }}>
      {showWalkIn && <WalkInModal onClose={() => setShowWalkIn(false)} onStart={handleWalkInStart} />}
      <style>{`
        :root { color-scheme: dark; }
        * { box-sizing: border-box; }
        html, body {
          margin: 0;
          background: ${DS.dark};
          color: ${DS.fg1};
        }
        body, button, input, select, textarea {
          font-family: ${APP_FONT_STACK};
          color: ${DS.fg1};
        }
        input::placeholder, textarea::placeholder {
          color: ${DS.fg4};
        }
        select option {
          background: ${DS.darkDeep};
          color: ${DS.fg1};
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
          from { box-shadow: 0 0 0 0 rgba(143,47,47,0); }
          to   { box-shadow: 0 0 22px 4px rgba(143,47,47,0.08); }
        }
        .csc-sidebar-nav::-webkit-scrollbar { width: 4px; }
        .csc-sidebar-nav::-webkit-scrollbar-track { background: transparent; }
        .csc-sidebar-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 999px; }
        .csc-content-scroll::-webkit-scrollbar { width: 4px; }
        .csc-content-scroll::-webkit-scrollbar-track { background: transparent; }
        .csc-content-scroll::-webkit-scrollbar-thumb { background: rgba(21,18,15,0.12); border-radius: 999px; }
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

      {/* ── App Shell: Sidebar + Main ── */}
      <div style={{ display: "flex", minHeight: "100vh" }}>

        {/* ── Left Sidebar ── */}
        <aside className="csc-sidebar" style={{
          width: 260,
          minWidth: 260,
          background: `radial-gradient(circle at 110% -8%, rgba(184,148,63,0.12), transparent 38%), radial-gradient(circle at -10% 100%, rgba(143,47,47,0.07), transparent 36%), linear-gradient(180deg, #fdf8f0 0%, #f8f2e6 100%)`,
          borderRight: `1px solid rgba(21,18,15,0.10)`,
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
          zIndex: 20,
        }}>
          {/* Sidebar Header / Logo */}
          <div style={{ padding: "24px 20px 18px" }}>
            {/* Icon mark + wordmark row */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              {/* Icon mark: 2×2 dot grid */}
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: DS.wine,
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4,
                padding: 8, flexShrink: 0,
              }}>
                {[0,1,2,3].map((i) => (
                  <div key={i} style={{ borderRadius: "50%", background: i < 2 ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.40)" }} />
                ))}
              </div>
              {/* Wordmark */}
              <div>
                <div style={{
                  fontFamily: APP_BRAND_STACK, fontWeight: 800,
                  fontSize: "1.05rem", letterSpacing: "0.06em",
                  color: "#15120f", lineHeight: 1.1,
                  display: "flex", alignItems: "baseline", gap: 5,
                }}>
                  <span>CSC</span>
                  <span style={{ fontWeight: 400, color: "rgba(21,18,15,0.55)", fontSize: "1.0rem", letterSpacing: "0.02em" }}>Buddy</span>
                </div>
                <div style={{
                  fontSize: "0.60rem", fontWeight: 600, letterSpacing: "0.22em",
                  textTransform: "uppercase", color: DS.wine,
                  fontFamily: APP_BRAND_STACK, marginTop: 2,
                }}>
                  Blue Sapphire Plaza
                </div>
              </div>
            </div>
            <div style={{
              fontSize: "0.70rem", color: "rgba(21,18,15,0.38)",
              fontFamily: APP_FONT_STACK, letterSpacing: "0.03em",
            }}>
              Operations Console
            </div>
          </div>

          {/* Hairline divider */}
          <div style={{ height: 1, background: "rgba(21,18,15,0.08)", margin: "0 20px" }} />

          {/* Date/Status block */}
          <div style={{ padding: "12px 20px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{
                  fontSize: "0.60rem", fontWeight: 700, letterSpacing: "0.18em",
                  textTransform: "uppercase", color: "rgba(21,18,15,0.40)", fontFamily: APP_BRAND_STACK, marginBottom: 3,
                }}>
                  Today
                </div>
                <div style={{
                  fontFamily: APP_FONT_STACK, fontSize: "0.90rem", fontWeight: 600,
                  color: "#15120f", letterSpacing: "-0.01em", lineHeight: 1.2,
                }}>
                  {todayStr()}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(200,146,42,0.10)", border: "1px solid rgba(200,146,42,0.22)", borderRadius: 999, padding: "4px 9px" }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#c8922a", display: "inline-block", boxShadow: "0 0 4px rgba(200,146,42,0.60)" }} />
                <span style={{ fontSize: "0.58rem", color: "#c8922a", fontFamily: APP_BRAND_STACK, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" }}>Live</span>
              </div>
            </div>
          </div>

          {/* Hairline divider */}
          <div style={{ height: 1, background: "rgba(21,18,15,0.08)", margin: "0 20px" }} />

          {/* Primary Nav */}
          <nav className="csc-sidebar-nav" style={{
            flex: 1, overflowY: "auto",
            padding: "18px 10px 10px",
            display: "flex", flexDirection: "column", gap: 2,
          }}>
            {/* Section label */}
            <div style={{
              fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.26em",
              textTransform: "uppercase", color: "rgba(21,18,15,0.38)",
              fontFamily: APP_BRAND_STACK, padding: "0 8px", marginBottom: 8,
            }}>
              Workspaces
            </div>
            {PRIMARY_TAB_CONFIG.map((item) => (
              <TabBtn
                key={item.id}
                label={item.label}
                description={item.description}
                active={tab === item.id}
                onClick={() => navigateTab(item.id)}
              />
            ))}

            {/* Walk-in CTA */}
            <div style={{ margin: "14px 8px 0", height: 1, background: "rgba(21,18,15,0.08)" }} />
            <button
              onClick={() => setShowWalkIn(true)}
              style={{
                width: "100%", padding: "10px 18px", marginTop: 10,
                border: "none", background: "transparent",
                cursor: "pointer", textAlign: "left",
                display: "flex", alignItems: "center", gap: 10,
                borderRadius: 10, transition: DS.transStd,
              }}
            >
              <span style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                background: "rgba(143,47,47,0.10)", border: "1px solid rgba(143,47,47,0.22)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.75rem", color: DS.wine,
              }}>↗</span>
              <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", fontFamily: APP_BRAND_STACK, color: DS.wine }}>New Walk-in</span>
                <span style={{ fontSize: "0.70rem", color: "rgba(21,18,15,0.45)", fontFamily: APP_FONT_STACK }}>Start intake without WhatsApp</span>
              </span>
            </button>

            {/* Section label */}
            <div style={{ margin: "14px 8px 8px", height: 1, background: "rgba(21,18,15,0.08)" }} />
            <div style={{
              fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.26em",
              textTransform: "uppercase", color: "rgba(21,18,15,0.38)",
              fontFamily: APP_BRAND_STACK, padding: "0 8px", marginBottom: 8,
            }}>
              Tools &amp; Logs
            </div>
            {PANEL_TAB_CONFIG.map((item) => (
              <TabBtn
                key={item.id}
                label={item.label}
                description={item.description}
                active={tab === item.id}
                onClick={() => navigateTab(item.id)}
                badge={panelBadges[item.id]}
              />
            ))}
          </nav>

          {/* Sidebar footer */}
          <div style={{ padding: "10px 10px 20px" }}>
            <div style={{ height: 1, background: "rgba(21,18,15,0.08)", margin: "0 8px 12px" }} />
            <button
              onClick={() => setSidePanelExpanded((prev) => !prev)}
              aria-label={sidePanelExpanded ? "Close utility menu" : "Open utility menu"}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "10px 18px", borderRadius: 10, border: "none",
                background: sidePanelExpanded ? "rgba(143,47,47,0.08)" : "transparent",
                cursor: "pointer", transition: DS.transStd,
              }}
            >
              <span style={{ display: "flex", flexDirection: "column", gap: 3.5, flexShrink: 0 }}>
                <span style={{ width: 14, height: 1.5, borderRadius: 999, background: "rgba(21,18,15,0.40)", display: "block" }} />
                <span style={{ width: 14, height: 1.5, borderRadius: 999, background: "rgba(21,18,15,0.40)", display: "block" }} />
                <span style={{ width: 9, height: 1.5, borderRadius: 999, background: "rgba(21,18,15,0.40)", display: "block" }} />
              </span>
              <span style={{ fontSize: "0.72rem", fontFamily: APP_FONT_STACK, fontWeight: 500, color: "rgba(21,18,15,0.50)" }}>Quick Links &amp; Tools</span>
            </button>
          </div>
        </aside>

        {/* ── Backdrop for utility drawer ── */}
        <div
          aria-hidden={!sidePanelExpanded}
          onClick={() => setSidePanelExpanded(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            opacity: sidePanelExpanded ? 1 : 0,
            pointerEvents: sidePanelExpanded ? "auto" : "none",
            transition: "opacity 0.25s ease",
            zIndex: 40,
          }}
        />

        {/* ── Utility Drawer (slides over sidebar) ── */}
        <aside
          aria-hidden={!sidePanelExpanded}
          style={{
            position: "fixed",
            top: 0,
            bottom: 0,
            left: 0,
            width: "min(340px, calc(100vw - 40px))",
            background: `radial-gradient(circle at 92% -6%, rgba(184,148,63,0.14), transparent 38%), radial-gradient(circle at -8% 100%, rgba(143,47,47,0.07), transparent 34%), linear-gradient(180deg, #fdf8f0 0%, #f5ede0 100%)`,
            border: `none`,
            borderRight: `1px solid rgba(21,18,15,0.12)`,
            boxShadow: "8px 0 40px rgba(21,18,15,0.12)",
            padding: "24px 16px",
            transform: sidePanelExpanded ? "translateX(0)" : "translateX(-100%)",
            transition: `transform 0.32s ${DS.ease}`,
            zIndex: 50,
            display: "grid",
            gridTemplateRows: "auto auto minmax(0,1fr) minmax(0,1.2fr)",
            gap: 16,
          }}
        >
          {/* Drawer header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div>
              <div style={{
                fontSize: "0.58rem",
                fontWeight: 700,
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                color: DS.wine,
                fontFamily: APP_BRAND_STACK,
                marginBottom: 8,
              }}>
                Utility Menu
              </div>
              <div style={{
                fontFamily: APP_SERIF_STACK,
                fontSize: "1.4rem",
                fontWeight: 300,
                color: "#15120f",
                letterSpacing: "-0.01em",
              }}>
                Workspace Tools
              </div>
            </div>
            <button
              onClick={() => setSidePanelExpanded(false)}
              style={{
                border: "1px solid rgba(21,18,15,0.14)",
                borderRadius: 10,
                padding: "8px 12px",
                background: "rgba(21,18,15,0.05)",
                color: "rgba(21,18,15,0.60)",
                cursor: "pointer",
                fontFamily: APP_BRAND_STACK,
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                transition: DS.transColor,
              }}
            >
              Close
            </button>
          </div>

          {/* Drawer info note */}
          <div style={{
            padding: "12px 14px",
            borderRadius: 12,
            background: "rgba(21,18,15,0.04)",
            border: "1px solid rgba(21,18,15,0.08)",
          }}>
            <div style={{ fontSize: "0.8rem", color: "rgba(21,18,15,0.55)", lineHeight: 1.6, fontFamily: APP_FONT_STACK }}>
              Monitoring, partner workflows, and quick-access portals — without crowding the main intake flow.
            </div>
          </div>

          {/* Utility views */}
          <div style={{ display: "grid", gap: 8, alignContent: "start", overflow: "hidden" }}>
            <div style={{
              fontSize: "0.58rem",
              fontWeight: 700,
              letterSpacing: "0.30em",
              textTransform: "uppercase",
              color: "rgba(21,18,15,0.38)",
              fontFamily: APP_BRAND_STACK,
              padding: "0 4px",
              marginBottom: 4,
            }}>
              Utility Views
            </div>
            {PANEL_TAB_CONFIG.map((item) => (
              <SideNavItem
                key={item.id}
                item={item}
                active={tab === item.id}
                expanded={true}
                badge={panelBadges[item.id]}
                onClick={() => {
                  navigateTab(item.id);
                  setSidePanelExpanded(false);
                }}
              />
            ))}
          </div>

          {/* Quick links */}
          <div style={{
            borderRadius: 14,
            border: "1px solid rgba(21,18,15,0.10)",
            background: "rgba(255,255,255,0.55)",
            padding: 12,
            display: "grid",
            gap: 10,
            alignContent: "start",
            overflow: "hidden",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <div style={{
                fontSize: "0.58rem",
                fontWeight: 700,
                letterSpacing: "0.30em",
                textTransform: "uppercase",
                color: "rgba(21,18,15,0.40)",
                fontFamily: APP_BRAND_STACK,
              }}>
                Quick Links
              </div>
              <button
                onClick={() => {
                  setShowAddQuickLink((prev) => !prev);
                  setQuickLinkError("");
                }}
                style={{
                  border: `1px solid rgba(211,166,90,0.28)`,
                  borderRadius: 8,
                  background: "rgba(211,166,90,0.08)",
                  color: DS.gold,
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  fontFamily: APP_BRAND_STACK,
                  padding: "5px 8px",
                  cursor: "pointer",
                  transition: DS.transColor,
                }}
              >
                {showAddQuickLink ? "Cancel" : "Add"}
              </button>
            </div>
            {showAddQuickLink && (
              <div style={{ display: "grid", gap: 8 }}>
                <input
                  value={quickLinkName}
                  onChange={(e) => setQuickLinkName(e.target.value)}
                  placeholder="Link Name"
                  style={{
                    padding: "9px 10px",
                    borderRadius: 8,
                    border: "1px solid rgba(21,18,15,0.14)",
                    background: "rgba(255,255,255,0.80)",
                    color: "#15120f",
                    outline: "none",
                    fontSize: "0.82rem",
                    fontFamily: APP_FONT_STACK,
                  }}
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
                  <input
                    value={quickLinkUrl}
                    onChange={(e) => setQuickLinkUrl(e.target.value)}
                    placeholder="example.com"
                    style={{
                      padding: "9px 10px",
                      borderRadius: 8,
                      border: "1px solid rgba(21,18,15,0.14)",
                      background: "rgba(255,255,255,0.80)",
                      color: "#15120f",
                      outline: "none",
                      fontSize: "0.82rem",
                      fontFamily: APP_FONT_STACK,
                    }}
                  />
                  <button
                    onClick={addQuickLink}
                    style={{
                      border: "1px solid rgba(143,47,47,0.35)",
                      borderRadius: 8,
                      background: "rgba(143,47,47,0.10)",
                      color: DS.wine,
                      fontWeight: 700,
                      padding: "0 12px",
                      cursor: "pointer",
                      fontSize: "0.78rem",
                      fontFamily: APP_BRAND_STACK,
                      letterSpacing: "0.10em",
                      textTransform: "uppercase",
                      transition: DS.transColor,
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
            {quickLinkError && (
              <div style={{ fontSize: "0.75rem", color: "#8f1020", fontWeight: 600 }}>{quickLinkError}</div>
            )}
            <div style={{ display: "grid", gap: 7, maxHeight: 260, overflowY: "auto", paddingRight: 2 }}>
              {quickLinks.map((link) => (
                <div key={link.id} style={{
                  borderRadius: 10,
                  border: "1px solid rgba(21,18,15,0.09)",
                  background: "rgba(255,255,255,0.65)",
                  padding: "9px 10px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 5 }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#15120f", lineHeight: 1.3, fontFamily: APP_FONT_STACK }}>{link.name}</div>
                    {!link.isDefault && (
                      <button
                        onClick={() => removeQuickLink(link.id)}
                        style={{
                          border: "none",
                          borderRadius: 6,
                          background: "rgba(214,5,43,0.08)",
                          color: "#8f1020",
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          padding: "3px 6px",
                          cursor: "pointer",
                          fontFamily: APP_BRAND_STACK,
                          letterSpacing: "0.10em",
                          textTransform: "uppercase",
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "rgba(21,18,15,0.48)", lineHeight: 1.45, marginBottom: 7 }}>{link.description}</div>
                  <button
                    onClick={() => openQuickLink(link.url)}
                    style={{
                      width: "100%",
                      border: "1px solid rgba(143,47,47,0.28)",
                      borderRadius: 7,
                      background: "rgba(143,47,47,0.07)",
                      color: DS.wine,
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      fontFamily: APP_BRAND_STACK,
                      padding: "5px 6px",
                      cursor: "pointer",
                      transition: DS.transColor,
                    }}
                  >
                    Open
                  </button>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Main Content Area ── */}
        <main style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          background: "#fffaf2",
          position: "relative",
        }}>
          {/* Subtle grid texture */}
          <div style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.18, backgroundImage: "linear-gradient(90deg, rgba(21,18,15,0.04) 1px, transparent 1px), linear-gradient(rgba(21,18,15,0.04) 1px, transparent 1px)", backgroundSize: "72px 72px" }} />

          {/* Top bar */}
          <header style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            background: `rgba(255,250,242,0.92)`,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottom: `1px solid rgba(21,18,15,0.10)`,
            padding: "0 28px",
            height: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}>
            {/* Active view label */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "#8f2f2f", opacity: 0.7, flexShrink: 0,
              }} />
              <div style={{
                fontFamily: APP_BRAND_STACK,
                fontSize: "0.80rem",
                fontWeight: 700,
                color: "#15120f",
                letterSpacing: "0.04em",
              }}>
                {TAB_CONFIG.find((item) => item.id === tab)?.label}
              </div>
              <div style={{
                fontSize: "0.68rem", color: "rgba(21,18,15,0.38)",
                fontFamily: APP_FONT_STACK, fontWeight: 400,
              }}>
                {TAB_CONFIG.find((item) => item.id === tab)?.description}
              </div>
            </div>

            {/* Stats strip + Walk-in CTA */}
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              {headerStats.map((stat) => (
                <div key={stat.label} style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.20em", textTransform: "uppercase", color: "rgba(21,18,15,0.38)", fontFamily: APP_BRAND_STACK, marginBottom: 2 }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: "0.86rem", fontWeight: 700, color: stat.accent || "#15120f", fontFamily: APP_MONO_STACK, letterSpacing: "-0.01em" }}>
                    {stat.value}
                  </div>
                </div>
              ))}
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.20em", textTransform: "uppercase", color: "rgba(21,18,15,0.38)", fontFamily: APP_BRAND_STACK, marginBottom: 2 }}>
                  Data Sync
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 999, padding: "5px 10px", border: `1px solid ${cloudSyncState === "sync_failed" ? "rgba(214,5,43,0.30)" : cloudSyncState === "synced" ? "rgba(42,102,71,0.30)" : "rgba(21,18,15,0.16)"}`, background: cloudSyncState === "sync_failed" ? "rgba(214,5,43,0.08)" : cloudSyncState === "synced" ? "rgba(42,102,71,0.10)" : "rgba(21,18,15,0.05)" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: cloudSyncAccent, display: "inline-block" }} />
                  <span style={{ fontSize: "0.62rem", fontWeight: 700, color: cloudSyncAccent, fontFamily: APP_BRAND_STACK, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                    {cloudSyncLabel}
                  </span>
                  {cloudSyncState === "synced" && cloudLastSyncedAt && (
                    <span style={{ fontSize: "0.68rem", color: "rgba(21,18,15,0.40)", fontFamily: APP_MONO_STACK }}>
                      {formatSyncTime(cloudLastSyncedAt)}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowWalkIn(true)}
                style={{
                  border: "1px solid rgba(143,47,47,0.42)",
                  borderRadius: 999,
                  padding: "10px 18px",
                  background: "rgba(143,47,47,0.11)",
                  color: "#6b1f1f",
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
                + Walk-in
              </button>
            </div>
          </header>

          {/* Page title / hero area */}
          <div style={{
            padding: "28px 32px 22px",
            borderBottom: `1px solid rgba(21,18,15,0.09)`,
            backgroundImage: `radial-gradient(circle at 8% 8%, rgba(184,148,63,0.20), transparent 32%), radial-gradient(circle at 90% 90%, rgba(143,47,47,0.10), transparent 30%)`,
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
              color: "#15120f",
            }}>
              {TAB_CONFIG.find((item) => item.id === tab)?.label}
            </h1>
            <p style={{
              margin: "10px 0 0",
              fontSize: "0.86rem",
              lineHeight: 1.72,
              color: "rgba(21,18,15,0.60)",
              maxWidth: 520,
              fontFamily: APP_FONT_STACK,
              fontWeight: 400,
            }}>
              {TAB_CONFIG.find((item) => item.id === tab)?.description}
            </p>
          </div>

          {/* Tab Content */}
          <div className="csc-content-scroll" style={{
            flex: 1,
            padding: "24px 28px 48px",
            overflowY: "auto",
            position: "relative",
            zIndex: 1,
          }}>
            <TabPanel active={tab === "entry"}>
              <TicketWorkspace key={entryWorkspaceKey} services={services} tickets={tickets} onSaveTicket={saveTicket} onNavigateTab={navigateTab} isActive={tab === "entry"} />
            </TabPanel>
            <TabPanel active={tab === "rates"}>
              <RateCard services={services} setServices={setServices} />
            </TabPanel>
            <TabPanel active={tab === "log"}>
              <TicketDashboard tickets={tickets} onToggleTicketStatus={toggleTicketStatus} onToggleTaskDone={toggleTaskDone} onUpdateTicket={updateTicket} />
            </TabPanel>
            <TabPanel active={tab === "b2b"}>
              <B2BWorkspace />
            </TabPanel>
            <TabPanel active={tab === "monthly"}>
              <MonthlyOverview tickets={tickets} />
            </TabPanel>
            <TabPanel active={tab === "customers"}>
              <CustomersWorkspace tickets={tickets} />
            </TabPanel>
          </div>
        </main>

      </div>
    </div>
  );
}




