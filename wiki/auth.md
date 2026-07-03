# Branch Live — Auth System
# See also: routes.md, tables.md, patterns.md

## Auth methods

Branch Live uses TWO auth systems — know which one applies:

### 1. Cookie auth (HTMX pages + dashboard)
- **Cookie name:** `bl_session`
- **Set by:** POST /login-htmx (successful login)
- **Helper:** `getUidFromSessionCookie(request, env)` → returns uid or null
- **Used by:** All /p/* routes, /settings-htmx, /api/sites (GET), /api/settings (GET/POST)
- **Fallback:** Demo routes use uid=1 as fallback. Production routes redirect to /login-htmx?next=...

```js
const uid = await getUidFromSessionCookie(request, env);
if (!uid) return redirectToLogin(request);
```

### 2. Bearer token auth (API / SPA)
- **Header:** `Authorization: Bearer {token}`
- **Helper:** `getUserId(request, env)` → returns uid or null
- **Used by:** Legacy SPA endpoints, some /api/* POST routes
- **Token stored in:** sessions table

### 3. Stripe webhook (signature verification)
- **Header:** `Stripe-Signature: t=...,v1=...`
- **Helper:** `verifyStripeSignature(rawBody, sigHeader, secret)`
- **Used by:** POST /api/stripe/webhook ONLY
- **No auth:** Webhook is public; signature proves authenticity

## Session flow

1. User POSTs to /login-htmx with email + password
2. Server validates against users table (bcrypt compare)
3. Creates session row in sessions table with UUID + expiry
4. Sets `bl_session` cookie with the session UUID
5. Subsequent requests: getUidFromSessionCookie reads cookie → looks up session → returns user_id

## Admin gating

`requireAdmin(uid)` checks if user has admin privileges. Currently hardcoded — all users with uid=1 are admin. Returns a 403 response or null (pass).

```js
const denied = requireAdmin(uid);
if (denied) return denied;
```

## Demo account

- Email: demo@branchlive.com
- Password: demo123
- user_id: 1
- **Always has admin access**

## CSRF / Security

- Cookie: HttpOnly, Secure (in production), SameSite=Lax
- CORS: Configured in _headers file (Cloudflare Pages)
- All POST routes validate content-type and body
