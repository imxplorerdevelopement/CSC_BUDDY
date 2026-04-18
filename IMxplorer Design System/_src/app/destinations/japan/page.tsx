import DestinationHeroPage from "@/components/destinations/DestinationHeroPage";
import type { Metadata } from "next";
import {
  buildDestinationJsonLd,
  buildDestinationMetadata,
  toJsonLdString,
} from "../destinationSeo";

const backgrounds = [
  "https://images.unsplash.com/photo-1492571350019-22de08371fd3?auto=format&fit=crop&w=2400&q=80",
  "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=2400&q=80",
  "https://images.unsplash.com/photo-1480796927426-f609979314bd?auto=format&fit=crop&w=2400&q=80",
  "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=2400&q=80",
];

const faqs = [
  {
    question: "When is the best season to visit Japan?",
    answer:
      "Spring (March to May) and autumn (October to November) are ideal for scenery, weather comfort, and cultural touring.",
  },
  {
    question: "How long should a Japan itinerary be?",
    answer:
      "A 7 to 12 day route is recommended for Tokyo, Kyoto, and one nature or hot-spring extension.",
  },
  {
    question: "Can we combine modern cities with traditional Japan?",
    answer:
      "Yes. Most luxury itineraries blend Tokyo's contemporary scene with Kyoto, ryokan towns, and heritage experiences.",
  },
  {
    question: "Is Japan suitable for first-time international travelers?",
    answer:
      "Absolutely. Japan is safe, efficient, and ideal for structured premium travel with private support and clear logistics.",
  },
];

const description =
  "Experience Japan with IMxplorer through Tokyo and Kyoto luxury stays, private cultural access, ryokan retreats, and seasonal cherry blossom or autumn routes.";

export const metadata: Metadata = buildDestinationMetadata({
  slug: "japan",
  name: "Japan",
  description,
  keywords: [
    "Japan luxury travel",
    "Japan private itinerary",
    "Tokyo Kyoto luxury trip",
    "Japan honeymoon package",
    "Japan cherry blossom travel",
    "Japan ryokan experience",
  ],
  image: backgrounds[0],
});

export default function JapanDestinationPage() {
  const jsonLd = buildDestinationJsonLd({
    slug: "japan",
    name: "Japan",
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
        name="Japan"
        description={description}
        backgrounds={backgrounds}
        cards={[
          { title: "Tokyo", body: "Design hotels, fine dining, and contemporary city culture." },
          { title: "Kyoto", body: "Heritage districts, temple circuits, and curated tradition." },
          { title: "Nature & Ryokan", body: "Hot-spring retreats, mountain routes, and slow travel." },
        ]}
        seoIntro="Japan is a seamless blend of precision modernity and deep-rooted tradition, making it one of the world's strongest luxury destinations. Travelers can move from Tokyo's elevated dining and design scene to Kyoto's temple-lined neighborhoods and ryokan stays in scenic regions. Our planning approach optimizes train and transfer flow, seasonal crowd strategy, and private cultural experiences for a refined journey."
        highlights={[
          "Blend Tokyo and Kyoto with a carefully paced rail-led itinerary.",
          "Add private tea ceremonies, temple access, and traditional arts sessions.",
          "Include ryokan and onsen stays for restorative luxury downtime.",
          "Build travel windows around cherry blossoms, autumn foliage, or snow season.",
        ]}
        facts={[
          { label: "Best Time", value: "March to May and October to November." },
          { label: "Ideal Duration", value: "7 to 12 days for city and regional balance." },
          { label: "Best For", value: "Culture-rich luxury, honeymoon, and culinary travel." },
          { label: "Top Pairing", value: "Japan with South Korea, Singapore, or Taiwan routes." },
        ]}
        itinerary={[
          { day: "Day 1", plan: "Arrive Tokyo, private transfer, skyline dining." },
          { day: "Day 2", plan: "City neighborhoods, culinary route, and design districts." },
          { day: "Day 3", plan: "Shinkansen to Kyoto with heritage evening walk." },
          { day: "Day 4", plan: "Temple route and private cultural immersion session." },
        ]}
        faqs={faqs}
      />
    </>
  );
}


