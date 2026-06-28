# Branch Live — 7-Day Feedback Loop
## How We Check In With New Customers (Without Being Annoying)

---

## WHY DAY 7?

| Reason | Explanation |
|--------|-------------|
| **Enough data** | By Day 7, Emma has answered real calls, transcribed conversations, and (hopefully) booked appointments. The customer has opinions. |
| **Not too soon** | Days 1–3 they're still setting up. Asking for feedback on Day 2 feels like pestering. |
| **Not too late** | By Day 30, friction points have become habits. Catch issues while they're still fresh (and while the customer is still forming their impression). |
| **Coincides with trial end** | The 7-day feedback ask lands at the same moment they're deciding whether to pay. It's the perfect retention touchpoint. |

---

## THE FEEDBACK FLOW

```
Day 7 → Email goes out → Customer clicks one of three responses
                              │
              ┌───────────────┼────────────────┐
              ▼               ▼                 ▼
         😍 Loving it     😐 It's okay      😞 Not happy
              │               │                 │
              ▼               ▼                 ▼
      Ask for review    "What's missing?"   Personal human
      + referral        → 1-click reply     email within 4hr
```

---

## THE EMAIL

### Configuration

| Field | Value |
|-------|-------|
| **From** | Emma @ Branch Live <emma@branchlive.com> |
| **Subject** | `How's Emma working out?` |
| **Trigger** | 7 days after signup, at 10:00 AM local time |
| **Format** | HTML email with three big tappable buttons |

---

### Plain-Text Version

```
Hi [First Name],

It's been a week since Emma started answering your phone. We'd love
to know how it's going — good, bad, or somewhere in between.

Just reply with one word:

  "GREAT"   → if Emma's working out
  "OKAY"    → if it's fine but could be better
  "NOT"     → if something's wrong

We read every single reply. If something's not right, we'll fix it.

— Emma + the Branch Live Team
```

---

### HTML Version

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>How's Emma working out?</title>
</head>
<body style="margin:0; padding:0; background:#0d1117; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1117; padding:40px 0;">
    <tr>
      <td align="center">

        <table width="560" cellpadding="0" cellspacing="0" style="background:#161b22; border-radius:8px; border:1px solid #30363d; overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 20px; border-bottom:1px solid #21262d;">
              <h1 style="margin:0; font-size:22px; color:#f0f6fc; font-weight:600;">
                How's Emma working out?
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:24px 40px; color:#c9d1d9; font-size:15px; line-height:1.7;">

              <p style="margin:0 0 16px;">Hi <strong style="color:#f0f6fc;">[First Name]</strong>,</p>

              <p style="margin:0 0 24px;">
                It's been a week since Emma started answering your phone.
                She's handled <strong style="color:#58a6ff;">[call_count] calls</strong>
                and booked <strong style="color:#3fb950;">[booked_jobs] jobs</strong> for you.
              </p>

              <p style="margin:0 0 24px; color:#8b949e;">
                How's it going? Tap one:
              </p>

              <!-- 😍 GREAT -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;">
                <tr>
                  <td>
                    <a href="[feedback_url]?response=great" style="display:block; background:#238636; color:#fff; text-decoration:none; padding:16px 24px; border-radius:6px; text-align:center; font-size:18px; font-weight:600;">
                      😍  Loving it
                    </a>
                  </td>
                </tr>
              </table>

              <!-- 😐 OKAY -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;">
                <tr>
                  <td>
                    <a href="[feedback_url]?response=okay" style="display:block; background:#21262d; color:#c9d1d9; text-decoration:none; padding:16px 24px; border-radius:6px; border:1px solid #30363d; text-align:center; font-size:18px; font-weight:600;">
                      😐  It's okay
                    </a>
                  </td>
                </tr>
              </table>

              <!-- 😞 NOT GREAT -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td>
                    <a href="[feedback_url]?response=not" style="display:block; background:#21262d; color:#c9d1d9; text-decoration:none; padding:16px 24px; border-radius:6px; border:1px solid #30363d; text-align:center; font-size:18px; font-weight:600;">
                      😞  Not happy
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0; color:#8b949e; font-size:13px;">
                We read every response. If something's off, we'll fix it
                — usually the same day.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px; border-top:1px solid #21262d; background:#0d1117;">
              <p style="margin:0; color:#484f58; font-size:12px;">
                Branch Live · <a href="[unsubscribe_url]" style="color:#484f58;">Unsubscribe from these check-ins</a>
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
```

---

## RESPONSE PATHS

### Path A: 😍 "Loving It"

**Immediate:** Redirect to a landing page that says:

> *"Awesome — that's what we love to hear. Want to do us a quick favor?*
> *Leave a Google review →  [link]*
> *Refer a contractor friend →  [referral link] (you both get a free month)"*

**System action:**
- Tag customer as `promoter` in CRM
- Add to "ask for testimonial" queue (human follow-up next week)
- Trigger referral program email sequence

---

### Path B: 😐 "It's Okay"

**Immediate:** Redirect to a landing page with one quick question:

> *"What's missing? What would make Emma great instead of okay?"*

- Single text box, no more than 2 sentences.
- Submit button: "Send feedback"

**System action:**
- Tag customer as `neutral` in CRM
- Log feedback to internal Slack/email channel
- Product team reviews weekly for patterns
- Human follow-up within 24 hours if feedback is actionable

---

### Path C: 😞 "Not Happy"

**Immediate:** Redirect to a landing page:

> *"We're sorry to hear that — and we want to make it right. Shane or someone from the team will email you personally within 4 hours. In the meantime, can you tell us what went wrong?"*

- Text box for details
- Submit button: "Send → we're on it"

**System action:**
- Tag customer as `at_risk` in CRM
- Fire urgent alert to support team (email + Slack)
- Human sends personal email within 4 hours
- If no response from customer in 48 hours → follow-up phone call from Shane
- Automatically extend trial by 7 days as goodwill

---

## FOLLOW-UP SEQUENCE

### Day 7: Feedback email sent (as above)

### Day 8: If no response

```
Subject: Quick question about Emma

Hi [First Name] — just checking in. Did you get a chance to try
Emma out? Hit reply with "great," "okay," or "not" — we're all ears.
```

### Day 10: If still no response → done
- Don't pester. Three emails in 10 days is enough.
- If they're actively using the service (calls being answered), assume neutral-to-positive.
- If they haven't forwarded their phone or zero calls, flag for human review.

---

## TRACKING & METRICS

| Metric | Target | Why |
|--------|--------|-----|
| Feedback email open rate | >60% | Subject line test if lower |
| Response rate (of openers) | >15% | Simplify CTA if lower |
| "Loving it" share | >55% | Product quality signal |
| "Not happy" share | <10% | Churn early warning |
| "Not happy" → saved within 48h | >80% | Retention team effectiveness |
| Referrals from "Loving it" path | 5%+ | Organic growth lever |

---

## PERSONALIZATION VARIABLES

| Variable | Source | Example |
|----------|--------|---------|
| `[First Name]` | Signup form | "Mike" |
| `[call_count]` | System calls DB | "14" |
| `[booked_jobs]` | Booking system | "3" |
| `[feedback_url]` | System-generated | Unique per-customer |
| `[unsubscribe_url]` | System-generated | Unique per-customer |

---

## WHY THIS WORKS

| Principle | Execution |
|-----------|-----------|
| **Social proof in the ask** | The email shows call/job stats upfront — reminds them of value before asking for feedback. |
| **One-click response** | Three giant tappable buttons. Nobody's typing an essay on their phone. |
| **Graded sentiment** | Three options, not two. "Okay" catches the middle ground that "great/awful" misses. |
| **Immediate escalation** | "Not happy" → human within 4 hours. Not 48 hours, not "a team member will review." Four hours. |
| **Trial extension for unhappy** | Shows we'd rather earn the business than lose it. Costs us nothing, builds massive goodwill. |
| **Non-pestering follow-up** | Three touches max, then silence. Respects their inbox. |

---

## IMPLEMENTATION NOTES

**Backend requirements:**
1. Cron job or event scheduler: fire the feedback email at `signup_date + 7 days` at 10:00 AM in the customer's timezone.
2. Track `call_count` and `booked_jobs` from the calls database — pull these at send time, not at signup.
3. The `[feedback_url]` should be a unique tokenized URL (e.g., `branchlive.com/feedback?token=abc123`) that:
   - Logs the response immediately
   - Redirects to the appropriate landing page
   - Prevents duplicate submissions
4. Slack/email alert for "Not happy" responses — must fire within 60 seconds of submission.
5. Google Review link should go directly to the Branch Live Google Business Profile review form.
6. Referral link should be trackable per-customer (for the "free month for both" program).

---

*Last updated: June 2026*
