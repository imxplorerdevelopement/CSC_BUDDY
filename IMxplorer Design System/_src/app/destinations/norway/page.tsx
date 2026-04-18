import DestinationHeroPage from "@/components/destinations/DestinationHeroPage";
import type { Metadata } from "next";
import {
  buildDestinationJsonLd,
  buildDestinationMetadata,
  toJsonLdString,
} from "../destinationSeo";

const backgrounds = [
  "https://images.unsplash.com/photo-1531168556467-80aace4d30f8?auto=format&fit=crop&w=2400&q=80",
  "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=2400&q=80",
  "https://images.unsplash.com/photo-1484788984921-03950022c9ef?auto=format&fit=crop&w=2400&q=80",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=2400&q=80",
];

const faqs = [
  {
    question: "When is the best time to visit Norway?",
    answer:
      "May to September is ideal for fjords and scenic drives, while October to March is best for Northern Lights experiences.",
  },
  {
    question: "How many days do I need for Norway?",
    answer:
      "A 7 to 10 day route works well for Oslo, Bergen, and fjords, while 10 to 14 days allows Arctic extensions.",
  },
  {
    question: "Can we include the Northern Lights in a luxury trip?",
    answer:
      "Yes. Tromso and northern regions offer premium lodges, private guides, and tailored aurora viewing strategies.",
  },
  {
    question: "Is Norway good for honeymoon travel?",
    answer:
      "Norway is excellent for honeymooners seeking dramatic landscapes, intimate stays, and private nature-led experiences.",
  },
];

const description =
  "Explore Norway with IMxplorer through premium fjord cruises, Arctic aurora journeys, scenic rail routes, and design-led Nordic stays.";

export const metadata: Metadata = buildDestinationMetadata({
  slug: "norway",
  name: "Norway",
  description,
  keywords: [
    "Norway luxury travel",
    "Norway fjord itinerary",
    "Northern Lights Norway tour",
    "Norway honeymoon package",
    "Oslo Bergen luxury route",
    "Scandinavia private travel",
  ],
  image: backgrounds[0],
});

export default function NorwayDestinationPage() {
  const jsonLd = buildDestinationJsonLd({
    slug: "norway",
    name: "Norway",
    description,
    image: backgrounds[0],
    faqs,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdString(jsonLd) }}
      />
      <DestinationHeroPage
        name="Norway"
        description={description}
        backgrounds={backgrounds}
        cards={[
          { title: "Fjord Routes", body: "Iconic waterways, mountain roads, and private cruising." },
          { title: "Arctic North", body: "Aurora tracking, winter lodges, and tailored expeditions." },
          { title: "Nordic Cities", body: "Architecture, cuisine, and curated Oslo-Bergen immersion." },
        ]}
        seoIntro="Norway is a top-tier destination for luxury travelers who value landscapes, privacy, and thoughtful design. The country excels in high-comfort, low-density experiences from fjord-edge boutique hotels to remote Arctic lodges. We curate season-specific programs so summer journeys focus on fjords and road panoramas, while winter routes emphasize Northern Lights windows and immersive Nordic experiences."
        highlights={[
          "Cruise through UNESCO-listed fjord stretches with premium shoreline stays.",
          "Use scenic rail and private transfers to connect cities and mountain routes.",
          "Plan Arctic extensions with flexible aurora nights and local expert guides.",
          "Pair dramatic nature with modern Nordic dining and architecture experiences.",
        ]}
        facts={[
          { label: "Best Time", value: "May to September for fjords; October to March for aurora." },
          { label: "Ideal Duration", value: "7 to 10 days, or 10 to 14 days with Arctic north." },
          { label: "Best For", value: "Honeymoon, slow luxury, nature-first premium travel." },
          { label: "Top Pairing", value: "Norway with Iceland, Sweden, or Finland routes." },
        ]}
        itinerary={[
          { day: "Day 1", plan: "Arrive Oslo, private city design and dining circuit." },
          { day: "Day 2", plan: "Scenic transfer toward Bergen with curated local stops." },
          { day: "Day 3", plan: "Fjord cruise with waterfront boutique stay." },
          { day: "Day 4", plan: "Mountain panorama route and optional helicopter add-on." },
        ]}
        faqs={faqs}
      />
    </>
  );
}
