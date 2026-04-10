import { useEffect, useState, useRef } from "react";

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
  "Government ID": "#14B8A6", // Indigo
  "Certificates": "#0284C7",   // Sky Blue
  "Legal & Docs": "#0D9488",   // Teal
  "Government Services": "#16A34A", // Emerald
  "Typing & Print": "#0E7490", // Violet
};

const OPERATORS = ["Samar", "Navneet Mam"];
const REFERENCE_TYPES = [
  { id: "guardian", label: "Guardian / Parent" },
  { id: "gatekeeper", label: "Gatekeeper / Agent" },
  { id: "walkin_partner", label: "Walk-in Partner" },
  { id: "incharge", label: "Incharge / Office Rep" },
];

const REFERENCE_TYPE_CONFIG = {
  guardian: {
    label: "Guardian / Parent",
    description: "Representative is a guardian/parent of the document holder.",
  },
  gatekeeper: {
    label: "Gatekeeper / Agent",
    description: "Representative is handling docs on behalf of the holder.",
  },
  walkin_partner: {
    label: "Walk-in Partner",
    description: "Representative is a walk-in partner for the holder.",
  },
  incharge: {
    label: "Incharge / Office Rep",
    description: "Representative is official incharge for the holder.",
  },
};

const PHONE_REGEX = /^[0-9]{10}$/;
const MENU_OPTION_STYLE = { color: "#0F172A", backgroundColor: "#FFFFFF" };
const MENU_OPTGROUP_STYLE = { color: "#334155", backgroundColor: "#FFFFFF" };
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
const APP_FONT_STACK = "'Outfit', 'Manrope', 'Segoe UI', sans-serif";
const APP_MONO_STACK = "'JetBrains Mono', 'Cascadia Code', Consolas, monospace";
const APP_MAX_WIDTH = 1240;
const STORAGE_KEYS = {
  activeTab: "csc-buddy.active-tab",
  sidePanelExpanded: "csc-buddy.side-menu-open",
  services: "csc-buddy.services",
  tickets: "csc-buddy.tickets",
  ticketDraft: "csc-buddy.ticket-draft",
  quickLinks: "csc-buddy.quick-links",
};
const TAB_CONFIG = [
  { id: "desk", label: "Today's Desk", description: "Start with pending work and today's totals.", shortLabel: "TDK", navGroup: "primary" },
  { id: "entry", label: "Service Entry", description: "Create tickets and capture walk-ins.", shortLabel: "SE", navGroup: "primary" },
  { id: "rates", label: "Rate Card", description: "Maintain service pricing and categories.", shortLabel: "RC", navGroup: "primary" },
  { id: "log", label: "Ticket Dashboard", description: "Track payment, status, and document flow.", shortLabel: "TD", navGroup: "panel" },
  { id: "b2b", label: "B2B Desk", description: "Prepare partner and bulk workflows.", shortLabel: "B2", navGroup: "panel" },
];
const PRIMARY_TAB_CONFIG = TAB_CONFIG.filter((item) => item.navGroup === "primary");
const PANEL_TAB_CONFIG = TAB_CONFIG.filter((item) => item.navGroup === "panel");
const QUICK_LINK_DEFAULTS = [
  { id: "default_esathi", name: "e-Saathi", description: "UP state citizen services portal.", url: "https://edistrict.up.gov.in", isDefault: true },
  { id: "default_digitalseva", name: "Digital Seva Portal", description: "CSC services and transaction desk.", url: "https://digitalseva.csc.gov.in", isDefault: true },
  { id: "default_csc_edistrict", name: "CSC e-District", description: "e-District workflows and submissions.", url: "https://edistrict.up.gov.in", isDefault: true },
  { id: "default_estamping", name: "Estamping", description: "Stamp and registration services.", url: "https://igrsup.gov.in", isDefault: true },
  { id: "default_pf", name: "PF (EPFO)", description: "Provident fund member services.", url: "https://www.epfindia.gov.in", isDefault: true },
  { id: "default_pension", name: "Pension (NPS)", description: "NPS CRA account and pension tools.", url: "https://npscra.nsdl.co.in", isDefault: true },
  { id: "default_crsorgi", name: "dc.crsorgi", description: "Civil registration and certificate access.", url: "https://dc.crsorgi.gov.in", isDefault: true },
  { id: "default_pdf_compress", name: "PDF Compressor", description: "Quickly reduce PDF file size.", url: "https://www.ilovepdf.com/compress_pdf", isDefault: true },
  { id: "default_img_to_pdf", name: "Image to PDF", description: "Convert JPG or PNG to PDF.", url: "https://www.ilovepdf.com/jpg_to_pdf", isDefault: true },
  { id: "default_pdf_to_img", name: "PDF to Image", description: "Convert PDF pages to image files.", url: "https://www.ilovepdf.com/pdf_to_jpg", isDefault: true },
];

function normalizeExternalUrl(url) {
  const trimmed = String(url || "").trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function getReferenceTypeConfig(typeId) {
  return REFERENCE_TYPE_CONFIG[typeId] || REFERENCE_TYPE_CONFIG.incharge;
}

function getReferenceTypeIdByLabel(label) {
  const normalized = String(label || "").trim().toLowerCase();
  const match = REFERENCE_TYPES.find((item) => item.label.toLowerCase() === normalized);
  return match ? match.id : "guardian";
}

function generateBillNo() {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const mon = String(d.getMonth() + 1).padStart(2, "0");
  const seq = String(Math.floor(Math.random() * 900) + 100);
  return `SLP-${day}${mon}-${seq}`;
}

function todayStr() {
  const d = new Date();
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function timeStr() {
  return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
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

  return {
    meta: {
      ticketNo: ticket.ticketNo || "",
      createdDate: ticket.date || "",
      createdTime: ticket.time || "",
      updatedAt: ticket.updatedAt || "",
      status: ticket.status || "Open",
    },
    parties: {
      documentHolder: {
        name: ticket.customerName || "Walk-in Customer",
        phone: ticket.customerPhone || "",
      },
      reference: {
        name: ticket.referenceName || "",
        typeId: ticket.referenceType || "",
        typeLabel: ticket.referenceTypeLabel || "",
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
  const ackNumber = String(normalizedTicket?.ackNumber || "").trim();
  const statusColor = structured.meta.status === "Closed" ? "#047857" : "#B45309";

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
      <div class="meta-line">Reference: ${escapeHtml(structured.parties.reference.name || "N/A")} (${escapeHtml(structured.parties.reference.typeLabel || "N/A")})</div>
      ${structured.parties.documentHolder.phone ? `<div class="meta-line">Contact: ${escapeHtml(structured.parties.documentHolder.phone)}</div>` : ""}
      ${ackNumber ? `<div class="meta-line">Acknowledgement No.: ${escapeHtml(ackNumber)}</div>` : ""}
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
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota or browser storage errors and continue with in-memory state.
  }
}

function removeStoredValue(key) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage cleanup failures.
  }
}

function hydrateServices(storedServices) {
  if (!Array.isArray(storedServices) || storedServices.length === 0) {
    return INITIAL_SERVICES.map((service) => ({ ...service }));
  }

  const defaultIds = new Set(INITIAL_SERVICES.map((service) => service.id));
  const savedById = new Map(
    storedServices
      .filter((service) => service && typeof service === "object" && typeof service.id === "string")
      .map((service) => [service.id, service])
  );

  const mergedDefaults = INITIAL_SERVICES.map((service) => (
    savedById.has(service.id) ? { ...service, ...savedById.get(service.id) } : { ...service }
  ));

  const customServices = storedServices.filter((service) => (
    service &&
    typeof service === "object" &&
    typeof service.id === "string" &&
    !defaultIds.has(service.id)
  ));

  return [...mergedDefaults, ...customServices];
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
  const storedTab = readStoredJSON(STORAGE_KEYS.activeTab, "desk");
  return TAB_CONFIG.some((item) => item.id === storedTab) ? storedTab : "desk";
}

function getStoredSidePanelExpanded() {
  const storedValue = readStoredJSON(STORAGE_KEYS.sidePanelExpanded, false);
  return typeof storedValue === "boolean" ? storedValue : false;
}

function getStoredTicketDraft() {
  const draft = readStoredJSON(STORAGE_KEYS.ticketDraft, null);
  return draft && typeof draft === "object" ? draft : {};
}

function getStoredQuickLinks() {
  const stored = readStoredJSON(STORAGE_KEYS.quickLinks, []);
  if (!Array.isArray(stored)) return [];
  return stored
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const name = String(item.name || "").trim();
      const url = normalizeExternalUrl(item.url);
      if (!name || !url) return null;
      return {
        id: String(item.id || `custom_${Date.now()}_${Math.floor(Math.random() * 1000)}`),
        name,
        description: String(item.description || "Custom quick access link"),
        url,
        isDefault: false,
      };
    })
    .filter(Boolean);
}

//  Tab Button
function TabBtn({ label, description, active, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      style={{
      padding: "16px 18px",
      border: active ? "1px solid rgba(20,184,166,0.34)" : "1px solid rgba(148,163,184,0.18)",
      background: active
        ? "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(240,253,250,0.92) 100%)"
        : "rgba(255,255,255,0.62)",
      color: "#0F172A",
      fontFamily: APP_FONT_STACK,
      fontWeight: 600,
      cursor: "pointer",
      transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease",
      display: "grid",
      gap: 6,
      textAlign: "left",
      borderRadius: 18,
      minWidth: 210,
      flex: "1 1 220px",
      boxShadow: active ? "0 18px 36px rgba(15,23,42,0.10)" : "0 10px 20px rgba(15,23,42,0.04)",
    }}
    >
      <span style={{ fontSize: 15, letterSpacing: -0.2 }}>{label}</span>
      <span style={{ fontSize: 12, lineHeight: 1.45, color: active ? "#0F766E" : "#64748B", fontWeight: 500 }}>
        {description}
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
        borderRadius: 16,
        border: active ? "1px solid rgba(20,184,166,0.30)" : "1px solid transparent",
        background: active
          ? "linear-gradient(180deg, rgba(240,253,250,0.98) 0%, rgba(236,253,245,0.94) 100%)"
          : "transparent",
        color: active ? "#0F766E" : "#334155",
        cursor: "pointer",
        transition: "all 0.18s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          display: "grid",
          placeItems: "center",
          background: active ? "rgba(20,184,166,0.16)" : "rgba(15,23,42,0.05)",
          color: active ? "#0F766E" : "#475569",
          fontSize: 12,
          fontWeight: 800,
          flexShrink: 0,
        }}>
          {item.shortLabel}
        </div>
        {expanded && (
          <div style={{ minWidth: 0, textAlign: "left" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: active ? "#0F766E" : "#0F172A" }}>
              {item.label}
            </div>
            <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.4 }}>
              {item.description}
            </div>
          </div>
        )}
      </div>
      {expanded && !!badge && (
        <div style={{
          borderRadius: 999,
          padding: "5px 8px",
          background: active ? "rgba(20,184,166,0.12)" : "rgba(15,23,42,0.05)",
          color: active ? "#0F766E" : "#475569",
          fontSize: 11,
          fontWeight: 700,
          flexShrink: 0,
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
  const [addingCustom, setAddingCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customCat, setCustomCat] = useState("Typing & Print");
  const [customPrice, setCustomPrice] = useState("");
  const [customUnit, setCustomUnit] = useState("per service");

  const updatePrice = (id, val) => {
    setServices((prev) => prev.map((s) => s.id === id ? { ...s, price: Number(val) || 0 } : s));
  };

  const addCustom = () => {
    if (!customName.trim()) return;
    const newId = "custom_" + Date.now();
    setServices((prev) => [...prev, {
      id: newId, name: customName.trim(), category: customCat,
      price: Number(customPrice) || 0, unit: customUnit, variable: false,
    }]);
    setCustomName(""); setCustomPrice(""); setAddingCustom(false);
  };

  const unpriced = services.filter((s) => s.price === 0).length;

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      {unpriced > 0 && (
        <div style={{
          background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 12,
          padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12,
          fontSize: 14, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", color: "#991B1B",
          boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
        }}>
          <span style={{ fontSize: 20 }}>!</span>
          <span><strong>{unpriced} services</strong> have a Rs. 0 rate. Tap any price to update your backend pricing.</span>
        </div>
      )}

      {CATEGORIES.map((cat) => {
        const catServices = services.filter((s) => s.category === cat);
        if (catServices.length === 0) return null;
        const color = CAT_COLORS[cat];
        return (
          <div key={cat} style={{ marginBottom: 20, borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: "1px solid rgba(15,23,42,0.12)" }}>
            <div style={{
              background: color, color: "white", padding: "12px 18px",
              fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif",
              fontWeight: 600, fontSize: 14, letterSpacing: 0.5, textTransform: "uppercase"
            }}>
              {cat}
            </div>
            <div style={{ background: "rgba(255,255,255,0.74)" }}>
              {catServices.map((s, i) => (
                <div key={s.id} style={{
                  display: "flex", alignItems: "center", padding: "12px 18px",
                  borderBottom: i < catServices.length - 1 ? "1px solid #F1F5F9" : "none",
                  gap: 12, transition: "background 0.2s",
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.72)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.74)'}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "#0F172A", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif" }}>
                      {s.name}
                    </div>
                    <div style={{ fontSize: 12, color: "#475569", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", marginTop: 2 }}>
                      {s.unit} {s.variable && <span style={{ color: "#F59E0B", fontWeight: 600 }}> variable</span>}
                    </div>
                  </div>
                  {editingId === s.id ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: "#14B8A6" }}>Rs.</span>
                      <input
                        autoFocus
                        type="number"
                        defaultValue={s.price || ""}
                        placeholder="0"
                        onBlur={(e) => { updatePrice(s.id, e.target.value); setEditingId(null); }}
                        onKeyDown={(e) => { if (e.key === "Enter") { updatePrice(s.id, e.target.value); setEditingId(null); } }}
                        style={{
                          width: 80, padding: "8px 10px", border: "2px solid #14B8A6",
                          borderRadius: 8, fontSize: 14, fontWeight: 600,
                          fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", outline: "none",
                          textAlign: "right",
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      onClick={() => setEditingId(s.id)}
                      style={{
                        cursor: "pointer", padding: "6px 14px",
                        borderRadius: 8, fontSize: 14, fontWeight: 600,
                        fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif",
                        color: s.price > 0 ? "#14B8A6" : "#64748B",
                        background: s.price > 0 ? "rgba(20, 184, 166, 0.16)" : "rgba(255,255,255,0.72)",
                        border: s.price > 0 ? "1px solid rgba(45, 212, 191, 0.5)" : "1px dashed #CBD5E1",
                        minWidth: 80, textAlign: "right",
                        transition: "all 0.2s",
                      }}
                    >
                      {s.price > 0 ? `Rs. ${s.price}` : "Rs. ---"}
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
          width: "100%", padding: "14px", border: "2px dashed rgba(255,255,255,0.25)",
          borderRadius: 12, background: "rgba(255,255,255,0.74)", cursor: "pointer",
          fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", fontSize: 14, color: "#64748B",
          fontWeight: 600, transition: "all 0.2s",
        }}>
          + Add New Service
        </button>
      ) : (
        <div style={{
          border: "2px solid #14B8A6", borderRadius: 12, padding: 20,
          background: "rgba(255,255,255,0.74)", boxShadow: "0 4px 12px rgba(20, 184, 166, 0.14)"
        }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            <input placeholder="Service name" value={customName} onChange={(e) => setCustomName(e.target.value)}
              style={{ flex: 2, minWidth: 160, padding: "10px 14px", border: "1px solid rgba(15,23,42,0.12)", borderRadius: 8, fontSize: 14, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", outline: "none" }} />
            <div style={{ display: "flex", alignItems: "center", border: "1px solid rgba(15,23,42,0.12)", borderRadius: 8, background: "rgba(255,255,255,0.72)", paddingRight: 10 }}>
              <span style={{ paddingLeft: 12, color: "#64748B", fontWeight: 600 }}>Rs.</span>
              <input placeholder="Price" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} type="number"
                style={{ width: 80, padding: "10px", border: "none", background: "transparent", fontSize: 14, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", outline: "none", textAlign: "right" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <select value={customCat} onChange={(e) => setCustomCat(e.target.value)}
              style={{ flex: 1, padding: "10px 14px", border: "1px solid rgba(15,23,42,0.12)", borderRadius: 8, fontSize: 14, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", outline: "none", background: "rgba(255,255,255,0.74)" }}>
              {CATEGORIES.map((c) => <option key={c} value={c} style={MENU_OPTION_STYLE}>{c}</option>)}
            </select>
            <input placeholder="Unit (e.g. per page)" value={customUnit} onChange={(e) => setCustomUnit(e.target.value)}
              style={{ flex: 1, padding: "10px 14px", border: "1px solid rgba(15,23,42,0.12)", borderRadius: 8, fontSize: 14, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif", outline: "none" }} />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button onClick={addCustom} style={{ flex: 1, padding: "12px", background: "#14B8A6", color: "white", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif" }}>
              Save Service
            </button>
            <button onClick={() => setAddingCustom(false)} style={{ padding: "12px 20px", background: "rgba(255,255,255,0.82)", color: "#64748B", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif" }}>
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

function TicketWorkspace({ services, onSaveTicket }) {
  const [draftSeed] = useState(() => getStoredTicketDraft());
  const [step, setStep] = useState(() => Number(draftSeed.step) === 2 ? 2 : 1);
  const [referenceType, setReferenceType] = useState(() => (
    typeof draftSeed.referenceType === "string" ? draftSeed.referenceType : "guardian"
  ));
  const [customerName, setCustomerName] = useState(() => draftSeed.customerName || "");
  const [customerPhone, setCustomerPhone] = useState(() => draftSeed.customerPhone || "");
  const [referenceName, setReferenceName] = useState(() => draftSeed.referenceName || "");
  const [providedDocIds, setProvidedDocIds] = useState(() => (
    Array.isArray(draftSeed.providedDocIds) ? draftSeed.providedDocIds : []
  ));
  const [operator, setOperator] = useState(() => (
    typeof draftSeed.operator === "string" ? draftSeed.operator : OPERATORS[0]
  ));
  const [selectedService, setSelectedService] = useState(() => draftSeed.selectedService || "");
  const [qty, setQty] = useState(() => draftSeed.qty || 1);
  const [customAmt, setCustomAmt] = useState(() => draftSeed.customAmt || "");
  const [paymentCash, setPaymentCash] = useState(() => draftSeed.paymentCash || "");
  const [paymentUpi, setPaymentUpi] = useState(() => draftSeed.paymentUpi || "");
  const [portalDown, setPortalDown] = useState(() => Boolean(draftSeed.portalDown));
  const [portalDownNote, setPortalDownNote] = useState(() => draftSeed.portalDownNote || "");
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
  const [saved, setSaved] = useState(null);
  const [error, setError] = useState("");

  const referenceConfig = getReferenceTypeConfig(referenceType);

  const total = items.reduce((sum, it) => sum + it.amount, 0);
  const cashCollected = Math.max(0, Number(paymentCash) || 0);
  const upiCollected = Math.max(0, Number(paymentUpi) || 0);
  const paidTotal = cashCollected + upiCollected;
  const pendingBalance = Math.max(total - paidTotal, 0);
  const isOverpaid = paidTotal > total;
  const requiredDocsCount = documents.filter((doc) => doc.required).length;
  const submittedRequiredDocsCount = documents.filter((doc) => doc.required && doc.submitted).length;
  const sanitizePhone = (value) => value.replace(/\D/g, "").slice(0, 10);
  const canSaveTicket = items.length > 0 && !isOverpaid;
  const surfaceCardStyle = {
    background: "rgba(255,255,255,0.82)",
    borderRadius: 24,
    border: "1px solid rgba(148,163,184,0.18)",
    padding: 22,
    boxShadow: "0 18px 36px rgba(15,23,42,0.06)",
  };
  const softPanelStyle = {
    background: "rgba(248,250,252,0.82)",
    borderRadius: 20,
    border: "1px solid rgba(148,163,184,0.16)",
    padding: 18,
  };
  const sectionEyebrowStyle = {
    fontSize: 11,
    color: "#64748B",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1.1,
    marginBottom: 10,
  };
  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid rgba(148,163,184,0.22)",
    borderRadius: 14,
    background: "#FFFFFF",
    color: "#0F172A",
    outline: "none",
    boxShadow: "inset 0 1px 2px rgba(15,23,42,0.04)",
  };
  const primaryButtonStyle = {
    border: "none",
    borderRadius: 14,
    padding: "13px 18px",
    background: "linear-gradient(135deg, #14B8A6 0%, #0F766E 100%)",
    color: "#FFFFFF",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 16px 28px rgba(20,184,166,0.22)",
  };
  const secondaryButtonStyle = {
    border: "1px solid rgba(148,163,184,0.24)",
    borderRadius: 14,
    padding: "13px 18px",
    background: "rgba(255,255,255,0.96)",
    color: "#0F172A",
    fontWeight: 700,
    cursor: "pointer",
  };
  const smallBadgeStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    padding: "7px 12px",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  };
  const workspaceMetrics = [
    {
      label: "Current step",
      value: step === 1 ? "Intake" : "Ticket",
      helper: step === 1 ? "Capture holder and reference" : "Build tasks and payment",
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

  useEffect(() => {
    if (saved) {
      removeStoredValue(STORAGE_KEYS.ticketDraft);
      return;
    }

    writeStoredJSON(STORAGE_KEYS.ticketDraft, {
      step,
      referenceType,
      customerName,
      customerPhone,
      referenceName,
      providedDocIds,
      operator,
      selectedService,
      qty,
      customAmt,
      paymentCash,
      paymentUpi,
      portalDown,
      portalDownNote,
      docName,
      docRequired,
      documents,
      items,
      ticketMeta,
    });
  }, [
    step,
    referenceType,
    customerName,
    customerPhone,
    referenceName,
    providedDocIds,
    operator,
    selectedService,
    qty,
    customAmt,
    paymentCash,
    paymentUpi,
    portalDown,
    portalDownNote,
    docName,
    docRequired,
    documents,
    items,
    ticketMeta,
    saved,
  ]);

  const toggleProvidedDoc = (docId) => {
    setProvidedDocIds((prev) => (
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    ));
  };

  const createTicket = () => {
    const trimmedName = customerName.trim();
    const phoneDigits = sanitizePhone(customerPhone);
    const trimmedReferenceName = referenceName.trim();

    if (!trimmedName) {
      setError("Document holder name is required.");
      return;
    }

    if (!trimmedReferenceName) {
      setError("Reference person name is required.");
      return;
    }

    if (phoneDigits && !PHONE_REGEX.test(phoneDigits)) {
      setError("Contact number must be exactly 10 digits.");
      return;
    }

    setTicketMeta({
      ticketNo: generateBillNo(),
      date: todayStr(),
      time: timeStr(),
      referenceType,
      referenceTypeLabel: referenceConfig.label,
      referenceName: trimmedReferenceName,
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
    setStep(2);
    setError("");
  };

  const addTask = () => {
    if (!selectedService) return;
    const svc = services.find((s) => s.id === selectedService);
    if (!svc) return;
    const qtyNum = Math.max(1, Number(qty) || 1);
    const unitPrice = svc.variable ? Number(customAmt) || 0 : svc.price;
    setItems((prev) => [...prev, {
      ...svc,
      qty: qtyNum,
      unitPrice,
      amount: unitPrice * qtyNum,
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
    setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
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
    setItems((prev) => prev.filter((_, i) => i !== idx));
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
    if (portalDown && !portalDownNote.trim()) {
      setError("Portal name is required when ticket is marked as portal down.");
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
    const finalStatus = portalDown ? "Open" : status;

    const ticket = withStructuredTicket({
      ...ticketMeta,
      status: finalStatus,
      payMode,
      paymentStatus,
      cashCollected,
      upiCollected,
      paidTotal,
      pendingBalance,
      operator,
      items: [...items],
      documents: [...documents],
      portalDown: Boolean(portalDown),
      portalDownNote: portalDown ? portalDownNote.trim() : "",
      total,
      updatedAt: `${todayStr()} ${timeStr()}`,
    });
    onSaveTicket(ticket);
    setSaved(ticket);
    setError("");
  };

  const resetTicket = () => {
    removeStoredValue(STORAGE_KEYS.ticketDraft);
    setStep(1);
    setReferenceType("guardian");
    setCustomerName("");
    setCustomerPhone("");
    setReferenceName("");
    setProvidedDocIds([]);
    setOperator(OPERATORS[0]);
    setSelectedService("");
    setQty(1);
    setCustomAmt("");
    setPaymentCash("");
    setPaymentUpi("");
    setPortalDown(false);
    setPortalDownNote("");
    setDocName("");
    setDocRequired(true);
    setDocuments([]);
    setItems([]);
    setTicketMeta(null);
    setSaved(null);
    setError("");
  };

  if (saved) {
    return (
      <div style={{ animation: "fadeIn 0.3s ease-out" }}>
        <div id="receipt" style={{ background: "rgba(255,255,255,0.82)", border: "1px solid rgba(15,23,42,0.14)", borderRadius: 22, padding: "26px 22px", maxWidth: 420, margin: "0 auto", color: "#0F172A" }}>
          <div style={{ fontSize: 18, fontWeight: 800, textAlign: "center", marginBottom: 10 }}>CSC TICKET SLIP</div>
          <div style={{ fontSize: 12, textAlign: "center", color: saved.status === "Open" ? "#F59E0B" : "#10B981", fontWeight: 700, marginBottom: 14 }}>
            STATUS: {saved.status.toUpperCase()}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: "#475569" }}>Document Holder</div>
              <div style={{ fontWeight: 700 }}>{saved.customerName}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: "#475569" }}>Ticket</div>
              <div style={{ fontWeight: 700 }}>{saved.ticketNo}</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: "#475569", marginBottom: 6 }}>
            Reference: {saved.referenceName || "N/A"} ({saved.referenceTypeLabel || "N/A"})
          </div>
          {!!saved.customerPhone && (
            <div style={{ fontSize: 12, color: "#475569", marginBottom: 12 }}>Contact: {saved.customerPhone}</div>
          )}
          <div style={{ borderTop: "1px dashed rgba(255,255,255,0.3)", borderBottom: "1px dashed rgba(255,255,255,0.3)", padding: "10px 0" }}>
            {saved.items.map((it, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 13 }}>
                <span>{it.name}</span>
                <span>x{it.qty}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span>Operator: {saved.operator}</span>
            <span>Pay: {saved.payMode}</span>
          </div>
          <div style={{ marginTop: 6, fontSize: 12, color: "#475569" }}>
            Payment: {saved.paymentStatus || "Unpaid"} | Paid Rs. {saved.paidTotal || 0} | Pending Rs. {saved.pendingBalance || 0}
          </div>
          {saved.portalDown && (
            <div style={{ marginTop: 6, fontSize: 12, color: "#B45309", fontWeight: 700 }}>
              Portal Down: {saved.portalDownNote || "Submission pending"}
            </div>
          )}
          <div style={{ marginTop: 6, fontSize: 12, color: "#475569" }}>
            Docs: {saved.documents?.filter((doc) => doc.required && doc.submitted).length || 0}/{saved.documents?.filter((doc) => doc.required).length || 0} required submitted
          </div>
          {!!saved.documents?.filter((doc) => doc.submitted).length && (
            <div style={{ marginTop: 6, fontSize: 11, color: "#64748B" }}>
              Provided docs: {saved.documents.filter((doc) => doc.submitted).map((doc) => doc.name).join(", ")}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 18 }}>
          <button onClick={() => printTicketSlip(saved)} style={{ padding: "11px 18px", borderRadius: 8, border: "1px solid #14B8A6", background: "rgba(255,255,255,0.74)", color: "#14B8A6", cursor: "pointer", fontWeight: 700 }}>Print Ticket</button>
          <button onClick={resetTicket} style={{ padding: "11px 18px", borderRadius: 8, border: "none", background: "#14B8A6", color: "white", cursor: "pointer", fontWeight: 700 }}>+ New Ticket</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      {!saved && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 18 }}>
          {workspaceMetrics.map((metric) => (
            <div key={metric.label} style={{ ...surfaceCardStyle, padding: 18, minHeight: 112 }}>
              <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.9, marginBottom: 10 }}>
                {metric.label}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.8, color: "#0F172A", marginBottom: 8 }}>
                {metric.value}
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.5, color: "#475569" }}>
                {metric.helper}
              </div>
            </div>
          ))}
        </div>
      )}

      {step === 1 && (
        <div style={{ ...surfaceCardStyle, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
            <div>
              <div style={sectionEyebrowStyle}>Step 1</div>
              <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -1.1, color: "#0F172A", marginBottom: 8 }}>
                Intake Details
              </div>
              <div style={{ maxWidth: 620, fontSize: 14, lineHeight: 1.65, color: "#475569" }}>
                Capture the document holder, the reference person, the operator, and the intake documents once.
                This creates the base record for the rest of the ticket.
              </div>
            </div>
            <div style={{ ...smallBadgeStyle, background: "rgba(20,184,166,0.12)", border: "1px solid rgba(20,184,166,0.24)", color: "#0F766E" }}>
              Draft autosaves locally
            </div>
          </div>

          <div style={{ ...softPanelStyle, marginBottom: 16 }}>
            <div style={sectionEyebrowStyle}>Reference Type</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
              {REFERENCE_TYPES.map((role) => {
                const cfg = getReferenceTypeConfig(role.id);
                const active = referenceType === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => {
                      setReferenceType(role.id);
                      setError("");
                    }}
                    style={{
                      textAlign: "left",
                      padding: "14px 14px 13px",
                      borderRadius: 16,
                      border: active ? "1px solid rgba(20,184,166,0.45)" : "1px solid rgba(148,163,184,0.20)",
                      background: active ? "linear-gradient(180deg, rgba(240,253,250,0.96) 0%, rgba(236,253,245,0.92) 100%)" : "#FFFFFF",
                      color: active ? "#0F766E" : "#1E293B",
                      cursor: "pointer",
                      fontWeight: 700,
                      transition: "all 0.2s ease",
                      boxShadow: active ? "0 14px 26px rgba(20,184,166,0.14)" : "0 8px 18px rgba(15,23,42,0.04)",
                    }}
                  >
                    <div>{cfg.label}</div>
                    <div style={{ fontSize: 11, color: active ? "#0F766E" : "#64748B", marginTop: 6, fontWeight: 500, lineHeight: 1.45 }}>
                      {cfg.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ ...softPanelStyle, marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
              <label style={{ display: "grid", gap: 8 }}>
                <span style={sectionEyebrowStyle}>Document Holder Name</span>
                <input
                  placeholder="Harsh Kumar"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={inputStyle}
                />
              </label>
              <label style={{ display: "grid", gap: 8 }}>
                <span style={sectionEyebrowStyle}>Contact Number</span>
                <input
                  type="tel"
                  placeholder="Optional, 10 digits"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(sanitizePhone(e.target.value))}
                  style={inputStyle}
                />
              </label>
              <label style={{ display: "grid", gap: 8 }}>
                <span style={sectionEyebrowStyle}>Reference Person</span>
                <input
                  placeholder="Riya Sharma"
                  value={referenceName}
                  onChange={(e) => setReferenceName(e.target.value)}
                  style={inputStyle}
                />
              </label>
            </div>
          </div>

          <div style={{ ...softPanelStyle, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
              <div>
                <div style={sectionEyebrowStyle}>Documents Received At Intake</div>
                <div style={{ fontSize: 13, color: "#475569" }}>
                  Select what the customer handed over right now. These will prefill the ticket checklist.
                </div>
              </div>
              <div style={{ ...smallBadgeStyle, background: "rgba(15,23,42,0.05)", border: "1px solid rgba(148,163,184,0.18)", color: "#334155" }}>
                {providedDocIds.length} selected
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
              {DOCUMENT_PRESETS.map((doc) => {
                const checked = providedDocIds.includes(doc.id);
                return (
                  <label key={`intake_${doc.id}`} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    padding: "11px 12px",
                    borderRadius: 14,
                    border: checked ? "1px solid rgba(20,184,166,0.40)" : "1px solid rgba(148,163,184,0.18)",
                    background: checked ? "rgba(236,253,245,0.96)" : "#FFFFFF",
                    color: checked ? "#0F766E" : "#1E293B",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                    boxShadow: checked ? "0 12px 22px rgba(20,184,166,0.12)" : "0 8px 18px rgba(15,23,42,0.03)",
                  }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleProvidedDoc(doc.id)}
                    />
                    {doc.label}
                  </label>
                );
              })}
            </div>
          </div>

          <div style={{ ...softPanelStyle, marginBottom: 14 }}>
            <div style={sectionEyebrowStyle}>Operator</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {OPERATORS.map((op) => (
                <button
                  key={op}
                  onClick={() => setOperator(op)}
                  style={{
                    padding: "11px 16px",
                    borderRadius: 14,
                    border: operator === op ? "1px solid rgba(20,184,166,0.36)" : "1px solid rgba(148,163,184,0.20)",
                    background: operator === op ? "rgba(236,253,245,0.96)" : "#FFFFFF",
                    color: operator === op ? "#0F766E" : "#334155",
                    cursor: "pointer",
                    fontWeight: 700,
                    boxShadow: operator === op ? "0 12px 22px rgba(20,184,166,0.12)" : "0 8px 18px rgba(15,23,42,0.03)",
                  }}
                >
                  {op}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ marginTop: 8, marginBottom: 12, padding: "12px 14px", borderRadius: 14, background: "rgba(254,242,242,0.96)", border: "1px solid rgba(248,113,113,0.28)", color: "#B91C1C", fontSize: 13, fontWeight: 600 }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.55 }}>
              Next step opens service tasks, document tracking, payment collection, and save actions.
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={resetTicket} style={secondaryButtonStyle}>
                Clear Draft
              </button>
              <button onClick={createTicket} style={primaryButtonStyle}>
                Continue To Ticket Tasks
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <>
          <div style={{ ...surfaceCardStyle, marginBottom: 16, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
              <div>
                <div style={sectionEyebrowStyle}>Step 2</div>
                <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, color: "#0F172A", marginBottom: 8 }}>
                  Build Ticket
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.6, color: "#475569" }}>
                  Add services, confirm documents, collect payment, and save the ticket when it is ready.
                </div>
              </div>
              <div style={{ display: "grid", gap: 8, minWidth: 280 }}>
                <div style={{ ...smallBadgeStyle, background: "rgba(15,23,42,0.05)", border: "1px solid rgba(148,163,184,0.18)", color: "#334155" }}>
                  Ticket {ticketMeta?.ticketNo}
                </div>
                <div style={{ fontSize: 14, color: "#0F172A", fontWeight: 700 }}>
                  {ticketMeta?.customerName}
                </div>
                <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
                  Ref: {ticketMeta?.referenceName} ({ticketMeta?.referenceTypeLabel})
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 2 }}>
                  <button onClick={() => setStep(1)} style={secondaryButtonStyle}>
                    Edit Intake
                  </button>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div style={{ marginBottom: 12, padding: "12px 14px", borderRadius: 14, background: "rgba(254,242,242,0.96)", border: "1px solid rgba(248,113,113,0.28)", color: "#B91C1C", fontSize: 13, fontWeight: 600 }}>
              {error}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, alignItems: "start" }}>
            <div style={{ display: "grid", gap: 16 }}>
              <div style={surfaceCardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
                  <div>
                    <div style={sectionEyebrowStyle}>Services</div>
                    <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.8, color: "#0F172A", marginBottom: 6 }}>
                      Add Billable Work
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.6, color: "#475569" }}>
                      Pick a service, adjust quantity, and add it to the ticket draft.
                    </div>
                  </div>
                  {selectedService && (
                    <div style={{ ...smallBadgeStyle, background: "rgba(15,23,42,0.05)", border: "1px solid rgba(148,163,184,0.18)", color: "#334155" }}>
                      {services.find((s) => s.id === selectedService)?.variable ? "Variable amount" : `Rate Rs. ${services.find((s) => s.id === selectedService)?.price || 0}`}
                    </div>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, alignItems: "end" }}>
                  <label style={{ display: "grid", gap: 8 }}>
                    <span style={sectionEyebrowStyle}>Select Service</span>
                    <select value={selectedService} onChange={(e) => { setSelectedService(e.target.value); setCustomAmt(""); }} style={inputStyle}>
                      <option value="" style={MENU_OPTION_STYLE}>Select service...</option>
                      {CATEGORIES.map((cat) => (
                        <optgroup key={cat} label={cat} style={MENU_OPTGROUP_STYLE}>
                          {services.filter((s) => s.category === cat).map((s) => (
                            <option key={s.id} value={s.id} style={MENU_OPTION_STYLE}>{s.name}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </label>
                  <label style={{ display: "grid", gap: 8 }}>
                    <span style={sectionEyebrowStyle}>Qty</span>
                    <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} style={{ ...inputStyle, textAlign: "center" }} />
                  </label>
                  {selectedService && services.find((s) => s.id === selectedService)?.variable ? (
                    <label style={{ display: "grid", gap: 8 }}>
                      <span style={sectionEyebrowStyle}>Custom Amount</span>
                      <input type="number" value={customAmt} onChange={(e) => setCustomAmt(e.target.value)} placeholder="Rs." style={inputStyle} />
                    </label>
                  ) : (
                    <div />
                  )}
                  <button onClick={addTask} style={{ ...primaryButtonStyle, minWidth: 140 }}>
                    Add Service
                  </button>
                </div>
              </div>

              <div style={surfaceCardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
                  <div>
                    <div style={sectionEyebrowStyle}>Draft Items</div>
                    <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.8, color: "#0F172A" }}>
                      Current Service List
                    </div>
                  </div>
                  <div style={{ ...smallBadgeStyle, background: "rgba(20,184,166,0.12)", border: "1px solid rgba(20,184,166,0.24)", color: "#0F766E" }}>
                    Total Rs. {total}
                  </div>
                </div>

                {items.length === 0 ? (
                  <div style={{ ...softPanelStyle, textAlign: "center", color: "#475569" }}>
                    Add the first service to unlock payment and save actions.
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 10 }}>
                    {items.map((it, i) => (
                      <div key={i} style={{ ...softPanelStyle, padding: 14, display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto auto", gap: 12, alignItems: "center" }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>{it.name}</div>
                          <div style={{ fontSize: 12, color: "#475569" }}>Qty {it.qty} | Unit Rs. {it.unitPrice}</div>
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#0F766E" }}>Rs. {it.amount}</div>
                        <button onClick={() => removeTask(i)} style={{ width: 32, height: 32, border: "none", borderRadius: 10, background: "#FEF2F2", color: "#DC2626", cursor: "pointer", fontWeight: 800 }}>
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "grid", gap: 16 }}>
              <div style={surfaceCardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
                  <div>
                    <div style={sectionEyebrowStyle}>Documents</div>
                    <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.8, color: "#0F172A" }}>
                      Checklist Control
                    </div>
                  </div>
                  <div style={{ ...smallBadgeStyle, background: "rgba(15,23,42,0.05)", border: "1px solid rgba(148,163,184,0.18)", color: "#334155" }}>
                    {submittedRequiredDocsCount}/{requiredDocsCount} required submitted
                  </div>
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  <label style={{ display: "grid", gap: 8 }}>
                    <span style={sectionEyebrowStyle}>Add Document</span>
                    <input
                      value={docName}
                      onChange={(e) => setDocName(e.target.value)}
                      placeholder="e.g. Aadhaar copy"
                      style={inputStyle}
                    />
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, color: "#334155", fontSize: 13, fontWeight: 600 }}>
                    <input type="checkbox" checked={docRequired} onChange={(e) => setDocRequired(e.target.checked)} />
                    Mark as required
                  </label>
                  <button onClick={addDocument} style={secondaryButtonStyle}>
                    Add Doc
                  </button>
                </div>

                <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                  {documents.length === 0 ? (
                    <div style={{ ...softPanelStyle, textAlign: "center", color: "#475569" }}>
                      No documents tracked yet.
                    </div>
                  ) : (
                    documents.map((doc) => (
                      <div key={doc.id} style={{ ...softPanelStyle, padding: 14, display: "grid", gap: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                          <div style={{ fontSize: 14, color: "#0F172A", fontWeight: 700 }}>
                            {doc.name}
                            {doc.source === "intake" && (
                              <span style={{ marginLeft: 8, ...smallBadgeStyle, padding: "4px 8px", fontSize: 10, background: "rgba(20,184,166,0.12)", border: "1px solid rgba(20,184,166,0.22)", color: "#0F766E" }}>
                                Intake
                              </span>
                            )}
                          </div>
                          <button onClick={() => removeDocument(doc.id)} style={{ width: 30, height: 30, border: "none", borderRadius: 10, background: "#FEF2F2", color: "#DC2626", cursor: "pointer", fontWeight: 800 }}>
                            x
                          </button>
                        </div>
                        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                          <label style={{ display: "flex", alignItems: "center", gap: 6, color: "#475569", fontSize: 12 }}>
                            <input type="checkbox" checked={doc.required} onChange={() => toggleDocumentRequired(doc.id)} />
                            Required
                          </label>
                          <label style={{ display: "flex", alignItems: "center", gap: 6, color: "#475569", fontSize: 12 }}>
                            <input type="checkbox" checked={doc.submitted} onChange={() => toggleDocumentSubmitted(doc.id)} />
                            Submitted
                          </label>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div style={surfaceCardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
                  <div>
                    <div style={sectionEyebrowStyle}>Payment</div>
                    <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.8, color: "#0F172A" }}>
                      Payment And Save
                    </div>
                  </div>
                  <div style={{ ...smallBadgeStyle, background: pendingBalance > 0 ? "rgba(254,243,199,0.96)" : "rgba(236,253,245,0.96)", border: pendingBalance > 0 ? "1px solid rgba(245,158,11,0.24)" : "1px solid rgba(20,184,166,0.22)", color: pendingBalance > 0 ? "#B45309" : "#0F766E" }}>
                    Pending Rs. {pendingBalance}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <label style={{ display: "grid", gap: 8 }}>
                    <span style={sectionEyebrowStyle}>Cash Collected</span>
                    <input type="number" min="0" value={paymentCash} onChange={(e) => setPaymentCash(e.target.value)} placeholder="Rs. 0" style={inputStyle} />
                  </label>
                  <label style={{ display: "grid", gap: 8 }}>
                    <span style={sectionEyebrowStyle}>UPI Collected</span>
                    <input type="number" min="0" value={paymentUpi} onChange={(e) => setPaymentUpi(e.target.value)} placeholder="Rs. 0" style={inputStyle} />
                  </label>
                </div>

                <div style={{ ...softPanelStyle, marginBottom: 12, padding: 14 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, color: "#0F172A", fontSize: 13, fontWeight: 700, marginBottom: portalDown ? 10 : 0 }}>
                    <input
                      type="checkbox"
                      checked={portalDown}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setPortalDown(checked);
                        if (!checked) setPortalDownNote("");
                      }}
                    />
                    Mark as portal down - submission pending
                  </label>
                  {portalDown && (
                    <label style={{ display: "grid", gap: 8 }}>
                      <span style={sectionEyebrowStyle}>Which portal is down?</span>
                      <input
                        value={portalDownNote}
                        onChange={(e) => setPortalDownNote(e.target.value)}
                        placeholder="e.g. e-Saathi"
                        style={inputStyle}
                      />
                    </label>
                  )}
                </div>

                <div style={{ ...softPanelStyle, marginBottom: 14 }}>
                  <div style={{ display: "grid", gap: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#475569" }}>
                      <span>Collected</span>
                      <span style={{ color: "#0F172A", fontWeight: 700 }}>Rs. {paidTotal}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#475569" }}>
                      <span>Required submitted</span>
                      <span style={{ color: "#0F172A", fontWeight: 700 }}>{submittedRequiredDocsCount}/{requiredDocsCount}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, color: "#0F172A", fontWeight: 800 }}>
                      <span>Grand Total</span>
                      <span>Rs. {total}</span>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 14, padding: "12px 14px", borderRadius: 14, background: isOverpaid ? "rgba(254,242,242,0.96)" : pendingBalance > 0 ? "rgba(255,251,235,0.96)" : "rgba(236,253,245,0.96)", border: isOverpaid ? "1px solid rgba(248,113,113,0.24)" : pendingBalance > 0 ? "1px solid rgba(245,158,11,0.22)" : "1px solid rgba(20,184,166,0.22)", color: isOverpaid ? "#B91C1C" : pendingBalance > 0 ? "#B45309" : "#0F766E", fontSize: 13, lineHeight: 1.5, fontWeight: 600 }}>
                  {isOverpaid
                    ? "Collected amount is greater than the ticket total. Reduce the payment before saving."
                    : portalDown
                      ? "Portal is marked down. Ticket will always save as Open until portal-down is unchecked."
                    : pendingBalance > 0
                      ? "Partial payment is okay. You can save the ticket and keep the remaining balance pending."
                      : "Payment is fully collected. This ticket is ready to complete."}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <button
                    onClick={() => saveTicket("Open")}
                    disabled={!canSaveTicket}
                    style={{
                      ...secondaryButtonStyle,
                      background: canSaveTicket ? "rgba(254,243,199,0.96)" : "rgba(241,245,249,0.96)",
                      border: canSaveTicket ? "1px solid rgba(245,158,11,0.24)" : "1px solid rgba(148,163,184,0.20)",
                      color: canSaveTicket ? "#B45309" : "#94A3B8",
                      cursor: canSaveTicket ? "pointer" : "not-allowed",
                    }}
                  >
                    Save for Later
                  </button>
                  <button
                    onClick={() => saveTicket("Closed")}
                    disabled={!canSaveTicket}
                    style={{
                      ...primaryButtonStyle,
                      background: canSaveTicket ? "linear-gradient(135deg, #10B981 0%, #047857 100%)" : "linear-gradient(135deg, #CBD5E1 0%, #94A3B8 100%)",
                      boxShadow: canSaveTicket ? "0 16px 28px rgba(16,185,129,0.24)" : "none",
                      cursor: canSaveTicket ? "pointer" : "not-allowed",
                    }}
                  >
                    {portalDown ? "Save (Portal Down)" : "Save and Complete"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function TodaysDesk({ tickets, onOpenTicket }) {
  const normalizedTickets = tickets.map((ticket) => (ticket?.structured ? ticket : withStructuredTicket(ticket)));
  const todayLabel = todayStr();
  const todayTickets = normalizedTickets.filter((ticket) => ticket.date === todayLabel);
  const openTickets = normalizedTickets.filter((ticket) => ticket.status === "Open");
  const pendingWorkTickets = [...openTickets].reverse();
  const portalDownTickets = openTickets.filter((ticket) => ticket.portalDown === true);

  const getPaidTotal = (ticket) => {
    if (Number.isFinite(Number(ticket.paidTotal))) return Math.max(0, Number(ticket.paidTotal));
    const cashCollected = Number(ticket.cashCollected) || 0;
    const upiCollected = Number(ticket.upiCollected) || 0;
    return Math.max(0, cashCollected + upiCollected);
  };

  const getPendingBalance = (ticket) => {
    if (Number.isFinite(Number(ticket.pendingBalance))) return Math.max(0, Number(ticket.pendingBalance));
    const total = Number(ticket.total) || 0;
    return Math.max(0, total - getPaidTotal(ticket));
  };

  const collectedToday = todayTickets.reduce((sum, ticket) => sum + getPaidTotal(ticket), 0);
  const stillToCollect = openTickets.reduce((sum, ticket) => sum + getPendingBalance(ticket), 0);
  const todayOpenCount = todayTickets.filter((ticket) => ticket.status === "Open").length;
  const todayClosedCount = todayTickets.filter((ticket) => ticket.status === "Closed").length;

  const summaryCards = [
    {
      id: "collected",
      label: "Collected Today",
      value: `Rs. ${collectedToday}`,
      note: "Cash + UPI from today's tickets",
      accent: "#0F766E",
      background: "linear-gradient(180deg, rgba(236,253,245,0.96) 0%, rgba(255,255,255,0.96) 100%)",
      border: "1px solid rgba(20,184,166,0.28)",
    },
    {
      id: "pending",
      label: "Still to Collect",
      value: `Rs. ${stillToCollect}`,
      note: "Pending balance across all open tickets",
      accent: "#B45309",
      background: "linear-gradient(180deg, rgba(255,251,235,0.98) 0%, rgba(255,255,255,0.96) 100%)",
      border: "1px solid rgba(245,158,11,0.28)",
    },
    {
      id: "today-open",
      label: "Open Today",
      value: String(todayOpenCount),
      note: `Out of ${todayTickets.length} ticket(s) created today`,
      accent: "#D97706",
      background: "linear-gradient(180deg, rgba(255,247,237,0.98) 0%, rgba(255,255,255,0.96) 100%)",
      border: "1px solid rgba(251,146,60,0.26)",
    },
    {
      id: "today-closed",
      label: "Closed Today",
      value: String(todayClosedCount),
      note: "Tickets completed on today's date",
      accent: "#047857",
      background: "linear-gradient(180deg, rgba(240,253,244,0.98) 0%, rgba(255,255,255,0.96) 100%)",
      border: "1px solid rgba(34,197,94,0.24)",
    },
  ];

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      <div style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.94) 0%, rgba(240,253,250,0.92) 42%, rgba(239,246,255,0.92) 100%)",
        borderRadius: 22,
        border: "1px solid rgba(148,163,184,0.20)",
        boxShadow: "0 22px 40px rgba(15,23,42,0.08)",
        padding: "22px 22px 20px",
        marginBottom: 14,
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.1, textTransform: "uppercase", color: "#0F766E", marginBottom: 8 }}>
          Morning Snapshot
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.8, color: "#0F172A", marginBottom: 8 }}>
          Today's Desk
        </div>
        <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, maxWidth: 780 }}>
          Start here to review pending work, cash collected today, and tickets that need follow-up.
          Select any ticket below to jump directly into Ticket Dashboard.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12, marginBottom: 16 }}>
        {summaryCards.map((card) => (
          <div key={card.id} style={{
            background: card.background,
            borderRadius: 16,
            border: card.border,
            boxShadow: "0 12px 24px rgba(15,23,42,0.06)",
            padding: "14px 14px 12px",
          }}>
            <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", letterSpacing: 1.05, fontWeight: 700, marginBottom: 6 }}>
              {card.label}
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.6, color: card.accent, marginBottom: 5 }}>
              {card.value}
            </div>
            <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.45 }}>
              {card.note}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        marginBottom: 16,
        background: "linear-gradient(180deg, rgba(255,251,235,0.98) 0%, rgba(255,255,255,0.98) 100%)",
        border: "1px solid rgba(245,158,11,0.28)",
        borderRadius: 16,
        padding: 14,
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#92400E", letterSpacing: 0.3, marginBottom: 8 }}>
          Portal Down Queue
        </div>
        {portalDownTickets.length === 0 ? (
          <div style={{ fontSize: 13, color: "#A16207", background: "rgba(255,255,255,0.92)", borderRadius: 12, border: "1px dashed rgba(217,119,6,0.30)", padding: "12px 14px" }}>
            No portal-down tickets right now. This section will auto-populate when tickets are marked as portal down.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {portalDownTickets.map((ticket) => (
              <button
                key={`portal_${ticket.ticketNo}`}
                onClick={() => onOpenTicket(ticket.ticketNo)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  borderRadius: 12,
                  border: "1px solid rgba(217,119,6,0.26)",
                  background: "rgba(255,255,255,0.98)",
                  padding: "10px 12px",
                  color: "#1E293B",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ fontWeight: 700 }}>{ticket.ticketNo} | {ticket.customerName || "Walk-in Customer"}</div>
                  <div style={{ fontWeight: 700, color: "#B45309" }}>Pending Rs. {getPendingBalance(ticket)}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ color: "#0F172A", fontWeight: 700, fontSize: 15, marginBottom: 8 }}>
        Pending Work ({pendingWorkTickets.length})
      </div>
      {pendingWorkTickets.length === 0 ? (
        <div style={{ background: "rgba(255,255,255,0.88)", border: "1px dashed rgba(148,163,184,0.34)", borderRadius: 14, padding: "14px 16px", color: "#475569" }}>
          No open tickets pending right now.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {pendingWorkTickets.map((ticket) => {
            const structured = ticket.structured || toStructuredTicket(ticket);
            const serviceNames = structured.services.map((service) => service.name).filter(Boolean);
            const badgeLabel = ticket.portalDown ? "Portal Down" : "Open";
            const badgeStyle = ticket.portalDown
              ? { color: "#B45309", background: "rgba(254,243,199,0.98)", border: "1px solid rgba(245,158,11,0.28)" }
              : { color: "#D97706", background: "rgba(255,247,237,0.98)", border: "1px solid rgba(251,146,60,0.26)" };

            return (
              <button
                key={ticket.ticketNo}
                onClick={() => onOpenTicket(ticket.ticketNo)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  borderRadius: 16,
                  border: "1px solid rgba(148,163,184,0.24)",
                  background: "rgba(255,255,255,0.92)",
                  boxShadow: "0 12px 24px rgba(15,23,42,0.06)",
                  padding: "14px 14px 12px",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                  <div style={{ color: "#0F172A", fontWeight: 700, fontSize: 15 }}>
                    {ticket.customerName || "Walk-in Customer"}
                  </div>
                  <span style={{
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 0.35,
                    textTransform: "uppercase",
                    padding: "5px 9px",
                    ...badgeStyle,
                  }}>
                    {badgeLabel}
                  </span>
                </div>
                <div style={{ color: "#334155", fontSize: 13, marginBottom: 7, lineHeight: 1.45 }}>
                  {serviceNames.length > 0 ? serviceNames.join(", ") : "No services linked"}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ color: "#64748B", fontSize: 12, fontFamily: APP_MONO_STACK }}>
                    {ticket.ticketNo} | {ticket.date}
                  </div>
                  <div style={{ color: "#B45309", fontWeight: 700, fontSize: 13 }}>
                    Pending Rs. {getPendingBalance(ticket)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TicketDashboard({ tickets, onToggleTicketStatus, onToggleTaskDone, onUpdateTicket, focusTicketNo, onFocusHandled }) {
  const [expandedTickets, setExpandedTickets] = useState({});
  const [viewTicketNo, setViewTicketNo] = useState(null);
  const [customerRecordTicketNo, setCustomerRecordTicketNo] = useState(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [editTicketNo, setEditTicketNo] = useState(null);
  const [editDraft, setEditDraft] = useState({
    customerName: "",
    customerPhone: "",
    referenceName: "",
    referenceType: "guardian",
    operator: OPERATORS[0],
    cashCollected: "",
    upiCollected: "",
    portalDown: false,
    portalDownNote: "",
  });
  const [editError, setEditError] = useState("");
  const [ackDrafts, setAckDrafts] = useState({});
  const [ackSavedFlags, setAckSavedFlags] = useState({});

  const normalizedTickets = tickets.map((t) => (t.structured ? t : withStructuredTicket(t)));
  const normalizePhone = (value) => String(value || "").replace(/\D/g, "").slice(0, 10);
  const normalizeName = (value) => String(value || "").trim();
  const getCustomerIdentity = (ticket) => {
    const phone = normalizePhone(ticket?.customerPhone);
    if (PHONE_REGEX.test(phone)) return { type: "phone", value: phone };
    const name = normalizeName(ticket?.customerName);
    return name ? { type: "name", value: name } : null;
  };
  const ticketMatchesIdentity = (ticket, identity) => {
    if (!identity) return false;
    if (identity.type === "phone") {
      const phone = normalizePhone(ticket?.customerPhone);
      return PHONE_REGEX.test(phone) && phone === identity.value;
    }
    return normalizeName(ticket?.customerName) === identity.value;
  };

  const openTickets = normalizedTickets.filter((t) => t.status === "Open");
  const closedTickets = normalizedTickets.filter((t) => t.status === "Closed");
  const totalTasks = normalizedTickets.reduce((sum, t) => sum + t.items.length, 0);
  const doneTasks = normalizedTickets.reduce((sum, t) => sum + t.items.filter((it) => it.done).length, 0);
  const viewingTicket = normalizedTickets.find((t) => t.ticketNo === viewTicketNo) || null;
  const viewingStructured = viewingTicket ? (viewingTicket.structured || toStructuredTicket(viewingTicket)) : null;
  const editingTicket = normalizedTickets.find((t) => t.ticketNo === editTicketNo) || null;
  const customerRecordAnchorTicket = normalizedTickets.find((t) => t.ticketNo === customerRecordTicketNo) || null;
  const customerIdentity = customerRecordAnchorTicket ? getCustomerIdentity(customerRecordAnchorTicket) : null;
  const customerRecordTickets = customerIdentity
    ? normalizedTickets.filter((ticket) => ticketMatchesIdentity(ticket, customerIdentity))
    : [];
  const customerRecordTicketsSorted = [...customerRecordTickets].reverse();
  const customerPrimaryName = customerRecordTickets.find((ticket) => normalizeName(ticket.customerName))?.customerName || "Walk-in Customer";
  const customerPrimaryPhone = customerRecordTickets
    .map((ticket) => normalizePhone(ticket.customerPhone))
    .find((phone) => PHONE_REGEX.test(phone)) || "";
  const customerSubmittedDocs = Array.from(new Set(
    customerRecordTickets.flatMap((ticket) => {
      const structured = ticket.structured || toStructuredTicket(ticket);
      return structured.documents.submitted || [];
    })
  ));

  const detailCardStyle = {
    background: "rgba(255,255,255,0.88)",
    border: "1px solid rgba(148,163,184,0.24)",
    borderRadius: 14,
    padding: 14,
    boxShadow: "0 10px 24px rgba(15,23,42,0.05)",
  };
  const sectionCardStyle = {
    background: "rgba(255,255,255,0.92)",
    border: "1px solid rgba(148,163,184,0.24)",
    borderRadius: 16,
    padding: 14,
    boxShadow: "0 10px 24px rgba(15,23,42,0.05)",
  };
  const dashboardInputStyle = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid rgba(148,163,184,0.24)",
    borderRadius: 10,
    background: "#FFFFFF",
    color: "#0F172A",
    outline: "none",
  };
  const softPanelStyle = {
    background: "rgba(248,250,252,0.88)",
    border: "1px solid rgba(148,163,184,0.20)",
    borderRadius: 12,
    padding: 12,
  };
  const actionButtonBase = {
    borderRadius: 10,
    padding: "8px 12px",
    fontWeight: 700,
    cursor: "pointer",
    background: "#FFFFFF",
    transition: "all 0.18s ease",
    boxShadow: "0 1px 2px rgba(15,23,42,0.06)",
  };
  const actionButtonStyles = {
    raw: {
      ...actionButtonBase,
      border: "1px solid rgba(59,130,246,0.28)",
      background: "rgba(239,246,255,0.96)",
      color: "#1D4ED8",
    },
    closeView: {
      ...actionButtonBase,
      border: "1px solid rgba(148,163,184,0.28)",
      background: "rgba(255,255,255,0.96)",
      color: "#0F172A",
    },
    view: {
      ...actionButtonBase,
      border: "1px solid rgba(59,130,246,0.30)",
      background: "rgba(219,234,254,0.94)",
      color: "#1D4ED8",
    },
    customer: {
      ...actionButtonBase,
      border: "1px solid rgba(15,118,110,0.26)",
      background: "rgba(240,253,250,0.96)",
      color: "#0F766E",
    },
    print: {
      ...actionButtonBase,
      border: "1px solid rgba(20,184,166,0.28)",
      background: "rgba(236,253,245,0.96)",
      color: "#0F766E",
    },
    edit: {
      ...actionButtonBase,
      border: "1px solid rgba(245,158,11,0.32)",
      background: "rgba(254,243,199,0.94)",
      color: "#B45309",
    },
    neutral: {
      ...actionButtonBase,
      border: "1px solid rgba(148,163,184,0.32)",
      background: "rgba(241,245,249,0.96)",
      color: "#334155",
    },
    success: {
      ...actionButtonBase,
      border: "1px solid rgba(16,185,129,0.24)",
      background: "#10B981",
      color: "#FFFFFF",
    },
    warning: {
      ...actionButtonBase,
      border: "1px solid rgba(245,158,11,0.32)",
      background: "rgba(254,243,199,0.96)",
      color: "#B45309",
    },
  };

  useEffect(() => {
    if (!focusTicketNo) return;
    const exists = normalizedTickets.some((ticket) => ticket.ticketNo === focusTicketNo);
    if (!exists) {
      if (typeof onFocusHandled === "function") onFocusHandled();
      return;
    }
    setViewTicketNo(focusTicketNo);
    setShowRawJson(false);
    setExpandedTickets((prev) => ({ ...prev, [focusTicketNo]: true }));
    if (typeof onFocusHandled === "function") onFocusHandled();
  }, [focusTicketNo, normalizedTickets, onFocusHandled]);

  useEffect(() => {
    if (!customerRecordTicketNo) return;
    const exists = normalizedTickets.some((ticket) => ticket.ticketNo === customerRecordTicketNo);
    if (!exists) setCustomerRecordTicketNo(null);
  }, [customerRecordTicketNo, normalizedTickets]);

  const toggleExpand = (ticketNo) => {
    setExpandedTickets((prev) => ({ ...prev, [ticketNo]: !prev[ticketNo] }));
  };

  const getAckDraftValue = (ticket) => (
    Object.prototype.hasOwnProperty.call(ackDrafts, ticket.ticketNo)
      ? ackDrafts[ticket.ticketNo]
      : (ticket.ackNumber || "")
  );

  const saveAckNumber = (ticketNo) => {
    if (typeof onUpdateTicket !== "function") return;
    const ticket = normalizedTickets.find((item) => item.ticketNo === ticketNo);
    const draftValue = Object.prototype.hasOwnProperty.call(ackDrafts, ticketNo)
      ? ackDrafts[ticketNo]
      : (ticket?.ackNumber || "");
    const ackNumber = String(draftValue || "").trim();
    onUpdateTicket(ticketNo, { ackNumber });
    setAckDrafts((prev) => ({ ...prev, [ticketNo]: ackNumber }));
    setAckSavedFlags((prev) => ({ ...prev, [ticketNo]: true }));
    setTimeout(() => {
      setAckSavedFlags((prev) => ({ ...prev, [ticketNo]: false }));
    }, 1300);
  };

  const startEdit = (ticket) => {
    setEditTicketNo(ticket.ticketNo);
    setEditDraft({
      customerName: ticket.customerName || "",
      customerPhone: ticket.customerPhone || "",
      referenceName: ticket.referenceName || "",
      referenceType: ticket.referenceType || getReferenceTypeIdByLabel(ticket.referenceTypeLabel),
      operator: ticket.operator || OPERATORS[0],
      cashCollected: String(Number(ticket.cashCollected) || 0),
      upiCollected: String(Number(ticket.upiCollected) || 0),
      portalDown: Boolean(ticket.portalDown),
      portalDownNote: ticket.portalDownNote || "",
    });
    setEditError("");
  };

  const saveEdit = () => {
    if (!editTicketNo || typeof onUpdateTicket !== "function") return;
    const name = editDraft.customerName.trim();
    const referenceName = editDraft.referenceName.trim();
    const phone = (editDraft.customerPhone || "").replace(/\D/g, "").slice(0, 10);
    const cashCollected = Math.max(0, Number(editDraft.cashCollected) || 0);
    const upiCollected = Math.max(0, Number(editDraft.upiCollected) || 0);
    const paidTotal = cashCollected + upiCollected;
    const total = Number(editingTicket?.total) || 0;
    const pendingBalance = Math.max(0, total - paidTotal);
    const portalDown = Boolean(editDraft.portalDown);
    const portalDownNote = String(editDraft.portalDownNote || "").trim();

    if (!name) {
      setEditError("Document holder name is required.");
      return;
    }
    if (!referenceName) {
      setEditError("Reference person name is required.");
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
    if (portalDown && !portalDownNote) {
      setEditError("Portal name is required when ticket is marked as portal down.");
      return;
    }
    const referenceCfg = getReferenceTypeConfig(editDraft.referenceType);
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
      referenceName,
      referenceType: editDraft.referenceType,
      referenceTypeLabel: referenceCfg.label,
      operator: editDraft.operator,
      payMode,
      paymentStatus,
      cashCollected,
      upiCollected,
      paidTotal,
      pendingBalance,
      portalDown,
      portalDownNote: portalDown ? portalDownNote : "",
      status: portalDown ? "Open" : (editingTicket?.status || "Open"),
    });
    setEditTicketNo(null);
    setEditError("");
  };

  const renderExpandedContent = (ticket) => {
    const structured = ticket.structured || toStructuredTicket(ticket);
    return (
      <div style={{ marginTop: 10, borderTop: "1px dashed rgba(15,23,42,0.14)", paddingTop: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, marginBottom: 10 }}>
          <div style={{ color: "#1E293B", fontSize: 13 }}>
            <div style={{ color: "#64748B", fontSize: 11, textTransform: "uppercase", marginBottom: 4 }}>Document Holder</div>
            <div>{structured.parties.documentHolder.name}</div>
            <div style={{ color: "#475569" }}>{structured.parties.documentHolder.phone || "No contact saved"}</div>
          </div>
          <div style={{ color: "#1E293B", fontSize: 13 }}>
            <div style={{ color: "#64748B", fontSize: 11, textTransform: "uppercase", marginBottom: 4 }}>Reference</div>
            <div>{structured.parties.reference.name || "N/A"}</div>
            <div style={{ color: "#475569" }}>{structured.parties.reference.typeLabel || "N/A"}</div>
          </div>
          <div style={{ color: "#1E293B", fontSize: 13 }}>
            <div style={{ color: "#64748B", fontSize: 11, textTransform: "uppercase", marginBottom: 4 }}>Meta</div>
            <div>Status: {structured.meta.status}</div>
            <div style={{ color: "#475569" }}>Updated: {structured.meta.updatedAt || "N/A"}</div>
            {ticket.portalDown && (
              <div style={{ color: "#B45309", marginTop: 4, fontWeight: 700 }}>
                Portal Down: {ticket.portalDownNote || "Submission pending"}
              </div>
            )}
          </div>
          <div style={{ color: "#1E293B", fontSize: 13 }}>
            <div style={{ color: "#64748B", fontSize: 11, textTransform: "uppercase", marginBottom: 4 }}>Payment</div>
            <div>Status: {structured.payment.status}</div>
            <div style={{ color: "#475569" }}>
              Cash Rs. {structured.payment.breakdown.cash} | UPI Rs. {structured.payment.breakdown.upi}
            </div>
            <div style={{ color: "#475569" }}>
              Paid Rs. {structured.payment.paidTotal} | Pending Rs. {structured.payment.pendingBalance}
            </div>
          </div>
          <div style={{ color: "#1E293B", fontSize: 13 }}>
            <div style={{ color: "#64748B", fontSize: 11, textTransform: "uppercase", marginBottom: 4 }}>Documents</div>
            <div>
              Submitted required: {structured.documents.items.filter((doc) => doc.required && doc.submitted).length}/{structured.documents.items.filter((doc) => doc.required).length}
            </div>
            <div style={{ color: "#475569" }}>
              Total submitted: {structured.documents.submitted.length}/{structured.documents.stats.total}
            </div>
          </div>
        </div>
        <div style={{ color: "#0F172A", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Service Breakdown</div>
        <div style={{ display: "grid", gap: 6 }}>
          {structured.services.map((it, idx) => (
            <div key={`${ticket.ticketNo}_expand_${idx}`} style={{ display: "flex", justifyContent: "space-between", color: "#334155", fontSize: 12, padding: "4px 0", borderBottom: idx < structured.services.length - 1 ? "1px solid rgba(148,163,184,0.22)" : "none" }}>
              <span>{it.name}</span>
              <span>Qty {it.qty} | Rs. {it.amount}</span>
            </div>
          ))}
        </div>
        {structured.documents.items.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ color: "#0F172A", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Document Status</div>
            <div style={{ display: "grid", gap: 5 }}>
              {structured.documents.items.map((doc, idx) => (
                <div key={`${ticket.ticketNo}_doc_${idx}`} style={{ display: "flex", justifyContent: "space-between", color: "#334155", fontSize: 12 }}>
                  <span>{doc.name}</span>
                  <span>
                    {doc.required ? "Required" : "Optional"} | {doc.submitted ? "Submitted" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ marginTop: 12, ...softPanelStyle, padding: 12 }}>
          <div style={{ color: "#0F172A", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Acknowledgement / Application No.</div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 8, alignItems: "center" }}>
            <input
              value={getAckDraftValue(ticket)}
              onChange={(e) => setAckDrafts((prev) => ({ ...prev, [ticket.ticketNo]: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  saveAckNumber(ticket.ticketNo);
                }
              }}
              placeholder="Enter acknowledgement number"
              style={dashboardInputStyle}
            />
            <button onClick={() => saveAckNumber(ticket.ticketNo)} style={actionButtonStyles.neutral}>Save</button>
          </div>
          {ackSavedFlags[ticket.ticketNo] && (
            <div style={{ marginTop: 6, fontSize: 11, color: "#0F766E", fontWeight: 700 }}>
              Acknowledgement saved.
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      {customerRecordAnchorTicket && (
        <div style={{ background: "linear-gradient(180deg, rgba(240,253,250,0.88) 0%, rgba(255,255,255,0.94) 100%)", border: "1px solid rgba(20,184,166,0.34)", borderRadius: 18, padding: 20, marginBottom: 18, boxShadow: "0 16px 34px rgba(15,23,42,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
            <div style={{ color: "#0F172A", fontWeight: 800, fontSize: 16 }}>Customer Record: {customerPrimaryName}</div>
            <button onClick={() => setCustomerRecordTicketNo(null)} style={actionButtonStyles.closeView}>Close Record</button>
          </div>

          {!customerIdentity ? (
            <div style={{ color: "#475569", fontSize: 13 }}>Customer identity is not available for this ticket.</div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, marginBottom: 10 }}>
                <div style={detailCardStyle}>
                  <div style={{ color: "#64748B", fontSize: 11, textTransform: "uppercase", marginBottom: 4 }}>Customer Name</div>
                  <div style={{ color: "#0F172A", fontWeight: 700 }}>{customerPrimaryName}</div>
                </div>
                <div style={detailCardStyle}>
                  <div style={{ color: "#64748B", fontSize: 11, textTransform: "uppercase", marginBottom: 4 }}>Phone Number</div>
                  <div style={{ color: "#0F172A", fontWeight: 700 }}>{customerPrimaryPhone || "Not captured"}</div>
                </div>
                <div style={detailCardStyle}>
                  <div style={{ color: "#64748B", fontSize: 11, textTransform: "uppercase", marginBottom: 4 }}>Total Tickets</div>
                  <div style={{ color: "#0F172A", fontWeight: 700 }}>{customerRecordTickets.length}</div>
                </div>
                <div style={detailCardStyle}>
                  <div style={{ color: "#64748B", fontSize: 11, textTransform: "uppercase", marginBottom: 4 }}>Identification Basis</div>
                  <div style={{ color: "#0F172A", fontWeight: 700 }}>
                    {customerIdentity.type === "phone" ? "Phone number match" : "Exact name match"}
                  </div>
                </div>
              </div>

              <div style={{ ...sectionCardStyle, marginBottom: 10 }}>
                <div style={{ color: "#0F172A", fontWeight: 700, fontSize: 12, marginBottom: 8 }}>Submitted Documents (History)</div>
                {customerSubmittedDocs.length === 0 ? (
                  <div style={{ color: "#475569", fontSize: 12 }}>No submitted documents recorded yet.</div>
                ) : (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {customerSubmittedDocs.map((docName) => (
                      <span key={`history_doc_${docName}`} style={{ fontSize: 11, fontWeight: 600, color: "#0F766E", borderRadius: 999, padding: "5px 10px", background: "rgba(236,253,245,0.96)", border: "1px solid rgba(20,184,166,0.24)" }}>
                        {docName}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div style={sectionCardStyle}>
                <div style={{ color: "#0F172A", fontWeight: 700, fontSize: 12, marginBottom: 8 }}>Ticket History</div>
                <div style={{ display: "grid", gap: 8 }}>
                  {customerRecordTicketsSorted.map((ticket) => {
                    const structured = ticket.structured || toStructuredTicket(ticket);
                    const serviceNames = structured.services.map((item) => item.name).filter(Boolean);
                    return (
                      <div key={`history_ticket_${ticket.ticketNo}`} style={{ border: "1px solid rgba(148,163,184,0.22)", borderRadius: 12, padding: 10, background: "rgba(255,255,255,0.92)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                          <div style={{ color: "#0F172A", fontSize: 13, fontWeight: 700 }}>{ticket.ticketNo} | {ticket.date}</div>
                          <div style={{ color: ticket.status === "Closed" ? "#047857" : "#B45309", fontWeight: 700, fontSize: 12 }}>{ticket.status}</div>
                        </div>
                        <div style={{ color: "#334155", fontSize: 12, marginBottom: 3 }}>
                          Services: {serviceNames.length > 0 ? serviceNames.join(", ") : "No services linked"}
                        </div>
                        <div style={{ color: "#475569", fontSize: 12, marginBottom: 3 }}>
                          Amount: Rs. {ticket.total || 0} | Paid: Rs. {ticket.paidTotal || 0} | Pending: Rs. {ticket.pendingBalance || 0}
                        </div>
                        <div style={{ color: "#475569", fontSize: 12, marginBottom: 3 }}>
                          Acknowledgement No.: {ticket.ackNumber ? ticket.ackNumber : "Not available"}
                        </div>
                        <div style={{ color: "#475569", fontSize: 12 }}>
                          Submitted Docs: {structured.documents.submitted.length > 0 ? structured.documents.submitted.join(", ") : "None"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {viewingTicket && (
        <div style={{ background: "linear-gradient(180deg, rgba(240,253,250,0.84) 0%, rgba(255,255,255,0.92) 100%)", border: "1px solid rgba(45,212,191,0.42)", borderRadius: 18, padding: 20, marginBottom: 18, boxShadow: "0 16px 34px rgba(15,23,42,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 8, flexWrap: "wrap" }}>
            <div style={{ color: "#0F172A", fontWeight: 800, fontSize: 16 }}>Ticket View: {viewingTicket.ticketNo}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => printTicketSlip(viewingTicket)} style={actionButtonStyles.print}>
                Print Ticket
              </button>
              <button onClick={() => setShowRawJson((prev) => !prev)} style={actionButtonStyles.raw}>
                {showRawJson ? "Hide Raw JSON" : "Show Raw JSON"}
              </button>
              <button onClick={() => { setViewTicketNo(null); setShowRawJson(false); }} style={actionButtonStyles.closeView}>Close View</button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
            <div style={detailCardStyle}>
              <div style={{ color: "#64748B", fontSize: 11, textTransform: "uppercase", marginBottom: 4 }}>Document Holder</div>
              <div style={{ color: "#0F172A", fontWeight: 700 }}>{viewingStructured.parties.documentHolder.name}</div>
              <div style={{ color: "#475569", fontSize: 12 }}>{viewingStructured.parties.documentHolder.phone || "No contact saved"}</div>
            </div>
            <div style={detailCardStyle}>
              <div style={{ color: "#64748B", fontSize: 11, textTransform: "uppercase", marginBottom: 4 }}>Reference</div>
              <div style={{ color: "#0F172A", fontWeight: 700 }}>{viewingStructured.parties.reference.name || "N/A"}</div>
              <div style={{ color: "#475569", fontSize: 12 }}>{viewingStructured.parties.reference.typeLabel || "N/A"}</div>
            </div>
            <div style={detailCardStyle}>
              <div style={{ color: "#64748B", fontSize: 11, textTransform: "uppercase", marginBottom: 4 }}>Meta</div>
              <div style={{ color: "#0F172A", fontSize: 12 }}>Status: {viewingStructured.meta.status}</div>
              <div style={{ color: "#475569", fontSize: 12 }}>Created: {viewingStructured.meta.createdDate} {viewingStructured.meta.createdTime}</div>
              <div style={{ color: "#475569", fontSize: 12 }}>Updated: {viewingStructured.meta.updatedAt || "N/A"}</div>
              {viewingTicket.portalDown && (
                <div style={{ color: "#B45309", fontSize: 12, fontWeight: 700, marginTop: 4 }}>
                  Portal Down: {viewingTicket.portalDownNote || "Submission pending"}
                </div>
              )}
            </div>
            <div style={detailCardStyle}>
              <div style={{ color: "#64748B", fontSize: 11, textTransform: "uppercase", marginBottom: 4 }}>Assignment & Payment</div>
              <div style={{ color: "#0F172A", fontSize: 12 }}>Operator: {viewingStructured.assignment.operator || "N/A"}</div>
              <div style={{ color: "#475569", fontSize: 12 }}>Mode: {viewingStructured.payment.mode}</div>
              <div style={{ color: "#475569", fontSize: 12 }}>Status: {viewingStructured.payment.status}</div>
              <div style={{ color: "#475569", fontSize: 12 }}>
                Cash Rs. {viewingStructured.payment.breakdown.cash} | UPI Rs. {viewingStructured.payment.breakdown.upi}
              </div>
              <div style={{ color: "#475569", fontSize: 12 }}>
                Paid Rs. {viewingStructured.payment.paidTotal} | Pending Rs. {viewingStructured.payment.pendingBalance}
              </div>
            </div>
            {viewingTicket.ackNumber && (
              <div style={detailCardStyle}>
                <div style={{ color: "#64748B", fontSize: 11, textTransform: "uppercase", marginBottom: 4 }}>Acknowledgement / Application No.</div>
                <div style={{ color: "#0F172A", fontWeight: 800, fontSize: 15 }}>{viewingTicket.ackNumber}</div>
              </div>
            )}
          </div>

          <div style={{ ...sectionCardStyle, marginTop: 10 }}>
            <div style={{ color: "#0F172A", fontWeight: 700, fontSize: 12, marginBottom: 8 }}>Services</div>
            {viewingStructured.services.length === 0 ? (
              <div style={{ color: "#475569", fontSize: 12 }}>No services linked to this ticket.</div>
            ) : (
              <div style={{ display: "grid", gap: 6 }}>
                {viewingStructured.services.map((it, idx) => (
                  <div key={`view_${viewingTicket.ticketNo}_${idx}`} style={{ display: "flex", justifyContent: "space-between", gap: 8, color: "#1E293B", fontSize: 12, paddingBottom: 6, borderBottom: idx < viewingStructured.services.length - 1 ? "1px solid rgba(148,163,184,0.22)" : "none" }}>
                    <span>{it.name}</span>
                    <span>Qty {it.qty} | Unit Rs. {it.unitPrice} | Amount Rs. {it.amount}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ ...sectionCardStyle, marginTop: 10 }}>
            <div style={{ color: "#0F172A", fontWeight: 700, fontSize: 12, marginBottom: 8 }}>Document Status</div>
            {viewingStructured.documents.items.length === 0 ? (
              <div style={{ color: "#475569", fontSize: 12 }}>No document checklist added.</div>
            ) : (
              <div style={{ display: "grid", gap: 6 }}>
                {viewingStructured.documents.items.map((doc, idx) => (
                  <div key={`view_doc_${idx}`} style={{ display: "flex", justifyContent: "space-between", color: "#1E293B", fontSize: 12, paddingBottom: 6, borderBottom: idx < viewingStructured.documents.items.length - 1 ? "1px solid rgba(148,163,184,0.22)" : "none" }}>
                    <span>{doc.name}</span>
                    <span>{doc.required ? "Required" : "Optional"} | {doc.submitted ? "Submitted" : "Pending"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {showRawJson && (
            <pre style={{ margin: "10px 0 0", background: "#0F172A", border: "1px solid rgba(15,23,42,0.18)", borderRadius: 12, padding: 14, color: "#E2E8F0", fontSize: 11, overflowX: "auto" }}>
{JSON.stringify(viewingStructured, null, 2)}
            </pre>
          )}
        </div>
      )}

      {editTicketNo && (
        <div style={{ background: "rgba(255,255,255,0.74)", border: "1px solid rgba(15,23,42,0.14)", borderRadius: 12, padding: 14, marginBottom: 14 }}>
          <div style={{ color: "#0F172A", fontWeight: 700, marginBottom: 10 }}>Edit Ticket {editTicketNo}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
            <input value={editDraft.customerName} onChange={(e) => setEditDraft((prev) => ({ ...prev, customerName: e.target.value }))} placeholder="Document Holder Name" style={{ padding: "10px", borderRadius: 8, border: "1px solid rgba(15,23,42,0.18)", background: "rgba(255,255,255,0.04)", color: "#0F172A", outline: "none" }} />
            <input value={editDraft.customerPhone} onChange={(e) => setEditDraft((prev) => ({ ...prev, customerPhone: e.target.value.replace(/\D/g, "").slice(0, 10) }))} placeholder="Contact Number" style={{ padding: "10px", borderRadius: 8, border: "1px solid rgba(15,23,42,0.18)", background: "rgba(255,255,255,0.04)", color: "#0F172A", outline: "none" }} />
            <input value={editDraft.referenceName} onChange={(e) => setEditDraft((prev) => ({ ...prev, referenceName: e.target.value }))} placeholder="Reference Name" style={{ padding: "10px", borderRadius: 8, border: "1px solid rgba(15,23,42,0.18)", background: "rgba(255,255,255,0.04)", color: "#0F172A", outline: "none" }} />
            <select value={editDraft.referenceType} onChange={(e) => setEditDraft((prev) => ({ ...prev, referenceType: e.target.value }))} style={{ padding: "10px", borderRadius: 8, border: "1px solid rgba(15,23,42,0.18)", background: "rgba(255,255,255,0.04)", color: "#0F172A", outline: "none" }}>
              {REFERENCE_TYPES.map((ref) => <option key={`editref_${ref.id}`} value={ref.id} style={MENU_OPTION_STYLE}>{ref.label}</option>)}
            </select>
            <select value={editDraft.operator} onChange={(e) => setEditDraft((prev) => ({ ...prev, operator: e.target.value }))} style={{ padding: "10px", borderRadius: 8, border: "1px solid rgba(15,23,42,0.18)", background: "rgba(255,255,255,0.04)", color: "#0F172A", outline: "none" }}>
              {OPERATORS.map((op) => <option key={`editop_${op}`} value={op} style={MENU_OPTION_STYLE}>{op}</option>)}
            </select>
            <input type="number" min="0" value={editDraft.cashCollected} onChange={(e) => setEditDraft((prev) => ({ ...prev, cashCollected: e.target.value }))} placeholder="Cash collected" style={{ padding: "10px", borderRadius: 8, border: "1px solid rgba(15,23,42,0.18)", background: "rgba(255,255,255,0.04)", color: "#0F172A", outline: "none" }} />
            <input type="number" min="0" value={editDraft.upiCollected} onChange={(e) => setEditDraft((prev) => ({ ...prev, upiCollected: e.target.value }))} placeholder="UPI collected" style={{ padding: "10px", borderRadius: 8, border: "1px solid rgba(15,23,42,0.18)", background: "rgba(255,255,255,0.04)", color: "#0F172A", outline: "none" }} />
            <label style={{ display: "flex", alignItems: "center", gap: 8, color: "#334155", fontSize: 12, fontWeight: 700, padding: "10px", borderRadius: 8, border: "1px solid rgba(15,23,42,0.18)", background: "rgba(255,255,255,0.04)" }}>
              <input type="checkbox" checked={editDraft.portalDown} onChange={(e) => setEditDraft((prev) => ({ ...prev, portalDown: e.target.checked, portalDownNote: e.target.checked ? prev.portalDownNote : "" }))} />
              Mark as Portal Down
            </label>
            {editDraft.portalDown && (
              <input value={editDraft.portalDownNote} onChange={(e) => setEditDraft((prev) => ({ ...prev, portalDownNote: e.target.value }))} placeholder="Which portal is down?" style={{ padding: "10px", borderRadius: 8, border: "1px solid rgba(15,23,42,0.18)", background: "rgba(255,255,255,0.04)", color: "#0F172A", outline: "none" }} />
            )}
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: "#475569" }}>
            Ticket total Rs. {editingTicket?.total || 0} | Collected Rs. {(Number(editDraft.cashCollected) || 0) + (Number(editDraft.upiCollected) || 0)} | Pending Rs. {Math.max((Number(editingTicket?.total) || 0) - ((Number(editDraft.cashCollected) || 0) + (Number(editDraft.upiCollected) || 0)), 0)}
          </div>
          {editError && <div style={{ marginTop: 8, color: "#FCA5A5", fontSize: 12 }}>{editError}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button onClick={saveEdit} style={{ border: "none", borderRadius: 8, padding: "8px 12px", background: "#14B8A6", color: "white", fontWeight: 700, cursor: "pointer" }}>Save Changes</button>
            <button onClick={() => { setEditTicketNo(null); setEditError(""); }} style={{ border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, padding: "8px 12px", background: "rgba(255,255,255,0.74)", color: "#1E293B", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 16 }}>
        <div style={{ background: "rgba(255,255,255,0.74)", border: "1px solid rgba(15,23,42,0.12)", borderRadius: 10, padding: 14, color: "#0F172A" }}><div style={{ fontSize: 12, color: "#475569" }}>Total Tickets</div><div style={{ fontSize: 24, fontWeight: 800 }}>{normalizedTickets.length}</div></div>
        <div style={{ background: "rgba(255,255,255,0.74)", border: "1px solid rgba(15,23,42,0.12)", borderRadius: 10, padding: 14, color: "#0F172A" }}><div style={{ fontSize: 12, color: "#475569" }}>Open</div><div style={{ fontSize: 24, fontWeight: 800, color: "#F59E0B" }}>{openTickets.length}</div></div>
        <div style={{ background: "rgba(255,255,255,0.74)", border: "1px solid rgba(15,23,42,0.12)", borderRadius: 10, padding: 14, color: "#0F172A" }}><div style={{ fontSize: 12, color: "#475569" }}>Closed</div><div style={{ fontSize: 24, fontWeight: 800, color: "#10B981" }}>{closedTickets.length}</div></div>
        <div style={{ background: "rgba(255,255,255,0.74)", border: "1px solid rgba(15,23,42,0.12)", borderRadius: 10, padding: 14, color: "#0F172A" }}><div style={{ fontSize: 12, color: "#475569" }}>Task Progress</div><div style={{ fontSize: 22, fontWeight: 800, color: "#14B8A6" }}>{doneTasks}/{totalTasks || 0}</div></div>
      </div>

      <div style={{ color: "#0F172A", fontWeight: 700, marginBottom: 8 }}>Open Tickets</div>
      {openTickets.length === 0 ? (
        <div style={{ background: "rgba(255,255,255,0.74)", border: "1px dashed rgba(255,255,255,0.25)", borderRadius: 10, padding: 14, color: "#475569" }}>No open tickets.</div>
      ) : (
        <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
          {openTickets.map((t) => (
            <div key={t.ticketNo} style={{ background: "rgba(255,255,255,0.74)", border: "1px solid rgba(15,23,42,0.12)", borderRadius: 10, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ color: "#0F172A", fontWeight: 700 }}>{t.ticketNo} | {t.customerName}</div>
                  {t.portalDown && (
                    <span style={{ borderRadius: 999, padding: "4px 8px", fontSize: 10, fontWeight: 700, letterSpacing: 0.3, textTransform: "uppercase", color: "#B45309", background: "rgba(254,243,199,0.96)", border: "1px solid rgba(245,158,11,0.26)" }}>
                      Portal Down
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={() => printTicketSlip(t)} style={actionButtonStyles.print}>Print</button>
                  <button onClick={() => { setViewTicketNo(t.ticketNo); setShowRawJson(false); }} style={actionButtonStyles.view}>View</button>
                  <button onClick={() => setCustomerRecordTicketNo(t.ticketNo)} style={actionButtonStyles.customer}>View Customer Record</button>
                  <button onClick={() => startEdit(t)} style={actionButtonStyles.edit}>Edit</button>
                  <button onClick={() => toggleExpand(t.ticketNo)} style={actionButtonStyles.neutral}>{expandedTickets[t.ticketNo] ? "Collapse" : "Expand"}</button>
                  <button
                    onClick={() => onToggleTicketStatus(t.ticketNo, "Closed")}
                    disabled={Boolean(t.portalDown)}
                    style={t.portalDown
                      ? { ...actionButtonStyles.warning, cursor: "not-allowed", opacity: 0.7 }
                      : actionButtonStyles.success}
                  >
                    {t.portalDown ? "Portal Down" : "Close"}
                  </button>
                </div>
              </div>
              {t.items.map((it, idx) => (
                <label key={`${t.ticketNo}_${idx}`} style={{ display: "flex", alignItems: "center", gap: 8, color: "#1E293B", padding: "6px 0", borderBottom: idx < t.items.length - 1 ? "1px solid rgba(15,23,42,0.10)" : "none" }}>
                  <input type="checkbox" checked={!!it.done} onChange={() => onToggleTaskDone(t.ticketNo, idx)} />
                  <span style={{ flex: 1, textDecoration: it.done ? "line-through" : "none" }}>{it.name}</span>
                  <span style={{ fontSize: 12, color: "#475569" }}>x{it.qty}</span>
                </label>
              ))}
              <div style={{ marginTop: 8, fontSize: 12, color: "#475569" }}>
                Payment: {t.paymentStatus || t.structured?.payment?.status || "Unpaid"} | Pending Rs. {t.pendingBalance ?? t.structured?.payment?.pendingBalance ?? 0} | Docs: {t.structured?.documents?.submitted?.length || 0}/{t.structured?.documents?.required?.length || 0} required submitted
              </div>
              {t.portalDown && (
                <div style={{ marginTop: 6, fontSize: 12, color: "#B45309", fontWeight: 700 }}>
                  Portal Down Note: {t.portalDownNote || "Submission pending"}
                </div>
              )}
              {expandedTickets[t.ticketNo] && renderExpandedContent(t)}
            </div>
          ))}
        </div>
      )}

      <div style={{ color: "#0F172A", fontWeight: 700, marginBottom: 8 }}>Closed Tickets</div>
      {closedTickets.length === 0 ? (
        <div style={{ background: "rgba(255,255,255,0.74)", border: "1px dashed rgba(255,255,255,0.25)", borderRadius: 10, padding: 14, color: "#475569" }}>No closed tickets yet.</div>
      ) : (
        <div style={{ background: "rgba(255,255,255,0.74)", border: "1px solid rgba(15,23,42,0.12)", borderRadius: 10, overflow: "hidden" }}>
          {[...closedTickets].reverse().map((t, idx) => (
            <div key={t.ticketNo} style={{ padding: "12px 14px", borderBottom: idx < closedTickets.length - 1 ? "1px solid rgba(15,23,42,0.10)" : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ color: "#0F172A" }}>{t.ticketNo} | {t.customerName} | Rs. {t.total} | {t.paymentStatus || t.structured?.payment?.status || "Unpaid"}</div>
                  {t.portalDown && (
                    <span style={{ borderRadius: 999, padding: "4px 8px", fontSize: 10, fontWeight: 700, letterSpacing: 0.3, textTransform: "uppercase", color: "#B45309", background: "rgba(254,243,199,0.96)", border: "1px solid rgba(245,158,11,0.26)" }}>
                      Portal Down
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={() => printTicketSlip(t)} style={actionButtonStyles.print}>Print</button>
                  <button onClick={() => { setViewTicketNo(t.ticketNo); setShowRawJson(false); }} style={actionButtonStyles.view}>View</button>
                  <button onClick={() => setCustomerRecordTicketNo(t.ticketNo)} style={actionButtonStyles.customer}>View Customer Record</button>
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
        background: "linear-gradient(135deg, #0C1115 0%, #14B8A6 100%)",
        borderRadius: 16,
        padding: "22px 24px",
        color: "white",
        marginBottom: 18,
        boxShadow: "0 6px 16px rgba(79, 70, 229, 0.2)"
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.85, textTransform: "uppercase", letterSpacing: 0.6, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif" }}>
          Partner Desk
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8, letterSpacing: -0.4, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif" }}>
          B2B Workspace
        </div>
        <div style={{ fontSize: 13, marginTop: 8, opacity: 0.85, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif" }}>
          Manage business clients, bulk service requests, and partner operations from one place.
        </div>
      </div>

      <div style={{
        background: "rgba(255,255,255,0.74)",
        borderRadius: 16,
        border: "1px solid rgba(15,23,42,0.12)",
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
        marginBottom: 16
      }}>
        <div style={{
          padding: "14px 20px",
          borderBottom: "1px solid rgba(15,23,42,0.12)",
          background: "rgba(255,255,255,0.72)",
          fontSize: 14,
          fontWeight: 700,
          color: "#1E293B",
          fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif",
          letterSpacing: 0.4
        }}>
          B2B Services
        </div>
        {b2bServices.map((svc, i) => (
          <div key={svc.name} style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 20px",
            borderBottom: i < b2bServices.length - 1 ? "1px solid rgba(15,23,42,0.10)" : "none",
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif" }}>
                {svc.name}
              </div>
              <div style={{ fontSize: 12, color: "#475569", marginTop: 3, fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif" }}>
                {svc.note}
              </div>
            </div>
            <div style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#14B8A6",
              background: "rgba(20, 184, 166, 0.16)",
              border: "1px solid rgba(45, 212, 191, 0.5)",
              borderRadius: 999,
              padding: "5px 10px",
              fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif"
            }}>
              {svc.unit}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        background: "rgba(255,255,255,0.74)",
        borderRadius: 16,
        border: "1px dashed rgba(15,23,42,0.18)",
        padding: "24px 20px",
        textAlign: "center",
        color: "#475569",
        fontFamily: "'Sohne', 'Styrene B', 'Manrope', sans-serif"
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>
          B2B billing board is ready for expansion
        </div>
        <div style={{ fontSize: 13 }}>
          We can plug in corporate client profiles, credit cycles, and GST invoices in this tab next.
        </div>
      </div>
    </div>
  );
}

// --- MAIN APP ---
export default function CSCBilling() {
  const [tab, setTab] = useState(() => getStoredActiveTab());
  const [sidePanelExpanded, setSidePanelExpanded] = useState(() => getStoredSidePanelExpanded());
  const [dashboardFocusTicketNo, setDashboardFocusTicketNo] = useState(null);
  const [customQuickLinks, setCustomQuickLinks] = useState(() => getStoredQuickLinks());
  const [showAddQuickLink, setShowAddQuickLink] = useState(false);
  const [quickLinkName, setQuickLinkName] = useState("");
  const [quickLinkUrl, setQuickLinkUrl] = useState("");
  const [quickLinkError, setQuickLinkError] = useState("");
  const [services, setServices] = useState(() => (
    hydrateServices(readStoredJSON(STORAGE_KEYS.services, INITIAL_SERVICES))
  ));
  const [tickets, setTickets] = useState(() => (
    hydrateTickets(readStoredJSON(STORAGE_KEYS.tickets, []))
  ));
  const openTicketCount = tickets.filter((ticket) => ticket.status !== "Closed").length;
  const closedTicketCount = tickets.filter((ticket) => ticket.status === "Closed").length;
  const pricedServiceCount = services.filter((service) => service.price > 0).length;
  const panelBadges = {
    log: openTicketCount > 0 ? String(openTicketCount) : String(tickets.length),
    b2b: "Beta",
  };
  const quickLinks = [...QUICK_LINK_DEFAULTS, ...customQuickLinks];
  const headerStats = [
    { label: "Configured services", value: `${pricedServiceCount}/${services.length}`, note: "Rates ready for billing", accent: "#14B8A6" },
    { label: "Open tickets", value: String(openTicketCount), note: "Live desk workload", accent: "#F59E0B" },
    { label: "Closed tickets", value: String(closedTicketCount), note: "Completed and archived", accent: "#10B981" },
    { label: "Operators", value: String(OPERATORS.length), note: "Front desk staff enabled", accent: "#0F172A" },
  ];

  const saveTicket = (ticket) => setTickets((prev) => [...prev, withStructuredTicket(ticket)]);
  const toggleTicketStatus = (ticketNo, status) => {
    setTickets((prev) => prev.map((t) => (
      t.ticketNo === ticketNo
        ? withStructuredTicket({
          ...t,
          status: t.portalDown && status === "Closed" ? "Open" : status,
          updatedAt: `${todayStr()} ${timeStr()}`,
        })
        : t
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
      const nextPortalDown = Object.prototype.hasOwnProperty.call(updates || {}, "portalDown")
        ? Boolean(updates.portalDown)
        : Boolean(t.portalDown);
      const requestedStatus = Object.prototype.hasOwnProperty.call(updates || {}, "status")
        ? updates.status
        : t.status;
      return withStructuredTicket({
        ...t,
        ...updates,
        status: nextPortalDown ? "Open" : requestedStatus,
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
    window.open(finalUrl, "_blank");
  };

  useEffect(() => {
    writeStoredJSON(STORAGE_KEYS.activeTab, tab);
  }, [tab]);

  useEffect(() => {
    writeStoredJSON(STORAGE_KEYS.sidePanelExpanded, sidePanelExpanded);
  }, [sidePanelExpanded]);

  useEffect(() => {
    writeStoredJSON(STORAGE_KEYS.services, services);
  }, [services]);

  useEffect(() => {
    writeStoredJSON(STORAGE_KEYS.tickets, serializeTickets(tickets));
  }, [tickets]);

  useEffect(() => {
    writeStoredJSON(STORAGE_KEYS.quickLinks, customQuickLinks);
  }, [customQuickLinks]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at top left, rgba(20,184,166,0.18), transparent 26%), radial-gradient(circle at top right, rgba(14,116,144,0.12), transparent 24%), linear-gradient(180deg, #F8FBFF 0%, #EDF5FB 48%, #F8FAFC 100%)",
      fontFamily: APP_FONT_STACK,
      color: "#0F172A",
    }}>
      <style>{`
        :root {
          color-scheme: light;
        }
        * {
          box-sizing: border-box;
        }
        html, body {
          margin: 0;
          background: #EDF5FB;
          color: #0F172A;
        }
        body, button, input, select, textarea {
          font-family: ${APP_FONT_STACK};
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseFloat {
          from { transform: translateY(0px); }
          to { transform: translateY(-8px); }
        }
        [style*="rgba(255,255,255,0.74)"],
        [style*="rgba(255,255,255,0.82)"] {
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
        }
        @media print {
          @page { margin: 8mm; }
          html, body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body * {
            visibility: hidden !important;
          }
          #receipt, #receipt * {
            visibility: visible !important;
          }
          #receipt {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            margin: 0 auto !important;
            width: min(420px, 100%) !important;
            max-width: 420px !important;
            border: 1px solid #D1D5DB !important;
            border-radius: 20px !important;
            background: white !important;
            box-shadow: none !important;
            overflow: visible !important;
          }
          button {
            display: none !important;
          }
        }
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      <div style={{ padding: "28px 20px 68px", position: "relative" }}>
        <div style={{ maxWidth: APP_MAX_WIDTH, margin: "0 auto" }}>
          {/* Header */}
          <div style={{
            position: "relative",
            overflow: "hidden",
            background: "linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(240,249,255,0.92) 42%, rgba(236,253,245,0.90) 100%)",
            padding: "32px 28px 24px",
            color: "#0F172A",
            border: "1px solid rgba(148,163,184,0.18)",
            borderRadius: 30,
            boxShadow: "0 28px 60px rgba(15,23,42,0.10)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            marginBottom: 28,
          }}>
            <div style={{
              position: "absolute",
              width: 220,
              height: 220,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(20,184,166,0.20) 0%, rgba(20,184,166,0) 72%)",
              top: -80,
              right: -40,
              animation: "pulseFloat 5s ease-in-out infinite alternate",
              pointerEvents: "none",
            }} />
            <div style={{
              position: "absolute",
              width: 180,
              height: 180,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(14,116,144,0.14) 0%, rgba(14,116,144,0) 72%)",
              bottom: -70,
              left: -40,
              animation: "pulseFloat 6s ease-in-out infinite alternate",
              pointerEvents: "none",
            }} />

            <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, flexWrap: "wrap", marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 18, flex: "1 1 760px", minWidth: 280 }}>
                <button
                  onClick={() => setSidePanelExpanded((prev) => !prev)}
                  aria-label={sidePanelExpanded ? "Close utility menu" : "Open utility menu"}
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: 20,
                    border: "1px solid rgba(148,163,184,0.20)",
                    background: "rgba(248,250,252,0.94)",
                    display: "grid",
                    placeItems: "center",
                    cursor: "pointer",
                    boxShadow: "0 14px 28px rgba(15,23,42,0.08)",
                    flexShrink: 0,
                    marginTop: 4,
                  }}
                >
                  <span style={{ display: "grid", gap: 4 }}>
                    <span style={{ width: 18, height: 2, borderRadius: 999, background: "#0F172A", display: "block" }} />
                    <span style={{ width: 18, height: 2, borderRadius: 999, background: "#0F172A", display: "block" }} />
                    <span style={{ width: 18, height: 2, borderRadius: 999, background: "#0F172A", display: "block" }} />
                  </span>
                </button>

                <div style={{ maxWidth: 680 }}>
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    borderRadius: 999,
                    padding: "8px 12px",
                    background: "rgba(15,23,42,0.05)",
                    border: "1px solid rgba(15,23,42,0.08)",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 1.1,
                    textTransform: "uppercase",
                    color: "#0F766E",
                    marginBottom: 18,
                  }}>
                    Operations Console
                  </div>
                  <h1 style={{ fontSize: "clamp(2.1rem, 4vw, 3.5rem)", lineHeight: 1.04, fontWeight: 800, margin: 0, letterSpacing: -1.8, color: "#0F172A" }}>
                    CSC Centre Workspace
                  </h1>
                  <p style={{ margin: "14px 0 0", fontSize: 16, lineHeight: 1.6, color: "#475569", maxWidth: 620, fontWeight: 500 }}>
                    A cleaner control room for billing, service intake, and ticket follow-up at Blue Sapphire Plaza.
                    This pass focuses on clarity, hierarchy, and faster navigation.
                  </p>
                </div>
              </div>
              <div style={{
                minWidth: 220,
                background: "rgba(255,255,255,0.82)",
                borderRadius: 20,
                border: "1px solid rgba(148,163,184,0.18)",
                padding: "16px 18px",
                boxShadow: "0 18px 36px rgba(15,23,42,0.08)",
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.1, textTransform: "uppercase", color: "#64748B", marginBottom: 8 }}>
                  Today
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", marginBottom: 10 }}>
                  {todayStr()}
                </div>
                <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
                  Active view:
                  <span style={{ color: "#0F172A", fontWeight: 700 }}> {TAB_CONFIG.find((item) => item.id === tab)?.label}</span>
                </div>
                <div style={{ marginTop: 10, fontSize: 12, color: "#0F766E", fontFamily: APP_MONO_STACK }}>
                  Desk readiness: Live
                </div>
              </div>
            </div>

            <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
              {headerStats.map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: 20,
                    background: "rgba(255,255,255,0.78)",
                    border: "1px solid rgba(148,163,184,0.16)",
                    padding: "16px 18px",
                    minHeight: 104,
                  }}
                >
                  <div style={{
                    position: "absolute",
                    width: 88,
                    height: 88,
                    borderRadius: "50%",
                    background: `${stat.accent}18`,
                    top: -28,
                    right: -18,
                  }} />
                  <div style={{ position: "relative", fontSize: 12, fontWeight: 600, color: "#64748B", marginBottom: 10 }}>
                    {stat.label}
                  </div>
                  <div style={{ position: "relative", fontSize: 28, fontWeight: 800, letterSpacing: -0.8, color: "#0F172A", marginBottom: 8 }}>
                    {stat.value}
                  </div>
                  <div style={{ position: "relative", fontSize: 12, lineHeight: 1.5, color: stat.accent, fontWeight: 600 }}>
                    {stat.note}
                  </div>
                </div>
              ))}
            </div>

            {/* Primary Navigation */}
            <div style={{
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div style={{
                flex: "1 1 100%",
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                padding: 6,
                background: "rgba(248,250,252,0.72)",
                border: "1px solid rgba(148,163,184,0.16)",
                borderRadius: 24,
              }}>
                {PRIMARY_TAB_CONFIG.map((item) => (
                  <TabBtn
                    key={item.id}
                    label={item.label}
                    description={item.description}
                    active={tab === item.id}
                    onClick={() => setTab(item.id)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div
            aria-hidden={!sidePanelExpanded}
            onClick={() => setSidePanelExpanded(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15,23,42,0.24)",
              opacity: sidePanelExpanded ? 1 : 0,
              pointerEvents: sidePanelExpanded ? "auto" : "none",
              transition: "opacity 0.22s ease",
              zIndex: 40,
            }}
          />

          <aside
            aria-hidden={!sidePanelExpanded}
            style={{
              position: "fixed",
              top: 20,
              bottom: 20,
              left: 20,
              width: "min(360px, calc(100vw - 40px))",
              background: "linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(248,250,252,0.95) 100%)",
              border: "1px solid rgba(148,163,184,0.18)",
              borderRadius: 28,
              boxShadow: "0 32px 60px rgba(15,23,42,0.18)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              padding: 18,
              transform: sidePanelExpanded ? "translateX(0)" : "translateX(calc(-100% - 28px))",
              transition: "transform 0.26s ease",
              zIndex: 50,
              display: "grid",
              gridTemplateRows: "auto auto 1fr",
              gap: 14,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.1, textTransform: "uppercase", color: "#64748B", marginBottom: 6 }}>
                  Utility Menu
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.8, color: "#0F172A" }}>
                  Workspace Tools
                </div>
              </div>
              <button
                onClick={() => setSidePanelExpanded(false)}
                style={{
                  border: "1px solid rgba(148,163,184,0.18)",
                  borderRadius: 14,
                  padding: "10px 12px",
                  background: "rgba(248,250,252,0.92)",
                  color: "#334155",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Close
              </button>
            </div>

            <div style={{ padding: "14px 16px", borderRadius: 18, background: "rgba(15,23,42,0.04)", border: "1px solid rgba(148,163,184,0.16)" }}>
              <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
                Open monitoring and partner workflows from here without crowding the main intake flow.
              </div>
            </div>

            <div style={{ display: "grid", gap: 14, alignContent: "start", overflowY: "auto", paddingRight: 2 }}>
              <div style={{ display: "grid", gap: 10, alignContent: "start" }}>
                <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700, letterSpacing: 1.1, textTransform: "uppercase", margin: "0 4px" }}>
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
                      setTab(item.id);
                      setSidePanelExpanded(false);
                    }}
                  />
                ))}
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700, letterSpacing: 1.1, textTransform: "uppercase", margin: "0 4px" }}>
                  Quick Links
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {quickLinks.map((link) => (
                    <div key={link.id} style={{ borderRadius: 14, border: "1px solid rgba(148,163,184,0.22)", background: "rgba(255,255,255,0.92)", padding: 10, display: "grid", gap: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                        <div style={{ color: "#0F172A", fontSize: 13, fontWeight: 700 }}>{link.name}</div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => openQuickLink(link.url)} style={{ border: "1px solid rgba(20,184,166,0.24)", borderRadius: 8, background: "rgba(236,253,245,0.96)", color: "#0F766E", fontSize: 11, fontWeight: 700, padding: "6px 8px", cursor: "pointer" }}>
                            Open
                          </button>
                          {!link.isDefault && (
                            <button onClick={() => removeQuickLink(link.id)} style={{ border: "1px solid rgba(248,113,113,0.24)", borderRadius: 8, background: "rgba(254,242,242,0.96)", color: "#B91C1C", fontSize: 11, fontWeight: 700, padding: "6px 8px", cursor: "pointer" }}>
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                      <div style={{ color: "#475569", fontSize: 12, lineHeight: 1.45 }}>{link.description}</div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setShowAddQuickLink((prev) => !prev);
                    setQuickLinkError("");
                  }}
                  style={{ border: "1px solid rgba(20,184,166,0.26)", borderRadius: 10, background: "rgba(240,253,250,0.96)", color: "#0F766E", fontSize: 12, fontWeight: 700, padding: "9px 10px", cursor: "pointer" }}
                >
                  + Add Link
                </button>
                {showAddQuickLink && (
                  <div style={{ borderRadius: 12, border: "1px solid rgba(148,163,184,0.22)", background: "rgba(255,255,255,0.94)", padding: 10, display: "grid", gap: 8 }}>
                    <input value={quickLinkName} onChange={(e) => setQuickLinkName(e.target.value)} placeholder="Name" style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.24)", outline: "none" }} />
                    <input value={quickLinkUrl} onChange={(e) => setQuickLinkUrl(e.target.value)} placeholder="URL" style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.24)", outline: "none" }} />
                    {quickLinkError && (
                      <div style={{ color: "#B91C1C", fontSize: 11, fontWeight: 600 }}>{quickLinkError}</div>
                    )}
                    <button onClick={addQuickLink} style={{ border: "none", borderRadius: 8, background: "linear-gradient(135deg, #14B8A6 0%, #0F766E 100%)", color: "#FFFFFF", fontSize: 12, fontWeight: 700, padding: "8px 10px", cursor: "pointer" }}>
                      Save
                    </button>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Content Container */}
          <div style={{ maxWidth: APP_MAX_WIDTH, margin: "0 auto", padding: "0 4px 12px" }}>
            <TabPanel active={tab === "desk"}>
              <TodaysDesk
                tickets={tickets}
                onOpenTicket={(ticketNo) => {
                  setDashboardFocusTicketNo(ticketNo);
                  setTab("log");
                  setSidePanelExpanded(false);
                }}
              />
            </TabPanel>
            <TabPanel active={tab === "entry"}>
              <TicketWorkspace services={services} onSaveTicket={saveTicket} />
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
                focusTicketNo={dashboardFocusTicketNo}
                onFocusHandled={() => setDashboardFocusTicketNo(null)}
              />
            </TabPanel>
            <TabPanel active={tab === "b2b"}>
              <B2BWorkspace />
            </TabPanel>
          </div>
        </div>
      </div>
    </div>
  );
}




