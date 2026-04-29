# Vendor Dashboard Fix TODO

## Scope
- Fix Vendor Dashboard entry deletion so deleted B2B/vendor ledger entries stay deleted after refresh.
- Remove service subtitle/description lines from the Vendor Dashboard vendor detail header area.
- Fix home appointment reminders so appointments booked for today are visible, not only tomorrow.
- Reconstruct Ticket Dashboard browsing so tickets are separated by status and grouped by Today, Yesterday, and Older.

## Root Cause
- Vendor delete was only filtering React state in `deleteB2BLedgerEntry`.
- Unlike some save paths, it did not immediately write the updated `b2b_ledger` to session storage or enqueue a cloud save with the new source-of-truth array.
- If the app refreshed before the effect-driven sync completed, Supabase `app_config.b2b_ledger` still had the deleted entry, so load fetched it back.
- Appointment home reminders only calculated `tomorrowAppts`; there was no `todayAppts` branch.
- The Vendor Dashboard detail view rendered a services summary block under the vendor name, causing unwanted subtitles/descriptions to appear.

## Fix Strategy
- On B2B add/delete, compute the next ledger array inside the state updater.
- Immediately write `serializeB2BLedger(next)` to local session storage.
- Immediately call `enqueueCloudSave("b2b_ledger", serializeB2BLedger(next))`.
- Keep the existing backend model: `app_config` stores the full `b2b_ledger` array by key through the existing save API.
- Remove only the vendor services summary block from the detail view; keep vendor names, badges, totals, entries, and actions intact.
- Add today appointment reminder support using local date keys via `getTicketCounterDateKey`.

## Code Changes
- `csc_billing.jsx`
  - Updated `addB2BLedgerEntry` to persist immediately.
  - Updated `deleteB2BLedgerEntry` to persist immediately.
  - Removed the Vendor Dashboard services/subtitle block under the selected vendor header.
  - Added `todayAppts`, `reminderAppts`, and `reminderIsToday` in `HomeLaunchpad`.
  - Updated the home reminder card to show today appointments first, otherwise tomorrow appointments.
  - Added Ticket Dashboard status filters for All, Open, and Closed.
  - Added Ticket Dashboard date filters for All Dates, Today, Yesterday, and Older.
  - Replaced the mixed ticket stream with Open Tickets and Closed Tickets sections.
  - Grouped each status section by Today, Yesterday, and Older.
  - Added visible Open/Closed badges to ticket cards and the selected ticket detail header.
  - Strengthened the selected ticket card state with border, accent bar, and active View label.

## Backend/API Considerations
- No new API endpoint is required.
- Existing `/api/app-config/save` already hard-persists the full value by upserting `key = "b2b_ledger"`.
- This is a hard delete at the array/source-of-truth level, not a soft delete.
- If cloud save fails, UI state still updates locally, but the cloud sync badge should show failure through the existing sync state.

## Verification Checklist
- [ ] Add a Vendor Dashboard entry, refresh, and confirm it remains.
- [ ] Delete that entry, enter the access code, and confirm it disappears immediately.
- [ ] Refresh the page/window and confirm the deleted entry does not return.
- [ ] Confirm Supabase `app_config` row for `b2b_ledger` no longer contains the deleted entry id.
- [x] Open Vendor Dashboard code path and confirm the selected vendor service subtitle block was removed.
- [ ] Book an appointment for today and confirm the home screen shows a Today appointment reminder.
- [ ] Book only a tomorrow appointment and confirm the home screen still shows the Tomorrow reminder.
- [x] Run production build with `npm.cmd run build`.
- [x] Confirm Ticket Dashboard build passes after status/date grouping implementation.
- [ ] Manually verify Ticket Dashboard with mixed open/closed tickets across today, yesterday, and older dates.
