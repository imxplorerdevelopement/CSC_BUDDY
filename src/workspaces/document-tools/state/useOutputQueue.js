import { useCallback, useEffect, useRef, useState } from "react";

/**
 * @typedef {Object} OutputEntry
 * @property {string} id
 * @property {string} name        suggested filename (editable by operator)
 * @property {Blob} blob
 * @property {string} url         object URL; revoked on removal / unmount
 * @property {number} size        bytes
 * @property {string} toolId      which tool produced it
 * @property {string} [meta]      short one-line summary shown in queue card
 * @property {number} createdAt   epoch ms
 */

/**
 * Manages the right-rail output queue. Handles URL lifecycle, naming,
 * bulk operations, and auto-purge after the configured TTL.
 *
 * @param {Object} [options]
 * @param {number} [options.ttlMs=30*60*1000]  auto-purge after this many ms (privacy default: 30 min)
 * @returns {{
 *   outputs: OutputEntry[],
 *   push: (entry: Omit<OutputEntry, "id"|"url"|"createdAt"|"size">) => OutputEntry,
 *   remove: (id: string) => void,
 *   clear: () => void,
 *   rename: (id: string, nextName: string) => void,
 * }}
 */
export function useOutputQueue(options = {}) {
  const ttlMs = options.ttlMs ?? 30 * 60 * 1000;
  const [outputs, setOutputs] = useState([]);
  // Keep the latest outputs in a ref so the purge timer reads current state without re-subscribing.
  const outputsRef = useRef(outputs);
  useEffect(() => {
    outputsRef.current = outputs;
  }, [outputs]);

  useEffect(() => () => {
    // Revoke all URLs on unmount so we don't leak blob memory.
    outputsRef.current.forEach((entry) => URL.revokeObjectURL(entry.url));
  }, []);

  useEffect(() => {
    if (!ttlMs) return undefined;
    const timer = setInterval(() => {
      const cutoff = Date.now() - ttlMs;
      const current = outputsRef.current;
      const expired = current.filter((entry) => entry.createdAt < cutoff);
      if (!expired.length) return;
      expired.forEach((entry) => URL.revokeObjectURL(entry.url));
      setOutputs((prev) => prev.filter((entry) => entry.createdAt >= cutoff));
    }, 60 * 1000);
    return () => clearInterval(timer);
  }, [ttlMs]);

  const push = useCallback((entry) => {
    const url = URL.createObjectURL(entry.blob);
    const record = {
      id: `out_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
      size: entry.blob?.size ?? 0,
      url,
      name: entry.name,
      blob: entry.blob,
      toolId: entry.toolId,
      meta: entry.meta,
    };
    setOutputs((prev) => [record, ...prev]);
    return record;
  }, []);

  const remove = useCallback((id) => {
    setOutputs((prev) => {
      const target = prev.find((entry) => entry.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((entry) => entry.id !== id);
    });
  }, []);

  const clear = useCallback(() => {
    setOutputs((prev) => {
      prev.forEach((entry) => URL.revokeObjectURL(entry.url));
      return [];
    });
  }, []);

  const rename = useCallback((id, nextName) => {
    setOutputs((prev) => prev.map((entry) => (
      entry.id === id ? { ...entry, name: String(nextName || entry.name) } : entry
    )));
  }, []);

  return { outputs, push, remove, clear, rename };
}
