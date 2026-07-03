# Branch Live — Route Map
# Auto-generated context for AI coding agents. Update when routes change.
# See also: tables.md, auth.md, patterns.md

## Request Routing (worker.js ~line 10900+)

Routes are matched in order. First match wins. All /api/* routes check auth before handler.

### Public pages (no auth)
| Method | Path | Handler | Notes |
|--------|------|---------|-------|
| GET | / | Landing page (Pages) | Served by Cloudflare Pages, not worker |
| GET | /login-htmx | loginPage() | Login form |
| POST | /login-htmx | handleLogin() | Sets bl_session cookie |
| GET | /signup | signup page (Pages) | |
| GET | /s/{slug} | handlePublicSite() | Business public site |
| GET | /s/{slug}/blog | handleBusinessBlogList() | Blog list |
| GET | /s/{slug}/blog/{post} | handleBusinessBlogPost() | Single post |
| GET | /sitemap-sites.xml | Sitemap handler | XML sitemap |
| POST | /api/stripe/webhook | handleStripeWebhook() | Stripe signature verified |

### Dashboard pages (cookie auth — bl_session)
| Method | Path | Handler | Notes |
|--------|------|---------|-------|
| GET | /p/overview | handleDashboardOverview() | Stats + activity |
| GET | /p/calendar | handleCalendar() | Calendar view |
| GET | /p/leads | handleLeadsList() | Lead management |
| GET | /p/calls | handleCallsList() | Call log |
| GET | /p/knowledge | handleKnowledgeList() | KB / services |
| GET | /p/gallery | handleGallery() | Photos |
| GET | /p/website | handleWebsiteBuilderHtmx() | Site builder |
| GET | /p/blog | handleBusinessBlogHtmx() | Blog management |
| GET | /p/social | handleSocialHtmx() | Social posts |
| GET | /p/analytics | handleAnalyticsHtmx() | Business stats |
| GET | /p/billing | handleBilling() | Plans + add-ons |
| GET | /p/outreach | handleOutreach() | Prospect finder |
| GET | /settings-htmx | handleSettingsHtmx() | Settings form |
| POST | /settings-htmx | handleSettingsUpdate() | Save settings |

### Admin pages (cookie auth + requireAdmin)
| Method | Path | Handler | Notes |
|--------|------|---------|-------|
| GET | /p/admin | admin dashboard | |
| GET | /p/admin/sites | handleAdminSites() | All business sites |
| GET | /p/admin/outreach | handleAdminOutreachHtmx() | |
| GET | /p/admin/analytics | handleAdminAnalytics() | Platform stats |
| GET | /p/admin/blog | handleAdminBlog() | Platform blog |
| GET | /p/admin/cblogs | handleAdminCblogs() | Business blogs |
| POST | /api/admin/blog/create | Create platform blog post | |
| POST | /api/admin/cblogs/toggle | Toggle business blog addon | |
| POST | /api/admin/cblogs/generate | Generate business blog posts | |

### API endpoints (cookie auth unless noted)
| Method | Path | Handler | Notes |
|--------|------|---------|-------|
| GET | /api/sites | getSites() | List user sites |
| POST | /api/sites/config | saveSiteConfig() | Save builder config |
| PUT | /api/sites/config | publishSite() | Publish/unpublish |
| GET | /api/settings | getSettings() | |
| POST | /api/settings | updateSettings() | |
| POST | /api/settings/addon | handleAddonToggle() | Toggle add-on + Stripe sync |
| POST | /api/settings/addon-htmx | handleSettingsAddonHtmx() | |
| POST | /api/addon/unlock-htmx | Addon unlock from preview | |
| POST | /api/photos | Photo upload | multipart |
| POST | /api/reviews/sync | syncReviews() | Pull Google reviews |
| POST | /api/social/generate | Generate social drafts | |
| POST | /api/social/publish | Publish to Facebook/IG | |
| POST | /api/social/publish-all | Publish all drafts | |
| DELETE | /api/social/posts/:id | Delete draft | |
| POST | /api/blog/generate | Generate blog post | |
| POST | /api/stripe/checkout | Create checkout session | |
| POST | /api/cron/reviews-sync | Bulk review sync | Cron only |
| POST | /api/cron/social-autopost | Bulk social auto-post | Cron only |
| POST | /api/cron/videos-generate | Bulk video generate | Cron only |

### Legacy / SPA endpoints
| Method | Path | Notes |
|--------|------|-------|
| GET | /dashboard | Redirects to Pages SPA |
| POST | /api/login | Bearer token auth |
| POST | /api/register | User registration |
