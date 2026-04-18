"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const getHashTarget = () => {
  const hash = window.location.hash;
  if (!hash || hash === "#") {
    return null;
  }

  const rawId = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!rawId) {
    return null;
  }

  const decodedId = (() => {
    try {
      return decodeURIComponent(rawId);
    } catch {
      return rawId;
    }
  })();

  return document.getElementById(decodedId);
};

export default function LenisProvider() {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.1,
      wheelMultiplier: 0.75,
      smoothWheel: true,
      syncTouch: false,
    });

    lenisRef.current = lenis;

    (window as unknown as { __IMX_LENIS?: Lenis }).__IMX_LENIS = lenis;

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = window.requestAnimationFrame(raf);
    };

    rafId = window.requestAnimationFrame(raf);

    return () => {
      window.cancelAnimationFrame(rafId);
      lenisRef.current = null;
      lenis.destroy();
      delete (window as unknown as { __IMX_LENIS?: Lenis }).__IMX_LENIS;
    };
  }, []);

  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;

    // After route transitions, keep Lenis' internal state in sync with the real
    // scroll position/hash target to avoid post-navigation scroll stutter.
    let rafA = 0;
    let rafB = 0;

    rafA = window.requestAnimationFrame(() => {
      rafB = window.requestAnimationFrame(() => {
        lenis.resize();
        const target = getHashTarget();
        if (target) {
          lenis.scrollTo(target, { immediate: true, offset: 0 });
        } else {
          lenis.scrollTo(window.scrollY, { immediate: true });
        }
      });
    });

    return () => {
      window.cancelAnimationFrame(rafA);
      window.cancelAnimationFrame(rafB);
    };
  }, [pathname]);

  return null;
}
