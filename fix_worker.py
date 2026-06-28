import re

with open(r'C:\Users\17173\Projects\branchlive\worker.js', encoding='utf-8') as f:
    c = f.read()

# Replace broken serve functions with redirects
c = re.sub(
    r'function serveDashboard\(\).*?\n\}',
    'function serveDashboard() {\n  return Response.redirect("https://branchlive.com/dashboard", 302);\n}',
    c, flags=re.DOTALL
)

c = re.sub(
    r'function serveSignup\(\).*?\n\}',
    'function serveSignup() {\n  return Response.redirect("https://branchlive.com/signup", 302);\n}',
    c, flags=re.DOTALL
)

c = re.sub(
    r'function serveResetPassword\(\).*?\n\}',
    'function serveResetPassword() {\n  return Response.redirect("https://branchlive.com/reset-password", 302);\n}',
    c, flags=re.DOTALL
)

# Also remove the static file serving route handlers (they're now redirects)
# The routes still call these functions, so no need to change routes

with open(r'C:\Users\17173\Projects\branchlive\worker.js', 'w', encoding='utf-8') as f:
    f.write(c)

print(f'serveDashboard count: {c.count("function serveDashboard")}')
print(f'File size: {len(c)} chars')
print(f'Has redirect: {"Response.redirect" in c}')
