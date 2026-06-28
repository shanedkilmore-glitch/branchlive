# Branch Live — Launch Checklist

> **Ordered by priority (P0 = blocks launch, P1 = launch-critical, P2 = post-launch)**  
> **Status legend:** ⬜ Not started | 🔄 In progress | ✅ Done | ❌ Blocked

---

## P0 — MUST COMPLETE BEFORE ANY USER TOUCHES THE PRODUCT

### Landing Page (branchlive.com)
- [ ] ⬜ Full hero section with headline, subhead, CTA, and phone number
- [ ] ⬜ "How It Works" section — 3-step visual flow (Sign Up → Emma Answers → Book Jobs)
- [ ] ⬜ Pricing section — $29.95/mo, features listed, no hidden fees
- [ ] ⬜ Demo section — embedded call widget or "Call Emma Now" phone number
- [ ] ⬜ Testimonials section (at least 1 placeholder → replace with real after beta)
- [ ] ⬜ FAQ section — 8–10 questions covering pricing, setup, industries, privacy
- [ ] ⬜ Footer — links to Terms, Privacy, contact email, copyright
- [ ] ⬜ Mobile responsive — tested on iPhone SE, iPhone 14, Pixel 7, iPad
- [ ] ⬜ Page speed < 2.0s mobile (Google PageSpeed)
- [ ] ⬜ SEO meta tags — title, description, OG tags, canonical, JSON-LD structured data
- [ ] ⬜ Google Analytics / Plausible installed
- [ ] ⬜ SSL certificate active and enforced
- [ ] ⬜ DNS configured — branchlive.com → correct hosting

### Portal (:8081)
- [ ] ⬜ Signup flow — email, password, company name, phone, industry
- [ ] ⬜ Login / logout / password reset
- [ ] ⬜ Dashboard — recent calls, lead count, missed calls, quick stats
- [ ] ⬜ Call logs — list view with caller, duration, summary, transcript link
- [ ] ⬜ Lead management — lead list, status (new/contacted/booked/lost), notes
- [ ] ⬜ Settings — business name, forwarding number, welcome message, working hours, industry, service area, service description
- [ ] ⬜ Knowledge base — categories + items with pricing (what Emma knows about the business)
- [ ] ⬜ Dark theme consistent across all pages (purple/teal #8b5cf6 / #00d4aa)
- [ ] ⬜ Mobile responsive portal UI
- [ ] ⬜ Demo account (demo@branchlive.com / demo123) with seed data

### Voice Pipeline
- [ ] ⬜ Emma answers inbound calls
- [ ] ⬜ Emma speaks naturally (not robotic — 0.8–1.2s response latency target)
- [ ] ⬜ Emma qualifies callers — name, phone, job details, urgency
- [ ] ⬜ Emma routes emergencies to contractor's forwarding number
- [ ] ⬜ Call transcripts saved to portal
- [ ] ⬜ Leads auto-created from calls in portal

### Legal & Compliance
- [ ] ⬜ Terms of Service published (terms/index.html)
- [ ] ⬜ Privacy Policy published (privacy/index.html)
- [ ] ⬜ Call recording disclosure in welcome message
- [ ] ⬜ CAN-SPAM compliant email footers
- [ ] ⬜ Stripe terms linked in checkout

### Billing
- [ ] ⬜ Stripe integration — $29.95/mo subscription creation
- [ ] ⬜ Stripe webhook handling — invoice.paid, invoice.payment_failed, customer.subscription.deleted
- [ ] ⬜ Customer portal (Stripe billing portal link)
- [ ] ⬜ Dunning sequence — email at +1 day, +3 days, +7 days failed payment
- [ ] ⬜ Proration / upgrade/downgrade logic (if applicable)

---

## P1 — LAUNCH-CRITICAL (complete during private beta)

### Landing Page
- [ ] ⬜ Blog section — 5 SEO articles published before public launch
- [ ] ⬜ Industry-specific landing sub-pages (hardscape, HVAC, plumbing, roofing)
- [ ] ⬜ Social proof — real testimonials from beta users
- [ ] ⬜ Demo video — 60-second screen recording of Emma handling a call

### Portal
- [ ] ⬜ Export leads to CSV
- [ ] ⬜ Call audio playback (not just transcript)
- [ ] ⬜ Multi-user support — contractor + office manager logins
- [ ] ⬜ Email notifications — new lead, missed call, payment failed
- [ ] ⬜ SMS notifications (Twilio) — new lead alert
- [ ] ⬜ Onboarding wizard — 5-step setup flow after first login

### Voice Pipeline
- [ ] ⬜ Call forwarding to contractor when Emma can't handle
- [ ] ⬜ Voicemail transcription when forwarded call unanswered
- [ ] ⬜ Custom welcome message per contractor
- [ ] ⬜ SMS follow-up to callers who didn't leave details

### Growth
- [ ] ⬜ Google My Business profile created for Branch Live
- [ ] ⬜ Directory listings — G2, Capterra, Product Hunt, GetApp
- [ ] ⬜ Referral tracking system built
- [ ] ⬜ Email nurture sequence — 5-email welcome series for new signups
- [ ] ⬜ Abandoned signup recovery email

### Operations
- [ ] ⬜ Monitoring — uptime alerts for portal + voice pipeline
- [ ] ⬜ Backup automation — DB backup every 6 hours
- [ ] ⬜ Error tracking — Sentry or equivalent
- [ ] ⬜ Load testing — handle 50 concurrent calls

---

## P2 — POST-LAUNCH (first 90 days)

- [ ] ⬜ Industry expansion — electrical, landscaping, pest control
- [ ] ⬜ Mobile app (PWA) for contractors to check leads on-site
- [ ] ⬜ Integration marketplace — Zapier, JobNimbus, Housecall Pro, ServiceTitan
- [ ] ⬜ White-label option for agencies
- [ ] ⬜ A/B testing framework for landing page
- [ ] ⬜ Affiliate / partner program
- [ ] ⬜ Quarterly NPS survey automation
- [ ] ⬜ Advanced analytics — call sentiment, lead source attribution, conversion funnel

---

## Launch Gate Criteria

Before flipping the switch to public launch, these must all be green:

- [ ] 10 paying beta customers active for 14+ days
- [ ] Zero critical bugs open for 7 consecutive days
- [ ] Call answer rate > 95% across beta period
- [ ] Portal uptime > 99.5% across beta period
- [ ] Stripe billing processed correctly for all beta customers
- [ ] Judge reviews complete for 100% of beta calls
- [ ] All P0 items complete
- [ ] All P1 items complete

---

*Last updated: June 23, 2026*
