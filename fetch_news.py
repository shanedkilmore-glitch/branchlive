"""BranchLive News Aggregator — pulls RSS feeds and matches articles to tracked people."""
import sqlite3
import xml.etree.ElementTree as ET
import re
from datetime import datetime, timedelta
from pathlib import Path
import sys

DB_PATH = Path(__file__).parent / "branchlive.db"

# Source list with bias ratings
SOURCES = [
    # CENTER
    {"name": "BBC News", "url": "https://www.bbc.com/news", "bias": "Center",
     "rss": "https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml"},
    {"name": "NPR", "url": "https://www.npr.org/", "bias": "Center",
     "rss": "https://feeds.npr.org/1001/rss.xml"},
    {"name": "The Hill", "url": "https://thehill.com/", "bias": "Center",
     "rss": "https://thehill.com/rss/syndicator/19110"},
    {"name": "PBS NewsHour", "url": "https://www.pbs.org/newshour/", "bias": "Center",
     "rss": "https://www.pbs.org/newshour/feeds/rss/politics"},
    {"name": "Reuters", "url": "https://www.reuters.com/", "bias": "Center",
     "rss": "https://news.google.com/rss/search?q=site:reuters.com+US+politics&hl=en-US&gl=US&ceid=US:en"},

    # LEAN LEFT / LEFT
    {"name": "NYT", "url": "https://www.nytimes.com/", "bias": "Lean Left",
     "rss": "https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml"},
    {"name": "Washington Post", "url": "https://www.washingtonpost.com/", "bias": "Lean Left",
     "rss": "https://feeds.washingtonpost.com/rss/politics"},
    {"name": "CNN", "url": "https://www.cnn.com/", "bias": "Lean Left",
     "rss": "http://rss.cnn.com/rss/cnn_allpolitics.rss"},
    {"name": "Politico", "url": "https://www.politico.com/", "bias": "Lean Left",
     "rss": "https://rss.politico.com/politics-news.xml"},
    {"name": "The Guardian", "url": "https://www.theguardian.com/", "bias": "Left",
     "rss": "https://www.theguardian.com/us-news/rss"},
    {"name": "Vox", "url": "https://www.vox.com/", "bias": "Left",
     "rss": "https://www.vox.com/rss/politics/index.xml"},

    # RIGHT / LEAN RIGHT
    {"name": "Fox News", "url": "https://www.foxnews.com/", "bias": "Lean Right",
     "rss": "https://moxie.foxnews.com/google-publisher/politics.xml"},
    {"name": "Wall Street Journal", "url": "https://www.wsj.com/", "bias": "Lean Right",
     "rss": "https://feeds.a.dj.com/rss/RSSWSJD.xml"},
    {"name": "National Review", "url": "https://www.nationalreview.com/", "bias": "Right",
     "rss": "https://www.nationalreview.com/feed/"},
    {"name": "Washington Examiner", "url": "https://www.washingtonexaminer.com/", "bias": "Lean Right",
     "rss": "https://www.washingtonexaminer.com/feed"},
    {"name": "NY Post", "url": "https://nypost.com/", "bias": "Right",
     "rss": "https://nypost.com/politics/feed/"},
    {"name": "Washington Free Beacon", "url": "https://freebeacon.com/", "bias": "Right",
     "rss": "https://freebeacon.com/feed/"},
    {"name": "The Dispatch", "url": "https://thedispatch.com/", "bias": "Lean Right",
     "rss": "https://thedispatch.com/feed/"},
]

def get_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def fetch_rss(url):
    """Fetch and parse an RSS feed. Returns list of {title, url, published_at}."""
    import urllib.request
    try:
        req = urllib.request.Request(url, headers={
            'User-Agent': 'BranchLive/1.0 (News Aggregator; branchlive.com)'
        })
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read()
        root = ET.fromstring(data)
    except Exception as e:
        print(f"  ⚠ Failed: {e}")
        return []

    articles = []
    # Handle RSS 2.0
    for item in root.iter('item'):
        title_el = item.find('title')
        link_el = item.find('link')
        pub_el = item.find('pubDate')
        desc_el = item.find('description')

        title = (title_el.text or '') if title_el is not None else ''
        link = (link_el.text or '') if link_el is not None else ''
        pub_date = (pub_el.text or '') if pub_el is not None else ''
        description = (desc_el.text or '') if desc_el is not None else ''

        # Clean HTML from description
        desc = re.sub(r'<[^>]+>', '', description).strip()
        if len(desc) > 400:
            desc = desc[:397] + '...'

        if title and link:
            articles.append({
                'title': title.strip(),
                'url': link.strip(),
                'summary': desc,
                'published_at': _parse_date(pub_date),
            })

    # Handle Atom feeds
    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    for entry in root.findall('atom:entry', ns) or root.findall('entry'):
        title_el = entry.find('atom:title', ns) or entry.find('title')
        link_el = entry.find('atom:link', ns) or entry.find('link')
        updated_el = entry.find('atom:updated', ns) or entry.find('updated')
        summary_el = entry.find('atom:summary', ns) or entry.find('summary')

        title = (title_el.text or '') if title_el is not None else ''
        link = ''
        if link_el is not None:
            link = link_el.get('href', '') or (link_el.text or '')
        pub = (updated_el.text or '') if updated_el is not None else ''
        summary = (summary_el.text or '') if summary_el is not None else ''

        if title and link:
            articles.append({
                'title': title.strip(),
                'url': link.strip(),
                'summary': summary.strip()[:400],
                'published_at': _parse_date(pub),
            })

    return articles

def _parse_date(date_str):
    """Try to parse various date formats."""
    if not date_str:
        return datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    formats = [
        '%a, %d %b %Y %H:%M:%S %z',
        '%a, %d %b %Y %H:%M:%S %Z',
        '%Y-%m-%dT%H:%M:%S%z',
        '%Y-%m-%dT%H:%M:%SZ',
        '%Y-%m-%dT%H:%M:%S',
        '%Y-%m-%d',
    ]
    for fmt in formats:
        try:
            dt = datetime.strptime(date_str.strip(), fmt)
            return dt.strftime('%Y-%m-%d %H:%M:%S')
        except (ValueError, AttributeError):
            continue
    return datetime.now().strftime('%Y-%m-%d %H:%M:%S')

def match_people(conn, article_title, article_summary):
    """Find which tracked people are mentioned in an article."""
    people = conn.execute("SELECT id, name FROM people").fetchall()
    matched = []
    text = (article_title + ' ' + article_summary).lower()

    for p in people:
        # Match last name (more reliable than first name)
        last_name = p['name'].split()[-1].lower()
        if len(last_name) > 3 and last_name in text:
            # Avoid false matches (e.g. "Trump" in "Trump Tower" is fine, "Vance" is distinct enough)
            matched.append(p['id'])
            continue

        # Match full name for multi-word names
        full_lower = p['name'].lower()
        if ' ' in full_lower and full_lower in text:
            matched.append(p['id'])

    return matched

def run():
    conn = get_db()
    total_new = 0
    total_matched = 0

    print(f"BranchLive News Aggregator — {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"{'─'*50}")

    for source in SOURCES:
        if not source.get('rss'):
            print(f"  {source['name']}: no RSS feed")
            continue

        print(f"  {source['name']} ({source['bias']})...", end=' ')
        articles = fetch_rss(source['rss'])

        if not articles:
            print("no articles")
            continue

        new_count = 0
        match_count = 0
        for art in articles:
            # Skip if we already have this URL
            existing = conn.execute("SELECT id FROM articles WHERE url = ?", (art['url'],)).fetchone()
            if existing:
                continue

            # Insert article
            try:
                cursor = conn.execute(
                    """INSERT INTO articles (title, url, source, bias, summary, published_at)
                       VALUES (?, ?, ?, ?, ?, ?)""",
                    (art['title'], art['url'], source['name'], source['bias'],
                     art['summary'], art['published_at'])
                )
                article_id = cursor.lastrowid
                new_count += 1

                # Match to people
                matched = match_people(conn, art['title'], art['summary'])
                for person_id in matched:
                    conn.execute(
                        "INSERT OR IGNORE INTO article_people (article_id, person_id) VALUES (?, ?)",
                        (article_id, person_id)
                    )
                    match_count += 1

            except sqlite3.IntegrityError:
                pass  # URL already exists (race condition)
            except Exception as e:
                print(f"\n    ⚠ Error on '{art['title'][:50]}...': {e}")

        total_new += new_count
        total_matched += match_count
        print(f"{new_count} new, {match_count} matched")

    conn.commit()
    conn.close()

    print(f"{'─'*50}")
    print(f"Done: {total_new} new articles, {total_matched} person matches")
    return total_new, total_matched

if __name__ == "__main__":
    run()
