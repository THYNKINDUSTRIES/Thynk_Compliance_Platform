# RLS Policy Optimization

## Overview
Fixed Row Level Security (RLS) policies across all tables to eliminate performance warnings by optimizing `auth.uid()` function calls.

## Problem
RLS policies that call `auth.uid()` or `auth.role()` directly cause these functions to be re-evaluated for **every row** in a query result. This creates significant performance degradation at scale.

## Solution
Wrap auth function calls in a subquery: `(select auth.uid())` instead of `auth.uid()`. This ensures the function is evaluated **once per query** instead of once per row.

## Tables Fixed

### 1. template_ratings
- ✅ Authenticated users can rate templates
- ✅ Users can update their own ratings

### 2. federal_alert_subscriptions
- ✅ Users can view their own federal subscriptions
- ✅ Users can insert their own federal subscriptions
- ✅ Users can update their own federal subscriptions
- ✅ Users can delete their own federal subscriptions

### 3. checklist_templates
- ✅ Users can update their own templates

### 4. compliance_checklists
- ✅ Users can create own checklists
- ✅ Users can view own checklists
- ✅ Users can update own checklists
- ✅ Users can delete own checklists

### 5. checklist_items
- ✅ Users can create items in own checklists
- ✅ Users can view items from own checklists
- ✅ Users can update items in own checklists
- ✅ Users can delete items from own checklists

## Performance Impact

### Before Optimization
```sql
-- Evaluated for EACH row
WHERE user_id = auth.uid()
```

### After Optimization
```sql
-- Evaluated ONCE per query
WHERE user_id = (select auth.uid())
```

### Performance Gains
- **10-100x faster** on large result sets
- Constant time vs linear time complexity
- Reduced CPU usage on database
- Better query plan optimization

## Best Practices

### ✅ DO THIS
```sql
CREATE POLICY "policy_name"
ON table_name
FOR SELECT
TO authenticated
USING (user_id = (select auth.uid()));
```

### ❌ NOT THIS
```sql
CREATE POLICY "policy_name"
ON table_name
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
```

## Verification

Run this query to check for remaining issues:
```sql
SELECT 
    schemaname,
    tablename,
    policyname,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND (
    qual LIKE '%auth.uid()%'
    OR with_check LIKE '%auth.uid()%'
    OR qual LIKE '%auth.role()%'
    OR with_check LIKE '%auth.role()%'
)
AND qual NOT LIKE '%select auth.uid()%'
AND with_check NOT LIKE '%select auth.uid()%';
```

## Additional Notes

- All policies now use the optimized pattern
- No functional changes - only performance improvements
- Compatible with existing application code
- Recommended by Supabase database linter

## References
- [Supabase RLS Performance Docs](https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select)
- [Database Linter: auth_rls_initplan](https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan)
