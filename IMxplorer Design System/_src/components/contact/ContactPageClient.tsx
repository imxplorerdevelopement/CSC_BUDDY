"use client";

import dynamic from "next/dynamic";
import emailjs from "@emailjs/browser";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";

const GlobeComponent = dynamic(() => import("@/components/GlobeComponent"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center bg-black text-sm text-white/60">
      Loading globe...
    </div>
  ),
});

// ─── Types ────────────────────────────────────────────────────────────────────

type FormData = {
  name: string;
  phone: string;
  email: string;
  dob: string;
  destination: string;
  service: string;
  trip_month: string;
  travelers: string;
  budget: string;
  message: string;
};

const initialForm: FormData = {
  name: "",
  phone: "",
  email: "",
  dob: "",
  destination: "",
  service: "",
  trip_month: "",
  travelers: "",
  budget: "",
  message: "",
};

// ─── Validators ───────────────────────────────────────────────────────────────

const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const validPhone = (v: string) => v.replace(/[^\d]/g, "").length >= 7;
const validName  = (v: string) => v.trim().length >= 2;
const validTrav  = (v: string) => { const n = Number(v); return Number.isInteger(n) && n >= 1 && n <= 500; };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
const pad2 = (n: number) => String(n).padStart(2,"0");

function fmtMonth(v: string) {
  if (!/^\d{4}-\d{2}$/.test(v)) return "";
  const [y, m] = v.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

function fmtDob(v: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return "";
  const [y, m, d] = v.split("-").map(Number);
  return `${pad2(d)} ${MONTHS[m - 1]} ${y}`;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

// ─── Base input / field styles ────────────────────────────────────────────────

const fieldBase =
  "relative rounded-[9px] bg-gradient-to-br from-white/[0.04] to-white/[0.012] shadow-[0_10px_22px_rgba(0,0,0,0.16)] transition-all duration-300 hover:-translate-y-px";

const inputBase =
  "w-full bg-transparent border-none outline-none text-white/92 font-sans text-[0.92rem] pt-6 pb-2 px-4 placeholder-transparent peer";

const labelBase =
  "absolute top-1.5 left-4 font-brand text-[0.55rem] uppercase tracking-[0.3em] text-white/40 pointer-events-none transition-all duration-200 peer-focus:text-white/74 peer-[:not(:placeholder-shown)]:text-white/74";

// ─── Custom Select ────────────────────────────────────────────────────────────

type SelectOption = { value: string; label: string };

function CustomSelect({
  label,
  value,
  options,
  onChange,
  hasError,
  placeholder = "Select",
}: {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (v: string) => void;
  hasError?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);
  const displayLabel = selected ? selected.label : "";

  return (
    <div ref={ref} className="relative">
      {/* Field wrapper */}
      <div
        className={`${fieldBase} cursor-pointer ${open ? "-translate-y-0.5 shadow-[0_14px_28px_rgba(0,0,0,0.22)]" : ""} ${hasError ? "ring-1 ring-[#8f2f2f]/50" : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-end justify-between px-4 pt-6 pb-2 min-h-[52px]">
          <span className={`font-sans text-[0.9rem] font-medium leading-none ${displayLabel ? "text-white/94" : "text-white/46"}`}>
            {displayLabel || placeholder}
          </span>
          {/* Chevron */}
          <span
            className={`ml-2 flex-shrink-0 w-[9px] h-[9px] border-r-[1.5px] border-b-[1.5px] transition-all duration-200 ${
              open
                ? "border-[#d3a65a] rotate-[-135deg] translate-y-[3px]"
                : "border-white/50 rotate-45 -translate-y-[3px]"
            }`}
          />
        </div>
        {/* Float label */}
        <span
          className={`absolute top-1.5 left-4 font-brand text-[0.55rem] uppercase tracking-[0.3em] pointer-events-none transition-all duration-200 ${
            displayLabel ? "text-white/74" : "text-white/40"
          }`}
        >
          {label}
        </span>
      </div>

      {/* Dropdown panel */}
      <div
        ref={panelRef}
        className={`absolute z-50 left-0 right-0 mt-2.5 rounded-xl border border-white/14 backdrop-blur-xl overflow-hidden transition-all duration-200 origin-top ${
          open
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-[0.985] pointer-events-none"
        }`}
        style={{
          background: "radial-gradient(circle at 88% -28%, rgba(211,166,90,0.18), transparent 52%), linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01) 36%), #060606",
          borderTopColor: "rgba(211,166,90,0.42)",
          boxShadow: "0 28px 56px rgba(0,0,0,0.62), 0 0 0 1px rgba(211,166,90,0.14), inset 0 1px 0 rgba(255,255,255,0.07)",
        }}
      >
        <div className="py-1.5 px-1.5 max-h-[258px] overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left rounded-[10px] px-3 py-2.5 font-sans text-[0.9rem] font-medium transition-all duration-150 ${
                opt.value === value
                  ? "bg-gradient-to-r from-[rgba(211,166,90,0.27)] to-[rgba(255,255,255,0.04)] text-white shadow-[inset_0_0_0_1px_rgba(211,166,90,0.34)]"
                  : "text-white/88 hover:bg-gradient-to-r hover:from-[rgba(211,166,90,0.18)] hover:to-[rgba(255,255,255,0.03)] hover:text-white hover:translate-x-0.5"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {hasError && (
        <p className="mt-1 px-1 font-sans text-[0.55rem] uppercase tracking-[0.15em] text-[#8f2f2f]">
          Required field
        </p>
      )}
    </div>
  );
}

// ─── Month Picker ─────────────────────────────────────────────────────────────

function MonthPicker({
  value,
  onChange,
  hasError,
}: {
  value: string;
  onChange: (v: string) => void;
  hasError?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const parsed = /^\d{4}-\d{2}$/.test(value)
    ? { year: Number(value.split("-")[0]), month: Number(value.split("-")[1]) }
    : null;

  const display = fmtMonth(value);

  const selectMonth = (monthIdx: number) => {
    onChange(`${viewYear}-${pad2(monthIdx + 1)}`);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <div
        className={`${fieldBase} cursor-pointer ${open ? "-translate-y-0.5" : ""} ${hasError ? "ring-1 ring-[#8f2f2f]/50" : ""}`}
        onClick={() => { setOpen((o) => !o); if (parsed) setViewYear(parsed.year); }}
      >
        <div className="flex items-end justify-between px-4 pt-6 pb-2 min-h-[52px]">
          <span className={`font-sans text-[0.9rem] font-medium ${display ? "text-white/94" : "text-white/46"}`}>
            {display || "Select Month"}
          </span>
          <span
            className={`ml-2 flex-shrink-0 w-[9px] h-[9px] border-r-[1.5px] border-b-[1.5px] transition-all duration-200 ${
              open ? "border-[#d3a65a] rotate-[-135deg] translate-y-[3px]" : "border-white/50 rotate-45 -translate-y-[3px]"
            }`}
          />
        </div>
        <span className={`absolute top-1.5 left-4 font-brand text-[0.55rem] uppercase tracking-[0.3em] pointer-events-none transition-all duration-200 ${display ? "text-white/74" : "text-white/40"}`}>
          Travel Month *
        </span>
      </div>

      {/* Panel */}
      <div
        className={`absolute z-50 left-0 mt-2.5 w-[320px] rounded-xl border border-white/14 backdrop-blur-xl transition-all duration-200 origin-top ${
          open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-[0.985] pointer-events-none"
        }`}
        style={{
          background: "radial-gradient(circle at 85% -20%, rgba(211,166,90,0.2), transparent 52%), linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.012) 40%), #060606",
          borderTopColor: "rgba(211,166,90,0.42)",
          boxShadow: "0 28px 56px rgba(0,0,0,0.62), 0 0 0 1px rgba(211,166,90,0.14), inset 0 1px 0 rgba(255,255,255,0.07)",
          padding: "0.72rem",
        }}
      >
        {/* Year nav */}
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={() => setViewYear((y) => y - 1)}
            className="w-[29px] h-[27px] rounded-lg border border-white/18 bg-white/[0.045] text-white/86 hover:border-[rgba(211,166,90,0.65)] hover:bg-[rgba(211,166,90,0.16)] hover:text-white hover:-translate-y-px transition-all duration-200 text-sm"
          >‹</button>
          <span className="font-brand text-[0.66rem] uppercase tracking-[0.22em] text-white/92">{viewYear}</span>
          <button
            type="button"
            onClick={() => setViewYear((y) => y + 1)}
            className="w-[29px] h-[27px] rounded-lg border border-white/18 bg-white/[0.045] text-white/86 hover:border-[rgba(211,166,90,0.65)] hover:bg-[rgba(211,166,90,0.16)] hover:text-white hover:-translate-y-px transition-all duration-200 text-sm"
          >›</button>
        </div>

        {/* Month grid */}
        <div className="grid grid-cols-4 gap-[0.48rem] mb-3">
          {MONTHS.map((m, i) => {
            const isSelected = parsed && parsed.year === viewYear && parsed.month === i + 1;
            return (
              <button
                key={m}
                type="button"
                onClick={() => selectMonth(i)}
                className={`rounded-[9px] py-2.5 font-sans text-[0.82rem] font-semibold transition-all duration-150 border ${
                  isSelected
                    ? "bg-gradient-to-br from-[rgba(211,166,90,0.26)] to-[rgba(211,166,90,0.08)] border-[rgba(211,166,90,0.48)] text-white shadow-[inset_0_0_0_1px_rgba(211,166,90,0.26)] -translate-y-px"
                    : "border-white/8 bg-white/[0.04] text-white/86 hover:bg-gradient-to-br hover:from-[rgba(211,166,90,0.26)] hover:to-[rgba(211,166,90,0.08)] hover:border-[rgba(211,166,90,0.48)] hover:text-white hover:-translate-y-px"
                }`}
              >
                {m}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="grid grid-cols-2 gap-2.5 border-t border-white/13 pt-2.5">
          <button
            type="button"
            onClick={() => { onChange(""); setOpen(false); }}
            className="rounded-full border border-white/14 bg-white/[0.03] text-white/74 font-brand text-[0.64rem] uppercase tracking-[0.05em] py-1.5 hover:border-[rgba(211,166,90,0.62)] hover:bg-[rgba(211,166,90,0.14)] hover:text-white hover:-translate-y-px transition-all duration-150"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => {
              const t = new Date();
              onChange(`${t.getFullYear()}-${pad2(t.getMonth() + 1)}`);
              setOpen(false);
            }}
            className="rounded-full border border-white/14 bg-white/[0.03] text-white/74 font-brand text-[0.64rem] uppercase tracking-[0.05em] py-1.5 hover:border-[rgba(211,166,90,0.62)] hover:bg-[rgba(211,166,90,0.14)] hover:text-white hover:-translate-y-px transition-all duration-150"
          >
            This month
          </button>
        </div>
      </div>

      {hasError && (
        <p className="mt-1 px-1 font-sans text-[0.55rem] uppercase tracking-[0.15em] text-[#8f2f2f]">
          Required field
        </p>
      )}
    </div>
  );
}

// ─── DOB Calendar Picker ──────────────────────────────────────────────────────

function DobPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const today = new Date();
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(today.getFullYear() - 25);
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(value + "T00:00:00") : null;
  const display = fmtDob(value);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const selectDay = (year: number, month: number, day: number) => {
    const d = new Date(year, month, day);
    if (d > today) return;
    onChange(`${year}-${pad2(month + 1)}-${pad2(day)}`);
    setOpen(false);
  };

  // Build calendar days
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const totalDays = daysInMonth(viewYear, viewMonth);
  const prevDays = daysInMonth(viewYear, viewMonth - 1 < 0 ? 11 : viewMonth - 1);
  const cells: { year: number; month: number; day: number; outside: boolean; disabled: boolean }[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    const m = viewMonth - 1 < 0 ? 11 : viewMonth - 1;
    const y = viewMonth - 1 < 0 ? viewYear - 1 : viewYear;
    cells.push({ year: y, month: m, day: prevDays - i, outside: true, disabled: true });
  }
  for (let d = 1; d <= totalDays; d++) {
    const dt = new Date(viewYear, viewMonth, d);
    cells.push({ year: viewYear, month: viewMonth, day: d, outside: false, disabled: dt > today });
  }
  while (cells.length < 42) {
    const m = viewMonth + 1 > 11 ? 0 : viewMonth + 1;
    const y = viewMonth + 1 > 11 ? viewYear + 1 : viewYear;
    cells.push({ year: y, month: m, day: cells.length - firstDay - totalDays + 1, outside: true, disabled: true });
  }

  return (
    <div ref={ref} className="relative">
      <div
        className={`${fieldBase} cursor-pointer ${open ? "-translate-y-0.5" : ""}`}
        onClick={() => { setOpen((o) => !o); if (parsed) { setViewYear(parsed.getFullYear()); setViewMonth(parsed.getMonth()); } }}
      >
        <div className="flex items-end justify-between px-4 pt-6 pb-2 min-h-[52px]">
          <span className={`font-sans text-[0.9rem] font-medium ${display ? "text-white/94" : "text-white/46"}`}>
            {display || "Select Date"}
          </span>
          <span
            className={`ml-2 flex-shrink-0 w-[9px] h-[9px] border-r-[1.5px] border-b-[1.5px] transition-all duration-200 ${
              open ? "border-[#d3a65a] rotate-[-135deg] translate-y-[3px]" : "border-white/50 rotate-45 -translate-y-[3px]"
            }`}
          />
        </div>
        <span className={`absolute top-1.5 left-4 font-brand text-[0.55rem] uppercase tracking-[0.3em] pointer-events-none transition-all duration-200 ${display ? "text-white/74" : "text-white/40"}`}>
          Date of Birth
        </span>
      </div>

      {/* Calendar panel */}
      <div
        className={`absolute z-50 left-0 mt-2.5 w-[340px] rounded-xl border border-white/14 backdrop-blur-xl transition-all duration-200 origin-top ${
          open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-[0.985] pointer-events-none"
        }`}
        style={{
          background: "radial-gradient(circle at 85% -20%, rgba(211,166,90,0.2), transparent 52%), linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.012) 40%), #060606",
          borderTopColor: "rgba(211,166,90,0.42)",
          boxShadow: "0 28px 56px rgba(0,0,0,0.62), inset 0 1px 0 rgba(255,255,255,0.07)",
          padding: "0.72rem",
        }}
      >
        {/* Month/Year nav */}
        <div className="flex items-center justify-between mb-3">
          <button type="button" onClick={prevMonth} className="w-[29px] h-[27px] rounded-lg border border-white/18 bg-white/[0.045] text-white/86 hover:border-[rgba(211,166,90,0.65)] hover:bg-[rgba(211,166,90,0.16)] hover:text-white transition-all duration-200 text-sm">‹</button>
          <span className="font-brand text-[0.66rem] uppercase tracking-[0.22em] text-white/92">
            {MONTHS[viewMonth]} {viewYear}
          </span>
          <button type="button" onClick={nextMonth} className="w-[29px] h-[27px] rounded-lg border border-white/18 bg-white/[0.045] text-white/86 hover:border-[rgba(211,166,90,0.65)] hover:bg-[rgba(211,166,90,0.16)] hover:text-white transition-all duration-200 text-sm">›</button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
            <span key={d} className="text-center font-brand text-[0.58rem] uppercase tracking-[0.14em] text-white/58">{d}</span>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1 mb-3">
          {cells.map((cell, i) => {
            const isSelected = parsed &&
              parsed.getFullYear() === cell.year &&
              parsed.getMonth() === cell.month &&
              parsed.getDate() === cell.day;
            const isToday =
              today.getFullYear() === cell.year &&
              today.getMonth() === cell.month &&
              today.getDate() === cell.day;
            return (
              <button
                key={i}
                type="button"
                disabled={cell.disabled}
                onClick={() => selectDay(cell.year, cell.month, cell.day)}
                className={`rounded-[9px] h-9 font-sans text-[0.79rem] font-semibold transition-all duration-150 border ${
                  cell.outside
                    ? "text-white/34 bg-white/[0.015] border-transparent cursor-default"
                    : cell.disabled
                    ? "text-white/20 bg-white/[0.01] border-transparent cursor-not-allowed"
                    : isSelected
                    ? "bg-gradient-to-br from-[rgba(211,166,90,0.3)] to-[rgba(211,166,90,0.1)] border-[rgba(211,166,90,0.6)] text-white shadow-[inset_0_0_0_1px_rgba(211,166,90,0.28)]"
                    : isToday
                    ? "border-white/30 bg-white/[0.04] text-white hover:bg-[rgba(211,166,90,0.24)] hover:border-[rgba(211,166,90,0.46)] hover:-translate-y-px"
                    : "border-white/8 bg-white/[0.04] text-white/90 hover:bg-[rgba(211,166,90,0.24)] hover:border-[rgba(211,166,90,0.46)] hover:text-white hover:-translate-y-px"
                }`}
              >
                {cell.day}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="grid grid-cols-2 gap-2.5 border-t border-white/13 pt-2.5">
          <button type="button" onClick={() => { onChange(""); setOpen(false); }} className="rounded-full border border-white/14 bg-white/[0.03] text-white/74 font-brand text-[0.64rem] uppercase tracking-[0.05em] py-1.5 hover:border-[rgba(211,166,90,0.62)] hover:bg-[rgba(211,166,90,0.14)] hover:text-white hover:-translate-y-px transition-all duration-150">Clear</button>
          <button type="button" onClick={() => { onChange(`${today.getFullYear()}-${pad2(today.getMonth()+1)}-${pad2(today.getDate())}`); setOpen(false); }} className="rounded-full border border-white/14 bg-white/[0.03] text-white/74 font-brand text-[0.64rem] uppercase tracking-[0.05em] py-1.5 hover:border-[rgba(211,166,90,0.62)] hover:bg-[rgba(211,166,90,0.14)] hover:text-white hover:-translate-y-px transition-all duration-150">Today</button>
        </div>
      </div>
    </div>
  );
}

// ─── Floating Label Input ─────────────────────────────────────────────────────

function FloatInput({
  label,
  type = "text",
  value,
  onChange,
  hasError,
  errorMsg = "Required field",
  inputMode,
  min,
  max,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  hasError?: boolean;
  errorMsg?: string;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>["inputMode"];
  min?: string | number;
  max?: string | number;
}) {
  return (
    <div>
      <div className={`${fieldBase} focus-within:-translate-y-0.5 focus-within:shadow-[0_14px_28px_rgba(0,0,0,0.22)] ${hasError ? "ring-1 ring-[#8f2f2f]/50" : ""}`}>
        <input
          type={type}
          placeholder={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode={inputMode}
          min={min}
          max={max}
          className={`${inputBase} [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [color-scheme:dark]`}
        />
        <span className={labelBase}>{label}</span>
      </div>
      {hasError && (
        <p className="mt-1 px-1 font-sans text-[0.55rem] uppercase tracking-[0.15em] text-[#8f2f2f]">{errorMsg}</p>
      )}
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function FormProgress({ form }: { form: FormData }) {
  const fields = [form.name, form.phone, form.destination, form.service, form.trip_month, form.travelers, form.budget, form.message];
  const filled = fields.filter((f) => f.trim() !== "").length;
  const pct = Math.round((filled / fields.length) * 100);
  const marks = [25, 50, 75, 100];

  return (
    <div className="mt-1 mb-5">
      <div className="flex justify-between items-center mb-1.5">
        <span className="font-sans text-[0.55rem] uppercase tracking-[0.18em] text-white/42">Enquiry Progress</span>
        <span className="font-sans text-[0.55rem] uppercase tracking-[0.18em] text-white/42">{pct}%</span>
      </div>
      <div className="h-[4px] bg-white/8 overflow-hidden">
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, rgba(143,47,47,0.9), rgba(211,166,90,0.95))",
          }}
        />
      </div>
      <div className="mt-1.5 grid grid-cols-4 gap-1.5">
        {marks.map((m) => (
          <span
            key={m}
            className={`border text-center py-0.5 font-sans text-[0.49rem] uppercase tracking-[0.15em] transition-all duration-300 ${
              pct >= m
                ? "text-white/95 border-[rgba(211,166,90,0.55)] bg-gradient-to-r from-[rgba(211,166,90,0.14)] to-[rgba(143,47,47,0.1)] shadow-[0_6px_18px_rgba(211,166,90,0.2)]"
                : "text-white/33 border-white/8"
            }`}
          >
            {m === 100 ? "Ready" : `${m}%`}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Trip Snapshot ────────────────────────────────────────────────────────────

function TripSnapshot({ form }: { form: FormData }) {
  const chips = [
    form.destination,
    form.service,
    fmtMonth(form.trip_month),
    form.travelers ? `${form.travelers} traveler${Number(form.travelers) === 1 ? "" : "s"}` : "",
    form.budget,
  ].filter(Boolean);

  if (!chips.length) return null;

  return (
    <div
      className="relative mb-5 overflow-hidden"
      style={{
        border: "1px solid rgba(211,166,90,0.44)",
        background: "radial-gradient(circle at 88% -25%, rgba(211,166,90,0.28), transparent 52%), linear-gradient(145deg, rgba(255,255,255,0.065), rgba(255,255,255,0.018) 46%, rgba(255,255,255,0.01))",
        padding: "0.9rem 0.95rem 1rem",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 0 1px rgba(211,166,90,0.2), 0 16px 38px rgba(0,0,0,0.36)",
      }}
    >
      <p
        className="font-brand text-[0.58rem] uppercase tracking-[0.25em] mb-2.5"
        style={{ color: "rgba(220,185,102,0.98)", textShadow: "0 0 12px rgba(211,166,90,0.28)" }}
      >
        Trip Snapshot
      </p>
      <div className="flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <span
            key={chip}
            className="font-sans text-[0.62rem] font-bold text-white px-2.5 py-1.5"
            style={{
              border: "1px solid rgba(211,166,90,0.68)",
              background: "linear-gradient(145deg, rgba(211,166,90,0.32), rgba(211,166,90,0.12) 42%, rgba(255,255,255,0.04))",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 8px 20px rgba(0,0,0,0.28), 0 0 0 1px rgba(211,166,90,0.2)",
            }}
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const serviceOptions: SelectOption[] = [
  { value: "Flights/Hotels", label: "Flights/Hotels" },
  { value: "Holidays & Leisure", label: "Holidays & Leisure" },
  { value: "Corporate and MICE", label: "Corporate and MICE" },
  { value: "LUXE", label: "LUXE" },
  { value: "VISAS", label: "VISAS" },
  { value: "Car Rental", label: "Car Rental" },
];

const budgetOptions: SelectOption[] = [
  { value: "Under INR 1L", label: "Under INR 1L" },
  { value: "INR 1L to 3L", label: "INR 1L to 3L" },
  { value: "INR 3L to 7L", label: "INR 3L to 7L" },
  { value: "INR 7L to 15L", label: "INR 7L to 15L" },
  { value: "INR 15L+", label: "INR 15L+" },
];

export default function ContactPageClient() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState("");

  const updateField = useCallback((key: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: false }));
  }, []);

  const validateForm = (): boolean => {
    const e: Record<string, boolean> = {};
    if (!validName(form.name)) e.name = true;
    if (!validPhone(form.phone)) e.phone = true;
    if (form.email && !validEmail(form.email)) e.email = true;
    if (form.destination.trim().length < 2) e.destination = true;
    if (!form.service) e.service = true;
    if (!form.trip_month) e.trip_month = true;
    if (!validTrav(form.travelers)) e.travelers = true;
    if (!form.budget) e.budget = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openWhatsApp = () => {
    const text = encodeURIComponent(
      `Hi IMxplorer, I'd like to plan a trip.\n\nName: ${form.name}\nPhone: ${form.phone}\nEmail: ${form.email}${form.dob ? "\nDOB: " + form.dob : ""}\nDestination: ${form.destination}\nService: ${form.service}\nTravel month: ${form.trip_month}\nTravelers: ${form.travelers}\nBudget: ${form.budget}\nMessage: ${form.message}`
    );
    window.open(`https://wa.me/919811099951?text=${text}`, "_blank");
  };

  const submit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setFormError("");
    if (!validateForm()) { setFormError("Please review the highlighted fields and try again."); return; }

    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
    const publicKey  = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) { openWhatsApp(); return; }

    try {
      setIsSending(true);
      await emailjs.send(serviceId, templateId, {
        from_name: form.name, phone: form.phone, email: form.email, dob: form.dob,
        destination: form.destination, service: form.service, trip_month: form.trip_month,
        travelers: form.travelers, budget: form.budget, message: form.message,
        submitted_at: new Date().toISOString(),
      }, { publicKey });
      setSent(true);
    } catch {
      setFormError("Something went wrong. Please try WhatsApp or call us directly.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className="bg-[#060606] overflow-hidden">

      {/* ── Globe Hero ─────────────────────────────────────────── */}
      <div className="relative w-full">
        <section className="relative flex min-h-[calc(100vh-6rem)] items-center overflow-hidden bg-black sm:min-h-[calc(100vh-4rem)] lg:min-h-[calc(100vh-2rem)]">
          <div className="absolute inset-0 z-[1]">
            <GlobeComponent />
          </div>
        </section>
      </div>

      {/* ── Split Contact Grid ─────────────────────────────────── */}
      <div
        className="grid grid-cols-1 lg:grid-cols-[42%_58%]"
        style={{ minHeight: "100vh", background: "#060606" }}
      >

        {/* ─── LEFT PANEL ──────────────────────────────────────── */}
        <div
          className="flex flex-col justify-between gap-8 p-8 md:p-10 lg:p-16"
          style={{ borderRight: "1px solid rgba(255,255,255,0.045)" }}
        >

          {/* Brand intro */}
          <div className="space-y-4 mt-16 lg:mt-24">
            {/* Kicker row */}
            <div className="flex items-center gap-2.5 mb-4">
              <p className="font-brand text-[0.58rem] uppercase tracking-[0.3em] text-[rgba(211,166,90,0.92)]">
                Contact
              </p>
              <span
                className="w-[7px] h-[7px] rounded-full flex-shrink-0"
                style={{
                  background: "#d3a65a",
                  boxShadow: "0 0 0 0 rgba(211,166,90,0.34)",
                  animation: "introDotPulse 2.6s ease-in-out infinite",
                }}
              />
              <div
                className="flex-1 h-px"
                style={{ background: "linear-gradient(90deg, rgba(211,166,90,0.48), rgba(255,255,255,0.03))" }}
              />
            </div>

            {/* Quote panel */}
            <div
              className="relative overflow-hidden"
              style={{
                padding: "1.36rem 1.2rem 1.16rem",
                background: "linear-gradient(138deg, rgba(211,166,90,0.18) 0%, rgba(211,166,90,0.06) 26%, rgba(255,255,255,0.018) 54%, rgba(5,5,5,0.88) 100%), rgba(6,6,6,0.78)",
                border: "1px solid rgba(211,166,90,0.28)",
                borderRight: "1px solid rgba(255,255,255,0.1)",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                boxShadow: "0 20px 42px rgba(0,0,0,0.3)",
              }}
            >
              {/* Left accent */}
              <div
                className="absolute left-0 top-0 bottom-0 w-[2px]"
                style={{ background: "linear-gradient(180deg, rgba(211,166,90,0.96), rgba(211,166,90,0.24))" }}
              />
              <p
                className="font-serif italic leading-[0.94] font-normal text-white/93 mb-3"
                style={{ fontSize: "clamp(3.1rem, 4.9vw, 5.6rem)" }}
              >
                &ldquo;We&nbsp;Care.&rdquo;
              </p>
              <p className="font-sans text-[0.92rem] text-white/57 leading-[1.72] max-w-[33ch]">
                Not just a tagline,{" "}
                <strong className="text-white/86 font-semibold">it is the promise.</strong>{" "}
                Every journey we plan is personal. We know the game, and we play it for you.
              </p>
            </div>
          </div>

          {/* ── Unified LUXE Concierge Card (matches HTML .contact-unified) ── */}
          <div
            className="relative overflow-hidden transition-all duration-500 hover:-translate-y-1"
            style={{
              marginTop: "1.6rem",
              padding: "1.36rem 1.32rem 1.18rem",
              background: "radial-gradient(circle at 84% -12%, rgba(143,47,47,0.14), transparent 44%), linear-gradient(152deg, rgba(10,10,11,0.995), rgba(8,8,8,0.99) 58%, rgba(3,3,3,0.995) 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderTop: "1px solid rgba(143,47,47,0.4)",
              boxShadow: "0 32px 68px rgba(0,0,0,0.76), 0 0 0 1px rgba(143,47,47,0.07), 0 0 16px rgba(143,47,47,0.1), inset 0 1px 0 rgba(255,255,255,0.06)",
              borderRadius: "14px",
            }}
          >
            {/* Scan line — thin horizontal line that sweeps top→bottom */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 1,
                background: "linear-gradient(90deg, transparent 0%, rgba(200,80,80,0.55) 30%, rgba(255,120,120,0.7) 50%, rgba(200,80,80,0.55) 70%, transparent 100%)",
                animation: "luxeScanLine 8s linear infinite",
                boxShadow: "0 0 6px 1px rgba(200,80,80,0.25)",
                willChange: "transform",
              }} />
            </div>
            {/* Red radial orb top-right */}
            <div className="absolute pointer-events-none" style={{
              width: 280, height: 280, right: -120, top: -130, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(143,47,47,0.12), transparent 72%)",
            }} />

            {/* Shell: content left, orbit artwork top-right */}
            <div className="relative z-10" style={{
              display: "grid", gridTemplateColumns: "1fr",
              paddingRight: "clamp(5.25rem, 18vw, 8.2rem)",
              minHeight: "clamp(6.7rem, 16.8vw, 8.05rem)",
              gap: "0.62rem",
            }}>

              {/* ── Yacht + waves orbit ── */}
              <div className="absolute top-0 right-0 pointer-events-none overflow-visible" style={{
                width: "clamp(104px, 14vw, 126px)",
                height: "clamp(104px, 14vw, 126px)",
              }}>
                {/* Stars */}
                {[
                  { top: 12, left: 12, delay: "-0.2s" },
                  { top: 20, left: 38, delay: "-1.1s", size: 1.5 },
                  { top: 9, right: 30, delay: "-2.4s" },
                  { top: 28, right: 12, delay: "-0.9s", size: 1.6 },
                  { top: 42, left: 24, delay: "-1.8s", size: 1.4 },
                  { top: 34, left: 80, delay: "-2.9s", size: 1.7 },
                  { top: 16, left: 63, delay: "-1.5s", size: 1.4 },
                ].map((s, i) => (
                  <span key={i} className="absolute rounded-full" style={{
                    width: s.size ?? 2, height: s.size ?? 2,
                    top: s.top, left: (s as { left?: number }).left, right: (s as { right?: number }).right,
                    background: "#cff2ff",
                    boxShadow: "0 0 4px rgba(149,231,255,0.8)",
                    animation: `starTwinkle 4.8s ease-in-out infinite ${s.delay}`,
                  }} />
                ))}

                {/* Animated waves — outer div clips, inner SVGs scroll independently */}
                <div className="absolute" style={{ left: -16, right: -12, bottom: 8, height: 50, overflow: "hidden" }}>
                  {/* Back band — drifts right (cross-current) */}
                  <svg viewBox="0 0 840 80" preserveAspectRatio="none" style={{
                    position: "absolute", top: 0, left: 0, width: "200%", height: "100%",
                    animation: "waveBandBack 13.8s linear infinite",
                    willChange: "transform",
                  }}>
                    <path d="M0 40 C 24 31 48 49 72 40 C 96 31 120 49 144 40 C 168 31 192 49 216 40 C 240 31 264 49 288 40 C 312 31 336 49 360 40 C 384 31 408 49 432 40 C 456 31 480 49 504 40 C 528 31 552 49 576 40 C 600 31 624 49 648 40 C 672 31 696 49 720 40 C 744 31 768 49 792 40 C 816 31 840 49 840 40"
                      fill="none" stroke="rgba(150,220,255,0.38)" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  {/* Mid band */}
                  <svg viewBox="0 0 840 80" preserveAspectRatio="none" style={{
                    position: "absolute", top: 0, left: 0, width: "200%", height: "100%",
                    animation: "waveBandMid 11.7s linear infinite",
                    willChange: "transform",
                  }}>
                    <path d="M0 50 C 26 40 52 60 78 50 C 104 40 130 60 156 50 C 182 40 208 60 234 50 C 260 40 286 60 312 50 C 338 40 364 60 390 50 C 416 40 442 60 468 50 C 494 40 520 60 546 50 C 572 40 598 60 624 50 C 650 40 676 60 702 50 C 728 40 754 60 780 50 C 806 40 832 60 840 50"
                      fill="none" stroke="rgba(190,238,255,0.68)" strokeWidth="1.75" strokeLinecap="round"/>
                  </svg>
                  {/* Front band */}
                  <svg viewBox="0 0 840 80" preserveAspectRatio="none" style={{
                    position: "absolute", top: 0, left: 0, width: "200%", height: "100%",
                    animation: "waveBandFront 10.1s linear infinite",
                    willChange: "transform",
                    filter: "drop-shadow(0 0 2px rgba(120,225,255,0.3))",
                  }}>
                    <path d="M0 60 C 28 49 56 71 84 60 C 112 49 140 71 168 60 C 196 49 224 71 252 60 C 280 49 308 71 336 60 C 364 49 392 71 420 60 C 448 49 476 71 504 60 C 532 49 560 71 588 60 C 616 49 644 71 672 60 C 700 49 728 71 756 60 C 784 49 812 71 840 60"
                      fill="none" stroke="rgba(220,248,255,0.92)" strokeWidth="2.1" strokeLinecap="round"/>
                  </svg>
                </div>

                {/* Hull reflection — mirrors yachtFloat timing */}
                <div className="absolute pointer-events-none" aria-hidden="true" style={{
                  left: 18, bottom: 32, width: 90, height: 12,
                  borderRadius: "50%",
                  background: "radial-gradient(ellipse at 50% 0%, rgba(136,222,255,0.28) 0%, transparent 72%)",
                  filter: "blur(3px)",
                  transformOrigin: "50% 0%",
                  animation: "yachtFloat 6.8s ease-in-out infinite",
                }} />

                {/* Yacht SVG */}
                <div className="absolute" style={{
                  left: 10, bottom: 39, width: 110, height: 50,
                  transformOrigin: "42% 76%",
                  animation: "yachtFloat 6.8s ease-in-out infinite",
                }}>
                  <svg viewBox="0 0 360 160" fill="none" style={{
                    width: "100%", height: "100%", display: "block",
                    transformOrigin: "30% 74%",
                    filter: "drop-shadow(0 0 8px rgba(136,222,255,0.52))",
                    animation: "yachtHeading 6s ease-in-out infinite",
                  }}>
                    <defs>
                      <linearGradient id="yachtGlow" x1="34" y1="32" x2="332" y2="130" gradientUnits="userSpaceOnUse">
                        <stop offset="0" stopColor="#e8fbff"/><stop offset=".45" stopColor="#9ee6ff"/><stop offset="1" stopColor="#6cc8ff"/>
                      </linearGradient>
                    </defs>
                    <path fill="url(#yachtGlow)" fillOpacity=".24" d="M18 110L44 96C75 86 120 82 185 82H252C286 82 315 94 338 112L244 113C164 114 98 114 52 113C34 113 24 112 18 110Z"/>
                    <path fill="none" stroke="url(#yachtGlow)" strokeWidth="3.9" strokeOpacity=".2" strokeLinecap="round" strokeLinejoin="round" d="M18 110L44 96C75 86 120 82 185 82H252C286 82 315 94 338 112L244 113C164 114 98 114 52 113C34 113 24 112 18 110Z"/>
                    <path fill="none" stroke="url(#yachtGlow)" strokeWidth="1.75" strokeOpacity=".98" strokeLinecap="round" strokeLinejoin="round" d="M18 110L44 96C75 86 120 82 185 82H252C286 82 315 94 338 112L244 113C164 114 98 114 52 113C34 113 24 112 18 110Z"/>
                    <path fill="none" stroke="rgba(186,240,255,0.86)" strokeWidth="1.02" strokeLinecap="round" strokeLinejoin="round" d="M74 97C103 72 149 63 211 63H264C288 63 308 70 323 82"/>
                    <path fill="none" stroke="rgba(186,240,255,0.86)" strokeWidth="1.02" strokeLinecap="round" strokeLinejoin="round" d="M107 81C138 58 182 50 236 50H276C295 50 309 55 321 65"/>
                    <path fill="none" stroke="rgba(186,240,255,0.86)" strokeWidth="1.02" strokeLinecap="round" strokeLinejoin="round" d="M142 66C169 46 206 39 250 38H281C294 38 305 42 314 50"/>
                    <path fill="none" stroke="rgba(186,240,255,0.86)" strokeWidth="1.02" strokeLinecap="round" strokeLinejoin="round" d="M205 38C218 29 236 24 256 24C268 24 278 28 287 35"/>
                    <path fill="none" stroke="rgba(186,240,255,0.86)" strokeWidth="1.02" strokeLinecap="round" strokeLinejoin="round" d="M258 24V13M251 17H263"/>
                    <circle fill="none" stroke="rgba(186,240,255,0.86)" strokeWidth="1.02" cx="244" cy="27.5" r="4.2"/>
                    <circle fill="none" stroke="rgba(186,240,255,0.86)" strokeWidth="1.02" cx="274" cy="29.5" r="4.9"/>
                    <path fill="none" stroke="rgba(186,240,255,0.86)" strokeWidth="1.02" strokeLinecap="round" strokeLinejoin="round" d="M86 103C145 97 217 97 296 106"/>
                    <path fill="none" stroke="rgba(186,240,255,0.86)" strokeWidth="1.02" strokeLinecap="round" strokeLinejoin="round" d="M96 108H286"/>
                  </svg>
                </div>
              </div>

              {/* Eyebrow row */}
              <div className="flex items-center gap-3 relative -top-2">
                <p className="font-sans text-[0.52rem] uppercase tracking-[0.28em] whitespace-nowrap" style={{ color: "rgba(255,120,146,0.86)" }}>
                  Concierge Desk
                </p>
                <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(143,47,47,0.34), rgba(255,255,255,0.04))" }} />
              </div>

              {/* Title */}
              <h3 className="font-serif font-semibold text-white/94 leading-[1.12] max-w-[16ch]"
                style={{ fontSize: "clamp(1.42rem, 2vw, 1.88rem)", letterSpacing: "0.01em" }}>
                Let&apos;s shape your next journey.
              </h3>

              {/* Short copy */}
              <p className="font-sans text-[0.78rem] leading-[1.55] max-w-[28ch]" style={{ color: "rgba(252,249,248,0.62)", marginTop: "-0.04rem" }}>
                Designed for travelers who want precision, discretion, and seamless execution.
              </p>

              {/* Enter Luxe button */}
              <div className="mt-1">
                <Link
                  href="/luxe"
                  className="luxe-btn relative inline-flex items-center justify-center overflow-hidden font-brand font-bold uppercase transition-all duration-300 hover:-translate-y-px"
                  style={{
                    minWidth: "clamp(152px, 16.6vw, 176px)",
                    padding: "0.84rem 1.36rem 0.8rem",
                    borderRadius: 999,
                    border: "1px solid rgba(143,47,47,0.48)",
                    background: "linear-gradient(135deg, rgba(7,7,7,0.99) 0%, rgba(11,11,11,0.98) 72%, rgba(30,9,14,0.96) 100%)",
                    boxShadow: "0 0 0 1px rgba(143,47,47,0.16), 0 0 14px rgba(143,47,47,0.3), 0 12px 28px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,190,205,0.14)",
                    color: "rgba(252,249,248,0.97)",
                    fontSize: "0.67rem",
                    letterSpacing: "0.22em",
                    lineHeight: 1,
                    animation: "luxeGlow 2.4s ease-in-out infinite",
                  }}
                >
                  {/* Shimmer sweep — triggered by .luxe-btn:hover via CSS */}
                  <span className="luxe-btn-shimmer absolute inset-0 pointer-events-none" aria-hidden="true" />
                  Enter Luxe
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ─── RIGHT PANEL: Form ────────────────────────────────── */}
        <div className="flex items-center justify-center p-8 md:p-10 lg:p-16">
          <div
            className="relative w-full"
            style={{
              maxWidth: "580px",
              background: "rgba(255,255,255,0.032)",
              backdropFilter: "blur(22px) saturate(160%)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderTop: "1px solid rgba(255,255,255,0.12)",
              padding: "3rem 3rem 3.5rem",
              boxShadow: "0 24px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
          >
            {/* Glass sheen */}
            <div
              className="absolute inset-0 pointer-events-none mix-blend-screen opacity-40"
              style={{ background: "linear-gradient(118deg, rgba(255,255,255,0.08), transparent 32%)" }}
            />

            {!sent ? (
              <div className="relative z-10">
                {/* Header */}
                <div className="mb-8">
                  <p className="font-brand text-[9px] uppercase tracking-[0.38em] text-[#d3a65a] mb-3" style={{ opacity: 0.8 }}>
                    Send an Enquiry
                  </p>
                  <p className="font-serif text-white/40 leading-snug font-light" style={{ fontSize: "clamp(1rem, 2vw, 1.2rem)" }}>
                    Tell us where you want to go —<br />or just that you&apos;re thinking about it.
                  </p>
                </div>

                <form onSubmit={submit} className="space-y-4">

                  {/* Row 1: Name + Phone */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FloatInput label="Full Name *" value={form.name} onChange={(v) => updateField("name", v)} hasError={errors.name} errorMsg="Please enter your name" />
                    <FloatInput label="Phone / WhatsApp *" type="tel" value={form.phone} onChange={(v) => updateField("phone", v)} hasError={errors.phone} errorMsg="Enter a valid number" inputMode="tel" />
                  </div>

                  {/* Row 2: Email + DOB */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FloatInput label="Email Address" type="email" value={form.email} onChange={(v) => updateField("email", v)} hasError={errors.email} errorMsg="Enter a valid email" />
                    <DobPicker value={form.dob} onChange={(v) => updateField("dob", v)} />
                  </div>

                  {/* Row 3: Destination + Service */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FloatInput label="Destination *" value={form.destination} onChange={(v) => updateField("destination", v)} hasError={errors.destination} errorMsg="Please add a destination" />
                    <CustomSelect
                      label="Service Type *"
                      value={form.service}
                      options={serviceOptions}
                      onChange={(v) => updateField("service", v)}
                      hasError={errors.service}
                      placeholder="Select Service"
                    />
                  </div>

                  {/* Row 4: Month + Travelers + Budget */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <MonthPicker value={form.trip_month} onChange={(v) => updateField("trip_month", v)} hasError={errors.trip_month} />
                    <FloatInput label="Travelers *" type="number" value={form.travelers} onChange={(v) => updateField("travelers", v)} hasError={errors.travelers} errorMsg="Enter count" inputMode="numeric" min={1} max={500} />
                    <CustomSelect
                      label="Budget Range *"
                      value={form.budget}
                      options={budgetOptions}
                      onChange={(v) => updateField("budget", v)}
                      hasError={errors.budget}
                      placeholder="Select Budget"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <div className={`${fieldBase} focus-within:-translate-y-0.5`}>
                      <textarea
                        rows={4}
                        placeholder="Message"
                        value={form.message}
                        onChange={(e) => updateField("message", e.target.value)}
                        className="w-full bg-transparent border-none outline-none text-white/92 font-sans text-[0.92rem] pt-7 pb-3 px-4 placeholder-transparent resize-none peer"
                      />
                      <span className="absolute top-1.5 left-4 font-brand text-[0.55rem] uppercase tracking-[0.3em] text-white/40 pointer-events-none transition-all duration-200 peer-focus:text-white/74 peer-[:not(:placeholder-shown)]:text-white/74">
                        Your Message
                      </span>
                    </div>
                    <p className="mt-1.5 px-1 font-sans text-[0.6rem] tracking-[0.08em] text-white/40">
                      Include travel goals, preferred dates and any special requirements.
                    </p>
                  </div>

                  {/* Progress */}
                  <FormProgress form={form} />

                  {/* Trip Snapshot */}
                  <TripSnapshot form={form} />

                  {/* Divider */}
                  <div className="h-px my-6" style={{ background: "rgba(255,255,255,0.05)" }} />

                  {/* Form error */}
                  {formError && (
                    <div className="mb-4 rounded-lg border border-[#8f2f2f]/40 bg-[#8f2f2f]/8 px-4 py-3 font-sans text-sm text-[#8f2f2f]/90">
                      {formError}
                    </div>
                  )}

                  {/* Submit buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="submit"
                      disabled={isSending}
                      className="relative overflow-hidden font-brand text-[0.62rem] uppercase tracking-[0.27em] text-[#0a0a0a] font-bold py-4 px-5 disabled:opacity-50 transition-all duration-300"
                      style={{
                        background: "linear-gradient(135deg, rgba(227,194,104,0.98) 0%, rgba(211,166,90,0.96) 56%, rgba(154,120,44,0.96) 100%)",
                        border: "1px solid rgba(255,222,145,0.36)",
                        boxShadow: "0 12px 34px rgba(211,166,90,0.28), inset 0 1px 0 rgba(255,242,201,0.28)",
                      }}
                    >
                      {isSending ? "Sending…" : "Submit Details"}
                    </button>

                    <button
                      type="button"
                      onClick={openWhatsApp}
                      className="relative overflow-hidden font-brand text-[0.62rem] uppercase tracking-[0.27em] text-[#0a0a0a] font-bold py-4 px-5 transition-all duration-300"
                      style={{
                        background: "linear-gradient(135deg, rgba(227,194,104,0.98) 0%, rgba(211,166,90,0.96) 56%, rgba(154,120,44,0.96) 100%)",
                        border: "1px solid rgba(255,222,145,0.36)",
                        boxShadow: "0 12px 34px rgba(211,166,90,0.28), inset 0 1px 0 rgba(255,242,201,0.28)",
                      }}
                    >
                      Take to WhatsApp
                    </button>
                  </div>

                  {/* 24/7 support */}
                  <div className="flex items-center justify-center gap-2 mt-4 font-sans text-[0.58rem] uppercase tracking-[0.18em] text-white/52">
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0"
                      style={{ boxShadow: "0 0 0 0 rgba(74,222,128,0.45)", animation: "conciergePulse 2.2s ease-in-out infinite" }}
                    />
                    24/7 Support
                  </div>
                </form>
              </div>
            ) : (
              /* ── Success ── */
              <div className="relative z-10 text-center py-16">
                <div
                  className="w-[52px] h-[52px] rounded-full flex items-center justify-center mx-auto mb-7"
                  style={{ border: "1px solid rgba(211,166,90,0.4)" }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d3a65a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="font-serif text-4xl text-white italic font-light mb-3">Message received.</p>
                <p className="font-sans text-sm text-white/40 mb-8 max-w-xs mx-auto leading-relaxed">
                  We&apos;ll be in touch within 24 hours. Or reach us directly on WhatsApp.
                </p>
                <Link
                  href="https://wa.me/919811099951"
                  target="_blank"
                  className="inline-flex items-center gap-3 font-brand text-[11px] uppercase tracking-[0.3em] text-[#25D366] border border-[#25D366]/30 hover:border-[#25D366]/70 px-6 py-3 transition-all duration-300"
                >
                  Continue on WhatsApp
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Keyframe animations */}
      <style jsx>{`
        @keyframes introDotPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(211,166,90,0.34); }
          55% { box-shadow: 0 0 0 8px rgba(211,166,90,0); }
        }
        @keyframes conciergePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(74,222,128,0.45); opacity: 1; }
          60% { box-shadow: 0 0 0 8px rgba(74,222,128,0); opacity: 0.78; }
        }
        @keyframes starTwinkle {
          0%, 100% { opacity: 0.26; transform: scale(0.78); }
          50%       { opacity: 0.94; transform: scale(1.05); }
        }
        /* Each SVG is 200% wide (2 wave cycles). Translate -50% = one full cycle = seamless loop */
        @keyframes waveBandBack  { 0% { transform: translateX(0); }    100% { transform: translateX(50%); } }
        @keyframes waveBandMid   { 0% { transform: translateX(0); }    100% { transform: translateX(-50%); } }
        @keyframes waveBandFront { 0% { transform: translateX(0); }    100% { transform: translateX(-50%); } }
        @keyframes yachtFloat {
          0%, 100% { transform: translate3d(-0.6px, 0.4px, 0) rotate(-0.35deg); }
          50%       { transform: translate3d(2px, -1px, 0) rotate(0.18deg); }
        }
        @keyframes yachtHeading {
          0%, 100% { transform: translate3d(0, 0.3px, 0) scale(1); }
          50%       { transform: translate3d(0, -0.7px, 0) scale(1.006); }
        }
        @keyframes luxeGlow {
          0%, 100% {
            box-shadow: 0 0 0 1px rgba(143,47,47,0.18), 0 0 14px rgba(143,47,47,0.3),
              0 12px 28px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,190,205,0.14);
          }
          50% {
            box-shadow: 0 0 0 1px rgba(180,60,60,0.38), 0 0 28px rgba(180,60,60,0.55),
              0 0 48px rgba(160,40,40,0.22), 0 16px 34px rgba(0,0,0,0.66),
              inset 0 1px 0 rgba(255,210,220,0.28);
          }
        }
        @keyframes luxeScanLine {
          0%   { transform: translateY(0px);   opacity: 0; }
          5%   { opacity: 1; }
          90%  { opacity: 0.8; }
          100% { transform: translateY(220px); opacity: 0; }
        }
        .luxe-btn-shimmer {
          background: linear-gradient(105deg, transparent 34%, rgba(255,255,255,0.28) 50%, transparent 67%);
          transform: translateX(-130%);
          transition: transform 0.7s ease;
        }
        .luxe-btn:hover .luxe-btn-shimmer {
          transform: translateX(130%);
        }
      `}</style>
    </section>
  );
}
