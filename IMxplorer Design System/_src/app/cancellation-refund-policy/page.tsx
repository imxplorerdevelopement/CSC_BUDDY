import type { Metadata } from "next";
import LegalDocumentPage from "@/components/legal/LegalDocumentPage";

export const metadata: Metadata = {
  title: "Cancellation & Refund Policy | IMxplorer",
  description:
    "Cancellation, rescheduling, and refund handling for IMxplorer travel planning and booking services.",
};

const sections = [
  {
    heading: "1. Policy Scope",
    paragraphs: [
      "This policy applies to travel services coordinated by IMxplorer, including flights, accommodation, visas, ground transport, cruises, insurance, and related concierge support.",
      "Every booking contains supplier-specific terms. Where supplier terms differ, supplier rules take precedence.",
    ],
  },
  {
    heading: "2. Cancellation Requests",
    paragraphs: [
      "All cancellation requests must be submitted in writing by email or WhatsApp from the booking contact person.",
      "The effective cancellation date is the date and time when the written request is received by IMxplorer.",
    ],
  },
  {
    heading: "3. Charges and Deductions",
    bullets: [
      "Supplier penalties may apply based on fare rules, room rates, visa stages, and cut-off dates.",
      "IMxplorer service/consultation/processing fees may be non-refundable once planning or execution has started.",
      "Bank charges, foreign exchange conversion loss, and payment gateway fees may be deducted where applicable.",
    ],
  },
  {
    heading: "4. Rescheduling and Amendments",
    paragraphs: [
      "Date changes, name corrections, route changes, or hotel amendments are subject to supplier approval and availability.",
      "Amendment fees from suppliers and additional fare/rate differences are payable by the client.",
    ],
  },
  {
    heading: "5. No-Show and Unused Services",
    paragraphs: [
      "Unused services, no-shows, or partially used itineraries are generally non-refundable unless the supplier explicitly approves otherwise.",
    ],
  },
  {
    heading: "6. Force Majeure",
    paragraphs: [
      "Refund outcomes affected by weather events, natural disasters, geopolitical restrictions, strikes, epidemics, government advisories, or transport shutdowns depend on supplier and authority decisions.",
      "IMxplorer will support rebooking or claim coordination where feasible, but cannot guarantee waivers.",
    ],
  },
  {
    heading: "7. Refund Timelines",
    paragraphs: [
      "When approved, refunds are processed after funds are received from relevant suppliers.",
      "Indicative processing windows can range from 7 to 21 business days, and may be longer for international supplier settlements.",
    ],
  },
  {
    heading: "8. Contact for Cancellation and Refund Support",
    bullets: [
      "Email: contact@imxplorer.com",
      "WhatsApp/Phone: +91 98110 99951",
      "Alternate Contact: +91 92117 36232",
    ],
  },
];

export default function CancellationRefundPolicyPage() {
  return (
    <LegalDocumentPage
      title="CANCELLATION & REFUND POLICY"
      intro="This policy explains how cancellation, amendment, and refund cases are managed for customized IMxplorer bookings."
      lastUpdated="April 1, 2026"
      sections={sections}
    />
  );
}
