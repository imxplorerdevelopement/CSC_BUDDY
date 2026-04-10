# CSC Buddy — Master Implementation Prompt for Codex

## How to use this prompt

Read this entire document before writing a single line of code. Then implement **only Step 1**. When Step 1 is complete and working, stop and wait for confirmation before moving to Step 2. Continue this pattern through all steps.

Do not skip ahead. Do not combine steps. Each step must be fully working before the next begins.

---

## Project context

**What is CSC Buddy?**
CSC Buddy is a React + Vite single-page application for a Common Service Centre (CSC) located at Blue Sapphire Plaza, Greater Noida West. It is a billing, ticketing, and work management portal used by two operators: Navneet Mam (senior, established the centre) and Samar (joined 3 months ago).

**Tech stack:**
- React 18 with hooks
- Vite 5
- No backend. All state persists in `localStorage`.
- No UI library. All styling is inline CSS or a `<style>` block in the JSX.
- Single entry point: `csc_billing.jsx` (currently ~3000 lines — a monolith)
- `main.jsx` mounts `<CSCBilling />` from `csc_billing.jsx`
- `index.html` is the standard Vite HTML shell

**Current features (already built, do not break):**
- `TicketWorkspace` — two-step ticket creation flow (Step 1: intake details, Step 2: services + documents + payment)
- `TicketDashboard` — view, edit, expand, print, open/close tickets
- `RateCard` — edit service prices per category
- `B2BWorkspace` — placeholder tab (leave as-is)
- `NewEntry` and `Dashboard` — old components, currently orphaned (not rendered). Leave them in place but do not render them.
- `localStorage` persistence for tickets, services, active tab, side panel state, and ticket draft autosave
- Print-to-window ticket slip via `printTicketSlip()`
- Navigation: primary tabs (Service Entry, Rate Card) in the header; utility tabs (Ticket Dashboard, B2B Desk) in a slide-in side panel

**Visual direction:**
- Teal primary colour (#14B8A6 / #0F766E)
- White/light blue background
- Outfit font (loaded from Google Fonts)
- Rounded cards, soft shadows, clean spacing
- Desktop only — no mobile optimisation required

---

## User research summary — Navneet Mam

This portal is primarily designed for Navneet Mam, a 45+ year old woman who is educated and highly competent at real-world CSC work but not deeply tech-savvy. The following is a direct summary of her interview. Every feature below was derived from her actual words.

**Her daily workflow:**
1. Sits down, checks what work is pending from yesterday or earlier
2. Takes new walk-in customers, asks for their documents and phone number
3. Sends document requirements to customers via WhatsApp
4. Receives documents (often poor quality — selfies, unaligned scans, wrong format)
5. Manually compresses PDFs, converts PNG↔PDF, crops photos, resizes images — using 3–4 external websites
6. Fills government portal forms (e-Saathi, Digital Seva, estamping, PF, pension, dc.crsorgi, CSC e-district, and more)
7. Waits for acknowledgement/application number — which sometimes doesn't generate
8. When portals go down: takes payment from customer, tells them she'll call when it's ready, and somehow remembers
9. At end of day: wants to know total cash collected. That's the one number that matters.

**Her biggest pain points (in her own words):**
- "One document consumes my at least one and a half hours."
- "I have to go to multiple tabs and multiple websites for a single document."
- "The most important thing is everything in one place — one dashboard."
- She compresses PDFs and converts image formats 5+ times every day on external sites
- Customers send selfies instead of passport photos — she has to edit, crop, convert every time
- She traces returning customers through WhatsApp scroll history — there is no structured customer record
- When portals go down, she has taken payment but has no structured record of "work is stuck, follow up needed"
- Customers call daily asking about their application status — she has to remember it herself
- She uses ChatGPT to write affidavit content (50% of affidavits she has to compose herself)
- She has 7+ government portal links she uses daily — currently saved in browser bookmarks

**What she does NOT need:**
- Hindi language interface — English is fine
- Mobile optimisation — desktop only
- Operator-wise cash split — total is enough
- Any change to the current ticket creation flow — she understands it

---

## Complete feature plan

Below are all features to be built, in priority order. You will implement them one step at a time.

---

### Step 1 — Pending work dashboard (morning view)

**What it is:**
A new primary tab called "Today's Desk" that becomes the first tab she sees. It is her morning overview — one glance tells her everything she needs to start the day.

**What it shows:**
- A "Pending work" section listing all open tickets with: customer name, service(s), amount pending, and a status badge. Clicking a ticket opens it in Ticket Dashboard.
- A "Collected today" number — total cash + UPI collected from tickets created today.
- A "Still to collect" number — sum of `pendingBalance` across all open tickets.
- A count of open tickets vs closed tickets today.
- A "Portal down" section — tickets with status tag `"Portal Down"` shown separately and prominently.

**Implementation notes:**
- Add `"Today's Desk"` as the first tab in `TAB_CONFIG`, with `navGroup: "primary"`.
- Move it to the leftmost position in the primary nav tabs.
- The existing `"Service Entry"` tab remains — do not remove it.
- Filter "today's" tickets by matching `ticket.date` to `todayStr()`.
- "Pending work" means all tickets where `ticket.status === "Open"` — not just today's.
- A ticket is "Portal Down" if `ticket.portalDown === true` (this field will be added in Step 3 — for now, just reserve the section with an empty state message if none exist).
- This tab is purely a read/summary view. No editing happens here. All actions link through to Ticket Dashboard.

**Acceptance criteria:**
- New tab appears as the leftmost primary tab and is the default tab on load.
- Pending work list shows all open tickets with correct data.
- Today's collected and still-to-collect numbers are mathematically correct.
- Portal Down section renders correctly (empty state is fine for now).
- All existing tabs continue to work exactly as before.

---

### Step 2 — Customer record (persistent customer profiles)

**What it is:**
A new section — not a tab, but accessible from inside a ticket — that stores a persistent customer profile. When Navneet Mam opens a customer's ticket and clicks "View Customer Record", she sees everything about that person across all their tickets.

**What it shows:**
- Customer name and phone number
- All tickets ever created for this customer (with date, services, status, amount)
- Any acknowledgement numbers stored against their tickets (added in Step 5)
- Documents they have submitted in the past (from ticket document checklists)

**Implementation notes:**
- Customer identity is matched by phone number (10 digits). If no phone was captured, fall back to exact name match.
- Store customer profiles derived from existing tickets — do not add a separate customer creation flow. The profile is built automatically from ticket data.
- Add a `"View Customer Record"` button on each ticket card in `TicketDashboard` (alongside the existing View / Edit / Print buttons).
- Clicking it opens a customer detail panel above the ticket list (same pattern as the existing "Ticket View" panel).
- A customer record is read-only — edits happen through individual tickets.
- Persist nothing new in localStorage for this — derive everything from the existing `tickets` array.

**Acceptance criteria:**
- "View Customer Record" button appears on every ticket card in the dashboard.
- Clicking it shows a panel with the customer's full history derived from tickets.
- Works correctly when phone number is present and when it is absent (name fallback).
- No new localStorage keys introduced.
- All existing functionality unaffected.

---

### Step 3 — "Portal down" ticket state

**What it is:**
When a government portal goes down mid-work, Navneet Mam has already taken payment from the customer but cannot complete the submission. She needs a structured way to record this — not just a note in her head.

**What it does:**
- In `TicketWorkspace` Step 2 (the ticket building step), add a toggle: "Mark as portal down — submission pending".
- When toggled on, a text field appears: "Which portal is down?" (free text, e.g. "e-Saathi", "Digital Seva").
- This sets `ticket.portalDown = true` and `ticket.portalDownNote = "e-Saathi"` on the saved ticket.
- A "Portal Down" ticket is always `status: "Open"` — it cannot be saved as Closed while portalDown is true.
- In `TicketDashboard`, portal-down tickets show a distinct amber badge: "Portal Down".
- The "Today's Desk" tab (Step 1) shows these tickets in a separate highlighted section.
- When the portal comes back and work is submitted, she can open the ticket, uncheck "portal down", and close the ticket normally.

**Acceptance criteria:**
- Toggle and portal name field appear in Step 2 of ticket creation.
- Saving with portalDown = true always saves as Open, even if she clicked "Save and Complete".
- Portal Down badge is visible on ticket cards in the dashboard.
- Unchecking portalDown and saving as Closed works correctly.
- Today's Desk (Step 1) portal down section now shows these tickets.

---

### Step 4 — Quick links panel

**What it is:**
A permanent panel of one-click links to the government portals she uses every day. Lives inside the slide-in side panel (the utility menu that opens from the hamburger button).

**What it contains (default links — she can add more):**
1. e-Saathi — https://edistrict.up.gov.in
2. Digital Seva Portal — https://digitalseva.csc.gov.in
3. CSC e-District — https://edistrict.up.gov.in
4. Estamping — https://igrsup.gov.in
5. PF (EPFO) — https://www.epfindia.gov.in
6. Pension (NPS) — https://npscra.nsdl.co.in
7. dc.crsorgi — https://dc.crsorgi.gov.in
8. PDF Compressor — https://www.ilovepdf.com/compress_pdf
9. Image to PDF — https://www.ilovepdf.com/jpg_to_pdf
10. PDF to Image — https://www.ilovepdf.com/pdf_to_jpg

**Implementation notes:**
- Render these as a list of clickable link cards inside the existing side panel, below the utility nav items.
- Each card shows: site name, a short description (one line), and an "Open" button that opens the URL in a new tab.
- Add a small "+ Add link" button at the bottom. Clicking it shows an inline form: Name + URL fields + Save button. New links are saved to `localStorage` under key `"csc-buddy.quick-links"`.
- Default links are always present. User-added links appear after them. User-added links can be deleted; default links cannot.
- Links open with `window.open(url, '_blank')`.

**Acceptance criteria:**
- All 10 default links appear in the side panel and open correctly in a new tab.
- User can add a custom link — it persists after page refresh.
- User can delete a custom link — default links have no delete button.
- Side panel layout is not broken by the addition of these links.

---

### Step 5 — Acknowledgement number field on tickets

**What it is:**
After submitting a form on a government portal, an application number or acknowledgement number is generated. Navneet Mam currently writes this in her paper register or sends it to the customer on WhatsApp. It should live inside the ticket.

**What it does:**
- In `TicketDashboard`, on each open or closed ticket's expanded view, add an "Acknowledgement / Application No." field.
- It is an editable text input directly inline — no modal, no separate form.
- She types the number, presses Enter or clicks Save, and it is stored as `ticket.ackNumber` in the ticket.
- In the ticket view panel (the full "Ticket View" that opens when she clicks View), show the acknowledgement number prominently if it exists.
- In the printable ticket slip (`buildPrintableTicketHtml`), include the acknowledgement number if present.
- The customer record panel (Step 2) also shows acknowledgement numbers per ticket.

**Acceptance criteria:**
- Ack number field is editable inline on expanded ticket cards in the dashboard.
- Saving persists correctly via `localStorage`.
- Acknowledgement number appears in the Ticket View panel.
- Acknowledgement number appears on the printed slip.
- Field is optional — tickets without it display normally.

---

### Step 6 — Built-in document tools (PDF compressor + image converter)

**What it is:**
A new utility tab called "Doc Tools" accessible from the side panel (utility group). It contains browser-side tools she currently uses 5+ times a day on external websites.

**Tools to include:**

**Tool A — PDF compressor**
- Drag and drop or click to upload a PDF
- Show original file size
- Compress it client-side using `pdf-lib` (npm package: `pdf-lib`)
- Show compressed file size and compression ratio
- Download button for the compressed file
- Preset target buttons: "Under 50KB", "Under 100KB", "Under 200KB"

**Tool B — Image tools**
- Upload an image (JPG, PNG, WEBP)
- Options:
  - Convert to PDF (single image → PDF using pdf-lib)
  - Convert PDF to JPG (using pdf-lib + canvas rendering)
  - Resize to passport size (3.5cm × 4.5cm at 200dpi = 276×354px)
  - Compress image (reduce file size, keep format)
  - Download result

**Implementation notes:**
- All processing happens entirely in the browser — no server, no external API calls.
- Use `pdf-lib` for PDF operations. It is installable via npm.
- Use the browser's `Canvas` API for image operations.
- Add `"Doc Tools"` to `TAB_CONFIG` with `navGroup: "panel"` so it appears in the side panel utility menu.
- The tab should feel like a clean workbench — upload area prominent, tools clearly separated, results immediately visible.
- Handle errors gracefully: wrong file type, file too large (>10MB), failed compression.

**Acceptance criteria:**
- PDF upload and compression works and produces a downloadable result.
- Image-to-PDF conversion works.
- Passport photo resize works and produces correct pixel dimensions.
- All tools work without any internet connection (fully client-side).
- Error states display clearly.
- New tab appears in side panel and does not break existing navigation.

---

### Step 7 — Affidavit and rent agreement templates

**What it is:**
A new utility tab called "Templates" in the side panel. It gives Navneet Mam pre-written, fillable templates for the most common documents she has to compose — instead of opening ChatGPT each time.

**Templates to include:**

1. Affidavit — name correction (e.g. "My name is incorrectly recorded as X, correct name is Y")
2. Affidavit — address proof (e.g. "I reside at the following address since [date]")
3. Affidavit — date of birth correction
4. Affidavit — relationship declaration (e.g. "I declare that [name] is my [relation]")
5. Rent agreement — standard residential (12-month, with rent amount, security deposit, terms)
6. Character certificate — general purpose

**Implementation notes:**
- Each template has fillable placeholder fields (e.g. [Full Name], [Father's Name], [Date], [Address], [Amount]).
- The UI shows the template as a form: each placeholder becomes a labelled text input.
- As she fills in the fields, the document text updates live in a preview panel on the right.
- At the top of the template selector, two toggle buttons: "English" and "Hindi". Each template has both versions. Toggling switches the preview language.
- A "Copy text" button copies the completed document text to clipboard.
- A "Print" button opens the document in a new window formatted for A4 printing.
- Templates are read-only — she fills placeholders, she cannot edit the template structure itself.
- Add `"Templates"` to `TAB_CONFIG` with `navGroup: "panel"`.

**Acceptance criteria:**
- All 6 templates are available and selectable.
- Filling fields updates the preview in real time.
- English/Hindi toggle switches the template language correctly.
- Copy to clipboard works.
- Print opens a clean A4-formatted print window.
- Tab appears in the side panel correctly.

---

### Step 8 — End-of-day cash summary (always visible)

**What it is:**
A persistent summary bar at the bottom of every screen — always visible, always up to date — showing the one number Navneet Mam cares about most: total cash collected today.

**What it shows (left to right):**
- Total collected today (Cash + UPI combined) — large, prominent
- Cash only — smaller
- UPI only — smaller
- Pending (outstanding across all open tickets) — in amber
- Tickets closed today — count

**Implementation notes:**
- This is a fixed bar at the bottom of the page, always visible regardless of which tab is active.
- Height: approximately 52px. Compact but readable.
- Background: white with a subtle top border. Not the teal colour — keep it neutral so it doesn't compete with the content.
- "Today" is determined by matching `ticket.date === todayStr()`.
- Collected today = sum of `paidTotal` from tickets where `ticket.date === todayStr()`.
- Pending = sum of `pendingBalance` from all open tickets (not just today's).
- Update reactively — adding a new ticket or editing payment immediately updates the bar.
- On print (`@media print`), hide this bar.

**Acceptance criteria:**
- Bar is visible at the bottom of every tab.
- Numbers are correct and update immediately when tickets are added or edited.
- Pending figure is for all open tickets, not just today's.
- Bar is hidden on print.
- Does not overlap or obscure any content — page has enough bottom padding.

---

## General coding rules for all steps

1. Do not rewrite or restructure code that is not directly related to the feature being implemented. Surgical edits only.
2. Preserve all existing `localStorage` keys and data structures. Add new keys only when a new feature genuinely requires persistence.
3. All new components follow the existing inline-CSS style pattern of the codebase — no CSS modules, no Tailwind, no external UI libraries.
4. All new UI elements follow the existing visual language: teal accent (#14B8A6), white cards, rounded corners (12–18px), Outfit font, soft shadows.
5. After each step, confirm: all existing tabs load, all existing tickets render, localStorage data is intact.
6. If a step requires a new npm package, state which package and why before installing it.
7. Bill numbers (`generateBillNo`) and ticket numbers (`ticketNo`) — do not change the generation logic.
8. The `toStructuredTicket` and `withStructuredTicket` functions are central to data integrity — do not modify their output shape. You may add new top-level fields to tickets, but do not change existing structured fields.

---

## Start instruction

Begin with **Step 1 only**: the Pending Work Dashboard (Today's Desk tab).

Read the Step 1 spec carefully. Implement it completely. Test that:
- The new tab is the leftmost primary tab and is the default on load
- Pending work list is correct
- Today's collected / still-to-collect numbers are correct
- Portal Down section shows an empty state (no portal-down tickets exist yet)
- All existing tabs and features still work

When Step 1 is done, output a brief summary of what you changed and stop. Wait for confirmation before proceeding to Step 2.
