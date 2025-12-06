# Database Setup and Troubleshooting

## User Account Creation

The system automatically creates user profiles and notification preferences when a new user signs up through Supabase Auth.

### Automatic User Setup Flow

1. User signs up via the Signup page
2. Supabase Auth creates the user in `auth.users`
3. Database trigger `on_auth_user_created` fires automatically
4. Trigger function `handle_new_user()` creates:
   - User profile in `user_profiles` table
   - Default notification preferences in `notification_preferences` table

### Default Notification Preferences

New users get these default settings:
- **In-App Notifications**: Enabled for all types
- **Email Notifications**: 
  - Enabled: Task assigned, approval required, deadline approaching
  - Disabled: Comments, task completed
- **Digest Mode**: Disabled by default
- **Digest Frequency**: Daily at 9:00 AM UTC
- **Digest Day**: Monday (for weekly digests)

## Row Level Security (RLS)

All tables have RLS enabled with these policies:

### user_profiles
- Users can view their own profile
- Users can update their own profile
- Users can insert their own profile

### notification_preferences
- Users can view their own preferences
- Users can update their own preferences
- Users can insert their own preferences

### notifications
- Users can view their own notifications
- Users can update their own notifications (mark as read)
- System can insert notifications (service role)

## Troubleshooting Account Creation Errors

### Error: "Failed to create user profile"

**Cause**: Trigger function failed or RLS policies blocking insert

**Solutions**:
1. Check if trigger exists:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```

2. Check if function exists:
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'handle_new_user';
   ```

3. Verify RLS policies:
   ```sql
   SELECT * FROM pg_policies WHERE tablename IN ('user_profiles', 'notification_preferences');
   ```

4. Test trigger manually:
   ```sql
   SELECT handle_new_user();
   ```

### Error: "Permission denied for table user_profiles"

**Cause**: RLS policies not set up correctly

**Solution**: Run the RLS setup queries from the deployment

### Error: "Duplicate key value violates unique constraint"

**Cause**: User already exists in database

**Solution**: 
1. Delete existing user from Supabase Auth dashboard
2. Or manually clean up orphaned records:
   ```sql
   DELETE FROM user_profiles WHERE id = 'user-id';
   DELETE FROM notification_preferences WHERE user_id = 'user-id';
   ```

## Manual User Setup (if needed)

If automatic setup fails, you can manually create records:

```sql
-- Create user profile
INSERT INTO user_profiles (id, email, full_name, created_at, updated_at)
VALUES ('user-id', 'user@example.com', 'User Name', NOW(), NOW());

-- Create notification preferences
INSERT INTO notification_preferences (
  user_id,
  task_assigned_in_app,
  task_assigned_email,
  comment_added_in_app,
  comment_added_email,
  approval_required_in_app,
  approval_required_email,
  task_completed_in_app,
  task_completed_email,
  deadline_approaching_in_app,
  deadline_approaching_email,
  digest_enabled,
  digest_frequency,
  digest_time,
  digest_day
)
VALUES (
  'user-id',
  true, true, true, false, true, true, true, false, true, true,
  false, 'daily', '09:00', 1
);
```

## Verifying Setup

After creating an account, verify everything is set up:

```sql
-- Check user profile exists
SELECT * FROM user_profiles WHERE id = auth.uid();

-- Check notification preferences exist
SELECT * FROM notification_preferences WHERE user_id = auth.uid();

-- Check you can view notifications (should return empty array initially)
SELECT * FROM notifications WHERE user_id = auth.uid();
```

## Database Migrations

If you need to reset or update the schema:

1. **Reset trigger**:
   ```sql
   DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
   DROP FUNCTION IF EXISTS handle_new_user();
   -- Then recreate using the setup queries
   ```

2. **Reset RLS policies**:
   ```sql
   DROP POLICY IF EXISTS "policy_name" ON table_name;
   -- Then recreate using the setup queries
   ```

3. **Add missing columns** (if schema was updated):
   ```sql
   ALTER TABLE notification_preferences 
   ADD COLUMN IF NOT EXISTS digest_enabled BOOLEAN DEFAULT false;
   -- etc.
   ```
