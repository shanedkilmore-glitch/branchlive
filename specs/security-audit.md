# ZCode Security Audit Checklist — Branch Live `worker.js`

This security audit checklist is designed for ZCode to run against the Cloudflare Worker codebase ([worker.js (worker_utf8.js)](file:///C:/Users/17173/.gemini/antigravity-cli/scratch/worker_utf8.js)) in the **Branch Live** project. 

Each audit item identifies the core security check, target file/line locations, current status (**PASS** or **FAIL**), and code patterns representing pass/fail states.

---

## 1. Missing Auth Gates

Every API route must verify that the user is logged in (using cookie-based sessions or Bearer tokens). Any route handling sensitive data without authentication must be flagged.

*   **Where to Look:** Main routing table inside the exported `fetch()` handler in [worker_utf8.js:L14221-14969](file:///C:/Users/17173/.gemini/antigravity-cli/scratch/worker_utf8.js#L14221-14969).
*   **Status:** **FAIL**
*   **What to Check:**
    1.  Inspect all `/api/*` endpoints evaluated *before* the token-based auth gate check:
        ```javascript
        // worker_utf8.js: L14736
        const uid = await getUserId(request, env);
        if (!uid) { return apiError('Not logged in', 401); }
        ```
    2.  Check if any unauthenticated routes handle sensitive data.
*   **Pass/Fail Criteria:**
    *   **FAIL:** The diagnostic route [GET `/api/email-test`](file:///C:/Users/17173/.gemini/antigravity-cli/scratch/worker_utf8.js#L14245) is public and allows sending emails without auth. The [GET `/api/affiliates/dashboard`](file:///C:/Users/17173/.gemini/antigravity-cli/scratch/worker_utf8.js#L14279) endpoint only requires an affiliate code parameter but exposes list metrics and referred company emails/status. Also, cron routes [POST `/api/cron/reviews-sync`](file:///C:/Users/17173/.gemini/antigravity-cli/scratch/worker_utf8.js#L14620) and [POST `/api/cron/social-autopost`](file:///C:/Users/17173/.gemini/antigravity-cli/scratch/worker_utf8.js#L14626) only check `CRON_SECRET` *if* it is defined in `env`, otherwise bypassing auth.
    *   **PASS:** User routes (e.g. `/api/me`, `/api/leads`, `/api/calendar`) correctly check `getUserId` or `getUidFromSessionCookie` (e.g. `/api/team/switch` at [worker_utf8.js:L10713](file:///C:/Users/17173/.gemini/antigravity-cli/scratch/worker_utf8.js#L10713) verifies the session cookie and business membership).

---

## 2. SQL Injection

All database queries must use parameterized `.bind()` calls. String concatenation or template literal interpolation of untrusted values in SQL statements is strictly prohibited.

*   **Where to Look:** All D1 database `.prepare()` queries in [worker_utf8.js](file:///C:/Users/17173/.gemini/antigravity-cli/scratch/worker_utf8.js).
*   **Status:** **PASS** (No SQL Injection found)
*   **What to Check:** Check that no user-supplied values are directly concatenated or interpolated into database queries.
*   **Pass/Fail Criteria:**
    *   **PASS:** Dynamic parts are whitelisted or parameterized:
        *   Settings update whitelisting at [worker_utf8.js:L3440-3449](file:///C:/Users/17173/.gemini/antigravity-cli/scratch/worker_utf8.js#L3440-3449):
            ```javascript
            const allowed = Object.values(ADDONS).map(a => a.column);
            const entries = Object.entries(body).filter(([k]) => allowed.includes(k));
            // ...
            await env.DB.prepare(`INSERT INTO settings (user_id, ${cols.join(', ')}) ...`).bind(uid, ...vals).run();
            ```
        *   Lead updates at [worker_utf8.js:L3918-3927](file:///C:/Users/17173/.gemini/antigravity-cli/scratch/worker_utf8.js#L3918-3927) and onboarding steps at [worker_utf8.js:L11545-11575](file:///C:/Users/17173/.gemini/antigravity-cli/scratch/worker_utf8.js#L11545-11575) where variables are verified numbers/whitelisted strings.
        *   In-clause placeholders constructed securely via `const placeholders = phones.map(() => '?').join(',')` at [worker_utf8.js:L8531](file:///C:/Users/17173/.gemini/antigravity-cli/scratch/worker_utf8.js#L8531).
    *   **FAIL:** Direct string interpolation:
        ```javascript
        // Non-compliant example (NOT present in worker_utf8.js):
        await env.DB.prepare(`SELECT * FROM leads WHERE caller_name = '${body.caller_name}'`).run();
        ```

---

## 3. XSS (Cross-Site Scripting)

All user-supplied values rendered inside HTML templates must pass through `htmxEsc()` to prevent HTML injection and XSS. Unescaped variables should not appear in template literals.

*   **Where to Look:** `htmxEsc` definition at [worker_utf8.js:L2881](file:///C:/Users/17173/.gemini/antigravity-cli/scratch/worker_utf8.js#L2881), template renderers (e.g. `tplModern` starting at [worker_utf8.js:L5857](file:///C:/Users/17173/.gemini/antigravity-cli/scratch/worker_utf8.js#L5857)), and shell functions: `simpleShell` at [worker_utf8.js:L6924](file:///C:/Users/17173/.gemini/antigravity-cli/scratch/worker_utf8.js#L6924).
*   **Status:** **FAIL** (due to `simpleShell` title tag rendering)
*   **What to Check:** Find expressions within template literals `${...}` and check if they are wrapped in `h.esc()` or `htmxEsc()`.
*   **Pass/Fail Criteria:**
    *   **FAIL:** The `simpleShell` function interpolates the `title` parameter directly without escaping:
        ```javascript
        // worker_utf8.js: L6925
        return `<!DOCTYPE html><html lang="en"><head>...<title>${title} — Branch Live</title>`
        ```
        In [handleAdminBlogEdit](file:///C:/Users/17173/.gemini/antigravity-cli/scratch/worker_utf8.js#L14108), the blog title is fetched from D1 and passed raw: `adminShell('blog', `Admin · ${post.title}`, body)`. An attacker with blog creation access can inject HTML/JS via the title.
    *   **PASS:** Public templates properly escape content, e.g. `h.esc(data.name)` at [worker_utf8.js:L5863](file:///C:/Users/17173/.gemini/antigravity-cli/scratch/worker_utf8.js#L5863) or `htmxEsc(l.caller_name)` in the leads list at [worker_utf8.js:L8201](file:///C:/Users/17173/.gemini/antigravity-cli/scratch/worker_utf8.js#L8201).

---

## 4. Exposed Secrets

Source code must not contain hardcoded API keys, tokens, or passwords. Configuration variables (`STRIPE_SECRET_KEY`, `RESEND_API_KEY`, `DEEPSEEK_API_KEY`, etc.) should only appear as `env.X` references.

*   **Where to Look:** Throughout [worker_utf8.js](file:///C:/Users/17173/.gemini/antigravity-cli/scratch/worker_utf8.js) for raw strings assigned as keys.
*   **Status:** **PASS**
*   **What to Check:** Verify that credentials are read from Cloudflare environment bindings (`env`).
*   **Pass/Fail Criteria:**
    *   **PASS:** Secrets are loaded dynamically via `env`:
        *   Stripe: `env.STRIPE_SECRET_KEY` (e.g. [worker_utf8.js:L968](file:///C:/Users/17173/.gemini/antigravity-cli/scratch/worker_utf8.js#L968)).
        *   Resend: `env.RESEND_API_KEY` (e.g. [worker_utf8.js:L1063](file:///C:/Users/17173/.gemini/antigravity-cli/scratch/worker_utf8.js#L1063)).
        *   DeepSeek: `env.DEEPSEEK_API_KEY` (e.g. [worker_utf8.js:L12014](file:///C:/Users/17173/.gemini/antigravity-cli/scratch/worker_utf8.js#L12014)).
        *   Twilio/Vapi: `env.TWILIO_AUTH_TOKEN` (e.g. [worker_utf8.js:L10988](file:///C:/Users/17173/.gemini/antigravity-cli/scratch/worker_utf8.js#L10988)) and `env.VAPI_API_KEY` (e.g. [worker_utf8.js:L11065](file:///C:/Users/17173/.gemini/antigravity-cli/scratch/worker_utf8.js#L11065)).
        *   The hardcoded `DEMO_PW_HASH` is a one-way SHA-256 hash representation of the password, not plaintext (line 1416).
    *   **FAIL:** Hardcoded token string values:
        ```javascript
        // Non-compliant example (NOT present in worker_utf8.js):
        const STRIPE_SECRET_KEY = "sk_live_51P..."; 
        ```

---

## 5. Rate Limiting Gaps

Authentication-sensitive endpoints (login, signup, password reset) should have throttling/rate-limiting mechanisms to prevent brute-force attacks.

*   **Where to Look:** Handlers for `handleLogin` at [worker_utf8.js:L2304](file:///C:/Users/17173/.gemini/antigravity-cli/scratch/worker_utf8.js#L2304), `handleSignup` at [worker_utf8.js:L3588](file:///C:/Users/17173/.gemini/antigravity-cli/scratch/worker_utf8.js#L3588), and `handleResetPassword` at [worker_utf8.js:L3722](file:///C:/Users/17173/.gemini/antigravity-cli/scratch/worker_utf8.js#L3722).
*   **Status:** **FAIL**
*   **What to Check:** Look for IP-tracking counters, Cloudflare KV throttling, or rate limit checks using `request.headers.get('cf-connecting-ip')`.
*   **Pass/Fail Criteria:**
    *   **FAIL:** No rate limiting is implemented on `/api/login`, `/api/signup`, or `/api/reset-password`. Requests are processed indefinitely, facilitating automated attacks.
    *   **PASS:** The system checks a KV or cache storage for requests per IP and throws a 429 rate limit error when thresholds are crossed.

---

## 6. CORS Misconfiguration

The API should restrict Cross-Origin Resource Sharing (CORS) only to trusted origins (`branchlive.com` and `branchlive-portal.shane-f58.workers.dev`).

*   **Where to Look:** CORS helpers `json()` at [worker_utf8.js:L816](file:///C:/Users/17173/.gemini/antigravity-cli/scratch/worker_utf8.js#L816), `corsPreflight()` at [worker_utf8.js:L832](file:///C:/Users/17173/.gemini/antigravity-cli/scratch/worker_utf8.js#L832), and custom header overrides like `handleLeadsExport` at [worker_utf8.js:L10756](file:///C:/Users/17173/.gemini/antigravity-cli/scratch/worker_utf8.js#L10756).
*   **Status:** **FAIL**
*   **What to Check:** Check the value of the `Access-Control-Allow-Origin` header in response builders.
*   **Pass/Fail Criteria:**
    *   **FAIL:** Web responses return a wildcard origin allowing any site to access the API:
        ```javascript
        // worker_utf8.js: L821, L836, L10756
        'Access-Control-Allow-Origin': '*'
        ```
    *   **PASS:** Check the incoming `Origin` header against a whitelist and return only matching origins:
        ```javascript
        const origin = request.headers.get('Origin');
        const allowedOrigins = ['https://branchlive.com', 'https://branchlive-portal.shane-f58.workers.dev'];
        if (allowedOrigins.includes(origin)) {
            headers['Access-Control-Allow-Origin'] = origin;
            headers['Vary'] = 'Origin';
        }
        ```

---

## 7. Public Booking Abuse

The public booking route `/api/public/book` must be audited for rate limiting, input validation, and business slug verification.

*   **Where to Look:** Routing entries in [worker_utf8.js](file:///C:/Users/17173/.gemini/antigravity-cli/scratch/worker_utf8.js) under the main router.
*   **Status:** **FAIL** (Not Implemented)
*   **What to Check:** Verify if the route `/api/public/book` is defined in the Worker routing table.
*   **Pass/Fail Criteria:**
    *   **FAIL:** The `/api/public/book` endpoint is completely missing in `worker.js`. The public site currently bypasses a direct API and points the "Book Appointment" button to the internal dashboard page [worker_utf8.js:L5796-5797](file:///C:/Users/17173/.gemini/antigravity-cli/scratch/worker_utf8.js#L5796-5797).
    *   **PASS:** If implemented, the endpoint should be public but have:
        1.  **Slug validation:** Verify the business slug exists and has `published = 1`.
        2.  **Input validation:** Sanitize customer names, validate phone formats, and verify appointment time slots.
        3.  **Rate limiting:** Restrict booking attempts per IP or phone number to prevent spam.

---

## 8. Session Security

Cookies must be configured with `HttpOnly`, `SameSite=Lax` (or `Strict`), and the `Secure` flag to prevent session hijacking.

*   **Where to Look:** Cookie string formatting in `handleLoginHtmx` at [worker_utf8.js:L2488](file:///C:/Users/17173/.gemini/antigravity-cli/scratch/worker_utf8.js#L2488), `handleLogoutHtmx` at [worker_utf8.js:L2506](file:///C:/Users/17173/.gemini/antigravity-cli/scratch/worker_utf8.js#L2506), `handleTeamSwitch` at [worker_utf8.js:L10727](file:///C:/Users/17173/.gemini/antigravity-cli/scratch/worker_utf8.js#L10727), and `handleAdminImpersonate` at [worker_utf8.js:L12501](file:///C:/Users/17173/.gemini/antigravity-cli/scratch/worker_utf8.js#L12501).
*   **Status:** **FAIL** (due to missing `Secure` flags)
*   **What to Check:** Ensure all set-cookie strings specify `HttpOnly`, `SameSite`, and `Secure` attributes.
*   **Pass/Fail Criteria:**
    *   **FAIL:** 
        1.  In `handleTeamSwitch`, the business selection cookie `bl_business_id` is set without the `Secure` attribute:
            ```javascript
            // worker_utf8.js: L10727
            const cookie = `bl_business_id=${bid}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`;
            ```
        2.  In `handleLogoutHtmx` and `handleTeamSwitch` cleanup, cookie clearing is performed without a `Secure` check:
            ```javascript
            // worker_utf8.js: L2506
            const cookie = `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
            ```
    *   **PASS:** Login session cookie settings properly evaluate HTTPS conditions and append `Secure`:
        ```javascript
        const isHttps = url.protocol === 'https:';
        const cookie = `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax${isHttps ? '; Secure' : ''}; Max-Age=2592000`;
        ```

---

## 9. File Upload Safety

User gallery uploads must undergo strict validation checks for file size and file type (extension/MIME type and header magic bytes verification).

*   **Where to Look:** `handlePhotoUpload` at [worker_utf8.js:L5154](file:///C:/Users/17173/.gemini/antigravity-cli/scratch/worker_utf8.js#L5154) and `handlePhotoUploadHtmx` at [worker_utf8.js:L5213](file:///C:/Users/17173/.gemini/antigravity-cli/scratch/worker_utf8.js#L5213).
*   **Status:** **FAIL** (due to weak type validation)
*   **What to Check:** Verify both file size limits and file type validations are enforced.
*   **Pass/Fail Criteria:**
    *   **PASS (Size):** Max bytes are enforced at `300 * 1024` bytes (lines 5162, 5221).
    *   **FAIL (Type):** MIME validation is weak, relying entirely on the client-supplied `file.type` property:
        ```javascript
        // worker_utf8.js: L5170, L5227
        const mime = (file.type && file.type.startsWith('image/')) ? file.type : 'image/jpeg';
        ```
        This allows an attacker to bypass validation by setting a MIME type header like `image/svg+xml` (which can execute inline script in the browser when rendered in an `<img>` or `<iframe>`) or fake the header of an executable file.
    *   **PASS (Remediation):** Use a strict whitelist of safe formats (`image/jpeg`, `image/png`, `image/webp`) and verify magic bytes in the byte array (e.g. `FF D8 FF` for JPG, `89 50 4E 47` for PNG).

---

## 10. Stripe Webhook Verification

The webhook endpoint must verify the signature sent by Stripe in the `Stripe-Signature` header to ensure requests are authentic.

*   **Where to Look:** `handleStripeWebhook` at [worker_utf8.js:L4900](file:///C:/Users/17173/.gemini/antigravity-cli/scratch/worker_utf8.js#L4900) and `verifyStripeSignature` at [worker_utf8.js:L1006](file:///C:/Users/17173/.gemini/antigravity-cli/scratch/worker_utf8.js#L1006).
*   **Status:** **PASS**
*   **What to Check:** Look for cryptographic verification using the Web Crypto API, a replay attack window check (typically 5 minutes), and constant-time signature comparison.
*   **Pass/Fail Criteria:**
    *   **PASS:** The signature header is parsed, timestamp age is capped at 5 minutes (line 1019), and a SHA-256 HMAC signature is verified using `crypto.subtle.sign` and evaluated in constant-time (lines 1032–1034).
    *   **FAIL:** Signature checking is bypassed or uses a simple string comparison (which is vulnerable to timing attacks).

---

## 🛡️ Bonus Audit: Vapi Webhook Secret Verification

*   **Where to Look:** `handleVapiWebhook` at [worker_utf8.js:L11400](file:///C:/Users/17173/.gemini/antigravity-cli/scratch/worker_utf8.js#L11400).
*   **Status:** **FAIL** (Bypassable)
*   **What to Check:** Check if the verification gate enforces that the secret is set.
*   **Pass/Fail Criteria:**
    *   **FAIL:** The webhook verification is conditionally gated on the *presence* of the environment variable `VAPI_WEBHOOK_SECRET`:
        ```javascript
        if (env.VAPI_WEBHOOK_SECRET) {
          const sent = request.headers.get('x-vapi-secret');
          if (sent !== env.VAPI_WEBHOOK_SECRET) { return apiError('Unauthorized', 401); }
        }
        ```
        If `VAPI_WEBHOOK_SECRET` is not set or is empty in the environment, the verification check is completely bypassed, allowing anyone to POST fake webhook data.
    *   **PASS:** Enforce presence check: `if (!env.VAPI_WEBHOOK_SECRET || sent !== env.VAPI_WEBHOOK_SECRET)`.
