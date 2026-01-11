import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const playbookSchema = z.object({
  goal: z.string().trim().min(1, "Goal is required").max(500, "Goal must be less than 500 characters"),
  details: z.string().trim().max(2000, "Details must be less than 2000 characters").optional(),
  // Accept all categories: room-based, activity-based, and original categories
  category: z.enum([
    // Room-based categories
    'Bathroom', 'Bedroom', 'Kitchen', 'Living Room', 'Office', 'Entrance & Dining', 'Vehicle', 'Whole Home',
    // Activity-based categories  
    'Cleaning', 'Cooking', 'Learning', 'Self-Care', 'Creative', 'Work', 'Health', 'Social', 'Other'
  ]).optional(),
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
  console.log('=== generate-playbook function called ===');
  console.log('Method:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting request processing...');
    
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('No auth header provided');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Auth header present, creating Supabase client...');
    
    // Extract the JWT token from the Authorization header
    const token = authHeader.replace('Bearer ', '');
    
    // Use service role key for admin operations, but validate with the user's token
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    console.log('Getting user from token...');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.log('Auth error:', authError?.message);
      return new Response(JSON.stringify({ error: 'Unauthorized', details: authError?.message }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log('User authenticated:', user.id.substring(0, 8) + '...');

    // Check premium status (wrapped in try-catch to prevent failures)
    let isPremium = false;
    try {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      isPremium = roles?.some(r => ['premium', 'lifetime', 'admin'].includes(r.role)) ?? false;
      console.log('Premium status:', isPremium);
    } catch (roleError) {
      console.log('Error checking premium (continuing anyway):', roleError);
    }

    // Skip quota check for premium users, and make it non-blocking for free users
    if (!isPremium) {
      try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data: sessions } = await supabase
          .from('stuck_sessions')
          .select('id')
          .eq('user_id', user.id)
          .gte('created_at', startOfMonth.toISOString());

        const sessionCount = sessions?.length || 0;
        console.log('Stuck sessions this month:', sessionCount);
        
        if (sessionCount >= 5) { // Increased limit slightly
          return new Response(JSON.stringify({ 
            error: 'You\'ve reached your free tier limit. Upgrade to premium for unlimited access.',
            quota: { used: sessionCount, limit: 5 }
          }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (quotaError) {
        // Don't block on quota check errors - just log and continue
        console.log('Error checking quota (continuing anyway):', quotaError);
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
    console.log('Parsing request body...');
    let body;
    try {
      body = await req.json();
      console.log('Request body parsed:', { goal: body.goal?.substring(0, 50), category: body.category });
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const validation = playbookSchema.safeParse(body);
    
    if (!validation.success) {
      // Type guard: validation.success is false, so validation is SafeParseError
      const parseError = validation as { success: false; error: { issues: unknown[] } };
      console.log('Validation failed:', parseError.error.issues);
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: parseError.error.issues }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { goal, details, category } = validation.data;
    console.log('Input validated. Goal:', goal.substring(0, 50));

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured in environment');
      return new Response(
        JSON.stringify({ error: 'AI service not configured. Please contact support.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('API key present, length:', LOVABLE_API_KEY.length);

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

    // Try the primary model first, fall back to alternative if needed
    const models = ['google/gemini-2.0-flash', 'google/gemini-2.5-pro'];
    let lastError: string | null = null;
    let successResponse: Response | null = null;

    for (const model of models) {
      console.log(`Trying model: ${model}`);
      
      try {
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
          }),
        });

        if (response.ok) {
          successResponse = response;
          console.log(`Successfully got response from model: ${model}`);
          break;
        }

        const errorText = await response.text();
        console.error(`Model ${model} failed:`, response.status, errorText);
        lastError = `${response.status}: ${errorText}`;
        
        // Don't retry for certain error types
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: 'AI credits exhausted. Please contact support.' }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (response.status === 401) {
          console.error('API key authentication failed');
          return new Response(
            JSON.stringify({ error: 'AI service configuration error. Please contact support.' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (fetchError) {
        console.error(`Network error with model ${model}:`, fetchError);
        lastError = fetchError instanceof Error ? fetchError.message : 'Network error';
      }
    }

    if (!successResponse) {
      console.error('All models failed. Last error:', lastError);
      return new Response(
        JSON.stringify({ error: 'AI service temporarily unavailable. Please try again later.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = successResponse;

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
