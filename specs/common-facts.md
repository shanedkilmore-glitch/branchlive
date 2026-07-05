# Technical Specification: Common Facts / FAQ Feature

This specification describes the design, database integration, routing conventions, user flows, and code changes required to implement the **Common Facts / FAQ** feature for **Branch Live**.

---

## 1. Overview & Product Goal

Service businesses and professionals repeatedly face the same set of questions from callers:
* *"Do you work weekends?"*
* *"Are you licensed and insured?"*
* *"How long does a typical installation take?"*
* *"What is your cancellation policy?"*

Currently, the Branch Live knowledge base only supports service line items (Name, Price, Notes) mapped to the `knowledge` table. While helpful for quoting specific jobs, this structure is poorly suited for general business policies, credentials, or scheduling constraints.

The **Common Facts / FAQ** feature introduces a lightweight, dedicated CRUD page at `/p/faq` where business owners can curate reusable Q&A pairs. These facts are:
1. Categorized under five pre-defined tags: 'Hours & Availability', 'Pricing', 'Credentials', 'Process', and 'Policies'.
2. Prioritized using a drag-to-reorder grid interface.
3. Automatically compiled and injected into Emma's system prompt so she can answer these questions in real time on calls.
---


## 2. Database Schema & Migration

To keep the data model clean and separate service pricing items from general business Q&A, we introduce a new table called `common_facts`.

### 2.1 Table Schema (`common_facts`)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique identifier for each fact |
| `user_id` | `INTEGER` | `NOT NULL` | Foreign key referencing `users.id` |
| `category` | `TEXT` | `NOT NULL` | One of the 5 categories (e.g. 'Policies') |
| `question` | `TEXT` | `NOT NULL` | The question asked by callers |
| `answer` | `TEXT` | `NOT NULL` | The response Emma should give |
| `sort_order` | `INTEGER` | `DEFAULT 0` | Drag-and-drop sort ranking |
| `created_at` | `TEXT` | `DEFAULT CURRENT_TIMESTAMP` | ISO timestamp |
| `updated_at` | `TEXT` | `DEFAULT CURRENT_TIMESTAMP` | ISO timestamp |

### 2.2 Migration Implementation
The migration must be idempotent and run inside the `initDB()` function in [worker.js](file:///C:/Users/17173/Projects/branchlive/worker.js).

```js
    // Migration: Create common_facts table for FAQs
    // Separate from services/pricing to maintain structural clarity.
    try {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS common_facts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          category TEXT NOT NULL,
          question TEXT NOT NULL,
          answer TEXT NOT NULL,
          sort_order INTEGER DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `).run();
      
      // Index for fast lookups by user and ordering
      await env.DB.prepare(`
        CREATE INDEX IF NOT EXISTS idx_faq_user_sort 
        ON common_facts(user_id, sort_order)
      `).run();
    } catch (e) {
      console.error('Migration error for common_facts:', e);
    }
```

---

## 3. Route Definitions & API Endpoints

The dashboard pages and write endpoints utilize cookie authentication and are gated based on roles (Employees have view-only access, Managers+ can modify).

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| `GET` | `/p/faq` | `handleFaqHtmx()` | Renders the FAQ list and editor dashboard |
| `POST` | `/api/faq/add-htmx` | `handleFaqAddHtmx()` | Adds a new Q&A fact |
| `POST` | `/api/faq/update-htmx` | `handleFaqUpdateHtmx()` | Updates an existing Q&A fact |
| `POST` | `/api/faq/delete-htmx` | `handleFaqDeleteHtmx()` | Deletes a Q&A fact |
| `POST` | `/api/faq/reorder-htmx` | `handleFaqReorderHtmx()` | Saves the new drag-to-reorder list state |

---

## 4. UI Dashboard Page & Navigation Updates

### 4.1 Navigation Updates

We add the FAQ links in the sidebar and establish a sub-navigation layout on the Knowledge pages.

#### 1. Sidebar Nav
In [worker.js](file:///C:/Users/17173/Projects/branchlive/worker.js#L2837), we add `faq` to `NAV_ITEMS` and list it in `NAV_GROUPS` under the "Business" section:

```js
const NAV_ITEMS = {
  // ... existing items ...
  faq: { 
    key: 'faq', 
    href: '/p/faq', 
    label: 'FAQ', 
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>' 
  },
};

const NAV_GROUPS = [
  { name: 'Main',     keys: ['overview','calendar','knowledge','gallery'] },
  { name: 'Business', keys: ['leads','calls','faq','analytics'] }, // Added 'faq' here
  { name: 'Growth',   keys: ['website','blog','social','newsletter','outreach'] },
  { name: 'Account',  keys: ['billing','team','settings','help'] },
];
```

#### 2. Sub-Navigation Tabs (Shared Component)
We introduce a `knowledgeNav(active, kbCount, faqCount)` helper to render tabs bridging Services & Pricing (`/p/knowledge`) and Common Facts (`/p/faq`):

```js
function knowledgeNav(active, kbCount, faqCount) {
  return `<nav class="admin-subnav" style="margin-bottom:24px">
    <a class="${active === 'services' ? 'active' : ''}" href="/p/knowledge">Services & Pricing (${kbCount})</a>
    <a class="${active === 'faq' ? 'active' : ''}" href="/p/faq">Common Facts (${faqCount})</a>
  </nav>`;
}
```

This helper will be called in `handleKnowledgeHtmx()` and `handleFaqHtmx()`, updating `handleKnowledgeHtmx()`'s template:
```diff
- <span class="eyebrow">Knowledge base</span>
- <h1>What Emma <em>knows</em></h1>
+ <span class="eyebrow">Knowledge base</span>
+ <h1>What Emma <em>knows</em></h1>
+ ${knowledgeNav('services', items.length, faqCount)}
```

---

## 5. Drag-to-Reorder Implementation

To handle drag-to-reorder, we import **Sortable.js** via CDN and post sorting changes back to the server using standard fetch/HTMX patterns.

### 5.1 Sorting UI Markup & Script (Frontend)
Each FAQ item is rendered inside a draggable container (`id="faq-list"`) with a handle indicator.

```html
<!-- Drag-to-reorder list wrapper -->
<div id="faq-list" class="k-grid">
  <!-- Repeated FAQ Row Item -->
  <div class="k-item faq-item" data-id="${fact.id}">
    <div style="display:flex;align-items:center;gap:10px;width:100%">
      <span class="drag-handle" style="cursor:move;color:var(--text-faint);user-select:none">☰</span>
      <div style="flex:1">
        <span class="badge badge-new">${htmxEsc(fact.category)}</span>
        <div style="font-weight:500;margin-top:4px">${htmxEsc(fact.question)}</div>
        <div style="color:var(--text-muted);font-size:.88rem;margin-top:2px">${htmxEsc(fact.answer)}</div>
      </div>
      <div class="ki-actions">
        <button class="btn btn-ghost btn-sm" onclick="faqEdit(${fact.id})">✎ Edit</button>
        <button class="btn btn-ghost btn-sm" onclick="faqDelete(${fact.id})">🗑 Delete</button>
      </div>
    </div>
  </div>
</div>

<!-- Sortable.js Initialization -->
<script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>
<script>
  (function() {
    var el = document.getElementById('faq-list');
    if (!el) return;
    
    Sortable.create(el, {
      handle: '.drag-handle',
      animation: 150,
      ghostClass: 'sortable-ghost',
      onEnd: async function() {
        var items = el.querySelectorAll('.faq-item');
        var ids = Array.from(items).map(item => parseInt(item.getAttribute('data-id'), 10));
        
        try {
          var r = await fetch('/api/faq/reorder-htmx', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: ids })
          });
          var d = await r.json();
          if (!d.ok) alert('✗ Failed to save sorting order: ' + (d.error || 'Unknown error'));
        } catch(e) {
          alert('✗ Connection error during sorting sync.');
        }
      }
    });
  })();
</script>
```

### 5.2 Backend Reordering Handler (`worker.js`)
The server parses the array of IDs and updates `sort_order` using Cloudflare D1's atomic batch queries:

```js
async function handleFaqReorderHtmx(request, env, uid) {
  try {
    const body = await request.json();
    const ids = body.ids;
    if (!Array.isArray(ids)) return json({ ok: false, error: 'IDs array required' }, 400);

    const statements = ids.map((id, index) => 
      env.DB.prepare('UPDATE common_facts SET sort_order = ? WHERE id = ? AND user_id = ?')
        .bind(index, id, uid)
    );

    await env.DB.batch(statements);
    
    // Trigger background Emma provisioning to refresh prompt context
    return json({ ok: true });
  } catch (e) {
    console.error('FAQ reorder error:', e);
    return json({ ok: false, error: 'Could not reorder items' }, 500);
  }
}
```

---

## 6. Emma AI Answering Integration

Emma must have access to both Service Pricing entries (`knowledge` table) and general FAQs (`common_facts` table) during calls.

### 6.1 Compiling Prompt Context
We define a helper function `compileEmmaKnowledgeBase(env, uid)` to gather and structure this data:

```js
async function compileEmmaKnowledgeBase(env, uid) {
  const [kb, faq] = await Promise.all([
    env.DB.prepare('SELECT category, item, price, notes FROM knowledge WHERE user_id = ? ORDER BY category, item').bind(uid).all(),
    env.DB.prepare('SELECT category, question, answer FROM common_facts WHERE user_id = ? ORDER BY sort_order').bind(uid).all()
  ]);

  const kbRows = kb.results || [];
  const faqRows = faq.results || [];

  let contextText = '';

  // 1. Compile service & pricing items
  if (kbRows.length > 0) {
    contextText += 'SERVICE INVENTORY & PRICING:\n';
    kbRows.forEach(row => {
      const priceStr = row.price ? ` ($${Number(row.price).toFixed(2)})` : ' (pricing varies / quote needed)';
      const notesStr = row.notes ? ` - Details: ${row.notes}` : '';
      contextText += `- [Category: ${row.category || 'General'}] ${row.item}${priceStr}${notesStr}\n`;
    });
  }

  // 2. Compile common Q&As and business rules
  if (faqRows.length > 0) {
    if (contextText) contextText += '\n';
    contextText += 'COMMON FAQs & BUSINESS POLICIES:\n';
    faqRows.forEach(row => {
      contextText += `[Category: ${row.category}]\nQ: ${row.question}\nA: ${row.answer}\n\n`;
    });
  }

  return contextText.trim();
}
```

### 6.2 Prompt Insertion
We modify `emmaSystemPrompt` to incorporate this compiled dynamic text blocks:

```js
function emmaSystemPrompt(s, kbText) {
  const name = (s && s.business_name) || 'this business';
  const industry = (s && s.industry) || 'home services';
  const area = (s && s.service_area) || 'our service area';
  const desc = (s && s.service_description) || '';
  
  return `You are Emma, the AI receptionist for ${name}, a ${industry} company serving ${area}. Be warm, professional, and efficient. Book appointments, capture lead details (name, phone, email, job, urgency), and answer questions using the provided business context.

Always collect the caller's name, callback number, email address, what they need done, and how urgent it is before ending the call. If they don't want to share their email, that's fine — move on.

${desc ? `Business Overview: ${desc}\n` : ''}
${kbText ? `BUSINESS KNOWLEDGE & POLICIES:\n${kbText}` : 'No specific pricing or policy data has been loaded yet. Answer general questions politely or offer to take a message.'}`;
}
```

In `vapiProvision(env, settings)`, we fetch the data and inject it:
```js
  // Fetch compiled knowledge base text (pricing + general FAQs)
  const kbText = await compileEmmaKnowledgeBase(env, settings.user_id);
  
  // Set in assistant configuration
  const assistantBody = {
    name: 'Emma',
    firstMessage: emmaFirstMessage(settings),
    model: {
      provider: VAPI_DEFAULTS.modelProvider,
      model: VAPI_DEFAULTS.model,
      messages: [
        { role: 'system', content: emmaSystemPrompt(settings, kbText) },
      ],
    },
    voice: {
      provider: VAPI_DEFAULTS.voiceProvider,
      voiceId: VAPI_DEFAULTS.voiceId,
    },
    serverUrl: vapiServerUrl(env),
  };
```

### 6.3 Asynchronous Vapi Syncing
To prevent dashboard writes (adding/editing/deordering FAQs or Services) from lagging or timing out due to slow Vapi API updates, we run re-provisioning asynchronously via `ctx.waitUntil`:

```js
function queueEmmaAssistantSync(env, uid, ctx) {
  const syncTask = (async () => {
    try {
      const settings = await env.DB.prepare('SELECT * FROM settings WHERE user_id = ?').bind(uid).first();
      if (settings && settings.vapi_assistant_id) {
        await vapiProvision(env, settings);
        console.log(`Successfully updated Emma assistant in Vapi for user ${uid}`);
      }
    } catch (e) {
      console.error(`Error updating Emma assistant in Vapi for user ${uid}:`, e);
    }
  })();

  if (ctx && typeof ctx.waitUntil === 'function') {
    ctx.waitUntil(syncTask);
  }
}
```
All write endpoints for both `/api/knowledge/*` and `/api/faq/*` call `queueEmmaAssistantSync(env, uid, ctx)` right before returning `{ ok: true }`.

---

## 7. Actionable Backend Code Templates

Here are the new backend handler endpoints to be placed in `worker.js`.

### 7.1 `handleFaqHtmx`
```js
async function handleFaqHtmx(request, env, uid, ctx) {
  try {
    const viewOnly = ctx && ctx.role === 'employee';
    
    // Fetch FAQs and Knowledge Base Service count to render counts
    const [faqRes, kbCountRes] = await Promise.all([
      env.DB.prepare('SELECT * FROM common_facts WHERE user_id = ? ORDER BY sort_order').bind(uid).all(),
      env.DB.prepare('SELECT COUNT(*) AS count FROM knowledge WHERE user_id = ?').bind(uid).first()
    ]);
    
    const facts = faqRes.results || [];
    const kbCount = (kbCountRes && kbCountRes.count) || 0;
    
    // Render templates
    const categories = ['Hours & Availability', 'Pricing', 'Credentials', 'Process', 'Policies'];
    
    // Build list items
    const faqRowsHtml = facts.map(fact => {
      return `
        <div class="k-item faq-item" id="faq-row-${fact.id}" data-id="${fact.id}">
          <div style="display:flex;align-items:center;gap:12px;width:100%">
            ${viewOnly ? '' : '<span class="drag-handle" style="cursor:move;color:var(--text-faint);user-select:none;font-size:1.2rem">☰</span>'}
            <div style="flex:1">
              <span class="badge badge-new" style="background-color:var(--accent-amber);color:#000">${htmxEsc(fact.category)}</span>
              <div style="font-weight:600;margin-top:4px;color:var(--cream)">Q: ${htmxEsc(fact.question)}</div>
              <div style="color:var(--text-muted);font-size:.9rem;margin-top:2px">A: ${htmxEsc(fact.answer)}</div>
            </div>
            ${viewOnly ? '' : `
              <div class="ki-actions" style="display:flex;gap:6px">
                <button type="button" class="btn btn-ghost btn-sm" onclick="faqEdit(${fact.id})">✎ Edit</button>
                <button type="button" class="btn btn-ghost btn-sm" onclick="faqDelete(${fact.id})">🗑 Delete</button>
              </div>
            `}
          </div>
          <!-- Inline Edit Form -->
          <div id="faq-edit-form-${fact.id}" style="display:none;margin-top:14px;padding-top:14px;border-top:1px solid var(--border-soft)">
            <form onsubmit="faqSave(${fact.id}, e)">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
                <select name="category" required>
                  ${categories.map(c => `<option value="${c}" ${fact.category === c ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
                <input name="question" value="${htmxEsc(fact.question)}" placeholder="Question" required>
              </div>
              <textarea name="answer" placeholder="Answer" style="width:100%;min-height:80px;margin-bottom:10px" required>${htmxEsc(fact.answer)}</textarea>
              <div style="display:flex;gap:6px">
                <button type="submit" class="btn-amber btn-sm">Save</button>
                <button type="button" class="btn btn-ghost btn-sm" onclick="faqCancel(${fact.id})">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      `;
    }).join('');

    const body = `
      <div class="app">${sidebarNav('faq', undefined, ctx)}
        <div class="content">
          <span class="eyebrow">Knowledge base</span>
          <h1>Common Facts / FAQ</h1>
          <p class="sub">Curate reusable Q&A facts that Emma references alongside specific service pricing.</p>
          
          ${viewOnly ? '<div class="vo-banner"><span class="vo-ico">👁</span>View only — contact your admin to make changes.</div>' : ''}
          
          ${knowledgeNav('faq', kbCount, facts.length)}

          ${viewOnly ? '' : `
            <div style="margin-bottom:20px">
              <button class="btn btn-amber btn-sm" onclick="document.getElementById('faq-add-panel').style.display = document.getElementById('faq-add-panel').style.display === 'none' ? '' : 'none'">+ Add Common Fact</button>
            </div>
            
            <div id="faq-add-panel" class="card" style="display:none;margin-bottom:24px">
              <h3 style="margin-top:0">Add a Common Fact / FAQ</h3>
              <form id="faq-add-form" style="display:flex;flex-direction:column;gap:10px">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                  <select name="category" required>
                    <option value="" disabled selected>Select Category</option>
                    ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
                  </select>
                  <input name="question" placeholder="Question (e.g. Do you work weekends?)" required>
                </div>
                <textarea name="answer" placeholder="Answer Emma should give..." style="min-height:80px" required></textarea>
                <div>
                  <button type="submit" class="btn-amber btn-sm">Add Fact</button>
                </div>
              </form>
              <div id="faq-add-msg" style="margin-top:8px;font-size:.85rem"></div>
            </div>
          `}

          ${facts.length ? `
            <div id="faq-list" class="k-grid">
              ${faqRowsHtml}
            </div>
          ` : `
            <div class="empty-state">
              <div class="empty-icon">❓</div>
              <div class="empty-title">No common facts yet</div>
              <div class="empty-msg">Add policies, details about licensing, scheduling rules, or warranties here.</div>
            </div>
          `}
        </div>
      </div>
      
      <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>
      <script>
        // Sortable Setup
        (function() {
          var el = document.getElementById('faq-list');
          if (!el) return;
          Sortable.create(el, {
            handle: '.drag-handle',
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: async function() {
              var items = el.querySelectorAll('.faq-item');
              var ids = Array.from(items).map(item => parseInt(item.getAttribute('data-id'), 10));
              try {
                await fetch('/api/faq/reorder-htmx', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ ids: ids })
                });
              } catch(e) { console.error('Failed to sync reorder'); }
            }
          });
        })();

        // CRUD Helpers
        function faqEdit(id) {
          document.getElementById('faq-edit-form-' + id).style.display = '';
        }
        function faqCancel(id) {
          document.getElementById('faq-edit-form-' + id).style.display = 'none';
        }
        async function faqSave(id, e) {
          e.preventDefault();
          var form = e.target;
          var body = {
            id: id,
            category: form.category.value,
            question: form.question.value,
            answer: form.answer.value
          };
          try {
            var r = await fetch('/api/faq/update-htmx', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
            });
            var d = await r.json();
            if(d.ok) { location.reload(); }
            else { alert('Error: ' + d.error); }
          } catch(err) { alert('Connection error'); }
        }
        async function faqDelete(id) {
          if(!confirm('Delete this fact? This cannot be undone.')) return;
          try {
            var r = await fetch('/api/faq/delete-htmx', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: id })
            });
            var d = await r.json();
            if(d.ok) { document.getElementById('faq-row-' + id).remove(); }
            else { alert('Error: ' + d.error); }
          } catch(err) { alert('Connection error'); }
        }
        
        // Add Form
        var addForm = document.getElementById('faq-add-form');
        if(addForm) {
          addForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            var msg = document.getElementById('faq-add-msg');
            msg.style.color = 'var(--text-muted)';
            msg.textContent = 'Saving...';
            var body = {
              category: this.category.value,
              question: this.question.value,
              answer: this.answer.value
            };
            try {
              var r = await fetch('/api/faq/add-htmx', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
              });
              var d = await r.json();
              if(d.ok) {
                msg.style.color = 'var(--success)';
                msg.textContent = '✓ Fact added — reloading...';
                setTimeout(function(){ location.reload(); }, 600);
              } else {
                msg.style.color = 'var(--danger)';
                msg.textContent = '✗ ' + (d.error || 'Failed to add');
              }
            } catch(err) {
              msg.style.color = 'var(--danger)';
              msg.textContent = '✗ Connection error';
            }
          });
        }
      </script>
    `;
    return new Response(simpleShell('Common Facts / FAQ', body), { headers: { 'Content-Type': 'text/html' } });
  } catch (e) {
    console.error('FAQ page error:', e);
    return new Response(simpleShell('Error', '<h1>⚠️ Error</h1><p style="color:var(--danger)">Could not load FAQ page.</p>'), { headers: { 'Content-Type': 'text/html' }, status: 500 });
  }
}
```

### 7.2 `handleFaqAddHtmx`
```js
async function handleFaqAddHtmx(request, env, uid, ctx) {
  try {
    const body = await request.json();
    if (!body.category || !body.question || !body.answer) {
      return json({ ok: false, error: 'All fields (category, question, answer) are required' }, 400);
    }
    
    // Fetch current max sort order to append to the end of the list
    const maxOrderRow = await env.DB.prepare(
      'SELECT MAX(sort_order) AS max_order FROM common_facts WHERE user_id = ?'
    ).bind(uid).first();
    const nextOrder = ((maxOrderRow && maxOrderRow.max_order) || 0) + 1;

    await env.DB.prepare(`
      INSERT INTO common_facts (user_id, category, question, answer, sort_order) 
      VALUES (?, ?, ?, ?, ?)
    `).bind(uid, body.category, body.question, body.answer, nextOrder).run();

    // Trigger asynchronous sync to Vapi
    queueEmmaAssistantSync(env, uid, ctx);

    return json({ ok: true });
  } catch (e) {
    console.error('Add FAQ error:', e);
    return json({ ok: false, error: 'Could not add FAQ fact' }, 500);
  }
}
```

### 7.3 `handleFaqUpdateHtmx`
```js
async function handleFaqUpdateHtmx(request, env, uid, ctx) {
  try {
    const body = await request.json();
    const id = parseInt(body.id, 10);
    if (!id || !body.category || !body.question || !body.answer) {
      return json({ ok: false, error: 'Valid ID and all Q&A fields are required' }, 400);
    }

    const res = await env.DB.prepare(`
      UPDATE common_facts 
      SET category = ?, question = ?, answer = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).bind(body.category, body.question, body.answer, id, uid).run();

    if (!res.meta || res.meta.changes === 0) {
      return json({ ok: false, error: 'FAQ entry not found' }, 404);
    }

    // Trigger asynchronous sync to Vapi
    queueEmmaAssistantSync(env, uid, ctx);

    return json({ ok: true });
  } catch (e) {
    console.error('Update FAQ error:', e);
    return json({ ok: false, error: 'Could not update FAQ fact' }, 500);
  }
}
```

### 7.4 `handleFaqDeleteHtmx`
```js
async function handleFaqDeleteHtmx(request, env, uid, ctx) {
  try {
    const body = await request.json();
    const id = parseInt(body.id, 10);
    if (!id) return json({ ok: false, error: 'ID is required' }, 400);

    const res = await env.DB.prepare(
      'DELETE FROM common_facts WHERE id = ? AND user_id = ?'
    ).bind(id, uid).run();

    if (!res.meta || res.meta.changes === 0) {
      return json({ ok: false, error: 'FAQ entry not found' }, 404);
    }

    // Trigger asynchronous sync to Vapi
    queueEmmaAssistantSync(env, uid, ctx);

    return json({ ok: true });
  } catch (e) {
    console.error('Delete FAQ error:', e);
    return json({ ok: false, error: 'Could not delete FAQ fact' }, 500);
  }
}
```
