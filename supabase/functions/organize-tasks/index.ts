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

    // Rate limiting: 10 requests per hour for AI organization (non-blocking)
    let isRateLimited = false;
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count: rateLimitCount, error: rateLimitError } = await supabase
        .from('rate_limits')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('action', 'organize_tasks')
        .gte('created_at', oneHourAgo);

      if (!rateLimitError && (rateLimitCount || 0) >= 10) {
        isRateLimited = true;
      }
      
      // Record this request for rate limiting (best effort)
      if (!rateLimitError && !isRateLimited) {
        try {
          await supabase.from('rate_limits').insert({ user_id: user.id, action: 'organize_tasks' });
        } catch { /* ignore */ }
      }
    } catch (e) {
      // If rate_limits table doesn't exist, skip rate limiting
      console.log('Rate limiting skipped (table may not exist):', e);
    }

    if (isRateLimited) {
      console.log('Rate limit exceeded for user:', user.id);
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded. Please wait before organizing more tasks (max 10 per hour).'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }


    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Validate input with proper schemas
    const taskSchema = z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(500),
      due_date: z.string().nullish(),
      estimated_minutes: z.number().int().min(0).max(1440).nullish(),
      type: z.string().max(50).nullish(),
      status: z.string().nullish(),
      user_id: z.string().uuid().nullish()
    });

    const availabilitySchema = z.object({
      day_of_week: z.number().int().min(0).max(6),
      start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
      end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
      id: z.string().uuid().nullish(),
      user_id: z.string().uuid().nullish(),
      created_at: z.string().nullish()
    });

    const requestSchema = z.object({
      tasks: z.array(taskSchema),
      availability: z.array(availabilitySchema),
      today: z.string() // Accept any ISO-like date string
    });

    const body = await req.json();
    const validation = requestSchema.safeParse(body);
    
    if (!validation.success) {
      console.error('Validation error:', validation.error.errors);
      const errorMessage = validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return new Response(
        JSON.stringify({ 
          error: `Invalid request format: ${errorMessage}`
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { tasks, availability, today } = validation.data;

    // Early return if no tasks to organize
    if (tasks.length === 0) {
      return new Response(JSON.stringify({
        priorities: [],
        schedule: [],
        tips: ['Add some tasks first, then use AI to organize them!']
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Organizing tasks:', { taskCount: tasks.length, availabilityCount: availability.length });

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

    const systemPrompt = `You are an expert AI scheduling assistant with deep reasoning capabilities. Today's date is ${today}. Use this date as your reference point for all planning.

## Your Task:
Create a realistic, step-by-step study/work plan for the user. You MUST:
1. Break down large tasks into manageable chunks
2. Schedule them into the user's available free time (gaps in their fixed schedule)
3. Consider task urgency (due dates) and estimated time requirements
4. Provide clear reasoning for your scheduling decisions

## Constraints:
- Respect the user's fixed schedule blocks (work/class times from availability table)
- Do NOT schedule during their committed times
- Use realistic time estimates
- Prioritize tasks with approaching deadlines
- Balance workload across available time slots`;

    const userPrompt = `Context: You are an expert scheduling assistant. You MUST use deep reasoning. Today's date is ${today}.

Task: Create a realistic, step-by-step study plan for the user. You must break down large tasks and schedule them into the user's available free time.

## User's Fixed Schedule (from availability table):
${JSON.stringify(availability.map(a => ({
  day: a.day_of_week,
  start: a.start_time,
  end: a.end_time
})), null, 2)}

## User's Task List (from tasks table):
${JSON.stringify(tasks.map(t => ({
  id: t.id,
  name: t.name,
  due_date: t.due_date,
  estimated_minutes: t.estimated_minutes,
  type: t.type
})), null, 2)}

## Existing Schedule Commitments (DO NOT schedule during these times):
${JSON.stringify(busyBlocks.map(b => ({
  title: b.title,
  start: b.start_time,
  end: b.end_time,
  category: b.category
})), null, 2)}

Instructions:
1. Prioritize tasks based on due dates and importance
2. Find free time slots by identifying gaps in the fixed schedule
3. Schedule high-priority tasks in the available slots
4. Break large tasks into smaller work sessions if needed
5. Provide clear reasoning for each scheduling decision`;

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
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }), {
          status: 200,
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

  } catch (error: unknown) {
    console.error('Error in organize-tasks function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
    return new Response(JSON.stringify({ 
      error: errorMessage
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
