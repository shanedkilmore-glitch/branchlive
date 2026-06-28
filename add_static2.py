with open(r'C:\Users\17173\Projects\branchlive\worker.js', encoding='utf-8') as f:
    lines = f.readlines()

# Find where first API handler starts
insert_at = 0
for i, line in enumerate(lines):
    if '// 1. POST /api/login' in line:
        insert_at = i
        break

# Read the HTML files
with open(r'C:\Users\17173\Projects\branchlive\dashboard.html', encoding='utf-8') as f:
    dashboard = f.read()
with open(r'C:\Users\17173\Projects\branchlive\signup.html', encoding='utf-8') as f:
    signup = f.read()
with open(r'C:\Users\17173\Projects\branchlive\reset-password.html', encoding='utf-8') as f:
    resetp = f.read()

# Escape for JS template literal
def esc(s):
    s = s.replace('\\', '\\\\')
    s = s.replace('`', '\\`')
    s = s.replace('$', '\\$')
    return s

serve = '// ── Static Pages ──\n'
serve += 'function serveDashboard() {\n'
serve += '  const html = `' + esc(dashboard) + '`;\n'
serve += '  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });\n'
serve += '}\n'
serve += 'function serveSignup() {\n'
serve += '  const html = `' + esc(signup) + '`;\n'
serve += '  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });\n'
serve += '}\n'
serve += 'function serveResetPassword() {\n'
serve += '  const html = `' + esc(resetp) + '`;\n'
serve += '  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });\n'
serve += '}\n\n'

lines.insert(insert_at, serve)

with open(r'C:\Users\17173\Projects\branchlive\worker.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print(f'Serve functions inserted at line {insert_at}')
print(f'Dashboard: {len(dashboard)} chars')
