import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "csc-buddy.document-tools.customer";
const DEFAULT_IDLE_MS = 20 * 60 * 1000;

/**
 * @typedef {Object} StoredCustomer
 * @property {string} name
 * @property {number} touchedAt  epoch ms of the last interaction
 */

function readFromStorage() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.name !== "string") return null;
    const touchedAt = Number(parsed.touchedAt) || 0;
    if (!parsed.name.trim() || !touchedAt) return null;
    return { name: parsed.name, touchedAt };
  } catch {
    return null;
  }
}

function writeToStorage(entry) {
  if (typeof window === "undefined") return;
  try {
    if (!entry) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  } catch {
    // Storage may be unavailable (private mode, quota) — not worth throwing.
  }
}

/**
 * Turn "Ramesh K." into a safe file-name prefix: "Ramesh_K".
 * Keeps alphanumerics and dashes, collapses everything else to underscores,
 * trims leading/trailing underscores, and caps length so filenames stay tidy.
 *
 * @param {string} raw
 * @returns {string}
 */
export function slugifyCustomerName(raw) {
  const text = String(raw || "").trim();
  if (!text) return "";
  const cleaned = text
    .replace(/[^A-Za-z0-9\-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return cleaned.slice(0, 40);
}

/**
 * Persistent customer context for the Document Tools workspace.
 *
 * Stores the operator-entered customer name in localStorage with an idle
 * timestamp. On mount (and on every minute tick) we check whether the stored
 * entry is older than `idleMs` and clear it if so, so a forgotten name does
 * not bleed across customers.
 *
 * @param {Object} [options]
 * @param {number} [options.idleMs]
 * @returns {{
 *   customerName: string,
 *   slug: string,
 *   setCustomerName: (name: string) => void,
 *   touch: () => void,
 *   clear: () => void,
 * }}
 */
export function useCustomerContext(options = {}) {
  const idleMs = options.idleMs ?? DEFAULT_IDLE_MS;
  const [customerName, setCustomerNameState] = useState(() => {
    const stored = readFromStorage();
    if (!stored) return "";
    if (Date.now() - stored.touchedAt > idleMs) {
      writeToStorage(null);
      return "";
    }
    return stored.name;
  });
  const touchedAtRef = useRef(Date.now());

  const persist = useCallback((name) => {
    const trimmed = String(name || "").trim();
    if (!trimmed) {
      writeToStorage(null);
      touchedAtRef.current = 0;
      return "";
    }
    const touchedAt = Date.now();
    touchedAtRef.current = touchedAt;
    writeToStorage({ name: trimmed, touchedAt });
    return trimmed;
  }, []);

  const setCustomerName = useCallback((name) => {
    const next = persist(name);
    setCustomerNameState(next);
  }, [persist]);

  const clear = useCallback(() => {
    persist("");
    setCustomerNameState("");
  }, [persist]);

  const touch = useCallback(() => {
    if (!customerName) return;
    const touchedAt = Date.now();
    touchedAtRef.current = touchedAt;
    writeToStorage({ name: customerName, touchedAt });
  }, [customerName]);

  useEffect(() => {
    if (!idleMs) return undefined;
    const timer = setInterval(() => {
      if (!customerName) return;
      if (Date.now() - touchedAtRef.current > idleMs) {
        writeToStorage(null);
        setCustomerNameState("");
      }
    }, 60 * 1000);
    return () => clearInterval(timer);
  }, [customerName, idleMs]);

  return {
    customerName,
    slug: slugifyCustomerName(customerName),
    setCustomerName,
    touch,
    clear,
  };
}
