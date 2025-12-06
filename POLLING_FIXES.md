# Polling Edge Functions - Fixes and Enhancements

## Issues Resolved

### 1. Edge Function Invocation Error
**Problem**: The `trigger-all-pollers` function was failing with "Failed to send a request to the Edge Function" error.

**Root Cause**: The function was using `supabase.functions.invoke()` which requires proper function slug names, but there were issues with the invocation method.

**Solution**: Changed to direct HTTP fetch calls using the Supabase function endpoints:
```typescript
const frResponse = await fetch(`${supabaseUrl}/functions/v1/federal-register-poller`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json'
  }
});
```

### 2. Limited Statistics Display
**Problem**: The statistics section only showed limited numbers (21 regulations, 36 jurisdictions) when users expected more comprehensive data.

**Root Cause**: 
- The database actually has limited data (only 21 regulations ingested)
- Statistics were showing accurate counts but lacked context
- No breakdown of data sources or freshness indicators

**Solution**: Created `EnhancedStatsSection` component with:
- 8 comprehensive statistics cards instead of 4
- Federal vs State document breakdown
- Today's updates and weekly trends
- Visual icons for better UX
- Auto-refresh every 30 seconds
- Loading states and error handling

## Enhanced Statistics

The new statistics section displays:
1. **Total Regulations** - Overall count with database icon
2. **Active Jurisdictions** - Number of states/federal tracked
3. **Open Comments** - Regulations accepting public comment
4. **Upcoming Deadlines** - Time-sensitive regulations
5. **Federal Documents** - Count from federal sources
6. **State Documents** - Count from state sources
7. **Today's Updates** - New regulations added today
8. **This Week** - Regulations added in last 7 days

## Polling Function Improvements

### federal-register-poller
- Enhanced error handling with try-catch per search term
- Better logging for debugging
- Proper database insertion with merge-duplicates
- Searches last 30 days instead of just today
- Tracks partial successes vs complete failures

### regulations-gov-poller
- Consistent error handling with federal poller
- Proper API key validation
- Enhanced logging
- Graceful degradation on API errors

### trigger-all-pollers
- Direct HTTP invocation for reliability
- Better error reporting
- Logs both successes and failures
- Returns detailed results for monitoring

## Testing the Fixes

1. **Test Manual Trigger**:
   - Go to Source Management page
   - Click "Trigger Data Pollers"
   - Should see success message with records processed

2. **Verify Statistics**:
   - Check homepage for enhanced statistics
   - Should see 8 stat cards with icons
   - Numbers should auto-refresh every 30 seconds

3. **Check Logs**:
   - Go to Source Management > Polling Health tab
   - View execution history
   - Verify successful job completions

## Next Steps

To populate more data:
1. Run the pollers manually from Source Management
2. Wait for automated cron jobs (every 4-6 hours)
3. Use "Seed Database Now" for initial test data
4. Monitor polling health dashboard for success rates
