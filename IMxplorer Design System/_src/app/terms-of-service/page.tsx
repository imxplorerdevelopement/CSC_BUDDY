import type { Metadata } from "next";
import LegalDocumentPage from "@/components/legal/LegalDocumentPage";

export const metadata: Metadata = {
  title: "Terms of Service | IMxplorer",
  description:
    "Terms governing IMxplorer travel planning, bookings, payments, supplier liability, and client responsibilities.",
};

const sections = [
  {
    heading: "1. About IMxplorer",
    paragraphs: [
      "IMxplorer The Travel Co. is a customized travel advisory and booking facilitation company based in Greater Noida West, Uttar Pradesh, India.",
      "By using our website, submitting inquiries, or confirming travel with us, you agree to these Terms of Service.",
    ],
  },
  {
    heading: "2. Scope of Services",
    paragraphs: [
      "Our services can include itinerary planning, flights, hotels, visas, ground transport, cruises, insurance coordination, MICE support, student travel advisory, and concierge assistance.",
      "Every itinerary is customized. Inclusions and exclusions are valid only as written in your final proposal, invoice, or confirmation.",
    ],
  },
  {
    heading: "3. Quotes, Pricing, and Availability",
    paragraphs: [
      "Travel inventory and pricing are dynamic and can change before booking is confirmed.",
      "Quoted rates are subject to seat/room availability, currency movement, tax changes, and supplier revisions.",
    ],
    bullets: [
      "A quote does not guarantee inventory until confirmed in writing.",
      "Some rates may require immediate payment to secure.",
    ],
  },
  {
    heading: "4. Booking and Payment Terms",
    paragraphs: [
      "A booking is considered confirmed only after required payment is received and written confirmation is issued by IMxplorer and/or the relevant supplier.",
    ],
    bullets: [
      "Payment schedules may include non-refundable deposits.",
      "Delayed payment can lead to automatic cancellation by suppliers.",
      "Transaction/processing charges by banks or gateways are payable by the client unless otherwise stated.",
    ],
  },
  {
    heading: "5. Cancellations, Changes, and Refunds",
    paragraphs: [
      "Cancellation, rescheduling, and refund outcomes depend on supplier rules and the stage of your booking.",
      "IMxplorer service fees for planning, processing, and concierge work may be non-refundable once work starts.",
      "Please review our dedicated Cancellation & Refund Policy for detailed handling.",
    ],
  },
  {
    heading: "6. Travel Documents and Visa Responsibility",
    paragraphs: [
      "You are responsible for maintaining valid travel documents including passports, visas, permits, and health declarations.",
      "IMxplorer may assist with visa process support, but visa approval timelines and final decisions are controlled by embassies/authorities.",
    ],
  },
  {
    heading: "7. Third-Party Supplier Responsibility",
    paragraphs: [
      "Flights, hotels, transport operators, cruise providers, insurance providers, and activity operators are independent third parties.",
      "Their own terms and conditions apply to your booking and service delivery.",
      "IMxplorer is not liable for supplier-side delays, refusals, service interruptions, operational failures, strikes, weather disruption, or other events beyond our direct control.",
    ],
  },
  {
    heading: "8. Conduct and Right to Refuse Service",
    paragraphs: [
      "Travelers are expected to follow local laws and supplier conduct standards.",
      "IMxplorer reserves the right to refuse or discontinue service in cases of abusive, fraudulent, unsafe, or unlawful behavior.",
    ],
  },
  {
    heading: "9. Limitation of Liability",
    paragraphs: [
      "To the maximum extent permitted by applicable law, IMxplorer's liability is limited to the amount of professional/service fee paid directly to IMxplorer for the affected booking component.",
      "We are not liable for indirect or consequential losses including missed connections, loss of business, or loss caused by force majeure events.",
    ],
  },
  {
    heading: "10. Intellectual Property",
    paragraphs: [
      "All website content, custom itineraries, branding, and visual assets created by IMxplorer remain our intellectual property unless explicitly transferred in writing.",
      "Unauthorized copying, distribution, or commercial use is prohibited.",
    ],
  },
  {
    heading: "11. Governing Law and Jurisdiction",
    paragraphs: [
      "These Terms are governed by the laws of India.",
      "Any disputes are subject to the jurisdiction of courts in Uttar Pradesh, India, unless otherwise required by applicable law.",
    ],
  },
  {
    heading: "12. Contact",
    bullets: [
      "Email: contact@imxplorer.com",
      "Phone: +91 98110 99951, +91 92117 36232",
      "Office: First Floor, Galaxy Blue Sapphire Plaza, Greater Noida West, UP, India",
    ],
  },
];

export default function TermsOfServicePage() {
  return (
    <LegalDocumentPage
      title="TERMS OF SERVICE"
      intro="These terms set expectations for how IMxplorer plans and coordinates customized travel, and how bookings, supplier rules, and responsibilities are handled."
      lastUpdated="April 1, 2026"
      sections={sections}
    />
  );
}
