# Branch Live — Patterns & Conventions
# See also: routes.md, tables.md, auth.md

## File structure
- **worker.js** — monolith (~12K lines): all routes, handlers, DB queries, templates
- **index.html** — landing page (Cloudflare Pages)
- **dashboard.html** — legacy SPA (being replaced by HTMX)
- **signup.html** — signup flow (Pages)
- **_headers** — CSP, CORS, security headers
- **wrangler.jsonc** — Worker config, cron triggers, D1 binding

## Language rule (HARD — 2026-07-01)
**NEVER use the word "contractor"** in code, copy, UI text, or variable names.
Use "business", "service business", "local business", or "professional" instead.

## HTML escaping
Always use `htmxEsc()` for user-generated content in HTML templates:
```js
const esc = htmxEsc;
return `<h1>${esc(businessName)}</h1>`;
```

## API response shape
All API endpoints return JSON with `{ ok: true/false }`:
```js
return json({ ok: true, data: {...} });
return apiError('Something went wrong', 400);
```

## Database patterns

### Idempotent migrations
All schema changes in initDB() use IF NOT EXISTS / try-catch:
```js
try { await env.DB.prepare('ALTER TABLE settings ADD COLUMN new_field TEXT DEFAULT ""').run(); } catch(e) {}
```

### Query pattern
```js
const result = await env.DB.prepare('SELECT * FROM table WHERE user_id = ?').bind(uid).first();
const rows = result.results || [];
```

### Insert with conflict
```js
await env.DB.prepare('INSERT INTO table (...) VALUES (...) ON CONFLICT(column) DO NOTHING').bind(...).run();
```

## Template engine (website builder)

### Section toggles
9 sections defined in SITE_SECTIONS array: services, about, gallery, reviews, blog, booking, contact, serviceArea, social

Each template checks `s('key')` before rendering:
```js
const s = (k) => cfg.sections[k];
const reviewsSection = s('reviews') ? `<section>...</section>` : '';
```

### 5 Templates
- `tplModern()` — white space, bold type, gradient hero
- `tplWarmCraft()` — earth tones, Fraunces serif
- `tplBoldImpact()` — dark bg, Arial Black, uppercase
- `tplSoftElegance()` — Cormorant+Quicksand, curved edges
- `tplMinimalGrid()` — Inter, photo-forward, gallery-driven

### Shared helpers
`siteSharedHtml(data, cfg)` returns: esc, telHref, bookBtn, bookUrl, heroHeadline, heroSub, servicesInner, apptChips, galleryHtml, blogHtml, hoursHtml, socialLinksHtml

### Config normalization
`normalizeSiteConfig(site, query)` — migration-safe, handles URLSearchParams null vs undefined

## Stripe patterns
- `stripeConfigured(env)` — checks STRIPE_SECRET_KEY
- `stripeRequest(env, path, opts)` — thin REST wrapper, never throws
- `getAddons(env)` — resolves ADDONS config with env-injected Price IDs
- Price IDs from env: `STRIPE_PRICE_WEBSITE`, `STRIPE_PRICE_REVIEWS`, etc.

## Deploy
```bash
# Worker (all HTMX + API routes):
npx wrangler deploy

# Pages (landing, dashboard SPA, signup, _headers):
npx wrangler pages deploy . --project-name branchlive --branch main --commit-dirty
```

## Common pitfalls

1. **call_logs has NO caller_name column** — use caller_phone only. Activity feeds must fall back.
2. **call_logs has NO status column** — use duration_sec > 0 for "answered"
3. **leads uses caller_name** (not customer_name)
4. **WHEN is a SQLite reserved word** — don't alias columns as "when", use "ts" instead
5. **URLSearchParams.get() returns null** (not undefined) for absent params — check `!= null` not `!== undefined`
6. **Template literals inside template literals** — escape apostrophes with \u2019 to avoid nested-escaping bugs
7. **Settings UPSERT uses specific column lists** — don't use `*`, the INSERT list must match VALUES count
8. **npx wrangler deploy** (not `wrangler publish` — deprecated)

## Naming conventions
- Functions: camelCase (`handleWebsiteBuilderHtmx`)
- DB columns: snake_case (`business_name`)
- Routes: kebab-case (`/p/admin/sites`)
- CSS classes: kebab-case (`s-svc-item`)
