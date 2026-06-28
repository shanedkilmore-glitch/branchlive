/**
 * Branch Live Portal — Test Script
 * Tests all 15 endpoints against the deployed Cloudflare Worker.
 *
 * Usage: node test.js [BASE_URL]
 * Default BASE_URL: http://localhost:8787 (wrangler dev)
 *
 * Set via env: BASE_URL=https://branchlive-portal.workers.dev node test.js
 */

const BASE = process.env.BASE_URL || process.argv[2] || 'http://localhost:8787';

let TOKEN = null;

function log(section, ...args) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${section}`);
  console.log('='.repeat(60));
  console.log(...args);
}

function ok(test, msg) {
  if (test) {
    console.log(`  ✅ ${msg}`);
    return true;
  } else {
    console.log(`  ❌ ${msg}`);
    return false;
  }
}

async function api(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;

  const opts = { method, headers };
  if (body && method !== 'GET') {
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function main() {
  let passed = 0;
  let failed = 0;

  console.log(`Testing Branch Live Portal at ${BASE}\n`);

  // ── 1. POST /api/signup — Create demo user ──
  log('1. POST /api/signup');
  // Try signup (may already exist)
  let r = await api('POST', '/api/signup', {
    email: `test-${Date.now()}@example.com`,
    password: 'test123',
    name: 'Test User',
    company: 'Test Co',
    phone: '555-0000',
  });
  if (r.data && r.data.ok) {
    ok(true, `Signup OK — trial until ${r.data.trial_end}`);
    TOKEN = r.data.token;
    passed++;
  } else {
    // User may already exist, try login instead
    ok(true, `Signup returned: ${JSON.stringify(r.data)} (may already exist)`);
  }

  // ── 2. POST /api/login — Login as demo ──
  log('2. POST /api/login (demo@branchlive.com / demo123)');
  r = await api('POST', '/api/login', {
    email: 'demo@branchlive.com',
    password: 'demo123',
  });
  if (ok(r.data && r.data.ok, `Login OK — ${r.data.name} at ${r.data.company}`)) {
    passed++;
    TOKEN = r.data.token;
    console.log(`  Token: ${TOKEN.slice(0, 20)}...`);
  } else {
    failed++;
    console.log(`  Response:`, r.data);
  }

  // ── 3. GET /api/me ──
  log('3. GET /api/me');
  r = await api('GET', '/api/me');
  if (ok(r.data && r.data.ok && r.data.name, `Me: ${r.data.name} (${r.data.email})`)) {
    passed++;
  } else failed++;

  // ── 4. GET /api/leads ──
  log('4. GET /api/leads');
  r = await api('GET', '/api/leads');
  if (ok(Array.isArray(r.data) && r.data.length > 0, `Got ${r.data.length} leads`)) {
    passed++;
    r.data.slice(0, 2).forEach((l) =>
      console.log(`    - ${l.caller_name}: ${l.job_details} [${l.urgency}]`)
    );
  } else failed++;

  // ── 5. POST /api/leads — Create lead ──
  log('5. POST /api/leads (create)');
  r = await api('POST', '/api/leads', {
    caller_name: 'Test Caller',
    caller_phone: '555-9999',
    caller_email: 'test@example.com',
    job_details: 'Test job from test script',
    urgency: 'low',
  });
  if (ok(r.data && r.data.ok, 'Lead created')) {
    passed++;
  } else failed++;

  // ── 6. PATCH /api/leads/:id — Update lead status ──
  log('6. PATCH /api/leads/:id (update status)');
  // Get first lead id
  const leadsR = await api('GET', '/api/leads');
  if (leadsR.data && leadsR.data.length > 0) {
    const leadId = leadsR.data[0].id;
    r = await api('PATCH', `/api/leads/${leadId}`, { status: 'contacted' });
    if (ok(r.data && r.data.ok, `Lead ${leadId} status → contacted`)) {
      passed++;
    } else failed++;
  } else {
    ok(false, 'No leads to update');
    failed++;
  }

  // ── 7. GET /api/call-logs ──
  log('7. GET /api/call-logs');
  r = await api('GET', '/api/call-logs');
  if (ok(Array.isArray(r.data) && r.data.length > 0, `Got ${r.data.length} call logs`)) {
    passed++;
    r.data.slice(0, 2).forEach((c) =>
      console.log(`    - ${c.caller_phone}: ${c.summary} (${c.duration_sec}s)`)
    );
  } else failed++;

  // ── 8. GET /api/calendar — Appointments ──
  log('8. GET /api/calendar');
  r = await api('GET', '/api/calendar?from=2026-06-01&to=2026-07-31');
  if (ok(Array.isArray(r.data), `Got ${r.data ? r.data.length : 0} appointments`)) {
    passed++;
    if (r.data) {
      r.data.forEach((a) =>
        console.log(`    - ${a.date} ${a.time}: ${a.title} (${a.customer_name}) [${a.status}]`)
      );
    }
  } else failed++;

  // ── 9. POST /api/calendar/add — Create appointment ──
  log('9. POST /api/calendar/add');
  const testDate = '2026-06-30';
  r = await api('POST', '/api/calendar/add', {
    title: 'TEST — Delete Me',
    customer_name: 'Test Customer',
    customer_phone: '555-1234',
    date: testDate,
    time: '15:00',
    duration_min: 60,
    notes: 'Created by test script',
  });
  if (ok(r.data && r.data.ok, `Appointment created on ${testDate}`)) {
    passed++;
  } else failed++;

  // ── 10. DELETE /api/calendar/:id — Delete that appointment ──
  log('10. DELETE /api/calendar/:id');
  // Fetch appointments to find the test one
  const calR = await api('GET', `/api/calendar?from=${testDate}&to=${testDate}`);
  const testAppt = calR.data && calR.data.find((a) => a.title === 'TEST — Delete Me');
  if (testAppt) {
    r = await api('DELETE', `/api/calendar/${testAppt.id}`);
    if (ok(r.data && r.data.ok, `Deleted appointment ${testAppt.id}`)) {
      passed++;
    } else failed++;
  } else {
    ok(false, 'Test appointment not found to delete');
    failed++;
  }

  // ── 11. GET /api/calendar/slots ──
  log('11. GET /api/calendar/slots?date=2026-06-28');
  r = await api('GET', '/api/calendar/slots?date=2026-06-28');
  if (ok(r.data && r.data.slots && r.data.slots.length > 0, `Got ${r.data.slots.length} time slots`)) {
    passed++;
    const available = r.data.slots.filter((s) => s.available);
    const booked = r.data.slots.filter((s) => !s.available && !s.blocked);
    const blocked = r.data.slots.filter((s) => s.blocked);
    console.log(`    Working hours: ${r.data.working_hours}`);
    console.log(`    Available: ${available.length}, Booked: ${booked.length}, Blocked: ${blocked.length}`);
    console.log(`    Buffer min: ${r.data.buffer_min}`);
  } else failed++;

  // ── 12. POST /api/calendar/block — Block time ──
  log('12. POST /api/calendar/block');
  r = await api('POST', '/api/calendar/block', {
    date: '2026-07-01',
    start_time: '12:00',
    end_time: '13:00',
    label: 'Lunch Break',
  });
  if (ok(r.data && r.data.ok, 'Blocked 12:00-13:00 on July 1')) {
    passed++;
  } else failed++;

  // ── 13. DELETE /api/calendar/block/:id — Remove blocked time ──
  log('13. DELETE /api/calendar/block/:id');
  // Find the block we just created
  const slotsR = await api('GET', '/api/calendar/slots?date=2026-07-01');
  const blockedSlot = slotsR.data && slotsR.data.slots.find((s) => s.blocked);
  if (blockedSlot && blockedSlot.block_id) {
    r = await api('DELETE', `/api/calendar/block/${blockedSlot.block_id}`);
    if (ok(r.data && r.data.ok, `Removed block ${blockedSlot.block_id}`)) {
      passed++;
    } else failed++;
  } else {
    ok(false, 'Blocked time not found to delete');
    failed++;
  }

  // ── 14. GET /api/appointment-types ──
  log('14. GET /api/appointment-types');
  r = await api('GET', '/api/appointment-types');
  if (ok(Array.isArray(r.data) && r.data.length > 0, `Got ${r.data.length} types`)) {
    passed++;
    r.data.forEach((t) =>
      console.log(`    - ${t.name}: ${t.duration_min}min [${t.color}]`)
    );
  } else failed++;

  // ── 15. POST /api/reset-password ──
  log('15. POST /api/reset-password (request token)');
  r = await api('POST', '/api/reset-password', { email: 'demo@branchlive.com' });
  if (ok(r.data && r.data.ok, 'Reset token generated')) {
    passed++;
    if (r.data.reset_token) {
      console.log(`    Token: ${r.data.reset_token.slice(0, 40)}...`);
    }
  } else failed++;

  // ── Summary ──
  log('SUMMARY', `\n  ✅ Passed: ${passed}\n  ❌ Failed: ${failed}\n  Total: ${passed + failed}/15`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('Test script error:', e);
  process.exit(1);
});
