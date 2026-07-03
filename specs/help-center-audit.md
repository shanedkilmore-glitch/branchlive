# Help Center Audit Report — Branch Live

This report provides a comprehensive audit of the **19 help articles** hardcoded inside `worker.js` (under the `handleHelpArticleHtmx` implementation details found in the patch files). This audit evaluates the articles for completeness, length, factual accuracy, alignment with product code, and adherence to the guidelines in [patterns.md](file:///C:/Users/17173/Projects/branchlive/wiki/patterns.md).

---

## 1. Missing Articles / Feature Gaps
Several key features implemented in the `worker.js` codebase are completely undocumented in the current Help Center structure. The following articles should exist but are missing:

*   **Google Reviews & Monitoring (`addon_reviews`):**
    Although mentioned briefly in the billing article, there is no dedicated feature article explaining how businesses can set up their Google Place ID, sync Google reviews, or configure the review display section on their microsite.
*   **Email Autoresponder (`addon_email`):**
    A core $9.95/mo add-on feature that integrates with the Gmail OAuth configuration. There is currently no help article explaining what this feature does, how it automates email replies, or how to configure autoresponder templates.
*   **Cold Outreach & Prospects (`/p/outreach`):**
    The dashboard includes an outreach funnel, Apollo search integration, and TextMagic SMS blast capabilities. While this dashboard is restricted to admins (`uid === 1`), the route `/p/outreach` is configured with a minimum role of `manager` in `ROUTE_MIN_ROLE`. Because managers might try to access this page and get blocked, there should be clear documentation or role clarification regarding this feature.
*   **Knowledge Base Import (CSV / Sheets):**
    The Knowledge Base UI (`worker.js`) contains support for importing items via file upload (`kImport` / `kSheetsToggle`), but the `knowledge-base` help article only explains manual item creation.

---

## 2. Thin Content Analysis (Under 200 Words)
A word count analysis was run on the hardcoded HTML bodies of all 19 articles. Only the first **3 articles** meet the 200-word threshold; the remaining **16 articles** are thin and require expansion.

### Summary of Word Counts
| Article Slug | Category | Word Count | Status | Needs Expansion? |
| :--- | :--- | :---: | :---: | :---: |
| `welcome` | Getting Started | 206 | Pass | No |
| `setup-checklist` | Getting Started | 213 | Pass | No |
| `how-emma-answers` | Getting Started | 201 | Pass | No |
| `knowledge-base` | Features | 160 | **Thin** | **Yes** |
| `calendar-booking` | Features | 141 | **Thin** | **Yes** |
| `leads` | Features | 140 | **Thin** | **Yes** |
| `calls-transcripts` | Features | 138 | **Thin** | **Yes** |
| `website-builder` | Features | 116 | **Thin** | **Yes** |
| `gallery` | Features | 76 | **Thin** | **Yes** |
| `social-posts` | Features | 88 | **Thin** | **Yes** |
| `blog` | Features | 99 | **Thin** | **Yes** |
| `analytics` | Features | 127 | **Thin** | **Yes** |
| `billing-plans` | Account | 113 | **Thin** | **Yes** |
| `team-members` | Account | 99 | **Thin** | **Yes** |
| `settings` | Account | 116 | **Thin** | **Yes** |
| `faq-languages` | FAQ | 56 | **Thin** | **Yes** |
| `faq-closed` | FAQ | 80 | **Thin** | **Yes** |
| `faq-greeting` | FAQ | 53 | **Thin** | **Yes** |
| `faq-plan` | FAQ | 76 | **Thin** | **Yes** |

### Areas for Expansion
*   **Feature Articles (e.g., `knowledge-base`, `calendar-booking`, `leads`):** Need concrete examples of how buffers are calculated, how leads are assigned, and how manual CSV uploads are structured.
*   **Media Articles (`gallery`, `social-posts`):** Need specifications on supported file formats (JPEG, PNG), size limits, and step-by-step connection flows for Facebook and Instagram OAuth.
*   **FAQ Articles:** Most FAQs are extremely short (under 80 words) and provide only surface-level answers. They should include troubleshooting steps and edge cases.

---

## 3. Factual Errors and Outdated Information
The existing help articles contain several critical discrepancies when compared to the active implementation in `worker.js`:

1.  **The "Plan Tiers" Myth (`billing-plans`, `faq-plan`):**
    *   *Article claims:* "Branch Live is priced in simple tiers. Higher tiers unlock more minutes, more team seats, and advanced features."
    *   *Code reality:* There are **no tiers** in the codebase. Every customer is on the flat `base` plan (`stripe_plan = 'base'`) priced at **$29.95/mo** (`ADMIN_BASE_PRICE = 29.95`). Seats and minutes are not metered or limited by plan levels. Instead, capabilities are unlocked using individual modular **add-ons** (priced at $9.95/mo or $14.95/mo).
2.  **Outdated Website Builder (`website-builder`):**
    *   *Article claims:* Describes the legacy microsite builder where users customize a single-page site by toggling 9 hardcoded sections (Hero, Services, About, Gallery, Reviews, Booking, Contact, Service area, Social links) and choosing from 5 preset templates.
    *   *Code reality:* The system is migrating to the **GrapesJS drag-and-drop builder** (persisting clean HTML directly into `sites.project_html` via `handleWebsiteBuilderGrapesjs`). The article completely fails to mention this page-builder interface and lists out-of-date section limitations.
3.  **Missing "Scheduled" Pipeline Status (`leads`, `analytics`):**
    *   *Article claims:* Describes a 4-stage pipeline: *New → Contacted → Booked → Closed*.
    *   *Code reality:* The pipeline in the code contains **5 statuses**: `new`, `contacted`, `scheduled`, `booked`, and `closed` (see `worker.js` line 8391 and 11829). The `scheduled` status (which represents a temporary or unconfirmed hold before final booking) is completely omitted in the help articles.
4.  **Incorrect Multi-language Claims (`faq-languages`):**
    *   *Article claims:* "Emma understands and responds in the caller's language... Callers can speak naturally and she'll follow the conversation on their terms."
    *   *Code reality:* Emma's system prompt (`emmaSystemPrompt`) and first greeting (`emmaFirstMessage`) are hardcoded in **English**. There is no language detection, translation logic, or multi-language voice configuration present in the `worker.js` Vapi provisioning handlers.
5.  **Missing Add-ons in Billing Lists (`billing-plans`):**
    *   *Article claims:* Lists only three add-ons: Website, Reviews, and Business Blog.
    *   *Code reality:* The billing schema supports **5 add-ons** (`worker.js` lines 916-920):
        *   `addon_website` (Website Builder, $9.95/mo)
        *   `addon_reviews` (Review Monitoring, $9.95/mo)
        *   `addon_social` (Social Media Auto-posts, $9.95/mo) — *Missing from billing article*
        *   `addon_blog` (AI Blog Posts, $14.95/mo)
        *   `addon_email` (Email Autoresponder, $9.95/mo) — *Missing from billing article*

---

## 4. Suggestions for New Articles (3-5 Articles)
To improve the user onboarding experience and prevent support tickets, we recommend adding the following articles:

### Article 1: Syncing and Displaying Google Reviews
*   **Target Group:** Features
*   **Description:** Explain how the Review Monitoring add-on (`addon_reviews`) connects to Google Business Profile. Provide a step-by-step guide to finding the business's Google Place ID and configuring the review badge to appear on the microsite.

### Article 2: Getting Started with the GrapesJS Drag-and-Drop Editor
*   **Target Group:** Features
*   **Description:** Guide users through the new drag-and-drop editor interface. Explain how to drag blocks (headers, text, images, maps), configure styles, and publish their custom HTML to `sites.project_html`.

### Article 3: Configuring Gmail OAuth and Automated Follow-ups
*   **Target Group:** Settings / Onboarding
*   **Description:** A detailed walkthrough of the settings section for Gmail OAuth. Explain how automated email drafts are queued, how Emma auto-replies to missed calls or confirms bookings, and how to verify that emails are sending from the business's own domain.

### Article 4: Bulk Importing Services and Pricing (CSV / Sheets)
*   **Target Group:** Features
*   **Description:** Provide a template for businesses to format their service lists. Explain how to use the spreadsheet importer in `/p/knowledge` to bulk-populate Emma's brain in seconds.

---

## 5. Compliance with Code Rules & Conventions
*   **No "Contractor" Violations:**
    The forbidden term "contractor" was successfully avoided in all help article copy, adhering strictly to the hard language rule dated 2026-07-01 in `patterns.md`. The copy correctly uses "service business" and "local business" instead.
*   **Routing and Naming Check:**
    All links inside the hardcoded HTML point correctly to kebab-case routes like `/settings-htmx`, `/p/knowledge`, and `/p/leads`.
