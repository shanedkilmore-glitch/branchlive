# Branch Live — Department KPIs

> **Effective: June 23, 2026** | **Review cadence: Weekly (Monday morning)**

---

## Platform Engineering — Founding Engineer

| KPI | Target | Measurement |
|-----|--------|-------------|
| Portal uptime (weekly) | 99.5%+ | Uptime monitor at :8081 |
| Page load time (P95) | < 800ms | Lighthouse / Chrome DevTools |
| Bug resolution time (P50) | < 24 hours from report to fix | Issue tracker |
| Bug resolution time (P95) | < 72 hours | Issue tracker |
| Critical bugs open | 0 at all times | Issue tracker |
| API error rate | < 0.5% of requests | Server logs |
| DB backup freshness | < 24 hours | Automated backup check |
| Deploy frequency | 3+ deploys/week during beta | GitHub commits to production |

---

## Design — Landing Page & Brand

| KPI | Target | Measurement |
|-----|--------|-------------|
| Landing page conversion rate | 8%+ (visitor → demo signup) | Analytics |
| Mobile page speed (P75) | < 2.0s | Google PageSpeed Insights |
| Bounce rate | < 45% | Analytics |
| Time to first paint | < 1.5s | Lighthouse |
| Brand consistency score | 95%+ across all pages | Judge review checklist |
| CTA click-through rate | 12%+ | Hotjar / analytics |
| SEO health score | 90+ | Ahrefs / SEMrush |

---

## Growth Marketing — SEO & Copy

| KPI | Target | Measurement |
|-----|--------|-------------|
| Organic search traffic | 500+ visits/month by Day 90 | Google Search Console |
| Articles published | 2/week (8/month) | Content calendar |
| Keyword rankings (top 10) | 15+ target keywords | Ahrefs / GSC |
| Email open rate | 35%+ | Email platform |
| Email click rate | 5%+ | Email platform |
| Demo requests from organic | 30+/month by Day 90 | CRM / portal |
| Backlinks acquired | 20+ by Day 90 | Ahrefs |
| Social proof collected | 10+ testimonials by Day 90 | Portal / manual collection |

---

## Sales & Onboarding

| KPI | Target | Measurement |
|-----|--------|-------------|
| Demo-to-paid conversion | 40%+ | CRM tracking |
| Time from signup to first call | < 2 hours | Portal analytics |
| Onboarding completion rate | 90%+ of signups complete setup | Portal analytics |
| Average deal size | $29.95/mo (no discounts post-launch) | Stripe |
| Churn rate (voluntary) | < 5% monthly | Stripe |
| Expansion revenue | 10% of customers add seats/extras | Stripe |
| Sales cycle length | < 3 days from demo to paid | CRM |

---

## Email Support

| KPI | Target | Measurement |
|-----|--------|-------------|
| First response time (P50) | < 2 hours during business hours | Email platform |
| First response time (P95) | < 8 hours | Email platform |
| Resolution time (P50) | < 24 hours | Ticket tracking |
| Customer satisfaction (CSAT) | 4.5/5+ | Post-resolution survey |
| Ticket volume | < 1 ticket per customer per week | Ticket system |
| Self-serve rate | 60%+ resolved without human escalation | Ticket tags |

---

## Billing & Accounts Receivable

| KPI | Target | Measurement |
|-----|--------|-------------|
| Payment success rate | 98%+ | Stripe dashboard |
| Involuntary churn (failed payments) | < 2% monthly | Stripe |
| Dunning recovery rate | 50%+ of failed payments recovered | Stripe + email follow-up |
| Invoice accuracy | 100% (zero billing errors) | Manual audit |
| Refund rate | < 2% of revenue | Stripe |
| Days sales outstanding | 0 (subscription model — immediate) | Stripe |
| MRR tracking accuracy | Within 1% of actual | Stripe vs. internal dashboard |

---

## Judge — QA & Quality Review

| KPI | Target | Measurement |
|-----|--------|-------------|
| Call quality score (avg) | 8/10+ across all reviewed calls | Judge rubric |
| Calls reviewed per week | 100% of calls in first 30 days, 20% sample thereafter | Call log |
| Negative sentiment calls flagged | 100% escalated within 4 hours | Manual review |
| False positive lead qualification | < 5% of leads | Call transcript audit |
| Emma accuracy (factual correctness) | 95%+ | Spot-check review |
| Portal bugs caught pre-deploy | 90%+ of bugs caught in staging | Issue tracker |
| Design review pass rate | 95%+ first-pass | Design QA log |

---

## Dashboard — CEO Weekly Review

Every Monday, these numbers go on one screen:

| Number | What it means |
|--------|--------------|
| **Customers** | Total paying accounts |
| **MRR** | Monthly recurring revenue |
| **Calls answered** | Total calls Emma handled (7-day) |
| **Leads captured** | New leads created (7-day) |
| **Estimates booked** | Leads marked "estimate scheduled" (7-day) |
| **Churn** | Accounts lost (7-day) |
| **NPS** | Latest survey average |
| **Uptime** | Portal + voice pipeline (7-day) |

---

*KPIs are targets, not handcuffs. If we're missing a number, we fix the system — not the report.*
