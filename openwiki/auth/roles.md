# Role-Based Permissions

## Permission Levels

1. **Admin** - Full system access
2. **Owner** - Business account owner
3. **Manager** - Can manage bookings/leads
4. **Receptionist** - Read-only + call handling
5. **Customer** - Self-service booking

## Implementation

- Roles stored in `user_roles` table (portal.db)
- Middleware checks `ROUTE_MIN_ROLE` for each endpoint
- `resolveContext()` helper determines user's access level

## Team Features

- `team_invites` table tracks pending invitations
- Invitees receive email with signup link
- Role assigned at acceptance

## Key Security Rules

- Users can only access their own business data
- API filters include `WHERE user_id = ?` on all queries
- Admin endpoints require explicit role check