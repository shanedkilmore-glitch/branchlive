# Branch Live — Landing Page Redesign · V1 Spec

**Direction:** *Sound Made Visible* — Amber-Monotone, warm, tactile, hand-printed feel.
**Status:** Draft for Shane to review → approve → hand to ZCode to build.
**Date:** Jul 9, 2026
**Surface:** The landing page rendered inline inside `worker.js` (Cloudflare Worker). Pure HTML/CSS/JS, no framework, self-hosted fonts. This spec replaces the current landing markup + CSS only — it does **not** touch portal, dashboard, `/api/*`, or D1 logic.

---

## 0. North star (read first)

> A small record label that also answers your phones.

Warm but direct. Hand-crafted, reliable, no bullshit. The page should feel like a screen-printed show poster that happens to load in 600ms. **One accent color (amber). No blues, no purples, no gradient rainbow.** Color comes from warmth and the single amber — nothing else.

The whole page is one extended metaphor: **a phone call is sound, and we make that sound visible** — as transcripts, threads, booked appointments. Every section should echo the waveform / vinyl / letterpress vocabulary without ever saying the word "metaphor."

---

## 1. Layout plan (section by section)

Six sections, top to bottom. Order is identical on mobile and desktop (no reordering) — only density, rhythm, and the hero CTA treatment change.

```
┌──────────────────────────────────────────────┐
│ 1. HERO          (full-bleed, ~90vh desktop) │
│ 2. HOW IT WORKS  (3 steps)                   │
│ 3. FEATURES      (the benefits)              │
│ 4. DEMO          (embedded, already exists)  │
│ 5. PRICING / CTA (the ask)                   │
│ 6. FOOTER        (minimal)                   │
└──────────────────────────────────────────────┘
```

### 1.1 — HERO

**Purpose:** State what Branch Live is in one breath. Make the phone-number demo the center of gravity.

**Desktop layout** (max content width 1160px, centered):
```
[brand mark top-left]                            [nav: How · Features · Demo · Sign in]

         ✦ warm amber eyebrow: "AI receptionist for contractors"

         Branch Live answers the phone              ← Fraunces, ~clamp(2.6rem,7vw,5.4rem)
         so the job  keeps moving.                   ← "the job" / "moving" = amber italic
                                                      line-height ~0.95, letter-spacing -0.02em

         One flat rate. Emma picks up in one ring,     ← Inter Tight 17px, muted-warm
         books the job, and texts you the lead.           max 52ch

         ( 8 7 2 )  8 2 9 - 1 1 9 2      [ ▶ Hear a call ]    ← mono phone number (tap-to-call)
                                                              [ Start free trial ] amber CTA

         ▁▂▃▅▇▅▃▂▁▁▂▄▆▇▆▄▂▁   ← thin amber waveform strip, full content width, decorative
```

- **Visual element:** a single horizontal **waveform strip** running full content-width under the CTA row. Pure SVG (no images). Static by default; a gentle amplitude animation is allowed but MUST respect `prefers-reduced-motion` and MUST NOT run on load-blocking paint (CSS-only or rAF after idle — see §4.5).
- **Background:** near-solid `--bg` with one very faint radial amber glow top-right (≤6% opacity) to suggest a lit screen in a dark room. No mesh gradient.
- **Eyebrow:** amber, uppercase, tracked (+0.18em), 11.5px.

**Mobile layout** (<700px): mark + nav collapse to a single top row (nav becomes a "Menu" disclosure or just the primary CTA — see §4.4). Headline scales down via `clamp()`. Phone number stays tap-to-call and is the **primary** tap target; "Start free trial" sits beneath it full-width.

### 1.2 — HOW IT WORKS

**Purpose:** Three steps. Make the magic feel mechanical and trustworthy, not magical.

**Layout:** three columns desktop → single column mobile. Each column is a **numbered waveform** metaphor:
```
   01 ▂▃▅▇▅▃▂        02 ▂▃▅▇▅▃▂        03 ▂▃▅▇▅▃▂
   A call comes in    Emma answers      You get the lead
                      & books it        as a text
```
- The leading "01 / 02 / 03" are **mono**, amber, large.
- Each has a 2-line body in Inter Tight (muted), max ~26ch.
- A thin connecting amber hairline (1px, 35% opacity) links the three columns on desktop only — reads as a continuous signal. On mobile it becomes a vertical hairline.

### 1.3 — FEATURES

**Purpose:** Concrete benefits, not feature checklists. The "what you actually get."

**Layout:** a 2×3 grid (desktop) / single column (mobile) of **letterpress cards**. Each card: amber icon-glyph (line SVG, 24px), short Fraunces sub-headline (20px), one-sentence body. No borders — separation by surface tint (`--surface-1` on `--bg`) and a hairline top-rule in `--line`. Hover lifts the card 2px and warms the rule to amber (desktop only).

Six cards (copy direction in §3):
1. **Answers every call** — never hits voicemail.
2. **Books the appointment** — straight into your calendar.
3. **Texts you the lead** — name, number, what they wanted.
4. **Knows your business** — answers questions your way.
5. **Works 24/7** — nights, weekends, job sites.
6. **One flat price** — $29.95/mo, no per-minute surprise.

### 1.4 — DEMO

**Purpose:** Show, don't tell. Reuse the **existing** embedded demo (already implemented in worker.js). Do not rebuild it — only reframe it.

**Layout:** centered, single column, max 720px. A Fraunces line above ("Hear it for yourself."), the existing demo embed below, framed by the same surface tint + hairline as feature cards so it reads as part of the system. On mobile the embed scales to viewport width (the embed must be responsive — verify in build).

### 1.5 — PRICING / CTA

**Purpose:** The single ask. One number, one button, no pricing table gymnastics.

**Layout:** centered block on `--surface-1` band (slightly lighter than `--bg` to break rhythm).
```
                ✦ amber eyebrow: "30-day free trial"

         $29.95  / month                          ← Fraunces, big, "/ month" in mono muted
         One receptionist. Every call answered.
         No setup. No contracts. Cancel anytime.

         [ Start free trial ]    (872) 829-1192    ← amber CTA + mono number
```
- No three-tier table. No "Most Popular" badge. V1 is single-plan.
- Reiterate the phone number as a secondary anchor — calling it IS the onboarding.

### 1.6 — FOOTER

**Purpose:** Minimal. Sign the page like a record sleeve.

**Layout:** single row, `--bg`, hairline top-rule.
```
[mark]  Branch Live                hello@branchlive.com  ·  (872) 829-1192
        AI receptionist for        © 2026   ·   Privacy  ·  Terms
        contractors
```
- Small. Muted text. Amber on hover for links. No social icons in V1 (add later if needed).

---

## 2. Design system

### 2.1 — Color tokens

Monotone: **one accent (amber) + warm neutrals only.** Everything else is value/luminance, never hue drift. ZCode MUST implement these as `:root` custom properties and reference them — no raw hex inline.

```css
:root{
  /* core */
  --bg:        #06060c;                               /* deepest dark, phone screen at night */
  --surface-1: #0c0c14;                               /* card / band tint, +luminance */
  --surface-2: #12121c;                               /* hover / embedded surface */

  /* text — approved oklch, hex fallback provided for safety */
  --text:      oklch(0.96 0.012 75);  --text-hex: #f3ece0;   /* warm off-white */
  --muted:     oklch(0.70 0.010 75);  --muted-hex:#a59f92;   /* muted warm gray */
  --muted-2:   oklch(0.55 0.008 75);  --muted-2-hex:#6e6a62; /* dim ink, silence */

  /* accent — the ONLY chromatic color on the page */
  --amber:     oklch(0.78 0.13 70);   --amber-hex:#d4a574;  /* warm amber */
  --amber-soft:oklch(0.86 0.09 75);   --amber-soft-hex:#e8c79b; /* hover / eyebrow text */
  --amber-deep:oklch(0.62 0.11 68);   --amber-deep-hex:#a87f4e; /* pressed / deep */

  /* lines */
  --line:      rgba(243,236,224,0.08);   /* hairline rules */
  --line-amber:rgba(212,165,116,0.35);  /* the "signal" connecting line */

  /* speaker colors — used only inside transcripts/demo, never chrome */
  --speaker-emma:  var(--amber);                 /* the AI */
  --speaker-caller:oklch(0.92 0.014 80);         /* warm cream */
  --speaker-silence: var(--muted-2);             /* dim ink */

  --ring-focus: var(--amber);   /* focus-visible outline */
}
```
**Fallback rule:** ship `--text` etc. as oklch, but include a one-line `@supports not (color: oklch(0 0 0))` block mapping to the `*-hex` values. oklch is supported in all current evergreen browsers, but the fallback costs ~5 lines and removes a whole failure class.

### 2.2 — Typography

```css
--serif: 'Fraunces', Georgia, 'Times New Roman', serif;   /* headlines */
--sans:  'Inter Tight', system-ui, -apple-system, sans-serif; /* body */
--mono:  'JetBrains Mono', ui-monospace, 'SFMono-Regular', monospace; /* numbers/data */
```
Type scale (fluid, mobile-first via `clamp()`):

| Role            | Family   | Weight | Size                              | LH    | Tracking    | Notes |
|-----------------|----------|--------|-----------------------------------|-------|-------------|-------|
| Hero headline   | Fraunces | 400    | `clamp(2.6rem, 7vw, 5.4rem)`      | 0.95  | -0.02em     | amber italic on emphasis words |
| Section H2      | Fraunces | 400    | `clamp(1.9rem, 3.4vw, 2.8rem)`    | 1.02  | -0.015em    | |
| Card H3         | Fraunces | 400    | 1.25rem                           | 1.15  | -0.01em     | |
| Body / lede     | Inter Tight | 400 | 1.0625rem (17px)                  | 1.6   | 0           | max 52ch |
| Eyebrow         | Inter Tight | 600 | 0.72rem (11.5px)                  | 1     | +0.18em     | uppercase, amber |
| Phone / data    | JetBrains Mono | 400 | 1.5rem                         | 1     | 0.04em      | `font-variant-numeric: tabular-nums` |

**Italic usage:** Fraunces italic is a *tool*, not a style — use it ONLY on the 1–2 emphasis words per headline (e.g. "the *job*", "*sound*"). Never whole sentences. Amber-colored italic = the strongest emphasis on the page.

### 2.3 — Spacing & rhythm

8px base grid. Section padding `clamp(72px, 12vh, 140px)` vertical, `clamp(20px, 5vw, 64px)` horizontal gutters. Content max-width **1160px** (prose blocks narrower at 680–720ch). Card gap 24px desktop / 16px mobile. Vertical rhythm between hero→how→features uses the same section padding so the whole page breathes at one tempo.

### 2.4 — Texture & tactile feel

The "hand-printed / analog" quality is delivered by **two cheap tricks**, both inline (zero external requests):

1. **Grain overlay** — a fixed, full-viewport `::before` on `<body>`:
   - Inline SVG `feTurbulence` (baseFrequency ~0.9, numOctaves 2) as a data-URI background, tiled.
   - `opacity: 0.04`, `mix-blend-mode: overlay`, `pointer-events: none`, `z-index: 1` (above bg, below content).
   - This single element gives the whole page the "printed on paper" tooth without any image fetch. ~1KB gzipped.
2. **Waveform motif** — recurring thin SVG waveform bars (a row of `<rect>`s of varying heights) used as section dividers and accents, always amber at low opacity. Never an `<img>`.

**Vinyl solidity:** cards have no drop shadow by default. Elevation is conveyed by the luminance step (`--bg` → `--surface-1` → `--surface-2`) and the 1px hairline — like ink on paper, not glass.

---

## 3. Copy & messaging direction

### 3.1 — Voice guardrails (do / don't)

**Do:** plain contractor English ("answers the phone," "books the job," "texts you the lead"). Short sentences. Concrete verbs. Numbers are real ($29.95, 30 days, one ring).

**Don't:** "AI-powered," "leverage," "seamless," "revolutionize," "10x," "next-gen," "intelligent agent." No em-dash asides that bury the verb. No exclamation marks. No "we believe…" The product talks like a tradesperson, not a founder.

### 3.2 — Key phrases (the approved lexicon)

| Use                       | Not                            |
|---------------------------|--------------------------------|
| "answers the phone"       | "AI call handling"             |
| "books the job"           | "automated scheduling"         |
| "texts you the lead"      | "lead-capture pipeline"        |
| "one ring"                | "sub-second response"          |
| "one flat price"          | "transparent pricing"          |

### 3.3 — Headline concepts (pick one for V1)

1. **"Branch Live answers the phone so the job keeps moving."** *(recommended — active, concrete, names the pain)*
2. "Every call answered. Every job booked."
3. "Sound, made visible." *(strongest as a secondary/tagline, weaker as the primary H1 — it's evocative but not explanatory)*

Recommended pairing: **H1 = #1**, with **"Sound, made visible."** as the eyebrow or a quiet line above the footer — it pays off the visual metaphor without having to carry the load.

### 3.4 — Button & CTA copy

- Primary: **"Start free trial"** (never "Get started," never "Sign up now").
- Secondary: **"Hear a call"** (the demo anchor — warmer than "Watch demo").
- Phone CTA: the number itself, tap-to-call. No "Call us" label needed.

---

## 4. Implementation notes (for ZCode)

### 4.1 — Where this lives

All markup, CSS, and JS for the landing goes **inline in `worker.js`** in the existing landing-page handler (string template). No new files, no build step, no framework. CSS in a single `<style>` in `<head>`; JS in a single `<script>` before `</body>`. Keep the landing's HTML/CSS/JS clearly delimited with comment fences so it's easy to find and edit:

```js
// ===== LANDING PAGE (Sound Made Visible — V1) =====
const LANDING_HTML = `<!doctype html> ... `;
const LANDING_CSS  = ` ... `;   // injected into <style>
const LANDING_JS   = ` ... `;   // injected into <script>
// ===== END LANDING PAGE =====
```

### 4.2 — CSS architecture

- Single `:root` token block (§2.1). Everything else consumes tokens — **no raw colors** outside the token block.
- BEM-ish class names, flat (`.hero`, `.hero-eyebrow`, `.feature-card`, `.feature-card__title`). No utility framework.
- Mobile-first: base styles target ≤700px; `min-width` media queries add density upward. Two breakpoints only:
  - `≥700px` — tablet/desktop density (2-col features, side-by-side hero CTA).
  - `≥1080px` — full desktop (3-col how-it-works, hero waveform full-width).
- Sections are full-bleed (`100%` width); inner content uses `.container { max-width:1160px; margin-inline:auto; padding-inline: clamp(20px,5vw,64px) }`.

### 4.3 — Font loading (self-hosted, fast)

Fonts are the biggest perf risk. Requirements:
- **Self-host** woff2 (Cloudflare Pages/static asset via Worker, or inline as base64 if small enough — ZCode to choose, but **no Google Fonts `<link>`** in V1; it adds a render-blocking round trip + third-party DNS).
- **Subset hard.** Fraunces is variable (opsz/wght) — subset to the **weights actually used: 400 roman + 400 italic** only (and one heavier weight IF the build actually needs it; per §2.2 it does not). Inter Tight → 400/600. JetBrains Mono → 400.
- Subset to **Latin** (the site is English-only). Target each woff2 **< 45KB**.
- Use `<link rel="preload" as="font" type="font/woff2" crossorigin>` for the two most critical (Fraunces 400 + Inter Tight 400) and `font-display: swap` on the rest so the page paints with system fallback instantly.
- **Performance budget:** fonts + HTML + CSS + grain SVG combined **< 180KB gzipped**, LCP **< 1.5s** on 4G. (See web-perf skill for measurement.)

### 4.4 — Responsive nav & mobile

- Desktop (≥700px): inline nav top-right (How · Features · Demo · Sign in).
- Mobile: collapse to a single **"Start free trial"** button top-right; drop the secondary nav links (the page is short enough to scroll). No hamburger in V1 unless Shane asks — keep it ruthlessly simple.
- The hero phone number is the primary mobile tap target: `font-size: clamp(1.25rem, 5vw, 1.5rem)`, `tel:` link, 44×44px min hit area.

### 4.5 — Motion & accessibility (non-negotiable)

- **`prefers-reduced-motion: reduce`** → all waveform animation off, all hover lifts off, instant transitions.
- The waveform strip may animate amplitude via CSS `@keyframes` on `transform: scaleY()` only (cheap, compositor-only). Do NOT animate `height`/`width`/`box-shadow`. Cap at ~0.6s loop, ease-in-out, low amplitude.
- All interactive elements get a visible `:focus-visible` ring (`2px solid var(--amber)`, `outline-offset: 2px`). Never `outline: none` without a replacement.
- Color contrast: `--text` on `--bg` passes AAA; `--muted` on `--bg` must be checked at 17px — if it dips below AA, nudge `--muted` luminance up in the `@supports`/fallback. Amber (`#d4a574`) on `--bg` passes AA at ≥18.5px and bold ≥14px — use it for ≥17px text only.
- Semantic HTML: `<header><nav><main><section><footer>`, one `<h1>`, logical `<h2>` per section. The demo embed stays in an `<iframe>` (existing) with a descriptive `title`.

### 4.6 — Grain texture — exact implementation

```css
body::before{
  content:"";
  position:fixed; inset:0;
  background-image:url("data:image/svg+xml,...feTurbulence..."); /* see below */
  background-size:180px 180px;
  opacity:.04; mix-blend-mode:overlay;
  pointer-events:none; z-index:1;
}
/* content sits above the grain */
body > * { position:relative; z-index:2; }
```
Inline SVG (URL-encoded) for the tile:
```svg
<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'>
  <filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter>
  <rect width='100%' height='100%' filter='url(%23n)'/>
</svg>
```
ZCode: URL-encode the `#` as `%23` and drop it in as a single line. Test that `mix-blend-mode: overlay` reads as subtle warmth, not noise — if it's too strong on `#06060c`, drop `opacity` to `.03`.

### 4.7 — Waveform strip — exact implementation

A row of vertical bars, heights from a fixed array, pure SVG, amber at `--line-amber` opacity:
```html
<svg class="waveform" viewBox="0 0 600 40" preserveAspectRatio="none" aria-hidden="true">
  <!-- bars generated from a height array; static, no images -->
</svg>
```
- `.waveform { width:100%; height:40px; color:var(--amber); opacity:.5 }`
- Generate the bars server-side (in the worker string) from a short JS array so there's no build step — just inline ~40 `<rect>`s. Keep `aria-hidden="true"` (decorative).
- Optional animation: a CSS class `.waveform--live` that applies the reduced-motion-safe `scaleY` keyframe. Default static; consider animating only the **hero** one, after `window.load`, to signal "this thing listens."

### 4.8 — Out of scope for V1 (do not build)

- Pricing table / tiers / toggle (monthly/annual).
- Testimonials / logo wall (add V2 once Shane has real ones).
- Blog / docs / changelog links.
- Social icons.
- Any scroll-triggered "reveal" animations (anti-pattern for a fast landing — content is just there).
- i18n / multi-language.

### 4.9 — Build acceptance checklist (Shane signs off against this)

- [ ] One accent color (amber) only — grep the CSS, confirm zero blue/purple/green hex.
- [ ] Fonts self-hosted, no `fonts.googleapis.com` request in network panel.
- [ ] Grain overlay visible at low opacity, off on reduced-motion (grain can stay; only *motion* must disable).
- [ ] LCP < 1.5s on throttled 4G; total transfer < 180KB gzipped.
- [ ] Mobile: phone number is the primary tap target, 44px min.
- [ ] `:focus-visible` rings present on all controls.
- [ ] Hero H1 reads as approved concept #1; "Sound, made visible" appears as eyebrow/footer payoff.
- [ ] No "AI-powered / seamless / leverage" anywhere — grep the copy.
- [ ] Existing demo embed still renders responsively inside the new §4 frame.

---

## 5. Open questions for Shane (decide before build)

1. **Phone number on the hero** — keep (872) 829-1192 as the live tap-to-call demo number, or use a dedicated landing/demo tracking number? *(Recommend: keep it — it IS the product demo.)*
2. **"Sign in" link target** — point to the existing portal login (worker token flow)?
3. **Italic emphasis words** in H1 — confirm "*the job*" + "*moving*" as the amber italic pair, or pick different emphasis?
4. **Waveform animation** — static everywhere (fastest) vs. one gentle animation on the hero strip only (recommended)?

Everything else is specified. On approval, this doc goes straight to ZCode as the single source of truth.
