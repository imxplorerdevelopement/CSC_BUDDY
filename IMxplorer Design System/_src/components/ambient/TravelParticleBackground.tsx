"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
};

type TravelParticleBackgroundProps = {
  className?: string;
  particleCount?: number;
  maxLinkDistance?: number;
};

export default function TravelParticleBackground({
  className = "",
  particleCount = 44,
  maxLinkDistance = 130,
}: TravelParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const particles: Particle[] = [];
    let frameId = 0;
    let lastTime = 0;
    let effectiveCount = particleCount;
    let shouldDrawLinks = true;
    let frameInterval = 1000 / 60;

    const createParticle = (width: number, height: number): Particle => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.24,
      vy: (Math.random() - 0.5) * 0.24,
      radius: Math.random() * 1.8 + 0.8,
      alpha: Math.random() * 0.32 + 0.14,
    });

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const coarsePointer = window.matchMedia("(pointer: coarse)").matches;

      effectiveCount = coarsePointer ? Math.min(24, particleCount) : particleCount;
      shouldDrawLinks = !reduceMotion && !coarsePointer;
      frameInterval = coarsePointer ? 1000 / 36 : 1000 / 60;

      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      particles.length = 0;
      for (let i = 0; i < effectiveCount; i += 1) {
        particles.push(createParticle(rect.width, rect.height));
      }
    };

    const draw = (time: number) => {
      if (time - lastTime < frameInterval) {
        frameId = window.requestAnimationFrame(draw);
        return;
      }
      lastTime = time;

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      context.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const glow = context.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 4);
        glow.addColorStop(0, `rgba(211, 166, 90, ${p.alpha})`);
        glow.addColorStop(0.5, `rgba(143, 47, 47, ${p.alpha * 0.65})`);
        glow.addColorStop(1, "rgba(211, 166, 90, 0)");
        context.fillStyle = glow;
        context.beginPath();
        context.arc(p.x, p.y, p.radius * 4, 0, Math.PI * 2);
        context.fill();
      }

      if (shouldDrawLinks) {
        for (let i = 0; i < particles.length; i += 1) {
          for (let j = i + 1; j < particles.length; j += 1) {
            const p1 = particles[i];
            const p2 = particles[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const distance = Math.hypot(dx, dy);

            if (distance > maxLinkDistance) continue;

            const alpha = (1 - distance / maxLinkDistance) * 0.14;
            context.strokeStyle = `rgba(211, 166, 90, ${alpha})`;
            context.lineWidth = 0.45;
            context.beginPath();
            context.moveTo(p1.x, p1.y);
            context.lineTo(p2.x, p2.y);
            context.stroke();
          }
        }
      }

      frameId = window.requestAnimationFrame(draw);
    };

    resizeCanvas();
    frameId = window.requestAnimationFrame(draw);

    const onResize = () => resizeCanvas();
    window.addEventListener("resize", onResize);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
    };
  }, [maxLinkDistance, particleCount]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 z-0 ${className}`.trim()}
      aria-hidden
    />
  );
}
