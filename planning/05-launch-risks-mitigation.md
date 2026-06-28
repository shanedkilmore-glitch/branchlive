# Branch Live — Top 3 Launch Risks & Mitigation Plans

> **CEO assessment: June 23, 2026** | **Review weekly at Monday sync**

---

## Risk #1: Emma Sounds Like a Robot

**Severity:** 🔴 CRITICAL  
**Probability:** HIGH (first 30 days)  
**Impact:** If Emma sounds like an IVR or chatbot, contractors won't trust her, callers will hang up, and word-of-mouth dies instantly. The entire value proposition — "sounds completely human" — collapses.

### Why this is likely:
- Voice AI latency (TTFB + TTS) can easily exceed 2 seconds, which feels unnatural
- Generic AI voices (Azure, ElevenLabs defaults) sound like, well, AI
- Emma needs industry-specific knowledge (paver types, HVAC terms) that the base model won't know without a good knowledge base
- Callers from construction trades often have thick accents, background noise, and use slang

### Mitigation Plan

**Pre-launch (now):**
1. **Voice model selection** — Test 3+ providers (Vapi, Retell AI, ElevenLabs + custom pipeline). Pick the one with the lowest latency and most natural-sounding voice for a female receptionist in a contractor context.
2. **Latency benchmark** — Emma must respond in < 1.2 seconds from caller finishing their sentence. If a provider can't hit this, switch immediately.
3. **Knowledge base seeding** — Pre-load Emma with industry terminology: paver brands (Techo-Bloc, Cambridge, Unilock), HVAC terms (SEER, BTU, heat pump vs. furnace), plumbing fixtures, roofing materials. Test her with real contractor scenarios.
4. **Small talk training** — Emma must handle "How's the weather?" and "Is this a real person?" gracefully. Script and test these.
5. **Background noise handling** — Test with jobsite audio (concrete saws, trucks, wind). If the pipeline can't filter it, add a noise suppression layer.

**Beta (Days 1–45):**
6. **100% call review by Judge** — Every beta call gets scored on "human-like" quality. Any call scoring below 7/10 triggers an immediate pipeline investigation.
7. **Contractor feedback loop** — Beta users rate every call transcript. "Did Emma sound human? Yes/No." Drop below 80% "Yes" → emergency fix.
8. **Accent and dialect testing** — Test with Southern, Northeastern, and Spanish-accent English callers.

**Escalation trigger:** If Judge scores any call below 5/10 for "human-like" quality, pause new signups and fix the pipeline before adding more users.

---

## Risk #2: Stripe Billing Fails Silently

**Severity:** 🔴 CRITICAL  
**Probability:** MEDIUM  
**Impact:** If Stripe webhooks aren't handling `invoice.payment_failed` or `customer.subscription.deleted` correctly, we either (a) keep providing service to non-paying customers, losing revenue, or (b) accidentally cancel paying customers' access, creating support nightmares and churn. A single billing bug in the first 30 days could cost us every beta customer.

### Why this is likely:
- Stripe webhook signatures, idempotency, and retry logic are easy to get wrong
- Multiple subscription states (trialing, active, past_due, canceled, unpaid) have subtle edge cases
- Portal access gating based on subscription status must be perfectly synced
- Dunning emails can feel aggressive if timed wrong — churning customers who would have paid

### Mitigation Plan

**Pre-launch (now):**
1. **Webhook test suite** — Before taking real money, simulate every webhook event: `invoice.paid`, `invoice.payment_failed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `charge.refunded`. Verify portal access updates correctly for each.
2. **Stripe test mode** — Run in test mode for at least 7 days with fake cards:
   - Card that always succeeds (`4242 4242 4242 4242`)
   - Card that requires 3D Secure (`4000 0025 0000 3155`)
   - Card that declines (`4000 0000 0000 0002`)
   - Card that triggers dispute
3. **Idempotency handling** — Stripe can send the same webhook twice. Ensure the portal handles duplicate events without double-charging or double-canceling.
4. **Access gating test** — After a subscription is created, portal access should be immediate. After a subscription is canceled, access should end at period end (not immediately). Test both paths.

**Beta (Days 1–45):**
5. **Manual billing audit** — Founding Engineer manually verifies every beta customer's Stripe subscription matches their portal access status, every week.
6. **Dunning sequence review** — Email Support Agent reviews dunning timing. Soft touch at +1 day ("Looks like your card had an issue"), firmer at +7 days ("Your account will be paused in 3 days"). Never threatening.
7. **Test transaction** — Once per week, run a $1 test charge through the live pipeline and verify it flows end-to-end (charge → invoice → webhook → portal update → email receipt).

**Escalation trigger:** Any customer reports "I paid but can't access the portal" or "I canceled but you charged me" → immediate Billing Agent + Founding Engineer swarm. Fix within 2 hours.

---

## Risk #3: Contractors Don't Trust AI (Adoption Failure)

**Severity:** 🟠 HIGH  
**Probability:** HIGH  
**Impact:** The hardest problem isn't technical — it's psychological. Tradesmen are skeptical of technology, especially AI. They've been burned by bad software. If the first 10 contractors who try Branch Live don't immediately see the value, we burn our entire target market's trust. Negative word-of-mouth in tight-knit trade communities (Facebook groups, supply house counters, job sites) spreads faster than any ad campaign.

### Why this is likely:
- "AI receptionist" sounds like a robot to most contractors
- They've tried "virtual receptionists" before (human answering services) and had bad experiences
- The $29.95 price point is so low it triggers "too good to be true" skepticism
- Contractors don't read landing pages — they ask their buddy at the supply house
- The real value (fewer missed calls, more booked jobs) only becomes obvious after 2–4 weeks of use

### Mitigation Plan

**Pre-launch (now):**
1. **Demo-first marketing** — The primary CTA is "Call Emma Now" with a real phone number, not "Sign Up" or "Start Free Trial." Let contractors experience it before they commit to anything.
2. **No credit card required for demo** — Remove all friction. Call the number, talk to Emma, see how it works. If they like it, then they sign up.
3. **Contractor voice in copy** — Growth Marketer must write like a contractor, not a SaaS founder. Read every line aloud. If it sounds like it came from a TechCrunch article, rewrite it.
4. **Testimonial seeding** — Get 3 beta contractors to record 30-second video testimonials. Real guys, real trucks, real job sites. This matters more than any landing page copy.
5. **Supply house partnerships** — Build relationships with 2–3 hardscape/masonry supply houses in Central PA. Leave flyers at the counter. The guy recommending Branch Live to his buddy at the supply yard is worth 1000 Google ads.

**Beta (Days 1–45):**
6. **White-glove onboarding** — First 10 customers get personal onboarding from the Sales Agent. Walk them through setup, make sure their first call works, check in at Day 1, Day 3, Day 7.
7. **Rapid value demonstration** — Within the first 48 hours, every beta customer should have Emma answer at least one real call and book (or attempt to book) one estimate. If this doesn't happen, the Sales Agent calls the contractor personally to troubleshoot.
8. **Referral incentives at launch** — $10 account credit for each referred contractor who signs up. Word-of-mouth in trades is the only growth channel that compounds.
9. **Objection handling playbook** — Document every objection beta users raise. Train Emma and the Sales Agent to handle them. Common ones: "What if Emma gives wrong info?" "Can she handle angry customers?" "What if I want to talk to them myself?"

**Post-launch (Days 46–90):**
10. **Case study publishing** — One detailed case study per industry vertical: "How [Contractor Name] booked 12 extra jobs last month with Branch Live." Real numbers, real quotes.
11. **Community building** — Private Facebook group or WhatsApp chat for Branch Live customers. Contractors helping contractors. Build loyalty.

**Escalation trigger:** If any beta customer churns in the first 14 days, CEO personally calls them to understand why. If 3+ customers cite "AI doesn't work" or "not ready for my business," halt all growth marketing until the product is fixed.

---

## Risk Monitoring Dashboard

Every Monday at the CEO review, these risk indicators are checked:

| Risk | Leading Indicator | Green | Yellow | Red |
|------|------------------|-------|--------|-----|
| Emma sounds robotic | Call quality score (Judge) | > 8/10 | 6–8/10 | < 6/10 |
| Billing failure | Payment success rate | > 98% | 95–98% | < 95% |
| Adoption failure | Demo-to-paid conversion | > 40% | 25–40% | < 25% |
| Adoption failure | Beta churn (14-day) | 0% | 1 loss | 2+ losses |

---

## Risk Register (Lower Priority — Monitor)

| # | Risk | Severity | Mitigation Summary |
|---|------|----------|-------------------|
| 4 | Voice pipeline downtime (> 1 hour) | HIGH | Multi-provider fallback. If primary provider fails, calls route to backup IVR + voicemail-to-email. |
| 5 | Competitor launch (existing players drop prices) | MEDIUM | Differentiate on contractor authenticity + industry-specific knowledge. Don't compete on price. |
| 6 | Portal security breach | HIGH | SQL parameterized queries (already in place). Rate limiting. No secrets in code. Regular dependency audits. |
| 7 | SEO takes longer than expected | MEDIUM | Supplement with paid ads (Google Local Services) if organic isn't moving by Day 45. |

---

*Risk management is not about predicting the future — it's about having a plan for when things break. Things will break. The question is whether we recover in hours or weeks.*
