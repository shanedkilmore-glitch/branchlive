PASTE THIS INTO ZCODE:

---

Read C:\Users\17173\Projects\branchlive\specs\stripe-connect.md and implement it completely in worker.js. It adds Stripe Connect (Express) so each business receives estimate payments directly in their own bank instead of the Branch Live platform account. The spec contains exact, copy-ready code for every change.

Build in 2 phases; deploy + verify after each:

PHASE 1 — "Connect" (spec §1, §2, §3, §6):
- Add settings columns stripe_account_id + stripe_charges_enabled (idempotent ALTER, match the pattern at ~L1743).
- stripeRequest (L1021): add optional opts.account -> Stripe-Account header (backward compatible).
- New cookie-authed endpoints: GET /api/stripe/connect (create Express account + account link, redirect to onboarding), GET /api/stripe/status (refresh charges_enabled), GET /api/stripe/dashboard (login link).
- Settings page: add a "Payments" card mirroring the Gmail card (~L3106-3200), 3 states (not connected / incomplete / connected).

PHASE 2 — "Get paid" (spec §4, §5, §7):
- handleEstimateApprove (L6798): load the business's stripe_account_id; if Stripe configured but not connected/charges_enabled, return the friendly error; otherwise pass { account: acct } to the product/price/payment_link calls so funds go to the business. 0% platform fee (leave a // TODO fee comment where application_fee_amount would go).
- Webhook (L5104): no code change; note that the Stripe endpoint must listen to connected-account events (Shane handles in dashboard).
- Gating: dashboard /p/estimates banner when not connected; public estimate page surfaces the not-connected error nicely.

CRITICAL (branchlive skill pitfalls — do not repeat past breakages):
- worker.js HTML is built in template literals. NO stray backticks. NO nested single-quote inline onclick handlers (use addEventListener). Avoid backslash escapes (rephrase or use HTML entities). This is the #1 cause of "the dashboard vanished."
- Run `node --check worker.js` before EVERY deploy.
- Deploy ONLY via `./deploy.sh "message"` (deploys + commits atomically). NEVER `git reset --hard` or `git checkout -- worker.js` — it wipes uncommitted work.
- Never hardcode a secret; use env.STRIPE_SECRET_KEY. Do not invent Stripe IDs.

When finished, report which phases deployed and confirm `node --check` + login-htmx still returns 200.
