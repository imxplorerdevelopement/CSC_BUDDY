import DestinationHeroPage from "@/components/destinations/DestinationHeroPage";
import type { Metadata } from "next";
import {
  buildDestinationJsonLd,
  buildDestinationMetadata,
  toJsonLdString,
} from "../destinationSeo";

const backgrounds = [
  "https://images.unsplash.com/photo-1496588152823-86ff7695ed1d?auto=format&fit=crop&w=2400&q=80",
  "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=2400&q=80",
  "https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=2400&q=80",
  "https://images.unsplash.com/photo-1508264165352-258a6f82be2f?auto=format&fit=crop&w=2400&q=80",
];

const faqs = [
  {
    question: "What is the best time to travel across the USA?",
    answer:
      "Spring and fall are ideal for multi-city and national park routes, while summer is best for coastal and family-focused itineraries.",
  },
  {
    question: "How many days are needed for a USA luxury itinerary?",
    answer:
      "A 10 to 14 day route allows two to three regions, such as New York, California coast, and a national park extension.",
  },
  {
    question: "Can I combine cities and nature in one trip?",
    answer:
      "Yes. Popular pairings include New York with Yellowstone, or San Francisco with Napa and Yosemite.",
  },
  {
    question: "Is the USA suitable for premium family vacations?",
    answer:
      "Yes. The USA has wide accommodation options, easy domestic connectivity, and experiences for all age groups.",
  },
];

const description =
  "Plan a United States luxury itinerary with IMxplorer featuring iconic city stays, curated coastal drives, national park journeys, and premium family-friendly travel design.";

export const metadata: Metadata = buildDestinationMetadata({
  slug: "usa",
  name: "United States",
  description,
  keywords: [
    "USA luxury travel",
    "United States private tours",
    "New York California itinerary",
    "USA national parks luxury",
    "USA family vacation premium",
    "America honeymoon routes",
  ],
  image: backgrounds[0],
});

export default function UsaDestinationPage() {
  const jsonLd = buildDestinationJsonLd({
    slug: "usa",
    name: "United States",
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
        name="United States"
        description={description}
        backgrounds={backgrounds}
        cards={[
          { title: "East Coast Icons", body: "New York, Boston, and historic urban experiences." },
          { title: "West Coast Style", body: "California coastlines, design stays, and wine country." },
          { title: "Nature Journeys", body: "National parks, scenic lodges, and private exploration." },
        ]}
        seoIntro="The United States offers immense variety for luxury travel, from iconic metropolitan energy to wild natural landscapes. A well-planned route can combine Broadway nights and Michelin-level dining with coastal drives, vineyard retreats, or national park immersion. Our itineraries emphasize efficient regional flow, premium transportation options, and elevated stays aligned with your travel goals."
        highlights={[
          "Combine New York city culture with West Coast design and culinary circuits.",
          "Include national parks with private guides and lodge-style premium stays.",
          "Use curated domestic flight and transfer planning for seamless multi-state travel.",
          "Add wine country, music routes, or wellness retreats based on your interests.",
        ]}
        facts={[
          { label: "Best Time", value: "April to June and September to November for broad routes." },
          { label: "Ideal Duration", value: "10 to 14 days for two to three major regions." },
          { label: "Best For", value: "Family travel, honeymoon, and milestone celebrations." },
          { label: "Top Pairing", value: "USA with Canada, Mexico, or Caribbean extensions." },
        ]}
        itinerary={[
          { day: "Day 1", plan: "Arrive New York with curated evening city experience." },
          { day: "Day 2", plan: "Landmarks, art, and private culinary route." },
          { day: "Day 3", plan: "Fly to California and settle into coastal luxury stay." },
          { day: "Day 4", plan: "Scenic drive and nature-focused premium excursion." },
        ]}
        faqs={faqs}
      />
    </>
  );
}
