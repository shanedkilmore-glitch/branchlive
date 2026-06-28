# Branch Live — Dunning Email Sequence

> **3-stage automated email sequence** for failed recurring payments.  
> Sent after Stripe Smart Retries are exhausted (Day 11 after initial failure).  
> All emails are transactional, sent via SendGrid or Stripe Email.

---

## Email Design Principles

1. **Empathetic tone** — assume good faith; most failures are expired cards or insufficient funds, not malice
2. **Clear action** — one CTA per email: "Update Payment Method"
3. **Progressive urgency** — friendly → concerned → final warning
4. **Self-serve** — link directly to Stripe Customer Portal (no login required for payment update)
5. **Human support** — every email includes a real reply-to address for billing questions

---

## Stage 1: Friendly Reminder (Day 11)

**Subject:** We couldn't process your Branch Live payment

**Preheader:** Quick fix — your card may need updating

---

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   BRANCH LIVE                                       │
│                                                     │
│   Hi {first_name},                                  │
│                                                     │
│   We tried to process your monthly Branch Live      │
│   payment of {amount} but it didn't go through.     │
│                                                     │
│   This usually happens when a card has expired or   │
│   a bank flagged the charge as unusual. No worries  │
│   — it's an easy fix.                               │
│                                                     │
│   Your AI receptionist is still running and         │
│   answering calls normally. You won't lose any      │
│   service while we sort this out.                   │
│                                                     │
│   ┌─────────────────────────────────────────┐       │
│   │     UPDATE PAYMENT METHOD →              │       │
│   │     {portal_link}                        │       │
│   └─────────────────────────────────────────┘       │
│                                                     │
│   Once your payment method is updated, we'll        │
│   charge the outstanding amount and confirm by      │
│   email.                                            │
│                                                     │
│   If you believe this is an error, reply to this    │
│   email and we'll look into it.                     │
│                                                     │
│   Thanks,                                           │
│   The Branch Live Team                              │
│   billing@branchlive.ai                             │
│                                                     │
│   ─────────────────────────────────────────────     │
│   Invoice: #{invoice_number}                         │
│   Amount: {amount}                                  │
│   Card: {brand} ending in {last4}                   │
│   Decline reason: {decline_reason_friendly}          │
└─────────────────────────────────────────────────────┘
```

**Decline Reason Friendly Mappings:**
| Stripe Code | Friendly Text |
|-------------|---------------|
| `expired_card` | "Your card has expired" |
| `insufficient_funds` | "Your card had insufficient funds" |
| `do_not_honor` | "Your bank declined the charge" |
| `generic_decline` | "Your card was declined" |
| Other | "The payment could not be processed" |

**Send conditions:** Sent immediately after the last Stripe Smart Retry fails (Day 11).

---

## Stage 2: Urgent Notice (Day 16)

**Subject:** Action needed — your Branch Live payment is past due

**Preheader:** Please update your payment to avoid service interruption

---

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   BRANCH LIVE                                       │
│                                                     │
│   Hi {first_name},                                  │
│                                                     │
│   We still haven't been able to process your        │
│   {brand} ending in {last4} for {amount}.           │
│                                                     │
│   Your AI receptionist is still active, but we      │
│   need to resolve this within the next few days to   │
│   keep your service running without interruption.   │
│                                                     │
│   ⚠ If we can't process payment by {suspension_date},│
│     call routing will be paused.                    │
│                                                     │
│   ┌─────────────────────────────────────────┐       │
│   │     UPDATE PAYMENT METHOD →              │       │
│   │     {portal_link}                        │       │
│   └─────────────────────────────────────────┘       │
│                                                     │
│   It only takes a minute — you can add a new        │
│   card or update your existing one.                 │
│                                                     │
│   Tip: Adding a backup card prevents this in        │
│   the future.                                       │
│                                                     │
│   Need help? Reply to this email or call            │
│   {support_phone}.                                  │
│                                                     │
│   Thanks,                                           │
│   The Branch Live Team                              │
│                                                     │
│   ─────────────────────────────────────────────     │
│   Invoice #{invoice_number} | Past due since {date}  │
│   Amount owed: {amount}                             │
└─────────────────────────────────────────────────────┘
```

**Key differences from Stage 1:**
- Stronger language ("past due" vs "couldn't process")
- Introduces consequence ("service will be paused")
- Suggests adding backup card
- Includes support phone number

**Send conditions:** Sent 5 days after Stage 1 if payment still unresolved.

---

## Stage 3: Final Notice (Day 21)

**Subject:** Final notice — your Branch Live account will be suspended

**Preheader:** Last chance to keep your AI receptionist active

---

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   BRANCH LIVE                                       │
│                                                     │
│   Hi {first_name},                                  │
│                                                     │
│   This is our final notice regarding your past-due  │
│   Branch Live payment.                              │
│                                                     │
│   Despite our previous emails, we haven't received  │
│   payment of {amount} for invoice #{invoice_number}. │
│                                                     │
│   ┌─────────────────────────────────────────┐       │
│   │  YOUR ACCOUNT WILL BE SUSPENDED ON:      │       │
│   │  {suspension_date}                       │       │
│   │                                         │       │
│   │  After this date:                       │       │
│   │  ✗ Calls will stop routing              │       │
│   │  ✗ Web chat will be disabled            │       │
│   │  ✗ GBP messaging will stop              │       │
│   │  ✓ Your data will be preserved          │       │
│   └─────────────────────────────────────────┘       │
│                                                     │
│   ┌─────────────────────────────────────────┐       │
│   │     UPDATE PAYMENT METHOD →              │       │
│   │     {portal_link}                        │       │
│   └─────────────────────────────────────────┘       │
│                                                     │
│   Once payment is made, your service will be        │
│   restored immediately with all your settings       │
│   intact.                                           │
│                                                     │
│   If you've already decided to cancel, please       │
│   do so from your dashboard so we can close         │
│   your account properly.                            │
│                                                     │
│   We're here to help — just reply to this email.    │
│                                                     │
│   The Branch Live Team                              │
│                                                     │
│   ─────────────────────────────────────────────     │
│   Account #{account_id} | {days_past_due} days late  │
│   Suspension date: {suspension_date}                 │
└─────────────────────────────────────────────────────┘
```

**Key differences from Stage 2:**
- "Final notice" framing
- Explicit list of what happens at suspension
- Includes cancellation option (reduces chargeback risk)
- Shows days past due

**Send conditions:** Sent 5 days after Stage 2 if payment still unresolved. Service is already LIMITED at this point.

---

## Post-Suspension Emails

### Suspension Confirmation (Day 28)

**Subject:** Your Branch Live service has been paused

```
Hi {first_name},

Your Branch Live service has been paused because
we haven't received payment of {amount}.

What's paused:
— Incoming calls are no longer routed
— Web chat widget is disabled  
— GBP messaging is inactive

What's preserved:
— All your settings, greetings, and call history
— Your phone number (held for 30 days)
— Your account data

To restore service immediately, update your payment:
{portal_link}

If we don't receive payment within 30 days, your
account will be permanently canceled and data will
be scheduled for deletion.

We hope to have you back soon.
— The Branch Live Team
```

### Pre-Cancellation Warning (Day 51)

**Subject:** Your Branch Live account will be closed in 7 days

```
Hi {first_name},

Your account has been paused for 23 days. In 7 days
({cancellation_date}), your account will be permanently
closed and your data will be scheduled for deletion.

This is your last chance to restore service with all
your settings intact.

{portal_link}

If you'd prefer to close your account immediately,
you can do so from your dashboard.
```

### Account Canceled (Day 58)

**Subject:** Your Branch Live account has been closed

```
Hi {first_name},

Your Branch Live account has been closed due to
non-payment. Your data will be retained until
{data_retention_date}, after which it will be
permanently deleted.

If you'd like to come back, you can sign up again
at app.branchlive.ai/signup. Any remaining data
can be restored to your new account within the
retention window.

We're sorry to see you go.
— The Branch Live Team
```

---

## Recovery Emails

### Payment Received (any stage)

**Subject:** Payment received — thank you!

```
Hi {first_name},

We received your payment of {amount}. Thank you!

Your Branch Live AI receptionist is fully active
and your next bill date is {next_billing_date}.

View your invoice: {invoice_link}
```

### Service Restored (post-suspension recovery)

**Subject:** Your Branch Live service is back online!

```
Hi {first_name},

Great news — your payment has been processed and
your Branch Live service is fully restored.

✓ Calls are routing again
✓ Web chat is active
✓ All settings are exactly as you left them

We missed you! If there's anything we can do to
improve your experience, just reply to this email.

Welcome back,
The Branch Live Team
```

---

## Email Configuration

### Sender Identity
- **From name:** Branch Live Billing
- **From email:** billing@branchlive.ai
- **Reply-to:** support@branchlive.ai
- **SPF/DKIM/DMARC:** Configured for branchlive.ai

### SendGrid Dynamic Templates
| Template ID | Purpose | Trigger |
|-------------|---------|---------|
| `dunning-stage-1` | Friendly reminder | Day 11 |
| `dunning-stage-2` | Urgent notice | Day 16 |
| `dunning-stage-3` | Final notice | Day 21 |
| `suspension-confirmation` | Service paused | Day 28 |
| `pre-cancel-warning` | 7-day warning | Day 51 |
| `account-canceled` | Account closed | Day 58 |
| `payment-received` | Payment success | On recovery |
| `service-restored` | Post-suspension restore | On recovery |

### Cron Job for Dunning Emails

```python
# dunning_cron.py — runs daily at 00:00 UTC
# Checks accounts in dunning and sends appropriate emails

def process_dunning():
    accounts = get_accounts_in_dunning()
    
    for account in accounts:
        days_past_due = (today - account.last_failed_payment_date).days
        
        if days_past_due >= 11 and account.dunning_stage == 0:
            account.dunning_stage = 1
            send_dunning_email(account, stage=1)
        
        elif days_past_due >= 16 and account.dunning_stage == 1:
            account.dunning_stage = 2
            send_dunning_email(account, stage=2)
            # Also limit service
            limit_account_features(account)
        
        elif days_past_due >= 21 and account.dunning_stage == 2:
            account.dunning_stage = 3
            send_dunning_email(account, stage=3)
        
        elif days_past_due >= 28 and account.dunning_stage == 3:
            account.status = 'suspended'
            account.dunning_stage = 4
            send_suspension_email(account)
        
        elif days_past_due >= 51 and account.status == 'suspended':
            send_pre_cancel_warning(account)
        
        elif days_past_due >= 58 and account.status == 'suspended':
            cancel_account(account)
            send_account_canceled_email(account)
```

---

## A/B Testing Ideas

1. **Subject line testing:** "We couldn't process your payment" vs. "Quick heads-up about your Branch Live bill"
2. **CTA button text:** "Update Payment" vs. "Fix This Now" vs. "Keep My Service Active"
3. **Send time:** Morning (8am ET) vs. afternoon (2pm ET)
4. **Include dollar amount in subject?** "Your $74.95 payment needs attention"
5. **SMS backup:** Offer SMS notification for stage 3 (opt-in)

---

## Compliance Notes

- All emails include unsubscribe link (required by CAN-SPAM)
- Transactional emails are exempt from marketing consent requirements, but the link is included as a best practice
- Billing emails do NOT require prior marketing consent (they are service-related)
- Do NOT send marketing content in transactional billing emails
