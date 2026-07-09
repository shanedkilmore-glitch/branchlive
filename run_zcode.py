import subprocess, tempfile, os, sys

BRIDGE = "C:/Users/17173/AppData/Local/Programs/ZCode/resources/glm/zcode.cjs"
BRIEF = sys.argv[1] if len(sys.argv) > 1 else "C:/Users/17173/hermit-crab/zcode_task1.txt"
CWD = "C:/Users/17173/Projects/branchlive"
LOG = "C:/Users/17173/Projects/branchlive/zcode_run.log"
TIMEOUT = int(sys.argv[2]) if len(sys.argv) > 2 else 480

brief = open(BRIEF, encoding="utf-8").read()

with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False, encoding="utf-8") as f:
    f.write(brief)
    tmp = f.name

cmd = ["node", BRIDGE, "--prompt", f"@file:{tmp}", "--json", "--cwd", CWD, "--mode", "yolo"]
print(f"Running task {BRIEF} (timeout {TIMEOUT}s)...")
try:
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=TIMEOUT, cwd=CWD)
    out, err = proc.stdout, proc.stderr
    with open(LOG, "w", encoding="utf-8") as lf:
        lf.write(f"EXIT={proc.returncode}\n\n=== STDOUT ===\n{out}\n\n=== STDERR ===\n{err}\n")
    print("EXIT:", proc.returncode)
    print(out[:2500])
    if err.strip(): print("STDERR:", err[:800])
except subprocess.TimeoutExpired as e:
    print(f"TIMEOUT after {TIMEOUT}s — KILLING (stuck)")
    if e.stdout: print("partial:", e.stdout[:1200])
    # kill any lingering node/zcode spawned by this run
    subprocess.run(['powershell','-NoProfile','-Command',
        "Get-CimInstance Win32_Process -Filter \"CommandLine like '%zcode.cjs%'\" | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"],
        capture_output=True, text=True)
finally:
    try: os.unlink(tmp)
    except Exception: pass
