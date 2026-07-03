---
name: branchlive
description: Build and maintain the Branch Live AI receptionist platform — Cloudflare Worker, HTMX dashboard, amber-monotone design. Load this at the start of every Branch Live session.
---

# Branch Live Development

You are the coding engine for Branch Live. Hermes coordinates; you build.

## 🔴 START HERE — Load these BEFORE touching worker.js

**Every session, before you write a single line, read these files in order:**

1. `wiki/routes.md` — all routes, handlers, and where code lives
2. `wiki/tables.md` — full DB schema and column names
3. `wiki/patterns.md` — coding conventions and CRITICAL PITFALLS
4. `wiki/auth.md` — login, sessions, permissions (only if touching auth)

AGENTS.md at the project root has additional context. Load it too.

**These files exist to save you time.** worker.js is ~13.6K lines. The wiki files are ~200 lines total. Read the wiki first — it answers 80% of questions before you need to search the monolith.

## Quick Reference
- **Stack:** Cloudflare Worker + Pages + D1 (SQLite)
- **File:** `worker.js` (~13,600 lines) — all routes, handlers, DB, templates
- **Demo:** demo@branchlive.com / demo123, user_id=1, business "Riverside Services" (Home & Beauty)
- **Deploy worker:** `npx wrangler deploy`
- **Deploy pages:** `npx wrangler pages deploy . --project-name branchlive --branch main --commit-dirty`

## What's Live
- Landing: https://branchlive.com
- HTMX Dashboard: https://branchlive-portal.shane-f58.workers.dev/p/overview
- Worker API: https://branchlive-portal.shane-f58.workers.dev
- Demo site: https://branchlive-portal.shane-f58.workers.dev/s/riverside-plumbing-co
- Scout API: POST /api/scout (DEEPSEEK_API_KEY secret set)

## MANDATORY — Every deploy checklist:
1. `node --check worker.js` — must pass
2. `git add -A && git commit -m "descriptive message"` — always commit first
3. `npx wrangler deploy`
4. `curl -s -o /dev/null -w "%{http_code}" https://branchlive-portal.shane-f58.workers.dev/login-htmx` — must return 200
5. If 200: done. If NOT 200: worker is broken. Revert and fix. Never deploy more on top.

## Design — Amber-Monotone ONLY
```css
--bg-primary: #06060c; --bg-secondary: #0e0e18; --bg-tertiary: #1a1a2e;
--accent-primary: #d4a574;  /* amber — the ONLY accent */
--text-primary: #f1f5f9; --text-secondary: #94a3b8; --border: #252540;
```
Fonts: Fraunces (headings), Inter Tight (body), JetBrains Mono (numbers).
NO purple (#9b6dff, #8b5cf6). NO green/red/blue stat cards. Amber only.

## ⚠️ LANGUAGE RULE (HARD — 2026-07-01)
**NEVER use the word "contractor"** in code, copy, UI text, or variable names.
Use "business", "service business", "local business", or "professional" instead.
Demo business is "Riverside Services" — Home & Beauty industry. All seed data and
examples must span diverse industries: salons, nail techs, real estate, cleaning,
photography, hardscape. Gender-neutral. No blue-collar-only framing.

## 🚨 CRITICAL PITFALLS

### 1. Template literals inside template literals — ESCAPE CORRECTLY
worker.js renders HTML via template strings inside `simpleShell()` (line ~6635). Inside these template literals, `\` is an escape character consumed by the *outer* template literal before reaching the browser.

**WRONG** (broke Scout + debug tools on July 3, 2026):
```
/^\/p\//   // outer template literal eats the \ → browser receives /^/p// → SyntaxError
'won\'t'   // outer template literal eats the \ → browser receives 'won't' → SyntaxError
```

**RIGHT:**
- For regex: double-escape → `/^\\/p\\//`
- For apostrophes: use Unicode escapes → `won\u2019t` (preferred) or double-escape
- **Best practice: rephrase to avoid contractions entirely** (today's → current, what's → what is, couldn't → could not). This is immune to escaping bugs.

**One syntax error anywhere in the big `<script>` block kills ALL subsequent scripts in that block.** The debug tools IIFE, Scout IIFE, and business switcher all share one `<script>` tag. A crash in any one of them kills the others.

### 2. Backticks in template literals WILL crash the worker (error 1101)
A stray backtick terminates the HTML template string mid-flight. The engine parses the rest as JS expressions → ReferenceError → error 1101 on ALL authed pages.
Fix: Use double-quotes or escaped backticks.

### 3. `<script>` in innerHTML never executes
Browsers do not run `<script>` tags inserted via innerHTML. Add init calls to the existing setTimeout block instead.

### 4. call_logs column traps
- call_logs has NO `caller_name` column — use `caller_phone` only
- call_logs has NO `status` column — use `duration_sec > 0` for "answered"
- leads uses `caller_name` (not customer_name)

### 5. SQLite reserved words
- `WHEN` is reserved — don't alias columns as "when", use "ts" instead

### 6. Cloudflare CDN caches aggressively
After deploy, users may see old versions. Bust with `?cb=<timestamp>` or add no-cache rules.

### 7. Deploy order: Worker before Pages
Worker contains DB migrations. Deploy it first. Then Pages.

## Seed Data Pattern
seedDemoData() truncates and re-inserts all demo data for uid=1. To force re-seed, increment SEED_VERSION at the top of initDB(). New seed data goes inside seedDemoData(). The pattern:
- SEED_VERSION = 2 (current); increment to force reseed
- seedDemoData() clears leads, call_logs, knowledge, appointments, settings for uid=1, then re-inserts everything
- Runs on every deploy where seed_version < SEED_VERSION

## Scout AI Assistant (July 2026)
- Scout is a collapsible AI panel injected by a JS IIFE at the end of simpleShell()
- POST /api/scout accepts {question, page}, returns {answer}
- Backend: DeepSeek Chat via DEEPSEEK_API_KEY secret (set via `npx wrangler secret put`)
- Scout's JS lives inside the same big `<script>` block as debug tools — see Pitfall #1

## Debug Tools (Inspect / Annotate)
- Self-injecting FABs in bottom-right corner, gated on `.sidebar` presence
- Lazily loads html2canvas for screenshot capture
- Also lives in the shared `<script>` block — see Pitfall #1

## Roles & Permissions
- `resolveContext()` → `{bid, role, uid}`. Never touch uid directly.
- Roles: admin(3) > manager(2) > employee(1)
- Platform admin = uid===1 (untouched by roles). Business admin = role on user_roles.
- Switcher: `bl_business_id` cookie selects active business

## Route patterns
- Public: `/s/{slug}`, `/blog`, `/login-htmx`, `/signup`
- Dashboard: `/p/overview`, `/p/leads`, `/p/calendar`, etc. (cookie auth via bl_session)
- API: `/api/*` (cookie or Bearer token depending on endpoint)
- Admin: `/p/admin/*` (uid === 1 only)
- Settings: `/settings-htmx` (NOT /p/settings)
- All /p/* handlers receive `(request, env, uid, ctx)` — uid = pCtx.bid (owner-scoped)

## Database patterns
- Idempotent migrations: `ALTER TABLE ... ADD COLUMN` wrapped in try/catch
- Query: `await env.DB.prepare('SELECT ...').bind(uid).first()`
- Insert with conflict: `INSERT ... ON CONFLICT(column) DO NOTHING`

## Task rules
- Hermes gives you tasks in chat as copyable blocks
- Write response to `zcode_response.txt` in the project root
- Never auto-advance — wait for Hermes after every task
- Never fix things outside the task scope without flagging them first
- **Always read wiki files before exploring worker.js**
