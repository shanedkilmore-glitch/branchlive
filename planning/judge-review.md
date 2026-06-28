# Branch Live — Pre-Launch Judge Review
**Date:** June 23, 2026  
**Reviewer:** Hermes Agent (Judge role)  
**Scope:** All files in `C:\Users\17173\Projects\branchlive\` and subdirectories

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL (blocks launch) | 7 |
| HIGH (customer-facing) | 9 |
| MEDIUM (internal) | 9 |
| LOW (cosmetic) | 7 |
| **TOTAL** | **32** |

---

## CRITICAL — Blocks Launch

### C1. Hardcoded Gmail App Password in Source Code
- **File:** `fix_env.py`, line 9 & 14
- **Issue:** The file contains a hardcoded Gmail app password `rcmueosbthziximf` written in plaintext Python source. This is a credential leak — anyone who ever sees this repo (GitHub, contractors, etc.) has the password. It also writes it to `~/.hermes/.env` in cleartext.
- **Fix:** Delete this file immediately. Revoke/rotate the Gmail app password NOW. Never commit credentials to source. Use environment variables loaded from a `.env` file gitignored and manually set on the server.

### C2. SHA-256 for Password Hashing — Not Password-Safe
- **File:** `portal.py`, line 94
- **Issue:** `hashlib.sha256(d.get('password','').encode()).hexdigest()` is used for password verification. SHA-256 is a fast hash — trivially brute-forced. Password hashing requires a slow, salted algorithm.
- **Fix:** Replace with `werkzeug.security.generate_password_hash()` and `check_password_hash()`, or use `bcrypt` directly. Example:
  ```python
  from werkzeug.security import generate_password_hash, check_password_hash
  # On signup: generate_password_hash(password)
  # On login: check_password_hash(stored_hash, password)
  ```

### C3. No Session Security Configuration
- **File:** `portal.py`, lines 25-26
- **Issue:** Flask session cookies use dangerous defaults. No `SESSION_COOKIE_SECURE`, `SESSION_COOKIE_HTTPONLY`, or `SESSION_COOKIE_SAMESITE` configured. Session cookies can be stolen via MITM or XSS.
- **Fix:** Add to portal.py after `app = Flask(__name__)`:
  ```python
  app.config.update(
      SESSION_COOKIE_SECURE=True,       # HTTPS only
      SESSION_COOKIE_HTTPONLY=True,     # No JS access
      SESSION_COOKIE_SAMESITE='Lax',    # CSRF protection
  )
  ```

### C4. Reflected XSS in Dashboard — innerHTML with Unsanitized Data
- **File:** `dashboard.html`, multiple locations
- **Issue:** User-supplied data is inserted directly into `innerHTML` without any escaping:
  - Line 113: `${currentUser.name}`, `${currentUser.company}`  
  - Line 255: `${l.caller_name}`, `${l.caller_phone}`, `${l.job_details}`  
  - Line 129: `${currentUser.name}`  
  - Line 158: `${k.category}`, `${k.item}`, `${k.notes}`  
  - Line 278 (email body): `${l.caller_name}`, `${l.job_details}`, `${currentUser.name}`  
  A caller could supply a phone number like `<img src=x onerror=alert(1)>` and it would execute in the contractor's browser.
- **Fix:** 
  1. Create a simple `escapeHtml()` function and wrap ALL dynamic data:
     ```javascript
     function escapeHtml(str) {
       const div = document.createElement('div');
       div.textContent = str || '';
       return div.innerHTML;
     }
     ```
  2. Use it everywhere: `escapeHtml(currentUser.name)`, `escapeHtml(l.caller_name)`, etc.
  3. Consider using `textContent` instead of `innerHTML` where possible.

### C5. Login Over HTTP — Credentials Sent in Cleartext
- **File:** `index.html`, line 879
- **Issue:** The login modal POSTs credentials to `http://branchlive.com:8081/api/login` — plain HTTP. Password is transmitted in cleartext over the network.
- **Fix:** 
  1. Serve via HTTPS (Cloudflare Tunnel already provides this at :7700). 
  2. Change the fetch URL to use the HTTPS domain, e.g., `https://branchlive.com/api/login` (routed through Cloudflare Tunnel to localhost:8081).
  3. Or use a relative URL: `fetch('/api/login', ...)` so the browser uses the current protocol.

### C6. Phone Number Links Are Broken (Asterisks)
- **File:** `index.html`, lines 640, 699, 700, 793, 833
- **Issue:** Phone links use `tel:+171****5677` with literal asterisks. These won't dial on any device — the browser treats them as invalid.
- **Fix:** Replace ALL occurrences of `+171****5677` with the actual full number `+17173415677`. The asterisk masking was presumably a placeholder that was never filled in. If privacy is a concern, use a click-to-reveal pattern or just show the real number (it's a business line).

### C7. Session Secret Regenerated Every Restart
- **File:** `portal.py`, line 26
- **Issue:** `app.secret_key = secrets.token_hex(32)` generates a new random key every time the server restarts. This invalidates ALL user sessions on every restart, logging everyone out.
- **Fix:** Store a persistent secret key:
  ```python
  app.secret_key = get_env('FLASK_SECRET_KEY') or secrets.token_hex(32)
  ```
  And add `FLASK_SECRET_KEY` to `.env`. Fall back to generating one if missing (first-run), but log a warning.

---

## HIGH — Customer-Facing

### H1. Duplicate Privacy & Terms Pages with Inconsistent Content
- **Files:** 
  - `privacy/index.html` vs `privacy.html`  
  - `terms/index.html` vs `terms.html`
- **Issue:** Two different versions of each legal page exist. `privacy.html` is a plain white-background page. `privacy/index.html` is the dark-theme version. Their SMS language differs slightly (e.g., "STOP" vs "STOP, CANCEL, END, QUIT, UNSUBSCRIBE, REVOKE"). Which one is shown depends on the server's static file routing. Inconsistent legal documents = liability.
- **Fix:** 
  1. Decide which version is authoritative (dark theme `privacy/index.html` and `terms/index.html` are more complete).
  2. Delete the duplicates (`privacy.html`, `terms.html`).
  3. Ensure all links point to the canonical versions (`/privacy/` and `/terms/`).

### H2. Privacy Policy Missing Critical Sections
- **File:** `privacy/index.html`
- **Issues:**
  - No Cookies Policy (required under GDPR/ePrivacy)
  - No Data Retention Policy — how long is data kept?
  - No Children's Privacy section (COPPA compliance, required in US)
  - No California Privacy Rights section (CCPA/CPRA, required if any CA customers)
  - No Data Breach Notification policy
  - No description of security measures
  - No third-party service providers disclosure (e.g., AI processing, SMS carriers)
  - No international data transfer statement
- **Fix:** Expand the privacy policy to cover all required sections. Use a generator like Termly or consult a template. At minimum: data retention, cookies, third-party sharing, CCPA rights, security practices. These are legal requirements for a business collecting PII.

### H3. Terms of Service Missing Critical Sections
- **File:** `terms/index.html`
- **Issues:**
  - No Limitation of Liability clause — without this, you have unlimited liability
  - No Warranty Disclaimer ("as-is" / "as available")
  - No Indemnification clause
  - No Dispute Resolution / Arbitration clause
  - No Governing Law (which state?)
  - No Payment Terms or Refund/Cancellation Policy
  - No Service Availability / SLA commitment
  - No Intellectual Property section
  - No Acceptable Use Policy
  - No Account Termination policy
- **Fix:** This needs a real terms of service. These omissions are a serious legal risk. Without a limitation of liability, you could be sued for consequential damages far exceeding any revenue.

### H4. No CSRF Protection on API Endpoints
- **File:** `portal.py`, all POST/PATCH/DELETE routes
- **Issue:** No CSRF tokens on any state-changing endpoint. An attacker could craft a page that makes POST requests to `/api/settings` or `/api/leads/<id>` using the victim's session cookie.
- **Fix:** For an SPA, implement one of:
  1. Custom CSRF token header: generate a token, store in cookie, require `X-CSRF-Token` header
  2. Use `flask-wtf` CSRF protection
  3. At minimum, check `Origin`/`Referer` headers on all POST/PATCH/DELETE requests

### H5. No Rate Limiting on Login
- **File:** `portal.py`, `/api/login` (line 88)
- **Issue:** No rate limiting. An attacker can brute-force thousands of login attempts per second.
- **Fix:** Use `flask-limiter` or implement a simple in-memory/IP-based rate limiter:
  ```python
  from flask_limiter import Limiter
  limiter = Limiter(app, key_func=lambda: request.remote_addr)
  
  @app.route('/api/login', methods=['POST'])
  @limiter.limit("10 per minute")
  def api_login(): ...
  ```

### H6. No Input Sanitization in Knowledge Base Upload
- **File:** `portal.py`, `/api/knowledge/upload` (line 258)
- **Issue:** CSV data is stored raw — item names, categories, notes can contain HTML/scripts. When rendered in dashboard.html (line 158), these are inserted via innerHTML.
- **Fix:** Add sanitization at the storage point (strip HTML tags, limit length) AND at the display point (escape in JS per C4 fix).

### H7. Auto-Generated Email Uses Unsanitized User Input
- **File:** `dashboard.html`, line 278
- **Issue:** The email body template builds an email body with `${l.caller_name}` and `${l.job_details}` directly interpolated into the text. If these contain newlines, they could inject SMTP headers (email header injection).
- **Fix:** Sanitize values: strip newlines from `caller_name` (max one line) and `job_details`. Better: construct the email body on the server side (`portal.py`) and let the API return a pre-built body.

### H8. Feedback/Testimonial Quotes Likely Fabricated
- **File:** `index.html`, lines 806-819
- **Issue:** Testimonials reference specific people ("Mike R., Lancaster PA", "Dave K., Harrisburg PA", "Jason T., York PA") with specific dollar amounts ($200/mo, $8,500 job). If these are not real customers who have given explicit written permission, this is deceptive marketing and violates FTC guidelines.
- **Fix:** Either: (a) get written permission from real customers, (b) remove specific names/locations and mark as "representative examples", or (c) use genuine verified testimonials. Do NOT launch with fake testimonials — this is a real legal risk.

### H9. No SSL/TLS Configuration in Flask
- **File:** `portal.py`, line 347
- **Issue:** `app.run(host='0.0.0.0', port=8081, debug=False)` — Flask's built-in server is not production-grade and serves plain HTTP. While Cloudflare Tunnel provides the TLS termination, if anyone accesses :8081 directly, it's unencrypted.
- **Fix:** 
  1. Bind Flask to `127.0.0.1` instead of `0.0.0.0` (only Cloudflare Tunnel needs to reach it locally)
  2. Add a production WSGI server (gunicorn, waitress)  
  3. Firewall port 8081 from external access

---

## MEDIUM — Internal

### M1. Two Conflicting Flask Apps in Same Directory
- **Files:** `app.py` (port 7893, political mind map) and `portal.py` (port 8081, AI receptionist)
- **Issue:** Two unrelated applications share the same project directory, same `static/photos/` directory, and the `.bat` file only starts `app.py`. `app.py` and `app_sphere_backup.py` appear to be duplicates.
- **Fix:** Clarify intent. If the political mind map (`app.py`) is the "app" and the AI receptionist (`portal.py`) is the "portal", separate them into subdirectories (`app/` and `portal/`). The batch file should start both or include a comment explaining the split.

### M2. Database Connection Pattern Creates Leaks
- **File:** `portal.py`, pervasive
- **Issue:** Every endpoint opens a new connection with `sqlite3.connect(str(DB))` and closes manually. If an exception occurs between connect and close, the connection leaks. No connection pooling.
- **Fix:** Use a context manager or Flask's `g` object:
  ```python
  import sqlite3
  from flask import g
  
  def get_db():
      if 'db' not in g:
          g.db = sqlite3.connect(str(DB))
          g.db.row_factory = sqlite3.Row
      return g.db
  
  @app.teardown_appcontext
  def close_db(exception):
      db = g.pop('db', None)
      if db: db.close()
  ```

### M3. portal.db Has No Foreign Key Enforcement
- **File:** `portal.py`, `init()` function (line 28)
- **Issue:** The schema declares relationships (e.g., `leads.user_id`, `call_logs.user_id`, `settings.user_id`, `knowledge.user_id`) but never runs `PRAGMA foreign_keys=ON`. SQLite doesn't enforce foreign keys by default. You can delete a user and orphan all their leads/calls/settings/knowledge silently.
- **Fix:** Add `PRAGMA foreign_keys=ON` at connection time and add explicit `FOREIGN KEY(user_id) REFERENCES users(id)` to table definitions.

### M4. No Persistent Error Logging
- **File:** `portal.py`, line 8
- **Issue:** `logging.basicConfig(level=logging.INFO)` only logs to console. No file logging means production errors are invisible unless someone is watching the terminal.
- **Fix:** Add file-based logging:
  ```python
  logging.basicConfig(
      level=logging.INFO,
      format='%(asctime)s %(levelname)s %(name)s: %(message)s',
      handlers=[
          logging.FileHandler('portal.log'),
          logging.StreamHandler()
      ]
  )
  ```

### M5. No Environment-Based Debug Toggle
- **File:** `portal.py`, line 347
- **Issue:** `debug=False` is hardcoded. During development you want debug=True but must remember to change it manually. Easy to accidentally deploy with debug=True (which enables the Werkzeug debugger — a remote code execution risk).
- **Fix:** 
  ```python
  debug = os.environ.get('FLASK_DEBUG', '0') == '1'
  app.run(host='127.0.0.1', port=8081, debug=debug)
  ```

### M6. Knowledge Base CSV Upload Has No Size Limit
- **File:** `portal.py`, `/api/knowledge/upload` (line 258)
- **Issue:** No file size limit. A malicious user could upload a 500MB CSV and crash the server (memory exhaustion reading the whole file at line 267).
- **Fix:** Add Flask config:
  ```python
  app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5 MB max
  ```

### M7. Knowledge Base `price` Field Accepts Any Value
- **File:** `portal.py`, line 298
- **Issue:** `d.get('price',0)` accepts strings, negative numbers, infinity, NaN. Later `$${(k.price||0).toFixed(2)}` in dashboard would render garbage.
- **Fix:** Validate price is a non-negative finite number:
  ```python
  price = float(d.get('price', 0))
  if price < 0 or not float('-inf') < price < float('inf'):
      return api_error('Invalid price')
  ```

### M8. `ai_query` Endpoint Has No Authentication
- **File:** `portal.py`, `/api/ai/query` (line 319)
- **Issue:** This endpoint accepts any `user_id` and returns their knowledge base data. No authentication check, no API key, no IP restriction. Anyone can query any user's pricing data.
- **Fix:** Add an API key check (shared secret between Emma's voice agent and the portal) or at minimum validate that the `user_id` corresponds to a valid, active account.

### M9. `start_branchlive.bat` Only Starts `app.py`
- **File:** `start_branchlive.bat`
- **Issue:** The batch file starts `app.py` (port 7893, political mind map) but NOT `portal.py` (port 8081, AI receptionist). The AI receptionist service won't be running after using this batch file.
- **Fix:** Either start both or create two separate batch files. If both need to run, use:
  ```batch
  start "BranchLive Portal" /B python portal.py
  start "BranchLive App" /B python app.py
  ```

---

## LOW — Cosmetic

### L1. No Meta Description / OG Tags on Portal Pages
- **Files:** `dashboard.html`, `privacy/index.html`, `terms/index.html`
- **Issue:** Only `index.html` has Open Graph and Twitter card meta tags. Other pages lack social sharing metadata.
- **Fix:** Add minimal OG tags to all public-facing pages.

### L2. No Favicon on Legal Pages
- **Files:** `privacy/index.html`, `terms/index.html`
- **Issue:** No favicon link. Shows default browser icon.
- **Fix:** Add the same inline SVG favicon from `index.html` line 26.

### L3. Missing ARIA Labels on Interactive Elements
- **File:** `index.html`, `dashboard.html`
- **Issue:** Many buttons, links, and inputs lack `aria-label` attributes. This fails WCAG 2.1 AA accessibility requirements.
- **Fix:** Audit interactive elements and add `aria-label` where the visual label is an emoji or icon. Examples: the hamburger menu, close buttons, nav links.

### L4. Inline Styles Throughout HTML
- **Files:** `index.html`, `dashboard.html`
- **Issue:** Extensive inline styles (especially in dashboard.html dynamic HTML). Hard to maintain, increases page weight, prevents CSP with `style-src 'self'`.
- **Fix:** Gradually extract to CSS classes. At minimum, pull the modal and dynamic HTML styles into the `<style>` block.

### L5. No `robots.txt` or `sitemap.xml`
- **Files:** Not present in project
- **Issue:** No robots.txt to guide crawlers, no sitemap for SEO. The landing page's SEO is handicapped.
- **Fix:** Create `robots.txt` (allow all, point to sitemap) and a basic `sitemap.xml` listing all public pages.

### L6. Testimonial Section Uses "★★★★★" as Text
- **File:** `index.html`, line 806-818
- **Issue:** Star ratings are raw Unicode characters. Screen readers read "black star black star black star black star black star" — poor UX.
- **Fix:** Wrap stars in a `<span aria-label="5 out of 5 stars">★★★★★</span>`.

### L7. Email Address Uses Personal Gmail
- **Files:** `index.html` line 842, `privacy/index.html` line 54, `portal.py` line 185
- **Issue:** `buddingcounter2@gmail.com` and `shanedkilmore@gmail.com` are personal emails used as official business contact and SMTP sender. Looks unprofessional.
- **Fix:** Set up `hello@branchlive.com` or `support@branchlive.com` on your domain. Use a transactional email service (SendGrid, Postmark, Resend) instead of raw Gmail SMTP.

---

## Landing Page Review (`index.html`)

### ✅ What's Good
- Excellent dark theme, consistent with project conventions  
- Good mobile responsive breakpoints at 1024px, 768px, 480px  
- `prefers-reduced-motion` media query — accessibility win  
- `content-visibility: auto` for performance  
- IntersectionObserver for scroll reveal (not scroll-jank)  
- Smooth scroll behavior  
- SVG favicon inline (no extra request)  
- Preconnect for Google Fonts  

### ❌ Broken / Missing
| Issue | Location | Severity |
|-------|----------|----------|
| Phone links use `****` (C6 above) | Lines 640, 699, 700, 793, 833 | CRITICAL |
| Login over HTTP (C5 above) | Line 879 | CRITICAL |
| No `loading="lazy"` on below-fold content | — | LOW |
| Optin checkbox has no associated form — no action on check | Line 828-831 | MEDIUM |
| "Text DEMO" button unresponsive if no SMS app on desktop | Lines 700, 833 | LOW |

### Mobile Layout Notes
- Hamburger menu works via CSS checkbox hack — functional but no animation  
- Hero buttons stack vertically on mobile (good)  
- Stats bar stacks vertically on ≤480px (good)  
- The free banner text wraps well on mobile  

---

## Portal Review (`portal.py` + `dashboard.html`)

### ✅ What's Good
- Consistent JSON API response format (`{'ok': bool, 'error': ...}`)  
- SQLite with parameterized queries (no SQL injection)  
- Demo seed data for quick testing  
- Sidebar navigation with page switching  
- Email sending integrated with Gmail SMTP  

### ❌ Security Vulnerabilities
| Issue | Severity |
|-------|----------|
| SHA-256 for passwords (C2) | CRITICAL |
| No CSRF tokens (H4) | HIGH |
| No rate limiting on login (H5) | HIGH |
| No session cookie security flags (C3) | CRITICAL |
| Session secret regenerated every restart (C7) | CRITICAL |
| XSS via innerHTML (C4) | CRITICAL |
| ai_query endpoint unauthenticated (M8) | MEDIUM |
| No file upload size limit (M6) | MEDIUM |
| Database connection leaks (M2) | MEDIUM |

### ❌ Broken / Missing
- `GET /api/calls` returns wrong field mapping — line 220 returns `r[2]` as `caller_phone` but call_logs schema has `lead_id` at index 2, `caller_phone` at index 3. The demo seed inserts `NULL` at index 2 (lead_id). **The field mapping is shifted.**  
- No `PUT` handler for knowledge items — only add/delete, no edit  
- No pagination on leads/calls — always returns 50 max, but no way to get page 2  
- Billing page shows hardcoded mock data (lines 186-205)  

---

## Privacy Policy Review

### Current Coverage
- ✅ Information collected (basic)
- ✅ SMS/mobile messaging section (fairly complete)
- ✅ Non-sharing of mobile info (strong language)
- ✅ Opt-out instructions
- ✅ Contact info

### Missing (Legal Risk)
1. **Cookies / Tracking:** No disclosure of cookies, localStorage, analytics
2. **Data Retention:** How long is call data, lead info, transcripts stored?
3. **CCPA/CPRA Rights:** California residents' rights (access, deletion, opt-out of sale)
4. **Children's Privacy (COPPA):** Statement that service is not for under-13
5. **Third-Party Service Providers:** Who processes the data (AI provider, SMS carrier, hosting)
6. **Data Security:** What measures protect stored data?
7. **Data Breach Notification:** How users are notified
8. **International Data Transfers:** Statement about US-based processing
9. **Changes to Policy:** How users are notified of updates
10. **Effective Date:** Present but should include version history

---

## Terms of Service Review

### Current Coverage
- ✅ Acceptance of terms (minimal)
- ✅ SMS program terms (good)
- ✅ Opt-out / Help instructions
- ✅ Carrier disclaimer
- ✅ Privacy policy cross-reference

### Missing (Legal Risk)
1. **Limitation of Liability** — CRITICAL: Without this, you face unlimited liability
2. **Warranty Disclaimer** — Service provided "AS IS"
3. **Indemnification** — User indemnifies you for their misuse
4. **Governing Law / Venue** — Which state? (Pennsylvania presumably)
5. **Dispute Resolution** — Arbitration clause, class action waiver
6. **Payment Terms** — Pricing, billing cycle, late payments, refunds
7. **Cancellation / Termination** — How to cancel, what happens to data
8. **Service Availability** — No uptime SLA, but at least state best-effort
9. **Intellectual Property** — Who owns what
10. **Acceptable Use** — What users can't do with the service
11. **Account Responsibility** — User responsible for credentials
12. **Modifications to Terms** — How changes are communicated

---

## Action Plan (Priority Order)

### Before Launch (Must Fix)
1. 🔴 Delete `fix_env.py` and rotate the Gmail password IMMEDIATELY
2. 🔴 Replace SHA-256 with bcrypt for passwords
3. 🔴 Fix all XSS vectors in dashboard.html (add escapeHtml)
4. 🔴 Fix session security (secret persistence, cookie flags)
5. 🔴 Fix login to use HTTPS URLs
6. 🔴 Fix broken phone number links
7. 🔴 Add CSRF protection
8. 🔴 Expand Privacy Policy with all missing sections
9. 🔴 Expand Terms of Service with liability, warranty, governing law

### Week 1 After Launch
10. 🟡 Add rate limiting on login
11. 🟡 Fix database connection pattern (use Flask g)
12. 🟡 Add foreign key enforcement
13. 🟡 Resolve duplicate privacy/terms files
14. 🟡 Fix `ai_query` authentication
15. 🟡 Add file upload size limit

### Ongoing
16. 🟢 Add robots.txt and sitemap
17. 🟢 Add ARIA labels
18. 🟢 Set up proper business email
19. 🟢 Add proper error logging
20. 🟢 Separate app.py and portal.py concerns

---

*This review was generated by an automated code audit. All findings should be verified by a human before acting on them. Legal judgments (privacy policy/terms completeness) are observations about common requirements — consult a lawyer for definitive legal advice.*
