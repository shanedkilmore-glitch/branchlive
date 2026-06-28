#!/usr/bin/env python3
"""Branch Live Portal — Flask API + Dashboard + Spreadsheet Knowledge Base"""
import os, json, sqlite3, csv, io, traceback, logging, secrets
try:
    import bcrypt
    _use_bcrypt = True
except ImportError:
    import hashlib
    _use_bcrypt = False
from datetime import datetime, timedelta
from pathlib import Path
from flask import Flask, request, jsonify, session, send_from_directory

logging.basicConfig(level=logging.INFO)
log = logging.getLogger('portal')

HERE = Path(__file__).parent
os.chdir(str(HERE))
DB = HERE / 'portal.db'

def get_env(key, default=''):
    """Read key from .env file"""
    try:
        with open(os.path.expanduser('~/.hermes/.env')) as f:
            for line in f:
                if line.strip().startswith(key + '='):
                    return line.strip().split('=', 1)[1]
    except: pass
    return os.environ.get(key, default)

app = Flask(__name__)

# CORS — allow branchlive.com and localhost to call portal APIs
@app.after_request
def add_cors(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,PATCH,DELETE,OPTIONS'
    return response
app.secret_key = get_env('BRANCHLIVE_SECRET', 'bl-portal-secret-2026')
app.config.update(
    SESSION_COOKIE_SECURE=False,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax',
)

@app.before_request
def check_bearer_token():
    """Accept Bearer token from dashboard JS — map to Flask session."""
    auth = request.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        token = auth[7:]
        # For local dev: if session has matching token, restore user
        if session.get('api_token') == token:
            session.modified = True  # keep session alive
        # For auto-login when session is empty: look up token in session store
        elif 'user_id' not in session:
            # Token stored in session at login — if session was lost, token-only auth won't work
            # For local dev simplicity: accept any Bearer token with a stored user_id in flask session
            pass

def hash_password(pw):
    if _use_bcrypt:
        return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()
    return hashlib.sha256(pw.encode()).hexdigest()

def check_password(pw, stored):
    if _use_bcrypt:
        return bcrypt.checkpw(pw.encode(), stored.encode())
    return hashlib.sha256(pw.encode()).hexdigest() == stored

def init():
    c = sqlite3.connect(str(DB))
    c.executescript('''
        CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, email TEXT UNIQUE, password_hash TEXT, name TEXT, company TEXT, phone TEXT, created_at TEXT);
        CREATE TABLE IF NOT EXISTS leads(id INTEGER PRIMARY KEY, user_id INTEGER, caller_name TEXT, caller_phone TEXT, caller_email TEXT, job_details TEXT, urgency TEXT, status TEXT DEFAULT 'new', transcript TEXT, created_at TEXT, updated_at TEXT);
        CREATE TABLE IF NOT EXISTS call_logs(id INTEGER PRIMARY KEY, user_id INTEGER, lead_id INTEGER, caller_phone TEXT, duration_sec INTEGER, summary TEXT, transcript TEXT, created_at TEXT);
        CREATE TABLE IF NOT EXISTS settings(user_id INTEGER PRIMARY KEY, business_name TEXT, forwarding_number TEXT, welcome_message TEXT, working_hours TEXT, industry TEXT, service_area TEXT, service_description TEXT, notify_sms INTEGER DEFAULT 0, notify_email INTEGER DEFAULT 0, notify_urgent_only INTEGER DEFAULT 0, google_calendar_api_key TEXT DEFAULT '', google_calendar_id TEXT DEFAULT '', buffer_min INTEGER DEFAULT 30, sms_consent INTEGER DEFAULT 0);
        CREATE TABLE IF NOT EXISTS knowledge(id INTEGER PRIMARY KEY, user_id INTEGER, category TEXT, item TEXT, price REAL, notes TEXT, FOREIGN KEY(user_id) REFERENCES users(id));
        CREATE TABLE IF NOT EXISTS subscriptions(user_id INTEGER PRIMARY KEY, stripe_customer_id TEXT, plan TEXT DEFAULT 'free', status TEXT DEFAULT 'trial', trial_start TEXT, trial_end TEXT, created_at TEXT, FOREIGN KEY(user_id) REFERENCES users(id));
        CREATE TABLE IF NOT EXISTS appointments(id INTEGER PRIMARY KEY, user_id INTEGER, title TEXT, customer_name TEXT, customer_phone TEXT, date TEXT, time TEXT, duration_min INTEGER DEFAULT 60, status TEXT DEFAULT 'confirmed', notes TEXT, google_event_id TEXT, created_at TEXT, FOREIGN KEY(user_id) REFERENCES users(id));
        CREATE TABLE IF NOT EXISTS password_resets(id INTEGER PRIMARY KEY, user_id INTEGER, token TEXT UNIQUE, expires_at TEXT, used INTEGER DEFAULT 0, created_at TEXT, FOREIGN KEY(user_id) REFERENCES users(id));
        CREATE TABLE IF NOT EXISTS appointment_types(id INTEGER PRIMARY KEY, user_id INTEGER, name TEXT, duration_min INTEGER DEFAULT 60, color TEXT DEFAULT '#8b5cf6', FOREIGN KEY(user_id) REFERENCES users(id));
        CREATE TABLE IF NOT EXISTS blocked_time(id INTEGER PRIMARY KEY, user_id INTEGER, date TEXT, start_time TEXT, end_time TEXT, label TEXT, FOREIGN KEY(user_id) REFERENCES users(id));
    ''')
    # Migrate: add notification preference columns (safe — ignores duplicates)
    for col in ['notify_sms', 'notify_email', 'notify_urgent_only']:
        try: c.execute(f'ALTER TABLE settings ADD COLUMN {col} INTEGER DEFAULT 0')
        except sqlite3.OperationalError: pass  # column already exists
    # Migrate: Google Calendar integration columns
    for col in ['google_calendar_api_key', 'google_calendar_id']:
        try: c.execute(f"""ALTER TABLE settings ADD COLUMN {col} TEXT DEFAULT ''""")
        except sqlite3.OperationalError: pass  # column already exists
    # Migrate: buffer_min for appointment buffers
    try: c.execute('ALTER TABLE settings ADD COLUMN buffer_min INTEGER DEFAULT 30')
    except sqlite3.OperationalError: pass
    # Migrate: sms_consent for Twilio A2P verification
    try: c.execute('ALTER TABLE settings ADD COLUMN sms_consent INTEGER DEFAULT 0')
    except sqlite3.OperationalError: pass
    # Migrate: appointment_type_id on appointments table
    try: c.execute('ALTER TABLE appointments ADD COLUMN appointment_type_id INTEGER DEFAULT NULL')
    except sqlite3.OperationalError: pass
    demo_pw = hash_password('demo123')
    if c.execute('SELECT COUNT(*) FROM users').fetchone()[0] == 0:
        c.execute('INSERT INTO users VALUES(1,?,?,?,?,?,?)', ('demo@branchlive.com', demo_pw, 'Demo User', 'Demo Contracting', '(717) 555-0100', datetime.now().isoformat()))
        for name, phone, job, urg in [('John Smith','(717) 555-1234','Need patio pavers installed','high'),('Sarah Jones','(717) 555-5678','Retaining wall collapsing — immediate','urgent'),('Mike Wilson','(717) 555-9012','Quote for driveway resealing','medium')]:
            c.execute('INSERT INTO leads VALUES(NULL,1,?,?,?,?,?,?,?,?,?)', (name, phone, 'caller@example.com', job, urg, 'new', '', datetime.now().isoformat(), datetime.now().isoformat()))
        for caller, dur, summary in [('(717) 555-1234',45,'Booked patio estimate for Thursday'),('(717) 555-5678',90,'Discussed retaining wall emergency'),('(717) 555-9012',30,'Provided pricing for driveway')]:
            c.execute('INSERT INTO call_logs VALUES(NULL,1,NULL,?,?,?,?,?)', (caller, dur, summary, '', datetime.now().isoformat()))
        c.execute('INSERT INTO settings VALUES(1,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', ('Demo Contracting','(717) 555-0100','Hi, thanks for calling Demo Contracting!','Mon-Fri 7am-5pm','Hardscape & Masonry','Central PA','Patio pavers, retaining walls, driveways, walkways', 1, 1, 0, '', '', 30, 0))
        for cat, item, price, notes in [
            ('Pavers','Cambridge Cobble','12.50','per sq ft installed'),
            ('Pavers','Techo-Bloc Blu 60','14.75','per sq ft installed'),
            ('Walls','Celtik Wall Block','18.00','per sq ft face'),
            ('Services','Paver Patio Install','2500','starting price — 200 sq ft'),
            ('Services','Retaining Wall','3500','starting price — 30 ft'),
            ('Services','Sealing','0.85','per sq ft'),
        ]:
            c.execute('INSERT INTO knowledge VALUES(NULL,1,?,?,?,?)', (cat, item, price, notes))
    # Demo appointments for calendar testing
    if c.execute('SELECT COUNT(*) FROM appointments WHERE user_id=1').fetchone()[0] == 0:
        c.execute('INSERT INTO appointments VALUES(NULL,1,?,?,?,?,?,?,?,?,?,?,NULL)',
                  ('Site Visit - Patio Estimate', 'John Smith', '(717) 555-1234', '2026-06-28', '10:00', 60, 'confirmed', 'Bring paver samples', '', datetime.now().isoformat()))
        c.execute('INSERT INTO appointments VALUES(NULL,1,?,?,?,?,?,?,?,?,?,?,NULL)',
                  ('Retaining Wall Consult', 'Sarah Jones', '(717) 555-5678', '2026-06-29', '14:00', 90, 'confirmed', 'Emergency follow-up', '', datetime.now().isoformat()))
    # Seed demo appointment types
    if c.execute('SELECT COUNT(*) FROM appointment_types WHERE user_id=1').fetchone()[0] == 0:
        for name, dur, color in [('Estimate', 60, '#8b5cf6'), ('Repair', 30, '#00d4aa'), ('Emergency', 90, '#ef4444')]:
            c.execute('INSERT INTO appointment_types VALUES(NULL,1,?,?,?)', (name, dur, color))
    c.commit(); c.close()
init()

# ── Helpers ──
def api_error(msg, code=400):
    """Return consistent JSON error response."""
    return jsonify({'ok': False, 'error': msg}), code

def db_exec(fn, *args, **kw):
    """Wrap DB operations with error handling."""
    try:
        return fn(*args, **kw)
    except Exception as e:
        log.error(f'DB error: {e}\n{traceback.format_exc()}')
        raise

@app.errorhandler(500)
def handle_500(e):
    log.error(f'500: {e}\n{traceback.format_exc()}')
    return jsonify({'ok': False, 'error': 'Internal server error. Please try again.'}), 500

@app.errorhandler(404)
def handle_404(e):
    return jsonify({'ok': False, 'error': 'Not found'}), 404

# ── Routes ──
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/signup')
def serve_signup():
    return send_from_directory('.', 'signup.html')

@app.route('/dashboard')
def serve_dashboard():
    return send_from_directory('.', 'dashboard.html')

@app.route('/reset-password')
def serve_reset_password():
    return send_from_directory('.', 'reset-password.html')

@app.route('/api/signup', methods=['POST'])
def api_signup():
    """Create account with 30-day free trial. No credit card needed."""
    try:
        d = request.json
        if not d: return api_error('Request body is required')
        email = d.get('email','').strip().lower()
        password = d.get('password','')
        name = d.get('name','').strip()
        company = d.get('company','').strip()
        phone = d.get('phone','').strip()
        sms_consent = 1 if d.get('sms_consent') else 0
        
        if not email or '@' not in email: return api_error('Valid email is required')
        if len(password) < 6: return api_error('Password must be at least 6 characters')
        if not name: return api_error('Your name is required')
        if not company: return api_error('Company name is required')
        
        c = sqlite3.connect(str(DB))
        existing = c.execute('SELECT id FROM users WHERE email=?', (email,)).fetchone()
        if existing:
            return api_error('An account with this email already exists', 409)
        
        pw_hash = hash_password(password)
        now = datetime.now().isoformat()
        from datetime import timedelta
        trial_end = (datetime.now() + timedelta(days=30)).isoformat()
        
        cur = c.cursor()
        cur.execute('INSERT INTO users VALUES(NULL,?,?,?,?,?,?)',
                  (email, pw_hash, name, company, phone or '', now))
        uid = cur.lastrowid
        c.execute('INSERT INTO subscriptions VALUES(?,NULL,?,?,?,?,?)',
                  (uid, 'free', 'trial', now, trial_end, now))
        c.execute('INSERT INTO settings VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                  (uid, company, phone or '', f'Hi, thanks for calling {company}!', 'Mon-Fri 7am-5pm', '', '', '',
                   1, 1, 0, '', '', 30, sms_consent))
        c.commit(); c.close()
        
        log.info(f'Signup: {email} ({company}) — trial until {trial_end[:10]}')
        session.update({'user_id': uid, 'user_name': name})
        return jsonify({'ok': True, 'name': name, 'company': company, 'trial_end': trial_end[:10]})
    except Exception as e:
        log.error(f'Signup error: {e}')
        return api_error('Could not create account. Please try again.', 500)

@app.route('/api/login', methods=['POST'])
def api_login():
    try:
        d = request.json
        if not d or not d.get('email') or not d.get('password'):
            return api_error('Email and password are required')
        pw_h = d.get('password','')
        conn = sqlite3.connect(str(DB))
        row = conn.execute('SELECT * FROM users WHERE email=?', (d.get('email',''),)).fetchone()
        if row and check_password(pw_h, row[2]):
            session.update({'user_id': row[0], 'user_name': row[3]})
            # Return a token for dashboard JS compatibility
            token = secrets.token_urlsafe(32)
            session['api_token'] = token
            return jsonify({'ok': True, 'name': row[3], 'company': row[4], 'token': token})
        return api_error('Invalid credentials', 401)
    except Exception as e:
        log.error(f'Login error: {e}')
        return api_error('Login failed. Please try again.', 500)

@app.route('/api/me')
def api_me():
    try:
        uid = session.get('user_id')
        if not uid: return api_error('Not logged in', 401)
        row = sqlite3.connect(str(DB)).execute('SELECT * FROM users WHERE id=?', (uid,)).fetchone()
        if not row: return api_error('User not found', 401)
        return jsonify({'ok': True, 'name': row[3], 'company': row[4], 'email': row[1]})
    except Exception as e:
        log.error(f'Me error: {e}')
        return api_error('Could not load profile', 500)

@app.route('/api/leads')
def api_leads():
    try:
        uid = session.get('user_id')
        if not uid: return api_error('Not logged in', 401)
        rows = sqlite3.connect(str(DB)).execute('SELECT * FROM leads WHERE user_id=? ORDER BY created_at DESC LIMIT 50', (uid,)).fetchall()
        return jsonify([{'id': r[0], 'caller_name': r[2], 'caller_phone': r[3], 'caller_email': r[4],
                         'job_details': r[5], 'urgency': r[6], 'status': r[7], 'transcript': r[8],
                         'created_at': r[9], 'updated_at': r[10]} for r in rows])
    except Exception as e:
        log.error(f'Leads error: {e}')
        return api_error('Could not load leads', 500)

@app.route('/api/leads/<int:lid>')
def api_lead_detail(lid):
    try:
        uid = session.get('user_id')
        if not uid: return api_error('Not logged in', 401)
        c = sqlite3.connect(str(DB))
        lead = c.execute('SELECT * FROM leads WHERE id=? AND user_id=?', (lid, uid)).fetchone()
        if not lead: return api_error('Lead not found', 404)
        calls = c.execute('SELECT * FROM call_logs WHERE lead_id=? ORDER BY created_at', (lid,)).fetchall()
        c.close()
        return jsonify({
            'id': lead[0], 'caller_name': lead[2], 'caller_phone': lead[3], 'caller_email': lead[4],
            'job_details': lead[5], 'urgency': lead[6], 'status': lead[7], 'transcript': lead[8],
            'created_at': lead[9], 'updated_at': lead[10],
            'calls': [{'id': c[0], 'caller_phone': c[3], 'duration_sec': c[4], 'summary': c[5], 'transcript': c[6], 'created_at': c[7]} for c in calls]
        })
    except Exception as e:
        log.error(f'Lead detail error: {e}')
        return api_error('Could not load lead details', 500)

@app.route('/api/leads/<int:lid>', methods=['PATCH'])
def api_lead_update(lid):
    try:
        uid = session.get('user_id')
        if not uid: return api_error('Not logged in', 401)
        d = request.json
        if not d or 'status' not in d:
            return api_error('Status is required')
        c = sqlite3.connect(str(DB))
        c.execute('UPDATE leads SET status=?, updated_at=? WHERE id=? AND user_id=?',
                  (d.get('status','new'), datetime.now().isoformat(), lid, uid))
        c.commit(); c.close()
        return jsonify({'ok': True})
    except Exception as e:
        log.error(f'Lead update error: {e}')
        return api_error('Could not update lead', 500)

@app.route('/api/email/send', methods=['POST'])
def api_email_send():
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    
    try:
        uid = session.get('user_id')
        if not uid: return api_error('Not logged in', 401)
        d = request.json
        if not d: return api_error('Request body is required')
        to_email = d.get('to', '').strip()
        subject = d.get('subject', 'Re: Your inquiry')
        body = d.get('body', '').strip()
        
        if not to_email: return api_error('Recipient email is required')
        if '@' not in to_email: return api_error('Invalid recipient email address')
        if not body: return api_error('Email body cannot be empty')
        
        smtp_user = 'shanedkilmore@gmail.com'
        smtp_pass = get_env('GMAIL_APP_PASSWORD')
        
        if not smtp_pass:
            log.error('GMAIL_APP_PASSWORD not configured in .env')
            return api_error('Email sending is not configured. Please contact support.', 503)
        
        msg = MIMEMultipart()
        msg['From'] = smtp_user
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))
        
        with smtplib.SMTP('smtp.gmail.com', 587, timeout=15) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_user, to_email, msg.as_string())
        
        log.info(f'Email sent to {to_email}')
        return jsonify({'ok': True, 'message': f'Email sent to {to_email}'})
    except smtplib.SMTPAuthenticationError:
        return api_error('Email authentication failed. Check SMTP credentials.', 500)
    except smtplib.SMTPException as e:
        log.error(f'SMTP error: {e}')
        return api_error('Could not send email — SMTP server error.', 500)
    except Exception as e:
        log.error(f'Email send error: {e}')
        return api_error('Could not send email. Please try again.', 500)

@app.route('/api/calls')
def api_calls():
    try:
        uid = session.get('user_id')
        if not uid: return api_error('Not logged in', 401)
        rows = sqlite3.connect(str(DB)).execute('SELECT * FROM call_logs WHERE user_id=? ORDER BY created_at DESC LIMIT 50', (uid,)).fetchall()
        return jsonify([{'id': r[0], 'caller_phone': r[2], 'duration_sec': r[3], 'summary': r[4], 'created_at': r[5]} for r in rows])
    except Exception as e:
        log.error(f'Calls error: {e}')
        return api_error('Could not load calls', 500)

@app.route('/api/settings', methods=['GET', 'POST'])
def api_settings():
    try:
        uid = session.get('user_id')
        if not uid: return api_error('Not logged in', 401)
        c = sqlite3.connect(str(DB))
        if request.method == 'POST':
            d = request.json
            if not d: return api_error('Request body is required')
            c.execute('INSERT OR REPLACE INTO settings VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',
                      (uid, d.get('business_name',''), d.get('forwarding_number',''), d.get('welcome_message',''),
                       d.get('working_hours',''), d.get('industry',''), d.get('service_area',''), d.get('service_description',''),
                       int(d.get('notify_sms', 0)), int(d.get('notify_email', 0)), int(d.get('notify_urgent_only', 0)),
                       d.get('google_calendar_api_key',''), d.get('google_calendar_id','')))
            c.commit(); c.close()
            return jsonify({'ok': True})
        row = c.execute('SELECT * FROM settings WHERE user_id=?', (uid,)).fetchone(); c.close()
        return jsonify({'business_name': row[1], 'forwarding_number': row[2], 'welcome_message': row[3],
                        'working_hours': row[4], 'industry': row[5], 'service_area': row[6], 'service_description': row[7],
                        'notify_sms': bool(row[8]), 'notify_email': bool(row[9]), 'notify_urgent_only': bool(row[10]),
                        'google_calendar_api_key': row[11] if len(row) > 11 else '',
                        'google_calendar_id': row[12] if len(row) > 12 else ''}) if row else jsonify({})
    except Exception as e:
        log.error(f'Settings error: {e}')
        return api_error('Could not load settings', 500)

# ── Knowledge Base (spreadsheet upload & query) ──
@app.route('/api/knowledge')
def api_knowledge():
    try:
        uid = session.get('user_id')
        if not uid: return api_error('Not logged in', 401)
        rows = sqlite3.connect(str(DB)).execute('SELECT * FROM knowledge WHERE user_id=? ORDER BY category, item', (uid,)).fetchall()
        return jsonify([{'id': r[0], 'category': r[2], 'item': r[3], 'price': r[4], 'notes': r[5]} for r in rows])
    except Exception as e:
        log.error(f'Knowledge error: {e}')
        return api_error('Could not load knowledge base', 500)

@app.route('/api/knowledge/upload', methods=['POST'])
def api_upload():
    try:
        uid = session.get('user_id')
        if not uid: return api_error('Not logged in', 401)
        file = request.files.get('file')
        if not file: return api_error('No file provided')
        if file.filename == '' or not file.filename.lower().endswith('.csv'):
            return api_error('Please upload a .csv file')
        content = file.read().decode('utf-8')
        reader = csv.reader(io.StringIO(content))
        header = next(reader)
        c = sqlite3.connect(str(DB))
        count = 0
        for row in reader:
            if len(row) >= 3:
                cat, item, price = row[0], row[1], row[2]
                notes = row[3] if len(row) > 3 else ''
                try: price = float(price.replace('$','').replace(',',''))
                except: pass
                c.execute('INSERT INTO knowledge VALUES(NULL,?,?,?,?,?)', (uid, cat.strip(), item.strip(), price, notes.strip()))
                count += 1
        c.commit(); c.close()
        log.info(f'CSV uploaded: {count} items by user {uid}')
        return jsonify({'ok': True, 'count': count})
    except UnicodeDecodeError:
        return api_error('Could not read file — make sure it is a valid CSV text file')
    except Exception as e:
        log.error(f'Upload error: {e}')
        return api_error('Could not process file. Check CSV format.', 500)

@app.route('/api/knowledge/add', methods=['POST'])
def api_knowledge_add():
    try:
        uid = session.get('user_id')
        if not uid: return api_error('Not logged in', 401)
        d = request.json
        if not d: return api_error('Request body is required')
        if not d.get('item', '').strip(): return api_error('Item name is required')
        c = sqlite3.connect(str(DB))
        c.execute('INSERT INTO knowledge VALUES(NULL,?,?,?,?,?)', (uid, d.get('category','').strip(), d.get('item','').strip(), d.get('price',0), d.get('notes','').strip()))
        c.commit(); c.close()
        return jsonify({'ok': True})
    except Exception as e:
        log.error(f'Knowledge add error: {e}')
        return api_error('Could not add item', 500)

@app.route('/api/knowledge/<int:kid>', methods=['DELETE'])
def api_knowledge_del(kid):
    try:
        uid = session.get('user_id')
        if not uid: return api_error('Not logged in', 401)
        c = sqlite3.connect(str(DB))
        c.execute('DELETE FROM knowledge WHERE id=? AND user_id=?', (kid, uid))
        c.commit(); c.close()
        return jsonify({'ok': True})
    except Exception as e:
        log.error(f'Knowledge delete error: {e}')
        return api_error('Could not delete item', 500)

# ── AI Query Endpoint — Emma calls this to answer pricing questions ──
@app.route('/api/ai/query', methods=['POST'])
def ai_query():
    """Emma's backend: given a question, search the knowledge base."""
    try:
        d = request.json
        if not d: return api_error('Request body is required')
        q = d.get('q', '').lower()
        uid = d.get('user_id')
        if not uid: return jsonify({'answer': 'No user configured.'})
        rows = sqlite3.connect(str(DB)).execute('SELECT * FROM knowledge WHERE user_id=?', (uid,)).fetchall()
        matches = []
        for r in rows:
            cat, item, price, notes = r[2], r[3], r[4], r[5]
            if q and (q in cat.lower() or q in item.lower() or q in notes.lower()):
                matches.append(f'{item} (${price:.2f} {notes})' if price else f'{item} ({notes})')
        if matches:
            return jsonify({'answer': 'Here\'s what I found: ' + '; '.join(matches[:8])})
        return jsonify({'answer': 'I don\'t have pricing for that yet. Let me take your info and we\'ll get back to you.'})
    except Exception as e:
        log.error(f'AI query error: {e}')
        return jsonify({'answer': 'Sorry, I had trouble looking that up. Could you ask again?'})

@app.route('/api/logout')
def api_logout():
    session.clear()
    return jsonify({'ok': True})

# ── Password Reset ──

def _send_email(to_email, subject, body):
    """Reusable email helper using the same SMTP config as /api/email/send."""
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    smtp_user = 'shanedkilmore@gmail.com'
    smtp_pass = get_env('GMAIL_APP_PASSWORD')
    if not smtp_pass:
        raise RuntimeError('Email not configured')

    msg = MIMEMultipart()
    msg['From'] = smtp_user
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    with smtplib.SMTP('smtp.gmail.com', 587, timeout=15) as server:
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_user, to_email, msg.as_string())

@app.route('/api/forgot-password', methods=['POST'])
def api_forgot_password():
    """Send a password reset email with a one-time token (valid 1 hour)."""
    try:
        d = request.json
        if not d or not d.get('email'):
            return api_error('Email is required')

        email = d['email'].strip().lower()
        c = sqlite3.connect(str(DB))
        user = c.execute('SELECT id, name FROM users WHERE email=?', (email,)).fetchone()
        if not user:
            # Don't reveal whether the email exists — always return success
            c.close()
            return jsonify({'ok': True, 'message': 'If that email is registered, a reset link has been sent.'})

        uid, name = user

        # Expire any existing unused tokens for this user
        c.execute('UPDATE password_resets SET used=1 WHERE user_id=? AND used=0', (uid,))

        token = secrets.token_urlsafe(32)
        from datetime import timedelta
        expires_at = (datetime.now() + timedelta(hours=1)).isoformat()
        now = datetime.now().isoformat()

        c.execute('INSERT INTO password_resets VALUES(NULL,?,?,?,0,?)',
                  (uid, token, expires_at, now))
        c.commit()
        c.close()

        reset_url = f'http://100.83.25.101:8081/reset-password?token={token}'
        subject = 'Branch Live — Password Reset'
        body = (
            f'Hi {name},\n\n'
            f'Someone (hopefully you) requested a password reset for your Branch Live account.\n\n'
            f'Click the link below to choose a new password. This link expires in 1 hour.\n\n'
            f'{reset_url}\n\n'
            f'If you did not request this, you can safely ignore this email.\n\n'
            f'— The Branch Live Team'
        )

        try:
            _send_email(email, subject, body)
            log.info(f'Password reset email sent to {email}')
        except Exception as smtp_err:
            log.error(f'Failed to send reset email to {email}: {smtp_err}')
            return api_error('Could not send reset email. SMTP may not be configured.', 503)

        return jsonify({'ok': True, 'message': 'If that email is registered, a reset link has been sent.'})

    except Exception as e:
        log.error(f'Forgot password error: {e}')
        return api_error('Could not process request. Please try again.', 500)

@app.route('/api/reset-password', methods=['POST'])
def api_reset_password():
    """Accept a reset token and new password."""
    try:
        d = request.json
        if not d: return api_error('Request body is required')
        token = d.get('token', '').strip()
        new_password = d.get('password', '')

        if not token: return api_error('Reset token is required')
        if len(new_password) < 6: return api_error('Password must be at least 6 characters')

        c = sqlite3.connect(str(DB))
        row = c.execute(
            'SELECT id, user_id, expires_at, used FROM password_resets WHERE token=?',
            (token,)
        ).fetchone()

        if not row:
            c.close()
            return api_error('Invalid or expired reset link.', 400)

        rid, uid, expires_at, used = row
        if used:
            c.close()
            return api_error('This reset link has already been used.', 400)

        from datetime import datetime as dt
        if dt.fromisoformat(expires_at) < dt.now():
            c.close()
            return api_error('This reset link has expired. Please request a new one.', 400)

        # Update password
        pw_hash = hash_password(new_password)
        c.execute('UPDATE users SET password_hash=? WHERE id=?', (pw_hash, uid))
        c.execute('UPDATE password_resets SET used=1 WHERE id=?', (rid,))
        c.commit()
        c.close()

        log.info(f'Password reset successful for user {uid}')
        return jsonify({'ok': True, 'message': 'Password has been reset. You may now log in.'})

    except Exception as e:
        log.error(f'Reset password error: {e}')
        return api_error('Could not reset password. Please try again.', 500)

@app.route('/api/calendar')
def api_calendar():
    """List appointments for a date range."""
    try:
        uid = session.get('user_id')
        if not uid: return api_error('Not logged in', 401)
        from_date = request.args.get('from', datetime.now().strftime('%Y-%m-%d'))
        to_date = request.args.get('to', (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d'))
        rows = sqlite3.connect(str(DB)).execute(
            'SELECT a.*, t.color FROM appointments a LEFT JOIN appointment_types t ON a.appointment_type_id=t.id WHERE a.user_id=? AND a.status != ? AND a.date BETWEEN ? AND ? ORDER BY a.date, a.time',
            (uid, 'cancelled', from_date, to_date)).fetchall()
        return jsonify([{'id':r[0], 'title':r[2], 'customer_name':r[3], 'customer_phone':r[4],
                         'date':r[5], 'time':r[6], 'duration_min':r[7], 'status':r[8],
                         'notes':r[9], 'google_event_id':r[10], 'appointment_type_id':r[12],
                         'color': r[13] if len(r) > 13 else None} for r in rows])
    except Exception as e:
        log.error(f'Calendar error: {e}')
        return api_error('Could not load calendar', 500)

@app.route('/api/calendar/add', methods=['POST'])
def api_calendar_add():
    try:
        uid = session.get('user_id')
        if not uid: return api_error('Not logged in', 401)
        d = request.json
        if not d or not d.get('date') or not d.get('time') or not d.get('title'):
            return api_error('Date, time, and title are required')
        c = sqlite3.connect(str(DB))
        c.execute('INSERT INTO appointments VALUES(NULL,?,?,?,?,?,?,?,?,?,?,?,?)',
                  (uid, d.get('title',''), d.get('customer_name',''), d.get('customer_phone',''),
                   d.get('date'), d.get('time'), d.get('duration_min',60),
                   d.get('status','confirmed'), d.get('notes',''), d.get('google_event_id',''),
                   datetime.now().isoformat(), d.get('appointment_type_id')))
        c.commit(); c.close()
        log.info('Appointment: {} on {} at {}'.format(d.get('title'), d.get('date'), d.get('time')))
        return jsonify({'ok': True})
    except Exception as e:
        log.error(f'Calendar add error: {e}')
        return api_error('Could not create appointment', 500)

@app.route('/api/calendar/<int:aid>', methods=['GET', 'PATCH', 'DELETE'])
def api_calendar_single(aid):
    """Get, update, or delete a single appointment."""
    uid = session.get('user_id')
    if not uid: return api_error('Not logged in', 401)
    
    if request.method == 'GET':
        try:
            c = sqlite3.connect(str(DB))
            row = c.execute(
                'SELECT a.*, t.color FROM appointments a LEFT JOIN appointment_types t ON a.appointment_type_id=t.id WHERE a.id=? AND a.user_id=?',
                (aid, uid)).fetchone()
            c.close()
            if not row: return api_error('Appointment not found', 404)
            return jsonify({'id':row[0], 'title':row[2], 'customer_name':row[3], 'customer_phone':row[4],
                           'date':row[5], 'time':row[6], 'duration_min':row[7], 'status':row[8],
                           'notes':row[9], 'google_event_id':row[10], 'appointment_type_id':row[12],
                           'color': row[13] if len(row) > 13 else None})
        except Exception as e:
            log.error(f'Calendar get error: {e}')
            return api_error('Could not load appointment', 500)
    
    elif request.method == 'PATCH':
        try:
            d = request.json
            if not d: return api_error('Request body is required')
            c = sqlite3.connect(str(DB))
            existing = c.execute('SELECT * FROM appointments WHERE id=? AND user_id=?', (aid, uid)).fetchone()
            if not existing:
                c.close()
                return api_error('Appointment not found', 404)
            # Only update fields that are provided (non-destructive PATCH)
            # NULLIF(?, ''): if value is None or empty string → NULL  
            # COALESCE(NULL, column): keeps existing column value
            c.execute('''UPDATE appointments SET 
                title=COALESCE(NULLIF(?, ''), title), 
                customer_name=COALESCE(NULLIF(?, ''), customer_name), 
                customer_phone=COALESCE(NULLIF(?, ''), customer_phone),
                date=COALESCE(NULLIF(?, ''), date), 
                time=COALESCE(NULLIF(?, ''), time), 
                duration_min=COALESCE(?, duration_min), 
                status=COALESCE(NULLIF(?, ''), status), 
                notes=COALESCE(NULLIF(?, ''), notes), 
                google_event_id=COALESCE(NULLIF(?, ''), google_event_id),
                appointment_type_id=COALESCE(?, appointment_type_id)
                WHERE id=? AND user_id=?''',
                      (d.get('title'), d.get('customer_name'), d.get('customer_phone'),
                       d.get('date'), d.get('time'), d.get('duration_min'),
                       d.get('status'), d.get('notes'), d.get('google_event_id'),
                       d.get('appointment_type_id'), aid, uid))
            c.commit(); c.close()
            log.info(f'Appointment updated: {aid}')
            return jsonify({'ok': True})
        except Exception as e:
            log.error(f'Calendar update error: {e}')
            return api_error('Could not update appointment', 500)
    
    elif request.method == 'DELETE':
        try:
            sqlite3.connect(str(DB)).execute('DELETE FROM appointments WHERE id=? AND user_id=?', (aid, uid))
            return jsonify({'ok': True})
        except Exception as e:
            log.error(f'Calendar delete error: {e}')
            return api_error('Could not delete appointment', 500)

# ── Slot-Based Calendar (Emma API) ──
@app.route('/api/calendar/slots')
def api_calendar_slots():
    """Return available time slots for a date — working hours, booked, blocked."""
    try:
        uid = session.get('user_id')
        if not uid: return api_error('Not logged in', 401)
        date = request.args.get('date', datetime.now().strftime('%Y-%m-%d'))
        c = sqlite3.connect(str(DB))
        # Get settings
        row = c.execute('SELECT working_hours, service_description FROM settings WHERE user_id=?', (uid,)).fetchone()
        wh_text = row[0] if row else 'Mon-Fri 7am-5pm'
        # Parse working hours: default 7am-5pm
        wh_start, wh_end = 7, 17
        import re
        m = re.search(r'(\\d+)\\w*[–\\-]\\s*(\\d+)', wh_text)
        if m: wh_start, wh_end = int(m.group(1)), int(m.group(2))
        # Get appointments for this date
        apps = c.execute(
            'SELECT a.*, t.color FROM appointments a LEFT JOIN appointment_types t ON a.appointment_type_id=t.id WHERE a.user_id=? AND a.status != ? AND a.date=? ORDER BY a.time',
            (uid, 'cancelled', date)).fetchall()
        # Get blocked time
        blocks = c.execute('SELECT * FROM blocked_time WHERE user_id=? AND date=?', (uid, date)).fetchall()
        c.close()
        # Compute slots
        buffer_min = 30  # 30 min buffer
        slots = []
        booked_map = {}  # hour -> appointment info
        for a in apps:
            h = int(a[6].split(':')[0]) if a[6] else 0
            for offset in range(0, a[7] or 60, 30):
                bh = h + offset // 60
                bm = (offset % 60) // 30
                key = f'{bh}:{bm*30:02d}'
                booked_map[key] = {'id': a[0], 'title': a[2], 'customer': a[3], 'color': a[13] if len(a) > 13 else None}
                booked_map[f'{bh}:00'] = booked_map.get(f'{bh}:00', booked_map[key])  # also mark the hour
        # Also add buffer before/after
        for a in apps:
            h = int(a[6].split(':')[0]) if a[6] else 0
            dur = a[7] or 60
            # Buffer before
            bh = h
            if bh > wh_start:
                bkey = f'{bh - 1}:30'
                if bkey not in booked_map:
                    booked_map[bkey] = {'id': None, 'title': 'Buffer', 'customer': '', 'color': '#71717a'}
            # Buffer after
            end_h = h + (dur + buffer_min) // 60
            end_m = (dur + buffer_min) % 60
            if end_h < wh_end:
                bkey = f'{end_h}:{end_m:02d}'
                if bkey not in booked_map:
                    booked_map[bkey] = {'id': None, 'title': 'Buffer', 'customer': '', 'color': '#71717a'}

        blocked_map = {}
        for b in blocks:
            sh = int(b[3].split(':')[0])
            eh = int(b[4].split(':')[0]) if b[4] else sh + 1
            for bh in range(sh, eh):
                blocked_map[f'{bh}:00'] = {'id': b[0], 'label': b[5]}

        for h in range(6, 21):  # Always show 6 AM - 8 PM for wider calendar view
            key = f'{h}:00'
            if key in blocked_map:
                slots.append({'time': key, 'available': False, 'blocked': True, 'label': blocked_map[key]['label'], 'block_id': blocked_map[key]['id']})
            elif key in booked_map:
                b = booked_map[key]
                slots.append({'time': key, 'available': False, 'blocked': False, 'appointment': b['title'],
                             'customer': b['customer'], 'color': b.get('color'), 'appointment_id': b['id']})
            else:
                slots.append({'time': key, 'available': True, 'blocked': False, 'label': None})
        # Also add half-hour slots for better granularity
        half_slots = []
        for s in slots:
            half_slots.append(s)
            h_key = s['time']
            hh = int(h_key.split(':')[0])
            half_key = f'{hh}:30'
            if half_key in blocked_map:
                half_slots.append({'time': half_key, 'available': False, 'blocked': True, 'label': blocked_map[half_key]['label'], 'block_id': blocked_map[half_key]['id']})
            elif half_key in booked_map:
                b = booked_map[half_key]
                half_slots.append({'time': half_key, 'available': False, 'blocked': False, 'appointment': b['title'],
                                  'customer': b['customer'], 'color': b.get('color'), 'appointment_id': b['id']})
            else:
                half_slots.append({'time': half_key, 'available': True, 'blocked': False, 'label': None})
        return jsonify({'date': date, 'working_hours': f'{wh_start}:00-{wh_end}:00', 'buffer_min': buffer_min, 'slots': half_slots})
    except Exception as e:
        log.error(f'Slots error: {e}')
        return api_error('Could not load slots', 500)

@app.route('/api/calendar/block', methods=['POST'])
def api_calendar_block():
    """Block personal time on a date."""
    try:
        uid = session.get('user_id')
        if not uid: return api_error('Not logged in', 401)
        d = request.json
        if not d or not d.get('date') or not d.get('start_time'):
            return api_error('Date and start_time are required')
        c = sqlite3.connect(str(DB))
        c.execute('INSERT INTO blocked_time VALUES(NULL,?,?,?,?,?)',
                  (uid, d['date'], d['start_time'], d.get('end_time', ''), d.get('label', 'Blocked')))
        c.commit(); c.close()
        return jsonify({'ok': True})
    except Exception as e:
        log.error(f'Block error: {e}')
        return api_error('Could not block time', 500)

@app.route('/api/calendar/block/<int:bid>', methods=['DELETE'])
def api_calendar_block_del(bid):
    try:
        uid = session.get('user_id')
        if not uid: return api_error('Not logged in', 401)
        sqlite3.connect(str(DB)).execute('DELETE FROM blocked_time WHERE id=? AND user_id=?', (bid, uid))
        return jsonify({'ok': True})
    except Exception as e:
        log.error(f'Block delete error: {e}')
        return api_error('Could not remove block', 500)

@app.route('/api/appointment-types')
def api_appointment_types():
    try:
        uid = session.get('user_id')
        if not uid: return api_error('Not logged in', 401)
        rows = sqlite3.connect(str(DB)).execute(
            'SELECT * FROM appointment_types WHERE user_id=? ORDER BY name', (uid,)).fetchall()
        return jsonify([{'id': r[0], 'name': r[2], 'duration_min': r[3], 'color': r[4]} for r in rows])
    except Exception as e:
        log.error(f'Types error: {e}')
        return api_error('Could not load types', 500)

@app.route('/api/appointment-types', methods=['POST'])
def api_appointment_types_save():
    try:
        uid = session.get('user_id')
        if not uid: return api_error('Not logged in', 401)
        d = request.json
        if not d or not d.get('name'): return api_error('Name is required')
        c = sqlite3.connect(str(DB))
        if d.get('id'):
            c.execute('UPDATE appointment_types SET name=?, duration_min=?, color=? WHERE id=? AND user_id=?',
                      (d['name'], d.get('duration_min', 60), d.get('color', '#8b5cf6'), d['id'], uid))
        else:
            c.execute('INSERT INTO appointment_types VALUES(NULL,?,?,?,?)',
                      (uid, d['name'], d.get('duration_min', 60), d.get('color', '#8b5cf6')))
        c.commit(); c.close()
        return jsonify({'ok': True})
    except Exception as e:
        log.error(f'Type save error: {e}')
        return api_error('Could not save type', 500)

# ── Google Calendar Sync ──
@app.route('/api/calendar/sync', methods=['POST'])
def api_calendar_sync():
    """Sync unsynced appointments to Google Calendar using the user's API key."""
    try:
        uid = session.get('user_id')
        if not uid: return api_error('Not logged in', 401)

        c = sqlite3.connect(str(DB))

        # Get Google Calendar settings
        row = c.execute('SELECT google_calendar_api_key, google_calendar_id FROM settings WHERE user_id=?', (uid,)).fetchone()
        if not row or not row[0]:
            c.close()
            return api_error('Google Calendar API key not configured. Add it in Settings.', 400)

        api_key = row[0]
        calendar_id = row[1] or 'primary'

        # Get all unsynced appointments
        apps = c.execute(
            "SELECT id, title, customer_name, customer_phone, date, time, duration_min, notes "
            "FROM appointments WHERE user_id=? AND (google_event_id IS NULL OR google_event_id = '') "
            "ORDER BY date, time", (uid,)).fetchall()

        if not apps:
            c.close()
            return jsonify({'ok': True, 'synced': 0, 'message': 'No appointments to sync.'})

        import urllib.request
        import urllib.error

        synced = 0
        errors = []

        for app in apps:
            aid, title, cust_name, cust_phone, app_date, app_time, duration, notes = app

            # Build start/end times in RFC 3339
            start_dt = f'{app_date}T{app_time}:00'
            from datetime import timedelta
            try:
                start = datetime.fromisoformat(start_dt)
                end = start + timedelta(minutes=(duration or 60))
            except ValueError:
                errors.append(f'Appointment {aid}: invalid date/time format')
                continue

            event = {
                'summary': title or 'Appointment',
                'description': (
                    f'Customer: {cust_name or "N/A"}\n'
                    f'Phone: {cust_phone or "N/A"}\n'
                    f'{notes or ""}'
                ).strip(),
                'start': {
                    'dateTime': start.isoformat(),
                    'timeZone': 'America/New_York'
                },
                'end': {
                    'dateTime': end.isoformat(),
                    'timeZone': 'America/New_York'
                }
            }

            # Call Google Calendar API
            url = (
                f'https://www.googleapis.com/calendar/v3/calendars/'
                f'{urllib.parse.quote(calendar_id)}/events'
                f'?key={urllib.parse.quote(api_key)}'
            )

            try:
                data = json.dumps(event).encode('utf-8')
                req = urllib.request.Request(
                    url,
                    data=data,
                    headers={'Content-Type': 'application/json'},
                    method='POST'
                )
                with urllib.request.urlopen(req, timeout=15) as resp:
                    result = json.loads(resp.read().decode('utf-8'))
                    event_id = result.get('id', '')
                    if event_id:
                        c.execute(
                            'UPDATE appointments SET google_event_id=? WHERE id=?',
                            (event_id, aid)
                        )
                        synced += 1
                    else:
                        errors.append(f'Appointment {aid}: no event ID in response')
            except urllib.error.HTTPError as e:
                err_body = e.read().decode('utf-8', errors='replace')[:300]
                errors.append(f'Appointment {aid}: HTTP {e.code} — {err_body}')
            except urllib.error.URLError as e:
                errors.append(f'Appointment {aid}: network error — {e.reason}')
            except Exception as e:
                errors.append(f'Appointment {aid}: {str(e)[:120]}')

        c.commit()
        c.close()

        log.info(f'Calendar sync: {synced} synced, {len(errors)} errors for user {uid}')
        return jsonify({
            'ok': True,
            'synced': synced,
            'total': len(apps),
            'errors': errors[:10] if errors else []
        })

    except Exception as e:
        log.error(f'Calendar sync error: {e}\n{traceback.format_exc()}')
        return api_error('Could not sync calendar. Check your API key and try again.', 500)

@app.route('/api/subscription')
def api_subscription():
    """Return trial/subscription status for the dashboard."""
    try:
        uid = session.get('user_id')
        if not uid: return api_error('Not logged in', 401)
        row = sqlite3.connect(str(DB)).execute(
            'SELECT plan, status, trial_start, trial_end, stripe_customer_id FROM subscriptions WHERE user_id=?',
            (uid,)).fetchone()
        if not row:
            return jsonify({'plan': 'free', 'status': 'trial', 'trial_days_left': 0})
        from datetime import datetime as dt
        trial_end = row[3]
        days_left = 0
        if trial_end:
            try:
                remaining = (dt.fromisoformat(trial_end) - dt.now()).days
                days_left = max(0, remaining)
            except: pass
        return jsonify({
            'plan': row[0], 'status': row[1], 
            'trial_start': row[2][:10] if row[2] else None,
            'trial_end': row[3][:10] if row[3] else None,
            'trial_days_left': days_left,
            'has_stripe': bool(row[4])
        })
    except Exception as e:
        log.error(f'Subscription error: {e}')
        return api_error('Could not load subscription', 500)

# ── CSV Export ──
@app.route('/api/leads/export')
def api_leads_export():
    """Return all leads as a downloadable CSV file."""
    try:
        uid = session.get('user_id')
        if not uid: return api_error('Not logged in', 401)
        rows = sqlite3.connect(str(DB)).execute(
            'SELECT caller_name, caller_phone, caller_email, job_details, urgency, status, created_at FROM leads WHERE user_id=? ORDER BY created_at DESC',
            (uid,)).fetchall()
        out = io.StringIO()
        w = csv.writer(out)
        w.writerow(['Name', 'Phone', 'Email', 'Job Details', 'Urgency', 'Status', 'Created'])
        for r in rows:
            w.writerow(r)
        csv_data = out.getvalue()
        from flask import Response
        return Response(
            csv_data,
            mimetype='text/csv',
            headers={'Content-Disposition': 'attachment; filename=leads.csv'}
        )
    except Exception as e:
        log.error(f'Leads export error: {e}')
        return api_error('Could not export leads', 500)

# ── Analytics ──
@app.route('/api/analytics')
def api_analytics():
    """Return analytics data for the overview dashboard."""
    try:
        uid = session.get('user_id')
        if not uid: return api_error('Not logged in', 401)
        c = sqlite3.connect(str(DB))
        today = datetime.now().strftime('%Y-%m-%d')
        seven_days_ago = (datetime.now() - timedelta(days=6)).strftime('%Y-%m-%d')

        # Single-shot counts
        calls_today = c.execute(
            "SELECT COUNT(*) FROM call_logs WHERE user_id=? AND date(created_at)=?", (uid, today)
        ).fetchone()[0]
        leads_today = c.execute(
            "SELECT COUNT(*) FROM leads WHERE user_id=? AND date(created_at)=?", (uid, today)
        ).fetchone()[0]
        total_appts = c.execute(
            "SELECT COUNT(*) FROM appointments WHERE user_id=?", (uid,)
        ).fetchone()[0]

        # Daily 7-day counts for calls
        calls_7d = []
        for i in range(6, -1, -1):
            d = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
            cnt = c.execute(
                "SELECT COUNT(*) FROM call_logs WHERE user_id=? AND date(created_at)=?",
                (uid, d)
            ).fetchone()[0]
            calls_7d.append({'date': d, 'count': cnt})

        # Daily 7-day counts for leads
        leads_7d = []
        for i in range(6, -1, -1):
            d = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
            cnt = c.execute(
                "SELECT COUNT(*) FROM leads WHERE user_id=? AND date(created_at)=?",
                (uid, d)
            ).fetchone()[0]
            leads_7d.append({'date': d, 'count': cnt})

        # Conversion rate: leads that have at least 1 appointment / total leads
        total_leads = c.execute("SELECT COUNT(*) FROM leads WHERE user_id=?", (uid,)).fetchone()[0]
        leads_with_appts = 0
        if total_leads > 0:
            # Count distinct lead_ids referenced in call_logs that also appear in leads
            # Since appointments don't link directly to leads, we look at call_logs where
            # a lead_id exists AND the lead belongs to this user
            leads_with_appts = c.execute("""
                SELECT COUNT(DISTINCT l.id) FROM leads l
                JOIN call_logs cl ON cl.lead_id = l.id
                WHERE l.user_id=?
            """, (uid,)).fetchone()[0]
        conversion = round((leads_with_appts / total_leads * 100), 1) if total_leads > 0 else 0

        # Total calls (all time)
        total_calls = c.execute("SELECT COUNT(*) FROM call_logs WHERE user_id=?", (uid,)).fetchone()[0]

        c.close()
        return jsonify({
            'total_calls_today': calls_today,
            'total_leads_today': leads_today,
            'total_appointments': total_appts,
            'calls_7d': calls_7d,
            'leads_7d': leads_7d,
            'conversion_rate': conversion,
            'total_leads': total_leads,
            'total_calls': total_calls
        })
    except Exception as e:
        log.error(f'Analytics error: {e}')
        return api_error('Could not load analytics', 500)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8081, debug=False)
