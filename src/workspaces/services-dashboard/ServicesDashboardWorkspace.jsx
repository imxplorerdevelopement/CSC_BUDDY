import React, { useCallback, useMemo, useState } from "react";
import { SD } from "./theme.js";
import { groupServicesByCategory } from "./registry.js";
import { ServiceRow } from "./ServiceRow.jsx";

/**
 * Services Dashboard — the centre's master service registry.
 *
 * Groups every service by category, numbers them within each group, and lets
 * the operator click any row to open a details panel beneath it. The details
 * panel is intentionally a placeholder right now; service information, rates,
 * and required documents will be added in a later pass.
 *
 * Multiple rows can be expanded at the same time so an operator can compare
 * two services side-by-side once the detail panels are populated.
 */
export function ServicesDashboardWorkspace() {
  const groups = useMemo(() => groupServicesByCategory(), []);
  const [expandedIds, setExpandedIds] = useState(() => new Set());

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

      <div style={{ display: "grid", gap: 20 }}>
        {groups.map((group) => (
          <CategoryBlock
            key={group.id}
            label={group.label}
            services={group.services}
            expandedIds={expandedIds}
            onToggle={toggle}
          />
        ))}
      </div>
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
        fontSize: "0.60rem",
        fontWeight: 700,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: SD.textSubtle,
      }}>
        Master Registry
      </div>
      <h2 style={{
        margin: 0,
        fontFamily: SD.brand,
        fontSize: "1.5rem",
        fontWeight: 700,
        color: SD.text,
        letterSpacing: "0.005em",
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

function CategoryBlock({ label, services, expandedIds, onToggle }) {
  return (
    <section style={{ display: "grid", gap: 10 }}>
      <div style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 10,
      }}>
        <h3 style={{
          margin: 0,
          fontFamily: SD.brand,
          fontSize: "1.02rem",
          fontWeight: 700,
          color: SD.text,
          letterSpacing: "0.01em",
        }}>
          {label}
        </h3>
        <span style={{
          fontFamily: SD.mono,
          fontSize: "0.72rem",
          color: SD.textSubtle,
          letterSpacing: "0.04em",
        }}>
          {services.length} service{services.length === 1 ? "" : "s"}
        </span>
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        {services.map((service, index) => (
          <ServiceRow
            key={service.id}
            serial={index + 1}
            label={service.label}
            expanded={expandedIds.has(service.id)}
            onToggle={() => onToggle(service.id)}
          />
        ))}
      </div>
    </section>
  );
}

export default ServicesDashboardWorkspace;
