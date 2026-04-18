"use client";

import Link from "next/link";
import Image from "next/image";

type LegalSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

type LegalDocumentPageProps = {
  title: string;
  intro: string;
  lastUpdated: string;
  sections: LegalSection[];
};

const LEGAL_LINKS = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-of-service", label: "Terms of Service" },
  { href: "/cookie-policy", label: "Cookie Policy" },
  { href: "/cancellation-refund-policy", label: "Cancellation & Refund" },
];

export default function LegalDocumentPage({
  title,
  intro,
  lastUpdated,
  sections,
}: LegalDocumentPageProps) {
  return (
    <main className="relative overflow-hidden bg-white px-6 pt-24 pb-24 text-black sm:px-8 md:px-12">
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 1200 1200" preserveAspectRatio="xMidYMid slice">
        <defs>
          <style>{`
            @keyframes float1 { 0% { cy: 100; opacity: 0.7; } 50% { cy: 80; opacity: 0.4; } 100% { cy: 100; opacity: 0.7; } }
            @keyframes float2 { 0% { cy: 150; opacity: 0.5; } 50% { cy: 120; opacity: 0.3; } 100% { cy: 150; opacity: 0.5; } }
            @keyframes float3 { 0% { cy: 200; opacity: 0.6; } 50% { cy: 170; opacity: 0.35; } 100% { cy: 200; opacity: 0.6; } }
            @keyframes float4 { 0% { cy: 80; opacity: 0.65; } 50% { cy: 50; opacity: 0.4; } 100% { cy: 80; opacity: 0.65; } }
            @keyframes float5 { 0% { cy: 180; opacity: 0.55; } 50% { cy: 150; opacity: 0.32; } 100% { cy: 180; opacity: 0.55; } }
            @keyframes float6 { 0% { cy: 120; opacity: 0.7; } 50% { cy: 90; opacity: 0.38; } 100% { cy: 120; opacity: 0.7; } }
            @keyframes float7 { 0% { cy: 160; opacity: 0.6; } 50% { cy: 130; opacity: 0.36; } 100% { cy: 160; opacity: 0.6; } }
            @keyframes float8 { 0% { cy: 110; opacity: 0.52; } 50% { cy: 80; opacity: 0.3; } 100% { cy: 110; opacity: 0.52; } }
            .particle { filter: drop-shadow(0 0 2px rgba(255,80,100,0.4)); }
          `}</style>
        </defs>

        {/* Row 1 */}
        <circle cx="80" cy="100" r="2.5" fill="#ff5064" opacity="0.7" style={{animation: 'float1 5s ease-in-out infinite'}} className="particle" />
        <circle cx="180" cy="130" r="2" fill="#ff6478" opacity="0.65" style={{animation: 'float2 6s ease-in-out infinite'}} className="particle" />
        <circle cx="280" cy="95" r="2.2" fill="#ff4f60" opacity="0.7" style={{animation: 'float3 5.5s ease-in-out infinite'}} className="particle" />
        <circle cx="380" cy="140" r="1.8" fill="#ff7080" opacity="0.6" style={{animation: 'float4 6.5s ease-in-out infinite'}} className="particle" />
        <circle cx="480" cy="110" r="2.3" fill="#ff5568" opacity="0.68" style={{animation: 'float5 5.8s ease-in-out infinite'}} className="particle" />
        <circle cx="580" cy="125" r="2" fill="#ff6880" opacity="0.64" style={{animation: 'float6 6.2s ease-in-out infinite'}} className="particle" />
        <circle cx="680" cy="105" r="2.1" fill="#ff5070" opacity="0.66" style={{animation: 'float7 5.9s ease-in-out infinite'}} className="particle" />
        <circle cx="780" cy="135" r="1.9" fill="#ff7088" opacity="0.62" style={{animation: 'float8 6.3s ease-in-out infinite'}} className="particle" />
        <circle cx="880" cy="115" r="2.2" fill="#ff5564" opacity="0.67" style={{animation: 'float1 5.7s ease-in-out infinite'}} className="particle" />
        <circle cx="980" cy="128" r="2" fill="#ff6888" opacity="0.63" style={{animation: 'float2 6.1s ease-in-out infinite'}} className="particle" />

        {/* Row 2 */}
        <circle cx="120" cy="250" r="2" fill="#ff6478" opacity="0.65" style={{animation: 'float3 6s ease-in-out infinite'}} className="particle" />
        <circle cx="240" cy="280" r="2.2" fill="#ff4f60" opacity="0.7" style={{animation: 'float4 5.5s ease-in-out infinite'}} className="particle" />
        <circle cx="360" cy="260" r="1.9" fill="#ff7080" opacity="0.61" style={{animation: 'float5 6.4s ease-in-out infinite'}} className="particle" />
        <circle cx="480" cy="290" r="2.1" fill="#ff5568" opacity="0.69" style={{animation: 'float6 5.9s ease-in-out infinite'}} className="particle" />
        <circle cx="600" cy="270" r="2" fill="#ff6880" opacity="0.64" style={{animation: 'float7 6.2s ease-in-out infinite'}} className="particle" />
        <circle cx="720" cy="295" r="2.3" fill="#ff5070" opacity="0.68" style={{animation: 'float8 5.7s ease-in-out infinite'}} className="particle" />
        <circle cx="840" cy="275" r="1.8" fill="#ff7088" opacity="0.59" style={{animation: 'float1 6.1s ease-in-out infinite'}} className="particle" />
        <circle cx="950" cy="285" r="2.2" fill="#ff5564" opacity="0.67" style={{animation: 'float2 5.8s ease-in-out infinite'}} className="particle" />

        {/* Row 3 */}
        <circle cx="100" cy="420" r="2.1" fill="#ff5070" opacity="0.68" style={{animation: 'float4 6.3s ease-in-out infinite'}} className="particle" />
        <circle cx="220" cy="450" r="2" fill="#ff7080" opacity="0.62" style={{animation: 'float5 5.6s ease-in-out infinite'}} className="particle" />
        <circle cx="340" cy="430" r="2.2" fill="#ff5568" opacity="0.7" style={{animation: 'float6 6.2s ease-in-out infinite'}} className="particle" />
        <circle cx="460" cy="460" r="1.9" fill="#ff6880" opacity="0.63" style={{animation: 'float7 5.9s ease-in-out infinite'}} className="particle" />
        <circle cx="580" cy="440" r="2.3" fill="#ff4f60" opacity="0.72" style={{animation: 'float8 6.1s ease-in-out infinite'}} className="particle" />
        <circle cx="700" cy="465" r="2" fill="#ff5564" opacity="0.65" style={{animation: 'float1 5.8s ease-in-out infinite'}} className="particle" />
        <circle cx="820" cy="445" r="2.1" fill="#ff6478" opacity="0.68" style={{animation: 'float2 6.3s ease-in-out infinite'}} className="particle" />
        <circle cx="920" cy="470" r="1.8" fill="#ff7088" opacity="0.6" style={{animation: 'float3 5.9s ease-in-out infinite'}} className="particle" />

        {/* Row 4 */}
        <circle cx="150" cy="580" r="2" fill="#ff5564" opacity="0.64" style={{animation: 'float5 6s ease-in-out infinite'}} className="particle" />
        <circle cx="280" cy="610" r="2.2" fill="#ff6478" opacity="0.69" style={{animation: 'float6 5.7s ease-in-out infinite'}} className="particle" />
        <circle cx="400" cy="590" r="1.9" fill="#ff4f60" opacity="0.62" style={{animation: 'float7 6.2s ease-in-out infinite'}} className="particle" />
        <circle cx="520" cy="620" r="2.1" fill="#ff7080" opacity="0.67" style={{animation: 'float8 5.8s ease-in-out infinite'}} className="particle" />
        <circle cx="640" cy="600" r="2" fill="#ff5568" opacity="0.66" style={{animation: 'float1 6.1s ease-in-out infinite'}} className="particle" />
        <circle cx="760" cy="625" r="2.3" fill="#ff6880" opacity="0.71" style={{animation: 'float2 5.9s ease-in-out infinite'}} className="particle" />
        <circle cx="880" cy="605" r="1.8" fill="#ff5070" opacity="0.6" style={{animation: 'float3 6.2s ease-in-out infinite'}} className="particle" />
        <circle cx="1000" cy="630" r="2.2" fill="#ff7088" opacity="0.68" style={{animation: 'float4 5.8s ease-in-out infinite'}} className="particle" />
      </svg>
      <div className="relative mx-auto max-w-5xl z-10">
        <div className="flex justify-center mb-12">
          <Image
            src="/assets/images/logo_black.jpg"
            alt="IMxplorer Logo"
            width={120}
            height={60}
            priority
          />
        </div>
        <header className="rounded-none bg-white p-8 md:p-12">
          <p className="text-[0.68rem] tracking-[0.3em] text-gray-400 uppercase" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
            Legal
          </p>
          <h1 className="mt-5 text-4xl text-black md:text-6xl" style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: 'bold' }}>{title}</h1>
          <p className="mt-6 max-w-3xl text-sm leading-relaxed text-gray-700 md:text-base" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
            {intro}
          </p>
          <p className="mt-8 text-[0.7rem] tracking-[0.22em] text-gray-400 uppercase" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
            Last Updated: {lastUpdated}
          </p>
        </header>

        <div className="mt-10 rounded-none bg-white p-8 md:p-12">
          <div className="space-y-9">
            {sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-2xl text-black md:text-3xl" style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: 'bold' }}>
                  {section.heading}
                </h2>
                <div className="mt-4 space-y-4">
                  {section.paragraphs?.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-sm leading-relaxed text-gray-800 md:text-base"
                      style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
                {section.bullets?.length ? (
                  <ul className="mt-4 space-y-2 pl-5">
                    {section.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="list-disc marker:text-imxRed text-sm leading-relaxed text-gray-800 md:text-base"
                        style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
                      >
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>
        </div>

        <div className="mt-10 rounded-none bg-white p-6 md:p-8">
          <h2 className="text-2xl text-black" style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: 'bold' }}>All Legal Pages</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-gray-300 bg-white px-4 py-2 text-[0.68rem] tracking-[0.2em] text-gray-700 uppercase transition-all duration-300 hover:border-imxRed hover:text-imxRed"
                style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <p className="mt-6 text-xs leading-relaxed text-gray-600 md:text-sm" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
            Questions about these policies can be sent to{" "}
            <a
              className="text-gray-700 transition-colors hover:text-imxRed"
              href="mailto:contact@imxplorer.com"
            >
              contact@imxplorer.com
            </a>{" "}
            or shared on WhatsApp at{" "}
            <a
              className="text-gray-700 transition-colors hover:text-imxRed"
              href="https://wa.me/919811099951"
              target="_blank"
              rel="noopener noreferrer"
            >
              +91 98110 99951
            </a>
            .
          </p>
        </div>
      </div>

    </main>
  );
}
