# CSCBuddy Project Specification

## Document Info
- Version: `v0.1`
- Date: `2026-04-09`
- Source: Handwritten planning note provided by product owner
- Status: Draft for implementation

## Goal
Build a polished CSC billing and ticketing flow where each service entry is configurable by role/type, pricing is flexible, and payment tracking supports real-world partial settlement.

## Actors
- `Document Holder`
- `Reference Contact` (optional)
- `Operator`

## Key Assumptions
- "Each entry needs to be customizable at each level" means role-wise configuration for fields, defaults, visibility, and allowed actions.
- "No way to go to previous page" is a navigation bug in the current flow and must be fixed.
- "Home" and "Second / Go To Page" in the ticket area represent navigation destinations or modes during ticket creation.

## Functional Requirements

### <a id="req-001"></a>REQ-001: Beneficiary and Reference Context
Each entry must capture who the document belongs to and who is representing that person.
- Document holder (beneficiary) details are stored as the primary person
- Reference contact details are optional and stored separately when used
- Reference naming must be flexible text entered by the operator instead of forced fixed tags
- Reference context is informational metadata, not permission control

Related tasks: [T-01](./TODO.md#t-01), [T-02](./TODO.md#t-02), [T-03](./TODO.md#t-03)

### <a id="req-002"></a>REQ-002: Contact Number Capture
The flow must capture contact number for relevant entries.
- Add contact number field with validation
- Persist contact number with ticket/customer context

Related tasks: [T-04](./TODO.md#t-04)

### <a id="req-003"></a>REQ-003: Type-Based Listing
Users must be able to list/filter records by type.
- Type filter control
- Clear indicator of active filter
- List updates instantly when type changes

Related tasks: [T-05](./TODO.md#t-05)

### <a id="req-004"></a>REQ-004: Back Navigation Reliability
Users must be able to go to previous page from all ticket flow steps where expected.
- Back button visible and working
- Keyboard/browser back should not break state
- No dead-end pages

Related tasks: [T-06](./TODO.md#t-06)

### <a id="req-005"></a>REQ-005: Ticket Generation and Service Selection
Ticket generation flow must support clear service selection.
- Entry points include `Home` and `Second / Go To Page` behavior
- Service selection state persists while navigating
- Operator selection must show enough context (not vague)

Related tasks: [T-07](./TODO.md#t-07), [T-08](./TODO.md#t-08)

### <a id="req-006"></a>REQ-006: Per-Service Detail Capture
Each selected service must capture service-level details independently.
- Service-specific input groups
- Validation per service
- Clear separation between one service and another

Related tasks: [T-09](./TODO.md#t-09)

### <a id="req-007"></a>REQ-007: Quantity Logic by Service
Quantity must be configurable at service level and optionally per person.
- Service-wise quantity toggle (`enabled` / `disabled`)
- Quantity behavior per service can differ
- Prevent invalid quantity values

Related tasks: [T-10](./TODO.md#t-10)

### <a id="req-008"></a>REQ-008: Polished UI and Visibility Standards
UI should feel production-grade and visually clear.
- White background with blue-accent visual direction
- Dropdowns remain readable/visible in all states
- Consistent spacing, labels, and form hierarchy

Related tasks: [T-11](./TODO.md#t-11)

### <a id="req-009"></a>REQ-009: Rate Card and Negotiation Factor
Pricing engine must support default rates and negotiated adjustments.
- Base rate pulled from rate card
- Negotiation factor can increase/decrease price
- Rate variance by service/context supported

Related tasks: [T-12](./TODO.md#t-12), [T-13](./TODO.md#t-13)

### <a id="req-010"></a>REQ-010: Auto-Apply Rate During Ticket Creation
When creating ticket, rate should auto-populate from configured pricing logic.
- Auto-fill on service selection
- Recalculate on service/detail change
- Preserve manual override audit trail

Related tasks: [T-14](./TODO.md#t-14)

### <a id="req-011"></a>REQ-011: Partial Payment Support (Cash + UPI)
Payment module must support split and partial collection.
- Accept `Cash`, `UPI`, or mixed
- Handle partial payment across methods
- Maintain running pending balance up to date

Related tasks: [T-15](./TODO.md#t-15), [T-16](./TODO.md#t-16)

### <a id="req-013"></a>REQ-013: Ticket Document Status Tracking
Each ticket should include a document progress tracker.
- During ticket creation, provide quick checkbox presets for common docs (for example `Aadhaar`, `PAN`) to mark what was received
- Add document checklist items per ticket
- Mark each document as `required/optional`
- Mark each document as `submitted/pending`
- Show required-submitted progress in ticket views

Related tasks: [T-20](./TODO.md#t-20)

### <a id="req-012"></a>REQ-012: Ticket View/Edit/Expand With Structured Data
After ticket creation, users must be able to inspect and maintain ticket records with richer detail.
- View full ticket detail from dashboard
- Edit core ticket fields after creation (holder/reference/operator/payment mode)
- Expand/collapse ticket cards for deeper per-ticket context
- Store ticket data in a structured object layout for reliable downstream use

Related tasks: [T-18](./TODO.md#t-18), [T-19](./TODO.md#t-19)

## Data and Validation Rules
- Contact number format validated before submit.
- Quantity must be positive integer when enabled.
- Negotiation factor must be bounded by configurable limits.
- Ticket total = sum(service totals) - discount/+adjustment rules.
- Payment balance cannot go below zero.

## Non-Functional Requirements
- Forms should remain usable on desktop and mobile widths.
- State loss must be minimized during navigation.
- Input and dropdown controls must be keyboard accessible.
- UI feedback for errors must be immediate and clear.

## Acceptance Criteria Summary
- All `REQ-001` to `REQ-013` are implemented and demoable.
- Back navigation bug is resolved across all main flow steps.
- Service-wise quantity and service-wise detail capture work together without conflicts.
- Pricing auto-applies and still allows controlled adjustment.
- Partial mixed payments correctly update pending balance every time.

## Out of Scope for This Phase
- Full accounting integrations
- Multi-branch reporting dashboards
- Advanced role administration UI (basic config allowed)
