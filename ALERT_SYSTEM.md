# Email Alert System Documentation

## Overview
The Integrated Regulatory Platform now includes a comprehensive email alert system that allows users to subscribe to notifications for new regulations matching their specific criteria.

## Features

### 1. User Subscription Management
- **Email-based subscriptions** - Users can subscribe with just an email address
- **Multiple alert profiles** - Each user can create multiple alert configurations
- **Profile management** - Easy creation, updating, and deletion of alert profiles

### 2. Alert Criteria
Users can configure alerts based on:
- **Jurisdictions** - Specific states or federal regulations
- **Product Categories** - Filter by industry or product type
- **Entity Types** - Agencies, citations, requirements, etc.
- **Keywords** - Custom keyword matching in regulation titles/content
- **Critical Only** - Option to receive only high-priority updates

### 3. Delivery Options
- **Immediate Alerts** - Real-time notifications for new matching regulations
- **Daily Digest** - Consolidated daily summary of new regulations
- **Weekly Digest** - Weekly roundup of regulatory updates

### 4. Database Schema

#### user_profiles
- `id` - UUID primary key
- `email` - Unique email address
- `name` - User's name (optional)
- `email_verified` - Verification status
- `unsubscribe_token` - Unique token for one-click unsubscribe
- `created_at`, `updated_at` - Timestamps

#### alert_profiles
- `id` - UUID primary key
- `user_id` - Reference to user_profiles
- `profile_name` - Descriptive name for the alert
- `is_active` - Enable/disable alerts
- `frequency` - 'immediate', 'daily', or 'weekly'
- `jurisdictions` - Array of jurisdiction codes
- `product_categories` - Array of product categories
- `entity_types` - Array of entity types
- `keywords` - Array of keywords to match
- `critical_only` - Boolean flag
- `created_at`, `updated_at` - Timestamps

#### alert_history
- `id` - UUID primary key
- `user_id` - Reference to user_profiles
- `alert_profile_id` - Reference to alert_profiles
- `instrument_id` - Reference to instrument (regulation)
- `sent_at` - Timestamp of email sent
- `email_status` - Delivery status
- `digest_date` - Date for grouping digest emails

## Edge Functions

### 1. send-alert-email
**Purpose:** Send email notifications via Resend API

**Endpoint:** `/functions/v1/send-alert-email`

**Request Body:**
```json
{
  "to": "user@example.com",
  "subject": "New Regulation Alert",
  "html": "<html>...</html>",
  "type": "alert"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "abc123",
  "type": "alert"
}
```

### 2. manage-alerts
**Purpose:** CRUD operations for alert profiles and user subscriptions

**Endpoint:** `/functions/v1/manage-alerts`

**Actions:**
- `subscribe` - Create new user and alert profile
- `update` - Update existing alert profile
- `delete` - Delete alert profile
- `list` - Get all profiles for a user
- `get_user` - Get user by email

**Example Request (Subscribe):**
```json
{
  "action": "subscribe",
  "data": {
    "email": "user@example.com",
    "name": "John Doe",
    "profileName": "California Cannabis Alerts",
    "frequency": "daily",
    "jurisdictions": ["CA"],
    "keywords": ["cannabis", "testing"],
    "criticalOnly": false
  }
}
```

### 3. process-alerts
**Purpose:** Match new regulations against alert profiles and trigger notifications

**Endpoint:** `/functions/v1/process-alerts`

**Request Body:**
```json
{
  "frequency": "daily"
}
```

**Response:**
```json
{
  "success": true,
  "alertsToSend": 5,
  "totalInstruments": 12
}
```

## Frontend Components

### AlertPreferences Page (`/alerts`)
- **Tabbed interface** with "Subscribe" and "Manage Alerts" sections
- **Subscription form** for creating new alert profiles
- **Profile list** showing all active and inactive alerts
- **Delete functionality** with confirmation

### AlertBanner Component
- Promotional banner on homepage
- Call-to-action buttons linking to alert preferences
- Feature highlights (jurisdiction, category, keyword filtering)

## Email Service (Resend)

### Configuration
- **API Key:** Stored as `RESEND_API_KEY` environment variable
- **From Address:** `RegWatch Alerts <alerts@regwatch.app>`
- **Free Tier:** 3,000 emails/month, 100/day limit

### Email Templates
Email templates should include:
- Regulation title and summary
- Jurisdiction and effective date
- Direct link to regulation details
- Unsubscribe link using user's `unsubscribe_token`

## Usage Flow

1. **User subscribes** via `/alerts` page
2. **Profile created** in database with criteria
3. **Poller functions** detect new regulations
4. **process-alerts** matches regulations against profiles
5. **send-alert-email** delivers notifications
6. **Alert history** recorded for tracking

## Cost Management

### Resend Pricing
- **Free:** 3,000 emails/month
- **Paid:** $20/mo for 50,000 emails
- **Scale:** $0.0004 per email after quota

### Optimization Strategies
- Use digest emails (daily/weekly) to reduce volume
- Implement smart batching for multiple alerts
- Track delivery rates and bounce handling
- Monitor usage dashboard in Resend

## Future Enhancements
- Email verification flow
- SMS/push notification options
- Advanced filtering (date ranges, document types)
- Alert analytics dashboard
- Collaborative alert sharing
- Webhook integrations for third-party systems
