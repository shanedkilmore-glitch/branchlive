# Voice Job Notes Implementation Spec

This spec outlines the complete implementation for the Voice Job Notes feature in `worker.js`.

## 1. DATA MODEL
We will create a new `job_notes` table to cleanly separate dictations from lead core data. This allows multiple notes per lead over time, preserves timestamps, and keeps the `leads` table focused.

**Database Migrations (in `initDB`):**
Add the idempotent migrations in `worker.js`:
```javascript
try { await env.DB.prepare('ALTER TABLE settings ADD COLUMN voice_notes_enabled INTEGER DEFAULT 0').run(); } catch(e) {}
try { await env.DB.prepare("ALTER TABLE settings ADD COLUMN owner_phone TEXT DEFAULT ''").run(); } catch(e) {}

try {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS job_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      lead_id INTEGER NOT NULL,
      author TEXT DEFAULT 'Owner via Emma',
      note_text TEXT NOT NULL,
      recording_url TEXT,
      created_at TEXT NOT NULL
    )
  `).run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_job_notes_user_lead ON job_notes(user_id, lead_id)').run();
} catch(e) {}
```

## 2. OWNER DETECTION & EMMA'S CONVERSATION
To change Emma's behavior for the owner, we will intercept the Vapi `assistant-request` webhook. This allows us to dynamically override the provisioned assistant's system prompt before the call even connects, without affecting regular customer calls.

**Update `handleVapiWebhook`:**
```javascript
async function handleVapiWebhook(request, env) {
  // ... (existing auth and parsing)
  const message = payload.message || payload;
  const type = message.type;

  // 1. DYNAMIC ASSISTANT OVERRIDE FOR OWNERS
  if (type === 'assistant-request') {
    const owner = await resolveVapiOwner(env, message);
    if (!owner) return json({}); // No owner, use default provisioned assistant

    const { settings } = owner;
    if (settings.voice_notes_enabled === 1) {
      const callerPhone = (message.call && message.call.customer && message.call.customer.number) || '';
      // Fallback to forwarding_number if owner_phone is not explicitly set
      const ownerPhone = settings.owner_phone || settings.forwarding_number;

      if (ownerPhone && callerPhone === ownerPhone) {
        // Return a dynamic assistant override for this specific call
        return json({
          assistant: {
            firstMessage: `Hi there, what customer or job do you want to leave a note for?`,
            model: {
              messages: [{
                role: 'system',
                content: "You are Emma, the AI receptionist. The business owner is calling to dictate a job note. Do NOT treat them like a customer. Greet them warmly, ask which customer the note is for, then listen to the note. Confirm when done. If they say never mind, gracefully end the call. When summarizing, explicitly extract 'target_customer_name' and 'note_text' into the structured data."
              }]
            }
          }
        });
      }
    }
    return json({}); // Not the owner, let Vapi use the default customer assistant
  }

  // Only completed calls create leads / call logs.
  if (type !== 'end-of-call-report') {
    return json({ ok: true });
  }
  // ...
```

## 3. NOTE ATTACHMENT
When the call ends (`type === 'end-of-call-report'`), we detect if it was an owner call. If so, we bypass lead creation and attach the dictated note to the identified lead.

**Update `handleVapiWebhook` (End of Call):**
```javascript
    // Inside handleVapiWebhook (after resolving owner):
    const ownerPhone = settings.owner_phone || settings.forwarding_number;
    const isOwner = settings.voice_notes_enabled === 1 && ownerPhone && (lead.callerPhone === ownerPhone);

    const now = nowISO();

    if (isOwner) {
      // Post-hoc text extraction from transcript/analysis
      const targetName = message.analysis?.structuredData?.target_customer_name || '';
      const noteText = message.analysis?.structuredData?.note_text || lead.summary || lead.transcript;
      const recordingUrl = message.artifact?.recordingUrl || '';

      let targetLeadId = null;
      if (targetName) {
        // Search leads by name (case-insensitive partial match)
        const targetLead = await env.DB.prepare(
          "SELECT id FROM leads WHERE user_id = ? AND lower(caller_name) LIKE lower(?) ORDER BY created_at DESC LIMIT 1"
        ).bind(uid, \`%\${targetName.trim()}%\`).first();
        if (targetLead) targetLeadId = targetLead.id;
      }

      if (targetLeadId) {
        await env.DB.prepare(
          "INSERT INTO job_notes (user_id, lead_id, note_text, recording_url, created_at) VALUES (?, ?, ?, ?, ?)"
        ).bind(uid, targetLeadId, noteText, recordingUrl, now).run();
      }

      // Log the dictation call in call_logs so the owner has a record
      await env.DB.prepare(
        'INSERT INTO call_logs VALUES(NULL, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(uid, targetLeadId, lead.callerPhone, message.call?.durationSeconds || 0, 'Job Note Dictation (Owner)', lead.transcript, now).run();

      return json({ ok: true });
    }

    // ... (Existing customer call flow: INSERT INTO leads ...)
```

## 4. LEAD PAGE WIDGET
Render the job notes in the lead detail view. 

**Add `renderJobNotesWidget` function:**
*(Note: Avoided backslash-apostrophes and contractions per the CRITICAL PITFALLS)*

```javascript
async function renderJobNotesWidget(env, uid, leadId) {
  const notes = await env.DB.prepare(
    "SELECT * FROM job_notes WHERE user_id = ? AND lead_id = ? ORDER BY created_at DESC"
  ).bind(uid, leadId).all();

  if (!notes || !notes.results || notes.results.length === 0) return '';

  return `
    <div class="mt-8 border border-[var(--border)] rounded-xl bg-[var(--bg-secondary)] overflow-hidden">
      <div class="px-5 py-4 border-b border-[var(--border)] bg-[var(--bg-tertiary)] flex justify-between items-center">
        <h3 class="text-sm font-semibold text-[var(--text-primary)]">Voice Job Notes</h3>
      </div>
      <div class="p-5 flex flex-col gap-4">
        \${notes.results.map(note => \`
          <div class="p-4 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg">
            <div class="flex justify-between items-start mb-2">
              <span class="text-xs font-medium text-[var(--accent-primary)]">\${htmxEsc(note.author)}</span>
              <span class="text-xs text-[var(--text-secondary)]">\${new Date(note.created_at).toLocaleString()}</span>
            </div>
            <p class="text-sm text-[var(--text-primary)] whitespace-pre-wrap">\${htmxEsc(note.note_text)}</p>
            \${note.recording_url ? \`
              <div class="mt-3">
                <a href="\${htmxEsc(note.recording_url)}" target="_blank" class="text-xs text-[var(--accent-primary)] flex items-center gap-1 hover:underline transition-all">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  Tap to listen
                </a>
              </div>
            \` : ''}
          </div>
        \`).join('')}
      </div>
    </div>
  `;
}
```
*Inject this into `handleLeadDetailHtmx` right after the existing interactions or activity log.*

## 5. SETTINGS
Add a configuration section in `handleSettingsHtmx` to toggle the feature and define the owner cell number.

**Settings Form Snippet:**
```html
<div class="p-6 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl mt-6">
  <h3 class="text-lg font-medium text-[var(--text-primary)] mb-1">Voice Job Notes</h3>
  <p class="text-sm text-[var(--text-secondary)] mb-4">Call your Emma number from your cell phone to quickly dictate notes to a job. Emma will recognize your caller ID.</p>
  
  <div class="flex items-center justify-between mb-4">
    <span class="text-sm text-[var(--text-primary)]">Enable Voice Job Notes</span>
    <label class="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" name="voice_notes_enabled" value="1" class="sr-only peer" \${settings.voice_notes_enabled ? 'checked' : ''}>
      <div class="w-11 h-6 bg-[var(--bg-tertiary)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent-primary)]"></div>
    </label>
  </div>
  
  <div class="mt-4">
    <label class="block text-sm font-medium text-[var(--text-primary)] mb-1">Owner Cell Phone</label>
    <input type="text" name="owner_phone" value="\${htmxEsc(settings.owner_phone || '')}" placeholder="e.g. 555-0199 (Must match exactly how it appears on Caller ID)" class="w-full bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] text-sm rounded-lg p-2.5 focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none">
    <p class="text-xs text-[var(--text-secondary)] mt-1">Leave blank to use your main Forwarding Number.</p>
  </div>
</div>
```
*(Ensure `handleSettingsSave` is updated to extract and persist `voice_notes_enabled` and `owner_phone`).*
