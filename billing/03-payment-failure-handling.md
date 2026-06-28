# Branch Live — Payment Failure Handling Rules

> **Context:** When a recurring charge fails, the system must intelligently retry, communicate, and eventually suspend service if unresolved. These rules govern the automated response to `invoice.payment_failed` events from Stripe.

---

## Stripe Decline Codes & Branch Live Responses

### Soft Declines (Retryable)
Stripe will automatically retry these based on Smart Retries logic.

| Stripe Decline Code | Meaning | Branch Live Action |
|---------------------|---------|-------------------|
| `authentication_required` | 3D Secure needed | Prompt customer to authenticate via Stripe Hosted Invoice Page |
| `approve_with_id` | Card requires merchant approval | Notify customer by email; retry after 24h |
| `call_issuer` | "Call your bank" decline | Email with instructions; retry in 48h |
| `card_not_supported` | Card type not accepted | Email asking for different card |
| `card_velocity_exceeded` | Too many charges | Retry after 24h cooldown |
| `currency_not_supported` | USD not accepted | Rare; email asking for different card |
| `do_not_honor` | Generic bank refusal | Retry via Stripe Smart Retries (up to 4x) |
| `do_not_try_again` | Merchant blocked | Move to next card if available; else manual review |
| `insufficient_funds` | Not enough money | Retry in 3 days (after payday cycle) |
| `invalid_account` | Account closed/changed | Email asking for updated card |
| `not_permitted` | Card can't make this type of purchase | Email asking for different card |
| `processing_error` | Temporary network error | Retry immediately (Stripe handles) |
| `reenter_transaction` | Card requires re-entry | Email asking to re-enter card details |
| `try_again_later` | Temporary issuer outage | Retry after 1h, then 6h, then 24h |

### Hard Declines (Non-Retryable)
These stop automatic retries immediately.

| Stripe Decline Code | Meaning | Branch Live Action |
|---------------------|---------|-------------------|
| `card_declined` | Generic hard decline | Immediate email: card declined, update payment |
| `expired_card` | Card expired | Email: update expiration or add new card |
| `fraudulent` | Marked as fraud | **Immediate account suspension.** Manual review required. |
| `lost_card` | Card reported lost | Email: card reported lost, add new card |
| `merchant_blacklist` | Branch Live blacklisted by issuer | Manual investigation; contact Stripe support |
| `new_account_information_available` | Bank says account info changed | Email: update card details |
| `no_action_taken` | Customer didn't complete action | Email: please complete required action |
| `not_supported` | Feature not supported by card | Email: please use a different card |
| `pickup_card` | Card should be physically retained | **Immediate suspension.** Possible stolen card. |
| `restricted_card` | Card restricted (e.g., gambling blocks) | Email: card restricted; use different card |
| `revocation_of_all_authorizations` | All authorizations revoked | Immediate suspension; contact customer |
| `revocation_of_authorization` | Single authorization revoked | Email asking for updated payment method |
| `security_code_incorrect` | Wrong CVC | Email asking to re-enter CVC |
| `stolen_card` | Card reported stolen | **Immediate account suspension.** |
| `stop_payment_order` | Stop-payment issued | Email: stop-payment detected; manual resolution |
| `testmode_decline` | Test card used in production | Ignore; only occurs in Stripe test mode |
| `transaction_not_allowed` | Card limit hit | Email asking for different card or bank contact |

---

## Automated Retry Schedule (Dunning Timeline)

Stripe Smart Retries handles the initial 4 retries. After those are exhausted, Branch Live takes over:

```
Day 0      Charge attempt #1 ───── FAIL ────► Stripe Smart Retries begin
Day 3      Charge attempt #2 ───── FAIL
Day 7      Charge attempt #3 ───── FAIL
Day 11     Charge attempt #4 ───── FAIL ────► Stripe gives up
                                              │
                                              ▼
Day 11     DUNNING STAGE 1 (Friendly Reminder)
           Email: "We couldn't charge your card"
           Account: Still ACTIVE (grace period)
           
Day 16     DUNNING STAGE 2 (Urgent Notice)       
           Email: "Your payment is past due"
           Account: Still ACTIVE but warning shown on dashboard
           
Day 21     DUNNING STAGE 3 (Final Notice)
           Email: "Your account will be suspended"
           Account: Limited — calls reduced to emergency only
           
Day 28     ACCOUNT SUSPENSION
           - Service halted (calls stop routing)
           - Dashboard shows "Account suspended — update payment"
           - Data retained, no data loss
           - Can be instantly restored on successful payment
           
Day 58     ACCOUNT CANCELED
           - 30 days after suspension
           - Subscription canceled in Stripe
           - Data retention clock starts (90 days)
```

**Timeline Summary:**
| Day | Event | Account Status | Service |
|-----|-------|---------------|---------|
| 0 | Charge fails | ACTIVE | Full |
| 0-11 | Stripe Smart Retries (up to 4x) | ACTIVE | Full |
| 11 | Dunning Stage 1 email | ACTIVE | Full (grace) |
| 16 | Dunning Stage 2 email | ACTIVE | Warning banner |
| 21 | Dunning Stage 3 email | PAST_DUE | Limited |
| 28 | Suspension | SUSPENDED | OFF |
| 58 | Cancellation | CANCELED | OFF |

---

## Successful Recovery During Dunning

If payment succeeds at any stage:

1. **Mark account ACTIVE immediately**
2. **Generate catch-up invoice** covering the unpaid period
3. **Send "Payment Received" email** confirming restoration
4. **Reset dunning stage to 0**
5. **Next billing date stays on original schedule** (not shifted)

---

## Manual Interventions

### When to Escalate to Manual Review
| Trigger | Action |
|---------|--------|
| 2+ consecutive failed payments after dunning | Customer Success reviews account |
| `fraudulent` or `stolen_card` decline code | Immediate security review |
| Chargeback received | Account frozen; dispute process |
| Customer requests payment plan | Manual invoice with custom schedule |
| Annual contract customer | Grace period extended to 45 days |

### Support Tools
- **Force Retry:** Manually trigger a charge attempt (Stripe Dashboard or admin API)
- **Extend Grace Period:** Push suspension date by N days
- **Waive Late Fee:** If late fees are ever implemented
- **One-Time Invoice:** For custom payment arrangements

---

## Multi-Payment-Method Fallback

If a customer has multiple payment methods on file:

```
Attempt primary card → FAIL
  → Attempt backup card (if exists) → FAIL
    → Enter dunning sequence
```

Stripe's `payment_method_types` order is respected. Branch Live should encourage customers to add a backup card during onboarding (with a small "Recommended" badge).

---

## Preventing Involuntary Churn

### Proactive Measures
1. **Card Expiry Warnings:** Email 30 days and 7 days before card expires
2. **Stripe Card Updater:** Automatically attempts to update card details via card networks (Visa Account Updater, Mastercard ABU)
3. **Backup Payment Method:** Prompt during onboarding — "Add a backup card (recommended)"
4. **Grace Period Communications:** Clear, empathetic emails (see `04-dunning-emails.md`)

### Metrics to Track
- **Involuntary Churn Rate:** Customers lost due to payment failure (target: < 1%)
- **Dunning Recovery Rate:** % of failed payments that eventually recover (target: > 60%)
- **Time to Recovery:** Average days from first failure to successful payment
- **Suspension-to-Cancel Rate:** % of suspended accounts that ultimately cancel

---

## Stripe Webhook Handling Code (Pseudocode)

```python
# webhook_handler.py

def handle_invoice_payment_failed(event):
    invoice = event['data']['object']
    customer_id = invoice['customer']
    account = get_account_by_stripe_customer(customer_id)
    
    # Determine decline code
    charge = stripe.Charge.retrieve(invoice['charge'])
    decline_code = charge.get('outcome', {}).get('network_status', 'unknown')
    
    if decline_code in HARD_DECLINE_IMMEDIATE_SUSPEND:
        # fraud, stolen_card, pickup_card
        account.status = 'suspended'
        send_immediate_suspension_email(account)
        log_security_event(account, decline_code)
        return
    
    if decline_code in HARD_DECLINE_NO_RETRY:
        # Don't rely on Stripe retries; go straight to dunning
        account.dunning_stage = 1
        account.status = 'past_due'
        send_dunning_email(account, stage=1)
        return
    
    # Soft decline — Stripe Smart Retries will handle
    # Branch Live will pick up at dunning stage 1 after all retries are exhausted
    log_payment_failure(account, invoice, decline_code)

def handle_invoice_payment_succeeded(event):
    invoice = event['data']['object']
    customer_id = invoice['customer']
    account = get_account_by_stripe_customer(customer_id)
    
    account.status = 'active'
    account.dunning_stage = 0
    account.next_billing_date = calculate_next_billing(account)
    
    send_payment_received_email(account, invoice)
    
    # If recovering from dunning/suspension
    if account.was_in_dunning:
        send_service_restored_email(account)
```

---

## Testing Checklist

- [ ] Test each decline code simulation in Stripe test mode
- [ ] Verify Smart Retries fire on schedule
- [ ] Verify dunning emails send at correct intervals
- [ ] Verify suspension at Day 28
- [ ] Verify service restoration on successful payment
- [ ] Verify cancellation at Day 58 if unresolved
- [ ] Test backup payment method fallback
- [ ] Test card expiry notification workflow
- [ ] Test chargeback handling
- [ ] Test manual force-retry from admin panel
