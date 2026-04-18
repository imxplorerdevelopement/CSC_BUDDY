# CSCBuddy Prioritized Fix Order

Date: 2026-04-18  
Scope: Current `csc_billing.jsx` app state, existing spec + TODO.

## Goal
Ship the highest-confidence improvements first, with special attention to:
- OCD-sensitive user friction (uncertainty, re-check loops, accidental-loss fear).
- Core reliability and maintainability risks for the team.

## Priority Method
- Impact: How much user pain or business risk this removes.
- Effort: Estimated implementation cost.
- Priority: Execute highest impact + lowest effort first.

## Phase 0: Quick Wins (high impact, low effort)

1. Remove forced page reload in walk-in flow
- Why: Reload breaks continuity and can trigger "did my draft survive?" anxiety.
- File: `csc_billing.jsx` (`handleWalkInStart`, `window.location.reload()`).
- Impact: High
- Effort: Low
- Acceptance:
  - Walk-in modal start takes user to entry flow without full refresh.
  - Draft appears immediately and consistently.

2. Add visible save and sync status
- Why: Autosave exists but confidence signal is weak.
- Files: `csc_billing.jsx`, `supabase.js`.
- Impact: High
- Effort: Low
- Acceptance:
  - Status chip shows states like `Saved locally`, `Syncing`, `Synced`, `Sync failed`.
  - Last-saved timestamp visible in entry and dashboard contexts.

3. Add safe delete pattern (confirm or undo)
- Why: One-click deletions increase accidental-loss stress.
- File: `csc_billing.jsx` (task and document remove actions).
- Impact: High
- Effort: Low
- Acceptance:
  - Deleting line item/document requires confirm OR supports 5-10 second undo.
  - No silent irreversible delete.

4. Rename ambiguous flow labels
- Why: `Home / Second / Go To Page` is hard to parse under pressure.
- File: `csc_billing.jsx` (flow map + nav labels).
- Impact: High
- Effort: Low
- Acceptance:
  - Labels become explicit (`Intake`, `Ticket Builder`, `Switch Workspace`).
  - Current location is always visible.

5. Make validation errors field-anchored
- Why: Top-level generic errors force users to scan and re-check.
- File: `csc_billing.jsx`.
- Impact: High
- Effort: Low
- Acceptance:
  - Invalid fields are highlighted inline with direct messages.
  - First invalid field receives focus on submit.

## Phase 1: Reliability and Functional Completeness

6. Surface Supabase failures in UI (not console only)
- Why: Hidden sync failures erode trust and cause repeated checking.
- Files: `supabase.js`, `csc_billing.jsx`.
- Impact: High
- Effort: Medium
- Acceptance:
  - Load/save errors show non-blocking toast/banner with retry action.
  - User knows whether data is local-only or cloud-synced.

7. Finish pricing logic wiring (rate context + negotiation)
- Why: Helpers exist but full flow behavior is still incomplete.
- Files: `csc_billing.jsx`, `docs/TODO.md` items T-12/T-13/T-14.
- Impact: High
- Effort: Medium
- Acceptance:
  - Ticket pricing uses configured base/context rates.
  - Negotiation factor is editable with guardrails and audit trail.
  - Recalculation is deterministic and visible.

8. Align visual implementation with spec direction
- Why: Spec requests white/blue direction; app currently uses dark/wine defaults.
- Files: `csc_billing.jsx`, `index.html`, `docs/PROJECT_SPEC.md`.
- Impact: Medium
- Effort: Medium
- Acceptance:
  - Either UI updated to match spec OR spec formally updated to match product intent.
  - Dropdown readability and contrast verified.

9. Complete regression checklist and release QA
- Why: No test script and checklist item still open.
- Files: `docs/TEST_CHECKLIST.md` (new), `docs/TODO.md` (T-17).
- Impact: High
- Effort: Medium
- Acceptance:
  - Repeatable smoke suite for intake, pricing, payment, dashboard edit flow.
  - Known edge cases documented and passed.

## Phase 2: Architecture and Team Velocity

10. Split `csc_billing.jsx` into focused modules
- Why: Current file size and state density slow safe change velocity.
- Suggested modules:
  - `components/entry/*`
  - `components/rates/*`
  - `components/dashboard/*`
  - `hooks/*` for storage/sync
  - `utils/*` for pricing/validation
- Impact: High
- Effort: High
- Acceptance:
  - No behavior change; same features with smaller bounded components.
  - Reduced merge conflicts and easier testing.

11. Remove dead/legacy paths or rewire intentionally
- Why: `NewEntry` and `Dashboard` remain but are not active main flow.
- File: `csc_billing.jsx`.
- Impact: Medium
- Effort: Medium
- Acceptance:
  - Legacy components removed or explicitly routed.
  - No duplicate business logic branches.

12. Add automated tests for critical logic
- Why: Pricing, payments, and structured ticket transforms are error-prone.
- Suggested coverage:
  - `toStructuredTicket`
  - payment status/pending calculations
  - quantity guardrails
  - service detail validation
- Impact: High
- Effort: High
- Acceptance:
  - Unit tests for core logic + at least one end-to-end smoke test.

## Suggested Order If You Only Do One Sprint
1. Items 1-5 (all Phase 0)
2. Item 6 (sync feedback)
3. Item 9 (regression checklist)
4. Item 7 (pricing completion)

