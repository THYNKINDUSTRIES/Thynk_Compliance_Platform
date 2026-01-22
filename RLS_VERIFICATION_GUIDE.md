# RLS Verification Guide

After running the comprehensive RLS fix SQL script, use this guide to verify everything is working correctly.

## Quick Start: In-App Testing

The easiest way to test RLS is through the built-in test panel:

1. **Navigate to Settings** (`/settings`)
2. **Find the "Database Security (RLS)" card**
3. **Click "Run Tests"**
4. **Review results** - all tests should show green checkmarks

This will automatically test:
- Authentication status
- Template access (public)
- Checklist access (own only)
- Checklist items access
- Notifications access (own only)
- Favorites access (own only)
- Regulations access (public)
- Edge function CORS
- Create/delete checklist operations
- Data isolation between users

---


## Step 1: Verify RLS Policies Are In Place

Run these queries in Supabase SQL Editor to confirm policies were created:



### Check All RLS Policies
```sql
-- List all policies on key tables
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
    'checklist_templates',
    'compliance_checklists', 
    'checklist_items',
    'public_comments',
    'notifications',
    'user_favorites',
    'instrument',
    'ingestion_log',
    'extracted_entity',
    'jurisdiction',
    'tags',
    'instrument_tags'
)
ORDER BY tablename, cmd;
```

### Verify RLS Is Enabled
```sql
-- Check RLS status on all tables
SELECT 
    c.relname as table_name,
    CASE WHEN c.relrowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status,
    CASE WHEN c.relforcerowsecurity THEN 'FORCED' ELSE 'NOT FORCED' END as force_status
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
AND c.relkind = 'r'
AND c.relname IN (
    'checklist_templates',
    'compliance_checklists', 
    'checklist_items',
    'public_comments',
    'notifications',
    'user_favorites',
    'instrument',
    'ingestion_log',
    'extracted_entity',
    'jurisdiction',
    'tags',
    'instrument_tags'
)
ORDER BY c.relname;
```

**Expected Result**: All tables should show `ENABLED` for RLS status.

### Count Policies Per Table
```sql
-- Count policies per table
SELECT 
    tablename,
    COUNT(*) as policy_count,
    string_agg(cmd, ', ') as operations
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
    'checklist_templates',
    'compliance_checklists', 
    'checklist_items',
    'public_comments',
    'notifications',
    'user_favorites',
    'instrument'
)
GROUP BY tablename
ORDER BY tablename;
```

**Expected Counts**:
| Table | Expected Policies |
|-------|------------------|
| checklist_templates | 4 (SELECT, INSERT, UPDATE, DELETE) |
| compliance_checklists | 4 (SELECT, INSERT, UPDATE, DELETE) |
| checklist_items | 4 (SELECT, INSERT, UPDATE, DELETE) |
| public_comments | 4 (SELECT, INSERT, UPDATE, DELETE) |
| notifications | 3 (SELECT, INSERT, UPDATE) |
| user_favorites | 3 (SELECT, INSERT, DELETE) |
| instrument | 1 (SELECT) |

---

## Step 2: Test Edge Function CORS

### Test OPTIONS Preflight Request
```bash
curl -i -X OPTIONS 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/generate-checklist-from-template' \
  -H 'Origin: https://www.thynkflow.io' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: authorization,content-type'
```

**Expected Response**:
- Status: `204 No Content`
- Headers should include:
  - `Access-Control-Allow-Origin: *`
  - `Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type`

### Test POST Without Auth (Should Fail)
```bash
curl -i -X POST 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/generate-checklist-from-template' \
  -H 'Content-Type: application/json' \
  -H 'apikey: YOUR_ANON_KEY' \
  -d '{"templateId": "test-123"}'
```

**Expected Response**:
- Status: `400 Bad Request`
- Body: `{"success": false, "error": "Missing authorization header"}`

---

## Step 3: Test Data Isolation

### Get Your User ID
First, get your authenticated user ID from the app or run:
```sql
-- Get recent users (for testing)
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;
```

### Test User Can Only See Own Checklists
```sql
-- As a specific user, test what they can see
-- Replace 'USER_ID_HERE' with an actual user ID

-- This simulates what a user would see
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "USER_ID_HERE"}';

SELECT id, name, created_by, user_id 
FROM compliance_checklists 
LIMIT 10;

-- Reset
RESET ROLE;
```

### Verify Cross-User Data Isolation
```sql
-- Create test data for two different users to verify isolation
-- This is a read-only verification query

-- Check if any user can see another user's checklists
SELECT 
    c.id,
    c.name,
    c.created_by,
    u.email as owner_email
FROM compliance_checklists c
LEFT JOIN auth.users u ON c.created_by = u.id
ORDER BY c.created_at DESC
LIMIT 20;
```

---

## Step 4: Test via the Application UI

### Test 1: Generate Checklist from Template
1. Log in to the application
2. Navigate to **Template Library** (`/templates`)
3. Click on any template to preview it
4. Click **"Generate Checklist"**
5. **Expected**: Checklist is created successfully, you're redirected to `/checklists`

### Test 2: View Only Your Checklists
1. Navigate to **Compliance Checklists** (`/checklists`)
2. **Expected**: You should only see checklists you created
3. Try creating a new checklist
4. **Expected**: The new checklist appears in your list

### Test 3: Checklist Items Access
1. Click on a checklist you own
2. **Expected**: You can see all items in that checklist
3. Try checking/unchecking items
4. **Expected**: Items update successfully

### Test 4: Delete Your Own Checklist
1. Click the delete button on one of your checklists
2. **Expected**: Checklist is deleted successfully

---

## Step 5: Test with Multiple Users

To fully verify RLS data isolation:

### User A Actions:
1. Log in as User A
2. Create a checklist named "User A Test Checklist"
3. Note the checklist ID from the URL or database

### User B Actions:
1. Log out and log in as User B
2. Navigate to Compliance Checklists
3. **Expected**: User A's checklist should NOT appear
4. Try to access User A's checklist directly via URL: `/checklists?id=USER_A_CHECKLIST_ID`
5. **Expected**: Should not load or show "not found"

### Direct Database Test (Admin Only):
```sql
-- Verify User B cannot see User A's data via RLS
-- Run this as the service role to see all data, then verify RLS blocks it

-- First, see all checklists (service role bypasses RLS)
SELECT id, name, created_by FROM compliance_checklists;

-- Then test what User B would see
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "USER_B_ID_HERE"}';

-- This should only return User B's checklists
SELECT id, name, created_by FROM compliance_checklists;

RESET ROLE;
```

---

## Step 6: Verify Edge Function Logs

After testing the generate-checklist-from-template function:

1. Go to Supabase Dashboard → Edge Functions
2. Click on `generate-checklist-from-template`
3. Click on **Logs**
4. Look for recent invocations
5. **Expected logs**:
   - `[generate-checklist] User authenticated: <user-id>`
   - `[generate-checklist] Fetching template: <template-id>`
   - `[generate-checklist] Template found: <template-name>`
   - `[generate-checklist] Checklist created: <checklist-id>`
   - `[generate-checklist] Creating X items`
   - `[generate-checklist] Success! Checklist ID: <checklist-id>`

---

## Troubleshooting

### Issue: "new row violates row-level security policy"
**Cause**: The INSERT policy is not allowing the operation.
**Fix**: Ensure the user_id or created_by field matches the authenticated user's ID.

```sql
-- Check the INSERT policy
SELECT * FROM pg_policies 
WHERE tablename = 'compliance_checklists' 
AND cmd = 'INSERT';
```

### Issue: User can see other users' data
**Cause**: RLS policy is too permissive or RLS is disabled.
**Fix**: 
```sql
-- Verify RLS is enabled
SELECT relrowsecurity FROM pg_class WHERE relname = 'compliance_checklists';

-- If false, enable it
ALTER TABLE compliance_checklists ENABLE ROW LEVEL SECURITY;
```

### Issue: Edge function returns "Unauthorized"
**Cause**: Invalid or missing JWT token.
**Fix**: Ensure the user is logged in and the Authorization header is being sent.

```javascript
// In your frontend code, verify the session exists
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
console.log('Access Token:', session?.access_token);
```

### Issue: Template not found
**Cause**: Template ID doesn't exist or RLS is blocking access.
**Fix**: Verify templates are public:
```sql
-- Check template visibility
SELECT id, name, is_public, created_by 
FROM checklist_templates 
WHERE id = 'YOUR_TEMPLATE_ID';

-- Ensure public templates are accessible
SELECT * FROM pg_policies 
WHERE tablename = 'checklist_templates' 
AND cmd = 'SELECT';
```

### Issue: Checklist items not created
**Cause**: RLS on checklist_items blocking INSERT.
**Fix**: The edge function should use SERVICE_ROLE_KEY for item creation, or ensure the checklist ownership is established first.

---

## Quick Verification Checklist

- [ ] All 12 tables have RLS enabled
- [ ] Each table has appropriate policies (SELECT, INSERT, UPDATE, DELETE as needed)
- [ ] OPTIONS preflight returns 204 with CORS headers
- [ ] POST without auth returns 400 "Missing authorization header"
- [ ] Authenticated POST creates checklist successfully
- [ ] User can only see their own checklists
- [ ] User can only see items from their own checklists
- [ ] User cannot access another user's data via direct URL
- [ ] Edge function logs show successful execution
- [ ] Template usage count increments after generation

---

## Summary of Expected Behavior

| Action | Expected Result |
|--------|-----------------|
| View templates | Anyone can see public templates |
| Generate checklist | Only authenticated users, creates with their user_id |
| View checklists | Only see own checklists |
| View checklist items | Only see items from own checklists |
| Update checklist | Only update own checklists |
| Delete checklist | Only delete own checklists |
| View notifications | Only see own notifications |
| View favorites | Only see own favorites |
| View regulations | Anyone can see (public data) |
