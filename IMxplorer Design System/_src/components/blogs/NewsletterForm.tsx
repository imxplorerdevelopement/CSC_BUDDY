"use client";

interface NewsletterFormProps {
  isDark?: boolean;
}

export default function NewsletterForm({ isDark = true }: NewsletterFormProps) {
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => e.preventDefault()}
      aria-label="Newsletter signup"
    >
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        type="email"
        placeholder="your@email.com"
        autoComplete="email"
        className="flex-1 rounded-full px-5 py-3 font-sans text-sm outline-none transition-colors duration-300"
        style={{
          background: isDark ? "rgba(255,255,255,0.05)" : "rgba(50,20,15,0.05)",
          border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(160,55,40,0.2)",
          color: isDark ? "rgba(255,255,255,0.85)" : "rgba(50,20,15,0.85)",
          fontSize: "0.85rem",
        }}
      />
      <button
        type="submit"
        className="shrink-0 rounded-full px-5 py-3 font-sans text-[0.65rem] tracking-[0.18em] uppercase transition-all duration-300"
        style={{
          background: isDark ? "rgba(184,148,63,0.15)" : "rgba(160,55,40,0.1)",
          border: isDark ? "1px solid rgba(184,148,63,0.5)" : "1px solid rgba(160,55,40,0.45)",
          color: isDark ? "rgba(184,148,63,0.95)" : "rgba(160,55,40,0.95)",
        }}
      >
        Subscribe
      </button>
    </form>
  );
}
