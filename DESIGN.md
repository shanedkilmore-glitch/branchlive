# DESIGN.md — Branch Live Design System
# Source: Google Labs DESIGN.md spec v0.1
# Drop this file in any project — AI agents read it to maintain visual consistency

## Brand Identity
- Name: Branch Live
- Tagline: AI That Answers
- Industry: AI receptionist for contractors (landscaping, masonry, hardscape)
- Tone: Professional, trustworthy, modern, approachable

## Colors
```css
:root {
  --bg-primary: #06060c;       /* Deepest dark — page backgrounds */
  --bg-secondary: #0e0e18;     /* Card backgrounds, panels */
  --bg-tertiary: #1a1a2e;      /* Hover states, elevated surfaces */
  --accent-primary: #8b5cf6;   /* Purple — primary buttons, active states */
  --accent-secondary: #00d4aa; /* Teal — success, confirmations, CTAs */
  --accent-danger: #ef4444;    /* Red — destructive actions */
  --text-primary: #f1f5f9;     /* Headlines, primary text */
  --text-secondary: #94a3b8;   /* Body text, labels */
  --text-muted: #475569;       /* Placeholders, disabled text */
  --border: #1e293b;           /* Borders, dividers */
}
```

## Typography
- Font: Inter (headings), system-ui (body)
- Scale: 0.75rem / 0.875rem / 1rem / 1.25rem / 1.5rem / 2rem / 3rem
- Headings: font-semibold, tracking-tight
- Body: font-normal, leading-relaxed

## Spacing
- Grid: 4px base unit
- Section padding: 2rem (mobile), 4rem (desktop)
- Card padding: 1.5rem
- Button padding: 0.75rem 1.5rem
- Gap between cards: 1rem
- Minimum touch target: 44px × 44px

## Components
- Cards: rounded-xl, bg-secondary, border border-[--border], shadow-lg
- Buttons: rounded-lg, font-semibold, transition-all duration-200
  - Primary: bg-accent-primary, text-white, hover:brightness-110
  - Secondary: bg-tertiary, text-text-primary, border border-[--border]
  - CTA: bg-accent-secondary, text-black font-bold
- Inputs: bg-tertiary, border border-[--border], rounded-lg, min-h-12, text-base (prevents iOS zoom)
- Bottom Tab Bar (mobile): fixed bottom-0, safe-area-inset-bottom, bg-secondary, 5 tabs max
- Modals: bg-secondary, backdrop-blur, rounded-2xl, max-h-[90vh]

## Brand Elements
- No orbs, spheres, or generic AI art
- No generic purple gradients unless specified
- Icons: Lucide icons, consistent stroke width
- Logo: text-based "Branch Live" with small phone icon
- Favicon: dark square with teal accent

## Responsive Rules
- Mobile-first: <768px = bottom tab bar, single column, card layouts
- Tablet: 768-1024px = 2-column grid where appropriate
- Desktop: >1024px = sidebar navigation, 3-4 column grids
- All touch targets ≥44px on mobile
- Input font size ≥16px on mobile (prevents iOS zoom)
- viewport-fit=cover, safe-area-inset support for notched phones
