with open(r'C:\Users\17173\Projects\branchlive\worker.js', encoding='utf-8') as f:
    c = f.read()

old = "if (bufferEnabled) {"
new = """if (bufferEnabled) {
        // Clean up old buffer entries first
        await env.DB.prepare(
          'DELETE FROM blocked_time WHERE user_id = ? AND date = ? AND start_time = ? AND label = ?'
        ).bind(uid, body.date, body.time, 'Buffer').run();"""

c = c.replace(old, new)

with open(r'C:\Users\17173\Projects\branchlive\worker.js', 'w', encoding='utf-8') as f:
    f.write(c)
print('Buffer cleanup added')
