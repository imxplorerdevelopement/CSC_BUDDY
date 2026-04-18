import DestinationHeroPage from "@/components/destinations/DestinationHeroPage";
import type { Metadata } from "next";
import {
  buildDestinationJsonLd,
  buildDestinationMetadata,
  toJsonLdString,
} from "../destinationSeo";

const backgrounds = [
  "https://images.unsplash.com/photo-1506973035872-a4f23ad2b9b8?auto=format&fit=crop&w=2400&q=80",
  "https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=2400&q=80",
  "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?auto=format&fit=crop&w=2400&q=80",
  "https://images.unsplash.com/photo-1524293581917-878a6d017c71?auto=format&fit=crop&w=2400&q=80",
];

const faqs = [
  {
    question: "What is the best time to visit Australia?",
    answer:
      "September to November and March to May are excellent for balanced weather across major city and coastal routes.",
  },
  {
    question: "How many days should I plan for Australia?",
    answer:
      "A 10 to 14 day itinerary is ideal for Sydney, the reef region, and a nature-focused extension.",
  },
  {
    question: "Can we combine city, reef, and outback experiences?",
    answer:
      "Yes. A well-designed route can include Sydney, Queensland reef access, and premium outback experiences.",
  },
  {
    question: "Is Australia good for honeymoon and family travel?",
    answer:
      "Absolutely. Australia offers excellent luxury resorts, outdoor adventures, and safe long-haul travel infrastructure.",
  },
];

const description =
  "Explore Australia with IMxplorer through Sydney luxury stays, Great Barrier Reef journeys, premium outback routes, and curated coast-to-nature itineraries.";

export const metadata: Metadata = buildDestinationMetadata({
  slug: "australia",
  name: "Australia",
  description,
  keywords: [
    "Australia luxury travel",
    "Australia private itinerary",
    "Sydney luxury vacation",
    "Great Barrier Reef premium tour",
    "Australia honeymoon package",
    "Australia family travel luxury",
  ],
  image: backgrounds[0],
});

export default function AustraliaDestinationPage() {
  const jsonLd = buildDestinationJsonLd({
    slug: "australia",
    name: "Australia",
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
        name="Australia"
        description={description}
        backgrounds={backgrounds}
        cards={[
          { title: "Sydney & Coast", body: "Harbour icons, design stays, and curated city living." },
          { title: "Queensland & Reef", body: "Tropical luxury, reef exploration, and island retreats." },
          { title: "Outback & Nature", body: "Remote landscapes with premium expedition comfort." },
        ]}
        seoIntro="Australia is a high-value destination for travelers seeking open landscapes, premium lifestyle cities, and world-class natural attractions in one journey. You can move from Sydney's iconic harbour culture to reef islands and red-earth outback experiences with strong hospitality standards throughout. Our itineraries focus on long-haul comfort, efficient internal routing, and luxury stays that match the character of each region."
        highlights={[
          "Combine Sydney's urban sophistication with reef and nature-rich experiences.",
          "Access premium Great Barrier Reef programs with private or small-group options.",
          "Add outback immersion and indigenous cultural interpretation with expert guides.",
          "Design long-haul routes with balanced pacing for comfort and jetlag recovery.",
        ]}
        facts={[
          { label: "Best Time", value: "September to November and March to May." },
          { label: "Ideal Duration", value: "10 to 14 days for city, reef, and nature routing." },
          { label: "Best For", value: "Honeymoon, family adventure, and luxury nature travel." },
          { label: "Top Pairing", value: "Australia with New Zealand, Singapore, or Bali routes." },
        ]}
        itinerary={[
          { day: "Day 1", plan: "Arrive Sydney, private harbour transfer, relaxed evening." },
          { day: "Day 2", plan: "City landmarks, coastal viewpoints, and premium dining." },
          { day: "Day 3", plan: "Fly to Queensland and transfer to tropical retreat." },
          { day: "Day 4", plan: "Great Barrier Reef program with curated luxury options." },
        ]}
        faqs={faqs}
      />
    </>
  );
}


