"use client";

import { useEffect, useState } from "react";

type LenisLike = {
  scrollTo: (target: number, options?: { duration?: number; easing?: (t: number) => number }) => void;
};

export default function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const next = window.scrollY > window.innerHeight * 0.6;
      setVisible((prev) => (prev === next ? prev : next));
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onClick = () => {
    const lenis = (window as unknown as { __IMX_LENIS?: LenisLike }).__IMX_LENIS;
    if (lenis) {
      lenis.scrollTo(0, { duration: 1.2, easing: (t) => 1 - Math.pow(1 - t, 4) });
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      id="back-to-top"
      aria-label="Back to top"
      className={visible ? "visible" : ""}
      onClick={onClick}
      type="button"
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="2,8 6,4 10,8" />
      </svg>
      Back to Top
    </button>
  );
}
