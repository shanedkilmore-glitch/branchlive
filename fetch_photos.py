"""Fetch Wikipedia profile photos for BranchLive people."""
import sqlite3
import urllib.request
import urllib.parse
import json
import os
from pathlib import Path

DB_PATH = Path(__file__).parent / "branchlive.db"
PHOTOS_DIR = Path(__file__).parent / "static" / "photos"
PHOTOS_DIR.mkdir(parents=True, exist_ok=True)

def fetch_photo(name):
    """Fetch Wikipedia page image for a person. Returns local path or None."""
    import time
    # Check cache first
    slug = name.lower().replace(" ", "_").replace(".", "").replace(",", "")
    local_path = PHOTOS_DIR / f"{slug}.jpg"
    if local_path.exists():
        return str(local_path)

    time.sleep(1.5)  # Be polite to Wikipedia

    try:
        # Wikipedia REST API — get page image
        encoded = urllib.parse.quote(name)
        url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{encoded}"
        req = urllib.request.Request(url, headers={
            'User-Agent': 'BranchLive/1.0 (branchlive.com; political directory)'
        })
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())

        thumbnail = data.get('thumbnail', {}).get('source')
        if not thumbnail:
            # Try originalimage
            thumbnail = data.get('originalimage', {}).get('source')

        if thumbnail:
            # Download the image
            img_req = urllib.request.Request(thumbnail, headers={
                'User-Agent': 'BranchLive/1.0'
            })
            with urllib.request.urlopen(img_req, timeout=15) as img_resp:
                with open(local_path, 'wb') as f:
                    f.write(img_resp.read())
            print(f"  ✅ {name}")
            return str(local_path)
        else:
            print(f"  ⚠ {name}: no photo found")

    except Exception as e:
        print(f"  ❌ {name}: {e}")

    return None

def run():
    conn = sqlite3.connect(str(DB_PATH))
    people = conn.execute("SELECT id, name FROM people ORDER BY sort_order").fetchall()
    conn.close()

    print(f"Fetching photos for {len(people)} people...")
    for p in people:
        fetch_photo(p[1])

    print("Done!")

if __name__ == "__main__":
    run()
