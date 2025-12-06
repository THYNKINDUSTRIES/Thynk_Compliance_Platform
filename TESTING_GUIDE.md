# Testing Guide - Account Creation & Search

## Prerequisites
- Supabase project is set up with all tables and triggers
- Application is running locally or deployed

## Step 1: Create an Account

1. Navigate to `/signup` page
2. Fill in the form:
   - **Full Name**: Your name (e.g., "John Doe")
   - **Email**: Valid email address
   - **Password**: Must meet requirements:
     - At least 12 characters
     - Contains uppercase letter
     - Contains lowercase letter
     - Contains number
     - Contains special character
   - **Confirm Password**: Same as password
3. Click "Sign Up"
4. You should see a success message
5. Check your email for verification link (optional)

### What Happens Behind the Scenes
- Supabase creates user in `auth.users` table
- Database trigger automatically creates record in `user_profiles` table
- User metadata (full_name) is copied to profile

### Troubleshooting Signup
- If you get "user already exists" - email is taken, use different email
- If you get database error - check DATABASE_USER_PROFILES_FIX.md
- Password too weak - ensure all requirements are met

## Step 2: Seed the Database

1. Login with your new account
2. Navigate to `/source-management` page
3. Click the **"Seed Database Now"** button
4. Wait for migration to complete (may take 30-60 seconds)
5. You should see success message with count of migrated regulations

### What Gets Seeded
- 5 regulations from regulations.ts
- 5 regulations from extendedRegulations.ts  
- 10 regulations from moreRegulations.ts
- **Total: 20 regulations** including THCa and hemp data

## Step 3: Test Search for "THCa"

1. Navigate to home page (`/`)
2. In the hero search bar, type: **THCa**
3. Click "Search" or press Enter
4. You should see results including:
   - "Florida OMMU Issues Emergency Rule on THCa Products"
   - Other THCa-related regulations

### Expected Results
- Regulations with "THCa" in title, summary, or products array
- Results should have "THCa" highlighted or visible in content
- Should see jurisdiction, authority, and impact level

## Step 4: Test Search for "hemp"

1. Clear previous search
2. Type: **hemp**
3. Click "Search"
4. You should see results including:
   - Hemp/CBD related regulations
   - California hemp regulations
   - Federal hemp rules

### Expected Results
- More results than THCa (hemp is more common)
- Mix of federal and state regulations
- Various authorities (FDA, CDPH, etc.)

## Step 5: Test Filters

1. On the home page, use the filter panel on the left
2. Try filtering by:
   - **Products**: Select "Hemp/CBD" or "THCa"
   - **Jurisdictions**: Select "California" or "Federal"
   - **Authorities**: Select "FDA" or "CDPH"
   - **Impact**: Select "High"
3. Results should update automatically

## Step 6: Test Quick Search Tags

1. On the hero section, click one of the quick search tags:
   - "Hemp"
   - "Delta-8"
   - "Kratom"
2. Results should filter immediately

## Verification Checklist

✅ Account created successfully
✅ Can login with new account
✅ Database seeded without errors
✅ Search for "THCa" returns results
✅ Search for "hemp" returns results
✅ Filters work correctly
✅ Quick search tags work
✅ Can click on regulation cards to view details
✅ Can favorite regulations
✅ Can create alerts

## Common Issues

### No search results
**Problem**: Search returns 0 results
**Solution**: 
- Ensure database was seeded (check /source-management)
- Check browser console for errors
- Verify Supabase connection

### Search is slow
**Problem**: Search takes >5 seconds
**Solution**:
- Check database indexes
- Verify RLS policies aren't overly complex
- Check network tab for slow queries

### Can't create account
**Problem**: Signup fails
**Solution**:
- Check DATABASE_USER_PROFILES_FIX.md
- Verify trigger exists in Supabase
- Check RLS policies on user_profiles table

## Database Verification

To verify data in Supabase:

1. Go to Supabase Dashboard
2. Navigate to Table Editor
3. Check these tables:
   - `instrument` - Should have ~20 rows
   - `jurisdiction` - Should have multiple states + Federal
   - `authority` - Should have FDA, DEA, CDPH, etc.
   - `user_profiles` - Should have your user record

## Next Steps After Testing

Once basic functionality works:
- Test advanced filters
- Test NLP analysis features
- Test workflow system
- Test alert notifications
- Test team analytics
