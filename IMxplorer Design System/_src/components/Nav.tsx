"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type LenisLike = {
  scrollTo: (
    target: HTMLElement | string | number,
    options?: { duration?: number; offset?: number; immediate?: boolean },
  ) => void;
};

export default function Nav() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isLegalPage = pathname?.includes("/privacy-policy") ||
    pathname?.includes("/terms-of-service") ||
    pathname?.includes("/cookie-policy") ||
    pathname?.includes("/cancellation-refund-policy");

  const homeAnchors = {
    philosophy: pathname === "/" ? "#philosophy" : "/#philosophy",
    journey: pathname === "/" ? "#journey-section" : "/#journey-section",
  };

  const scrollToHomeSection = (sectionId: "philosophy" | "journey-section") => {
    if (pathname !== "/") return;

    const target = document.getElementById(sectionId);
    if (!target) return;

    const lenis = (window as unknown as { __IMX_LENIS?: LenisLike }).__IMX_LENIS;
    if (lenis) {
      lenis.scrollTo(target, { duration: 0.9, offset: 0 });
    } else {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    const nextHash = `#${sectionId}`;
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, "", nextHash);
    }
  };

  useEffect(() => {
    const onScroll = () => {
      const next = window.scrollY > 80;
      setIsScrolled((prev) => (prev === next ? prev : next));
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  return (
    <>
      <nav
        id="navbar"
        className={`fixed top-0 z-40 w-full text-white ${isScrolled ? "scrolled" : ""}`}
        style={{ display: isLegalPage ? "none" : undefined }}
      >
        <div className="nav-inner">
          <Link href="/" className="flex cursor-pointer items-center">
            <Image
              src={isLegalPage ? "/assets/images/logo_black.jpg" : "/assets/images/logo_white.png"}
              alt="IMxplorer - The Travel Co."
              width={205}
              height={64}
              className="nav-logo"
              priority
            />
          </Link>

          <div className="nav-links">
            {pathname === "/" ? (
              <button type="button" onClick={() => scrollToHomeSection("philosophy")}>
                Philosophy
              </button>
            ) : (
              <Link href={homeAnchors.philosophy}>Philosophy</Link>
            )}
            {pathname === "/" ? (
              <button type="button" onClick={() => scrollToHomeSection("journey-section")}>
                Journey
              </button>
            ) : (
              <Link href={homeAnchors.journey}>Journey</Link>
            )}
            <Link href="/about">About</Link>
            <Link href="/services">Services</Link>
            <Link href="/blogs">Blogs</Link>
            <Link href="/luxe">LUXE</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/contact" className="nav-cta hidden md:inline-block">
              Enquire
            </Link>
            <button
              id="menu-btn"
              className="flex flex-col gap-[6px] p-2 -mr-1 md:hidden"
              aria-label="Open menu"
              onClick={() => setIsMenuOpen(true)}
              type="button"
            >
              <span className="block h-[1.5px] w-[22px] bg-white transition-all duration-300" />
              <span className="block h-[1.5px] w-[22px] bg-white transition-all duration-300" />
            </button>
          </div>
        </div>
      </nav>

      <div id="mobile-menu" className={isMenuOpen ? "open" : ""}>
        <button
          id="menu-backdrop"
          aria-label="Close menu backdrop"
          onClick={() => setIsMenuOpen(false)}
          type="button"
        />

        <div id="menu-panel">
          <button
            id="menu-close"
            className="absolute top-7 right-7 flex h-9 w-9 items-center justify-center opacity-50 transition-opacity hover:opacity-100"
            aria-label="Close menu"
            onClick={() => setIsMenuOpen(false)}
            type="button"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M1 1L17 17M17 1L1 17"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <nav className="mb-16 flex flex-col gap-9">
            {pathname === "/" ? (
              <button
                type="button"
                className="menu-link"
                onClick={() => {
                  setIsMenuOpen(false);
                  scrollToHomeSection("philosophy");
                }}
              >
                Philosophy
              </button>
            ) : (
              <Link
                href={homeAnchors.philosophy}
                className="menu-link"
                onClick={() => setIsMenuOpen(false)}
              >
                Philosophy
              </Link>
            )}
            {pathname === "/" ? (
              <button
                type="button"
                className="menu-link"
                onClick={() => {
                  setIsMenuOpen(false);
                  scrollToHomeSection("journey-section");
                }}
              >
                Journey
              </button>
            ) : (
              <Link
                href={homeAnchors.journey}
                className="menu-link"
                onClick={() => setIsMenuOpen(false)}
              >
                Journey
              </Link>
            )}
            <Link
              href="/about"
              className="menu-link"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/services"
              className="menu-link"
              onClick={() => setIsMenuOpen(false)}
            >
              Services
            </Link>
            <Link
              href="/blogs"
              className="menu-link"
              onClick={() => setIsMenuOpen(false)}
            >
              Blogs
            </Link>
            <Link
              href="/luxe"
              className="menu-link"
              onClick={() => setIsMenuOpen(false)}
            >
              LUXE
            </Link>
            <Link
              href="/contact"
              className="menu-link"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </Link>
          </nav>

          <div className="border-t border-white/10 pt-8">
            <a
              href="https://wa.me/919811099951"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 font-sans text-[10px] uppercase tracking-[0.3em] text-white/40 transition-colors hover:text-white/80"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp Us
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
