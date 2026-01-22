# Edge Function Fixes - Replace .single() with .limit(1) + AI Enhancement

Due to authorization issues, the following edge functions need to be manually updated in the Supabase dashboard to fix potential 406 errors caused by `.single()` calls and add AI-powered features.

## Quick Fix Summary

The main issues causing 400/500 errors:
1. `.single()` returns 406 when no rows found - use `.limit(1)` instead
2. Missing null checks on `data` arrays
3. Inadequate error handling
4. Missing environment variable validation

## Functions to Update

### 1. generate-checklist-from-template (AI-Enhanced Version)

This is the complete, production-ready edge function with:
- AI-powered checklist enhancement using OpenAI
- State-specific compliance suggestions
- Proper `.limit(1)` instead of `.single()`
- Comprehensive error handling
- Detailed logging

```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// AI-powered checklist enhancement
async function enhanceChecklistWithAI(template: any, states: string[], openaiKey: string): Promise<any[]> {
  if (!openaiKey) {
    console.log('[generate-checklist] No OpenAI key, skipping AI enhancement');
    return [];
  }

  try {
    const stateContext = states && states.length > 0 
      ? `for operations in ${states.join(', ')}` 
      : 'for general cannabis/hemp operations';

    const prompt = `You are a cannabis/hemp regulatory compliance expert. Based on this compliance checklist template, suggest 3-5 additional checklist items that would be valuable ${stateContext}.

Template: ${template.name}
Business Type: ${template.business_type}
Category: ${template.category}
Description: ${template.description}

Existing items:
${(template.template_items || []).map((item: any) => `- ${item.title}: ${item.description}`).join('\n')}

Respond with a JSON array of additional items. Each item should have:
- title: string (concise action item)
- description: string (detailed explanation)
- category: string (matching existing categories or new relevant ones)
- priority: "high" | "medium" | "low"
- ai_generated: true
- ai_reason: string (brief explanation why this was suggested)

Focus on:
1. State-specific requirements if states are specified
2. Common compliance gaps
3. Best practices not covered in the template
4. Recent regulatory changes

Return ONLY valid JSON array, no markdown or explanation.`;

    console.log('[generate-checklist] Calling OpenAI for AI enhancement...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a cannabis regulatory compliance expert. Always respond with valid JSON arrays only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[generate-checklist] OpenAI API error:', response.status, errorText);
      return [];
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('[generate-checklist] No content in OpenAI response');
      return [];
    }

    // Parse the JSON response
    let aiItems;
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      aiItems = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('[generate-checklist] Failed to parse AI response:', parseError);
      return [];
    }

    if (!Array.isArray(aiItems)) {
      return [];
    }

    console.log('[generate-checklist] AI generated', aiItems.length, 'additional items');
    return aiItems;

  } catch (error) {
    console.error('[generate-checklist] AI enhancement error:', error);
    return [];
  }
}

// Generate AI compliance tips
async function generateComplianceTips(template: any, states: string[], openaiKey: string): Promise<string[]> {
  if (!openaiKey) return [];

  try {
    const stateContext = states && states.length > 0 ? `in ${states.join(', ')}` : '';

    const prompt = `As a cannabis compliance expert, provide 3 brief, actionable compliance tips for a ${template.business_type} ${stateContext} working on: ${template.name}

Return as a JSON array of strings. Each tip should be 1-2 sentences max.
Return ONLY valid JSON array, no markdown.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a cannabis regulatory compliance expert. Respond with JSON arrays only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) return [];

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return [];

    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const tips = JSON.parse(cleanContent);
    return Array.isArray(tips) ? tips : [];
  } catch {
    return [];
  }
}

Deno.serve(async (req) => {
  console.log('[generate-checklist] Request received:', req.method);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!supabaseUrl) {
      console.error('[generate-checklist] Missing SUPABASE_URL');
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error: Missing SUPABASE_URL' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    if (!supabaseAnonKey) {
      console.error('[generate-checklist] Missing SUPABASE_ANON_KEY');
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error: Missing SUPABASE_ANON_KEY' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log('[generate-checklist] Environment OK, OpenAI:', openaiKey ? 'available' : 'not configured');

    // Parse request body safely
    let requestBody: any = {};
    try {
      const text = await req.text();
      if (text && text.trim()) {
        requestBody = JSON.parse(text);
      }
    } catch (parseError) {
      console.error('[generate-checklist] JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON in request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log('[generate-checklist] Request body:', JSON.stringify(requestBody));

    const { 
      templateId, 
      checklistName, 
      states = [], 
      enableAI = true,
      includeAITips = true 
    } = requestBody;

    // Validate required fields
    if (!templateId) {
      console.error('[generate-checklist] Missing templateId');
      return new Response(
        JSON.stringify({ success: false, error: 'Template ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Validate authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[generate-checklist] Missing authorization header');
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get authenticated user
    console.log('[generate-checklist] Authenticating user...');
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('[generate-checklist] Auth error:', userError.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication failed: ' + userError.message }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    const user = userData?.user;
    if (!user) {
      console.error('[generate-checklist] No user in auth response');
      return new Response(
        JSON.stringify({ success: false, error: 'User not found' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log('[generate-checklist] User authenticated:', user.id);

    // Fetch template using .limit(1) instead of .single() to avoid 406 errors
    console.log('[generate-checklist] Fetching template:', templateId);
    const { data: templateData, error: templateError } = await supabase
      .from('checklist_templates')
      .select('*')
      .eq('id', templateId)
      .limit(1);

    if (templateError) {
      console.error('[generate-checklist] Template fetch error:', templateError.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch template: ' + templateError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Access first element since we used .limit(1)
    const template = templateData?.[0];
    
    if (!template) {
      console.error('[generate-checklist] Template not found:', templateId);
      return new Response(
        JSON.stringify({ success: false, error: 'Template not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log('[generate-checklist] Template found:', template.name);

    // Validate template has items
    const templateItems = template.template_items;
    if (!templateItems || !Array.isArray(templateItems) || templateItems.length === 0) {
      console.error('[generate-checklist] Template has no items');
      return new Response(
        JSON.stringify({ success: false, error: 'Template has no items' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // AI Enhancement: Generate additional items if enabled
    let aiGeneratedItems: any[] = [];
    let complianceTips: string[] = [];
    
    if (enableAI && openaiKey) {
      console.log('[generate-checklist] Running AI enhancement...');
      
      // Run AI enhancements in parallel
      const [aiItems, tips] = await Promise.all([
        enhanceChecklistWithAI(template, states, openaiKey),
        includeAITips ? generateComplianceTips(template, states, openaiKey) : Promise.resolve([])
      ]);
      
      aiGeneratedItems = aiItems;
      complianceTips = tips;
      
      console.log('[generate-checklist] AI generated:', aiGeneratedItems.length, 'items,', complianceTips.length, 'tips');
    }

    // Create the checklist using .limit(1) instead of .single()
    console.log('[generate-checklist] Creating checklist...');
    const { data: checklistData, error: checklistError } = await supabase
      .from('compliance_checklists')
      .insert({
        name: checklistName || template.name,
        description: template.description || '',
        business_type: template.business_type || 'general',
        states: states || template.states || [],
        created_by: user.id,
        metadata: {
          template_id: templateId,
          template_name: template.name,
          ai_enhanced: aiGeneratedItems.length > 0,
          ai_items_count: aiGeneratedItems.length,
          compliance_tips: complianceTips
        }
      })
      .select()
      .limit(1);

    if (checklistError) {
      console.error('[generate-checklist] Checklist creation error:', checklistError.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create checklist: ' + checklistError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Access first element since we used .limit(1)
    const checklist = checklistData?.[0];
    
    if (!checklist) {
      console.error('[generate-checklist] No checklist returned');
      return new Response(
        JSON.stringify({ success: false, error: 'Checklist creation failed - no data returned' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log('[generate-checklist] Checklist created:', checklist.id);

    // Combine template items with AI-generated items
    const allItems = [
      ...templateItems.map((item: any, index: number) => ({
        checklist_id: checklist.id,
        title: item.title || 'Untitled Item',
        description: item.description || '',
        category: item.category || 'General',
        priority: item.priority || 'medium',
        completed: false,
        sort_order: index,
        metadata: { source: 'template' }
      })),
      ...aiGeneratedItems.map((item: any, index: number) => ({
        checklist_id: checklist.id,
        title: item.title || 'AI Suggested Item',
        description: item.description || '',
        category: item.category || 'AI Suggested',
        priority: item.priority || 'medium',
        completed: false,
        sort_order: templateItems.length + index,
        metadata: { 
          source: 'ai',
          ai_generated: true,
          ai_reason: item.ai_reason || 'AI-generated compliance suggestion'
        }
      }))
    ];

    console.log('[generate-checklist] Creating', allItems.length, 'checklist items...');

    // Insert all items
    const { error: itemsError } = await supabase
      .from('checklist_items')
      .insert(allItems);

    if (itemsError) {
      console.error('[generate-checklist] Items creation error:', itemsError.message);
      // Clean up the checklist if items failed
      await supabase.from('compliance_checklists').delete().eq('id', checklist.id);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create checklist items: ' + itemsError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log('[generate-checklist] Checklist items created successfully');

    // Update template usage count (non-blocking, don't await)
    supabase
      .from('checklist_templates')
      .update({ usage_count: (template.usage_count || 0) + 1 })
      .eq('id', templateId)
      .then(({ error }) => {
        if (error) {
          console.warn('[generate-checklist] Failed to update usage count:', error.message);
        }
      });

    // Success response
    console.log('[generate-checklist] Success! Checklist ID:', checklist.id);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        checklistId: checklist.id,
        message: 'Checklist created successfully',
        stats: {
          templateItems: templateItems.length,
          aiGeneratedItems: aiGeneratedItems.length,
          totalItems: allItems.length,
          complianceTips: complianceTips.length
        },
        complianceTips: complianceTips
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[generate-checklist] Unexpected error:', errorMessage);
    
    return new Response(
      JSON.stringify({ success: false, error: 'An unexpected error occurred: ' + errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
```

### 2. save-public-comment

Replace the current function with this updated code:

```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

Deno.serve(async (req) => {
  console.log('[save-public-comment] Request received:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Check environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('[save-public-comment] Missing environment variables');
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Parse request body
    let requestBody: any = {};
    try {
      const text = await req.text();
      if (text && text.trim()) {
        requestBody = JSON.parse(text);
      }
    } catch (parseError) {
      console.error('[save-public-comment] Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON in request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const { 
      commentId,
      regulationId,
      regulationTitle,
      regulationType,
      jurisdictionCode,
      agencyName,
      agencyContactEmail,
      commentPeriodEnd,
      commentTitle,
      commentBody,
      attachments,
      status,
      submissionMethod,
      confirmationNumber,
      tags,
      regulationUrl,
      submissionUrl
    } = requestBody;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication failed' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const user = userData.user;

    const commentData = {
      user_id: user.id,
      regulation_id: regulationId,
      regulation_title: regulationTitle,
      regulation_type: regulationType,
      jurisdiction_code: jurisdictionCode,
      agency_name: agencyName,
      agency_contact_email: agencyContactEmail,
      comment_period_end: commentPeriodEnd,
      comment_title: commentTitle,
      comment_body: commentBody,
      attachments: attachments || [],
      status: status || 'draft',
      submission_method: submissionMethod,
      confirmation_number: confirmationNumber,
      tags: tags || [],
      regulation_url: regulationUrl,
      submission_url: submissionUrl,
      updated_at: new Date().toISOString()
    };

    let result;
    if (commentId) {
      // Update existing comment - using .limit(1) instead of .single()
      const { data, error } = await supabase
        .from('public_comments')
        .update(commentData)
        .eq('id', commentId)
        .eq('user_id', user.id)
        .select()
        .limit(1);

      if (error) throw error;
      result = data?.[0];
      
      if (!result) {
        return new Response(
          JSON.stringify({ success: false, error: 'Comment not found or access denied' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
    } else {
      // Create new comment - using .limit(1) instead of .single()
      const { data, error } = await supabase
        .from('public_comments')
        .insert(commentData)
        .select()
        .limit(1);

      if (error) throw error;
      result = data?.[0];
      
      if (!result) {
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to create comment' }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
    }

    // Create notification if submitted
    if (status === 'submitted' && result) {
      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'comment_submitted',
        title: 'Comment Submitted Successfully',
        message: `Your comment on "${regulationTitle}" has been submitted.`,
        metadata: { comment_id: result.id, regulation_id: regulationId }
      });
    }

    return new Response(
      JSON.stringify({ success: true, comment: result }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[save-public-comment] Error:', errorMessage);
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
```

## Key Changes Made

1. **Replaced `.single()` with `.limit(1)`**: This prevents 406 errors when no rows are found
2. **Access `data[0]` instead of `data`**: Since `.limit(1)` returns an array, we access the first element
3. **Added null checks**: Proper validation that data exists before using it
4. **Added environment variable checks**: Validates required env vars are present with specific error messages
5. **Added comprehensive logging**: Console logs for debugging in Supabase dashboard
6. **Improved error messages**: More descriptive error messages for troubleshooting
7. **Safe JSON parsing**: Handles empty or malformed request bodies gracefully
8. **AI Enhancement**: Added OpenAI integration for generating additional compliance items and tips

## How to Deploy

1. Go to your Supabase Dashboard
2. Navigate to **Edge Functions**
3. Find the function to update (e.g., `generate-checklist-from-template`)
4. Click the function name to open it
5. Click **Edit** or **Deploy new version**
6. Replace the entire code with the updated version above
7. Click **Deploy**
8. Verify the function is working by checking the logs

## Testing

### Test generate-checklist-from-template

```bash
curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/generate-checklist-from-template' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "templateId": "TEMPLATE_UUID",
    "states": ["CA", "CO"],
    "enableAI": true,
    "includeAITips": true
  }'
```

### Expected Success Response

```json
{
  "success": true,
  "checklistId": "uuid-here",
  "message": "Checklist created successfully",
  "stats": {
    "templateItems": 12,
    "aiGeneratedItems": 4,
    "totalItems": 16,
    "complianceTips": 3
  },
  "complianceTips": [
    "Ensure all cultivation records are maintained for at least 7 years per California regulations.",
    "Colorado requires quarterly pesticide usage reports - set up automated reminders.",
    "Both states require seed-to-sale tracking - verify your METRC integration is current."
  ]
}
```

### Expected Error Responses

```json
// Missing templateId
{ "success": false, "error": "Template ID is required" }

// Template not found
{ "success": false, "error": "Template not found" }

// Auth error
{ "success": false, "error": "Authorization required" }

// Server error
{ "success": false, "error": "Server configuration error: Missing SUPABASE_URL" }
```

## Troubleshooting

### Common Issues

1. **406 Error**: You're still using `.single()` somewhere - search and replace with `.limit(1)`

2. **500 Error with "undefined"**: Missing null check - ensure you access `data?.[0]` not just `data`

3. **401 Unauthorized**: Check that the Authorization header is being passed correctly

4. **Empty response**: The query returned no results - add proper error handling for this case

### Checking Logs

1. Go to Supabase Dashboard > Edge Functions
2. Click on the function name
3. Click "Logs" tab
4. Look for `[generate-checklist]` or `[save-public-comment]` prefixed messages
