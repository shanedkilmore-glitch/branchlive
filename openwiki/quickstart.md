# Branch Live Quickstart

## Overview

Branch Live is a comprehensive platform with two main components:

1. **Political Mind Map & News Tracker** (app.py) - Tracks political figures, news articles, and events
2. **AI Receptionist Portal** (worker.js) - Provides business services including:
   - AI voice assistant (Emma)
   - Calendar/booking system
   - Website builder templates
   - Social auto-posting
   - Outreach pipeline
   - Stripe billing integration

## Core Architecture

- **Frontend**: Static HTML/JS served via Cloudflare Pages
- **Backend**:
  - Political tracking: Flask API (app.py) with SQLite database
  - Business portal: Cloudflare Worker (worker.js) with D1 database
- **Authentication**: Token-based (Bearer tokens) with role-based permissions

## Key Features

- [API Routes](api-routes.md)
- [Database Schema](data-models/schema.md)
- [Authentication Flow](auth/flow.md)
- [Role-Based Permissions](auth/roles.md)
- [Emma AI Voice Assistant](features/emma.md)
- [Calendar & Booking System](features/calendar.md)
- [Stripe Billing](integrations/stripe.md)
- [Social Auto-Posting](features/social.md)
- [Outreach Pipeline](features/outreach.md)

## Getting Started

1. **Political Tracking**:
   - Run `python app.py` to start Flask server
   - Access API at `http://localhost:7893`

2. **Business Portal**:
   - Deploy Cloudflare Worker with `npm run deploy`
   - Configure environment variables (D1, Resend API, Stripe)

## Development

- Database migrations handled via direct SQL in code
- Testing: Jest for worker.js, pytest for app.py
- Linting: ESLint for JS, flake8 for Python