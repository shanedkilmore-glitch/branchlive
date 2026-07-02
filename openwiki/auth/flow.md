# Authentication Flow

## Token-Based Auth

1. User submits email/password to `/api/auth/login`
2. Server verifies credentials against `users` table
3. On success:
   - Generates random Bearer token
   - Stores token in `sessions` table (worker.js) or Flask session (app.py)
   - Returns token to client

4. Subsequent requests include `Authorization: Bearer <token>` header
5. Middleware verifies token validity before processing

## Password Handling

- Uses bcrypt when available, falls back to SHA-256
- Password reset flow:
  1. User requests reset via email
  2. System generates time-limited token
  3. Token stored in `password_resets` table
  4. Email sent with reset link
  5. Link validates token then allows password update

## Session Management

- Tokens expire after 30 days of inactivity
- Flask sessions used for web interface
- Bearer tokens used for API access