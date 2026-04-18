import type { Metadata } from "next";
import BlogsPageClient from "@/components/blogs/BlogsPageClient";
import { posts } from "@/lib/data/blog-posts";

export const metadata: Metadata = {
  title: "Travel Journal | IMxplorer — The Travel Co.",
  description:
    "Destination guides, visa intelligence, and real travel stories from IMxplorer. Curated by people who've been there — crafted for travellers who mean it.",
  keywords: [
    "travel blog India",
    "Norway Northern Lights travel guide",
    "Dubai visa tips",
    "Japan itinerary",
    "luxury travel blog",
    "IMxplorer journal",
    "best destinations 2025",
    "study abroad guidance",
    "international travel tips India",
  ],
  openGraph: {
    title: "Travel Journal | IMxplorer",
    description:
      "Real travel stories and destination intelligence from IMxplorer's team.",
    type: "website",
  },
};

export default function BlogsPage() {
  return (
    <>
      {/* ── JSON-LD structured data for SEO ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            name: "IMxplorer Travel Journal",
            description: "Destination guides, visa intelligence, and real travel stories.",
            url: "https://imxplorer.com/blogs",
            publisher: {
              "@type": "Organization",
              name: "IMxplorer",
              url: "https://imxplorer.com",
            },
            blogPost: posts.map((p) => ({
              "@type": "BlogPosting",
              headline: p.title,
              description: p.excerpt,
              datePublished: p.isoDate,
              author: { "@type": "Organization", name: "IMxplorer" },
              keywords: p.tags.join(", "),
            })),
          }),
        }}
      />
      <BlogsPageClient />
    </>
  );
}
