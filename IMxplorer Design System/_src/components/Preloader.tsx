"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function Preloader() {
  const [isLogoActive, setIsLogoActive] = useState(false);
  const [isBarRunning, setIsBarRunning] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    document.body.classList.add("loading");

    const introTimer = window.setTimeout(() => {
      setIsLogoActive(true);
      setIsBarRunning(true);
    }, 100);

    const fadeTimer = window.setTimeout(() => {
      setIsFading(true);
    }, 2400);

    const removeTimer = window.setTimeout(() => {
      setIsVisible(false);
      document.body.classList.remove("loading");
      window.dispatchEvent(new Event("imx:preloader-done"));
    }, 3000);

    return () => {
      window.clearTimeout(introTimer);
      window.clearTimeout(fadeTimer);
      window.clearTimeout(removeTimer);
      document.body.classList.remove("loading");
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div id="preloader" className={isFading ? "fade-out" : ""}>
      <div className={`preloader-logo${isLogoActive ? " active" : ""}`}>
        <Image
          src="/assets/images/logo_white.png"
          alt="IMxplorer - The Travel Co."
          width={286}
          height={90}
          className="h-[50px] w-auto md:h-[72px]"
          priority
        />
        <div className="preloader-progress">
          <div className={`preloader-bar${isBarRunning ? " run" : ""}`} />
        </div>
      </div>
    </div>
  );
}
