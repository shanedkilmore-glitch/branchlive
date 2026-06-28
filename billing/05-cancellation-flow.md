# Branch Live — Cancellation Flow

> **Policy:** Cancel anytime. Service continues through the end of the paid period. No refunds for partial months. Data retained for 90 days after cancellation.

---

## Cancellation Methods

### Method 1: Self-Serve Dashboard (Primary)

```
CUSTOMER JOURNEY:

Dashboard → Settings → Billing → "Cancel Subscription"
    │
    ├─► Step 1: Cancellation Reason (optional survey)
    │      □ Too expensive
    │      □ Not getting enough calls
    │      □ Switching to competitor
    │      □ Business closed / seasonal
    │      □ Missing features (free text)
    │      □ Other (free text)
    │      [Skip] [Continue]
    │
    ├─► Step 2: Win-Back Offer (conditional)
    │      If reason = "Too expensive":
    │        ┌──────────────────────────────────────┐
    │        │ Before you go...                     │
    │        │                                      │
    │        │ Switch to our Seasonal Pause plan:   │
    │        │ • $5/month to keep your number       │
    │        │ • No call routing (reactivate when   │
    │        │   you're ready)                      │
    │        │ • All settings preserved             │
    │        │                                      │
    │        │ [Switch to Pause Plan] [Continue     │
    │        │  Cancel]                              │
    │        └──────────────────────────────────────┘
    │
    │      If reason = "Missing features":
    │        Show roadmap + "Request a feature" form
    │
    │      If reason = "Not enough calls":
    │        Offer free onboarding call with success team
    │
    ├─► Step 3: Confirmation Screen
    │      ┌──────────────────────────────────────┐
    │      │ Cancel your subscription?            │
    │      │                                      │
    │      │ You'll lose access to:               │
    │      │ ✗ AI call answering on {date}         │
    │      │ ✗ Web chat widget                    │
    │      │ ✗ GBP messaging                      │
    │      │                                      │
    │      │ What you keep:                       │
    │      │ ✓ Service until {end_date}            │
    │      │ ✓ Call history & recordings          │
    │      │ ✓ 90 days to reactivate              │
    │      │                                      │
    │      │ [Keep My Subscription]  [Confirm     │
    │      │  Cancellation]                        │
    │      └──────────────────────────────────────┘
    │
    └─► Step 4: Confirmed
          ┌──────────────────────────────────────┐
          │ ✓ Subscription Canceled              │
          │                                      │
          │ Your service will end on {end_date}. │
          │ A final invoice has been sent to     │
          │ {email}.                             │
          │                                      │
          │ We're sorry to see you go! If you    │
          │ change your mind before {end_date},  │
          │ you can reactivate instantly.        │
          │                                      │
          │ [Reactivate] [Back to Dashboard]    │
          └──────────────────────────────────────┘
```

### Method 2: Email Support (Secondary)
- Customer emails `support@branchlive.ai` requesting cancellation
- Support agent processes cancellation within 1 business day
- Confirmation email sent when processed
- Agent should attempt win-back (see Win-Back section)

### Method 3: Phone (Tertiary)
- Customer calls support line
- Agent verifies identity (account PIN or last-4 of card)
- Processes cancellation during call
- Confirmation email sent

---

## What Happens on Cancellation

### Immediate Effects
1. Account field `cancel_at_period_end = true` in branchlive.db
2. Stripe subscription set to `cancel_at_period_end`
3. Confirmation email sent (see template below)
4. Dashboard shows "Canceled — service ends {date}" banner

### At Period End
1. Stripe fires `customer.subscription.deleted` webhook
2. Account status changes: `ACTIVE` → `CANCELED`
3. Final invoice generated (if any outstanding charges)
4. Service stops:
   - Call forwarding disabled
   - Phone number released (unless on Pause Plan)
   - Web chat widget deactivated
   - GBP integration disconnected
5. Data retention timer starts: 90 days

### During Retention Period (90 days)
- Customer can log in and see past invoices/recordings
- "Reactivate" button is prominent on dashboard
- No new calls processed
- Data is read-only

### After Retention Period
- Account data permanently deleted
- Call recordings deleted from storage
- Stripe customer object retains only what's required for tax/legal (invoices)
- Email sent: "Your data has been deleted"

---

## Final Invoice

Generated automatically on `subscription.deleted`. Same format as regular invoice (see `02-invoice-template.md`) with these additions:

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   FINAL INVOICE                                              │
│   Invoice #: BL-2026-000183 (FINAL)                          │
│                                                              │
│   ...standard line items...                                  │
│                                                              │
│   ──────────────────────────────────────────────────────     │
│   ACCOUNT SUMMARY                                            │
│   Subscription started: March 15, 2026                       │
│   Subscription ended:   July 22, 2026                        │
│   Total paid to date:   $317.80                              │
│   Final amount due:     $0.00                                │
│                                                              │
│   No further charges will be made.                           │
│                                                              │
│   DATA RETENTION: Your call history and recordings will      │
│   be available until October 20, 2026. After that, data      │
│   will be permanently deleted.                               │
│                                                              │
│   REACTIVATE: Visit app.branchlive.ai/reactivate to restore  │
│   your account within the next 90 days.                      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Confirmation Email Templates

### Immediate Cancellation Confirmation

**Subject:** Your Branch Live subscription has been canceled

```
Hi {first_name},

We've processed your cancellation as requested.

Your AI receptionist will continue answering calls
until {end_date}. After that, the service will stop.

Summary:
• Last day of service: {end_date}
• Number of days remaining: {days_remaining}
• Data available until: {data_retention_date}

If you change your mind, you can reactivate your
subscription instantly — all your settings are saved.

[Reactivate My Account]

Thank you for trying Branch Live. If you have a moment,
we'd love to know what we could do better.

[Share Feedback — 2 questions]

— The Branch Live Team
```

### Post-End-Date Email (Day After Service Stops)

**Subject:** Your Branch Live service has ended

```
Hi {first_name},

Your Branch Live service ended yesterday ({end_date}).

What's next:
• Your call history and recordings are available
  until {data_retention_date}
• After that, all data will be permanently deleted
• You can reactivate anytime before then

[Reactivate Before It's Too Late]

— The Branch Live Team
```

---

## Win-Back Offers

Triggered during cancellation flow or sent via email campaigns.

### Offer 1: Seasonal Pause Plan
- **Price:** $5/month (vs $29.95)
- **Includes:** Phone number retention + data storage
- **Excludes:** Call routing, web chat, GBP, email
- **Target:** "Too expensive" or "Business closed / seasonal"
- **Conversion goal:** Reduce full cancellations; win back in busy season

### Offer 2: 50% Off Next Month
- **Price:** 50% discount on next billing cycle
- **Target:** "Not enough calls" or "Too expensive"
- **Duration:** One month
- **Conversion goal:** Give them time to see value

### Offer 3: Feature Request Priority
- **Target:** "Missing features"
- **Action:** Submit feature + get notified when it ships
- **Conversion goal:** Keep them warm for reactivation

### Offer 4: Onboarding Call
- **Target:** "Not getting enough calls"
- **Action:** 15-min call with support to optimize setup
- **Conversion goal:** Fix the setup, retain the customer

### Post-Cancellation Win-Back Emails
| Timing | Subject | Offer |
|--------|---------|-------|
| Day +7 | "We miss you already" | 50% off next month |
| Day +30 | "Your data is still here" | Seasonal Pause Plan |
| Day +60 | "Last chance to save your data" | 25% off 3 months |
| Day +85 | "Your data will be deleted in 5 days" | Data export offer |

---

## Reactivation Flow

```
Customer clicks "Reactivate" (dashboard or email link)
    │
    ├─► Within 90 days of cancellation:
    │   1. Show: "Reactivate your account?"
    │      - Pricing: same as before
    │      - Payment method on file (if valid)
    │      - All settings preserved
    │   2. Customer confirms
    │   3. New Stripe subscription created
    │   4. Account status: ACTIVE
    │   5. Service restored immediately
    │   6. Confirmation email sent
    │
    └─► After 90 days:
          "Your data has been deleted. Please create a new account."
          → Redirect to signup page
```

---

## Account Data (What Gets Deleted & When)

| Data | Deletion Timeline | Notes |
|------|------------------|-------|
| Call recordings | 90 days after cancellation | Delete from storage |
| Call transcripts | 90 days after cancellation | Delete from database |
| Voicemail messages | 90 days after cancellation | Delete from storage |
| Account settings | 90 days after cancellation | Greetings, hours, routing |
| Customer profile | 90 days after cancellation | Name, email, phone, address |
| Invoices & receipts | 7 years (legal requirement) | Tax/audit compliance |
| Stripe Customer | 90 days after cancellation | Anonymized after retention |

---

## Edge Cases

1. **Cancel during trial:** Immediate cancellation. No charge. No final invoice.
2. **Cancel while past-due (dunning):** Outstanding balance still owed. Account enters canceled state but unpaid invoice remains. May be sent to collections if > $50 and > 90 days.
3. **Cancel by chargeback:** Account frozen immediately. No reactivation. Manual review.
4. **Cancel and re-subscribe same day:** Allowed. New subscription, new billing cycle.
5. **Cancel with annual prepay (future):** No refund. Service continues through prepaid period.
6. **Cancel from support without verification:** Require account PIN or last-4 of card before processing.

---

## Database Triggers on Cancellation

```sql
-- When subscription is marked canceled
UPDATE accounts SET
    cancel_at_period_end = 1,
    canceled_at = CURRENT_TIMESTAMP,
    reactivatable_until = datetime(CURRENT_TIMESTAMP, '+90 days')
WHERE id = {account_id};

-- When subscription period actually ends
UPDATE accounts SET
    subscription_status = 'canceled',
    phone_number_release_date = datetime(CURRENT_TIMESTAMP, '+30 days')
WHERE id = {account_id} AND cancel_at_period_end = 1;

-- When retention period expires (cron runs daily)
DELETE FROM call_recordings WHERE account_id = {id};
DELETE FROM call_transcripts WHERE account_id = {id};
DELETE FROM voicemails WHERE account_id = {id};
DELETE FROM account_settings WHERE account_id = {id};
-- Keep anonymized row for aggregate metrics:
UPDATE accounts SET
    email = NULL,
    phone = NULL,
    business_name = NULL,
    subscription_status = 'deleted'
WHERE id = {id};
```
