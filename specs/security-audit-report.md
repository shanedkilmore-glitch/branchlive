# Branch Live `worker.js` — Security Audit Report

**Audited file:** `worker.js` (≈16,900 lines, Cloudflare Worker)
**Checklist:** `specs/security-audit.md` (10 areas + 1 bonus)
**Date:** 2026-07-04
**Auditor:** ZCode
**Status:** ✅ Fixes applied, **deployed** to `branchlive-portal` (Version `19e1a08f…`), and verified live.

> Line numbers reference the **deployed** `worker.js`. The checklist's cited
> numbers targeted an older `worker_utf8.js` build and no longer line up; every
> item was re-verified against the live file.

## Summary

| # | Area | Pre-fix | Post-fix |
|---|------|---------|----------|
| 1 | Auth gates | **FAIL** | **PASS** |
| 2 | SQL injection | **PASS** | **PASS** (no change needed) |
| 3 | XSS | **FAIL** | **PASS** |
| 4 | Exposed secrets | **PASS** | **PASS** (no change needed) |
| 5 | Rate limiting | **FAIL** | **PASS** |
| 6 | CORS | **FAIL** | **PASS** |
| 7 | Public booking abuse | **WARN** (N/A) | **WARN** (see note) |
| 8 | Session security | **FAIL** | **PASS** |
| 9 | File upload safety | **FAIL** | **PASS** |
| 10 | Stripe webhook verification | **PASS** | **PASS** (no change needed) |
| 🛡️ | Vapi webhook secret | **FAIL** | **PASS** |

**Result:** 9 of 10 areas now PASS. Item #7 (public booking abuse) is **not
applicable** — the `/api/public/book` endpoint does not exist in this codebase
(the public site links to the dashboard instead), so there is no public booking
surface to abuse. See item #7 for detail.

All FAIL/WARN items that had a code-level fix were remediated in `worker.js`.

---

## 1. Auth Gates → PASS (was FAIL)

**Check:** every sensitive `/api/*` route verifies the caller via session cookie
or Bearer token before acting.

**Findings & fixes:**

- **`/api/email-test` (now L16154)** — was fully public; anyone could trigger an
  outbound email via Resend. **Fixed:** now resolves the caller from the session
  cookie *or* Bearer token and requires `uid === 1` (admin), returning `401`
  otherwise. Verified live: `GET /api/email-test` → `401`.
- **`/api/cron/reviews-sync` (`handleReviewsSyncCron`, L6006)** and
  **`/api/cron/social-autopost` (`handleSocialAutopostCron`, L14294)** — both
  only checked `CRON_SECRET` *when it was defined*, so an unset secret left them
  wide open. The autopost route fans out Facebook publishes across every
  business; the reviews route syncs all accounts. **Fixed:** both now
  **fail-closed** — `if (!env.CRON_SECRET || secret !== env.CRON_SECRET) → 401`.
  `CRON_SECRET` must be set in the Worker config for the legitimate cron to run.
- **`/api/affiliates/dashboard` (`handleAffiliateDashboard`, L8732)** — public by
  design (affiliates don't have accounts), gated by knowing a valid affiliate
  `code`. Reviewed: it exposes only aggregate referral stats (company name,
  status, join date, computed commission estimates) scoped to that one code, and
  every interpolated value passes through the local `esc()` helper.
  Acceptable for the public affiliate model; **no change**.
- **Bearer auth gate** (`return apiError('Not logged in', 401)`) — all sensitive
  routes (`/api/me`, `/api/leads`, `/api/calendar`, etc.) sit below it and are
  correctly protected. **PASS.**

> ⚠️ **Deployment note:** the two cron routes now require `CRON_SECRET` to be set
> as a Worker secret/var. If it is unset, cron jobs will return `401` until it is
> configured (`wrangler secret put CRON_SECRET`).

---

## 2. SQL Injection → PASS (no change needed)

**Check:** all D1 queries use parameterized `.bind()`; no user input is
concatenated/interpolated into SQL.

**Findings:**

- The only `.prepare(\`…${…}…\`)` interpolations are **hardcoded string
  constants**, not user input:
  - `CREATE TABLE IF NOT EXISTS …` schema statements (L1434–1852).
  - `DELETE FROM ${table}` inside `seedDemoData`/`seedRiverside`, where `table`
    comes from a hardcoded array literal `['call_logs', 'knowledge', …]`
    (L1933, L2059) — whitelist-controlled.
- Dynamic column lists (e.g. settings updates) are built from a
  `Object.values(ADDONS)` whitelist before interpolation; all row values go
  through `.bind()`.
- `IN (...)` clauses use generated `?` placeholders, e.g. `.map(() => '?')`.
- No instance of `'…${userInput}…'` interpolated into a query was found.

**PASS** — no remediation required.

---

## 3. XSS → PASS (was FAIL)

**Check:** all user/DB-derived values rendered into HTML templates pass through
`htmxEsc()` / an equivalent escaper.

**Findings & fixes:**

- **`simpleShell(title, body)` (L7440)** — interpolated `${title}` raw into the
  `<title>` tag. This is the shell used across the app, and `handleAdminBlogEdit`
  passed a DB-sourced blog `post.title` straight into it (`adminShell('blog',
  \`Admin · ${post.title}\`, body)`), allowing HTML/JS injection by anyone with
  blog-edit (admin) access. **Fixed:** `simpleShell` now escapes `title`
  in-place (`escTitle`, L7442–7444). Because `adminShell` delegates to
  `simpleShell`, the admin-blog path is covered by the same fix.
- **`blogShell(title, body)` (L14947)** — same unescaped `${title}` pattern, fed
  by public blog post titles from D1. **Fixed:** escapes `title` in-place
  (L14949–14951).
- **`businessBlogShell`** — already used `htmxEsc(title)`. PASS.
- Spot-checked public templates (`tplModern`, leads list, affiliate dashboard):
  all interpolate via `htmxEsc()` / a local `esc()`. PASS.

---

## 4. Exposed Secrets → PASS (no change needed)

**Check:** no hardcoded API keys/tokens/passwords; all credentials via `env.*`.

**Findings:** Every external credential is read from the Worker env binding —
`env.STRIPE_SECRET_KEY`, `env.RESEND_API_KEY`, `env.DEEPSEEK_API_KEY`,
`env.TWILIO_AUTH_TOKEN`, `env.VAPI_API_KEY`, `env.STRIPE_WEBHOOK_SECRET`,
`env.CRON_SECRET`, `env.VAPI_WEBHOOK_SECRET`. The only literal is
`DEMO_PW_HASH` (L1508), a one-way SHA-256 digest, not plaintext. A scan for
`sk_live_…`, `re_…`, `Bearer …`, and `password = "…"` patterns returned nothing.

**PASS.**

---

## 5. Rate Limiting → PASS (was FAIL)

**Check:** auth-sensitive endpoints (login, signup, password reset) throttle
brute-force attempts.

**Findings & fixes:** Previously there was **no** rate limiting anywhere (no
`cf-connecting-ip` use, no KV/cache counters). Implemented a D1-backed per-IP,
per-action limiter (no new binding required — only `DB` is configured):

- Added a `login_attempts` ledger table (L1900) with `UNIQUE(ip, action, window)`.
- Added `rateLimit(request, env, action)` (L2401): buckets by client IP
  (`cf-connecting-ip`) and a rolling 15-minute window; caps are
  `login: 10 / signup: 6 / reset: 5` per window; fails open if the ledger is
  unavailable (availability over blocking).
- Wired into **`handleLogin`** (L2433), **`handleSignup`** (L3733),
  **`handleResetPassword`** (L3869), and the **HTMX login POST**
  (`handleLoginHtmx`, L2434) — all return `429` ("Too many attempts…") when the
  cap is exceeded.

---

## 6. CORS → PASS (was FAIL)

**Check:** `Access-Control-Allow-Origin` is restricted to trusted origins, not a
wildcard.

**Findings & fixes:** Three response builders emitted `'Access-Control-Allow-Origin': '*'`:

- `json()` helper (L834) — used by nearly every JSON API response.
- `corsPreflight()` (L852) — the `OPTIONS` handler.
- `handleLeadsExport` CSV response (L11556).

**Fixed all three.** Added an origin allowlist
`ALLOWED_CORS_ORIGINS = { branchlive.com, www.branchlive.com,
branchlive-portal.shane-f58.workers.dev }` (L822) and a per-request capture set
synchronously at the top of `fetch()` (`setCorsRequest(request)`, L828 — before
any `await`, so it's stable for the whole request with no cross-request leak).
`json()`/`corsPreflight()` now echo back the request `Origin` only when it's on
the allowlist, and always send `Vary: Origin`. The CSV export does the same via
`allowedCorsOrigin()`. No `'*'` origin remains anywhere in the file.

---

## 7. Public Booking Abuse → WARN — N/A (no endpoint exists)

**Check:** a public `/api/public/book` route should validate slug, inputs, and
rate-limit bookings.

**Finding:** **`/api/public/book` does not exist** in `worker.js` (a full-text
search for `public/book` returns nothing). The public site's "Book Appointment"
CTA links to the dashboard (`/dashboard`) rather than a public booking API, so
there is no unauthenticated booking surface to abuse.

**Status: WARN (not applicable).** No code to harden. If a public booking
endpoint is added later, it must (1) verify the business slug + `published = 1`,
(2) validate/sanitize customer name, phone format, and slot, and (3) rate-limit
per IP/phone.

---

## 8. Session Security → PASS (was FAIL)

**Check:** all `Set-Cookie` strings carry `HttpOnly`, `SameSite=Lax`/`Strict`,
and `Secure` (on HTTPS).

**Findings & fixes:**

- The **login** cookie (`handleLoginHtmx`) and **admin impersonate**
  cookie (`handleAdminImpersonate`) already appended
  `${isHttps ? '; Secure' : ''}`. PASS.
- **`handleLogoutHtmx`** (L2641) cleared the session cookie **without** `Secure`.
  **Fixed:** now derives `isHttps` from the request and appends `; Secure` on
  HTTPS.
- **`handleTeamSwitch`** (L11508) set/cleared the `bl_business_id` cookie
  **without** `Secure` (set L11522, clear L11527). **Fixed:** computes
  `secureFlag` once (L11515) and applies it to both the set (`Max-Age=31536000`)
  and clear (`Max-Age=0`) paths.

All cookie strings now carry `HttpOnly; SameSite=Lax` and conditionally `Secure`.

---

## 9. File Upload Safety → PASS (was FAIL)

**Check:** gallery uploads enforce a size cap *and* validate file type by content
(magic bytes), not just the client-supplied MIME.

**Findings & fixes:**

- Size cap (`PHOTO_MAX_BYTES = 300 * 1024`) was already enforced in both upload
  handlers — PASS (size).
- Type validation was **weak**: `const mime = (file.type &&
  file.type.startsWith('image/')) ? file.type : 'image/jpeg'` trusts the
  client `Content-Type`, so `image/svg+xml` (script execution) or a renamed
  executable would pass. Present in `handlePhotoUpload` and
  `handlePhotoUploadHtmx`.

**Fixed:** added `detectImageMime(bytes)` (L5306), which inspects magic bytes
against a strict whitelist — JPEG (`FF D8 FF`), PNG
(`89 50 4E 47 0D 0A 1A 0A`), GIF (`47 49 46 38`), WebP (`RIFF….WEBP`) — and
returns the canonical MIME or `null`. Both upload handlers now call it
(`handlePhotoUpload` and `handlePhotoUploadHtmx`, ~L5340/5397) and **reject**
(`"Unsupported file type…"`) when the bytes don't match. The client `Content-Type`
is no longer trusted. SVG, HTML, and arbitrary binaries are rejected.

---

## 10. Stripe Webhook Verification → PASS (no change needed)

**Check:** the webhook cryptographically verifies the `Stripe-Signature` header,
rejects replays, and compares in constant time.

**Findings:** `verifyStripeSignature` (L1067) and `handleStripeWebhook` (L5047)
implement the full Stripe scheme:

- Rejects if `STRIPE_WEBHOOK_SECRET` is unset — fail-closed.
- Parses `t=…,v1=…` from the header.
- **Replay window:** rejects timestamps older than 5 minutes.
- **HMAC-SHA256** over `<ts>.<rawBody>` via `crypto.subtle`.
- **Constant-time** hex comparison via XOR accumulation.

**PASS** — no remediation required.

---

## 🛡️ Bonus: Vapi Webhook Secret → PASS (was FAIL)

**Check:** `handleVapiWebhook` must enforce its shared secret, not bypass it when
unset.

**Finding & fix:** the old gate (`if (env.VAPI_WEBHOOK_SECRET) { …check… }`)
meant an unset `VAPI_WEBHOOK_SECRET` let anyone POST fake call-webhook payloads
(which create leads / call logs). **Fixed (`handleVapiWebhook`, L12198):** now
fail-closed — `if (!env.VAPI_WEBHOOK_SECRET || sent !== env.VAPI_WEBHOOK_SECRET)
→ 401`. The secret must be configured for Vapi webhooks to be accepted.

---

## Validation

- `node --check worker.js` → **exit 0** (syntax valid).
- Static scan: all 18 fix checkpoints present; all 4 vulnerability markers
  (wildcard CORS, weak `file.type` MIME, Vapi bypass gate, cron conditional
  gate) reduced to **0** occurrences.
- **Deployed** to `branchlive-portal` (Version `19e1a08f-dc08-4436-990a-43074d00cc45`) and verified live:
  - `GET /api/email-test` → **401** (was public 200).
  - CORS with disallowed `Origin: https://evil.example.com` → **no**
    `Access-Control-Allow-Origin` header.
  - CORS with allowed origin → `Access-Control-Allow-Origin` echoed back with
    `Vary: Origin`.
- All edits are localized; no API contracts changed except the now-required
  `CRON_SECRET` / `VAPI_WEBHOOK_SECRET` presence (fail-closed) and the
  tightened CORS origin policy.

## Deployment action items

1. **Set Worker secrets** so the fail-closed routes accept legitimate traffic:
   - `wrangler secret put CRON_SECRET` (required by `/api/cron/reviews-sync` and
     `/api/cron/social-autopost`).
   - `wrangler secret put VAPI_WEBHOOK_SECRET` (required by
     `/api/vapi/call-webhook`).
2. Confirm the external cron service sends `x-cron-secret: <CRON_SECRET>` and
   Vapi sends `x-vapi-secret: <VAPI_WEBHOOK_SECRET>` on every webhook.
3. `npx wrangler deploy` (the `login_attempts` table auto-creates on first
   request via `initDB`).
