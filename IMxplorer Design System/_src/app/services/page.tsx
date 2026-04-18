import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import ServiceCard from "@/components/services/ServiceCard";

export const metadata: Metadata = {
  title: "Services | IMxplorer — The Travel Co.",
  description:
    "From international holidays and honeymoon escapes to corporate MICE and visa support — IMxplorer architects every journey around your outcome, not a fixed package.",
  keywords: [
    "international holidays",
    "domestic holidays India",
    "honeymoon travel packages",
    "golf tourism",
    "senior citizen travel",
    "multi-country itinerary",
    "corporate MICE travel",
    "study abroad consultancy",
    "visa assistance India",
    "IMxplorer services",
  ],
};

// ── Data ──────────────────────────────────────────────────────────────────────

const pillars = [
  {
    code: "01",
    title: "Holidays & Leisure",
    tagline: "Every kind of getaway, crafted to the last detail.",
    body: "From sprawling international itineraries to weekend escapes within India — we build each holiday around your pace, comfort, and intent, not a brochure.",
    accentColor: "#c8922a",
    accentRgb: "200,146,42",
    image: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1600&q=85",
    imageAlt: "Tropical beach resort with crystal clear water and lush palms",
    services: [
      { name: "International Holidays", desc: "Fully managed overseas travel — flights, hotels, transfers, guided experiences, and 24/7 on-trip support across every continent." },
      { name: "Domestic Holidays", desc: "Curated India itineraries from Himalayan treks to Kerala backwaters, with local expertise and seamless ground logistics." },
      { name: "Multi-Country Itineraries", desc: "Seamlessly connected multi-destination trips — visa sequencing, transit logistics, and consistent comfort across every border." },
      { name: "Honeymoon & Romantic Getaways", desc: "Private villas, candlelit dining, surprise experiences, and absolute discretion — designed for couples who want more than a hotel booking." },
      { name: "Senior Citizen Friendly Travel", desc: "Pace-adjusted itineraries with accessibility-first accommodation, medical-grade travel insurance, and dedicated escorts when needed." },
      { name: "Golf Tourism", desc: "Tee-times at world-ranked courses, club access, resort accommodation, and itineraries built around your handicap and chosen destinations." },
    ],
  },
  {
    code: "02",
    title: "Study Abroad",
    tagline: "Mobility support from shortlist to departure.",
    body: "Advisory and documentation support for students targeting international universities — covering visa preparation, pre-departure orientation, and in-country logistics.",
    accentColor: "#4a82c0",
    accentRgb: "74,130,192",
    image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1600&q=85",
    imageAlt: "University campus with grand architecture and students walking",
    services: [
      { name: "University Pathway Planning", desc: "Destination and institution matching based on academic profile, budget, and long-term career goals." },
      { name: "Student Visa Assistance", desc: "Document checklists, application support, and interview preparation for study visas across the UK, USA, Canada, Australia, and Europe." },
      { name: "Pre-Departure Logistics", desc: "Flights, accommodation, forex, insurance, and orientation kits — everything handled before day one in a new country." },
    ],
  },
  {
    code: "03",
    title: "Corporate & MICE",
    tagline: "Group movements built for outcomes, not headcount.",
    body: "Conferences, incentive trips, offsites, and large-format group movements handled with the operational discipline that corporate travel demands.",
    accentColor: "#c0414a",
    accentRgb: "192,65,74",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1600&q=85",
    imageAlt: "Large corporate conference event with stage lighting and audience",
    services: [
      { name: "Incentive Travel", desc: "High-value reward trips for sales teams and top performers — exclusive destinations, premium stays, and memorable group experiences." },
      { name: "Conferences & Offsites", desc: "End-to-end management of venue sourcing, delegate travel, accommodation, F&B, and AV — across domestic and international locations." },
      { name: "Group Movements", desc: "Coordinated air and ground logistics for large delegations, with real-time support and contingency planning built in." },
    ],
  },
  {
    code: "04",
    title: "Travel & Logistics",
    tagline: "Every operational layer of travel, executed right.",
    body: "Flights, travel insurance, cruises, and ground coordination — the infrastructure behind every trip, handled with precision and genuine care.",
    accentColor: "#3a9e78",
    accentRgb: "58,158,120",
    image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1600&q=85",
    imageAlt: "Aerial view of airplane wing flying above clouds at sunset",
    services: [
      { name: "Flight Bookings", desc: "Economy to business class across all carriers — with fare monitoring, flexible ticketing, and managed changes when plans shift." },
      { name: "Travel Insurance", desc: "Comprehensive coverage for medical emergencies, trip cancellations, baggage, and adventure activities." },
      { name: "Cruises", desc: "Ocean and river cruise bookings across all major lines — stateroom selection, shore excursions, and onboard experience planning." },
    ],
  },
  {
    code: "05",
    title: "Visas & Services",
    tagline: "Less paperwork. Less risk. More time to focus on the trip.",
    body: "Tourist and business visa assistance, documentation review, and service workflows that cut delay risk for clients with time-sensitive travel.",
    accentColor: "#8b6fc0",
    accentRgb: "139,111,192",
    image: "https://images.unsplash.com/photo-1569949381669-ecf31ae8e613?auto=format&fit=crop&w=1600&q=85",
    imageAlt: "Open passport with visa stamps from countries around the world",
    services: [
      { name: "Tourist Visa Assistance", desc: "Application support, document checklists, and appointment coordination for short-stay visas across all major destinations." },
      { name: "Business Visa Support", desc: "Fast-track documentation support for business travellers with tight timelines and complex multi-entry requirements." },
      { name: "Forex & Travel Essentials", desc: "Currency exchange at competitive rates, travel SIMs, and pre-trip checklists so nothing gets missed before departure." },
    ],
  },
];

const stats = [
  { value: "500+", label: "Trips Designed" },
  { value: "32+", label: "Countries Covered" },
  { value: "98%", label: "Repeat Clients" },
  { value: "5", label: "Service Pillars" },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ServicesPage() {
  return (
    <main className="relative bg-[#080809] text-imxLight overflow-x-hidden">

      {/* ══ HERO — full-bleed image masthead ══════════════════════════════════ */}
      <section className="relative h-[92vh] min-h-[600px] max-h-[900px] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1488085061387-422e29b40080?auto=format&fit=crop&w=2000&q=90"
          alt="World map with travel destinations highlighted at night"
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority
        />
        {/* Deep cinematic overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, rgba(8,8,9,0.72) 0%, rgba(8,8,9,0.38) 45%, rgba(8,8,9,0.85) 100%)",
          }}
        />
        {/* Bottom fade into page bg */}
        <div
          className="absolute bottom-0 left-0 right-0 h-48"
          style={{ background: "linear-gradient(to bottom, transparent, #080809)" }}
        />
        {/* Gold vignette top-right */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 50% 45% at 80% 15%, rgba(184,148,63,0.18), transparent 60%)",
          }}
        />

        {/* Hero content */}
        <div className="relative z-10 flex h-full flex-col justify-end pb-20 md:pb-28">
          <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
            <p className="font-brand text-[0.58rem] tracking-[0.44em] text-imxGold uppercase mb-5">
              What We Do
            </p>
            <h1
              className="font-serif font-light text-white"
              style={{
                fontSize: "clamp(3.2rem, 7.5vw, 6.4rem)",
                lineHeight: 1.02,
                letterSpacing: "-0.018em",
                maxWidth: "16ch",
              }}
            >
              Every kind of journey.
              <br />
              <span className="italic" style={{ color: "rgba(246,242,233,0.42)" }}>
                One team behind it.
              </span>
            </h1>

            <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-center">
              <p
                className="font-sans text-sm leading-relaxed text-white/50 md:text-base"
                style={{ fontWeight: 300, maxWidth: "44ch" }}
              >
                We don't sell packages. We design and execute each travel program around your
                objectives, timeline, and comfort standard.
              </p>
              <Link
                href="/contact"
                className="shrink-0 inline-flex items-center gap-3 rounded-full border px-6 py-3 font-sans text-[0.65rem] tracking-[0.22em] text-imxGold uppercase transition-all duration-300 hover:bg-imxGold/12"
                style={{ borderColor: "rgba(184,148,63,0.5)" }}
              >
                Start planning
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══ STATS ROW ═════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-6 md:px-10">
        <div
          className="grid grid-cols-2 md:grid-cols-4 rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(255,255,255,0.07)" }}
        >
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="relative flex flex-col gap-1.5 px-7 py-8 md:px-10"
              style={{
                background: "rgba(255,255,255,0.025)",
                borderRight: i < 3 ? "1px solid rgba(255,255,255,0.06)" : undefined,
              }}
            >
              {/* Subtle gold accent top-left corner */}
              <div
                className="pointer-events-none absolute top-0 left-0 right-0 h-[1px]"
                style={{ background: `linear-gradient(90deg, rgba(184,148,63,0.5), transparent 60%)` }}
              />
              <span
                className="font-serif font-light text-white"
                style={{ fontSize: "clamp(2.2rem, 4vw, 3rem)", letterSpacing: "-0.025em", lineHeight: 1 }}
              >
                {s.value}
              </span>
              <span className="font-brand text-[0.52rem] tracking-[0.3em] text-white/30 uppercase">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ══ PILLARS ═══════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-6 md:px-10 pt-24 pb-10 md:pt-32">
        <div className="mb-14 flex items-center gap-5">
          <p className="font-brand text-[0.52rem] tracking-[0.4em] text-white/20 uppercase whitespace-nowrap">
            Five pillars
          </p>
          <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
        </div>

        <div className="flex flex-col gap-2">
          {pillars.map((pillar) => (
            <article
              key={pillar.code}
              className="group relative overflow-hidden rounded-2xl"
              style={{ border: "1px solid rgba(255,255,255,0.07)" }}
            >
              {/* Background image — subtle, very dark */}
              <div className="absolute inset-0">
                <Image
                  src={pillar.image}
                  alt={pillar.imageAlt}
                  fill
                  sizes="(max-width: 768px) 100vw, 1200px"
                  className="object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-[1.03]"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(105deg, rgba(8,8,9,0.97) 0%, rgba(8,8,9,0.88) 40%, rgba(8,8,9,0.72) 70%, rgba(8,8,9,0.82) 100%)`,
                  }}
                />
                {/* Accent colour wash from left */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  style={{
                    background: `radial-gradient(ellipse 55% 80% at -5% 50%, rgba(${pillar.accentRgb},0.14), transparent 65%)`,
                  }}
                />
              </div>

              {/* Accent top-border line */}
              <div
                className="absolute top-0 left-0 right-0 h-[1.5px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: `linear-gradient(90deg, rgba(${pillar.accentRgb},0.9), transparent 60%)` }}
              />

              {/* Content */}
              <div className="relative z-10 grid grid-cols-1 gap-8 p-8 md:grid-cols-12 md:gap-12 md:p-10 lg:p-12">

                {/* Left — code + icon + title block */}
                <div className="md:col-span-4 lg:col-span-3 flex flex-col justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-5">
                      <span
                        className="font-brand text-[0.5rem] tracking-[0.35em] uppercase"
                        style={{ color: `rgba(${pillar.accentRgb},0.7)` }}
                      >
                        {pillar.code}
                      </span>
                      <div className="h-px flex-1" style={{ background: `rgba(${pillar.accentRgb},0.2)` }} />
                    </div>
                    <h2
                      className="font-serif font-light text-white"
                      style={{ fontSize: "clamp(1.9rem, 3vw, 2.8rem)", letterSpacing: "-0.015em", lineHeight: 1.08 }}
                    >
                      {pillar.title}
                    </h2>
                    <p
                      className="mt-3 font-sans text-[0.68rem] tracking-[0.1em] uppercase"
                      style={{ color: `rgba(${pillar.accentRgb},0.75)`, fontWeight: 500 }}
                    >
                      {pillar.tagline}
                    </p>
                    <p
                      className="mt-4 font-sans text-[0.85rem] leading-relaxed"
                      style={{ fontWeight: 300, color: "rgba(246,242,233,0.45)", maxWidth: "36ch" }}
                    >
                      {pillar.body}
                    </p>
                  </div>

                  <Link
                    href="/contact"
                    className="inline-flex w-fit items-center gap-2.5 rounded-full border px-5 py-2.5 font-sans text-[0.6rem] tracking-[0.2em] uppercase transition-all duration-300 hover:opacity-90"
                    style={{
                      borderColor: `rgba(${pillar.accentRgb},0.35)`,
                      color: `rgba(${pillar.accentRgb},0.9)`,
                      background: `rgba(${pillar.accentRgb},0.07)`,
                    }}
                  >
                    Enquire
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </div>

                {/* Right — service cards grid */}
                <div className="md:col-span-8 lg:col-span-9">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {pillar.services.map((svc) => (
                      <ServiceCard
                        key={svc.name}
                        name={svc.name}
                        desc={svc.desc}
                        accentColor={pillar.accentColor}
                        accentRgb={pillar.accentRgb}
                      />
                    ))}
                  </div>
                </div>

              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ══ BESPOKE CTA — full-width cinematic strip ══════════════════════════ */}
      <section className="relative overflow-hidden mt-16">
        {/* Background image */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=2000&q=85"
            alt="Aerial view of a winding road through lush mountain landscape"
            fill
            sizes="100vw"
            className="object-cover object-center"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(105deg, rgba(8,8,9,0.96) 0%, rgba(8,8,9,0.82) 50%, rgba(8,8,9,0.70) 100%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 65% 70% at 85% 50%, rgba(184,148,63,0.12), transparent 60%)",
            }}
          />
        </div>

        {/* Top + bottom fades */}
        <div className="absolute top-0 left-0 right-0 h-24" style={{ background: "linear-gradient(to bottom, #080809, transparent)" }} />
        <div className="absolute bottom-0 left-0 right-0 h-24" style={{ background: "linear-gradient(to top, #080809, transparent)" }} />

        <div className="relative z-10 mx-auto max-w-6xl px-6 py-28 md:px-10 md:py-36">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:items-center">
            <div>
              <p className="font-brand text-[0.55rem] tracking-[0.42em] text-imxGold uppercase mb-5">
                Bespoke by default
              </p>
              <h2
                className="font-serif font-light text-white"
                style={{ fontSize: "clamp(2rem, 4vw, 3.6rem)", lineHeight: 1.06, letterSpacing: "-0.015em" }}
              >
                Most clients use more than one pillar.
              </h2>
              <p
                className="mt-5 font-sans text-[0.88rem] leading-relaxed text-white/50"
                style={{ fontWeight: 300, maxWidth: "46ch" }}
              >
                A student going abroad needs study advisory, visa support, and flight
                logistics. A family holiday often combines leisure planning, multi-country
                routing, and insurance. Tell us the outcome — we'll architect the right
                combination.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-3 rounded-full border px-8 py-4 font-sans text-[0.68rem] tracking-[0.25em] text-imxGold uppercase transition-all duration-300 hover:bg-imxGold/15"
                  style={{ borderColor: "rgba(184,148,63,0.55)", background: "rgba(184,148,63,0.09)" }}
                >
                  Talk to a consultant
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                <p className="flex items-center font-sans text-[0.58rem] tracking-[0.14em] text-white/22">
                  Free first consultation. No obligation.
                </p>
              </div>
            </div>

            {/* Right: feature list */}
            <div className="flex flex-col gap-4">
              {[
                { label: "No fixed packages", detail: "Every itinerary is designed from scratch around your goals." },
                { label: "Cross-pillar expertise", detail: "One team manages everything — no handoffs, no gaps." },
                { label: "End-to-end ownership", detail: "From the first call to the last transfer, we are accountable." },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-start gap-4 rounded-xl p-5"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: "rgba(184,148,63,0.15)", border: "1px solid rgba(184,148,63,0.3)" }}
                  >
                    <svg width="8" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l3 3 5-6" stroke="rgba(184,148,63,0.9)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-brand text-[0.58rem] tracking-[0.2em] text-white/80 uppercase mb-1">{item.label}</p>
                    <p className="font-sans text-[0.8rem] leading-relaxed text-white/38" style={{ fontWeight: 300 }}>{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom page padding */}
      <div className="h-16 bg-[#080809]" />

    </main>
  );
}
