import DestinationHeroPage from "@/components/destinations/DestinationHeroPage";
import type { Metadata } from "next";
import {
  buildDestinationJsonLd,
  buildDestinationMetadata,
  toJsonLdString,
} from "../destinationSeo";

const backgrounds = [
  "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=2400&q=80",
  "https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?auto=format&fit=crop&w=2400&q=80",
  "https://images.unsplash.com/photo-1486299267070-83823f5448dd?auto=format&fit=crop&w=2400&q=80",
  "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=2400&q=80",
];

const faqs = [
  {
    question: "What is the best season for a UK luxury trip?",
    answer:
      "May to September is ideal for mild weather, gardens, countryside experiences, and longer daylight for touring.",
  },
  {
    question: "How long should a UK itinerary be?",
    answer:
      "A 7 to 10 day itinerary is perfect for London, countryside estates, and a Scotland or Wales extension.",
  },
  {
    question: "Can we add private cultural experiences in London?",
    answer:
      "Yes. We can arrange curated museum visits, private guides, theatre access, and reservations at leading restaurants.",
  },
  {
    question: "Is the UK suitable for family and multi-generational travel?",
    answer:
      "Absolutely. The UK offers excellent transport, diverse activities, and premium accommodations suited for mixed age groups.",
  },
];

const description =
  "Discover the United Kingdom with IMxplorer through luxury London stays, countryside estate retreats, Scotland heritage circuits, and curated cultural access.";

export const metadata: Metadata = buildDestinationMetadata({
  slug: "uk",
  name: "United Kingdom",
  description,
  keywords: [
    "UK luxury travel",
    "London private tours",
    "Scotland luxury itinerary",
    "England countryside estates",
    "UK honeymoon package",
    "United Kingdom curated travel",
  ],
  image: backgrounds[0],
});

export default function UkDestinationPage() {
  const jsonLd = buildDestinationJsonLd({
    slug: "uk",
    name: "United Kingdom",
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
        name="United Kingdom"
        description={description}
        backgrounds={backgrounds}
        cards={[
          { title: "London", body: "Iconic stays, arts, and premium city access." },
          { title: "Countryside", body: "Manor estates, gardens, and scenic luxury drives." },
          { title: "Scotland", body: "Castle routes, whisky heritage, and Highland landscapes." },
        ]}
        seoIntro="The United Kingdom combines global culture, historic architecture, and elegant hospitality in a compact, well-connected destination. From London's world-class theatre and dining scene to refined country estates and Scotland's dramatic landscapes, every region has a distinct travel personality. Our route design focuses on smooth rail or chauffeur logistics, high-value reservations, and private experiences matched to your interests."
        highlights={[
          "Pair London culture with countryside manor stays in one smooth itinerary.",
          "Include private art, architecture, and literary experiences across key cities.",
          "Add Scotland for castle routes, whisky tasting, and dramatic natural scenery.",
          "Travel with premium rail and chauffeur support for effortless transitions.",
        ]}
        facts={[
          { label: "Best Time", value: "May to September for milder weather and long days." },
          { label: "Ideal Duration", value: "7 to 10 days for multi-region exploration." },
          { label: "Best For", value: "Culture, family trips, honeymoons, and heritage travel." },
          { label: "Top Pairing", value: "UK with Ireland, France, or Scandinavia extensions." },
        ]}
        itinerary={[
          { day: "Day 1", plan: "Arrive London, private transfer, West End evening." },
          { day: "Day 2", plan: "Museums, landmarks, and tailored dining reservations." },
          { day: "Day 3", plan: "Countryside transfer to a manor estate stay." },
          { day: "Day 4", plan: "Scotland extension or return London for departure." },
        ]}
        faqs={faqs}
      />
    </>
  );
}


