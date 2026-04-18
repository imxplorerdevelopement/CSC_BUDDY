# OCD-Friendly UX Checklist for CSCBuddy

Date: 2026-04-18  
Use this checklist before each release and after major UX changes.

## 1) Predictability and Orientation
- [ ] Current step is always explicit (`Intake`, `Ticket Builder`, `Payment`, etc.).
- [ ] Navigation labels are concrete and non-ambiguous.
- [ ] Progress indicators match actual flow state.
- [ ] Browser back behavior does not drop user into confusing states.

## 2) Reassurance and Save Confidence
- [ ] A persistent status shows `Saved locally`, `Syncing`, `Synced`, or `Sync failed`.
- [ ] Last-saved timestamp is visible.
- [ ] User can continue when offline/local-only, with clear notice.
- [ ] Sync failures are visible in UI (not only console logs).

## 3) Error Clarity and Recovery
- [ ] Validation errors appear next to the exact field.
- [ ] First invalid field is auto-focused on submit.
- [ ] Error copy explains action needed, not just failure.
- [ ] Error state clears immediately after valid correction.

## 4) Safety for Destructive Actions
- [ ] Deleting items/documents requires confirm OR offers undo.
- [ ] High-risk actions are visually distinct from normal actions.
- [ ] User gets immediate feedback after deletion and recovery option.
- [ ] No irreversible action is triggered by accidental click.

## 5) Input Constraints and Data Integrity
- [ ] Phone input is constrained consistently everywhere.
- [ ] Quantity min/max and service rules are shown before submit.
- [ ] Overpayment and zero-price safeguards are clear and actionable.
- [ ] Numeric fields prevent invalid values without surprising resets.

## 6) Sensory Load and Visual Calm
- [ ] Colors, contrast, and typography remain consistent across tabs.
- [ ] Motion is subtle and can be reduced if needed.
- [ ] Important alerts use one consistent style system.
- [ ] No crowded card blocks with competing high-emphasis styles.

## 7) Keyboard and Accessibility
- [ ] All main actions are keyboard reachable.
- [ ] Focus state is visible on buttons, inputs, and step controls.
- [ ] Dialogs and drawers trap focus and close predictably.
- [ ] Icons and status chips are not color-only cues.

## 8) Decision Friction Reduction
- [ ] Default choices are sensible and transparent.
- [ ] Optional fields are clearly marked optional.
- [ ] Required fields are validated early, not only at final submit.
- [ ] Similar actions are grouped and named consistently.

## 9) Auditability and Trust
- [ ] Ticket save/update time is visible.
- [ ] Payment changes can be traced and verified.
- [ ] Structured ticket data shown in dashboard matches saved values.
- [ ] Print/export output mirrors in-app data exactly.

## 10) Release Gate (Go/No-Go)
- [ ] Intake flow passed manual smoke test.
- [ ] Ticket creation and edit flow passed.
- [ ] Partial payment and pending balance scenarios passed.
- [ ] Sync error simulation tested (network off / Supabase failure).
- [ ] No known blocker remains for data loss or mistaken save.

## Practical Rule
If any item in sections 2, 3, or 4 is unchecked, release should be blocked for operations use.

