# Branch Live — Common Facts / FAQ Feature Specification

This specification outlines the exact implementation steps for adding the "Common Facts / FAQ" feature to the Branch Live app, ensuring tight scope and identical patterns to the existing codebase.

## 1. Database Schema (`initDB`)

Extend the `initDB` function (around line 1489 in `worker.js`) to include the new idempotent table creation for `common_facts`.

**Action:** Add the following to the `env.DB.batch([ ... ])` array inside `initDB`:

```sql
env.DB.prepare(`CREATE TABLE IF NOT EXISTS common_facts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id INTEGER,
  category TEXT,
  question TEXT,
  answer TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT
)`),
```

*Note:* `business_id` mirrors the multi-tenant `ctx.bid` pattern (equivalent to `user_id` on owning accounts).

## 2. API Endpoints (CRUD)

Create new handler functions for FAQ operations, mirroring the `handleKnowledge*` HTMX endpoints (e.g., `handleKnowledgeAddHtmx`). Place these near the knowledge endpoints (around line 3513).

**New Functions:**
*   `handleFaqAddHtmx(request, env, uid)`: Insert into `common_facts` using `business_id = uid`. Use `nowISO()` for `created_at`.
*   `handleFaqUpdateHtmx(request, env, uid)`: Update `category`, `question`, `answer` where `id = ? AND business_id = ?`.
*   `handleFaqDeleteHtmx(request, env, uid)`: Delete where `id = ? AND business_id = ?`.

**Router Additions (in `handleRequest` around line 17238 under cookie auth):**
```javascript
if (path === '/api/faq/add-htmx' && method === 'POST') return handleFaqAddHtmx(request, env, kCtx.bid);
if (path === '/api/faq/update-htmx' && method === 'POST') return handleFaqUpdateHtmx(request, env, kCtx.bid);
if (path === '/api/faq/delete-htmx' && method === 'POST') return handleFaqDeleteHtmx(request, env, kCtx.bid);
```

## 3. Page Route & UI (`/p/faq`)

Create the page handler `handleFaqHtmx(request, env, uid, ctx)` mirroring `handleKnowledgeHtmx` (around line 10262). 
*   **Query:** `SELECT * FROM common_facts WHERE business_id = ? ORDER BY sort_order, created_at`
*   **UI:** Use the same `simpleShell` + HTML template literal approach with HTMX. 
*   **Categories:** Hardcode or group by the 5 fixed categories: *Hours, Pricing, Credentials, Process, Policies*.
*   **Template Hazards:** Always use `htmxEsc()` for user-generated strings. Avoid unescaped `${}` interpolations of raw data.
*   **View-Only:** Mirror the `viewOnly = ctx && ctx.role === 'employee'` pattern to disable edits for employees.

**Dispatcher Addition (around line 17064):**
```javascript
if (path === '/p/faq') return handleFaqHtmx(request, env, pCtx.bid, pCtx);
```

## 4. Role Gating & Navigation

**Role Gating (`ROUTE_MIN_ROLE` & `VIEW_ONLY_FOR_EMPLOYEE`, around line 2934):**
```javascript
// Add to ROUTE_MIN_ROLE:
'/p/faq': 'employee',

// Add to VIEW_ONLY_FOR_EMPLOYEE:
// (Updates the Set to include '/p/faq')
const VIEW_ONLY_FOR_EMPLOYEE = new Set([
  '/p/calendar', '/p/knowledge', '/p/gallery', '/p/faq'
]);
```

**Sidebar Navigation:**
Extend `sidebarNav` (or the equivalent HTML helper) to include a link to `/p/faq`, appearing next to the Knowledge Base link.

## 5. Emma / Vapi Integration

Currently, Emma's prompt is generated via `emmaSystemPrompt(s)` (around line 12636) and provisioned in `vapiProvision(env, settings)` (around line 12707).

To fold both `knowledge` and `common_facts` directly into Emma's system prompt (so she actually answers from them without needing a parallel system):

**Action 1:** Modify `vapiProvision` to query the database before assembling the prompt.
```javascript
// Inside vapiProvision(env, settings), near line 12717:
const uid = settings.user_id;
const kbRows = await env.DB.prepare('SELECT category, item, price, notes FROM knowledge WHERE user_id = ?').bind(uid).all();
const faqRows = await env.DB.prepare('SELECT category, question, answer FROM common_facts WHERE business_id = ?').bind(uid).all();

// Format into text strings...
```

**Action 2:** Extend `emmaSystemPrompt` to accept the compiled knowledge text.
```javascript
function emmaSystemPrompt(s, compiledKnowledge = '') {
  // ... existing logic ...
  return `You are Emma, the AI receptionist... 
  
${compiledKnowledge ? `--- KNOWLEDGE & FAQ ---\n${compiledKnowledge}\n----------------------` : ''}

Always collect the caller's name...`;
}
```

*Note:* Update `vapiProvision` to pass the compiled string: `emmaSystemPrompt(settings, compiledText)`. This ensures facts are reliably folded into the system prompt when Vapi is (re)provisioned.
