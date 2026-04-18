# IMxplorer — The Travel Co. · Design System

IMxplorer is a **customized, people-led luxury travel company** based in Greater Noida, India. Founded in 2019 and operational since 2022, the team designs every journey from scratch — flights, stays, visas, transport, cruises, insurance, MICE, and student travel — coordinated around real client needs rather than fixed packages.

The defining positioning line:

> **"We are not a tech platform. We are a people business."**
> *One-on-one consultation, flawless execution. The care is the luxury.*

This is **not** a modern-SaaS-minimal brand, nor a travel-OTA brand. It is editorial, cinematic, warm, and confident — closer to a luxury magazine or a heritage hotel site than to Booking.com. Dark backgrounds, big italic serifs, warm gold and wine-red accents, full-bleed imagery, scroll-driven storytelling.

---

## Products / Surfaces represented

There is **one primary surface**: the marketing + enquiry website at `imxplorer.com` (Next.js 16 App Router). The codebase contains:

- **Homepage** — scroll-driven narrative (Hero → We Care → Philosophy → Services 5-pillar auto-cycler → Journey road → Concierge/HNI → Trusted-by marquee → Footer)
- **/services** — hero + stats row + five-pillar expandable list + bespoke CTA strip
- **/about** — leadership + values
- **/blogs** — post listing with day/night theme toggle
- **/destinations/\*** — per-country hero + content pages (India, Dubai, Norway, UK, USA, Japan, Australia)
- **/contact** — multi-step inquiry flow by type (luxury, study, corporate, visa) + globe
- **/luxe** — concierge / HNI landing
- **Legal** — privacy, terms, cookie, cancellation/refund

There is **no mobile app** in the repo. There is a separate repo `CSC_BUDDY` in the org (not included in this system).

## Sources

- **Codebase**: `imxplorerdevelopement/IMXPLORER_NEXTJS_WEBAPP` (default branch `master`, checkpoint `63fa069`)
- **Imported snapshot**: all relevant files under `_src/` in this project (renamed to avoid collisions — `_src/app/*` and `_src/components/*` mirror the repo structure).
- **Brand tokens**: `tailwind.config.ts`, `app/globals.css`, `app/layout.tsx`
- **Live site**: imxplorer.com
- **Social**: [@imxplorer_global](https://www.instagram.com/imxplorer_global/) (Instagram), [IMxplorer](https://www.linkedin.com/company/imxplorer/) (LinkedIn), WhatsApp +91 98110 99951

Everything in this design system was derived **from the code**, not from screenshots.

---

## Index of this folder

| File / folder | Purpose |
|---|---|
| `README.md` | This file. Manifest, content + visual foundations, iconography. |
| `SKILL.md` | Cross-compatible Agent Skill entry point for reuse in Claude Code. |
| `colors_and_type.css` | All design tokens — colors, type families, semantic recipes, radii, shadows, motion. **Import this first** when building anything branded. |
| `fonts/` | (Empty) Fonts are loaded via Google Fonts. See *Typography* below. |
| `assets/` | Logos, favicon, pattern assets. **Logo files are placeholders** — see *Caveats*. |
| `preview/` | Small HTML cards for the Design System tab (tokens, components, patterns). |
| `ui_kits/website/` | High-fidelity React recreation of the marketing site's key screens. |
| `_src/` | Full Next.js source snapshot — reference only, do not ship. |

---

## CONTENT FUNDAMENTALS

The voice is **confident, quiet, editorial**. It sells certainty, not features. Every line earns its place.

### Point of view & pronouns
- Uses **"We"** (the company) and **"You"** (the client). Never "I".
- Third-person *about* the client is avoided — direct address always. `"You board when you are ready. We handle everything before you arrive."`
- The company never refers to itself by name mid-sentence; "we" does the work.

### Tone
- **Declarative, short-sentence, serif-literary.** Sentences run 4–12 words on marketing surfaces. Paragraphs are 2–4 sentences, max.
- **Assertive, not salesy.** `"Rate parity is a myth."` / `"Our job ends when you are home."` / `"No algorithms. No ready-made packages."`
- **Italics carry the emotion.** `"The care is the luxury."` / `"Your freedom to explore the world."`
- Embraces **three-word fragments** as power statements: `"We Care."` / `"We Listen."` / `"Safe Return."`

### Casing
- **Title Case** for section headings, labels, CTA buttons (`Plan Your Journey`, `Enquire Privately`).
- **UPPERCASE with 0.25–0.4em letter-spacing** for eyebrows, micro-labels, navigation, CTA chips (`OUR DIFFERENTIATOR`, `THE JOURNEY`, `ENQUIRE`, `TRUSTED BY`).
- **sentence case** inside body copy paragraphs.
- Headlines sometimes use **Title Case for literal words** and **italic lowercase** for contrast: `"Every kind of journey." / "One team behind it."` (second half italic).

### Vibe
- **Craft, care, accountability.** The word *care* appears as a leitmotif — the big "We Care." hero, the "We travel with you" step, the signoff "*The care is the luxury.*"
- **Human, anti-template.** "No algorithms. No ready-made packages. 100% customised travel from first call to safe return." That anti-OTA stance runs through everything.
- **Discreet luxury** on HNI/LUXE surfaces — "Quietly.", "suites they don't list online", "every document handled".
- Never chirpy, never exclamation-heavy. Zero emoji.
- **No emoji.** None, anywhere, in any user-facing copy.
- **No em-dashes as stylistic flourish** — copy uses periods and short lines; em-dashes appear only in long-form services descriptions.

### Signature phrases / vocabulary
- *"We Care."* — the brand promise, treated as a standalone mark
- *"The care is the luxury."* — the positioning tagline
- *"From first call to safe return"* — end-to-end promise
- *"Flawless execution"* — the delivery promise
- *"One-on-one consultation"* — the anti-platform differentiator
- *"Bespoke"*, *"Curated"*, *"Crafted"* — used sparingly, never stacked
- **"Enquire"** (not *Contact us* or *Get in touch*) — primary CTA verb

### Copy examples (verbatim from product)
| Surface | Line |
|---|---|
| Hero H1 | *The Art of Custom Travel.* |
| Hero sub | Your freedom to explore the world. |
| Hero fine print | No algorithms. No ready-made packages. 100% customised travel from first call to safe return. |
| Philosophy H1 | We are not a tech platform. |
| Philosophy H2 | We are a people business. One-on-one consultation, flawless execution. |
| Philosophy close | *The care is the luxury.* |
| Journey step 01 | **You Reach Out** · A call, a message, a referral. That's all it takes. |
| Journey step 07 | **Safe Return** · Our job ends when you are home. That is why 90% come back to us. |
| Services eyebrow | OUR SERVICES — THE FIVE PILLARS |
| HNI eyebrow | CONCIERGE & HNI |
| HNI headline | Suites They Don't List Online. |
| Trusted-by pull | *"Trust is the only currency that matters."* |
| CTA button | PLAN YOUR JOURNEY · ENQUIRE · TALK TO A CONSULTANT · ENQUIRE PRIVATELY |
| Footer stamp | IATA ACCREDITED |

---

## VISUAL FOUNDATIONS

### Color
- **Dominant ground**: near-black. Three blacks are used deliberately — `#0f1116` (core `imxDark`), `#0a0a0a` (hero/services deeper black), `#0d0b08` (warm black behind HNI — notice the gold undertone). `#080809` is used on the Services page specifically.
- **Warm cream light ground**: `#f6f2e9` (`imxLight`) for the Philosophy section, `#f0ece9` for the Trusted-by band, `#fcf9f8` for text-on-dark where you want slight warmth.
- **Two brand accents**, always used sparingly:
  - **Wine red** `#8f2f2f` (`imxRed`) — the brand mark color, structural
  - **Champagne gold** `#d3a65a` (`imxGold`) — for eyebrows, hover states, HNI/luxury cues, IATA dot
- **Bright accent red** `#d6052b` is used for *scroll-activated* micro-moments: the dot at the end of "We Care.", the journey road, active-state indicators. Treat as an animated/live accent, not a static brand color.
- **Deeper hover gold** `#c9a84c` — the lit state of the "Enquire" pill.
- **Five pillar accents** (Services page) — `#c8922a` (Holidays), `#4a82c0` (Study), `#c0414a` (MICE), `#3a9e78` (Logistics), `#8b6fc0` (Visas). These are semantic per-section accents, not brand colors — used behind radial washes and top-border lines.
- **No gradients as hero fills.** The only gradients used are: (a) **overlay gradients** on hero imagery — diagonal dark-to-less-dark at ~160deg for legibility; (b) **protection fades** at section boundaries (bottom-to-transparent); (c) **radial vignettes** at section corners carrying gold at ~12% opacity; (d) one two-stop red→gold linear on the Journey road SVG. Never bluish-purple, never candy.

### Typography
- **Cormorant Garamond** (weight 300–700, italic supported) is the **display face**. All big headlines. Heavy use of **weight 300** at large sizes, often italic.
- **Manrope** (weight 200–800) is the **body face**. Used at 0.8–1rem for paragraphs with ~1.72 line-height.
- **League Spartan** (weight 300–800) is the **brand/eyebrow face**. Only used for **UPPERCASE small text** — nav labels, CTA buttons, eyebrows, micro-tags. Letter-spacing 0.18em–0.40em depending on size.
- **Headlines are never bold.** They are serif, weight 300, often italic, at huge size, with tight letter-spacing (-0.015 to -0.02em). Let scale do the work.
- **The italic + upright pairing** is the signature headline treatment: `"The Art of"` (upright) + `"Custom Travel."` (italic).
- Body sizes: `0.82rem` small · `0.9rem` standard · `1.06rem` large. Base `html` font-size is `14px`.

### Spacing & layout
- **Max content widths**: `1200px` (home sections), `1400px` (HNI + footer), `1600px` (nav / global outer cap).
- **Horizontal padding**: `1.25rem` (mobile) → `4rem` (desktop nav) / `2.5rem` (desktop sections).
- **Vertical rhythm**: sections are typically `min-h-screen` or a multi-viewport scroll-pin (`height: 250vh` / `280vh` / `360vh` for sticky storytelling). Expect tall scrolls.
- **Grid motif**: 12-col grids with asymmetric splits. Philosophy is `4 / 8` with 4-col eyebrow + headline block, 8-col prose block — headline drops a full column to the right.
- **No 3-col card walls.** Services is a single active card (full-bleed image with 32%-wide glass panel on the left). Concierge is the same motif.

### Backgrounds & imagery
- **Full-bleed photography** dominates hero sections and every destination. Color grade: **warm, slightly desaturated, moody**. Look for cinematic golden-hour light, shadowed interiors, aerial landscapes. Never washed-out Instagram-lifestyle imagery.
- **Ken Burns** subtle push-in on hero imagery (`scale(1) → scale(1.1)` over 24s).
- **Layered overlays**: every hero image has a 160deg dark gradient overlay (top-left 55% black → mid 20% black → bottom 75% black) plus a short bottom fade to the next section's bg. This is not negotiable — raw photos never show without the overlay.
- **Gold radial accents** at section corners (12–18% opacity) are the only "decoration" used on dark surfaces. `radial-gradient(circle at 12% -18%, rgba(184,148,63,.12), transparent 38%)`.
- **Travel particle background** (4 drifting dots at low alpha) is used on About / Contact for ambient life.
- **No hand-drawn illustrations.** No repeating patterns, no textures, no wallpapers. Photography + typography carry all visual weight.

### Animation & motion
- **Signature ease**: `cubic-bezier(0.16, 1, 0.3, 1)` — a soft emphasized-out. Every nav transform, hero reveal, card reveal uses this. Durations: `0.45s` (nav), `0.55s` (panels), `0.9–1s` (hero words), `1.4s` (hero divider).
- **Entry treatment**: hero words fade **up 50px + blur(12px) → 0 / blur(0)**. Staggered by ~130ms. This is THE hero intro recipe, don't change it.
- **Scroll-driven states** (not just reveals): words light up progressively as the section scrolls (the "We Care." letters turn from 8%-white to 95%-white one by one). Use `clampProgress(section)` on scroll.
- **Pinned sticky storytelling**: 2.5x–3.6x viewport-height sections with a sticky inner, progress driving class toggles on the pinned content.
- **Journey road** is an SVG path with `strokeDasharray/Offset` drawn by scroll, with a glowing "headlight" circle that samples `getPointAtLength(progress)` every frame.
- **Autoplay carousels**: services + HNI panels auto-advance every 2.5s until the user interacts, then stop.
- **No bounces.** No spring overshoots. No Lottie. No video backgrounds.

### Hover states
- **Links**: color shift — white/60 → gold/95 (or wine-red) + 2px horizontal translate on footer nav links.
- **Pill CTAs**: border darkens to gold, background fills gold at 12%–22%, text color brightens.
- **Image cards**: `scale(1.03)` over `1000ms ease-out` (Services pillar hover).
- **Buttons never change shape** — no shadow drops, no 3D lifts. Color + opacity only.

### Press / focus states
- Inputs: border-color → `rgba(214,5,43,0.6)` (bright red) + bg-white/5 on focus. Never outline rings.
- Buttons don't visibly change on press — the hover state carries.
- `::selection` is custom: dark red background, cream text.

### Borders & hairlines
- **Hairlines everywhere**: `1px solid rgba(255,255,255,0.10)` for cards on dark, `rgba(255,255,255,0.06)` for softer dividers, `rgba(160,55,40,0.18)` for day-mode nav.
- Dividers are almost always `1px` hairlines — sometimes with a `scaleX(0) → scaleX(1)` draw-in animation on entry (hero divider).

### Shadow system
- Three shadows, composed:
  1. **Card shadow**: `0 20px 60px rgba(0,0,0,0.50)` — used on elevated services cards.
  2. **Nav shadow**: `0 8px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.03)` — the scrolled-pill nav.
  3. **Red glow** (Journey cards): `0 0 0 1px rgba(214,5,43,0.06), 0 8px 32px rgba(214,5,43,0.08), inset 0 1px 0 rgba(255,255,255,0.06)`. A compound shadow where a faint red glow animates in with scroll proximity.
- **Inset top-light** `inset 0 1px 0 rgba(255,255,255,0.06)` appears on all glassy cards to simulate top-edge light catch.
- **WhatsApp button** has its own shadow: `0 4px 20px rgba(37,211,102,0.35)`.

### Corner radii
| Token | px | Used for |
|---|---|---|
| `--radius-xs` | 4 | (unused — reserved) |
| `--radius-sm` | 8 | small chips |
| `--radius-md` | 14 | mobile service cards, input containers |
| `--radius-lg` | 20 | **services cards, CTA strip** — the primary card radius |
| `--radius-xl` | 24 | (stats card / about cards are `rounded-3xl` = 24) |
| `--radius-pill` | 999px | **all CTAs, nav pill, eyebrows with borders, social icons** |

Pills dominate CTAs. Full-square corners are never used on interactive surfaces.

### Cards
A card on dark is:
- Background `rgba(10,10,10,0.35)` to `rgba(10,10,10,0.65)` (deeper when glassy)
- `1px solid rgba(255,255,255,0.10)` hairline
- `backdrop-filter: blur(24px) saturate(140%)` for glass variants
- `border-radius: 20px`
- Often layered over a full-bleed image with a heavy overlay

A card on cream is rarely boxed — copy sits directly on the cream with generous whitespace, divided only by a 1px ink-at-6% hairline.

### Transparency / blur
- **Blur + saturate** is reserved for: (1) nav pill when scrolled, (2) services glass panel, (3) mobile menu backdrop, (4) journey cards. Always `backdrop-filter: blur(16–24px)`.
- **Alpha tiers** are strict: text uses `0.40 / 0.60 / 0.75 / 0.90` on dark, `0.40 / 0.60 / 0.85` on light.

### Protection gradients vs capsules
- **Protection gradients** (bottom-to-transparent fades from the next section's bg color) are used at every section boundary to prevent hard seams. Example: `linear-gradient(to bottom, transparent, #fcf9f8)` at the foot of the black "We Care" section before it transitions to cream Philosophy.
- **Capsules / pills** — the scrolled navbar (`max-width: 860px, border-radius: 999px`), glass badges, and all CTAs.

### Fixed elements
- **Navbar** — fixed-top, full-width at page-start, morphs into a centered pill on scroll past 80px.
- **WhatsApp button** — fixed bottom-right, 54px circle, green.
- **Back-to-top** — fixed bottom-center pill, appears on scroll down past threshold.
- **Preloader** — full-viewport `#0a0a0a` with a thin progress bar at `min(200px, 55vw)` then fades out.

### Imagery color vibe
Warm, cinematic, a little desaturated. Golden-hour and blue-hour lean. Dark interiors. Aerial / horizon / suite photography. Never bright midday, never "stock-happy-people", never b&w. Think travel editorial (CNT, Travel + Leisure).

---

## ICONOGRAPHY

IMxplorer does **not use an icon library**. There is no Lucide, no Heroicons, no Font Awesome, no icon font in the codebase.

**Icons are exclusively inline SVGs** written per-use, with these recurring patterns:
- **Social logos** (Instagram, LinkedIn, WhatsApp) — hand-pathed from the official marks, 16×16 or 14×14, `fill="currentColor"`. See `components/Footer.tsx` and `components/WhatsAppButton.tsx`.
- **Hamburger** — two `1.5px × 22px` horizontal white lines in the mobile nav button.
- **Menu close (X)** — a single `<path d="M1 1L17 17M17 1L1 17">` at `strokeWidth="1.5" strokeLinecap="round"`.
- **Arrow right** (used in every CTA) — `<path d="M2 6h8M7 3l3 3-3 3" strokeWidth="1.2">` in a 12×12 viewBox. `strokeLinecap="round" strokeLinejoin="round"`. This is the ONLY arrow used — copy it, don't redraw.
- **Checkmark** (services feature list) — `<path d="M1 4l3 3 5-6" strokeWidth="1.4">` in an 8×8 / 10×8 viewBox, stroked in `rgba(184,148,63,0.9)` inside a `20×20` pill with a gold-at-15% background.

**Stroke weight**: ~1.2–1.5px thin hairline. Round linecaps. Never filled, never duotone.

**Color**: always `currentColor` or a rgba-gold / rgba-white. Icons inherit the text color of their container.

**Emoji**: never. Not in copy, not in UI.

**Unicode characters**: rare. The site uses the `&copy;` entity in the footer and a mid-dot `·` occasionally as a separator in speaker scripts.

### Brand / structural marks
- **Wordmark logo** — `/assets/images/logo_white.png` (white, for dark nav) and `/assets/images/logo_black.jpg` (black, for legal pages). Roughly 205×64 aspect. **The logo file is NOT in the repo's `public/` folder** — it's referenced but the actual asset wasn't committed. See *Caveats*.
- **IATA Accredited stamp** — a 6px gold dot (`rgba(184,148,63,.98)`) with a gold glow, followed by the uppercase text. Treated as a credential badge in the footer.
- **Branded tile typography** (Trusted-By marquee) — brand names are rendered *as type*, not as logos. Each partner uses a different font choice: Samsung in sans bold, Ryan International / Golden Grande in italic serif, the rest in brand uppercase. See the `brandItems` array in `Day3Homepage.tsx`.

### What to do as a designer
- **Use inline SVG only.** When building new surfaces for IMxplorer, copy an existing arrow/check/close from the codebase rather than introducing an icon set.
- **If a genuinely new icon is needed**, match the existing stroke weight (1.2–1.5px), use rounded joins, keep it geometric and minimal. Substitute from **Lucide** ([lucide.dev](https://lucide.dev), 1.5px stroke, round linecaps) — and FLAG the substitution to the user, because it is not in the source codebase.
- **Never use emoji**.
- **Never generate illustrations** — the brand relies on photography.

---

## Caveats (read before building)

- **Logo files not in repo.** The Next.js codebase references `/assets/images/logo_white.png` and `/assets/images/logo_black.jpg` but those binary assets were not committed to the GitHub repo (only the default Next.js starter SVGs are in `public/`). The preview cards in this design system use a **typographic wordmark placeholder** in League Spartan. **Action for the user: please upload the actual logo PNGs and drop them at `assets/logo_white.png` and `assets/logo_black.jpg`.**
- **Photography is Unsplash.** Every image url in the codebase is an `images.unsplash.com` CDN URL. The brand has not (yet) shot proprietary photography. When producing production work, prefer shooting or licensing bespoke imagery.
- **Favicon missing.** `metadata.icons` references `/favicon.ico` but it's not in the repo.
- **Fonts loaded via Google Fonts.** Cormorant Garamond, Manrope, and League Spartan all come from Google Fonts (production uses `next/font`). If you need self-hosted TTFs, grab them from Google Fonts' download.
