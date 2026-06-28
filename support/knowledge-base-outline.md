# Branch Live — Support Knowledge Base Outline

> **Purpose:** Defines the structure of the Branch Live help center and internal support wiki. Each section maps to customer-facing help articles AND internal agent reference docs. Numbered for easy reference during triage.

---

## 1. Getting Started
### 1.1 Welcome to Branch Live
- What is Branch Live? (AI receptionist overview)
- How Emma works (NLU, voice AI, call handling)
- Quick-start checklist (5 steps to go live)

### 1.2 Account Setup
- Creating your account
- Verifying your email and phone
- Choosing your plan (Monthly vs. Annual)
- Setting up your business profile

### 1.3 Number Selection
- Getting a new Branch Live number
- Selecting a local area code
- Toll-free number options
- Porting your existing number (see Section 5.3)

### 1.4 First Call Test
- How to test Emma before going live
- Test call checklist (greeting, Q&A, booking, transfer)
- Common first-call issues and fixes

---

## 2. Business Profile & AI Training
### 2.1 Business Profile Overview
- What Emma learns from your profile
- Required fields vs. optional fields
- Updating your profile (immediate vs. cached changes)

### 2.2 Services & Pricing
- Adding individual services
- Setting prices, durations, and descriptions
- Package deals and bundled pricing
- Service categories and organization
- Bulk import (CSV upload)

### 2.3 FAQs — Custom Q&A Pairs
- When to add FAQ entries
- Writing effective FAQ questions (natural phrasing)
- Adding keyword variants and synonyms
- FAQ best practices (40+ examples)

### 2.4 Business Hours & Scheduling
- Setting regular business hours
- Multi-location hours
- Lunch breaks and buffer times
- Holiday schedules and overrides

### 2.5 Greetings & Voice
- Welcome message (business hours)
- After-hours message
- Holiday-specific greetings
- Custom audio uploads (MP3)
- Voice accent and speed settings

---

## 3. Call Handling
### 3.1 How Emma Answers Calls
- Call flow diagram (greeting → intent → action)
- What Emma can and cannot do
- Caller experience walkthrough

### 3.2 Call Forwarding
- Forwarding from major carriers (Verizon, AT&T, T-Mobile, Spectrum)
- Forwarding from VoIP providers (RingCentral, Grasshopper, Google Voice, Vonage)
- Forwarding from landlines
- Testing your forwarding setup

### 3.3 Call Routing & Transfers
- Live transfer to your phone
- Transfer to voicemail
- Multi-receptionist routing (round-robin, skills-based)
- Department/extension routing

### 3.4 Call Screening & Spam Protection
- Enabling call screening
- Known-caller bypass lists
- Spam sensitivity settings
- Blocking specific numbers and area codes
- STIR/SHAKEN verification

### 3.5 After-Hours & Emergency Handling
- Default after-hours behavior
- Emergency call forwarding rules
- Weekend vs. weekday settings
- Holiday overrides

---

## 4. Appointments & Scheduling
### 4.1 Appointment Booking
- How Emma books appointments
- Required fields for booking (name, phone, date/time)
- Conflict detection and resolution
- Booking confirmations (email + SMS)

### 4.2 Calendar Integration
- Google Calendar sync
- Outlook/Office 365 sync
- Apple iCal sync
- Two-way sync behavior
- Troubleshooting sync issues

### 4.3 Appointment Management
- Viewing upcoming appointments
- Rescheduling and cancelling
- No-show tracking
- Appointment reminders

---

## 5. Account & Billing
### 5.1 Plans & Pricing
- Monthly plan ($29.95/mo)
- Annual plan ($24.95/mo, billed annually)
- Add-ons (Live Overflow, SMS, extra minutes)
- Plan comparison chart

### 5.2 Billing Management
- Updating payment method
- Changing billing address
- Viewing and downloading invoices
- Understanding your bill (line items)

### 5.3 Number Porting
- Port-in process (LOA, account details, PIN)
- Port-out process
- Porting timelines (3-7 business days)
- Toll-free number porting
- Porting fees (none)

### 5.4 Cancellation & Refunds
- How to cancel
- Refund policy (no prorated refunds)
- Data retention policy (90 days)
- Reactivating a cancelled account

---

## 6. Features & Integrations
### 6.1 SMS / Text Messaging
- SMS availability (beta, Q4 2026 full launch)
- Inbound SMS auto-replies
- Appointment reminders via text
- Missed-call text-back

### 6.2 Call Recording & Transcripts
- Call recording settings (on/off)
- Viewing and searching transcripts
- Downloading recordings
- Privacy and compliance (two-party consent states)

### 6.3 Integrations
- Zapier (5000+ apps)
- Google Calendar
- Stripe (payment collection)
- CRM integrations (HubSpot, Salesforce — coming soon)
- Webhooks and API access

### 6.4 Call Analytics
- Dashboard overview (calls, duration, outcomes)
- Missed call reports
- Peak hour analysis
- Caller sentiment tracking

---

## 7. Troubleshooting
### 7.1 Emma Behavior Issues
- Wrong answers or incorrect information
- Emma not understanding callers
- Emma cutting off or speaking too fast
- Language/accent recognition problems

### 7.2 Call Quality Issues
- Dropped calls
- Audio quality (echo, static, delay)
- One-way audio problems
- Caller ID display issues

### 7.3 Forwarding Issues
- Calls not reaching Emma
- Forwarding loop problems
- Carrier-specific troubleshooting

### 7.4 Dashboard Issues
- Login problems (password reset, 2FA)
- Slow loading or errors
- Mobile browser compatibility
- Settings not saving

### 7.5 Known Issues & Outages
- Current system status (link to status page)
- Recent resolved incidents
- Scheduled maintenance calendar
- How to subscribe to status updates

---

## 8. Security & Compliance
### 8.1 Account Security
- Two-factor authentication (2FA)
- Password requirements
- Session management
- API key management

### 8.2 Data Privacy
- What data Branch Live collects
- Data storage and encryption
- GDPR / CCPA compliance
- Data deletion requests

### 8.3 Call Recording Compliance
- Two-party consent requirements by state
- Enabling/disabling recording notices
- Compliance with HIPAA (not HIPAA-compliant — disclaimer)
- PCI compliance for payments

---

## 9. Advanced Configuration
### 9.1 Custom Intents & Flows
- Creating custom conversation flows
- Conditional routing (by caller number, time, keyword)
- Multi-step information collection

### 9.2 Multi-Location Setup
- Managing multiple business locations
- Location-specific greetings and hours
- Location-based routing

### 9.3 White-Label & Agency
- Agency dashboard for multiple clients
- White-label branding options
- Client management and billing

---

## 10. Reference
### 10.1 Glossary
- Key terms (NLU, STIR/SHAKEN, LOA, porting, etc.)

### 10.2 System Requirements
- Supported browsers
- Phone number formats
- Audio file specifications

### 10.3 API Documentation
- REST API overview
- Authentication
- Endpoint reference
- Rate limits

---

## Article Priority (write order)
| Priority | Section | Reason |
|----------|---------|--------|
| 🔴 P0 | 1.1, 1.4, 2.1, 5.1 | First things every new user needs |
| 🟠 P1 | 2.2, 2.3, 3.1, 3.2, 7.1 | Core daily usage and common issues |
| 🟡 P2 | 3.4, 3.5, 4.1, 5.2, 5.4 | Important but less frequent |
| 🟢 P3 | 6.x, 7.2-7.5, 8.x | Features, advanced troubleshooting, compliance |
| 🔵 P4 | 9.x, 10.x | Advanced config, reference material |
