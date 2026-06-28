import json

with open(r'C:\Users\17173\Projects\branchlive\worker.js', encoding='utf-8') as f:
    c = f.read()

# Read the HTML files
with open(r'C:\Users\17173\Projects\branchlive\dashboard.html', encoding='utf-8') as f:
    dashboard = f.read()
with open(r'C:\Users\17173\Projects\branchlive\signup.html', encoding='utf-8') as f:
    signup = f.read()
with open(r'C:\Users\17173\Projects\branchlive\reset-password.html', encoding='utf-8') as f:
    resetp = f.read()

# Escape for JS backtick template literals
def esc(s):
    return s.replace('\\', '\\\\').replace('`', '\\`').replace('$', '\\$')

d_esc = esc(dashboard)
s_esc = esc(signup)
r_esc = esc(resetp)

# Build the serve functions
serve = f'''
// ── Static Pages ─────────────────────────────────────────────────────
function serveDashboard() {{
  const html = `{d_esc}`;
  return new Response(html, {{ headers: {{ 'Content-Type': 'text/html; charset=utf-8' }} }});
}}
function serveSignup() {{
  const html = `{s_esc}`;
  return new Response(html, {{ headers: {{ 'Content-Type': 'text/html; charset=utf-8' }} }});
}}
function serveResetPassword() {{
  const html = `{r_esc}`;
  return new Response(html, {{ headers: {{ 'Content-Type': 'text/html; charset=utf-8' }} }});
}}
'''

# Add route handling before API routes
old = '''    const url = new URL(request.url);
    
    // Seed demo data endpoint'''

new = '''    const url = new URL(request.url);
    
    // Serve static pages
    if (url.pathname === '/dashboard' || url.pathname === '/') {{
      return serveDashboard();
    }}
    if (url.pathname === '/signup') {{
      return serveSignup();
    }}
    if (url.pathname === '/reset-password') {{
      return serveResetPassword();
    }}
    
    // Seed demo data endpoint'''

c = c.replace(old, new)

# Insert serve functions before Main Request Handler
c = c.replace('// ── Main Request Handler ─────────────────────────────────────────────────',
              serve + '\n// ── Main Request Handler ─────────────────────────────────────────────────')

print(f'Dashboard: {len(d_esc)} chars')
print(f'Signup: {len(s_esc)} chars')
print(f'Reset: {len(r_esc)} chars')

with open(r'C:\Users\17173\Projects\branchlive\worker.js', 'w', encoding='utf-8') as f:
    f.write(c)

print('Done')
