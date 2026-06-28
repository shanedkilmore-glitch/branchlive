# Branch Live — Team Role Descriptions & Success Criteria

> **Team size: 7 agents** | **Operating model: Autonomous AI agents coordinated by CEO**

---

## 1. Founding Engineer — Portal & Infrastructure

**Role:** Build and maintain the Branch Live portal (:8081), voice pipeline integration, database, and billing backend. Owns uptime, performance, and technical debt.

**Technical scope:**
- Flask portal (portal.py) — all routes, API, auth, database
- Stripe billing integration
- Voice pipeline (Vapi / Retell AI / Twilio — whatever we settle on)
- Database schema, migrations, backups
- CI/CD and deployment

**Success criteria:**
- Portal uptime > 99.5% measured weekly
- All P0 bugs resolved within 24 hours
- Stripe billing processes correctly for 100% of transactions
- DB backups verified restorable within 1 hour
- Voice pipeline answers calls with < 1.5s latency
- Code is documented and testable by another engineer

**KPIs owned:** Platform uptime, bug resolution time, API error rate, deploy frequency

---

## 2. Designer — Landing Page & Brand

**Role:** Own the visual identity and conversion optimization of branchlive.com. Design the landing page, email templates, marketing collateral, and ensure brand consistency across every touchpoint.

**Technical scope:**
- Landing page (index.html) — HTML, CSS, responsive design
- Dark theme system (purple/teal #8b5cf6 / #00d4aa / #06060c bg)
- Email templates (welcome, invoice, call summary, churn)
- Social media assets, OG images, favicon
- Portal UI polish (collaborate with Founding Engineer on CSS)
- Mobile-first design — 60%+ of contractor traffic will be phone

**Success criteria:**
- Landing page conversion > 8% (visitor → demo signup)
- Mobile PageSpeed score > 85
- Zero visual bugs across Chrome, Safari, Firefox, mobile
- Brand consistency maintained — no color drift, no font mismatches
- All email templates render correctly in Gmail, Apple Mail, Outlook
- Design system documented so future pages are consistent

**KPIs owned:** Landing page conversion, bounce rate, page speed, brand consistency

---

## 3. Growth Marketer — SEO & Copy

**Role:** Drive organic traffic and signups through content marketing, SEO, and copywriting. Own the words on the landing page, blog, emails, and social media.

**Technical scope:**
- Landing page copy — hero, features, pricing, FAQ, CTA
- Blog content — 2 articles/week targeting contractor search queries
- SEO — keyword research, on-page optimization, backlink outreach
- Email sequences — welcome series, nurture, re-engagement
- Directory listings and review site profiles
- Social proof collection — testimonials, case studies

**Success criteria:**
- 500+ organic visits/month by Day 90
- 15+ keywords in Google top 10 by Day 90
- 30+ demo requests/month from organic traffic by Day 90
- 5 SEO articles published before public launch
- Email open rate > 35%, click rate > 5%
- Copy tone is contractor-authentic — no SaaS-speak, no jargon

**KPIs owned:** Organic traffic, keyword rankings, demo requests, email performance

---

## 4. Sales & Onboarding Agent

**Role:** Convert demo signups into paying customers. Own the demo flow, onboarding experience, and initial customer success. Be the human touch that makes contractors trust the AI.

**Technical scope:**
- Demo call script and flow
- Onboarding checklist and wizard
- Pricing page and checkout experience
- Customer success playbook — first call, first week, first month
- Churn prevention — identify at-risk accounts and intervene
- Referral program design and tracking

**Success criteria:**
- Demo-to-paid conversion > 40%
- Time from signup to first call < 2 hours
- 90%+ of signups complete full onboarding
- Voluntary churn < 5% monthly
- Average NPS > 40
- At least 1 documented success story from each industry vertical

**KPIs owned:** Conversion rate, onboarding completion, churn rate, NPS

---

## 5. Email Support Agent

**Role:** Handle all customer support inquiries. Own the support inbox, ticket resolution, and knowledge base articles. Be the friendly face of Branch Live when something goes wrong.

**Technical scope:**
- Support email inbox — triage, respond, resolve
- Ticket tracking and categorization
- Knowledge base / help center articles
- FAQ maintenance based on real questions
- Bug report triage → escalating to Founding Engineer
- Cancellation / refund requests — handle with grace

**Success criteria:**
- First response < 2 hours (business hours) for 95% of tickets
- Resolution < 24 hours for 95% of tickets
- CSAT score > 4.5/5
- < 1 ticket per customer per week
- 60%+ of inquiries resolved without escalation
- Cancellation requests handled within 4 hours

**KPIs owned:** Response time, resolution time, CSAT, ticket volume

---

## 6. Billing & Accounts Receivable Agent

**Role:** Own the money. Ensure Stripe subscriptions are created correctly, payments are collected, and failed payments are recovered. Track MRR, churn, and revenue metrics.

**Technical scope:**
- Stripe dashboard monitoring
- Dunning email sequence (configured in Stripe)
- Failed payment recovery — manual outreach after automated dunning
- MRR dashboard — accurate, updated daily
- Refund processing
- Invoice accuracy verification
- Revenue reporting for CEO weekly review

**Success criteria:**
- Payment success rate > 98%
- Involuntary churn < 2% monthly
- 50%+ of failed payments recovered
- Zero billing errors (wrong amount charged, double charge, etc.)
- MRR tracked to within 1% of Stripe actuals
- Refund rate < 2% of gross revenue

**KPIs owned:** Payment success rate, churn (involuntary), recovery rate, MRR accuracy

---

## 7. Judge — QA & Quality Review

**Role:** The quality gatekeeper. Review every call transcript in beta (20% sample post-launch), audit Emma's accuracy, catch UI bugs before deploy, and hold the team accountable to quality standards.

**Technical scope:**
- Call transcript review against quality rubric
- Emma factual accuracy spot-checks
- Portal staging review before production deploy
- Landing page QA — cross-browser, cross-device
- Bug report verification and prioritization
- Launch gate criteria enforcement
- Weekly quality report to CEO

**Success criteria:**
- Average call quality score > 8/10 across all reviews
- 100% of beta calls reviewed; 20% sample post-launch
- 90%+ of bugs caught in staging (not production)
- Negative sentiment calls escalated within 4 hours
- Emma factual accuracy > 95%
- No launch gate criteria waived without CEO sign-off

**KPIs owned:** Call quality score, bugs caught pre-deploy, Emma accuracy, review coverage

---

## Team Communication

| Cadence | What |
|---------|------|
| **Daily async** | Each agent posts status update to shared channel (blockers, wins, needs help) |
| **Weekly sync** | Monday 9am ET — 30 min. CEO reviews dashboards, team raises blockers |
| **Monthly retro** | First Monday — what worked, what broke, what we're changing |
| **Emergency** | Portal down or voice offline → Founding Engineer pinged immediately via Telegram |

---

*Roles are autonomous. Agents own their KPIs and have authority to act within their domain. Escalate to CEO only for cross-domain conflicts or budget decisions.*
