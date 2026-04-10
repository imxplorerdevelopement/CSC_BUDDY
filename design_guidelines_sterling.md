# Sterling & Associates Law - Design Guidelines

## Design Approach
**Reference-Based Approach**: Drawing inspiration from premium professional services and established law firms that emphasize trust, authority, and sophistication. Design should convey gravitas while remaining approachable and client-focused.

## Typography System
- **Headings**: Serif typeface (Playfair Display or Crimson Pro) - weights 600-700
- **Body**: Sans-serif for readability (Inter or Source Sans Pro) - weights 400-500
- **Legal disclaimers/fine print**: Smaller sans-serif, weight 300-400
- **Hierarchy**: Large, commanding headlines (48-72px desktop), substantial subheadings (24-32px), comfortable body text (16-18px)

## Layout & Spacing
**Spacing Primitives**: Use Tailwind units of 4, 8, 12, 16, and 24 for consistent rhythm
- Section padding: py-16 to py-24 on desktop, py-12 on mobile
- Container: max-w-7xl for full sections, max-w-4xl for text-heavy content
- Component gaps: gap-8 for card grids, gap-12 for major sections

## Page Structure & Sections

### Hero Section
- Full-width with professional legal environment background image (modern law office, columns, or library)
- Centered content overlay with blurred background for text/CTA
- Large serif headline with tagline
- Prominent "Request Consultation" CTA
- Trust indicators below fold (years of experience, case statistics)

### Practice Areas (3-column grid)
- Icon + title + description cards
- Areas: Corporate Law, Real Estate, Estate Planning, Family Law, Civil Litigation, Criminal Defense
- Hover elevation effect

### Why Choose Sterling (2-column split)
- Left: Compelling copy about firm values and commitment
- Right: Professional image of attorneys or courtroom

### Attorney Profiles (2-3 column grid)
- Professional headshots
- Name, title, specialization
- Brief credentials
- Link to full bio

### Case Results/Testimonials
- Large quote format with client attribution
- Alternating left/right layout for multiple testimonials
- Subtle background distinction from main content

### Consultation CTA Section
- Full-width, visually distinct background
- Centered messaging reinforcing urgency and value
- Form preview or direct CTA to contact page

### Footer
- Multi-column layout: Practice areas links, contact information, office hours
- Bar association badges/certifications
- Legal disclaimers and privacy policy links
- Professional social media links (LinkedIn)

## Component Library

### Buttons
- Primary: Navy (#0B2545) with blue (#1E90FF) hover state
- Secondary: Outlined navy with transparent background
- Large, substantial sizing (px-8 py-4 minimum)
- Uppercase or title case for emphasis

### Cards
- Subtle shadow (shadow-md)
- Clean white backgrounds with navy accents
- Generous padding (p-8)
- Hover: Subtle lift (shadow-lg transition)

### Forms
- Clean, spacious input fields
- Labels positioned above inputs
- Navy accent for focus states
- Generous spacing between fields (space-y-6)
- Professional validation messaging

### Navigation
- Fixed header on scroll with subtle shadow
- Primary navigation: Practice Areas, About, Attorneys, Contact
- Right-aligned "Request Consultation" CTA button
- Mobile: Hamburger menu with full-screen overlay

## Images

**Hero Image**: Professional legal environment - modern law office interior with natural light, bookshelves with legal volumes, or architectural columns suggesting authority. High-quality, slightly desaturated for sophistication.

**About/Team Section**: Professional group photo of attorneys in business attire, shot in office environment or against neutral background.

**Attorney Headshots**: Consistent professional portraits with neutral backgrounds, business formal attire.

**Practice Area Icons**: Use Heroicons via CDN - scale, briefcase, home, document-text, shield-check, gavel (conceptual representations).

## Design Principles
- **Authority through restraint**: Ample whitespace, limited color palette, strategic use of serif typography
- **Trust through consistency**: Predictable layouts, professional imagery, clear information hierarchy
- **Accessibility first**: High contrast ratios, clear focus states, readable type sizes
- **Premium without pretension**: Sophisticated but approachable, formal but warm

## Animations
Minimal and purposeful:
- Smooth scroll behavior for anchor links
- Subtle hover elevations on cards (transform: translateY(-4px))
- Fade-in on scroll for testimonials
- No distracting or playful animations

This design positions Sterling & Associates as established, trustworthy, and client-focused while maintaining the gravitas expected of premium legal services.