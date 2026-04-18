"use client";

import { useEffect, useMemo, useRef } from "react";

type JourneyStep = {
  step: string;
  title: string;
  body: string;
  side: "left-card" | "right-card";
  top: string;
  threshold: number;
  isGold?: boolean;
};

const steps: JourneyStep[] = [
  {
    step: "01",
    title: "You Reach Out",
    body: "A call, a message, a referral. That's all it takes.",
    side: "left-card",
    top: "30vh",
    threshold: 0.07,
  },
  {
    step: "02",
    title: "We Listen",
    body: "One-on-one. Your family, your preferences, your budget. No forms, no bots.",
    side: "right-card",
    top: "39.5vh",
    threshold: 0.21,
  },
  {
    step: "03",
    title: "We Build It",
    body: "Flights, hotels, visas, transport, insurance. Every detail. From scratch.",
    side: "left-card",
    top: "49vh",
    threshold: 0.36,
  },
  {
    step: "04",
    title: "We Beat The Price",
    body: "Same hotels, same flights, 90% of the time, cheaper than any OTA.",
    side: "right-card",
    top: "58.5vh",
    threshold: 0.5,
  },
  {
    step: "05",
    title: "Everything Confirmed",
    body: "Tickets issued, visas processed, transfers booked. You just pack.",
    side: "left-card",
    top: "68vh",
    threshold: 0.64,
  },
  {
    step: "06",
    title: "We Travel With You",
    body: "24/7 on-call support. Delays, changes, emergencies, we are there.",
    side: "right-card",
    top: "77.5vh",
    threshold: 0.79,
  },
  {
    step: "07",
    title: "Safe Return",
    body: "Our job ends when you are home. That is why 90% come back to us.",
    side: "left-card",
    top: "86vh",
    threshold: 0.93,
    isGold: true,
  },
];

const dotPositions = [
  ["100", "70", "5"],
  ["50", "165", "5"],
  ["150", "260", "5"],
  ["50", "355", "5"],
  ["150", "450", "5"],
  ["50", "545", "5"],
  ["100", "630", "7"],
] as const;

const particleConfigs = [
  { left: "14%", top: "19%", size: 3, alpha: 0.22, phase: 0.3 },
  { right: "11%", top: "52%", size: 2, alpha: 0.18, phase: 1.1 },
  { left: "21%", top: "74%", size: 4, alpha: 0.13, phase: 2.4 },
  { right: "24%", top: "33%", size: 2, alpha: 0.17, phase: 3.2 },
];

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smoothstep = (value: number) => value * value * (3 - 2 * value);

function magnetizeProgress(progress: number) {
  let next = progress;
  for (const step of steps) {
    const dist = Math.abs(next - step.threshold);
    const radius = 0.055;
    if (dist < radius) {
      const pull = 1 - dist / radius;
      next += (step.threshold - next) * 0.22 * pull * pull;
    }
  }
  return clamp01(next);
}

export default function JourneySection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const roadWrapRef = useRef<HTMLDivElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const headlightRef = useRef<SVGCircleElement | null>(null);
  const trailRef = useRef<SVGCircleElement | null>(null);
  const finishRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const dotRefs = useRef<Array<SVGCircleElement | null>>([]);
  const particleRefs = useRef<Array<HTMLDivElement | null>>([]);
  const progressRef = useRef(0);
  const targetProgressRef = useRef(0);
  const trailProgressRef = useRef(0);
  const pathLengthRef = useRef(0);
  const rafRef = useRef(0);

  const particleElements = useMemo(() => particleConfigs, []);

  useEffect(() => {
    if (roadWrapRef.current && window.innerWidth < 768) {
      roadWrapRef.current.style.width = "60px";
    }

    if (pathRef.current) {
      const length = pathRef.current.getTotalLength();
      pathLengthRef.current = length;
      pathRef.current.style.strokeDasharray = String(length);
      pathRef.current.style.strokeDashoffset = String(length);
    }

    const animate = (time: number) => {
      const section = sectionRef.current;
      const path = pathRef.current;
      if (section && path && pathLengthRef.current > 0) {
        const rect = section.getBoundingClientRect();
        const scrollable = section.offsetHeight - window.innerHeight;
        const rawProgress = scrollable > 0 ? clamp01(-rect.top / scrollable) : 0;
        targetProgressRef.current = magnetizeProgress(rawProgress);

        progressRef.current += (targetProgressRef.current - progressRef.current) * 0.14;
        trailProgressRef.current += (progressRef.current - trailProgressRef.current) * 0.08;

        const progress = progressRef.current;
        const length = pathLengthRef.current;
        path.style.strokeDashoffset = String(length * (1 - progress));

        try {
          const headPt = path.getPointAtLength(length * progress);
          const trailPt = path.getPointAtLength(length * trailProgressRef.current);
          headlightRef.current?.setAttribute("cx", String(headPt.x));
          headlightRef.current?.setAttribute("cy", String(headPt.y));
          trailRef.current?.setAttribute("cx", String(trailPt.x));
          trailRef.current?.setAttribute("cy", String(trailPt.y));
        } catch {
          // ignore transient svg sampling issues
        }

        steps.forEach((step, index) => {
          const dot = dotRefs.current[index];
          const card = cardRefs.current[index];

          const proximity = clamp01(1 - Math.abs(progress - step.threshold) / 0.1);
          const pulse = smoothstep(proximity);

          if (dot) {
            dot.style.opacity = String(0.18 + pulse * 0.82);
            dot.style.transform = `scale(${1 + pulse * 0.9})`;
            dot.style.filter = `drop-shadow(0 0 ${4 + pulse * 9}px rgba(214,5,43,${0.2 + pulse * 0.5}))`;
          }

          if (card) {
            const reveal = smoothstep(
              clamp01((progress - (step.threshold - 0.075)) / 0.12),
            );
            const baseX = step.side === "left-card" ? -26 : 26;
            const parallaxY = Math.sin(time * 0.0014 + index * 0.9) * 3 + (0.5 - progress) * 5;
            const x = baseX * (1 - reveal);
            card.style.opacity = String(reveal * (0.72 + pulse * 0.28));
            card.style.transform = `translateX(${x}px) translateY(calc(-50% + ${parallaxY}px))`;
            card.style.boxShadow = `0 0 0 1px rgba(214,5,43,${0.08 + pulse * 0.16}), 0 8px 32px rgba(214,5,43,${0.08 + pulse * 0.18}), inset 0 1px 0 rgba(255,255,255,0.06)`;
          }
        });

        if (finishRef.current) {
          const finishReveal = smoothstep(clamp01((progress - 0.9) / 0.08));
          finishRef.current.style.opacity = String(finishReveal);
          finishRef.current.style.transform = `translateX(-50%) translateY(${10 - finishReveal * 10}px)`;
        }

        particleRefs.current.forEach((particle, index) => {
          if (!particle) return;
          const config = particleConfigs[index];
          const drift = Math.sin(time * 0.001 + config.phase + progress * 4) * 6;
          const driftX = Math.cos(time * 0.0008 + config.phase) * 3;
          particle.style.transform = `translate(${driftX}px, ${drift}px)`;
          particle.style.opacity = String(config.alpha + Math.abs(drift) * 0.008);
        });
      }

      rafRef.current = window.requestAnimationFrame(animate);
    };

    rafRef.current = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <section
      id="journey-section"
      ref={sectionRef}
      className="journey-dynamic relative bg-[#0a0a0a]"
      style={{ height: "360vh" }}
    >
      <div id="journey-sticky" className="relative h-screen overflow-hidden" style={{ position: "sticky", top: 0 }}>
        {particleElements.map((particle, idx) => (
          <div
            key={`particle-${idx}`}
            ref={(el) => {
              particleRefs.current[idx] = el;
            }}
            aria-hidden
            className="journey-particle"
            style={{
              left: particle.left,
              right: particle.right,
              top: particle.top,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              background: `rgba(201,168,76,${particle.alpha})`,
            }}
          />
        ))}

        <div className="pointer-events-none absolute top-[7vh] right-0 left-0 z-20 text-center">
          <span className="mb-3 block font-sans text-[10px] font-bold tracking-[0.3em] text-imxRed uppercase">
            The Journey
          </span>
          <h2 className="font-serif text-white italic leading-[1.2] text-[clamp(1.5rem,3vw,2.8rem)]">
            From First Call to Safe Return.
          </h2>
        </div>

        <div
          id="journey-road-wrap"
          ref={roadWrapRef}
          className="journey-road-wrap pointer-events-none absolute left-1/2 top-[21vh] h-[74vh] w-[200px] -translate-x-1/2"
        >
          <svg viewBox="0 0 200 700" preserveAspectRatio="none" width="100%" height="100%" className="block">
            <defs>
              <linearGradient id="jGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#D6052B" />
                <stop offset="100%" stopColor="rgba(201,168,76,0.85)" />
              </linearGradient>
              <filter id="jGlow" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="7" in="SourceGraphic" />
              </filter>
            </defs>

            <path
              className="road-stroke"
              d="M 100 10 C 100 38 100 58 100 70 C 100 97 50 138 50 165 C 50 192 150 233 150 260 C 150 287 50 328 50 355 C 50 382 150 423 150 450 C 150 477 50 518 50 545 C 50 572 100 603 100 630 L 100 700"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="22"
              fill="none"
              strokeLinecap="round"
            />
            <path
              className="road-stroke"
              d="M 100 10 C 100 38 100 58 100 70 C 100 97 50 138 50 165 C 50 192 150 233 150 260 C 150 287 50 328 50 355 C 50 382 150 423 150 450 C 150 477 50 518 50 545 C 50 572 100 603 100 630 L 100 700"
              stroke="rgba(201,168,76,0.13)"
              strokeWidth="1.5"
              fill="none"
              strokeDasharray="7 11"
              strokeLinecap="round"
            />

            <circle ref={trailRef} cx="100" cy="10" r="28" fill="rgba(214,5,43,0.08)" filter="url(#jGlow)" />
            <circle ref={headlightRef} id="j-headlight" cx="100" cy="10" r="18" fill="rgba(214,5,43,0.15)" filter="url(#jGlow)" />

            <path
              id="journey-progress-path"
              ref={pathRef}
              className="road-stroke"
              d="M 100 10 C 100 38 100 58 100 70 C 100 97 50 138 50 165 C 50 192 150 233 150 260 C 150 287 50 328 50 355 C 50 382 150 423 150 450 C 150 477 50 518 50 545 C 50 572 100 603 100 630 L 100 700"
              stroke="url(#jGrad)"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />

            {steps.map((step, index) => {
              const [cx, cy, r] = dotPositions[index];
              return (
                <circle
                  key={step.step}
                  ref={(el) => {
                    dotRefs.current[index] = el;
                  }}
                  className="journey-dot"
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill={step.isGold ? "rgba(201,168,76,0.9)" : "#D6052B"}
                />
              );
            })}
          </svg>
        </div>

        {steps.map((step, index) => (
          <div
            key={step.step}
            ref={(el) => {
              cardRefs.current[index] = el;
            }}
            className={`journey-card ${step.side}`}
            data-dynamic="true"
            style={{ top: step.top }}
          >
            <span className="j-step" style={step.isGold ? { color: "rgba(201,168,76,0.9)" } : undefined}>
              {step.step}
            </span>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </div>
        ))}

        <div id="journey-finish" ref={finishRef}>
          <span className="journey-finish-dot" />
          <span className="font-sans text-[10px] font-bold tracking-[0.25em] text-[rgba(201,168,76,0.7)] uppercase">
            Home.
          </span>
        </div>
      </div>
    </section>
  );
}
