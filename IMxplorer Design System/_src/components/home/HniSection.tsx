"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type HniItem = {
  id: string;
  label: string;
  heading: string;
  body: string;
  navTitle: string;
  image: string;
};

const hniItems: HniItem[] = [
  {
    id: "private-air",
    label: "01 - Private Air",
    heading: "The Skies.\nReserved.",
    body: "Private jets, business charters, terminal-to-terminal management. You board when you are ready. We handle everything before you arrive.",
    navTitle: "Private Air",
    image:
      "https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&w=2400&q=80",
  },
  {
    id: "hotel-suites",
    label: "02 - Hotel Suites",
    heading: "Suites They\nDon't List Online.",
    body: "Our inventory access produces rooms that do not appear on any OTA. Rate parity is a myth. We know which properties hold their best rooms for relationships like ours.",
    navTitle: "Hotel Suites",
    image:
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=2400&q=80",
  },
  {
    id: "yacht-marine",
    label: "03 - Yacht & Marine",
    heading: "Water. On\nYour Schedule.",
    body: "Day charters, Maldives transfers, Mediterranean repositioning. We arrange what you decide and we confirm every detail before you are on board.",
    navTitle: "Yacht & Marine",
    image:
      "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=2400&q=80",
  },
  {
    id: "access-events",
    label: "04 - Access & Events",
    heading: "Into Every\nRoom.",
    body: "Grand Prix paddock, private cultural openings, exclusive hospitality suites. The doors that stay closed for most, we open. Quietly.",
    navTitle: "Access & Events",
    image:
      "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=2400&q=80",
  },
  {
    id: "medical-wellness",
    label: "05 - Medical & Wellness",
    heading: "Care Across\nBorders.",
    body: "International medical concierge, specialist appointments, luxury health retreat logistics. Your wellbeing travels with you, and so does our support.",
    navTitle: "Medical & Wellness",
    image:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=2400&q=80",
  },
  {
    id: "visas-residency",
    label: "06 - Visas & Residency",
    heading: "Every Document.\nHandled.",
    body: "Visas, residency applications, apostille, FRRO, every jurisdiction, every complexity. No queue. No follow-up calls. Done before you ask.",
    navTitle: "Visas & Residency",
    image:
      "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=2400&q=80",
  },
];

export default function HniSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [userInteracted, setUserInteracted] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const navWrapRef = useRef<HTMLDivElement | null>(null);
  const autoplayRef = useRef<number | null>(null);

  useEffect(() => {
    const navWrap = navWrapRef.current;
    if (!navWrap) return;
    const buttons = navWrap.querySelectorAll<HTMLButtonElement>(".hni-nav-btn");
    const btn = buttons[activeIndex];
    if (!btn) return;

    const btnLeft = btn.offsetLeft;
    const containerWidth = navWrap.clientWidth;
    navWrap.scrollTo({
      left: btnLeft - containerWidth / 2 + btn.clientWidth / 2,
      behavior: "smooth",
    });
  }, [activeIndex]);

  useEffect(() => {
    const startAutoplay = () => {
      if (userInteracted || activeIndex >= hniItems.length - 1) return;
      if (autoplayRef.current) window.clearInterval(autoplayRef.current);

      autoplayRef.current = window.setInterval(() => {
        setActiveIndex((prev) => {
          if (prev >= hniItems.length - 1) {
            if (autoplayRef.current) window.clearInterval(autoplayRef.current);
            return prev;
          }
          return prev + 1;
        });
      }, 2500);
    };

    const stopAutoplay = () => {
      if (autoplayRef.current) {
        window.clearInterval(autoplayRef.current);
        autoplayRef.current = null;
      }
    };

    const section = sectionRef.current;
    if (!section) return () => stopAutoplay();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) startAutoplay();
          else stopAutoplay();
        });
      },
      { threshold: 0.3 },
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
      stopAutoplay();
    };
  }, [activeIndex, userInteracted]);

  return (
    <section
      id="hni-section"
      ref={sectionRef}
      className="relative mt-32 flex min-h-[100dvh] flex-col justify-end bg-[#0d0b08] pb-24 md:mt-0 md:pb-32"
    >
      {hniItems.map((item, i) => (
        <div
          key={item.id}
          className={`absolute inset-0 z-0 transition-opacity duration-[1100ms] ${
            activeIndex === i ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={item.image}
            alt={item.navTitle}
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority={i === 0}
          />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(13,11,8,0.82)_0%,rgba(13,11,8,0.62)_50%,rgba(13,11,8,0.78)_100%)]" />
        </div>
      ))}

      <div className="relative z-20 mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-center px-8 pt-32 md:px-16">
        <div id="hni-eyebrow" className="mb-12">
          <span className="font-brand text-[0.72rem] font-bold tracking-[0.35em] text-imxGold/70 uppercase">
            Concierge &amp; HNI
          </span>
        </div>

        <div className="relative h-[360px] md:h-[400px]">
          {hniItems.map((item, i) => (
            <div
              key={item.id}
              className={`hni-panel absolute inset-0 z-10 flex max-w-[600px] flex-col justify-center p-0 transition-all duration-700 ${
                activeIndex === i
                  ? "translate-y-0 opacity-100 pointer-events-auto"
                  : "translate-y-6 opacity-0 pointer-events-none"
              }`}
            >
              <span className="hni-panel-label">{item.label}</span>
              <h3
                className="whitespace-pre-line font-serif text-white text-[clamp(3.1rem,5.9vw,5rem)] leading-[1.03] tracking-[-0.02em] font-[300]"
                style={{ textShadow: "0 2px 32px rgba(0,0,0,0.55)" }}
              >
                {item.heading}
              </h3>
              <p
                className="max-w-[520px] font-sans text-[1.06rem] leading-[1.78] tracking-[0.01em] text-white/75"
                style={{ textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}
              >
                {item.body}
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-3 font-brand text-[0.74rem] font-bold tracking-[0.23em] text-imxGold/90 uppercase transition-colors hover:text-imxLight"
              >
                Enquire Privately{" "}
                <span className="block h-px w-10 bg-current opacity-80" />
              </Link>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-20 mx-auto mt-12 w-full max-w-[1400px] overflow-x-auto px-8 md:px-16 hide-scrollbar">
        <div ref={navWrapRef} className="w-full overflow-x-auto hide-scrollbar">
          <div id="hni-nav" className="flex w-max items-center gap-6 pb-4 md:gap-8">
            {hniItems.map((item, i) => (
              <button
                key={item.id}
                type="button"
                className={`hni-nav-btn service-nav-btn ${activeIndex === i ? "active" : ""} ${activeIndex === i ? "" : "text-white/35"}`}
                onClick={() => {
                  setUserInteracted(true);
                  setActiveIndex(i);
                }}
                style={
                  activeIndex === i
                    ? {
                        borderBottomColor: "rgba(201,168,76,0.3)",
                        color: "rgba(201,168,76,0.5)",
                      }
                    : undefined
                }
              >
                {String(i + 1).padStart(2, "0")}
                <br />
                <span
                  className="text-[clamp(2.05rem,2.7vw,2.9rem)]"
                  style={activeIndex === i ? { color: "rgba(201,168,76,1)" } : { color: "rgba(255,255,255,0.5)" }}
                >
                  {item.navTitle}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
