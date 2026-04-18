import type { Metadata } from "next";
import LegalDocumentPage from "@/components/legal/LegalDocumentPage";

export const metadata: Metadata = {
  title: "Privacy Policy | IMxplorer",
  description:
    "How IMxplorer collects, uses, stores, and protects personal information for travel planning and support.",
};

const sections = [
  {
    heading: "1. Information We Collect",
    paragraphs: [
      "To plan and manage travel, we may collect personal details such as your name, phone, email, city, travel preferences, and budget.",
      "For confirmed bookings, we may also collect traveler details required by suppliers or authorities, including passport information, date of birth, visa documents, and emergency contact data.",
    ],
  },
  {
    heading: "2. How We Use Your Information",
    bullets: [
      "To prepare custom itineraries, quotes, and booking options",
      "To coordinate with airlines, hotels, transport operators, embassies, and other service partners",
      "To provide support before, during, and after travel",
      "To send booking updates, service alerts, and important documentation",
      "To improve service quality, operations, and client experience",
    ],
  },
  {
    heading: "3. Communication and Marketing",
    paragraphs: [
      "We may contact you via call, email, WhatsApp, or SMS for service communication and relevant travel updates.",
      "You can opt out of promotional communication at any time, while operational communications related to active bookings may still be sent.",
    ],
  },
  {
    heading: "4. Sharing of Data",
    paragraphs: [
      "We share information only when needed to deliver services, fulfill legal requirements, or protect rights and safety.",
    ],
    bullets: [
      "Travel suppliers and visa/processing partners involved in your itinerary",
      "Technology and communication service providers supporting operations",
      "Regulators, law-enforcement, or authorities when required by law",
    ],
  },
  {
    heading: "5. Data Security and Retention",
    paragraphs: [
      "We use reasonable administrative and technical safeguards to protect personal information against unauthorized access, misuse, and disclosure.",
      "Data is retained only for as long as needed for business, compliance, tax, audit, dispute handling, and legal obligations.",
    ],
  },
  {
    heading: "6. Your Rights",
    paragraphs: [
      "Subject to applicable law, you may request access, correction, or deletion of personal data held by us, or withdraw consent for specific non-essential uses.",
      "We may request identity verification before processing rights-related requests.",
    ],
  },
  {
    heading: "7. Cookies and Tracking",
    paragraphs: [
      "Our website may use cookies and similar technologies to improve performance, security, analytics, and user experience.",
      "Please review our Cookie Policy for details and controls.",
    ],
  },
  {
    heading: "8. International Processing",
    paragraphs: [
      "Travel operations can involve international suppliers and systems. Your data may be processed in countries outside your residence as needed for itinerary delivery.",
      "When this happens, we aim to use appropriate safeguards under applicable law.",
    ],
  },
  {
    heading: "9. Policy Updates",
    paragraphs: [
      "We may update this policy periodically to reflect operational, legal, or regulatory changes. Updated versions are effective from the posted date.",
    ],
  },
  {
    heading: "10. Contact for Privacy Requests",
    bullets: [
      "Email: contact@imxplorer.com",
      "Phone: +91 98110 99951, +91 92117 36232",
      "Office: First Floor, Galaxy Blue Sapphire Plaza, Greater Noida West, UP, India",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalDocumentPage
      title="PRIVACY POLICY"
      intro="This policy explains how IMxplorer handles personal data across inquiry, planning, booking, and post-travel support."
      lastUpdated="April 1, 2026"
      sections={sections}
    />
  );
}
