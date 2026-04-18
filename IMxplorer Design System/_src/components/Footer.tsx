import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer
      className="relative overflow-hidden border-t border-white/[0.06] font-sans"
      style={{ background: "#040404" }}
    >
      {/* Gold radial gradients at top corners */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 12% -18%, rgba(184,148,63,.12), transparent 38%), radial-gradient(circle at 88% -14%, rgba(184,148,63,.1), transparent 34%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1600px] px-4 pb-7 pt-[4.6rem] md:px-14 md:pb-8 md:pt-[5.2rem]">
        {/* Top grid: 4 columns on desktop */}
        <div
          className="grid grid-cols-1 gap-8 border-b border-white/10 pb-10 md:gap-8"
          style={{ gridTemplateColumns: "repeat(1, 1fr)" }}
        >
          <div className="grid grid-cols-1 gap-8 md:hidden">
            {/* Brand col */}
            <div>
              <Image
                src="/assets/images/logo_white.png"
                alt="IMxplorer - The Travel Co."
                width={160}
                height={38}
                className="mb-[1.12rem] h-[2.4rem] w-auto opacity-[.95]"
                style={{ width: "auto" }}
              />
              <p
                className="max-w-[34ch] leading-[1.68] text-white/[.78]"
                style={{ fontSize: ".9rem" }}
              >
                First Floor, Galaxy Blue Sapphire Plaza, Greater Noida West,
                Uttar Pradesh 201309, India
              </p>
            </div>

            {/* Pages col */}
            <nav className="grid gap-[.68rem]" aria-label="Footer pages">
              {[
                { label: "About Us", href: "/#philosophy" },
                { label: "Contact Us", href: "/contact" },
                { label: "Visa Services", href: "/#services-section" },
                { label: "Forex", href: "/#services-section" },
                { label: "Study Abroad", href: "/#services-section" },
                { label: "Blogs", href: "/blogs" },
                { label: "LUXE", href: "/#hni-section" },
              ].map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="w-fit font-medium text-white/90 transition-[color,transform] duration-[.25s] hover:translate-x-[2px] hover:text-[rgba(184,148,63,.98)]"
                  style={{ fontSize: "1.02rem" }}
                >
                  {label}
                </Link>
              ))}
            </nav>

            {/* Contact links col */}
            <div className="grid gap-[.34rem]">
              {[
                { label: "+91 98110 99951", href: "tel:+919811099951", tel: true },
                { label: "+91 92117 36232", href: "tel:+919211736232", tel: true },
                { label: "contact@imxplorer.com", href: "mailto:contact@imxplorer.com", tel: false },
              ].map(({ label, href, tel }) => (
                <a
                  key={href}
                  href={href}
                  className="w-fit text-white/90 transition-[color,transform] duration-[.25s] hover:translate-x-[2px] hover:text-[rgba(184,148,63,.98)]"
                  style={{
                    fontSize: "1.02rem",
                    fontWeight: tel ? 600 : 500,
                    letterSpacing: tel ? ".015em" : undefined,
                    fontVariantNumeric: tel ? "tabular-nums" : undefined,
                    lineHeight: 1.25,
                  }}
                >
                  {label}
                </a>
              ))}
            </div>

            {/* Social + city col */}
            <div>
              <div className="mb-[.95rem] mt-[.2rem] flex flex-wrap gap-[.62rem]">
                {/* Instagram */}
                <a
                  href="https://www.instagram.com/imxplorer_global/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="inline-flex h-[2.34rem] w-[2.34rem] items-center justify-center rounded-full border text-white/[.82] transition-[color,border-color,background,transform] duration-[.28s] hover:-translate-y-[1px] hover:border-[rgba(184,148,63,.75)] hover:bg-[rgba(184,148,63,.12)] hover:text-[rgba(184,148,63,.98)]"
                  style={{ borderColor: "rgba(184,148,63,.46)" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
                {/* LinkedIn */}
                <a
                  href="https://www.linkedin.com/company/imxplorer/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="inline-flex h-[2.34rem] w-[2.34rem] items-center justify-center rounded-full border text-white/[.82] transition-[color,border-color,background,transform] duration-[.28s] hover:-translate-y-[1px] hover:border-[rgba(184,148,63,.75)] hover:bg-[rgba(184,148,63,.12)] hover:text-[rgba(184,148,63,.98)]"
                  style={{ borderColor: "rgba(184,148,63,.46)" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
                {/* WhatsApp */}
                <a
                  href="https://api.whatsapp.com/send/?phone=919811099951"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="inline-flex h-[2.34rem] w-[2.34rem] items-center justify-center rounded-full border text-white/[.82] transition-[color,border-color,background,transform] duration-[.28s] hover:-translate-y-[1px] hover:border-[rgba(184,148,63,.75)] hover:bg-[rgba(184,148,63,.12)] hover:text-[rgba(184,148,63,.98)]"
                  style={{ borderColor: "rgba(184,148,63,.46)" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </a>
              </div>
              <p className="text-white/[.84]" style={{ fontSize: ".95rem", letterSpacing: ".01em" }}>
                Based in Greater Noida (W)
              </p>
            </div>
          </div>

          {/* Desktop 4-col grid */}
          <div
            className="hidden md:grid"
            style={{ gridTemplateColumns: "1.2fr .9fr .9fr 1.15fr", gap: "2rem", alignItems: "stretch" }}
          >
            {/* Brand col */}
            <div>
              <Image
                src="/assets/images/logo_white.png"
                alt="IMxplorer - The Travel Co."
                width={160}
                height={38}
                className="mb-[1.12rem] h-[2.4rem] w-auto opacity-[.95]"
                style={{ width: "auto" }}
              />
              <p
                className="m-0 max-w-[34ch] leading-[1.68] text-white/[.78]"
                style={{ fontSize: ".9rem" }}
              >
                First Floor, Galaxy Blue Sapphire Plaza, Greater Noida West,
                Uttar Pradesh 201309, India
              </p>
            </div>

            {/* Pages col */}
            <nav className="grid gap-[.68rem]" aria-label="Footer pages">
              {[
                { label: "About Us", href: "/#philosophy" },
                { label: "Contact Us", href: "/contact" },
                { label: "Visa Services", href: "/#services-section" },
                { label: "Forex", href: "/#services-section" },
                { label: "Study Abroad", href: "/#services-section" },
                { label: "Blogs", href: "/blogs" },
                { label: "LUXE", href: "/#hni-section" },
              ].map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="w-fit font-medium text-white/90 transition-[color,transform] duration-[.25s] hover:translate-x-[2px] hover:text-[rgba(184,148,63,.98)]"
                  style={{ fontSize: "1.02rem" }}
                >
                  {label}
                </Link>
              ))}
            </nav>

            {/* Contact links col */}
            <div className="grid gap-[.34rem]" style={{ alignContent: "start" }}>
              {[
                { label: "+91 98110 99951", href: "tel:+919811099951", tel: true },
                { label: "+91 92117 36232", href: "tel:+919211736232", tel: true },
                { label: "contact@imxplorer.com", href: "mailto:contact@imxplorer.com", tel: false },
              ].map(({ label, href, tel }) => (
                <a
                  key={href}
                  href={href}
                  className="w-fit text-white/90 transition-[color,transform] duration-[.25s] hover:translate-x-[2px] hover:text-[rgba(184,148,63,.98)]"
                  style={{
                    fontSize: "1.02rem",
                    fontWeight: tel ? 600 : 500,
                    letterSpacing: tel ? ".015em" : undefined,
                    fontVariantNumeric: tel ? "tabular-nums" : undefined,
                    lineHeight: 1.25,
                  }}
                >
                  {label}
                </a>
              ))}
            </div>

            {/* Social + city col */}
            <div>
              <div className="mb-[.95rem] mt-[.2rem] flex flex-wrap gap-[.62rem]">
                {/* Instagram */}
                <a
                  href="https://www.instagram.com/imxplorer_global/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="inline-flex h-[2.34rem] w-[2.34rem] items-center justify-center rounded-full border text-white/[.82] transition-[color,border-color,background,transform] duration-[.28s] hover:-translate-y-[1px] hover:border-[rgba(184,148,63,.75)] hover:bg-[rgba(184,148,63,.12)] hover:text-[rgba(184,148,63,.98)]"
                  style={{ borderColor: "rgba(184,148,63,.46)" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
                {/* LinkedIn */}
                <a
                  href="https://www.linkedin.com/company/imxplorer/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="inline-flex h-[2.34rem] w-[2.34rem] items-center justify-center rounded-full border text-white/[.82] transition-[color,border-color,background,transform] duration-[.28s] hover:-translate-y-[1px] hover:border-[rgba(184,148,63,.75)] hover:bg-[rgba(184,148,63,.12)] hover:text-[rgba(184,148,63,.98)]"
                  style={{ borderColor: "rgba(184,148,63,.46)" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
                {/* WhatsApp */}
                <a
                  href="https://api.whatsapp.com/send/?phone=919811099951"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="inline-flex h-[2.34rem] w-[2.34rem] items-center justify-center rounded-full border text-white/[.82] transition-[color,border-color,background,transform] duration-[.28s] hover:-translate-y-[1px] hover:border-[rgba(184,148,63,.75)] hover:bg-[rgba(184,148,63,.12)] hover:text-[rgba(184,148,63,.98)]"
                  style={{ borderColor: "rgba(184,148,63,.46)" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </a>
              </div>
              <p className="text-white/[.84]" style={{ fontSize: ".95rem", letterSpacing: ".01em" }}>
                Based in Greater Noida (W)
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col gap-[.76rem] pt-6 font-sans uppercase text-white/40 md:flex-row md:items-center md:justify-between"
          style={{ fontSize: ".66rem", letterSpacing: ".12em" }}
        >
          <div className="flex flex-wrap items-center gap-x-[1.3rem] gap-y-[.9rem]">
            <p>&copy; 2026 IMxplorer. All rights reserved.</p>
            <Link
              href="/privacy-policy"
              className="text-white/[.52] no-underline transition-colors duration-[.25s] hover:text-white/90"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-of-service"
              className="text-white/[.52] no-underline transition-colors duration-[.25s] hover:text-white/90"
            >
              Terms of Service
            </Link>
            <Link
              href="/cookie-policy"
              className="text-white/[.52] no-underline transition-colors duration-[.25s] hover:text-white/90"
            >
              Cookie Policy
            </Link>
            <Link
              href="/cancellation-refund-policy"
              className="text-white/[.52] no-underline transition-colors duration-[.25s] hover:text-white/90"
            >
              Cancellation &amp; Refund
            </Link>
          </div>
          <p className="inline-flex items-center gap-[.42rem]" style={{ color: "rgba(184,148,63,.94)" }}>
            <span
              className="inline-block h-[6px] w-[6px] rounded-full"
              style={{
                background: "rgba(184,148,63,.98)",
                boxShadow: "0 0 8px rgba(184,148,63,.58)",
              }}
            />
            IATA Accredited
          </p>
        </div>
      </div>
    </footer>
  );
}
