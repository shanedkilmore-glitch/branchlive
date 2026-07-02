# Database Schema

## Political Tracking (branchlive.db)

### people

- `id` - Primary key
- `name` - Full name
- `role` - Political position
- `branch` - Government branch (Executive, Legislative, etc.)
- `parent_id` - Organizational hierarchy
- `bio` - Biography text
- `photo_url` - Profile image
- `status` - Active/outgoing/etc.
- `party` - Political affiliation

### articles

- `id` - Primary key
- `title` - Headline
- `url` - Source URL
- `source` - Publication
- `bias` - Political bias rating
- `summary` - AI-generated summary

### article_people

- `article_id` - Foreign key
- `person_id` - Foreign key

### events

- `id` - Primary key
- `person_id` - Foreign key
- `date` - Event date
- `description` - What happened
- `event_type` - Classification

## Business Portal (portal.db)

### users

- `id` - Primary key
- `email` - Login credential
- `password_hash` - SHA-256 or bcrypt
- `company` - Business name

### leads

- `id` - Primary key
- `user_id` - Business owner
- `caller_phone` - Customer contact
- `job_details` - Service needed
- `status` - New/in-progress/closed

### appointments

- `id` - Primary key
- `user_id` - Business owner
- `customer_name` - Who's coming
- `date`/`time` - When
- `duration_min` - How long
- `google_event_id` - Calendar sync

### subscriptions

- `user_id` - Primary key
- `stripe_customer_id` - Billing reference
- `plan` - Tier (free/pro/etc.)
- `status` - Active/trial/canceled