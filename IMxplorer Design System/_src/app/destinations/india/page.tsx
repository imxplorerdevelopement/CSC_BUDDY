import DestinationHeroPage from "@/components/destinations/DestinationHeroPage";
import type { Metadata } from "next";
import {
  buildDestinationJsonLd,
  buildDestinationMetadata,
  toJsonLdString,
} from "../destinationSeo";

const backgrounds = [
  "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=2400&q=80",
  "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=2400&q=80",
  "https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&w=2400&q=80",
  "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?auto=format&fit=crop&w=2400&q=80",
];

const faqs = [
  {
    question: "What is the best time for a luxury India trip?",
    answer:
      "October to March is ideal for most regions, with cooler weather for Rajasthan, Delhi, Agra, and Kerala backwaters.",
  },
  {
    question: "How many days are recommended for India?",
    answer:
      "A 10 to 14 day itinerary offers a balanced mix of heritage cities, wildlife, wellness, and premium resort downtime.",
  },
  {
    question: "Can we combine culture and beach in one route?",
    answer:
      "Yes. Popular pairings include Jaipur and Udaipur with Goa, or Cochin and Munnar with a Maldives extension.",
  },
  {
    question: "Is India suitable for family luxury travel?",
    answer:
      "Absolutely. India offers family suites, private guides, child-friendly cultural activities, and curated intercity logistics.",
  },
];

const description =
  "Discover India with IMxplorer through curated luxury itineraries across Rajasthan palaces, Himalayan escapes, Kerala wellness retreats, and wildlife safaris with private concierge planning.";

export const metadata: Metadata = buildDestinationMetadata({
  slug: "india",
  name: "India",
  description,
  keywords: [
    "India luxury travel",
    "India private tours",
    "Rajasthan palace stays",
    "Kerala wellness retreat",
    "India honeymoon itinerary",
    "Golden Triangle luxury trip",
  ],
  image: backgrounds[0],
});

export default function IndiaDestinationPage() {
  const jsonLd = buildDestinationJsonLd({
    slug: "india",
    name: "India",
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
        name="India"
        description={description}
        backgrounds={backgrounds}
        cards={[
          { title: "North India", body: "Mughal heritage, palaces, and Himalayan gateways." },
          { title: "South India", body: "Ayurveda wellness, backwaters, and coastal serenity." },
          { title: "Wildlife & Culture", body: "Tiger reserves, craft trails, and private cultural access." },
        ]}
        seoIntro="India offers unmatched depth for luxury travelers seeking history, cuisine, design, spirituality, and nature in one journey. From royal palace hotels in Rajasthan to private houseboats in Kerala and guided temple corridors in Varanasi, every region delivers a distinct experience. Our planning model focuses on seamless domestic transfers, crowd-smart scheduling, and premium stays that match your travel style."
        highlights={[
          "Stay in restored palace hotels with curated royal city experiences.",
          "Add Ranthambore or Bandhavgarh safaris with expert naturalist-led drives.",
          "Combine Delhi, Agra, and Jaipur with private architecture and food walks.",
          "Unwind with Ayurveda-led programs in Kerala or luxury retreats in the hills.",
        ]}
        facts={[
          { label: "Best Time", value: "October to March for most circuits." },
          { label: "Ideal Duration", value: "10 to 14 days for a multi-region itinerary." },
          { label: "Best For", value: "Honeymoon, family trips, culture-first luxury journeys." },
          { label: "Top Pairing", value: "India with Maldives, UAE, or Sri Lanka extensions." },
        ]}
        itinerary={[
          { day: "Day 1", plan: "Arrive in Delhi, private transfer, heritage dinner circuit." },
          { day: "Day 2", plan: "Old and New Delhi with curated monuments and cuisine." },
          { day: "Day 3", plan: "Transfer to Agra and sunset view of the Taj Mahal." },
          { day: "Day 4", plan: "Drive to Jaipur, palace stay with evening cultural set menu." },
        ]}
        faqs={faqs}
      />
    </>
  );
}
