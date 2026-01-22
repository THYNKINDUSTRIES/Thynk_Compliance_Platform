# Fix generate-checklist-from-template Edge Function

## Problem

The `generate-checklist-from-template` edge function uses `.single()` which can cause 406 errors when no rows are returned or multiple rows match.

## Solution

Replace `.single()` with `.limit(1)` and access `data[0]` instead of `data`.

## Manual Deployment Steps

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Edge Functions** in the left sidebar
4. Click on **generate-checklist-from-template**
5. Click **Edit**
6. Replace the entire code with the code below
7. Click **Deploy**

## Updated Edge Function Code

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// AI-powered checklist enhancement
async function enhanceChecklistWithAI(
  template: any, 
  states: string[], 
  openaiKey: string
): Promise<{ additionalItems: any[]; tips: string[] }> {
  try {
    const stateList = states.length > 0 ? states.join(', ') : 'all states';
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a cannabis compliance expert. Generate additional checklist items and tips for a ${template.business_type} business in ${stateList}. Return JSON with:
- additionalItems: array of {title, description, category, priority} objects (max 5 items)
- tips: array of 3 compliance tips specific to the business type and states

Categories: licensing, operations, security, inventory, compliance, training, documentation
Priorities: critical, high, medium, low`
          },
          {
            role: 'user',
            content: `Template: ${template.name}\nDescription: ${template.description}\nExisting categories: ${[...new Set(template.template_items?.map((i: any) => i.category) || [])].join(', ')}`
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      console.error(`OpenAI API error: ${response.status}`);
      return { additionalItems: [], tips: [] };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (content) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          additionalItems: parsed.additionalItems || [],
          tips: parsed.tips || []
        };
      }
    }
    
    return { additionalItems: [], tips: [] };
  } catch (error) {
    console.error('AI enhancement error:', error);
    return { additionalItems: [], tips: [] };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Validate environment variables
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const openaiKey = Deno.env.get('OPENAI_API_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing required environment variables: SUPABASE_URL or SUPABASE_ANON_KEY');
    return new Response(
      JSON.stringify({ success: false, error: 'Server configuration error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Parse request body safely
    let body: { templateId?: string; checklistName?: string; states?: string[]; enableAI?: boolean } = {};
    
    try {
      const text = await req.text();
      if (text) body = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { templateId, checklistName, states = [], enableAI = true } = body;

    if (!templateId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Template ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[generate-checklist] Starting. Template: ${templateId}`);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const user = userData.user;

    // FIX: Use .limit(1) instead of .single() to avoid 406 errors
    const { data: templateData, error: templateError } = await supabase
      .from('checklist_templates')
      .select('*')
      .eq('id', templateId)
      .limit(1);

    if (templateError) {
      console.error('Template query error:', templateError);
      return new Response(
        JSON.stringify({ success: false, error: `Database error: ${templateError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // FIX: Access first element of array
    const template = templateData?.[0];
    if (!template) {
      return new Response(
        JSON.stringify({ success: false, error: 'Template not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // AI Enhancement
    let aiEnhancement = { additionalItems: [] as any[], tips: [] as string[] };
    if (enableAI && openaiKey) {
      aiEnhancement = await enhanceChecklistWithAI(template, states, openaiKey);
    }

    // FIX: Use .limit(1) instead of .single()
    const { data: checklistData, error: checklistError } = await supabase
      .from('compliance_checklists')
      .insert({
        name: checklistName || template.name,
        description: template.description,
        business_type: template.business_type,
        states: states.length > 0 ? states : template.states,
        created_by: user.id,
        metadata: {
          source_template_id: templateId,
          ai_enhanced: enableAI && openaiKey ? true : false,
          ai_tips: aiEnhancement.tips
        }
      })
      .select()
      .limit(1);

    if (checklistError) {
      return new Response(
        JSON.stringify({ success: false, error: `Failed to create checklist: ${checklistError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // FIX: Access first element
    const checklist = checklistData?.[0];
    if (!checklist) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create checklist' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create items
    const templateItems = (template.template_items || []).map((item: any) => ({
      checklist_id: checklist.id,
      title: item.title,
      description: item.description,
      category: item.category,
      priority: item.priority || 'medium',
      completed: false,
      source: 'template'
    }));

    const aiItems = aiEnhancement.additionalItems.map((item: any) => ({
      checklist_id: checklist.id,
      title: item.title,
      description: item.description,
      category: item.category,
      priority: item.priority || 'medium',
      completed: false,
      source: 'ai'
    }));

    const allItems = [...templateItems, ...aiItems];

    if (allItems.length > 0) {
      await supabase.from('checklist_items').insert(allItems);
    }

    // Update usage count (non-blocking)
    supabase
      .from('checklist_templates')
      .update({ usage_count: (template.usage_count || 0) + 1 })
      .eq('id', templateId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        checklistId: checklist.id,
        itemsCreated: allItems.length,
        aiEnhanced: enableAI && openaiKey ? true : false,
        tips: aiEnhancement.tips,
        message: 'Checklist created successfully from template'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[generate-checklist] Fatal error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

## Key Changes

1. **Replaced `.single()` with `.limit(1)`** - This prevents 406 errors when no rows or multiple rows match
2. **Access `data[0]` instead of `data`** - Since `.limit(1)` returns an array
3. **Added AI enhancement** - Uses OpenAI to generate additional checklist items and tips
4. **Comprehensive error handling** - All errors return proper JSON responses with CORS headers
5. **Environment variable validation** - Checks for required variables before processing
6. **Detailed logging** - Console logs for debugging

## Testing

```bash
curl -X POST 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/generate-checklist-from-template' \
  -H 'Authorization: Bearer YOUR_AUTH_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "templateId": "your-template-id",
    "checklistName": "My Compliance Checklist",
    "states": ["CA", "CO"],
    "enableAI": true
  }'
```

## Expected Response

```json
{
  "success": true,
  "checklistId": "uuid-of-created-checklist",
  "itemsCreated": 15,
  "aiEnhanced": true,
  "tips": [
    "Ensure all employees complete state-mandated training within 30 days",
    "Keep digital copies of all licenses in a secure cloud backup",
    "Schedule quarterly compliance audits to stay ahead of regulatory changes"
  ],
  "message": "Checklist created successfully from template"
}
```
