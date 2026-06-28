# Branch Live — Welcome Email
## Sent Immediately After Signup

---

## EMAIL CONFIGURATION

| Field | Value |
|-------|-------|
| **From** | Emma @ Branch Live <emma@branchlive.com> |
| **Subject** | `Emma's ready to answer your phone 🏗️` |
| **Trigger** | On signup form submission |
| **Delay** | Immediate (within 30 seconds) |
| **Format** | HTML + plain-text fallback |

---

## PLAIN-TEXT VERSION

```
Hi [First Name],

Emma's ready. Your AI receptionist is live.

YOUR NUMBER: [AI Phone Number]

Here's what to do next (takes 2 minutes):

1. FORWARD YOUR PHONE
   Forward your business phone to [AI Phone Number].

   • Verizon:  dial *72 + [AI Phone Number]
   • AT&T:     dial *72 + [AI Phone Number]
   • T-Mobile: dial **21*[AI Phone Number]# (no spaces)
   • Other:    check your carrier's call forwarding instructions
                or reply to this email — we'll look it up for you.

2. TEST IT
   Call your business number from a different phone.
   Emma should answer. Say hello — she'll introduce herself.

3. CUSTOMIZE EMMA (optional, 60 seconds)
   Log into your dashboard at branchlive.com/dashboard
   and record a custom greeting, like:

   "Hi, you've reached [Your Business Name].
    Emma will take care of you."

That's it. Emma answers 24/7 from this point forward — even if
you're in the middle of a pour, on a ladder, or sound asleep.

YOUR TRIAL
You have 7 days free, no credit card. After that, it's $29.95/month.
Cancel anytime. We'll check in before your trial ends.

GOT QUESTIONS?
Reply to this email. A real human (not Emma) will get back to you
within a few hours — usually faster.

Welcome aboard,
Emma + the Branch Live Team

P.S. Forward your phone now. Every hour you wait might be a missed
    job lead. Two minutes, and you're covered.
```

---

## HTML VERSION

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Emma's ready to answer your phone</title>
</head>
<body style="margin:0; padding:0; background:#0d1117; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1117; padding:40px 0;">
    <tr>
      <td align="center">

        <!-- Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background:#161b22; border-radius:8px; border:1px solid #30363d; overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 20px; border-bottom:1px solid #21262d;">
              <h1 style="margin:0; font-size:22px; color:#58a6ff; font-weight:600;">
                🏗️ Emma's ready to answer your phone
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:24px 40px; color:#c9d1d9; font-size:15px; line-height:1.7;">

              <p style="margin:0 0 16px;">Hi <strong style="color:#f0f6fc;">[First Name]</strong>,</p>

              <p style="margin:0 0 16px;">Emma's ready. Your AI receptionist is live.</p>

              <!-- Number Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0; background:#0d1117; border:1px solid #30363d; border-radius:6px;">
                <tr>
                  <td style="padding:20px; text-align:center;">
                    <p style="margin:0 0 6px; font-size:13px; color:#8b949e; text-transform:uppercase; letter-spacing:0.5px;">Your AI Receptionist Number</p>
                    <p style="margin:0; font-size:28px; color:#58a6ff; font-weight:700; font-family:'JetBrains Mono', monospace; letter-spacing:1px;">[AI Phone Number]</p>
                  </td>
                </tr>
              </table>

              <h2 style="margin:28px 0 12px; font-size:18px; color:#f0f6fc;">What to do next <span style="color:#8b949e; font-size:14px;">(2 minutes)</span></h2>

              <!-- Step 1 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
                <tr>
                  <td style="width:32px; vertical-align:top; padding-top:2px;">
                    <span style="display:inline-block; width:28px; height:28px; background:#238636; color:#fff; border-radius:50%; text-align:center; line-height:28px; font-weight:700; font-size:14px;">1</span>
                  </td>
                  <td style="vertical-align:top;">
                    <p style="margin:0 0 6px; font-weight:600; color:#f0f6fc;">Forward your phone</p>
                    <p style="margin:0; color:#8b949e; font-size:14px;">
                      Forward your existing business number to <strong style="color:#c9d1d9;">[AI Phone Number]</strong>:
                    </p>
                    <table cellpadding="4" cellspacing="0" style="margin:8px 0;">
                      <tr><td style="color:#8b949e; font-size:13px; padding-right:12px;">Verizon</td><td style="color:#c9d1d9; font-size:13px;">Dial <code style="background:#21262d; padding:2px 6px; border-radius:3px; color:#58a6ff;">*72</code> + [AI Phone Number]</td></tr>
                      <tr><td style="color:#8b949e; font-size:13px; padding-right:12px;">AT&T</td><td style="color:#c9d1d9; font-size:13px;">Dial <code style="background:#21262d; padding:2px 6px; border-radius:3px; color:#58a6ff;">*72</code> + [AI Phone Number]</td></tr>
                      <tr><td style="color:#8b949e; font-size:13px; padding-right:12px;">T-Mobile</td><td style="color:#c9d1d9; font-size:13px;">Dial <code style="background:#21262d; padding:2px 6px; border-radius:3px; color:#58a6ff;">**21*[AI Phone Number]#</code></td></tr>
                    </table>
                    <p style="margin:4px 0 0; font-size:13px; color:#8b949e;">
                      Other carrier? Reply to this email — we'll look it up.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Step 2 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
                <tr>
                  <td style="width:32px; vertical-align:top; padding-top:2px;">
                    <span style="display:inline-block; width:28px; height:28px; background:#238636; color:#fff; border-radius:50%; text-align:center; line-height:28px; font-weight:700; font-size:14px;">2</span>
                  </td>
                  <td style="vertical-align:top;">
                    <p style="margin:0 0 4px; font-weight:600; color:#f0f6fc;">Test it</p>
                    <p style="margin:0; color:#8b949e; font-size:14px;">Call your business number from a different phone. Emma should answer — she'll introduce herself.</p>
                  </td>
                </tr>
              </table>

              <!-- Step 3 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
                <tr>
                  <td style="width:32px; vertical-align:top; padding-top:2px;">
                    <span style="display:inline-block; width:28px; height:28px; background:#238636; color:#fff; border-radius:50%; text-align:center; line-height:28px; font-weight:700; font-size:14px;">3</span>
                  </td>
                  <td style="vertical-align:top;">
                    <p style="margin:0 0 4px; font-weight:600; color:#f0f6fc;">Customize Emma <span style="color:#8b949e; font-size:13px; font-weight:400;">(optional, 60 seconds)</span></p>
                    <p style="margin:0; color:#8b949e; font-size:14px;">Log in and record a greeting like: <em style="color:#c9d1d9;">"Hi, you've reached [Business Name]. Emma will take care of you."</em></p>
                  </td>
                </tr>
              </table>

              <p style="margin:20px 0 0; color:#c9d1d9;">
                That's it. Emma answers 24/7 from this point forward — even if you're mid-pour, on a ladder, or sound asleep.
              </p>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
                <tr>
                  <td align="center">
                    <a href="https://branchlive.com/dashboard" style="display:inline-block; background:#238636; color:#fff; text-decoration:none; padding:14px 36px; border-radius:6px; font-size:16px; font-weight:600;">Go to Dashboard →</a>
                  </td>
                </tr>
              </table>

              <!-- Trial info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0; background:#1a1f2b; border-left:3px solid #58a6ff; border-radius:4px;">
                <tr>
                  <td style="padding:16px 20px; font-size:14px; color:#8b949e;">
                    <strong style="color:#c9d1d9;">Your trial:</strong> 7 days free, no credit card. After that, $29.95/month. Cancel anytime.
                  </td>
                </tr>
              </table>

              <p style="margin:20px 0 0; color:#8b949e; font-size:14px;">
                Questions? Reply to this email. A real human will get back to you within a few hours.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px; border-top:1px solid #21262d; background:#0d1117;">
              <p style="margin:0 0 8px; color:#f0f6fc; font-size:14px;">
                Emma + the Branch Live Team
              </p>
              <p style="margin:0 0 4px; color:#8b949e; font-size:12px;">
                Forward your phone now. Two minutes, and you're covered.
              </p>
              <p style="margin:4px 0 0; color:#484f58; font-size:11px;">
                Branch Live, Dillsburg PA · <a href="[unsubscribe_url]" style="color:#484f58;">Unsubscribe</a>
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

## PERSONALIZATION VARIABLES

| Variable | Source | Example |
|----------|--------|---------|
| `[First Name]` | Signup form | "Mike" |
| `[AI Phone Number]` | System-generated | "(717) 555-0142" |
| `[Business Name]` | Optional signup field | "Kilmore Hardscaping" |
| `[unsubscribe_url]` | System-generated | Unique per-recipient |

---

## WHAT MAKES THIS EMAIL GOOD

| Principle | Execution |
|-----------|-----------|
| **Immediate action** | First line tells them Emma is ready. No preamble. |
| **Visual clarity** | Number is large, centered, easy to read on a phone. |
| **Carrier-specific instructions** | Contractors don't know call forwarding codes. We give them the exact dial string. |
| **2-minute promise** | Sets expectations. Nobody wants a 20-minute setup. |
| **Dark theme** | Matches the dashboard. Feels cohesive and premium. |
| **Real human available** | "Reply to this email" signals there's a team behind Emma. |
| **P.S. creates urgency** | Every hour = potential missed lead. Gets them to act now. |

---

## A/B TESTS TO RUN

1. Subject line: `Emma's ready` vs. `Your AI receptionist is live` vs. `[First Name], your phone is covered`
2. CTA placement: Top vs. Bottom of email
3. Carrier instructions: Present all three vs. "What carrier do you use? Reply and we'll send the code."
4. With/without the P.S.

---

*Last updated: June 2026*
