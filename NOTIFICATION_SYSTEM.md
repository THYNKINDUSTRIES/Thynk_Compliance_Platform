# Real-Time Notification System

## Overview
The Thynk Compliance Platform features a comprehensive real-time notification system that keeps users informed about important workflow events, task assignments, deadlines, and approvals.

## Features

### 1. Real-Time Notifications
- **Supabase Realtime Integration**: Instant push notifications using Supabase's real-time subscriptions
- **Automatic Updates**: Notification center updates immediately when new notifications arrive
- **No Polling Required**: Efficient WebSocket-based communication

### 2. Notification Types
- **Task Assigned**: When a user is assigned to a new task
- **Deadline Approaching**: Reminders when task deadlines are within 3 days
- **Approval Required**: When a user's approval is needed for a workflow or task
- **Comment Added**: When someone comments on a user's task
- **Task Completed**: When a task is marked as completed

### 3. Notification Center
- **Bell Icon**: Located in the header with unread count badge
- **Dropdown List**: Shows recent notifications with timestamps
- **Mark as Read**: Individual or bulk mark as read functionality
- **Click to Navigate**: Clicking notifications takes users to relevant workflow/task
- **Scroll Area**: View up to 50 most recent notifications

### 4. Notification Preferences
- **Customizable Settings**: Users can configure notification preferences per event type
- **Dual Channels**: Choose between in-app notifications, email notifications, or both
- **Granular Control**: Enable/disable notifications for each event type independently
- **Persistent Settings**: Preferences saved to database and applied to all future notifications

### 5. Email Notifications
- **HTML Templates**: Beautiful, branded email notifications using Resend API
- **Actionable Links**: Direct links to relevant workflows in the dashboard
- **Preference-Based**: Only sent if user has email notifications enabled for that event type

## Database Schema

### notifications
```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- type: VARCHAR(50) - notification type
- title: VARCHAR(255) - notification title
- message: TEXT - notification message
- related_id: UUID - ID of related workflow/task/comment
- related_type: VARCHAR(50) - 'workflow', 'task', or 'comment'
- is_read: BOOLEAN - read status
- created_at: TIMESTAMPTZ - creation timestamp
- read_at: TIMESTAMPTZ - when marked as read
```

### notification_preferences
```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- notification_type: VARCHAR(50) - type of notification
- in_app_enabled: BOOLEAN - enable in-app notifications
- email_enabled: BOOLEAN - enable email notifications
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

## Automatic Triggers

### Database Triggers
1. **Task Assignment**: Fires when a new task_assignment is created
2. **Comment Added**: Fires when a new task_comment is inserted
3. **Approval Required**: Fires when a workflow_approval is created with 'pending' status
4. **Task Completed**: Fires when a task status changes to 'completed'

### Scheduled Jobs
- **Deadline Checker**: Function `check_approaching_deadlines()` should be run daily to check for upcoming deadlines
  - Checks tasks due within 3 days
  - Prevents duplicate notifications (24-hour cooldown)
  - Automatically creates notifications for assigned users

## Usage

### For Users
1. **View Notifications**: Click the bell icon in the header
2. **Mark as Read**: Click the checkmark on individual notifications or "Mark all read" button
3. **Navigate to Content**: Click any notification to go to the related workflow/task
4. **Customize Preferences**: Go to Settings (gear icon) → Notification Preferences
5. **Enable/Disable**: Toggle in-app or email notifications for each event type

### For Developers

#### Creating Manual Notifications
```typescript
import { supabase } from '@/lib/supabase';

// Create a notification via edge function
await supabase.functions.invoke('create-notification', {
  body: {
    userId: 'user-uuid',
    type: 'task_assigned',
    title: 'New Task Assigned',
    message: 'You have been assigned to a new task',
    relatedId: 'task-uuid',
    relatedType: 'task'
  }
});
```

#### Using the Hook
```typescript
import { useNotifications } from '@/hooks/useNotifications';

function MyComponent() {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications();
  
  // Component logic...
}
```

## Edge Function: create-notification

The `create-notification` edge function handles:
1. Checking user notification preferences
2. Creating in-app notifications if enabled
3. Sending email notifications if enabled
4. Fetching user email from user_profiles table
5. Formatting and sending HTML emails via Resend API

## Security

### Row Level Security (RLS)
- Users can only view their own notifications
- Users can only update their own notifications
- System can insert notifications for any user (via service role)
- Users can only manage their own preferences

### Realtime Subscriptions
- Realtime is enabled on the notifications table
- Users automatically receive updates for their notifications
- Secure WebSocket connection authenticated via Supabase

## Best Practices

1. **Default Preferences**: New users automatically get default preferences (all enabled)
2. **Notification Fatigue**: 24-hour cooldown on deadline reminders prevents spam
3. **Batch Operations**: Use bulk mark as read for better UX
4. **Email Formatting**: HTML emails with clear CTAs and branding
5. **Error Handling**: Graceful fallbacks if email sending fails

## Future Enhancements

- Push notifications for mobile devices
- Notification grouping (e.g., "3 new comments")
- Digest emails (daily/weekly summaries)
- Notification sound effects
- Desktop notifications via Web Notifications API
- SMS notifications for critical events
- Slack/Teams integration
- Advanced filtering and search in notification center
