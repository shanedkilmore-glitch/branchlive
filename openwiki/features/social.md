# Social Auto-Posting

## Supported Platforms

- Facebook
- Instagram
- Twitter
- LinkedIn

## Features

- Scheduled posting
- Content library
- Performance analytics
- Hashtag suggestions

## Implementation

- Uses platform APIs with OAuth
- Posts stored in `social_posts` table
- Media uploaded to Cloudflare Images

## Workflow

1. User creates post in dashboard
2. System queues for scheduled time
3. Emma AI can suggest content based on:
   - Recent appointments
   - Seasonal promotions
   - Industry trends