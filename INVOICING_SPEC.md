# Branch Live — Invoicing & Pipeline Specification

This document provides a COMPLETE, buildable specification for implementing the professional "Leads -> Estimates -> Invoices" pipeline feature in Branch Live's `worker.js`. 

## 1. Data Model
All DDL statements must be added to the `initDB(env)` function (~line 1489) using idempotent `CREATE TABLE IF NOT EXISTS` wrapped in `try/catch` blocks. 

### A. `invoices` Table
```sql
CREATE TABLE IF NOT EXISTS invoices (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL,              -- FK -> users.id (tenant)
    lead_id         INTEGER,                       -- FK -> leads.id (the source lead)
    estimate_id     INTEGER,                       -- FK -> estimates.id (if converted)
    invoice_number  TEXT NOT NULL,                 -- Auto-sequenced (e.g. INV-00001)
    items           TEXT NOT NULL,                 -- JSON array: { desc, qty, rate }
    subtotal        REAL NOT NULL DEFAULT 0,
    tax             REAL DEFAULT 0,
    discount        REAL DEFAULT 0,
    deposit         REAL DEFAULT 0,
    total           REAL NOT NULL DEFAULT 0,
    amount_paid     REAL DEFAULT 0,
    status          TEXT NOT NULL DEFAULT 'draft', -- draft|sent|partial|paid|overdue|void
    issue_date      TEXT,                          -- YYYY-MM-DD
    due_date        TEXT,                          -- YYYY-MM-DD
    terms           TEXT DEFAULT 'net15',          -- net15|net30|due_on_receipt
    notes           TEXT,                          
    stripe_payment_link TEXT,                      
    paid_at         TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_invoices_user ON invoices(user_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_lead ON invoices(lead_id);
```

### B. `activity_log` Table
Provides the history/audit trail for the pipeline.
```sql
CREATE TABLE IF NOT EXISTS activity_log (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL,              
    lead_id         INTEGER,                       -- Centralized client grouping
    entity_type     TEXT NOT NULL,                 -- 'lead' | 'estimate' | 'invoice'
    entity_id       INTEGER NOT NULL,              
    action          TEXT NOT NULL,                 -- 'created'|'status_change'|'sent'|'paid'|'converted'
    detail          TEXT,                          -- Human-readable detail
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_lead ON activity_log(lead_id, created_at DESC);
```

### C. Pipeline Stage Representation Strategy
**Recommendation:** Derived View.
Do **not** add an explicit `pipeline_stage` field to the `leads` table. Instead, derive the stage dynamically based on the lead's state and its linked estimates/invoices (e.g., if an invoice exists and is `paid`, the stage is "Paid"; if an estimate exists and is `sent`, the stage is "Estimate Sent").
**Justification:** A single source of truth prevents synchronization bugs. If a Stripe webhook updates an invoice to `paid`, we don't have to simultaneously remember to update the lead's pipeline stage. The pipeline UI simply computes the highest progressed state.

## 2. Pipeline / Kanban Board (`/p/pipeline`)
**Columns:** New Lead -> Consultation -> Estimate Sent -> Approved -> Invoiced -> Paid (and Lost).
**Card Derivation:**
- Group all `leads` for the user.
- Left-join the most recent/relevant estimate and invoice for each lead.
- **Card Content:** Caller Name, Title/Service, Age of card (days since creation), Value (Total $ if estimate/invoice exists), Next Action button (e.g., "Create Estimate", "Send Invoice").
**Advancement:** Implement simple status-advance buttons first (e.g., "Mark Contacted", "Convert to Estimate"). Drag-and-drop support is deferred to Phase 2 to ensure stability and compatibility with HTMX.

## 3. Estimate -> Invoice Conversion
When a user clicks "Convert to Invoice" on an approved estimate:
**Endpoint:** `POST /api/estimates/:id/convert`
1. Fetch the estimate.
2. Generate the next `invoice_number` for this `user_id` (e.g., query `MAX(CAST(REPLACE(invoice_number, 'INV-', '') AS INTEGER))` and increment).
3. Insert into `invoices`, copying `lead_id`, `estimate_id`, `items`, totals, and carrying over any `deposit` as already paid (or deducted from balance).
4. Do NOT delete the estimate. Keep it for historical integrity. Update `estimates.status` to `invoiced` if desired, or simply leave it as `approved`.
5. Insert a record into `activity_log`: "Converted estimate to Invoice INV-XXXXX".

## 4. Invoices Module (`/p/invoices`)
Mirror the patterns from `/p/estimates` (`handleEstimatesHtmx` ~line 6729):
- **List View:** `handleInvoicesHtmx`. Show Metrics (Draft, Sent, Overdue, Paid) and a table of invoices.
- **Create/Edit:** HTMX modal for creating an invoice manually (picking a lead, building JSON items matching the estimates pattern). Ensure server-side total calculation.
- **Actions:** 
  - Send SMS link (`/api/invoices/:id/send`)
  - Mark Paid manually
- **Stripe Connect Integration:** Reuse the Stripe flow. When creating a Stripe payment link, use the `invoices` ID in metadata instead of the estimate ID. Update the webhook handler (`checkout.session.completed` ~line 5246) to mark invoices as paid when the metadata points to an invoice.
- **Overdue Detection:** Simple comparison of `due_date` against `date('now')` in queries to label overdue items.

## 5. Lead / Client Record Rollup
Update the Lead Detail view (likely in `/p/leads` or a new client page):
- Display the standard lead information.
- Provide lists of all `estimates` and `invoices` where `lead_id = lead.id`.
- Show a chronologically ordered `activity_log` feed mapping the entire relationship from first call to final payment.

## 6. Fix Misleading Text
**Target:** `worker.js` ~line 6776
**Current text:** "Send a quote via text. The customer taps Approve, it converts to an invoice, and Stripe handles payment — no paper."
**Action:** Change this to accurately reflect the new reality: "Send a quote via text. When approved, convert it to an official invoice to collect payment."

## 7. Routes, Nav, and Role Gating
- **Dispatcher/Routes (~line 10900+):**
  Add standard routing blocks for:
  - `GET /p/invoices` -> `handleInvoicesHtmx`
  - `GET /p/pipeline` -> `handlePipelineHtmx`
  - `POST /api/invoices`
  - `POST /api/estimates/:id/convert`
- **Nav (`NAV_GROUPS` ~line 2743):**
  Add `invoices` and `pipeline` to the main navigation array. Group them logically with `estimates`.
- **Role Gating (`ROUTE_MIN_ROLE`):**
  - Read access to `/p/invoices` and `/p/pipeline` for `employee` level (`VIEW_ONLY_FOR_EMPLOYEE` applies).
  - Write access (`POST` routes) restricted to `manager` or `admin`. Role context is resolved via `resolveContext` (~line 2982, reading `ctx.bid` / `ctx.role`).

## Implementation Phases
**Phase 1 (Core):**
1. Add `invoices` and `activity_log` DDL to `initDB`.
2. Build `/p/invoices` CRUD, exact invoice numbering, and conversion logic.
3. Update Stripe webhook (`checkout.session.completed`) to handle invoice payments.
4. Fix misleading estimate copy (~line 6776).

**Phase 2 (Pipeline & Aggregation):**
1. Build `/p/pipeline` Kanban board.
2. Build Lead detail rollup (client record with history timeline).
3. Introduce drag-and-drop interactions.

---
**Model Execution Context:** 
Running as: Gemini 3.1 Pro (High)
