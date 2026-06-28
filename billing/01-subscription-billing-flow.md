# Branch Live — Subscription Billing Flow

> **Payment Processor:** Stripe  
> **Base Price:** $29.95/month  
> **Upsells:** Web Add-on $10/mo | GBP Integration $15/mo | Email Add-on $20/mo  
> **Trial Period:** 30 days (free, no card required to start)

---

## Overview: Lifecycle States

```
                 ┌──────────────────────────────────────────────────┐
                 │                                                  │
    SIGNUP  ──►  TRIAL (14d)  ──►  ACTIVE (paid)  ──►  RENEWAL    │
                   │                    │                  │         │
                   │ (expires)          │ (cancel)         │ (fail)  │
                   ▼                    ▼                  ▼         │
                EXPIRED             CANCELED          PAST_DUE      │
                                                         │          │
                                                    (3-stage        │
                                                     dunning)       │
                                                         │          │
                                                    ┌────┴────┐     │
                                                    │         │     │
                                                RECOVERED  SUSPENDED│
                                                    │         │     │
                                                    └────┬────┘     │
                                                         │          │
                                                    (cancel)        │
                                                         │          │
                                                      CANCELED      │
                                                         │          │
                                                    (reactivate)    │
                                                         │          │
                                                      ACTIVE ───────┘
```

---

## Phase 1: Signup

### 1.1 Signup Flow
1. **Landing Page → "Start Free Trial"**
   - User enters: Business name, phone number, email, password
   - No credit card required upfront (reduces friction, increases conversion)

2. **Email Verification**
   - Send verification email via Stripe Customer Portal or SendGrid
   - Account is created in `pending_verification` state
   - User cannot access dashboard until verified

3. **Onboarding**
   - After verification, redirect to onboarding wizard
   - Configure: business hours, greeting message, call forwarding number
   - Upsell prompts shown during onboarding (Web, GBP, Email)
   - Trial begins immediately

### 1.2 Stripe Objects Created
| Object | When | Notes |
|--------|------|-------|
| `Customer` | At signup | Store `branchlive_account_id` in metadata |
| `Subscription` | At trial conversion | `trial_end` = signup_date + 30 days |
| `PaymentMethod` | When card added | Card can be added during trial or at conversion |
| `SetupIntent` | When card added | For future off-session payments |

### 1.3 Trial State
- **Duration:** 14 calendar days
- **Features:** Full access to all features (including upsells)
- **Limits:** Soft cap on call minutes (e.g., 500 min during trial) to prevent abuse
- **Upsells during trial:** Available immediately, billed at trial conversion
- **Notifications:**
  - Day 7: "Your trial is half over" email
  - Day 12: "2 days left — add payment method" email
  - Day 14: "Trial ending today" email

---

## Phase 2: Trial → Paid Conversion

### 2.1 Conversion Trigger
Trial converts to paid when:
- Trial period ends AND a valid payment method is on file
- OR user manually clicks "Upgrade to Paid" before trial ends

### 2.2 Conversion Process
```
1. Stripe webhook: checkout.session.completed / invoice.payment_succeeded
2. Update account status: TRIAL → ACTIVE
3. Set next_billing_date = now + 30 days
4. Generate first invoice (PDF)
5. Send "Welcome to Branch Live — Paid" email with invoice
6. Enable full production features (remove trial call cap)
```

### 2.3 If No Payment Method at Trial End
- Account status: `TRIAL_EXPIRED`
- Service is paused (calls stop routing)
- Data is retained for 30 days
- Banner on dashboard: "Add payment method to activate"
- Email sent: "Your trial ended — activate now"

---

## Phase 3: Active (Paid) Subscription

### 3.1 Monthly Billing Cycle
- **Billing date:** 30 days from activation, same day each month
- **Proration:** When adding upsells mid-cycle, prorate to next billing date
- **Invoice generation:** 1 hour before charge attempt
- **Charge attempt:** On billing date at 00:00 UTC
- **Receipt:** Sent immediately on successful payment

### 3.2 Price Breakdown
| Item | Frequency | Price |
|------|-----------|-------|
| Branch Live Core | Monthly | $29.95 |
| Web Add-on | Monthly | $10.00 |
| GBP Integration | Monthly | $15.00 |
| Email Add-on | Monthly | $20.00 |
| **Max Bundle** | Monthly | **$74.95** |

### 3.3 Mid-Cycle Changes
- **Upgrade (add upsell):** Immediate activation, prorated charge for remaining days
- **Downgrade (remove upsell):** Takes effect at next billing date (no refund for current period)
- **Plan switch:** Not applicable (single base plan + modular upsells)

---

## Phase 4: Renewal

### 4.1 Renewal Process
1. 3 days before: "Upcoming renewal" email (informational, no action needed)
2. Day of renewal (00:00 UTC): Stripe attempts charge
3. On success: `invoice.paid` webhook → update `next_billing_date += 30 days`
4. On failure: Enter dunning sequence (see `03-payment-failure-handling.md`)

### 4.2 Renewal Invoice
- Auto-generated by Stripe
- Includes: period covered, line items, total, payment method last-4
- PDF stored and accessible from Branch Live dashboard
- Emailed as attached PDF + dashboard link

### 4.3 Annual Billing (Future)
- **Planned:** Annual plan at $299.50/year (2 months free = ~17% discount)
- **Implementation:** Separate Stripe Price object, customer can switch via portal

---

## Phase 5: Cancellation

### 5.1 Cancellation Flow (see `05-cancellation-flow.md` for full detail)
1. Customer initiates cancel via dashboard or support
2. Offboarding survey (optional): reason for canceling
3. Confirmation screen with effective date
4. Final invoice generated (if any outstanding prorated charges)
5. Service ends at period end (no immediate termination — customer keeps access until paid-through date)
6. Data retained for 90 days; account can be reactivated within that window

### 5.2 Reactivation
- Within 90 days of cancellation: restore subscription with same settings
- After 90 days: new account required (data purged per privacy policy)

---

## Stripe Webhook Events (to implement)

| Event | Action |
|-------|--------|
| `customer.subscription.created` | Log, set trial dates |
| `customer.subscription.updated` | Sync status, handle upgrades/downgrades |
| `customer.subscription.deleted` | Mark account CANCELED, schedule data retention |
| `invoice.payment_succeeded` | Mark ACTIVE, update next billing, send receipt |
| `invoice.payment_failed` | Enter dunning sequence |
| `invoice.upcoming` | Send renewal reminder (3 days before) |
| `payment_method.attached` | Link to customer account |
| `customer.created` | Sync with Branch Live account |

---

## Database Schema (Additions to branchlive.db)

```sql
-- Subscription state
ALTER TABLE accounts ADD COLUMN subscription_status TEXT DEFAULT 'trial';
  -- Values: trial, trialing, active, past_due, canceled, trial_expired, suspended

ALTER TABLE accounts ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE accounts ADD COLUMN stripe_subscription_id TEXT;
ALTER TABLE accounts ADD COLUMN trial_start_date TEXT;
ALTER TABLE accounts ADD COLUMN trial_end_date TEXT;
ALTER TABLE accounts ADD COLUMN current_period_start TEXT;
ALTER TABLE accounts ADD COLUMN current_period_end TEXT;
ALTER TABLE accounts ADD COLUMN billing_email TEXT;
ALTER TABLE accounts ADD COLUMN payment_method_last4 TEXT;
ALTER TABLE accounts ADD COLUMN payment_method_brand TEXT;
ALTER TABLE accounts ADD COLUMN dunning_stage INTEGER DEFAULT 0;
  -- 0: not in dunning, 1-3: dunning stage, 4: suspended

ALTER TABLE accounts ADD COLUMN cancel_at_period_end BOOLEAN DEFAULT 0;
ALTER TABLE accounts ADD COLUMN canceled_at TEXT;
ALTER TABLE accounts ADD COLUMN reactivatable_until TEXT;

-- Upsell tracking
CREATE TABLE IF NOT EXISTS subscription_addons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    addon_type TEXT NOT NULL,  -- 'web', 'gbp', 'email'
    stripe_price_id TEXT,
    added_at TEXT NOT NULL,
    removed_at TEXT,
    FOREIGN KEY (account_id) REFERENCES accounts(id)
);
```

---

## Edge Cases & Rules

1. **Trial abuse:** One trial per email + payment method combination. Enforced via Stripe Radar rules.
2. **Chargeback:** Immediate suspension. Manual review required. Account flagged.
3. **Expired card before renewal:** Stripe's automatic card updater handles most cases. If updater fails, dunning sequence begins.
4. **Multiple failed renewals:** See `03-payment-failure-handling.md`.
5. **Concurrent subscription:** One active subscription per customer. Enforced at Stripe level.
6. **Tax handling:** Stripe Tax for automatic sales tax calculation (US sales tax by state).
