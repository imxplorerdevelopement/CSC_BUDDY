import HniSection from "@/components/home/HniSection";

export const metadata = {
  title: "LUXE Concierge | IMxplorer",
  description:
    "Private air, hotel suites, yacht & marine, exclusive access, medical concierge, and visa services — curated for discerning travellers.",
};

export default function LuxePage() {
  return (
    <main className="flex-1">
      {/* -mt-32 cancels the top margin HniSection uses to clear JourneySection on homepage */}
      <div className="-mt-32 md:mt-0">
        <HniSection />
      </div>
    </main>
  );
}
