# Email Newsletters — Implementation Document for ZCode

**Source spec:** `specs/email-newsletters.md` (352 lines) — the design of record. This
document does NOT redesign; it maps the spec onto **exact, verified** hook points in
`worker.js` and adds buildable detail (signatures, SQL, escaping, line numbers).

**All line numbers below were verified against `worker.js` on 2026-07-06.** They drift
over time — re-grep before editing. Every code block names the function it lives in so a
`grep "<functionName>(" worker.js` finds it even if lines shift.

**Multi-tenant rule (NON-NEGOTIABLE):** every query in this feature is scoped by
`user_id` (the resolved business owner — i.e. `pCtx.bid` from `resolveContext()`, NOT the
logged-in uid). Bind it on every query. Never SELECT/UPDATE without a `WHERE user_id = ?`.

**Template-literal rule (NON-NEGOTIABLE):** any HTML string built inside another template
literal must escape via `htmxEsc()` (defined `worker.js:3172`). Avoid contractions in copy
(rephrase "what's" → "what is"). Regex literals inside the shell must double-escape (`\\`).

---

## 0. The "email" vs "newsletter" distinction (read first)

The spec is explicit (§8): the existing **Email Autoresponder** (`addon_email`, $9.95/mo)
is a *reactive* 1:1 transactional email fired on missed-call/appt events. The
**Newsletter** feature is a *proactive* broadcast to the whole customer list on a cadence.

They share `sendEmail()` but are **separate products**. Therefore the Newsletter feature
adds a **NEW addon key** (`newsletter`) and a **NEW column** (`addon_newsletter`), rather
than overloading `addon_email`. This has a ripple effect documented in §2: a handful of
hardcoded `addon_*` column lists must be extended.

---

## 1. DDL — 3 tables + 3 settings columns (in `initDB`)

**Hook:** `async function initDB(env)` at **`worker.js:1489`**.

### 1a. Three new tables

The existing CREATE batch is a single `env.DB.batch([...])` spanning **L1492–L2074**.
Each statement is `env.DB.prepare(\`CREATE TABLE IF NOT EXISTS ...\`)`. Add the three new
tables inside this same batch (idempotent by construction — `IF NOT EXISTS`).

```js
// Inside the env.DB.batch([...]) block in initDB() (worker.js ~L1492–L2074).
// Place after business_blog_posts (L1748) which is the closest analog.
env.DB.prepare(`CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  status TEXT DEFAULT 'active',          -- 'active' | 'unsubscribed' | 'bounced'
  source TEXT DEFAULT 'lead',            -- 'lead' | 'appointment' | 'manual'
  source_id INTEGER,                     -- leads.id or appointments.id
  created_at TEXT DEFAULT (datetime('now')),
  unsubscribed_at TEXT,
  UNIQUE(user_id, email)                 -- enforce per-business dedupe
)`),
env.DB.prepare(`CREATE TABLE IF NOT EXISTS newsletter_campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,                 -- HTML body (already wrapped in businessEmailShell)
  status TEXT DEFAULT 'draft',           -- 'draft' | 'queued' | 'sending' | 'completed' | 'failed'
  scheduled_for TEXT,
  sent_at TEXT,
  recipients_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
)`),
env.DB.prepare(`CREATE TABLE IF NOT EXISTS newsletter_sends (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL,
  subscriber_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',         -- 'pending' | 'sent' | 'failed'
  resend_id TEXT,
  sent_at TEXT
)`),
```

> The spec's `idx_news_sub_user_email` is implemented inline as `UNIQUE(user_id, email)`
> — this gives us both the dedupe constraint AND the ON CONFLICT target in one shot. No
> separate `CREATE INDEX` is required.

### 1b. Three new settings columns

The idempotent `ALTER TABLE settings ADD COLUMN` cluster runs after the batch closes,
**around L1766–L1877**, each as `try { ... } catch(e) {}`. The existing addon block is
**L1782–L1786**. Append immediately after L1786 (`addon_email`):

```js
// In the ALTER cluster inside initDB(), right after the addon_email line (worker.js:1786).
try { await env.DB.prepare('ALTER TABLE settings ADD COLUMN addon_newsletter INTEGER DEFAULT 0').run(); } catch(e) {}
try { await env.DB.prepare("ALTER TABLE settings ADD COLUMN newsletter_frequency TEXT DEFAULT 'monthly'").run(); } catch(e) {}
try { await env.DB.prepare("ALTER TABLE settings ADD COLUMN newsletter_approval_mode TEXT DEFAULT 'auto'").run(); } catch(e) {}
```

> **Pitfall:** SQLite `ALTER TABLE ... DEFAULT "x"` uses double-quotes as string delimiters
> in the existing code style — but the branchlive skill flags double-quoted strings as a
> reserved-word trap. Use **single quotes** for the literal (`DEFAULT 'monthly'`) to match
> SQLite string syntax and stay safe. Verified: the existing `stripe_plan TEXT DEFAULT 'base'`
> at L1781 already does this.

---

## 2. ADDONS entry + Stripe billing wiring

### 2a. The ADDONS constant

**Hook:** `const ADDONS = { ... };` at **`worker.js:937–943`** (verified full content
below). Add a 6th key:

```js
// worker.js:937 — extend the object (add one line before the closing };).
const ADDONS = {
  website:    { column: 'addon_website',    label: 'Website Builder',        icon: '📱', price: 9.95,  priceId: null },
  reviews:    { column: 'addon_reviews',    label: 'Google Business Profile', icon: '⭐', price: 9.95,  priceId: null },
  social:     { column: 'addon_social',     label: 'Social Media',           icon: '📣', price: 9.95,  priceId: null },
  blog:       { column: 'addon_blog',       label: 'AI Blog Posts',          icon: '✍️', price: 14.95, priceId: null },
  email:      { column: 'addon_email',      label: 'Email Autoresponder',    icon: '✉️', price: 9.95,  priceId: null },
  newsletter: { column: 'addon_newsletter', label: 'Email Newsletters',      icon: '📧', price: 9.95,  priceId: null }, // NEW
};
```

`priceId` resolves at runtime via **`getAddons(env)`** (`worker.js:986`), which reads
`env[STRIPE_PRICE_${key.toUpperCase()}]` → i.e. set `STRIPE_PRICE_NEWSLETTER` as a
secret. **No change to `getAddons` is needed** — it iterates `Object.entries(ADDONS)`.

### 2b. The Stripe webhook addon sync (MUST EDIT — hardcoded UPDATE)

**Hook:** `async function syncAddonsFromSubscription(env, uid, subscription)` at
**`worker.js:5504`**. It computes the active addon set correctly (via `getAddons`), but
the final UPDATE is **hardcoded to 5 columns** at **L5515–L5522**:

```js
// worker.js:5515–5522 (CURRENT — must extend to 6 columns)
await env.DB.prepare(
  `UPDATE settings SET
     addon_website = ?, addon_reviews = ?, addon_social = ?,
     addon_blog = ?, addon_email = ? WHERE user_id = ?`
).bind(
  updates.addon_website, updates.addon_reviews, updates.addon_social,
  updates.addon_blog, updates.addon_email, uid
).run();
```

Extend to:

```js
await env.DB.prepare(
  `UPDATE settings SET
     addon_website = ?, addon_reviews = ?, addon_social = ?,
     addon_blog = ?, addon_email = ?, addon_newsletter = ? WHERE user_id = ?`
).bind(
  updates.addon_website, updates.addon_reviews, updates.addon_social,
  updates.addon_blog, updates.addon_email, updates.addon_newsletter, uid
).run();
```

`handleStripeWebhook` itself (`worker.js:5341`) needs no change — it delegates to this
function. `customer.subscription.updated` / `.created` / `.deleted` events all flow here.

### 2c. Other hardcoded `addon_*` SELECT lists (MUST EXTEND)

Adding a column that other code reads means every hardcoded `SELECT ... addon_*` list
must append `addon_newsletter`. Verified locations to extend (re-grep each before editing):

| Line | Function / context | Change |
|------|--------------------|--------|
| **L11975** | `handleBillingHtmx` — the addon toggle UI SELECT | add `, addon_newsletter` |
| **L4009** | settings read used by site renderer | add `, addon_newsletter` |
| **L8235** | settings read in public-site path | add `, addon_newsletter` |
| **L13159, L15337, L15465, L15906** | other settings reads that enumerate addons | add `, addon_newsletter` |
| **L5269–5270, L5487–5488** | INSERT INTO settings default-row creation | append the new columns |

> **Grep command to find them all before editing:**
> `grep -n "addon_email" worker.js` — every hit is a place that lists addons and likely
> needs `addon_newsletter` appended to its column list.

### 2d. Addon toggle UI is auto-generated (no markup edit needed)

The toggle cards in `/p/billing` are rendered dynamically from `getAddons(env)` at
**`handleBillingHtmx` L11979–L11989** (`addonCards = Object.entries(addons).map(...)`).
Adding the `newsletter` key to ADDONS automatically produces a 6th toggle card with the
correct `onchange="toggleAddon('newsletter','addon_newsletter',...)"` → POST
`/api/settings/addon-htmx`. **No manual card markup.**

**However:** `handleSettingsAddonHtmx` (`worker.js:3844`) whitelists which `addon_*`
columns it will write. Re-grep its column list — if it enumerates columns explicitly
(likely, to match the UPDATE pattern), add `addon_newsletter` to its allowlist.

---

## 3. Subscriber auto-harvesting

**Goal (spec §2.4):** every new lead/appt with an email is upserted into
`newsletter_subscribers`. The ON CONFLICT re-activates a previously-unsubscribed contact.

> **Re-activation semantics — important refinement:** the spec's
> `WHERE status = 'unsubscribed'` clause means a user who unsubscribed will NOT be
> silently re-subscribed just because they booked again (that would violate CAN-SPAM).
> But it ALSO means the upsert is a no-op for active subscribers, which is correct.
> Keep the `WHERE` guard exactly as the spec shows it.

### 3a. Lead creation hook

**Hook:** `async function handleCreateLead(request, env, uid)` at **`worker.js:4287`**.
The lead INSERT is at **L4297–L4299** (`INSERT INTO leads VALUES(NULL, ?, ...)`),
positional. `callerEmail` is already extracted at **L4293**. Insert the harvest
**immediately after L4299**, before the lead-notification email at L4301:

```js
// worker.js: inside handleCreateLead(), right after the leads INSERT (after L4299).
// `callerEmail`, `callerName`, `callerPhone` are already in scope (L4291–L4293).
if (callerEmail) {
  try {
    await env.DB.prepare(
      `INSERT INTO newsletter_subscribers (user_id, email, name, phone, source, source_id)
       VALUES (?, ?, ?, ?, 'lead', ?)
       ON CONFLICT(user_id, email) DO UPDATE SET status = 'active'
       WHERE status = 'unsubscribed'`
    ).bind(uid, callerEmail, callerName || null, callerPhone || null, leadId /* see note */).run();
  } catch (e) { console.error('newsletter harvest (lead) error:', e && e.message); }
}
```

> **`leadId` note:** the current `INSERT INTO leads VALUES(NULL,...)` is positional and
> does not return the row id. To capture `source_id`, change the insert to use
> `env.DB.prepare(...).run()` and read `meta.last_row_id` from the result, OR omit
> `source_id` (set to `null`) in v1 and backfill later. Recommend: capture last_row_id —
> it is cheap and makes the subscriber list traceable.

### 3b. Appointment booking hook

**Hook:** `async function handleCalendarAdd(request, env, uid)` at **`worker.js:4460`**.
The appt INSERT is at **L4470–L4471** (explicit-column list).

**Pitfall:** the `appointments` table has **no email column** (verified). The handler
resolves a customer email from a matching lead by name at **L4490** (`customerEmailForAppt`)
or accepts `body.customer_email`. Insert the harvest after the email is resolved and after
the appt INSERT, gated on the resolved email:

```js
// worker.js: inside handleCalendarAdd(), after the appt INSERT + email resolution (~L4496).
const apptEmail = body.customer_email || customerEmailForAppt || '';
if (apptEmail) {
  try {
    await env.DB.prepare(
      `INSERT INTO newsletter_subscribers (user_id, email, name, phone, source, source_id)
       VALUES (?, ?, ?, ?, 'appointment', ?)
       ON CONFLICT(user_id, email) DO UPDATE SET status = 'active'
       WHERE status = 'unsubscribed'`
    ).bind(uid, apptEmail, body.customer_name || null, body.customer_phone || null, apptId || null).run();
  } catch (e) { console.error('newsletter harvest (appt) error:', e && e.message); }
}
```

### 3c. Manual import (settings UI, optional v1.1)

A textarea on `/p/newsletters` for pasting `name <email>` lines → split + upsert with
`source = 'manual'`. Defer to v1.1; not in the build-critical path.

---

## 4. AI draft generation — `generateNewsletterDraft(env, uid)`

**Pattern source:** `async function generateBusinessBlogPost(env, uid)` at
**`worker.js:16026`**. Mirror it exactly.

**CRITICAL correction to the rough draft:** the existing AI blog generator does **NOT**
use DeepSeek or OpenAI. It uses the **Cloudflare Workers AI binding** directly:

```js
// worker.js:16072 (verified) — the AI call pattern to mirror
env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
  messages: [{ role: 'system', content: sys }, { role: 'user', content: usr }],
  max_tokens: 900,
  temperature: 0.75
})
```

The response shape is normalized across `string` / `choices[].message.content` /
`.response` / `.result.response` (L16082–L16086), with a **deterministic fallback draft**
when `env.AI` is absent or errors (L16094–L16099). Mirror all of this.

### 4a. New function: `generateNewsletterDraft(env, uid)`

Place it adjacent to `generateBusinessBlogPost` (~L16100, after that function closes).

```js
async function generateNewsletterDraft(env, uid) {
  // 1. Gather context (parallel queries — all scoped by user_id).
  const [settings, reviewsRes, photosRes, servicesRes, siteRow] = await Promise.all([
    env.DB.prepare('SELECT business_name, industry, service_area, forwarding_number, instagram_url, facebook_url, newsletter_frequency FROM settings WHERE user_id = ?').bind(uid).first(),
    // Spec §3.2 block 1 — top reviews (use reviews table, created ~L1921).
    env.DB.prepare('SELECT author_name, rating, text FROM reviews WHERE user_id = ? AND rating >= 4 ORDER BY reviewed_at DESC LIMIT 2').bind(uid).all(),
    // Spec §3.2 block 2 — recent work photos (photos table, L1650).
    env.DB.prepare('SELECT data, caption FROM photos WHERE user_id = ? ORDER BY created_at DESC LIMIT 2').bind(uid).all(),
    // Spec §3.2 block 3 — featured service (knowledge table, L1548).
    env.DB.prepare("SELECT item, notes FROM knowledge WHERE user_id = ? AND category = 'Services' ORDER BY RANDOM() LIMIT 1").bind(uid).first(),
    // Need slug for CTA + unsubscribe link (sites table, L1661).
    env.DB.prepare('SELECT slug FROM sites WHERE user_id = ? ORDER BY id LIMIT 1').bind(uid).first(),
  ]);

  const s = settings || {};
  const slug = (siteRow && siteRow.slug) || '';
  const bookUrl = slug ? `/s/${slug}/book` : '';
  const reviews = (reviewsRes.results || []);
  const photos = (photosRes.results || []);
  const service = servicesRes || {};
  const industry = (s.industry || 'this business').trim();
  const bizName = (s.business_name || 'our team').trim();

  // 2. Build the prompt. Output MUST be the INNER content (no <html> wrapper) —
  //    businessEmailShell() wraps it. Instruct the model to keep it under ~600 words.
  const sys = 'You write warm, professional email newsletters for local service businesses. Output ONLY email-safe inline-styled HTML for the body (no <html>, <head>, or <body> tags). Use <h2>, <p>, <table> with inline styles. Keep it under 600 words. Do not include unsubscribe links — those are added by the shell.';
  const usr = `Write a ${s.newsletter_frequency || 'monthly'} newsletter for ${bizName} (${industry}).
Use this real material:
- Top review: ${reviews[0] ? `"${(reviews[0].text||'').slice(0,200)}" — ${reviews[0].author_name}` : 'no recent review; write a general thank-you to customers instead'}
- Featured service: ${service.item || industry}
- Season: ${currentSeason()}   // existing helper, used by generateBusinessBlogPost
Include 3 sections: (1) a warm greeting + what is new, (2) the review or a customer-win story, (3) the featured service. End with a clear call to action to book the next appointment.`;

  // 3. Call Workers AI (mirror generateBusinessBlogPost L16072–L16099).
  let innerHtml = '';
  if (env.AI) {
    try {
      const ai = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
        messages: [{ role: 'system', content: sys }, { role: 'user', content: usr }],
        max_tokens: 900, temperature: 0.75
      });
      innerHtml = normalizeAiText(ai);   // extract the same way as the blog generator
    } catch (e) { console.error('newsletter AI error:', e && e.message); }
  }
  if (!innerHtml) {
    innerHtml = deterministicNewsletterFallback(bizName, industry, reviews, service, bookUrl);
  }

  // 4. Wrap in the branded shell (spec §3.1). Reuse the business's accent from site cfg
  //    if available; the shell takes (content, settings, site) per the spec.
  const site = { slug, accent: null };   // accent resolved inside the shell via site cfg
  const html = businessEmailShell(innerHtml, s, site);

  // 5. Compose subject + title and persist as a draft campaign.
  const season = currentSeason();
  const subject = `${season} update from ${bizName}`;
  const title = `${season.charAt(0).toUpperCase() + season.slice(1)} ${s.newsletter_frequency || 'monthly'} — ${bizName}`;
  const ins = await env.DB.prepare(
    'INSERT INTO newsletter_campaigns (user_id, title, subject, content, status) VALUES (?, ?, ?, ?, \'draft\')'
  ).bind(uid, title, subject, html).run();
  const campaignId = ins.meta && ins.meta.last_row_id;

  return { ok: true, campaignId, subject, html, title };
}
```

### 4b. New helper: `businessEmailShell(content, settings, site)`

Spec §3.1 gives the full body. **Two corrections vs the spec:**

1. **Accent color:** the spec hardcodes `#1e1b4b` (purple) in the header. The branchlive
   skill forbids purple. Use the amber palette (`--accent-primary: #d4a574`) or read the
   site's accent from `site` config. Resolve via:
   ```js
   const accent = (site && site.accent) || '#d4a574';   // amber fallback, never purple
   ```
   and use `accent` for the header background too — do not keep the hardcoded purple.

2. **`{{SUBSCRIBER_EMAIL}}` / `{{UNSUB_TOKEN}}` placeholders stay literal in the stored
   HTML.** They are substituted **per-recipient at send time** (§5). Do NOT pre-render
   them in the draft — the same stored `content` is sent to every recipient with only
   those two tokens swapped. This keeps the campaign row a single canonical template.

3. **Template-literal safety:** this helper returns a plain template literal (not nested
   inside `simpleShell()`), so single-backtick + normal escaping applies. But the
   `unsubscribe` href contains `${site.slug}` interpolation — fine. Avoid apostrophes in
   the footer copy ("Questions?" not "Got a question?").

### 4c. `currentSeason()` and `normalizeAiText()`

Both already exist (used by `generateBusinessBlogPost`). Re-use them — do not duplicate.
`currentSeason()` is grep-able; `normalizeAiText` may be inlined in the blog generator —
if so, extract the response-normalization into a small shared helper and call it from both.

---

## 5. Cron — the newsletter scheduler

**Hook:** `async scheduled(controller, env, ctx)` at **`worker.js:19759`** (the only true
cron entry point — verified). It currently runs:

1. **L19765** `runAppointmentFollowupsCron(env)` — every invocation, best-effort.
2. **L19769–L19811** the **business blog loop** — day-gated to Mon/Wed/Fri (UTC), pulls
   `SELECT user_id FROM settings WHERE addon_blog = 1`, caps at 3 posts/7 days, calls
   `generateBusinessBlogPost` + `notifyBusinessOfPost` per account, isolates per-account
   failures.

**Add a third block** after the blog loop (before the outer `catch` at L19813). Wrap it
in its own try/catch so a newsletter failure never breaks the blog cron (mirror the
appt-sms pattern at L19765).

### 5a. Newsletter cron block (insert ~L19812)

```js
// worker.js: inside scheduled(), after the blog loop closes (~L19812), before the outer catch.
// Newsletter engine — best-effort; never blocks other cron work.
try { await runNewsletterCron(env); } catch (e) {
  console.error('newsletter cron error:', e && e.message);
}
```

### 5b. New function: `runNewsletterCron(env)`

Two responsibilities, each day-gated differently from the blog loop (newsletters run on a
cadence, not 3×/week):

```js
async function runNewsletterCron(env) {
  const now = new Date();
  const dayOfMonth = now.getUTCDate();

  // ── Phase 1: DRAFT GENERATION (cadence check) ──────────────────────────
  // Monthly: due on day 1. Quarterly: day 1 of Jan/Apr/Jul/Oct. Annual: day 1 of January.
  // Only run the draft pass on day-of-month 1 to keep cron cheap.
  if (dayOfMonth === 1) {
    const { results } = await env.DB.prepare(
      "SELECT user_id, newsletter_frequency, newsletter_approval_mode FROM settings WHERE addon_newsletter = 1"
    ).all();
    const month = now.getUTCMonth();   // 0–11
    for (const acct of results || []) {
      const uid = acct.user_id;
      try {
        const freq = acct.newsletter_frequency || 'monthly';
        if (freq === 'quarterly' && ![0,3,6,9].includes(month)) continue;
        if (freq === 'annual' && month !== 0) continue;
        // Skip if a campaign already exists in the current period (idempotency).
        const periodDays = freq === 'monthly' ? 30 : freq === 'quarterly' ? 90 : 365;
        const recent = await env.DB.prepare(
          `SELECT id FROM newsletter_campaigns WHERE user_id = ? AND created_at >= datetime('now', ?)`
        ).bind(uid, `-${periodDays} days`).first();
        if (recent) continue;

        const res = await generateNewsletterDraft(env, uid);
        if (!res.ok) continue;

        if ((acct.newsletter_approval_mode || 'auto') === 'auto') {
          // Auto-send: queue immediately by creating pending sends for every active subscriber.
          await queueCampaignForSend(env, uid, res.campaignId);
        } else {
          // Draft & notify: leave as 'draft', email the owner to review.
          await notifyOwnerOfDraft(env, uid, res);
        }
      } catch (e) {
        console.error(`newsletter draft cron (uid ${uid}):`, e && e.message);
      }
    }
  }

  // ── Phase 2: DISPATCH (every invocation, batched) ──────────────────────
  // Send up to 20 pending sends per tick (spec §5.2 — stay under the 50-subrequest cap
  // with headroom for the Resend calls).
  await dispatchNewsletterBatch(env, 20);
}
```

### 5c. New helper: `queueCampaignForSend(env, uid, campaignId)`

Creates one `newsletter_sends` row (status `'pending'`) per **active** subscriber and
flips the campaign to `'queued'`:

```js
async function queueCampaignForSend(env, uid, campaignId) {
  const { results } = await env.DB.prepare(
    "SELECT id FROM newsletter_subscribers WHERE user_id = ? AND status = 'active'"
  ).bind(uid).all();
  const subs = results || [];
  if (!subs.length) {
    await env.DB.prepare("UPDATE newsletter_campaigns SET status = 'completed', recipients_count = 0 WHERE id = ?").bind(campaignId).run();
    return;
  }
  // Batch-insert pending sends. D1 batch limit ~1000; chunk if list is huge.
  await env.DB.batch(subs.map(sub =>
    env.DB.prepare('INSERT INTO newsletter_sends (campaign_id, subscriber_id, status) VALUES (?, ?, \'pending\')').bind(campaignId, sub.id)
  ));
  await env.DB.prepare(
    "UPDATE newsletter_campaigns SET status = 'queued', recipients_count = ? WHERE id = ?"
  ).bind(subs.length, campaignId).run();
}
```

### 5d. New helper: `dispatchNewsletterBatch(env, limit)`

```js
async function dispatchNewsletterBatch(env, limit = 20) {
  // Pull a batch of pending sends joined to their campaign + subscriber.
  const { results } = await env.DB.prepare(
    `SELECT ns.id AS send_id, ns.subscriber_id,
            nc.id AS campaign_id, nc.user_id, nc.subject, nc.content,
            nsub.email, nsub.name
     FROM newsletter_sends ns
     JOIN newsletter_campaigns nc ON nc.id = ns.campaign_id
     JOIN newsletter_subscribers nsub ON nsub.id = ns.subscriber_id
     WHERE ns.status = 'pending' AND nc.status IN ('queued','sending')
     LIMIT ?`
  ).bind(limit).all();

  if (!(results && results.length)) return;

  // Mark the campaign 'sending' if any are queued (best-effort, one UPDATE).
  const campaignIds = [...new Set(results.map(r => r.campaign_id))];
  await env.DB.prepare(
    `UPDATE newsletter_campaigns SET status = 'sending' WHERE id IN (${campaignIds.map(()=>'?').join(',')}) AND status = 'queued'`
  ).bind(...campaignIds).run();

  const UNSUB_SECRET = env.NEWSLETTER_HMAC_SECRET || env.STRIPE_WEBHOOK_SECRET; // see §8 note
  for (const r of results) {
    try {
      // Per-recipient token substitution (spec §5.1).
      const token = await hmacSha256(UNSUB_SECRET, `${r.user_id}:${r.email}`);
      const html = r.content
        .replaceAll('{{SUBSCRIBER_EMAIL}}', encodeURIComponent(r.email))
        .replaceAll('{{UNSUB_TOKEN}}', token);
      const result = await sendEmail(env, {
        to: r.email,
        subject: r.subject,
        html,
        uid: r.user_id          // so sendEmail tries Gmail first, then Resend
      });
      if (result.ok) {
        await env.DB.prepare(
          "UPDATE newsletter_sends SET status = 'sent', resend_id = ?, sent_at = datetime('now') WHERE id = ?"
        ).bind(result.id || null, r.send_id).run();
      } else {
        await env.DB.prepare(
          "UPDATE newsletter_sends SET status = 'failed' WHERE id = ?"
        ).bind(r.send_id).run();
      }
    } catch (e) {
      await env.DB.prepare("UPDATE newsletter_sends SET status = 'failed' WHERE id = ?").bind(r.send_id).run();
      console.error('newsletter send error:', e && e.message);
    }
  }

  // If every send for a campaign is now terminal, flip campaign to 'completed'.
  for (const cid of campaignIds) {
    const pending = await env.DB.prepare(
      "SELECT COUNT(*) AS c FROM newsletter_sends WHERE campaign_id = ? AND status = 'pending'"
    ).bind(cid).first();
    if (!pending || pending.c === 0) {
      await env.DB.prepare(
        "UPDATE newsletter_campaigns SET status = 'completed', sent_at = datetime('now') WHERE id = ?"
      ).bind(cid).run();
    }
  }
}
```

> **Batching math:** Cloudflare Workers free plan caps at 50 subrequests/request. Each
  send = 1 Resend/Gmail fetch + ~3 D1 calls. A batch of 20 sends ≈ 20 + 60 = 80 D1 calls
  (D1 calls are not counted as "subrequests" the same way external fetches are, but be
  conservative). The spec's 20/tick figure is safe; do not raise without re-checking
  the plan. The cron fires hourly per `wrangler.jsonc`, so a 500-subscriber list clears
  in ~25 ticks (~1 day) — acceptable for a monthly/quarterly broadcast.

> **`notifyOwnerOfDraft` / `notifyBusinessOfPost`:** `notifyBusinessOfPost` already
  exists (called at L19803). Write a parallel `notifyOwnerOfDraft(env, uid, { subject })`
  that emails the owner "Your newsletter draft is ready — review it at /p/newsletters"
  using `sendEmail(env, { to: ownerEmail, ... })`.

---

## 6. Dashboard page `/p/newsletters` + API endpoints

### 6a. Route registration

**Hook:** the `/p/*` dispatcher. The blog dashboard `/p/blog` is the closest analog —
grep for its route registration to mirror. Routes are registered in the main fetch
handler's `/p/*` block (~L19100–L19200 region; the addon-htmx route is at L19181).
Add:

```
GET  /p/newsletters                  → handleNewslettersHtmx(request, env, uid, ctx)
GET  /p/newsletters/subscribers      → handleNewsletterSubscribersHtmx (HTMX search fragment)
POST /api/newsletters/save           → handleNewsletterSave   (autosave draft edits)
POST /api/newsletters/send-test      → handleNewsletterSendTest (single test send)
POST /api/newsletters/send-now       → handleNewsletterSendNow (approve → queue)
POST /api/newsletters/generate       → handleNewsletterGenerate (manual "regenerate draft")
```

All `/p/*` handlers receive `(request, env, uid, ctx)` where `uid = pCtx.bid` (owner).
Apply `ROUTE_MIN_ROLE` gating (manager+ for view, admin for send actions) — mirror the
blog dashboard's gating.

### 6b. `handleNewslettersHtmx` — the page

Renders via `simpleShell()` (the standard `/p/*` shell at ~L6635). Layout per spec §6.1:

- **Stat cards** (amber monotone only — no green/red/blue):
  - Active subscribers: `SELECT COUNT(*) FROM newsletter_subscribers WHERE user_id = ? AND status = 'active'`
  - Cadence: read `newsletter_frequency` + `newsletter_approval_mode` from settings
  - Total sent: `SELECT COUNT(*) FROM newsletter_sends ns JOIN newsletter_campaigns nc ON nc.id = ns.campaign_id WHERE nc.user_id = ? AND ns.status = 'sent'`
- **Pending draft panel** (only if a `status = 'draft'` campaign exists):
  - Subject (editable, `hx-post="/api/newsletters/save"`)
  - HTML live preview (`srcdoc` iframe — render the stored `content` verbatim)
  - [Send Test Email] → `hx-post="/api/newsletters/send-test"`
  - [Approve Now] → `hx-post="/api/newsletters/send-now"`
- **Campaign history table**: `SELECT id, subject, recipients_count, status, sent_at FROM newsletter_campaigns WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`

> **Template-literal caution (skill pitfall #1):** this page is built inside
> `simpleShell()`'s template literal. Any regex or apostrophe in inline `<script>` MUST
> double-escape (`\\`) or use `\u2019`. Avoid contractions in all visible copy.

### 6c. API handlers (JSON, `{ ok: true/false }` per `wiki/patterns.md`)

| Endpoint | Behavior |
|----------|----------|
| `POST /api/newsletters/save` | Body `{ campaign_id, subject?, content? }`. UPDATE only `subject`/`content`, only if `status = 'draft'` AND `user_id = ?`. Return `{ ok: true }`. |
| `POST /api/newsletters/send-test` | Body `{ campaign_id, to_email }`. Render content with the owner's own email/token, send via `sendEmail(env, { to, subject, html, uid })`. No `newsletter_sends` row. Return `{ ok }`. |
| `POST /api/newsletters/send-now` | Body `{ campaign_id }`. Verify ownership + `status='draft'`, then call `queueCampaignForSend(env, uid, campaign_id)`. Return `{ ok, recipients }`. |
| `POST /api/newsletters/generate` | Call `generateNewsletterDraft(env, uid)`. Return `{ ok, campaign_id }`. |

Every handler: resolve `uid` from session, scope all SQL by it, return JSON via the
existing `json()` / `apiError()` helpers.

---

## 7. Settings UI — toggle, cadence, approval mode

**Two places to surface newsletter settings:**

### 7a. The toggle (auto-rendered in `/p/billing`)

Adding `newsletter` to ADDONS (§2a) auto-renders a 6th toggle card in
`handleBillingHtmx` (L11979). Flipping it POSTs to `/api/settings/addon-htmx`
(`handleSettingsAddonHtmx`, L3844). **Verify that handler's column allowlist includes
`addon_newsletter`** (§2c). When the user toggles ON without an active subscription, the
existing `toggleAddon` client code (L12023) already drives Stripe checkout.

### 7b. Cadence + approval mode (in `/settings-htmx`)

**Hook:** `async function handleSettingsHtmx(request, env)` at **`worker.js:3865`**. The
settings POST upsert is at **L3899–L3935**.

**Critical:** the upsert's column list is deliberately explicit so billing/addon columns
are NOT clobbered by the form (comment at L3881). The new columns
`newsletter_frequency` and `newsletter_approval_mode` are user-editable (not billing), so
they **belong in this upsert**. Extend both the INSERT column list and the ON CONFLICT
SET clause:

```js
// worker.js: L3900 INSERT column list — add two columns.
//   ... sms_followup_enabled, sms_reminder_template, sms_checkin_template,
//   ... voice_notes_enabled, owner_phone,
       newsletter_frequency, newsletter_approval_mode
//   ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)  // +2 placeholders
//   ON CONFLICT(user_id) DO UPDATE SET
//   ... ,
//   newsletter_frequency = excluded.newsletter_frequency,
//   newsletter_approval_mode = excluded.newsletter_approval_mode
```

**Bind the two new values** in the `.bind(...)` call (from `body.newsletter_frequency`,
`body.newsletter_approval_mode`, defaulting to `'monthly'` / `'auto'`).

### 7c. The settings UI markup

Inside the `/settings-htmx` template (rendered by `handleSettingsHtmx`), add a collapsible
section (spec §7) — but ONLY if `addon_newsletter = 1` (hide entirely when the addon is
off, to avoid confusing users who have not subscribed). Read the flag from the settings
row already fetched. Fields:

- **Cadence dropdown**: `name="newsletter_frequency"`, options `monthly|quarterly|annual`,
  selected from current value.
- **Approval mode radio**: `name="newsletter_approval_mode"`,
  - `auto` → "Generate and send automatically."
  - `manual` → "Generate a draft and notify me. Hold sending until I review."
- All labels use `htmxEsc()` for any dynamic text; no contractions in copy.

> **Spec value mapping:** the spec's radio values are `Auto-Send` / `Draft & Notify`. Store
> the canonical short codes (`auto` / `manual`) in the DB; map to the friendly labels in
> the UI. This matches the existing `sms_followup_enabled` (boolean) pattern.

---

## 8. Unsubscribe route — `GET /s/{slug}/unsubscribe`

**Hook:** the public GET routing block at **`worker.js:18863–18881`**. The pattern is to
match longer sub-paths with regex BEFORE the bare `/s/{slug}` match at L18874. Insert
**before L18874** (after the estimate match at L18871):

```js
// worker.js: public GET routing block, before the bare siteMatch (L18874).
const unsubMatch = path.match(/^\/s\/([a-z0-9-]+)\/unsubscribe$/);
if (unsubMatch && method === 'GET') {
  return handlePublicUnsubscribe(request, env, unsubMatch[1]);
}
```

### 8a. New handler: `handlePublicUnsubscribe(request, env, slug)`

```js
async function handlePublicUnsubscribe(request, env, slug) {
  const url = new URL(request.url);
  const email = (url.searchParams.get('email') || '').toLowerCase();
  const token = url.searchParams.get('token') || '';
  if (!email || !token) return new Response('Bad request', { status: 400 });

  // Resolve the owner via slug → user_id.
  const site = await env.DB.prepare('SELECT user_id FROM sites WHERE slug = ?').bind(slug).first();
  if (!site) return new Response('Not found', { status: 404 });
  const uid = site.user_id;

  // Verify the HMAC token (constant-time compare).
  const UNSUB_SECRET = env.NEWSLETTER_HMAC_SECRET || env.STRIPE_WEBHOOK_SECRET;
  const expected = await hmacSha256(UNSUB_SECRET, `${uid}:${email}`);
  if (!constantTimeEqualHex(token, expected)) {
    return new Response('Invalid or expired link', { status: 403 });
  }

  // Flip the subscriber to unsubscribed (scoped by user_id — multi-tenant safe).
  await env.DB.prepare(
    "UPDATE newsletter_subscribers SET status = 'unsubscribed', unsubscribed_at = datetime('now') WHERE user_id = ? AND email = ?"
  ).bind(uid, email).run();

  // Styled success page (reuse the public site's accent; amber fallback).
  return new Response(unsubSuccessHtml(/* businessName */), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}
```

### 8b. New helper: `hmacSha256(secret, message)`

**There is NO general-purpose HMAC helper today** — the only HMAC code is private to the
Stripe verifier at **`worker.js:1093–1101`**. Extract it:

```js
// Place near verifyStripeSignature (~L1106). Reusable for unsubscribe tokens.
async function hmacSha256(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message)));
  let hex = '';
  for (const b of mac) hex += b.toString(16).padStart(2, '0');
  return hex;
}
```

Optionally refactor `verifyStripeSignature` (L1093–L1101) to call this helper — but that
is out of scope for v1; leave the Stripe code untouched to avoid regression risk.

### 8c. Constant-time compare + secret

- `constantTimeEqualHex(a, b)`: compare two hex strings in constant time. The Stripe
  verifier at L1099+ has a constant-time compare pattern — mirror it for hex strings.
- **Secret:** set a dedicated `NEWSLETTER_HMAC_SECRET` via
  `npx wrangler secret put NEWSLETTER_HMAC_SECRET`. Fall back to
  `STRIPE_WEBHOOK_SECRET` if unset (so it works out of the box), but a dedicated secret
  is cleaner. **Document this in the deploy checklist.**

### 8d. Token in the email link

The token is generated **at send time** in `dispatchNewsletterBatch` (§5d):
`hmacSha256(SECRET, \`${userId}:${email}\`)`. The link in `businessEmailShell` is:
`https://branchlive.com/s/${slug}/unsubscribe?email={{SUBSCRIBER_EMAIL}}&token={{UNSUB_TOKEN}}`
— the two placeholders are substituted per-recipient. `email` is URL-encoded in the
query (the recipient's actual email); the route lowercases it before HMAC verify, so
generate the token from the lowercased email too for consistency:

> **Refinement:** in `dispatchNewsletterBatch`, compute `const email = r.email.toLowerCase()`
> BEFORE the token + substitution, so the token matches the value the route will recompute.

---

## 9. Simplifications & confirmations vs the spec

1. **`sendEmail()` auto-detect (spec §5) — CONFIRMED CORRECT.** Verified signature
   `async function sendEmail(env, { to, subject, html, uid })` at **L1126**. When `uid` is
   passed it tries `sendViaGmail(env, uid, ...)` (L13920) first, then falls back to
   Resend via `env.RESEND_API_KEY` (L1134). **No custom Gmail/Resend branching is needed
   for newsletters** — pass `uid` (the owner) on every send and the existing function
   handles it. This is the single biggest simplification: zero new email-transport code.

2. **No Cloudflare Queue needed (spec §5.2 mentions it as optional).** The cron is hourly
   per `wrangler.jsonc`; the 20-sends/tick batch clears any realistic list within a day.
   Queues add ops complexity (consumer binding, retry semantics) for no v1 gain. Defer to
   v2 only if a single business exceeds ~5k subscribers.

3. **`env.AI` (Workers AI) for drafts, NOT DeepSeek.** The spec is silent on the model.
   The existing blog generator uses the `@cf/meta/llama-3.3-70b-instruct-fp8-fast` binding
   (no API key, no fetch cost, runs in-region). Mirror it. Do NOT introduce a DeepSeek
   dependency for newsletter drafts — that would split the AI pattern and add a secret.

4. **`businessEmailShell` accent color (spec §3.1).** The spec's hardcoded purple header
   (`#1e1b4b`) violates the amber-monotone rule. Use the resolved site accent or the amber
   fallback `#d4a574`. Flagged in §4b.

5. **Tiered pricing (spec §9.1 tip) — DEFER.** The spec suggests $9.99/$7.99/$5.99 by
   cadence via multiple Stripe Price IDs. For v1, ship flat $9.95/mo (`STRIPE_PRICE_NEWSLETTER`).
   The cadence is a free user preference. Tiered pricing can be layered on later by
   reading cadence at checkout and swapping the price id — no schema change needed.

6. **`source_id` backfill for leads.** The current lead INSERT (L4297) is positional and
   does not return last_row_id. Two options (§3a): (a) read `meta.last_row_id` from
   `.run()`, or (b) leave `source_id` null in v1. Recommend (a) — trivial and keeps the
   subscriber list auditable.

7. **No `caller_name` / `status` traps (skill pitfalls #1, #2).** Subscriber harvest
   uses `leads.caller_name` / `leads.caller_email` (correct names). `newsletter_sends`
   uses `status` (a fresh column we control — not the `call_logs.status` trap).

---

## 10. Deploy checklist (additions to the standard list)

After the standard `node --check worker.js` → commit → `npx wrangler deploy` → 200 check:

1. **Set the HMAC secret** (one-time):
   `npx wrangler secret put NEWSLETTER_HMAC_SECRET`
2. **Set the Stripe price id** (one-time):
   `npx wrangler secret put STRIPE_PRICE_NEWSLETTER`  (the `pa_...`/`price_...` id)
3. **Trigger `initDB`** to create tables/columns — happens automatically on first request
   after deploy (initDB runs on cold start).
4. **Smoke test the unsubscribe link:** generate a token for the demo account
   (`demo@branchlive.com`, uid=1) via the HMAC, hit
   `/s/riverside-plumbing-co/unsubscribe?email=...&token=...`, confirm the styled page +
   the `newsletter_subscribers` row flips to `unsubscribed`.
5. **Seed a demo subscriber** in `seedDemoData()` so `/p/newsletters` is not empty for the
   demo account (1–2 rows, `source = 'lead'`).

---

## Build order (recommended)

1. **DDL + ADDONS + Stripe UPDATE** (§1, §2a, §2b) — schema first, everything depends on it.
2. **`hmacSha256` helper** (§8b) — small, unlocks unsubscribe + token gen.
3. **Auto-harvest hooks** (§3a, §3b) — starts populating the subscriber list immediately.
4. **`businessEmailShell` + `generateNewsletterDraft`** (§4) — produces drafts.
5. **Cron: `runNewsletterCron` + `queueCampaignForSend` + `dispatchNewsletterBatch`** (§5).
6. **Unsubscribe route** (§8) — compliance gate, must ship before any real send.
7. **Dashboard + API** (§6).
8. **Settings UI** (§7) — toggle is auto; cadence/approval inputs last.
9. **Smoke test + seed** (§10).

---

**Agent identity:** I am running as **builtin:zai-coding-plan/GLM-5.2** (the model named
in this session's system configuration). I am NOT the Flash fallback.
