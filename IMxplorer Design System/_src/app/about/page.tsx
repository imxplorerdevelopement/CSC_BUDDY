import type { Metadata } from "next";
import Link from "next/link";
import TravelParticleBackground from "@/components/ambient/TravelParticleBackground";

export const metadata: Metadata = {
  title: "About | IMxplorer",
  description:
    "Meet IMxplorer, the customized travel company built on one-on-one care, deep expertise, and end-to-end trip support.",
};

const leadership = [
  {
    role: "Founder",
    name: "Inderpal Singh",
    summary:
      "30+ years in travel leadership across Yatra, Amex GBT, CWT, Kuoni, Balmer Lawrie, and Stic Travels. Leads relationships and deal-making.",
  },
  {
    role: "CEO",
    name: "Samar Singh",
    summary:
      "Leads digital decisions, operations, and growth systems while preserving IMxplorer's human-first service standard.",
  },
];

const values = [
  "100% customized travel planning",
  "One-on-one consultation, not template booking",
  "Support from first call to safe return",
  "Luxury defined by care, precision, and accountability",
];

export default function AboutPage() {
  return (
    <main className="relative overflow-hidden bg-imxDark pt-36 pb-24 text-imxLight">
      <TravelParticleBackground className="opacity-45" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_16%_8%,rgba(143,47,47,0.2),transparent_38%),radial-gradient(circle_at_86%_12%,rgba(211,166,90,0.16),transparent_34%)]"
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 md:px-10">
        <section className="rounded-3xl border border-white/10 bg-black/35 p-8 shadow-[0_24px_65px_rgba(0,0,0,0.45)] backdrop-blur-xl md:p-12">
          <p className="font-sans text-[0.68rem] tracking-[0.28em] text-imxGold uppercase">
            About IMxplorer
          </p>
          <h1 className="mt-5 max-w-4xl font-serif text-4xl leading-tight text-white md:text-6xl">
            We are a people business in a template-driven travel world.
          </h1>
          <p className="mt-7 max-w-3xl font-sans text-sm leading-relaxed text-white/75 md:text-base">
            Founded in 2019 and operational since 2022, IMxplorer designs every
            journey from scratch. Flights, stays, visas, transport, cruises, insurance,
            MICE, and student travel are coordinated around real client needs, never
            fixed packages.
          </p>
          <p className="mt-6 font-serif text-2xl text-imxGold italic md:text-3xl">
            We Care.
          </p>
        </section>

        <section className="mt-10 grid gap-6 md:grid-cols-2">
          {leadership.map((person) => (
            <article
              key={person.role}
              className="rounded-2xl border border-white/10 bg-black/30 p-7 md:p-8"
            >
              <p className="font-sans text-[0.62rem] tracking-[0.28em] text-imxGold uppercase">
                {person.role}
              </p>
              <h2 className="mt-3 font-serif text-3xl text-white md:text-4xl">
                {person.name}
              </h2>
              <p className="mt-4 font-sans text-sm leading-relaxed text-white/70 md:text-base">
                {person.summary}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-10 rounded-2xl border border-white/10 bg-black/30 p-7 md:p-10">
          <h2 className="font-serif text-3xl text-white md:text-4xl">How We Work</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {values.map((value) => (
              <div
                key={value}
                className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-4"
              >
                <p className="font-sans text-sm leading-relaxed text-white/75 md:text-base">
                  {value}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Link
              href="/contact"
              className="inline-flex items-center gap-3 rounded-full border border-imxGold/60 bg-imxGold/10 px-6 py-3 font-sans text-[0.68rem] tracking-[0.24em] text-imxGold uppercase transition-all duration-300 hover:border-imxGold hover:bg-imxGold/20"
            >
              Plan With IMxplorer
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
