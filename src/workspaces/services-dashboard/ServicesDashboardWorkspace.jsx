import React, { useCallback, useMemo, useState } from "react";
import { SD } from "./theme.js";
import { groupServicesByCategory, SERVICE_REGISTRY } from "./registry.js";
import { ServiceRow } from "./ServiceRow.jsx";

// IDs of the four most-used services shown as quick suggestions.
const TOP_SUGGESTION_IDS = [
  "pan_fresh_adult",
  "aadhaar_address_update",
  "cert_income",
  "inhouse_photocopy_bw",
];

export function ServicesDashboardWorkspace({ services: servicesProp } = {}) {
  const groups = useMemo(() => {
    if (Array.isArray(servicesProp) && servicesProp.length > 0) {
      const categoryMap = new Map();
      servicesProp.forEach((svc) => {
        const cat = String(svc.category || "Other").trim() || "Other";
        if (!categoryMap.has(cat)) {
          categoryMap.set(cat, { id: cat, label: cat, services: [] });
        }
        categoryMap.get(cat).services.push({ id: svc.id, label: svc.name || svc.id, ...svc });
      });
      return Array.from(categoryMap.values());
    }
    return groupServicesByCategory();
  }, [servicesProp]);

  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [query, setQuery] = useState("");

  const toggle = useCallback((id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const totalServices = useMemo(
    () => groups.reduce((sum, g) => sum + g.services.length, 0),
    [groups],
  );

  // Flat list of all services for search
  const allServices = useMemo(
    () => groups.flatMap((g) => g.services.map((s) => ({ ...s, categoryLabel: g.label }))),
    [groups],
  );

  const topSuggestions = useMemo(
    () => TOP_SUGGESTION_IDS
      .map((id) => allServices.find((s) => s.id === id))
      .filter(Boolean),
    [allServices],
  );

  const trimmed = query.trim().toLowerCase();

  const searchResults = useMemo(() => {
    if (!trimmed) return null;
    return allServices.filter((s) =>
      s.label.toLowerCase().includes(trimmed) ||
      (s.categoryLabel || "").toLowerCase().includes(trimmed)
    );
  }, [allServices, trimmed]);

  return (
    <div style={{
      maxWidth: SD.pageMaxWidth,
      margin: "0 auto",
      padding: "4px 4px 32px",
      display: "grid",
      gap: 18,
      fontFamily: SD.font,
      color: SD.text,
    }}>
      <Header totalServices={totalServices} categoryCount={groups.length} />

      <SearchBar query={query} onChange={setQuery} />

      {/* Search results */}
      {searchResults !== null && (
        <section style={{ display: "grid", gap: 8 }}>
          <div style={{
            fontFamily: SD.mono,
            fontSize: "0.72rem",
            color: SD.textSubtle,
            letterSpacing: "0.04em",
          }}>
            {searchResults.length === 0
              ? "No services match that search."
              : `${searchResults.length} result${searchResults.length === 1 ? "" : "s"}`}
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {searchResults.map((service, index) => (
              <ServiceRow
                key={service.id}
                serial={index + 1}
                service={service}
                expanded={expandedIds.has(service.id)}
                onToggle={() => toggle(service.id)}
                categoryLabel={service.categoryLabel}
              />
            ))}
          </div>
        </section>
      )}

      {/* Top suggestions (only when not searching) */}
      {searchResults === null && topSuggestions.length > 0 && (
        <section style={{ display: "grid", gap: 8 }}>
          <div style={{
            fontFamily: SD.brand,
            fontSize: "0.62rem",
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: SD.textSubtle,
          }}>
            Most Used
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {topSuggestions.map((service, index) => (
              <ServiceRow
                key={`top_${service.id}`}
                serial={index + 1}
                service={service}
                expanded={expandedIds.has(`top_${service.id}`)}
                onToggle={() => toggle(`top_${service.id}`)}
                categoryLabel={service.categoryLabel}
              />
            ))}
          </div>
        </section>
      )}

      {/* Full grouped list (only when not searching) */}
      {searchResults === null && (
        <div style={{ display: "grid", gap: 20 }}>
          {groups.map((group) => (
            <CategoryBlock
              key={group.id}
              label={group.label}
              helper={group.helper}
              services={group.services}
              expandedIds={expandedIds}
              onToggle={toggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SearchBar({ query, onChange }) {
  return (
    <div style={{ position: "relative" }}>
      <span style={{
        position: "absolute",
        left: 12,
        top: "50%",
        transform: "translateY(-50%)",
        color: SD.textSubtle,
        display: "flex",
        alignItems: "center",
        pointerEvents: "none",
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </span>
      <input
        type="text"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search services..."
        style={{
          width: "100%",
          boxSizing: "border-box",
          fontFamily: SD.font,
          fontSize: "0.90rem",
          color: SD.text,
          background: SD.surfaceSubtle,
          border: `1px solid ${query ? SD.borderAccent : SD.border}`,
          borderRadius: SD.rMd,
          padding: "10px 36px 10px 36px",
          outline: "none",
          transition: "border-color 140ms ease",
        }}
        onFocus={(e) => { e.target.style.borderColor = SD.borderAccent; e.target.style.background = SD.surface; }}
        onBlur={(e) => { e.target.style.borderColor = query ? SD.borderAccent : SD.border; e.target.style.background = SD.surfaceSubtle; }}
      />
      {query && (
        <button
          type="button"
          onClick={() => onChange("")}
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: SD.textSubtle,
            display: "flex",
            alignItems: "center",
            padding: 4,
          }}
          title="Clear"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      )}
    </div>
  );
}

function Header({ totalServices, categoryCount }) {
  return (
    <div style={{
      borderBottom: `1px solid ${SD.borderSoft}`,
      paddingBottom: 14,
      display: "grid",
      gap: 6,
    }}>
      <div style={{
        fontFamily: SD.brand,
        fontSize: "0.62rem",
        fontWeight: 700,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: SD.textSubtle,
      }}>
        Master Registry
      </div>
      <h2 style={{
        margin: 0,
        fontFamily: SD.brand,
        fontSize: "1.5rem",
        fontWeight: 800,
        color: SD.text,
        letterSpacing: "-0.01em",
      }}>
        Services Dashboard
      </h2>
      <div style={{
        fontSize: "0.88rem",
        color: SD.textMuted,
        lineHeight: 1.5,
        maxWidth: 560,
      }}>
        Every service the centre offers, grouped by category. Click a service to open its details panel.
      </div>
      <div style={{
        marginTop: 4,
        fontFamily: SD.mono,
        fontSize: "0.76rem",
        color: SD.textSubtle,
      }}>
        {totalServices} services · {categoryCount} categories
      </div>
    </div>
  );
}

function CategoryBlock({ label, helper, services, expandedIds, onToggle }) {
  return (
    <section style={{ display: "grid", gap: 10 }}>
      <div style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 10,
      }}>
        <div style={{ display: "grid", gap: 3 }}>
          <h3 style={{
            margin: 0,
            fontFamily: SD.brand,
            fontSize: "1.0rem",
            fontWeight: 700,
            color: SD.text,
            letterSpacing: "0.01em",
          }}>
            {label}
          </h3>
          {helper && (
            <span style={{
              fontFamily: SD.mono,
              fontSize: "0.70rem",
              color: SD.textSubtle,
              lineHeight: 1.5,
            }}>
              {helper}
            </span>
          )}
        </div>
        <span style={{
          fontFamily: SD.mono,
          fontSize: "0.72rem",
          color: SD.textSubtle,
          letterSpacing: "0.04em",
          flexShrink: 0,
        }}>
          {services.length} service{services.length === 1 ? "" : "s"}
        </span>
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        {services.map((service, index) => (
          <ServiceRow
            key={service.id}
            serial={index + 1}
            service={service}
            expanded={expandedIds.has(service.id)}
            onToggle={() => onToggle(service.id)}
          />
        ))}
      </div>
    </section>
  );
}

export default ServicesDashboardWorkspace;
