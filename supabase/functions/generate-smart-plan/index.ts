import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing bearer token', plan: [] }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.split(' ')[1];
    // Decode the already-verified JWT to get the user id
    let userId: string | null = null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1] || ''));
      userId = payload?.sub || payload?.user_id || null;
    } catch (e) {
      console.error('Failed to decode JWT payload', e);
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', plan: [] }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Keep a compatible shape for downstream code
    const user = { id: userId } as const;

    console.log('Generating life plan for user:', user.id);

    // Fetch all busy schedule entries (work, class, appointments, existing scheduled tasks)
    const { data: busyBlocks, error: busyError } = await supabase
      .from('schedule_entries')
      .select('*')
      .eq('user_id', user.id)
      .gte('start_time', new Date().toISOString())
      .lte('start_time', new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()) // Next 2 weeks
      .order('start_time', { ascending: true });

    if (busyError) throw busyError;

    // Fetch pending tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending');

    if (tasksError) throw tasksError;

    if (!tasks || tasks.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No tasks to schedule', plan: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch user preferences
    const { data: prefs } = await supabase
      .from('schedule_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const preferences = prefs || {
      preferred_study_start: '09:00:00',
      preferred_study_end: '22:00:00',
      min_session_length: 30,
      max_session_length: 180,
      buffer_minutes: 15,
      max_daily_study_hours: 8, // Increased for general life tasks
    };

    // Use AI to generate optimal schedule
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are an intelligent life scheduler and executive function coach. Given a user's busy schedule (work, classes, appointments) and all their pending tasks (homework, errands, cleaning, etc.), create an optimal life schedule.

CRITICAL RULES:
1. Find FREE TIME by analyzing all busy blocks (work, class, appointments)
2. Schedule tasks ONLY in free time gaps
3. Respect user preferences for working hours
4. Add buffer time between activities
5. Consider task difficulty, urgency, and due dates
6. Don't schedule during late night if avoid_late_night is true
7. Break large tasks into manageable sessions
8. Estimate time for tasks without estimates based on task name/type
9. Never overlap with existing busy blocks
10. Prioritize urgent/due-soon tasks first
11. Balance different task types throughout the week
12. Consider user's executive function needs - don't overload any single day

TASK TYPES & TIME ESTIMATES:
- Homework/studying: 1-3 hours depending on complexity
- Cleaning house: 1-2 hours
- Errands (shopping, appointments): 30min-1 hour each
- Doctor appointments: schedule 1 hour (includes travel/waiting)
- Personal tasks: estimate based on description

Return a JSON array of scheduled tasks:
{
  "scheduledTasks": [
    {
      "taskId": "uuid",
      "taskName": "Task name",
      "startTime": "ISO datetime",
      "endTime": "ISO datetime",
      "estimatedMinutes": number,
      "reason": "Why scheduled at this time"
    }
  ]
}`
          },
          {
            role: 'user',
            content: `Schedule these tasks optimally across my life:

BUSY SCHEDULE (DO NOT overlap with these):
${JSON.stringify(busyBlocks || [], null, 2)}

ALL TASKS TO SCHEDULE (homework, cleaning, errands, appointments, etc.):
${JSON.stringify(tasks.map(t => ({
  id: t.id,
  name: t.name,
  estimated_minutes: t.estimated_minutes,
  due_date: t.due_date,
  type: t.type,
})), null, 2)}

USER PREFERENCES:
${JSON.stringify(preferences, null, 2)}

Current date/time: ${new Date().toISOString()}

Generate an optimal 2-week life schedule that accounts for ALL my commitments and tasks. If I say "I need to clean the house," find time for it. If homework is due, prioritize it. Balance everything intelligently.`
          }
        ],
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please wait and try again.', plan: [] }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.', plan: [] }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI planning failed: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    let parsedPlan;
    try {
      const parsed = typeof content === 'string' ? JSON.parse(content) : content;
      parsedPlan = parsed.scheduledTasks || [];
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      throw new Error('AI returned invalid response format');
    }

    // Delete existing AI-generated homework schedule entries
    await supabase
      .from('schedule_entries')
      .delete()
      .eq('user_id', user.id)
      .eq('source', 'ai_homework')
      .gte('start_time', new Date().toISOString());

    // Insert new schedule entries
    if (parsedPlan.length > 0) {
      const scheduleEntries = parsedPlan.map((item: any) => ({
        user_id: user.id,
        title: item.taskName,
        description: item.reason || null,
        start_time: item.startTime,
        end_time: item.endTime,
        category: 'homework',
        source: 'ai_homework',
      }));

      const { error: insertError } = await supabase
        .from('schedule_entries')
        .insert(scheduleEntries);

      if (insertError) {
        console.error('Error inserting schedule entries:', insertError);
        throw insertError;
      }
    }

    console.log(`Successfully scheduled ${parsedPlan.length} life tasks`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        plan: parsedPlan,
        message: `Successfully scheduled ${parsedPlan.length} tasks across your week`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating smart plan:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to generate plan',
        plan: []
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
