# Branch Live — Support Escalation Rules

> **Purpose:** Defines when a support ticket moves from automated/canned response to a human support agent. Applies to email, chat, and phone support channels.

---

## Escalation Tiers

| Tier | Who Handles | Response SLA | Example |
|------|-------------|-------------|---------|
| **Tier 0** | Self-serve (knowledge base, canned emails) | Instant | "How do I change my welcome message?" |
| **Tier 1** | AI agent (this system) with canned responses | < 5 min | "Emma isn't answering correctly" — template #2 |
| **Tier 2** | Human support agent | < 4 business hours | Billing dispute, porting paperwork, account recovery |
| **Tier 3** | Engineering / AI training team | < 24 hours | Model hallucination, platform bug, integration failure |
| **Tier 4** | Leadership / Legal | < 48 hours | Legal threats, regulatory complaints, PR incidents |

---

## Automatic Escalation Triggers

The following trigger words, phrases, or patterns **always** escalate to Tier 2 (human):

### 1. Legal & Regulatory Threats
Customer mentions ANY of:
- "lawyer", "attorney", "legal action", "sue", "lawsuit", "litigation"
- "FCC complaint", "FTC", "Attorney General", "regulatory"
- "violation", "illegal", "fraud"
- "cease and desist"

**Action:** Escalate to Tier 4 (Leadership/Legal) immediately. Do NOT send any templated response.

---

### 2. Billing Disputes (Not Simple Updates)
Customer mentions ANY of:
- "unauthorized charge", "didn't authorize", "fraudulent charge"
- "dispute" + "charge" / "bank" / "credit card"
- "chargeback", "reverse charges"
- "refund" + "demand" / "immediately" / "now"
- Amount disputed exceeds **$100**

**Action:** Escalate to Tier 2 (human). Simple billing updates (changing card, viewing invoice) do NOT escalate — use template #10.

---

### 3. Account Access & Security
Customer reports:
- "can't log in" after trying password reset
- "account hacked", "someone else accessing my account"
- "2FA not working" / "locked out"
- "suspicious activity"
- Requests account deletion (GDPR/CCPA right to deletion)

**Action:** Escalate to Tier 2. Account recovery requires identity verification that AI cannot perform. GDPR/CCPA deletion requests have legal timelines.

---

### 4. Service Outage or Critical Failure
Customer reports:
- "Emma not answering at all" / "calls going to dead air" (confirmed not a forwarding issue)
- "all my calls are dropping"
- "dashboard completely down" for > 30 min
- "been like this for days"
- Multiple customers reporting the same issue (clustered tickets)

**Action:** Check status page first. If confirmed outage → Tier 3 (Engineering). If isolated → Tier 2 for troubleshooting.

---

### 5. Porting & Number Issues
Customer needs:
- Port-in paperwork (LOA generation, carrier verification)
- Port-out requests
- Port stuck or delayed beyond 7 business days
- Number released/lost during port

**Action:** Escalate to Tier 2. Porting involves carrier coordination and sensitive account information.

---

### 6. Repeated Unresolved Issues
A ticket that:
- Has been open for **> 7 days** without resolution
- Has had **3+ back-and-forth exchanges** without progress
- Customer explicitly asks for "supervisor", "manager", or "real person"
- Customer says "you're not understanding me" or "this is the third time"

**Action:** Escalate to Tier 2 with full ticket history attached.

---

### 7. Harassment, Abuse, or Inappropriate Use
Customer:
- Uses abusive language toward support staff
- Reports harassment calls through the platform
- Appears to be using Branch Live for spam/scam operations
- Makes threats of violence or self-harm

**Action:** 
- Abuse toward staff → escalate to Tier 2, flag for account review
- Harassment/scam reports → Tier 2 + Tier 4 if illegal activity suspected
- Threats of violence/self-harm → Tier 4 immediately, follow crisis protocol

---

### 8. Technical Issues Beyond Template Scope
Issues that cannot be resolved by:
- Updating Business Profile or FAQ
- Changing dashboard settings
- Following documented troubleshooting steps

Specifically:
- Emma hallucinating or giving nonsensical answers (not training-related)
- Call audio routing failures (SIP/VoIP level)
- Integration failures (Zapier, Google Calendar sync broken)
- API errors or webhook failures
- Billing system errors (double-charges, system-generated incorrect invoices)

**Action:** Escalate to Tier 3 (Engineering) with reproduction steps and call IDs.

---

## Escalation Process

### For AI Agent (this system):
1. **Detect** trigger keyword or pattern in customer message
2. **Classify** the escalation tier
3. **Respond** to customer with the **Escalation Acknowledgement Template** below
4. **Create** ticket in support system with:
   - `priority: high`
   - `escalation_tier: {tier}`
   - `escalation_reason: {matched trigger}`
   - Full conversation history attached
5. **Notify** the appropriate team channel (Slack: `#support-escalations`)

### Escalation Acknowledgement Template (send to customer):

```
Subject: Re: {original_subject} — Escalated to our team

Hi {customer_name},

I've read through your message and this needs a closer look from our team — I'm escalating it now.

A member of our {department} team will personally review your case and reply within {sla_timeframe}. Your reference number is **TKT-{ticket_id}**.

In the meantime:
- {any_immediate_step_customer_can_take}
- You can also reach us at {support_phone} during business hours (M-F, 9am-6pm ET)

We'll get this sorted out for you. Thank you for your patience.

Best,
{support_agent_name}
Branch Live Support
```

---

## De-escalation Rules (When to NOT Escalate)

The following look like escalation triggers but should be handled with canned responses FIRST:

| Customer Says | Do NOT Escalate If | Use Template |
|---------------|---------------------|--------------|
| "I want to cancel" | Standard cancellation request (no threat, no dispute) | Template #6 |
| "This is wrong" (about Emma) | Misconfigured FAQ or profile — fixable in dashboard | Template #2 |
| "I'm frustrated" | No specific trigger keyword; first contact about the issue | Template #2 or #7 |
| "I want a refund" | Customer cancelled and asks about refund policy | Template #6 (explain policy) |
| "My bill is too high" | Customer asking about plan options, not disputing a charge | Template #10 |
| "You charged me" | Charge matches their plan — customer forgot/didn't recognize | Template #10 (send invoice) |

**Rule of thumb:** One attempt with a canned response is acceptable before escalating — unless the message contains an automatic trigger keyword. If the customer pushes back after one canned response, escalate.

---

## Priority Matrix

| Urgency →<br>Impact ↓ | Low | Medium | High | Critical |
|------------------------|-----|--------|------|-----------|
| **Single user, minor** | P4 — KB article | P3 — Canned response | P2 — Human < 24h | P1 — Human < 4h |
| **Single user, major** | P3 — Canned response | P2 — Human < 24h | P1 — Human < 4h | P1 — Human < 1h |
| **Multiple users** | P2 — Human < 24h | P1 — Human < 4h | P1 — Human < 1h | P0 — Incident response |
| **Platform-wide** | P1 — Human < 4h | P0 — Incident response | P0 — Incident response | P0 — Incident response |

**Definitions:**
- **Minor:** Cosmetic, workaround exists, no revenue impact
- **Major:** Core feature broken, no workaround, revenue or churn risk
- **Critical:** Service completely unavailable, data loss, security breach

---

## SLA Commitments by Tier

| Tier | First Response | Resolution Target | Business Hours Only? |
|------|---------------|-------------------|-----------------------|
| Tier 1 (AI) | < 5 minutes | < 1 hour | No (24/7) |
| Tier 2 (Human) | < 4 business hours | < 24 business hours | Yes (M-F, 9am-6pm ET) |
| Tier 3 (Engineering) | < 24 hours | < 3 business days | Yes |
| Tier 4 (Leadership/Legal) | < 48 hours | Case by case | Yes |

---

## Escalation Decision Flowchart

```
Customer message received
        │
        ▼
┌──────────────────────────────┐
│ Contains automatic trigger?   │──── Yes ───▶ Escalate per rules above
│ (legal, billing dispute,      │
│  security, abuse, etc.)       │
└──────────────────────────────┘
        │ No
        ▼
┌──────────────────────────────┐
│ Match to a canned template?   │──── Yes ───▶ Send template, mark pending
│ (10 templates available)      │
└──────────────────────────────┘
        │ No
        ▼
┌──────────────────────────────┐
│ Answerable from KB?           │──── Yes ───▶ Send KB link + brief answer
│ (knowledge base article       │
│  already exists)              │
└──────────────────────────────┘
        │ No
        ▼
┌──────────────────────────────┐
│ Previously unresolved?        │──── Yes ───▶ Escalate to Tier 2 (human)
│ (> 3 exchanges OR > 7 days)  │
└──────────────────────────────┘
        │ No
        ▼
┌──────────────────────────────┐
│ FIRST contact about issue?    │──── Yes ───▶ Send closest template +
│                               │              ask clarifying questions
└──────────────────────────────┘
        │
        ▼
   Customer replies
   (return to top)
```
