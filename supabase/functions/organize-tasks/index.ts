import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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
      console.error('Authentication error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Validate input
    const requestSchema = z.object({
      tasks: z.array(z.any()).max(1000),
      timeBlocks: z.array(z.any()).max(500),
      preferences: z.object({}).passthrough().optional(),
      today: z.string()
    });

    const body = await req.json();
    const validation = requestSchema.safeParse(body);
    
    if (!validation.success) {
      console.error('Validation error:', validation.error.errors);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request format. Please check your input and try again.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { tasks, timeBlocks, preferences, today } = validation.data;

    console.log('Organizing tasks:', { taskCount: tasks.length, blockCount: timeBlocks.length });

    // Fetch existing schedule entries for the next 7 days to avoid conflicts
    const todayDate = new Date(today);
    const nextWeek = new Date(todayDate);
    nextWeek.setDate(todayDate.getDate() + 7);

    const { data: scheduleEntries, error: scheduleError } = await supabase
      .from('schedule_entries')
      .select('*')
      .eq('user_id', user.id)
      .gte('start_time', todayDate.toISOString())
      .lte('start_time', nextWeek.toISOString())
      .order('start_time');

    if (scheduleError) {
      console.error('Error fetching schedule entries:', scheduleError);
    }

    const busyBlocks = scheduleEntries || [];
    console.log(`Found ${busyBlocks.length} existing schedule entries to avoid`);

    const systemPrompt = `You are an expert AI productivity coach specializing in life planning and task prioritization. You use a sophisticated Priority Score system based on a 3x3 matrix.

## The 3x3 Priority Matrix

**IMPORTANCE:**
- 🎯 CRITICAL: Major life goals, severe consequences if incomplete (certifications, rent, critical health)
- 🔧 NECESSARY: Daily life maintenance, prevents future problems (groceries, routine work, check-ups)
- ✨ OPTIONAL: Quality-of-life improvements, low impact if postponed (organizing, hobbies, entertainment)

**URGENCY:**
- 🔥 IMMEDIATE: Due within 24 hours
- ⏳ SHORT-TERM: Due within 7 days
- 🗓️ LONG-TERM: Due in 7+ days or no deadline

## Priority Score Formula

**Priority Score = (Importance Weight) + (Urgency Weight) - (Procrastination Penalty)**

1. **Importance Weight:**
   - CRITICAL tasks (especially in neglected life domains): Very High
   - NECESSARY tasks: Moderate
   - OPTIONAL tasks: Low

2. **Urgency Weight:**
   - Exponentially increases as deadline approaches
   - Tomorrow's deadline >> next week's deadline

3. **Procrastination Penalty:**
   - Small value for tasks lingering incomplete for extended periods
   - Ensures old tasks eventually surface

## Scheduling Principles

1. **Energy Matching:**
   - High Energy: Critical projects requiring deep focus
   - Medium Energy: Necessary tasks and routine work
   - Low Energy: Optional tasks, light admin, self-care

2. **Domain Balance:**
   - Track task completion across: Work, Health, Family, Self-Care, Household, Social, Personal Growth
   - Flag imbalances (e.g., 90% Work for 2 weeks → nudge toward Self-Care)

3. **Realistic Scheduling:**
   - Match task energy requirements to available time blocks
   - Include buffer time between tasks
   - Respect work-life boundaries

4. **Motivational Focus:**
   - Prioritize 3-5 truly impactful tasks per day (the "Focus List")
   - Break overwhelming tasks into manageable steps
   - Celebrate progress on long-procrastinated items

Always provide clear reasoning for prioritization decisions to help users understand the logic.`;

    const userPrompt = `Current date: ${today}

Tasks to organize:
${JSON.stringify(tasks, null, 2)}

Available time blocks:
${JSON.stringify(timeBlocks, null, 2)}

User preferences:
${JSON.stringify(preferences, null, 2)}

IMPORTANT - Existing schedule commitments (DO NOT schedule tasks during these times):
${JSON.stringify(busyBlocks.map(b => ({
  title: b.title,
  start: b.start_time,
  end: b.end_time,
  category: b.category,
  location: b.location
})), null, 2)}

Analyze using the Priority Score system:
1. Calculate implicit importance (CRITICAL/NECESSARY/OPTIONAL) and urgency (IMMEDIATE/SHORT-TERM/LONG-TERM) for each task
2. Create a prioritized Focus List of 3-5 top tasks based on Priority Scores
3. Schedule tasks into time blocks matching energy requirements, AVOIDING all existing schedule commitments
4. Provide insights on domain balance and any neglected life areas

Be specific with task IDs and block IDs from the provided data. Include reasoning for why certain tasks scored higher.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'organize_tasks',
              description: 'Organize tasks with priorities and schedule',
              parameters: {
                type: 'object',
                properties: {
                  priorities: {
                    type: 'array',
                    description: 'Task IDs in priority order (most important first)',
                    items: { type: 'string' }
                  },
                  schedule: {
                    type: 'array',
                    description: 'Scheduled tasks for today',
                    items: {
                      type: 'object',
                      properties: {
                        taskId: { type: 'string' },
                        blockId: { type: 'string' },
                        estimatedMinutes: { type: 'number' },
                        order: { type: 'number', description: 'Order within the block' },
                        reason: { type: 'string', description: 'Brief reason for this placement' }
                      },
                      required: ['taskId', 'blockId']
                    }
                  },
                  tips: {
                    type: 'array',
                    description: 'Brief productivity tips for the user',
                    items: { type: 'string' }
                  }
                },
                required: ['priorities', 'schedule']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'organize_tasks' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data, null, 2));

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'organize_tasks') {
      throw new Error('Invalid AI response format');
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in organize-tasks function:', error);
    return new Response(JSON.stringify({ 
      error: 'An unexpected error occurred. Please try again.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
