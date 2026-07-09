# Branch Live — Landing Page Redesign · V2 Spec

**Direction:** *Clean, warm SaaS* — light/cream canvas, one amber accent, serif headlines, lots of air.
**Status:** Approved layout (Turn 4 direction). Spec ready for ZCode to build. Shane signs off against §8 before merge.
**Date:** Jul 9, 2026
**Surface:** branchlive.com public landing page. Served by the Cloudflare Worker (landing HTML/CSS/JS inlined in `worker.js`) with static assets on Cloudflare Pages. **Pure HTML/CSS/JS, no framework.** This replaces only the current landing markup + CSS + JS — it does **not** touch the portal, `/dashboard`, `/api/*`, auth, or D1 logic.
**Builds on:** `LANDING_REDESIGN_V1_SPEC.md` (same brand DNA: amber, Fraunces/Inter Tight/JetBrains Mono, self-hosted fonts, perf budget). V2 changes the *theme* (light), *density* (richer sections), and *commercial structure* (tiers + proof).

---

## 0. North star

> The phone-answering service that books the job while you're up a ladder.

Warm but professional. Trustworthy, not flashy. The page should feel like a clean modern SaaS site (Close.com / Calendly / Apollo.io) that happens to sell to plumbers, HVAC techs, and electricians. **One accent color (amber).** Calm whitespace. Real numbers. A phone mockup that shows Emma working.

The brand's analog warmth carries over from V1 but onto a **light cream canvas**: the existing light variant palette (`#f6efe2` / `#2b2418` / `#c89255`) is the approved base — V2 is not a rebrand, it's that palette promoted to the marketing surface.

---

## 1. Decisions & deltas from V1

V2 keeps V1's brand DNA and intentionally changes five things. These are **approved** in the Turn 4 layout; they override the V1 spec where the two disagree.

| # | V1 (Sound Made Visible) | V2 (Clean SaaS) — this spec | Why |
|---|---|---|---|
| Theme | Dark (`#06060c` near-black) | **Light cream** (`#f9f4ea`) | Clean-SaaS direction; brand already has an approved cream variant |
| Social proof | Punted ("add V2 once real ones exist") | **Logo bar + testimonials section** | Approved layout; real testimonials exist in `marketing/homepage-copy.md` |
| Pricing | Single flat $29.95 | **3-tier cards** (Starter / Growth / Enterprise, "Most Popular" on Growth) | Approved layout; real plan names/prices = `[confirm]` (§9.2) |
| Nav | Mobile: drop nav links, CTA only | **Full nav** with mobile hamburger menu | Page now has 5 anchorable sections + Sign in |
| Texture | Grain overlay + waveform motif | **Waveform motif only** (subtle, accent). No grain overlay | Grain reads "hand-printed/edgy" → conflicts with clean SaaS |

**Kept from V1 (do not change):** single amber accent · Fraunces + Inter Tight + JetBrains Mono · self-hosted subsetted fonts · no Google Fonts `<link>` · perf budget (<180KB gz, LCP <1.5s) · `prefers-reduced-motion` discipline · `:focus-visible` rings · plain contractor voice.

---

## 2. Layout plan (section by section)

Nine sections, top to bottom. **Order is identical on mobile and desktop** — only density, columns, and the hero treatment change. No reordering.

```
┌──────────────────────────────────────────────────────────────┐
│ 0. HEADER / NAV          (sticky, 64px, translucent blur)     │
│ 1. HERO                  (cream bg, ~auto, 2-col on desktop)  │
│ 2. SOCIAL PROOF BAR      (logos, 1 row)                       │
│ 3. HOW IT WORKS          (3 steps, horizontal on desktop)     │
│ 4. FEATURES GRID         (2×3 on desktop)                     │
│ 5. TESTIMONIALS          (rotating/single quote + stat)       │
│ 6. PRICING               (3 cards, "Most Popular" on middle)  │
│ 7. FAQ                   (accordion, 1-col, max 760px)        │
│ 8. FOOTER                (minimal, links + contact)           │
└──────────────────────────────────────────────────────────────┘
```

### 2.1 — HEADER / NAV

**Purpose:** Persistent orientation + a always-visible primary CTA.

```
desktop (≥1024px):
[● Branch Live]            How it works · Features · Pricing · FAQ        [Sign in]  [Start free trial]
                            └── anchor scroll ──────────────────────┘                 └── amber ──┘

mobile (<1024px):
[● Branch Live]                                                          [☰]   (→ full-screen menu)
```

- **Sticky** (`position: sticky; top:0`), 64px tall, `backdrop-filter: blur(12px)` over a cream tint at ~80% opacity. Hairline `--line` bottom border that strengthens to amber on scroll (JS toggles `.is-scrolled` when `scrollY > 8`).
- **Brand mark** top-left: existing rounded-square amber gradient tile with serif "B" (see §6.2) + wordmark "Branch Live" in Fraunces 600.
- **Nav links** (desktop, right-aligned): *How it works · Features · Pricing · FAQ*. Each is a smooth-scroll anchor to the section `id`.
- **Right cluster:** `Sign in` (ghost link → existing portal login) + `Start free trial` (amber primary button → `/signup`).
- **Mobile:** brand left, hamburger right (44×44). Hamburger opens a full-viewport cream overlay menu (slide/fade, see §5.2). The mobile menu contains the 4 nav anchors + `Start free trial` (full-width amber) + `Sign in`.

### 2.2 — HERO

**Purpose:** State the value in one breath, prove it with a product visual.

**Desktop layout** (2-column, ~1.05fr left / 0.95fr right, content max-width 1200px):
```
        ✦ AMBER EYEBROW: "AI receptionist for home service businesses"

        Your phone answers itself,                 ┌─────────────────────┐
        so you never miss a job.                   │                     │
          ↑──── Fraunces, clamp(2.4rem,5.4vw,4rem) │   PHONE MOCKUP      │
          "answers itself" / "never miss" =         │   (Emma transcript  │
           amber italic                             │    + waveform)      │
                                                   │                     │
        Branch Live answers every call, books      │   ▁▂▃▅▇▅▃▂▁          │
        the job, and texts you the lead — 24/7.     └─────────────────────┘
         ↑ Inter Tight 18px, muted, max 50ch

        [ Start free trial ]   (872) 829-1192
          └ amber, solid ┘      └ mono, tap-to-call
```

- **Eyebrow:** amber, uppercase, tracked (+0.16em), 12px.
- **H1:** Fraunces 400, `clamp(2.4rem, 5.4vw, 4rem)`, line-height 1.0, letter-spacing −0.02em. 1–2 emphasis words in **amber italic** (Fraunces italic 500). Approved concept: *"Your phone answers itself, so you never miss a job."* — emphasis on *"answers itself"* + *"never miss"*.
- **Subhead:** Inter Tight 18px, `--muted`, line-height 1.6, max-width 50ch.
- **CTA row:** primary `Start free trial` (amber) + the phone number as a tap-to-call mono link (secondary visual weight). On mobile the phone number becomes a **full-width secondary button** beneath the primary CTA.
- **Product visual (right column):** a **phone mockup** (§6.1) showing Emma mid-conversation — a transcript bubble thread + an animated waveform at the bottom. This is the single hero image; no stock photography.
- **Background:** solid `--bg` cream. **Optional:** one very faint radial amber glow behind the phone mockup (≤5% opacity) to focus the eye. No mesh gradient, no rainbow.

**Mobile layout** (<768px): single column. H1 → subhead → CTA stack → phone mockup (full content width, scales down). Eyebrow persists.

### 2.3 — SOCIAL PROOF BAR

**Purpose:** "Others trust this" without screaming.

```
   ────  Trusted by service businesses across the country  ────
        [logo]   [logo]   [logo]   [logo]   [logo]
```

- One row, centered, grayscale logos (40% opacity → 70% on hover). Section is **short** — ~88px tall, modest vertical padding (`clamp(32px,5vh,56px)`).
- 3–5 logos. See §6.3 / §9.1: **these must be real customers or partner logos.** If none exist yet, render the bar with a tasteful text-only line (*"Trusted by plumbers, HVAC, and electrical crews in 40+ states"*) instead of fabricated logos. Do **not** invent companies.
- Hairline `--line` rules top + bottom to separate from hero/features.

### 2.4 — HOW IT WORKS

**Purpose:** Demystify in 3 steps. Make it feel mechanical, not magical.

**Desktop:** 3 equal columns with a thin connecting amber hairline between them (1px, 30% opacity).
```
   01 ─────────── 02 ─────────── 03
   [icon]          [icon]          [icon]
   Setup           Train Emma      Go Live
   Connect your    Tell Emma how   Emma answers,
   number in       your business   books the job,
   10 minutes.     works.          texts you the lead.
```
- **Step number** "01/02/03": JetBrains Mono, amber, `clamp(1.5rem,3vw,2rem)`.
- **Icon:** 32px line-SVG glyph, amber. (§6.4) — phone/handset, gear/script, check/calendar.
- **Title:** Fraunces 400, 1.35rem.
- **Body:** Inter Tight 15px, `--muted`, max ~28ch, line-height 1.55.
- **Mobile:** single column, stacked; the connecting line becomes a thin vertical hairline on the left.

### 2.5 — FEATURES GRID

**Purpose:** The "what you actually get" — concrete benefits, not feature checklists.

**Desktop:** 3 columns × 2 rows = 6 cards. **Tablet:** 2 columns. **Mobile:** 1 column.
```
   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
   │ [icon]       │  │ [icon]       │  │ [icon]       │
   │ 24/7         │  │ Knows your   │  │ Books the    │
   │ answering    │  │ trade        │  │ job          │
   │ body…        │  │ body…        │  │ body…        │
   └──────────────┘  └──────────────┘  └──────────────┘
   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
   │ Texts you    │  │ Every call   │  │ See every    │
   │ the lead     │  │ transcribed  │  │ lead         │
   └──────────────┘  └──────────────┘  └──────────────┘
```
- **Card:** `--surface` white, `border-radius: var(--radius)` (14px), 1px `--line` border, padding 28px. **No drop shadow at rest.**
- **Hover (desktop):** lift −2px (`translateY`), border warms to `--line-amber`, a faint amber glow (`box-shadow: 0 8px 24px -12px rgba(200,146,85,.35)`). Disabled under reduced-motion.
- **Icon:** 24px line SVG, amber, top of card.
- **Title:** Fraunces 400, 1.2rem, ink.
- **Body:** Inter Tight 15px, `--muted`, ~2 lines, line-height 1.55.

Six cards (copy from `marketing/homepage-copy.md`, condensed):
1. **Answers 24/7** — Picks up on the first ring, day or night. No voicemail, ever.
2. **Knows your trade** — Asks the questions that matter (square footage, furnace or AC, indoor/outdoor). Custom to your business.
3. **Books the job** — Checks your calendar and schedules the appointment while you work.
4. **Texts you the lead** — Name, number, what they needed, when they want it. Straight to your phone.
5. **Every call transcribed** — Read the full conversation later. Searchable, in your dashboard.
6. **See every lead** — A clean dashboard of every call, booking, and follow-up. *(maps to existing dashboard feature)*

### 2.6 — TESTIMONIALS

**Purpose:** Social proof with teeth — real names, real trades, real results.

**Desktop:** centered single feature quote (max 760px) + a stat row below.
```
            “I was losing 3–4 calls a day because I can't hear my phone
             over a concrete saw. Branch Live picked up every one of them.
             First week I booked two extra jobs I would've missed.”
                              — Mike T., Hardscape · Phoenix AZ

        ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
        │    30%       │  │   $40K/yr    │  │   one ring   │
        │ more jobs    │  │ saved vs a   │  │ to answer    │
        │ booked       │  │ receptionist │  │              │
        └──────────────┘  └──────────────┘  └──────────────┘
```
- **Quote:** Fraunces 400, `clamp(1.4rem,2.4vw,1.85rem)`, line-height 1.35, ink. Large amber opening quote glyph.
- **Attribution:** Inter Tight 14px, `--muted`. **Use only the real testimonials** in `marketing/homepage-copy.md` (Mike T., Dave R., Luis G., Tony M., Chris D.).
- **Optional rotator:** cycle through 3–5 testimonials every 7s with a manual dot/dash control. **Auto-rotate is OFF by default under `prefers-reduced-motion`** (§5.4). If rotator is omitted, hardcode the single strongest quote (Mike T.).
- **Stat row:** three big mono/serif numbers (30% more jobs · $40K/yr saved · one ring). Numbers are real-ish claims already in the brief/copy; §9.4 to confirm exact figures.
- Section sits on a `--surface` band (white) to break rhythm from the cream features section.

### 2.7 — PRICING

**Purpose:** Make the choice easy. One obvious pick.

**Desktop:** 3 equal cards in a row, middle card slightly elevated + "Most Popular" badge.
**Mobile:** stacked, middle card stays visually featured (amber border).
```
   ┌────────────┐  ┌════════════┐  ┌────────────┐
   │  Starter   │  ║   Growth   ║  │ Enterprise │
   │            │  ║ ★ Popular  ║  │            │
   │  $29.95    │  ║   $59.95   ║  │   Custom   │
   │   /mo      │  ║    /mo     ║  │            │
   │            │  ║            ║  │            │
   │ • bullets  │  ║ • bullets  ║  │ • bullets  │
   │            │  ║            ║  │            │
   │ [Start →]  │  ║ [Start →]  ║  │ [Contact →]│
   └────────────┘  └════════════┘  └────────────┘
```
- **All cards:** `--surface` white, 1px `--line` border, radius 16px, padding 32px.
- **Featured (Growth):** 2px `--amber` border, subtle amber glow shadow, badge pill top-right ("★ Most Popular", amber bg / ink text, 11px caps). On desktop, `transform: scale(1.03)` so it reads as the center of gravity.
- **Price:** Fraunces 400, `clamp(2.2rem,4vw,3rem)`. "/mo" in mono, `--muted`, smaller.
- **Feature bullets:** 15px, 5–7 per card, amber check glyph. Outline of tiers (§3.7) — **real plan names/prices/limits are `[confirm]` (§9.2).**
- **CTA per card:** Starter/Growth → `Start free trial` (amber, primary); Enterprise → `Contact sales` (ghost).
- **Trust line under cards:** *"14-day free trial. No credit card to start. Cancel anytime."* Inter Tight 14px, `--muted`, centered.

### 2.8 — FAQ

**Purpose:** Defuse the objections (will customers know it's AI? new number? contract?).

- Single column, **max-width 760px**, centered on cream bg.
- Section H2: "Questions, answered." (Fraunces, §4 type scale.)
- **Accordion** (§5.3): 6 items, one `<details>`/`<summary>` each OR a JS accordion. Click to expand; rotate a `+`/`−` chevron. Only one open at a time is fine but **not required** — default to "independent toggles" (simpler, more accessible via native `<details>`).
- Items + answers come straight from `marketing/homepage-copy.md` §FAQ (AI detection, can't-answer handling, customization, existing number, contracts, setup time).

### 2.9 — FOOTER

**Purpose:** Sign the page quietly. Contact + legal.

```
[● Branch Live]            Product              Company
AI receptionist for        How it works         About
home service businesses    Features             Contact
                           Pricing              [social — V2.1]
                           FAQ
                                                hello@branchlive.com
                                                (872) 829-1192
─────────────────────────────────────────────────────────────────
© 2026 Branch Live   ·   Privacy   ·   Terms
```
- `--bg` cream, hairline `--line` top rule. 4-column on desktop (brand / Product / Company / contact), stacked on mobile.
- Links muted → amber on hover. Social icons **optional / omitted in V2** (add when real accounts exist) — leave a slot but don't fabricate.

---

## 3. Component spec (what each section needs)

### 3.1 Header/nav
- **Logo:** brand mark tile + "Branch Live" wordmark (§6.2). Links to `/`.
- **Nav anchors:** `#how`, `#features`, `#pricing`, `#faq` (smooth scroll, §5.1).
- **Sign in:** link → existing portal login (worker token flow). `[confirm target — §9.5]`
- **CTA:** `Start free trial` → `/signup`.
- **Scroll state:** `.is-scrolled` toggled at `scrollY>8` (stronger border + slightly more opaque bg).

### 3.2 Hero
- **Eyebrow:** "AI receptionist for home service businesses".
- **H1:** *"Your phone answers itself, so you never miss a job."* — emphasis words amber italic.
- **Subhead:** "Branch Live answers every call, books the job, and texts you the lead — 24/7. No office staff needed."
- **Primary CTA:** `Start free trial` → `/signup`.
- **Secondary:** phone number `(872) 829-1192`, `tel:+18728291192`, mono. `[confirm demo number — §9.3]`
- **Visual:** phone mockup (§6.1).

### 3.3 Social proof
- Headline microcopy: "Trusted by service businesses across the country".
- Logos: 3–5 real customer/partner logos, grayscale, or **fallback text line** if none confirmed (§6.3, §9.1).

### 3.4 How it works
| Step | Title | Body |
|---|---|---|
| 01 Setup | Connect your number | Forward your existing business number in about 10 minutes. Nothing changes for your customers. |
| 02 Train Emma | Tell Emma your trade | Share your services, hours, and the questions that matter. Emma learns how you work. |
| 03 Go live | Emma takes the calls | Emma answers on one ring, books the job, and texts you the lead. |

### 3.5 Features — 6 cards (titles + one-liners) → see §2.5.

### 3.6 Testimonials — real quotes from `marketing/homepage-copy.md`. Default feature quote: **Mike T., Hardscape, Phoenix AZ.**

### 3.7 Pricing — tier outline (`[confirm]` real values §9.2)
| | Starter | Growth (★) | Enterprise |
|---|---|---|---|
| Price | $29.95/mo | $59.95/mo | Custom |
| Core | Unlimited calls · SMS lead alerts · 1 number · basic scheduling | Everything in Starter + calendar sync · email alerts · call transcripts · custom scripts · priority support | Everything in Growth + multi-number/multi-location · dedicated onboarding · integrations · SLA |
| CTA | Start free trial | Start free trial | Contact sales |

> **Note:** Starter ($29.95) and the old "Pro" ($59.95) are the only real plans in the copy doc. "Growth" = renamed Pro. **Enterprise is new/speculative** — confirm with Shane whether to ship it as a real tier or a "Contact us" catch-all. §9.2.

### 3.8 FAQ — 6 items from `marketing/homepage-copy.md`.

### 3.9 Footer — links as §2.9. Contact: `hello@branchlive.com`, `(872) 829-1192`. Legal: Privacy · Terms (existing `/terms`, `/privacy` routes already in `_routes.json`).

---

## 4. Design system

### 4.1 Color tokens (light/cream)

One accent (amber) + warm neutrals only. Implement as `:root` custom properties; **no raw hex outside this block.**

```css
:root{
  /* canvas + surfaces (light) */
  --bg:        #f9f4ea;   /* warm cream — the page */
  --surface:   #ffffff;   /* cards / featured band */
  --surface-2: #fbf6ec;   /* subtle alt tint */

  /* text */
  --ink:       #2b2418;   /* primary text — dark warm */
  --muted:     #6b6354;   /* secondary text (AA-checked at 15px+) */
  --muted-2:   #9a917f;   /* dim / placeholder */

  /* accent — the ONLY chromatic color on the page */
  --amber:      #c89255;  /* primary accent (deeper than #d4a574 for light-bg contrast) */
  --amber-soft: #e8c79b;  /* hover/tint backgrounds */
  --amber-deep: #9a6d33;  /* pressed / AA-safe amber text on light */

  /* lines */
  --line:        #e8dcc6; /* hairline rules / borders */
  --line-amber:  rgba(200,146,85,0.35);

  /* rings / focus */
  --ring-focus: var(--amber-deep);

  /* speaker colors — transcripts/demo only */
  --speaker-emma:  var(--amber-deep);
  --speaker-caller: var(--ink);
}
@supports not (color: oklch(0 0 0)){ /* oklch safety net if any oklch leaks in */ }
```

**Contrast rules (non-negotiable, verify in build):**
- `--ink` (#2b2418) on `--bg` (#f9f4ea) → ~13:1 ✅ AAA.
- `--muted` (#6b6354) on `--bg` → ~5.6:1 ✅ AA at 15px+.
- **Amber text on light:** `#c89255` fails AA for body text on cream → **use `--amber-deep` (#9a6d33) for any amber-colored text** (eyebrows, stat numbers, emphasis). Reserve `--amber` (#c89255) for **fills** (buttons, badges, icons) where the text on top is `--ink` (dark text on amber → ~5.8:1 ✅ AA).
- **Primary CTA:** solid `--amber` fill, `--ink` text. (Dark text on warm button — clean, on-brand, AA-safe.) Do not use white text on `#c89255`.

### 4.2 Typography

```css
--serif: 'Fraunces', Georgia, 'Times New Roman', serif;        /* headlines */
--sans:  'Inter Tight', system-ui, -apple-system, sans-serif;  /* body / UI */
--mono:  'JetBrains Mono', ui-monospace, monospace;            /* numbers / data */
```

| Role | Family | Weight | Size | LH | Tracking | Notes |
|---|---|---|---|---|---|---|
| Hero H1 | Fraunces | 400 | `clamp(2.4rem,5.4vw,4rem)` | 1.0 | −0.02em | amber italic on 1–2 emphasis words |
| Section H2 | Fraunces | 400 | `clamp(1.9rem,3.4vw,2.6rem)` | 1.05 | −0.015em | |
| Card H3 | Fraunces | 400 | 1.2–1.35rem | 1.2 | −0.01em | |
| Body / lede | Inter Tight | 400 | 1.0625rem (17px) | 1.6 | 0 | max 52ch |
| Eyebrow | Inter Tight | 600 | 0.75rem (12px) | 1 | +0.16em | uppercase, `--amber-deep` |
| Stat / price | Fraunces | 400 | `clamp(2.2rem,4vw,3rem)` | 1 | 0 | mono for "/mo" + phone numbers |
| Phone / data | JetBrains Mono | 400 | `clamp(1.25rem,2vw,1.5rem)` | 1 | 0.04em | `font-variant-numeric: tabular-nums` |

**Italic = tool, not style.** Amber italic Fraunces only on the 1–2 emphasis words per headline. Never whole sentences.

### 4.3 Spacing & grid

- **8px base grid.** Section vertical padding: `clamp(64px, 10vh, 120px)`. Horizontal gutters: `clamp(20px, 5vw, 64px)`.
- **Content max-width:** **1200px** (wider than V1's 1160 to fit 3-col pricing/grids). Prose blocks narrower (760px for FAQ/testimonial, 50ch for hero subhead).
- **Card gap:** 24px desktop / 16px mobile. Card padding 28px (feature), 32px (pricing).
- **Radius:** `--radius: 14px` (cards), 16px (pricing featured), pill (`999px`) for badges/eyebrows.
- One consistent vertical tempo between sections (same section padding) so the whole page breathes evenly.

### 4.4 Breakpoints (mobile-first, min-width queries)

```css
/* base: mobile-first, ≤767px */
@media (min-width: 768px){  /* tablet: features 2-col, hero stays 1-col */ }
@media (min-width: 1024px){ /* desktop: hero 2-col, features 3-col, pricing 3-col, full nav */ }
@media (min-width: 1280px){ /* max content width */ }
```
Four tiers only: **base / 768 / 1024 / 1280**.

### 4.5 Texture

- **Waveform motif** (kept from V1): thin rows of SVG `<rect>` bars at low amber opacity — used as the hero accent under the phone mockup and as quiet section dividers. Pure SVG, `aria-hidden`.
- **No grain overlay** in V2 (removed — conflicts with clean SaaS).
- **Elevation = borders + surface tint + a faint amber shadow on hover only.** No resting drop shadows on cards.

---

## 5. Interactive behavior

### 5.1 Smooth-scroll anchors
Nav links and in-page anchors smooth-scroll to section `id`s. Respect `prefers-reduced-motion` (instant jump). Add `scroll-margin-top: 80px` to section targets so the sticky header doesn't cover the heading.

### 5.2 Mobile nav menu
- Hamburger (44×44) toggles a full-viewport cream overlay (`position: fixed; inset:0`).
- Overlay contains: the 4 nav anchors (big, Fraunces), `Start free trial` (full-width amber), `Sign in`.
- Open/close: fade + slight slide. Body scroll-locked when open. Closes on link tap or Escape. ARIA: `aria-expanded`, `aria-controls`, focus trap while open, return focus to hamburger on close.
- Icon morphs ☰ ↔ ✕.

### 5.3 FAQ accordion
- **Preferred: native `<details>`/`<summary>`** (zero JS, keyboard + screen-reader friendly by default).
- Custom-style the marker: a `+`/`−` (or chevron) that rotates on `[open]`. Amber.
- If a JS accordion is used instead: one-open-at-a-time optional; full keyboard (Enter/Space toggle, arrow keys optional); `aria-expanded`/`aria-controls`; animated via `grid-template-rows: 0fr → 1fr` (no `height` animation jank) under reduced-motion guard.

### 5.4 Scroll behavior & motion
- **No layout-shifting reveal animations.** Content is just present (V1 anti-pattern stands).
- *Optional, subtle:* a single fade+`translateY(8px)` on first viewport entry per section, **off by default under `prefers-reduced-motion`**, never blocking paint, never repeating. If in doubt, omit.
- **Hero waveform:** may animate amplitude via CSS `transform: scaleY()` only (compositor-only; never animate `height`/`width`/`box-shadow`). Cap ~0.6s loop. Static under reduced-motion. Start after `window.load`.
- **Testimonial rotator (if built):** 7s auto-cycle, manual dots, **auto-rotate OFF under reduced-motion**, pause on hover/focus.
- **Header scroll state:** JS toggles `.is-scrolled` at `scrollY>8`.

### 5.5 Hover/focus states
- **Links:** `--muted` → `--amber-deep` on hover, underline on hover for body links.
- **Buttons:** primary `--amber` → `--amber-deep` (darken) on hover, slight `translateY(-1px)`; active `translateY(0)`.
- **Feature cards:** lift + amber border + faint glow (§2.5). Desktop only.
- **Focus:** every interactive element gets `:focus-visible` ring `2px solid var(--ring-focus)`, `outline-offset: 2px`. Never `outline:none` without a replacement. Visible in keyboard nav, suppressed for mouse.

---

## 6. Assets & content manifest

### 6.1 Hero phone mockup (the one custom asset)
- A **device frame** (CSS-drawn phone bezel, no external image needed) containing:
  - A short **transcript thread**: caller bubble + Emma bubble (2–3 turns), using `--speaker-caller` / `--speaker-emma` colors. Real-feeling copy, e.g.
    - Caller: *"Hi, my AC isn't cooling — can someone come out today?"*
    - Emma: *"Sorry to hear that. I can get a tech out this afternoon between 2 and 4. What's the address?"*
  - A **waveform strip** at the bottom (amber, animated per §5.4).
  - Optional: a small "Booked ✓ 2:00–4:00 PM" confirmation chip.
- Build it in HTML/CSS (preferred — crisp, tiny, theme-able) **or** a single optimized SVG. Avoid a heavy PNG screenshot unless one already exists. **Reuse existing screenshots** in `static/help/` (e.g. `how-emma-answers.jpg`, `calendar-booking.jpg`) only as reference, not as the final asset.

### 6.2 Brand mark
- Existing: rounded-square tile, `linear-gradient(135deg,#d4a574,#a87f4e)`, serif "B" (Fraunces 600/700). Reuse verbatim from current `index.html`. Pair with "Branch Live" wordmark.

### 6.3 Social proof logos
- **Real customer/partner logos only.** Grayscale, SVG preferred. If fewer than 3 are confirmed, **fall back to a text line** (§2.3) — do not fabricate company names or "as seen in" press logos. `[confirm — §9.1]`

### 6.4 Icons (features + how-it-works)
- **Line-style SVGs**, 24–32px, single-stroke, `currentColor` → amber. Hand-pick or draw a consistent set (phone/handset, gear/script, calendar/check, message/text, transcript/waveform, chart). Inline as an SVG sprite (`<symbol>`) referenced by `<use>` — one file, no per-icon requests. **No emoji** in production (the copy doc's emoji are placeholders).

### 6.5 Fonts (self-hosted — same rules as V1 §4.3)
- Self-host woff2 on Cloudflare Pages/static. **No `fonts.googleapis.com` link.**
- Subset to Latin + only used weights: Fraunces **400 roman + 400 italic** (+ 600 if wordmark/section needs it), Inter Tight **400/600**, JetBrains Mono **400**. Each woff2 **< 45KB**.
- `<link rel="preload" as="font" type="font/woff2" crossorigin>` for Fraunces 400 + Inter Tight 400; `font-display: swap` on the rest.

### 6.6 Copy source of truth
- All body copy, testimonials, FAQ → `marketing/homepage-copy.md`. Voice rules (§7.3) apply.

---

## 7. Implementation & deployment

### 7.1 Where it lives
- Landing HTML/CSS/JS goes **inline in `worker.js`** in the existing landing handler (string template), **or** the standalone `index.html` that Pages serves — match whichever the current deployment uses for `/`. No new framework, no build step.
- Delimit clearly so it's easy to find/edit:
```js
// ===== LANDING PAGE (Clean SaaS — V2) =====
const LANDING_HTML = `<!doctype html> ... `;
const LANDING_CSS  = ` ... `;
const LANDING_JS   = ` ... `;
// ===== END LANDING PAGE =====
```
- Static assets (woff2, SVGs) → Cloudflare Pages static dir; reference by absolute path (`/static/...`).

### 7.2 CSS architecture
- Single `:root` token block (§4.1). Everything consumes tokens — no raw hex elsewhere.
- BEM-ish flat classes: `.hero`, `.hero__eyebrow`, `.feature-card`, `.feature-card__title`, `.pricing-card--featured`.
- Mobile-first base + the four min-width breakpoints (§4.4).
- Sections full-bleed; inner `.container { max-width:1200px; margin-inline:auto; padding-inline:clamp(20px,5vw,64px) }`.

### 7.3 Voice guardrails (from V1, still binding)
- **Do:** plain contractor English ("answers the phone," "books the job," "texts you the lead"). Short sentences. Concrete verbs. Real numbers.
- **Don't:** "AI-powered," "leverage," "seamless," "revolutionize," "10x," "next-gen," "intelligent agent." No em-dash asides. No exclamation marks. No "we believe…"
- Approved lexicon: "answers the phone" ✅ / "AI call handling" ❌ · "books the job" ✅ / "automated scheduling" ❌ · "one ring" ✅ / "sub-second response" ❌.

### 7.4 Accessibility (non-negotiable)
- Semantic landmarks: `<header><nav><main><section><footer>`. One `<h1>` (hero). One `<h2>` per section. Logical heading order.
- `prefers-reduced-motion: reduce` → all animation off, instant transitions.
- `:focus-visible` rings on every interactive element (§5.5).
- Contrast: passes AA at the sizes specified (§4.1) — amber text uses `--amber-deep`, fills use `--amber`.
- Images/SVGs decorative → `aria-hidden`. The phone mockup transcript gets a brief off-screen text alternative describing it.
- Mobile menu: focus trap, Escape to close, focus return (§5.2).
- Tap targets ≥ 44×44px (phone number, hamburger, buttons).

### 7.5 Performance budget (carry V1)
- **Fonts + HTML + CSS + SVGs combined < 180KB gzipped.** **LCP < 1.5s on throttled 4G.**
- Hero LCP element = the H1 text (fast, no image wait). Phone mockup is HTML/CSS/SVG (no blocking image).
- Inline critical CSS; the page is small enough that one inlined `<style>` is fine.
- No render-blocking third-party scripts. No analytics blocking first paint (defer/async).

### 7.6 Deployment
- Deploy via the existing `deploy.sh` (`cd Projects/branchlive && bash deploy.sh`): runs `node --check worker.js`, `npx wrangler deploy`, conditionally `wrangler pages deploy` when `*.html`/static changed, then commits.
- Verify CSP in `_headers` still permits self-hosted fonts and inline `<style>`/`<script>` (it currently allows `script-src 'self' 'unsafe-inline'` + `*.branchlive.com` — confirm `font-src 'self'` covers the woff2 path).
- `_routes.json` already serves `/` from Pages; landing is the default route. No route changes needed.

---

## 8. Success criteria / acceptance checklist

Shane signs off against this list before merge. ZCode self-checks each.

**Layout & structure**
- [ ] All 9 sections render in the specified order on mobile and desktop; no reordering.
- [ ] Sticky header with full nav (desktop) + hamburger overlay (mobile) works, focus-trapped, Escape-closes.
- [ ] Hero is 2-col on desktop (copy left, phone mockup right), single-col stacked on mobile.
- [ ] Features = 3×2 (desktop) / 2-col (tablet) / 1-col (mobile). Pricing = 3 cards with featured middle.

**Design system**
- [ ] One accent color only — `grep` the CSS: zero blue/purple/green hex outside tokens. Amber is the sole chromatic color.
- [ ] `:root` tokens only; no raw hex elsewhere. Light cream base (`#f9f4ea`).
- [ ] Amber **text** uses `--amber-deep` (#9a6d33); amber **fills** use `--amber`. Contrast AA-verified.
- [ ] Fraunces/Inter Tight/JetBrains Mono self-hosted; **no `fonts.googleapis.com` request** in the network panel.

**Content**
- [ ] Hero H1 = approved concept ("Your phone answers itself, so you never miss a job."), amber italic on emphasis words.
- [ ] Testimonials use real quotes from `marketing/homepage-copy.md` (no fabricated names).
- [ ] Social proof bar uses real logos OR the text fallback — **no invented companies**.
- [ ] No banned words ("AI-powered / seamless / leverage / revolutionize") — `grep` the copy.

**Interaction & a11y**
- [ ] Nav anchors smooth-scroll with 80px scroll-margin; instant under reduced-motion.
- [ ] FAQ accordion is native `<details>` (or accessible JS): keyboard + ARIA correct.
- [ ] `prefers-reduced-motion` disables waveform/rotator/reveal animation.
- [ ] `:focus-visible` rings present on every control; tap targets ≥ 44px.
- [ ] Semantic landmarks, one `<h1>`, logical heading order.

**Performance & deploy**
- [ ] LCP < 1.5s on throttled 4G; total transfer < 180KB gzipped.
- [ ] Deploys via `deploy.sh`; `/` renders the new landing; portal/dashboard/`/api/*` unaffected.
- [ ] `_headers` CSP permits self-hosted fonts + inline style/script.

---

## 9. Open items for Shane (confirm before build)

1. **Social proof logos (§6.3).** Do you have 3–5 real customer/partner logos? If not, ship the text fallback line and add logos later. *(No fabricated companies.)*
2. **Pricing tiers (§3.7).** The layout is approved, but the real numbers aren't: confirm (a) Starter $29.95 / Growth $59.95, (b) whether **Enterprise** is a real sellable tier today or should be a "Contact us" catch-all, (c) exact feature bullets per tier.
3. **Hero demo phone number (§3.2).** Keep `(872) 829-1192` as the tap-to-call number, or use a dedicated landing/demo tracking number?
4. **Stat numbers in testimonials (§2.6).** Confirm the three stat figures (30% more jobs · $40K/yr saved · one ring) are claims you're comfortable putting on the page.
5. **"Sign in" target (§3.1).** Point to the existing portal login (worker token flow)? Confirm the exact URL.
6. **Hero H1 emphasis words.** Confirm "*answers itself*" + "*never miss*" as the amber-italic pair, or choose different emphasis.
7. **Testimonial rotator vs. static.** Ship one strong static quote (Mike T.), or the auto-rotating set of 3–5?

Everything else is specified. On approval of §9, this doc is the single source of truth for the build.
