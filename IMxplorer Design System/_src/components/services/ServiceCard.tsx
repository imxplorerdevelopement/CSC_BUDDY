"use client";

interface ServiceCardProps {
  name: string;
  desc: string;
  accentColor: string;
  accentRgb: string;
}

export default function ServiceCard({ name, desc, accentColor, accentRgb }: ServiceCardProps) {
  return (
    <div
      className="rounded-xl border p-4 transition-all duration-300"
      style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.025)" }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = `rgba(${accentRgb},0.35)`;
        el.style.background = `rgba(${accentRgb},0.08)`;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = "rgba(255,255,255,0.07)";
        el.style.background = "rgba(255,255,255,0.025)";
      }}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <span className="h-1 w-1 rounded-full shrink-0" style={{ background: accentColor }} />
        <p className="font-brand text-[0.55rem] tracking-[0.22em] text-white/80 uppercase">
          {name}
        </p>
      </div>
      <p className="font-sans text-[0.78rem] leading-relaxed text-white/40" style={{ fontWeight: 300 }}>
        {desc}
      </p>
    </div>
  );
}
