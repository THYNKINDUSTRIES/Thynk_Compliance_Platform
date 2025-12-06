# Comment Deadline Reminder System

## Overview
Automated email notification system that sends reminders to users before comment period deadlines for regulations they've favorited.

## Features

### 1. Automatic Subscription
- When a user favorites a regulation with an open comment period, they're automatically subscribed to deadline reminders
- Reminders are sent at 7 days, 3 days, and 1 day before the deadline
- Users can customize which reminders they receive

### 2. User Preferences
Navigate to **Notification Preferences > Comment Reminders** to configure:
- Enable/disable all comment reminders
- Choose which reminder intervals to receive (7-day, 3-day, 1-day)
- Unsubscribe from specific regulations

### 3. Email Notifications
Reminder emails include:
- Regulation title and details
- Exact deadline date
- Days remaining until deadline
- Direct link to view regulation and submit comment
- Color-coded urgency (blue for 7-day, orange for 3-day, red for 1-day)
- Unsubscribe link

### 4. Database Schema

#### comment_deadline_reminders table
```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- instrument_id: UUID (references instrument)
- comment_deadline: TIMESTAMPTZ
- remind_at_7_days: BOOLEAN (default true)
- remind_at_3_days: BOOLEAN (default true)
- remind_at_1_day: BOOLEAN (default true)
- sent_7_days: BOOLEAN (default false)
- sent_3_days: BOOLEAN (default false)
- sent_1_day: BOOLEAN (default false)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

#### user_profiles additions
```sql
- comment_reminders_enabled: BOOLEAN (default true)
- comment_reminder_7_days: BOOLEAN (default true)
- comment_reminder_3_days: BOOLEAN (default true)
- comment_reminder_1_day: BOOLEAN (default true)
```

## Edge Functions

### process-comment-deadline-reminders
**Purpose**: Scheduled function that checks for upcoming deadlines and sends reminder emails

**Schedule**: Runs daily (should be configured in scheduled-poller-cron)

**Logic**:
1. Fetches all pending reminders with deadlines in the future
2. Calculates days until deadline
3. Checks if reminder should be sent based on:
   - Days until deadline (7, 3, or 1)
   - Whether that reminder has already been sent
   - User's reminder preferences
4. Sends email via send-comment-deadline-reminder function
5. Updates reminder record to mark as sent

### send-comment-deadline-reminder
**Purpose**: Sends individual reminder email to user

**Parameters**:
- userId: User ID
- instrumentId: Regulation ID
- regulationTitle: Title of regulation
- commentDeadline: Deadline timestamp
- daysUntilDeadline: Number of days (7, 3, or 1)
- userEmail: User's email address

**Email Template**: Color-coded HTML email with urgency indicators

## Frontend Components

### CommentReminderPreferences
Location: `src/components/CommentReminderPreferences.tsx`

Features:
- Toggle all comment reminders on/off
- Individual toggles for 7-day, 3-day, and 1-day reminders
- Real-time save functionality
- Loading states

### FavoriteButton (Enhanced)
Location: `src/components/FavoriteButton.tsx`

New functionality:
- Checks if regulation has comment deadline
- Automatically creates reminder subscription when favoriting
- Deletes reminder subscription when unfavoriting
- Shows toast notification about reminder setup

### Unsubscribe Page (Enhanced)
Location: `src/pages/Unsubscribe.tsx`

Supports:
- Digest email unsubscribe (existing)
- Comment reminder unsubscribe (new)
- URL parameters: `?type=comment_reminders&user={userId}`

## Setup Instructions

### 1. Database Setup
Already completed - tables and columns created

### 2. Edge Function Deployment
Functions deployed:
- `process-comment-deadline-reminders` ✅
- `send-comment-deadline-reminder` ✅ (NOW DEPLOYED)

### 3. Schedule Configuration
✅ **COMPLETED** - Integrated into `scheduled-poller-cron` function

The comment reminder processing now runs automatically:
- **Schedule**: Daily at 9 AM UTC
- **Function**: `process-comment-deadline-reminders`
- **Triggered by**: `scheduled-poller-cron` edge function
- **Integration**: Checks current hour and runs reminder processing when hour === 9

The scheduled-poller-cron function now handles:
1. Federal Register polling (continuous)
2. Regulations.gov polling (continuous)
3. Comment deadline reminders (daily at 9 AM UTC)


### 4. Environment Variables
Required (already configured):
- `RESEND_API_KEY`: For sending emails
- `APP_URL`: Base URL for links in emails

## Usage Flow

1. **User favorites regulation with comment period**
   - FavoriteButton creates entry in user_favorites
   - FavoriteButton creates entry in comment_deadline_reminders
   - User sees confirmation toast

2. **Daily processing (9 AM UTC)**
   - process-comment-deadline-reminders runs
   - Checks all pending reminders
   - Sends emails for reminders due today
   - Marks reminders as sent

3. **User receives email**
   - Opens email with deadline information
   - Clicks link to view regulation
   - Can submit comment or manage preferences

4. **User manages preferences**
   - Goes to Notification Preferences > Comment Reminders
   - Toggles specific reminder intervals
   - Saves preferences

5. **Unsubscribe**
   - Clicks unsubscribe link in email
   - Redirected to unsubscribe page
   - comment_reminders_enabled set to false

## Testing

### Manual Testing
1. Favorite a regulation with an upcoming comment deadline
2. Check comment_deadline_reminders table for new entry
3. Manually invoke process-comment-deadline-reminders function
4. Verify email is sent (check logs)

### Database Queries
```sql
-- View all active reminders
SELECT * FROM comment_deadline_reminders 
WHERE NOT (sent_7_days AND sent_3_days AND sent_1_day)
ORDER BY comment_deadline;

-- View user's reminder preferences
SELECT comment_reminders_enabled, comment_reminder_7_days, 
       comment_reminder_3_days, comment_reminder_1_day
FROM user_profiles WHERE id = 'user-id';

-- Check sent reminders
SELECT * FROM comment_deadline_reminders 
WHERE sent_7_days = true OR sent_3_days = true OR sent_1_day = true;
```

## Future Enhancements

1. **Custom Reminder Times**
   - Allow users to set custom reminder intervals
   - Support for multiple custom reminders

2. **SMS Notifications**
   - Add phone number to user profiles
   - Send SMS reminders via Twilio

3. **In-App Notifications**
   - Show deadline reminders in notification center
   - Badge indicators for upcoming deadlines

4. **Batch Processing**
   - Group multiple reminders into single email
   - "You have 3 comment deadlines approaching"

5. **Reminder History**
   - Show users which reminders they've received
   - Track email open rates and click-through

6. **Smart Scheduling**
   - Send reminders at user's preferred time
   - Timezone-aware scheduling
