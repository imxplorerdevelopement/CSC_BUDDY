# CSCBuddy Implementation TODO

## How To Use This List
- Priority order is `P0` then `P1` then `P2`.
- Every task links back to requirement IDs in `PROJECT_SPEC.md`.
- Update task status as work progresses: `[ ]` not started, `[~]` in progress, `[x]` done.

## P0 - Core Flow and Blocking Issues

### <a id="t-01"></a>[x] T-01: Define beneficiary/reference data schema
- Priority: `P0`
- Spec links: [REQ-001](./PROJECT_SPEC.md#req-001)
- Deliverable: Schema for document holder plus reference person and reference type metadata.
- Suggested files: `csc_billing.jsx` (or extracted config module).

### <a id="t-02"></a>[x] T-02: Apply beneficiary/reference capture in ticket form
- Priority: `P0`
- Spec links: [REQ-001](./PROJECT_SPEC.md#req-001)
- Deliverable: Form captures document holder and reference details with clear separation.
- Suggested files: `csc_billing.jsx`.

### <a id="t-03"></a>[x] T-03: Surface reference metadata across ticket flow
- Priority: `P0`
- Spec links: [REQ-001](./PROJECT_SPEC.md#req-001)
- Deliverable: Selected reference type/name is shown in ticket context and slip outputs.
- Suggested files: `csc_billing.jsx`.

### <a id="t-04"></a>[x] T-04: Add contact number field with validation
- Priority: `P0`
- Spec links: [REQ-002](./PROJECT_SPEC.md#req-002)
- Deliverable: Contact number appears where needed, validates, persists in ticket form state.
- Suggested files: `csc_billing.jsx`.

### <a id="t-05"></a>[ ] T-05: Build type-based listing filter
- Priority: `P0`
- Spec links: [REQ-003](./PROJECT_SPEC.md#req-003)
- Deliverable: Filter control and real-time list update by type.
- Suggested files: `csc_billing.jsx`.

### <a id="t-06"></a>[ ] T-06: Fix back navigation across flow
- Priority: `P0`
- Spec links: [REQ-004](./PROJECT_SPEC.md#req-004)
- Deliverable: Consistent previous-page behavior without state corruption.
- Suggested files: `csc_billing.jsx`, `main.jsx`.

### <a id="t-07"></a>[ ] T-07: Clarify ticket entry points (`Home` / `Second / Go To Page`)
- Priority: `P0`
- Spec links: [REQ-005](./PROJECT_SPEC.md#req-005)
- Deliverable: Explicit navigation map and implemented route/state transitions.
- Suggested files: `csc_billing.jsx`, `main.jsx`.

### <a id="t-08"></a>[ ] T-08: Improve operator selection card information density
- Priority: `P0`
- Spec links: [REQ-005](./PROJECT_SPEC.md#req-005)
- Deliverable: Operator cards show meaningful context (name/type/rate/status at minimum).
- Suggested files: `csc_billing.jsx`.

## P1 - Service Detail, Quantity, and Pricing Logic

### <a id="t-09"></a>[ ] T-09: Add per-service detail sections
- Priority: `P1`
- Spec links: [REQ-006](./PROJECT_SPEC.md#req-006)
- Deliverable: Each service stores independent detail payload and validation errors.
- Suggested files: `csc_billing.jsx`.

### <a id="t-10"></a>[ ] T-10: Implement service-wise quantity toggles and rules
- Priority: `P1`
- Spec links: [REQ-007](./PROJECT_SPEC.md#req-007)
- Deliverable: Quantity enable/disable per service plus correct validation and totals impact.
- Suggested files: `csc_billing.jsx`.

### <a id="t-11"></a>[ ] T-11: Polish UI theme and dropdown visibility
- Priority: `P1`
- Spec links: [REQ-008](./PROJECT_SPEC.md#req-008)
- Deliverable: White/blue visual refresh, readable dropdowns, consistent spacing and labels.
- Suggested files: `csc_billing.jsx`, `index.html`.

### <a id="t-12"></a>[ ] T-12: Create rate card model and lookup helpers
- Priority: `P1`
- Spec links: [REQ-009](./PROJECT_SPEC.md#req-009)
- Deliverable: Utility/state layer for base rate fetch by service/context.
- Suggested files: `csc_billing.jsx` (or new helper file).

### <a id="t-13"></a>[ ] T-13: Add negotiation factor control with guardrails
- Priority: `P1`
- Spec links: [REQ-009](./PROJECT_SPEC.md#req-009)
- Deliverable: Adjustable factor updates totals and respects min/max constraints.
- Suggested files: `csc_billing.jsx`.

### <a id="t-14"></a>[ ] T-14: Auto-apply rates during ticket creation
- Priority: `P1`
- Spec links: [REQ-010](./PROJECT_SPEC.md#req-010)
- Deliverable: Rates auto-fill and recompute on relevant state changes.
- Suggested files: `csc_billing.jsx`.

## P2 - Payments, Hardening, and QA

### <a id="t-15"></a>[x] T-15: Implement mixed payment entry (`Cash` + `UPI`)
- Priority: `P2`
- Spec links: [REQ-011](./PROJECT_SPEC.md#req-011)
- Deliverable: User can split amount across multiple methods in one ticket.
- Suggested files: `csc_billing.jsx`.

### <a id="t-16"></a>[x] T-16: Add pending balance tracker for partial payments
- Priority: `P2`
- Spec links: [REQ-011](./PROJECT_SPEC.md#req-011)
- Deliverable: Remaining balance updates correctly after each payment edit.
- Suggested files: `csc_billing.jsx`.

### <a id="t-17"></a>[ ] T-17: Add regression test checklist and manual QA pass
- Priority: `P2`
- Spec links: [REQ-001](./PROJECT_SPEC.md#req-001), [REQ-011](./PROJECT_SPEC.md#req-011)
- Deliverable: Smoke checklist covering navigation, pricing, and payment edge cases.
- Suggested files: `docs/TEST_CHECKLIST.md` (new), project notes.

### <a id="t-18"></a>[x] T-18: Add ticket `View`, `Edit`, and `Expand` controls
- Priority: `P1`
- Spec links: [REQ-012](./PROJECT_SPEC.md#req-012)
- Deliverable: Dashboard supports direct view/edit/expand operations on created tickets.
- Suggested files: `csc_billing.jsx`.

### <a id="t-19"></a>[x] T-19: Introduce structured ticket payload
- Priority: `P1`
- Spec links: [REQ-012](./PROJECT_SPEC.md#req-012)
- Deliverable: Tickets include normalized nested `structured` data for metadata, parties, payment, and services.
- Suggested files: `csc_billing.jsx`.

### <a id="t-20"></a>[x] T-20: Add ticket-level document status tracker
- Priority: `P1`
- Spec links: [REQ-013](./PROJECT_SPEC.md#req-013)
- Deliverable: Ticket flow supports required/submitted document checklist and progress summaries in dashboard views.
- Suggested files: `csc_billing.jsx`.

## Execution Sequence
1. Complete `T-01` through `T-08` to stabilize the main ticket flow.
2. Complete `T-09` through `T-14` to finalize service logic and pricing.
3. Complete `T-15` through `T-17` for payment reliability and release readiness.

## Change Management Rule
- If a new requirement is added to `PROJECT_SPEC.md`, add a new `T-*` item here with a spec link before implementation starts.
