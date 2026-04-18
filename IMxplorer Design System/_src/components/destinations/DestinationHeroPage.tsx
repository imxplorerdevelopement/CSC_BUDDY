"use client";

import { useEffect, useState } from "react";

type DestinationCard = {
  title: string;
  body: string;
};

type DestinationFact = {
  label: string;
  value: string;
};

type DestinationItineraryStop = {
  day: string;
  plan: string;
};

type DestinationFaq = {
  question: string;
  answer: string;
};

type DestinationHeroPageProps = {
  name: string;
  description: string;
  backgrounds: string[];
  cards: DestinationCard[];
  seoIntro: string;
  highlights: string[];
  facts: DestinationFact[];
  itinerary: DestinationItineraryStop[];
  faqs: DestinationFaq[];
};

export default function DestinationHeroPage({
  name,
  description,
  backgrounds,
  cards,
  seoIntro,
  highlights,
  facts,
  itinerary,
  faqs,
}: DestinationHeroPageProps) {
  const [activeBg, setActiveBg] = useState(0);

  useEffect(() => {
    if (backgrounds.length < 2) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveBg((prev) => (prev + 1) % backgrounds.length);
    }, 5200);

    return () => window.clearInterval(timer);
  }, [backgrounds]);

  return (
    <section className="relative min-h-screen overflow-hidden bg-black px-4 pb-16 pt-32 sm:px-7 lg:px-10">
      <div className="pointer-events-none absolute inset-0">
        {backgrounds.map((image, index) => (
          <div
            key={image}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[1400ms] ${
              index === activeBg ? "opacity-100" : "opacity-0"
            }`}
            style={{ backgroundImage: `url("${image}")` }}
          />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(4,6,10,0.78)_0%,rgba(7,9,14,0.66)_42%,rgba(8,10,14,0.86)_100%)]" />

      <div className="relative mx-auto w-full max-w-[1120px]">
        <p className="font-brand text-[0.58rem] tracking-[0.28em] text-imxGold uppercase">
          Destination
        </p>
        <h1 className="mt-4 font-serif text-[clamp(2.1rem,4.2vw,4rem)] leading-[0.98] text-white">
          {name}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70">{description}</p>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {cards.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
            >
              <h2 className="font-serif text-2xl text-white/92">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/65">{item.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-white/10 bg-black/30 p-6 backdrop-blur-sm">
          <h2 className="font-serif text-3xl text-white/95">Why Visit {name}</h2>
          <p className="mt-3 max-w-4xl text-sm leading-relaxed text-white/75">{seoIntro}</p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="font-serif text-2xl text-white/92">Top Highlights</h2>
            <ul className="mt-3 space-y-2">
              {highlights.map((item) => (
                <li key={item} className="text-sm leading-relaxed text-white/70">
                  {item}
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="font-serif text-2xl text-white/92">Travel Snapshot</h2>
            <dl className="mt-3 space-y-3">
              {facts.map((item) => (
                <div key={item.label}>
                  <dt className="text-[0.68rem] tracking-[0.2em] text-white/45 uppercase">
                    {item.label}
                  </dt>
                  <dd className="mt-1 text-sm leading-relaxed text-white/78">{item.value}</dd>
                </div>
              ))}
            </dl>
          </article>
        </div>

        <article className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="font-serif text-2xl text-white/92">Sample Itinerary</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {itinerary.map((item) => (
              <section key={item.day} className="rounded-xl border border-white/10 bg-black/25 p-4">
                <p className="text-[0.68rem] tracking-[0.18em] text-imxGold uppercase">{item.day}</p>
                <p className="mt-2 text-sm leading-relaxed text-white/75">{item.plan}</p>
              </section>
            ))}
          </div>
        </article>

        <article className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="font-serif text-2xl text-white/92">Frequently Asked Questions</h2>
          <div className="mt-4 space-y-4">
            {faqs.map((item) => (
              <section key={item.question}>
                <h3 className="font-serif text-xl text-white/88">{item.question}</h3>
                <p className="mt-1 text-sm leading-relaxed text-white/70">{item.answer}</p>
              </section>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
