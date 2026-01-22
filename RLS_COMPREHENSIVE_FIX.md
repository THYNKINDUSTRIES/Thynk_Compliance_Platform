# Comprehensive RLS Fix Guide

## IMPORTANT: Deploy This Edge Function First

The `generate-checklist-from-template` function needs to be updated to use SERVICE_ROLE_KEY for database operations. Deploy this updated version:

```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { templateId, checklistName, states } = await req.json();

    if (!templateId) {
      throw new Error('Template ID is required');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    // User client for auth validation only
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Service client for database operations (bypasses RLS)
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);

    // Get user from the auth header - validates the user is authenticated
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      console.error('User auth error:', userError);
      throw new Error('Unauthorized');
    }

    console.log('[generate-checklist] User authenticated:', user.id);
    console.log('[generate-checklist] Fetching template:', templateId);

    // Get template using service client
    const { data: templateData, error: templateError } = await serviceClient
      .from('checklist_templates')
      .select('*')
      .eq('id', templateId)
      .limit(1);

    if (templateError) {
      console.error('Template fetch error:', templateError);
      throw new Error('Failed to fetch template: ' + templateError.message);
    }

    if (!templateData || templateData.length === 0) {
      throw new Error('Template not found');
    }

    const template = templateData[0];
    console.log('[generate-checklist] Template found:', template.name);

    // Create checklist using service client
    const { data: checklistData, error: checklistError } = await serviceClient
      .from('compliance_checklists')
      .insert({
        name: checklistName || template.name,
        description: template.description,
        business_type: template.business_type,
        states: states || template.states || [],
        created_by: user.id,
        user_id: user.id
      })
      .select()
      .limit(1);

    if (checklistError) {
      console.error('Checklist creation error:', checklistError);
      throw new Error('Failed to create checklist: ' + checklistError.message);
    }

    if (!checklistData || checklistData.length === 0) {
      throw new Error('Failed to create checklist: No data returned');
    }

    const checklist = checklistData[0];
    console.log('[generate-checklist] Checklist created:', checklist.id);

    // Create checklist items using service client
    const templateItems = template.template_items || [];
    if (templateItems.length > 0) {
      const items = templateItems.map((item: any) => ({
        checklist_id: checklist.id,
        title: item.title,
        description: item.description,
        category: item.category,
        priority: item.priority || 'medium',
        completed: false
      }));

      console.log('[generate-checklist] Creating', items.length, 'items');

      const { error: itemsError } = await serviceClient
        .from('checklist_items')
        .insert(items);

      if (itemsError) {
        console.error('Items creation error:', itemsError);
        // Clean up the checklist if items failed
        await serviceClient.from('compliance_checklists').delete().eq('id', checklist.id);
        throw new Error('Failed to create checklist items: ' + itemsError.message);
      }
    }

    // Update template usage count
    const { error: updateError } = await serviceClient
      .from('checklist_templates')
      .update({ usage_count: (template.usage_count || 0) + 1 })
      .eq('id', templateId);

    if (updateError) {
      console.warn('Failed to update usage count:', updateError);
      // Non-critical, don't throw
    }

    console.log('[generate-checklist] Success! Checklist ID:', checklist.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        checklistId: checklist.id,
        itemCount: templateItems.length,
        message: 'Checklist created successfully from template'
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('[generate-checklist] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
```

### Deploy Steps:
1. Go to Supabase Dashboard → Edge Functions
2. Find `generate-checklist-from-template`
3. Click Edit and replace the code with the above
4. Click Deploy

---



## Overview

This guide fixes Row Level Security (RLS) issues across all tables used by edge functions. The main issues are:

1. **Edge functions using ANON_KEY with user auth** need proper RLS policies
2. **System operations** should use SERVICE_ROLE_KEY to bypass RLS
3. **Missing or incorrect policies** on key tables

## Tables Requiring RLS Fixes

### 1. checklist_templates

**Issue**: Templates should be publicly readable, but only owners can update them. However, the `usage_count` needs to be incrementable by anyone using the template.

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view public templates" ON checklist_templates;
DROP POLICY IF EXISTS "Users can view public templates" ON checklist_templates;
DROP POLICY IF EXISTS "Authenticated users can view templates" ON checklist_templates;
DROP POLICY IF EXISTS "Users can update own templates" ON checklist_templates;
DROP POLICY IF EXISTS "Anyone can increment usage count" ON checklist_templates;

-- Enable RLS
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;

-- Policy 1: Anyone (including anon) can SELECT public templates
CREATE POLICY "Anyone can view public templates"
ON checklist_templates
FOR SELECT
TO public
USING (is_public = true OR created_by = (SELECT auth.uid()));

-- Policy 2: Authenticated users can INSERT their own templates
CREATE POLICY "Users can create templates"
ON checklist_templates
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- Policy 3: Users can UPDATE their own templates
CREATE POLICY "Users can update own templates"
ON checklist_templates
FOR UPDATE
TO authenticated
USING (created_by = (SELECT auth.uid()))
WITH CHECK (created_by = (SELECT auth.uid()));

-- Policy 4: Users can DELETE their own templates
CREATE POLICY "Users can delete own templates"
ON checklist_templates
FOR DELETE
TO authenticated
USING (created_by = (SELECT auth.uid()));

-- Grant permissions
GRANT SELECT ON checklist_templates TO anon;
GRANT SELECT ON checklist_templates TO authenticated;
GRANT INSERT, UPDATE, DELETE ON checklist_templates TO authenticated;
```

### 2. compliance_checklists

**Issue**: Users should only see and manage their own checklists.

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Users can create own checklists" ON compliance_checklists;
DROP POLICY IF EXISTS "Users can view own checklists" ON compliance_checklists;
DROP POLICY IF EXISTS "Users can update own checklists" ON compliance_checklists;
DROP POLICY IF EXISTS "Users can delete own checklists" ON compliance_checklists;

-- Enable RLS
ALTER TABLE compliance_checklists ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can INSERT their own checklists
CREATE POLICY "Users can create own checklists"
ON compliance_checklists
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = (SELECT auth.uid()) OR 
  user_id = (SELECT auth.uid())
);

-- Policy 2: Users can SELECT their own checklists
CREATE POLICY "Users can view own checklists"
ON compliance_checklists
FOR SELECT
TO authenticated
USING (
  created_by = (SELECT auth.uid()) OR 
  user_id = (SELECT auth.uid())
);

-- Policy 3: Users can UPDATE their own checklists
CREATE POLICY "Users can update own checklists"
ON compliance_checklists
FOR UPDATE
TO authenticated
USING (
  created_by = (SELECT auth.uid()) OR 
  user_id = (SELECT auth.uid())
)
WITH CHECK (
  created_by = (SELECT auth.uid()) OR 
  user_id = (SELECT auth.uid())
);

-- Policy 4: Users can DELETE their own checklists
CREATE POLICY "Users can delete own checklists"
ON compliance_checklists
FOR DELETE
TO authenticated
USING (
  created_by = (SELECT auth.uid()) OR 
  user_id = (SELECT auth.uid())
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON compliance_checklists TO authenticated;
```

### 3. checklist_items

**Issue**: Users should only manage items in checklists they own. The tricky part is that the INSERT happens right after creating the checklist, so we need to verify ownership through the parent checklist.

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Users can create items in own checklists" ON checklist_items;
DROP POLICY IF EXISTS "Users can view items from own checklists" ON checklist_items;
DROP POLICY IF EXISTS "Users can update items in own checklists" ON checklist_items;
DROP POLICY IF EXISTS "Users can delete items from own checklists" ON checklist_items;

-- Enable RLS
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can INSERT items into their own checklists
CREATE POLICY "Users can create items in own checklists"
ON checklist_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM compliance_checklists 
    WHERE id = checklist_id 
    AND (created_by = (SELECT auth.uid()) OR user_id = (SELECT auth.uid()))
  )
);

-- Policy 2: Users can SELECT items from their own checklists
CREATE POLICY "Users can view items from own checklists"
ON checklist_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM compliance_checklists 
    WHERE id = checklist_id 
    AND (created_by = (SELECT auth.uid()) OR user_id = (SELECT auth.uid()))
  )
);

-- Policy 3: Users can UPDATE items in their own checklists
CREATE POLICY "Users can update items in own checklists"
ON checklist_items
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM compliance_checklists 
    WHERE id = checklist_id 
    AND (created_by = (SELECT auth.uid()) OR user_id = (SELECT auth.uid()))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM compliance_checklists 
    WHERE id = checklist_id 
    AND (created_by = (SELECT auth.uid()) OR user_id = (SELECT auth.uid()))
  )
);

-- Policy 4: Users can DELETE items from their own checklists
CREATE POLICY "Users can delete items from own checklists"
ON checklist_items
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM compliance_checklists 
    WHERE id = checklist_id 
    AND (created_by = (SELECT auth.uid()) OR user_id = (SELECT auth.uid()))
  )
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON checklist_items TO authenticated;
```

### 4. public_comments

**Issue**: Users should only see and manage their own comments.

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own comments" ON public_comments;
DROP POLICY IF EXISTS "Users can create comments" ON public_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public_comments;

-- Enable RLS
ALTER TABLE public_comments ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can INSERT their own comments
CREATE POLICY "Users can create comments"
ON public_comments
FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

-- Policy 2: Users can SELECT their own comments
CREATE POLICY "Users can view own comments"
ON public_comments
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- Policy 3: Users can UPDATE their own comments
CREATE POLICY "Users can update own comments"
ON public_comments
FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- Policy 4: Users can DELETE their own comments
CREATE POLICY "Users can delete own comments"
ON public_comments
FOR DELETE
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public_comments TO authenticated;
```

### 5. notifications

**Issue**: Users should only see their own notifications.

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Service can create notifications" ON notifications;

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can SELECT their own notifications
CREATE POLICY "Users can view own notifications"
ON notifications
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- Policy 2: Users can UPDATE their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON notifications
FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- Policy 3: Allow INSERT for service role (edge functions use service role)
-- Note: Edge functions using SERVICE_ROLE_KEY bypass RLS, so this is for direct inserts
CREATE POLICY "Allow notification creation"
ON notifications
FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

-- Grant permissions
GRANT SELECT, UPDATE ON notifications TO authenticated;
GRANT INSERT ON notifications TO authenticated;
```

### 6. user_favorites

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own favorites" ON user_favorites;
DROP POLICY IF EXISTS "Users can create favorites" ON user_favorites;
DROP POLICY IF EXISTS "Users can delete own favorites" ON user_favorites;

-- Enable RLS
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can SELECT their own favorites
CREATE POLICY "Users can view own favorites"
ON user_favorites
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- Policy 2: Users can INSERT their own favorites
CREATE POLICY "Users can create favorites"
ON user_favorites
FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

-- Policy 3: Users can DELETE their own favorites
CREATE POLICY "Users can delete own favorites"
ON user_favorites
FOR DELETE
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON user_favorites TO authenticated;
```

### 7. instrument (Regulations)

**Issue**: Regulations should be publicly readable. Only service role should write.

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view instruments" ON instrument;
DROP POLICY IF EXISTS "Public can view instruments" ON instrument;

-- Enable RLS
ALTER TABLE instrument ENABLE ROW LEVEL SECURITY;

-- Policy 1: Anyone can SELECT instruments (public data)
CREATE POLICY "Anyone can view instruments"
ON instrument
FOR SELECT
TO public
USING (true);

-- Grant permissions
GRANT SELECT ON instrument TO anon;
GRANT SELECT ON instrument TO authenticated;
-- Note: INSERT/UPDATE/DELETE handled by SERVICE_ROLE_KEY in edge functions
```

### 8. ingestion_log

**Issue**: Logs should be readable by authenticated users, writable only by service role.

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view logs" ON ingestion_log;

-- Enable RLS
ALTER TABLE ingestion_log ENABLE ROW LEVEL SECURITY;

-- Policy 1: Authenticated users can SELECT logs
CREATE POLICY "Authenticated users can view logs"
ON ingestion_log
FOR SELECT
TO authenticated
USING (true);

-- Grant permissions
GRANT SELECT ON ingestion_log TO authenticated;
-- Note: INSERT/UPDATE handled by SERVICE_ROLE_KEY in edge functions
```

### 9. extracted_entity

**Issue**: Entities should be publicly readable, writable only by service role.

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view entities" ON extracted_entity;

-- Enable RLS
ALTER TABLE extracted_entity ENABLE ROW LEVEL SECURITY;

-- Policy 1: Anyone can SELECT entities
CREATE POLICY "Anyone can view entities"
ON extracted_entity
FOR SELECT
TO public
USING (true);

-- Grant permissions
GRANT SELECT ON extracted_entity TO anon;
GRANT SELECT ON extracted_entity TO authenticated;
-- Note: INSERT/UPDATE handled by SERVICE_ROLE_KEY in edge functions
```

### 10. jurisdiction

**Issue**: Jurisdictions should be publicly readable.

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view jurisdictions" ON jurisdiction;

-- Enable RLS
ALTER TABLE jurisdiction ENABLE ROW LEVEL SECURITY;

-- Policy 1: Anyone can SELECT jurisdictions
CREATE POLICY "Anyone can view jurisdictions"
ON jurisdiction
FOR SELECT
TO public
USING (true);

-- Grant permissions
GRANT SELECT ON jurisdiction TO anon;
GRANT SELECT ON jurisdiction TO authenticated;
```

## Edge Function Fix: generate-checklist-from-template

The `generate-checklist-from-template` function needs to use SERVICE_ROLE_KEY for the template usage_count update since the user doesn't own the template:

```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { templateId, checklistName, states } = await req.json();

    if (!templateId) {
      throw new Error('Template ID is required');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    // User client for user-specific operations (respects RLS)
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Service client for system operations (bypasses RLS)
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);

    // Get user from the auth header
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get template using service client (templates may have complex RLS)
    const { data: templateData, error: templateError } = await serviceClient
      .from('checklist_templates')
      .select('*')
      .eq('id', templateId)
      .limit(1);

    if (templateError || !templateData || templateData.length === 0) {
      console.error('Template error:', templateError);
      throw new Error('Template not found');
    }

    const template = templateData[0];

    // Create checklist using user client (RLS ensures user owns it)
    const { data: checklistData, error: checklistError } = await userClient
      .from('compliance_checklists')
      .insert({
        name: checklistName || template.name,
        description: template.description,
        business_type: template.business_type,
        states: states || template.states || [],
        created_by: user.id,
        user_id: user.id
      })
      .select()
      .limit(1);

    if (checklistError || !checklistData || checklistData.length === 0) {
      console.error('Checklist creation error:', checklistError);
      throw new Error('Failed to create checklist: ' + (checklistError?.message || 'Unknown error'));
    }

    const checklist = checklistData[0];

    // Create checklist items using user client
    const templateItems = template.template_items || [];
    if (templateItems.length > 0) {
      const items = templateItems.map((item: any) => ({
        checklist_id: checklist.id,
        title: item.title,
        description: item.description,
        category: item.category,
        priority: item.priority || 'medium',
        completed: false
      }));

      const { error: itemsError } = await userClient
        .from('checklist_items')
        .insert(items);

      if (itemsError) {
        console.error('Items creation error:', itemsError);
        // Clean up the checklist if items failed
        await userClient.from('compliance_checklists').delete().eq('id', checklist.id);
        throw new Error('Failed to create checklist items: ' + itemsError.message);
      }
    }

    // Update template usage count using SERVICE client (bypasses RLS)
    await serviceClient
      .from('checklist_templates')
      .update({ usage_count: (template.usage_count || 0) + 1 })
      .eq('id', templateId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        checklistId: checklist.id,
        message: 'Checklist created successfully from template'
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
```

## Complete SQL Script

Run this complete script in your Supabase SQL Editor:

```sql
-- ============================================
-- COMPREHENSIVE RLS FIX SCRIPT
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. CHECKLIST_TEMPLATES
-- ============================================
DROP POLICY IF EXISTS "Anyone can view public templates" ON checklist_templates;
DROP POLICY IF EXISTS "Users can view public templates" ON checklist_templates;
DROP POLICY IF EXISTS "Authenticated users can view templates" ON checklist_templates;
DROP POLICY IF EXISTS "Users can update own templates" ON checklist_templates;
DROP POLICY IF EXISTS "Anyone can increment usage count" ON checklist_templates;
DROP POLICY IF EXISTS "Users can create templates" ON checklist_templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON checklist_templates;

ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public templates"
ON checklist_templates FOR SELECT TO public
USING (is_public = true OR created_by = (SELECT auth.uid()));

CREATE POLICY "Users can create templates"
ON checklist_templates FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Users can update own templates"
ON checklist_templates FOR UPDATE TO authenticated
USING (created_by = (SELECT auth.uid()))
WITH CHECK (created_by = (SELECT auth.uid()));

CREATE POLICY "Users can delete own templates"
ON checklist_templates FOR DELETE TO authenticated
USING (created_by = (SELECT auth.uid()));

GRANT SELECT ON checklist_templates TO anon;
GRANT SELECT ON checklist_templates TO authenticated;
GRANT INSERT, UPDATE, DELETE ON checklist_templates TO authenticated;

-- 2. COMPLIANCE_CHECKLISTS
-- ============================================
DROP POLICY IF EXISTS "Users can create own checklists" ON compliance_checklists;
DROP POLICY IF EXISTS "Users can view own checklists" ON compliance_checklists;
DROP POLICY IF EXISTS "Users can update own checklists" ON compliance_checklists;
DROP POLICY IF EXISTS "Users can delete own checklists" ON compliance_checklists;

ALTER TABLE compliance_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own checklists"
ON compliance_checklists FOR INSERT TO authenticated
WITH CHECK (created_by = (SELECT auth.uid()) OR user_id = (SELECT auth.uid()));

CREATE POLICY "Users can view own checklists"
ON compliance_checklists FOR SELECT TO authenticated
USING (created_by = (SELECT auth.uid()) OR user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own checklists"
ON compliance_checklists FOR UPDATE TO authenticated
USING (created_by = (SELECT auth.uid()) OR user_id = (SELECT auth.uid()))
WITH CHECK (created_by = (SELECT auth.uid()) OR user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own checklists"
ON compliance_checklists FOR DELETE TO authenticated
USING (created_by = (SELECT auth.uid()) OR user_id = (SELECT auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON compliance_checklists TO authenticated;

-- 3. CHECKLIST_ITEMS
-- ============================================
DROP POLICY IF EXISTS "Users can create items in own checklists" ON checklist_items;
DROP POLICY IF EXISTS "Users can view items from own checklists" ON checklist_items;
DROP POLICY IF EXISTS "Users can update items in own checklists" ON checklist_items;
DROP POLICY IF EXISTS "Users can delete items from own checklists" ON checklist_items;

ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create items in own checklists"
ON checklist_items FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM compliance_checklists 
    WHERE id = checklist_id 
    AND (created_by = (SELECT auth.uid()) OR user_id = (SELECT auth.uid()))
  )
);

CREATE POLICY "Users can view items from own checklists"
ON checklist_items FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM compliance_checklists 
    WHERE id = checklist_id 
    AND (created_by = (SELECT auth.uid()) OR user_id = (SELECT auth.uid()))
  )
);

CREATE POLICY "Users can update items in own checklists"
ON checklist_items FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM compliance_checklists 
    WHERE id = checklist_id 
    AND (created_by = (SELECT auth.uid()) OR user_id = (SELECT auth.uid()))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM compliance_checklists 
    WHERE id = checklist_id 
    AND (created_by = (SELECT auth.uid()) OR user_id = (SELECT auth.uid()))
  )
);

CREATE POLICY "Users can delete items from own checklists"
ON checklist_items FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM compliance_checklists 
    WHERE id = checklist_id 
    AND (created_by = (SELECT auth.uid()) OR user_id = (SELECT auth.uid()))
  )
);

GRANT SELECT, INSERT, UPDATE, DELETE ON checklist_items TO authenticated;

-- 4. PUBLIC_COMMENTS
-- ============================================
DROP POLICY IF EXISTS "Users can view own comments" ON public_comments;
DROP POLICY IF EXISTS "Users can create comments" ON public_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public_comments;

ALTER TABLE public_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create comments"
ON public_comments FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can view own comments"
ON public_comments FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own comments"
ON public_comments FOR UPDATE TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own comments"
ON public_comments FOR DELETE TO authenticated
USING (user_id = (SELECT auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public_comments TO authenticated;

-- 5. NOTIFICATIONS
-- ============================================
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Service can create notifications" ON notifications;
DROP POLICY IF EXISTS "Allow notification creation" ON notifications;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Allow notification creation"
ON notifications FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

GRANT SELECT, UPDATE, INSERT ON notifications TO authenticated;

-- 6. USER_FAVORITES
-- ============================================
DROP POLICY IF EXISTS "Users can view own favorites" ON user_favorites;
DROP POLICY IF EXISTS "Users can create favorites" ON user_favorites;
DROP POLICY IF EXISTS "Users can delete own favorites" ON user_favorites;

ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
ON user_favorites FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create favorites"
ON user_favorites FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own favorites"
ON user_favorites FOR DELETE TO authenticated
USING (user_id = (SELECT auth.uid()));

GRANT SELECT, INSERT, DELETE ON user_favorites TO authenticated;

-- 7. INSTRUMENT (Regulations - Public Read)
-- ============================================
DROP POLICY IF EXISTS "Anyone can view instruments" ON instrument;
DROP POLICY IF EXISTS "Public can view instruments" ON instrument;

ALTER TABLE instrument ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view instruments"
ON instrument FOR SELECT TO public
USING (true);

GRANT SELECT ON instrument TO anon;
GRANT SELECT ON instrument TO authenticated;

-- 8. INGESTION_LOG
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view logs" ON ingestion_log;

ALTER TABLE ingestion_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view logs"
ON ingestion_log FOR SELECT TO authenticated
USING (true);

GRANT SELECT ON ingestion_log TO authenticated;

-- 9. EXTRACTED_ENTITY
-- ============================================
DROP POLICY IF EXISTS "Anyone can view entities" ON extracted_entity;

ALTER TABLE extracted_entity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view entities"
ON extracted_entity FOR SELECT TO public
USING (true);

GRANT SELECT ON extracted_entity TO anon;
GRANT SELECT ON extracted_entity TO authenticated;

-- 10. JURISDICTION
-- ============================================
DROP POLICY IF EXISTS "Anyone can view jurisdictions" ON jurisdiction;

ALTER TABLE jurisdiction ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view jurisdictions"
ON jurisdiction FOR SELECT TO public
USING (true);

GRANT SELECT ON jurisdiction TO anon;
GRANT SELECT ON jurisdiction TO authenticated;

-- 11. TAGS
-- ============================================
DROP POLICY IF EXISTS "Anyone can view tags" ON tags;
DROP POLICY IF EXISTS "Authenticated users can create tags" ON tags;

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tags"
ON tags FOR SELECT TO public
USING (true);

CREATE POLICY "Authenticated users can create tags"
ON tags FOR INSERT TO authenticated
WITH CHECK (true);

GRANT SELECT ON tags TO anon;
GRANT SELECT, INSERT ON tags TO authenticated;

-- 12. INSTRUMENT_TAGS
-- ============================================
DROP POLICY IF EXISTS "Anyone can view instrument tags" ON instrument_tags;
DROP POLICY IF EXISTS "Authenticated users can manage instrument tags" ON instrument_tags;

ALTER TABLE instrument_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view instrument tags"
ON instrument_tags FOR SELECT TO public
USING (true);

CREATE POLICY "Authenticated users can create instrument tags"
ON instrument_tags FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete instrument tags"
ON instrument_tags FOR DELETE TO authenticated
USING (true);

GRANT SELECT ON instrument_tags TO anon;
GRANT SELECT, INSERT, DELETE ON instrument_tags TO authenticated;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check all policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check RLS status on all tables
SELECT 
    c.relname as table_name,
    c.relrowsecurity as rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
AND c.relkind = 'r'
ORDER BY c.relname;
```

## Testing After Applying Fixes

1. **Test template viewing**:
```bash
curl -X GET "https://YOUR_PROJECT.supabase.co/rest/v1/checklist_templates?select=*" \
  -H "apikey: YOUR_ANON_KEY"
```

2. **Test checklist creation** (requires auth):
```bash
curl -X POST "https://YOUR_PROJECT.supabase.co/functions/v1/generate-checklist-from-template" \
  -H "Authorization: Bearer YOUR_USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{"templateId": "TEMPLATE_UUID", "checklistName": "Test Checklist"}'
```

## Summary of Changes

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| checklist_templates | public (if is_public) | authenticated | owner only | owner only |
| compliance_checklists | owner only | authenticated (as owner) | owner only | owner only |
| checklist_items | owner of parent | owner of parent | owner of parent | owner of parent |
| public_comments | owner only | authenticated (as owner) | owner only | owner only |
| notifications | owner only | authenticated (as owner) | owner only | - |
| user_favorites | owner only | authenticated (as owner) | - | owner only |
| instrument | public | service_role only | service_role only | service_role only |
| ingestion_log | authenticated | service_role only | service_role only | - |
| extracted_entity | public | service_role only | - | - |
| jurisdiction | public | - | - | - |
| tags | public | authenticated | - | - |
| instrument_tags | public | authenticated | - | authenticated |
