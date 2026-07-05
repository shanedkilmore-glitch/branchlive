# Branch Live — Database Schema
# Auto-generated context for AI coding agents. Update when migrations change.
# See also: routes.md, auth.md, patterns.md

All tables live in Cloudflare D1. Migrations are idempotent (CREATE TABLE IF NOT EXISTS / ALTER TABLE ADD COLUMN wrapped in try/catch) in initDB().

## Core Tables

### users
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | Auto-increment |
| email | TEXT UNIQUE | Login identifier |
| password_hash | TEXT | bcrypt |
| name | TEXT | Display name |
| company | TEXT | Business name |
| created_at | TEXT | datetime('now') |

### sessions
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | UUID |
| user_id | INTEGER | FK → users.id |
| expires_at | TEXT | Session expiry |
| created_at | TEXT | |

### settings (one row per user)
| Column | Type | Notes |
|--------|------|-------|
| user_id | INTEGER PK | FK → users.id |
| business_name | TEXT | Public display name |
| forwarding_number | TEXT | Emma phone number |
| welcome_message | TEXT | Greeting |
| working_hours | TEXT | JSON array |
| industry | TEXT | e.g. "Plumbing" |
| service_area | TEXT | e.g. "Lancaster, PA" |
| service_description | TEXT | |
| notify_sms | INTEGER | 0/1 |
| notify_email | INTEGER | 0/1 |
| google_calendar_api_key | TEXT | |
| google_calendar_id | TEXT | |
| buffer_min | INTEGER | Appointment buffer |
| sms_consent | INTEGER | Twilio A2P compliance |
| gmail_email | TEXT | For email sending |
| gmail_refresh_token | TEXT | OAuth token |
| time_format | TEXT | '12h' or '24h' |
| week_start_day | INTEGER | 0=Sun |
| default_duration_min | INTEGER | Default appt length |
| timezone | TEXT | IANA, default 'America/New_York' |
| vapi_assistant_id | TEXT | |
| vapi_phone_number | TEXT | |
| vapi_phone_number_id | TEXT | |
| google_place_id | TEXT | For review sync |
| instagram_url | TEXT | Social link |
| facebook_url | TEXT | Social link |
| facebook_page_token | TEXT | For auto-posting |
| instagram_business_id | TEXT | For auto-posting |
| **Stripe fields** | | |
| stripe_customer_id | TEXT | Stripe customer |
| stripe_subscription_id | TEXT | Active subscription |
| stripe_plan | TEXT | 'base' default |
| **Add-on toggles** | | |
| addon_website | INTEGER | $9.95/mo |
| addon_reviews | INTEGER | $9.95/mo |
| addon_social | INTEGER | $9.95/mo |
| addon_blog | INTEGER | $14.95/mo |
| addon_email | INTEGER | $9.95/mo |

### sites (one per user)
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| user_id | INTEGER | FK → users.id |
| slug | TEXT UNIQUE | URL-safe business name |
| published | INTEGER | 0/1 |
| theme | TEXT | Template: 'modern', 'warmcraft', etc. |
| config | TEXT | JSON: { template, accent, headline } |
| headline | TEXT | Custom hero headline |
| accent | TEXT | Hex color |
| sections | TEXT | JSON: { services: true, about: true, ... } |
| custom_domain | TEXT | Stub for Phase 4 |

### leads
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| user_id | INTEGER | |
| caller_name | TEXT | |
| caller_phone | TEXT | |
| status | TEXT | 'new', 'contacted', 'booked', 'closed' |
| notes | TEXT | |
| urgency | TEXT | |
| created_at | TEXT | |

### call_logs
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| user_id | INTEGER | |
| caller_phone | TEXT | No caller_name column! |
| duration_sec | INTEGER | >0 = answered |
| transcript | TEXT | Call transcript |
| lead_id | INTEGER | Linked lead (nullable) |
| created_at | TEXT | |

### appointments
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| user_id | INTEGER | |
| title | TEXT | |
| customer_name | TEXT | |
| customer_phone | TEXT | |
| date | TEXT | YYYY-MM-DD |
| time | TEXT | HH:MM |
| duration_min | INTEGER | |
| status | TEXT | 'confirmed', 'cancelled' |
| notes | TEXT | |
| google_event_id | TEXT | Calendar sync |
| appointment_type_id | INTEGER | FK |
| buffer_enabled | INTEGER | |
| buffer_min | INTEGER | |

### appointment_types
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| user_id | INTEGER | |
| name | TEXT | e.g. "Estimate" |
| duration_min | INTEGER | e.g. 60 |

### knowledge (KB / services)
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| user_id | INTEGER | |
| category | TEXT | e.g. "Pavers", "Services" |
| item | TEXT | Service name |
| price | REAL | |
| notes | TEXT | |

### photos
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| user_id | INTEGER | |
| data | TEXT | Base64 or URL |
| caption | TEXT | |
| type | TEXT | 'before', 'after', 'during' |
| created_at | TEXT | |

### reviews
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| user_id | INTEGER | |
| author_name | TEXT | |
| rating | INTEGER | 1-5 |
| text | TEXT | Review body |
| google_review_id | TEXT | UNIQUE(user_id, google_review_id) |
| profile_photo_url | TEXT | |
| reviewed_at | TEXT | |
| created_at | TEXT | |

### business_blog_posts
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| user_id | INTEGER | |
| title | TEXT | |
| slug | TEXT | URL-safe |
| content | TEXT | Markdown/HTML |
| status | TEXT | 'published' |
| published_at | TEXT | |

### social_posts
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| user_id | INTEGER | |
| platform | TEXT | 'facebook' or 'instagram' |
| content | TEXT | Post text |
| image_url | TEXT | |
| source_type | TEXT | 'review', 'job', 'kb_item' |
| source_id | INTEGER | |
| status | TEXT | 'draft', 'published', 'failed' |
| platform_post_id | TEXT | FB/IG post ID |
| published_at | TEXT | |

### subscriptions
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| user_id | INTEGER | |
| status | TEXT | 'trial', 'active', 'cancelled' |
| plan | TEXT | 'base' |
| stripe_customer_id | TEXT | |

### affiliate
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| user_id | INTEGER | |
| code | TEXT UNIQUE | Referral code |
| name | TEXT | |
| commission_rate | REAL | e.g. 0.20 |

### email_log
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| user_id | INTEGER | |
| lead_id | INTEGER | Nullable |
| appointment_id | INTEGER | Nullable |
| to_email | TEXT | |
| template | TEXT | e.g. 'welcome_checkout', 'trial_active' |
| status | TEXT | 'sent', 'failed' |
| resend_id | TEXT | |
| created_at | TEXT | |

### videos
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| user_id | INTEGER | |
| title | TEXT | |
| source_type | TEXT | 'before_after', 'review', 'service' |
| source_ids | TEXT | Comma-separated |
| file_path | TEXT | |
| status | TEXT | 'pending', 'generating', 'ready', 'failed' |
| duration_sec | INTEGER | |
| created_at | TEXT | |

### estimates
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | AUTOINCREMENT |
| user_id | INTEGER | NOT NULL — owner |
| lead_id | INTEGER | linked lead (nullable) |
| title | TEXT | quote title |
| items | TEXT | JSON array of line items |
| total | REAL | computed server-side |
| status | TEXT | 'draft', 'sent', 'approved', 'paid' |
| stripe_payment_link | TEXT | Stripe payment link URL |
| created_at | TEXT | |

### Key indexes
- idx_cblog_user ON business_blog_posts(user_id, published_at DESC)
- idx_reviews_user ON reviews(user_id, reviewed_at DESC)
- idx_sp_user ON social_posts(user_id, created_at DESC)
- idx_estimates_user ON estimates(user_id, status)
