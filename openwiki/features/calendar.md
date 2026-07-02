# Calendar & Booking System

## Features

- Online booking widget
- Google Calendar sync
- Buffer time between appointments
- Service-specific durations
- Blocked time slots

## Data Model

### appointments

- `user_id` - Business owner
- `customer_name`/`phone` - Who's coming
- `date`/`time` - When
- `duration_min` - Length
- `status` - Confirmed/canceled

### appointment_types

- `name` - Service name
- `duration_min` - Default length
- `color` - Calendar display

### blocked_time

- Manual unavailability markers

## Integration

- Google Calendar API for 2-way sync
- SMS/email reminders
- Emma AI handles scheduling calls