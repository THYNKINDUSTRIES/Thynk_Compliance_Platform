/**
 * Regulatory Forecast Engine
 *
 * AI-powered predictive analysis of regulatory trends across cannabis, hemp,
 * kratom, kava, nicotine, and psychedelics for all 50 US states + federal.
 *
 * Actions:
 *   - generate: Analyzes all instrument data and generates new predictions
 *   - setup: Creates the regulatory_forecasts table if it doesn't exist
 *   - get: Returns cached forecasts (no AI call)
 *   - scenario: Runs a user-defined "what-if" scenario
 *
 * Uses OpenAI GPT-4o-mini to analyze regulatory patterns and predict future changes.
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://www.thynkflow.io',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const PRODUCTS = ['cannabis', 'hemp', 'kratom', 'kava', 'nicotine', 'psychedelics'] as const;

// @ts-ignore Deno global
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
  // @ts-ignore
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  // @ts-ignore
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  // @ts-ignore — strip non-ASCII chars that can cause ByteString errors in fetch headers
  const rawOpenaiKey = Deno.env.get('OPENAI_API_KEY') || '';
  const openaiKey = rawOpenaiKey.replace(/[^\x20-\x7E]/g, '').trim();

  const supabase = createClient(supabaseUrl, supabaseKey);

  let body: any = {};
  try { body = await req.json(); } catch { /* empty body OK */ }
  const action = body.action || 'get';

  // ── ACTION: check_admins — verify admin accounts & API status (debug helper)
  if (action === 'check_admins') {
    // Test OpenAI connectivity
    let openaiStatus = 'not tested';
    if (openaiKey) {
      try {
        const testResp = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${openaiKey}` },
        });
        openaiStatus = testResp.ok ? 'connected' : `error: ${testResp.status}`;
      } catch (e: any) {
        openaiStatus = `exception: ${e.message}`;
      }
    } else {
      openaiStatus = 'no key set';
    }

    const { data } = await supabase
      .from('user_profiles')
      .select('id, email, role, subscription_status, trial_ends_at, subscription_ends_at')
      .eq('role', 'admin');
    return new Response(JSON.stringify({ 
      admins: data || [],
      openai_key_set: !!openaiKey,
      openai_status: openaiStatus,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ── ACTION: setup — create tables if they don't exist ────────────────────
  if (action === 'setup') {
    try {
      // First check if tables already exist
      const { error: testErr } = await supabase
        .from('regulatory_forecasts')
        .select('id')
        .limit(1);

      if (!testErr || testErr.code !== 'PGRST205') {
        return new Response(JSON.stringify({ success: true, message: 'Tables already exist' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Tables don't exist — create them using pg_net or direct SQL
      // Use the Supabase Management API to run SQL
      // @ts-ignore
      const sbAccessToken = Deno.env.get('SUPABASE_ACCESS_TOKEN') || '';
      const projectRef = supabaseUrl.replace('https://', '').split('.')[0];

      const migrationSQL = `
        CREATE TABLE IF NOT EXISTS regulatory_forecasts (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          jurisdiction_id UUID REFERENCES jurisdiction(id),
          product TEXT NOT NULL,
          prediction_type TEXT NOT NULL DEFAULT 'regulatory_change',
          direction TEXT NOT NULL DEFAULT 'restrictive',
          confidence NUMERIC(5,2) NOT NULL DEFAULT 50.0,
          predicted_quarter TEXT,
          predicted_date DATE,
          title TEXT NOT NULL,
          summary TEXT NOT NULL,
          rationale TEXT,
          risk_level TEXT DEFAULT 'medium',
          recommended_actions JSONB DEFAULT '[]'::jsonb,
          supporting_signals JSONB DEFAULT '[]'::jsonb,
          model_version TEXT DEFAULT 'gpt-4o-mini-v1',
          data_points_analyzed INTEGER DEFAULT 0,
          expires_at TIMESTAMPTZ,
          status TEXT DEFAULT 'active',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_forecasts_product ON regulatory_forecasts(product);
        CREATE INDEX IF NOT EXISTS idx_forecasts_jurisdiction ON regulatory_forecasts(jurisdiction_id);
        CREATE INDEX IF NOT EXISTS idx_forecasts_confidence ON regulatory_forecasts(confidence DESC);
        CREATE INDEX IF NOT EXISTS idx_forecasts_status ON regulatory_forecasts(status);
        CREATE INDEX IF NOT EXISTS idx_forecasts_risk ON regulatory_forecasts(risk_level);
        CREATE INDEX IF NOT EXISTS idx_forecasts_created ON regulatory_forecasts(created_at DESC);
        ALTER TABLE regulatory_forecasts ENABLE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'regulatory_forecasts' AND policyname = 'Anyone can read forecasts') THEN
            CREATE POLICY "Anyone can read forecasts" ON regulatory_forecasts FOR SELECT USING (true);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'regulatory_forecasts' AND policyname = 'Service role can manage forecasts') THEN
            CREATE POLICY "Service role can manage forecasts" ON regulatory_forecasts FOR ALL USING (auth.role() = 'service_role');
          END IF;
        END $$;

        CREATE TABLE IF NOT EXISTS forecast_scenarios (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
          result JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        ALTER TABLE forecast_scenarios ENABLE ROW LEVEL SECURITY;
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'forecast_scenarios' AND policyname = 'Users can manage own scenarios') THEN
            CREATE POLICY "Users can manage own scenarios" ON forecast_scenarios FOR ALL USING (auth.uid() = user_id);
          END IF;
        END $$;
      `;

      // Try Management API
      if (sbAccessToken) {
        const mgmtResp = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sbAccessToken}`,
          },
          body: JSON.stringify({ query: migrationSQL }),
        });

        if (mgmtResp.ok) {
          return new Response(JSON.stringify({ success: true, message: 'Tables created successfully' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // Fallback: return SQL for manual execution
      return new Response(JSON.stringify({
        success: false,
        error: 'Could not auto-create tables. Please run the migration SQL in the Supabase SQL Editor.',
        sql: migrationSQL,
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (err: any) {
      return new Response(JSON.stringify({ success: false, error: err.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // ── ACTION: get — return cached forecasts ────────────────────────────────
  if (action === 'get') {
    const product = body.product || null;
    const jurisdictionId = body.jurisdiction_id || null;
    const riskLevel = body.risk_level || null;

    let query = supabase
      .from('regulatory_forecasts')
      .select('*, jurisdiction:jurisdiction_id(name, slug)')
      .eq('status', 'active')
      .order('confidence', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100);

    if (product) query = query.eq('product', product);
    if (jurisdictionId) query = query.eq('jurisdiction_id', jurisdictionId);
    if (riskLevel) query = query.eq('risk_level', riskLevel);

    const { data, error } = await query;

    if (error) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      forecasts: data || [],
      count: data?.length || 0,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // ── ACTION: scenario — run a what-if scenario ───────────────────────────
  if (action === 'scenario') {
    if (!openaiKey) {
      return new Response(JSON.stringify({ success: false, error: 'No OPENAI_API_KEY' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { product, jurisdiction, assumption, timeframe } = body;
    if (!product || !assumption) {
      return new Response(JSON.stringify({ success: false, error: 'product and assumption required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Gather recent data for context
    let contextQuery = supabase
      .from('instrument')
      .select('title, source, effective_date, metadata')
      .order('created_at', { ascending: false })
      .limit(30);

    if (jurisdiction) contextQuery = contextQuery.eq('jurisdiction_id', jurisdiction);

    const { data: recentRegs } = await contextQuery;
    const regContext = (recentRegs || [])
      .map(r => `- ${r.title} (${r.source}, ${r.effective_date || 'unknown date'})`)
      .join('\n');

    const prompt = `You are a regulatory intelligence analyst specializing in US cannabis, hemp, kratom, kava, nicotine, and psychedelics regulation.

SCENARIO ANALYSIS REQUEST:
Product: ${product}
${jurisdiction ? `Jurisdiction: ${jurisdiction}` : 'Jurisdiction: All US'}
Assumption: "${assumption}"
Timeframe: ${timeframe || 'Next 12 months'}

RECENT REGULATORY ACTIVITY:
${regContext || 'No recent data available.'}

Analyze this what-if scenario and provide:
1. Likelihood assessment (0-100%)
2. Expected timeline
3. Cascading effects on other states/products
4. Recommended actions for compliance teams
5. Key risk factors

Respond in JSON:
{
  "likelihood": <number 0-100>,
  "timeline": "<predicted timeframe>",
  "analysis": "<detailed 2-3 paragraph analysis>",
  "cascading_effects": ["<effect 1>", "<effect 2>", ...],
  "recommended_actions": ["<action 1>", "<action 2>", ...],
  "risk_factors": ["<factor 1>", "<factor 2>", ...],
  "confidence_reasoning": "<why this confidence level>"
}`;

    const aiResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!aiResp.ok) {
      const errBody = await aiResp.text().catch(() => '');
      console.error(`OpenAI scenario error: ${aiResp.status} - ${errBody}`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: aiResp.status === 401 
          ? 'OpenAI API key is invalid or expired. Please update the OPENAI_API_KEY secret.' 
          : `OpenAI error: ${aiResp.status}` 
      }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResp.json();
    const scenarioResult = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ success: true, scenario: scenarioResult }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ── ACTION: generate — analyze all data and create predictions ──────────
  if (action === 'generate') {
    if (!openaiKey) {
      return new Response(JSON.stringify({ success: false, error: 'No OPENAI_API_KEY' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🔮 Starting regulatory forecast generation...');

    // 1. Gather jurisdictions
    const { data: jurisdictions } = await supabase
      .from('jurisdiction')
      .select('id, name, slug');
    const jurisdictionMap = new Map((jurisdictions || []).map(j => [j.id, j]));

    // 2. Gather all instrument data grouped by product and jurisdiction
    const { data: allInstruments, error: instrErr } = await supabase
      .from('instrument')
      .select('title, description, source, effective_date, created_at, jurisdiction_id, metadata, status')
      .order('created_at', { ascending: false })
      .limit(2000);

    if (instrErr) {
      return new Response(JSON.stringify({ success: false, error: instrErr.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const instruments = allInstruments || [];
    const totalDataPoints = instruments.length;

    // 3. Build per-product and per-jurisdiction summaries
    const productJurisdictionData: Record<string, Record<string, any[]>> = {};
    for (const product of PRODUCTS) {
      productJurisdictionData[product] = {};
    }

    for (const inst of instruments) {
      const products = inst.metadata?.products || [];
      const title = (inst.title || '').toLowerCase();

      // Infer products from title if metadata doesn't have them
      const detectedProducts = new Set<string>(products);
      if (title.includes('cannabis') || title.includes('marijuana')) detectedProducts.add('cannabis');
      if (title.includes('hemp') || title.includes('cbd')) detectedProducts.add('hemp');
      if (title.includes('kratom')) detectedProducts.add('kratom');
      if (title.includes('kava')) detectedProducts.add('kava');
      if (title.includes('nicotine') || title.includes('tobacco') || title.includes('vaping')) detectedProducts.add('nicotine');
      if (title.includes('psilocybin') || title.includes('psychedelic')) detectedProducts.add('psychedelics');

      const jId = inst.jurisdiction_id || 'unknown';
      for (const prod of detectedProducts) {
        if (!productJurisdictionData[prod]) continue;
        if (!productJurisdictionData[prod][jId]) productJurisdictionData[prod][jId] = [];
        productJurisdictionData[prod][jId].push({
          title: inst.title,
          source: inst.source,
          date: inst.effective_date || inst.created_at,
          type: inst.metadata?.document_type,
          direction: inst.metadata?.direction,
        });
      }
    }

    // 4. Build analysis batches — analyze top product-jurisdiction combos
    const analysisEntries: Array<{ product: string; jurisdictionId: string; jurisdictionName: string; regs: any[] }> = [];

    for (const product of PRODUCTS) {
      const jData = productJurisdictionData[product];
      // Sort jurisdictions by number of regulations (most active first)
      const sortedJurisdictions = Object.entries(jData)
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 15); // Top 15 jurisdictions per product

      for (const [jId, regs] of sortedJurisdictions) {
        if (regs.length < 1) continue;
        const jInfo = jurisdictionMap.get(jId);
        analysisEntries.push({
          product,
          jurisdictionId: jId,
          jurisdictionName: jInfo?.name || 'Unknown',
          regs,
        });
      }
    }

    // 5. Batch the analysis entries into groups for AI processing
    const BATCH_SIZE = 8;
    const allForecasts: any[] = [];

    for (let i = 0; i < analysisEntries.length; i += BATCH_SIZE) {
      const batch = analysisEntries.slice(i, i + BATCH_SIZE);

      const batchSummary = batch.map(entry => {
        const recentRegs = entry.regs.slice(0, 10).map(r =>
          `  - "${r.title}" (${r.source}, ${r.date || 'no date'}, type: ${r.type || 'unknown'})`
        ).join('\n');

        return `PRODUCT: ${entry.product} | JURISDICTION: ${entry.jurisdictionName} (${entry.regs.length} regulations)
Recent activity:
${recentRegs}`;
      }).join('\n\n---\n\n');

      const systemPrompt = `You are an expert US regulatory intelligence analyst specializing in cannabis, hemp, kratom, kava, nicotine, and psychedelics regulation. You analyze patterns in regulatory data to predict future regulatory changes with confidence scores.

Current date: ${new Date().toISOString().slice(0, 10)}

Given the regulatory activity data below, generate predictions for each product-jurisdiction combination. Consider:
- Volume and velocity of new regulations
- Direction (restrictive vs permissive trend)  
- Pending legislation and proposed rules
- Historical patterns (states that follow each other)
- Federal signals and scheduling changes
- Industry growth and lobbying trends
- Public health and safety signals

For each entry, provide 1-2 predictions.`;

      const userPrompt = `Analyze these regulatory data points and generate predictions:

${batchSummary}

Respond with a JSON array of predictions:
[
  {
    "product": "<product name>",
    "jurisdiction": "<jurisdiction name>",
    "prediction_type": "<regulatory_change|ban_risk|legalization|enforcement|rescheduling>",
    "direction": "<restrictive|permissive|neutral|deregulation>",
    "confidence": <number 0-100>,
    "predicted_quarter": "<e.g. Q3 2026>",
    "title": "<short prediction title>",
    "summary": "<2-3 sentence prediction summary>",
    "rationale": "<1-2 paragraph analysis of why>",
    "risk_level": "<low|medium|high|critical>",
    "recommended_actions": ["<action 1>", "<action 2>", "<action 3>"],
    "supporting_signals": ["<signal 1>", "<signal 2>"]
  }
]`;

      try {
        const aiResp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.3,
            max_tokens: 4000,
            response_format: { type: 'json_object' },
          }),
        });

        if (!aiResp.ok) {
          console.error(`OpenAI error: ${aiResp.status}`);
          continue;
        }

        const aiData = await aiResp.json();
        const content = aiData.choices?.[0]?.message?.content;
        if (!content) continue;

        let predictions: any[];
        try {
          const parsed = JSON.parse(content);
          predictions = Array.isArray(parsed) ? parsed : parsed.predictions || parsed.forecasts || [parsed];
        } catch {
          console.error('Failed to parse AI response');
          continue;
        }

        for (const pred of predictions) {
          // Match jurisdiction
          const matchedEntry = batch.find(e =>
            e.product === pred.product &&
            e.jurisdictionName.toLowerCase().includes((pred.jurisdiction || '').toLowerCase())
          ) || batch.find(e => e.product === pred.product);

          allForecasts.push({
            jurisdiction_id: matchedEntry?.jurisdictionId || null,
            product: pred.product || 'unknown',
            prediction_type: pred.prediction_type || 'regulatory_change',
            direction: pred.direction || 'neutral',
            confidence: Math.min(100, Math.max(0, Number(pred.confidence) || 50)),
            predicted_quarter: pred.predicted_quarter || null,
            title: (pred.title || 'Regulatory change predicted').slice(0, 500),
            summary: (pred.summary || '').slice(0, 2000),
            rationale: (pred.rationale || '').slice(0, 5000),
            risk_level: pred.risk_level || 'medium',
            recommended_actions: pred.recommended_actions || [],
            supporting_signals: pred.supporting_signals || [],
            model_version: 'gpt-4o-mini-v1',
            data_points_analyzed: totalDataPoints,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
            status: 'active',
          });
        }
      } catch (err: any) {
        console.error(`Batch ${i} error:`, err.message);
      }

      // Rate limit: 1s between batches
      await new Promise(r => setTimeout(r, 1000));
    }

    // 6. Mark old forecasts as expired
    await supabase
      .from('regulatory_forecasts')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .eq('status', 'active');

    // 7. Insert new forecasts
    let insertedCount = 0;
    for (let i = 0; i < allForecasts.length; i += 50) {
      const chunk = allForecasts.slice(i, i + 50);
      const { error: insertErr } = await supabase
        .from('regulatory_forecasts')
        .insert(chunk);

      if (insertErr) {
        console.error('Insert error:', insertErr.message);
      } else {
        insertedCount += chunk.length;
      }
    }

    const summary = {
      success: true,
      totalDataPointsAnalyzed: totalDataPoints,
      productJurisdictionCombos: analysisEntries.length,
      forecastsGenerated: allForecasts.length,
      forecastsInserted: insertedCount,
      products: PRODUCTS,
      generatedAt: new Date().toISOString(),
    };

    console.log('✅ Forecast generation complete:', JSON.stringify(summary));

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'Unknown action. Use: get, generate, scenario, setup' }), {
    status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

  } catch (err: any) {
    console.error('❌ Unhandled error in regulatory-forecast:', err);
    return new Response(JSON.stringify({ success: false, error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
