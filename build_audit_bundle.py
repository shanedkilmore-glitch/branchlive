import re, pathlib

ROOT = pathlib.Path(r"C:/Users/17173/Projects/branchlive")
WORKER = ROOT / "worker.js"
ROUTES = ROOT / "wiki" / "routes.md"
OUT = pathlib.Path(r"C:/tmp/site_audit_bundle.txt")

src = WORKER.read_text(encoding="utf-8", errors="replace")
lines = src.splitlines()

# 1) routes map
routes = ROUTES.read_text(encoding="utf-8", errors="replace") if ROUTES.exists() else "(no routes.md)"

# 2) leads mockup design tokens (lines 19965-20010)
tok_start = next((i for i,l in enumerate(lines) if "--bg:#0f1117" in l), None)
tokens = ""
if tok_start is not None:
    tokens = "\n".join(lines[tok_start-3:tok_start+20])

# 3) every portal page handler: signature + first HTML template block
handlers = []
# find async function handle...Htmx or function handle...
for m in re.finditer(r'(async\s+function\s+(handle\w+)\s*\([^)]*\)\s*\{)', src):
    fn = m.group(2)
    start = m.start()
    # grab next 1200 chars to capture the shell template
    chunk = src[start:start+1400]
    handlers.append(f"\n### {fn}\n{chunk[:1200]}")

# 4) also capture the generic portal shell pattern (sidebarNav usage)
shell_pattern = "Generic portal shell used by EVERY /p/* page:\n" + \
    "  const body = `<div class=\"app\">${sidebarNav('X', ctx)}<div class=\"content\">...</div></div>`\n" + \
    "  -> amber-monotone theme, generic left sidebarNav(), NO AI-first language.\n" + \
    "  The NEW leads page (renderColumn3Thread) uses a DIFFERENT shell: dark bg #0f1117,\n" + \
    "  .bl-app grid with .bl-rail (slim 64px icon rail), .bl-topbar 'Branch Live / AI on',\n" + \
    "  ✦ violet (--ai:#b79be0) AI authorship accents, 3-column thread layout.\n" + \
    "  => leads page does NOT visually flow with the rest of the portal."

bundle = f"""# BRANCH LIVE — SITE-WIDE AI-FIRST COHESION AUDIT

## 1) ROUTE MAP (wiki/routes.md)
{routes}

## 2) TARGET DESIGN LANGUAGE (the leads page we just shipped — AI-first)
{tokens}

## 3) CURRENT PORTAL SHELL (what every other page uses today)
{shell_pattern}

## 4) PORTAL PAGE HANDLERS (signatures + first template block — sample of the surface)
{"".join(handlers[:40])}
"""

OUT.write_text(bundle, encoding="utf-8")
print(f"Bundle written: {OUT} ({len(bundle)} chars, {len(handlers)} handlers found)")
