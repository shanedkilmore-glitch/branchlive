# Spec: Stripe Connect (Express) — get businesses paid for estimates

**Goal:** Each business connects/creates their own Stripe account so estimate payments land
in THEIR bank, not the Branch Live platform account. Model: **Stripe Express + Account Links**.
Platform fee: **0%** (with a documented hook to add one later).

**Why:** Today `handleEstimateApprove` (worker.js ~L6798) creates the product/price/payment_link
with the platform `STRIPE_SECRET_KEY`, so estimate payments go to Branch Live, not the business.
This spec fixes that.

**Author:** Hermes (Crab). All line numbers are current as of this writing — re-grep before editing.

---

## §1 Data model (idempotent migration — match existing pattern at L1743)

Add two columns to the `settings` table (keyed by `user_id`; CREATE is at ~L1520):

```js
try { await env.DB.prepare("ALTER TABLE settings ADD COLUMN stripe_account_id TEXT DEFAULT ''").run(); } catch(e) {}
try { await env.DB.prepare('ALTER TABLE settings ADD COLUMN stripe_charges_enabled INTEGER DEFAULT 0').run(); } catch(e) {}
```

- `stripe_account_id` — the connected Express account id (`acct_…`), empty when not connected.
- `stripe_charges_enabled` — `1` once Stripe reports `charges_enabled: true` (onboarding complete).

## §2 `stripeRequest` — add connected-account support (worker.js L1021)

Add an optional `opts.account`. When present, send the `Stripe-Account` header so the call
acts **on behalf of the connected account**. Fully backward compatible — existing platform calls
pass no `account` and are unaffected.

```js
async function stripeRequest(env, path, opts = {}) {
  if (!stripeConfigured(env)) return { ok: false, error: 'Stripe not configured', status: 0 };
  try {
    const headers = {
      'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    if (opts.account) headers['Stripe-Account'] = opts.account;   // Connect: act as the connected account
    const res = await fetch(`https://api.stripe.com${path}`, {
      method: opts.method || 'GET', headers, body: opts.form || undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error?.message || `Stripe error ${res.status}`, status: res.status, data };
    return { ok: true, data, status: res.status };
  } catch (e) { console.error('Stripe request failed:', e); return { ok: false, error: String(e && e.message || e), status: 0 }; }
}
```

## §3 Connect onboarding endpoints (Express + Account Links) — cookie-authed

Resolve the business via `resolveContext()` → use `ctx.bid` (owning account's user_id) for the
settings row. New endpoints (register in the cookie-authed dispatcher section, near the other
`/api/*` cookie routes):

**`GET /api/stripe/connect`** — start/continue onboarding:
1. Read `settings.stripe_account_id` for the business.
2. If empty → create Express account and store it:
   ```
   POST /v1/accounts  form: { type:'express', email:<business email>,
     'capabilities[card_payments][requested]':'true',
     'capabilities[transfers][requested]':'true' }
   ```
   Save `account.id` to `settings.stripe_account_id`.
3. Create an account link and 302-redirect the business to it:
   ```
   POST /v1/account_links  form: { account:<acct_id>, type:'account_onboarding',
     refresh_url: `${origin}/api/stripe/connect`,           // expired-link retry loops back here
     return_url:  `${origin}/settings-htmx?stripe=connected` }
   ```
   Redirect to `account_link.url` (Stripe-hosted onboarding — name, bank/debit, KYC).

**`GET /api/stripe/status`** (or fold into settings load) — refresh connect status:
   ```
   GET /v1/accounts/<acct_id>
   → UPDATE settings SET stripe_charges_enabled = (account.charges_enabled ? 1 : 0)
   ```
   Call this on Settings page load AND when returning with `?stripe=connected`.

**`GET /api/stripe/dashboard`** — open the business's Express dashboard:
   ```
   POST /v1/accounts/<acct_id>/login_links  → 302 redirect to login_link.url
   ```

All connect endpoints require `charges_enabled` NOT to be assumed — always re-check via §3 status.

## §4 Route estimate charges to the connected account (worker.js `handleEstimateApprove` L6798)

Before the Stripe flow, load the business's connect status:
```js
const st = await env.DB.prepare('SELECT stripe_account_id, stripe_charges_enabled FROM settings WHERE user_id = ?').bind(est.user_id).first();
const acct = st && st.stripe_account_id;
if (stripeConfigured(env) && (!acct || !st.stripe_charges_enabled)) {
  return json({ ok:false, error:'This business hasn\u2019t finished setting up payments yet. Please contact them.' }, 400);
}
```
Then pass `{ account: acct }` to EVERY Stripe call in the flow so product/price/payment_link are
created ON the connected account (money → business):
```js
const product = await stripeRequest(env, '/v1/products', { method:'POST', form: stripeEncode({...}), account: acct });
const price   = await stripeRequest(env, '/v1/prices',   { method:'POST', form: stripeEncode({...}), account: acct });
const link    = await stripeRequest(env, '/v1/payment_links', { method:'POST', form: stripeEncode({ ...existing..., metadata:{ estimate_id:String(est.id) } }), account: acct });
```
- **Demo mode unchanged** (no `STRIPE_SECRET_KEY` → mark paid, as today).
- **0% platform fee now.** LATER (do not build): to take a cut, add
  `application_fee_amount: <cents>` to the `/v1/payment_links` form. Leave a `// TODO fee` comment.

## §5 Webhook (worker.js `handleStripeWebhook` L5065; estimate branch L5104)

The existing `checkout.session.completed` branch flips the estimate to `paid` via
`metadata.estimate_id` — this still works for connected-account (direct) charges because the
metadata is echoed on the event. **No handler code change required.**
- **SETUP (platform, one-time):** the Stripe webhook endpoint must be set to *also* receive
  events on connected accounts ("Listen to events on Connected accounts"). Documented in §8.

## §6 Settings UI — "Payments" card (mirror the Gmail card, worker.js ~L3106–3200)

Add a card in the Settings page. Three states driven by `stripe_account_id` + `stripe_charges_enabled`:
- **Not connected** (`stripe_account_id` empty): copy = "Connect Stripe to accept estimate payments — money goes straight to your bank." Button **[Connect Stripe]** → `/api/stripe/connect`.
- **Incomplete** (`acct` set, `charges_enabled=0`): "Finish your Stripe setup to start getting paid." Button **[Continue setup]** → `/api/stripe/connect`.
- **Connected** (`charges_enabled=1`): "✓ Connected — you're ready to get paid." Link **[Open Stripe dashboard]** → `/api/stripe/dashboard`.
Amber-monotone styling, Heroicon, matches existing Settings cards. No emoji placeholders.

## §7 Gating (don't let a business send a payable quote they can't collect)

- **`/p/estimates` dashboard:** if not `charges_enabled`, show a dismissible amber banner:
  "Connect Stripe in Settings to accept payments →" linking to Settings.
- **Public estimate page** (`handlePublicEstimate`): the Approve & Pay flow calls
  `handleEstimateApprove`, which now returns the §4 error if the business isn't connected —
  surface it as a friendly message ("Payments aren't set up yet — contact the business").
- Sending an estimate is still allowed (a quote can be informational), but the dashboard banner
  nudges the business to connect before they expect money.

## §8 Platform setup (Shane — one-time, will be spoon-fed with exact links at verify time)

1. Stripe Dashboard → **Connect** → get started → platform profile. Choose **Express**.
2. Set Express branding (business name, icon, brand color = #d4a574).
3. Edit the existing webhook endpoint → enable **"Listen to events on Connected accounts"** so
   estimate payments on connected accounts reach the handler.
4. **No new secret** — Account Links use the existing `STRIPE_SECRET_KEY`. Works in test mode first.

## §9 Out of scope (v1)
Platform fee (0% now, hook noted in §4), refunds/disputes UI (Stripe handles), payout scheduling
(Express dashboard handles), OAuth-style Standard Connect (we chose Express).

## §10 Verification (Hermes will run)
- `node --check worker.js` passes.
- Settings shows the Payments card; **[Connect Stripe]** → Stripe Express onboarding → return →
  card shows "Connected" and `stripe_charges_enabled=1` in D1.
- Create estimate → Approve & Pay creates a payment link **on the connected account** (verify the
  link/charge appears under the connected account in the Stripe dashboard, in test mode).
- Webhook flips the estimate to `paid` and books the lead.
- Not-connected business → Approve & Pay returns the friendly §4 error; dashboard shows the banner.

## Pitfalls (from the branchlive skill — ZCode MUST heed)
- **Template-literal escaping:** all this JS lives inside `simpleShell()`/handler template literals.
  No stray backticks; no nested single-quote inline `onclick` (use `addEventListener`); avoid `\` —
  rephrase or use HTML entities. This is the #1 cause of "dashboard vanished."
- **DEPLOY = COMMIT:** deploy only via `./deploy.sh "msg"`. NEVER `git reset`/`checkout -- worker.js`.
- Verify prices/ids are not hallucinated; `node --check` before every deploy.
