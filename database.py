"""BranchLive — database setup and seed data."""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "branchlive.db"

def get_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS people (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            role TEXT,
            branch TEXT,
            parent_id INTEGER REFERENCES people(id),
            bio TEXT,
            photo_url TEXT,
            status TEXT DEFAULT 'active',
            sort_order INTEGER DEFAULT 0,
            confirmed_date TEXT,
            party TEXT DEFAULT 'Republican',
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS articles (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            url TEXT UNIQUE,
            source TEXT,
            bias TEXT,
            summary TEXT,
            published_at TEXT,
            fetched_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS article_people (
            article_id INTEGER REFERENCES articles(id),
            person_id INTEGER REFERENCES people(id),
            PRIMARY KEY (article_id, person_id)
        );

        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY,
            person_id INTEGER REFERENCES people(id),
            date TEXT NOT NULL,
            description TEXT NOT NULL,
            event_type TEXT DEFAULT 'general'
        );
    """)
    conn.commit()
    return conn

SEED_PEOPLE = [
    # --- Executive Branch ---
    (1, "Donald J. Trump", "47th President of the United States", "Executive", None,
     "45th and 47th President. Republican. America First agenda. Won 2024 election against Kamala Harris.",
     "active", 0, "2025-01-20"),
    (2, "JD Vance", "Vice President", "Executive", 1,
     "Former Senator from Ohio. Author of 'Hillbilly Elegy'. Yale Law graduate.",
     "active", 1, "2025-01-20"),

    # --- Cabinet ---
    (3, "Marco Rubio", "Secretary of State", "Cabinet", 1,
     "Former Senator from Florida. Foreign policy hawk. Cuban-American.",
     "active", 10, "2025-01-21"),
    (4, "Scott Bessent", "Secretary of the Treasury", "Cabinet", 1,
     "Hedge fund manager. Founder of Key Square Group. Economic policy focused on deregulation and growth.",
     "active", 11, "2025-01-27"),
    (5, "Pete Hegseth", "Secretary of Defense", "Cabinet", 1,
     "Former Fox News host. Army National Guard veteran. Focus on military readiness and culture.",
     "active", 12, "2025-01-24"),
    (6, "Pam Bondi", "Attorney General (OUTGOING)", "Cabinet", 1,
     "Former Florida AG. Focused on DOJ reform. Reportedly being replaced.",
     "outgoing", 13, "2025-02-04"),
    (7, "Doug Burgum", "Secretary of the Interior", "Cabinet", 1,
     "Former Governor of North Dakota. Tech entrepreneur. Energy independence focus.",
     "active", 14, "2025-01-30"),
    (8, "Brooke Rollins", "Secretary of Agriculture", "Cabinet", 1,
     "Former Texas policy director. America First Policy Institute CEO. Rural development focus.",
     "active", 15, "2025-02-13"),
    (9, "Howard Lutnick", "Secretary of Commerce", "Cabinet", 1,
     "Cantor Fitzgerald CEO. Longtime Trump ally. Trade and tariff policy.",
     "active", 16, "2025-02-18"),
    (10, "Lori Chavez-DeRemer", "Secretary of Labor", "Cabinet", 1,
     "Former Representative from Oregon. Focus on workforce development and apprenticeship programs.",
     "active", 17, "2025-03-10"),
    (11, "Robert F. Kennedy Jr.", "Secretary of Health & Human Services", "Cabinet", 1,
     "Environmental attorney. Vaccine skeptic. Founder of Children's Health Defense. 'Make America Healthy Again'.",
     "active", 18, "2025-02-13"),
    (12, "Scott Turner", "Secretary of Housing & Urban Development", "Cabinet", 1,
     "Former NFL player. Texas state representative. Opportunity zone expansion focus.",
     "active", 19, "2025-02-04"),
    (13, "Sean Duffy", "Secretary of Transportation", "Cabinet", 1,
     "Former Representative from Wisconsin. Fox Business host. Infrastructure and aviation focus.",
     "active", 20, "2025-01-28"),
    (14, "Chris Wright", "Secretary of Energy", "Cabinet", 1,
     "CEO of Liberty Energy. Fracking pioneer. 'All of the above' energy strategy.",
     "active", 21, "2025-02-03"),
    (15, "Linda McMahon", "Secretary of Education", "Cabinet", 1,
     "Former SBA Administrator. WWE co-founder. School choice and local control focus.",
     "active", 22, "2025-03-03"),
    (16, "Doug Collins", "Secretary of Veterans Affairs", "Cabinet", 1,
     "Former Representative from Georgia. Air Force Reserve chaplain. VA modernization.",
     "active", 23, "2025-02-04"),
    (17, "Kristi Noem", "Secretary of Homeland Security", "Cabinet", 1,
     "Former Governor of South Dakota. Border security hawk. Immigration enforcement priority.",
     "active", 24, "2025-01-25"),

    # --- Key Administration Figures ---
    (18, "Elon Musk", "Senior Advisor / DOGE Lead", "Administration", 1,
     "CEO of Tesla & SpaceX. Leading Department of Government Efficiency (DOGE). Cost-cutting and deregulation mandate.",
     "active", 30, "2025-01-20"),
    (19, "Susie Wiles", "White House Chief of Staff", "Administration", 1,
     "Longtime GOP strategist. First female White House Chief of Staff. Managed 2024 campaign.",
     "active", 31, "2025-01-20"),
    (20, "Tulsi Gabbard", "Director of National Intelligence", "Administration", 1,
     "Former Representative from Hawaii. Army Reserve officer. Shifted from Democrat to Independent to Republican.",
     "active", 32, "2025-02-12"),
    (21, "John Ratcliffe", "CIA Director", "Administration", 1,
     "Former DNI under Trump 45. Former Representative from Texas. Intelligence community reform.",
     "active", 33, "2025-01-23"),
    (22, "Kash Patel", "FBI Director", "Administration", 1,
     "Former DOD chief of staff. Author of 'Government Gangsters'. FBI reform and declassification focus.",
     "active", 34, "2025-02-20"),

    # --- Supreme Court ---
    (23, "John Roberts", "Chief Justice", "Judicial", None,
     "Appointed by George W. Bush (2005). Conservative but has sided with liberals on key cases. Court institutionalist.",
     "active", 50, "2005-09-29"),
    (24, "Clarence Thomas", "Associate Justice", "Judicial", None,
     "Appointed by George H.W. Bush (1991). Longest-serving current justice. Originalist. Conservative anchor.",
     "active", 51, "1991-10-23"),
    (25, "Samuel Alito", "Associate Justice", "Judicial", None,
     "Appointed by George W. Bush (2006). Conservative. Wrote Dobbs opinion overturning Roe v. Wade.",
     "active", 52, "2006-01-31"),
    (26, "Sonia Sotomayor", "Associate Justice", "Judicial", None,
     "Appointed by Barack Obama (2009). Liberal. First Latina justice. Criminal justice reform advocate.",
     "active", 53, "2009-08-08"),
    (27, "Elena Kagan", "Associate Justice", "Judicial", None,
     "Appointed by Barack Obama (2010). Liberal. Former Harvard Law dean. Pragmatic consensus builder.",
     "active", 54, "2010-08-07"),
    (28, "Neil Gorsuch", "Associate Justice", "Judicial", None,
     "Appointed by Trump (2017). Conservative. Textualist. Native American rights advocate (surprise alliance with liberals).",
     "active", 55, "2017-04-10"),
    (29, "Brett Kavanaugh", "Associate Justice", "Judicial", None,
     "Appointed by Trump (2018). Conservative. Contentious confirmation. Administrative law focus.",
     "active", 56, "2018-10-06"),
    (30, "Amy Coney Barrett", "Associate Justice", "Judicial", None,
     "Appointed by Trump (2020). Conservative. Originalist. Youngest justice. Former Scalia clerk.",
     "active", 57, "2020-10-27"),
    (31, "Ketanji Brown Jackson", "Associate Justice", "Judicial", None,
     "Appointed by Joe Biden (2022). Liberal. First Black woman on the Court. Former public defender.",
     "active", 58, "2022-06-30"),

    # --- Opposition Figures ---
    (32, "Chuck Schumer", "Senate Minority Leader", "Opposition", None,
     "Democratic Senator from New York. Senate Minority Leader. Key negotiator on legislation.",
     "active", 70, None, "Democrat"),
    (33, "Hakeem Jeffries", "House Minority Leader", "Opposition", None,
     "Democratic Representative from New York. First Black party leader in Congress. Coalition builder.",
     "active", 71, None, "Democrat"),
    (34, "Barack Obama", "Former President", "Opposition", None,
     "44th President (2009-2017). Democrat. Continues to influence party direction and campaign strategy.",
     "active", 72, None, "Democrat"),
    (35, "Nancy Pelosi", "Speaker Emerita", "Opposition", None,
     "Former Speaker of the House. Democratic Representative from California. Party elder stateswoman.",
     "active", 73, None, "Democrat"),
    (36, "Gavin Newsom", "Governor of California", "Opposition", None,
     "Democratic Governor. National profile. Seen as potential 2028 presidential candidate. Trump antagonist.",
     "active", 74, None, "Democrat"),
]

SEED_EVENTS = [
    # Trump timeline
    (1, "2025-01-20", "Inaugurated as 47th President of the United States"),
    (1, "2025-01-20", "Signed record number of Day 1 executive orders"),
    (1, "2025-04-02", "Announced 'Liberation Day' reciprocal tariffs"),
    # RFK Jr
    (11, "2025-02-13", "Confirmed as HHS Secretary after contentious hearings"),
    (11, "2025-03-15", "Launched MAHA (Make America Healthy Again) Commission"),
    # Elon
    (18, "2025-01-20", "Appointed to lead Department of Government Efficiency (DOGE)"),
    (18, "2025-02-01", "DOGE begins agency audits across federal government"),
    # Supreme Court
    (23, "2025-03-04", "Supreme Court hears major social media regulation case"),
    # Pam Bondi
    (6, "2025-02-04", "Confirmed as Attorney General"),
    (6, "2025-05-01", "Reports emerge of potential replacement as AG"),
]

def seed():
    conn = init_db()
    cur = conn.cursor()

    # Seed people
    cur.execute("SELECT COUNT(*) FROM people")
    if cur.fetchone()[0] == 0:
        for p in SEED_PEOPLE:
            # Standardize: all tuples should have (id, name, role, branch, parent_id, bio, status, sort_order, confirmed_date, party)
            if len(p) == 9:
                # Missing party — default to Republican unless opposition
                party = "Democrat" if p[3] == "Opposition" else "Republican"
                p = p + (party,)
            cur.execute(
                """INSERT INTO people (id, name, role, branch, parent_id, bio, status, sort_order, confirmed_date, party)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                p
            )

    # Seed events
    cur.execute("SELECT COUNT(*) FROM events")
    if cur.fetchone()[0] == 0:
        for e in SEED_EVENTS:
            cur.execute(
                "INSERT INTO events (person_id, date, description, event_type) VALUES (?, ?, ?, ?)",
                (*e, "general")
            )

    conn.commit()
    conn.close()
    print("Database seeded.")

if __name__ == "__main__":
    seed()
