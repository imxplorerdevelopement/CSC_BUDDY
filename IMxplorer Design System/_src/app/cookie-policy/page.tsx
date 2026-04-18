import type { Metadata } from "next";
import LegalDocumentPage from "@/components/legal/LegalDocumentPage";

export const metadata: Metadata = {
  title: "Cookie Policy | IMxplorer",
  description:
    "How IMxplorer uses cookies and similar technologies to run and improve the website.",
};

const sections = [
  {
    heading: "1. What Are Cookies",
    paragraphs: [
      "Cookies are small text files stored on your device when you visit a website. They help the site function correctly and improve your browsing experience.",
    ],
  },
  {
    heading: "2. How We Use Cookies",
    bullets: [
      "Essential cookies: keep key website features functioning",
      "Preference cookies: remember settings and improve usability",
      "Analytics cookies: understand site traffic and behavior trends",
      "Security cookies: support fraud prevention and technical protection",
    ],
  },
  {
    heading: "3. Third-Party Cookies",
    paragraphs: [
      "Some features may rely on third-party tools for analytics, media, map display, or communication. These providers may set their own cookies under their independent policies.",
    ],
  },
  {
    heading: "4. Managing Cookies",
    paragraphs: [
      "Most browsers allow you to block, allow, or delete cookies through browser settings.",
      "Disabling some cookies may affect website functionality and form performance.",
    ],
  },
  {
    heading: "5. Policy Changes",
    paragraphs: [
      "We may update this Cookie Policy from time to time to reflect website, technology, or legal updates. The latest version is always posted on this page.",
    ],
  },
  {
    heading: "6. Contact",
    bullets: [
      "Email: contact@imxplorer.com",
      "Phone: +91 98110 99951, +91 92117 36232",
    ],
  },
];

export default function CookiePolicyPage() {
  return (
    <LegalDocumentPage
      title="COOKIE POLICY"
      intro="This policy describes the cookies and related technologies used on IMxplorer digital properties."
      lastUpdated="April 1, 2026"
      sections={sections}
    />
  );
}
