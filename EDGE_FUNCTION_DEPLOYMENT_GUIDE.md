# Comprehensive Edge Function Deployment Guide with CORS Fixes

This guide contains ALL edge functions in the project with proper CORS headers. Use this checklist to verify each function is deployed correctly.

## Quick Reference: CORS Headers Template

Every edge function MUST include these headers:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400'
};
```

And handle OPTIONS preflight:

```typescript
if (req.method === 'OPTIONS') {
  return new Response(null, { status: 204, headers: corsHeaders });
}
```

---

## Deployment Checklist

Use this checklist to track your progress:

| # | Function Name | Status | Tested | Notes |
|---|---------------|--------|--------|-------|
| 1 | generate-checklist-from-template | ☐ | ☐ | AI-enhanced checklist generation |
| 2 | generate-compliance-checklist | ☐ | ☐ | AI checklist from business type |
| 3 | federal-register-poller | ☐ | ☐ | Federal Register API polling |
| 4 | regulations-gov-poller | ☐ | ☐ | Regulations.gov API polling |
| 5 | scheduled-poller-cron | ☐ | ☐ | Orchestrates all pollers |
| 6 | state-regulations-poller | ☐ | ☐ | State cannabis regulations |
| 7 | nlp-analyzer | ☐ | ☐ | OpenAI entity extraction |
| 8 | ai-regulation-assistant | ☐ | ☐ | AI chatbot |
| 9 | send-digest-emails | ☐ | ☐ | Daily/weekly digest emails |
| 10 | manage-alerts | ☐ | ☐ | Alert CRUD operations |
| 11 | beta-invite-system | ☐ | ☐ | Beta invite management |
| 12 | save-public-comment | ☐ | ☐ | Save/update comments |
| 13 | create-workflow-instance | ☐ | ☐ | Create workflows |
| 14 | analyze-database-performance | ☐ | ☐ | DB optimization |
| 15 | validate-regulation-urls | ☐ | ☐ | URL validation |
| 16 | process-comment-deadline-reminders | ☐ | ☐ | Comment reminders |
| 17 | trigger-all-pollers | ☐ | ☐ | Trigger all pollers |

---

## Function 1: generate-checklist-from-template

**Purpose:** Generate compliance checklists from templates with AI enhancement
**Used By:** `src/pages/TemplateLibrary.tsx`

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400'
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

Return ONLY valid JSON array, no markdown or explanation.`;

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

    if (!response.ok) return [];

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return [];

    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const aiItems = JSON.parse(cleanContent);
    return Array.isArray(aiItems) ? aiItems : [];
  } catch (error) {
    console.error('[generate-checklist] AI enhancement error:', error);
    return [];
  }
}

Deno.serve(async (req) => {
  console.log('[generate-checklist] Request received:', req.method);
  
  // CRITICAL: Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    let requestBody: any = {};
    try {
      const text = await req.text();
      if (text && text.trim()) {
        requestBody = JSON.parse(text);
      }
    } catch (parseError) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON in request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const { templateId, checklistName, states = [], enableAI = true } = requestBody;

    if (!templateId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Template ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication failed' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const user = userData.user;

    // Fetch template using .limit(1) instead of .single()
    const { data: templateData, error: templateError } = await supabase
      .from('checklist_templates')
      .select('*')
      .eq('id', templateId)
      .limit(1);

    if (templateError) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch template: ' + templateError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const template = templateData?.[0];
    if (!template) {
      return new Response(
        JSON.stringify({ success: false, error: 'Template not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const templateItems = template.template_items;
    if (!templateItems || !Array.isArray(templateItems) || templateItems.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Template has no items' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // AI Enhancement
    let aiGeneratedItems: any[] = [];
    if (enableAI && openaiKey) {
      aiGeneratedItems = await enhanceChecklistWithAI(template, states, openaiKey);
    }

    // Create checklist using .limit(1)
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
          ai_items_count: aiGeneratedItems.length
        }
      })
      .select()
      .limit(1);

    if (checklistError) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create checklist: ' + checklistError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const checklist = checklistData?.[0];
    if (!checklist) {
      return new Response(
        JSON.stringify({ success: false, error: 'Checklist creation failed' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

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
        metadata: { source: 'ai', ai_generated: true, ai_reason: item.ai_reason }
      }))
    ];

    const { error: itemsError } = await supabase
      .from('checklist_items')
      .insert(allItems);

    if (itemsError) {
      await supabase.from('compliance_checklists').delete().eq('id', checklist.id);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create checklist items: ' + itemsError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Update template usage count (non-blocking)
    supabase
      .from('checklist_templates')
      .update({ usage_count: (template.usage_count || 0) + 1 })
      .eq('id', templateId)
      .then(() => {});

    return new Response(
      JSON.stringify({ 
        success: true, 
        checklistId: checklist.id,
        message: 'Checklist created successfully',
        stats: {
          templateItems: templateItems.length,
          aiGeneratedItems: aiGeneratedItems.length,
          totalItems: allItems.length
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[generate-checklist] Unexpected error:', errorMessage);
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
```

### Test Command:
```bash
# Test OPTIONS preflight
curl -X OPTIONS 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/generate-checklist-from-template' \
  -H 'Origin: https://your-app.com' \
  -H 'Access-Control-Request-Method: POST' \
  -v

# Test POST
curl -X POST 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/generate-checklist-from-template' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"templateId": "TEMPLATE_UUID", "states": ["CA", "CO"]}'
```

---

## Function 2: generate-compliance-checklist

**Purpose:** Generate AI-powered compliance checklists based on business type and states
**Used By:** `src/components/ChecklistGenerator.tsx`

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

Deno.serve(async (req) => {
  // CRITICAL: Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    
    let body: any = {};
    try {
      const text = await req.text();
      if (text) body = JSON.parse(text);
    } catch (e) {}

    const { businessType, states, includeFederal, name, userId } = body;

    if (!businessType || !states || states.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Business type and states are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate checklist items using AI if available
    let checklistItems: any[] = [];
    
    if (openaiKey) {
      try {
        const prompt = `Generate a compliance checklist for a ${businessType} cannabis/hemp business operating in ${states.join(', ')}${includeFederal ? ' with federal requirements' : ''}.

Return a JSON array with 10-15 items. Each item should have:
- title: string (concise action item)
- description: string (detailed explanation)
- category: string (e.g., "Licensing", "Security", "Testing", "Record Keeping", "Packaging")
- priority: "high" | "medium" | "low"
- state_specific: boolean (true if specific to a state)
- applicable_states: string[] (which states this applies to)

Return ONLY valid JSON array.`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'You are a cannabis regulatory compliance expert. Respond with JSON only.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 2000
          })
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            checklistItems = JSON.parse(cleanContent);
          }
        }
      } catch (aiError) {
        console.error('AI generation failed:', aiError);
      }
    }

    // Fallback to default items if AI fails
    if (checklistItems.length === 0) {
      checklistItems = [
        { title: 'Obtain State License', description: 'Apply for and obtain required state cannabis license', category: 'Licensing', priority: 'high' },
        { title: 'Local Permits', description: 'Obtain all required local permits and zoning approvals', category: 'Licensing', priority: 'high' },
        { title: 'Security System', description: 'Install compliant security and surveillance systems', category: 'Security', priority: 'high' },
        { title: 'Seed-to-Sale Tracking', description: 'Implement required tracking system (METRC, BioTrack, etc.)', category: 'Compliance', priority: 'high' },
        { title: 'Employee Training', description: 'Complete required employee compliance training', category: 'Training', priority: 'medium' },
        { title: 'Testing Protocols', description: 'Establish product testing procedures with licensed lab', category: 'Testing', priority: 'high' },
        { title: 'Packaging Compliance', description: 'Ensure all packaging meets state requirements', category: 'Packaging', priority: 'medium' },
        { title: 'Record Keeping', description: 'Set up compliant record keeping systems', category: 'Record Keeping', priority: 'medium' }
      ];
    }

    // Create the checklist
    const { data: checklist, error: checklistError } = await supabase
      .from('compliance_checklists')
      .insert({
        name: name || `${businessType} Compliance Checklist`,
        description: `Compliance checklist for ${businessType} in ${states.join(', ')}`,
        business_type: businessType,
        states: states,
        created_by: userId,
        metadata: { ai_generated: checklistItems.length > 8, include_federal: includeFederal }
      })
      .select()
      .limit(1);

    if (checklistError) throw checklistError;

    const checklistId = checklist?.[0]?.id;
    if (!checklistId) throw new Error('Failed to create checklist');

    // Insert items
    const items = checklistItems.map((item: any, index: number) => ({
      checklist_id: checklistId,
      title: item.title,
      description: item.description,
      category: item.category || 'General',
      priority: item.priority || 'medium',
      completed: false,
      sort_order: index,
      metadata: { state_specific: item.state_specific, applicable_states: item.applicable_states }
    }));

    await supabase.from('checklist_items').insert(items);

    return new Response(
      JSON.stringify({ success: true, checklistId, itemCount: items.length }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
```

### Test Command:
```bash
curl -X POST 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/generate-compliance-checklist' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"businessType": "dispensary", "states": ["CA", "CO"], "includeFederal": true, "name": "My Checklist"}'
```

---

## Function 3: federal-register-poller

**Purpose:** Poll Federal Register API for cannabis/hemp regulations
**Used By:** `scheduled-poller-cron`, `DataIngestionTester.tsx`

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SEARCH_TERMS = [
  'cannabis', 'marijuana', 'hemp', 'CBD', 'cannabidiol',
  'THC', 'tetrahydrocannabinol', 'controlled substances cannabis',
  'kratom', 'mitragyna', 'nicotine', 'tobacco', 'vaping',
  'psilocybin', 'psychedelic'
];

Deno.serve(async (req) => {
  // CRITICAL: Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let body: any = {};
    try {
      const text = await req.text();
      if (text && text.trim()) body = JSON.parse(text);
    } catch (e) {
      // Empty body is OK
    }

    const { searchTerms = SEARCH_TERMS, daysBack = 30 } = body;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    const dateStr = startDate.toISOString().split('T')[0];

    let totalRecords = 0;
    let newRecords = 0;
    const errors: string[] = [];

    // Get US jurisdiction ID
    const { data: usJurisdiction } = await supabase
      .from('jurisdiction')
      .select('id')
      .eq('code', 'US')
      .limit(1);

    const jurisdictionId = usJurisdiction?.[0]?.id;

    for (const term of searchTerms) {
      try {
        const url = `https://www.federalregister.gov/api/v1/documents.json?conditions[term]=${encodeURIComponent(term)}&conditions[publication_date][gte]=${dateStr}&per_page=50&order=newest`;
        
        const response = await fetch(url);
        if (!response.ok) {
          errors.push(`Failed to fetch for term: ${term}`);
          continue;
        }

        const data = await response.json();
        const documents = data.results || [];
        totalRecords += documents.length;

        for (const doc of documents) {
          const { error } = await supabase.from('instrument').upsert({
            external_id: `fr-${doc.document_number}`,
            title: doc.title,
            description: doc.abstract || doc.title,
            effective_date: doc.publication_date,
            jurisdiction_id: jurisdictionId,
            source: 'federal_register',
            url: doc.html_url,
            metadata: {
              document_number: doc.document_number,
              type: doc.type,
              agencies: doc.agencies?.map((a: any) => a.name) || [],
              docket_ids: doc.docket_ids || [],
              comment_end_date: doc.comments_close_on,
              search_term: term,
              lastPolled: new Date().toISOString()
            }
          }, { onConflict: 'external_id' });

          if (!error) newRecords++;
        }
      } catch (termError: any) {
        errors.push(`Error for term ${term}: ${termError.message}`);
      }
    }

    // Log ingestion
    await supabase.from('ingestion_log').insert({
      source_id: 'federal-register-poller',
      source: 'federal_register',
      status: errors.length === 0 ? 'success' : 'partial',
      records_fetched: totalRecords,
      records_created: newRecords,
      started_at: new Date().toISOString(),
      metadata: { searchTerms, daysBack, errors }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        totalRecords, 
        newRecords,
        errors: errors.length > 0 ? errors : undefined,
        message: `Processed ${totalRecords} records, ${newRecords} new/updated`
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Federal Register poller error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
```

### Test Command:
```bash
curl -X POST 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/federal-register-poller' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

---

## Function 4: regulations-gov-poller

**Purpose:** Poll Regulations.gov API for cannabis/hemp regulations
**Used By:** `scheduled-poller-cron`, `DataIngestionTester.tsx`

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SEARCH_TERMS = ['cannabis', 'marijuana', 'hemp', 'CBD', 'kratom', 'nicotine', 'psilocybin'];

Deno.serve(async (req) => {
  // CRITICAL: Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const regulationsApiKey = Deno.env.get('REGULATIONS_GOV_API_KEY');
    
    if (!regulationsApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'REGULATIONS_GOV_API_KEY not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    let body: any = {};
    try {
      const text = await req.text();
      if (text && text.trim()) body = JSON.parse(text);
    } catch (e) {}

    const { searchTerms = SEARCH_TERMS } = body;
    
    let totalRecords = 0;
    let newRecords = 0;
    const errors: string[] = [];

    // Get US jurisdiction ID
    const { data: usJurisdiction } = await supabase
      .from('jurisdiction')
      .select('id')
      .eq('code', 'US')
      .limit(1);

    const jurisdictionId = usJurisdiction?.[0]?.id;

    for (const term of searchTerms) {
      try {
        const url = `https://api.regulations.gov/v4/documents?filter[searchTerm]=${encodeURIComponent(term)}&sort=-postedDate&page[size]=25`;
        
        const response = await fetch(url, {
          headers: { 'X-Api-Key': regulationsApiKey }
        });

        if (!response.ok) {
          errors.push(`Failed to fetch for term: ${term} (${response.status})`);
          continue;
        }

        const data = await response.json();
        const documents = data.data || [];
        totalRecords += documents.length;

        for (const doc of documents) {
          const attrs = doc.attributes || {};
          
          const { error } = await supabase.from('instrument').upsert({
            external_id: `rg-${doc.id}`,
            title: attrs.title || doc.id,
            description: attrs.summary || attrs.title || '',
            effective_date: attrs.postedDate?.split('T')[0] || new Date().toISOString().split('T')[0],
            jurisdiction_id: jurisdictionId,
            source: 'regulations_gov',
            url: `https://www.regulations.gov/document/${doc.id}`,
            metadata: {
              document_id: doc.id,
              document_type: attrs.documentType,
              agency_id: attrs.agencyId,
              docket_id: attrs.docketId,
              comment_end_date: attrs.commentEndDate,
              search_term: term,
              lastPolled: new Date().toISOString()
            }
          }, { onConflict: 'external_id' });

          if (!error) newRecords++;
        }
      } catch (termError: any) {
        errors.push(`Error for term ${term}: ${termError.message}`);
      }
    }

    // Log ingestion
    await supabase.from('ingestion_log').insert({
      source_id: 'regulations-gov-poller',
      source: 'regulations_gov',
      status: errors.length === 0 ? 'success' : 'partial',
      records_fetched: totalRecords,
      records_created: newRecords,
      started_at: new Date().toISOString(),
      metadata: { searchTerms, errors }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        totalRecords, 
        newRecords,
        errors: errors.length > 0 ? errors : undefined,
        message: `Processed ${totalRecords} records, ${newRecords} new/updated`
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Regulations.gov poller error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
```

### Test Command:
```bash
curl -X POST 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/regulations-gov-poller' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

---

## Function 5: scheduled-poller-cron

**Purpose:** Orchestrate all polling functions on a schedule
**Used By:** pg_cron, GitHub Actions

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

Deno.serve(async (req) => {
  // CRITICAL: Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    const now = new Date();
    const hour = now.getUTCHours();
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const results: Record<string, any> = {
      federalRegister: { success: false, message: '', recordsAdded: 0 },
      regulationsGov: { success: false, message: '', recordsAdded: 0 },
      stateRegulations: { success: false, message: '', recordsAdded: 0 },
      commentReminders: { success: false, message: '', remindersSent: 0 }
    };

    // Helper function to call other edge functions
    const callFunction = async (name: string): Promise<any> => {
      const response = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({})
      });
      return response.json();
    };

    // Always run Federal Register and Regulations.gov pollers
    try {
      const frData = await callFunction('federal-register-poller');
      results.federalRegister = {
        success: true,
        message: frData.message || 'Completed',
        recordsAdded: frData.newRecords || 0
      };
    } catch (error: any) {
      results.federalRegister.message = `Error: ${error.message}`;
    }

    try {
      const rgData = await callFunction('regulations-gov-poller');
      results.regulationsGov = {
        success: true,
        message: rgData.message || 'Completed',
        recordsAdded: rgData.newRecords || 0
      };
    } catch (error: any) {
      results.regulationsGov.message = `Error: ${error.message}`;
    }

    // Run state regulations poller every 6 hours (0, 6, 12, 18 UTC)
    if (hour === 0 || hour === 6 || hour === 12 || hour === 18) {
      try {
        const stateData = await callFunction('state-regulations-poller');
        results.stateRegulations = {
          success: true,
          message: stateData.message || 'Completed',
          recordsAdded: stateData.recordsProcessed || 0
        };
      } catch (error: any) {
        results.stateRegulations.message = `Error: ${error.message}`;
      }
    } else {
      results.stateRegulations.message = `Skipped - runs at 0, 6, 12, 18 UTC (current: ${hour})`;
    }

    // Process comment reminders daily at 9 AM UTC
    if (hour === 9) {
      try {
        const reminderData = await callFunction('process-comment-deadline-reminders');
        results.commentReminders = {
          success: true,
          message: reminderData.message || 'Completed',
          remindersSent: reminderData.remindersSent || 0
        };
      } catch (error: any) {
        results.commentReminders.message = `Error: ${error.message}`;
      }
    } else {
      results.commentReminders.message = `Skipped - runs at 9 AM UTC (current: ${hour})`;
    }

    const duration = Date.now() - startTime;

    return new Response(JSON.stringify({
      success: true,
      executionTime: duration,
      currentHour: hour,
      timestamp: now.toISOString(),
      results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    console.error('Scheduled poller error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
```

### Test Command:
```bash
curl -X POST 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/scheduled-poller-cron' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json'
```

---

## Function 6: state-regulations-poller

**Purpose:** Poll state cannabis regulatory agency websites
**Used By:** `scheduled-poller-cron`, `StateRegulationsPoller.tsx`

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const STATE_CANNABIS_URLS: Record<string, { agency: string; regulations: string; dispensary?: string }> = {
  'CA': { agency: 'https://cannabis.ca.gov', regulations: 'https://cannabis.ca.gov/cannabis-laws/dcc-regulations/', dispensary: 'https://cannabis.ca.gov/licensees/retail/' },
  'CO': { agency: 'https://med.colorado.gov', regulations: 'https://med.colorado.gov/rules', dispensary: 'https://med.colorado.gov/retail-marijuana' },
  'WA': { agency: 'https://lcb.wa.gov', regulations: 'https://lcb.wa.gov/laws/current-laws-and-rules', dispensary: 'https://lcb.wa.gov/marijuana/marijuana-licensing' },
  'OR': { agency: 'https://www.oregon.gov/olcc', regulations: 'https://www.oregon.gov/olcc/marijuana/Pages/Recreational-Marijuana-Laws-and-Rules.aspx' },
  'NV': { agency: 'https://ccb.nv.gov', regulations: 'https://ccb.nv.gov/laws-regulations/', dispensary: 'https://ccb.nv.gov/industry/' },
  'MA': { agency: 'https://masscannabiscontrol.com', regulations: 'https://masscannabiscontrol.com/public-documents/regulations/' },
  'IL': { agency: 'https://idfpr.illinois.gov/profs/adultusecan.html', regulations: 'https://idfpr.illinois.gov/profs/adultusecan.html' },
  'AZ': { agency: 'https://www.azdhs.gov/licensing/marijuana', regulations: 'https://www.azdhs.gov/licensing/marijuana/adult-use-marijuana' },
  'NY': { agency: 'https://cannabis.ny.gov', regulations: 'https://cannabis.ny.gov/regulations' },
  'NJ': { agency: 'https://www.nj.gov/cannabis', regulations: 'https://www.nj.gov/cannabis/resources/cannabis-laws/' },
  'MI': { agency: 'https://www.michigan.gov/cra', regulations: 'https://www.michigan.gov/cra/sections/adult-use' },
  'PA': { agency: 'https://www.pa.gov/agencies/health/programs/medical-marijuana', regulations: 'https://www.pa.gov/agencies/health/programs/medical-marijuana/medical-marijuana-regulations' },
  'FL': { agency: 'https://knowthefactsmmj.com', regulations: 'https://knowthefactsmmj.com/rules/' },
  'OH': { agency: 'https://medicalmarijuana.ohio.gov', regulations: 'https://medicalmarijuana.ohio.gov/rules' },
  'MD': { agency: 'https://mmcc.maryland.gov', regulations: 'https://mmcc.maryland.gov/Pages/regulations.aspx' },
  'MO': { agency: 'https://cannabis.mo.gov', regulations: 'https://cannabis.mo.gov/rules-regulations' },
  'VT': { agency: 'https://ccb.vermont.gov', regulations: 'https://ccb.vermont.gov/rule' },
  'ME': { agency: 'https://www.maine.gov/dafs/ocp', regulations: 'https://www.maine.gov/dafs/ocp/rules' },
  'CT': { agency: 'https://portal.ct.gov/dcp/cannabis', regulations: 'https://portal.ct.gov/dcp/cannabis/cannabis-regulations' },
  'RI': { agency: 'https://dbr.ri.gov/cannabis', regulations: 'https://dbr.ri.gov/cannabis/regulations' },
  'NM': { agency: 'https://www.rld.nm.gov/cannabis', regulations: 'https://www.rld.nm.gov/cannabis/cannabis-rules-and-laws/' },
  'VA': { agency: 'https://www.cca.virginia.gov', regulations: 'https://www.cca.virginia.gov/regulations' },
  'DE': { agency: 'https://dda.delaware.gov/marijuana', regulations: 'https://dda.delaware.gov/marijuana/regulations' },
  'MN': { agency: 'https://mn.gov/ocm', regulations: 'https://mn.gov/ocm/rules' },
  'MT': { agency: 'https://mtrevenue.gov/cannabis', regulations: 'https://mtrevenue.gov/cannabis/rules' },
  'AK': { agency: 'https://www.commerce.alaska.gov/web/amco', regulations: 'https://www.commerce.alaska.gov/web/amco/MarijuanaRegulations' },
  'OK': { agency: 'https://omma.ok.gov', regulations: 'https://omma.ok.gov/rules' }
};

Deno.serve(async (req) => {
  // CRITICAL: Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is OK
    }
    
    const { stateCode, fullScan } = body;

    // Get jurisdictions
    let jurisdictionQuery = supabase
      .from('jurisdiction')
      .select('id, name, code')
      .neq('code', 'US');
    
    if (stateCode) {
      jurisdictionQuery = jurisdictionQuery.eq('code', stateCode);
    }
    
    const { data: jurisdictions, error: jurisdictionError } = await jurisdictionQuery;
    
    if (jurisdictionError) throw new Error(`Failed to fetch jurisdictions: ${jurisdictionError.message}`);

    let recordsProcessed = 0;
    let statesProcessed = 0;

    for (const jurisdiction of jurisdictions || []) {
      const urls = STATE_CANNABIS_URLS[jurisdiction.code];
      
      if (urls) {
        statesProcessed++;
        
        // Upsert agency record
        const { error: agencyError } = await supabase.from('instrument').upsert({
          external_id: `${jurisdiction.code}-cannabis-agency`,
          title: `${jurisdiction.name} Cannabis Regulatory Agency`,
          description: `Official cannabis regulatory agency for ${jurisdiction.name}`,
          effective_date: new Date().toISOString().split('T')[0],
          jurisdiction_id: jurisdiction.id,
          source: 'state_regulations',
          url: urls.agency,
          metadata: { category: 'Cannabis', topic: 'agency', verified: true, lastPolled: new Date().toISOString() }
        }, { onConflict: 'external_id' });
        
        if (!agencyError) recordsProcessed++;

        // Upsert regulations record
        const { error: regError } = await supabase.from('instrument').upsert({
          external_id: `${jurisdiction.code}-cannabis-regulations`,
          title: `${jurisdiction.name} Cannabis Regulations`,
          description: `Official cannabis regulations for ${jurisdiction.name}`,
          effective_date: new Date().toISOString().split('T')[0],
          jurisdiction_id: jurisdiction.id,
          source: 'state_regulations',
          url: urls.regulations,
          metadata: { category: 'Cannabis', topic: 'regulations', verified: true, lastPolled: new Date().toISOString() }
        }, { onConflict: 'external_id' });
        
        if (!regError) recordsProcessed++;

        if (urls.dispensary) {
          const { error: dispError } = await supabase.from('instrument').upsert({
            external_id: `${jurisdiction.code}-dispensary-regulations`,
            title: `${jurisdiction.name} Dispensary Regulations`,
            description: `Dispensary licensing and regulations for ${jurisdiction.name}`,
            effective_date: new Date().toISOString().split('T')[0],
            jurisdiction_id: jurisdiction.id,
            source: 'state_regulations',
            url: urls.dispensary,
            metadata: { category: 'Cannabis', topic: 'dispensary', verified: true, lastPolled: new Date().toISOString() }
          }, { onConflict: 'external_id' });
          
          if (!dispError) recordsProcessed++;
        }
      }
    }

    // Log ingestion
    await supabase.from('ingestion_log').insert({
      source_id: 'state-regulations-poller',
      source: 'state_regulations',
      status: 'success',
      records_fetched: recordsProcessed,
      records_created: 0,
      started_at: new Date().toISOString(),
      metadata: { statesProcessed, stateCode: stateCode || 'all', fullScan: fullScan || false }
    });

    return new Response(JSON.stringify({ 
      success: true, 
      recordsProcessed,
      statesProcessed,
      message: `Processed ${recordsProcessed} records from ${statesProcessed} states`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    console.error('State regulations poller error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
```

### Test Command:
```bash
curl -X POST 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/state-regulations-poller' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"stateCode": "CA"}'
```

---

## Function 7: nlp-analyzer

**Purpose:** Extract entities from regulations using OpenAI
**Used By:** `BatchNLPAnalysis.tsx`, `NLPAnalysisPanel.tsx`, `RegulationModalNew.tsx`

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

Deno.serve(async (req) => {
  // CRITICAL: Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'OpenAI API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    let body: any = {};
    try {
      const text = await req.text();
      if (text) body = JSON.parse(text);
    } catch (e) {}

    const { instrumentId, text: providedText, forceReanalyze = false } = body;

    if (!instrumentId && !providedText) {
      return new Response(
        JSON.stringify({ success: false, error: 'instrumentId or text is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    let textToAnalyze = providedText;
    let instrument: any = null;

    // Fetch instrument if ID provided
    if (instrumentId) {
      const { data, error } = await supabase
        .from('instrument')
        .select('*')
        .eq('id', instrumentId)
        .limit(1);

      if (error) throw error;
      instrument = data?.[0];
      
      if (!instrument) {
        return new Response(
          JSON.stringify({ success: false, error: 'Instrument not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Check if already analyzed
      if (instrument.nlp_analyzed && !forceReanalyze) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            alreadyAnalyzed: true,
            entities: instrument.extracted_entities || [],
            message: 'Already analyzed. Set forceReanalyze=true to re-analyze.'
          }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      textToAnalyze = `${instrument.title}\n\n${instrument.description || ''}`;
    }

    // Call OpenAI for entity extraction
    const prompt = `Analyze this regulatory document and extract structured information.

Document:
${textToAnalyze}

Extract and return a JSON object with:
{
  "products": ["list of regulated products mentioned"],
  "requirements": ["list of specific requirements"],
  "deadlines": ["list of dates/deadlines mentioned"],
  "penalties": ["list of penalties/fines mentioned"],
  "agencies": ["list of regulatory agencies mentioned"],
  "licenses": ["list of license types mentioned"],
  "keywords": ["important regulatory keywords"],
  "summary": "2-3 sentence summary of the regulation",
  "regulatory_stage": "proposed | final | effective | withdrawn",
  "confidence": 0.0-1.0
}

Return ONLY valid JSON.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a regulatory document analyst. Extract structured information and return valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    // Parse the JSON response
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const entities = JSON.parse(cleanContent);

    // Update instrument if ID was provided
    if (instrumentId && instrument) {
      await supabase
        .from('instrument')
        .update({
          extracted_entities: entities,
          nlp_analyzed: true,
          nlp_analyzed_at: new Date().toISOString()
        })
        .eq('id', instrumentId);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        entities,
        instrumentId,
        message: 'Analysis complete'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('NLP analyzer error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
```

### Test Command:
```bash
curl -X POST 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/nlp-analyzer' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"text": "California cannabis dispensaries must maintain security cameras with 90-day retention. Violations may result in fines up to $10,000."}'
```

---

## Function 8: ai-regulation-assistant

**Purpose:** AI chatbot for regulation questions
**Used By:** `AIChatbot.tsx`

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

Deno.serve(async (req) => {
  // CRITICAL: Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'OpenAI API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    let body: any = {};
    try {
      const text = await req.text();
      if (text) body = JSON.parse(text);
    } catch (e) {}

    const { message, conversationHistory = [], context = {} } = body;

    if (!message) {
      return new Response(
        JSON.stringify({ success: false, error: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Fetch relevant regulations for context
    const { data: regulations } = await supabase
      .from('instrument')
      .select('title, description, jurisdiction_id, metadata')
      .textSearch('title', message.split(' ').slice(0, 3).join(' | '))
      .limit(5);

    const regulationContext = regulations?.map(r => 
      `- ${r.title}: ${r.description?.substring(0, 200)}...`
    ).join('\n') || 'No specific regulations found.';

    const systemPrompt = `You are a helpful cannabis/hemp regulatory compliance assistant. You help users understand regulations, compliance requirements, and licensing procedures.

Available regulation context:
${regulationContext}

Guidelines:
- Be accurate and cite specific regulations when possible
- If unsure, recommend consulting with a compliance professional
- Focus on cannabis, hemp, CBD, kratom, nicotine, and psychedelic regulations
- Provide actionable advice when appropriate`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: message }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const reply = aiData.choices?.[0]?.message?.content;

    return new Response(
      JSON.stringify({ 
        success: true, 
        reply,
        relatedRegulations: regulations?.map(r => ({ title: r.title })) || []
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('AI assistant error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
```

### Test Command:
```bash
curl -X POST 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/ai-regulation-assistant' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"message": "What are the licensing requirements for a cannabis dispensary in California?"}'
```

---

## Function 9: send-digest-emails

**Purpose:** Send daily/weekly digest emails to users
**Used By:** `DigestTestButton.tsx`, pg_cron

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

Deno.serve(async (req) => {
  // CRITICAL: Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    let body: any = {};
    try {
      const text = await req.text();
      if (text) body = JSON.parse(text);
    } catch (e) {}

    const { frequency = 'daily' } = body;

    // Get users subscribed to this digest frequency
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, email, digest_frequency, tracked_states')
      .eq('digest_frequency', frequency)
      .eq('email_notifications', true);

    if (usersError) throw usersError;

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No users subscribed to this digest', emailsSent: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Get recent regulations
    const daysBack = frequency === 'daily' ? 1 : 7;
    const since = new Date();
    since.setDate(since.getDate() - daysBack);

    const { data: regulations } = await supabase
      .from('instrument')
      .select('id, title, description, effective_date, jurisdiction_id, source')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .limit(20);

    let emailsSent = 0;
    const errors: string[] = [];

    for (const user of users) {
      try {
        // Filter regulations by user's tracked states if applicable
        const userRegulations = regulations || [];
        
        if (userRegulations.length === 0) continue;

        // Send email via Resend if configured
        if (resendApiKey) {
          const emailHtml = `
            <h2>${frequency === 'daily' ? 'Daily' : 'Weekly'} Regulation Digest</h2>
            <p>Here are the latest regulatory updates:</p>
            <ul>
              ${userRegulations.map(r => `<li><strong>${r.title}</strong><br/>${r.description?.substring(0, 150)}...</li>`).join('')}
            </ul>
            <p><a href="https://your-app.com/dashboard">View all regulations</a></p>
          `;

          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: 'noreply@your-domain.com',
              to: user.email,
              subject: `${frequency === 'daily' ? 'Daily' : 'Weekly'} Regulation Digest - ${new Date().toLocaleDateString()}`,
              html: emailHtml
            })
          });
        }

        emailsSent++;
      } catch (userError: any) {
        errors.push(`Failed to send to ${user.email}: ${userError.message}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent,
        totalUsers: users.length,
        regulationsIncluded: regulations?.length || 0,
        errors: errors.length > 0 ? errors : undefined
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Digest email error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
```

### Test Command:
```bash
curl -X POST 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/send-digest-emails' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"frequency": "daily"}'
```

---

## Function 10: manage-alerts

**Purpose:** CRUD operations for alert profiles
**Used By:** `AlertPreferences.tsx`

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

Deno.serve(async (req) => {
  // CRITICAL: Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let body: any = {};
    try {
      const text = await req.text();
      if (text) body = JSON.parse(text);
    } catch (e) {}

    const { action, data } = body;

    if (!action) {
      return new Response(
        JSON.stringify({ success: false, error: 'Action is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    let result: any;

    switch (action) {
      case 'list':
        const { data: profiles, error: listError } = await supabase
          .from('alert_profiles')
          .select('*')
          .eq('user_id', data.userId)
          .order('created_at', { ascending: false });
        
        if (listError) throw listError;
        result = { profiles };
        break;

      case 'create':
        const { data: newProfile, error: createError } = await supabase
          .from('alert_profiles')
          .insert({
            user_id: data.userId,
            name: data.name,
            keywords: data.keywords || [],
            jurisdictions: data.jurisdictions || [],
            categories: data.categories || [],
            email_enabled: data.emailEnabled ?? true,
            push_enabled: data.pushEnabled ?? false
          })
          .select()
          .limit(1);
        
        if (createError) throw createError;
        result = { profile: newProfile?.[0] };
        break;

      case 'update':
        const { data: updatedProfile, error: updateError } = await supabase
          .from('alert_profiles')
          .update({
            name: data.name,
            keywords: data.keywords,
            jurisdictions: data.jurisdictions,
            categories: data.categories,
            email_enabled: data.emailEnabled,
            push_enabled: data.pushEnabled
          })
          .eq('id', data.profileId)
          .eq('user_id', data.userId)
          .select()
          .limit(1);
        
        if (updateError) throw updateError;
        result = { profile: updatedProfile?.[0] };
        break;

      case 'delete':
        const { error: deleteError } = await supabase
          .from('alert_profiles')
          .delete()
          .eq('id', data.profileId);
        
        if (deleteError) throw deleteError;
        result = { deleted: true };
        break;

      case 'subscribe':
        const { error: subError } = await supabase
          .from('user_alert_subscriptions')
          .upsert({
            user_id: data.userId,
            profile_id: data.profileId,
            active: true
          });
        
        if (subError) throw subError;
        result = { subscribed: true };
        break;

      case 'get_user':
        const { data: user, error: userError } = await supabase
          .from('user_profiles')
          .select('id, email, digest_frequency')
          .eq('email', data.email)
          .limit(1);
        
        if (userError) throw userError;
        result = { user: user?.[0] };
        break;

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
    }

    return new Response(
      JSON.stringify({ success: true, ...result }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Manage alerts error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
```

### Test Command:
```bash
curl -X POST 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/manage-alerts' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"action": "list", "data": {"userId": "USER_UUID"}}'
```

---

## Function 11: beta-invite-system

**Purpose:** Manage beta invites
**Used By:** `src/lib/betaAccess.ts`

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

Deno.serve(async (req) => {
  // CRITICAL: Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let body: any = {};
    try {
      const text = await req.text();
      if (text) body = JSON.parse(text);
    } catch (e) {}

    const { action, inviteCode, userId, inviteId, email, maxUses } = body;

    if (!action) {
      return new Response(
        JSON.stringify({ success: false, error: 'Action is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    let result: any;

    switch (action) {
      case 'validate_invite':
        const { data: invite, error: validateError } = await supabase
          .from('beta_invites')
          .select('*')
          .eq('code', inviteCode?.toUpperCase())
          .eq('active', true)
          .limit(1);
        
        if (validateError) throw validateError;
        
        const validInvite = invite?.[0];
        if (!validInvite) {
          result = { valid: false, error: 'Invalid invite code' };
        } else if (validInvite.uses >= validInvite.max_uses) {
          result = { valid: false, error: 'Invite code has reached maximum uses' };
        } else if (validInvite.expires_at && new Date(validInvite.expires_at) < new Date()) {
          result = { valid: false, error: 'Invite code has expired' };
        } else {
          result = { valid: true, invite: validInvite };
        }
        break;

      case 'accept_invite':
        // Increment usage count
        const { error: acceptError } = await supabase.rpc('increment_invite_usage', {
          invite_code: inviteCode?.toUpperCase()
        });
        
        if (acceptError) {
          // Fallback: manual increment
          const { data: currentInvite } = await supabase
            .from('beta_invites')
            .select('uses')
            .eq('code', inviteCode?.toUpperCase())
            .limit(1);
          
          if (currentInvite?.[0]) {
            await supabase
              .from('beta_invites')
              .update({ uses: (currentInvite[0].uses || 0) + 1 })
              .eq('code', inviteCode?.toUpperCase());
          }
        }
        
        // Grant beta access to user
        await supabase
          .from('user_profiles')
          .update({ beta_access: true, beta_invite_code: inviteCode?.toUpperCase() })
          .eq('id', userId);
        
        result = { accepted: true };
        break;

      case 'create_invite':
        const newCode = generateInviteCode();
        const { data: newInvite, error: createError } = await supabase
          .from('beta_invites')
          .insert({
            code: newCode,
            created_by: userId,
            email: email,
            max_uses: maxUses || 1,
            uses: 0,
            active: true
          })
          .select()
          .limit(1);
        
        if (createError) throw createError;
        result = { invite: newInvite?.[0] };
        break;

      case 'get_my_invites':
        const { data: myInvites, error: listError } = await supabase
          .from('beta_invites')
          .select('*')
          .eq('created_by', userId)
          .order('created_at', { ascending: false });
        
        if (listError) throw listError;
        result = { invites: myInvites };
        break;

      case 'revoke_invite':
        const { error: revokeError } = await supabase
          .from('beta_invites')
          .update({ active: false })
          .eq('id', inviteId)
          .eq('created_by', userId);
        
        if (revokeError) throw revokeError;
        result = { revoked: true };
        break;

      case 'get_invite_stats':
        const { data: stats } = await supabase
          .from('beta_invites')
          .select('id, uses, max_uses')
          .eq('created_by', userId);
        
        const totalInvites = stats?.length || 0;
        const totalUses = stats?.reduce((sum, i) => sum + (i.uses || 0), 0) || 0;
        result = { totalInvites, totalUses };
        break;

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
    }

    return new Response(
      JSON.stringify({ success: true, ...result }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Beta invite error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
```

### Test Command:
```bash
curl -X POST 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/beta-invite-system' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"action": "validate_invite", "inviteCode": "ABC12345"}'
```

---

## Function 12: save-public-comment

**Purpose:** Save/update public comments on regulations
**Used By:** `PublicCommentEditor.tsx`

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

Deno.serve(async (req) => {
  // CRITICAL: Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let body: any = {};
    try {
      const text = await req.text();
      if (text) body = JSON.parse(text);
    } catch (e) {}

    const { 
      commentId, regulationId, regulationTitle, regulationType,
      jurisdictionCode, agencyName, agencyContactEmail, commentPeriodEnd,
      commentTitle, commentBody, attachments, status, submissionMethod,
      confirmationNumber, tags, regulationUrl, submissionUrl
    } = body;

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

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
      // Update existing
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
      // Create new
      const { data, error } = await supabase
        .from('public_comments')
        .insert(commentData)
        .select()
        .limit(1);

      if (error) throw error;
      result = data?.[0];
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

  } catch (error: any) {
    console.error('Save comment error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
```

---

## Function 13: create-workflow-instance

**Purpose:** Create workflow instances from regulations
**Used By:** `WorkflowTriggerButton.tsx`

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

Deno.serve(async (req) => {
  // CRITICAL: Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let body: any = {};
    try {
      const text = await req.text();
      if (text) body = JSON.parse(text);
    } catch (e) {}

    const { instrumentId, workflowType = 'compliance_review', userId } = body;

    if (!instrumentId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Instrument ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Fetch the instrument
    const { data: instrument, error: instrumentError } = await supabase
      .from('instrument')
      .select('*')
      .eq('id', instrumentId)
      .limit(1);

    if (instrumentError) throw instrumentError;
    if (!instrument?.[0]) {
      return new Response(
        JSON.stringify({ success: false, error: 'Instrument not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const reg = instrument[0];

    // Create workflow instance
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .insert({
        name: `${workflowType} - ${reg.title}`,
        type: workflowType,
        status: 'pending',
        instrument_id: instrumentId,
        created_by: userId,
        metadata: {
          regulation_title: reg.title,
          jurisdiction_id: reg.jurisdiction_id,
          source: reg.source
        }
      })
      .select()
      .limit(1);

    if (workflowError) throw workflowError;

    // Create default tasks based on workflow type
    const tasks = [
      { title: 'Initial Review', description: 'Review the regulation for applicability', status: 'pending', priority: 'high', sort_order: 0 },
      { title: 'Impact Assessment', description: 'Assess impact on current operations', status: 'pending', priority: 'medium', sort_order: 1 },
      { title: 'Compliance Gap Analysis', description: 'Identify gaps in current compliance', status: 'pending', priority: 'medium', sort_order: 2 },
      { title: 'Action Plan', description: 'Create action plan for compliance', status: 'pending', priority: 'high', sort_order: 3 },
      { title: 'Implementation', description: 'Implement required changes', status: 'pending', priority: 'high', sort_order: 4 }
    ].map(task => ({
      ...task,
      workflow_id: workflow?.[0]?.id
    }));

    await supabase.from('workflow_tasks').insert(tasks);

    return new Response(
      JSON.stringify({ 
        success: true, 
        workflow: workflow?.[0],
        tasksCreated: tasks.length
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Create workflow error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
```

---

## Quick Deployment Steps

### For Each Function:

1. **Go to Supabase Dashboard** → Edge Functions
2. **Find the function** or click "New Function"
3. **Replace the entire code** with the version from this guide
4. **Click Deploy**
5. **Test with curl** using the provided test command
6. **Check the checkbox** in the deployment checklist above

### Environment Variables Required

Make sure these are set in Supabase Dashboard → Edge Functions → Secrets:

| Variable | Required For |
|----------|-------------|
| `SUPABASE_URL` | All functions (auto-set) |
| `SUPABASE_ANON_KEY` | All functions (auto-set) |
| `SUPABASE_SERVICE_ROLE_KEY` | All functions (auto-set) |
| `OPENAI_API_KEY` | AI functions (nlp-analyzer, ai-regulation-assistant, generate-*) |
| `REGULATIONS_GOV_API_KEY` | regulations-gov-poller |
| `RESEND_API_KEY` | send-digest-emails |

---

## Verification Script

Run this bash script to test all functions:

```bash
#!/bin/bash

SUPABASE_URL="https://kruwbjaszdwzttblxqwr.supabase.co"
ANON_KEY="YOUR_ANON_KEY"

echo "Testing CORS preflight for all functions..."

FUNCTIONS=(
  "generate-checklist-from-template"
  "generate-compliance-checklist"
  "federal-register-poller"
  "regulations-gov-poller"
  "scheduled-poller-cron"
  "state-regulations-poller"
  "nlp-analyzer"
  "ai-regulation-assistant"
  "send-digest-emails"
  "manage-alerts"
  "beta-invite-system"
  "save-public-comment"
  "create-workflow-instance"
)

for func in "${FUNCTIONS[@]}"; do
  echo ""
  echo "Testing: $func"
  
  # Test OPTIONS
  response=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS \
    "$SUPABASE_URL/functions/v1/$func" \
    -H "Origin: https://your-app.com" \
    -H "Access-Control-Request-Method: POST")
  
  if [ "$response" == "204" ] || [ "$response" == "200" ]; then
    echo "  ✅ OPTIONS: $response"
  else
    echo "  ❌ OPTIONS: $response (expected 204)"
  fi
  
  # Test POST
  response=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    "$SUPABASE_URL/functions/v1/$func" \
    -H "Authorization: Bearer $ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{}')
  
  if [ "$response" != "000" ]; then
    echo "  ✅ POST: $response"
  else
    echo "  ❌ POST: Connection failed"
  fi
done

echo ""
echo "Done! Check results above."
```

---

## Troubleshooting

### CORS Error Still Occurring

1. **Verify deployment**: Function might not have deployed successfully
2. **Check OPTIONS handler**: Must be the FIRST check in the function
3. **Verify headers**: All responses must include `corsHeaders`
4. **Wait 30 seconds**: Deployment propagation time
5. **Hard refresh browser**: Ctrl+Shift+R

### 500 Internal Server Error

1. Check Supabase Dashboard → Edge Functions → Logs
2. Verify environment variables are set
3. Check for syntax errors in the function code

### 401 Unauthorized

1. Verify Authorization header is being sent
2. Check that the token is valid
3. Ensure user has required permissions


---

## Additional Data Source Pollers

For three additional edge functions (cannabis-news-rss-poller, dea-scheduling-poller, fda-hemp-guidance-poller) and the updated orchestrator, see:

**[ADDITIONAL_DATA_SOURCE_POLLERS.md](./ADDITIONAL_DATA_SOURCE_POLLERS.md)**

This includes:
- Cannabis News RSS Poller (8+ news sources)
- DEA Scheduling Updates Poller
- FDA Hemp/CBD Guidance Poller
- Updated scheduled-poller-cron orchestrator

---

## Webhook Handler

For receiving real-time updates from external services (Regulations.gov, Federal Register, state agencies), see:

**[WEBHOOK_HANDLER.md](./WEBHOOK_HANDLER.md)**

This includes:
- HMAC signature verification
- Automatic database updates
- Full audit logging
- Support for multiple webhook sources

---

## State Legislature Poller

For monitoring state legislatures for cannabis-related bills using LegiScan and OpenStates APIs, see:

**[STATE_LEGISLATURE_POLLER.md](./STATE_LEGISLATURE_POLLER.md)**

This includes:
- LegiScan API integration (30,000 monthly queries)
- OpenStates/Plural API integration (500 daily requests)
- Bill status, sponsors, and voting record tracking
- Rate limit management and API usage tracking

---

## Complete Deployment Checklist (All Functions)

### Core Functions
| # | Function Name | Status | Tested |
|---|---------------|--------|--------|
| 1 | generate-checklist-from-template | ☐ | ☐ |
| 2 | generate-compliance-checklist | ☐ | ☐ |
| 3 | federal-register-poller | ☐ | ☐ |
| 4 | regulations-gov-poller | ☐ | ☐ |
| 5 | scheduled-poller-cron | ☐ | ☐ |
| 6 | state-regulations-poller | ☐ | ☐ |
| 7 | nlp-analyzer | ☐ | ☐ |
| 8 | ai-regulation-assistant | ☐ | ☐ |
| 9 | send-digest-emails | ☐ | ☐ |
| 10 | manage-alerts | ☐ | ☐ |
| 11 | beta-invite-system | ☐ | ☐ |
| 12 | save-public-comment | ☐ | ☐ |
| 13 | create-workflow-instance | ☐ | ☐ |

### Additional Data Source Pollers
| # | Function Name | Status | Tested |
|---|---------------|--------|--------|
| 14 | cannabis-news-rss-poller | ☐ | ☐ |
| 15 | dea-scheduling-poller | ☐ | ☐ |
| 16 | fda-hemp-guidance-poller | ☐ | ☐ |

### Webhook & Legislature Pollers
| # | Function Name | Status | Tested |
|---|---------------|--------|--------|
| 17 | webhook-handler | ☐ | ☐ |
| 18 | state-legislature-poller | ☐ | ☐ |

---

## Environment Variables Required

| Variable | Required For | Notes |
|----------|-------------|-------|
| `SUPABASE_URL` | All functions | Auto-set by Supabase |
| `SUPABASE_ANON_KEY` | All functions | Auto-set by Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | All functions | Auto-set by Supabase |
| `OPENAI_API_KEY` | AI functions | nlp-analyzer, ai-regulation-assistant, generate-* |
| `REGULATIONS_GOV_API_KEY` | regulations-gov-poller | Get from regulations.gov |
| `RESEND_API_KEY` | send-digest-emails | Email delivery |
| `LEGISCAN_API_KEY` | state-legislature-poller | 30,000 monthly queries |
| `OPENSTATES_API_KEY` | state-legislature-poller | 500 daily requests |
| `WEBHOOK_REQUIRE_SIGNATURE` | webhook-handler | Set to 'false' for dev |

---

## Polling Schedule Overview

| Poller | Schedule | Hours (UTC) | Notes |
|--------|----------|-------------|-------|
| Federal Register | Hourly | All | Core federal regulations |
| Regulations.gov | Hourly | All | Federal comment periods |
| State Regulations | Every 6 hours | 0, 6, 12, 18 | State cannabis agencies |
| Cannabis News RSS | Every 6 hours | 2, 8, 14, 20 | Industry news sources |
| DEA Scheduling | Every 12 hours | 3, 15 | DEA scheduling updates |
| FDA Hemp Guidance | Every 12 hours | 4, 16 | FDA hemp/CBD guidance |
| State Legislature | Every 6 hours | 1, 7, 13, 19 | LegiScan/OpenStates |
| Comment Reminders | Daily | 9 | User deadline reminders |

---

## Updated Orchestrator Configuration

Add all pollers to `scheduled-poller-cron`:

```typescript
const POLLERS: PollerConfig[] = [
  // Core pollers
  { name: 'Federal Register', functionName: 'federal-register-poller', schedule: 'hourly', enabled: true, timeout: 30000 },
  { name: 'Regulations.gov', functionName: 'regulations-gov-poller', schedule: 'hourly', enabled: true, timeout: 30000 },
  { name: 'State Regulations', functionName: 'state-regulations-poller', schedule: 'every_6_hours', hoursToRun: [0, 6, 12, 18], enabled: true, timeout: 60000 },
  
  // Additional data sources
  { name: 'Cannabis News RSS', functionName: 'cannabis-news-rss-poller', schedule: 'every_6_hours', hoursToRun: [2, 8, 14, 20], enabled: true, timeout: 45000 },
  { name: 'DEA Scheduling', functionName: 'dea-scheduling-poller', schedule: 'every_12_hours', hoursToRun: [3, 15], enabled: true, timeout: 30000 },
  { name: 'FDA Hemp Guidance', functionName: 'fda-hemp-guidance-poller', schedule: 'every_12_hours', hoursToRun: [4, 16], enabled: true, timeout: 30000 },
  
  // State legislature
  { name: 'State Legislature', functionName: 'state-legislature-poller', schedule: 'every_6_hours', hoursToRun: [1, 7, 13, 19], enabled: true, timeout: 120000 },
  
  // Notifications
  { name: 'Comment Deadline Reminders', functionName: 'process-comment-deadline-reminders', schedule: 'daily', hoursToRun: [9], enabled: true, timeout: 30000 }
];
```


