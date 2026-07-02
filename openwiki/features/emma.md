# Emma AI Voice Assistant

## Overview

Emma is the AI receptionist that handles:
- Incoming phone calls
- Call screening and triage
- Appointment scheduling
- Customer Q&A

## Industry Templates

69 pre-configured industry profiles with:
- Custom greeting scripts
- Service-specific questions
- Emergency triage protocols

Example industries:
- Landscaping
- HVAC
- Plumbing
- Electrical
- General Contracting

## Implementation

- Voice processing via Twilio
- Prompt engineering in `INDUSTRY_TEMPLATES` (worker.js)
- Transcripts saved to `call_logs` table
- Follow-up tasks created in `leads`

## Customization

Business owners can:
- Set working hours
- Configure emergency protocols
- Define service offerings
- Customize greeting message