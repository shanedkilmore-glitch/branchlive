# Branch Live — Onboarding Flow
## From Free Demo → Paid Signup → First Call Answered

---

## OVERVIEW

**Goal:** Convert a curious contractor into a paying, happy customer who has answered their first real call within 24 hours.

**Key Metric:** Trial-to-paid conversion rate (target: >40%)

**Demo Number:** (717) 341-5677

---

## PHASE 1: DISCOVERY & TRIAL (Days 0–7)

### Step 1: Land on the Site
- Contractor lands on branchlive.com from a Google search, Facebook ad, or contractor forum recommendation.
- Hero section immediately answers: *"Never miss another job lead. AI that answers your phone 24/7."*
- Prominent CTA: **"Try the Demo — Call (717) 341-5677"** with a subtext: *"It's free. Takes 30 seconds. No signup needed."*

### Step 2: Call the Demo Number
- Contractor dials (717) 341-5677.
- Emma the AI answers within 1 ring.
- Emma delivers the 30-second demo script (see `02-demo-call-script.md`).
- At the end, Emma says: *"To get your own AI receptionist, go to branchlive.com/signup — it's $29.95 a month and you can try it free for 7 days."*
- Call ends. Contractor hears what their customers will hear.

### Step 3: Website Captures Interest
- After the demo call, the contractor visits branchlive.com/signup.
- Simple 3-field signup form: Name, Email, Phone Number.
- No credit card required for the free trial.
- On submit: they receive a unique AI receptionist number instantly.

### Step 4: Forward Their Phone
- The signup confirmation page shows them their new AI number and step-by-step instructions to forward their existing business phone to it.
- Common carriers (Verizon, AT&T, T-Mobile) are listed with exact dial codes:
  - Verizon: `*72` + AI number
  - AT&T: `*72` + AI number
  - T-Mobile: `**21*` + AI number + `#`
- Welcome email arrives at the same time (see `04-welcome-email.md`).

### Step 5: First Call Answered
- Contractor sets up call forwarding (takes under 2 minutes).
- They (or a friend) call their business number to verify it rings through to Emma.
- Emma answers. First real customer call is live.
- Dashboard lights up with "1 call answered."

---

## PHASE 2: THE 7-DAY TRIAL (Days 1–7)

| Day | What Happens | System Action |
|-----|-------------|---------------|
| Day 0 | Signup | Welcome email sent. Trial countdown starts. |
| Day 1 | First call | Dashboard updates. Contractor sees it working. |
| Day 2 | Nudge email | *"Emma answered 3 calls yesterday. Here's what they said."* (transcript summaries) |
| Day 4 | Value reminder | *"You would have missed 2 job leads this week. Emma caught them."* |
| Day 6 | Expiration warning | *"Your trial ends tomorrow. Keep Emma for $29.95/mo. No contract. Cancel anytime."* |
| Day 7 | Trial ends | Card required to continue. If no card → service pauses. |

### Trial Rules
- **Duration:** 7 calendar days from signup.
- **Limits:** 50 answered calls during trial (prevents abuse).
- **Features:** Full access — transcripts, voicemail, custom greeting, basic scheduling.
- **No credit card** required to start.

---

## PHASE 3: CONVERSION (Day 7+)

### The Conversion Moment
- On Day 7, the contractor logs in and sees a banner:
  *"Your 7-day trial is complete. Emma answered 22 calls and booked 4 jobs for you. Keep her for $29.95/month."*
- One-click Stripe checkout. Name, card number, zip. Done.

### What They Get After Paying
- Unlimited calls
- SMS reminders for booked appointments
- Call transcripts with customer details
- Custom greeting recording
- Priority support
- Cancel anytime — no contracts, no early termination fees

---

## PHASE 4: POST-CONVERSION (Days 8–30)

### Day 7+1: Feedback Loop Triggers
- See `05-feedback-loop.md`

### Day 14: "How's It Going?" Email
- Simple 1-question survey: 👍 or 👎
- If 👍 → ask for a Google review or testimonial.
- If 👎 → trigger a personal email from a human support rep within 4 hours.

### Day 30: Monthly Recap
- *"This month Emma answered 87 calls, booked 14 jobs, and saved you ~22 hours of phone time."*
- Reinforce value. Reduce churn.

---

## EDGE CASES & GUARDRAILS

| Scenario | Response |
|----------|----------|
| Contractor never forwards phone after signup | Day 3 email: *"Don't forget — forward your phone so Emma can start answering! Here's how."* (with carrier-specific instructions) |
| Contractor forwards phone but no calls come in | Day 5 email: *"Everything set up — Emma's ready when your phone rings."* + suggest they test it by calling themselves. |
| Contractor calls demo repeatedly but never signs up | Email capture on the demo call: *"Want your own AI receptionist? Text DEMO to [number] and we'll send you a link."* |
| Trial expires, no payment | Service pauses. Data retained for 30 days. Email: *"Emma's on pause. Your call history is saved — reactivate anytime."* |
| Payment fails | 3 retries over 5 days. Service stays active during grace period. If all fail → pause + email. |

---

## CONVERSION FUNNEL METRICS TO TRACK

```
Demo calls  →  Website visits  →  Signups  →  Phone Forwarded  →  First Call  →  Paid
  100%             60%               30%           22%               18%           12%
```

**Benchmarks to aim for:**
- Demo → Signup: 30%+
- Signup → Forward Phone: 75%+
- Forward → First Call: 80%+
- Trial → Paid: 40%+

---

*Last updated: June 2026*
