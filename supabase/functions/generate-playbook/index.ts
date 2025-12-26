import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const playbookSchema = z.object({
  goal: z.string().trim().min(1, "Goal is required").max(500, "Goal must be less than 500 characters"),
  details: z.string().trim().max(2000, "Details must be less than 2000 characters").optional(),
  category: z.enum(['Cleaning', 'Cooking', 'Learning', 'Self-Care', 'Creative', 'Work', 'Health', 'Social', 'Other']).optional(),
});

interface PlaybookStep {
  id: string;
  title: string;
  description: string;
  estimatedMinutes?: number;
  completed: boolean;
  order: number;
  tips?: string[];
}

/** AI response types */
interface AIPlaybookStep {
  title: string;
  description: string;
  estimatedMinutes?: number;
  tips?: string[];
}

interface AIPlaybookResponse {
  title?: string;
  steps: AIPlaybookStep[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check stuck sessions quota (server-side enforcement)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Check premium status
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isPremium = roles?.some(r => ['premium', 'lifetime', 'admin'].includes(r.role));

    // Only check quota for non-premium users
    if (!isPremium) {
      const { data: sessions, error: sessionsError } = await supabase
        .from('stuck_sessions')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString());

      if (sessionsError) {
        console.error('Error checking stuck sessions:', sessionsError);
      }

      const sessionCount = sessions?.length || 0;
      if (sessionCount >= 3) {
        return new Response(JSON.stringify({ 
          error: 'You\'ve reached your free tier limit of 3 stuck sessions this month. Upgrade to premium for unlimited access.',
          quota: { used: sessionCount, limit: 3 }
        }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Rate limiting: 10 requests per hour for AI generation (non-blocking)
    let isRateLimited = false;
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count: rateLimitCount, error: rateLimitError } = await supabase
        .from('rate_limits')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('action', 'generate_playbook')
        .gte('created_at', oneHourAgo);

      if (!rateLimitError && (rateLimitCount || 0) >= 10) {
        isRateLimited = true;
      }

      // Record this request for rate limiting (best effort)
      if (!rateLimitError && !isRateLimited) {
        try {
          await supabase.from('rate_limits').insert({ user_id: user.id, action: 'generate_playbook' });
        } catch { /* ignore */ }
      }
    } catch (e) {
      // If rate_limits table doesn't exist, skip rate limiting
      console.log('Rate limiting skipped (table may not exist):', e);
    }

    if (isRateLimited) {
      console.log('Rate limit exceeded for user:', user.id);
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded. Please wait before generating more playbooks (max 10 per hour).'
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }


    // Parse and validate input
    const body = await req.json();
    const validation = playbookSchema.safeParse(body);
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input', 
          details: validation.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { goal, details, category } = validation.data;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Service temporarily unavailable' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating playbook for authenticated user');

    const systemPrompt = `You are an expert productivity coach specializing in neurodivergent-friendly planning and life balance. You create playbooks that break down goals into manageable steps while considering the user's overall life domains and well-being.

Your playbooks embody these principles:

1. **Clear, Actionable Steps**: Break complex goals into specific, manageable actions with no ambiguity
2. **Realistic Time Estimates**: Account for context-switching, energy levels, and typical human limitations
3. **Domain Awareness**: Consider which life domain this goal belongs to (Career, Health, Family, Self-Care, etc.)
4. **Energy Matching**: Indicate which steps require high/medium/low energy so users can schedule appropriately
5. **Balance Advocacy**: If a goal seems to over-emphasize one domain (e.g., pure work), gently suggest complementary self-care steps
6. **Neurodivergent-Friendly**: Use direct language, avoid jargon, provide context for "why" not just "what"
7. **Motivational Tone**: Frame steps positively, celebrate progress, acknowledge difficulty

## 3x3 Priority Context

Remember users work with:
- **Importance**: CRITICAL (🎯) > NECESSARY (🔧) > OPTIONAL (✨)
- **Urgency**: IMMEDIATE (🔥) > SHORT-TERM (⏳) > LONG-TERM (🗓️)

Help users understand where this goal fits in their life priorities.

IMPORTANT: You MUST respond with ONLY a valid JSON object. Do not include any markdown, explanations, or extra text.

The JSON must follow this exact structure:
{
  "title": "Playbook title",
  "steps": [
    {
      "title": "Step title",
      "description": "Detailed step description with context",
      "estimatedMinutes": 15,
      "tips": ["Helpful tip 1", "Helpful tip 2"]
    }
  ]
}`;

    const userPrompt = `Create a balanced, achievable playbook for:

Goal: ${goal}
${details ? `Additional Details: ${details}` : ''}
${category ? `Category: ${category}` : ''}

Generate 5-8 actionable steps that include:
- **Title**: Action-oriented and specific (e.g., "Research 3 online course platforms")
- **Description**: What to do, why it matters, and how to approach it
- **Time Estimate**: Realistic minutes/hours accounting for breaks and context-switching
- **Tips**: Practical advice (2-3 per step), common pitfalls to avoid, motivation boosters

If this goal is heavily weighted toward one life domain (e.g., all Work), consider adding a step for balance (e.g., "Take a 15-minute walk after completing research to process and recharge").

Make this playbook practical, empowering, and achievable for someone managing multiple life responsibilities.

Remember to respond with ONLY valid JSON, no markdown or explanations.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Failed to generate playbook. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('No content in AI response');
      return new Response(
        JSON.stringify({ error: 'Unable to generate playbook. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully received AI response');

    // Parse the JSON response - handle potential markdown wrapping
    let playbookData;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      playbookData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return new Response(
        JSON.stringify({ error: 'Unable to process response. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transform the AI response into our PlaybookStep format
    const typedData = playbookData as AIPlaybookResponse;
    const steps: PlaybookStep[] = typedData.steps.map((step: AIPlaybookStep, index: number) => ({
      id: crypto.randomUUID(),
      title: step.title,
      description: step.description,
      estimatedMinutes: step.estimatedMinutes || 15,
      completed: false,
      order: index,
      tips: step.tips || [],
    }));

    console.log('Generated playbook with', steps.length, 'steps');

    // Record this stuck session (only for non-premium users)
    if (!isPremium) {
      const { error: insertError } = await supabase.from('stuck_sessions').insert({
        user_id: user.id,
        session_date: new Date().toISOString()
      });
      
      if (insertError) {
        console.error('Error recording stuck session:', insertError);
      }
    }

    return new Response(
      JSON.stringify({
        title: playbookData.title || goal,
        steps,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-playbook function:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
