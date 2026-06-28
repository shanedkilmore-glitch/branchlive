"""BranchLive — Political Mind Map & News Tracker
Domain: branchlive.com  |  Local: http://localhost:7893
"""
from flask import Flask, jsonify, render_template_string, request, send_from_directory
from pathlib import Path
from database import get_db, seed
import os

PROJECT_DIR = Path(__file__).parent
STATIC_DIR = PROJECT_DIR / "static"
STATIC_DIR.mkdir(exist_ok=True)

app = Flask(__name__)
app.port = 7893

@app.after_request
def no_cache(response):
    if request.path in ('/', '/api/') or request.path.startswith('/api/'):
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    return response

@app.route("/static/<path:filename>")
def static_files(filename):
    return send_from_directory(str(STATIC_DIR), filename)

# ── Pages ───────────────────────────────────────────

@app.route("/")
def index():
    return render_template_string(INDEX_HTML)

@app.route("/person/<int:person_id>")
def person(person_id):
    db = get_db()
    p = db.execute("SELECT * FROM people WHERE id = ?", (person_id,)).fetchone()
    if not p:
        return "Not found", 404

    # Events timeline
    events = db.execute(
        "SELECT * FROM events WHERE person_id = ? ORDER BY date DESC", (person_id,)
    ).fetchall()

    # Articles
    articles = db.execute("""
        SELECT a.* FROM articles a
        JOIN article_people ap ON a.id = ap.article_id
        WHERE ap.person_id = ?
        ORDER BY a.published_at DESC LIMIT 20
    """, (person_id,)).fetchall()

    # Related: people in same branch, or who share articles
    related = db.execute("""
        SELECT DISTINCT p2.id, p2.name, p2.role, p2.branch
        FROM people p1
        JOIN people p2 ON p2.branch = p1.branch
        WHERE p1.id = ? AND p2.id != ? LIMIT 6
    """, (person_id, person_id)).fetchall()

    db.close()
    return render_template_string(PERSON_HTML, person=p, events=events,
                                  articles=articles, related=related)

# ── API ─────────────────────────────────────────────

@app.route("/api/people")
def api_people():
    db = get_db()
    rows = db.execute("SELECT * FROM people ORDER BY sort_order").fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])

@app.route("/api/person/<int:person_id>")
def api_person(person_id):
    db = get_db()
    p = db.execute("SELECT * FROM people WHERE id = ?", (person_id,)).fetchone()
    db.close()
    return jsonify(dict(p)) if p else ("Not found", 404)

@app.route("/api/articles")
def api_articles():
    db = get_db()
    person_id = request.args.get("person_id")
    if person_id:
        rows = db.execute("""
            SELECT a.* FROM articles a
            JOIN article_people ap ON a.id = ap.article_id
            WHERE ap.person_id = ? ORDER BY a.published_at DESC LIMIT 30
        """, (person_id,)).fetchall()
    else:
        rows = db.execute("SELECT * FROM articles ORDER BY published_at DESC LIMIT 30").fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])

# ── HTML Templates ──────────────────────────────────

INDEX_HTML = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>BranchLive — Political Mind Map</title>
<script type="importmap">
{ "imports": { "three": "https://unpkg.com/three@0.160.0/build/three.module.js", "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/" } }
</script>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #080b14; color: #e0e0e0; min-height: 100vh;
}
header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 24px; background: #0d1124; border-bottom: 1px solid #1a2040;
    position: sticky; top:0; z-index: 100;
}
.logo { font-size: 1.4rem; font-weight: 800; color: #00d4aa; letter-spacing: 1px; }
.logo span { color: #58a6ff; }
.view-toggle { display: flex; gap: 4px; background: #111633; border-radius: 8px; padding: 3px; }
.view-btn {
    padding: 8px 16px; border: none; background: transparent; color: #888;
    border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: 600;
    font-family: inherit; transition: all 0.2s;
}
.view-btn.active { background: rgba(0,212,170,0.15); color: #00d4aa; }
.container { max-width: 1200px; margin: 0 auto; padding: 24px; }

/* Legend */
.legend { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
.legend-item { display: flex; align-items: center; gap: 6px; font-size: 0.72rem; color: #888; }
.legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.legend-dot.exec { background: #ff6b6b; }
.legend-dot.cab { background: #58a6ff; }
.legend-dot.admin { background: #bc8cff; }
.legend-dot.judicial { background: #f5a623; }
.legend-dot.opposition { background: #3fb950; }

/* Mind Map */
.mind-map { position: relative; min-height: 500px; }
.map-level { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-bottom: 16px; }
.map-level-label {
    width: 100%; text-align: center; font-size: 0.7rem; color: #666;
    text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px;
}
.person-node {
    background: #141a2e; border: 1px solid #252d45; border-radius: 10px;
    padding: 10px 14px; cursor: pointer; transition: all 0.2s;
    text-decoration: none; color: inherit; display: block;
    min-width: 120px; max-width: 180px; text-align: center;
}
.person-node:hover { border-color: #00d4aa; background: #1a2040; transform: translateY(-2px); box-shadow: 0 4px 20px rgba(0,212,170,0.15); }
.person-node .name { font-size: 0.8rem; font-weight: 600; margin-bottom: 2px; color: #f0f0f0; }
.person-node .role { font-size: 0.65rem; color: #888; line-height: 1.3; }
.person-node .status-tag {
    display: inline-block; font-size: 0.55rem; padding: 1px 6px; border-radius: 8px;
    margin-top: 4px; font-weight: 600;
}
.tag-active { background: rgba(0,212,170,0.1); color: #00d4aa; }
.tag-outgoing { background: rgba(245,166,35,0.15); color: #f5a623; }
.tag-dem { border-left: 3px solid #3fb950; }
.tag-gop { border-left: 3px solid #ff6b6b; }

/* Trump center node */
.center-node {
    background: linear-gradient(135deg, #1a1040, #0d1124); border: 2px solid #ff6b6b;
    border-radius: 16px; padding: 20px 30px; text-align: center; display: inline-block;
    margin: 0 auto 24px; cursor: pointer; transition: all 0.3s; text-decoration: none; color: inherit;
}
.center-node:hover { border-color: #ff4444; box-shadow: 0 0 30px rgba(255,107,107,0.2); }
.center-node .name { font-size: 1.3rem; font-weight: 800; color: #ff6b6b; }
.center-node .role { font-size: 0.75rem; color: #aaa; margin-top: 2px; }

/* Connectors (CSS pseudo-lines) */
.connector { text-align: center; color: #252d45; font-size: 0.6rem; margin: 4px 0; }

/* Person page */
.person-header {
    display: flex; align-items: flex-start; gap: 20px; margin-bottom: 30px;
    padding-bottom: 20px; border-bottom: 1px solid #1a2040;
}
.person-avatar {
    width: 80px; height: 80px; border-radius: 50%; background: #141a2e;
    border: 2px solid #252d45; display: flex; align-items: center;
    justify-content: center; font-size: 2rem; flex-shrink: 0;
}
.person-info h1 { font-size: 1.6rem; margin-bottom: 4px; }
.person-info .role { color: #888; font-size: 0.9rem; margin-bottom: 8px; }
.bio { font-size: 0.85rem; color: #bbb; line-height: 1.6; max-width: 700px; }
.back-link { color: #58a6ff; text-decoration: none; font-size: 0.8rem; margin-bottom: 16px; display: inline-block; }

/* Cards */
.card {
    background: #111633; border: 1px solid #1a2040; border-radius: 12px;
    padding: 16px; margin-bottom: 16px;
}
.card h2 { font-size: 0.8rem; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }

/* Timeline */
.timeline-item {
    display: flex; gap: 12px; padding: 8px 0; border-bottom: 1px solid #1a2040;
    font-size: 0.82rem;
}
.timeline-date { color: #58a6ff; font-weight: 600; min-width: 85px; font-size: 0.75rem; }
.timeline-desc { color: #ccc; }

/* Article */
.article-item {
    padding: 12px 0; border-bottom: 1px solid #1a2040;
}
.article-item:last-child { border-bottom: none; }
.article-title { font-size: 0.9rem; font-weight: 600; color: #f0f0f0; margin-bottom: 4px; }
.article-meta { font-size: 0.7rem; color: #888; display: flex; gap: 10px; align-items: center; }
.bias-tag {
    font-size: 0.6rem; padding: 2px 6px; border-radius: 4px; font-weight: 600;
}
.bias-center { background: rgba(0,212,170,0.15); color: #00d4aa; }
.bias-left { background: rgba(63,185,80,0.15); color: #3fb950; }
.bias-right { background: rgba(245,166,35,0.15); color: #f5a623; }
.article-summary { font-size: 0.78rem; color: #aaa; margin-top: 4px; line-height: 1.4; }

/* Related */
.related-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.related-card {
    background: #141a2e; border: 1px solid #252d45; border-radius: 8px;
    padding: 10px 14px; font-size: 0.78rem; text-decoration: none; color: #ddd;
    transition: all 0.2s;
}
.related-card:hover { border-color: #58a6ff; }

/* Responsive */
@media (max-width: 768px) {
    .container { padding: 12px; }
    .person-node { min-width: 90px; max-width: 140px; font-size: 0.7rem; }
    .person-header { flex-direction: column; }
}
</style>
</head>
<body>

<header>
    <div style="display:flex;align-items:center;gap:10px;">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="6" cy="16" r="5" fill="#ff6b6b" opacity="0.8"/>
            <circle cx="16" cy="8" r="4" fill="#58a6ff" opacity="0.8"/>
            <circle cx="26" cy="16" r="3.5" fill="#00d4aa" opacity="0.8"/>
            <circle cx="16" cy="22" r="3" fill="#f5a623" opacity="0.8"/>
            <line x1="10" y1="14" x2="13" y2="10" stroke="#252d45" stroke-width="1"/>
            <line x1="19" y1="10" x2="23" y2="14" stroke="#252d45" stroke-width="1"/>
            <line x1="18" y1="20" x2="19" y2="16" stroke="#252d45" stroke-width="1"/>
            <line x1="14" y1="20" x2="13" y2="16" stroke="#252d45" stroke-width="1"/>
        </svg>
        <div class="logo">Branch<span>Live</span></div>
    </div>
    <nav class="view-toggle">
        <button class="view-btn active" onclick="switchView('3d')">🌐 3D</button>
        <button class="view-btn" onclick="switchView('map')">🗺 Flat</button>
        <button class="view-btn" onclick="switchView('list')">📋 List</button>
    </nav>
</header>

<!-- 3D Canvas -->
<div id="view-3d" style="position:fixed;top:0;left:0;width:100%;height:100%;z-index:1;"></div>

<!-- Detail Panel (slides up when clicking a node) -->
<div id="detailPanel" style="position:fixed;bottom:-400px;left:50%;transform:translateX(-50%);width:90%;max-width:500px;background:#111633;border:1px solid #00d4aa;border-radius:16px 16px 0 0;padding:20px;z-index:10;transition:bottom 0.4s ease;box-shadow:0 -10px 40px rgba(0,212,170,0.2);">
    <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px;">
        <div>
            <h2 id="detailName" style="font-size:1.2rem;margin:0;"></h2>
            <div id="detailRole" style="color:#888;font-size:0.8rem;margin-top:2px;"></div>
        </div>
        <button onclick="closeDetail()" style="background:none;border:none;color:#888;font-size:1.5rem;cursor:pointer;padding:0 8px;">×</button>
    </div>
    <div id="detailBio" style="font-size:0.8rem;color:#bbb;line-height:1.5;margin-bottom:12px;"></div>
    <div id="detailArticles" style="font-size:0.75rem;color:#888;margin-bottom:12px;"></div>
    <a id="detailLink" href="#" style="display:inline-block;background:rgba(0,212,170,0.15);color:#00d4aa;padding:8px 16px;border-radius:8px;text-decoration:none;font-size:0.8rem;font-weight:600;">View Full Profile →</a>
</div>

<!-- Legend (overlay on 3D) -->
<div style="position:fixed;bottom:20px;left:20px;z-index:5;display:flex;gap:12px;flex-wrap:wrap;">
    <span style="font-size:0.65rem;color:#888;">‹ Executive</span>
    <span style="font-size:0.65rem;color:#58a6ff;">‹ Cabinet</span>
    <span style="font-size:0.65rem;color:#bc8cff;">‹ Administration</span>
    <span style="font-size:0.65rem;color:#f5a623;">‹ Judicial</span>
    <span style="font-size:0.65rem;color:#3fb950;">‹ Legislative</span>
</div>
<div style="position:fixed;top:80px;right:20px;z-index:5;color:#666;font-size:0.65rem;text-align:right;">
    🖱 Drag to rotate<br>🖱 Scroll to zoom<br>👆 Click a node
</div>

<!-- 2D / List views (hidden) -->
<div id="view-map" style="display:none;position:relative;z-index:2;max-width:1200px;margin:80px auto 0;padding:24px;">
    <div id="mindMap">Loading...</div>
</div>
<div id="view-list" style="display:none;position:relative;z-index:2;max-width:1200px;margin:80px auto 0;padding:24px;">
    <div class="card"><h2>All People</h2><div id="peopleList">Loading...</div></div>
</div>

<script type="module">
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ── Scene Setup ──
const container = document.getElementById('view-3d');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080b14);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 0.5, 200);
camera.position.set(14, 10, 28);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.3;
controls.minDistance = 5;
controls.maxDistance = 60;
controls.target.set(0, 0, 0);
controls.update();

// ── Lighting ──
scene.add(new THREE.AmbientLight(0x334466, 2));
const light = new THREE.DirectionalLight(0xffffff, 3);
light.position.set(10, 20, 15);
scene.add(light);

// ── Stars background ──
const starsGeo = new THREE.BufferGeometry();
const starVerts = [];
for (let i = 0; i < 600; i++) {
    starVerts.push((Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80);
}
starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3));
scene.add(new THREE.Points(starsGeo, new THREE.PointsMaterial({ color: 0x445577, size: 0.08 })));

// ── Color map ──
function branchColor(branch, party) {
    if (party === 'Democrat') return 0x3fb950;
    const map = { 'Executive': 0xff6b6b, 'Cabinet': 0x58a6ff, 'Administration': 0xbc8cff, 'Judicial': 0xf5a623, 'Legislative': 0x3fb950 };
    return map[branch] || 0x888888;
}

// ── Photo texture helper (loads async & applies to sphere)
const textureLoader = new THREE.TextureLoader();
function photoSlug(name) {
    return name.toLowerCase().replace(/ /g, '_').replace(/\./g, '').replace(/,/g, '');
}

// ── Load data & build graph ──
let peopleData = [];
const nodes = [];
const lines = [];
const nodeMap = {};
let selectedNode = null;

fetch('/api/people')
    .then(r => r.json())
    .then(people => {
        peopleData = people;
        buildGraph(people);
        animate();
    });

function buildGraph(people) {
    const positions = {};
    const exec = people.filter(p => p.branch === 'Executive');
    const cabinet = people.filter(p => p.branch === 'Cabinet');
    const admin = people.filter(p => p.branch === 'Administration');
    const judicial = people.filter(p => p.branch === 'Judicial');
    const legislative = people.filter(p => p.branch === 'Legislative');

    // ── Executive Branch — Fibonacci spheres for true 3D ──
    positions[1] = { x: 0, y: 0, z: 0 };         // Trump at center

    // VP — slightly offset in 3D
    positions[2] = { x: 0, y: -3, z: -4 };

    // Cabinet — evenly distributed on a 3D sphere (Fibonacci)
    const cabR = 14;
    const cabN = cabinet.length;
    cabinet.forEach((p, i) => {
        const phi = Math.acos(1 - 2 * (i + 0.5) / cabN);
        const theta = Math.PI * (1 + Math.sqrt(5)) * i;
        positions[p.id] = {
            x: Math.sin(phi) * Math.cos(theta) * cabR,
            y: Math.sin(phi) * Math.sin(theta) * cabR,
            z: Math.cos(phi) * cabR
        };
    });

    // Administration — larger Fibonacci sphere
    const adminR = 20;
    const adminN = admin.length;
    admin.forEach((p, i) => {
        const phi = Math.acos(1 - 2 * (i + 0.5) / adminN);
        const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 3);
        positions[p.id] = {
            x: Math.sin(phi) * Math.cos(theta) * adminR,
            y: Math.sin(phi) * Math.sin(theta) * adminR,
            z: Math.cos(phi) * adminR
        };
    });

    // ── Judicial Branch (far left, 3D cluster) ──
    judicial.forEach((p, i) => {
        const phi = Math.acos(1 - 2 * (i + 0.5) / judicial.length);
        const theta = Math.PI * (1 + Math.sqrt(5)) * i * 0.6;
        const r = 7;
        positions[p.id] = {
            x: -32 + Math.sin(phi) * Math.cos(theta) * r,
            y: Math.sin(phi) * Math.sin(theta) * r,
            z: Math.cos(phi) * r
        };
    });

    // ── Legislative Branch (far right, 3D cluster) ──
    legislative.forEach((p, i) => {
        const phi = Math.acos(1 - 2 * (i + 0.5) / legislative.length);
        const theta = Math.PI * (1 + Math.sqrt(5)) * i * 0.6 + 2;
        const r = 6;
        positions[p.id] = {
            x: 32 + Math.sin(phi) * Math.cos(theta) * r,
            y: Math.sin(phi) * Math.sin(theta) * r,
            z: Math.cos(phi) * r
        };
    });

    people.forEach(p => {
        const pos = positions[p.id] || { x: (Math.random()-0.5)*5, y: (Math.random()-0.5)*5, z: (Math.random()-0.5)*5 };
        const color = branchColor(p.branch, p.party);
        const isTrump = p.id === 1;

        const radius = isTrump ? 1.6 : 1.15;

        // ── Colored anchor dot (sphere behind the photo sphere) ──
        const anchorGeo = new THREE.SphereGeometry(radius + 0.12, 32, 32);
        const anchorMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 });
        const anchor = new THREE.Mesh(anchorGeo, anchorMat);
        anchor.position.set(pos.x, pos.y, pos.z);
        anchor.userData = { isAnchor: true };
        scene.add(anchor);

        // ── Photo sphere ──
        const sphereGeo = new THREE.SphereGeometry(radius, 32, 32);
        const sphereMat = new THREE.MeshBasicMaterial({ color: 0x333344 });
        const sphere = new THREE.Mesh(sphereGeo, sphereMat);
        sphere.position.set(pos.x, pos.y, pos.z);
        sphere.userData = {
            id: p.id, name: p.name, role: p.role,
            branch: p.branch, bio: p.bio, party: p.party, color,
            isPhoto: true, anchor: anchor, radius
        };
        anchor.userData.parentNode = sphere;
        scene.add(sphere);
        nodes.push(sphere);
        nodeMap[p.id] = sphere;

        // Load texture onto sphere
        const slug = photoSlug(p.name);
        const url = '/static/photos/' + slug + '.jpg';
        textureLoader.load(url,
            (texture) => {
                if (texture && texture.image) {
                    sphere.material.map = texture;
                    sphere.material.color.set(0xffffff);
                    sphere.material.needsUpdate = true;
                }
            },
            undefined, () => {}
        );

        // ── Name label ──
        const labelSprite = makeLabelSprite(p, color);
        labelSprite.position.set(pos.x, pos.y + radius + 0.8, pos.z);
        sphere.userData.label = labelSprite;
        scene.add(labelSprite);
    });

    // ── Section headers ──
    function clusterHeader(text, group, offsetY, colorHex) {
        if (group.length === 0) return;
        const avgX = group.reduce((s, p) => s + positions[p.id].x, 0) / group.length;
        const maxY = Math.max(...group.map(p => positions[p.id].y));
        const avgZ = group.reduce((s, p) => s + positions[p.id].z, 0) / group.length;

        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#' + new THREE.Color(colorHex).getHexString();
        ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(text, 256, 40);

        const tex = new THREE.CanvasTexture(canvas);
        tex.minFilter = THREE.LinearFilter;
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
        sprite.position.set(avgX, maxY + offsetY, avgZ);
        sprite.scale.set(5, 0.65, 1);
        scene.add(sprite);
    }

    clusterHeader('SUPREME COURT', judicial, 3.2, 0xf5a623);
    clusterHeader('LEGISLATIVE', legislative, 3.2, 0x3fb950);

    // ── Connections (parent→child) ──
    people.forEach(p => {
        if (p.parent_id && nodeMap[p.parent_id] && nodeMap[p.id]) {
            const parent = nodeMap[p.parent_id];
            const child = nodeMap[p.id];
            const lineGeo = new THREE.BufferGeometry().setFromPoints([parent.position.clone(), child.position.clone()]);
            const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0x252d45, transparent: true, opacity: 0.5 }));
            scene.add(line);
            lines.push(line);
        }
    });

    // ── Section headers ──
}

// ── Rounded rectangle geometry ──
function roundedRectGeometry(w, h, r, segments) {
    const shape = new THREE.Shape();
    const x = -w / 2, y = -h / 2;
    shape.moveTo(x + r, y);
    shape.lineTo(x + w - r, y);
    shape.quadraticCurveTo(x + w, y, x + w, y + r);
    shape.lineTo(x + w, y + h - r);
    shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    shape.lineTo(x + r, y + h);
    shape.quadraticCurveTo(x, y + h, x, y + h - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);
    return new THREE.ShapeGeometry(shape, segments);
}

// ── Rounded card texture (cover-fit + rounded corners, avoids UV distortion) ──
function createRoundedCardTexture(image, cardW, cardH, radius) {
    const res = 512;
    const cw = res;
    const ch = Math.round(res * (cardH / cardW));
    const canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');

    // Rounded rect clip path
    const r = Math.round(radius * (res / cardW));
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(cw - r, 0);
    ctx.quadraticCurveTo(cw, 0, cw, r);
    ctx.lineTo(cw, ch - r);
    ctx.quadraticCurveTo(cw, ch, cw - r, ch);
    ctx.lineTo(r, ch);
    ctx.quadraticCurveTo(0, ch, 0, ch - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.clip();

    // Cover-fit: crop photo to match card aspect ratio
    const imgW = image.width, imgH = image.height;
    const cardRatio = cardW / cardH;
    const imgRatio = imgW / imgH;
    let sx, sy, sw, sh;
    if (imgRatio > cardRatio) {
        sw = imgH * cardRatio;
        sh = imgH;
        sx = (imgW - sw) / 2;
        sy = 0;
    } else {
        sw = imgW;
        sh = imgW / cardRatio;
        sx = 0;
        sy = (imgH - sh) / 2;
    }
    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, cw, ch);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
}

// ── Label sprite factory (clean text, no pill background) ──
function makeLabelSprite(p, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 72;
    const ctx = canvas.getContext('2d');

    // Name (bold, white)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(p.name, 256, 34);

    // Role (light gray)
    ctx.font = '19px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = '#bbbbbb';
    const role = p.role || '';
    const maxWidth = 400;
    if (ctx.measureText(role).width > maxWidth) {
        const mid = role.lastIndexOf(' ', Math.floor(role.length * 0.55));
        const split = mid > 0 ? mid : Math.floor(role.length / 2);
        ctx.fillText(role.substring(0, split), 256, 56);
        ctx.fillText(role.substring(split + 1), 256, 68);
    } else {
        ctx.fillText(role, 256, 58);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    const bw = p.id === 1 ? 4.2 : 3.3;
    const bh = p.id === 1 ? 0.95 : 0.75;
    sprite.scale.set(bw, bh, 1);
    sprite.userData = { baseW: bw, baseH: bh };
    return sprite;
}

// ── Raycaster for clicks (check anchor dots + photo spheres) ──
const raycaster = new THREE.Raycaster();
const clickTargets = () => {
    const all = [...nodes];
    nodes.forEach(n => {
        if (n.userData.anchor) all.push(n.userData.anchor);
    });
    return all;
};

renderer.domElement.addEventListener('click', (event) => {
    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(clickTargets());
    if (intersects.length > 0) {
        let obj = intersects[0].object;
        // If they clicked an anchor dot, resolve to the parent sphere
        if (obj.userData.isAnchor && obj.userData.parentNode) {
            obj = obj.userData.parentNode;
        }
        selectNode(obj);
        controls.target.lerp(obj.position, 0.5);
    }
});

function selectNode(obj) {
    // Reset all
    nodes.forEach(n => {
        n.scale.set(1, 1, 1);
        n.material.opacity = 1.0;
    });

    // Highlight selected
    obj.scale.set(1.08, 1.08, 1.08);
    obj.material.opacity = 0.95;
    selectedNode = obj;

    // Slide up detail panel
    showDetail(obj.userData);
}

function showDetail(data) {
    document.getElementById('detailName').textContent = data.name;
    document.getElementById('detailRole').textContent = data.role || '';
    document.getElementById('detailBio').textContent = (data.bio || '').substring(0, 200) + '...';
    document.getElementById('detailLink').href = '/person/' + data.id;

    // Fetch article count
    fetch('/api/articles?person_id=' + data.id)
        .then(r => r.json())
        .then(articles => {
            document.getElementById('detailArticles').innerHTML = articles.length > 0
                ? '📰 <strong>' + articles.length + '</strong> recent articles'
                : 'No articles yet';
        });

    document.getElementById('detailPanel').style.bottom = '0';
}

window.closeDetail = function() {
    document.getElementById('detailPanel').style.bottom = '-400px';
    if (selectedNode) {
        selectedNode.scale.set(1, 1, 1);
        selectedNode.material.opacity = 1.0;
        selectedNode = null;
    }
};

// ── Hover effects ──
renderer.domElement.addEventListener('mousemove', (event) => {
    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(clickTargets());
    renderer.domElement.style.cursor = intersects.length > 0 ? 'pointer' : 'grab';
});

// ── Animation loop ──
function animate() {
    requestAnimationFrame(animate);
    controls.update();

    // Spheres don't need billboarding — just keep labels scaled
    nodes.forEach(n => {
        // Distance-adaptive label scaling: bigger when far, smaller when close
        if (n.userData.label) {
            const dist = camera.position.distanceTo(n.userData.label.position);
            const factor = Math.max(0.45, Math.min(2.5, dist / 20));
            const lb = n.userData.label.userData;
            n.userData.label.scale.set(lb.baseW * factor, lb.baseH * factor, 1);
        }
    });

    // Pulse selected node
    if (selectedNode) {
        const s = 1.08 + Math.sin(Date.now() * 0.005) * 0.06;
        selectedNode.scale.set(s, s, s);
    }

    renderer.render(scene, camera);
}

// ── Resize ──
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
</script>

<script>
var people;

function switchView(view) {
    document.getElementById('view-3d').style.display = view === '3d' ? 'block' : 'none';
    document.getElementById('view-map').style.display = view === 'map' ? 'block' : 'none';
    document.getElementById('view-list').style.display = view === 'list' ? 'block' : 'none';
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`[onclick="switchView('${view}')"]`).classList.add('active');
}

function buildNode(p) {
    let cls = 'person-node';
    if (p.party === 'Democrat') cls += ' tag-dem'; else cls += ' tag-gop';
    let tag = '';
    if (p.status === 'outgoing') tag = '<span class="status-tag tag-outgoing">OUTGOING</span>';
    return `<a href="/person/${p.id}" class="${cls}">
        <div class="name">${p.name}</div>
        <div class="role">${p.role || ''}</div>${tag}
    </a>`;
}

function renderMap() {
    const trump = people.find(p => p.id === 1);
    if (!trump) return;

    let html = '';
    html += `<div style="text-align:center"><a href="/person/${trump.id}" class="center-node">
        <div class="name">${trump.name}</div>
        <div class="role">${trump.role}</div>
    </a></div>`;
    html += '<div class="connector">▼ ▼ ▼</div>';

    // Level 1: VP + Cabinet
    const branches = {
        'Cabinet': { label: 'CABINET', color: '#58a6ff' },
        'Administration': { label: 'ADMINISTRATION', color: '#bc8cff' },
        'Judicial': { label: 'SUPREME COURT', color: '#f5a623' },
        'Opposition': { label: 'LEGISLATIVE', color: '#3fb950' },
    };

    // VP
    const vp = people.find(p => p.id === 2);
    if (vp) {
        html += '<div class="map-level">';
        html += `<div class="map-level-label">VICE PRESIDENT</div>`;
        html += buildNode(vp);
        html += '</div>';
        html += '<div class="connector">▼ ▼ ▼</div>';
    }

    for (let [branch, info] of Object.entries(branches)) {
        const members = people.filter(p => p.branch === branch);
        if (members.length === 0) continue;
        html += '<div class="map-level">';
        html += `<div class="map-level-label">${info.label}</div>`;
        members.forEach(p => html += buildNode(p));
        html += '</div>';
    }

    document.getElementById('mindMap').innerHTML = html;
}

function renderList() {
    let html = '';
    const branches = ['Executive', 'Cabinet', 'Administration', 'Judicial', 'Legislative'];
    branches.forEach(branch => {
        const members = people.filter(p => p.branch === branch);
        if (members.length === 0) return;
        html += `<h3 style="color:#888;font-size:0.7rem;text-transform:uppercase;letter-spacing:1px;margin:12px 0 6px;">${branch}</h3>`;
        members.forEach(p => {
            html += `<a href="/person/${p.id}" class="person-node" style="display:inline-block;margin:4px;">
                <div class="name">${p.name}</div>
                <div class="role">${p.role || ''}</div>
            </a>`;
        });
    });
    document.getElementById('peopleList').innerHTML = html || 'No data.';
}

fetch('/api/people')
    .then(r => r.json())
    .then(data => { people = data; renderMap(); renderList(); })
    .catch(() => { document.getElementById('mindMap').innerHTML = 'Could not load data.'; });
</script>
</body>
</html>"""

PERSON_HTML = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{ person.name }} — BranchLive</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #080b14; color: #e0e0e0; min-height: 100vh;
}
header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 24px; background: #0d1124; border-bottom: 1px solid #1a2040;
}
.logo { font-size: 1.4rem; font-weight: 800; color: #00d4aa; }
.logo span { color: #58a6ff; }
.logo a { text-decoration: none; color: inherit; }
.container { max-width: 800px; margin: 0 auto; padding: 24px; }
.back-link { color: #58a6ff; text-decoration: none; font-size: 0.8rem; display: inline-block; margin-bottom: 20px; }
.person-header {
    display: flex; align-items: flex-start; gap: 16px; margin-bottom: 24px;
    padding-bottom: 20px; border-bottom: 1px solid #1a2040;
}
.person-avatar {
    width: 72px; height: 72px; border-radius: 50%; background: #141a2e;
    border: 2px solid #252d45; display: flex; align-items: center;
    justify-content: center; font-size: 2rem; flex-shrink: 0;
}
.person-info h1 { font-size: 1.5rem; margin-bottom: 4px; }
.person-info .role-line { font-size: 0.85rem; color: #888; margin-bottom: 2px; }
.person-info .branch-line { font-size: 0.75rem; color: #666; margin-bottom: 8px; }
.bio { font-size: 0.85rem; color: #bbb; line-height: 1.6; }
.card {
    background: #111633; border: 1px solid #1a2040; border-radius: 12px;
    padding: 16px; margin-bottom: 16px;
}
.card h2 { font-size: 0.8rem; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
.bias-tag {
    font-size: 0.6rem; padding: 2px 6px; border-radius: 4px; font-weight: 600;
}
.bias-center { background: rgba(0,212,170,0.15); color: #00d4aa; }
.bias-left { background: rgba(63,185,80,0.15); color: #3fb950; }
.bias-right { background: rgba(245,166,35,0.15); color: #f5a623; }
.timeline-item {
    display: flex; gap: 12px; padding: 8px 0; border-bottom: 1px solid #1a2040; font-size: 0.82rem;
}
.timeline-date { color: #58a6ff; font-weight: 600; min-width: 85px; font-size: 0.75rem; }
.timeline-desc { color: #ccc; }
.article-item {
    padding: 10px 0; border-bottom: 1px solid #1a2040;
}
.article-item:last-child { border-bottom: none; }
.article-title { font-size: 0.88rem; font-weight: 600; color: #f0f0f0; margin-bottom: 4px; }
.article-meta { font-size: 0.7rem; color: #888; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.article-summary { font-size: 0.78rem; color: #aaa; margin-top: 4px; line-height: 1.4; }
.related-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.related-card {
    background: #141a2e; border: 1px solid #252d45; border-radius: 8px;
    padding: 10px 14px; font-size: 0.78rem; text-decoration: none; color: #ddd;
}
.related-card:hover { border-color: #58a6ff; }
.empty { color: #666; font-style: italic; font-size: 0.85rem; padding: 8px 0; }
@media (max-width: 600px) {
    .container { padding: 12px; }
    .person-header { flex-direction: column; }
}
</style>
</head>
<body>

<header>
    <div class="logo"><a href="/">Branch<span>Live</span></a></div>
    <div style="color:#888;font-size:0.75rem;">Political Mind Map</div>
</header>

<div class="container">
    <a href="/" class="back-link">← Back to Map</a>

    <div class="person-header">
        <div class="person-avatar">{{ person.name[0] }}</div>
        <div class="person-info">
            <h1>{{ person.name }}</h1>
            <div class="role-line">{{ person.role }}</div>
            <div class="branch-line">{{ person.branch }} {% if person.party == 'Democrat' %}· Democrat{% endif %}</div>
            <div class="bio">{{ person.bio }}</div>
        </div>
    </div>

    <!-- Timeline -->
    <div class="card">
        <h2>📅 Timeline</h2>
        {% if events %}
        {% for e in events %}
        <div class="timeline-item">
            <span class="timeline-date">{{ e.date }}</span>
            <span class="timeline-desc">{{ e.description }}</span>
        </div>
        {% endfor %}
        {% else %}
        <div class="empty">No timeline events yet.</div>
        {% endif %}
    </div>

    <!-- News Articles -->
    <div class="card">
        <h2>📰 Latest News</h2>
        {% if articles %}
        {% for a in articles %}
        <div class="article-item">
            <div class="article-title">{{ a.title }}</div>
            <div class="article-meta">
                <span>{{ a.source }}</span>
                <span class="bias-tag bias-{{ a.bias or 'center' }}">{{ a.bias or 'Center' }}</span>
                <span>{{ a.published_at[:10] if a.published_at else '' }}</span>
            </div>
            {% if a.summary %}
            <div class="article-summary">{{ a.summary }}</div>
            {% endif %}
        </div>
        {% endfor %}
        {% else %}
        <div class="empty">News aggregation coming soon. Check back after the feed is live.</div>
        {% endif %}
    </div>

    <!-- Related -->
    {% if related %}
    <div class="card">
        <h2>🔗 Related Figures</h2>
        <div class="related-grid">
            {% for r in related %}
            <a href="/person/{{ r.id }}" class="related-card">
                <div style="font-weight:600;">{{ r.name }}</div>
                <div style="font-size:0.65rem;color:#888;">{{ r.role }}</div>
            </a>
            {% endfor %}
        </div>
    </div>
    {% endif %}
</div>

</body>
</html>"""

# ── Main ────────────────────────────────────────────

if __name__ == "__main__":
    seed()
    print(f"🌳 BranchLive → http://localhost:{app.port}")
    app.run(host="0.0.0.0", port=app.port, debug=False)
