"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import NewsletterForm from "@/components/blogs/NewsletterForm";
import { posts } from "@/lib/data/blog-posts";

const categories = ["All", "Destination Guide", "Insider Perspective", "Practical Travel", "Visa & Docs", "Luxury Travel"];

// ── Theme tokens ──────────────────────────────────────────────────────────────
// Dark (night) — original design
// Light (day)  — warm white with reddish-rose tint

interface Theme {
  pageBg: string;
  mastheadGradient: string;
  ruleGradient: string;
  headingColor: string;
  subheadingColor: string;
  bodyText: string;
  mutedText: string;
  veryMuted: string;
  goldColor: string;
  goldBorder: string;
  goldBg: string;
  categoryActiveBorder: string;
  categoryActiveColor: string;
  categoryActiveBg: string;
  categoryBorder: string;
  categoryColor: string;
  cardBg: string;
  cardBorder: string;
  featuredOverlayRight: string;
  featuredOverlayMobile: string;
  gridCardOverlay: string;
  cardDivider: string;
  sectionLabelColor: string;
  sectionRuleBg: string;
  newsletterBg: string;
  newsletterGradient: string;
  newsletterBorder: string;
  tagBorder: string;
  tagColor: string;
  readBtnBorder: string;
  readBtnBg: string;
  readBtnColor: string;
  ctaLabelColor: string;
  toggleBg: string;
  toggleBorder: string;
  toggleColor: string;
}

const darkTheme: Theme = {
  pageBg: "#0c0c0e",
  mastheadGradient:
    "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(184,148,63,0.13), transparent 60%), radial-gradient(ellipse 60% 40% at 80% 60%, rgba(143,47,47,0.08), transparent 55%)",
  ruleGradient:
    "linear-gradient(90deg, transparent, rgba(184,148,63,0.25) 30%, rgba(184,148,63,0.25) 70%, transparent)",
  headingColor: "#ffffff",
  subheadingColor: "rgba(246,242,233,0.55)",
  bodyText: "rgba(255,255,255,0.55)",
  mutedText: "rgba(255,255,255,0.35)",
  veryMuted: "rgba(255,255,255,0.25)",
  goldColor: "rgba(184,148,63,0.95)",
  goldBorder: "rgba(184,148,63,0.4)",
  goldBg: "rgba(184,148,63,0.07)",
  categoryActiveBorder: "rgba(184,148,63,0.7)",
  categoryActiveColor: "rgba(184,148,63,0.95)",
  categoryActiveBg: "rgba(184,148,63,0.07)",
  categoryBorder: "rgba(255,255,255,0.1)",
  categoryColor: "rgba(255,255,255,0.4)",
  cardBg: "#111114",
  cardBorder: "rgba(255,255,255,0.07)",
  featuredOverlayRight: "linear-gradient(to right, transparent 60%, #111114 100%)",
  featuredOverlayMobile: "linear-gradient(to top, #111114 0%, transparent 60%)",
  gridCardOverlay: "linear-gradient(to top, #111114 0%, rgba(17,17,20,0.2) 55%, transparent 100%)",
  cardDivider: "rgba(255,255,255,0.06)",
  sectionLabelColor: "rgba(255,255,255,0.3)",
  sectionRuleBg: "rgba(255,255,255,0.06)",
  newsletterBg: "#0e0e11",
  newsletterGradient: "radial-gradient(ellipse 70% 80% at 50% 50%, rgba(184,148,63,0.06), transparent 65%)",
  newsletterBorder: "rgba(255,255,255,0.06)",
  tagBorder: "rgba(255,255,255,0.08)",
  tagColor: "rgba(255,255,255,0.4)",
  readBtnBorder: "rgba(255,255,255,0.15)",
  readBtnBg: "rgba(255,255,255,0.04)",
  readBtnColor: "rgba(255,255,255,0.8)",
  ctaLabelColor: "rgba(255,255,255,0.3)",
  toggleBg: "rgba(255,255,255,0.06)",
  toggleBorder: "rgba(255,255,255,0.15)",
  toggleColor: "rgba(255,255,255,0.7)",
};

// Day: warm white with a soft reddish-rose tint
const lightTheme: Theme = {
  pageBg: "#fdf6f4",
  mastheadGradient:
    "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(180,60,60,0.10), transparent 60%), radial-gradient(ellipse 60% 40% at 80% 60%, rgba(200,100,80,0.08), transparent 55%)",
  ruleGradient:
    "linear-gradient(90deg, transparent, rgba(180,60,60,0.22) 30%, rgba(180,60,60,0.22) 70%, transparent)",
  headingColor: "#1a0f0d",
  subheadingColor: "rgba(80,30,20,0.6)",
  bodyText: "rgba(50,20,15,0.65)",
  mutedText: "rgba(50,20,15,0.50)",
  veryMuted: "rgba(50,20,15,0.40)",
  goldColor: "rgba(160,55,40,0.95)",
  goldBorder: "rgba(160,55,40,0.4)",
  goldBg: "rgba(160,55,40,0.07)",
  categoryActiveBorder: "rgba(160,55,40,0.65)",
  categoryActiveColor: "rgba(160,55,40,0.95)",
  categoryActiveBg: "rgba(160,55,40,0.08)",
  categoryBorder: "rgba(50,20,15,0.18)",
  categoryColor: "rgba(50,20,15,0.50)",
  cardBg: "#fff8f6",
  cardBorder: "rgba(160,55,40,0.12)",
  featuredOverlayRight: "linear-gradient(to right, transparent 60%, #fff8f6 100%)",
  featuredOverlayMobile: "linear-gradient(to top, #fff8f6 0%, transparent 60%)",
  gridCardOverlay: "linear-gradient(to top, #fff8f6 0%, rgba(255,248,246,0.2) 55%, transparent 100%)",
  cardDivider: "rgba(160,55,40,0.1)",
  sectionLabelColor: "rgba(50,20,15,0.40)",
  sectionRuleBg: "rgba(160,55,40,0.1)",
  newsletterBg: "#f9eeeb",
  newsletterGradient: "radial-gradient(ellipse 70% 80% at 50% 50%, rgba(160,55,40,0.07), transparent 65%)",
  newsletterBorder: "rgba(160,55,40,0.1)",
  tagBorder: "rgba(50,20,15,0.12)",
  tagColor: "rgba(50,20,15,0.50)",
  readBtnBorder: "rgba(50,20,15,0.18)",
  readBtnBg: "rgba(50,20,15,0.04)",
  readBtnColor: "rgba(50,20,15,0.75)",
  ctaLabelColor: "rgba(50,20,15,0.45)",
  toggleBg: "rgba(50,20,15,0.06)",
  toggleBorder: "rgba(50,20,15,0.18)",
  toggleColor: "rgba(50,20,15,0.75)",
};

// ── Sun icon ──
function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

// ── Moon icon ──
function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function BlogsPageClient() {
  const [isDark, setIsDark] = useState(true);
  const t = isDark ? darkTheme : lightTheme;

  useEffect(() => {
    document.body.setAttribute("data-blog-theme", isDark ? "dark" : "light");
    return () => { document.body.removeAttribute("data-blog-theme"); };
  }, [isDark]);

  const [featured, ...rest] = posts;

  return (
    <main className="min-h-screen transition-colors duration-300" style={{ background: t.pageBg, color: t.headingColor }}>

      {/* ── MASTHEAD ── */}
      <section className="relative overflow-hidden pt-40 pb-20 md:pt-52 md:pb-28">
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: t.mastheadGradient }} />
        <div aria-hidden className="absolute bottom-0 left-0 right-0 h-px" style={{ background: t.ruleGradient }} />

        <div className="relative z-10 mx-auto max-w-6xl px-6 md:px-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-brand text-[0.6rem] tracking-[0.4em] uppercase mb-4" style={{ color: t.goldColor }}>
                IMxplorer Journal
              </p>
              <h1 className="font-serif font-light transition-colors duration-300" style={{ fontSize: "clamp(2.8rem, 6vw, 5.2rem)", lineHeight: 1.04, letterSpacing: "-0.01em", color: t.headingColor }}>
                Real places.<br />
                <span className="italic" style={{ color: t.subheadingColor }}>Real advice.</span>
              </h1>
              <p className="mt-6 max-w-xl font-sans text-sm leading-relaxed md:text-base" style={{ fontWeight: 300, color: t.bodyText }}>
                Written by people who plan travel for a living — not content farms. Every piece is built on first-hand knowledge from our consultants and clients.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {/* Day / Night toggle */}
              <button
                onClick={() => setIsDark((v) => !v)}
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2 font-sans text-[0.62rem] tracking-[0.18em] uppercase transition-all duration-300 hover:opacity-80"
                style={{ background: t.toggleBg, borderColor: t.toggleBorder, color: t.toggleColor }}
                aria-label={isDark ? "Switch to day mode" : "Switch to night mode"}
              >
                {isDark ? <SunIcon /> : <MoonIcon />}
                {isDark ? "Day" : "Night"}
              </button>

              <Link
                href="/contact"
                className="inline-flex items-center gap-3 rounded-full border px-5 py-2.5 font-sans text-[0.65rem] tracking-[0.22em] uppercase transition-all duration-300 hover:opacity-80"
                style={{ borderColor: t.goldBorder, color: t.goldColor, background: t.goldBg }}
              >
                Plan your trip
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Category filter */}
          <div className="mt-12 flex flex-wrap gap-2" role="list" aria-label="Article categories">
            {categories.map((cat, i) => (
              <span
                key={cat}
                role="listitem"
                className="rounded-full border px-4 py-1.5 font-sans text-[0.62rem] tracking-[0.18em] uppercase cursor-default transition-all duration-200"
                style={{
                  borderColor: i === 0 ? t.categoryActiveBorder : t.categoryBorder,
                  color: i === 0 ? t.categoryActiveColor : t.categoryColor,
                  background: i === 0 ? t.categoryActiveBg : "transparent",
                }}
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED POST ── */}
      <section className="mx-auto max-w-6xl px-6 pt-8 pb-4 md:px-10" aria-label="Featured article">
        <article
          className="group relative overflow-hidden rounded-3xl border transition-colors duration-300"
          style={{ borderColor: t.cardBorder, background: t.cardBg }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Image */}
            <div className="relative h-72 overflow-hidden md:h-auto md:min-h-[520px]">
              <Image
                src={featured.image}
                alt={featured.imageAlt}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                priority
              />
              <div className="absolute inset-0" style={{ background: t.featuredOverlayRight }} />
              <div className="absolute inset-0 md:hidden" style={{ background: t.featuredOverlayMobile }} />
              <div className="absolute top-5 left-5">
                <span
                  className="inline-block rounded-full px-3 py-1 font-brand text-[0.55rem] tracking-[0.28em] uppercase"
                  style={{
                    background: isDark ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.75)",
                    backdropFilter: "blur(8px)",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(160,55,40,0.2)"}`,
                    color: isDark ? "rgba(246,242,233,0.75)" : "rgba(80,20,10,0.85)",
                  }}
                >
                  Featured
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col justify-center p-8 md:p-12">
              <div className="flex items-center gap-3 mb-5">
                <span className="font-brand text-[0.55rem] tracking-[0.3em] uppercase" style={{ color: t.goldColor }}>
                  {featured.category}
                </span>
                <span className="h-px w-6" style={{ background: t.goldBorder }} />
                <span className="font-sans text-[0.65rem]" style={{ color: t.mutedText }}>{featured.date}</span>
                <span className="font-sans text-[0.65rem]" style={{ color: t.mutedText }}>·</span>
                <span className="font-sans text-[0.65rem]" style={{ color: t.mutedText }}>{featured.readTime}</span>
              </div>

              <h2
                className="font-serif font-light leading-snug mb-5 transition-colors duration-300"
                style={{ fontSize: "clamp(1.7rem, 2.6vw, 2.4rem)", letterSpacing: "-0.01em", color: t.headingColor }}
              >
                {featured.title}
              </h2>

              <p className="font-sans text-sm leading-relaxed mb-8" style={{ fontWeight: 300, maxWidth: "44ch", color: t.bodyText }}>
                {featured.excerpt}
              </p>

              <div className="flex flex-wrap gap-2 mb-8">
                {featured.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full px-3 py-1 font-sans text-[0.6rem] tracking-[0.12em] uppercase"
                    style={{ border: `1px solid ${t.tagBorder}`, color: t.tagColor }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <Link
                href={`/blogs/${featured.slug}`}
                className="group/btn inline-flex w-fit items-center gap-3 rounded-full border px-6 py-3 font-sans text-[0.65rem] tracking-[0.22em] uppercase transition-all duration-300 hover:opacity-80"
                style={{ borderColor: t.readBtnBorder, background: t.readBtnBg, color: t.readBtnColor }}
                aria-label={`Read full article: ${featured.title}`}
              >
                Read article
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="transition-transform duration-300 group-hover/btn:translate-x-0.5">
                  <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>
        </article>
      </section>

      {/* ── POST GRID ── */}
      <section className="mx-auto max-w-6xl px-6 pt-6 pb-24 md:px-10" aria-label="More articles">
        <div className="mb-8 flex items-center gap-4">
          <p className="font-brand text-[0.58rem] tracking-[0.3em] uppercase" style={{ color: t.sectionLabelColor }}>More stories</p>
          <div className="h-px flex-1" style={{ background: t.sectionRuleBg }} />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {rest.map((post) => (
            <article
              key={post.slug}
              className="group relative overflow-hidden rounded-2xl border flex flex-col transition-colors duration-300"
              style={{ borderColor: t.cardBorder, background: t.cardBg }}
            >
              {/* Image */}
              <div className="relative h-56 overflow-hidden">
                <Image
                  src={post.image}
                  alt={post.imageAlt}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0" style={{ background: t.gridCardOverlay }} />
                <div
                  className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{ background: `linear-gradient(90deg, ${post.accentColor}, transparent)` }}
                />
              </div>

              {/* Content */}
              <div className="flex flex-col flex-1 p-7">
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-brand text-[0.52rem] tracking-[0.28em] uppercase" style={{ color: t.goldColor }}>
                    {post.category}
                  </span>
                  <span className="h-px w-4" style={{ background: t.goldBorder }} />
                  <span className="font-sans text-[0.62rem]" style={{ color: t.mutedText }}>{post.readTime}</span>
                </div>

                <h2
                  className="font-serif font-light leading-snug mb-4 transition-colors duration-300"
                  style={{ fontSize: "clamp(1.25rem, 2vw, 1.6rem)", letterSpacing: "-0.01em", color: t.headingColor }}
                >
                  {post.title}
                </h2>

                <p className="font-sans text-sm leading-relaxed mb-6 flex-1" style={{ fontWeight: 300, color: t.bodyText }}>
                  {post.excerpt}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-6">
                  {post.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full px-2.5 py-0.5 font-sans text-[0.58rem] tracking-[0.1em] uppercase"
                      style={{ border: `1px solid ${t.tagBorder}`, color: t.tagColor }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t pt-5" style={{ borderColor: t.cardDivider }}>
                  <span className="font-sans text-[0.62rem]" style={{ color: t.veryMuted }}>{post.date}</span>
                  <Link
                    href={`/blogs/${post.slug}`}
                    className="group/link inline-flex items-center gap-2 font-sans text-[0.65rem] tracking-[0.18em] uppercase transition-colors duration-200 hover:opacity-80"
                    style={{ color: t.goldColor }}
                    aria-label={`Read: ${post.title}`}
                  >
                    Read
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="transition-transform duration-200 group-hover/link:translate-x-0.5">
                      <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── NEWSLETTER ── */}
      <section
        className="relative overflow-hidden border-t border-b transition-colors duration-300"
        style={{ borderColor: t.newsletterBorder, background: t.newsletterBg }}
        aria-label="Stay updated"
      >
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: t.newsletterGradient }} />
        <div className="relative z-10 mx-auto max-w-6xl px-6 py-20 md:px-10">
          <div className="flex flex-col items-center text-center gap-6 md:flex-row md:text-left md:justify-between md:items-center">
            <div>
              <p className="font-brand text-[0.58rem] tracking-[0.38em] uppercase mb-3" style={{ color: t.goldColor }}>
                Never miss a guide
              </p>
              <h2
                className="font-serif font-light transition-colors duration-300"
                style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.8rem)", lineHeight: 1.1, letterSpacing: "-0.01em", color: t.headingColor }}
              >
                New stories, every month.
              </h2>
              <p className="mt-3 font-sans text-sm max-w-md" style={{ fontWeight: 300, color: t.bodyText }}>
                Destination intelligence, visa updates, and itinerary guides — sent to people who actually travel.
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full md:w-auto md:min-w-[320px]">
              <NewsletterForm isDark={isDark} />
              <p className="font-sans text-[0.6rem] text-center md:text-left" style={{ color: t.veryMuted }}>
                No spam. Unsubscribe any time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="mx-auto max-w-6xl px-6 py-24 md:px-10 text-center">
        <p className="font-brand text-[0.58rem] tracking-[0.38em] uppercase mb-5" style={{ color: t.ctaLabelColor }}>
          Ready to go?
        </p>
        <h2
          className="font-serif font-light mx-auto transition-colors duration-300"
          style={{ fontSize: "clamp(2rem, 5vw, 4rem)", lineHeight: 1.05, letterSpacing: "-0.01em", maxWidth: "18ch", color: t.headingColor }}
        >
          Stop reading about it.{" "}
          <span className="italic" style={{ color: t.subheadingColor }}>Start planning it.</span>
        </h2>
        <div className="mt-10">
          <Link
            href="/contact"
            className="inline-flex items-center gap-3 rounded-full border px-8 py-4 font-sans text-[0.68rem] tracking-[0.25em] uppercase transition-all duration-300 hover:opacity-80"
            style={{ borderColor: t.goldBorder, color: t.goldColor, background: t.goldBg }}
          >
            Talk to a consultant
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </section>

    </main>
  );
}
