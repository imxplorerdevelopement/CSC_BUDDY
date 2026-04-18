import type { Metadata } from "next";

type DestinationFaq = {
  question: string;
  answer: string;
};

type BuildDestinationMetadataArgs = {
  slug: string;
  name: string;
  description: string;
  keywords: string[];
  image: string;
};

type BuildDestinationJsonLdArgs = {
  slug: string;
  name: string;
  description: string;
  image: string;
  faqs: DestinationFaq[];
};

export function buildDestinationMetadata({
  slug,
  name,
  description,
  keywords,
  image,
}: BuildDestinationMetadataArgs): Metadata {
  const title = `${name} Luxury Travel Guide | IMxplorer`;

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: `/destinations/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: image,
          alt: `${name} luxury travel`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export function buildDestinationJsonLd({
  slug,
  name,
  description,
  image,
  faqs,
}: BuildDestinationJsonLdArgs) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TouristDestination",
        name,
        description,
        image,
        url: `/destinations/${slug}`,
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  };
}

export function toJsonLdString(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
