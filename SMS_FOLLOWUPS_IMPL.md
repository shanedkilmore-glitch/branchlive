# Implementation Plan: Appointment SMS Follow-ups

This document maps the `sms-followups.md` specification to the exact, existing structure of `worker.js` in the ZCode codebase.

## 1. Database Schema Additions (`initDB`)
**Location:** `worker.js` (`initDB` function, ~line 1489)

1. **Table Creation:**
   Inject the new `appointment_sms_logs` table creation in the `env.DB.batch` array inside `initDB` (a good spot is around line 1585, right after the `appointments` table definition):
   ```javascript
   env.DB.prepare(`CREATE TABLE IF NOT EXISTS appointment_sms_logs (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     user_id INTEGER NOT NULL,
     appointment_id INTEGER NOT NULL,
     customer_phone TEXT NOT NULL,
     type TEXT NOT NULL,
     status TEXT NOT NULL,
     sent_at TEXT,
     message_body TEXT NOT NULL,
     error_message TEXT,
     FOREIGN KEY (user_id) REFERENCES users(id),
     FOREIGN KEY (appointment_id) REFERENCES appointments(id)
   )`),
   ```

2. **Idempotent Column Additions & Indexes:**
   Further down in `initDB` (~line 1746), add the new settings columns and indexes wrapped in `try/catch` for idempotency:
   ```javascript
   try { await env.DB.prepare('ALTER TABLE settings ADD COLUMN sms_followup_enabled INTEGER DEFAULT 0').run(); } catch(e) {}
   try { await env.DB.prepare('ALTER TABLE settings ADD COLUMN sms_reminder_template TEXT DEFAULT NULL').run(); } catch(e) {}
   try { await env.DB.prepare('ALTER TABLE settings ADD COLUMN sms_checkin_template TEXT DEFAULT NULL').run(); } catch(e) {}
   try { await env.DB.prepare('CREATE UNIQUE INDEX IF NOT EXISTS idx_appt_sms_uniq ON appointment_sms_logs(appointment_id, type)').run(); } catch(e) {}
   try { await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_appt_sms_phone ON appointment_sms_logs(user_id, customer_phone)').run(); } catch(e) {}
   ```

## 2. Helper Functions
**Location:** `worker.js` (~line 19250, just above `async scheduled()`)

Define the following helpers (as spec'd, but tailored to the actual worker):
- `compileAppointmentSms(template, params)`
- `async function hasSentLog(env, appointmentId, type)`
- `async function dispatchAndLog(env, uid, appointmentId, phone, type, provider, body)`
- `async function isSmsOptedOut(env, uid, phone)`
- `async function logOptedOut(env, uid, appointmentId, phone)`

*Note: In `dispatchAndLog`, use the existing `sendSms(env, { to, body })` (defined at ~line 13782) to execute the SMS dispatch.*

## 3. Cron Handler Integration
**Location:** `worker.js` (`async scheduled()` handler, ~line 19250)

1. Place the core `async function runAppointmentFollowupsCron(env)` logic right above the `scheduled()` function block.
2. Inside the `scheduled` function itself, invoke the processor:
   ```javascript
   await runAppointmentFollowupsCron(env);
   ```

## 4. Settings Page Integration
**Location:** `worker.js` (Settings HTMX handlers)

1. **HTML Form (`settingsHtmxBody`, ~line 3128):**
   Inject the toggle and template HTML block into the returned string. Ensure you follow the Branch Live escaping rules (no stray backticks that break simpleShell's wrapper, properly escape template variables using `${htmxEsc(s.sms_reminder_template || '')}`).
   
2. **Settings Save (`handleSettingsHtmx`, ~line 3800):**
   Update the UPSERT logic (~line 3834) to include the new columns:
   - Add `sms_followup_enabled, sms_reminder_template, sms_checkin_template` to the `INSERT` clause.
   - Add them to the `ON CONFLICT DO UPDATE SET` clause.
   - In the `.bind()` list, map the new fields:
     ```javascript
     form.get('sms_followup_enabled') ? 1 : 0,
     g('sms_reminder_template') || null,
     g('sms_checkin_template') || null,
     ```

## 5. Lead-Page Widget Integration
**Location:** `worker.js` (Lead Profile HTMX)

1. **Widget Renderer:** Define `async function renderLeadAppointmentFollowupWidget(env, uid, phone)` right above `handleLeadDetailHtmx` (~line 10592).
2. **Widget Invocation:** Inside `handleLeadDetailHtmx` (around ~line 10592), await the rendering:
   ```javascript
   const appointmentSmsWidget = await renderLeadAppointmentFollowupWidget(env, uid, lead.caller_phone);
   ```
3. **Template Injection:** Insert `${appointmentSmsWidget}` into the returned HTML string below the "Contact" card.

## 6. Simplifications & Spec Discrepancies
When migrating this spec to `worker.js`, note the following critical adjustments based on actual codebase state:

1. **SMS Dispatcher:** The spec mentions `dispatchFollowupSms` and Twilio/TextMagic paths. We will exclusively use the existing `sendSms(env, { to, body })` helper defined at ~line 13782.
2. **Phone Normalization:** The spec refers to `normalizePhone()`. The actual function in `worker.js` is `normalizePhoneE164(raw)` (~line 8511).
3. **Opt-Out Handling (`seasonal_followups`):** The spec refers to checking opt-outs in a `seasonal_followups` table. **This table does not exist in `worker.js`.** 
   - *Adjustment:* Rewrite `isSmsOptedOut` to query `appointment_sms_logs` for `status = 'opted_out'` instead of querying `seasonal_followups`.
   ```javascript
   async function isSmsOptedOut(env, uid, phone) {
     const normalized = normalizePhoneE164(phone);
     if (!normalized) return true;
     
     const optOutRow = await env.DB.prepare(
       `SELECT id FROM appointment_sms_logs 
        WHERE user_id = ? AND customer_phone = ? AND status = 'opted_out' 
        LIMIT 1`
     ).bind(uid, normalized).first();
     
     return !!optOutRow;
   }
   ```
