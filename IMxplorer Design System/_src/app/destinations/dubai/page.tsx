import DestinationHeroPage from "@/components/destinations/DestinationHeroPage";
import type { Metadata } from "next";
import {
  buildDestinationJsonLd,
  buildDestinationMetadata,
  toJsonLdString,
} from "../destinationSeo";

const backgrounds = [
  "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=2400&q=80",
  "https://images.unsplash.com/photo-1582672060674-bc2bd808a8a6?auto=format&fit=crop&w=2400&q=80",
  "https://images.unsplash.com/photo-1526495124232-a04e1849168c?auto=format&fit=crop&w=2400&q=80",
  "https://images.unsplash.com/photo-1546412414-8035e1776c9a?auto=format&fit=crop&w=2400&q=80",
];

const faqs = [
  {
    question: "When should I visit Dubai for premium travel?",
    answer:
      "November to March is best for outdoor experiences, yacht charters, and desert activities with pleasant weather.",
  },
  {
    question: "How long should a Dubai itinerary be?",
    answer:
      "A 4 to 6 day plan works well for city icons, luxury shopping, fine dining, and a private desert extension.",
  },
  {
    question: "Can Dubai be combined with Abu Dhabi?",
    answer:
      "Yes. A two-city UAE route is very popular and easy to execute with private chauffeur transfers.",
  },
  {
    question: "Is Dubai suitable for family luxury holidays?",
    answer:
      "Yes. The destination has excellent family-friendly resorts, indoor attractions, and safe private logistics.",
  },
];

const description =
  "Plan your Dubai luxury vacation with IMxplorer featuring iconic skyline stays, private desert experiences, shopping curation, and bespoke city-to-coast itineraries.";

export const metadata: Metadata = buildDestinationMetadata({
  slug: "dubai",
  name: "Dubai",
  description,
  keywords: [
    "Dubai luxury travel",
    "Dubai private tours",
    "Dubai honeymoon package",
    "Dubai desert safari premium",
    "Dubai city and beach itinerary",
    "UAE luxury vacation",
  ],
  image: backgrounds[0],
});

export default function DubaiDestinationPage() {
  const jsonLd = buildDestinationJsonLd({
    slug: "dubai",
    name: "Dubai",
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
        name="Dubai"
        description={description}
        backgrounds={backgrounds}
        cards={[
          { title: "Skyline Luxury", body: "Signature hotels, rooftop dining, and iconic views." },
          { title: "Desert Escapes", body: "Private dune drives, falconry, and premium camp dining." },
          { title: "Coastal Lifestyle", body: "Marina access, yacht charters, and beach club circuits." },
        ]}
        seoIntro="Dubai is one of the world's most efficient luxury destinations, offering contemporary architecture, high-end hospitality, and exceptional service standards. Whether you prefer a city-focused short break or a longer UAE route with desert and coastline, the destination supports highly personalized travel. Our itineraries prioritize premium reservations, low-friction transfers, and curated experiences that align with your pace."
        highlights={[
          "Stay near Downtown or Palm Jumeirah for premium access and luxury amenities.",
          "Book private sunrise or sunset desert programs with elevated dining setups.",
          "Pair major landmarks with design districts, curated shopping, and chef-led dining.",
          "Combine Dubai with Abu Dhabi for art, culture, and island resort add-ons.",
        ]}
        facts={[
          { label: "Best Time", value: "November to March for ideal outdoor weather." },
          { label: "Ideal Duration", value: "4 to 6 days, or 7+ days with Abu Dhabi." },
          { label: "Best For", value: "Couples, family trips, shopping, and short luxury breaks." },
          { label: "Top Pairing", value: "Dubai + Abu Dhabi or Dubai + Maldives extensions." },
        ]}
        itinerary={[
          { day: "Day 1", plan: "Arrival, private transfer, marina sunset and fine dining." },
          { day: "Day 2", plan: "Downtown landmarks, luxury retail curation, rooftop evening." },
          { day: "Day 3", plan: "Private desert route with curated camp dinner." },
          { day: "Day 4", plan: "Beach club or yacht charter with optional spa program." },
        ]}
        faqs={faqs}
      />
    </>
  );
}


