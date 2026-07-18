-- Seed enrichment for 4 demo leads (user_id=1). REAL data only, diverse industries.
-- No AI scores / fabricated chrome. Adds call_logs, job_notes, estimates, invoices, activity_log.

-- ===== 2151 Dmitri Volkov — Men's cut + beard sculpting (barber) =====
INSERT INTO call_logs (user_id, lead_id, caller_phone, duration_sec, summary, transcript, created_at)
VALUES (1, 2151, '+14195550101', 184,
 'Caller booked a men''s cut and beard sculpting for a wedding next Saturday. Wants sharp lines, fade on sides. Asked about walk-in vs appointment — booked appointment.',
 'Emma: Thanks for calling, how can I help?
Dmitri: Need a men''s cut and beard sculpting, got a wedding next Saturday.
Emma: Congrats! We can do sharp lines with a fade on the sides. Want to book an appointment?
Dmitri: Yeah that works better than walk-in. Morning if you have it.
Emma: Saturday 9am is open. I''ll lock that in.
Dmitri: Perfect, see you then.',
 datetime('now','-2 days'));

INSERT INTO job_notes (user_id, lead_id, author, note_text, recording_url, created_at)
VALUES (1, 2151, 'Owner via Emma', 'Dmitri confirmed 9am Saturday. Wants skin fade, not too short on top. Wedding is formal — told him to wear a collar shirt for the neckline. Upsell: beard oil recommended.', NULL, datetime('now','-1 day'));

INSERT INTO estimates (user_id, lead_id, title, items, total, status, created_at)
VALUES (1, 2151, 'Wedding Grooming Package',
 '[{"desc":"Men''s cut + skin fade","qty":1,"rate":45},{"desc":"Beard sculpting","qty":1,"rate":25},{"desc":"Beard oil","qty":1,"rate":18}]',
 88.0, 'approved', datetime('now','-2 days'));

INSERT INTO invoices (user_id, lead_id, estimate_id, invoice_number, items, subtotal, tax, discount, deposit, total, amount_paid, status, issue_date, due_date, terms, notes, paid_at, created_at, updated_at)
VALUES (1, 2151, (SELECT id FROM estimates WHERE lead_id=2151 ORDER BY id DESC LIMIT 1),
 'INV-00042',
 '[{"desc":"Men''s cut + skin fade","qty":1,"rate":45},{"desc":"Beard sculpting","qty":1,"rate":25},{"desc":"Beard oil","qty":1,"rate":18}]',
 88.0, 0.0, 0.0, 0.0, 88.0, 88.0, 'paid', date('now'), date('now','+15 days'), 'net15',
 'Paid in full at appointment.', datetime('now','-1 day'), datetime('now','-1 day'), datetime('now','-1 day'));

INSERT INTO activity_log (user_id, lead_id, entity_type, entity_id, action, detail, created_at)
VALUES (1, 2151, 'call', (SELECT id FROM call_logs WHERE lead_id=2151 ORDER BY id DESC LIMIT 1), 'call_received', 'Wedding grooming consult — booked Sat 9am', datetime('now','-2 days')),
       (1, 2151, 'estimate', (SELECT id FROM estimates WHERE lead_id=2151 ORDER BY id DESC LIMIT 1), 'estimate_approved', 'Wedding Grooming Package $88 approved', datetime('now','-2 days')),
       (1, 2151, 'invoice', (SELECT id FROM invoices WHERE lead_id=2151 ORDER BY id DESC LIMIT 1), 'invoice_paid', 'INV-00042 paid $88', datetime('now','-1 day'));

-- ===== 2153 Maria Gonzalez — Balayage (salon) =====
INSERT INTO call_logs (user_id, lead_id, caller_phone, duration_sec, summary, transcript, created_at)
VALUES (1, 2153, '+14195550102', 242,
 'Maria wants a full-head balayage, going lighter for a July wedding. Has virgin hair, concerned about damage. Booked consultation + strand test first.',
 'Emma: Hi Maria, what are you thinking for your hair?
Maria: I want a balayage, full head, going lighter. I have a wedding in July.
Emma: Beautiful. Is your hair color-treated currently?
Maria: No, it''s virgin. I''m worried about damage though.
Emma: Totally fair — we''ll do a consultation and a strand test first so we know how it lifts.
Maria: That makes me feel better. When can you fit me in?
Emma: I have Thursday at 2pm for the consult.
Maria: Book it.',
 datetime('now','-3 days'));

INSERT INTO job_notes (user_id, lead_id, author, note_text, recording_url, created_at)
VALUES (1, 2153, 'Owner via Emma', 'Maria = virgin hair, wants lift but damage-wary. Strand test Thursday. If it lifts clean, full balayage next week. Quote her $220-280 range after test. Wedding July — time pressure, prioritize.', NULL, datetime('now','-2 days'));

INSERT INTO estimates (user_id, lead_id, title, items, total, status, created_at)
VALUES (1, 2153, 'Balayage Consult + Strand Test',
 '[{"desc":"Consultation","qty":1,"rate":0},{"desc":"Strand test","qty":1,"rate":35},{"desc":"Full balayage (est, after test)","qty":1,"rate":245}]',
 280.0, 'sent', datetime('now','-3 days'));

INSERT INTO activity_log (user_id, lead_id, entity_type, entity_id, action, detail, created_at)
VALUES (1, 2153, 'call', (SELECT id FROM call_logs WHERE lead_id=2153 ORDER BY id DESC LIMIT 1), 'call_received', 'Balayage consult — virgin hair, wedding July', datetime('now','-3 days')),
       (1, 2153, 'estimate', (SELECT id FROM estimates WHERE lead_id=2153 ORDER BY id DESC LIMIT 1), 'estimate_sent', 'Balayage Consult + Strand Test $280 sent', datetime('now','-3 days'));

-- ===== 2156 Priya Patel — Deep clean (cleaning service) =====
INSERT INTO call_logs (user_id, lead_id, caller_phone, duration_sec, summary, transcript, created_at)
VALUES (1, 2156, '+14195550103', 156,
 'Priya needs a deep clean for a 4-bedroom home before family visits next month. Wants baseboards, inside windows, fridge. Quoted flat rate.',
 'Emma: Thanks for calling, what can we help with?
Priya: I need a deep clean, 4-bedroom house, before my family visits.
Emma: Wonderful. Deep clean covers baseboards, inside windows, appliances — fridge included.
Priya: Yes exactly that. How much?
Emma: For a 4-bed, flat rate is $320.
Priya: That works. Can you do next Friday?
Emma: Friday 10am is open.',
 datetime('now','-4 days'));

INSERT INTO job_notes (user_id, lead_id, author, note_text, recording_url, created_at)
VALUES (1, 2156, 'Owner via Emma', 'Priya deep clean 4-bed. Flag: family visit = high standards, do extra attention on guest bath. Bring our own supplies. 4 hrs est. Upsell: quarterly maintenance plan mentioned, she was interested.', NULL, datetime('now','-3 days'));

INSERT INTO estimates (user_id, lead_id, title, items, total, status, created_at)
VALUES (1, 2156, '4-Bedroom Deep Clean',
 '[{"desc":"Deep clean (4 bed, 2.5 bath)","qty":1,"rate":320},{"desc":"Inside windows add-on","qty":1,"rate":40}]',
 360.0, 'approved', datetime('now','-4 days'));

INSERT INTO invoices (user_id, lead_id, estimate_id, invoice_number, items, subtotal, tax, discount, deposit, total, amount_paid, status, issue_date, due_date, terms, notes, paid_at, created_at, updated_at)
VALUES (1, 2156, (SELECT id FROM estimates WHERE lead_id=2156 ORDER BY id DESC LIMIT 1),
 'INV-00043',
 '[{"desc":"Deep clean (4 bed, 2.5 bath)","qty":1,"rate":320},{"desc":"Inside windows add-on","qty":1,"rate":40}]',
 360.0, 0.0, 0.0, 100.0, 360.0, 100.0, 'partial', date('now'), date('now','+15 days'), 'net15',
 'Deposit $100 taken to hold Friday slot. Balance due at service.', NULL, datetime('now','-3 days'), datetime('now','-3 days'));

INSERT INTO activity_log (user_id, lead_id, entity_type, entity_id, action, detail, created_at)
VALUES (1, 2156, 'call', (SELECT id FROM call_logs WHERE lead_id=2156 ORDER BY id DESC LIMIT 1), 'call_received', '4-bed deep clean booked Friday', datetime('now','-4 days')),
       (1, 2156, 'estimate', (SELECT id FROM estimates WHERE lead_id=2156 ORDER BY id DESC LIMIT 1), 'estimate_approved', '4-Bedroom Deep Clean $360 approved', datetime('now','-4 days')),
       (1, 2156, 'invoice', (SELECT id FROM invoices WHERE lead_id=2156 ORDER BY id DESC LIMIT 1), 'invoice_partial', 'INV-00043 deposit $100 taken', datetime('now','-3 days'));

-- ===== 2157 Robert Nguyen — Carpet shampoo (carpet care) =====
INSERT INTO call_logs (user_id, lead_id, caller_phone, duration_sec, summary, transcript, created_at)
VALUES (1, 2157, '+14195550104', 198,
 'Robert wants 3 rooms carpet shampooed, pet stains, hasn''t been done in years. Asked about dry time and pet-safe solution.',
 'Emma: Hi Robert, what do you need?
Robert: Carpet shampoo, three rooms, pet stains. Hasn''t been done in years.
Emma: We use pet-safe enzymatic solution, great for stains. Dry time is about 4-6 hours.
Robert: Pet-safe is important, we have two dogs. How much?
Emma: Three rooms is $180.
Robert: Book it for Tuesday.',
 datetime('now','-5 days'));

INSERT INTO job_notes (user_id, lead_id, author, note_text, recording_url, created_at)
VALUES (1, 2157, 'Owner via Emma', 'Robert 3-room carpet, heavy pet stains, 2 dogs. Use enzymatic pet-safe only. Pre-treat stains 20 min before extraction. Warn: keep dogs off until fully dry (6h). He booked Tuesday.', NULL, datetime('now','-4 days'));

INSERT INTO estimates (user_id, lead_id, title, items, total, status, created_at)
VALUES (1, 2157, '3-Room Carpet Shampoo',
 '[{"desc":"Carpet shampoo (3 rooms)","qty":1,"rate":180},{"desc":"Pet-stain pre-treatment","qty":1,"rate":25}]',
 205.0, 'sent', datetime('now','-5 days'));

INSERT INTO activity_log (user_id, lead_id, entity_type, entity_id, action, detail, created_at)
VALUES (1, 2157, 'call', (SELECT id FROM call_logs WHERE lead_id=2157 ORDER BY id DESC LIMIT 1), 'call_received', '3-room carpet shampoo booked Tuesday', datetime('now','-5 days')),
       (1, 2157, 'estimate', (SELECT id FROM estimates WHERE lead_id=2157 ORDER BY id DESC LIMIT 1), 'estimate_sent', '3-Room Carpet Shampoo $205 sent', datetime('now','-5 days'));
