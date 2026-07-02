# Stripe Billing Integration

## Subscription Flow

1. User selects plan
2. `POST /api/billing/checkout` creates Stripe session
3. Client redirects to Stripe checkout
4. Webhook updates `subscriptions` table

## Data Model

### subscriptions

- `user_id` - Primary key
- `stripe_customer_id` - Reference
- `plan` - Tier (free/pro/etc.)
- `status` - Active/trial/canceled
- `trial_end` - Date trial expires

## Pricing Tiers

- **Free**: Basic features
- **Pro**: Advanced booking + Emma AI
- **Business**: Team features + API

## Webhooks

- `payment_succeeded` - Renew access
- `payment_failed` - Notify user
- `subscription_canceled` - Downgrade