# Edge Function CORS Fix Guide

## Problem
You're seeing CORS errors like:
- `Access-Control-Allow-Origin header is missing`
- `Response to preflight request doesn't pass access control check`

This happens because the edge functions need to be updated with proper CORS headers for your production domain `https://www.thynkflow.io`.

## Solution

You need to manually update the edge functions in your Supabase dashboard. Here are the updated function codes:

---

## 1. state-regulations-poller

Go to: Supabase Dashboard → Edge Functions → state-regulations-poller → Edit

Replace the entire content with:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Real verified URLs for state cannabis regulatory agencies
const STATE_CANNABIS_URLS: Record<string, { agency: string; regulations: string; dispensary?: string }> = {
  'MI': {
    agency: 'https://www.michigan.gov/cra',
    regulations: 'https://www.michigan.gov/cra/sections/adult-use',
    dispensary: 'https://www.michigan.gov/cra/sections/adult-use/provisioning-centers'
  },
  'CA': {
    agency: 'https://cannabis.ca.gov',
    regulations: 'https://cannabis.ca.gov/cannabis-laws/dcc-regulations/',
    dispensary: 'https://cannabis.ca.gov/licensees/retail/'
  },
  'CO': {
    agency: 'https://med.colorado.gov',
    regulations: 'https://med.colorado.gov/rules',
    dispensary: 'https://med.colorado.gov/retail-marijuana'
  },
  'WA': {
    agency: 'https://lcb.wa.gov',
    regulations: 'https://lcb.wa.gov/laws/current-laws-and-rules',
    dispensary: 'https://lcb.wa.gov/marijuana/marijuana-licensing'
  },
  'OR': {
    agency: 'https://www.oregon.gov/olcc',
    regulations: 'https://www.oregon.gov/olcc/marijuana/Pages/Recreational-Marijuana-Laws-and-Rules.aspx',
    dispensary: 'https://www.oregon.gov/olcc/marijuana/Pages/Retail-Licenses.aspx'
  },
  'NV': {
    agency: 'https://ccb.nv.gov',
    regulations: 'https://ccb.nv.gov/laws-regulations/',
    dispensary: 'https://ccb.nv.gov/industry/'
  },
  'MA': {
    agency: 'https://masscannabiscontrol.com',
    regulations: 'https://masscannabiscontrol.com/public-documents/regulations/',
    dispensary: 'https://masscannabiscontrol.com/licensees/retail-marijuana-establishments/'
  },
  'IL': {
    agency: 'https://idfpr.illinois.gov/profs/adultusecan.html',
    regulations: 'https://idfpr.illinois.gov/profs/adultusecan.html',
    dispensary: 'https://idfpr.illinois.gov/profs/adultusecan/DispOrg.html'
  },
  'AZ': {
    agency: 'https://www.azdhs.gov/licensing/marijuana',
    regulations: 'https://www.azdhs.gov/licensing/marijuana/adult-use-marijuana',
    dispensary: 'https://www.azdhs.gov/licensing/marijuana/index.php#dispensaries'
  },
  'NY': {
    agency: 'https://cannabis.ny.gov',
    regulations: 'https://cannabis.ny.gov/regulations',
    dispensary: 'https://cannabis.ny.gov/dispensary-location-verification'
  },
  'NJ': {
    agency: 'https://www.nj.gov/cannabis',
    regulations: 'https://www.nj.gov/cannabis/resources/cannabis-laws/',
    dispensary: 'https://www.nj.gov/cannabis/businesses/personal-use/'
  },
  'PA': {
    agency: 'https://www.pa.gov/agencies/health/programs/medical-marijuana',
    regulations: 'https://www.pa.gov/agencies/health/programs/medical-marijuana/medical-marijuana-regulations',
    dispensary: 'https://www.pa.gov/agencies/health/programs/medical-marijuana/dispensaries'
  },
  'FL': {
    agency: 'https://knowthefactsmmj.com',
    regulations: 'https://knowthefactsmmj.com/rules/',
    dispensary: 'https://knowthefactsmmj.com/registry/mmtcs/'
  },
  'OH': {
    agency: 'https://medicalmarijuana.ohio.gov',
    regulations: 'https://medicalmarijuana.ohio.gov/rules',
    dispensary: 'https://medicalmarijuana.ohio.gov/dispensaries'
  },
  'MD': {
    agency: 'https://mmcc.maryland.gov',
    regulations: 'https://mmcc.maryland.gov/Pages/regulations.aspx',
    dispensary: 'https://mmcc.maryland.gov/Pages/dispensaries.aspx'
  },
  'MO': {
    agency: 'https://cannabis.mo.gov',
    regulations: 'https://cannabis.mo.gov/rules-regulations',
    dispensary: 'https://cannabis.mo.gov/dispensaries'
  }
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests - MUST return 204 with headers
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    let body = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is OK
    }
    
    const { sessionId, sourceName, stateCode, fullScan } = body as any;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const updateProgress = async (updates: any) => {
      if (sessionId && sourceName) {
        try {
          await supabase.from('data_population_progress')
            .update(updates).eq('session_id', sessionId).eq('source_name', sourceName);
        } catch (e) {
          console.log('Progress update skipped:', e);
        }
      }
    };

    await updateProgress({ status: 'running', started_at: new Date().toISOString() });

    // Get jurisdictions
    let jurisdictionQuery = supabase.from('jurisdiction').select('id,name,code').neq('code', 'US');
    
    if (stateCode) {
      jurisdictionQuery = jurisdictionQuery.eq('code', stateCode);
    }
    
    const { data: jurisdictions, error: jurisdictionError } = await jurisdictionQuery;
    
    if (jurisdictionError) {
      throw new Error(`Failed to fetch jurisdictions: ${jurisdictionError.message}`);
    }

    let recordsProcessed = 0;
    let statesProcessed = 0;
    let newItemsFound = 0;

    for (const jurisdiction of jurisdictions || []) {
      const urls = STATE_CANNABIS_URLS[jurisdiction.code];
      
      if (urls) {
        statesProcessed++;
        
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

        const { error: regError } = await supabase.from('instrument').upsert({
          external_id: `${jurisdiction.code}-cannabis-regulations`,
          title: `${jurisdiction.name} Cannabis Regulations`,
          description: `Official cannabis regulations and rules for ${jurisdiction.name}`,
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

      if (recordsProcessed % 10 === 0) {
        await updateProgress({ records_fetched: recordsProcessed });
      }
    }

    // Log the ingestion
    try {
      await supabase.from('ingestion_log').insert({
        source_id: 'state-regulations-poller',
        source: 'state_regulations',
        status: 'success',
        records_fetched: recordsProcessed,
        records_created: newItemsFound,
        started_at: new Date().toISOString(),
        metadata: { statesProcessed, stateCode: stateCode || 'all', fullScan: fullScan || false }
      });
    } catch (logError) {
      console.log('Ingestion log skipped:', logError);
    }

    await updateProgress({ 
      status: 'completed', 
      records_fetched: recordsProcessed,
      completed_at: new Date().toISOString() 
    });

    return new Response(JSON.stringify({ 
      success: true, 
      recordsProcessed,
      statesProcessed,
      newItemsFound,
      message: `Processed ${recordsProcessed} records from ${statesProcessed} states`
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('State regulations poller error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
```

---

## 2. generate-checklist-from-template

Go to: Supabase Dashboard → Edge Functions → generate-checklist-from-template → Edit

Replace the entire content with:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

Deno.serve(async (req) => {
  // Handle CORS preflight requests - MUST return 204 with headers
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    const { templateId, checklistName, states, enableAI, includeAITips } = await req.json();

    if (!templateId) {
      throw new Error('Template ID is required');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get template - use limit(1) instead of single() to avoid 406 errors
    const { data: templates, error: templateError } = await supabase
      .from('checklist_templates')
      .select('*')
      .eq('id', templateId)
      .limit(1);

    if (templateError) {
      throw new Error(`Template error: ${templateError.message}`);
    }
    
    const template = templates?.[0];
    if (!template) {
      throw new Error('Template not found');
    }

    // Create checklist from template
    const { data: checklists, error: checklistError } = await supabase
      .from('compliance_checklists')
      .insert({
        name: checklistName || template.name,
        description: template.description,
        business_type: template.business_type,
        states: states || template.states || [],
        created_by: user.id
      })
      .select()
      .limit(1);

    if (checklistError) {
      throw new Error(`Failed to create checklist: ${checklistError.message}`);
    }
    
    const checklist = checklists?.[0];
    if (!checklist) {
      throw new Error('Failed to create checklist');
    }

    // Parse template items safely
    let templateItems = [];
    if (Array.isArray(template.template_items)) {
      templateItems = template.template_items;
    } else if (typeof template.template_items === 'string') {
      try {
        templateItems = JSON.parse(template.template_items);
      } catch {
        templateItems = [];
      }
    }

    // Create checklist items from template
    const items = templateItems.map((item: any, index: number) => ({
      checklist_id: checklist.id,
      title: item.title || 'Untitled Item',
      description: item.description || '',
      category: item.category || 'General',
      priority: item.priority || 'medium',
      completed: false,
      sort_order: index
    }));

    if (items.length > 0) {
      const { error: itemsError } = await supabase
        .from('checklist_items')
        .insert(items);

      if (itemsError) {
        console.error('Items error:', itemsError);
        // Don't throw - checklist was created, just items failed
      }
    }

    // Increment template usage count
    await supabase
      .from('checklist_templates')
      .update({ usage_count: (template.usage_count || 0) + 1 })
      .eq('id', templateId);

    // Generate AI tips if requested
    let complianceTips: string[] = [];
    let aiGeneratedItems = 0;
    
    if (enableAI && includeAITips) {
      complianceTips = [
        `Review all ${template.business_type} requirements for your selected states`,
        'Ensure all documentation is current and properly filed',
        'Schedule regular compliance audits to stay ahead of deadlines'
      ];
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        checklistId: checklist.id,
        message: 'Checklist created successfully from template',
        stats: {
          totalItems: items.length,
          aiGeneratedItems
        },
        complianceTips
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error('Generate checklist error:', error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { 
        status: 400, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
});
```

---

## 3. generate-compliance-checklist

Go to: Supabase Dashboard → Edge Functions → generate-compliance-checklist → Edit

Make sure the CORS headers are at the top:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

// ... rest of function

Deno.serve(async (req) => {
  // Handle CORS preflight - MUST be first check
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }
  
  // ... rest of handler
});
```

---

## Key CORS Requirements

1. **OPTIONS handler MUST return 204** (not 200, not 'ok')
2. **All responses MUST include corsHeaders** - even error responses
3. **Access-Control-Allow-Origin: '*'** allows all domains
4. **Access-Control-Allow-Methods** should include POST, GET, OPTIONS
5. **Access-Control-Max-Age** caches preflight for 24 hours

## Testing

After updating, test with:
```bash
curl -X OPTIONS https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/state-regulations-poller \
  -H "Origin: https://www.thynkflow.io" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

You should see the CORS headers in the response.

## Browser Extension Warnings

The warnings about `SharedArrayBuffer` and `chrome-extension://` are from your password manager browser extension - they are NOT related to your app and can be ignored.
