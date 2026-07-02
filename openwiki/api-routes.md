# API Routes

## Political Tracking API (app.py)

### People

- `GET /api/people` - List all political figures
- `GET /api/person/<id>` - Get details for specific person
- `GET /person/<id>` - HTML page for person

### Articles

- `GET /api/articles` - List recent articles
  - Optional `person_id` param to filter by subject

### Events

- Embedded in person pages via SQL join

## Business Portal API (worker.js)

### Authentication

- `POST /api/auth/login` - Email/password login
- `POST /api/auth/register` - New account creation
- `POST /api/auth/reset-password` - Password reset

### Appointments

- `GET /api/appointments` - List upcoming bookings
- `POST /api/appointments` - Create new booking
- `PUT /api/appointments/:id` - Update booking

### Leads

- `GET /api/leads` - List customer leads
- `POST /api/leads` - Create new lead from call

### Settings

- `GET /api/settings` - Get business configuration
- `PUT /api/settings` - Update business info

### Billing

- `GET /api/billing` - Get subscription status
- `POST /api/billing/checkout` - Start Stripe checkout

### Emma AI

- `POST /api/emma/call` - Process incoming call
- `POST /api/emma/transcript` - Save call transcript