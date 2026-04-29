import React, { useState, useMemo, useCallback } from "react";
import { AP } from "./theme.js";

const APPOINTMENT_STATUSES = ["Upcoming", "Done", "Cancelled"];

const STATUS_STYLE = {
  Upcoming: { color: AP.primary,   bg: AP.primarySoft,  label: "Upcoming" },
  Done:     { color: AP.success,   bg: AP.successSoft,  label: "Done"     },
  Cancelled:{ color: AP.danger,    bg: AP.dangerSoft,   label: "Cancelled"},
};

const AADHAAR_SERVICES = [
  "Aadhaar Address Update",
  "Aadhaar Name Update",
  "Aadhaar DOB Update",
  "Aadhaar Mobile Update",
  "Aadhaar Enrolment (New)",
  "Aadhaar Download / Reprint",
  "Aadhaar Correction (Other)",
];

function generateId() {
  return `appt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDisplayDate(isoDate) {
  if (!isoDate) return "—";
  const [y, m, d] = isoDate.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${d} ${months[Number(m) - 1]} ${y}`;
}

function daysUntil(isoDate) {
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(isoDate); target.setHours(0,0,0,0);
  return Math.round((target - today) / 86400000);
}

function urgencyLabel(days) {
  if (days < 0)  return { text: `${Math.abs(days)}d overdue`, color: AP.danger,  bg: AP.dangerSoft  };
  if (days === 0) return { text: "Today",                    color: AP.warning, bg: AP.warningSoft };
  if (days === 1) return { text: "Tomorrow",                 color: AP.warning, bg: AP.warningSoft };
  return             { text: `In ${days}d`,                  color: AP.primary, bg: AP.primarySoft  };
}

// --- Blank form state ---
function blankForm() {
  return {
    customerName: "",
    customerPhone: "",
    service: AADHAAR_SERVICES[0],
    appointmentDate: "",
    appointmentTime: "",
    note: "",
  };
}

// ===================== MAIN EXPORT =====================

export function AppointmentsWorkspace({ appointments: apptsProp, customerOptions = [], onSave, onDelete, onStatusChange }) {
  // If parent doesn't wire state yet, manage locally so the page is usable standalone
  const [localAppointments, setLocalAppointments] = useState(() => []);
  const appointments = apptsProp ?? localAppointments;

  const saveAppointment = useCallback((appt) => {
    if (onSave) { onSave(appt); return; }
    setLocalAppointments((prev) => {
      const idx = prev.findIndex((a) => a.id === appt.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = appt;
        return next;
      }
      return [appt, ...prev];
    });
  }, [onSave]);

  const deleteAppointment = useCallback((id) => {
    if (onDelete) { onDelete(id); return; }
    setLocalAppointments((prev) => prev.filter((a) => a.id !== id));
  }, [onDelete]);

  const changeStatus = useCallback((id, status) => {
    if (onStatusChange) { onStatusChange(id, status); return; }
    setLocalAppointments((prev) =>
      prev.map((a) => a.id === id ? { ...a, status, updatedAt: new Date().toISOString() } : a)
    );
  }, [onStatusChange]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("Upcoming");

  const filtered = useMemo(() => {
    const list = filterStatus === "All"
      ? appointments
      : appointments.filter((a) => a.status === filterStatus);
    return [...list].sort((a, b) => {
      if (a.appointmentDate < b.appointmentDate) return -1;
      if (a.appointmentDate > b.appointmentDate) return 1;
      return 0;
    });
  }, [appointments, filterStatus]);

  const upcomingCount = appointments.filter((a) => a.status === "Upcoming").length;

  function openNew() {
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(appt) {
    setEditingId(appt.id);
    setShowForm(true);
  }

  function handleFormSave(data) {
    const now = new Date().toISOString();
    if (editingId) {
      const existing = appointments.find((a) => a.id === editingId);
      saveAppointment({ ...existing, ...data, updatedAt: now });
    } else {
      saveAppointment({ id: generateId(), status: "Upcoming", createdAt: now, updatedAt: now, ...data });
    }
    setShowForm(false);
    setEditingId(null);
  }

  const editingAppt = editingId ? appointments.find((a) => a.id === editingId) : null;

  return (
    <div style={{
      maxWidth: AP.pageMaxWidth,
      margin: "0 auto",
      padding: "4px 4px 40px",
      fontFamily: AP.font,
      color: AP.text,
      display: "grid",
      gap: 20,
    }}>
      <PageHeader upcomingCount={upcomingCount} onAddNew={openNew} />

      <FilterBar active={filterStatus} onChange={setFilterStatus} counts={{
        Upcoming:  appointments.filter((a) => a.status === "Upcoming").length,
        Done:      appointments.filter((a) => a.status === "Done").length,
        Cancelled: appointments.filter((a) => a.status === "Cancelled").length,
        All:       appointments.length,
      }} />

      {filtered.length === 0 ? (
        <EmptyState filterStatus={filterStatus} onAddNew={openNew} />
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {filtered.map((appt) => (
            <AppointmentCard
              key={appt.id}
              appt={appt}
              onEdit={() => openEdit(appt)}
              onDelete={() => deleteAppointment(appt.id)}
              onStatusChange={(s) => changeStatus(appt.id, s)}
            />
          ))}
        </div>
      )}

      {showForm && (
        <AppointmentFormModal
          initial={editingAppt}
          customerOptions={customerOptions}
          onSave={handleFormSave}
          onClose={() => { setShowForm(false); setEditingId(null); }}
        />
      )}
    </div>
  );
}

// ===================== PAGE HEADER =====================

function PageHeader({ upcomingCount, onAddNew }) {
  return (
    <div style={{
      borderBottom: `1px solid ${AP.borderSoft}`,
      paddingBottom: 14,
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: 12,
      flexWrap: "wrap",
    }}>
      <div style={{ display: "grid", gap: 5 }}>
        <div style={{ fontFamily: AP.brand, fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: AP.textSubtle }}>
          Sector 71 Aadhaar Centre
        </div>
        <h2 style={{ margin: 0, fontFamily: AP.brand, fontSize: "1.5rem", fontWeight: 800, color: AP.text, letterSpacing: "-0.01em" }}>
          Appointments
        </h2>
        <div style={{ fontSize: "0.88rem", color: AP.textMuted, lineHeight: 1.5 }}>
          Upcoming visits booked at the Aadhaar Seva Kendra. Never miss a slot.
        </div>
        {upcomingCount > 0 && (
          <div style={{ marginTop: 2, fontFamily: AP.mono, fontSize: "0.74rem", color: AP.primary }}>
            {upcomingCount} upcoming appointment{upcomingCount === 1 ? "" : "s"}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onAddNew}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "10px 18px",
          background: AP.primary,
          color: "#fff",
          border: "none",
          borderRadius: AP.rMd,
          fontFamily: AP.brand,
          fontWeight: 700,
          fontSize: "0.76rem",
          letterSpacing: "0.06em",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Book Appointment
      </button>
    </div>
  );
}

// ===================== FILTER BAR =====================

function FilterBar({ active, onChange, counts }) {
  const tabs = ["Upcoming", "Done", "Cancelled", "All"];
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {tabs.map((t) => {
        const isActive = active === t;
        return (
          <button
            key={t}
            type="button"
            onClick={() => onChange(t)}
            style={{
              padding: "6px 14px",
              borderRadius: AP.rSm,
              border: `1px solid ${isActive ? AP.borderAccent : AP.border}`,
              background: isActive ? AP.primarySoft : AP.surfaceSubtle,
              color: isActive ? AP.primary : AP.textMuted,
              fontFamily: AP.font,
              fontWeight: isActive ? 700 : 500,
              fontSize: "0.82rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {t}
            <span style={{
              fontFamily: AP.mono,
              fontSize: "0.70rem",
              color: isActive ? AP.primary : AP.textSubtle,
              background: isActive ? "rgba(9,153,142,0.12)" : AP.surfaceMuted,
              borderRadius: 99,
              padding: "1px 7px",
            }}>
              {counts[t] ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ===================== APPOINTMENT CARD =====================

function AppointmentCard({ appt, onEdit, onDelete, onStatusChange }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  const ss = STATUS_STYLE[appt.status] || STATUS_STYLE.Upcoming;
  const days = appt.status === "Upcoming" ? daysUntil(appt.appointmentDate) : null;
  const urgency = days !== null ? urgencyLabel(days) : null;

  return (
    <div style={{
      background: AP.surface,
      border: `1px solid ${AP.border}`,
      borderRadius: AP.rLg,
      boxShadow: AP.shadowSoft,
      padding: "16px 18px",
      display: "grid",
      gap: 10,
    }}>
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "grid", gap: 3 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: AP.brand, fontSize: "1.02rem", fontWeight: 700, color: AP.text }}>
              {appt.customerName}
            </span>
            {appt.customerPhone && (
              <span style={{ fontFamily: AP.mono, fontSize: "0.74rem", color: AP.textSubtle }}>
                {appt.customerPhone}
              </span>
            )}
          </div>
          <div style={{ fontSize: "0.84rem", color: AP.textMuted }}>
            {appt.service}
          </div>
        </div>

        {/* Status badge + menu */}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setStatusMenuOpen((p) => !p)}
            style={{
              padding: "4px 12px",
              borderRadius: 99,
              border: `1px solid ${ss.color}33`,
              background: ss.bg,
              color: ss.color,
              fontFamily: AP.font,
              fontWeight: 700,
              fontSize: "0.72rem",
              cursor: "pointer",
              letterSpacing: "0.04em",
            }}
          >
            {ss.label} ▾
          </button>
          {statusMenuOpen && (
            <div style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 4px)",
              background: AP.surface,
              border: `1px solid ${AP.border}`,
              borderRadius: AP.rMd,
              boxShadow: AP.shadowCard,
              zIndex: 10,
              overflow: "hidden",
              minWidth: 130,
            }}>
              {APPOINTMENT_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { onStatusChange(s); setStatusMenuOpen(false); }}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "9px 14px",
                    background: appt.status === s ? AP.primarySoft : "transparent",
                    color: appt.status === s ? AP.primary : AP.text,
                    fontFamily: AP.font,
                    fontWeight: appt.status === s ? 700 : 400,
                    fontSize: "0.84rem",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Date/time row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={AP.textSubtle} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span style={{ fontFamily: AP.mono, fontSize: "0.80rem", color: AP.textMuted }}>
            {formatDisplayDate(appt.appointmentDate)}
          </span>
        </div>
        {appt.appointmentTime && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={AP.textSubtle} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span style={{ fontFamily: AP.mono, fontSize: "0.80rem", color: AP.textMuted }}>
              {appt.appointmentTime}
            </span>
          </div>
        )}
        {urgency && (
          <span style={{
            padding: "2px 10px",
            borderRadius: 99,
            background: urgency.bg,
            color: urgency.color,
            fontFamily: AP.mono,
            fontSize: "0.70rem",
            fontWeight: 700,
          }}>
            {urgency.text}
          </span>
        )}
      </div>

      {/* Note */}
      {appt.note && (
        <div style={{
          padding: "8px 12px",
          background: AP.surfaceSubtle,
          borderRadius: AP.rSm,
          fontSize: "0.83rem",
          color: AP.textMuted,
          lineHeight: 1.5,
        }}>
          {appt.note}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, paddingTop: 2 }}>
        <button
          type="button"
          onClick={onEdit}
          style={{
            padding: "6px 14px",
            background: "transparent",
            border: `1px solid ${AP.border}`,
            borderRadius: AP.rSm,
            color: AP.textMuted,
            fontFamily: AP.font,
            fontSize: "0.78rem",
            cursor: "pointer",
          }}
        >
          Edit
        </button>
        {confirmDelete ? (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: "0.78rem", color: AP.danger }}>Delete?</span>
            <button
              type="button"
              onClick={onDelete}
              style={{ padding: "6px 12px", background: AP.dangerSoft, border: `1px solid ${AP.danger}33`, borderRadius: AP.rSm, color: AP.danger, fontFamily: AP.font, fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              style={{ padding: "6px 12px", background: "transparent", border: `1px solid ${AP.border}`, borderRadius: AP.rSm, color: AP.textMuted, fontFamily: AP.font, fontSize: "0.78rem", cursor: "pointer" }}
            >
              No
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            style={{
              padding: "6px 14px",
              background: "transparent",
              border: `1px solid ${AP.border}`,
              borderRadius: AP.rSm,
              color: AP.textSubtle,
              fontFamily: AP.font,
              fontSize: "0.78rem",
              cursor: "pointer",
            }}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

// ===================== EMPTY STATE =====================

function EmptyState({ filterStatus, onAddNew }) {
  return (
    <div style={{
      padding: "48px 24px",
      textAlign: "center",
      color: AP.textSubtle,
      display: "grid",
      gap: 12,
      justifyItems: "center",
    }}>
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={AP.border} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        <line x1="9" y1="16" x2="15" y2="16"/>
      </svg>
      <div style={{ fontFamily: AP.brand, fontSize: "1rem", fontWeight: 700, color: AP.textMuted }}>
        {filterStatus === "All" ? "No appointments yet" : `No ${filterStatus.toLowerCase()} appointments`}
      </div>
      <div style={{ fontSize: "0.84rem", maxWidth: 320, lineHeight: 1.6 }}>
        {filterStatus === "Upcoming"
          ? "Book a slot to keep track of visits to the Aadhaar Seva Kendra."
          : "Nothing here yet."}
      </div>
      {filterStatus === "Upcoming" && (
        <button
          type="button"
          onClick={onAddNew}
          style={{
            marginTop: 4,
            padding: "9px 20px",
            background: AP.primarySoft,
            border: `1px solid ${AP.borderAccent}`,
            borderRadius: AP.rMd,
            color: AP.primary,
            fontFamily: AP.brand,
            fontWeight: 700,
            fontSize: "0.78rem",
            cursor: "pointer",
          }}
        >
          + Book Appointment
        </button>
      )}
    </div>
  );
}

// ===================== FORM MODAL =====================

function AppointmentFormModal({ initial, customerOptions = [], onSave, onClose }) {
  const [form, setForm] = useState(() =>
    initial
      ? {
          customerName:    initial.customerName    || "",
          customerPhone:   initial.customerPhone   || "",
          service:         initial.service         || AADHAAR_SERVICES[0],
          appointmentDate: initial.appointmentDate || "",
          appointmentTime: initial.appointmentTime || "",
          note:            initial.note            || "",
        }
      : blankForm()
  );
  const [errors, setErrors] = useState({});
  const [customerMenuOpen, setCustomerMenuOpen] = useState(false);
  const [customerSearchTouched, setCustomerSearchTouched] = useState(false);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function selectCustomer(customer) {
    setForm((prev) => ({
      ...prev,
      customerName: customer.name || prev.customerName,
      customerPhone: customer.phone || prev.customerPhone,
    }));
    setErrors((prev) => ({ ...prev, customerName: undefined }));
    setCustomerMenuOpen(false);
    setCustomerSearchTouched(true);
  }

  function validate() {
    const errs = {};
    if (!form.customerName.trim()) errs.customerName = "Name is required";
    if (!form.appointmentDate)     errs.appointmentDate = "Date is required";
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSave({ ...form, customerName: form.customerName.trim(), customerPhone: form.customerPhone.trim(), note: form.note.trim() });
  }

  const isEdit = !!initial;
  const customerQuery = form.customerName.trim().toLowerCase();
  const matchingCustomers = useMemo(() => {
    const source = Array.isArray(customerOptions) ? customerOptions : [];
    const filtered = source.filter((customer) => {
      const name = String(customer?.name || "").toLowerCase();
      const phone = String(customer?.phone || "");
      if (!customerQuery) return true;
      return name.includes(customerQuery) || phone.includes(customerQuery);
    });
    return filtered.slice(0, 6);
  }, [customerOptions, customerQuery]);
  const shouldShowCustomerMenu = customerMenuOpen && matchingCustomers.length > 0;

  const inputStyle = (hasErr) => ({
    width: "100%",
    boxSizing: "border-box",
    fontFamily: AP.font,
    fontSize: "0.90rem",
    color: AP.text,
    background: AP.surfaceSubtle,
    border: `1px solid ${hasErr ? AP.danger : AP.border}`,
    borderRadius: AP.rSm,
    padding: "10px 12px",
    outline: "none",
  });

  const labelStyle = {
    fontFamily: AP.font,
    fontSize: "0.76rem",
    fontWeight: 700,
    color: AP.textMuted,
    marginBottom: 4,
    display: "block",
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(13,27,42,0.38)",
      zIndex: 100,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: AP.surface,
        borderRadius: AP.rLg,
        boxShadow: "0 20px 60px rgba(13,27,42,0.18)",
        width: "100%",
        maxWidth: 480,
        maxHeight: "90vh",
        overflowY: "auto",
        padding: "28px 28px 24px",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <div>
            <div style={{ fontFamily: AP.brand, fontSize: "0.60rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: AP.textSubtle, marginBottom: 3 }}>
              Sector 71 Aadhaar Centre
            </div>
            <h3 style={{ margin: 0, fontFamily: AP.brand, fontSize: "1.18rem", fontWeight: 800, color: AP.text }}>
              {isEdit ? "Edit Appointment" : "Book Appointment"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: AP.textSubtle, padding: 4 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
          {/* Customer Name */}
          <div style={{ position: "relative" }}>
            <label style={labelStyle}>Customer Name *</label>
            <input
              type="text"
              value={form.customerName}
              onChange={(e) => {
                set("customerName", e.target.value);
                setCustomerMenuOpen(true);
                setCustomerSearchTouched(true);
              }}
              onFocus={() => setCustomerMenuOpen(true)}
              onBlur={() => window.setTimeout(() => setCustomerMenuOpen(false), 140)}
              placeholder="Type or select existing customer"
              style={inputStyle(!!errors.customerName)}
              autoFocus
            />
            {shouldShowCustomerMenu && (
              <div style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                left: 0,
                right: 0,
                zIndex: 5,
                background: AP.surface,
                border: `1px solid ${AP.border}`,
                borderRadius: AP.rMd,
                boxShadow: AP.shadowCard,
                overflow: "hidden",
              }}>
                {matchingCustomers.map((customer) => (
                  <button
                    key={`${customer.phone || "name"}_${customer.name}`}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectCustomer(customer)}
                    style={{
                      width: "100%",
                      border: "none",
                      background: "transparent",
                      padding: "10px 12px",
                      textAlign: "left",
                      cursor: "pointer",
                      display: "grid",
                      gap: 3,
                      borderBottom: `1px solid ${AP.borderSoft}`,
                    }}
                  >
                    <span style={{ fontFamily: AP.font, fontSize: "0.88rem", fontWeight: 700, color: AP.text }}>
                      {customer.name}
                    </span>
                    <span style={{ fontFamily: AP.mono, fontSize: "0.72rem", color: AP.textSubtle }}>
                      {customer.phone ? `${customer.phone} · ${customer.source || "Existing customer"}` : customer.source || "Existing customer"}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {errors.customerName && <div style={{ color: AP.danger, fontSize: "0.74rem", marginTop: 4 }}>{errors.customerName}</div>}
            {!errors.customerName && customerOptions.length > 0 && customerSearchTouched && matchingCustomers.length === 0 && form.customerName.trim() && (
              <div style={{ color: AP.textSubtle, fontSize: "0.72rem", marginTop: 4 }}>
                No existing customer matched. This will create a new appointment name.
              </div>
            )}
          </div>

          {/* Phone */}
          <div>
            <label style={labelStyle}>Phone Number</label>
            <input
              type="tel"
              value={form.customerPhone}
              onChange={(e) => set("customerPhone", e.target.value)}
              placeholder="10-digit mobile"
              style={inputStyle(false)}
            />
          </div>

          {/* Service */}
          <div>
            <label style={labelStyle}>Service</label>
            <select
              value={form.service}
              onChange={(e) => set("service", e.target.value)}
              style={{ ...inputStyle(false), cursor: "pointer" }}
            >
              {AADHAAR_SERVICES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Date + Time */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Appointment Date *</label>
              <input
                type="date"
                value={form.appointmentDate}
                onChange={(e) => set("appointmentDate", e.target.value)}
                min={todayISO()}
                style={inputStyle(!!errors.appointmentDate)}
              />
              {errors.appointmentDate && <div style={{ color: AP.danger, fontSize: "0.74rem", marginTop: 4 }}>{errors.appointmentDate}</div>}
            </div>
            <div>
              <label style={labelStyle}>Time (optional)</label>
              <input
                type="time"
                value={form.appointmentTime}
                onChange={(e) => set("appointmentTime", e.target.value)}
                style={inputStyle(false)}
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label style={labelStyle}>Note</label>
            <textarea
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              placeholder="Any details to remember — documents to bring, slot number, operator, etc."
              rows={3}
              style={{ ...inputStyle(false), resize: "vertical", lineHeight: 1.5 }}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 20px",
                border: `1px solid ${AP.border}`,
                borderRadius: 999,
                background: AP.surfaceSubtle,
                color: AP.textMuted,
                fontFamily: AP.brand,
                fontWeight: 700,
                fontSize: "0.72rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: "10px 24px",
                border: `1px solid ${AP.borderAccent}`,
                borderRadius: 999,
                background: AP.primarySoft,
                color: AP.primary,
                fontFamily: AP.brand,
                fontWeight: 700,
                fontSize: "0.72rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              {isEdit ? "Save Changes" : "Book →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AppointmentsWorkspace;
