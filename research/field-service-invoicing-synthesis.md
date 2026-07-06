# Field-Service Invoicing & Pipeline Research Synthesis
> Informed by Jobber, Housecall Pro, ServiceTitan, FreshBooks
> Target: Branch Live AI receptionist (salons, spas, real estate, photographers, cleaning — NOT plumbing/contractors)

---

## 1. THE PIPELINE — Job Stages from Lead → Payment

### Housecall Pro's 3-Board Model (the gold standard for Branch Live)

Housecall Pro uses **three separate Kanban boards** accessible from a single "Pipeline" nav tab:

#### A. Leads Board (6 columns)
| Stage | Description | Trigger |
|-------|-------------|---------|
| **New Lead** | Lead created, unassigned or assigned | Inbound call / intake form |
| **First Contact** | Made initial contact, working toward estimate | Manual drag or status dropdown |
| **Second Contact** | Contacted twice, continuing follow-up | Manual move |
| **Third Contact** | Three outreach attempts | Manual move |
| **Won** | Converted to estimate or job | Estimate/job created from lead |
| **Lost** | Didn't convert | Manual move or auto after N days at Third Contact |

Automations (configurable time delays):
- First Contact → auto-SMS after N days → Second Contact
- Second Contact → auto-SMS + email after N days → Third Contact
- Third Contact → auto-archive to Lost after N days
- Won → auto-archive after N days
- Lost → auto-archive after N days

#### B. Estimates Board (9 columns)
| Stage | Description | Trigger |
|-------|-------------|---------|
| **Unscheduled** | Estimate created, no date set, not sent | Created |
| **Scheduled** | Estimate has a scheduled date, not yet "On My Way" | Date assigned |
| **In Progress** | Marked "On My Way" but not finished | Tech en route |
| **Completed** | Marked "Finished" but not yet sent | Work visit done |
| **Created on Job** | Linked to a job, not yet sent to customer | Job-linked estimate |
| **Sent** | Sent to customer, no options approved yet | Email/SMS sent |
| **On Hold** | Follow-up paused, waiting for customer response | Manual pause |
| **Approved** | ≥1 option approved within last 7 days, not yet copied to job | Customer approval |
| **Rejected** | All options rejected within last 7 days | All declined |

Automations:
- Sent → auto-resent after N days → "First Follow-Up"
- First Follow-Up → resent after N days → "Second Follow-Up"
- Second Follow-Up → resent after N days → "Third Follow-Up"
- Third Follow-Up → auto-decline after N days
- Approved → auto-archive after N days
- Rejected → auto-archive after N days

#### C. Jobs Board (6 columns — this is where Invoices live)
| Stage | Description | Trigger |
|-------|-------------|---------|
| **Unscheduled** | Job created, no date, not sent/approved | Estimate approved → job created |
| **Scheduled** | Date set, not yet "On My Way" | Date assigned |
| **In Progress** | "On My Way" / "Started" | Tech dispatched |
| **Completed** | Finished, no invoice sent yet | Work complete |
| **Invoice Sent** | Invoice sent, not fully paid | Invoice emailed/SMS'd |
| **Invoice Paid** | Fully paid within last 7 days | Payment received |

Automations:
- Completed + $0 total → auto-archive
- Unscheduled → auto-SMS after N days → "First Attempt"
- Invoice Paid → auto-archive after N days

### ServiceTitan Job Lifecycle (contractor-focused, simpler model for us)
```
Booking → Unscheduled → Dispatched → In Progress → Completed → Invoiced → Paid
```
- **Booking:** Lead with time/date/scope locked
- **Unscheduled:** Work agreed but no date assigned
- **Dispatched:** Tech assigned + en route
- **In Progress:** Work being performed
- **Completed:** Work done, tech closes job
- **Invoiced:** Invoice generated and sent
- **Paid:** Payment collected

### Jobber's Model (no visual Kanban — status-driven lists)
Jobber doesn't have a visual pipeline board like Housecall Pro. Instead, it uses **document statuses** across Quotes, Jobs, and Invoices with list views + search.

### RECOMMENDED PIPELINE FOR BRANCH LIVE

Since Branch Live serves **salons/spas/real estate/photographers/cleaning** (not contractors with "dispatched techs"), we should streamline. The key insight: these businesses don't dispatch technicians. The "work performed" stage is typically a single appointment.

**Recommended Unified 1-Board View (combines Leads + Estimates + Invoices in one pipeline):**

```
LEAD          →  CONSULTATION  →  ESTIMATE SENT  →  APPROVED  →  INVOICED  →  PAID
(new)           (scheduled)      (pending)          (won)        (pending)    (closed)
```

| Stage | What it means | Card shows | Trigger |
|-------|---------------|-----------|---------|
| **New Lead** | Inbound call/SMS/web form, not yet contacted | Caller name, phone, timestamp, notes | Call received / form submitted |
| **Consultation Scheduled** | Site visit / phone consult booked | Appointment date/time, lead info | Appointment created from lead |
| **Estimate Draft** | Estimate being built, not yet sent | Estimate #, total, line items count | User creates estimate |
| **Estimate Sent** | Estimate emailed/SMS'd to client | Sent date, viewed status, link | Email/SMS sent |
| **Approved** | Client accepted estimate, deposit paid (or not) | Approval timestamp, deposit amount | Client approves + pays deposit if applicable |
| **Invoiced** | Invoice generated and sent post-work | Invoice #, total, due date, payment status | Invoice created + sent |
| **Paid** | Full payment received | Payment date, amount, method | Payment collected |
| **Lost / Archived** | Didn't convert (exit column) | Reason | Manual move or auto after N days |

**Transition triggers:**
- New Lead → Consultation: User creates appointment linked to lead
- Consultation → Estimate Draft: User clicks "Create Estimate" from lead
- Estimate Draft → Estimate Sent: User sends estimate (email/SMS)
- Estimate Sent → Approved: Client approves estimate (click link) or user marks approved
- Approved → Invoiced: User clicks "Convert to Invoice" (copies line items)
- Invoiced → Paid: Stripe payment received or user marks as paid

**Why one board instead of three for Branch Live:**
- Branch Live's users are small service businesses (not multi-crew contractors)
- Leads, estimates, and invoices are sequential — rarely in parallel
- A single board shows the full client journey at a glance
- Each card is a lead, and the card moves through the pipeline with nested estimate/invoice objects

---

## 2. THE INVOICE DATA MODEL

### FreshBooks API Invoice Object (canonical reference — 30+ fields)

From the FreshBooks v2 API, here are every field a production invoice needs:

#### Required on Creation
| Field | Type | Notes |
|-------|------|-------|
| `customerid` | integer | FK to client/lead record |
| `create_date` | date | YYYY-MM-DD — issue date of invoice |

#### Writable Data Fields
| Field | Type | Notes |
|-------|------|-------|
| `invoice_number` | string | Auto-sequenced if omitted. Format: `"0000007"` — zero-padded, increments from last. User can override. |
| `customerid` | integer | FK to client |
| `create_date` | date | Issue date |
| `generation_date` | date | When invoice was generated/renewed (recurring) |
| `discount_value` | string | e.g. `"5"` for 5%, `"10.00"` for flat |
| `discount_description` | string | e.g. "Early payment discount" |
| `po_number` | string | Purchase order / reference number |
| `template` | string | PDF template name |
| `currency_code` | string | ISO 4217, e.g. "USD" |
| `language` | string | e.g. "en" |
| `terms` | string | Free-text payment terms, e.g. "Net 30" |
| `notes` | text | Internal/private notes |
| `address` | string | Billing address (combined) |
| `street` / `street2` / `city` / `province` / `code` / `country` | string | Address breakdown |
| `organization` | string | Client business name |
| `fname` / `lname` | string | Client first/last name |
| `vat_name` / `vat_number` | string | VAT/tax ID |
| `deposit_amount` | decimal | Flat deposit amount |
| `deposit_percentage` | decimal | Deposit as % of total |
| `due_offset_days` | integer | Days after issue date for due date (0 = due immediately) |
| `lines` | array | Array of line item objects (see below) |
| `presentation` | string | How invoice renders |

#### Computed / Read-Only Fields
| Field | Type | Notes |
|-------|------|-------|
| `invoiceid` / `id` | integer | PK |
| `accounting_systemid` / `accountid` | string | Tenant IDs |
| `amount` | `{amount, code}` | Total invoice amount |
| `paid` | `{amount, code}` | Amount paid so far |
| `outstanding` | `{amount, code}` | Remaining balance |
| `discount_total` | `{amount, code}` | Computed discount in currency |
| `net_paid_amount` | `{amount, code}` | Net after fees |
| `created_at` | datetime | |
| `updated` | datetime | Last modified |
| `date_paid` | datetime | When fully paid |
| `current_organization` | string | Owner's org name |
| `display_status` | string | Human-readable status |
| `v3_status` | string | Machine-readable status |
| `payment_status` | string | "unpaid", "partial", "paid" |
| `deposit_status` | string | "none", "partial", "paid" |
| `autobill_status` | string | Auto-bill state |
| `dispute_status` | string | If disputed |
| `last_order_status` | string | Related order status |
| `uuid` | string | UUID for the invoice |

#### Invoice Line Items (`lines` array)
| Field | Type | Notes |
|-------|------|-------|
| `lineid` | integer | PK (computed) |
| `type` | integer | 0 = manual line, 1 = rebilled expense |
| `name` | string | Item/service name |
| `description` | text | Line-level description |
| `qty` | decimal | Quantity |
| `unit_cost` | `{amount, code}` | Unit price |
| `amount` | `{amount, code}` | Computed: qty × unit_cost |
| `taxName1` / `taxAmount1` | string/decimal | First tax line |
| `taxName2` / `taxAmount2` | string/decimal | Second tax line |
| `expenseid` | integer | FK if type=1 |
| `modern_project_id` | integer | Project FK |

### Invoice Status Lifecycle

#### Numeric Statuses (FreshBooks)
| Code | Status | Description |
|------|--------|-------------|
| 0 | Disputed | Client disputed (Classic only) |
| 1 | Draft | Created, not yet sent |
| 2 | Sent | Sent or marked as sent |
| 3 | Viewed | Viewed by client |
| 4 | Paid | Fully paid |
| 5 | Auto Paid | Paid automatically via saved card |
| 6 | Retry | Autobill failed once, will retry |
| 7 | Failed | Autobill failed after retry |
| 8 | Partial | Partially paid |

#### v3 Statuses (descriptive — better for UI)
| v3_status | Meaning |
|-----------|---------|
| `draft` | Created, not sent |
| `sent` | Delivered to client |
| `viewed` | Client opened invoice link |
| `partial` | Some payment received |
| `paid` | Fully paid |
| `overdue` | Past due date, unpaid |
| `disputed` | Client disputes |
| `deposit-partial` | Deposit partially paid |
| `deposit-paid` | Deposit fully paid |
| `declined` | Related order declined |
| `pending` | Related order pending |

#### Jobber Invoice Statuses (simpler — better for small businesses)
| Status | Meaning | Triggers |
|--------|---------|----------|
| **Draft** | Being edited, not sent | Created |
| **Awaiting Payment** | Sent, due date not passed | Sent to client |
| **Past Due** | Sent, due date passed, unpaid | Due date passes |
| **Paid** | Fully paid | Payment received |
| **Bad Debt** | Deemed uncollectible | Manual mark (removes from lists) |

### Invoice Number Sequencing

All platforms follow the same pattern:
- **Auto-increment, zero-padded.** FreshBooks: `"0000007"` → `"0000008"`. Jobber: `INV-0001`, `INV-0002`.
- **Configurable prefix.** Common: `INV-{YYYY}-{NNNN}`, `{BUSINESS_INITIALS}-{NNNNN}`.
- **Never reuse numbers.** Even voided invoices keep their number.
- **Protection against collisions.** FreshBooks returns 409 if concurrent creates collide on auto-number.

### RECOMMENDED INVOICE SCHEMA FOR BRANCH LIVE

```sql
CREATE TABLE IF NOT EXISTS invoices (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL,              -- business owner
    lead_id         INTEGER,                       -- FK → leads.id (the source lead)
    estimate_id     INTEGER,                       -- FK → estimates.id (if converted from estimate)
    customer_name   TEXT NOT NULL,                 -- denormalized for quick display
    customer_phone  TEXT,
    customer_email  TEXT,
    
    -- Numbering
    invoice_number  TEXT NOT NULL UNIQUE,           -- format: "INV-00001" (auto-sequenced)
    
    -- Dates
    issue_date      TEXT NOT NULL,                 -- YYYY-MM-DD
    due_date        TEXT NOT NULL,                 -- YYYY-MM-DD (issue_date + terms_days)
    terms           TEXT DEFAULT 'Net 15',         -- display text
    terms_days      INTEGER DEFAULT 15,            -- computed offset
    
    -- Financials
    subtotal        REAL NOT NULL DEFAULT 0,       -- sum of line totals
    discount_type   TEXT,                           -- 'percentage' or 'fixed'
    discount_value  REAL DEFAULT 0,
    discount_amount REAL DEFAULT 0,                -- computed
    tax_rate        REAL DEFAULT 0,                -- percentage (e.g., 8.875)
    tax_amount      REAL DEFAULT 0,                -- computed
    total           REAL NOT NULL DEFAULT 0,       -- subtotal - discount + tax
    
    -- Deposit (carried from estimate)
    deposit_amount  REAL DEFAULT 0,                -- deposit required
    deposit_paid    REAL DEFAULT 0,                -- deposit already paid (from estimate)
    
    -- Payments
    amount_paid     REAL DEFAULT 0,                -- sum of all payments received
    balance_due     REAL DEFAULT 0,                -- total - amount_paid (computed)
    
    -- Status
    status          TEXT NOT NULL DEFAULT 'draft',  -- draft|sent|viewed|partial|paid|overdue|void
    payment_status  TEXT NOT NULL DEFAULT 'unpaid', -- unpaid|partial|paid
    
    -- Stripe
    stripe_payment_link TEXT,                      -- payment link URL
    stripe_payment_intent_id TEXT,                 -- if using Payment Intents
    
    -- Metadata
    notes           TEXT,                          -- internal notes
    client_notes    TEXT,                          -- notes visible to client on invoice
    
    -- Timestamps
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    viewed_at       TEXT,                          -- when client first opened link
    paid_at         TEXT,                          -- when fully paid
    sent_at         TEXT,                          -- when emailed/SMS'd
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (lead_id) REFERENCES leads(id),
    FOREIGN KEY (estimate_id) REFERENCES estimates(id)
);

CREATE INDEX idx_invoices_user ON invoices(user_id, status);
CREATE INDEX idx_invoices_lead ON invoices(lead_id);
CREATE INDEX idx_invoices_estimate ON invoices(estimate_id);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_due ON invoices(user_id, due_date, status);

-- Line Items Table (normalized — better than JSON for querying)
CREATE TABLE IF NOT EXISTS invoice_items (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id      INTEGER NOT NULL,
    name            TEXT NOT NULL,                 -- item/service name
    description     TEXT,                          -- optional detail
    qty             REAL NOT NULL DEFAULT 1,
    unit_price      REAL NOT NULL DEFAULT 0,
    total           REAL NOT NULL DEFAULT 0,       -- qty * unit_price
    sort_order      INTEGER DEFAULT 0,            -- display order
    
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
```

### RECOMMENDED ESTIMATE SCHEMA UPGRADE

The existing `estimates` table stores items as JSON. This works but limits querying. For the estimate→invoice conversion, add these fields:

```sql
-- Add to existing estimates table:
ALTER TABLE estimates ADD COLUMN estimate_number TEXT UNIQUE;        -- "EST-00001"
ALTER TABLE estimates ADD COLUMN subtotal REAL DEFAULT 0;
ALTER TABLE estimates ADD COLUMN discount_type TEXT;                -- 'percentage' | 'fixed'
ALTER TABLE estimates ADD COLUMN discount_value REAL DEFAULT 0;
ALTER TABLE estimates ADD COLUMN discount_amount REAL DEFAULT 0;
ALTER TABLE estimates ADD COLUMN tax_rate REAL DEFAULT 0;
ALTER TABLE estimates ADD COLUMN tax_amount REAL DEFAULT 0;
ALTER TABLE estimates ADD COLUMN deposit_required REAL DEFAULT 0;   -- flat or computed
ALTER TABLE estimates ADD COLUMN invoice_id INTEGER;                -- FK → invoices.id (set when converted)
ALTER TABLE estimates ADD COLUMN valid_until TEXT;                  -- estimate expiry date
ALTER TABLE estimates ADD COLUMN sent_at TEXT;
ALTER TABLE estimates ADD COLUMN approved_at TEXT;
ALTER TABLE estimates ADD COLUMN viewed_at TEXT;
ALTER TABLE estimates ADD COLUMN terms TEXT DEFAULT 'Net 15';
ALTER TABLE estimates ADD COLUMN notes TEXT;
```

**Estimate status lifecycle (expanded):**
```
draft → sent → viewed → approved → invoiced
                  ↘ declined (terminal)
```

---

## 3. ESTIMATE → INVOICE CONVERSION

### How the Pros Handle It

**FreshBooks:** 
- Creating an invoice with `estimateid` in the POST body links them
- The API does NOT auto-copy line items, customerid, etc. — the caller must supply them
- When the invoice is created, estimate status goes to `accepted`. When invoice is `sent`, estimate status goes to `invoiced`.
- The estimate keeps its own number and identity — it's not deleted/replaced

**Housecall Pro:**
- "Copy to Job" button on approved estimates — copies all line items to a job
- The job then generates the invoice from its line items
- Estimates and jobs maintain a bidirectional link

**Jobber:**
- Quote (estimate) → "Convert to Job" → Job → "Generate Invoice"
- Line items flow: Quote items → Job line items → Invoice line items
- Each conversion preserves the link backward

**ServiceTitan:**
- Estimate marked "Sold" → sold items added to job invoice
- If "schedule later" is selected on sold estimate, items are held until job is created
- Estimate stays in system as a record of the original agreement

### RECOMMENDED CONVERSION FLOW FOR BRANCH LIVE

```
User clicks "Convert to Invoice" on approved estimate
    ↓
1. Create new invoice record with:
   - estimate_id = estimate.id (permanent link)
   - lead_id = estimate.lead_id
   - customer_name/phone/email copied from lead
   - line items COPIED (not moved) from estimate items
   - subtotal, tax, discount COPIED from estimate
   - deposit_amount = estimate.deposit_required
   - deposit_paid = any payments already collected on estimate
   - terms = estimate.terms
   
2. Generate invoice_number (next in sequence: INV-00001, INV-00002, ...)

3. Update estimate:
   - estimate.invoice_id = new_invoice.id
   - estimate.status = 'invoiced'
   
4. Record in audit trail:
   - "Estimate EST-00042 approved → converted to Invoice INV-00058"

5. Invoice starts in 'draft' status
   - User can edit before sending
   - User clicks "Send" to email/SMS the invoice to client
   - Status changes to 'sent'
```

**Key design decisions:**
- **Copy, don't move.** Estimates remain as a historical record. The invoice is a new independent document.
- **Bidirectional FK.** `estimates.invoice_id` + `invoices.estimate_id` — can navigate both ways.
- **Deposit handling.** If estimate had a deposit requirement and client paid it (via Stripe link), that amount flows to `invoices.deposit_paid` and reduces the `balance_due`.
- **Line items are normalized** (separate `invoice_items` table) for queryability, but the estimate keeps JSON items for backward compatibility.

---

## 4. HISTORY / AUDIT TRAIL

### What Pro Tools Log

**FreshBooks:** `audit_logs` include (via API) — includes view/send/payment history. The API has `include=audit_logs` to fetch.

**Jobber:** "Client Billing History" page shows a chronological timeline of:
- Every invoice (with status, amount, date)
- Every payment (with amount, method, date)
- Every deposit
- Credits applied
- Outstanding balance

**Housecall Pro:** Pipeline card popovers show "View and Edit Notes" with timestamps. Activity is tracked on each job/estimate/lead timeline.

**ServiceTitan:** Full audit trail on every job — who created, who modified, when estimates were presented, sold, when invoice was generated, payment posted.

### What Should Be Logged

Create an `activity_log` table:

```sql
CREATE TABLE IF NOT EXISTS activity_log (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL,              -- business owner
    entity_type     TEXT NOT NULL,                 -- 'lead' | 'estimate' | 'invoice' | 'payment'
    entity_id       INTEGER NOT NULL,              -- PK of the entity
    action          TEXT NOT NULL,                 -- 'created'|'updated'|'sent'|'viewed'|'approved'|'declined'|'paid'|'voided'|'converted'|'noted'
    description     TEXT,                          -- human-readable summary
    metadata        TEXT,                          -- JSON blob for structured data (old_status, new_status, amount, etc.)
    performed_by    TEXT,                          -- 'user' | 'system' | 'client' | 'emma'
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_activity_user ON activity_log(user_id, created_at DESC);
CREATE INDEX idx_activity_entity ON activity_log(entity_type, entity_id, created_at DESC);
```

**Events to log per entity:**

| Entity | Events |
|--------|--------|
| **Lead** | created, contacted, appointment_scheduled, converted_to_estimate, closed, reopened, noted |
| **Estimate** | created, sent, viewed (by client), approved, declined, converted_to_invoice, noted |
| **Invoice** | created, sent, viewed (by client), payment_received (partial), paid (full), overdue, voided, noted |
| **Payment** | received, refunded, failed |

**Display:**
- **Per-entity timeline:** Show on estimate/invoice detail page — chronological feed
- **Per-client rollup:** Client's "Billing History" page shows all invoices, estimates, payments for that lead/client
- **Dashboard widget:** "Recent Activity" feed (last 10 events across all entities)

---

## 5. ATTACHMENT TO CLIENT / LEAD

### Industry Pattern

All four platforms use a **Customer/Client** record as the central hub:
- **Lead** → converts to → **Customer** (or remains a linked lead)
- **Estimates** → belong to customer, optionally linked to a lead
- **Invoices** → belong to customer, linked to original lead and/or estimate
- **Payments** → belong to invoice, rolled up to customer balance

For Branch Live, the `leads` table IS the client record (since each caller becomes a lead). The link chain is:

```
leads.id
  ├── estimates.lead_id → FK
  │     └── estimates.invoice_id → FK (after conversion)
  ├── invoices.lead_id → FK (direct link)
  │     └── invoices.estimate_id → FK (backlink)
  └── appointments.lead_id → (future)
```

**What a Client/Lead detail page should show:**
1. Lead info (name, phone, email, source, created date)
2. Call history (linked call_logs)
3. Appointments (linked appointments)
4. Estimates (all estimates for this lead, with status badges)
5. Invoices (all invoices for this lead, with status badges)
6. Total billed / outstanding balance
7. Activity timeline (all events for this lead + its estimates + its invoices)
8. Quick actions: "Create Estimate", "Create Invoice", "Schedule Appointment"

---

## 6. UX PATTERNS THAT MAKE THESE TOOLS FEEL PROFESSIONAL

### What Users Love (from reviews and feature pages)

1. **Single dashboard overview.** Open the app → see: new leads count, outstanding invoices total, upcoming appointments. One glance answers "how's business today?"

2. **Visual pipeline with drag-and-drop.** Housecall Pro's Pipeline is their #1 differentiator. Cards move left-to-right. Status dropdown on each card. Color-coded columns. Satisfying UX.

3. **Instant invoice generation.** Click "Convert to Invoice" from an approved estimate → invoice is built with one click. All line items, tax, discount, deposit pre-filled. No re-typing.

4. **Payment links embedded in invoices.** Client clicks "Pay Now" → Stripe checkout → payment recorded automatically. Status updates from `sent` → `paid` without manual intervention.

5. **Client Hub / Portal.** Client receives a link → sees their estimate/invoice with a professional branded page. Can approve, decline, pay, comment. This is FreshBooks' and Jobber's key UX pattern.

6. **Automated follow-ups.** "If estimate not viewed in 3 days, auto-resent." "If invoice overdue 7 days, send reminder." Housecall Pro's Pipeline Automations are the benchmark — configurable time delays + customizable message templates with variables like `{{customer_first_name}}`.

7. **Mobile-first.** All four platforms emphasize mobile apps for technicians in the field. For Branch Live (admin dashboard), this means responsive design — the owner checks their pipeline from their phone between appointments.

8. **Smart status badges.** Color-coded pills: green = paid, yellow = sent/pending, red = overdue/declined. Instant visual scanning.

9. **Search + filter everywhere.** Search by customer name, invoice number, phone number. Filter by status, date range, amount. Housecall Pro has a sidebar filter panel that persists between visits.

10. **Bulk actions.** Select multiple invoices → batch send, batch mark as paid. Jobber's "Batch Deliver Invoices" feature.

11. **Invoice numbering that feels real.** `INV-00042`, not auto-generated UUIDs. Sequential, zero-padded, prefixed. Makes the business owner feel like a real company.

12. **Client billing history.** One page per client showing every estimate, invoice, payment, and outstanding balance. This is Jobber's "Client Billing History."

---

## PRIORITIZED MUST-HAVE FEATURE LIST

### Phase 1 — Foundation (ship this first)
| # | Feature | Why |
|---|---------|-----|
| 1 | **Invoice table + line items** (schema above) | The core data structure. Without this, nothing else works. |
| 2 | **Invoice numbering** (`INV-00001` pattern, auto-sequenced, unique per business) | Professional feel. Non-negotiable. |
| 3 | **Estimate → Invoice conversion** (one-click copy) | The bridge between existing estimates module and new invoices. |
| 4 | **Invoice status lifecycle** (draft → sent → viewed → partial → paid → overdue → void) | Every invoice needs a state machine. |
| 5 | **"Paid estimate" is no longer called an invoice** | Fix the current misleading UX. Estimates have their own status lifecycle. |
| 6 | **Invoice detail view with Stripe payment link** | Client can pay from the invoice. |

### Phase 2 — Pipeline & History
| # | Feature | Why |
|---|---------|-----|
| 7 | **Unified Kanban pipeline board** (Lead → Consultation → Estimate → Invoice → Paid) | The visual centerpiece. Housecall Pro's Pipeline is transformative. |
| 8 | **Activity log / audit trail** (table + timeline UI) | Every status change, send, view, payment recorded. |
| 9 | **Client billing history page** (per lead: all estimates, invoices, payments, balance) | The "one page for everything this client owes." |
| 10 | **Drag-and-drop pipeline cards** with status dropdown | Makes moving jobs through stages satisfying. |

### Phase 3 — Polish & Automation
| # | Feature | Why |
|---|---------|-----|
| 11 | **Automated follow-ups** (email/SMS reminders at configurable intervals) | Housecall Pro's Pipeline Automations. Reduces manual chasing. |
| 12 | **Invoice viewed tracking** (when client opens link, log + show in UI) | Gives owner visibility — "they've seen it but haven't paid." |
| 13 | **Bulk actions** (batch send invoices, batch mark paid) | Efficiency for multi-client days. |
| 14 | **Dashboard metrics widget** (outstanding total, overdue count, pipeline value) | Quick pulse check. |
| 15 | **PDF invoice generation** (downloadable, branded) | For clients who need a file for their records. |

---

## KEY DESIGN DECISIONS SUMMARY

1. **One unified pipeline board** (not separate Leads/Estimates/Jobs boards like Housecall Pro). Branch Live users are small, appointment-based businesses. The full journey fits in one view.

2. **Estimates and Invoices are separate documents** with bidirectional FK links. Estimates are quotes; invoices are bills. A "paid estimate" is not an invoice — it's an approved estimate with a deposit.

3. **Line items as a normalized table** (`invoice_items`) rather than JSON blob. Enables proper subtotal/tax/discount computation and future reporting.

4. **Invoice numbers are sequential, prefixed, per-business.** `INV-00001`, `INV-00002`. Auto-generated on creation. Never reused. No UUIDs in the number field.

5. **The lead IS the client record.** No separate "customers" table. The `leads` table is the canonical client with `status` tracking where they are in the pipeline.

6. **Activity log is universal** — one `activity_log` table serves leads, estimates, invoices, and payments. Displayed as a chronological feed per entity and per client.

7. **Stripe handles payments** (already integrated). Invoice gets a `stripe_payment_link` just like estimates. Payment webhooks update `amount_paid` and `status`.

8. **Deposits flow from estimate to invoice.** If client paid a deposit on the estimate, `invoice.deposit_paid` = that amount, reducing `balance_due`.
