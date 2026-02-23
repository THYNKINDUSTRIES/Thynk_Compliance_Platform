/**
 * workflow-agent — AI-powered compliance workflow generator
 *
 * Accepts an instrument_id, reads the regulation, uses GPT‑4o‑mini to
 * analyze compliance requirements, then creates a workflow_instance with
 * actionable tasks in the database.
 *
 * Invoked from frontend: supabase.functions.invoke('workflow-agent', { body })
 */

// @ts-ignore - Deno import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { buildCors, corsHeaders as _defaultCors } from '../_shared/cors.ts';

export let corsHeaders = _defaultCors;

// @ts-ignore - Deno global
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// @ts-ignore - Deno global
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? '';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AITask {
  title: string;
  description: string;
  task_type: 'review' | 'approval' | 'implementation' | 'documentation';
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_days: number; // days from now
  order_index: number;
  depends_on_index?: number; // index of prerequisite task (optional)
}

interface AIAnalysis {
  workflow_name: string;
  workflow_description: string;
  compliance_summary: string;
  key_requirements: string[];
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  estimated_effort: string;
  tasks: AITask[];
}

// ─── AI Analysis ─────────────────────────────────────────────────────────────

async function analyzeRegulation(regulation: any): Promise<AIAnalysis> {
  const systemPrompt = `You are a regulatory compliance expert AI. When given a regulation, you produce a structured compliance workflow with actionable tasks.

Your analysis MUST return valid JSON matching this exact schema:
{
  "workflow_name": "Short descriptive name for the workflow",
  "workflow_description": "1-2 sentence overview of what this workflow achieves",
  "compliance_summary": "Detailed paragraph explaining the regulation's impact and what organizations need to do",
  "key_requirements": ["requirement 1", "requirement 2", ...],
  "risk_level": "low|medium|high|critical",
  "estimated_effort": "e.g. '2-4 weeks' or '1-2 months'",
  "tasks": [
    {
      "title": "Clear action-oriented task title",
      "description": "Detailed description of what needs to be done, including specific compliance steps",
      "task_type": "review|approval|implementation|documentation",
      "priority": "low|medium|high|critical",
      "due_days": 14,
      "order_index": 0,
      "depends_on_index": null
    }
  ]
}

Task types:
- "review": Reading, analyzing, or assessing the regulation
- "approval": Getting sign-off from stakeholders or regulators
- "implementation": Making operational changes to comply
- "documentation": Creating or updating compliance documentation

Guidelines:
- Generate 4-8 practical, actionable tasks
- Order tasks logically (review first, then implementation, then documentation)
- Set realistic due_days based on task complexity
- Use depends_on_index to chain dependent tasks (e.g. implementation depends on review)
- Be specific about what each task requires — avoid vague descriptions
- Consider industry-specific compliance needs for cannabis, hemp, kratom, kava, nicotine, and psychedelics
- Include tasks for: initial review, gap analysis, implementation changes, staff training, documentation, and compliance verification
- Return ONLY the JSON object, no markdown or extra text`;

  const regulationText = `
REGULATION TITLE: ${regulation.title || 'Unknown'}
JURISDICTION: ${regulation.jurisdiction_name || 'Unknown'}
AUTHORITY/SOURCE: ${regulation.source || 'Unknown'}
DOCUMENT TYPE: ${regulation.document_type || 'Rule'}
STATUS: ${regulation.status || 'Active'}
IMPACT: ${regulation.impact || 'medium'}
PUBLISHED: ${regulation.published_at || 'Unknown'}
EFFECTIVE DATE: ${regulation.effective_at || regulation.effective_date || 'Unknown'}
CATEGORY: ${regulation.category || 'General'}

DESCRIPTION/CONTENT:
${regulation.description || regulation.content || 'No description available.'}

METADATA:
${JSON.stringify(regulation.metadata || {}, null, 2)}
`.trim();

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze this regulation and generate a compliance workflow:\n\n${regulationText}` },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error('Empty response from OpenAI');
  }

  // Parse JSON — strip markdown fences if present
  const jsonStr = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

  try {
    const analysis: AIAnalysis = JSON.parse(jsonStr);

    // Validate required fields
    if (!analysis.workflow_name || !analysis.tasks || !Array.isArray(analysis.tasks)) {
      throw new Error('Invalid analysis structure');
    }

    // Ensure at least one task
    if (analysis.tasks.length === 0) {
      analysis.tasks = [{
        title: 'Review regulation requirements',
        description: `Review ${regulation.title} and identify all compliance obligations.`,
        task_type: 'review',
        priority: 'high',
        due_days: 7,
        order_index: 0,
      }];
    }

    return analysis;
  } catch (parseErr) {
    console.error('JSON parse error:', parseErr, 'Raw content:', content);
    throw new Error(`Failed to parse AI analysis: ${parseErr}`);
  }
}

// ─── Create Workflow ─────────────────────────────────────────────────────────

async function createWorkflow(
  instrumentId: string,
  userId: string,
  analysis: AIAnalysis
): Promise<{ workflowId: string; taskCount: number }> {

  // 1. Create workflow instance
  const { data: workflow, error: wfError } = await supabase
    .from('workflow_instances')
    .insert({
      instrument_id: instrumentId,
      name: analysis.workflow_name,
      description: analysis.workflow_description,
      status: 'active',
      ai_analysis: {
        compliance_summary: analysis.compliance_summary,
        key_requirements: analysis.key_requirements,
        risk_level: analysis.risk_level,
        estimated_effort: analysis.estimated_effort,
        generated_at: new Date().toISOString(),
      },
      started_at: new Date().toISOString(),
      created_by: userId,
    })
    .select('id')
    .single();

  if (wfError) {
    throw new Error(`Failed to create workflow: ${wfError.message}`);
  }

  const workflowId = workflow.id;

  // 2. Create tasks — first pass (without depends_on)
  const taskInserts = analysis.tasks.map((task) => ({
    workflow_instance_id: workflowId,
    title: task.title,
    description: task.description,
    task_type: task.task_type || 'review',
    status: 'pending',
    priority: task.priority || 'medium',
    due_date: task.due_days
      ? new Date(Date.now() + task.due_days * 86400000).toISOString()
      : null,
    order_index: task.order_index ?? 0,
    entity_id: instrumentId,
  }));

  const { data: createdTasks, error: taskError } = await supabase
    .from('workflow_tasks')
    .insert(taskInserts)
    .select('id, order_index');

  if (taskError) {
    throw new Error(`Failed to create tasks: ${taskError.message}`);
  }

  // 3. Second pass: set depends_on references
  if (createdTasks && createdTasks.length > 0) {
    const taskMap = new Map<number, string>();
    for (const t of createdTasks) {
      taskMap.set(t.order_index, t.id);
    }

    for (let i = 0; i < analysis.tasks.length; i++) {
      const depIdx = analysis.tasks[i].depends_on_index;
      if (depIdx !== null && depIdx !== undefined && taskMap.has(depIdx)) {
        const taskId = taskMap.get(analysis.tasks[i].order_index);
        const depId = taskMap.get(depIdx);
        if (taskId && depId) {
          await supabase
            .from('workflow_tasks')
            .update({ depends_on: depId })
            .eq('id', taskId);
        }
      }
    }
  }

  return { workflowId, taskCount: createdTasks?.length || 0 };
}

// ─── Main Handler ────────────────────────────────────────────────────────────

// @ts-ignore - Deno global
Deno.serve(async (req: Request) => {
  corsHeaders = buildCors(req);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { instrumentId, instrument_id, userId, user_id } = body;
    const regId = instrumentId || instrument_id;
    const uid = userId || user_id;

    if (!regId) {
      return new Response(
        JSON.stringify({ error: 'instrumentId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!uid) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for existing active workflow for this instrument + user
    const { data: existing } = await supabase
      .from('workflow_instances')
      .select('id, name, status')
      .eq('instrument_id', regId)
      .eq('created_by', uid)
      .eq('status', 'active')
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(
        JSON.stringify({
          success: true,
          existing: true,
          workflowId: existing[0].id,
          message: `You already have an active workflow for this regulation: "${existing[0].name}"`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the regulation
    const { data: regData, error: regError } = await supabase
      .from('instrument')
      .select(`
        id, title, description, content, status, source, metadata,
        document_type, published_at, effective_date, effective_at,
        external_id, url, impact, category, sub_category,
        jurisdiction:jurisdiction_id(name)
      `)
      .eq('id', regId)
      .single();

    if (regError || !regData) {
      return new Response(
        JSON.stringify({ error: `Regulation not found: ${regError?.message || 'unknown'}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Flatten jurisdiction name for the AI prompt
    const regulation = {
      ...regData,
      jurisdiction_name: (regData as any).jurisdiction?.name || 'Unknown',
    };

    // Generate AI analysis
    console.log(`[workflow-agent] Analyzing regulation: ${regulation.title}`);
    const analysis = await analyzeRegulation(regulation);

    // Create workflow + tasks
    console.log(`[workflow-agent] Creating workflow with ${analysis.tasks.length} tasks`);
    const { workflowId, taskCount } = await createWorkflow(regId, uid, analysis);

    console.log(`[workflow-agent] Workflow created: ${workflowId} (${taskCount} tasks)`);

    return new Response(
      JSON.stringify({
        success: true,
        workflowId,
        taskCount,
        analysis: {
          name: analysis.workflow_name,
          description: analysis.workflow_description,
          compliance_summary: analysis.compliance_summary,
          key_requirements: analysis.key_requirements,
          risk_level: analysis.risk_level,
          estimated_effort: analysis.estimated_effort,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[workflow-agent] Error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
