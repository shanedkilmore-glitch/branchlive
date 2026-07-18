-- Seed real back-and-forth message history for the 4 demo leads (user_id=1).
-- Chat-bubble style: direction 'outbound' = Emma/business, 'inbound' = lead.
-- No fabricated AI scores, no "auto-replied" theater. Realistic service-business convo.

-- ===== 2151 Dmitri Volkov — barber (wedding groom) =====
INSERT INTO messages (user_id, lead_id, direction, channel, body, created_at) VALUES
 (1, 2151, 'inbound', 'sms', 'Hey, got your number from the site — can I book a men''s cut and beard sculpt for next Saturday? Got a wedding.', datetime('now','-3 days','-10 hours')),
 (1, 2151, 'outbound', 'sms', 'Hi Dmitri! Congrats on the wedding 🎉 We can do a sharp skin fade with the cut. Saturday 9am open?', datetime('now','-3 days','-9 hours')),
 (1, 2151, 'inbound', 'sms', '9am works. Want it to look clean for photos — not too short on top.', datetime('now','-3 days','-8 hours')),
 (1, 2151, 'outbound', 'sms', 'Perfect — skin fade, length kept on top. I''ll note "formal wedding, wear a collar shirt" for the neckline. Booked for Sat 9am 👍', datetime('now','-3 days','-7 hours')),
 (1, 2151, 'inbound', 'sms', 'Awesome. Should I do anything with the beard beforehand?', datetime('now','-2 days','-3 hours')),
 (1, 2151, 'outbound', 'sms', 'Nothing needed — just arrive as you are. I''ll recommend our beard oil after, keeps it shaped between events.', datetime('now','-2 days','-2 hours'));

-- ===== 2153 Maria Gonzalez — balayage (salon) =====
INSERT INTO messages (user_id, lead_id, direction, channel, body, created_at) VALUES
 (1, 2153, 'inbound', 'sms', 'Hi! I want a balayage, full head, going lighter. Wedding in July. Never colored before though.', datetime('now','-4 days','-6 hours')),
 (1, 2153, 'outbound', 'sms', 'Hi Maria! A balayage will look gorgeous. Since it''s virgin hair we''ll do a consult + strand test first so we know how it lifts — protects it from damage.', datetime('now','-4 days','-5 hours')),
 (1, 2153, 'inbound', 'sms', 'That makes me feel better, I was worried. When can you fit the consult?', datetime('now','-4 days','-4 hours')),
 (1, 2153, 'outbound', 'sms', 'Thursday 2pm? After the strand test we''ll book the full balayage. Quote lands around $220-280 depending on lift.', datetime('now','-4 days','-3 hours')),
 (1, 2153, 'inbound', 'sms', 'Book it. And can you do something for the wedding day itself?', datetime('now','-3 days','-1 hours')),
 (1, 2153, 'outbound', 'sms', 'Yes! We offer a wedding-day style refresh. I''ll add it to your plan after the test. See you Thursday 💇', datetime('now','-3 days','-0 hours'));

-- ===== 2156 Priya Patel — deep clean (cleaning) =====
INSERT INTO messages (user_id, lead_id, direction, channel, body, created_at) VALUES
 (1, 2156, 'inbound', 'email', 'Hello, I need a deep clean for our 4-bedroom home before family visits next month. What''s included?', datetime('now','-5 days','-5 hours')),
 (1, 2156, 'outbound', 'email', 'Hi Priya! Our deep clean covers baseboards, inside windows, appliances (fridge included), and full bath detail. Flat rate $320 for a 4-bed.', datetime('now','-5 days','-4 hours')),
 (1, 2156, 'inbound', 'email', 'That sounds great. Can you do next Friday?', datetime('now','-5 days','-3 hours')),
 (1, 2156, 'outbound', 'email', 'Friday 10am is open. I''ll flag the guest bath for extra attention since family''s visiting. A $100 deposit holds the slot.', datetime('now','-5 days','-2 hours')),
 (1, 2156, 'inbound', 'email', 'Deposit sent. Also — do you do regular cleanings? We might want ongoing.', datetime('now','-3 days','-1 hours')),
 (1, 2156, 'outbound', 'email', 'Got the deposit, thank you! Yes — we offer a quarterly maintenance plan. I''ll leave info on the invoice. See you Friday ✨', datetime('now','-3 days','-0 hours'));

-- ===== 2157 Robert Nguyen — carpet shampoo (carpet care) =====
INSERT INTO messages (user_id, lead_id, direction, channel, body, created_at) VALUES
 (1, 2157, 'inbound', 'sms', 'Need 3 rooms carpet cleaned, pet stains, hasn''t been done in years. You pet-safe?', datetime('now','-6 days','-4 hours')),
 (1, 2157, 'outbound', 'sms', 'Hi Robert! We use a pet-safe enzymatic solution — great on old stains, safe for your two dogs. Dry time ~4-6 hrs.', datetime('now','-6 days','-3 hours')),
 (1, 2157, 'inbound', 'sms', 'Good, that''s important. How much for 3 rooms?', datetime('now','-6 days','-2 hours')),
 (1, 2157, 'outbound', 'sms', 'Three rooms is $180, plus $25 pet-stain pre-treatment. Book Tuesday?', datetime('now','-6 days','-1 hours')),
 (1, 2157, 'inbound', 'sms', 'Book it. Keep the dogs off till dry right?', datetime('now','-5 days','-2 hours')),
 (1, 2157, 'outbound', 'sms', 'Exactly — keep them off ~6 hrs till fully dry. We''ll pre-treat the stains 20 min first. Tuesday it is 🐾', datetime('now','-5 days','-1 hours'));
