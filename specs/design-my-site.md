# Specification: 'Design My Site' AI Website Generation

This document specifies the design, implementation, and integration details for the new **'Design My Site'** feature. This feature replaces the legacy template picker in the Website Builder with an LLM-driven custom HTML landing page generator, while utilizing the existing database schemas, public routes, and `simpleShell()` layout pattern.

---

## 1. Overview & User Flow

The **'Design My Site'** feature allows business owners to generate a premium, bespoke, mobile-responsive landing page with a single click. Instead of choosing between a few pre-defined static templates (`tplModern`, `tplWarmCraft`, etc.), the system feeds the business's actual assets, services, and reviews into a Large Language Model (LLM) to write a customized semantic HTML and CSS design.

### User Flow Diagram

```mermaid
sequenceDiagram
    actor User as Business Owner
    participant Portal as /p/website (Dashboard)
    participant Worker as Cloudflare Worker (worker.js)
    participant DB as D1 Database
    participant LLM as DeepSeek (api.deepseek.com)

    User->>Portal: Clicks "Design My Site"
    Portal->>Worker: POST /api/site/design/generate (with style notes)
    Worker->>DB: Fetch Settings, Knowledge Base, Reviews, Photos
    DB-->>Worker: Return details & photo metadata
    Worker->>Worker: Map photos to [PHOTO_N] tokens to save context window
    Worker->>LLM: Request HTML generation via DeepSeek API (deepseek-chat)
    LLM-->>Worker: Return clean custom HTML & embedded CSS
    Worker->>Worker: Post-Process: Replace [PHOTO_N] tokens with base64 data URIs
    Worker->>DB: Save generated markup to sites.draft_html
    Worker-->>Portal: Return { ok: true, previewUrl: '/s/slug?preview_draft=1' }
    Portal->>Portal: Load draft preview URL in <iframe>
    User->>Portal: Reviews design & clicks "Approve & Go Live"
    Portal->>Worker: POST /api/site/design/approve
    Worker->>DB: Copy sites.draft_html -> sites.project_html & set published = 1
    Worker-->>Portal: Return { ok: true }
    Portal->>Portal: Reload dashboard; public site is now live at /s/slug
```

---

## 2. Data Collection Pipeline

All data collected must be queried based on the resolved business ID (`ctx.bid`) to support team members acting on behalf of the business owner.

### 2.1 Settings & Business Identity
* **Target Table**: `settings` (joined with `users` as a fallback)
* **Fields to retrieve**:
  - `business_name`: Display name.
  - `industry`: Business category (e.g., Landscaping, Hair Salon).
  - `service_area`: Geographic service boundaries (e.g., "Lancaster, PA").
  - `service_description`: General description / overview.
  - `forwarding_number`: The phone number used for user calls.
  - `working_hours`: Operating hours JSON array.
  - `instagram_url` / `facebook_url`: Social link profiles.

### 2.2 Services & Pricing (Knowledge Base)
* **Target Table**: `knowledge`
* **Query**: `SELECT category, item, price, notes FROM knowledge WHERE user_id = ?`
* **Aggregation**: Group services by `category` (e.g., "Repairs", "Installation") to let the LLM organize them into clear HTML pricing cards or tables.

### 2.3 Photos & Gallery (Base64 Optimization)
To prevent blowing up the LLM's token limit and incurring massive cost or latency, **raw base64 image strings must NOT be sent to the LLM.**
* **Query**: `SELECT id, caption, type FROM photos WHERE user_id = ? ORDER BY created_at DESC LIMIT 12`
* **Mapping Logic**:
  1. The server queries the photo metadata (excluding the large `data` column).
  2. The server generates a placeholder token for each photo: `[PHOTO_1]`, `[PHOTO_2]`, etc.
  3. The prompt lists the placeholders alongside their metadata (e.g., `[PHOTO_1] - Type: after, Caption: Kitchen backsplash tiling`).
  4. The LLM is instructed to use these tokens verbatim as the `src` attribute in the HTML `<img>` tag (e.g., `<img src="[PHOTO_1]" alt="Kitchen backsplash tiling">`).
  5. Upon receiving the LLM's output, the server replaces all instances of `[PHOTO_N]` with the corresponding base64 data URI (queried using `SELECT data FROM photos WHERE id = ?`).

### 2.4 Customer Reviews
* **Target Table**: `reviews`
* **Query**: `SELECT author_name, rating, text FROM reviews WHERE user_id = ? ORDER BY reviewed_at DESC LIMIT 5`
* **Use Case**: Rendered as testimonials.

---

## 3. LLM Integration & Prompt Design

### 3.1 Inference Configuration
* **Provider/Model**: DeepSeek API (`api.deepseek.com`, model: `deepseek-chat`). The API key is provided via `env.DEEPSEEK_API_KEY`.
* **Temperature**: `0.3` (Low temperature ensures the model adheres strictly to the HTML structure, formatting rules, and escaping constraints).
* **Max Tokens**: `8000` (Allows the model to output a fully styled page, including layout markup and descriptive copy).

> [!NOTE]
> **Why DeepSeek was chosen**: Provides better design output than free Workers AI, and is highly cost-effective, costing ~$0.02 per generation at $0.27/M input tokens.

### 3.2 System Prompt
```text
You are an expert web designer and front-end developer specializing in creating high-converting, premium landing pages for local service businesses. 

Your task is to write a single, completely self-contained, responsive HTML5 landing page. 

OUTPUT CONSTRAINTS:
1. Return ONLY valid HTML5 code starting with <!DOCTYPE html> and ending with </html>.
2. Do NOT wrap your output in markdown codeblocks (e.g., ```html). Return only raw text.
3. No conversational preambles or post-scripts. Output only the code.
4. All styles must be written in a single <style> block in the <head>. Do not use external CSS frameworks.
5. All interactive elements (e.g., mobile navigation toggle, modal overlays) must use simple, inline vanilla JavaScript. No external libraries like jQuery.

DESIGN & AESTHETIC DIRECTIVES:
1. Do not use generic browser colors. Create a highly customized color scheme tailored to the business's industry (e.g., rich forest greens and earth tones for landscaping; deep charcoal, slate, and amber accents for trades).
2. Utilize premium typography. Import modern Google Fonts (such as Inter, Outfit, Fraunces, or Playfair Display) via <link> tags in the head.
3. Layout structure must include:
   - Sticky navigation bar with responsive mobile menu.
   - High-impact hero section with a clear headline, sub-headline, a primary CTA (Booking button), and a secondary CTA (Call button).
   - Features / Services & Pricing grid matching the provided catalog.
   - "Our Work" Gallery section placing the photo placeholders contextually.
   - Testimonial carousel or grid displaying reviews.
   - Footer containing contact info, working hours, and social media links.
4. Implement subtle animations (hover states, fading transitions).

STRICT COPY RULES:
- HARD RULE: NEVER use the word "contractor" in any copy, headers, text, class names, or comments. Instead, use "business", "service business", "local professional", or industry-specific terms (e.g., "plumber", "electrician", "stylist").
```

### 3.3 User Prompt Structure
```text
Generate a premium landing page for the following business:

--- BUSINESS PROFILE ---
Name: {business_name}
Industry: {industry}
Service Area: {service_area}
Description: {service_description}
Phone Number: {forwarding_number}
Working Hours: {working_hours}
Instagram: {instagram_url}
Facebook: {facebook_url}

--- SERVICE CATALOG ---
{formatted_services_list}

--- TESTIMONIALS ---
{formatted_reviews_list}

--- AVAILABLE PHOTOS ---
Use these tokens verbatim in the src attribute of your img tags where relevant. Do not invent other tokens:
{photo_placeholders_with_captions}

--- USER PREFERENCES / STYLE NOTES ---
{user_style_notes} (e.g., "Clean dark mode, warm gold accents, focus on masonry craft")

--- DEPLOYMENT DATA LINKS ---
- Make the primary CTA ("Book Online" / "Book Appointment") link to: /dashboard
- Make phone links use: tel:{forwarding_number_raw}
```

---

## 4. API Endpoints

Two new API endpoints are required, and one public route must be updated to handle draft preview mode.

### 4.1 `POST /api/site/design/generate`
Generates a draft website design using the LLM.
* **Authentication**: Cookie-based session (`getUidFromSessionCookie`, `resolveContext`).
* **Request Payload**:
  ```json
  {
    "style_notes": "A sleek modern layout with warm wood tones"
  }
  ```
* **Process**:
  1. Resolves `uid` and business context `bid`.
  2. Queries settings, services, reviews, and photo metadata from D1.
  3. Prepares the system and user prompts.
  4. Calls the DeepSeek Chat Completions API (`https://api.deepseek.com/chat/completions`) using the API key stored in `env.DEEPSEEK_API_KEY` (see code example below).
  5. Cleans markdown markers (if any) from the returned string.
  6. Replaces photo tokens `[PHOTO_N]` with the corresponding base64 `data` strings.
  7. Updates the `sites` table:
     ```sql
     UPDATE sites SET draft_html = ? WHERE user_id = ?
     ```
  8. Returns:
     ```json
     { "ok": true, "previewUrl": "/s/slug-here?preview_draft=1" }
     ```

#### DeepSeek API Code Example
```javascript
const response = await fetch('https://api.deepseek.com/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`
  },
  body: JSON.stringify({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.3,
    max_tokens: 8000
  })
});
const result = await response.json();
const generatedHtml = result.choices[0].message.content;
```

### 4.2 `GET /s/{slug}?preview_draft=1`
Serves the generated draft design for preview purposes.
* **Authentication**: Enforced only when `preview_draft=1` is passed.
* **Logic**:
  1. Checks if the caller has a session cookie resolving to the owner/manager of the site.
  2. If unauthorized, returns `404 Not Found` (matching standard template preview logic).
  3. If authorized, queries `draft_html` from the `sites` table.
  4. Returns the HTML with header `'Content-Type': 'text/html'`.

### 4.3 `POST /api/site/design/approve`
Publishes the generated draft live.
* **Authentication**: Cookie-based session.
* **Logic**:
  1. Resolves business `bid`.
  2. Runs transaction on D1:
     ```sql
     UPDATE sites SET project_html = draft_html, draft_html = NULL, published = 1 WHERE user_id = ?
     ```
  3. Returns:
     ```json
     { "ok": true }
     ```

---

## 5. Database Schema Integration

An idempotent migration snippet must be added inside `initDB()` in `worker.js` to support draft stages.

```js
// Add draft_html column to sites table if it doesn't exist
try {
  await env.DB.prepare('ALTER TABLE sites ADD COLUMN draft_html TEXT').run();
} catch (e) {
  // Column already exists or error ignored
}
```

---

## 6. Frontend Dashboard Components

The new UI replaces the legacy template cards and accent swatches with an AI generation hub inside the `/p/website` view.

### 6.1 Layout Integration with `simpleShell()`
The builder view uses the standard left-control-panel / right-iframe-preview layout inside `simpleShell('Website Builder', body)`.

```html
<div class="app">
  <!-- Sidebar navigation injected via sidebarNav() -->
  <div class="content wb-content">
    <span class="eyebrow">Website</span>
    <h1>AI Website Designer</h1>
    <p class="sub">Harness artificial intelligence to write custom CSS and HTML tailored specifically to your business, services, and photos.</p>

    <div class="wb-grid">
      <!-- Left: AI Controls Panel -->
      <div class="wb-controls card">
        <div id="ai-trigger-panel">
          <h3>Design Options</h3>
          <p style="font-size:.85em;color:var(--text-muted);margin-bottom:12px">
            Provide design guidance or styling notes to steer the AI generator:
          </p>
          <textarea id="wb-ai-notes" class="wb-input" style="height:100px;margin-bottom:16px;" placeholder="e.g., Modern dark mode, elegant warm colors, clean typography..."></textarea>
          
          <button class="btn btn-amber" style="width:100%" id="wb-btn-generate" onclick="wbGenerateAiSite()">
            🚀 Design My Site (AI)
          </button>
        </div>

        <!-- Hidden by default; shown during generation -->
        <div id="ai-loading-panel" style="display:none;padding:16px 0;text-align:center;">
          <div class="spinner" style="margin:0 auto 12px"></div>
          <p id="ai-status-msg" style="font-size:.9em;color:var(--cream-dim)">Preparing prompts...</p>
        </div>

        <!-- Hidden by default; shown after generation -->
        <div id="ai-approval-panel" style="display:none;">
          <div class="ax-note" style="margin-bottom:18px;">
            <strong>✨ Draft Generated!</strong><br>
            Preview your custom site in the panel on the right.
          </div>
          <button class="btn btn-success" style="width:100%;margin-bottom:10px" onclick="wbApproveAiSite()">
            🚀 Publish & Go Live
          </button>
          <button class="btn btn-ghost" style="width:100%;margin-bottom:10px" onclick="wbGenerateAiSite()">
            🔄 Regenerate Design
          </button>
          <button class="btn btn-ghost" style="width:100%" onclick="wbResetUI()">
            ✕ Discard Draft
          </button>
        </div>
      </div>

      <!-- Right: Live Iframe Preview -->
      <div class="wb-preview card">
        <div class="wb-preview-bar">
          <button class="wb-dev active" onclick="wbDevice('desktop')">🖥 Desktop</button>
          <button class="wb-dev" onclick="wbDevice('mobile')">📱 Mobile</button>
        </div>
        <div class="wb-frame-wrap" id="wb-frame-wrap">
          <iframe id="wb-frame" src="/s/${slug}?preview=1" loading="lazy"></iframe>
        </div>
      </div>
    </div>
  </div>
</div>
```

### 6.2 Frontend Scripts & Actions
```javascript
window.wbGenerateAiSite = function() {
  const notes = document.getElementById('wb-ai-notes').value;
  const triggerPanel = document.getElementById('ai-trigger-panel');
  const loadingPanel = document.getElementById('ai-loading-panel');
  const approvalPanel = document.getElementById('ai-approval-panel');
  const statusMsg = document.getElementById('ai-status-msg');

  // Switch to loading UI
  triggerPanel.style.display = 'none';
  approvalPanel.style.display = 'none';
  loadingPanel.style.display = 'block';

  // Simulating state progression messages
  const steps = [
    "Reading business settings...",
    "Gathering service categories...",
    "Injecting gallery photo placeholders...",
    "Drafting testimonials from reviews...",
    "Invoking LLM website layout writer...",
    "Compiling responsive styling layers...",
    "Rendering custom draft page..."
  ];
  let currentStep = 0;
  statusMsg.textContent = steps[0];
  const stepInterval = setInterval(() => {
    if (currentStep < steps.length - 1) {
      currentStep++;
      statusMsg.textContent = steps[currentStep];
    }
  }, 3500);

  fetch('/api/site/design/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ style_notes: notes })
  })
  .then(r => r.json())
  .then(data => {
    clearInterval(stepInterval);
    loadingPanel.style.display = 'none';
    if (data.ok) {
      // Set iframe to draft preview URL
      document.getElementById('wb-frame').src = data.previewUrl;
      approvalPanel.style.display = 'block';
      wbToast('AI Draft Ready! ✓');
    } else {
      triggerPanel.style.display = 'block';
      wbToast('Error: ' + (data.error || 'Generation failed'));
    }
  })
  .catch(() => {
    clearInterval(stepInterval);
    loadingPanel.style.display = 'none';
    triggerPanel.style.display = 'block';
    wbToast('Server connection failed');
  });
};

window.wbApproveAiSite = function() {
  fetch('/api/site/design/approve', { method: 'POST' })
  .then(r => r.json())
  .then(data => {
    if (data.ok) {
      wbToast('Published live! 🚀');
      setTimeout(() => { location.reload(); }, 1000);
    } else {
      wbToast('Approval failed: ' + (data.error || ''));
    }
  })
  .catch(() => { wbToast('Network error on approval'); });
};

window.wbResetUI = function() {
  if (confirm('Are you sure you want to discard this draft?')) {
    location.reload();
  }
};
```

---

## 7. Performance & Security Considerations

### 7.1 Input Sanitization & Escaping
- Generated HTML must run through regular-expression filters or a parser to ensure that raw scripts (`<script>`) referencing external, untrusted sources are not injected unless specifically allowed (like the Twilio booking calendar script).
- Business information injected into the LLM prompt (e.g. description, name) should use `htmxEsc` inside the worker code beforehand to prevent prompt injections or broken layouts.

### 7.2 Cache Invalidation
- When a new design is deployed via `/api/site/design/approve`, any Edge Caching configured on the `/s/{slug}` route must be immediately invalidated to ensure that external users see the new design instead of the cached legacy template layout.
- The `project_html` Response should carry headers:
  ```http
  Cache-Control: public, max-age=0, must-revalidate
  ```
