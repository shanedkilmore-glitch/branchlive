# AGENTS.md — Branch Live Shared Context

> Read by Cursor, Hermes, ZCode, and any other AI agents.
> **Start here**, then load relevant wiki/*.md files for details.
> Update when architecture, conventions, or deployment changes.

## Quick Reference
- **Wiki:** `wiki/routes.md` `wiki/tables.md` `wiki/auth.md` `wiki/patterns.md`
- **File:** `worker.js` (~12K lines) — all routes, handlers, DB, templates
- **Deploy:** `./deploy.sh "what changed"` — deploys worker (+ pages if HTML changed) AND commits atomically.

## 🔴 NON-NEGOTIABLE: DEPLOY = COMMIT. NEVER `git reset --hard` / `git checkout -- worker.js`
Deployed-but-uncommitted work gets silently wiped by the next reset/checkout. This has
destroyed the 7 video embeds, Scout sparkle, and caret fixes MULTIPLE times, forcing
full re-do. Rules for EVERY agent (ZCode, Antigravity, Cursor, Hermes):
1. **Always deploy via `./deploy.sh "msg"`** — it commits for you. Do not call bare `npx wrangler deploy` and walk away.
2. **NEVER `git reset --hard` or `git checkout -- worker.js`** to fix a bad edit. Use `git diff` + a surgical Python replace to revert only the broken part.
3. If you must revert a file: `git stash` first, so uncommitted deployed work is recoverable.
4. Video embed IDs (unlisted, unrecoverable from the channel) live in the Hermes `branchlive` skill → `references/video-embeds-manifest.md`.

## Project
- **Product:** AI receptionist (Emma) for service businesses — answers phones 24/7
- **Stack:** Cloudflare Worker + Pages + D1 (SQLite)
- **Demo:** demo@branchlive.com / demo123, user_id=1
- **Secrets:** STRIPE_SECRET_KEY, RESEND_API_KEY, GOOGLE_PLACES_API_KEY (via `npx wrangler secret put`)

## What's Live
- Landing: https://branchlive.com
- HTMX Dashboard: https://branchlive-portal.shane-f58.workers.dev/p/overview
- Worker API: https://branchlive-portal.shane-f58.workers.dev
- Demo site: https://branchlive-portal.shane-f58.workers.dev/s/riverside-plumbing-co

## Roles & Permissions (multi-user)
- **Tables:** `user_roles` (user_id, business_id, role, invited_by) + `team_invites` (token, business_id, email, role, status).
- **`business_id` = owning account's `user_id`.** A team member sees the owner's data. Handlers query by the resolved `ctx.bid`, not the logged-in uid.
- **Roles:** `admin` (3) > `manager` (2) > `employee` (1). `ROLE_LEVEL` / `roleMeets()` / `resolveContext()` in worker.js.
- **Two separate "admin" concepts — do NOT conflate:**
  - *Platform admin* = `uid === 1` → `requireAdmin(uid)` → `/p/admin/*` console. **Untouched by roles.**
  - *Business admin* = role on `user_roles` → manages their team at `/p/team`.
- **Owners are auto-seeded** as admin of their own business in `initDB` (idempotent backfill), so legacy accounts + demo are never locked out.
- **`/p/*` gate:** the dispatcher resolves `pCtx = resolveContext()` and bounces to `/p/overview` when the role is below `ROUTE_MIN_ROLE[path]`. Employees are view-only on calendar/knowledge/gallery (`.vo-banner`).
- **Switcher:** `bl_business_id` cookie selects the active business; `resolveContext` honors it. `userBusinesses()` lists memberships.
- **Team API:** `/api/team/{invite,role,remove,revoke,switch}` — admin-only except `switch`.

## Wiki Files (load these per task)
| File | When to load |
|------|-------------|
| `wiki/routes.md` | Every session — know where code lives |
| `wiki/tables.md` | When writing DB queries or migrations |
| `wiki/auth.md` | When touching login, sessions, or permissions |
| `wiki/patterns.md` | Before writing code — avoid common pitfalls |

## ⚠️ LANGUAGE RULE (2026-07-01)
**NEVER use the word "contractor"** in code, copy, UI text, or variable names.
Use "business," "service business," "local business," or "professional" instead.

## OpenWiki Docs (auto-generated, load for deeper context)
| File | When to load |
|------|-------------|
| `openwiki/quickstart.md` | Architecture overview |
| `openwiki/api-routes.md` | All endpoints + handlers |
| `openwiki/data-models/schema.md` | Full DB schema |
| `openwiki/auth/flow.md` | Auth flow |
| `openwiki/auth/roles.md` | RBAC system |
| `openwiki/features/emma.md` | Emma AI voice |
| `openwiki/features/calendar.md` | Calendar/booking |
| `openwiki/features/social.md` | Social auto-posting |
| `openwiki/features/outreach.md` | Outreach pipeline |
| `openwiki/integrations/stripe.md` | Stripe billing |
